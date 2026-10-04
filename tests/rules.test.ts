import { test } from "node:test";
import assert from "node:assert/strict";
import { quote, receiptValid, balance, csvCell } from "../lib/rules";
import { books, initialData } from "../lib/seed";
test("mixed physical/digital checkout charges postage once", () => {
  const q = quote(
    [
      { book_id: books[0].id, quantity: 2 },
      { book_id: books[7].id, quantity: 1 },
    ],
    books,
    [],
  );
  assert.equal(q.book_total, 62);
  assert.equal(q.shipping_total, 8);
});
test("digital-only orders have no postage", () =>
  assert.equal(
    quote([{ book_id: books[7].id, quantity: 1 }], books, []).shipping_total,
    0,
  ));
test("rejects invalid quantities, duplicate lines and stock overselling", () => {
  for (const quantity of [-1, 0, 1.5, 11])
    assert.throws(() => quote([{ book_id: books[0].id, quantity }], books, []));
  assert.throws(() =>
    quote(
      [
        { book_id: books[0].id, quantity: 1 },
        { book_id: books[0].id, quantity: 1 },
      ],
      books,
      [],
    ),
  );
  assert.throws(() =>
    quote([{ book_id: books[6].id, quantity: 1 }], books, []),
  );
});
test("preorders obey windows and capacity", () => {
  const c = initialData.campaigns[0],
    cart = [{ book_id: books[6].id, quantity: 1, campaign_id: c.id }];
  assert.equal(
    quote(cart, books, [c], Date.parse("2026-10-04")).book_total,
    29,
  );
  assert.throws(() => quote(cart, books, [c], Date.parse("2029-01-01")));
  assert.throws(() =>
    quote(
      cart,
      books,
      [{ ...c, reserved: c.capacity }],
      Date.parse("2026-10-04"),
    ),
  );
});
test("receipt validation rejects unsafe types and oversize files", () => {
  assert.throws(() => receiptValid({ type: "text/html", size: 100 }));
  assert.throws(() =>
    receiptValid({ type: "image/png", size: 6 * 1024 * 1024 }),
  );
  assert.throws(() => receiptValid({ type: "image/png", size: 0 }));
  receiptValid({ type: "application/pdf", size: 100 });
});
test("CSV fields escape formula prefixes and quotation marks", () => {
  assert.equal(csvCell("=SUM(A1)"), '"\'=SUM(A1)"');
  assert.equal(csvCell('A"B'), '"A""B"');
});

test("digital quantity cannot duplicate an entitlement", () =>
  assert.throws(() =>
    quote([{ book_id: books[7].id, quantity: 2 }], books, []),
  ));
