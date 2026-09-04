# TrendOS Accounting — Full Review Record / الصندوق الأسود الكامل

**Recorded:** 2026-09-04 (Africa/Cairo)
**Repo:** `fawakhry/TrendOs`
**Working branch:** `agent/go-live-2026-09-01-integrity`
**Purpose:** سجل مراجعة كامل لما تم فعليًا وما تم تصميمه/اعتماده في مسار TrendOS Accounting، حتى يمكن الرجوع إليه لاحقًا دون الاعتماد على ذاكرة الشات.

> IMPORTANT: هذا الملف يفرق بوضوح بين `DONE` و`DESIGNED/DECIDED` و`NOT YET IMPLEMENTED`. وجود فكرة هنا لا يعني أنها دخلت Production.

---

## A. Executive vision / الفكرة والرؤية

TrendOS ليس مجرد برنامج حسابات منفصل. الرؤية هي منصة تشغيل وإدارة قابلة للتوسع لشبكة أعمال الطباعة والإعلان والتنفيذ، بحيث تتكامل عدة طبقات مع الحفاظ على حدود مسؤولية واضحة:

1. **TrendOS Operations** — العملاء، الأوردرات، البنود، الأقسام، الحالات، التوجيه، الإنتاج والمتابعة.
2. **TrendOS Accounting** — المبيعات، المشتريات، المصروفات، الخزنة، الموردون، المخزون، التكلفة والربحية المحاسبية والتقارير.
3. **TrendOS Profit Engine** — قواعد توزيع الأرباح، العمولات، المستثمرون، أصحاب الماكينات، الشركاء والكيانات المستفيدة.
4. **TrendOS Partner Network** — شبكة الجهات/الورش/الشركاء والمنفذين الخارجيين.

الهدف المستقبلي: يمكن أن تظهر هذه الأجزاء للمستخدم كمنصة TrendOS واحدة، لكن لا يجوز دمج المسؤوليات الحسابية بطريقة تجعل Operations يعيد حساب أرقام Accounting أو تجعل Accounting يحمل نسب الشركاء والمستثمرين.

---

## B. Current product decision / القرار الحالي

### DECIDED
- المنتج النهائي المطلوب هو **برنامج/تطبيق TrendOS Accounting حقيقي**، وليس ملف Excel أو Google Sheet كمنتج نهائي.
- الملفات الجدولية التي أُنشئت سابقًا هي **نماذج/Blueprints ومراجع تصميم** وليست البرنامج النهائي.
- Accounting يجب أن يبقى **بدون نسب توزيع الأرباح**.
- Accounting يمكنه حساب الربح المحاسبي الفعلي: Revenue, Cost, Gross Profit, Expenses, Net Profit.
- Profit Engine هو الذي يطبق لاحقًا نسب الشركاء/المستثمرين/أصحاب الماكينات/عمولات التنفيذ.

---

## C. Universal integration keys / مفاتيح التربيط

### DECIDED — NON-NEGOTIABLE

**Order ID** هو المفتاح المنطقي للأوردر عبر الأنظمة.

Example:
`TM260630015`

لا يتم الربط الأساسي بين Operations وAccounting باسم العميل أو رقم الهاتف.

**Line ID** إلزامي على مستوى البند، لأن أوردر واحد يمكن أن يحتوي على عدة بنود بجهات تنفيذ وتكاليف ومخزون وربحية مختلفة.

Recommended format:
- `TM260630015-001`
- `TM260630015-002`
- `TM260630015-003`

IDs أخرى يجب الحفاظ عليها:
- Customer ID
- Item ID
- Invoice ID
- Purchase ID
- Payment/Receipt ID
- Stock Movement ID
- Supplier ID

لا يتم استخدام Order ID بدل كل هذه الكيانات.

---

## D. Accounting scope / نطاق برنامج الحسابات

### DESIGNED / APPROVED SCOPE

1. المبيعات
2. بنود المبيعات
3. المشتريات
4. بنود المشتريات
5. المصروفات
6. الخزنة
7. الموردين
8. العملاء/المديونيات المالية حسب الحاجة
9. دليل الأصناف
10. المخزون
11. حركة المخزون
12. BOM / مكونات الأصناف
13. تكوين الأصناف
14. المرتجعات/التسويات المخزنية والمحاسبية بطريقة audit-safe
15. ربحية البند
16. ربحية الفاتورة
17. ربحية اليوم
18. ربحية الفترة
19. قائمة الدخل
20. حركة الخزنة
21. مديونية العملاء
22. مستحقات الموردين
23. تقييم المخزون
24. حركة المخزون
25. أفضل/أقل الأصناف ربحًا
26. الهالك
27. تنبيهات نقص المخزون
28. Financial Dashboard / نبض النشاط

