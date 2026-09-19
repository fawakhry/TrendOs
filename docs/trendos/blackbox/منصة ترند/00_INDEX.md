# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform**.

## Startup order
كل شات/جلسة جديدة تقرأ بالترتيب:
1. `00_PROJECT_LOCATOR.md`
2. `00_INDEX.md`
3. `01_CURRENT_STATE.md`
4. `CLOUD_MIGRATION_V3_T11_COMPLETE_HANDOFF_2026-09-14.md`

Canonical production identity:
- Spreadsheet: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
- Bound Apps Script Project ID: `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`
- Repository: `fawakhry/TrendOs`
- Controlled migration branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`

Do not substitute BACKUP/STAGING workbooks. The workbook tab `سكريبت Apps Script` is not live Head authority.

## CURRENT CHECKPOINT — T11 SERVICE READ MIGRATION COMPLETE / RETAINED — 2026-09-14
Status:

**T6B AUTH SHADOW RETAINED / PRINT+LASER+PRESS+SERVICE D1-FIRST LIVE WITH APPS SCRIPT FALLBACK / `__DEBT__` APPS SCRIPT / WRITES STILL SHEETS+APPS SCRIPT AUTHORITATIVE**

Newest authoritative record:

`CLOUD_MIGRATION_V3_T11_COMPLETE_HANDOFF_2026-09-14.md`

Handoff creation commit:
`b9cf23860a25a1af07a2dc9911282165be85557c`

Current production state:
- retained Production Worker Version: `7964189a-2456-4f5f-bc22-532ae4971e8c`
- D1 Auth Shadow V1: enabled/retained, TTL 300s
- Production frontend `main`: `02ce4a11fdd822e75906d4fadc4bc0dca3dea9a9`
- Print: D1-first + Apps Script fallback
- Laser: D1-first + Apps Script fallback
- Press: D1-first + Apps Script fallback
- Service: D1-first + Apps Script fallback
- `__DEBT__`: Apps Script
- all business writes: Sheets / Apps Script authoritative

## T11 — COMPLETE / DO NOT REPEAT
Completed and retained:
- Service source/contract discovery
- 35/35 Service identity mapping
- 9 owner-approved exclusions stored only as SHA-256 fingerprints
- Service parity: 35/35, missing 0, extra 0, statusCounts exact
- production Worker route qualification
- production frontend Service cutover
- Apps Script fallback and `__DEBT__` isolation verification
- GitHub Pages propagation verification
- pre/post write-authority boundary verification

Final Worker qualification:
- workflow: `TrendOS T11 Service Worker Production Canary`
- run `34849337401`, attempt `2`
- job `104000507950`
- retained Worker `7964189a-2456-4f5f-bc22-532ae4971e8c`
- Service HTTP 200
- `dataSource=d1-edge-orders-service-v1`
- freshness `verified-idle-source-unchanged`
- rows 35 / authoritative rows 35
- missing 0 / extra 0
- exclusions 9

Final frontend qualification/cutover:
- candidate run `34852602434`, job `104004039864`: PASS
- production cutover run `34852840558`, job `104004832316`: PASS
- Production main commit `02ce4a11fdd822e75906d4fadc4bc0dca3dea9a9`
- only `config.js` and `trendos-edge-orders-read-v1.js` changed
- GitHub Pages propagation: PASS
- automatic rollback: skipped because all gates passed

## Completed migration milestones
### T6A
POST session bridge qualified for exact session endpoints.

### T6B
D1 Auth Shadow retained in production.
- final successful run `34768601492`
- Auth Shadow TTL: 300s
- raw employee token stored in D1: NO

### Production Orders reads
- Print global cutover commit `56e586a56c3b7dd91020a0eb074584c9444cd032`
- Laser cutover commit `b83f63a191568e188082aaecc42bd071ea630d91`
- Press cutover commit `44e0b01dd636ec81ef2a298b714a329cd3f828c9`
- Service/current production frontend commit `02ce4a11fdd822e75906d4fadc4bc0dca3dea9a9`

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

The next production-changing stage is outside T11 and requires explicit owner selection/approval before execution.

## T12 — ORDER CREATE GITHUB PREP PASS — 2026-09-19
Current T12 handoff: `CLOUD_MIGRATION_V3_T12_CURRENT_HANDOFF_2026-09-19.md`
Status: **GITHUB-ONLY PREP PASS / PRODUCTION SOURCE EXACTNESS PENDING / NO CUTOVER AUTHORIZED**

Authoritative T12 prep record:
`CLOUD_MIGRATION_V3_T12_ORDER_CREATE_GITHUB_PREP_PASS_2026-09-19.md`

- isolated branch: `cloud-migration-v3-t12-order-create-ci-20260919`
- isolated CI run `35449528052`: SUCCESS
- no Production deployment or data/config mutation
- no `main` change
- no Worker route wiring
- no D1/Sheets/Apps Script write
- live Production UI shows Apps Script Version 155, but byte-exact source parity is still PENDING
- T12 production create cutover remains blocked until the twelve evidence gates pass and the owner explicitly authorizes a later production checkpoint

## RP-06
Status: **CLOSED — RECOVERY COMPLETE**
Final record: `TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_COMPLETE.md`

## Shared safety invariants
- Sheets / Apps Script remain authoritative for business writes until explicit owner approval.
- preserve Print/Laser/Press/Service D1-first reads and Apps Script fallback.
- `__DEBT__` remains Apps Script.
- no Apps Script Production deploy without separate approval.
- no `EDGE_SESSION_SECRET` rotation/change.
- no `TRENDOS_OPERATOR_TASK_PROXY_SECRET` rotation/change.
- no Gaber Material Control rollout/change.
- no production Task mutations (`claimNext`, `completeTask`, claim-next, complete).
- no D1 business-write authority move.
- no RP-08.
- no Integrity flag mutation without a separate approved boundary.
- every completed step must be recorded in blackbox before proceeding.
