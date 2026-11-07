import { expect, test } from "@playwright/test";
import { projectToImage } from "../../src/lib/earth-view";
import { mockAnalyzeApi, mockReport } from "./fixtures";

const SEARCH_PLACEHOLDER = "Enter a property address (e.g., 123 Main St, Miami, FL)";

test.describe("Homepage Earth", () => {
  test("pins the analyzed address on the visible planet", async ({ page }) => {
    await mockAnalyzeApi(page);
    await page.goto("/");
    await expect(page.locator(".earth-pin")).toHaveCount(0);

    await page.getByPlaceholder(SEARCH_PLACEHOLDER).first().fill(mockReport.address);
    await page.getByRole("button", { name: "Analyze Risk" }).first().click();

    const pin = page.locator(".earth-pin");
    await expect(pin).toHaveCount(1);
    const position = projectToImage(mockReport.latitude, mockReport.longitude);
    expect(position).not.toBeNull();
    // The pin's tip, measured in the image it sits on.
    const tip = await pin.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const stage = element.parentElement!.getBoundingClientRect();
      return {
        x: (box.left + box.width / 2 - stage.left) / stage.width,
        y: (box.bottom - stage.top) / stage.height,
      };
    });
    expect(tip.x).toBeCloseTo(position!.x, 2);
    expect(tip.y).toBeCloseTo(position!.y, 2);
  });

  test("places only what this side of the planet can show", () => {
    const denver = projectToImage(39.74, -104.99);
    expect(denver!.x).toBeGreaterThan(0.3);
    expect(denver!.x).toBeLessThan(0.5);
    expect(denver!.y).toBeLessThan(0.6);
    expect(projectToImage(13.44, 144.79)).toBeNull(); // Guam
  });

  test("keeps still clouds with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await expect(page.locator(".earth-stage img").nth(1)).toBeVisible();
    await expect(page.locator(".earth-stage canvas")).toBeHidden();
  });
});
