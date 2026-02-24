import { test, expect } from "@playwright/test";

test.describe("Basic flow", () => {
  test("login, dashboard, today, admin", async ({ page }) => {
    await page.goto("/auth/login");

    await expect(page.getByRole("heading", { name: /Family Productivity/i })).toBeVisible();

    await page.getByLabel(/Family code/i).fill("demo");
    await page.getByLabel(/Password/i).fill("demo123");
    await page.getByRole("button", { name: /Sign in/i }).click();

    await expect(page).toHaveURL(/\//);
    await expect(page.getByRole("link", { name: /Dashboard/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Today/i })).toBeVisible();

    await page.getByRole("link", { name: /Today/i }).click();
    await expect(page).toHaveURL(/\/today/);
    await expect(page.getByRole("heading", { name: /Today/i })).toBeVisible();

    await page.getByRole("link", { name: /Admin/i }).click();
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole("heading", { name: /Admin Panel/i })).toBeVisible();
  });
});