---

## E. Sales model / المبيعات

### DESIGNED
Sales invoice/header fields include:
- Invoice ID
- Order ID
- Customer ID / customer
- Date
- Total
- Paid
- Remaining
- Payment Method
- Payment Status
- Notes

Sales line fields include:
- Invoice ID
- Order ID
- Line ID
- Item ID
- Item/service
- Qty
- Unit
- Unit Price
- Line Revenue
- Recognized Cost
- Line Profit

### RULE
ربحية الأوردر ليست المصدر الوحيد للحساب. المصدر التفصيلي يجب أن يكون Line-level ثم يتم التجميع للأوردر/الفاتورة/اليوم/الفترة.

---

## F. Purchases / suppliers / expenses / cashbox

### DESIGNED
Purchases:
- Purchase ID
- optional Order ID
- date
- supplier
- item/material
- qty
- unit price
- total
- paid
- remaining
- payment method
- notes

Expenses:
- date
- optional Order ID
- expense type
- description
- amount
- payment method
- responsible user
- optional analytical center
- notes

Cashbox:
- transaction ID
- date/time
- movement type
- description
- money in
- money out
- running balance
- payment method/account
- optional Order ID
- source/reference transaction

Suppliers:
- supplier identity/contact
- supplied categories/materials
- dealings
- paid
- payable balance
- notes

### RULE
Cash movement is not the same record as invoice/payment status. Every money movement must remain auditable.

---

## G. Inventory / BOM / تكوين الصنف — major differentiator

### BUSINESS PAIN IDENTIFIED
النظام المستخدم سابقًا/حاليًا للمقارنة هو Easy Store، وميزة `تكوين الصنف` مفيدة، لكن سير العمل يصبح بطيئًا عند الحاجة لتكوين المنتجات الوسيطة يدويًا قبل المنتج النهائي.

### EXAMPLE DISCUSSED
تابلوه 20×30 may consist of:
- فوتوبلوك 20×30
- كارت/صورة مطبوعة 20×30
- قطعة لامنيشن

Material examples supplied during requirements:
- رول فوتوبلوك/خامة بعرض 30 سم وطول تقريبي 20–23 متر حسب الخامة
- رول لامنيشن 60 سم × 50 متر
- شريحة لامنيشن 23×60 سم يمكن أن تنتج قطعتين 20×30 في المثال التشغيلي

هذه أمثلة إعداد وليست ثوابت hard-coded.

### DECIDED ITEM TYPES
- Raw Material / خامة
- Semi-Finished / نصف مصنع
- Finished Product / منتج نهائي
- Service / خدمة

### IMPORTANT DECISION
المنتج نصف المصنع يمكن أن يكون **قابلًا للبيع**.

مثال:
- العميل قد يشتري الكارت فقط.
- أو كارت + لامنيشن.
- أو المنتج النهائي تابلوه.

لذلك لا يجوز بناء BOM يفترض أن كل intermediate item داخلي وغير قابل للبيع.

### DESIGNED AUTOMATIC BOM BEHAVIOR
عند بيع/تكوين منتج نهائي:
1. Check available finished stock according to policy.
2. Read BOM if formation is required.
3. Use available semi-finished component stock where configured.
4. If an intermediate is missing, recursively explode its BOM.
5. Check raw-material availability.
6. Consume exact quantities.
7. Create production consumption/output movements.
8. Calculate recognized cost.
9. Complete atomically or fail without partial inventory corruption.
10. Never silently allow negative stock unless explicit tenant policy permits it.

This is intended to remove the repetitive manual chain:
`raw roll -> card -> lamination piece -> final tableau`
when automation can safely perform it.

### PRODUCTION MODES DESIGNED
Per item/tenant:
- manual
- semi-automatic/assisted
- automatic
- consume at manufacturing
- consume at sale

### GENERIC UNITS
Configurable units must support examples such as:
- piece
- meter
- square meter
- kg
- roll
- sheet
- ream/pack/برصة
- liter
- box

