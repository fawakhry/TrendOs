# الصندوق الأسود — EasyStore

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Working branch: `agent/go-live-2026-09-01-integrity`
EasyStore source repository: `fawakhry/EasyStore`
EasyStore source branch: `main`
EasyStore observed head: `79d5fa1965d42996de49f949a4c34121a4231157`
Canonical status: **ACTIVE HISTORICAL BASELINE FOR TRENDOS ACCOUNTING**

> هذا الملف هو السجل المستقل والمرجع الأساسي لكل ما يخص **EasyStore** داخل الصندوق الأسود لمشروع TrendOS.
> أي معلومة جديدة تخص EasyStore أو ترحيل وظائفه أو مقارنة سلوكه مع TrendOS Accounting يجب إضافتها هنا أو ربطها من هنا.
> عند التعارض، يطبق ترتيب الحقيقة العام للصندوق الأسود: `LATEST VERIFIED > EARLIER VERIFIED > DEPLOYED > TESTED > IMPLEMENTED > PREPARED > PLANNED > UNKNOWN`.

---

## 1. التعريف الصحيح لـ EasyStore

EasyStore **ليس برنامجًا خارجيًا منفصلًا نستخدمه كفكرة فقط**.

التوصيف الصحيح والمعتمد بعد توضيح المستخدم هو:

**EasyStore = النسخة البدائية/المبكرة التي كانت تعمل فعليًا كبرنامج حسابات داخل TrendOS + مصدر السلوك التشغيلي والقواعد المالية التي ثبت عملها.**

بالتالي:

- لا نبدأ TrendOS Accounting من الصفر.
- لا نرمي سلوك EasyStore الذي كان يعمل بالفعل.
- لا ننقل EasyStore ملفًا بملف أو كما هو معماريًا.
- يتم نقل **السلوك المثبت** Capability-by-Capability إلى TrendOS Accounting الجديد.
- أي سلوك ضعيف أو هش يتم استبداله بعقد TrendOS أقوى مع اختبار يثبت البديل.

المسار المعتمد:

`EasyStore primitive TrendOS Accounting -> normalize architecture -> preserve verified workflows -> replace brittle coupling -> integrate natively into current TrendOS -> Cloudflare Preview -> controlled production migration`

---

## 2. التصحيح التاريخي المهم

كان هناك توصيف أولي اعتبر EasyStore مجرد `functional/business-rules blueprint`.

هذا التوصيف **تم تصحيحه رسميًا** بعد توضيح المستخدم أن EasyStore هو الذي كان يعمل فعليًا داخل TrendOS بصورة بدائية.

العبارة القديمة `functional-blueprint-only` تعتبر **SUPERSEDED** ولا تستخدم كحقيقة حالية.

العبارة Canonical من الآن:

**EasyStore = historical working baseline of primitive TrendOS Accounting + source of verified business rules and migration behavior.**

الملف المرجعي للتصحيح:

`docs/trendos/checkpoints/ACCOUNTING_EASYSTORE_BASELINE_CORRECTION_2026-09-05.md`

---

## 3. حالة Repository EasyStore التي تمت مراجعتها

Repository:

`fawakhry/EasyStore`

Baseline reviewed:

`ES47 V1922 Unified Safe Build`

Observed head:

`79d5fa1965d42996de49f949a4c34121a4231157`

الملفات الرئيسية التي تمت مراجعتها:

- `Code.gs`
- `app.js`
- `config.js`
- `index.html`
- ملفات CSS/themes
- `tests/`

### ملاحظات بنيوية

- `Code.gs` ضخم جدًا ويجمع Operations + Accounting + customer/portal + وظائف أخرى في مصدر Apps Script واحد.
- `app.js` يحتوي واجهة Accounting كاملة نسبيًا وحالة UI واسعة.
- `config.js` يربط الواجهة مباشرة بمسار Apps Script الحالي.
- EasyStore يحتوي Tests فعلية لعدة وظائف مالية وحالات integrity.

هذه المراجعة تثبت أن EasyStore **برنامج عامل تاريخيًا** وليس مجرد Mock أو مخطط نظري.

