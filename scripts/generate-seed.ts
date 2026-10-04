import { writeFileSync } from "node:fs";
import { books, uid, initialData } from "../lib/seed";
const s = (v: string | null) =>
  v === null ? "null" : "'" + v.replaceAll("'", "''") + "'";
let sql =
  "-- Public title/author facts and explicitly invented demo commerce data. See docs/RESEARCH.md.\n";
sql +=
  "insert into publishers(id,name,website,established_year,source_url) values(" +
  s(uid(500)) +
  ",'Buku Fixi','https://fixi.com.my',2011,'https://www.mabopa.com.my/ms/ahli/buku-fixi') on conflict(id) do nothing;\n";
for (const b of books) {
  sql +=
    "insert into books(id,publisher_id,title,slug,price,stock,color,description,format,source_url,provenance) values(" +
    [
      s(b.id),
      s(uid(500)),
      s(b.title),
      s(b.slug),
      b.price,
      b.stock,
      s(b.color),
      s(b.description),
      s(b.format),
      s(b.source_url),
      s(b.provenance),
    ].join(",") +
    ") on conflict(id) do nothing;\n";
  sql +=
    "insert into authors(name) values(" +
    s(b.author) +
    ") on conflict(name) do nothing;\ninsert into categories(name) values(" +
    s(b.category) +
    ") on conflict(name) do nothing;\n";
  sql +=
    "insert into book_authors select " +
    s(b.id) +
    ",id from authors where name=" +
    s(b.author) +
    " on conflict do nothing;\ninsert into book_categories select " +
    s(b.id) +
    ",id from categories where name=" +
    s(b.category) +
    " on conflict do nothing;\n";
}
const c = initialData.campaigns[0];
sql +=
  "insert into preorder_campaigns(id,book_id,title,opens_at,closes_at,release_at,capacity) values(" +
  [
    s(c.id),
    s(c.book_id),
    s(c.title),
    s(c.opens_at),
    s(c.closes_at),
    s(c.release_at),
    c.capacity,
  ].join(",") +
  ") on conflict(id) do nothing;\n";
writeFileSync("supabase/seed.sql", sql);
