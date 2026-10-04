# Setup, deployment and operation

## Local demo

Node 22+; npm ci; npm run dev. No secrets required. Demo mode is clearly labelled and browser-local. Open /admin and use the demo admin action for the publisher workspace.

## Supabase provisioning

Apply migration then seed using the Supabase SQL editor or CLI. New local stack: supabase start, then supabase db reset. The CLI requires Docker. Remote: link the intended project and apply migrations; execute seed.sql separately if desired. Migration is a one-time schema creation migration, not a repeatable SQL script. The seed uses conflict-safe inserts.

Configure:

- NEXT_PUBLIC_SUPABASE_URL: project API URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY: public anon/publishable API key
- Supabase Auth Site URL and exact redirect origin
- Email confirmation and production SMTP
- Database owner promotion of the intended admin UUID, after registration

Do not place database passwords/service-role credentials in browser environment values. No service-role credential is required by this app.

## Hosting

The app builds as standard Next.js with a dynamic /books/[id] route. On Vercel, import this directory, choose Next.js, add public Supabase variables, then deploy. On a Node host:

1. Install Node 22+ and dependencies using npm ci.
2. Set the two public environment variables before npm run build.
3. Run npm run build.
4. Run a managed npm run start process behind an HTTPS reverse proxy.
5. The start script binds 127.0.0.1 by default for local safety. In a container that must accept external traffic, use next start --hostname 0.0.0.0 --port 3000.
6. Set Supabase Auth URL allowlist to the final HTTPS domain.
7. Run acceptance checks with two readers and an admin.
8. Enable database backups, retention procedures and availability monitoring before real use.

No cloud project or production deployment was created during this task; a Supabase project and deployment account were not supplied.

## PWA / offline behavior

app/manifest.ts includes standalone display, name, start URL, scope, colours and PNG icons. Shell registers public/sw.js and listens for the browser install event. HTTPS is required in production. On platforms without an install event, use the browser’s install/share menu.

The service worker caches only an offline page and public icons. It never caches Supabase/API traffic or authenticated HTML. Offline navigation falls back to offline.html; account/order operations require connectivity. There is no offline order queue that could cause duplicate purchases on reconnection.

Increment CACHE in sw.js when changing static offline assets. Activation removes old named caches. Public static assets are served by Next.js; authentication is Supabase client-side plus database-enforced RLS.

## Privacy and security

- RLS enabled on all public tables; direct mutation privileges revoked.
- SECURITY DEFINER functions require auth/role checks and fixed search paths.
- Server-side prices and stock/campaign locks; request ID for checkout retries.
- Private receipt bucket, max 5 MB, allowed MIME types. Owner path and existing order checked.
- Receipts immutable to customers; admin signed URL lifetime 60 seconds.
- No role self-promotion, no default admin credentials.
- No automatic payment approval. Verify against actual bank records.
- No ebook assets provided; access checks validate ownership before logging.
- UI escapes content through React. CSV exporter escapes quotes and formula-leading cells.
- Security response headers prevent framing and MIME sniffing.
- Demo receipts use IndexedDB; demo records/local preferences can be cleared via browser site-data controls.
- Supabase sessions use the JS client’s standard local storage persistence. A production security review may choose a server-cookie session architecture and stricter CSP depending on operational risk.

## Operational limits and maintenance

Receipt upload and DB submission are two operations; an upload whose metadata submission fails can leave an orphan object. Implement a reviewed retention task if needed. Do not remove objects referenced by payments.

Unpaid stock reservations do not auto-expire. Operator-controlled cancellation/refund/release workflows are future extensions; avoid real commercial use without agreeing those rules. The supplied seed is always noncommercial demo pricing and does not assert real stock.

To distribute licensed ebooks later, add a private asset mapping and a server-side signed-download function that checks an active owned entitlement on every request, records download attempts, and returns short-lived links. Do not expose raw bucket paths or make a copyrighted bucket public.

## Troubleshooting

- Empty/failed live catalog: inspect the visible error, verify migration/seed and public environment values, restart/rebuild.
- Sign-up confirmation not arriving: verify SMTP and Auth logs/redirect URLs; do not disable confirmation in a public deployment merely to hide delivery failures.
- Access denied in admin: confirm profiles.role for the current auth UUID, then refresh/sign in again.
- Receipt upload denied: verify bucket exists, file size/type, owner ID and order path.
- Shipment blocked: verify both payment kinds and campaign release time.
- Local port unavailable: choose another port with npm run dev -- --port 3001.
- PWA not installable: check HTTPS, manifest/icons responses, browser support, and existing installation state.
