import type { Stage1Payload, Stage2Result, Stage2Zone, TelemetryPacket, ZoneStatus } from "@/core/types/pipeline";

export function numeric(packet: TelemetryPacket, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = packet[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
}

export function text(packet: TelemetryPacket, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = packet[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

export function statusFor(value: number, warningAt: number, dangerAt: number, lowerIsRisk = true): ZoneStatus {
  if (lowerIsRisk) return value <= dangerAt ? "DANGER" : value <= warningAt ? "WARN" : "NORMAL";
  return value >= dangerAt ? "DANGER" : value >= warningAt ? "WARN" : "NORMAL";
}

export function zoneIdFor(packet: TelemetryPacket, index: number): string {
  const explicit = text(packet, "zoneId", "zone", "plotZone");
  if (explicit) return explicit.toUpperCase();
  const col = String.fromCharCode(65 + (index % 8));
  const row = Math.floor(index / 8) + 1;
  return `${col}${row}`;
}

export function zonePolygon(index: number, zoneId?: string): [number, number][] {
  const match = zoneId?.match(/^([A-H])([1-6])$/i);
  const row = match ? Number(match[2]) - 1 : Math.floor(index / 8);
  const col = match ? match[1].toUpperCase().charCodeAt(0) - 65 : index % 8;
  const south = 21.12 + (5 - row) * 0.00018;
  const west = 81.34 + col * 0.00018;
  const north = south + 0.00016;
  const east = west + 0.00016;
  return [[south, west], [south, east], [north, east], [north, west], [south, west]];
}

export function makeZones(
  input: Stage1Payload,
  metricLabel: string,
  unit: string,
  getMetric: (packet: TelemetryPacket, index: number) => number | undefined,
  classify: (value: number) => ZoneStatus,
): Stage2Zone[] {
  const hasAerialData = input.rawFiles.some((file) => ["RGB_IMAGE", "THERMAL_TIFF", "MULTISPECTRAL_TIFF"].includes(file.payloadType));
  const imageZoneIds = ["A1", "B2", "C4", "D3", "E5", "F3"];
  const packets = input.telemetryPackets.length
    ? input.telemetryPackets.slice(0, 48)
    : hasAerialData
      ? imageZoneIds.map((zoneId) => ({ zoneId }))
      : [];
  return packets.flatMap((packet, index) => {
    const value = getMetric(packet, index);
    if (value === undefined) return [];
    const zoneId = zoneIdFor(packet, index);
    return [{
      zoneId,
      polygon: zonePolygon(index, zoneId),
      status: classify(value),
      metricLabel,
      metricValue: Math.round(value * 10) / 10,
      unit,
      confidence: input.telemetryPackets.length ? 0.86 : 0.58,
    }];
  });
}

export function makeResult(
  input: Stage1Payload,
  data: Omit<Stage2Result, "jobId" | "engineId" | "createdAt" | "confidenceScore" | "requiresHumanApproval" | "simulation"> & { confidenceScore?: number; requiresHumanApproval?: boolean },
): Stage2Result {
  const confidenceScore = Math.max(0, Math.min(1, data.confidenceScore ?? 0.82));
  return {
    ...data,
    jobId: crypto.randomUUID(),
    engineId: input.engineId,
    createdAt: Date.now(),
    confidenceScore,
    requiresHumanApproval: data.requiresHumanApproval ?? (confidenceScore < 0.75 || data.recommendedActions.some((action) => action.requiresSafetyChecklist)),
    simulation: true,
  };
}

export function confidenceFor(input: Stage1Payload, validCount: number): number {
  if (input.telemetryPackets.length === 0) return input.rawFiles.length > 0 ? 0.58 : 0.25;
  return Math.min(0.96, 0.68 + 0.28 * (validCount / input.telemetryPackets.length));
}
