# Normalization notes (UNF → 3NF)

## Starting unnormalized record

A spreadsheet-style order row might contain customer details, a list of books, comma-separated authors, categories, quantities, book/postage receipts and tracking. Repeated order rows create duplicate customer details and ambiguous receipt matching. This is an illustrative starting model, **not an obtained FIXI spreadsheet**.

## 1NF: atomic values and no repeating groups

Separate each order line into order_items. Authors and categories become rows in their own tables and are associated through book_authors/book_categories. Each payment attempt is one payments row with a single payment kind. Multiple access checks become ebook_access_records. The display view may aggregate author/category names for presentation; the normalized underlying relations remain separate.

The address is an intentionally atomic delivery-label snapshot for this prototype; street/city/postcode are not independently searched or reported. If geographic reporting/rating is introduced, model structured address components.

## 2NF: remove partial-key dependencies

For an initial composite OrderLine(order_id,book_id), current book title/price depend only on book_id, while order date/customer depend only on order_id. Move current catalog attributes to books and order-level attributes to orders. Keep quantity and unit_price-at-purchase on the line.

book_authors has composite PK(book_id,author_id) and no non-key attributes; book_categories likewise. Author name belongs only to authors, category name only to categories. Neither join table repeats the parent names.

## 3NF: remove transitive dependencies

Publisher name/site depends on publisher_id, so publishers is separate. Customer display name/role depends on profile ID, so profiles is separate. Campaign dates/capacity depend on campaign ID, not on order ID. Shipment tracking belongs to a shipment, not the catalog or customer. Access events belong to an entitlement.

Typical functional dependencies:

- book_id → publisher_id, title, slug, price, stock, format, color, description, source_url, provenance, active
- author_id → name; category_id → name; publisher_id → publisher attributes
- order_id → customer_id, request_id, timestamp, status, address snapshot, customer_name snapshot, contracted totals
- (order_id, book_id) → quantity, unit_price snapshot, campaign_id, title snapshot, format snapshot
- payment_id → order_id, kind, amount, status, path, reviewer, timestamps
- campaign_id → book_id, title, dates, capacity, reserved, active
- entitlement_id → order_id, book_id, customer_id, active, created_at
- access_id → entitlement_id, outcome, created_at

## Deliberate historical snapshots / redundancy

Some duplication is intentional and explicitly documented:

1. order_items.title/format/unit_price are **purchase-time facts**. Later catalog changes must not rewrite a historical invoice.
2. orders.customer_name/address are the contracted delivery snapshot, not a live copy of the customer’s current profile.
3. orders.book_total stores the transaction’s sum of item quantities × snapshotted prices; shipping_total stores the contracted shipping charge. Totals are computed exclusively inside checkout.
4. preorder_campaigns.reserved is a maintained aggregate for efficient capacity locking; it is changed in the same transaction as order creation.
5. ebook_entitlements.customer_id is derivable through order_id. This is an intentional ownership index/RLS optimization, not a claim of strict theoretical 3NF for every column. Only the verification RPC writes it and selects the actual order customer.

These are controlled denormalizations. Direct client writes are forbidden; SQL transaction boundaries prevent UI-level partial updates. The ERD reflects both normalized master data and these documented operational snapshots.

## Anomalies avoided

- Updating an author name need not alter every order line.
- A category can exist before a book is assigned.
- Archiving a book does not erase order history.
- Rejected receipt attempts remain traceable without overwriting accepted evidence.
- One customer’s stable ID connects book/postage receipts even if their contact email changes.

## Result

Master entities and joins follow 3NF. Historical snapshots and the reservation/ownership aggregates are justified exceptions with explicit maintenance rules. The assignment’s mandatory join-table requirement is met by three actual implemented tables, not merely a diagram.
