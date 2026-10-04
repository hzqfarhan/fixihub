import { test } from "node:test";
import assert from "node:assert/strict";
import { books } from "../lib/seed";
import { withBookCover } from "../lib/covers";
test("covers hydrate database and saved demo rows without changing commerce data", () => {
  for (const book of books) {
    const row = { ...book, cover_image: null, stock: 17, price: 31 };
    const hydrated = withBookCover(row);
    assert.equal(hydrated.cover_image, book.cover_image);
    assert.equal(hydrated.stock, 17);
    assert.equal(hydrated.price, 31);
  }
});
test("cover identity requires both title and author and preserves custom artwork", () => {
  const first = books[0];
  assert.equal(
    withBookCover({ ...first, author: "Different author", cover_image: null })
      .cover_image,
    null,
  );
  assert.equal(
    withBookCover({ ...first, provenance: "demo", cover_image: null })
      .cover_image,
    null,
  );
  assert.equal(
    withBookCover({ ...first, cover_image: "/custom.jpg" }).cover_image,
    "/custom.jpg",
  );
});
