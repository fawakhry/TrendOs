# TrendOS Tasks V3 Isolation + Platform Performance Plan — 2026-09-13

## Status

- Review branch only: `tasks-v3-isolation-review-20260913`
- Stable production frontend baseline: `de4d1c010aac521f8e5105c5677c1e0fdd78ca25`
- Production Apps Script was rolled back by the owner from breaking Web App Version 156 to the immediately previous production version. Exact rollback target version was not independently observed and MUST NOT be guessed.
- Platform became operational again after rollback.
- Edge Orders Read remains disabled in frontend config so order loading goes directly to the stable Apps Script path while Edge session/freshness issues remain unqualified.
- This document changes no production code, Script Properties, deployments, triggers, business data, D1 schema, or task state.

## Sources reviewed

1. Production spreadsheet `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`.
2. Sheet `سكريبت Apps Script`, all populated source rows in column A (`A1:A8237`).
3. Current GitHub `Code.gs` and frontend `app.js`.
4. `operator-task-workflow-v2.gs`.
5. `operator-task-edge-proxy-v2.gs`.
6. `work-queue-backend-v1.gs`.
7. Cloudflare `edge-gateway.mjs`.
8. Cloudflare `operator-task-edge-v2.mjs`.
9. Operator Task V2 publication/activation blackbox and production diagnostics.

## Executive conclusion

Do **not** republish Operator Task V2 inside the main production Apps Script project/router.

The outage correlation plus rollback recovery shows that changing the shared Apps Script deployment is too high-risk for Tasks. Independently, the code review shows that both the main platform and Task V2 contain repeated full-sheet reads, schema checks in request hot paths, shared authorization helpers, shared source-status mutations, and global Script locks. Cloudflare V2 currently proxies Task requests back into that same Apps Script runtime, so it does not provide runtime isolation.

Tasks V3 must be isolated from the main TrendOS Web App. The stable main Apps Script deployment should remain the authority for existing platform behavior until performance work is independently qualified.

---

# 1. Main Apps Script findings

## 1.1 `سكريبت Apps Script` is not a safe deployment source

The sheet contains a historical patch stack with many generations of code and repeated function definitions. Runtime behavior depends on the final definition order. It is useful as an archive/reference but must not be copied wholesale into production.

GitHub deployment documentation already defines current `Code.gs` + explicit modules as the deployment source, not the sheet tab.

**Rule:** no future production deployment may be assembled manually from the `سكريبت Apps Script` sheet.

## 1.2 Read paths still contain schema checks / possible writes

Examples include:

- `findUser_()` -> `ensureUsersSetup_()` -> `ensureHeaderIfAnyMissing_()`.
- `buildCustomerPhoneMap_()` -> `ensureCustomerDebtHeaders_()` -> header ensure.
- debt restriction reads can ensure/create their supporting sheet/header.
- `authorize_()` clears the stored employee token when the supplied token is invalid/expired.

A normal GET/read path should not be responsible for schema migration or cleanup writes.

**Target rule:** all schema creation/migration moves to explicit, owner-run preflight/migration functions. Read endpoints become read-only.

## 1.3 Authentication is expensive and can mutate

Every authenticated request calls `findUser_()`, which reads the users sheet after schema checks. Invalid/expired sessions may trigger a token-clearing write.

**Target:** split `verifyEmployeeSessionReadOnly` from session mutation/cleanup. Cache a safe employee auth projection for a short TTL where security permits, and keep revocation semantics explicit.

## 1.4 `getRowsPageV1931` is not true storage-level pagination

The current implementation calls `getRows_()` to build the complete allowed order-line set, then filters/sorts/slices the requested page. Page size therefore reduces response size but not cold request work.

**Target:** a new read model/index that can satisfy page/filter/count requests without reconstructing the full legacy object graph on every request.

## 1.5 One rows request already contains dashboard data

Frontend `loadRows()` consumes `res.dashboard`. The normal boot correctly avoids a separate dashboard request. `loadDashboard()` still exists for explicit manager/end-of-day refresh paths.

No change is required to normal boot here; retain the combined response model.

## 1.6 Urgent/Fly notification path can trigger another full order read

When browser urgent notifications are enabled, `checkUrgentNotifications()` calls legacy `getRows`, creating another full read. Automatic polling is currently disabled, but enabling notifications performs the extra request.

