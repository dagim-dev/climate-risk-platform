import { expect, test } from "@playwright/test";
import { mockAnalyzeApi, mockReport } from "./fixtures";

test("report page exposes print action for save-as-PDF flow", async ({ page }) => {
  await mockAnalyzeApi(page);
  await page.goto("/");

  const searchInput = page.getByPlaceholder(
    "Enter a property address (e.g., 123 Main St, Miami, FL)",
  );
  await searchInput.fill("123 Main St, Miami, FL");
  await page.getByRole("button", { name: "Analyze Risk" }).click();
  await page.getByRole("button", { name: "View Full Report" }).click();

  await expect(page.getByRole("heading", { name: mockReport.address })).toBeVisible();
  const printButton = page.getByRole("button", { name: "🖨 Print / Save as PDF" });
  await expect(printButton).toBeVisible();

  await printButton.evaluate((button) => {
    const originalPrint = window.print;
    let called = false;
    window.print = () => {
      called = true;
    };
    button.click();
    window.print = originalPrint;
    if (!called) {
      throw new Error("window.print was not invoked");
    }
  });
});
