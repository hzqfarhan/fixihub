# Business operations and rules

## Proposed operations (validate with stakeholder)

A publisher maintains books, authors, categories and optional preorder campaigns. A registered reader builds a bag of physical books and/or digital editions. Checkout ties all items to one stable customer ID and order ID. Physical stock or preorder capacity is reserved atomically. The reader submits book and postage receipts independently against the same order. An administrator checks each receipt against a bank record, verifies it or provides a rejection reason. Verified book payment grants any digital entitlements. Physical fulfillment requires both book/postage settlement and campaign release dates. Tracking and completion are recorded. Administrators review totals and export order reports.

This is the **proposed workflow**, not a verified description of FIXI’s internal operations. Public research establishes publisher/catalog facts only.

## Rules and enforcement

| ID   | Rule                                                                                                                | Enforcement                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| BR01 | Every order belongs to exactly one authenticated profile                                                            | auth.uid(), orders.customer_id FK           |
| BR02 | Signup always produces a customer; only database owner appoints admins                                              | Auth trigger; no role write grants          |
| BR03 | A book belongs to one publisher; authors and categories are many-to-many                                            | FKs and composite join PKs                  |
| BR04 | Books have positive MYR price, nonnegative stock, allowed format                                                    | SQL CHECK constraints                       |
| BR05 | An order has 1–30 distinct book lines; quantity is integer 1–10 per physical line and exactly 1 per digital line    | checkout validation + item constraints      |
| BR06 | Authoritative price comes from the database, not the client                                                         | checkout selects locked book row            |
| BR07 | Physical stock cannot go negative; ebook stock is not decremented                                                   | Row locking + stock CHECK                   |
| BR08 | Preorders require active campaign, matching book, open window and available capacity                                | Locked campaign lookup                      |
| BR09 | Capacity reservation and all stock decrements succeed/rollback together                                             | One PostgreSQL transaction                  |
| BR10 | One active campaign per book; opening < closing <= release; capacity >= reserved                                    | Unique partial index and CHECKs             |
| BR11 | Retrying checkout with same customer/request UUID returns the existing order                                        | Customer row lock + unique idempotency key  |
| BR12 | Any physical item incurs a single RM8 demo shipping charge; ebook-only incurs zero                                  | Server quote; UI explanation                |
| BR13 | Physical orders require a full address (12–1000 characters); digital orders may omit it                             | checkout validation                         |
| BR14 | Receipts belong to an existing order owned by uploader; JPEG/PNG/PDF <=5 MB                                         | Storage policy/bucket + submit_receipt      |
| BR15 | Receipt references must already exist in private storage, in customer/order path                                    | submit_receipt validates storage object     |
| BR16 | At most one pending and one verified payment per order/payment kind                                                 | Partial unique indexes                      |
| BR17 | Amount is the full book or shipping total, set by server, not client                                                | submit_receipt computes amount              |
| BR18 | Only admin can decide a pending payment; rejection requires a reason                                                | review_payment checks role/state/note       |
| BR19 | Receipt objects cannot be overwritten or deleted through customer policies                                          | No update/delete storage policies           |
| BR20 | Book and shipping verification are independent; shipping never grants an ebook                                      | review_payment handles book kind only       |
| BR21 | Book verification creates one entitlement per digital line/order                                                    | Unique order/book + conflict-safe insert    |
| BR22 | Shipping requires processing status, verified books, verified nonzero postage, release date reached, valid tracking | fulfill_order                               |
| BR23 | Only a shipped order may be confirmed delivered/completed                                                           | fulfill_order transition check              |
| BR24 | Ebook-only order completes on book verification; mixed order proceeds through physical shipping                     | review_payment                              |
| BR25 | Only active entitlement owner can record access                                                                     | record_ebook_access; RLS                    |
| BR26 | Entitlement checking returns a message, not a copyrighted file                                                      | No licensed assets attached                 |
| BR27 | Customer may read only own profile/orders/payments/shipments/entitlements/access                                    | RLS ownership policies                      |
| BR28 | Admin sees operational records; anonymous user sees public catalog only                                             | RLS and SELECT grants                       |
| BR29 | Archived books cannot be checked out; historical order snapshots remain                                             | active check, FKs, immutable item snapshots |
| BR30 | Important changes record actor, event and timestamp                                                                 | audit_events inserts within RPCs            |
| BR31 | Customer profile update changes only display name                                                                   | update_profile RPC                          |
| BR32 | Book format/provenance/source and campaign book cannot be changed after creation by editor RPC                      | Explicit conflict-update field allowlist    |

## State transitions

Order: awaiting_payment → processing → shipped → completed (physical).  
Order: awaiting_payment → completed (digital-only).  
Payment: pending → verified OR rejected. Rejected receipt can be replaced with a **new** payment submission; historical record remains.

Book verification may precede or follow postage verification. A reader’s different email does not break matching because the system uses immutable auth/profile/order UUIDs.

## Explicit assumptions / exclusions

Single publisher workspace with MYR prices. Administrator is organization-wide, not multi-tenant. A mixed physical/preorder order ships once after all campaign release dates. No split shipments, partial payments, refunds, cancellation, automatic unpaid reservation expiry, real courier integration, tax calculation or payment gateway is implemented. Release dates can be amended by an administrator and should be communicated operationally. Existing unpaid reservations require manual reconciliation before using this beyond coursework.
