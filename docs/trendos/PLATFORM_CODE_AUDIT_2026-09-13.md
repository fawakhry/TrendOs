# TrendOS Platform Code Audit — 2026-09-13

## Scope

Read-only review after the owner rolled production Apps Script back from the breaking Version 156 and the platform became operational again.

Reviewed:

- Production spreadsheet `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`.
- Full populated source range `سكريبت Apps Script!A1:A8237`.
- Current GitHub `Code.gs` (12,025 lines).
- Current frontend `app.js` (10,842 lines).
- Operator Task V2 Apps Script backend and Edge proxy.
- Work Queue V1 reference implementation.
- Cloudflare Edge Gateway and Operator Task V2 Worker route.
- Operator Task V2 production activation blackbox and incident diagnostics.

No production source, Apps Script deployment, Script Properties, triggers, business data, D1 schema, Task state, or secrets were changed by this audit.

## Static audit validation

Corrected workflow run:

- Run: `34741024381`
- Result: `success`
- Head: `0ec3e9a56dc92cc09b3389208527e7dd04d2f83a`

Current GitHub source metrics:

- `Code.gs`: 744,152 bytes, 12,025 lines, 628 named function declarations, 624 distinct names by lexical declaration scan.
- `app.js`: 579,864 bytes, 10,842 lines, 806 named function declarations, 671 distinct names by lexical declaration scan.

Important interpretation rule: lexical duplicate names do **not** automatically mean runtime collision because some declarations are scoped inside different functions/IIFEs. Duplicate-name counts are review signals only, not defects by themselves.

## Finding 1 — the spreadsheet code tab is an archive, not a deployable source

`سكريبت Apps Script` contains a long historical patch stack with repeated generations and later overrides. The last definition often supersedes earlier definitions. Copying the tab wholesale makes the runtime dependent on patch order and can reintroduce old behavior.

The repository deployment manifest already establishes `Code.gs` plus explicit modules as the deploy source.

### Required control

- `سكريبت Apps Script` becomes reference/archive only.
- GitHub becomes the canonical source.
- Every Apps Script production version must be reproducible from one Git commit and an explicit module manifest.
- No manual route patching directly in production Apps Script.

## Finding 2 — request hot paths contain schema/setup side effects

Examples verified in current `Code.gs` and historical sheet source:

- `findUser_()` performs a users-sheet full read and goes through user schema setup.
- `authorize_()` can clear the stored token on an invalid/expired session.
- `getDeptDailyPurchasesV1917_()` enters an ensure-sheet helper.
- `getAccounting_()` enters accounting sheet ensure helpers.
- `accountsRowsForPartyV1858_()` and `getAccountsLedgerV1858_()` can enter ensure-sheet helpers.
- `getEasyStoreCustomers_()` can ensure accounting/customer balance columns.
- `getEasyStoreSuppliers_()` can ensure supplier structures.
- `getAuditLogV1859_()` and `getCashboxTransactionsV1859_()` can ensure supporting sheets.
- Customer Manager / Customer Feedback read helpers contain ensure/create behavior in the historical production patch stack.

### Risk

A request described as read-only can pay write/schema latency, acquire extra locks internally, or mutate spreadsheet structure. It also makes first access after a deploy unpredictably expensive.

### Required control

Move every schema creation/header migration into explicit migration/preflight functions. Normal GET/read/auth routes must not create sheets, add headers, or clean session data.

## Finding 3 — authentication is on every request and is spreadsheet-heavy

`findUser_()` reads the users sheet. Every authenticated platform request passes through this path. Invalid/expired auth can also trigger token cleanup writes.

### Required control

Split responsibilities:

1. pure read-only verification,
2. explicit login/session issue,
3. explicit logout/revocation/cleanup.

Short safe caching of the employee auth projection may then be considered with explicit revocation semantics.

## Finding 4 — `getRowsPageV1931` is response pagination, not storage pagination

Current implementation obtains the complete allowed set through `getRows_()`, then filters/sorts/slices the requested page.

Therefore a five-row page can still incur the cold cost of scanning and building the full order-line working set.

### Required control

Build a narrow operations read model/index keyed for:

- department/screen,
- open/closed state,
- status,
- priority,
- updated/delivery time,
- order/line identifiers.

The page endpoint must query this projection rather than reconstruct all business objects before slicing.

## Finding 5 — several important reads are full-range/full-sheet scans

Corrected static audit found expensive-read indicators in, among others:

- `findUser_`
- `findLineTarget_`
- `getNextSimpleOrderNumber_`
- `getKnowledge_`
- `buildAiKnowledgeContext_`
- `getAiKnowledge_`
- `getAiSettingsMap_`
- `accSheetRows_`
- `findLineSnapshotForInvoice_`
- `buildCustomerPhoneMap_`
- `trendosDeliveryGateMapV1931_`
- `archivePublicRowsV1931_`
- `getTrendMasterCenterV1931_`
- `getDashboard_`
- `findCustomerByPortalCode_`
- `getCustomerOrders_`
- `findDraftRow_`
- `getPlatformAds_`
- `getPlatformSections_`
- `getFranchiseBranches_`
- `getServiceProviderRoutes_`
- `getMarketplace_`
- `getDeptInvoiceDraftV1887_`
- `aiOrdersViewRows_`
- `getAIOrderStatusV1891_`

