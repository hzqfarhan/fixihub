"use client";
import dynamic from "next/dynamic";
import { Component, useEffect, useState } from "react";
import { Rotate3D } from "lucide-react";
import type { Book } from "@/lib/types";
import { BookCover } from "./book-cover";
const Scene = dynamic(() => import("./scene"), { ssr: false });
class Guard extends Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
export function Viewer({ book, hero = false }: { book: Book; hero?: boolean }) {
  const [enabled, setEnabled] = useState(false),
    [supported, setSupported] = useState(false);
  useEffect(() => {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    setSupported(!!gl);
    if (gl) gl.getExtension("WEBGL_lose_context")?.loseContext();
    setEnabled(
      !!gl &&
        window.innerWidth >= 768 &&
        !matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);
  const fallback = (
    <div className="viewer-fallback">
      <BookCover book={book} />
    </div>
  );
  return (
    <div
      className={"viewer " + (hero ? "hero-viewer" : "")}
      role="group"
      aria-label={"Interactive book cover for " + book.title}
    >
      <Guard fallback={fallback}>
        {enabled ? (
          <Scene
            book={book}
            hero={
              hero && !matchMedia("(prefers-reduced-motion: reduce)").matches
            }
          />
        ) : (
          fallback
        )}
      </Guard>
      <div className="viewer-caption">
        {enabled ? (
          <>
            <Rotate3D size={15} /> Drag to explore · original demo artwork
          </>
        ) : supported ? (
          <button onClick={() => setEnabled(true)}>
            <Rotate3D size={15} /> Enable interactive 3D
          </button>
        ) : (
          <span>Original demo cover</span>
        )}
      </div>
    </div>
  );
}
