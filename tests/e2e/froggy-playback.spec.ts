import { expect, test } from "@playwright/test";
import { waitForHydratedServerAction } from "../helpers/react-readiness";

test("plays one reduced-motion preview in isolation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/sign-in");
  await page.getByPlaceholder("allowlisted email").fill("owner@example.com");
  const login = page.getByRole("button", { name: "Dev login", exact: true });
  await waitForHydratedServerAction(login);
  await login.click();
  await expect(page).toHaveURL(/\/today$/);
  await page.goto("/program");
  await page.getByRole("button", { name: "View Incline Dumbbell Curl form", exact: true }).click();
  const player = page.getByTestId("froggy-player");
  await expect.poll(() => player.locator("video").evaluate((v: HTMLVideoElement) => ({
    readyState: v.readyState, networkState: v.networkState, time: v.currentTime,
    duration: v.duration, error: v.error?.message ?? null, source: v.currentSrc,
  })), { timeout: 30_000 }).toMatchObject({ readyState: 4, error: null });
  await expect(player.locator("video")).toHaveAttribute("src", /steady\.mp4$/);
  await expect.poll(() => player.locator("[data-form-banner]").innerText(), { timeout: 30_000 }).toMatch(/^AVOID/);
});

test("cycles every supported form through Avoid and back to Do during natural playback", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByPlaceholder("allowlisted email").fill("owner@example.com");
  const login = page.getByRole("button", { name: "Dev login", exact: true });
  await waitForHydratedServerAction(login);
  await login.click();
  await expect(page).toHaveURL(/\/today$/);
  await page.goto("/program");
  // A tall media-review viewport keeps all previews for one day visible and
  // playing together. The separate phone check below owns actual phone layout.
  await page.setViewportSize({ width: 1100, height: 6000 });
  let reviewed = 0;
  for (let day = 1; day <= 6; day++) {
    await page.getByRole("tab", { name: `Day ${day}`, exact: true }).click();
    const triggers = page.getByRole("button", { name: /^View .+ form$/ });
    const names = await triggers.evaluateAll(elements => elements.map(element => element.getAttribute("aria-label")!));
    for (const name of names) await page.getByRole("button", { name, exact: true }).click();
    const panels = page.getByTestId("froggy-inline-preview");
    await expect(panels).toHaveCount(names.length);
    await page.evaluate(() => window.scrollTo(0, 0));
    await Promise.all(names.map(async (name, index) => {
      const panel = panels.nth(index);
      const banner = panel.locator("[data-form-banner]");
      await expect(banner, name).toBeVisible();
      await expect.poll(() => banner.innerText(), { message: `${name}: Avoid`, timeout: 30_000 }).toMatch(/^AVOID/);
      await expect.poll(() => banner.innerText(), { message: `${name}: return to Do`, timeout: 20_000 }).toMatch(/^DO/);
    }));
    reviewed += names.length;
  }
  expect(reviewed).toBe(21);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("tab", { name: "Day 2", exact: true }).click();
  await page.getByRole("button", { name: "View Barbell Overhead Press form", exact: true }).click();
  await page.getByRole("button", { name: "Expand form preview", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Barbell Overhead Press · Form" });
  const banner = dialog.locator("[data-form-banner]");
  await expect.poll(() => banner.innerText(), { timeout: 30_000 }).toMatch(/^AVOID/);
  await dialog.getByRole("button", { name: "Pause form animation" }).click();
  const pausedCue = await banner.innerText();
  await page.waitForTimeout(1200);
  expect(await banner.innerText()).toBe(pausedCue);
  await dialog.getByRole("button", { name: "Resume form animation" }).click();
  await expect.poll(() => banner.innerText(), { timeout: 20_000 }).toMatch(/^DO/);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `output/playwright/workout-field-fixes/overhead-${test.info().project.name}.png` });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});
