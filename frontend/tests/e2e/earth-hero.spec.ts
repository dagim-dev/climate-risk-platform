import { expect, test, type Locator } from "@playwright/test";
import { projectToImage } from "../../src/lib/earth-view";
import { mockAnalyzeApi, mockReport } from "./fixtures";

const SEARCH_PLACEHOLDER = "Enter a property address (e.g., 123 Main St, Miami, FL)";

const PINNED_PLACES = [
  ["Miami", 25.76, -80.19],
  ["San Francisco", 37.77, -122.42],
  ["Seattle", 47.61, -122.33],
  ["Honolulu", 21.31, -157.86],
  ["Anchorage", 61.22, -149.9],
  ["San Juan", 18.47, -66.11],
] as const;

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

  test("drifts the clouds when motion is welcome", async ({ page }) => {
    await page.goto("/");
    const hasWebGL = await page.evaluate(
      () => !!document.createElement("canvas").getContext("webgl"),
    );
    test.skip(!hasWebGL, "no WebGL here, so the still clouds stay");

    // A shader that fails to compile fails silently, leaving the still image in place.
    await expect(page.locator(".earth-stage canvas")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".earth-stage img").nth(1)).toBeHidden();
  });

  test.describe("on a 2x screen", () => {
    test.use({ deviceScaleFactor: 2 });

    test("draws the clouds at full resolution", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto("/");
      const canvas = page.locator(".earth-stage canvas");
      test.skip(
        !(await page.evaluate(() => !!document.createElement("canvas").getContext("webgl"))),
        "no WebGL here, so the still clouds stay",
      );
      await expect(canvas).toBeVisible({ timeout: 15_000 });

      const { width, clientWidth } = await canvas.evaluate((element: HTMLCanvasElement) => ({
        width: element.width,
        clientWidth: element.clientWidth,
      }));
      expect(width).toBeGreaterThanOrEqual(clientWidth * 2);
    });
  });

  test("lays the two sides out over the centered Earth", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const [left, right] = await page.locator(".earth-panel").all();
    await expect(left.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(left.getByPlaceholder(SEARCH_PLACEHOLDER)).toBeVisible();
    await expect(right.getByRole("button", { name: /^Try an example/ }).first()).toBeVisible();
    await expect(right.getByRole("link", { name: /find one on Google Maps/ })).toBeVisible();
    await expect(right.getByRole("list", { name: "Hazards we score" })).toBeVisible();
    await expect(right.getByText(/Powered by NOAA/)).toBeVisible();

    const stage = page.locator(".earth-stage").first();
    const center = await stage.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return box.left + box.width / 2;
    });
    expect(center).toBeCloseTo(720, 0);
  });

  test("keeps the phone order: search, Earth, examples", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const top = (locator: Locator) =>
      locator.evaluate((element) => element.getBoundingClientRect().top);
    const search = await top(page.getByPlaceholder(SEARCH_PLACEHOLDER));
    const earth = await top(page.locator(".earth-window"));
    const examples = await top(page.getByText("No address in mind?"));
    expect(search).toBeLessThan(earth);
    expect(earth).toBeLessThan(examples);
  });

  for (const [width, height] of [
    [1024, 768],
    [1280, 720],
    [1440, 900],
    [1920, 1080],
  ]) {
    test(`never hides a pin under a panel at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      // Reduced motion, so a place's pan can't still be running when the next one starts.
      await page.emulateMedia({ reducedMotion: "reduce" });

      for (const [place, latitude, longitude] of PINNED_PLACES) {
        await page.unroute("**/api/v1/analyze");
        await mockAnalyzeApi(page, { latitude, longitude });
        await page.goto("/");
        await page.getByPlaceholder(SEARCH_PLACEHOLDER).first().fill(place);
        await page.getByRole("button", { name: "Analyze Risk" }).first().click();
        await expect(page.locator(".earth-pin")).toHaveCount(1);

        const position = projectToImage(latitude, longitude)!;
        const clear = await page.evaluate(
          ({ x, y }) => {
            // From layout offsets plus the pan asked for, so a slide can't skew the measure.
            const root = document.querySelector<HTMLElement>(".earth-hero")!;
            const stage = root.querySelector<HTMLElement>(".earth-stage")!;
            const origin = root.getBoundingClientRect();
            const pan = (name: string) => parseFloat(root.style.getPropertyValue(name)) || 0;
            const tipX =
              origin.left +
              stage.offsetLeft +
              stage.offsetWidth * (x - 0.5) +
              pan("--earth-pan-x");
            const tipY = origin.top + stage.offsetTop + stage.offsetHeight * y + pan("--earth-pan-y");
            const pin = { left: tipX - 14, right: tipX + 14, top: tipY - 36, bottom: tipY };
            const overlaps = [...document.querySelectorAll(".earth-panel")].some((panel) => {
              const box = panel.getBoundingClientRect();
              return (
                pin.left < box.right &&
                pin.right > box.left &&
                pin.top < box.bottom &&
                pin.bottom > box.top
              );
            });
            return !overlaps && pin.left >= 0 && pin.right <= innerWidth && pin.top >= origin.top;
          },
          { x: position.x, y: position.y },
        );
        expect(clear, `${place} at ${width}px`).toBe(true);
      }
    });
  }

  test("shows no pin for places on the far side", async ({ page }) => {
    await mockAnalyzeApi(page, { latitude: 13.44, longitude: 144.79 });
    await page.goto("/");
    await page.getByPlaceholder(SEARCH_PLACEHOLDER).first().fill("Hagatna, Guam");
    await page.getByRole("button", { name: "Analyze Risk" }).first().click();

    await expect(page.getByRole("heading", { name: "Hagatna, Guam" })).toBeVisible();
    await expect(page.locator(".earth-pin")).toHaveCount(0);
  });
});
