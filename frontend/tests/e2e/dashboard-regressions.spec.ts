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

  test("a report that still carries old outlook points shows no outlook chart", async ({ page }) => {
    // Reports saved before the Risk Outlook was removed still contain historical_trend.
    await page.route("**/api/v1/analyze", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockReport,
          historical_trend: [
            { year: 2026, flood_score: 72, hurricane_score: 85, heat_score: 68, wildfire_score: 22, is_projection: false },
            { year: 2050, flood_score: 79, hurricane_score: 95, heat_score: 85, wildfire_score: 25, is_projection: true },
          ],
        }),
      });
    });

    await page.goto("/");
    await analyze(page, "123 Main St, Miami, FL");
    await expect(page.getByRole("heading", { name: mockReport.address })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Risk Outlook" })).toHaveCount(0);
    await expect(page.getByText(/projection/i)).toHaveCount(0);

    await page.getByRole("button", { name: "View Full Report" }).click();
    await expect(page).toHaveURL("/report");
    await expect(page.getByRole("heading", { name: "AI Risk Summary" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Risk Outlook" })).toHaveCount(0);
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
