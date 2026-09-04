# TrendOS Accounting — EasyStore Assessment & Adoption Decision

Date: 2026-09-05
Repository reviewed: `fawakhry/EasyStore`
EasyStore baseline reviewed: `ES47 V1922 Unified Safe Build`
EasyStore head observed: `79d5fa1965d42996de49f949a4c34121a4231157`
TrendOS branch: `agent/go-live-2026-09-01-integrity`

## Decision

**USE EasyStore = YES, as a functional/business-rules blueprint.**

**DO NOT transplant EasyStore as-is into TrendOS.**

The final product is `TrendOS Accounting`, a full accounting program that is logically complete in its own domain but natively integrated with TrendOS Operations through stable IDs, shared authentication, shared permissions, and explicit events.

## Why EasyStore is valuable

EasyStore already contains working/implemented concepts for:
- accounting dashboard;
- sales/final invoices;
- purchases;
- suppliers;
- customer accounts / collections;
- supplier/customer party ledger;
- cashbox/treasury movements;
- materials and stock movements;
- stock increase on approved/recorded purchases;
- department purchases and approvals;
- purchase custody / employee custody settlement;
- department daily close;
- actual job cost and waste-aware profit calculation;
- reversing approved purchase movements;
- legacy accounting-row classification;
- audit log;
- system health checks;
- request IDs / idempotency controls around critical financial actions;
- role-gated accounting actions;
- tests for accounting automation, day close, customer accounts, department accounting scope and unified safe-build behavior.

## What must NOT be copied as architecture

EasyStore currently mixes several concerns and has legacy coupling that must not become the new TrendOS architecture:

1. **Monolithic backend**
   - `Code.gs` is very large and contains Operations, Accounting, customer portal, AI, marketplace and other concerns in one Apps Script source.
   - TrendOS Accounting must be modular.

2. **Hard-coded person/name authorization in frontend behavior**
   - EasyStore UI identifies roles using names/strings such as admin/laser/print/final and named employees.
   - TrendOS Accounting must use the shared authenticated TrendOS session + permission/RBAC claims, never employee-name regexes.

3. **Direct Apps Script endpoint coupling**
   - EasyStore config points its frontend to the Apps Script URL.
   - New Accounting clients must call the TrendOS Edge/API gateway. The legacy Apps Script financial write path may remain authoritative during migration, but it must sit behind controlled contracts.

4. **Names as business identity**
   - Customer/supplier names can appear in presentation, but they must not be primary ledger keys.
   - New model requires stable `Customer ID`, `Supplier ID` / `Party ID`, `Order ID`, `Line ID`, `Item ID`, and financial document IDs.

5. **Browser state is not authority**
   - Session/local storage may be used only for UI/cache state.
   - Financial facts must be server-authoritative and auditable.

6. **Profit model must align with TrendOS**
   - Profit must be computed at `Line ID + Profit Center`, not only at invoice/order summary level.
   - Profit-sharing percentages remain outside Accounting in the future Profit Engine / Partner Network.

## Adopted full-program scope

The target `TrendOS Accounting` V1 includes these native modules:

1. Dashboard
2. Sales / Invoices
3. Customer Receivables
4. Customer Collections
5. Purchases
6. Supplier Payables
7. Supplier Payments
8. Expenses
9. Treasury / Cashboxes / Payment Methods
10. Customers / Party Ledger
11. Suppliers / Party Ledger
12. Items / Materials
13. Inventory / Stock Movements
14. BOM / Product Formation
15. Cost Recognition / COGS
16. Department Purchases
17. Custody / Advances / Settlement
18. Department Day Close
19. Waste / Adjustments / Reversals
20. Line Profit + Profit Center reporting
21. General management reports
22. Audit Log
23. Health / Integrity checks
24. Settings / Accounts / Permissions integration

## Native TrendOS integration contract

### Operations -> Accounting
- Event ID / Idempotency Key
- Order ID
- Line ID
- Item ID
- Customer ID / Party ID
- Department ID
- Profit Center ID
- quantity
- approved selling price / line amount
- operational status
- source version
- timestamp

### Accounting -> Operations
- Invoice ID
- Order ID
- Line ID
- payment status
- paid amount
- remaining amount
- recognized cost
- factual line profit
- stock/BOM result
- financial approval/block state where configured

## Migration principle

We will migrate by **capability**, not by copying files:

`EasyStore rule -> normalize -> test -> implement in TrendOS Accounting -> verify -> record checkpoint`

EasyStore remains a reference repository. The new authoritative implementation belongs in `fawakhry/TrendOs`.

## First implementation sequence

1. Add a machine-readable Accounting capability manifest to TrendOS.
2. Add stable accounting entity/ID contracts.
3. Promote the native route `/trendos/accounting` from sandbox shell to the real shared TrendOS shell.
4. Implement read adapters from TrendOS Operations for Order/Line/Customer/Item facts.
5. Implement server-authoritative financial ledgers with idempotency.
6. Port EasyStore capabilities one domain at a time: Parties -> Treasury -> Purchases -> Inventory/BOM -> Sales/Receivables -> Expenses -> Day Close -> Reports.
7. Only after reconciliation and dual-run verification, consider D1 authoritative financial writes.

## Production safety

- Existing TrendOS production is unchanged.
- Existing Apps Script/Sheets financial write authority is unchanged.
- No D1 financial write cutover is authorized by this decision.
- EasyStore is not being deployed over TrendOS.

**Status: PASS — EasyStore adopted as blueprint; full native TrendOS Accounting program is the canonical direction.**
