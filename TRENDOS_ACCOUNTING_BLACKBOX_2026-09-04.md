# TrendOS Accounting — Black Box Checkpoint

Date: 2026-09-04
Repository: `fawakhry/TrendOs`
Working branch: `agent/go-live-2026-09-01-integrity`
Purpose: persistent handoff record for the Accounting workstream and its future integration with TrendOS Operations.

---

## 1. Product boundary

The current workstream is **TrendOS Accounting** as a real accounting application/program, not a Google Sheet product.

It must remain logically separate from:
- TrendOS Operations
- TrendOS Profit Engine
- TrendOS Partner Network

The systems may be merged into one TrendOS platform later, so identifiers and contracts must be designed now for safe integration.

Important scope decision: **TrendOS Accounting itself does NOT contain partner/investor profit-sharing percentages.** Partner percentages, investor distributions, machine-owner shares, execution commissions, and profit-distribution rules belong to `TrendOS Profit Engine / Partner Network`, not the core Accounting module.

Accounting may expose factual revenue/cost/payment data to those engines later.

---

## 2. Non-negotiable integration keys

### Order ID
`Order ID / رقم الأوردر` is the primary cross-system order reference.

Example:
`TM260630015`

Never link accounting to operations primarily by customer name or phone number.

### Line ID
Order-level linkage alone is not sufficient because one order can contain multiple production lines/items handled differently.

Each order line must have a stable `Line ID`.

Recommended model:
- Order ID: `TM260630015`
- Line ID: `TM260630015-001`
- Line ID: `TM260630015-002`

This is consistent with the main TrendOS integrity architecture where Order ID identifies orders and Line ID identifies order lines.

### Additional IDs to preserve
- `Item ID` — stable item/product/material identifier
- `Invoice ID` — accounting invoice identifier
- `Purchase ID` — purchase transaction identifier
- `Stock Movement ID` — immutable inventory movement identifier
- `Payment ID` — payment/receipt identifier

Do not overload Order ID to replace these entity IDs.

---

## 3. TrendOS Accounting core modules

Accounting V1/V2 product scope:

1. Sales / المبيعات
2. Sales Lines / بنود المبيعات
3. Purchases / المشتريات
4. Purchase Lines / بنود المشتريات
5. Expenses / المصروفات
6. Cashbox / الخزنة
7. Suppliers / الموردين
8. Inventory / المخزون
9. Stock Movements / حركة المخزون
10. Items / دليل الأصناف
11. BOM / مكونات الأصناف
12. Product Formation / تكوين الأصناف
13. Customer receivables / مديونيات العملاء
14. Supplier payables / مستحقات الموردين
15. Invoice profitability
16. Daily profitability
17. Period profitability
18. Income Statement / قائمة الدخل
19. Financial Dashboard / لوحة التحكم المالية
20. Daily business pulse / نبض المطبعة or equivalent owner dashboard

The UI should be Arabic-first, practical, and optimized for daily work rather than accounting complexity.

---

## 4. Required sales data

Sales header should support at least:
- Invoice ID
- Order ID
- Sale date
- Customer
- Invoice total
- Paid
- Remaining
- Payment method
- Payment status
- Notes

Sales lines should support at least:
- Invoice ID
- Order ID
- Line ID
- Item ID
- Item name
- Quantity
- Unit price
- Line revenue
- Actual/recognized cost
- Line profit

Profit must be traceable to individual lines; an order-level total can be a roll-up, not the only calculation source.

No profit-sharing percentage belongs in Accounting.

---

## 5. Purchases and suppliers

Purchases must support:
- Purchase ID
- Date
- Supplier
- Material/item
- Quantity
- Unit price
- Total
- Paid
- Remaining
- Payment method
- Notes

Suppliers must support:
- Supplier identity
- Phone/contact data
- Material/service types
- Total dealings
- Amount payable
- Notes

Purchase of inventory must create auditable stock movements rather than directly mutating a displayed quantity without history.

---

## 6. Expenses and cashbox

Expenses:
- Date
- Expense type
- Description
- Amount
- Payment method
- Responsible user
- Optional Order ID
- Optional cost/profit-center reference for future architecture
- Notes

Cashbox:
- Date/time
- Movement type
- Description
- Money in
- Money out
- Running balance
- Payment method/account
- Optional Order ID
- Reference document/transaction ID

Examples of cash movements:
- sale receipt
- customer collection
- purchase payment
- expense
- owner deposit/withdrawal

Cash movement and invoice status are related but must not be treated as the same record.

---

## 7. Inventory model — key business requirement

