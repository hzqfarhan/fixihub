import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
const id = (n: number) =>
  "00000000-0000-4000-8000-" + String(n).padStart(12, "0");
test("storefront, filtering, theme, responsive layouts and original 3D", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Cerita tanpa/ }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible({ timeout: 20000 });
  await page.screenshot({
    path: "../../work/home-desktop.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "All books", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search titles or authors" })
    .fill("Nadia");
  await expect(page.locator(".book-card")).toHaveCount(1);
  await expect(page.locator(".book-card h3")).toHaveText("GANTUNG:3");
  await page.getByRole("button", { name: "Use dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: "../../work/catalog-dark.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const route of [
    "/",
    "/catalog",
    "/preorders",
    "/books/" + id(1),
    "/cart",
    "/orders",
    "/account",
    "/library",
    "/about",
    "/admin",
  ]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
  }
  await page.goto("/");
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.getByRole("button", { name: "Use light theme" }).click();
  await page.screenshot({ path: "../../work/home-mobile.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("checkout, separate receipt review, shipping and ebook access", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const n of [1, 8]) {
    await page.goto("/books/" + id(n));
    await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  }
  await page.goto("/cart");
  await page
    .getByLabel("Full delivery address")
    .fill("Demo Reader, 123 Jalan Contoh, 50000 Kuala Lumpur, Malaysia");
  await expect(page.locator(".summary-line.total")).toContainText("45.00");
  await page.getByRole("button", { name: "Place order", exact: true }).click();
  await expect(page).toHaveURL(/\/orders/);
  await expect(page.locator(".order-card")).toHaveCount(1);
  const png = readFileSync("public/icons/icon-192.png");
  for (const kind of ["book", "postage"]) {
    const cell = page.locator(".payment-cell").filter({
      hasText: kind === "book" ? "Book payment" : "Postage payment",
    });
    await cell.getByRole("button", { name: "Upload receipt" }).click();
    await page.getByLabel("Receipt file").setInputFiles({
      name: "demo-receipt.png",
      mimeType: "image/png",
      buffer: png,
    });
    await page.getByRole("button", { name: "Submit for review" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await page
    .getByRole("button", { name: "Switch to demo admin", exact: true })
    .click();
  await page.goto("/admin");
  await page.getByRole("button", { name: /Payment review/ }).click();
  for (let i = 0; i < 2; i++) {
    await page
      .getByRole("button", { name: "Review ↗", exact: true })
      .first()
      .click();
    await page.getByRole("button", { name: /Load private receipt/ }).click();
    await expect(
      page.getByRole("link", { name: /Open receipt/ }),
    ).toBeVisible();
    await page
      .getByLabel("Review note / rejection reason")
      .fill("Demo bank record checked.");
    await page
      .getByRole("button", { name: "Verify payment", exact: true })
      .click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Orders", exact: true }).click();
  await page.getByRole("button", { name: /Manage order/ }).click();
  await page.getByLabel("Tracking number").fill("DEMO-TRACK-001");
  await page.getByRole("button", { name: "Mark as shipped" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: /Manage order/ }).click();
  await page.getByRole("button", { name: "Confirm delivered" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("tbody")).toContainText("completed");
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.screenshot({
    path: "../../work/admin-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Switch to demo reader", exact: true })
    .click();
  await page.goto("/library");
  await expect(
    page.getByRole("heading", { name: "CATATAN KOTA" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Check access" }).click();
  await expect(page.locator(".library-grid")).toContainText(
    "1 access checks recorded",
  );
  await page.reload();
  await expect(page.locator(".library-grid")).toContainText(
    "1 access checks recorded",
  );
});
test("publisher catalog and campaign CRUD, CSV export, PWA manifest", async ({
  page,
}) => {
  await page.goto("/admin");
  await page
    .getByRole("button", { name: /Enter demo publisher workspace/ })
    .click();
  await page.getByRole("button", { name: "Catalog", exact: true }).click();
  await page.getByRole("button", { name: "Add book", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title", { exact: true }).fill("TEST CHAPTER");
  await dialog.getByLabel("Author", { exact: true }).fill("Demo Test Author");
  await dialog
    .getByLabel("Description", { exact: true })
    .fill("An invented title for testing.");
  await dialog.getByRole("button", { name: "Save book", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("tbody")).toContainText("TEST CHAPTER");
  await page.getByRole("button", { name: "Preorders", exact: true }).click();
  await page.getByRole("button", { name: "New campaign", exact: true }).click();
  await page.getByLabel("Campaign name").fill("Test first edition");
  await page
    .getByRole("combobox", { name: "Book", exact: true })
    .selectOption({ label: "TEST CHAPTER" });
  await page.getByRole("button", { name: "Save campaign" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(".admin-campaigns")).toContainText(
    "Test first edition",
  );
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export report" }).click();
  expect((await download).suggestedFilename()).toBe("fixihub-order-report.csv");
  const manifest = await (
    await page.request.get("/manifest.webmanifest")
  ).json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.length).toBe(2);
  for (const icon of manifest.icons)
    expect((await page.request.get(icon.src)).ok()).toBeTruthy();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    return (
      await Promise.all(
        names.map(async (name) =>
          (await (await caches.open(name)).keys()).map(
            (r) => new URL(r.url).pathname,
          ),
        ),
      )
    ).flat();
  });
  expect(cached).not.toContain("/admin");
  expect(cached).not.toContain("/orders");
  expect(cached).toContain("/offline.html");
});
