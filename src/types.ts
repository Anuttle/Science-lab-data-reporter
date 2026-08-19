export type FitType =
  | "linear"
  | "linear_origin"
  | "quadratic"
  | "power"
  | "exponential"
  | "inverse";

export interface DataPoint {
  id: string;
  x: number;
  y: number;
  yUncertainty?: number;
  excluded?: boolean;
  label?: string;
  trials?: number[];
}

export interface FitResult {
  type: FitType;
  equation: string;
  slope?: number;
  intercept?: number;
  a?: number;
  b?: number;
  c?: number;
  r2: number;
  r: number;
  rss: number;
  predict: (x: number) => number;
  residuals: {
    id: string;
    x: number;
    actualY: number;
    predictedY: number;
    residual: number;
  }[];
}

export interface DatasetConfig {
  title: string;
  xName: string;
  xUnit: string;
  yName: string;
  yUnit: string;
  notes?: string;
  defaultFit?: FitType;
}

export interface StatsSummary {
  mean: number;
  stdDev: number;
  min: number;
  max: number;
  count: number;
}
