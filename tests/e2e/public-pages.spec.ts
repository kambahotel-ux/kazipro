import { expect, test } from "@playwright/test";

test.describe("Auth pages", () => {
  test("login page shows form and forgot password link", async ({ page }) => {
    await page.goto("/connexion");
    await expect(page.getByRole("heading", { name: /bon retour/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /mot de passe oublié/i })).toBeVisible();
  });

  test("forgot password page", async ({ page }) => {
    await page.goto("/mot-de-passe-oublie");
    await expect(page.getByRole("heading", { name: /mot de passe oublié/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /envoyer/i })).toBeVisible();
  });
});

test.describe("Public pages", () => {
  test("home page renders CTA", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /commencer/i })).toBeVisible();
  });

  test("services page lists service cards", async ({ page }) => {
    await page.goto("/services");
    await expect(page.getByRole("heading", { name: /services/i })).toBeVisible();
  });
});
