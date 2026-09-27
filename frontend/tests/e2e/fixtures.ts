import type { ClimateRiskReport } from "../../src/types/risk";

export const mockReport: ClimateRiskReport = {
  address: "123 Main St, Miami, FL",
  latitude: 25.7617,
  longitude: -80.1918,
  flood_risk: {
    status: "ok",
    score: 72,
    severity: "High",
    confidence: "High",
    primary_factors: ["Coastal flood zone AE"],
  },
  hurricane_risk: {
    status: "ok",
    score: 85,
    severity: "Extreme",
    confidence: "High",
    primary_factors: ["High historical storm count"],
  },
  heat_risk: {
    status: "ok",
    score: 68,
    severity: "High",
    confidence: "Medium",
    primary_factors: ["Elevated heat index trend"],
  },
  wildfire_risk: {
    status: "ok",
    score: 22,
    severity: "Low",
    confidence: "High",
    primary_factors: ["Low wildfire exposure"],
  },
  overall_risk_score: 67,
  overall_status: "complete",
  verdict: "Caution",
  verdict_reason: null,
  ai_summary: "This property faces elevated flood and hurricane exposure.",
  generated_at: "2026-08-24T10:00:00.000Z",
  // Same shape as the backend: today's scores, then projections.
  historical_trend: [
    { year: 2026, flood_score: 72, hurricane_score: 85, heat_score: 68, wildfire_score: 22, is_projection: false },
    { year: 2030, flood_score: 73, hurricane_score: 87, heat_score: 71, wildfire_score: 22, is_projection: true },
    { year: 2040, flood_score: 76, hurricane_score: 91, heat_score: 78, wildfire_score: 23, is_projection: true },
    { year: 2050, flood_score: 79, hurricane_score: 95, heat_score: 85, wildfire_score: 25, is_projection: true },
  ],
};

export async function mockAnalyzeApi(page: import("@playwright/test").Page) {
  await page.route("**/api/v1/analyze", async (route) => {
    if (route.request().method() !== "POST") {
      await route.continue();
      return;
    }

    const body = route.request().postDataJSON() as { address?: string };
    const address = body.address?.trim() ?? "";

    if (address.toLowerCase().includes("invalid")) {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Unable to geocode the provided address." }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ...mockReport, address }),
    });
  });
}
