# Verification record

Verified locally on 4 October 2026.

## Completed automated checks

| Check                                           | Outcome                                                 |
| ----------------------------------------------- | ------------------------------------------------------- |
| Production Next.js build                        | Passed                                                  |
| TypeScript strict checking                      | Passed                                                  |
| Business-rule unit tests                        | 7 passed                                                |
| PostgreSQL migration + seed execution in PGlite | Passed                                                  |
| SQL authorization/transaction integration suite | Passed                                                  |
| Playwright browser scenarios (Chrome)           | 3 passed                                                |
| Dependency audit on installed lockfile          | 0 known vulnerabilities reported by npm at install time |

### SQL integration coverage

Anonymous catalog access and checkout denial; customer role escalation/direct mutation denial; authoritative price ignoring client price; physical/digital totals; idempotent checkout retry; correct stock decrement; customer A/B order and item isolation; receipt ownership/missing-object rejection; duplicate receipt prevention; self-approval denial; rejection-note requirement; verified payment state protection; ebook creation/access ownership; private receipt read isolation; shipment blocked before postage; shipping/delivery transitions; full stock rollback on later-line failure; invalid quantity; exhausted preorder capacity; admin catalog save.

The PGlite harness executes the actual migration and seed. It supplies mock auth.users/auth.uid and storage schemas, and omits pgcrypto because gen_random_uuid is built in. It tests PostgreSQL semantics, not Supabase’s hosted HTTP/Auth/Storage services. Concurrent multi-connection races were not load-tested.

### Browser coverage

1. Home/3D canvas, catalog author search, dark theme; mobile route navigation and overflow check at 390×844; reduced-motion static fallback; no page exceptions during this scenario.
2. Mixed physical/ebook checkout, address, RM8 separate postage, both receipt uploads, private receipt loading, admin verification, tracking/shipped/delivered transitions, ebook entitlement access recording and persistence after reload.
3. Add catalog book, create campaign, CSV download, PWA manifest and PNG resources, service worker registration, offline shell cached and no orders/admin HTML cached.

A campaign-select accessibility label was clarified after an initial selector failure; all scenarios then passed. Desktop/mobile light and desktop dark screenshots were visually inspected; no clipping or horizontal page overflow was observed in the tested routes.

## Hosted acceptance checks — outstanding

No Supabase project credentials or deployment were supplied. Before treating the project as a hosted system:

- [ ] Apply migration and seed to the intended Supabase project.
- [ ] Configure URL/public key and rebuild the app.
- [ ] Confirm real email signup/confirmation/sign-in/sign-out.
- [ ] Verify two distinct real customer accounts cannot read each other’s data through REST or Storage.
- [ ] Verify an ordinary customer cannot invoke admin RPCs.
- [ ] Upload allowed receipts; reject >5 MB, disallowed MIME and wrong-owner paths through the actual Storage API.
- [ ] Confirm private signed links expire and unsigned direct access is denied.
- [ ] Exercise mixed/digital/preorder checkout on the live project.
- [ ] Check concurrent last-stock and last-capacity purchases from two sessions.
- [ ] Confirm real admin verification and authorized shipping transitions.
- [ ] Install the PWA over HTTPS on the intended phone/browser.
- [ ] Test genuine network loss and reconnection.
- [ ] Confirm database backups, role onboarding and receipt retention procedures.
- [ ] Replace/confirm demo commerce values before any non-demo use.

## Manual academic checks — outstanding

- [ ] Administration permission letter and organization appointment.
- [ ] Actual workflow/data-flow interview and business-rule validation.
- [ ] Authentic organization signature/stamp in appendix.
- [ ] Group identity and lecturer-specific submission date.
- [ ] Final groupno_projectDB.docx in prescribed AITCS format, maximum 20 pages.
- [ ] 30-minute Week 13 presentation rehearsal.

This is a working implementation with tested local workflows, not a claim of completed fieldwork, licensed ebook distribution, verified real payments, or production certification.
