import type { ClimateRiskReport } from "../../src/types/risk";

export const mockReport: ClimateRiskReport = {
  address: "123 Main St, Miami, FL",
  latitude: 25.7617,
  longitude: -80.1918,
  flood_risk: {
    score: 72,
    severity: "High",
    confidence: "High",
    primary_factors: ["Coastal flood zone AE"],
  },
  hurricane_risk: {
    score: 85,
    severity: "Extreme",
    confidence: "High",
    primary_factors: ["High historical storm count"],
  },
  heat_risk: {
    score: 68,
    severity: "High",
    confidence: "Medium",
    primary_factors: ["Elevated heat index trend"],
  },
  wildfire_risk: {
    score: 22,
    severity: "Low",
    confidence: "High",
    primary_factors: ["Low wildfire exposure"],
  },
  overall_risk_score: 67,
  verdict: "Caution",
  ai_summary: "This property faces elevated flood and hurricane exposure.",
  generated_at: "2026-08-24T10:00:00.000Z",
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
