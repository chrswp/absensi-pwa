import { test, expect } from "@playwright/test";

test("admin saves a payroll calculation and previews the salary slip", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("1234");
  await page.getByRole("button", { name: "Masuk" }).click();

  await page.getByRole("button", { name: "Penggajian" }).first().click();
  await page.getByRole("button", { name: "Atur perhitungan" }).first().click();
  await expect(page.getByRole("heading", { name: "Perhitungan gaji" })).toBeVisible();

  await page.getByLabel("Total upah harian").fill("500000");
  await page.getByRole("button", { name: "Simpan perhitungan" }).click();
  await expect(page.getByText(/Perhitungan gaji disimpan untuk/)).toBeVisible();

  await page.getByRole("button", { name: "Preview & bagikan JPG" }).click();
  await expect(page.getByRole("heading", { name: "Slip gaji karyawan" })).toBeVisible();
  await expect(page.getByRole("img", { name: /Preview slip gaji/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Bagikan slip sebagai JPG" })).toBeVisible();
});
