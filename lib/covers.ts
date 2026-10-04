import sources from "./cover-sources.json";
import type { Book } from "./types";

const same = (a: string, b: string) =>
  a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
export function coverSource(book: Book) {
  return sources.find(
    (s) =>
      book.provenance === "public_metadata" &&
      same(book.title, s.title) &&
      same(book.author, s.author),
  );
}
// Presentation assets are bundled, so both Supabase and older demo catalogs use
// the same verified artwork without changing orders or writing to the database.
export function withBookCover(book: Book): Book {
  const source = coverSource(book);
  if (source)
    return {
      ...book,
      cover_image: book.cover_image || source.path,
      source_url: source.sourcePage,
    };
  const demo =
    book.provenance === "demo" &&
    book.author === "Demo Editorial Collective" &&
    ["KOTA SELEPAS HUJAN", "CATATAN KOTA"].includes(book.title);
  return demo && !book.cover_image
    ? { ...book, cover_image: `/covers/${book.slug}.jpg` }
    : book;
}
