import type { ViewManifest } from "@/core/types/views";

export const planViews: ViewManifest[] = [
  {
    id: "status",
    label: "Build status",
    icon: "status",
    group: "Plan",
    route: "/plan/status",
    dataSource: "config/status.json",
    badge: "BUILT",
  },
  {
    id: "hardware",
    label: "Hardware plan",
    icon: "hardware",
    group: "Plan",
    route: "/plan/hardware",
    dataSource: "config/hardware.json",
    badge: "PROPOSED",
  },
  {
    id: "fund",
    label: "Fund use",
    icon: "fund",
    group: "Plan",
    route: "/plan/fund",
    dataSource: "config/budget.json",
    badge: "ESTIMATE",
  },
  {
    id: "farmer",
    label: "Farmer view",
    icon: "farmer",
    group: "Plan",
    route: "/farmer",
    dataSource: "config/i18n/hi.json",
    badge: "SIMULATED",
  },
  {
    id: "metrics",
    label: "Metrics",
    icon: "metrics",
    group: "Plan",
    route: "/plan/metrics",
    dataSource: "config/metrics.json",
    badge: "PROPOSED",
  },
  {
    id: "data-use",
    label: "Data note",
    icon: "data",
    group: "Plan",
    route: "/plan/data-use",
    dataSource: "config/data-use.json",
    badge: "PROPOSED",
  },
];

export function listViewManifests(): ViewManifest[] {
  return planViews;
}

export function getViewManifest(id: string): ViewManifest | undefined {
  return planViews.find((view) => view.id === id);
}
