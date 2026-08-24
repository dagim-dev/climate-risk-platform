export type Severity = "Low" | "Moderate" | "High" | "Extreme";
export type Verdict = "Go" | "Caution" | "Avoid";

export interface HazardScore {
  score: number;
  severity: Severity;
  confidence: string;
  primary_factors: string[];
}

export interface ClimateRiskReport {
  address: string;
  latitude: number;
  longitude: number;
  flood_risk: HazardScore;
  hurricane_risk: HazardScore;
  heat_risk: HazardScore;
  wildfire_risk: HazardScore;
  overall_risk_score: number;
  verdict: Verdict;
  ai_summary?: string;
  generated_at: string;
}
