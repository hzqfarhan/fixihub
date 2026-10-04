"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  ShoppingBag,
  Sun,
  Moon,
  Menu,
  X,
  LayoutDashboard,
  Download,
} from "lucide-react";
import { useHub } from "./provider";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function Shell({ children }: { children: React.ReactNode }) {
  const h = useHub(),
    path = usePathname(),
    [dark, setDark] = useState(false),
    [menu, setMenu] = useState(false),
    [install, setInstall] = useState<InstallEvent | null>(null),
    [offline, setOffline] = useState(false);
  useEffect(() => {
    setDark(localStorage.getItem("fixihub-theme") === "dark");
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    const handler = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    const online = () => setOffline(!navigator.onLine);
    online();
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("online", online);
    window.addEventListener("offline", online);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", online);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => setMenu(false), [path]);
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <div className="topline">
        <span>INDEPENDENT STORIES. CONNECTED READERS.</span>
        <span>
          {h.demo ? "ACADEMIC DEMO · NO REAL PAYMENTS" : "ACADEMIC PROTOTYPE"}{" "}
          <span className="dot" />
        </span>
      </div>
      <header className="header">
        <Link className="brand" href="/" aria-label="FIXIHUB home">
          <img
            className="fixi-mark"
            src="/brand/buku-fixi-logo.jpg"
            alt="FIXI"
            width={58}
            height={58}
          />
          <span className="hub-lockup">
            <span className="hub-word">HUB</span>
            <span className="hub-caption">THE INDEPENDENT BOOKSHELF</span>
          </span>
        </Link>
        <nav className={menu ? "nav open" : "nav"} aria-label="Main navigation">
          {[
            ["/", "Discover"],
            ["/catalog", "All books"],
            ["/preorders", "Preorders"],
            ["/orders", "My orders"],
            ["/library", "My library"],
          ].map(([url, label]) => (
            <Link key={url} href={url} className={path === url ? "active" : ""}>
              {label}
              {label === "Preorders" && <span className="nav-dot" />}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="icon-button theme"
            onClick={() => {
              setDark(!dark);
              localStorage.setItem("fixihub-theme", dark ? "light" : "dark");
            }}
            aria-label={dark ? "Use light theme" : "Use dark theme"}
          >
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <Link className="account-link" href="/account">
            {h.profile?.display_name.split(" ")[0] || "Sign in"}{" "}
            <ArrowUpRight size={14} />
          </Link>
          <Link
            href="/cart"
            className="bag"
            aria-label={
              "Shopping bag, " +
              h.cart.reduce((s, i) => s + i.quantity, 0) +
              " items"
            }
          >
            <ShoppingBag size={18} />
            <span>{h.cart.reduce((s, i) => s + i.quantity, 0)}</span>
          </Link>
          <button
            aria-label="Toggle navigation"
            aria-expanded={menu}
            className="icon-button mobile-menu"
            onClick={() => setMenu(!menu)}
          >
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {offline && (
        <div className="notice">
          You’re offline. Reconnect to submit orders, receipts or account
          changes.
        </div>
      )}
      {h.error && (
        <div className="notice error" role="alert">
          {h.error}{" "}
          <button onClick={() => void h.refresh()}>Retry connection</button>
        </div>
      )}
      <main id="main">{children}</main>
      <footer>
        <div>
          <Link className="brand" href="/">
            <img
              className="fixi-mark"
              src="/brand/buku-fixi-logo.jpg"
              alt="FIXI"
              width={58}
              height={58}
            />
            <span className="hub-lockup">
              <span className="hub-word">HUB</span>
              <span className="hub-caption">THE INDEPENDENT BOOKSHELF</span>
            </span>
          </Link>
          <p>Good stories deserve a better home.</p>
          <small>
            Independent student project. Not affiliated with or endorsed by Buku
            FIXI.
            <br />
            FIXI logo credited to its owner. Independent academic prototype.
          </small>
        </div>
        <div className="footer-links">
          <Link href="/about">
            Project & sources <ArrowUpRight size={14} />
          </Link>
          <Link href="/admin">
            <LayoutDashboard size={15} /> Publisher workspace
          </Link>
          {h.demo && (
            <button onClick={h.switchDemo}>
              Switch to demo {h.profile?.role === "admin" ? "reader" : "admin"}
            </button>
          )}
          {install && (
            <button
              onClick={async () => {
                await install.prompt();
                await install.userChoice;
                setInstall(null);
              }}
            >
              <Download size={15} /> Install FIXIHUB
            </button>
          )}
        </div>
        <div className="footer-note">
          <BookOpen size={22} />
          <span>
            MADE FOR
            <br />
            THE NEXT CHAPTER.
          </span>
        </div>
      </footer>
      {h.toast && (
        <div className="toast" role="status">
          {h.toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => h.notify("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