---

## 4. نطاق الحسابات الذي كان موجودًا في EasyStore

EasyStore يحتوي أو يحتوي على سلوك مطبق للآتي:

1. Dashboard / Accounting overview.
2. Sales.
3. Final invoices.
4. Purchases.
5. Suppliers.
6. Customer accounts.
7. Customer collections / debt collection.
8. Party/customer/supplier ledger concepts.
9. Cashbox / treasury movements.
10. Materials.
11. Stock movements.
12. Immediate stock increase after approved/recorded purchases.
13. Department purchases.
14. Department purchase approval/rejection.
15. Custody / purchase advances / settlement.
16. Department day close.
17. Actual job cost.
18. Waste-aware profit calculation.
19. Waste lines.
20. Reversal of approved purchases.
21. Legacy/unclassified accounting rows.
22. Legacy classification/reconciliation.
23. Semi-automatic accounting routines.
24. Audit trail.
25. Health/integrity checks.
26. Request IDs / duplicate protection / idempotency-like behavior.
27. Role-gated accounting actions.
28. Customer account side-drawer and collection UI.
29. Daily department purchase UI and workflows.
30. Unified safe-build protections.

---

## 5. أهم Sheets/Accounting structures التي ظهرت في EasyStore

من `Code.gs` ظهرت شيتات حسابات مثل:

- `حسابات - الخامات`
- `حسابات - البنود الثابتة`
- `حسابات - فواتير الأقسام`
- `حسابات - الفواتير النهائية`
- `حسابات - هوالك الأقسام`
- `حسابات - حركة المخزون`
- `حسابات - مشتريات الأقسام اليومية`

Accounting version marker:

`MATBAGY_ACCOUNTING_VERSION = "V1922_UNIFIED_SAFE_BUILD"`

هذه الأسماء تعتبر Evidence تاريخي لطبيعة النظام القديم، ولا تعني أن التصميم الجديد يجب أن يحتفظ بنفس التخزين أو نفس أسماء الشيتات.

---

## 6. أهم Actions / Functions التي تم رصدها

### Accounting initialization/read

- `initAccounting`
- `getAccounting`

### Department daily purchases

- `getDeptDailyPurchasesV1917`
- `saveDeptDailyPurchaseV1917`
- `approveDeptDailyPurchasesV1917`
- `rejectDeptDailyPurchaseV1917`

### Custody / closing / daily report

- `savePurchaseCustodyV1920`
- `closePurchaseCustodyV1920`
- `getDailyDepartmentReportV1920`
- `closeDepartmentDayV1920`

### Legacy accounting / reconciliation / reversal

- `getUnclassifiedAccountingRowsV1920`
- `classifyLegacyAccountingRowV1920`
- `reverseApprovedPurchaseV1920`

### Automation

- `previewAccountingAutomationV1921`
- `runAccountingDayAutomationV1921`
- `applySuggestedLegacyClassificationsV1921`

### Materials / templates / costing

- `saveAccountingMaterial`
- archive/activate/recalculate material flows
- `saveAccountingTemplate`
- `saveAccountingDeptLine`
- `saveAccountingWaste`

### Purchases / sales

- `saveEasyStorePurchase`
- `saveEasyStoreSale`
- `saveEasyStorePurchaseV2`
- `saveEasyStoreSaleV2`

### Suppliers

- `getEasyStoreSuppliers`
- `saveEasyStoreSupplier`

### Customer accounts / party ledger

- `getEasyStoreCustomers`
- `getCustomerAccountV1915`
- `saveCustomerAccountMovementV1915`
- `getPartyAccountV1858`
- `savePartyLedgerTransactionV1858`

### Other accounting cores

- cashbox/account manager core
- final invoice close/reopen flows
- `easyStoreSystemHealth`

هذه الوظائف هي Source Evidence عند نقل كل Capability، وليست APIs يجب نسخها حرفيًا.

---

## 7. أهم شاشات/State في واجهة EasyStore

`app.js` baseline:

`ES47 V1922 Unified Safe Build`

Screens / sections observed:

