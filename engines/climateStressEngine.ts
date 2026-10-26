import cropsConfig from "@/config/crops.json";
import type { EngineModule, ZoneStatus } from "@/core/types/pipeline";
import { confidenceFor, makeResult, makeZones, numeric, statusFor } from "./shared";

export const climateStressEngine: EngineModule = {
  manifest: {
    id: "climate-stress",
    label: "Climate stress",
    shortLabel: "Climate",
    description: "Detect heat, sunlight radiation, and humidity canopy stress.",
    iconName: "sky",
    stage1Config: {
      acceptedPayloads: ["LORA_JSON", "CSV_TELEMETRY", "THERMAL_TIFF"],
      fileExtensions: [".json", ".csv", ".tif", ".tiff"],
      streamProtocol: "WEB_SERIAL",
      requiredMetadataFields: [
        { key: "plotId", label: "Plot ID", type: "text" },
      ],
    },
    stage3Config: { outputsGeoMap: true, supportedActuators: ["IRRIGATION_VALVE", "SMS_ADVISORY"] },
  },
  process(input) {
    const cropId = String(input.metadata.cropId ?? "demo_crop");
    const cropDef = cropsConfig.crops.find((c) => c.id === cropId);
    const tempDangerThreshold = cropDef?.tempMaxC ?? 37;
    const tempWarnThreshold = tempDangerThreshold - 5;
    const solarMax = cropDef?.solarRadiationMaxWm2 ?? 800;

    const zones = makeZones(
      input,
      "Canopy stress",
      "°C / W/m²",
      (packet) => {
        const temp = numeric(packet, "tempC", "temperatureC", "airTempC");
        return temp;
      },
      (temp) => statusFor(temp, tempWarnThreshold, tempDangerThreshold, false),
      (temp, initialStatus) => {
        // Find matching packet for solarRadiation
        return initialStatus === "DANGER" ? 0.85 : initialStatus === "WARN" ? 0.50 : 0.10;
      }
    );

    // Re-evaluate with solar radiation if present (6th parameter)
    const evaluatedZones = zones.map((zone) => {
      const packet = input.telemetryPackets.find((p) => String(p.zoneId ?? "").toUpperCase() === zone.zoneId) ?? {};
      const solar = numeric(packet, "solarRadiation", "radiation", "lux", "sunlight");
      const temp = Number(zone.metricValue);

      let status: ZoneStatus = zone.status;
      let severity = zone.severity ?? 0.1;

      // Sixth parameter logic: extreme heat + high radiation raises stress to DANGER
      if (solar !== undefined && solar > solarMax && temp >= 34) {
        status = "DANGER";
        severity = Math.max(severity, 0.88);
      } else if (solar !== undefined && solar > 700 && temp >= 31 && status === "NORMAL") {
        status = "WARN";
        severity = Math.max(severity, 0.45);
      } else if (solar !== undefined && solar < 150 && input.metadata.cropStage === "Flowering" && status === "NORMAL") {
        // Low light warning during flowering stage
        status = "WARN";
        severity = Math.max(severity, 0.40);
      }

      const displayMetric = solar !== undefined ? `${temp}°C · ${Math.round(solar)}W/m²` : `${temp}`;
      return {
        ...zone,
        status,
        severity,
        metricValue: displayMetric,
      };
    });

    const stressed = evaluatedZones.filter((zone) => zone.status !== "NORMAL");
    const actions = stressed.slice(0, 6).map((zone) => {
      const packet = input.telemetryPackets.find((p) => String(p.zoneId ?? "").toUpperCase() === zone.zoneId) ?? {};
      const solar = numeric(packet, "solarRadiation", "radiation", "lux", "sunlight");
      return {
        actionId: `climate-${zone.zoneId}-${input.timestamp}`,
        title: `Send ${zone.zoneId} advisory`,
        actuatorType: "SMS_ADVISORY" as const,
        targetZoneId: zone.zoneId,
        commandPayload: {
          temperatureC: numeric(packet, "tempC", "temperatureC") ?? 35,
          solarRadiationWm2: solar ?? 0,
          humidityPercent: numeric(packet, "humidity", "humidityPercent") ?? 0,
          message: `Zone ${zone.zoneId}: canopy stress detected (${zone.metricValue}). Check soil moisture before irrigation.`,
        },
        requiresSafetyChecklist: false,
      };
    });

    return makeResult(input, {
      summary: evaluatedZones.length
        ? `${stressed.length} zones show elevated canopy stress.`
        : "No climate readings found in this payload.",
      zones: evaluatedZones,
      recommendedActions: actions,
      confidenceScore: confidenceFor(input, evaluatedZones.length),
    });
  },
};
