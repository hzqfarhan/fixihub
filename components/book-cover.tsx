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
  const [imgError, setImgError] = useState(false);
  const showCover = Boolean(book.cover_image && !imgError);

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
          onError={() => setImgError(true)}
        />
      ) : (
        <>
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
              BUKU
              <br />
              FIXI
            </span>
          </span>
        </>
      )}
      <div className="book-spine" />
    </div>
  );
}
