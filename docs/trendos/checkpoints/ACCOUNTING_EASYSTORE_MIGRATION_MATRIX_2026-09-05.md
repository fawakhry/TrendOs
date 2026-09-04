# EasyStore -> TrendOS Accounting Migration Matrix

Date: 2026-09-05
EasyStore source: `fawakhry/EasyStore` — ES47 V1922 Unified Safe Build
Target: `fawakhry/TrendOs` — native `TrendOS Accounting`

## Rule
EasyStore is the historical working primitive Accounting implementation inside TrendOS. Migration is behavior-preserving by capability, not a file copy.

| EasyStore capability / evidence | New TrendOS Accounting domain | Treatment |
|---|---|---|
| `getAccounting_` / accounting dashboard | Dashboard / Accounting Read Model | Port behavior; rebuild read model |
| `saveEasyStoreSaleV2_` / final invoice flow | Sales Invoice + Sales Lines | Port with Order ID + Line ID authority |
| customer account V1915 | Customer Receivables + Collections | Preserve collection workflow; replace name identity with Customer/Party ID |
| party ledger V1858 | Unified Party Ledger | Port as canonical customer/supplier subledger |
| `saveEasyStorePurchaseV2_` | Purchase + Purchase Lines | Preserve request-id duplicate protection; use Supplier ID + Item ID |
| purchase finance posting | Supplier Payables + Supplier Payments | Port as explicit journal/subledger transactions |
| accounting cashbox | Treasury / Cash Transactions | Preserve cashbox workflow; server-authoritative and idempotent |
| accounting materials | Item / Material Master | Normalize into shared Item IDs and item types |
| stock movement sheets | Inventory Ledger | Port as append-only auditable StockMovement records |
| templates/components/cost cascade | BOM / Product Formation | Port calculation rules; make recursive formation atomic and cycle-safe |
| department daily purchases V1917 | Department Purchases | Preserve entry/approval workflow; replace user names with shared RBAC/Department ID |
| immediate stock update V1919 | Purchase Receipt / Inventory | Preserve behavior with transactional duplicate protection |
| custody V1920 | Employee/Department Custody | Preserve advance/settlement/reversal semantics |
| department day close V1920 | Department Close / Daily Reconciliation | Preserve closing gates and actual-cost logic |
| unclassified legacy rows V1920 | Migration / Reconciliation Queue | Keep as controlled migration tool, not normal runtime path |
| reverse approved purchase | Reversal Transaction | Preserve append-only reversal; never destructive delete |
| semi-automatic accounting V1921 | Accounting Automation | Port after manual ledger flows are proven |
| duplicate request IDs / idempotent helpers | Idempotency Ledger | Promote to mandatory foundation for every financial write |
| audit sheet | Audit Event Ledger | Promote to immutable structured audit trail |
| `easyStoreSystemHealth_` | Accounting Health / Integrity | Merge concepts with TrendOS Integrity framework |
| role gates (`full`, `final`, dept) | Shared TrendOS RBAC | Preserve intent; replace name/regex authorization |
| actual profit = sales - actual job cost - net waste | Line Cost / Profit Center Reporting | Preserve principle; compute at Line ID + Profit Center granularity |

## First build order

### Foundation F1
- shared TrendOS session/RBAC adapter;
- Accounting entity IDs;
- idempotency ledger contract;
- audit-event contract;
- Party IDs;
- Item IDs;
- Department IDs / Profit Center IDs.

### Finance F2
- Party Ledger;
- Treasury/Cashboxes;
- Customer collections;
- Supplier payments;
- Purchase headers/lines and payable creation.

### Stock/Cost F3
- Item/Material master;
- stock movement ledger;
- purchase receipts;
- BOM/product formation;
- waste/adjustment/reversal;
- actual cost recognition.

### Revenue F4
- consume TrendOS Order ID + Line ID;
- build invoices from approved operational lines;
- receivables/payment status;
- actual cost per line;
- profit per Line ID + Profit Center.

### Operations Accounting F5
- department purchases;
- custody;
- department day close;
- accounting daily close/reconciliation.

### Management F6
- dashboard;
- income/profit reports;
- receivables/payables aging;
- inventory valuation;
- department/profit-center reporting;
- accounting health/integrity.

## Non-negotiable migration checks
Every migrated capability requires:
1. EasyStore source behavior identified;
2. canonical TrendOS identity mapped;
3. duplicate/retry behavior defined;
4. automated test written;
5. Preview runtime verification;
6. checkpoint recorded in Black Box;
7. no production write cutover until reconciliation succeeds.

**Status: PASS — migration matrix established.**
