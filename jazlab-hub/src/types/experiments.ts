export type ExperimentStatus = "active" | "beta" | "coming-soon";

export interface ExperimentFeature {
  title: string;
  description: string;
  icon: string; // icon name string for Phase 2 icon mapping
}

export interface Experiment {
  slug: string;
  name: string;
  description: string;
  status: ExperimentStatus;
  subdomainUrl: string;
  accentColor: string; // hex, CSS-referenceable
  features: ExperimentFeature[];
}
