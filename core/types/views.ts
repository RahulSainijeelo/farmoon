export type ViewGroup = "Pipeline" | "Plan";

export type ViewManifest = {
  id: string;
  label: string;
  icon: string;
  group: ViewGroup;
  route: string;
  dataSource?: string;
  badge?: "BUILT" | "SIMULATED" | "PROPOSED" | "ESTIMATE";
};
