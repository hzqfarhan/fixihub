# Module-level ERD segments

All nodes below map to implemented database tables. AUTH_USERS is Supabase-managed. See SCHEMA.md for attributes and constraints.

## Customer and order module

```mermaid
erDiagram
 AUTH_USERS ||--|| PROFILES : creates
 PROFILES ||--o{ ORDERS : places
 ORDERS ||--|{ ORDER_ITEMS : contains
 BOOKS ||--o{ ORDER_ITEMS : references
```

## Catalog module

```mermaid
erDiagram
 PUBLISHERS ||--o{ BOOKS : publishes
 BOOKS ||--o{ BOOK_AUTHORS : has
 AUTHORS ||--o{ BOOK_AUTHORS : credited
 BOOKS ||--o{ BOOK_CATEGORIES : classified
 CATEGORIES ||--o{ BOOK_CATEGORIES : contains
```

## Preorder module

```mermaid
erDiagram
 BOOKS ||--o{ PREORDER_CAMPAIGNS : offered
 PREORDER_CAMPAIGNS o|--o{ ORDER_ITEMS : reserved
 ORDERS ||--|{ ORDER_ITEMS : contains
```

## Payment and shipping modules

```mermaid
erDiagram
 ORDERS ||--o{ PAYMENTS : receives
 PROFILES o|--o{ PAYMENTS : verifies
 ORDERS ||--o| SHIPMENTS : ships
 PROFILES o|--o{ AUDIT_EVENTS : logs
```

## Ebook module

```mermaid
erDiagram
 PROFILES ||--o{ EBOOK_ENTITLEMENTS : owns
 ORDERS ||--o{ EBOOK_ENTITLEMENTS : grants
 BOOKS ||--o{ EBOOK_ENTITLEMENTS : represents
 EBOOK_ENTITLEMENTS ||--o{ EBOOK_ACCESS_RECORDS : records
```

The full integrated ERD merges these segments using common PK/FK attributes; no duplicate customer/book entities are introduced.
