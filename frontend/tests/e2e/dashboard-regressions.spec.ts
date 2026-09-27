import { test, expect } from "@playwright/test";
import { mockAnalyzeApi, mockReport } from "./fixtures";

const PLACEHOLDER = "Enter a property address (e.g., 123 Main St, Miami, FL)";

async function analyze(page: import("@playwright/test").Page, address: string) {
  await page.getByPlaceholder(PLACEHOLDER).first().fill(address);
  await page.getByRole("button", { name: "Analyze Risk" }).first().click();
}

test.describe("Dashboard regressions", () => {
  test.beforeEach(async ({ page }) => {
    await mockAnalyzeApi(page);
  });

  test("failed second search keeps its error visible", async ({ page }) => {
    await page.goto("/");
    await analyze(page, "123 Main St, Miami, FL");
    await expect(page.getByRole("heading", { name: mockReport.address })).toBeVisible();

    const second = page.getByRole("region", { name: "Risk assessment results" });
    await second.getByPlaceholder(PLACEHOLDER).fill("invalid place");
    await second.getByRole("button", { name: "Analyze Risk" }).click();

    await expect(second.getByRole("alert")).toHaveText("Unable to geocode the provided address.");
    await expect(page.getByRole("heading", { name: mockReport.address })).toBeVisible();
  });

  test("outlook chart labels projections and hides unassessed hazards", async ({ page }) => {
    await page.route("**/api/v1/analyze", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockReport,
          overall_status: "partial",
          verdict: null,
          flood_risk: {
            status: "unavailable",
            score: null,
            severity: null,
            confidence: "None",
            primary_factors: [],
            unavailable_reason: "No digital FEMA flood map covers this location",
          },
          historical_trend: mockReport.historical_trend!.map((point) => ({ ...point, flood_score: null })),
        }),
      });
    });

    await page.goto("/");
    await analyze(page, "1 Rural Rd, Somewhere, MT");

    await expect(page.getByRole("heading", { name: "Risk Outlook" })).toBeVisible();
    await expect(page.getByText(/linear\s+projections from today/)).toBeVisible();
    await expect(page.getByText("Hazards that could not be assessed are not shown.", { exact: false })).toBeVisible();
    await expect(page.getByText(/interpolated/)).toHaveCount(0);
  });

  test("score with missing severity is labelled from its score, not 'Moderate'", async ({ page }) => {
    await page.route("**/api/v1/analyze", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockReport,
          wildfire_risk: { ...mockReport.wildfire_risk, score: 90, severity: null },
        }),
      });
    });

    await page.goto("/");
    await analyze(page, "1 Forest Rd, Paradise, CA");

    const wildfire = page.locator("article").filter({ hasText: "Wildfire" });
    await expect(wildfire.getByText("Extreme", { exact: true })).toBeVisible();
  });

  test("back to dashboard from the report restores the last report", async ({ page }) => {
    await page.goto("/");
    await analyze(page, "123 Main St, Miami, FL");
    await page.getByRole("button", { name: "View Full Report" }).click();
    await expect(page).toHaveURL("/report");

    await page.getByRole("link", { name: "Back to Dashboard" }).click();
    await expect(page.getByRole("heading", { name: mockReport.address, level: 2 })).toBeVisible();
  });
});