**Target:** serve urgent/Fly Print from a narrow indexed endpoint or reuse the Task/operations read model.

---

# 2. Operator Task V2 findings

## 2.1 Task status performs repeated full source scans

`otSourceRowsV2_()` reads the full `بنود الأوردرات` data range.

For Wael, a single `status` can cause source scans through:

1. active task view enrichment,
2. Fly Print lane,
3. Press candidate lane.

This is unnecessary and directly increases Apps Script latency.

## 2.2 Claim/complete are coupled to the legacy backend

Task writes delegate source status updates to the main `updateLine_()` implementation. Therefore Task runtime correctness and latency depend on the entire main Apps Script backend.

## 2.3 Global Script lock increases blast radius

Claim/complete use a Script-level lock fallback. Heavy work under this lock can serialize unrelated executions in the same Apps Script project.

**Target:** Task-specific locking scope in a separate runtime. Never hold a global lock while performing full-sheet scans.

## 2.4 Task Edge V2 is a proxy, not an isolation layer

Cloudflare validates route/method/role/session/HMAC and then POSTs each Task operation to the production Apps Script Web App with a 15-second upstream timeout.

Therefore Apps Script slowness/regression still directly breaks Tasks and may contribute to load on the main platform.

## 2.5 Edge session exchange is also coupled to main Apps Script

`/v1/edge/session` calls `verifyEmployeeSession` on the main Apps Script. The current Worker implementation uses GET with a 15-second abort. During the incident, GET verification returned HTTP 404 after about 27 seconds while POST verification returned HTTP 200 in about 4 seconds.

**Rule:** do not re-enable Edge Orders Read or Task V2 production frontend until the employee session bridge is redesigned/qualified separately.

## 2.6 Transport idempotency is incomplete

The Worker requires `Idempotency-Key` for Task mutations and signs it into the assertion. The Apps Script Task ledger does not currently provide a complete persisted idempotency-result contract for all mutations.

**Target:** idempotency key must be stored with mutation outcome so retries cannot claim/complete twice.

---

# 3. Work Queue V1 finding

Work Queue V1 has useful concepts (one active task, pause/resume, press batches) but repeats the same architectural coupling:

- full `بنود الأوردرات` scans,
- main `authorize_()` dependency,
- main `updateLine_()` dependency,
- shared Apps Script runtime.

It should be treated as behavior/reference material, not republished as the production foundation.

---

# 4. Tasks V3 architecture

## 4.1 Main production Apps Script

Keep the currently rolled-back stable production deployment unchanged while V3 is built and tested.

Responsibilities remain:

- existing orders/customers/accounting/legacy platform behavior,
- Sheets remain authoritative,
- no Operator Task routes are added to `trendosV1932TryRoute_`.

## 4.2 Dedicated Tasks Bridge

Create a **separate Google Apps Script project and Web App deployment** for Tasks V3. It may access the same spreadsheet by explicit spreadsheet ID, but it must not share `doGet/doPost`, global namespace, deployment version, or Script lock with the main TrendOS backend.

Initial bridge contract:

- signed requests from the Cloudflare Worker only,
- POST only,
- HMAC assertion + timestamp + nonce/idempotency,
- no browser direct access,
- no legacy router dependency,
- no `authorize_`, `findUser_`, or `updateLine_` dependency,
- no schema creation during ordinary requests.

## 4.3 Dedicated Task index / ledger

Use dedicated sheets (names are candidates until migration review):

- `تشغيل - فهرس المهام V3`
- `تشغيل - سجل المهام V3`
- optionally `تشغيل - طلبات العمليات V3` for persisted idempotency results.

Index rows contain only fields needed for dispatch:

- Line ID
- Order ID
- source row/version fingerprint
- department
- priority
- expected delivery
- current source status
- Fly Print / Press flags
- eligibility state
- updated timestamp

Task ledger contains:

- Task ID
- employee
- line/order IDs
- claim/start/complete timestamps
- state
- final status
- work seconds
- idempotency key
- mutation result fingerprint

Task status must read the Task index/ledger once, not rescan the 92-column source sheet three times.

## 4.4 Source-of-truth rule

