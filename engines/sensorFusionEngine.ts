import type { EngineModule, TelemetryPacket } from "@/core/types/pipeline";
import { confidenceFor, makeResult, makeZones, numeric, statusFor } from "./shared";

function fusedRisk(packet: TelemetryPacket): number | undefined {
  const moisture = numeric(packet, "soilMoisture", "moisture", "moisture15cm");
  const heat = numeric(packet, "tempC", "temperatureC", "airTempC");
  const disease = numeric(packet, "diseaseRisk", "blightRisk");
  const weed = numeric(packet, "weedCoveragePercent", "weedPressure");
  const scores = [
    moisture === undefined ? undefined : Math.max(0, Math.min(100, (42 - moisture) * 2.1)),
    heat === undefined ? undefined : Math.max(0, Math.min(100, (heat - 27) * 5)),
    disease,
    weed === undefined ? undefined : Math.max(0, Math.min(100, weed * 1.3)),
  ].filter((value): value is number => value !== undefined);
  return scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : undefined;
}

export const sensorFusionEngine: EngineModule = {
  manifest: {
    id: "sensor-fusion",
    label: "Sensor fusion",
    shortLabel: "Fusion",
    description: "Combine ground telemetry and aerial indicators for review.",
    iconName: "engine",
    stage1Config: {
      acceptedPayloads: ["RGB_IMAGE", "THERMAL_TIFF", "MULTISPECTRAL_TIFF", "LORA_JSON", "CSV_TELEMETRY"],
      fileExtensions: [".jpg", ".jpeg", ".png", ".tif", ".tiff", ".json", ".csv"],
      streamProtocol: "WEB_SERIAL",
      requiredMetadataFields: [{ key: "plotId", label: "Plot ID", type: "text" }],
    },
    stage3Config: { outputsGeoMap: true, supportedActuators: ["GROUND_ROVER", "IRRIGATION_VALVE", "SMS_ADVISORY"] },
  },
  process(input) {
    const zones = makeZones(input, "Combined risk", "%", fusedRisk, (value) => statusFor(value, 38, 66, false));
    const actions = zones.filter((zone) => zone.status !== "NORMAL").slice(0, 8).map((zone) => ({
      actionId: `fusion-${zone.zoneId}-${input.timestamp}`,
      title: `Inspect ${zone.zoneId}`,
      actuatorType: "GROUND_ROVER" as const,
      targetZoneId: zone.zoneId,
      commandPayload: { combinedRiskPercent: Number(zone.metricValue), reviewRequired: true },
      requiresSafetyChecklist: false,
    }));
    return makeResult(input, {
      summary: zones.length ? `Combined ${input.telemetryPackets.length} telemetry packets.` : "Ground readings are required for fusion.",
      zones,
      recommendedActions: actions,
      confidenceScore: Math.max(0.3, confidenceFor(input, zones.length) - (input.rawFiles.length ? 0 : 0.08)),
    });
  },
};
