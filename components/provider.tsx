"use client";
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { withBookCover } from "@/lib/covers";
import { supabase } from "@/lib/supabase";
import { initialData, demoCustomer } from "@/lib/seed";
import { balance, quote, receiptValid, isOpen } from "@/lib/rules";
import type { Book, Campaign, CartItem, Data, Profile } from "@/lib/types";

const KEY = "fixihub-demo-v1";
async function blobStore(path: string, file?: File): Promise<Blob | undefined> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open("fixihub-receipts", 1);
    open.onupgradeneeded = () => open.result.createObjectStore("receipts");
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction("receipts", file ? "readwrite" : "readonly");
      const q = file
        ? tx.objectStore("receipts").put(file, path)
        : tx.objectStore("receipts").get(path);
      q.onsuccess = () => resolve(file || q.result);
      q.onerror = () => reject(q.error);
      tx.oncomplete = () => db.close();
    };
  });
}
type Hub = {
  data: Data;
  profile: Profile | null;
  demo: boolean;
  ready: boolean;
  error: string;
  cart: CartItem[];
  toast: string;
  notify: (s: string) => void;
  add: (b: Book, c?: Campaign) => void;
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  refresh: () => Promise<void>;
  placeOrder: (address: string, key: string) => Promise<string>;
  upload: (
    order: string,
    kind: "book" | "shipping",
    file: File,
  ) => Promise<void>;
  receipt: (path: string) => Promise<string>;
  review: (id: string, approve: boolean, note: string) => Promise<void>;
  fulfill: (id: string, tracking: string, delivered?: boolean) => Promise<void>;
  access: (id: string) => Promise<void>;
  saveBook: (b: Book) => Promise<void>;
  saveCampaign: (c: Campaign) => Promise<void>;
  auth: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemo: () => void;
  updateName: (name: string) => Promise<void>;
};
const Context = createContext<Hub | null>(null);
export const useHub = () => {
  const c = useContext(Context);
  if (!c) throw Error("Missing provider");
  return c;
};
export function Provider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>(
      supabase
        ? { ...initialData, books: [], campaigns: [], profiles: [] }
        : initialData,
    ),
    [profile, setProfile] = useState<Profile | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [cart, setCart] = useState<CartItem[]>([]),
    [toast, setToast] = useState("");
  const demo = !supabase;
  const notify = useCallback((s: string) => setToast(s), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(t);
  }, [toast]);
  const refresh = useCallback(async () => {
    if (!supabase) return;
    try {
      setError("");
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError && authError.name !== "AuthSessionMissingError")
        throw authError;
      const [catalog, campaigns] = await Promise.all([
        supabase.from("catalog").select("*").order("title"),
        supabase.from("preorder_campaigns").select("*"),
      ]);
      if (catalog.error) throw catalog.error;
      if (campaigns.error) throw campaigns.error;
      const next: Data = {
        books: (catalog.data as Book[]).map(withBookCover),
        campaigns: campaigns.data as Campaign[],
        orders: [],
        payments: [],
        entitlements: [],
        profiles: [],
        access: [],
      };
      if (user) {
        const results = await Promise.all(
          [
            "profiles",
            "orders",
            "order_items",
            "payments",
            "shipments",
            "ebook_entitlements",
            "ebook_access_records",
          ].map((t) => supabase!.from(t).select("*")),
        );
        for (const r of results) if (r.error) throw r.error;
        const [
          profiles,
          orders,
          items,
          payments,
          shipments,
          entitlements,
          access,
        ] = results.map((r) => r.data!);
        next.profiles = profiles as Profile[];
        next.orders = orders.map((o) => ({
          ...o,
          tracking_number:
            shipments.find((s) => s.order_id === o.id)?.tracking_number || null,
          items: items.filter((i) => i.order_id === o.id),
        })) as Data["orders"];
        next.payments = payments as Data["payments"];
        next.entitlements = entitlements.map((e) => ({
          ...e,
          title:
            next.books.find((b) => b.id === e.book_id)?.title ||
            items.find((i) => i.book_id === e.book_id)?.title ||
            "Archived book",
        })) as Data["entitlements"];
        next.access = access as Data["access"];
        setProfile(next.profiles.find((p) => p.id === user.id) || null);
      } else setProfile(null);
      setData(next);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : String((e as { message?: string }).message || e),
      );
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => {
    if (demo) {
      try {
        const saved = localStorage.getItem(KEY);
        if (saved) {
          const restored = JSON.parse(saved) as Data;
          setData({ ...restored, books: restored.books.map(withBookCover) });
        }
        const role = localStorage.getItem("fixihub-demo-role");
        setProfile({
          id: demoCustomer,
          display_name: "Demo Reader",
          role: role === "admin" ? "admin" : "customer",
        });
      } catch {
        setError("Saved demo data could not be read.");
      }
      setReady(true);
    } else {
      void refresh();
      const {
        data: { subscription },
      } = supabase!.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
          setProfile(null);
          setCart([]);
          setData((d) => ({
            ...d,
            orders: [],
            payments: [],
            profiles: [],
            entitlements: [],
            access: [],
          }));
        }
        setTimeout(() => {
          void refresh();
        }, 0);
      });
      return () => subscription.unsubscribe();
    }
  }, [demo, refresh]);
  useEffect(() => {
    if (demo && ready) {
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch {
        setError("Device storage is full. Demo changes may not persist.");
      }
    }
  }, [data, demo, ready]);
  useEffect(() => {
    try {
      setCart(JSON.parse(sessionStorage.getItem("fixihub-cart") || "[]"));
    } catch {}
  }, []);
  useEffect(() => {
    sessionStorage.setItem("fixihub-cart", JSON.stringify(cart));
  }, [cart]);
  async function rpc(name: string, args: Record<string, unknown>) {
    const r = await supabase!.rpc(name, args);
    if (r.error) throw Error(r.error.message);
    await refresh();
    return r.data;
  }
  function admin() {
    if (profile?.role !== "admin")
      throw Error("Administrator access required.");
  }
  function add(b: Book, c?: Campaign) {
    if (c && !isOpen(c)) {
      notify("This preorder is not open.");
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.book_id === b.id);
      if (existing)
        return prev.map((i) =>
          i.book_id === b.id
            ? {
                ...i,
                quantity: Math.min(
                  b.format === "ebook" ? 1 : 10,
                  i.quantity + 1,
                ),
                campaign_id: c?.id,
              }
            : i,
        );
      return [...prev, { book_id: b.id, quantity: 1, campaign_id: c?.id }];
    });
    notify(b.title + " added to your bag.");
  }
  async function placeOrder(address: string, key: string) {
    if (!profile) throw Error("Sign in before checkout.");
    const q = quote(cart, data.books, data.campaigns);
    if (q.shipping_total > 0 && address.trim().length < 12)
      throw Error("Enter your full delivery address.");
    let id: string;
    if (demo) {
      id = crypto.randomUUID();
      setData((prev) => ({
        ...prev,
        orders: [
          {
            id,
            customer_id: profile.id,
            customer_name: profile.display_name,
            created_at: new Date().toISOString(),
            status: "awaiting_payment",
            address,
            tracking_number: null,
            ...q,
          },
          ...prev.orders,
        ],
        books: prev.books.map((b) => ({
          ...b,
          stock:
            b.stock -
            cart
              .filter(
                (i) =>
                  i.book_id === b.id &&
                  !i.campaign_id &&
                  b.format === "physical",
              )
              .reduce((s, i) => s + i.quantity, 0),
        })),
        campaigns: prev.campaigns.map((c) => ({
          ...c,
          reserved:
            c.reserved +
            cart
              .filter((i) => i.campaign_id === c.id)
              .reduce((s, i) => s + i.quantity, 0),
        })),
      }));
    } else
      id = await rpc("checkout", {
        p_items: cart,
        p_address: address,
        p_request_id: key,
      });
    setCart([]);
    notify("Order placed. Upload book and postage receipts separately.");
    return id;
  }
  async function upload(order: string, kind: "book" | "shipping", file: File) {
    receiptValid(file);
    if (!profile) throw Error("Sign in first.");
    const path =
      profile.id +
      "/" +
      order +
      "/" +
      crypto.randomUUID() +
      "." +
      { "image/jpeg": "jpg", "image/png": "png", "application/pdf": "pdf" }[
        file.type
      ];
    if (demo) {
      const o = data.orders.find(
        (o) => o.id === order && o.customer_id === profile.id,
      );
      if (!o) throw Error("Order unavailable.");
      if (
        data.payments.some(
          (p) =>
            p.order_id === order && p.kind === kind && p.status !== "rejected",
        )
      )
        throw Error("Payment is already pending or verified.");
      const amount = balance(o, data.payments, kind);
      if (amount <= 0) throw Error("Nothing due.");
      await blobStore(path, file);
      setData((prev) => ({
        ...prev,
        payments: [
          ...prev.payments,
          {
            id: crypto.randomUUID(),
            order_id: order,
            kind,
            amount,
            status: "pending",
            receipt_path: path,
            note: "",
            created_at: new Date().toISOString(),
          },
        ],
      }));
    } else {
      const r = await supabase!.storage
        .from("receipts")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (r.error) throw Error(r.error.message);
      await rpc("submit_receipt", {
        p_order_id: order,
        p_kind: kind,
        p_path: path,
      });
    }
    notify("Receipt submitted for verification.");
  }
  async function receipt(path: string) {
    if (demo) {
      const b = await blobStore(path);
      if (!b) throw Error("Receipt not found on this device.");
      return URL.createObjectURL(b);
    }
    const r = await supabase!.storage
      .from("receipts")
      .createSignedUrl(path, 60);
    if (r.error) throw Error(r.error.message);
    return r.data.signedUrl;
  }
  async function review(id: string, approve: boolean, note: string) {
    admin();
    if (!approve && note.trim().length < 3)
      throw Error("Enter a rejection reason.");
    if (!demo) {
      await rpc("review_payment", {
        p_id: id,
        p_approve: approve,
        p_note: note,
      });
    } else {
      const p = data.payments.find(
        (p) => p.id === id && p.status === "pending",
      );
      if (!p) throw Error("Payment no longer pending.");
      const o = data.orders.find((o) => o.id === p.order_id)!;
      setData((prev) => ({
        ...prev,
        payments: prev.payments.map((x) =>
          x.id === id
            ? { ...x, status: approve ? "verified" : "rejected", note }
            : x,
        ),
        orders: prev.orders.map((x) =>
          x.id === o.id && approve && p.kind === "book"
            ? {
                ...x,
                status: x.items.some((i) => i.format === "physical")
                  ? "processing"
                  : "completed",
              }
            : x,
        ),
        entitlements: [
          ...prev.entitlements,
          ...(approve && p.kind === "book"
            ? o.items
                .filter((i) => i.format === "ebook")
                .map((i) => ({
                  id: crypto.randomUUID(),
                  customer_id: o.customer_id,
                  book_id: i.book_id,
                  order_id: o.id,
                  title: i.title,
                  active: true,
                  created_at: new Date().toISOString(),
                }))
            : []),
        ],
      }));
    }
    notify(approve ? "Payment verified." : "Receipt rejected with a reason.");
  }
  async function fulfill(id: string, tracking: string, delivered = false) {
    admin();
    if (!demo) {
      await rpc("fulfill_order", {
        p_id: id,
        p_tracking: tracking,
        p_delivered: delivered,
      });
    } else {
      const o = data.orders.find((o) => o.id === id)!;
      if (delivered ? o.status !== "shipped" : o.status !== "processing")
        throw Error("Order is not ready for this transition.");
      if (
        !delivered &&
        (balance(o, data.payments, "book") ||
          balance(o, data.payments, "shipping") ||
          tracking.trim().length < 3)
      )
        throw Error("Verify both payments and enter tracking first.");
      if (
        !delivered &&
        o.items.some(
          (i) =>
            i.campaign_id &&
            Date.parse(
              data.campaigns.find((c) => c.id === i.campaign_id)!.release_at,
            ) > Date.now(),
        )
      )
        throw Error("Preorder release date has not arrived.");
      setData((prev) => ({
        ...prev,
        orders: prev.orders.map((x) =>
          x.id === id
            ? {
                ...x,
                status: delivered ? "completed" : "shipped",
                tracking_number: delivered ? x.tracking_number : tracking,
              }
            : x,
        ),
      }));
    }
    notify(delivered ? "Order completed." : "Shipment recorded.");
  }
  async function access(id: string) {
    if (demo) {
      if (
        !data.entitlements.some(
          (e) => e.id === id && e.customer_id === profile?.id && e.active,
        )
      )
        throw Error("Entitlement required.");
      setData((prev) => ({
        ...prev,
        access: [
          ...prev.access,
          {
            id: crypto.randomUUID(),
            entitlement_id: id,
            created_at: new Date().toISOString(),
            outcome: "metadata_only_no_licensed_file",
          },
        ],
      }));
    } else await rpc("record_ebook_access", { p_id: id });
    notify(
      "Access checked and recorded. No licensed ebook file is attached to this prototype.",
    );
  }
  async function saveBook(b: Book) {
    admin();
    if (!demo) await rpc("save_book", { p_book: b });
    else
      setData((prev) => ({
        ...prev,
        books: prev.books.some((x) => x.id === b.id)
          ? prev.books.map((x) => (x.id === b.id ? b : x))
          : [...prev.books, b],
      }));
    notify("Catalog updated.");
  }
  async function saveCampaign(c: Campaign) {
    admin();
    if (
      !(
        Date.parse(c.opens_at) < Date.parse(c.closes_at) &&
        Date.parse(c.closes_at) <= Date.parse(c.release_at)
      ) ||
      c.capacity < c.reserved
    )
      throw Error("Check campaign dates and capacity.");
    if (!demo) await rpc("save_campaign", { p_campaign: c });
    else {
      if (
        c.active &&
        data.campaigns.some(
          (x) => x.id !== c.id && x.book_id === c.book_id && x.active,
        )
      )
        throw Error("This book already has an active campaign.");
      setData((prev) => ({
        ...prev,
        campaigns: prev.campaigns.some((x) => x.id === c.id)
          ? prev.campaigns.map((x) => (x.id === c.id ? c : x))
          : [...prev.campaigns, c],
      }));
    }
    notify("Campaign saved.");
  }
  async function auth(email: string, password: string, name?: string) {
    if (demo) {
      setProfile({
        id: demoCustomer,
        display_name: name || "Demo Reader",
        role: "customer",
      });
      notify("Demo reader active. No real account was created.");
      return;
    }
    const r = name
      ? await supabase!.auth.signUp({
          email,
          password,
          options: { data: { display_name: name } },
        })
      : await supabase!.auth.signInWithPassword({ email, password });
    if (r.error) throw Error(r.error.message);
    notify(
      name ? "Check your email to confirm your account." : "Welcome back.",
    );
    await refresh();
  }
  async function logout() {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setProfile(null);
      await refresh();
    } else {
      setProfile(null);
    }
    setCart([]);
    notify("Signed out.");
  }
  function switchDemo() {
    if (!demo) return;
    const role = profile?.role === "admin" ? "customer" : "admin";
    localStorage.setItem("fixihub-demo-role", role);
    setProfile({ id: demoCustomer, display_name: "Demo Reader", role });
    notify("Demo " + role + " workspace active.");
  }
  async function updateName(name: string) {
    if (!name.trim()) throw Error("Enter a name.");
    if (!demo) await rpc("update_profile", { p_name: name });
    else {
      setProfile((p) => (p ? { ...p, display_name: name } : null));
      setData((d) => ({
        ...d,
        profiles: d.profiles.map((p) =>
          p.id === demoCustomer ? { ...p, display_name: name } : p,
        ),
      }));
    }
    notify("Profile saved.");
  }
  return (
    <Context.Provider
      value={{
        data,
        profile,
        demo,
        ready,
        error,
        cart,
        toast,
        notify,
        add,
        setCart,
        refresh,
        placeOrder,
        upload,
        receipt,
        review,
        fulfill,
        access,
        saveBook,
        saveCampaign,
        auth,
        logout,
        switchDemo,
        updateName,
      }}
    >
      {children}
    </Context.Provider>
  );
}
