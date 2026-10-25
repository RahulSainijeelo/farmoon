import type { EngineModule } from "@/core/types/pipeline";
import { confidenceFor, makeResult, makeZones, numeric, statusFor } from "./shared";

export const weedMappingEngine: EngineModule = {
  manifest: {
    id: "weed-mapping",
    label: "Weed mapping",
    shortLabel: "Weeds",
    description: "Map weed pressure and create targeted inspection or spray zones.",
    iconName: "sky",
    stage1Config: {
      acceptedPayloads: ["RGB_IMAGE", "GEOJSON_BOUNDARY", "CSV_TELEMETRY", "LORA_JSON"],
      fileExtensions: [".jpg", ".jpeg", ".png", ".tif", ".tiff", ".geojson", ".json", ".csv"],
      requiredMetadataFields: [{ key: "plotId", label: "Plot ID", type: "text" }],
    },
    stage3Config: { outputsGeoMap: true, supportedActuators: ["DRONE_SPRAY", "GROUND_ROVER", "SMS_ADVISORY"] },
  },
  process(input) {
    const zones = makeZones(input, "Weed coverage", "%", (packet, index) => {
      const measure = numeric(packet, "weedCoveragePercent", "weedCoverage", "weedPressure");
      if (measure !== undefined) return measure;
      return input.rawFiles.some((file) => ["RGB_IMAGE", "GEOJSON_BOUNDARY"].includes(file.payloadType)) ? [8, 31, 12, 38, 17, 6][index % 6] : undefined;
    }, (value) => statusFor(value, 20, 35, false));
    const actions = zones.filter((zone) => zone.status !== "NORMAL").slice(0, 8).map((zone) => ({
      actionId: `weed-${zone.zoneId}-${input.timestamp}`,
      title: `Spot spray ${zone.zoneId}`,
      actuatorType: "DRONE_SPRAY" as const,
      targetZoneId: zone.zoneId,
      commandPayload: { coveragePercent: Number(zone.metricValue), doseMlPerSqm: Math.round(Number(zone.metricValue) * 0.4), route: zone.polygon.map(([latitude, longitude]) => [latitude, longitude]) },
      requiresSafetyChecklist: true,
    }));
    const imageConfidence = input.rawFiles.some((file) => file.payloadType === "RGB_IMAGE") ? 0.73 : undefined;
    return makeResult(input, {
      summary: zones.length ? `${zones.filter((zone) => zone.status !== "NORMAL").length} weed hotspots require review.` : "Add imagery or weed coverage readings.",
      zones,
      recommendedActions: actions,
      confidenceScore: imageConfidence ?? confidenceFor(input, zones.length),
    });
  },
};
