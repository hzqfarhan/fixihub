# Real book covers

All six real catalog titles have matching published front covers. The two fictional titles, KOTA SELEPAS HUJAN and CATATAN KOTA, keep their original demo artwork. Real covers are also textures in the 3D viewer; the spine and back of the 3D model are illustrative, not scans of a physical edition.

## Source record

`lib/cover-sources.json` records the existing asset download URL, public retailer metadata source, title, author, SHA-256 and audit date. Each image was visually checked for its printed title and author. These assets were already in this project before the 4 October audit; their historical download compliance cannot be independently established. No new bulk scrape was performed or permission inferred. Copyright remains with the respective rights holders; no open licence is asserted. This project contains cover images only, not ebook pages or ebook files.

Product pages link to the matching public retailer listing. Prices, inventory, categories and commerce records remain demo data. Public listing descriptions have not been copied.

## Access review, 4 October 2026

- Gerakbudaya robots request returned HTTP 403: direct crawling stopped; only public search index excerpts were used for title/author verification.
- Goodreads and its image CDN robots files were readable and explicitly disallow GPTBot. No new Goodreads page/image scrape was run. The previously bundled files were retained and their original URLs recorded, not represented as freshly retrieved assets.
- MPH robots allows public product HTML; its indexed MOTEL listing corroborates title and author. No checkout, account or private endpoint accessed.
- Existing broad downloader is retired. `node scripts/verify-covers.mjs` checks local JPEG signatures and hashes without network requests. Further imports require reviewing the source's terms/robots and obtaining appropriate reuse rights; use bounded, spaced requests and stop on access blocks or rate limits.

## App integration

The cover registry is a bundled presentation layer, deliberately separate from commerce records. It matches both title and author, only for public-metadata books. It supplies covers to fresh seed data, existing saved demo catalogs and Supabase catalog rows. Existing custom image URLs are preserved. No database migration is necessary; existing orders and stock are not reset. Unknown books retain the original placeholder fallback.

The HTML image and 3D texture share the same local file. Mobile and reduced-motion views use the static cover. Missing images fall back safely.

## 3D back faces

No verified back-cover scans are bundled. Back faces and spines use the dominant colour sampled from the actual front image, rather than the unrelated demo category colour. An optional `back_cover_image` on the book presentation object supports a verified scan if later supplied; failed loads retain the matched colour. The hero books are spaced apart with narrower paperback proportions to prevent intersecting geometry.