This does not mean every listed function is currently slow in isolation. It means their cost grows with sheet size and they require endpoint-level latency measurement before further expansion.

## Finding 6 — normal rows boot already carries dashboard

The normal frontend rows load consumes `res.dashboard`; it does not need a second dashboard request for ordinary boot. Keep this combined behavior while optimizing the underlying read model.

Explicit dashboard refreshes can remain separate for manager/end-of-day use.

## Finding 7 — urgent notifications can cause an additional legacy rows read

When browser urgent notifications are enabled, the frontend can call legacy `getRows` again. Automatic polling is currently disabled, but this remains an avoidable additional full read when the feature runs.

### Required control

Urgent/Fly/Press operational indicators should be served from the same narrow operations projection used by Tasks/operations views.

# Operator Task V2 audit

## Finding 8 — Task `status` repeatedly scans `بنود الأوردرات`

The V2 backend uses a source-row helper that reads the complete source sheet. Wael status can derive:

- active task view,
- Fly Print lane,
- Press candidates,

through separate source scans.

A read-only status endpoint therefore scales poorly as the source sheet grows.

## Finding 9 — V2 mutation is coupled to the main backend

`claimNext` and `completeTask` delegate source status updates to the main `updateLine_()` implementation and run in the same Apps Script project.

This creates a two-way blast radius: Task regressions can affect the main platform runtime, and main platform regressions can break Tasks.

## Finding 10 — shared Script lock increases coupling

Task mutation uses a Script-level lock in the same Apps Script project. Heavy scans or slow mutations under the same project can serialize Task operations and potentially contend with other code paths.

## Finding 11 — the Cloudflare V2 route is a secure proxy, not runtime isolation

The Worker validates Edge session/role/method/HMAC/idempotency header, then sends the operation back to the same production Apps Script Web App with a 15-second upstream timeout.

Thus Cloudflare does not remove Apps Script from the Task request critical path.

## Finding 12 — the session exchange was using the wrong/fragile upstream shape during the incident

Incident probes showed:

- POST employee verification: HTTP 200, about 4 seconds.
- GET employee verification: HTTP 404 after about 27 seconds.
- Worker Edge session bridge had a 15-second abort around this upstream verification.

Edge Orders Read was therefore disabled in production frontend to avoid adding that failed wait before Apps Script fallback.

# Root-cause interpretation of the Version 156 incident

We cannot prove one exact offending line without the rolled-back Version 156 execution history/source snapshot. However, the strongest operational evidence is:

1. the platform problem began immediately after the live Apps Script project was manually patched/deployed for Operator Task V2;
2. Version 156 added Task modules and patched the shared V1932 router in the production Apps Script project;
3. the live Apps Script source was no longer identical to the GitHub `Code.gs` baseline;
4. rolling the Web App back restored the platform.

Therefore Version 156/manual shared-project Task publication is treated as the regression boundary. It must not be recreated.

# Decision — Tasks V3

Do not put Tasks back into the main Apps Script project.

Build Tasks V3 as a separate runtime:

- separate Apps Script project,
- separate Web App deployment,
- same spreadsheet may remain authoritative,
- explicit spreadsheet ID,
- dedicated Task index + ledger,
- signed POST-only Worker bridge,
- no main `doGet/doPost` patch,
- no main `authorize_`, `findUser_`, `updateLine_` dependency,
- no schema creation in request handlers,
- no full `بنود الأوردرات` scan for ordinary status,
- persisted mutation idempotency,
- compare-and-set against authoritative source row for claim/complete.

See `TASKS_V3_ISOLATION_AND_PLATFORM_PERFORMANCE_PLAN_2026-09-13.md` for the staged rollout.

# Recommended execution order

1. Keep current rolled-back production Apps Script untouched.
2. Instrument current platform read latency without mutation.
3. Refactor schema/setup work out of read hot paths on a branch, with contract tests.
4. Build a narrow operations projection/read model and qualify it read-only.
5. Build Tasks V3 dedicated bridge + index/ledger in isolated preview.
6. Production read-only Wael canary only.
7. Stop for explicit owner approval before enabling Task claim/complete mutation.
8. Gaber follows only after Wael stability; material control remains a separate later gate.

# Safety boundaries retained

- No `EDGE_SESSION_SECRET` change.
- No `TRENDOS_OPERATOR_TASK_PROXY_SECRET` change.
- No Gaber Material Control enablement.
- No D1 migration.
- No RP-08.
- No production `claimNext`.
- No production `completeTask`.
- Sheets remain authoritative.
- Edge Orders Read remains OFF until separately requalified.
