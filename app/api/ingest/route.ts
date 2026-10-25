import { IngestError, normalizeIngest } from "@/core/ingest/normalize";
import type { TelemetryPacket, TelemetryValue } from "@/core/types/pipeline";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const engineId = String(form.get("engineId") ?? "");
    const plotId = String(form.get("plotId") ?? "");
    let metadata: Record<string, TelemetryValue> = {};
    let telemetryPackets: TelemetryPacket[] = [];
    try {
      metadata = JSON.parse(String(form.get("metadata") ?? "{}")) as Record<string, TelemetryValue>;
      telemetryPackets = JSON.parse(String(form.get("telemetryPackets") ?? "[]")) as TelemetryPacket[];
    } catch {
      return Response.json({ error: "Metadata or telemetry JSON is invalid.", code: "JSON_INVALID" }, { status: 400 });
    }
    const files = form.getAll("files").filter((value): value is File => typeof value !== "string" && "arrayBuffer" in value && "name" in value);
    const payload = await normalizeIngest({ engineId, plotId, metadata, telemetryPackets, files });
    return Response.json({ payload });
  } catch (error) {
    if (error instanceof IngestError) return Response.json({ error: error.message, code: error.code }, { status: 422 });
    return Response.json({ error: "Ingest could not be completed.", code: "INGEST_FAILED" }, { status: 500 });
  }
}
