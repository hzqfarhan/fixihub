# FIXIHUB

A working academic publisher order/preorder application built with **Next.js 16 App Router, TypeScript, React 19, Supabase Auth/Postgres/Storage, React Three Fiber / Three.js, and PWA support**.

**Not an official Buku FIXI service.** Public title/author facts are credited; all commercial values, campaigns, covers and operational assumptions are demo data. No copyrighted ebooks are distributed.

## Run immediately

Requires Node.js 22+ and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. With no Supabase environment values, the app runs in **device-local demo mode**. The storefront, cart, checkout, receipt upload, admin review, shipping, catalog editing, campaign editing, reporting and ebook access records all work. Orders/catalog changes persist in localStorage; demo receipt blobs use IndexedDB; the bag uses sessionStorage. Use fictional receipts only. Demo data is not shared between browsers/devices.

Use the footer **Switch to demo admin**, then **Publisher workspace**. Switch back to demo reader to view the customer experience. This role switch exists only when Supabase is unconfigured. Connected users cannot change roles themselves.

## Connect Supabase

1. Create a Supabase project, or run the Supabase CLI local stack with Docker: `supabase start`.
2. Apply `supabase/migrations/001_fixihub.sql`, then `supabase/seed.sql` in the SQL editor. For the local stack use `supabase db reset`. For a linked project use `supabase db push` for migrations and run the seed separately. Never reset a production database.
3. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` and the public anon/publishable key in `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Never put a service-role key in a NEXT_PUBLIC variable.
4. In Supabase Auth, configure Site URL and allowed redirects for the actual origin. Enable email/password and email confirmation; configure an SMTP provider for reliable confirmation delivery.
5. Restart Next.js. Register a user at `/account` and confirm their email.
6. After verifying the account ID, the database owner can promote the intended administrator in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where id = 'ACTUAL_AUTH_USER_UUID';
```

7. Register a second reader and verify the permissions using the acceptance checklist. No default admin password or seeded auth accounts exist.

The migration creates a **private** receipts bucket (JPG/PNG/PDF, maximum 5 MB), ownership policies and transactional RPCs. Clients read through RLS and mutate via authorized database functions. A broken configured connection shows an error; it does not silently switch to demo mode.

## Demo walkthrough (5–8 minutes)

1. Browse `/catalog`; search by author and open a 3D product view.
2. Add JELIK and the invented ebook CATATAN KOTA. Checkout requires a delivery address and shows RM8 demo postage separately.
3. At `/orders`, upload a fictional receipt for books and a separate receipt for postage.
4. Switch to demo admin; load each receipt in Payment review, inspect it, then verify. Rejecting requires a reason; the reader can resubmit.
5. In Orders, add a tracking number. Shipping is blocked until both payments are verified. Confirm delivery afterward.
6. Return to the reader library: ebook entitlement exists after book payment, even before physical shipping. **Check access** records an access event; there is deliberately no ebook download file.
7. Use publisher Catalog to add/edit/archive books, Preorders to create/update campaigns, and Reports to export CSV.
8. Add a preorder to verify capacity reservation and release-date fulfillment restrictions. The seeded campaign is explicitly fictional.

## Implemented surfaces

| Route       | Purpose                                                         |
| ----------- | --------------------------------------------------------------- |
| /           | Editorial storefront and interactive 3D hero                    |
| /catalog    | Search, genre filtering, sorting                                |
| /books/[id] | Book metadata, source attribution, 3D product viewer            |
| /preorders  | Campaign window, capacity, release dates, reserve action        |
| /cart       | Quantities, removal, address, authoritative checkout            |
| /account    | Supabase signup/sign-in, profile, sign-out                      |
| /orders     | Order history/status, separate receipt uploads and review notes |
| /library    | Ebook entitlement and access-check history                      |
| /admin      | Orders, payment review, catalog, campaigns, customers, reports  |
| /about      | Public/demo provenance and academic disclosure                  |

Admin sections use local tabs within `/admin`. Auth and RLS protect data even if someone navigates directly to the URL.

## Checks

```sh
npm run typecheck
npm test
npm run test:db
npm run build
npm run start
# With the production server running on 127.0.0.1:3000:
npm run test:e2e
```

Browser tests use installed Chrome (`channel: 'chrome'`). Install Chrome or change Playwright to an installed browser. `PLAYWRIGHT_BASE_URL` can override the test target. Database tests use real PostgreSQL in PGlite with **mock Supabase auth/storage schemas**, exercising the migration, seed, RLS and transaction functions. They are not a substitute for the hosted Storage/Auth acceptance checks.

## Deploy

See [deployment instructions](docs/DEPLOYMENT.md). Build with `npm run build`, deploy to a standard Next.js Node host or Vercel, and set the two public Supabase variables **before building**. Rebuild after changing them. This project uses real Next.js, not a substitute framework.

The PWA needs HTTPS except on localhost. Browser install is offered when supported. On iOS use Share → Add to Home Screen. Offline mode serves a dedicated offline page; authenticated pages, customer data, receipts and API responses are never cached by the service worker.

## Coursework documents

- [Original BIK11003 brief](docs/reference/projectinstructionbik11003semi2627.pdf)
- [Requirement traceability](docs/REQUIREMENTS.md)
- [Business operations and rules](docs/BUSINESS-RULES.md)
- [Transaction modules](docs/TRANSACTIONS.md)
- [Schema/data dictionary and complete ERD](docs/SCHEMA.md)
- [Module ERD segments](docs/ERD-SEGMENTS.md)
- [Normalization analysis](docs/NORMALIZATION.md)
- [Public research and provenance](docs/RESEARCH.md)
- [Report draft with all eight required sections](docs/REPORT-DRAFT.md)
- [Deployment and security](docs/DEPLOYMENT.md)
- [Verification and acceptance checklist](docs/TESTING.md)

## Scope boundaries

- The organization’s actual internal workflow has **not** been observed. The student group must obtain permission, meet the organization, validate assumptions and obtain its signature/stamp. No evidence is invented.
- A formal `groupno_projectDB.docx` must be prepared in the prescribed format and kept within 20 pages. The report draft is source material, not a falsely completed submission.
- No Supabase credentials were supplied during implementation. Hosted Auth/email/Storage integration and production deployment require the project operator’s setup. Local database and browser tests validate the supplied implementation.
- No payment gateway or bank integration. Verification is a human action after inspecting bank records; a receipt alone is not proof.
- Flat demo postage is RM8 for an order with any physical books; real zone rates/taxes/refunds/cancellation are outside this requested prototype.
- Unpaid orders reserve stock/capacity until manually reconciled by an operator. There is no automatic expiration/cancellation/restock job.
- No copyrighted file storage/download. Entitlements and access records are implemented; adding licensed assets later requires an authorization check and short-lived signed links.
- Demo mode is for one browser and does not provide cross-tab/concurrent transaction guarantees. PostgreSQL functions are the authoritative implementation for multiple users.

Code structure: `components/provider.tsx` exposes the connected/demo data adapter; `lib/rules.ts` provides UI validation; database functions independently enforce all important business rules. SQL is the source of truth for live transactions.
