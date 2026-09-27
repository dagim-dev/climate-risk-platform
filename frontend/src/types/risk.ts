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
  // null when that hazard could not be assessed.
  flood_score: number | null;
  hurricane_score: number | null;
  heat_score: number | null;
  wildfire_score: number | null;
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
  verdict_reason?: string | null;
  sources?: Record<string, SourceStatus>;
  ai_summary?: string | null;
  generated_at: string;
  historical_trend?: TrendPoint[];
}
