import { expect, test } from "@playwright/test";

test("dashboard and primary navigation are usable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /flat7 at a glance/i })).toBeVisible();
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

test("tracked assets can be edited and deleted", async ({ page }) => {
  await page.goto("/plants");
  const monstera = page.locator("article").filter({ has: page.getByRole("heading", { name: "Monstera", exact: true }) });
  await monstera.getByRole("button", { name: "Edit" }).click();
  const editPlant = page.getByRole("dialog");
  await editPlant.getByLabel("Plant name").fill("Green Monstera");
  await editPlant.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "Green Monstera", exact: true })).toBeVisible();
  await page.locator("article").filter({ has: page.getByRole("heading", { name: "Green Monstera", exact: true }) }).getByRole("button", { name: "Delete Green Monstera" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Green Monstera", exact: true })).toBeHidden();

  await page.goto("/ac");
  const livingAC = page.locator("article").filter({ has: page.getByRole("heading", { name: "Living room AC", exact: true }) });
  await livingAC.getByRole("button", { name: "Edit" }).click();
  await page.getByRole("dialog").getByLabel("Unit name").fill("Lounge AC");
  await page.getByRole("dialog").getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "Lounge AC", exact: true })).toBeVisible();

  await page.goto("/activity");
  await page.getByRole("button", { name: "Edit Snake plant watered" }).click();
  const activityDialog = page.getByRole("dialog");
  await activityDialog.getByLabel("Note").fill("Watered after soil check");
  await activityDialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("article").filter({ has: page.getByRole("heading", { name: "Snake plant watered" }) })).toContainText("Watered after soil check");
  await page.getByRole("button", { name: "Delete Snake plant watered" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Snake plant watered", exact: true })).toBeHidden();
});

test("people, rooms, and bills support CRUD", async ({ page }) => {
  await page.goto("/more");
  await page.getByRole("button", { name: "Add person" }).click();
  await page.getByRole("dialog").getByLabel("Person name").fill("Sam");
  await page.getByRole("dialog").getByRole("button", { name: "Add person" }).click();
  await expect(page.locator("#main-content").getByText("Sam", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add room" }).click();
  const roomDialog = page.getByRole("dialog");
  await roomDialog.getByLabel("Room name").fill("Guest room");
  await roomDialog.getByLabel("Primary person").selectOption({ label: "Sam" });
  await roomDialog.getByRole("button", { name: "Add room" }).click();
  await expect(page.getByText("Guest room", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete Guest room" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Guest room", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Delete Sam" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Sam", { exact: true })).toBeHidden();

  await page.goto("/bills");
  await page.getByRole("button", { name: "Edit Internet bill" }).click();
  const billDialog = page.getByRole("dialog");
  await billDialog.getByLabel("Amount (QAR)").fill("444");
  await billDialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("article").filter({ has: page.getByRole("heading", { name: "Internet" }) }).getByText(/QAR\s*444/)).toBeVisible();
});

test("page has no horizontal overflow", async ({ page }) => {
  for (const route of ["/", "/plants", "/ac", "/bills", "/more", "/activity"]) {
    await page.goto(route);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow, `${route} should fit the viewport`).toBe(false);
  }
});

test("tablet keyboard shortcuts and compact layout stay within one view", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 600 });
  await page.goto("/");

  for (const [key, route] of [["1", "/"], ["2", "/plants"], ["3", "/ac"], ["4", "/bills"], ["5", "/activity"], ["6", "/more"]]) {
    await page.keyboard.press(`Alt+${key}`);
    await expect(page).toHaveURL(new RegExp(`${route === "/" ? "/$" : `${route}$`}`));
  }
  await page.keyboard.press("Alt+2");
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();

  const firstCard = page.locator(".plant-card").first();
  const cardBox = await firstCard.boundingBox();
  expect(cardBox?.height).toBeLessThanOrEqual(400);
  await expect(firstCard.getByRole("button", { name: "Watered" })).toBeVisible();
  await expect(firstCard.getByRole("button", { name: "Trimmed" })).toBeVisible();

  await page.keyboard.press("Alt+n");
  await expect(page.getByRole("dialog", { name: "Quick entry" })).toBeVisible();
  await page.keyboard.press("Escape");

  await page.keyboard.press("Shift+/");
  await expect(page.getByRole("dialog", { name: "Keyboard shortcuts" })).toBeVisible();
});

test("top-aligned forms remain below the sticky tablet header", async ({ page }) => {
  await page.setViewportSize({ width: 960, height: 600 });
  await page.goto("/plants");
  await page.getByRole("button", { name: /add plant/i }).click();

  const headerBox = await page.locator(".tablet-header-shell").boundingBox();
  const dialogBox = await page.getByRole("dialog", { name: "Add a plant" }).boundingBox();
  expect(dialogBox?.y).toBeGreaterThanOrEqual(headerBox?.height || 0);
  expect((dialogBox?.y || 0) + (dialogBox?.height || 0)).toBeLessThanOrEqual(600);

  await page.getByRole("dialog").getByLabel("Plant name").focus();
  await page.keyboard.press("Alt+1");
  await expect(page).toHaveURL(/\/plants$/);
});
