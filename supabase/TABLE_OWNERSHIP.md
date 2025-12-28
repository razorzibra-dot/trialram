Table ownership guide

- `sale_items`:
  - Origin: Created in the CRM core schema (migration `20250101000003_crm_customers_sales_tickets.sql`).
  - Purpose: Line items for the legacy `sales` (product sales / orders) module. Holds per-product lines (quantity, unit_price, line_total).
  - Notes: Several later migrations add a nullable `deal_id` to `sale_items` to allow linking a sale item to a `deals.id` when appropriate, but the canonical owner is the Product Sales / Sales module.

- `deals` and `deal_items`:
  - Origin: Created later as part of the sales pipeline (migration `20251117000007_create_sales_pipeline_tables.sql`).
  - Purpose: `deals` represents CRM deals/pipeline records; `deal_items` stores items attached specifically to deals (supports both product and service line items).
  - Notes: Business logic for CRM deals should prefer `deal_items`. The system allows linking `sale_items` to `deals` via a nullable `deal_id` for backward compatibility or integration scenarios.

Recommendation

- Keep both tables:
  - `sale_items` for product-sales/order history and accounting.
  - `deal_items` for CRM pipeline deal lines.
- If you want to consolidate (remove duplication), plan a data migration to move relevant `sale_items` rows into `deal_items` and then deprecate `sale_items` (requires careful data migration and audit considerations).

If you want, I can:
- Add example `deal_items` seed rows for local testing.
- Create a data-migration script to copy selected `sale_items` into `deal_items` and set `sale_items.deal_id` where appropriate.
- Update application code to enforce which table is used by each module (if any references are currently mixed).