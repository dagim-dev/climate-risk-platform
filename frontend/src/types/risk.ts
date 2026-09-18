export type Severity = "Low" | "Moderate" | "High" | "Extreme";
export type Verdict = "Go" | "Caution" | "Avoid";
export type HazardStatus = "ok" | "stale" | "unavailable";
export type OverallStatus = "complete" | "partial" | "unavailable";

export interface HazardScore {
  status?: HazardStatus;
  score: number | null;
  severity: Severity | null;
  confidence: string;
  primary_factors: string[];
  as_of?: string | null;
  unavailable_reason?: string | null;
}

export interface SourceStatus {
  status: HazardStatus;
  as_of?: string | null;
  error?: string | null;
}

export interface TrendPoint {
  year: number;
  flood_score: number;
  hurricane_score: number;
  heat_score: number;
  wildfire_score: number;
  is_projection: boolean;
}

export interface ClimateRiskReport {
  address: string;
  latitude: number;
  longitude: number;
  flood_risk: HazardScore;
  hurricane_risk: HazardScore;
  heat_risk: HazardScore;
  wildfire_risk: HazardScore;
  overall_risk_score: number | null;
  overall_status?: OverallStatus;
  verdict: Verdict | null;
  sources?: Record<string, SourceStatus>;
  ai_summary?: string;
  generated_at: string;
  historical_trend?: TrendPoint[];
}
