import { test, expect } from "@playwright/test";

test("unauthenticated visitor can open the Neon Auth sign-in screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Masuk ke ruang kerja" })).toBeVisible();
  await page.getByRole("link", { name: "Masuk dengan Neon Auth" }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in$/);
  await expect(page.getByRole("heading", { name: "Akses ruang kerja Anda" })).toBeVisible();
});
