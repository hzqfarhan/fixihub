import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const sources = JSON.parse(
  readFileSync(new URL("../lib/cover-sources.json", import.meta.url), "utf8"),
);
for (const source of sources) {
  const bytes = readFileSync(
    new URL(`../public${source.path}`, import.meta.url),
  );
  const hash = createHash("sha256").update(bytes).digest("hex");
  if (hash !== source.sha256 || bytes[0] !== 0xff || bytes[1] !== 0xd8)
    throw Error(`Cover integrity failed: ${source.title}`);
  console.log(`Verified ${source.title} — ${source.author}`);
}
