import { expect, test } from "@playwright/test";
import { mockAnalyzeApi } from "./fixtures";

const SECTION_HEADINGS = [
  "Flood",
  "Hurricane",
  "Heat",
  "Wildfire",
  "Overall score",
  "Verdict",
  "Missing and cached data",
  "2030–2050 outlook",
  "AI summary",
];

test.describe("Methodology page", () => {
  test("renders every methodology section", async ({ page }) => {
    await page.goto("/methodology");

    await expect(
      page.getByRole("heading", { level: 1, name: "How the scores are calculated." }),
    ).toBeVisible();
    for (const name of SECTION_HEADINGS) {
      await expect(page.getByRole("heading", { level: 2, name, exact: true })).toBeVisible();
    }
  });

  test("footer link opens the methodology page", async ({ page }) => {
    await page.goto("/about");

    await page
      .getByRole("navigation", { name: "Footer" })
      .getByRole("link", { name: "Methodology" })
      .click();

    await expect(page).toHaveURL(/\/methodology$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("How the scores are calculated.");
  });

  test("each score card links to its hazard section", async ({ page }) => {
    await mockAnalyzeApi(page);
    await page.goto("/");
    await page.getByPlaceholder(/address/i).first().fill("100 Test St, Miami, FL");
    await page.getByRole("button", { name: /analyze/i }).first().click();

    for (const hazard of ["flood", "hurricane", "heat", "wildfire"]) {
      await expect(
        page.getByRole("link", { name: new RegExp(`How this score works \\(${hazard}\\)`, "i") }),
      ).toHaveAttribute("href", `/methodology#${hazard}`);
    }
  });
});
