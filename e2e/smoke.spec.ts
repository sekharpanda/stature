import { expect, test } from "@playwright/test";

test.describe("public smoke", () => {
  test("homepage loads with brand and search", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Prowin/i);
    await expect(
      page.getByRole("link", { name: /Prowin Properties home/i }),
    ).toBeVisible();
    await expect(page.locator("button.hp-go")).toBeVisible();
  });

  test("properties listing loads", async ({ page }) => {
    await page.goto("/properties");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Properties/i,
    );
  });

  test("admin requires login", async ({ page }) => {
    const response = await page.goto("/admin");
    // Middleware should bounce unauthenticated users to login.
    await expect(page).toHaveURL(/\/login/);
    expect(response?.status() ?? 200).toBeLessThan(500);
  });

  test("lead capture endpoint accepts a valid payload", async ({ request }) => {
    const phone = `50${Date.now().toString().slice(-7)}`;
    const response = await request.post("/api/leads", {
      data: {
        name: "Playwright Smoke",
        phone,
        email: "smoke@example.com",
        leadSource: "e2e_smoke",
        landingPage: "/",
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.data?.id).toBeTruthy();
  });

  test("analytics endpoint accepts page views", async ({ request }) => {
    const response = await request.post("/api/analytics", {
      data: {
        type: "PAGE_VIEW",
        path: "/e2e-smoke",
        utmSource: "playwright",
      },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });
});
