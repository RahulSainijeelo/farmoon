import { runEngine } from "@/core/registry/engineRegistry";
import type { Stage1Payload } from "@/core/types/pipeline";

export async function POST(request: Request, context: { params: Promise<{ engineId: string }> }) {
  const { engineId } = await context.params;
  try {
    const payload = await request.json() as Stage1Payload;
    if (payload.engineId !== engineId) return Response.json({ error: "Payload engine does not match route." }, { status: 400 });
    if (!payload.plotId || !Array.isArray(payload.telemetryPackets) || !Array.isArray(payload.rawFiles)) {
      return Response.json({ error: "Stage 1 payload is incomplete." }, { status: 400 });
    }
    const result = runEngine(engineId, payload);
    return Response.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Engine processing failed.";
    const status = message.startsWith("Unknown engine:") ? 404 : 422;
    return Response.json({ error: message }, { status });
  }
}
