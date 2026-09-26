import { test, expect } from "@playwright/test";
import { mockAnalyzeApi, mockReport } from "./fixtures";

test.describe("Risk dashboard hazard states", () => {
  test.beforeEach(async ({ page }) => {
    await mockAnalyzeApi(page);
  });

  test("shows unavailable hazard tile when flood data is missing", async ({ page }) => {
    await page.route("**/api/v1/analyze", async (route) => {
      if (route.request().method() !== "POST") {
        await route.continue();
        return;
      }

      const body = route.request().postDataJSON() as { address?: string };
      const address = body.address?.trim() ?? "Test Address";

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...mockReport,
          address,
          overall_status: "partial",
          verdict: null,
          flood_risk: {
            status: "unavailable",
            score: null,
            severity: null,
            confidence: "None",
            primary_factors: [],
            unavailable_reason: "FEMA timeout",
          },
        }),
      });
    });

    await page.goto("/");
    await page.getByPlaceholder(/address/i).fill("100 Test St, Miami, FL");
    await page.getByRole("button", { name: /analyze/i }).click();

    await expect(page.getByText("Data unavailable — cannot assess risk")).toBeVisible();
    await expect(page.getByText("FEMA timeout")).toBeVisible();
    await expect(page.getByText("Verdict withheld")).toBeVisible();
    await expect(page.getByText(/Flood data could not be retrieved/)).toBeVisible();
    await expect(page.getByText(/^(Go|Caution|Avoid)$/)).toHaveCount(0);
  });
});
