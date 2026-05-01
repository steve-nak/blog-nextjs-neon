# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: blog.spec.ts >> a logged-in user can create, edit, and delete a post
- Location: tests\e2e\blog.spec.ts:58:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Playwright post 1777627991713 updated')
Expected: visible
Error: strict mode violation: getByText('Playwright post 1777627991713 updated') resolved to 2 elements:
    1) <h1 class="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Playwright post 1777627991713 updated</h1> aka getByRole('heading', { name: 'Playwright post 1777627991713' })
    2) <div role="alert" aria-live="assertive" id="__next-route-announcer__">Playwright post 1777627991713 updated</div> aka locator('[id="__next-route-announcer__"]')

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Playwright post 1777627991713 updated')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - link "Blog System" [ref=e6] [cursor=pointer]:
            - /url: /
          - navigation [ref=e7]:
            - link "Posts" [ref=e8] [cursor=pointer]:
              - /url: /
            - link "Write" [ref=e9] [cursor=pointer]:
              - /url: /posts/new
            - link "Profile" [ref=e10] [cursor=pointer]:
              - /url: /profile
        - generic [ref=e11]:
          - generic [ref=e12]: steve@gmail.com
          - button "Log out" [ref=e13]
    - main [ref=e14]:
      - article [ref=e15]:
        - link "Back to posts" [ref=e16] [cursor=pointer]:
          - /url: /
        - generic [ref=e18]:
          - generic [ref=e19]:
            - paragraph [ref=e20]: By steve@gmail.com · 5/1/2026
            - heading "Playwright post 1777627991713 updated" [level=1] [ref=e21]
          - generic [ref=e23]:
            - link "Edit" [ref=e24] [cursor=pointer]:
              - /url: /posts/32/edit
            - button "Delete" [ref=e25]
        - paragraph [ref=e28]: Created by Playwright.
    - contentinfo [ref=e29]:
      - generic [ref=e30]:
        - paragraph [ref=e31]: Public reading, authenticated writing.
        - paragraph [ref=e32]: Powered by the shared Next.js API and UI app.
  - button "Open Next.js Dev Tools" [ref=e38] [cursor=pointer]:
    - img [ref=e39]
  - alert [ref=e42]: Playwright post 1777627991713 updated
```

# Test source

```ts
  1   | import "dotenv/config";
  2   | 
  3   | import { expect, test, type Page } from "@playwright/test";
  4   | 
  5   | import { seedDatabase as runSeedDatabase } from "../../scripts/seed";
  6   | 
  7   | const databaseUrl = process.env.TEST_DATABASE_URL;
  8   | 
  9   | if (!databaseUrl) {
  10  |   throw new Error("TEST_DATABASE_URL is required for Playwright tests.");
  11  | }
  12  | 
  13  | test.beforeEach(async () => {
  14  |   await runSeedDatabase(databaseUrl);
  15  | });
  16  | 
  17  | async function waitForHydration(page: Page) {
  18  |   await expect(page.getByText("Checking session...")).toBeHidden();
  19  | }
  20  | 
  21  | test("home page renders the expected number of posts", async ({ page }) => {
  22  |   await page.goto("/");
  23  | 
  24  |   await expect(page.getByText("Read from the community")).toBeVisible();
  25  |   await expect(page.locator("article")).toHaveCount(6);
  26  | });
  27  | 
  28  | test("register and login flow works", async ({ page }) => {
  29  |   const email = `playwright-${Date.now()}@example.com`;
  30  |   const password = "secret123";
  31  | 
  32  |   await page.goto("/register");
  33  |   await waitForHydration(page);
  34  |   await page.getByLabel("Email").fill(email);
  35  |   await page.getByLabel("Password").fill(password);
  36  |   await page.getByRole("button", { name: "Register" }).click();
  37  | 
  38  |   await expect(page).toHaveURL(/\/profile\??$/);
  39  |   await waitForHydration(page);
  40  |   await expect(page.getByRole("main").getByText(email, { exact: true })).toBeVisible();
  41  |   await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  42  | 
  43  |   await page.getByRole("button", { name: "Log out" }).click();
  44  |   await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
  45  | 
  46  |   await page.goto("/login");
  47  |   await waitForHydration(page);
  48  |   await page.getByLabel("Email").fill(email);
  49  |   await page.getByLabel("Password").fill(password);
  50  |   await page.getByRole("button", { name: "Log in" }).click();
  51  | 
  52  |   await expect(page).toHaveURL("/");
  53  |   await waitForHydration(page);
  54  |   await expect(page.getByRole("banner").getByText(email, { exact: true })).toBeVisible();
  55  |   await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  56  | });
  57  | 
  58  | test("a logged-in user can create, edit, and delete a post", async ({ page }) => {
  59  |   const createdTitle = `Playwright post ${Date.now()}`;
  60  |   const updatedTitle = `${createdTitle} updated`;
  61  | 
  62  |   await page.goto("/login");
  63  |   await waitForHydration(page);
  64  |   await page.getByLabel("Email").fill("steve@gmail.com");
  65  |   await page.getByLabel("Password").fill("pass123");
  66  |   await page.getByRole("button", { name: "Log in" }).click();
  67  |   await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();
  68  | 
  69  |   await page.goto("/posts/new");
  70  |   await waitForHydration(page);
  71  |   await page.getByLabel("Title").fill(createdTitle);
  72  |   await page.getByLabel("Content HTML").fill("<p>Created by Playwright.</p>");
  73  |   await page.getByRole("button", { name: "Publish post" }).click();
  74  | 
  75  |   await expect(page).toHaveURL(/\/posts\/\d+$/);
  76  |   await expect(page.getByRole("link", { name: "Edit" })).toBeVisible();
  77  |   await expect(page.getByRole("button", { name: "Delete" })).toBeVisible();
  78  |   await expect(page.getByText(createdTitle)).toBeVisible();
  79  | 
  80  |   await page.getByRole("link", { name: "Edit" }).click();
  81  |   await expect(page).toHaveURL(/\/posts\/\d+\/edit$/);
  82  |   await page.getByLabel("Title").fill(updatedTitle);
  83  |   await page.getByRole("button", { name: "Save changes" }).click();
  84  | 
  85  |   await expect(page).toHaveURL(/\/posts\/\d+$/);
> 86  |   await expect(page.getByText(updatedTitle)).toBeVisible();
      |                                              ^ Error: expect(locator).toBeVisible() failed
  87  | 
  88  |   page.once("dialog", (dialog) => dialog.accept());
  89  |   await page.getByRole("button", { name: "Delete" }).click();
  90  | 
  91  |   await expect(page).toHaveURL("/");
  92  |   await expect(page.getByText(updatedTitle)).toHaveCount(0);
  93  | });
  94  | 
  95  | test("a non-owner cannot see edit or delete on someone else's post", async ({ page }) => {
  96  |   await page.goto("/login");
  97  |   await waitForHydration(page);
  98  |   await page.getByLabel("Email").fill("maria@gmail.com");
  99  |   await page.getByLabel("Password").fill("pass123");
  100 |   await page.getByRole("button", { name: "Log in" }).click();
  101 | 
  102 |   await page.goto("/posts/1");
  103 | 
  104 |   await expect(page.getByRole("link", { name: "Edit" })).toHaveCount(0);
  105 |   await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
  106 | });
```