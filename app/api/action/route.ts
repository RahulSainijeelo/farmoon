import type { ActionRecord, SafetyChecklist } from "@/core/types/pipeline";

const checklistKeys: (keyof SafetyChecklist)[] = ["windVerified", "doseVerified", "ppeVerified", "killSwitchVerified"];

export async function POST(request: Request) {
  try {
    const body = await request.json() as { action?: ActionRecord; safetyChecklist?: SafetyChecklist; killSwitchActive?: boolean; cancel?: boolean };
    const action = body.action;
    if (!action?.id || !action.jobId || !action.targetZoneId) return Response.json({ error: "Action payload is incomplete." }, { status: 400 });
    if (body.cancel) return Response.json({ action: { ...action, status: "CANCELLED", updatedAt: Date.now() } });
    if (body.killSwitchActive) return Response.json({ error: "Kill switch is active." }, { status: 409 });
    if (action.requiresSafetyChecklist && (!body.safetyChecklist || checklistKeys.some((key) => body.safetyChecklist?.[key] !== true))) {
      return Response.json({ error: "Complete all four safety checks." }, { status: 422 });
    }
    return Response.json({
      action: {
        ...action,
        status: "AWAITING_VERIFICATION",
        safetyChecklist: action.requiresSafetyChecklist ? body.safetyChecklist : undefined,
        updatedAt: Date.now(),
      } satisfies ActionRecord,
      note: "Simulated command recorded. Awaiting field verification.",
    });
  } catch {
    return Response.json({ error: "Action request is invalid." }, { status: 400 });
  }
}
