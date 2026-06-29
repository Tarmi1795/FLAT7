import { expect, test } from "@playwright/test";

test("dashboard and primary navigation are usable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /home is mostly on track/i })).toBeVisible();
  await page.getByRole("link", { name: "Plants", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Plants" })).toBeVisible();
  await page.getByRole("button", { name: /add plant/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("quick entry updates plant history", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create quick entry" }).click();
  await page.getByRole("button", { name: "Water plant" }).click();
  await page.getByRole("button", { name: /record now/i }).click();
  await expect(page.getByRole("status")).toContainText(/watered/i);
});

test("page has no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
