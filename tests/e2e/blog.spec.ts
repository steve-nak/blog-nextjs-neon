import "dotenv/config";

import { expect, test, type Page } from "@playwright/test";

import { seedDatabase as runSeedDatabase } from "../../scripts/seed";

const databaseUrl = process.env.TEST_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("TEST_DATABASE_URL is required for Playwright tests.");
}

test.beforeEach(async () => {
  await runSeedDatabase(databaseUrl);
});

async function waitForHydration(page: Page) {
  await expect(page.getByText("Checking session...")).toBeHidden();
}

test("home page renders the expected number of posts", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Read from the community")).toBeVisible();
  await expect(page.locator("article")).toHaveCount(6);
});

test("register and login flow works", async ({ page }) => {
  const email = `playwright-${Date.now()}@example.com`;
  const password = "secret123";

  await page.goto("/register");
  await waitForHydration(page);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Register" }).click();

  await expect(page).toHaveURL(/\/profile\??$/);
  await waitForHydration(page);
  await expect(page.getByRole("main").getByText(email, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();

  await page.goto("/login");
  await waitForHydration(page);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();

  await expect(page).toHaveURL("/");
  await waitForHydration(page);
  await expect(page.getByRole("banner").getByText(email, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
});

test("a logged-in user can create, edit, and delete a post", async ({ page }) => {
  const createdTitle = `Playwright post ${Date.now()}`;
  const updatedTitle = `${createdTitle} updated`;

  await page.goto("/login");
  await waitForHydration(page);
  await page.getByLabel("Email").fill("steve@gmail.com");
  await page.getByLabel("Password").fill("pass123");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();

  await page.goto("/posts/new");
  await waitForHydration(page);
  await page.getByLabel("Title").fill(createdTitle);
  await page.getByLabel("Content HTML").fill("<p>Created by Playwright.</p>");
  await page.getByRole("button", { name: "Publish post" }).click();

  await expect(page).toHaveURL(/\/posts\/\d+$/);
  await expect(page.getByRole("link", { name: "Edit" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  await expect(page.getByText(createdTitle)).toBeVisible();

  await page.getByRole("link", { name: "Edit" }).click();
  await expect(page).toHaveURL(/\/posts\/\d+\/edit$/);
  await page.getByLabel("Title").fill(updatedTitle);
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page).toHaveURL(/\/posts\/\d+$/);
  await expect(page.getByText(updatedTitle)).toBeVisible();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page).toHaveURL("/");
  await expect(page.getByText(updatedTitle)).toHaveCount(0);
});

test("a non-owner cannot see edit or delete on someone else's post", async ({ page }) => {
  await page.goto("/login");
  await waitForHydration(page);
  await page.getByLabel("Email").fill("maria@gmail.com");
  await page.getByLabel("Password").fill("pass123");
  await page.getByRole("button", { name: "Log in" }).click();

  await page.goto("/posts/1");

  await expect(page.getByRole("link", { name: "Edit" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
});