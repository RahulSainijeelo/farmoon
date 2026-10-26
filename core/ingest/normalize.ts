import { getEngine } from "@/core/registry/engineRegistry";
import type { FileDescriptor, HardwarePayloadType, Stage1Payload, TelemetryPacket, TelemetryValue } from "@/core/types/pipeline";
import { readJpegExif } from "./exif";

export class IngestError extends Error {
  constructor(message: string, readonly code: string) {
    super(message);
    this.name = "IngestError";
  }
}

function normalizeKey(value: string): string {
  const key = value.trim().replace(/[\s_-]+([a-zA-Z0-9])/g, (_, char: string) => char.toUpperCase());
  const lower = key.toLowerCase();
  const aliases: Record<string, string> = {
    nodeid: "nodeId", zone: "zoneId", zoneid: "zoneId", soilmoisture: "soilMoisture", moisture: "soilMoisture",
    moisture15cm: "soilMoisture", soilmoisture15cm: "soilMoisture", moisture45cm: "soilMoisture45", temperature: "tempC", temperaturec: "tempC",
    tempc: "tempC", humiditypercent: "humidity", humiditypct: "humidity", relativehumidity: "humidity",
    ph: "pH", phvalue: "pH", disease: "diseaseRisk", diseaseriskpercent: "diseaseRisk", weedcoverage: "weedCoveragePercent",
    weedpressure: "weedCoveragePercent",
    solarradiation: "solarRadiation", radiation: "solarRadiation", lux: "solarRadiation", sunlight: "solarRadiation", solarrad: "solarRadiation",
    rainfall: "rainfall", rain: "rainfall", precipitation: "rainfall",
  };
  return aliases[lower] ?? key;
}

function normalizePacket(packet: TelemetryPacket): TelemetryPacket {
  return Object.fromEntries(Object.entries(packet).map(([key, value]) => [normalizeKey(key), value]));
}

function valueOf(raw: string): TelemetryValue {
  const value = raw.trim();
  if (!value) return null;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  const number = Number(value);
  return Number.isFinite(number) ? number : value;
}

function parseCsv(source: string): TelemetryPacket[] {
  const lines = source.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new IngestError("CSV requires a header and data row.", "CSV_EMPTY");
  const split = (line: string) => {
    const cells: string[] = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"' && quoted) { value += '"'; index += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === "," && !quoted) { cells.push(value); value = ""; }
      else value += char;
    }
    cells.push(value);
    return cells;
  };
  const headers = split(lines[0]).map(normalizeKey);
  if (!headers.some((header) => ["nodeId", "zoneId", "soilMoisture", "tempC", "humidity", "pH", "diseaseRisk", "weedCoveragePercent", "solarRadiation", "rainfall"].includes(header))) {
    throw new IngestError("CSV headers contain no recognized telemetry fields.", "CSV_HEADERS");
  }
  return lines.slice(1).map((line, rowIndex) => {
    const cells = split(line);
    const packet: TelemetryPacket = {};
    headers.forEach((header, index) => { if (header && cells[index] !== undefined) packet[header] = valueOf(cells[index]); });
    const hasMeasurement = Object.entries(packet).some(([key, value]) => key !== "nodeId" && key !== "zoneId" && typeof value === "number");
    if (!hasMeasurement) throw new IngestError(`CSV row ${rowIndex + 2} has no numeric reading.`, "CSV_ROW");
    return packet;
  });
}

function classifyFile(file: File): HardwarePayloadType {
  const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
  if ([".jpg", ".jpeg", ".png"].includes(extension)) return "RGB_IMAGE";
  if ([".tif", ".tiff"].includes(extension)) return /multi|msi|ndvi/i.test(file.name) ? "MULTISPECTRAL_TIFF" : "THERMAL_TIFF";
  if (extension === ".csv") return "CSV_TELEMETRY";
  if (extension === ".geojson") return "GEOJSON_BOUNDARY";
  if (extension === ".json") return "LORA_JSON";
  throw new IngestError(`Unsupported file type: ${extension || "unknown"}.`, "FILE_TYPE");
}