### RULE
Do not hard-code tableau logic. The engine must be generic enough for printing, banner, vinyl, offset, laser, advertising/finishing and similar businesses.

---

## H. Inventory movement ledger

### DESIGNED
Inventory must have an auditable movement ledger rather than only editing a balance cell.

Movement types include:
- purchase receipt
- sale issue
- production consumption
- production output
- return
- adjustment
- waste/scrap
- transfer (future multi-warehouse)

Movement fields include as relevant:
- Stock Movement ID
- Item ID
- date/time
- qty in/out
- unit
- recognized cost
- Order ID
- Line ID
- source transaction
- user

### RULE
Cancellation/quantity corrections should generate traceable reversals/adjustments; financial/inventory history should not simply be deleted.

---

## I. Costing / profitability

### DECIDED
Accounting calculates factual business profitability but not beneficiary distributions.

Core concepts:
- Item/Line Profit = Line Revenue - Recognized Line Cost
- Gross Profit = Revenue - COGS
- Net Profit = Gross Profit - Operating Expenses
- Margin % = Profit / Revenue (when revenue != 0)

### DESIGNED REPORTS
- line profitability
- invoice profitability
- order profitability roll-up
- daily profitability
- period profitability
- item profitability
- income statement
- inventory valuation
- waste
- receivables
- payables
- cash movement

Historical cost/profit must be preserved; future purchase-price changes must not silently rewrite old transaction profitability.

Moving-average costing was identified as a preferred advanced inventory valuation approach, subject to implementation/testing.

---

## J. Daily owner dashboard / نبض النشاط

### DESIGNED
Practical dashboard concepts discussed:
- orders/invoices count where integrated
- sales today
- collections today
- customer receivables
- COGS
- gross profit
- expenses
- net profit
- cash balance
- inventory value
- waste
- month totals
- top customer
- top item
- most/least profitable item
- low-stock / likely-to-run-out alerts
- uncollected balances/orders
- overall margin

---

## K. Operations <-> Accounting integration / التربيطات الجديدة

### OPERATIONS -> ACCOUNTING
Operations owns operational facts and sends approved facts, including as applicable:
- eventId / idempotency key
- Order ID
- Line ID
- Customer ID/customer
- Item ID
- item description
- quantity
- approved unit price / approved line amount
- operational status/event type
- source version
- timestamp

### RULE
Accounting must not invent an unapproved price or settlement.

### ACCOUNTING -> OPERATIONS
Accounting returns financial/inventory facts, e.g.:
- Invoice ID
- Order ID
- Line ID where relevant
- Total Invoice
- Paid
- Remaining
- Payment Status
- last payment/receipt status
- Stock Deduction / Formation Status
- Missing Materials / inventory block where applicable

Operations should display these returned facts and not independently recompute Accounting values.

### CANCELLATION / QUANTITY CHANGE
Do not delete financial history. Create appropriate invoice/stock reversal or adjustment records with references.

### IDEMPOTENCY
Replaying the same event must not duplicate:
- invoice lines
- stock consumption
- production output
- payment records
- accounting mutations

Check-then-create/update paths require locking/transaction-safe behavior consistent with the existing TrendOS integrity program.

---

## L. Profit Engine / Partner Network boundary

### OUT OF CORE ACCOUNTING
Do not calculate/store distribution percentages inside Accounting for:
- partners
- investors
- machine owners
- execution beneficiaries
- profit-share recipients

### ACCOUNTING -> PROFIT ENGINE FUTURE FACT CONTRACT
Accounting may supply factual fields:
- Order ID
- Line ID
- Revenue
- Recognized Cost
- Gross/Factual Profit
- payment/settlement facts where needed

Operations/Partner Network may supply:
- Profit Center
- Executing Entity
- relationship/rule identifiers

Profit Engine applies:
- partner shares
- investor shares
- machine-owner shares
- execution commissions
- beneficiary distributions

This separation prevents changing Accounting every time profit-sharing arrangements change.

---

## M. Prior spreadsheet/prototype artifacts — historical work record

### DONE — ARTIFACTS WERE GENERATED AS DESIGN/PROTOTYPE WORK
Known generated files from the Accounting/Profit design work include:

