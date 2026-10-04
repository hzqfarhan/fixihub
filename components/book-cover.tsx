"use client";
import { useState } from "react";
import type { Book } from "@/lib/types";

export function BookCover({
  book,
  small = false,
}: {
  book: Book;
  small?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showCover = Boolean(book.cover_image && failedSrc !== book.cover_image);

  return (
    <div
      className={"book-cover " + (small ? "small" : "")}
      style={{ "--cover": book.color } as React.CSSProperties}
    >
      {showCover ? (
        <img
          src={book.cover_image!}
          alt={`Kulit buku ${book.title}`}
          className="cover-img"
          loading="lazy"
          onError={() => setFailedSrc(book.cover_image || null)}
        />
      ) : (
        <>
          <span className="cover-edition">
            {book.provenance === "demo"
              ? "DEMO / FICTION"
              : "COVER UNAVAILABLE"}
          </span>
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
              FIXIHUB
              <br />
              DEMO
            </span>
          </span>
        </>
      )}
      <div className="book-spine" />
    </div>
  );
}
