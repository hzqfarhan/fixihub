"use client";
import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Download,
  LayoutDashboard,
  Package,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
  X,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { useHub } from "./provider";
import { Empty, Modal, Status } from "./ui";
import { BookCover } from "./book-cover";
import { balance, csvCell, money } from "@/lib/rules";
import type { Book, Campaign, Order, Payment } from "@/lib/types";
const tabs = [
  ["overview", "Overview", LayoutDashboard],
  ["orders", "Orders", Package],
  ["payments", "Payment review", Wallet],
  ["catalog", "Catalog", BookOpen],
  ["campaigns", "Preorders", Clock],
  ["customers", "Customers", Users],
  ["reports", "Reports", BarChart3],
] as const;
export function Admin() {
  const h = useHub(),
    [tab, setTab] = useState("overview"),
    [search, setSearch] = useState(""),
    [book, setBook] = useState<Book | null>(null),
    [campaign, setCampaign] = useState<Campaign | null>(null),
    [payment, setPayment] = useState<Payment | null>(null),
    [order, setOrder] = useState<Order | null>(null),
    [note, setNote] = useState(""),
    [tracking, setTracking] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [receiptUrl, setReceiptUrl] = useState("");
  const pending = h.data.payments.filter((p) => p.status === "pending"),
    collected = h.data.payments
      .filter((p) => p.status === "verified")
      .reduce((s, p) => s + p.amount, 0),
    due = h.data.orders.reduce(
      (s, o) =>
        s +
        balance(o, h.data.payments, "book") +
        balance(o, h.data.payments, "shipping"),
      0,
    );
  const selectedOrders = h.data.orders.filter((o) =>
    (o.id + " " + o.customer_name + " " + o.status)
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  async function act(f: () => Promise<void>, close?: () => void) {
    setBusy(true);
    setError("");
    try {
      await f();
      close?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function exportReport() {
    const rows = [
      [
        "Order ID",
        "Customer",
        "Created",
        "Status",
        "Book total MYR",
        "Postage MYR",
        "Verified MYR",
        "Balance MYR",
      ],
      ...h.data.orders.map((o) => [
        o.id,
        o.customer_name,
        o.created_at,
        o.status,
        o.book_total,
        o.shipping_total,
        h.data.payments
          .filter((p) => p.order_id === o.id && p.status === "verified")
          .reduce((s, p) => s + p.amount, 0),
        balance(o, h.data.payments, "book") +
          balance(o, h.data.payments, "shipping"),
      ]),
    ];
    const blob = new Blob(
      ["\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "fixihub-order-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  if (!h.ready)
    return <div className="page section">Loading publisher workspace…</div>;
  if (h.profile?.role !== "admin")
    return (
      <div className="page section">
        <Empty
          title="The publisher workspace."
          text={
            h.demo
              ? "Switch to the demo administrator to explore catalog management, receipt verification and reporting."
              : "Sign in with an administrator account to continue."
          }
          href="/account"
          label="Go to account"
        />
        {h.demo && (
          <div className="center">
            <button className="button primary" onClick={h.switchDemo}>
              Enter demo publisher workspace <ArrowUpRight size={16} />
            </button>
          </div>
        )}
      </div>
    );
  const openPayment = (p: Payment) => {
    if (receiptUrl.startsWith("blob:")) URL.revokeObjectURL(receiptUrl);
    setPayment(p);
    setReceiptUrl("");
    setNote("");
    setError("");
  };
  function orderTable(list: Order[]) {
    return list.length ? (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Order / reader</th>
              <th>Books</th>
              <th>Amount</th>
              <th>Postage</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td>
                  <b>#{o.id.slice(0, 8).toUpperCase()}</b>
                  <small>{o.customer_name}</small>
                </td>
                <td>{o.items.reduce((s, i) => s + i.quantity, 0)} copies</td>
                <td>{money(o.book_total)}</td>
                <td>
                  <Status
                    value={
                      balance(o, h.data.payments, "shipping")
                        ? "unpaid"
                        : "settled"
                    }
                  />
                </td>
                <td>
                  <Status value={o.status} />
                </td>
                <td>
                  <button
                    className="icon-button"
                    aria-label={"Manage order " + o.id.slice(0, 8)}
                    onClick={() => {
                      setOrder(o);
                      setTracking(o.tracking_number || "");
                      setError("");
                    }}
                  >
                    <ChevronRight size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <Empty
        title="No orders yet."
        text="Place a demo order in the storefront to start the complete workflow."
        href="/catalog"
        label="Open storefront"
      />
    );
  }
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <span className="eyebrow">PUBLISHER WORKSPACE</span>
        <div className="workspace-name">
          <span className="workspace-icon">F</span>
          <div>
            <b>FIXIHUB</b>
            <small>
              {h.demo ? "Demonstration workspace" : "Publisher administration"}
            </small>
          </div>
        </div>
        <nav aria-label="Publisher navigation">
          {tabs.map(([id, label, Icon]) => (
            <button
              className={tab === id ? "selected" : ""}
              key={id}
              onClick={() => {
                setTab(id);
                setSearch("");
                setError("");
              }}
            >
              <Icon size={18} />
              {label}
              {id === "payments" && pending.length > 0 && (
                <span className="count">{pending.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="dot" /> All records connected
          <p>Books. Readers. The whole story.</p>
          <Link href="/">Back to storefront ↗</Link>
        </div>
      </aside>
      <section className="admin-content">
        <div className="admin-heading">
          <div>
            <span className="eyebrow">YOUR PUBLISHING DESK</span>
            <h1>
              {tab === "overview"
                ? "A clearer picture."
                : tabs.find((t) => t[0] === tab)?.[1]}
            </h1>
            <p>
              {tab === "overview"
                ? "Every order is a story in progress. Here’s where things stand."
                : "Manage the details. Keep the next chapter moving."}
            </p>
          </div>
          {tab === "catalog" ? (
            <button
              className="button primary"
              onClick={() => {
                setError("");
                setBook({
                  id: crypto.randomUUID(),
                  title: "",
                  slug: "",
                  author: "",
                  category: "Fiction",
                  price: 25,
                  stock: 10,
                  color: "#b9d559",
                  description: "",
                  format: "physical",
                  source_url: null,
                  provenance: "demo",
                  active: true,
                });
              }}
            >
              <Plus size={17} /> Add book
            </button>
          ) : tab === "campaigns" ? (
            <button
              className="button primary"
              onClick={() => {
                setError("");
                setCampaign({
                  id: crypto.randomUUID(),
                  book_id: h.data.books[0]?.id || "",
                  title: "",
                  opens_at: new Date().toISOString(),
                  closes_at: new Date(Date.now() + 30 * 86400000).toISOString(),
                  release_at: new Date(
                    Date.now() + 60 * 86400000,
                  ).toISOString(),
                  capacity: 100,
                  reserved: 0,
                  active: true,
                });
              }}
            >
              <Plus size={17} /> New campaign
            </button>
          ) : (
            <button className="button secondary" onClick={exportReport}>
              <Download size={16} /> Export report
            </button>
          )}
        </div>
        {error && !book && !campaign && !payment && !order && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {(tab === "overview" || tab === "reports") && (
          <>
            <div className="stats-grid">
              {[
                [
                  money(collected),
                  "Verified payments",
                  "Book + postage receipts",
                  Wallet,
                ],
                [
                  h.data.orders.length,
                  "Total orders",
                  "Across all readers",
                  Package,
                ],
                [
                  pending.length,
                  "Awaiting verification",
                  "Receipts ready for review",
                  ShieldCheck,
                ],
                [money(due), "Outstanding balance", "Books and postage", Truck],
              ].map(([value, label, sub, Icon], i) => {
                const C = Icon as typeof Wallet;
                return (
                  <div
                    className={"stat-card " + (i === 0 ? "accent" : "")}
                    key={String(label)}
                  >
                    <span>
                      {String(label)}
                      <C size={18} />
                    </span>
                    <strong>{value as string}</strong>
                    <small>{String(sub)}</small>
                  </div>
                );
              })}
            </div>
            <div className="dashboard-middle">
              <div className="panel">
                <div className="panel-title">
                  <h2>Order flow</h2>
                  <span className="eyebrow">ALL TIME</span>
                </div>
                <div className="flow-chart">
                  {(
                    [
                      "awaiting_payment",
                      "processing",
                      "shipped",
                      "completed",
                    ] as const
                  ).map((s, i) => {
                    const count = h.data.orders.filter(
                      (o) => o.status === s,
                    ).length;
                    return (
                      <div key={s}>
                        <span>{s.replaceAll("_", " ")}</span>
                        <div>
                          <i
                            style={{
                              width:
                                (h.data.orders.length
                                  ? (count / h.data.orders.length) * 100
                                  : 0) + "%",
                              background: [
                                "#b9d559",
                                "#a6b49f",
                                "#79998d",
                                "#455c49",
                              ][i],
                            }}
                          />
                        </div>
                        <b>{count}</b>
                      </div>
                    );
                  })}
                </div>
                <p className="fineprint">
                  Counts reflect actual records in this workspace.
                </p>
              </div>
              <div className="review-callout">
                <span className="eyebrow">NEEDS YOUR ATTENTION</span>
                <ShieldCheck size={30} />
                <h2>
                  {pending.length
                    ? pending.length + " receipts to review."
                    : "You’re all caught up."}
                </h2>
                <p>
                  {pending.length
                    ? "A quick check gets the next story on its way."
                    : "New payment receipts will appear here when readers submit them."}
                </p>
                <button
                  className="text-link"
                  onClick={() => setTab("payments")}
                >
                  Open payment review <ArrowRightIcon />
                </button>
              </div>
            </div>
          </>
        )}
        {(tab === "overview" || tab === "orders") && (
          <div className="panel table-panel">
            <div className="panel-title">
              <h2>{tab === "overview" ? "Recent orders" : "All orders"}</h2>
              {tab === "overview" ? (
                <button className="text-link" onClick={() => setTab("orders")}>
                  View all ↗
                </button>
              ) : (
                <label className="search-field compact">
                  <Search size={17} />
                  <input
                    aria-label="Search orders"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Order, reader or status"
                  />
                </label>
              )}
            </div>
            {orderTable(
              tab === "overview" ? h.data.orders.slice(0, 5) : selectedOrders,
            )}
          </div>
        )}
        {tab === "payments" && (
          <div className="panel table-panel">
            <div className="panel-title">
              <h2>Receipt queue</h2>
              <span>{pending.length} pending</span>
            </div>
            {h.data.payments.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Payment for</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {[...h.data.payments]
                      .sort(
                        (a, b) =>
                          Number(b.status === "pending") -
                          Number(a.status === "pending"),
                      )
                      .map((p) => (
                        <tr key={p.id}>
                          <td>#{p.order_id.slice(0, 8).toUpperCase()}</td>
                          <td>{p.kind === "book" ? "Books" : "Postage"}</td>
                          <td>{money(p.amount)}</td>
                          <td>
                            <Status value={p.status} />
                          </td>
                          <td>
                            <button
                              className="text-link"
                              onClick={() => openPayment(p)}
                            >
                              {p.status === "pending" ? "Review" : "View"} ↗
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty
                title="No receipts to review."
                text="Customers upload receipts from My orders. Book and postage payments are tracked separately."
              />
            )}
          </div>
        )}
        {tab === "catalog" && (
          <div className="panel table-panel">
            <div className="panel-title">
              <h2>{h.data.books.length} catalog entries</h2>
              <label className="search-field compact">
                <Search size={17} />
                <input
                  aria-label="Search catalog"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Title or author"
                />
              </label>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Book / author</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {h.data.books
                    .filter((b) =>
                      (b.title + " " + b.author)
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    )
                    .map((b) => (
                      <tr key={b.id}>
                        <td>
                          <div className="table-book">
                            <span style={{ background: b.color }} />
                            <div>
                              <b>{b.title}</b>
                              <small>{b.author}</small>
                            </div>
                          </div>
                        </td>
                        <td>{b.category}</td>
                        <td>{money(b.price)}</td>
                        <td>{b.format === "ebook" ? "Digital" : b.stock}</td>
                        <td>
                          <Status value={b.active ? "active" : "archived"} />
                        </td>
                        <td>
                          <button
                            className="text-link"
                            onClick={() => {
                              setBook({ ...b });
                              setError("");
                            }}
                          >
                            Edit ↗
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {tab === "campaigns" && (
          <div className="admin-campaigns">
            {h.data.campaigns.map((c) => (
              <article className="panel" key={c.id}>
                <Status value={c.active ? "active" : "closed"} />
                <h2>{c.title}</h2>
                <p>{h.data.books.find((b) => b.id === c.book_id)?.title}</p>
                <progress
                  max={c.capacity}
                  value={c.reserved}
                  aria-label="Campaign capacity"
                />
                <div className="summary-line">
                  <span>{c.reserved} reservations</span>
                  <b>{c.capacity} capacity</b>
                </div>
                <p className="fineprint">
                  Release:{" "}
                  {new Date(c.release_at).toLocaleDateString("en-MY", {
                    timeZone: "Asia/Kuala_Lumpur",
                  })}
                </p>
                <button
                  className="button secondary"
                  onClick={() => {
                    setCampaign({ ...c });
                    setError("");
                  }}
                >
                  Manage campaign <Settings2 size={16} />
                </button>
              </article>
            ))}
          </div>
        )}
        {tab === "customers" && (
          <div className="panel table-panel">
            <div className="panel-title">
              <h2>Reader directory</h2>
            </div>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Reader</th>
                    <th>Account ID</th>
                    <th>Role</th>
                    <th>Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {h.data.profiles.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <b>{p.display_name}</b>
                      </td>
                      <td>{p.id.slice(0, 8)}</td>
                      <td>
                        <Status value={p.role} />
                      </td>
                      <td>
                        {
                          h.data.orders.filter((o) => o.customer_id === p.id)
                            .length
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="fineprint padded">
              Roles can only be changed by the database owner. Customers cannot
              promote themselves.
            </p>
          </div>
        )}
        {tab === "reports" && (
          <div className="panel">
            <h2>Sales by title</h2>
            <p className="fineprint">
              Ordered units and gross book value. Verified receipts are reported
              separately above.
            </p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Ordered units</th>
                    <th>Gross value</th>
                  </tr>
                </thead>
                <tbody>
                  {h.data.books.map((b) => {
                    const items = h.data.orders
                      .flatMap((o) => o.items)
                      .filter((i) => i.book_id === b.id);
                    return (
                      <tr key={b.id}>
                        <td>{b.title}</td>
                        <td>{items.reduce((s, i) => s + i.quantity, 0)}</td>
                        <td>
                          {money(
                            items.reduce(
                              (s, i) => s + i.quantity * i.unit_price,
                              0,
                            ),
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
      {book && (
        <Modal
          title={
            h.data.books.some((b) => b.id === book.id)
              ? "Edit catalog entry"
              : "Add a book"
          }
          onClose={() => !busy && setBook(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void act(
                () => h.saveBook(book),
                () => setBook(null),
              );
            }}
          >
            <div className="form-grid">
              <label>
                Title
                <input
                  required
                  maxLength={160}
                  value={book.title}
                  onChange={(e) => setBook({ ...book, title: e.target.value })}
                />
              </label>
              <label>
                Author
                <input
                  required
                  maxLength={100}
                  value={book.author}
                  onChange={(e) => setBook({ ...book, author: e.target.value })}
                />
              </label>
              <label>
                Category
                <input
                  required
                  maxLength={60}
                  value={book.category}
                  onChange={(e) =>
                    setBook({ ...book, category: e.target.value })
                  }
                />
              </label>
              <label>
                Format
                <select
                  disabled={h.data.books.some((b) => b.id === book.id)}
                  value={book.format}
                  onChange={(e) =>
                    setBook({
                      ...book,
                      format: e.target.value as Book["format"],
                    })
                  }
                >
                  <option value="physical">Paperback</option>
                  <option value="ebook">Ebook record</option>
                </select>
              </label>
              <label>
                Demo price (MYR)
                <input
                  type="number"
                  min=".01"
                  max="999999"
                  step=".01"
                  required
                  value={book.price}
                  onChange={(e) =>
                    setBook({ ...book, price: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Available stock
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  required
                  value={book.stock}
                  onChange={(e) =>
                    setBook({ ...book, stock: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Cover colour
                <input
                  type="color"
                  value={book.color}
                  onChange={(e) => setBook({ ...book, color: e.target.value })}
                />
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={book.active}
                  onChange={(e) =>
                    setBook({ ...book, active: e.target.checked })
                  }
                />{" "}
                Visible in catalog
              </label>
            </div>
            <label>
              Description
              <textarea
                required
                maxLength={3000}
                value={book.description}
                onChange={(e) =>
                  setBook({ ...book, description: e.target.value })
                }
              />
            </label>
            <p className="fineprint">
              New entries are labelled demo data. Existing public provenance is
              preserved. The form assigns one author and category; the database
              supports multiple via join tables.
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary wide" disabled={busy}>
              {busy ? "Saving…" : "Save book"}
            </button>
          </form>
        </Modal>
      )}
      {campaign && (
        <Modal
          title="Manage preorder campaign"
          onClose={() => !busy && setCampaign(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void act(
                () => h.saveCampaign(campaign),
                () => setCampaign(null),
              );
            }}
          >
            <label>
              Campaign name
              <input
                required
                value={campaign.title}
                maxLength={160}
                onChange={(e) =>
                  setCampaign({ ...campaign, title: e.target.value })
                }
              />
            </label>
            <label>
              Book
              <select
                aria-label="Book"
                disabled={h.data.campaigns.some((c) => c.id === campaign.id)}
                value={campaign.book_id}
                onChange={(e) =>
                  setCampaign({ ...campaign, book_id: e.target.value })
                }
              >
                {h.data.books
                  .filter((b) => b.active)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.title}
                    </option>
                  ))}
              </select>
            </label>
            <div className="form-grid">
              {(["opens_at", "closes_at", "release_at"] as const).map((k) => (
                <label key={k}>
                  {k === "opens_at"
                    ? "Opens (UTC)"
                    : k === "closes_at"
                      ? "Closes (UTC)"
                      : "Release (UTC)"}
                  <input
                    type="datetime-local"
                    required
                    value={campaign[k].slice(0, 16)}
                    onChange={(e) =>
                      setCampaign({
                        ...campaign,
                        [k]: e.target.value ? e.target.value + ":00Z" : "",
                      })
                    }
                  />
                </label>
              ))}
              <label>
                Capacity
                <input
                  type="number"
                  min={Math.max(1, campaign.reserved)}
                  required
                  value={campaign.capacity}
                  onChange={(e) =>
                    setCampaign({
                      ...campaign,
                      capacity: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={campaign.active}
                onChange={(e) =>
                  setCampaign({ ...campaign, active: e.target.checked })
                }
              />{" "}
              Accept reservations within campaign dates
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary wide" disabled={busy}>
              {busy ? "Saving…" : "Save campaign"}
            </button>
          </form>
        </Modal>
      )}
      {payment && (
        <Modal
          title="Payment verification"
          onClose={() => {
            if (!busy) {
              setPayment(null);
              if (receiptUrl.startsWith("blob:"))
                URL.revokeObjectURL(receiptUrl);
            }
          }}
        >
          <div className="summary-line">
            <span>
              {payment.kind === "book" ? "Books" : "Postage"} · #
              {payment.order_id.slice(0, 8)}
            </span>
            <strong>{money(payment.amount)}</strong>
          </div>
          <Status value={payment.status} />
          <p>Compare the receipt with your bank record before verifying.</p>
          {receiptUrl ? (
            <a
              className="button secondary"
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open receipt in new tab <ArrowUpRight size={16} />
            </a>
          ) : (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() =>
                act(async () =>
                  setReceiptUrl(await h.receipt(payment.receipt_path)),
                )
              }
            >
              Load private receipt <ShieldCheck size={16} />
            </button>
          )}
          {payment.status === "pending" ? (
            <>
              <label>
                Review note / rejection reason
                <textarea
                  value={note}
                  maxLength={500}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Record your verification or explain what needs correcting."
                />
              </label>
              <div className="button-row">
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() =>
                    act(
                      () => h.review(payment.id, false, note),
                      () => setPayment(null),
                    )
                  }
                >
                  <X size={16} /> Reject
                </button>
                <button
                  className="button primary"
                  disabled={busy || !receiptUrl}
                  onClick={() =>
                    act(
                      () => h.review(payment.id, true, note),
                      () => setPayment(null),
                    )
                  }
                >
                  <Check size={16} /> Verify payment
                </button>
              </div>
              <p className="fineprint">
                Load the receipt before approving. Verified book payments grant
                ebook entitlements automatically.
              </p>
            </>
          ) : (
            <p>{payment.note || "No review note."}</p>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </Modal>
      )}
      {order && (
        <Modal
          title={"Order #" + order.id.slice(0, 8).toUpperCase()}
          onClose={() => !busy && setOrder(null)}
        >
          <Status value={order.status} />
          <h3>{order.customer_name}</h3>
          {order.items.map((i) => (
            <p key={i.book_id}>
              {i.quantity} × {i.title}
              {i.campaign_id ? " · preorder" : ""}
            </p>
          ))}
          <p className="address">{order.address || "Digital-only order"}</p>
          <div className="summary-line">
            <span>Book balance</span>
            <b>{money(balance(order, h.data.payments, "book"))}</b>
          </div>
          <div className="summary-line">
            <span>Postage balance</span>
            <b>{money(balance(order, h.data.payments, "shipping"))}</b>
          </div>
          {order.status === "processing" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void act(
                  () => h.fulfill(order.id, tracking),
                  () => setOrder(null),
                );
              }}
            >
              <label>
                Tracking number
                <input
                  required
                  minLength={3}
                  maxLength={120}
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                />
              </label>
              <button className="button primary wide" disabled={busy}>
                Mark as shipped <Truck size={16} />
              </button>
              <p className="fineprint">
                Both payments must be verified and preorder release dates
                reached.
              </p>
            </form>
          )}
          {order.status === "shipped" && (
            <>
              <p>Tracking: {order.tracking_number}</p>
              <button
                className="button primary"
                disabled={busy}
                onClick={() =>
                  act(
                    () => h.fulfill(order.id, tracking, true),
                    () => setOrder(null),
                  )
                }
              >
                Confirm delivered
              </button>
            </>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
        </Modal>
      )}
    </div>
  );
}
function ArrowRightIcon() {
  return <span aria-hidden="true">→</span>;
}