- dashboard
- suppliers
- customers
- items
- purchase
- sales
- final
- stock
- kitchen
- dailyClose
- legacy
- reports
- health
- dept
- deptPurchases
- waste

State observed includes concepts like:

- materials
- templates
- suppliers
- purchases
- dailyPurchases
- sales
- customers
- stockMoves
- wasteLines
- deptLines
- finalInvoices
- custodyEntries
- custodySummary
- departmentDayCloses
- unclassifiedRows

الواجهة كانت تستخدم session/local storage في بعض سياق الدخول والحالة، لكن في TrendOS الجديد لا يجوز اعتبار browser state مصدر حقيقة مالية.

---

## 8. أهم سلوك مالي مثبت يجب الحفاظ عليه

### 8.1 المبيعات والفواتير النهائية

EasyStore كان يملك Sales + Final Invoice flow.

في TrendOS Accounting الجديد:

- يتم الحفاظ على السلوك التجاري المفيد.
- الربط يكون عن طريق `Order ID + Line ID` من TrendOS Operations.
- لا ينشئ Accounting هوية Order/Line موازية.
- Invoice IDs تكون Accounting-owned.

### 8.2 المشتريات

يتم الحفاظ على:

- Purchase header/line behavior.
- request IDs / duplicate protection.
- الربط بالمورد والخامة.
- أثر الشراء على المخزون حين يكون السلوك مثبتًا.

لكن الهوية الجديدة تكون:

- `Supplier ID / Party ID`
- `Item ID`
- Accounting document IDs

وليس الاسم فقط.

### 8.3 العملاء والتحصيل

EasyStore يحتوي Customer Account + Collection workflows.

المطلوب نقله:

- Receivable balance behavior.
- collection posting.
- customer account history.

مع استبدال name identity بـ:

`Customer ID / Party ID`

### 8.4 Party Ledger

سلوك `V1858` يعتبر أساسًا مفيدًا لبناء Unified Party Ledger داخل TrendOS Accounting.

الهدف:

- عميل/مورد/طرف له ID ثابت.
- حركات append-only قدر الإمكان.
- traceable source document.
- no hidden name matching.

### 8.5 Treasury / Cashbox

سلوك الخزنة والتحصيل/الدفع يُحفظ، لكن التنفيذ النهائي:

- server-authoritative.
- idempotent.
- auditable.
- مرتبط بمستند مالي واضح.

### 8.6 المخزون

EasyStore كان يملك حركة مخزون وزيادة مباشرة مع المشتريات في إصداراته المتأخرة.

في النظام الجديد:

- `StockMovement` ledger append-only/auditable.
- Purchase Receipt هو مصدر حركة واضح.
- duplicate protection إلزامي.
- reversal بدل destructive delete.

### 8.7 الخامات/BOM/Product Formation

سلوك templates/components/cost cascade ينقل إلى BOM/Product Formation.

المطلوب في TrendOS الجديد:

- recursive calculation.
- cycle detection.
- atomic formation.
- shortage calculation.
- no silent stock mutation.
- full audit.

### 8.8 مشتريات الأقسام

EasyStore V1917 كان يملك:

- entry
- approval
- rejection
- department scope

يتم الحفاظ على Intent، لكن الصلاحيات تتحول إلى Shared TrendOS RBAC + Department ID.

### 8.9 العهدة / Custody

EasyStore V1920 يحتفظ بسلوك:

- advance/custody.
- settlement.
- close.
- reconciliation.
- reversal semantics عند الحاجة.

ينقل إلى domain مستقل داخل Accounting.

### 8.10 إغلاق اليوم / Department Day Close

سلوك day-close يتم الحفاظ عليه، خاصة شروط الإغلاق والتوفيق بين المبيعات والتكلفة والعهدة والحركات اليومية.

لا يتم تبسيطه إلى مجرد زر إغلاق بدون gates.

### 8.11 Reverse / Adjustment

القاعدة الجديدة:

**لا destructive delete للحركات المالية/المخزنية المعتمدة.**

يتم استخدام Reversal/Adjustment transaction قابل للتدقيق.

### 8.12 Idempotency

