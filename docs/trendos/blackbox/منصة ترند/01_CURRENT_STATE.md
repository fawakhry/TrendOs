# منصة ترند — الحالة التنفيذية الحالية

Date: 2026-09-14

## Canonical project identity
- Production Google Sheet: `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
- Bound Apps Script Project ID: `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`
- Repository: `fawakhry/TrendOs`
- Controlled migration branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`
- Production frontend: `https://fawakhry.github.io/TrendOs`
- Production Worker: `https://trendos-d1-api.trendmall-contact.workers.dev`

Every new session must read `00_PROJECT_LOCATOR.md`, `00_INDEX.md`, this file, then the newest handoff below.

## CURRENT AUTHORITATIVE HANDOFF
Newest authoritative record:

`CLOUD_MIGRATION_V3_T11_CURRENT_HANDOFF_2026-09-14.md`

Checkpoint commit:
`12ccf880865ea3ee80f73f424931d831900239d7`

## Current production runtime
### Worker/Auth
- retained stable Worker Version ID: `3b819fd3-e73d-46f8-9150-f73c282706ab`
- T6B D1 Auth Shadow: ENABLED / RETAINED
- `cloud_auth_sessions_v1`: retained
- Auth Shadow TTL: `300 s`
- raw employee token stored in D1: NO
- business-write authority: Sheets / Apps Script

### Frontend Orders reads
Production `main/config.js` currently has Edge Orders read enabled globally only for:
- `print`
- `laser`
- `press`

Therefore:
- Print: D1-first + Apps Script fallback — LIVE
- Laser: D1-first + Apps Script fallback — LIVE
- Press: D1-first + Apps Script fallback — LIVE
- Service: Apps Script — NOT CUT OVER
- `__DEBT__`: Apps Script
- writes: Apps Script / Sheets

Production frontend commits:
- Print: `56e586a56c3b7dd91020a0eb074584c9444cd032`
- Laser: `b83f63a191568e188082aaecc42bd071ea630d91`
- Press/current main state: `44e0b01dd636ec81ef2a298b714a329cd3f828c9`

## T11 Service read — current status
Status: **SERVICE CONTRACT/PARITY PASS; PRODUCTION ROUTE NOT RETAINED; FRONTEND SERVICE CUTOVER OFF**

Completed and must not be repeated:
- source/contract discovery
- 35/35 Service identity mapping
- owner-approved exclusion of 9 extra `طلب جديد` orders
- exclusions stored only as SHA-256 fingerprints
- `qty` deployed default behavior matched
- Service candidate freshness/fallback semantics built
- live candidate parity PASS 35/35

Final candidate parity:
- run `34835539259` — PASS
- candidate rows `35`
- Apps Script rows `35`
- missing `0`
- extra `0`
- statusCounts exact YES
- exclusions `9`

Candidate runtime files:
- `cloudflare-d1/src/edge-orders-service-v1.mjs`
- minimal candidate wiring in `cloudflare-d1/src/index_v2.js`

Latest candidate logic head before handoff docs:
`7cf905aa5bc35ff320059975b5df0b7e186321f5`

## Latest production canary — T11 attempt 3
- workflow: `TrendOS T11 Service Worker Production Canary`
- run `34845916070`
- job `103981697653`
- scope gate PASS
- runtime contracts PASS
- predeploy baseline PASS
- predeploy Edge session PASS on attempt 2:
  - login `5792 ms`
  - Orders session `3621 ms`
  - `authSource=apps-script-post`
- dry-run PASS
- temporary Worker Version `606a23aa-a755-46ca-929b-97a4bea1d4d6`
- postdeploy baseline PASS
- Service route request returned HTTP `404` in `154 ms`
- automatic rollback SUCCESS
- restored Worker Version `3b819fd3-e73d-46f8-9150-f73c282706ab`
- frontend Service remained OFF

## Immediate next controlled stage
Status: **READ-ONLY PRODUCTION ENTRYPOINT ROUTING INSPECTION**

Do not repeat Service parity. The candidate already matched 35/35.

Inspect the actual production Worker dispatch chain beginning at:
1. `cloudflare-d1/production-shadow/index.js`
2. modules/handlers delegated by that entrypoint
3. `cloudflare-d1/src/index_v2.js`
4. `cloudflare-d1/src/edge-orders-service-v1.mjs`

Reason: `wrangler.toml` uses `production-shadow/index.js` as main, while the candidate wiring was added in `src/index_v2.js`, and the deployed candidate returned a fast 404 for the expected Service route.

Goal: identify the exact missing runtime wiring and prepare the smallest possible candidate patch. Do not broaden scope. If an entrypoint file must change, allow only that exact change in the T11 scope gate and retain automatic rollback. Only after live Service route parity PASS may frontend Service be added to the allowed D1 screens.

## Apps Script stability context
Apps Script had intermittent latency/404 behavior during T11 qualification.

Direct verify diagnostic:
- run `34836406769`
- login `5278 ms`
- POST `verifyEmployeeSession` -> HTTP 404 in `35035 ms`

Later health recovery/stability evidence:
- unstable recovery run `34845111466`
- stable gate run `34845398493` — PASS
- two consecutive healthy JSON pings: `12093 ms`, `4037 ms`

This is context only; do not restart session migration work.

## RP-07
Status: CLOSED / PASS.
- `OPEN_CORE_P0_BLOCKERS = 0`
- final health record: `TRENDOS_BLACKBOX_2026-09-13_RP07_FINAL_HEALTH_PASS_CLOSED.md`

## Operator Task track
Status: isolated design/prep only; production Task mutations remain OFF.
- no production `claimNext`
- no production `completeTask`
- no Operator Task D1 write authority
- Gaber Material Control separate/OFF

## RP-06
Status: CLOSED / RECOVERY COMPLETE.
Final record: `TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_COMPLETE.md`

## Hard safety invariants
- Sheets / Apps Script remain authoritative for business writes until explicit owner approval.
- Print/Laser/Press D1-first reads must not be regressed.
- Service remains Apps Script until its Worker route live canary passes.
- `__DEBT__` remains Apps Script.
- no Apps Script Production deploy without separate approval.
- no `EDGE_SESSION_SECRET` change/rotation.
- no `TRENDOS_OPERATOR_TASK_PROXY_SECRET` change/rotation.
- no Gaber Material rollout/change.
- no Task production mutation.
- no D1 business-write authority move.
- no RP-08.
- no Integrity flag change without a separate approved boundary.
- every completed step must be recorded in blackbox before starting the next step.
