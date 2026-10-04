export type Book = {
  id: string;
  title: string;
  slug: string;
  author: string;
  category: string;
  price: number;
  stock: number;
  color: string;
  description: string;
  format: "physical" | "ebook";
  cover_image?: string | null;
  back_cover_image?: string | null;
  source_url: string | null;
  provenance: "public_metadata" | "demo";
  active: boolean;
};
export type Campaign = {
  id: string;
  book_id: string;
  title: string;
  opens_at: string;
  closes_at: string;
  release_at: string;
  capacity: number;
  reserved: number;
  active: boolean;
};
export type CartItem = {
  book_id: string;
  quantity: number;
  campaign_id?: string;
};
export type OrderItem = {
  book_id: string;
  quantity: number;
  unit_price: number;
  title: string;
  format: string;
  campaign_id?: string;
};
export type Payment = {
  id: string;
  order_id: string;
  kind: "book" | "shipping";
  amount: number;
  status: "pending" | "verified" | "rejected";
  receipt_path: string;
  note: string;
  created_at: string;
};
export type Order = {
  id: string;
  customer_id: string;
  customer_name: string;
  created_at: string;
  status: "awaiting_payment" | "processing" | "shipped" | "completed";
  book_total: number;
  shipping_total: number;
  address: string;
  tracking_number: string | null;
  items: OrderItem[];
};
export type Entitlement = {
  id: string;
  customer_id: string;
  book_id: string;
  order_id: string;
  title: string;
  active: boolean;
  created_at: string;
};
export type Profile = {
  id: string;
  display_name: string;
  role: "customer" | "admin";
};
export type AccessRecord = {
  id: string;
  entitlement_id: string;
  created_at: string;
  outcome: string;
};
export type Data = {
  books: Book[];
  campaigns: Campaign[];
  orders: Order[];
  payments: Payment[];
  entitlements: Entitlement[];
  profiles: Profile[];
  access: AccessRecord[];
};
