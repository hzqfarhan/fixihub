"use client";
import { useEffect, useRef } from "react";
import { X, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { Book } from "@/lib/types";
import { money } from "@/lib/rules";
import { BookCover } from "./book-cover";
export function BookCard({ book }: { book: Book }) {
  return (
    <Link href={"/books/" + book.id} className="book-card">
      <div className="book-stage">
        <BookCover book={book} />
        <span className="card-arrow">
          <ArrowUpRight size={20} />
        </span>
        {book.format === "ebook" && <span className="format-badge">EBOOK</span>}
      </div>
      <div className="book-info">
        <span className="eyebrow">{book.category}</span>
        <h3>{book.title}</h3>
        <p>{book.author}</p>
        <div className="book-bottom">
          <strong>{money(book.price)}</strong>
          <span>
            {book.provenance === "demo" ? "Demo title" : "Public metadata"}
          </span>
        </div>
      </div>
    </Link>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Empty({
  title,
  text,
  href,
  label,
}: {
  title: string;
  text: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty">
      <div className="empty-symbol">↗</div>
      <h2>{title}</h2>
      <p>{text}</p>
      {href && (
        <Link className="button primary" href={href}>
          {label} <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <span className={"status " + value}>{value.replaceAll("_", " ")}</span>
  );
}
