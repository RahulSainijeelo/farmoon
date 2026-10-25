import type { EngineModule } from "@/core/types/pipeline";
import { confidenceFor, makeResult, makeZones, numeric, statusFor } from "./shared";

export const waterNeedEngine: EngineModule = {
  manifest: {
    id: "water-need",
    label: "Water forecast",
    shortLabel: "Water",
    description: "Estimate irrigation demand from moisture deficit and crop stage.",
    iconName: "ingest",
    stage1Config: {
      acceptedPayloads: ["LORA_JSON", "CSV_TELEMETRY"],
      fileExtensions: [".json", ".csv"],
      streamProtocol: "WEB_SERIAL",
      requiredMetadataFields: [{ key: "plotId", label: "Plot ID", type: "text" }, { key: "cropStage", label: "Crop stage", type: "text" }],
    },
    stage3Config: { outputsGeoMap: true, supportedActuators: ["IRRIGATION_VALVE", "SMS_ADVISORY"] },
  },
  process(input) {
    const zones = makeZones(input, "Water need", "L / zone", (packet) => {
      const moisture = numeric(packet, "soilMoisture", "moisture", "moisture15cm");
      return moisture === undefined ? undefined : Math.max(0, (40 - moisture) * 2.2);
    }, (liters) => statusFor(liters, 8, 35, false));
    const actions = zones.filter((zone) => Number(zone.metricValue) >= 8).slice(0, 8).map((zone) => ({
      actionId: `water-${zone.zoneId}-${input.timestamp}`,
      title: `Pulse ${zone.zoneId}`,
      actuatorType: "IRRIGATION_VALVE" as const,
      targetZoneId: zone.zoneId,
      commandPayload: { estimatedLiters: Number(zone.metricValue), durationMinutes: Math.max(5, Math.round(Number(zone.metricValue) / 1.4)), cropStage: String(input.metadata.cropStage ?? "unspecified") },
      requiresSafetyChecklist: false,
    }));
    return makeResult(input, {
      summary: zones.length ? `Estimated demand across ${zones.length} zones.` : "Soil moisture is needed to estimate demand.",
      zones,
      recommendedActions: actions,
      confidenceScore: confidenceFor(input, zones.length),
    });
  },
};
