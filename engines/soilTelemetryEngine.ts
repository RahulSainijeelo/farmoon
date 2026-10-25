import type { EngineModule } from "@/core/types/pipeline";
import { confidenceFor, makeResult, makeZones, numeric, statusFor } from "./shared";

const manifest: EngineModule["manifest"] = {
  id: "soil-telemetry",
  label: "Soil telemetry",
  shortLabel: "Soil",
  description: "Normalize LoRa readings and flag root-zone conditions.",
  iconName: "soil",
  stage1Config: {
    acceptedPayloads: ["LORA_JSON", "CSV_TELEMETRY"],
    fileExtensions: [".json", ".csv"],
    streamProtocol: "WEB_SERIAL",
    requiredMetadataFields: [{ key: "plotId", label: "Plot ID", type: "text" }],
  },
  stage3Config: { outputsGeoMap: true, supportedActuators: ["IRRIGATION_VALVE", "SMS_ADVISORY"] },
};

export const soilTelemetryEngine: EngineModule = {
  manifest,
  process(input) {
    const zones = makeZones(input, "Soil moisture", "%", (packet) => numeric(packet, "soilMoisture", "moisture", "moisture15cm"), (value) => statusFor(value, 40, 22));
    const dry = zones.filter((zone) => zone.status !== "NORMAL");
    const actions = dry.slice(0, 6).map((zone) => ({
      actionId: `soil-${zone.zoneId}-${input.timestamp}`,
      title: `Irrigate ${zone.zoneId}`,
      actuatorType: "IRRIGATION_VALVE" as const,
      targetZoneId: zone.zoneId,
      commandPayload: { durationMinutes: Math.max(8, Math.round((40 - Number(zone.metricValue)) * 1.8)), targetZoneId: zone.zoneId },
      requiresSafetyChecklist: false,
    }));
    return makeResult(input, {
      summary: zones.length ? `${dry.length} of ${zones.length} zones below moisture target.` : "No soil readings found in this payload.",
      zones,
      recommendedActions: actions,
      confidenceScore: confidenceFor(input, zones.length),
    });
  },
};
