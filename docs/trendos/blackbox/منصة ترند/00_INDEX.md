# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**.

## Startup order
كل شات/جلسة جديدة تقرأ بالترتيب:
1. `00_PROJECT_LOCATOR.md`
2. `00_INDEX.md`
3. `01_CURRENT_STATE.md`
4. `CLOUD_MIGRATION_V3_T11_CURRENT_HANDOFF_2026-09-14.md`

Canonical production identity:
- Spreadsheet: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
- Bound Apps Script Project ID: `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`
- Repository: `fawakhry/TrendOs`
- Controlled migration branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`

Do not substitute BACKUP/STAGING workbooks. The workbook tab `سكريبت Apps Script` is not live Head authority.

## CURRENT CHECKPOINT — T11 SERVICE WORKER ROUTING BLOCKER — 2026-09-14
Status:

**T6B AUTH SHADOW RETAINED / PRINT+LASER+PRESS D1-FIRST LIVE / SERVICE PARITY PASS 35/35 / SERVICE WORKER ROUTE NOT RETAINED / WRITES STILL APPS SCRIPT**

Newest authoritative record:

`CLOUD_MIGRATION_V3_T11_CURRENT_HANDOFF_2026-09-14.md`

Checkpoint commit:
`12ccf880865ea3ee80f73f424931d831900239d7`

Current production state:
- stable Worker Version: `3b819fd3-e73d-46f8-9150-f73c282706ab`
- D1 Auth Shadow V1: enabled/retained, TTL 300s
- Print: D1-first + Apps Script fallback
- Laser: D1-first + Apps Script fallback
- Press: D1-first + Apps Script fallback
- Service: Apps Script only
- Debt: Apps Script
- all business writes: Sheets / Apps Script authoritative

T11 Service contract/parity already completed:
- 9 owner-approved exclusions represented only by SHA-256 fingerprints
- candidate parity run `34835539259`: PASS
- 35/35 rows exact
- missing 0 / extra 0
- statusCounts exact

Latest production canary:
- run `34845916070`
- job `103981697653`
- predeploy session PASS
- temporary Worker Version `606a23aa-a755-46ca-929b-97a4bea1d4d6`
- postdeploy baseline PASS
- `/v1/edge/orders/service/page` returned HTTP 404 in 154ms
- automatic rollback PASS
- restored stable Worker `3b819fd3-e73d-46f8-9150-f73c282706ab`

Immediate next stage:

**READ-ONLY inspect the real production Worker entrypoint/dispatch chain starting at `cloudflare-d1/production-shadow/index.js`. Do not redo Service parity. Determine the smallest runtime wiring change needed to expose the already-qualified Service route.**

No frontend Service cutover until the live Worker route canary passes.

## Completed migration milestones
### T6A
POST session bridge qualified for exact session endpoints.

### T6B
D1 Auth Shadow retained in production.
- final successful run `34768601492`
- Worker `3b819fd3-e73d-46f8-9150-f73c282706ab`
- Apps Script miss `4105 ms`
- D1 auth hit `129 ms`
- Orders-session D1 hit `122 ms`

### Production Orders reads
- Print global cutover commit `56e586a56c3b7dd91020a0eb074584c9444cd032`
- Laser cutover commit `b83f63a191568e188082aaecc42bd071ea630d91`
- Press cutover/current production frontend commit `44e0b01dd636ec81ef2a298b714a329cd3f828c9`

## RP-07 — CLOSED / PASS
Authoritative closure record:
`TRENDOS_BLACKBOX_2026-09-13_RP07_FINAL_HEALTH_PASS_CLOSED.md`

- `OPEN_CORE_P0_BLOCKERS = 0`
- all eight final P0 health metrics PASS

## Operator Task track
Status: **ISOLATED DESIGN/PREP ONLY — PRODUCTION TASK MUTATIONS OFF**

Old Operator Task V2 must not be reintroduced into the main Apps Script hot path.

Owner-locked business roadmap:
`Operator Task -> Department Invoice + Material Shadow/Parity (Gaber LASER + Wael PRINT) -> Laser + Print Accounting Control -> RP-08`

## RP-06
Status: **CLOSED — RECOVERY COMPLETE**
Final record:
`TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_COMPLETE.md`

## Shared safety invariants
- Sheets / Apps Script authoritative for business writes until explicit owner approval.
- keep Print/Laser/Press D1-first reads intact.
- Service stays Apps Script until Worker route live parity PASS.
- `__DEBT__` remains Apps Script.
- no Apps Script Production deploy without separate approval.
- no `EDGE_SESSION_SECRET` rotation/change.
- no `TRENDOS_OPERATOR_TASK_PROXY_SECRET` rotation/change.
- no Gaber Material Control rollout/change.
- no production Task mutations.
- no D1 business-write authority move.
- no RP-08.
- no Integrity flag mutation without a separate approved boundary.
- every completed step must be recorded in blackbox before proceeding.
