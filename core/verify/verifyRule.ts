import defaultConfig from "@/config/verify.json";
import type { Stage2Zone, VerificationStatus } from "@/core/types/pipeline";

export interface VerifyConfig {
  improvementRatio: number;
  minConfidence: number;
  ruleDescription?: string;
}

export function verify(
  before: Stage2Zone,
  after: Stage2Zone,
  cfg: VerifyConfig = defaultConfig
): VerificationStatus {
  if (after.confidence < cfg.minConfidence) {
    return "NEEDS_REVIEW";
  }

  const beforeSeverity = before.severity ?? (before.status === "NORMAL" ? 0.1 : before.status === "WARN" ? 0.5 : 0.85);
  const afterSeverity = after.severity ?? (after.status === "NORMAL" ? 0.1 : after.status === "WARN" ? 0.5 : 0.85);

  const improved = afterSeverity <= beforeSeverity * cfg.improvementRatio;
  const isNormal = String(after.status).toUpperCase() === "NORMAL";

  return improved && isNormal ? "RESOLVED" : "PERSISTS";
}

export function getVerificationRuleDescription(cfg: VerifyConfig = defaultConfig): string {
  const percent = Math.round((1 - cfg.improvementRatio) * 100);
  return `Resolved if severity falls ${percent}% and zone returns to normal`;
}