- `TrendOS_Accounting_V1.xlsx`
- `TrendOS_Accounting_V2.xlsx`
- `TrendOS_Accounting_V10.xlsx`
- `TrendOS_Profit_Engine_Pro.xlsx`
- `TrendOS_Accounting_Program_V2.xlsx`
- `TrendOS_Accounting_Program_V2_Fixed.xlsx` (known later/fixed artifact)
- `TrendOS_Professional_Operations_Accounting_Final_Fixed.xlsx` (known integration-design artifact)

### IMPORTANT STATUS
These files are not proof that the actual production Accounting application is implemented. They are prototypes/specification artifacts. The user later explicitly corrected the direction to: **برنامج الحسابات مش شيت**.

Known design content in those artifacts included:
- Order ID as the Operations/Accounting link
- unique Line IDs such as OrderID-001
- Item ID inventory classes
- payment methods/statuses
- units
- Accounting -> Operations return fields such as Invoice ID, Total Invoice, Paid, Remaining, Payment Status, Stock Deduction Status, Missing Materials
- Operations -> Accounting approval/line-update concepts
- cancellation/quantity adjustment rather than deleting financial history
- Profit Engine receiving Order ID + Line ID + Revenue + Cost + Gross Profit without forcing profit-sharing logic into Accounting

### LINK NOTE
Chat sandbox download links are session-local and are **not durable project URLs**. Therefore this black-box record preserves exact artifact names/status instead of pretending that temporary sandbox links are permanent GitHub links. If these binary artifacts need durable project storage later, upload them intentionally to an appropriate repository/Drive/Library location and then add the durable links here.

---

## N. What was actually done in THIS 2026-09-04 chat

### DONE
1. Reconfirmed that TrendOS Accounting is an application/program, not the final spreadsheet product.
2. Reconfirmed Accounting scope excludes partner/investor profit-sharing percentages.
3. Defined/confirmed new integration model using Order ID + Line ID and additional entity IDs.
4. Defined Operations -> Accounting and Accounting -> Operations responsibilities.
5. Defined the future Accounting -> Profit Engine factual contract.
6. Defined the core Accounting modules and reports.
7. Defined generic inventory/BOM/automatic formation requirements and sellable semi-finished behavior.
8. Generated `TrendOS_Accounting_Program_V2.xlsx` as a blueprint/prototype in the chat environment.
9. Opened the TrendOS GitHub repository and working branch.
10. Read the existing Go-Live master/handoff context.
11. Created `TRENDOS_ACCOUNTING_BLACKBOX_2026-09-04.md` on the working branch as the first persistent Accounting checkpoint.
12. Commit created for that first checkpoint: `dae7e36c7ffd83e5224ef2a2cabb3a67bfc74a0c`.
13. Created this fuller review record so later review can distinguish implementation from design.

### NOT DONE / DO NOT CLAIM DONE
- The actual new TrendOS Accounting web/application code has **not** been implemented in this chat.
- No Accounting database migration was executed in this chat.
- No production financial write path was switched to the new Accounting architecture.
- No Operations -> Accounting live API/event bridge was deployed in this chat.
- No Profit Engine distribution engine was deployed in this chat.
- No production data was migrated to a new Accounting database in this chat.
- No existing production Accounting/Operations behavior was intentionally modified by the Accounting design work in this chat.

---

## O. Relationship to current TrendOS Go-Live / production work

The Accounting workstream must not overwrite the exact production checkpoint of the Operations integrity project.

Relevant existing production/integrity handoff facts reviewed:
- Working branch: `agent/go-live-2026-09-01-integrity`.
- Earlier documented checkpoint referenced by the user: `24cd2777f91c26404d67b2e316b723d7ad812084`.
- That checkpoint is documentation-only and records production remaining Version 146 at that point.
- Its exact next step was a bounded read-only registry-preview rerun after replacing only the specified Apps Script Head writer blob; it explicitly forbids registry writes/property/deploy/flag/trigger/route/source-Sheet/Code.gs action in that bounded step.

Accounting integration is a **separate future workstream** and must not be used as justification to bypass those existing production safety constraints.

