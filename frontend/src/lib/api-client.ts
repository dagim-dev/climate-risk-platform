import type { ClimateRiskReport } from "@/types/risk";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function analyzeAddress(address: string): Promise<ClimateRiskReport> {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${API_BASE}/api/v1/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const error = (await response.json()) as { detail?: string };
      detail = error.detail;
    } catch {
      // response body was not JSON; fall through to status-based error
    }
    throw new Error(detail || `API error: ${response.statusText}`);
  }

  return (await response.json()) as ClimateRiskReport;
}
