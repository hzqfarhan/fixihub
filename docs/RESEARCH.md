# Research log and field-level provenance

Observed **4 October 2026 (Asia/Kuala_Lumpur)**. This is a small manual public-metadata sample, not a bulk scrape.

## Sources

1. Malaysian Book Publishers Association (MABOPA), “Buku Fixi”: https://www.mabopa.com.my/ms/ahli/buku-fixi
   - Trade-association publisher entry: publisher name, establishment year 2011, fiction in Malay and English.
   - Used for publisher metadata only. No sales, staff-count or contact-person claims are needed for this app.
2. FIXI official domain: https://fixi.com.my/
   - Browser research resolved to https://shopee.com.my/bukufixi.os on the research date.
   - This is evidence of the public storefront redirect, **not evidence that FIXI lacks a website or has a particular internal workflow**.
3. Buku Fixi Official Store, publicly indexed text: https://shopee.com.my/bukufixi.os
   - Used only for the six title/author pairs below.
4. International Alliance of Independent Publishers: https://alliance-editeurs.org/buku-fixi%2C1944?lang=en
   - Corroborates Malaysian publisher, established 2011, Malay/English fiction focus. Not used to invent business operating facts.

## Access/robots/terms limits

- Requested https://fixi.com.my/robots.txt via the research browser; unavailable. A single direct HTTPS request also failed TLS validation. No disabled TLS validation or bypass was used.
- Requested https://shopee.com.my/robots.txt and the public terms help page https://help.shopee.com.my/portal/4/article/77235-Terms-of-Service; unavailable through the research tool.
- Consequently **no direct automated catalog crawler, bulk extraction, recursive fetch, anti-bot bypass, login, private endpoint access, or media download was run**.
- Used a small number of public search-index excerpts already returned by the research tool. No claim is made that robots/terms grant scraping permission.
- Any future collection must recheck the actual domain’s robots.txt and terms, use a clear user agent, bounded requests and delay/backoff, stop on 401/403/429, and honor disallows. If permission is unclear, stop and use licensed/manual metadata.
- Only short factual fields are retained. No long synopsis, reviews, cover art, trademark logo file or ebook text was copied.

## Seed provenance

| Title     | Author          | Public fields |
| --------- | --------------- | ------------- |
| JELIK     | Ismi Fa Ismail  | Title, author |
| RENJANA   | Qiydenneskala   | Title, author |
| AMUK      | Khairi Mohd     | Title, author |
| JELAGA    | Faizal Sulaiman | Title, author |
| GANTUNG:3 | Nadia Khan      | Title, author |
| MOTEL     | Sahidzan Salleh | Title, author |

Each row has `provenance=public_metadata` and `source_url` pointing to the official store. **This tag applies to identity metadata only**, not the complete row. Prices happen to resemble the public listings but are explicitly independently chosen **demo prices**, not guaranteed current offers.

| Fields/data                                                 | Classification                                     |
| ----------------------------------------------------------- | -------------------------------------------------- |
| Publisher name, establishment year, public website          | Public metadata (MABOPA / official domain)         |
| Six titles and associated author names                      | Public metadata (official-store index)             |
| Genres/categories                                           | Invented editorial demo classification             |
| Descriptions                                                | Newly written demo copy; not copied synopses       |
| Prices, stock, capacity, dates, flat RM8 shipping           | Invented demo commerce configuration               |
| Kota Selepas Hujan; Catatan Kota; Demo Editorial Collective | Entirely invented                                  |
| All order/payment/profile/access records created in demo    | Invented by demo participants                      |
| CSS/canvas geometric covers; favicon; 3D book geometry      | Original code-generated artwork                    |
| Interface wordmark FIXIHUB                                  | Requested project name; not a reproduced FIXI logo |
| Internal workflow and pain points                           | Academic hypotheses pending interview              |

No commercial affiliation, endorsement, inventory availability, retailer commission amount, or present-day business process is asserted.

## Technical primary references

- Next.js PWA guide: https://nextjs.org/docs/app/guides/progressive-web-apps
- Supabase row-level security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Installed package versions are locked by package-lock.json; Next.js 16.3.8 was confirmed against the package registry during setup.


## Subsequent logo refinement
At the explicit user request, the FIXI logo was retrieved from MABOPA after a successful robots check. See [BRANDING.md](BRANDING.md) for URL, hash, access record, rights status and design decisions. This supersedes the initial no-logo-copying note.

## Book cover audit — 4 October 2026

All six real catalog titles have published front-cover assets already bundled in the project. Their printed title/author matches were visually checked and corroborated against public retailer metadata. See [COVERS.md](COVERS.md) and `lib/cover-sources.json` for exact sources, hashes, and acquisition limits. This supersedes earlier placeholder-only descriptions. The original unrestricted downloader has been retired; no fresh bulk scraping was performed. The two fictional titles retain demo art.
