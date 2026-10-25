import type { EngineModule, FeatureManifest } from "@/core/types/pipeline";
import { soilTelemetryEngine } from "@/engines/soilTelemetryEngine";
import { waterNeedEngine } from "@/engines/waterNeedEngine";
import { weedMappingEngine } from "@/engines/weedMappingEngine";
import { cropDiseaseEngine } from "@/engines/cropDiseaseEngine";
import { climateStressEngine } from "@/engines/climateStressEngine";
import { sensorFusionEngine } from "@/engines/sensorFusionEngine";

const engines = new Map<string, EngineModule>();

export function registerEngine(engine: EngineModule): void {
  if (engines.has(engine.manifest.id)) throw new Error(`Engine already registered: ${engine.manifest.id}`);
  engines.set(engine.manifest.id, engine);
}

for (const engine of [soilTelemetryEngine, waterNeedEngine, weedMappingEngine, cropDiseaseEngine, climateStressEngine, sensorFusionEngine]) {
  registerEngine(engine);
}

export function getEngine(engineId: string): EngineModule | undefined {
  return engines.get(engineId);
}

export function listEngineManifests(): FeatureManifest[] {
  return [...engines.values()].map((engine) => engine.manifest);
}

export function runEngine(engineId: string, input: Parameters<EngineModule["process"]>[0]) {
  const engine = getEngine(engineId);
  if (!engine) throw new Error(`Unknown engine: ${engineId}`);
  return engine.process(input);
}