function packetsFromJson(value: unknown): TelemetryPacket[] {
  if (Array.isArray(value)) return value.filter((row): row is TelemetryPacket => Boolean(row) && typeof row === "object" && !Array.isArray(row)).map(normalizePacket);
  if (!value || typeof value !== "object") return [];
  const obj = value as Record<string, unknown>;
  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
    return obj.features.flatMap((feature) => {
      if (!feature || typeof feature !== "object") return [];
      const properties = (feature as { properties?: unknown }).properties;
      if (!properties || typeof properties !== "object" || Array.isArray(properties)) return [];
      return [normalizePacket(properties as TelemetryPacket)];
    });
  }
  const collection = obj.telemetryPackets ?? obj.readings ?? obj.records;
  if (Array.isArray(collection)) return collection.filter((row): row is TelemetryPacket => Boolean(row) && typeof row === "object" && !Array.isArray(row)).map(normalizePacket);
  if (Object.keys(obj).length) return [normalizePacket(obj as TelemetryPacket)];
  return [];
}

export async function normalizeIngest(args: {
  engineId: string;
  plotId: string;
  metadata?: Record<string, TelemetryValue>;
  telemetryPackets?: TelemetryPacket[];
  files?: File[];
}): Promise<Stage1Payload> {
  const engine = getEngine(args.engineId);
  if (!engine) throw new IngestError("Selected engine was not found.", "ENGINE_NOT_FOUND");
  const plotId = args.plotId.trim();
  if (!plotId) throw new IngestError("Plot ID is required.", "PLOT_REQUIRED");
  const metadata: Record<string, TelemetryValue> = { ...(args.metadata ?? {}), plotId };
  for (const field of engine.manifest.stage1Config.requiredMetadataFields) {
    const value = metadata[field.key];
    if (value === undefined || value === null || String(value).trim() === "") {
      throw new IngestError(`${field.label} is required.`, "METADATA_REQUIRED");
    }
    if (field.type === "number" && !Number.isFinite(Number(value))) {
      throw new IngestError(`${field.label} must be numeric.`, "METADATA_INVALID");
    }
  }

  const packets: TelemetryPacket[] = (args.telemetryPackets ?? []).map(normalizePacket);
  const descriptors: FileDescriptor[] = [];
  for (const file of args.files ?? []) {
    const payloadType = classifyFile(file);
    const extension = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
    if (!engine.manifest.stage1Config.fileExtensions.includes(extension)) {
      throw new IngestError(`${extension} is not accepted by ${engine.manifest.label}.`, "FILE_NOT_ACCEPTED");
    }
    const descriptor: FileDescriptor = { name: file.name, type: file.type || "application/octet-stream", size: file.size, lastModified: file.lastModified, payloadType };
    if (payloadType === "CSV_TELEMETRY") {
      const parsed = parseCsv(await file.text());
      packets.push(...parsed);
      descriptor.parsedRows = parsed.length;
    } else if (payloadType === "LORA_JSON" || payloadType === "GEOJSON_BOUNDARY") {
      let parsed: unknown;
      try { parsed = JSON.parse(await file.text()); }
      catch { throw new IngestError(`${file.name} contains invalid JSON.`, "JSON_INVALID"); }
      const extracted = packetsFromJson(parsed);
      if (extracted.length) packets.push(...extracted);
      else if (payloadType === "LORA_JSON") throw new IngestError(`${file.name} contains no telemetry records.`, "JSON_EMPTY");
      descriptor.parsedRows = extracted.length;
    } else if (payloadType === "RGB_IMAGE" && extension !== ".png") {
      const exif = readJpegExif(await file.arrayBuffer());
      if (exif.latitude !== undefined && exif.longitude !== undefined) descriptor.gps = { latitude: exif.latitude, longitude: exif.longitude };
      descriptor.capturedAt = exif.capturedAt;
    }
    if (["RGB_IMAGE", "THERMAL_TIFF", "MULTISPECTRAL_TIFF"].includes(payloadType) && !descriptor.gps) {
      const latitude = Number(metadata.latitude);
      const longitude = Number(metadata.longitude);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new IngestError(`${file.name} needs EXIF GPS or plot coordinates.`, "GEO_REQUIRED");
      }
      descriptor.gps = { latitude, longitude };
      descriptor.note = "Plot coordinates supplied manually";
    }
    descriptors.push(descriptor);
  }

  if (!packets.length && !descriptors.length) throw new IngestError("Add telemetry or a supported file.", "PAYLOAD_EMPTY");
  if (packets.some((packet) => !packet || typeof packet !== "object" || Array.isArray(packet))) {
    throw new IngestError("Telemetry packets must be JSON objects.", "PACKET_INVALID");
  }
  return { engineId: args.engineId, timestamp: Date.now(), plotId, telemetryPackets: packets, rawFiles: descriptors, metadata };
}
