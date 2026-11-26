import { expect, test } from "@playwright/test";

import { ROADMAP_ITEMS } from "../../src/lib/roadmap";

const VIEWPORTS = [
  { name: "desktop", viewport: { width: 1280, height: 800 } },
  { name: "mobile", viewport: { width: 390, height: 844 } },
] as const;

for (const { name, viewport } of VIEWPORTS) {
  test.describe(`Roadmap panel (${name})`, () => {
    test.use({ viewport });

    test("opens from the header, expands How it works, closes with Escape", async ({ page }) => {
      const item = ROADMAP_ITEMS[0];
      await page.goto("/");

      const header = page.getByRole("banner");
      const trigger = header.getByRole("button", { name: /next/i });
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");

      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "What’s coming next" });
      await expect(dialog).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(trigger).toHaveAttribute("aria-controls", (await dialog.getAttribute("id"))!);
      await expect(dialog.getByRole("button", { name: "Close" })).toBeFocused();

      await expect(dialog.getByRole("heading", { name: item.title })).toBeVisible();
      await expect(dialog.getByText(item.summary)).toBeVisible();
      await expect(dialog.getByRole("link", { name: "How we score today" })).toHaveAttribute(
        "href",
        "/methodology",
      );

      const details = dialog.locator("details").first();
      const technical = details.getByText(item.howItWorks[0]);
      await expect(technical).toBeHidden();
      await details.getByText("How it works").click();
      await expect(details).toHaveAttribute("open", "");
      await expect(technical).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(trigger).toBeFocused();
    });

    test("keeps focus inside and closes on an outside click", async ({ page }) => {
      await page.goto("/about");
      const trigger = page.getByRole("banner").getByRole("button", { name: /next/i });
      await trigger.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();

      for (let i = 0; i < 5; i += 1) {
        await page.keyboard.press("Tab");
        await expect(dialog.locator(":focus")).toHaveCount(1);
      }

      // Just below the header at the right edge: beside the desktop popover and above the phone
      // sheet, however tall the roadmap copy makes the panel.
      const header = (await page.getByRole("banner").boundingBox())!;
      await page.mouse.click(viewport.width - 24, header.y + header.height + 8);
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  });
}
