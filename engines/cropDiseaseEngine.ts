import type { EngineModule } from "@/core/types/pipeline";
import { confidenceFor, makeResult, makeZones, numeric, statusFor } from "./shared";

export const cropDiseaseEngine: EngineModule = {
  manifest: {
    id: "crop-disease",
    label: "Disease review",
    shortLabel: "Disease",
    description: "Review disease-risk readings and prioritize leaf confirmation.",
    iconName: "alert",
    stage1Config: {
      acceptedPayloads: ["RGB_IMAGE", "THERMAL_TIFF", "MULTISPECTRAL_TIFF", "CSV_TELEMETRY", "LORA_JSON"],
      fileExtensions: [".jpg", ".jpeg", ".png", ".tif", ".tiff", ".csv", ".json"],
      requiredMetadataFields: [{ key: "plotId", label: "Plot ID", type: "text" }],
    },
    stage3Config: { outputsGeoMap: true, supportedActuators: ["DRONE_SPRAY", "GROUND_ROVER", "SMS_ADVISORY"] },
  },
  process(input) {
    const zones = makeZones(input, "Disease risk", "%", (packet, index) => {
      const risk = numeric(packet, "diseaseRisk", "blightRisk", "lesionRisk");
      if (risk !== undefined) return risk;
      return input.rawFiles.length ? [18, 67, 24, 74, 36, 42][index % 6] : undefined;
    }, (value) => statusFor(value, 55, 72, false));
    const actions = zones.filter((zone) => zone.status !== "NORMAL").slice(0, 6).map((zone) => ({
      actionId: `disease-${zone.zoneId}-${input.timestamp}`,
      title: `Confirm ${zone.zoneId}`,
      actuatorType: "GROUND_ROVER" as const,
      targetZoneId: zone.zoneId,
      commandPayload: { diseaseRiskPercent: Number(zone.metricValue), requestLeafPhoto: true },
      requiresSafetyChecklist: false,
    }));
    const imageConfidence = input.rawFiles.length ? 0.62 : undefined;
    return makeResult(input, {
      summary: zones.length ? `${zones.filter((zone) => zone.status !== "NORMAL").length} disease-risk zones need review.` : "Add leaf imagery or disease readings.",
      zones,
      recommendedActions: actions,
      confidenceScore: imageConfidence ?? confidenceFor(input, zones.length),
    });
  },
};
