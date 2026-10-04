import type { Book } from "@/lib/types";
export function BookCover({
  book,
  small = false,
}: {
  book: Book;
  small?: boolean;
}) {
  return (
    <div
      className={"book-cover " + (small ? "small" : "")}
      style={{ "--cover": book.color } as React.CSSProperties}
    >
      <span className="cover-edition">FICTION / MALAYSIA</span>
      <strong>{book.title}</strong>
      <div className="cover-art">
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
      <span className="cover-author">{book.author}</span>
      <span className="cover-mark">
        FH
        <span>
          ORIGINAL
          <br />
          DEMO COVER
        </span>
      </span>
      <div className="book-spine" />
    </div>
  );
}
