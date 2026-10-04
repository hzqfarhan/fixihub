"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
  Plus,
  Minus,
  Trash2,
  Package,
  ShieldCheck,
  Truck,
  BookOpen,
  Upload,
  Check,
  Clock,
  Download,
} from "lucide-react";
import { useHub } from "./provider";
import { BookCard, Empty, Modal, Status } from "./ui";
import { BookCover } from "./book-cover";
import { Viewer } from "./viewer";
import { balance, isOpen, money, quote } from "@/lib/rules";
import { Book, Order } from "@/lib/types";
const date = (s: string) =>
  new Date(s).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  });
export function Home() {
  const h = useHub(),
    books = h.data.books.filter((b) => b.active);
  if (!h.ready)
    return <div className="page section">Loading the bookshelf...</div>;
  if (!books.length)
    return (
      <Empty
        title="The bookshelf is being prepared."
        text="No active titles are available. Please check back after the catalog is populated."
        href="/about"
        label="About FIXIHUB"
      />
    );
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="mini-line" /> THE INDEPENDENT BOOKSHELF
          </div>
          <h1>
            Out of the ordinary.
            <br />
            <em>Into your hands.</em>
          </h1>
          <p>
            Unfamiliar worlds. Unforgettable voices.
            <br />
            Find your next Malaysian read, right here.
          </p>
          <div className="hero-buttons">
            <Link className="button primary" href="/catalog">
              Explore the books <ArrowUpRight size={18} />
            </Link>
            <Link className="text-link" href="/preorders">
              Get there first <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-foot">
            <span className="round-star">✳</span>
            <span>
              LOCAL VOICES.
              <br />
              <b>LIMITLESS IMAGINATION.</b>
            </span>
          </div>
        </div>
        <div className="hero-art">
          <span className="orbit-text">
            A NEW PERSPECTIVE ON YOUR NEXT READ
          </span>
          <div className="hero-orbit" />
          <Viewer book={books[0] || h.data.books[0]} hero />
          <span className="edition-pill">THE FIXIHUB EDIT / 01</span>
        </div>
      </section>
      <div className="value-strip">
        <span>
          <BookOpen size={17} /> Malaysian stories, in one place
        </span>
        <span>
          <ShieldCheck size={17} /> Track every payment
        </span>
        <span>
          <Package size={17} /> Orders with a clear next step
        </span>
        <span className="strip-note">
          YOUR NEXT CHAPTER STARTS HERE <ArrowDownIcon />
        </span>
      </div>
      <section className="section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">PICK YOUR NEXT OBSESSION</span>
            <h2>Off the shelf. Into your world.</h2>
          </div>
          <Link className="text-link" href="/catalog">
            Browse all books <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="book-grid">
          {books.slice(0, 4).map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      </section>
      <section className="preorder-banner">
        <div>
          <span className="eyebrow">BE PART OF THE FIRST CHAPTER</span>
          <h2>
            Some stories are
            <br />
            worth the wait.
          </h2>
          <p>
            Reserve a copy. Follow its journey.
            <br />
            Keep book and postage payments in one place.
          </p>
          <Link href="/preorders" className="button primary">
            Discover preorders <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="banner-art">
          <span>
            COMING
            <br />
            <i>SOON.</i>
          </span>
          <div className="banner-circle">
            FIRST
            <br />
            EDITION
            <br />↗
          </div>
        </div>
      </section>
    </div>
  );
}
function ArrowDownIcon() {
  return <span aria-hidden="true">↓</span>;
}
export function Catalog() {
  const h = useHub(),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("All books"),
    [sort, setSort] = useState("featured");
  const categories = [
    "All books",
    ...new Set(h.data.books.filter((b) => b.active).map((b) => b.category)),
  ];
  const books = useMemo(
    () =>
      h.data.books
        .filter(
          (b) =>
            b.active &&
            (category === "All books" || b.category === category) &&
            (b.title + " " + b.author)
              .toLowerCase()
              .includes(search.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "low"
            ? a.price - b.price
            : sort === "az"
              ? a.title.localeCompare(b.title)
              : 0,
        ),
    [h.data.books, category, search, sort],
  );
  return (
    <div className="page section">
      <div className="page-intro">
        <span className="eyebrow">THE CATALOG</span>
        <h1>A shelf less ordinary.</h1>
        <p>Follow your curiosity. Find a story that stays.</p>
      </div>
      <div className="catalog-tools">
        <label className="search-field">
          <Search size={19} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles or authors"
            aria-label="Search titles or authors"
          />
        </label>
        <label className="sort">
          <SlidersHorizontal size={17} />
          <select
            aria-label="Sort books"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="az">Title: A–Z</option>
          </select>
        </label>
      </div>
      <div className="filter-row">
        {categories.map((c) => (
          <button
            className={c === category ? "chip selected" : "chip"}
            key={c}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
        <span>{books.length} books</span>
      </div>
      {books.length ? (
        <div className="book-grid">
          {books.map((b) => (
            <BookCard book={b} key={b.id} />
          ))}
        </div>
      ) : (
        <Empty
          title="No stories found."
          text="Try another title, author or category."
        />
      )}
      <p className="fineprint">
        All prices and availability are demo values. Public title/author
        metadata is credited on each book page.
      </p>
    </div>
  );
}
export function Product({ id }: { id: string }) {
  const h = useHub(),
    b = h.data.books.find((b) => b.id === id && b.active);
  if (!h.ready) return <div className="page section">Loading book…</div>;
  if (!b)
    return (
      <Empty
        title="Book not found"
        text="This title may have been archived."
        href="/catalog"
        label="Back to catalog"
      />
    );
  const c = h.data.campaigns.find((c) => c.book_id === b.id && isOpen(c));
  return (
    <div className="page section">
      <div className="breadcrumbs">
        <Link href="/catalog">All books</Link>
        <span>/</span>
        {b.title}
      </div>
      <div className="product-grid">
        <div className="product-art">
          <Viewer book={b} />
        </div>
        <div className="product-copy">
          <span className="eyebrow">
            {b.category} ·{" "}
            {b.format === "ebook" ? "DIGITAL EDITION" : "PAPERBACK"}
          </span>
          <h1>{b.title}</h1>
          <p className="author">by {b.author}</p>
          <div className="product-price">
            {money(b.price)} <small>Demo price</small>
          </div>
          <p>{b.description}</p>
          <button
            className="button primary wide"
            disabled={!c && b.format === "physical" && b.stock === 0}
            onClick={() => h.add(b, c)}
          >
            {c ? "Reserve a copy" : "Add to bag"} <Plus size={18} />
          </button>
          <div className="product-details">
            <div>
              <span>Availability</span>
              <b>
                {c
                  ? "Open for preorder"
                  : b.format === "ebook"
                    ? "Entitlement record only"
                    : b.stock + " demo copies"}
              </b>
            </div>
            <div>
              <span>Postage</span>
              <b>
                {b.format === "ebook"
                  ? "Not required"
                  : "RM8 / order · paid separately"}
              </b>
            </div>
            <div>
              <span>Artwork</span>
              <b>Original placeholder cover</b>
            </div>
          </div>
          <div className="source-box">
            <ShieldCheck size={20} />
            <div>
              <b>
                {b.provenance === "public_metadata"
                  ? "Public title & author metadata"
                  : "Invented demonstration title"}
              </b>
              <p>
                Prices, stock, categories and cover designs are demo data. No
                copyrighted ebook files are included.
              </p>
              {b.source_url && (
                <a href={b.source_url} target="_blank" rel="noreferrer">
                  View public source <ArrowUpRight size={13} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export function Preorders() {
  const h = useHub();
  return (
    <div className="page section">
      <div className="page-intro">
        <span className="eyebrow">THE NEXT CHAPTER</span>
        <h1>Good things are on their way.</h1>
        <p>
          Reserve your place in the first print run. Campaigns shown here are
          invented demos.
        </p>
      </div>
      <div className="campaign-list">
        {h.data.campaigns
          .filter((c) => c.active)
          .map((c) => {
            const b = h.data.books.find((b) => b.id === c.book_id);
            if (!b) return null;
            return (
              <article className="campaign-card" key={c.id}>
                <div className="campaign-art">
                  <BookCover book={b} />
                </div>
                <div>
                  <Status value={isOpen(c) ? "open" : "closed"} />
                  <h2>{c.title}</h2>
                  <p>{b.description}</p>
                  <div className="campaign-stats">
                    <div>
                      <span>Closes</span>
                      <b>{date(c.closes_at)}</b>
                    </div>
                    <div>
                      <span>Estimated release</span>
                      <b>{date(c.release_at)}</b>
                    </div>
                    <div>
                      <span>Reserved</span>
                      <b>
                        {c.reserved} / {c.capacity}
                      </b>
                    </div>
                  </div>
                  <progress
                    value={c.reserved}
                    max={c.capacity}
                    aria-label="Copies reserved"
                  />
                  <div className="campaign-action">
                    <strong>{money(b.price)}</strong>
                    <button
                      className="button primary"
                      disabled={!isOpen(c) || c.reserved >= c.capacity}
                      onClick={() => h.add(b, c)}
                    >
                      Reserve your copy <ArrowUpRight size={17} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
      </div>
    </div>
  );
}
export function Cart() {
  const h = useHub(),
    router = useRouter(),
    [address, setAddress] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [key] = useState(() => crypto.randomUUID());
  let q: ReturnType<typeof quote> | null = null,
    quoteError = "";
  try {
    if (h.cart.length) q = quote(h.cart, h.data.books, h.data.campaigns);
  } catch (e) {
    quoteError = (e as Error).message;
  }
  if (!h.cart.length)
    return (
      <div className="page section">
        <Empty
          title="Your next chapter is waiting."
          text="Add a book to your bag and make it yours."
          href="/catalog"
          label="Explore the books"
        />
      </div>
    );
  return (
    <div className="page section">
      <div className="page-intro">
        <span className="eyebrow">YOUR READING STACK</span>
        <h1>The bag.</h1>
      </div>
      <div className="checkout-grid">
        <div>
          {h.cart.map((i) => {
            const b = h.data.books.find((b) => b.id === i.book_id);
            return (
              <div className="cart-line" key={i.book_id}>
                {b && <BookCover book={b} small />}
                <div>
                  <h3>{b?.title || "Unavailable book"}</h3>
                  <p>{b?.author}</p>
                  <Status
                    value={
                      i.campaign_id ? "preorder" : b?.format || "unavailable"
                    }
                  />
                  <div className="quantity">
                    <button
                      aria-label={"Decrease quantity of " + b?.title}
                      onClick={() =>
                        h.setCart((p) =>
                          p.map((x) =>
                            x.book_id === i.book_id
                              ? { ...x, quantity: Math.max(1, x.quantity - 1) }
                              : x,
                          ),
                        )
                      }
                    >
                      <Minus size={14} />
                    </button>
                    <span>{i.quantity}</span>
                    <button
                      aria-label={"Increase quantity of " + b?.title}
                      onClick={() =>
                        h.setCart((p) =>
                          p.map((x) =>
                            x.book_id === i.book_id
                              ? {
                                  ...x,
                                  quantity: Math.min(
                                    b?.format === "ebook" ? 1 : 10,
                                    x.quantity + 1,
                                  ),
                                }
                              : x,
                          ),
                        )
                      }
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="cart-line-end">
                  <strong>{money((b?.price || 0) * i.quantity)}</strong>
                  <button
                    className="icon-button"
                    aria-label={"Remove " + b?.title}
                    onClick={() =>
                      h.setCart((p) => p.filter((x) => x.book_id !== i.book_id))
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
          <Link className="text-link" href="/catalog">
            ← Keep exploring
          </Link>
        </div>
        <form
          className="panel checkout-summary"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!navigator.onLine) {
              setError("Reconnect before placing an order.");
              return;
            }
            setBusy(true);
            setError("");
            try {
              await h.placeOrder(address, key);
              router.push("/orders");
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>A little closer to yours.</h2>
          <div className="summary-line">
            <span>Books</span>
            <b>{money(q?.book_total || 0)}</b>
          </div>
          <div className="summary-line">
            <span>Postage · paid separately</span>
            <b>{money(q?.shipping_total || 0)}</b>
          </div>
          <div className="summary-line total">
            <span>Total</span>
            <b>{money((q?.book_total || 0) + (q?.shipping_total || 0))}</b>
          </div>
          {!!q?.shipping_total && (
            <label>
              Full delivery address
              <textarea
                required
                minLength={12}
                maxLength={1000}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Recipient, street, postcode, city, state, Malaysia"
              />
            </label>
          )}
          <p className="fineprint">
            {h.demo
              ? "Demo checkout: no money is collected."
              : "Place your order, then upload your book and postage receipts. Confirm transfer instructions directly with the project operator."}
          </p>
          {!h.profile && (
            <Link href="/account" className="text-link">
              Sign in to continue →
            </Link>
          )}
          {(error || quoteError) && (
            <p className="form-error" role="alert">
              {error || quoteError}
            </p>
          )}
          <button
            className="button primary wide"
            disabled={busy || !q || !h.profile}
          >
            {busy ? "Placing order…" : "Place order"} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
export function Orders() {
  const h = useHub(),
    [upload, setUpload] = useState<{
      o: Order;
      kind: "book" | "shipping";
    } | null>(null),
    [file, setFile] = useState<File | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const orders = h.data.orders.filter((o) => o.customer_id === h.profile?.id);
  if (!h.ready) return <div className="page section">Loading orders…</div>;
  return (
    <div className="page section">
      <div className="page-intro">
        <span className="eyebrow">YOUR READING JOURNEY</span>
        <h1>Every chapter, accounted for.</h1>
        <p>One order. A clear view of books, payments and postage.</p>
      </div>
      {!h.profile ? (
        <Empty
          title="Your orders live here."
          text="Sign in to view your order history."
          href="/account"
          label="Sign in"
        />
      ) : !orders.length ? (
        <Empty
          title="Your first story starts here."
          text="Orders and payment updates will appear here."
          href="/catalog"
          label="Find a book"
        />
      ) : (
        <div className="order-list">
          {orders.map((o) => (
            <article className="panel order-card" key={o.id}>
              <div className="order-top">
                <div>
                  <span className="eyebrow">
                    ORDER / {o.id.slice(0, 8).toUpperCase()}
                  </span>
                  <p>{date(o.created_at)}</p>
                </div>
                <Status value={o.status} />
              </div>
              {o.items.map((i) => (
                <div className="order-item" key={i.book_id}>
                  <div>
                    <h3>{i.title}</h3>
                    <small>
                      {i.quantity} × {money(i.unit_price)} · {i.format}
                      {i.campaign_id ? " · preorder" : ""}
                    </small>
                  </div>
                  <strong>{money(i.unit_price * i.quantity)}</strong>
                </div>
              ))}
              <div className="payment-grid">
                {(["book", "shipping"] as const).map((kind) => {
                  const amount =
                    kind === "book" ? o.book_total : o.shipping_total;
                  const latest = h.data.payments
                    .filter((p) => p.order_id === o.id && p.kind === kind)
                    .at(-1);
                  return (
                    <div className="payment-cell" key={kind}>
                      <span>
                        {kind === "book" ? (
                          <BookOpen size={18} />
                        ) : (
                          <Truck size={18} />
                        )}{" "}
                        {kind === "book" ? "Book payment" : "Postage payment"}
                      </span>
                      <strong>{money(amount)}</strong>
                      <Status
                        value={
                          amount === 0
                            ? "not_required"
                            : latest?.status || "awaiting_receipt"
                        }
                      />
                      {latest?.note && <p>{latest.note}</p>}
                      {amount > 0 &&
                        (!latest || latest.status === "rejected") && (
                          <button
                            className="text-link"
                            onClick={() => {
                              setUpload({ o, kind });
                              setFile(null);
                              setError("");
                            }}
                          >
                            <Upload size={14} /> Upload receipt
                          </button>
                        )}
                    </div>
                  );
                })}
              </div>
              {o.tracking_number && (
                <p className="tracking">
                  <Truck size={16} /> Tracking: <b>{o.tracking_number}</b>
                </p>
              )}
              <p className="fineprint">
                {o.address || "Digital order · no delivery address required"}
              </p>
            </article>
          ))}
        </div>
      )}
      {upload && (
        <Modal
          title={
            "Upload " +
            (upload.kind === "book" ? "book" : "postage") +
            " receipt"
          }
          onClose={() => !busy && setUpload(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!file) return;
              setBusy(true);
              try {
                await h.upload(upload.o.id, upload.kind, file);
                setUpload(null);
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <p>
              Order {upload.o.id.slice(0, 8)} ·{" "}
              {money(
                upload.kind === "book"
                  ? upload.o.book_total
                  : upload.o.shipping_total,
              )}
            </p>
            <label className="upload-zone">
              <Upload />
              <strong>Choose a payment receipt</strong>
              <span>JPG, PNG or PDF · up to 5 MB</span>
              <input
                aria-label="Receipt file"
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            {h.demo && (
              <p className="fineprint">
                Demo files stay on this device. Use a fictional receipt without
                personal banking details.
              </p>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary wide" disabled={busy}>
              {busy ? "Uploading…" : "Submit for review"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
export function Library() {
  const h = useHub();
  return (
    <div className="page section">
      <div className="page-intro">
        <span className="eyebrow">YOURS TO KEEP TRACK OF</span>
        <h1>Your digital bookshelf.</h1>
        <p>Ebook entitlements appear after book payment is verified.</p>
      </div>
      {!h.data.entitlements.filter((e) => e.customer_id === h.profile?.id)
        .length ? (
        <Empty
          title="Room for a new story."
          text="This prototype records digital access. It does not distribute copyrighted ebook files."
          href="/catalog"
          label="Explore catalog"
        />
      ) : (
        <div className="library-grid">
          {h.data.entitlements
            .filter((e) => e.customer_id === h.profile?.id)
            .map((e) => (
              <article className="panel" key={e.id}>
                <BookOpen size={28} />
                <Status value={e.active ? "active" : "revoked"} />
                <h2>{e.title}</h2>
                <p>Granted {date(e.created_at)}</p>
                <p className="fineprint">
                  {
                    h.data.access.filter((a) => a.entitlement_id === e.id)
                      .length
                  }{" "}
                  access checks recorded · no licensed file attached.
                </p>
                <button
                  className="button secondary"
                  disabled={!e.active}
                  onClick={() =>
                    h.access(e.id).catch((e) => h.notify(e.message))
                  }
                >
                  <ShieldCheck size={16} /> Check access
                </button>
              </article>
            ))}
        </div>
      )}
    </div>
  );
}
export function Account() {
  const h = useHub(),
    [signup, setSignup] = useState(false),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [name, setName] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="page section account-page">
      <div className="account-story">
        <span className="eyebrow">A PLACE FOR YOUR STORIES</span>
        <h1>
          One account.
          <br />
          Every chapter.
        </h1>
        <p>
          Your books, preorders, receipts and digital library.
          <br />
          All connected, all yours.
        </p>
        <div className="account-glyph">
          fh<span>↗</span>
        </div>
      </div>
      <div className="panel account-form">
        {h.profile ? (
          <>
            <span className="eyebrow">MY ACCOUNT</span>
            <h2>Hello, {h.profile.display_name}.</h2>
            <Status value={h.profile.role} />
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                try {
                  await h.updateName(name);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                Display name
                <input
                  required
                  maxLength={100}
                  value={name}
                  placeholder={h.profile.display_name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <button disabled={busy} className="button secondary">
                Save profile
              </button>
            </form>
            <div className="account-links">
              <Link href="/orders">
                My orders <ArrowRight size={16} />
              </Link>
              <Link href="/library">
                My library <ArrowRight size={16} />
              </Link>
              {h.profile.role === "admin" && (
                <Link href="/admin">
                  Publisher workspace <ArrowRight size={16} />
                </Link>
              )}
            </div>
            <button
              className="text-link"
              onClick={() => h.logout().catch((e) => setError(e.message))}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <h2>{signup ? "Start a new chapter." : "Welcome back."}</h2>
            <p>
              {h.demo
                ? "This is a local demo account. No real account is created."
                : "Sign in to keep every order connected."}
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                try {
                  await h.auth(email, password, signup ? name : undefined);
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {signup && (
                <label>
                  Your name
                  <input
                    required
                    maxLength={100}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                  />
                </label>
              )}
              <label>
                Email address
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete={signup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button className="button primary wide" disabled={busy}>
                {busy ? "Please wait…" : signup ? "Create account" : "Sign in"}{" "}
                <ArrowRight size={16} />
              </button>
            </form>
            <button className="text-link" onClick={() => setSignup(!signup)}>
              {signup
                ? "Already a reader? Sign in"
                : "New here? Create an account"}
            </button>
          </>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {h.demo && (
          <div className="source-box">
            <p>Academic demo · data stays in this browser.</p>
            <button className="text-link" onClick={h.switchDemo}>
              Switch demo role
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
export function About() {
  return (
    <div className="page section prose">
      <span className="eyebrow">BEHIND FIXIHUB</span>
      <h1>
        Real inspiration.
        <br />
        Clear boundaries.
      </h1>
      <p>
        FIXIHUB is an independent BIK11003 academic prototype for publisher
        order and preorder management. It is not an official Buku FIXI service.
      </p>
      <h2>What is public information?</h2>
      <p>
        Buku Fixi’s name, establishment year (2011), and focus on Malay and
        English fiction are supported by the{" "}
        <a
          href="https://www.mabopa.com.my/ms/ahli/buku-fixi"
          target="_blank"
          rel="noreferrer"
        >
          Malaysian Book Publishers Association
        </a>
        . A small set of titles and author names comes from publicly indexed
        listings of the{" "}
        <a
          href="https://shopee.com.my/bukufixi.os"
          target="_blank"
          rel="noreferrer"
        >
          official store
        </a>
        , observed on 4 October 2026.
      </p>
      <h2>What is invented?</h2>
      <p>
        All prices, stock, genre assignments, descriptions, customer records,
        shipping rates and campaigns are demonstration data. Kota Selepas Hujan
        and Catatan Kota are fictional titles. Covers are original geometric
        placeholders, not FIXI artwork.
      </p>
      <h2>Respecting the source</h2>
      <p>
        No bulk crawler was run. Robots and terms pages could not be verified,
        so research was limited to public search-index excerpts and
        publisher-association information. No access controls were bypassed and
        no cover images, long synopses or ebook files were copied.
      </p>
      <h2>Coursework requirements</h2>
      <p>
        The attached BIK11003 brief calls for a real organization, permission
        letter, workflow study and a signed/stamped visit appendix. These
        require your group’s participation. The supplied project documentation
        maps the implementation to business rules, modules, entities, ERDs, join
        tables and normalization.
      </p>
      <p>
        The formal report is limited to 20 pages, with a 30-minute presentation
        in Week 13 and submission in Week 13/14. Consult the original brief for
        your group’s deadlines.
      </p>
    </div>
  );
}
