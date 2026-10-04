import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const coversDir = path.join(__dirname, "..", "public", "covers");

if (!fs.existsSync(coversDir)) {
  fs.mkdirSync(coversDir, { recursive: true });
}

const covers = [
  {
    slug: "jelik",
    url: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1695302156i/199064020.jpg",
  },
  {
    slug: "renjana",
    url: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1755620206i/240367725.jpg",
  },
  {
    slug: "amuk",
    url: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1714092628i/212162270.jpg",
  },
  {
    slug: "jelaga",
    url: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1761865194i/243384026.jpg",
  },
  {
    slug: "gantung-3",
    url: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1745582828i/231974800.jpg",
  },
  {
    slug: "motel",
    url: "https://i.gr-assets.com/images/S/compressed.photo.goodreads.com/books/1714094067i/212162589.jpg",
  },
];

async function downloadAll() {
  for (const c of covers) {
    const dest = path.join(coversDir, `${c.slug}.jpg`);
    console.log(`Downloading ${c.slug} from ${c.url}...`);
    try {
      const res = await fetch(c.url);
      if (!res.ok) {
        console.error(`Failed to download ${c.slug}: status ${res.status}`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buffer);
      console.log(`Saved ${c.slug}.jpg (${buffer.length} bytes)`);
    } catch (err) {
      console.error(`Error downloading ${c.slug}:`, err.message);
    }
  }
}

downloadAll();