EasyStore استخدم request IDs في حركات مهمة مثل purchase flows.

في TrendOS Accounting الجديد هذا يتحول من ممارسة جزئية إلى **Foundation mandatory** لكل Financial Write.

### 8.13 Audit

الـaudit القديم يتم ترقيته إلى Structured Immutable Audit Event Ledger قدر الإمكان.

### 8.14 Health / Integrity

`easyStoreSystemHealth` لا يختفي؛ فكرته تندمج داخل TrendOS Integrity framework.

---

## 9. قاعدة الربح المعتمدة من EasyStore ثم المطورة في TrendOS

الاختبارات التاريخية في EasyStore أثبتت مبدأ:

`profit = sales - actual job cost - net waste`

وهناك قاعدة مهمة:

**لا يتم طرح المشتريات مرة ثانية إذا كانت التكلفة الفعلية للبند احتسبتها بالفعل.**

لكن TrendOS الجديد يرفع الدقة إلى مستوى:

`Line ID + Profit Center`

ولا يكتفي بربح Order أو Invoice كامل.

المطلوب لكل سطر/بند مالي تشغيلي حيث ينطبق:

- Order ID
- Line ID
- Profit Center ID
- executing entity / relevant cost owner
- Revenue
- Recognized Cost
- Waste/Adjustment impact
- Factual Profit

### فصل Profit Sharing

نسب الشركاء/المستثمرين/أصحاب الماكينات **ليست جزءًا من Accounting Core**.

الترتيب المعتمد:

`TrendOS Operations -> TrendOS Accounting -> TrendOS Profit Engine / Partner Network`

Accounting يحسب الحقيقة المالية الفعلية أولًا، ثم Profit Engine يوزعها لاحقًا حسب قواعد الشراكة.

---

## 10. نقاط الضعف التي لا يجب ترحيلها كما هي

### 10.1 Monolithic Apps Script

ممنوع إعادة بناء Code.gs ضخم جديد يجمع كل الدومينات في ملف واحد.

### 10.2 Authorization بالأسماء

EasyStore frontend كان يستخدم role/name regex وموظفين بأسماء ثابتة ضمن gates مثل:

- admin
- laser
- print
- final

هذا **غير مقبول** في TrendOS Accounting الجديد.

المطلوب:

Shared TrendOS authenticated session + canonical RBAC/permissions.

### 10.3 Direct frontend -> Apps Script coupling

لا تعود واجهة الحسابات الجديدة مرتبطة مباشرة بعنوان Apps Script كعقد نهائي.

العميل الجديد يتكلم مع TrendOS Edge/API contract.

أثناء الهجرة قد تظل Apps Script/Sheets سلطة الكتابة، لكن خلف Adapter/contract مضبوط.

### 10.4 Identity بالأسماء

ممنوع أن يكون اسم العميل أو المورد أو الموظف هو Primary Business Key.

### 10.5 Browser state as authority

Local/session storage = UI/cache فقط.

لا تعتبر Ledger أو Financial Source of Truth.

### 10.6 Profit summary الذي يفقد Line ID

أي Summary لا يمكن النزول منه إلى `Order ID + Line ID + Profit Center` لا يعتبر كافيًا كنظام Accounting نهائي.

### 10.7 Hidden linkage

أي ربط لا يمكن تتبعه أو تدقيقه يجب استبداله بعلاقة صريحة ذات IDs ثابتة.

---

## 11. IDs والعقود الأساسية في TrendOS Accounting الجديد

### Operations-owned

- `Order ID`
- `Line ID`

### Shared / Registry-owned

- `Item ID`
- `Customer ID / Party ID`
- `Supplier ID / Party ID`
- `Department ID`
- `Profit Center ID`

### Accounting-owned

- `Invoice ID`
- `Purchase ID`
- `Payment ID`
- `Treasury Transaction ID`
- `Stock Movement ID`
- Accounting Close/Reconciliation IDs

### Event-owned

- `Event ID / Idempotency Key`

قاعدة غير قابلة للتفاوض:

