import type { EngineModule } from "@/core/types/pipeline";
import { confidenceFor, makeResult, makeZones, numeric, statusFor } from "./shared";

export const climateStressEngine: EngineModule = {
  manifest: {
    id: "climate-stress",
    label: "Climate stress",
    shortLabel: "Climate",
    description: "Detect heat and humidity conditions affecting the canopy.",
    iconName: "sky",
    stage1Config: {
      acceptedPayloads: ["LORA_JSON", "CSV_TELEMETRY", "THERMAL_TIFF"],
      fileExtensions: [".json", ".csv", ".tif", ".tiff"],
      streamProtocol: "WEB_SERIAL",
      requiredMetadataFields: [{ key: "plotId", label: "Plot ID", type: "text" }],
    },
    stage3Config: { outputsGeoMap: true, supportedActuators: ["IRRIGATION_VALVE", "SMS_ADVISORY"] },
  },
  process(input) {
    const zones = makeZones(input, "Air temperature", "°C", (packet) => numeric(packet, "tempC", "temperatureC", "airTempC"), (value) => statusFor(value, 32, 37, false));
    const hot = zones.filter((zone) => zone.status !== "NORMAL");
    const actions = hot.slice(0, 6).map((zone) => ({
      actionId: `climate-${zone.zoneId}-${input.timestamp}`,
      title: `Send ${zone.zoneId} advisory`,
      actuatorType: "SMS_ADVISORY" as const,
      targetZoneId: zone.zoneId,
      commandPayload: {
        temperatureC: Number(zone.metricValue),
        humidityPercent: numeric(input.telemetryPackets.find((packet) => String(packet.zoneId ?? "").toUpperCase() === zone.zoneId) ?? {}, "humidity", "humidityPercent") ?? 0,
        message: `Zone ${zone.zoneId}: heat reached ${zone.metricValue} °C. Check soil moisture before irrigation.`,
      },
      requiresSafetyChecklist: false,
    }));
    return makeResult(input, {
      summary: zones.length ? `${hot.length} zones show elevated canopy heat.` : "No climate readings found in this payload.",
      zones,
      recommendedActions: actions,
      confidenceScore: confidenceFor(input, zones.length),
    });
  },
};