### Existing main handoff/master reference
`TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

### Accounting first black-box reference
`TRENDOS_ACCOUNTING_BLACKBOX_2026-09-04.md`

### This full review reference
`docs/trendos/TRENDOS_ACCOUNTING_FULL_REVIEW_2026-09-04.md`

---

## P. Status matrix for later review

| Area | Status | Meaning |
|---|---|---|
| Accounting vision | DECIDED | Product direction approved |
| Program not spreadsheet | DECIDED | Final product direction |
| Order ID integration | DECIDED | Required |
| Line ID integration | DECIDED | Required |
| Sales/purchases/expenses/cashbox/suppliers scope | DESIGNED | Needs app implementation |
| Inventory movement ledger | DESIGNED | Needs app implementation |
| Generic Item types/units | DESIGNED | Needs app implementation |
| Recursive BOM / auto formation | DESIGNED | Needs app implementation |
| Sellable semi-finished items | DECIDED | Must be preserved |
| Profitability reports | DESIGNED | Needs app implementation |
| Profit Engine separation | DECIDED | Architectural boundary |
| Operations -> Accounting contract | DESIGNED | Must be versioned/tested before live integration |
| Accounting -> Operations contract | DESIGNED | Must be versioned/tested before live integration |
| Excel prototypes | DONE | Reference artifacts only |
| Accounting GitHub black-box checkpoint | DONE | Persistent documentation |
| Actual new Accounting application | NOT STARTED in this chat | Do not confuse with prototype |
| Live Operations/Accounting bridge | NOT DEPLOYED | Future controlled integration |
| Production mutation from this Accounting chat | NONE | Safety preserved |

---

## Q. Review checklist before implementation

Before writing the actual Accounting app:
1. Read this file.
2. Read `TRENDOS_ACCOUNTING_BLACKBOX_2026-09-04.md`.
3. Read current TrendOS Project Memory / Execution Ledger / Handoff / Deploy Manifest and latest production checkpoint.
4. Do not restart architecture from zero.
5. Confirm current production source-of-truth and do not silently replace it.
6. Define database schema with stable internal IDs plus Order ID/Line ID integration keys.
7. Define versioned idempotent Operations <-> Accounting events/API.
8. Define inventory transaction/locking strategy.
9. Define costing snapshot strategy.
10. Build and test Accounting independently before live Operations integration.
11. Add regression tests for duplicate/replayed events, cancellation, quantity changes, BOM recursion, insufficient stock, partial failure and concurrent requests.
12. Only then perform a controlled integration plan.

---

## R. Continuation / recovery prompt

> Continue TrendOS Accounting from `docs/trendos/TRENDOS_ACCOUNTING_FULL_REVIEW_2026-09-04.md` and `TRENDOS_ACCOUNTING_BLACKBOX_2026-09-04.md` in repo `fawakhry/TrendOs`, branch `agent/go-live-2026-09-01-integrity`. First read the current TrendOS Project Memory, Execution Ledger, Handoff and Deploy Manifest so you do not overwrite the active Operations production checkpoint. Do not restart design from scratch. The final Accounting product is a real application, not a spreadsheet. Preserve Order ID as the order integration key and Line ID as the line integration key. Keep Accounting responsible for factual sales, purchases, expenses, cashbox, suppliers, inventory, BOM/automatic formation, costing, factual profitability and financial reports. Keep partner/investor/machine-owner percentages and execution profit distributions outside Accounting in Profit Engine/Partner Network. Preserve sellable semi-finished items and recursive BOM behavior. All integration writes must be idempotent, lock/transaction safe, auditable, and must never invent prices or settlements. Treat prior XLSX files as design prototypes, not proof of app implementation. Check the status matrix before claiming anything is done. Build the application and integration as a new controlled workstream without bypassing the current TrendOS P0/GO-NO-GO production safety gates.

---

## S. Durable links

Repository:
`https://github.com/fawakhry/TrendOs`

Working branch:
`https://github.com/fawakhry/TrendOs/tree/agent/go-live-2026-09-01-integrity`

First Accounting black-box commit:
`https://github.com/fawakhry/TrendOs/commit/dae7e36c7ffd83e5224ef2a2cabb3a67bfc74a0c`

Earlier Operations checkpoint reviewed:
`https://github.com/fawakhry/TrendOs/commit/24cd2777f91c26404d67b2e316b723d7ad812084`

Accounting black-box file:
`https://github.com/fawakhry/TrendOs/blob/agent/go-live-2026-09-01-integrity/TRENDOS_ACCOUNTING_BLACKBOX_2026-09-04.md`

Full review file:
`https://github.com/fawakhry/TrendOs/blob/agent/go-live-2026-09-01-integrity/docs/trendos/TRENDOS_ACCOUNTING_FULL_REVIEW_2026-09-04.md`

---

**End of full review checkpoint.**
