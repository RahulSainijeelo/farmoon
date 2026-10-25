import type { EngineIconName } from "@/core/types/pipeline";
import type { ReactNode } from "react";

export function SystemIcon({ name, size = 24, className }: { name: EngineIconName; size?: number; className?: string }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const shape: Record<EngineIconName, ReactNode> = {
    sky: <><path d="M12 8v8M8 12h8M9.5 9.5l5 5m0-5-5 5" /><path d="M12 8 8.5 5.5M12 8l3.5-2.5M12 16l-3.5 2.5M12 16l3.5 2.5" /><circle cx="6.5" cy="5" r="2" /><circle cx="17.5" cy="5" r="2" /><circle cx="6.5" cy="19" r="2" /><circle cx="17.5" cy="19" r="2" /><circle cx="12" cy="12" r="2.2" /></>,
    soil: <><path d="M12 3v8M8 7l4 4 4-4M12 11v8M7 20l5-6 5 6" /><path d="M5 21h14" /></>,
    ingest: <><path d="M4 14v5h16v-5M12 15V4M8 8l4-4 4 4" /><path d="M7 19v2M17 19v2" /></>,
    engine: <><path d="m12 2 7.8 4.5v9L12 20l-7.8-4.5v-9L12 2Z" /><circle cx="12" cy="11" r="3.1" /><path d="M12 6.7v1.2M12 14.2v1.2M7.7 11h1.2m6.2 0h1.2" /></>,
    action: <><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></>,
    verify: <><path d="M12 3 19 6v5c0 4.4-2.6 7.8-7 10-4.4-2.2-7-5.6-7-10V6l7-3Z" /><path d="m8.5 11.8 2.2 2.2 4.8-5" /></>,
    alert: <><path d="M12 3 2.8 19h18.4L12 3Z" /><path d="M12 9v4.2M12 16.2v.1" /></>,
  };

  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...common}>{shape[name]}</svg>;
}
