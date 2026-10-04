import { test, expect } from "@playwright/test";
import { initialData } from "../../lib/seed";

test("all real covers load from a saved pre-cover catalog and have correct provenance", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(
    (data) => {
      if (!localStorage.getItem("fixihub-demo-v1"))
        localStorage.setItem("fixihub-demo-v1", JSON.stringify(data));
    },
    {
      ...initialData,
      books: initialData.books.map(({ cover_image, ...book }) => book),
    },
  );
  await page.goto("/catalog");
  for (const book of initialData.books.filter(
    (b) => b.provenance === "public_metadata",
  )) {
    const cover = page.getByAltText(`Kulit buku ${book.title}`, {
      exact: true,
    });
    await cover.scrollIntoViewIfNeeded();
    await expect(cover).toHaveAttribute("src", book.cover_image!);
    await expect
      .poll(() => cover.evaluate((el) => (el as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(100);
  }
  await page.screenshot({
    path: "../../work/catalog-real-covers.png",
    fullPage: true,
  });
  await page.goto(`/books/${initialData.books[0].id}`);
  await expect(
    page.getByText("Published book cover", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View public source" }),
  ).toHaveAttribute("href", initialData.books[0].source_url!);
  await page.goto(`/books/${initialData.books[6].id}`);
  await expect(
    page.getByText("Original demo artwork", { exact: true }),
  ).toBeVisible();
});
