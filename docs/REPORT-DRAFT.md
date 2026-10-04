# FIXIHUB: Publisher Order and Preorder Management

## BIK11003 SEM I 2026/2027 — report source draft

**Status:** Academic implementation draft. Group number, member names, lecturer, organization permission/visit evidence and stakeholder findings remain to be supplied. This Markdown is not the final DOCX submission.

## 1. Abstract

FIXIHUB is a database-driven prototype for managing a publisher’s catalog, book orders, preorder campaigns, payment evidence, postage settlement and digital-access records. The project uses publicly attributed Buku Fixi metadata as a realistic catalog reference while separating invented operational data. A Next.js interface connects to Supabase authentication, PostgreSQL and private storage. Normalized master tables and join relations link authors, categories, books and orders. Transaction functions calculate prices, reserve inventory and enforce payment and fulfillment rules. A responsive PWA interface and original interactive 3D book covers support the demonstration. Actual organizational workflow validation and visit certification remain outstanding.

## 2. Introduction

Independent publishers may need to reconcile book reservations, payment receipts and postage across different records. The motivating conversation proposed that fragmented submissions could cause duplicates or unclear payment matches. These are hypotheses for investigation, not verified findings about Buku Fixi.

The project aims to centralize customer identity, catalog data, order items, payment types, shipment status and ebook entitlements. Buku Fixi is an appropriate public catalog reference because its trade-association profile describes fiction publishing in Malay and English and an establishment year of 2011. FIXIHUB is not affiliated with the publisher.

Scope includes customer accounts, catalog maintenance, preorders, checkout, receipt submission/review, separate postage accounting, shipping, digital entitlement/access records and reports. No payment gateway or copyrighted ebook files are included.

## 3. Method

1. Inspect the original two-page BIK11003 project brief and map every requirement.
2. Research a limited set of public publisher/title/author facts with attribution.
3. Mark all business workflows and commercial data as assumptions/demos pending interview.
4. Define business rules, transaction modules, entities, constraints and ERD segments.
5. Normalize master data and document deliberate purchase snapshots.
6. Implement responsive frontend and transactional Supabase backend.
7. Verify business rules, relational permissions, build, browser flows and mobile layout.
8. **To be completed by group:** obtain permission letter, arrange professional visit, validate workflow/data flow, obtain authentic signature/stamp and revise assumptions.

Public robots/terms checks were unavailable, so no bulk crawler or access-control bypass was used. Original geometric covers replace protected artwork.

## 4. Analysis and Design

See BUSINESS-RULES.md for BR01–BR32, TRANSACTIONS.md for the nine major modules, SCHEMA.md for attributes/cardinalities/constraints, and ERD-SEGMENTS.md for module diagrams.

The model includes profiles, publishers, books, authors, categories, campaigns, orders, order items, payments, shipments, entitlements, access events and audit events. book_authors and book_categories implement many-to-many relationships. order_items connects orders and books while preserving quantity and purchase price.

Checkout is an atomic transaction. Client price values are ignored, stock/capacity are locked and decremented, and an idempotency key prevents duplicate retries. Payments are split into book and shipping kinds against one order. Only admins may verify receipts. Physical fulfillment requires settlement and release eligibility; digital entitlements follow verified book payment.

Master data follows 3NF. Order name/address and line title/price/format are intentional historical snapshots. Reservation totals and entitlement ownership are documented controlled redundancy.

## 5. Results and Discussion

The implemented application provides a working storefront and publisher workspace, browser-local demo operation, and a Supabase-connected adapter with SQL migrations/seed. Public and invented data are visibly distinguished.

Local verification includes:

- Production compilation and TypeScript checking.
- Rule tests for quantities, stock, preorder windows/capacity, receipt limits and CSV encoding.
- PostgreSQL/PGlite migration and transaction tests with mocked Supabase auth/storage schemas.
- Browser tests covering catalog search, themes, responsive layout, 3D rendering, mixed checkout, two receipt uploads, admin verification, shipping/delivery, ebook access recording, catalog/campaign creation, CSV and PWA resources.

Consult TESTING.md for final outcomes and remaining hosted checks. No results from an unconfigured hosted Supabase project are claimed. Hosted email confirmation, actual Storage service behavior and public deployment require operator setup.

The organization’s actual workflow has not been validated. A production system would additionally need agreed refund/cancellation, reservation expiry, postage-zone, retention and licensed digital-content rules.

## 6. Conclusion

FIXIHUB demonstrates how a relational database can connect books, customers, preorders, payments and fulfillment through consistent identifiers and controlled transactions. It satisfies the implementation/design portion of the brief with actual join tables and connected modules. Completion of the academic study still depends on stakeholder permission, fieldwork, validated requirements and authentic appendix evidence.

## 7. References

1. GROUP PROJECT BIK11003 SEM I 2026/2027, supplied assignment brief (preserved in reference/).
2. Malaysian Book Publishers Association, Buku Fixi. https://www.mabopa.com.my/ms/ahli/buku-fixi
3. Buku Fixi official domain and official-store public index. https://fixi.com.my/ and https://shopee.com.my/bukufixi.os
4. International Alliance of Independent Publishers, Buku Fixi. https://alliance-editeurs.org/buku-fixi%2C1944?lang=en
5. Next.js PWA documentation. https://nextjs.org/docs/app/guides/progressive-web-apps
6. Supabase RLS documentation. https://supabase.com/docs/guides/database/postgres/row-level-security

Public-source observation date: 4 October 2026. See RESEARCH.md for field-level provenance.

## 8. Appendix

**Outstanding authentic evidence:** administration permission letter; appointment/visit record; stakeholder-validated notes; organization signature/official stamp; optional consented group photograph. Do not substitute generated evidence.

**Technical evidence:** migration SQL, seed, data dictionary, full/module ERDs, normalization notes, test output, UI screenshots, demo script and setup guide.

### Suggested 20-page allocation

Abstract/introduction 2 pages; method 2; analysis/design 8 (including ERDs and normalization); results/discussion 3; conclusion/references 2; appendix 3. Adapt to the official AITCS formatting rules and include all figures/tables within the 20-page limit.

### Submission / presentation reminder

Prepare **groupno_projectDB.docx**, submit as a group through author.uthm.edu.my, assignment section, in Week 13/14 at the lecturer’s specified date. Present requirements/design, ERD, normalization and full working system for 30 minutes in Week 13. The original brief gives no exact calendar dates.

Suggested presentation: motivation/method 5 min; rules/modules 5; ERD/normalization 8; live demo 9; limitations/conclusion 3.
