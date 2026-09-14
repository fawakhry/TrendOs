# TrendOS Tasks V3 — T1/T2 Readiness Checkpoint — 2026-09-14

## Scope

Read-only / branch-only readiness review. No production deploy, no Apps Script deployment, no Worker deployment, no Script Property change, no business-data mutation, no Task mutation.

## Heads reviewed

- Tasks V3 review branch before this checkpoint: `03905863c8c4bb5fe80bbd41d8c5f3e921505e88`
- Operator Task V2 latest head: `928575a2d1602a12384f45a2c2a2135f0fb88ea8`
- Production frontend remains outside this branch and is not changed by this step.

## Prior qualification retained

- Workflow: `TrendOS Tasks V3 T0 Contract`
- Run: `34741113625`
- Qualified head: `579e08c1dad4ad199fac04f43c43a90292814c58`
- Result: PASS

## V2 evidence carried forward

Latest V2 problem summary confirms:

- authenticated Edge session was a P0 blocker (`POST /v1/edge/session` -> repeated 502 at ~15–16 s);
- `getRowsPageV1931` is a confirmed major latency source and exceeded a 30-second read-only probe timeout;
- Cloudflare V2 still synchronously depended on the main Apps Script / Google Sheets runtime;
- no Production `claimNext` qualification was completed;
- no Production `completeTask` qualification was completed;
- atomic claim, persisted idempotency, partial-failure consistency and timeout/retry safety remained hardening requirements;
- Operator Task V2 was explicitly not classified Production-ready.

Therefore Tasks V3 must not regress to the V2 synchronous main-Apps-Script dependency.

## T0/T1/T2 readiness matrix

| Requirement | State | Evidence / note |
|---|---|---|
| Separate-project V3 bridge source | PASS | `tasks-v3-bridge-readonly.gs` explicitly targets a separate Apps Script project/deployment. |
| No main `authorize_` dependency | PASS | T0 contract forbids it. |
| No main `findUser_` dependency | PASS | T0 contract forbids it. |
| No main `updateLine_` dependency | PASS | T0 contract forbids it. |
| No direct `بنود الأوردرات` dependency | PASS | T0 contract forbids source-sheet literal/dependency. |
| No schema creation/write in ordinary T0 route | PASS | Contract forbids insert/write/append/delete/clear. |
| No main-project Script lock | PASS | Contract forbids `LockService.getScriptLock()`. |
| No `getDataRange()` full scan | PASS | Contract forbids it. |
| Signed HMAC assertion | PASS | Bridge uses `TASKS_V3_SHARED_SECRET`, canonical payload and HMAC-SHA256. |
| Bounded assertion lifetime | PASS | 120-second max assertion age. |
| Read-only operations only | PASS | `health`, `status`, `flyPrint`, `pressCandidates`. |
| `claimNext` absent | PASS / SAFETY | No mutation route exists in T0 source. |
| `completeTask` absent | PASS / SAFETY | No mutation route exists in T0 source. |
| Dedicated index/ledger names defined | PASS | `تشغيل - فهرس المهام V3`, `تشغيل - سجل المهام V3`. |
| Separate Apps Script project provisioned | NOT PROVEN / T1 BLOCKER | No authenticated owner-side provisioning evidence recorded. |
| Separate V3 Web App deployment provisioned | NOT PROVEN / T1 BLOCKER | No deployment URL/version recorded. |
| Preview/non-production index+ledger fixture provisioned | NOT PROVEN / T1 BLOCKER | No fixture initialization evidence recorded. |
| V3-specific Worker adapter / upstream | NOT PRESENT on current V3 branch | `cloudflare-d1/src` contains only legacy `index.js`, `index_v2.js`, `mirror.js`; no Tasks V3 Worker module/binding is present. |
| `TASKS_V3_APPS_SCRIPT_URL` Worker binding | NOT PRESENT / NOT QUALIFIED | Must be separate from main `APPS_SCRIPT_API_URL`. |
| No fallback from V3 Task route to main Apps Script Task V2 | NOT YET IMPLEMENTED | Must be enforced by Worker adapter contract. |
| T1 contract/latency test against isolated preview runtime | NOT RUN | Requires preview runtime/binding. |
| T2 production read-only Wael canary | NOT RUN | Must occur only after T1. |
| Wael-only canary enforcement | NOT QUALIFIED | Bridge has role capabilities; T2 external route/canary gate must restrict production canary to Wael only. |
| V3 session exchange | NOT QUALIFIED | Must not inherit V2 GET/POST ambiguity / slow main Apps Script dependency. |
| Task read-only p95 <= 2 s | NOT MEASURED | T1/T2 latency gate. |
| Session exchange p95 <= 3 s | NOT MEASURED | T1/T2 session gate. |
| Main Apps Script latency unaffected by T2 | NOT MEASURED | Required T2 acceptance gate. |

## Readiness decision

### T0

**COMPLETE / PASS.**

### T1

**NOT READY FOR DEPLOYMENT YET.**

The bridge contract is ready as a source skeleton, but the isolated runtime, preview fixture and V3-specific Worker adapter/binding are not provisioned/qualified.

### T2

**NOT READY.**

T2 cannot start until T1 passes. Production read-only Wael canary must remain disabled until the dedicated Tasks V3 upstream and session path are qualified.

## Exact next safe step

Branch-only implementation and CI qualification of a Tasks V3 Worker preview adapter contract, with all of the following properties:

1. dedicated upstream binding name `TASKS_V3_APPS_SCRIPT_URL`;
2. read-only operations only: health/status/flyPrint/pressCandidates;
3. explicit Wael-only preview/canary capability gate;
4. HMAC-signed assertion compatible with `TRENDOS_TASKS_V3_READONLY_1`;
5. bounded timeout and fail-closed response;
6. no fallback to main `APPS_SCRIPT_API_URL` or Operator Task V2;
7. no claim/complete routes;
8. no production deployment.

After branch-only adapter + tests PASS, the next real T1 boundary is owner-authenticated provisioning of a separate Apps Script project/deployment and preview fixture. That provisioning is not implied or authorized by this checkpoint.

## Safety / mutation ledger

- Production mutation: **NO**
- Apps Script Production deployment: **NO**
- Worker Production deployment: **NO**
- Business data mutation: **NO**
- `claimNext`: **ZERO**
- `completeTask`: **ZERO**
- `EDGE_SESSION_SECRET` change/rotation: **NO**
- `TRENDOS_OPERATOR_TASK_PROXY_SECRET` change/rotation: **NO**
- Gaber Material Control change: **NO**
- D1 business-write authority transfer: **NO**
- RP-08: **NO**
- Rollback required: **NO / N/A**

## Tool no-op note

During this review there were failed connector argument-binding attempts to create a temporary branch. They failed before GitHub mutation; no branch was created and no repository state changed from those attempts.