**Order ID هو المفتاح الأساسي المنطقي للأوردر وLine ID هو المفتاح الأساسي المنطقي للبند.**

---

## 12. عقد التكامل Native TrendOS

### Operations -> Accounting

المدخلات المستهدفة:

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

المخرجات المستهدفة:

- Invoice ID
- Order ID
- Line ID
- payment status
- paid amount
- remaining amount
- recognized cost
- factual line profit
- stock/BOM result
- financial approval/block state when configured

### Shared platform rules

- نفس TrendOS auth/session.
- نفس RBAC/permissions.
- لا duplicate order/customer identity داخل Accounting.
- لا invented prices.
- events replay-safe/idempotent.
- stock/BOM atomic and auditable.
- partner/investor percentages outside Accounting Core.

---

## 13. Migration Matrix المعتمد

| EasyStore capability | TrendOS Accounting target | Treatment |
|---|---|---|
| `getAccounting_` | Dashboard / Read Model | preserve behavior, rebuild read model |
| `saveEasyStoreSaleV2_` | Sales Invoice + Lines | preserve, enforce Order ID + Line ID |
| Customer Account V1915 | Receivables + Collections | preserve workflow, move to Party ID |
| Party Ledger V1858 | Unified Party Ledger | normalize to canonical subledger |
| `saveEasyStorePurchaseV2_` | Purchase + Lines | preserve duplicate protection, use Supplier/Item IDs |
| Purchase finance posting | Payables + Supplier Payments | explicit financial transactions |
| Cashbox | Treasury | server-authoritative/idempotent |
| Materials | Item/Material Master | shared Item IDs |
| Stock movement sheets | Inventory Ledger | append-only audit |
| Templates/components/cost cascade | BOM/Product Formation | recursive/atomic/cycle-safe |
| Department Purchases V1917 | Department Purchases | shared RBAC + Department ID |
| Immediate stock V1919 | Purchase Receipt | transactional duplicate protection |
| Custody V1920 | Custody/Advances/Settlement | preserve semantics |
| Day Close V1920 | Department Close/Reconciliation | preserve gates + actual cost logic |
| Unclassified Legacy V1920 | Migration/Reconciliation Queue | migration tool, not normal path |
| Reverse approved purchase | Reversal Transaction | append-only reversal |
| Semi-auto V1921 | Accounting Automation | after manual flows are proven |
| Request IDs | Idempotency Ledger | mandatory foundation |
| Audit | Audit Event Ledger | immutable structured trail |
| System Health | Accounting Health/Integrity | merge with TrendOS Integrity |
| Role gates | Shared TrendOS RBAC | preserve intent, replace name auth |
| Profit | Line Cost + Profit Center | Line ID + Profit Center factual profit |

Full matrix source:

`docs/trendos/checkpoints/ACCOUNTING_EASYSTORE_MIGRATION_MATRIX_2026-09-05.md`

---

## 14. Build Order المعتمد

### F1 — Foundation

1. Shared TrendOS session/RBAC adapter.
2. Accounting entity IDs.
3. Idempotency ledger contract.
4. Audit-event contract.
5. Party IDs.
6. Item IDs.
7. Department IDs.
8. Profit Center IDs.

### F2 — Finance

- Party Ledger.
- Treasury/Cashboxes.
- Customer Collections.
- Supplier Payments.
- Purchase headers/lines.
- Payable creation.

### F3 — Stock / Cost

- Item/Material Master.
- Stock Movement Ledger.
- Purchase Receipts.
- BOM/Product Formation.
- Waste/Adjustment/Reversal.
- Actual Cost Recognition.

### F4 — Revenue

- consume TrendOS Order ID + Line ID.
- invoices from approved operational lines.
- receivables/payment status.
- actual cost per line.
- profit per Line ID + Profit Center.

### F5 — Operations Accounting

- Department Purchases.
- Custody.
- Department Close.
- Accounting Daily Close/Reconciliation.

### F6 — Management

- Dashboard.
- Income/Profit Reports.
- Receivables/Payables Aging.
- Inventory Valuation.
- Department/Profit Center reporting.
- Accounting Health/Integrity.

---

