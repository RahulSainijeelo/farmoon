export type HardwarePayloadType =
  | "RGB_IMAGE"
  | "THERMAL_TIFF"
  | "MULTISPECTRAL_TIFF"
  | "LORA_JSON"
  | "CSV_TELEMETRY"
  | "GEOJSON_BOUNDARY";

export type EngineIconName = "sky" | "soil" | "ingest" | "engine" | "action" | "verify" | "alert";
export type ZoneStatus = "NORMAL" | "WARN" | "DANGER";
export type ActuatorType = "DRONE_SPRAY" | "IRRIGATION_VALVE" | "GROUND_ROVER" | "SMS_ADVISORY";

export interface FeatureManifest {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  iconName: EngineIconName;
  stage1Config: {
    acceptedPayloads: HardwarePayloadType[];
    fileExtensions: string[];
    streamProtocol?: "WEB_SERIAL" | "MQTT" | "HTTP_POLL";
    requiredMetadataFields: { key: string; label: string; type: "number" | "text" }[];
  };
  stage3Config: {
    outputsGeoMap: boolean;
    supportedActuators: ActuatorType[];
  };
}

export type TelemetryValue = string | number | boolean | null;
export type JsonValue = TelemetryValue | JsonValue[] | { [key: string]: JsonValue };
export type TelemetryPacket = Record<string, TelemetryValue>;

export interface FileDescriptor {
  name: string;
  type: string;
  size: number;
  lastModified?: number;
  payloadType: HardwarePayloadType;
  gps?: { latitude: number; longitude: number };
  capturedAt?: string;
  parsedRows?: number;
  note?: string;
}

export interface Stage1Payload {
  engineId: string;
  timestamp: number;
  plotId: string;
  telemetryPackets: TelemetryPacket[];
  rawFiles: FileDescriptor[];
  metadata: Record<string, TelemetryValue>;
}

export interface Stage2Zone {
  zoneId: string;
  polygon: [number, number][];
  status: ZoneStatus;
  metricLabel: string;
  metricValue: number | string;
  unit: string;
  confidence: number;
}

export interface RecommendedAction {
  actionId: string;
  title: string;
  actuatorType: ActuatorType;
  targetZoneId: string;
  commandPayload: Record<string, JsonValue>;
  requiresSafetyChecklist: boolean;
}

export interface Stage2Result {
  jobId: string;
  engineId: string;
  createdAt: number;
  confidenceScore: number;
  requiresHumanApproval: boolean;
  summary: string;
  zones: Stage2Zone[];
  recommendedActions: RecommendedAction[];
  simulation: true;
}

export type SafetyChecklist = {
  windVerified: boolean;
  doseVerified: boolean;
  ppeVerified: boolean;
  killSwitchVerified: boolean;
};

export type ActionStatus = "PENDING" | "CANCELLED" | "AWAITING_VERIFICATION" | "VERIFIED";

export interface ActionRecord {
  id: string;
  jobId: string;
  engineId: string;
  plotId: string;
  title: string;
  actuatorType: ActuatorType;
  targetZoneId: string;
  commandPayload: Record<string, JsonValue>;
  status: ActionStatus;
  requiresSafetyChecklist: boolean;
  baselineValue?: number;
  metricLabel?: string;
  unit?: string;
  safetyChecklist?: SafetyChecklist;
  updatedAt: number;
}

export interface VerificationRecord {
  id: string;
  jobId: string;
  actionId: string;
  targetZoneId: string;
  status: "RESOLVED" | "PERSISTING";
  metricLabel: string;
  beforeValue: number;
  afterValue: number;
  unit: string;
  createdAt: number;
}

export interface EngineModule {
  manifest: FeatureManifest;
  process: (input: Stage1Payload) => Stage2Result;
}