TrendOS must support many printing/advertising businesses, not only one print shop.

Target examples include:
- digital printing
- banner printing
- vinyl
- offset
- laser workshops
- advertising centers
- handmade/finishing workflows

Therefore the inventory engine must be generic.

### Item types
At minimum:
- Raw Material / خامة
- Semi-finished / نصف مصنع
- Finished Product / منتج نهائي
- Service / خدمة

### Units
Must be configurable, e.g.:
- piece
- meter
- square meter
- kilogram
- roll
- sheet
- pack/ream (`برصة` depending business vocabulary)
- liter
- box

Do not hard-code the system around `تابلوه` or any single product family.

---

## 8. BOM and automatic product formation

This is a major TrendOS Accounting differentiator.

The user currently uses Easy Store and values its item-formation feature, but the workflow is slow because intermediate products often have to be formed manually before the final product.

TrendOS should support a faster recursive/automatic BOM engine.

### Example: Tableau 20×30
A finished `تابلوه 20×30` may require:
- one `فوتوبلوك 20×30`
- printed card/photo 20×30
- lamination 20×30

Business material facts supplied during design discussion:
- photoblock/photo roll example: width 30 cm, approximate roll length 20–23 m
- lamination roll: width 60 cm, length 50 m
- a 23 cm × 60 cm lamination cut can produce two 20×30 pieces

These dimensions are business configuration/examples, not universal constants. They must be configurable per tenant/item/BOM.

### Intermediate products must remain sellable
Important requirement:
Some print shops/customers buy only printed cards.
Others buy card + lamination.
Others buy the final tableau.

Therefore:
- `كارت 20×30` may be a sellable semi-finished item.
- lamination piece may be an intermediate component.
- final tableau may consume those intermediates OR recursively consume their raw materials.

### Desired automatic behavior
When selling/forming a final item:
1. Check finished stock first if configured.
2. If insufficient, inspect its BOM.
3. If an intermediate component is unavailable, inspect that component's BOM recursively.
4. If sufficient raw materials exist, consume them and automatically satisfy the required intermediate quantity.
5. Record all stock movements atomically/auditably.
6. Add/consume the final product according to the configured production policy.
7. Calculate the actual recognized cost.
8. Never create negative stock silently unless tenant policy explicitly allows it.

This avoids requiring the operator to manually perform:
`roll -> card -> lamination piece -> tableau`
for every sale.

### Production policy per item
Support configurable behavior such as:
- manual formation
- assisted/semi-automatic formation
- automatic formation
- consume at production
- consume at sale

Different businesses must be able to choose their workflow.

---

## 9. Inventory movement ledger

Displayed stock must derive from or reconcile to an auditable movement ledger.

Movement types should include:
- purchase receipt
- sale issue
- production consumption
- production output
- return
- adjustment
- waste/scrap
- transfer (future multi-warehouse support)

Movement should preserve where relevant:
- Stock Movement ID
- date/time
- Item ID
- quantity in/out
- unit
- cost
- Order ID
- Line ID
- source transaction
- user

Product formation must be atomic: either all required consumption/output movements succeed, or the operation fails without partial corruption.

---

## 10. Cost and profitability

Accounting needs factual profitability, without profit-sharing percentages.

Required reports:
- invoice profitability
- order profitability as a roll-up
- line profitability
- item profitability
- daily profitability
- period profitability
- income statement

Basic line economics:
`Line Revenue - Recognized Line Cost = Line Profit`

Invoice/order profitability is the sum of its underlying line economics plus any correctly allocated direct costs.

Do not make order-level profit the only source of truth.

Future Profit Engine may consume these factual figures and apply partner/investor rules separately.

---

## 11. Management reports

Financial dashboard should expose practical owner metrics such as:
- sales today
- sales this month
- receipts today
- customer outstanding balances
- supplier payables
- expenses
- gross profit
- net profit
- cash balance
- inventory value
- low-stock alerts

Reports requested during design:
- invoice profitability
- profitability today
- profitability for selected period
- income statement
- cash movement
- customer receivables
- supplier payables
- best-selling items
- most/least profitable items
- inventory value
- waste/scrap report

A daily `نبض المطبعة`/business pulse concept was discussed: a concise owner view of sales, profit, collections, outstanding balances, important stock alerts, and operational financial warnings.

---

## 12. Integration contract: Operations -> Accounting

TrendOS Operations owns operational facts such as:
- Order ID
- Line ID
- customer reference/name
- Item ID
- item description
- quantity
- approved selling price / approved line amount when pricing is authoritative in Operations
- operational status