## 15. الاختبارات الموجودة في EasyStore التي تعتبر Evidence

Tests observed include:

- `accounting_automation_v1921.test.js`
- `accounting_day_close_v1920.test.js`
- `customer_accounts_ui_v1915.test.js`
- `customer_accounts_v1915.test.js`
- `department_accounting_scope_v1918.test.js`
- `dept_daily_purchases_ui_v1917.test.js`
- `dept_daily_purchases_v1917.test.js`
- `unified_safe_build_v1922.test.js`

Unified safe-build tests historically covered concepts like:

- duplicate backend function protection.
- session expiry.
- admin purchase permissions.
- ScriptLock.
- duplicate prevention.
- POST behavior.
- avoiding token query parameters.

هذه الاختبارات لا تكفي وحدها للنظام الجديد، لكنها Evidence يجب قراءته قبل تغيير السلوك الذي كانت تحميه.

---

## 16. Historical EasyStore version progression المهمة

السلوك الذي وصل إلى V1922 تطور عبر مراحل مثل:

- V1915: Customer accounts / collections.
- V1917: Daily department purchases.
- V1918: Department accounting scope.
- V1919: Immediate stock with duplicate protection / reversal handling.
- V1920: Custody + department close + legacy classification/reversal.
- V1921: Semi-auto accounting.
- V1922: Unified Safe Build.

الـcommits التاريخية التي سبق توثيقها في مراجعتنا تشمل أمثلة مثل:

- `7e5b0ba...` — V1921 semi-auto accounting.
- `9bef9a5e...` — V1920 custody + department close.
- `b0ffa222...` — immediate stock increase + duplicate prevention/safe reversal.
- `411efdbb...` — separate laser/print accounting scopes.
- `0546366b...` — daily department purchases and approval.
- `5d58cc8c...` — customer account side drawer.
- `cfb22c67...` — customer collection workflow.
- `bc0d3a2e...` — accounting backend version exposure.

هذه references تاريخية وليست شرطًا أن تكون HEAD الحالي.

---

## 17. Full Program Scope المعتمد لـ TrendOS Accounting

المنتج النهائي المستهدف ليس مجرد جزء من EasyStore، بل برنامج حسابات كامل داخل TrendOS ويشمل:

1. Dashboard.
2. Sales / Invoices.
3. Customer Receivables.
4. Customer Collections.
5. Purchases.
6. Supplier Payables.
7. Supplier Payments.
8. Expenses.
9. Treasury / Cashboxes / Payment Methods.
10. Customers / Party Ledger.
11. Suppliers / Party Ledger.
12. Items / Materials.
13. Inventory / Stock Movements.
14. BOM / Product Formation.
15. Cost Recognition / COGS.
16. Department Purchases.
17. Custody / Advances / Settlement.
18. Department Day Close.
19. Waste / Adjustments / Reversals.
20. Line Profit + Profit Center reporting.
21. Management reports.
22. Audit Log.
23. Health / Integrity.
24. Settings / Accounts / Permissions integration.

---

## 18. ما تم تنفيذه بالفعل في TrendOS نتيجة اعتماد EasyStore baseline

تم إنشاء/تحديث مكونات داخل `fawakhry/TrendOs` لتثبيت هذا الاتجاه، منها:

### Direction / Documentation

- `ACCOUNTING_NATIVE_TRENDOS_DIRECTION_2026-09-05.md`
- `ACCOUNTING_EASYSTORE_ASSESSMENT_2026-09-05.md`
- `ACCOUNTING_EASYSTORE_BASELINE_CORRECTION_2026-09-05.md`
- `ACCOUNTING_EASYSTORE_MIGRATION_MATRIX_2026-09-05.md`
- `ACCOUNTING_EASYSTORE_BASELINE_IMPLEMENTATION_2026-09-05.md`

### Code / Contracts

- `cloudflare-d1/src/accounting-capabilities-v1.mjs`
- `cloudflare-d1/src/accounting-native-module.mjs`
- native routes including:
  - `/trendos/accounting`
  - `/v1/accounting/integration`
  - `/v1/accounting/capabilities`

