import { expect, test } from "@playwright/test";
import { mockAnalyzeApi, mockReport } from "./fixtures";

test.describe("Address search and risk dashboard", () => {
  test("home page loads with focusable search input", async ({ page }) => {
    await page.goto("/");

    const searchInput = page.getByPlaceholder(
      "Enter a property address (e.g., 123 Main St, Miami, FL)",
    );
    await expect(searchInput).toBeVisible();
    await searchInput.focus();
    await expect(searchInput).toBeFocused();
  });

  test("valid address shows loading skeleton then four score cards", async ({ page }) => {
    await page.route("**/api/v1/analyze", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      const body = route.request().postDataJSON() as { address?: string };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...mockReport, address: body.address?.trim() ?? mockReport.address }),
      });
    });
    await page.goto("/");

    const searchInput = page.getByPlaceholder(
      "Enter a property address (e.g., 123 Main St, Miami, FL)",
    );
    await searchInput.fill("123 Main St, Miami, FL");
    await page.getByRole("button", { name: "Analyze Risk" }).click();

    await expect(page.getByRole("status", { name: "Loading risk assessment" })).toBeVisible();
    await expect(page.getByRole("heading", { name: mockReport.address })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Flood" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Hurricane" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Heat" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Wildfire" })).toBeVisible();
  });

  test("invalid address shows error below the input", async ({ page }) => {
    await mockAnalyzeApi(page);
    await page.goto("/");

    const searchInput = page.getByPlaceholder(
      "Enter a property address (e.g., 123 Main St, Miami, FL)",
    );
    await searchInput.fill("invalid address xyz");
    await page.getByRole("button", { name: "Analyze Risk" }).click();

    const alert = page.getByRole("alert").filter({ hasText: "Unable to geocode" });
    await expect(alert).toBeVisible();
  });

  test("verdict badge shows Go, Caution, or Avoid", async ({ page }) => {
    await mockAnalyzeApi(page);
    await page.goto("/");

    const searchInput = page.getByPlaceholder(
      "Enter a property address (e.g., 123 Main St, Miami, FL)",
    );
    await searchInput.fill("123 Main St, Miami, FL");
    await page.getByRole("button", { name: "Analyze Risk" }).click();

    const verdictBadge = page.getByRole("status").filter({ hasText: /Go|Caution|Avoid/ });
    await expect(verdictBadge).toBeVisible();
  });

  test("view full report navigates to report page", async ({ page }) => {
    await mockAnalyzeApi(page);
    await page.goto("/");

    const searchInput = page.getByPlaceholder(
      "Enter a property address (e.g., 123 Main St, Miami, FL)",
    );
    await searchInput.fill("123 Main St, Miami, FL");
    await page.getByRole("button", { name: "Analyze Risk" }).click();
    await expect(page.getByRole("heading", { name: mockReport.address })).toBeVisible();

    await page.getByRole("button", { name: "View Full Report" }).click();
    await expect(page).toHaveURL("/report");
  });

  test("report page shows address and hazard score labels", async ({ page }) => {
    await mockAnalyzeApi(page);
    await page.goto("/");

    const searchInput = page.getByPlaceholder(
      "Enter a property address (e.g., 123 Main St, Miami, FL)",
    );
    await searchInput.fill("123 Main St, Miami, FL");
    await page.getByRole("button", { name: "Analyze Risk" }).click();
    await page.getByRole("button", { name: "View Full Report" }).click();

    await expect(page.getByRole("heading", { name: mockReport.address })).toBeVisible();
    await expect(page.getByText("Flood", { exact: true })).toBeVisible();
  });

  test("analyze another address resets the dashboard", async ({ page }) => {
    await mockAnalyzeApi(page);
    await page.goto("/");

    const searchInput = page.getByPlaceholder(
      "Enter a property address (e.g., 123 Main St, Miami, FL)",
    );
    await searchInput.fill("123 Main St, Miami, FL");
    await page.getByRole("button", { name: "Analyze Risk" }).click();
    await expect(page.getByRole("heading", { name: mockReport.address })).toBeVisible();

    await page.getByRole("button", { name: "Analyze Another Address" }).click();
    await expect(page.getByRole("heading", { name: mockReport.address })).toBeHidden();
    await expect(page.getByRole("region", { name: "Risk assessment results" })).toBeHidden();
  });
});