Sheets remain authoritative for business state during V3 rollout.

The Task index is a derived operational projection. Task mutation must perform a bounded compare-and-set against the authoritative source row before changing its status, using Line ID + expected source status/version/fingerprint. If the source changed, fail closed and refresh the index.

## 4.5 Cloudflare Worker

Frontend talks only to Cloudflare for Tasks.

Worker responsibilities:

- Edge session verification,
- role/capability enforcement,
- idempotency key generation/validation,
- HMAC signed POST to the dedicated Tasks Bridge,
- bounded timeout,
- fail-closed behavior,
- no fallback to the main Apps Script Task route.

The existing main Worker can host the public route if desired, but its Task upstream URL must be a separate `TASKS_V3_APPS_SCRIPT_URL`, not `APPS_SCRIPT_API_URL`.

## 4.6 Authentication

Do not verify every Task request by rescanning the users sheet.

Candidate safe flow:

1. employee logs in through stable TrendOS;
2. a separately qualified session exchange verifies the employee once;
3. Worker issues a short-lived signed Edge session;
4. Task Bridge trusts only Worker HMAC + asserted operator identity/capability;
5. session expiry/revocation behavior is explicitly tested.

No secret rotation is part of this design phase.

---

# 5. Platform performance work before Tasks mutation rollout

The platform slowdown should be improved independently from Tasks.

## Phase P1 — read-only instrumentation

Measure p50/p95 for:

- login
- `getRowsPageV1931`
- explicit dashboard refresh
- updateLine
- session verification

Record sheet read counts and cell counts per endpoint where practical.

## Phase P2 — remove schema mutation from read paths

Create explicit schema preflight/migration. Normal auth/order reads must never call header/sheet creation helpers.

## Phase P3 — operations read model

Build an indexed/narrow read path for active operations instead of rebuilding complete rows then slicing. Preserve the existing response contract behind a feature flag/read-only canary.

## Phase P4 — requalify Edge reads separately

Only after employee session POST verification and mirror freshness are proven should Edge Orders Read be considered for re-enable. This is separate from Tasks V3.

---

# 6. Tasks V3 rollout sequence

## T0 — design/tests only

- no production deployment
- no business mutations
- define bridge contract, ledger schema, idempotency semantics and source compare-and-set

## T1 — isolated preview

- new Apps Script project/deployment
- dedicated preview sheets or non-production spreadsheet
- Worker preview binding
- contract tests
- latency tests

## T2 — production read-only canary

- dedicated Tasks V3 bridge points at production spreadsheet **read-only**
- Wael only
- status + Fly Print + Press views only
- no claim/complete routes enabled
- verify no effect on main Apps Script latency

## T3 — mutation canary — explicit owner decision required

Only after T2 acceptance, stop and obtain explicit approval before enabling:

- `claimNext`
- `completeTask`

Canary must be one named operator and have rollback/disable gate.

## T4 — Gaber

Only after Wael mutation canary is stable. Gaber Material Control remains independently OFF until a later explicit phase.

---

# 7. Acceptance criteria

Before any production Task mutation:

- main platform remains operational on stable Apps Script deployment;
- no Task code added to main Apps Script router;
- Task read-only p95 target <= 2 s under normal load;
- session exchange p95 target <= 3 s and no GET/POST ambiguity;
- no full `بنود الأوردرات` scan per ordinary Task status request;
- one bounded source read for claim/complete compare-and-set;
- no schema creation in request hot paths;
- no global main-project Script lock;
- persisted mutation idempotency tested by repeated identical requests;
- source conflict test fails closed;
- Worker/bridge timeout and rollback/disable behavior tested;
- zero `claimNext` / `completeTask` production calls before explicit T3 approval.

# 8. Locked safety boundaries

Until separately approved:

- do not change/rotate `EDGE_SESSION_SECRET`;
- do not change `TRENDOS_OPERATOR_TASK_PROXY_SECRET`;
- do not enable `TRENDOS_GABER_MATERIAL_CONTROL_V1_ENABLED`;
- no D1 migration;
- no RP-08;
- no production `claimNext`;
- no production `completeTask`;
- Sheets remain authoritative;
- do not re-enable Edge Orders Read merely as part of Task work;
- do not patch the live main Apps Script project manually for Tasks.