### Canonical changes in native module/capability contract

- EasyStore role explicitly classified as historical working baseline.
- stable IDs added to the contract.
- Profit Center ID included.
- shared TrendOS auth/RBAC target declared.
- employee-name regex authorization forbidden.
- invariant added: verified EasyStore behavior is preserved unless deliberately superseded by tested TrendOS contract.
- Cloudflare Preview remains read-only for financial authority.

### Tests

`tests/cloudflare_accounting_native_v1.test.mjs`

Tests include checks around:

- capabilities endpoint.
- historical EasyStore role.
- Profit Center ID.
- migration strategy.
- treasury/custody/day-close/line-profit capabilities.
- Order/Line ownership.
- Invoice ownership.
- no employee-name auth.
- Line ID + Profit Center requirement.
- native EasyStore -> TrendOS wording.
- POST remains read-only on Preview.

---

## 19. Accounting Preview / Cloudflare context المرتبط بترحيل EasyStore

تم بناء Accounting Preview منفصل داخل Cloudflare لأغراض التطوير والاختبار.

Known preview concepts:

- `/accounting`
- `/trendos/accounting`
- `/v1/accounting/health`
- `/v1/accounting/integration`
- `/v1/accounting/capabilities`

Preview rule:

- no authoritative financial writes.
- browser-local mutations may exist فقط للتجربة في بعض الشاشات القديمة من الـpreview.
- D1 financial authority is not granted by Preview.
- Google Sheets + Apps Script remain financial write authority until controlled cutover.

### مهم

Cloudflare infrastructure work مثل migration-ledger reconciliation أو Production Shadow هو **مسار بنية تحتية منفصل** عن تعريف EasyStore نفسه.

لا يجوز اعتبار نجاح أي D1 schema/migration step بمثابة نجاح ترحيل EasyStore business flows أو منح D1 سلطة مالية.

---

## 20. Source of Truth / Production Authority أثناء الهجرة

حتى إشعار/Checkpoint صريح يغير ذلك:

**Google Sheets + Apps Script = authoritative financial write source.**

Cloudflare/D1:

- read/mirror/performance/preview حسب المرحلة.
- ليس سلطة مالية لمجرد وجود schema.
- لا cutover صامت.

ممنوع:

- تغيير authority ضمنيًا.
- تشغيل D1 financial writes بدون boundary مصرح بها ومثبتة.
- اعتبار Preview هو Production Accounting.
- تخطي reconciliation/dual-run verification.

---

## 21. قاعدة نقل أي Capability من EasyStore

كل Capability يجب أن تمر بالتسلسل التالي:

1. تحديد السلوك الفعلي في EasyStore source.
2. تحديد Inputs/Outputs والحالات الطرفية.
3. تحديد هوية TrendOS canonical المناسبة.
4. تحديد duplicate/retry/idempotency behavior.
5. تحديد audit requirements.
6. كتابة automated tests.
7. تنفيذها في TrendOS Accounting.
8. Preview verification.
9. Runtime evidence عند الحاجة.
10. تسجيل checkpoint في الصندوق الأسود.
11. عدم منح Production write authority قبل reconciliation ناجح.

هذه القاعدة تمنع إعادة كتابة النظام من الذاكرة أو التخمين.

---

## 22. تعليمات المستخدم الخاصة بمسار EasyStore / Accounting

تعليمات العمل المعتمدة من المستخدم في هذا المسار:

- **لا تبدأ من الصفر.**
- اقرأ الصندوق الأسود أولًا.
- EasyStore كان يعمل في TrendOS بصورة بدائية؛ تعامل معه كأساس تاريخي عامل.
- المطلوب برنامج حسابات مبني ويخدم TrendOS، وليس تطبيقًا منفصلًا عنه.
- نفذ وطوّر بدون الرجوع للمستخدم في القرارات الهندسية اليومية.
- لا تطلب تأكيدًا إلا عند Boundary حقيقية تعتمد على المستخدم شخصيًا أو Production mutation صريحة محجوزة له.
- سجل كل خطوة مادية في الصندوق الأسود.
- حافظ على Production financial authority حتى Cutover منفصل.