Accounting must never invent an operational price if Operations says it is unpriced/unapproved.

Recommended event/API contract includes:
- eventId / idempotency key
- Order ID
- Line ID
- Item ID
- quantity
- approved price data
- event type
- source version
- timestamp

Accounting writes must be idempotent. Replaying the same operational event must not duplicate invoice lines, stock consumption, or cash transactions.

---

## 13. Integration contract: Accounting -> Operations

Accounting can return financial status such as:
- Invoice ID
- Order ID
- payment status
- paid amount
- remaining amount
- last receipt/payment information
- stock/formation result where Operations needs it
- financial block/approval state if such policy is enabled

Operations should display these as accounting facts rather than recomputing them independently.

---

## 14. Future Profit Engine / Partner Network contract

TrendOS Accounting should expose factual data, not distribution rules:
- Order ID
- Line ID
- revenue
- recognized cost
- factual line profit
- payment/settlement facts when relevant

TrendOS Operations/Partner Network may additionally supply:
- profit center
- executing entity
- partner/investor/machine-owner relationships

TrendOS Profit Engine will be responsible for:
- profit sharing
- execution commissions
- investor shares
- machine-owner shares
- partner distributions

Do NOT mix these percentage/distribution rules back into core Accounting.

---

## 15. Architecture rules for future unified TrendOS

The eventual platform may combine:
`TrendOS Operations + TrendOS Accounting + TrendOS Profit Engine + TrendOS Partner Network`

Preserve these boundaries even if they later share one UI/database.

Recommended logical entities:
- Orders
- OrderLines
- Customers
- Items
- BOMs / BOMLines
- InventoryBalances
- StockMovements
- SalesInvoices
- SalesInvoiceLines
- Payments / Receipts
- Purchases
- PurchaseLines
- Expenses
- Suppliers
- CashTransactions
- ProfitCenters (future/shared)
- ExecutingEntities (future/shared)

All cross-module writes should use stable IDs and idempotent APIs/events, not names as keys.

---

## 16. Existing TrendOS integrity constraints to respect during integration

Do not break the current Go-Live integrity workstream.

Known project rules from the master plan include:
- Order ID is the logical unique key for orders.
- Line ID is the logical unique key for order lines.
- Every write path must become idempotent.
- Locks are required around check-then-create/update paths.
- Never invent prices or financial settlements.
- Historical valid data must be preserved.
- Google Sheets currently remains authoritative for operational/financial writes during the existing migration stage.
- D1 is currently used in the read/performance architecture and must not silently become an unsafe financial write source.

Accounting integration must be introduced as a separate, tested workstream and must not bypass the current P0/GO-NO-GO integrity gates.

---

## 17. Current decision checkpoint

Confirmed decisions as of 2026-09-04:

1. Build a **program/application**, not a spreadsheet as the final product.
2. Keep `TrendOS Accounting` focused on accounting, inventory, costing and factual profitability.
3. No partner/investor profit-sharing percentages inside Accounting.
4. `Order ID` remains the primary order integration key.
5. `Line ID` is mandatory for line-level integration and profitability.
6. Build generic inventory/BOM logic suitable for many print/advertising businesses.
7. Support sellable semi-finished items.
8. Support recursive/automatic BOM consumption to eliminate unnecessary manual formation steps.
9. Preserve full stock movement auditability.
10. Reports must include invoice/day/period profitability and income statement.
11. Future merge with Operations and Profit Engine must happen through stable IDs/contracts, not duplicate calculations.

---

## 18. Continuation prompt

Use this in a future chat:

> Continue the TrendOS Accounting workstream from `TRENDOS_ACCOUNTING_BLACKBOX_2026-09-04.md` in repo `fawakhry/TrendOs`, branch `agent/go-live-2026-09-01-integrity`. Do not redesign from scratch. TrendOS Accounting is a real application, not a spreadsheet product. Keep Accounting separate from Profit Engine percentages/distributions. Order ID is the order integration key and Line ID is mandatory for line-level integration. Continue building the accounting, inventory, BOM/automatic formation, costing, sales/purchases/expenses/cashbox/suppliers, profitability reports and income statement. Preserve sellable semi-finished items and recursive BOM behavior so a final item can consume raw materials automatically when intermediates are unavailable. Respect the existing TrendOS Go-Live integrity rules: idempotent writes, locking, no invented prices/settlements, preserve historical data, and do not bypass current P0 gates. Before integrating with Operations, define and test the Operations <-> Accounting event/API contract using stable IDs and replay-safe behavior. Do not restart analysis from zero; read this black-box checkpoint and the main Go-Live master plan first.
