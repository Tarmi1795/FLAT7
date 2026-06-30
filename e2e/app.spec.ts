import { expect, test } from "@playwright/test";

test("dashboard and primary navigation are usable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /home is mostly on track/i })).toBeVisible();
  await page.getByRole("link", { name: "Plants", exact: true }).first().click();
  await expect(page.getByRole("heading", { name: "Plants" })).toBeVisible();
  await page.getByRole("button", { name: /add plant/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Take photo", { exact: true })).toBeVisible();
  await expect(page.getByText("Choose photo", { exact: true })).toBeVisible();
});

test("quick entry updates plant history", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create quick entry" }).click();
  await page.getByRole("button", { name: "Water plant" }).click();
  await page.getByRole("button", { name: /record now/i }).click();
  await expect(page.getByRole("status")).toContainText(/watered/i);
});

test("a plant photo can be chosen and shown on its card", async ({ page }) => {
  await page.goto("/plants");
  await page.getByRole("button", { name: /add plant/i }).click();
  const dialog = page.getByRole("dialog");
  const choosePhoto = dialog.locator("label").filter({ hasText: "Choose photo" }).locator('input[type="file"]');
  await choosePhoto.setInputFiles({
    name: "fern.png",
    mimeType: "image/png",
    buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z9Xo=", "base64"),
  });
  await expect(dialog.getByAltText("Selected plant preview")).toBeVisible();
  await dialog.getByLabel("Plant name").fill("Photo Fern");
  await dialog.getByRole("button", { name: "Save plant" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByAltText("Photo Fern plant")).toBeVisible();
});

test("page has no horizontal overflow", async ({ page }) => {
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