---

## 23. ما لا يتم حفظه في سجل EasyStore

هذا السجل لا يخزن:

- API token values.
- passwords.
- session secrets.
- private credentials.
- Google/Cloudflare/GitHub secret values.
- أي بيانات دخول شخصية.

يمكن تسجيل **اسم Secret أو الغرض منه فقط** عند الحاجة التقنية، والقيمة تظل في secret storage المخصص.

---

## 24. Canonical references داخل TrendOS

الملفات الأساسية المرتبطة بهذا السجل:

- `docs/trendos/checkpoints/ACCOUNTING_EASYSTORE_ASSESSMENT_2026-09-05.md`
- `docs/trendos/checkpoints/ACCOUNTING_EASYSTORE_BASELINE_CORRECTION_2026-09-05.md`
- `docs/trendos/checkpoints/ACCOUNTING_EASYSTORE_MIGRATION_MATRIX_2026-09-05.md`
- `docs/trendos/checkpoints/ACCOUNTING_EASYSTORE_BASELINE_IMPLEMENTATION_2026-09-05.md`
- `docs/trendos/checkpoints/ACCOUNTING_NATIVE_TRENDOS_DIRECTION_2026-09-05.md`
- `cloudflare-d1/src/accounting-capabilities-v1.mjs`
- `cloudflare-d1/src/accounting-native-module.mjs`
- `tests/cloudflare_accounting_native_v1.test.mjs`

External historical source:

- `fawakhry/EasyStore`

---

## 25. نقطة الحقيقة الحالية لـ EasyStore

**EasyStore ليس مشروعًا منفصلًا سنعيد تشغيله كما هو.**

هو:

1. Historical working Accounting baseline داخل TrendOS.
2. Source of verified workflows/business rules.
3. Source of regression behavior/tests.
4. Migration input للنظام الجديد.

والمنتج النهائي هو:

**TrendOS Accounting**

المتكامل Native مع:

- Operations.
- Shared Identity.
- Shared RBAC.
- Inventory/BOM.
- Treasury.
- Receivables/Payables.
- Department Accounting.
- Costing.
- Audit/Integrity.
- future Profit Engine.

---

## 26. الحالة عند إنشاء هذا السجل

EasyStore source HEAD confirmed on 2026-09-05:

`79d5fa1965d42996de49f949a4c34121a4231157`

TrendOS working branch had continued beyond the Accounting checkpoints into separate Cloudflare/WhatsApp work, therefore this file intentionally **isolates EasyStore information from unrelated TrendOS black-box traffic**.

No production mutation was performed by creating this file.

No EasyStore code was modified in `fawakhry/EasyStore`.

No Apps Script/Sheets financial data was modified.

No D1 financial authority was changed.

---

## 27. قاعدة التحديث من الآن

عند أي رسالة أو تنفيذ يخص EasyStore:

- اقرأ هذا الملف أولًا بعد `الصندوق الاسود.md` إذا كان الطلب متعلقًا بـ EasyStore/Accounting migration.
- أضف نتيجة التنفيذ هنا أو اربط Checkpoint جديدًا من هنا.
- لا تعيد توصيف EasyStore كـ blueprint-only.
- لا تبدأ inventory/review من الصفر إذا كانت المعلومة موجودة هنا.
- إذا تغير Head في `fawakhry/EasyStore`، سجل الـHead الجديد وتاريخ المراجعة بدل استبدال التاريخ القديم.
- احتفظ بالـaudit trail ولا تحذف التصحيحات السابقة.

---

# FINAL CANONICAL STATEMENT

**EasyStore هو الأساس التاريخي العامل لبرنامج الحسابات البدائي داخل TrendOS، ويتم استخدامه للحفاظ على السلوك المالي والتشغيلي المثبت أثناء بناء TrendOS Accounting الجديد بصورة Native، Modular، ID-based، RBAC-based، Idempotent، Auditable، ومتكاملة مع Operations، مع بقاء سلطة الكتابة المالية الحالية في Google Sheets + Apps Script حتى Cutover منفصل ومثبت.**
