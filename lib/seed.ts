import { Book, Data } from "./types";
export const uid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const source = "https://shopee.com.my/bukufixi.os";
export const books: Book[] = [
  [
    "JELIK",
    "Ismi Fa Ismail",
    "Horror",
    "#b9d559",
    25,
    "A voice from Malaysia’s contemporary fiction shelf. Public title and author metadata; original placeholder artwork.",
  ],
  [
    "RENJANA",
    "Qiydenneskala",
    "Fiction",
    "#db8871",
    25,
    "Explore a different voice in Malay-language fiction. Public title and author metadata; demo catalog description.",
  ],
  [
    "AMUK",
    "Khairi Mohd",
    "Thriller",
    "#eabc4b",
    25,
    "Discover contemporary Malaysian storytelling. Public title and author metadata; demo genre assignment.",
  ],
  [
    "JELAGA",
    "Faizal Sulaiman",
    "Fiction",
    "#9fadd2",
    25,
    "A new addition to your reading stack. Public title and author metadata; original placeholder artwork.",
  ],
  [
    "GANTUNG:3",
    "Nadia Khan",
    "Thriller",
    "#b797bb",
    27,
    "The third Gantung title, listed in the official store. Artwork, pricing and stock here are for demonstration.",
  ],
  [
    "MOTEL",
    "Sahidzan Salleh",
    "Horror",
    "#73aba4",
    25,
    "Browse this public FIXI title in our academic catalog. Genre and description are editorial demo data.",
  ],
  [
    "KOTA SELEPAS HUJAN",
    "Demo Editorial Collective",
    "Fiction",
    "#e6a463",
    29,
    "An invented preorder title for demonstrating campaigns. A city, a late train, and stories waiting to be told.",
  ],
  [
    "CATATAN KOTA",
    "Demo Editorial Collective",
    "Fiction",
    "#93b6c8",
    12,
    "An invented digital title for demonstrating ebook entitlements. No copyrighted ebook is supplied.",
  ],
].map((b, i) => {
  const slug = String(b[0])
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-");
  return {
    id: uid(i + 1),
    slug,
    title: String(b[0]),
    author: String(b[1]),
    category: String(b[2]),
    color: String(b[3]),
    price: Number(b[4]),
    description: String(b[5]),
    stock: i === 6 ? 0 : 80 - i * 7,
    format: i === 7 ? "ebook" : "physical",
    cover_image: `/covers/${slug}.jpg`,
    source_url: i < 6 ? source : null,
    provenance: i < 6 ? "public_metadata" : "demo",
    active: true,
  };
});
export const demoCustomer = uid(100);
export const initialData: Data = {
  books,
  campaigns: [
    {
      id: uid(200),
      book_id: uid(7),
      title: "Kota Selepas Hujan · First edition",
      opens_at: "2026-01-01T00:00:00Z",
      closes_at: "2027-12-31T15:59:59Z",
      release_at: "2028-01-15T00:00:00Z",
      capacity: 300,
      reserved: 0,
      active: true,
    },
  ],
  orders: [],
  payments: [],
  entitlements: [],
  profiles: [
    { id: demoCustomer, display_name: "Demo Reader", role: "customer" },
  ],
  access: [],
};
