import { expect, test } from "@playwright/test";
import { EXAMPLE_ADDRESSES } from "../../src/lib/example-addresses";
import { mockAnalyzeApi, mockReport } from "./fixtures";

const SEARCH_PLACEHOLDER = "Enter a property address (e.g., 123 Main St, Miami, FL)";

function exampleButton(page: import("@playwright/test").Page, index: number) {
  const example = EXAMPLE_ADDRESSES[index];
  return page.getByRole("button", {
    name: `Try an example: ${example.category}, ${example.place}`,
  });
}

test.describe("Example addresses", () => {
  test("home page shows one labeled pill per example", async ({ page }) => {
    await page.goto("/");

    for (const [index, example] of EXAMPLE_ADDRESSES.entries()) {
      const button = exampleButton(page, index);
      await expect(button).toBeVisible();
      await expect(button).toContainText(example.category);
      await expect(button).toContainText(example.place);
    }
  });

  test("clicking a pill fills the input and analyzes that address", async ({ page }) => {
    await mockAnalyzeApi(page);
    await page.goto("/");

    const example = EXAMPLE_ADDRESSES[0];
    const requestPromise = page.waitForRequest(
      (request) => request.url().includes("/api/v1/analyze") && request.method() === "POST",
    );
    await exampleButton(page, 0).click();

    const request = await requestPromise;
    expect((request.postDataJSON() as { address: string }).address).toBe(example.address);
    await expect(page.getByPlaceholder(SEARCH_PLACEHOLDER).first()).toHaveValue(example.address);
    await expect(page.getByRole("heading", { name: example.address })).toBeVisible();
  });

  test("pills are disabled while a search is running", async ({ page }) => {
    let release!: () => void;
    const released = new Promise<void>((resolve) => (release = resolve));
    await page.route("**/api/v1/analyze", async (route) => {
      await released;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockReport),
      });
    });
    await page.goto("/");

    await exampleButton(page, 0).click();
    for (const index of EXAMPLE_ADDRESSES.keys()) {
      await expect(exampleButton(page, index)).toBeDisabled();
    }

    release();
    await expect(page.getByRole("heading", { name: mockReport.address })).toBeVisible();
    await expect(exampleButton(page, 1)).toBeEnabled();
  });

  test("Google Maps link opens in a new tab", async ({ page }) => {
    await page.goto("/");

    const link = page.getByRole("link", { name: /find one on Google Maps/ });
    await expect(link).toHaveAttribute("href", "https://www.google.com/maps");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  });

  test("examples are not repeated under the results", async ({ page }) => {
    await mockAnalyzeApi(page);
    await page.goto("/");

    await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill("123 Main St, Miami, FL");
    await page.getByRole("button", { name: "Analyze Risk" }).click();
    await expect(page.getByRole("heading", { name: mockReport.address })).toBeVisible();

    const results = page.getByRole("region", { name: "Risk assessment results" });
    await expect(results.getByRole("button", { name: /^Try an example/ })).toHaveCount(0);
    await expect(results.getByRole("link", { name: /Google Maps/ })).toHaveCount(0);
  });
});
