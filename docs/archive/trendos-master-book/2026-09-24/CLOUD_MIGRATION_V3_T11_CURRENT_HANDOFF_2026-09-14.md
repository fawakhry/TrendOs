# Cloud Migration V3 — T11 Current Handoff — 2026-09-14

## Purpose
This is the authoritative resume checkpoint for a new chat/session. Do not restart T6A/T6B or the completed Orders read cutovers. Read this file after `00_PROJECT_LOCATOR.md`, `00_INDEX.md`, and `01_CURRENT_STATE.md`.

## Repository / branch
- Repository: `fawakhry/TrendOs`
- Controlled migration branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`
- Current branch head at handoff: `7cf905aa5bc35ff320059975b5df0b7e186321f5`
- Production frontend branch: `main`
- Production frontend commit retaining qualified Print/Laser/Press reads: `44e0b01dd636ec81ef2a298b714a329cd3f828c9`

## Current production state
### Frontend Orders reads
`main/config.js` currently has:
- `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED = true`
- `MATBAGY_EDGE_ORDERS_CANARY_ONLY = false`
- `MATBAGY_EDGE_ORDERS_ALLOWED_SCREENS = ['print','laser','press']`

Therefore:
- Print: D1-first with Apps Script fallback — RETAINED
- Laser: D1-first with Apps Script fallback — RETAINED
- Press: D1-first with Apps Script fallback — RETAINED
- Service: still Apps Script — NOT CUT OVER
- `__DEBT__`: Apps Script
- all business writes: Sheets / Apps Script authoritative

Production frontend commits:
- Print global D1 read: `56e586a56c3b7dd91020a0eb074584c9444cd032`
- Laser D1 read: `b83f63a191568e188082aaecc42bd071ea630d91`
- Press D1 read: `44e0b01dd636ec81ef2a298b714a329cd3f828c9`

## Auth/session work already completed
### T6A
Production Worker session exchange was moved to the POST bridge for the exact session paths. This avoided the old GET verification path.

### T6B
D1 Auth Shadow V1 is retained in production.
- final successful run: `34768601492`
- retained stable Worker Version ID: `3b819fd3-e73d-46f8-9150-f73c282706ab`
- table: `cloud_auth_sessions_v1`
- migration: `0004_cloud_auth_shadow_v1.sql`
- `TRENDOS_CLOUD_AUTH_SHADOW_V1_ENABLED = true`
- TTL: `300 s`
- raw employee token in D1: NO
- HMAC-SHA256 fingerprint only
- measured T6B final latency: Apps Script miss `4105 ms`, D1 auth hit `129 ms`, Orders-session D1 hit `122 ms`

## Service contract discovery — COMPLETED
Do not repeat the earlier Service source/contract investigation.

Confirmed production Service contract:
- source semantics are based on `الأوردرات`, not `بنود الأوردرات`
- historical `واجهة خدمة العملاء` formula evidence: `FILTER('الأوردرات'!A2:S270, 'الأوردرات'!A2:A270<>"")`
- live Service rows were identity-mapped 35/35 without ambiguity
- field mapping:
  - `orderId/orderCode` <- رقم الأوردر
  - `lineId/customerPhone` <- رقم العميل
  - `customer` <- اسم الشات / المكتب
  - `department/assignedTo` <- القسم الرئيسي
  - `itemName` <- وصف مختصر
  - `qty` <- عدد البنود, with deployed default `|| 1`
  - `priority` <- الأولوية
  - `status` <- الحالة العامة
  - `ready` <- بنود جاهزة

Owner explicitly approved excluding the 9 extra `طلب جديد` orders from the Service Cloud candidate. Their raw IDs are not stored in code; only 9 SHA-256 fingerprints are retained in the candidate.

Exclusion derivation run:
- run `34834996275` — PASS
- exclusion count: exactly 9
- raw Order IDs exposed: NO
- customer values exposed: NO

## Service candidate — PARITY COMPLETE
Candidate runtime files on the migration branch:
- `cloudflare-d1/src/edge-orders-service-v1.mjs`
- minimal wiring in `cloudflare-d1/src/index_v2.js`

The Service candidate includes:
- D1 Orders projection for Service
- owner-approved 9 SHA-256 exclusions
- deployed `qty` default behavior
- Service freshness proof / fail-open behavior
- Apps Script fallback semantics
- no Task mutation code

Live candidate parity run:
- run `34835539259`
- result: PASS
- candidate rows: 35
- Apps Script rows: 35
- Apps Script total: 35
- missing: 0
- extra: 0
- exclusion count: 9
- statusCounts exact: YES
- raw Order IDs exposed: NO
- customer values exposed: NO
- production business mutation: NO
- Apps Script authoritative read latency in that run: `10073 ms`

Checkpoint commit for parity PASS: `87dc18c78e5306887a21fd6b1a1e4ca154383f46`

## Service Worker canary history
### Canary attempt 1
- run: `34835897267`
- scope/runtime/predeploy/dry-run/deploy/postdeploy baseline passed
- temporary Worker Version: `a7e581b8-3efe-48a6-ba57-baf571243f16`
- qualification failed before Service parity because `/v1/edge/orders/session` returned HTTP 502 during an unstable Apps Script/session period
- automatic rollback succeeded
- restored Worker: `3b819fd3-e73d-46f8-9150-f73c282706ab`

### Direct verify diagnostic during instability
- run: `34836406769`
- login: HTTP 200 in `5278 ms`
- direct POST `verifyEmployeeSession`: HTTP 404 in `35035 ms`
- no business mutation

### Apps Script health recovery evidence
Unstable health probe:
- run `34845111466`
- attempts: 404/36959 ms, then 200 HTML/44295 ms unsuccessful, then healthy JSON 200/10494 ms

Stability gate:
- run `34845398493` — PASS
- two consecutive healthy JSON pings: `12093 ms` and `4037 ms`

### Canary attempt 2 after health gate
Recorded checkpoint commit: `870aad1bfbfaa8480e3f4b352e4a8ee643b456e4`
- same canary run family, rerun job `103980601371`
- predeploy login: `7154 ms`
- Orders session: HTTP 200 in `5796 ms`, `authSource=apps-script-post`
- temporary Worker Version: `a0a3954a-2219-4ff0-bd34-33f1c50ffe33`
- Service route-level assertions passed before authoritative comparison
- qualification harness made a redundant second login after deploy; it hit the ~30s abort boundary
- automatic rollback succeeded to `3b819fd3-e73d-46f8-9150-f73c282706ab`
- conclusion: harness blocker, not evidence of Service contract mismatch

Harness was then changed to reuse the predeploy employee token for authoritative parity.
- fix commit: `7cf905aa5bc35ff320059975b5df0b7e186321f5`

### Canary attempt 3 — LATEST EXECUTED PRODUCTION CANARY
- workflow: `TrendOS T11 Service Worker Production Canary`
- run: `34845916070`
- job: `103981697653`
- source head: `7cf905aa5bc35ff320059975b5df0b7e186321f5`

Predeploy/session evidence:
- scope gate: PASS
- runtime contracts: PASS
- predeploy baseline: PASS
- session attempt 1: AbortError at 30s
- session attempt 2: login HTTP 200 in `5792 ms`; `/v1/edge/orders/session` HTTP 200 in `3621 ms`; `authSource=apps-script-post`
- Edge session acquisition: PASS
- dry-run: PASS

Temporary production deploy:
- temporary Worker Version: `606a23aa-a755-46ca-929b-97a4bea1d4d6`
- postdeploy production baseline: PASS

Latest failure point:
- authenticated request to `/v1/edge/orders/service/page?...` returned HTTP `404` in `154 ms`
- `success=false`
- no Service dataSource marker
- no rows returned
- therefore the deployed candidate route was not reachable at the expected production path in this canary

Automatic rollback:
- SUCCESS
- restored stable Worker Version ID: `3b819fd3-e73d-46f8-9150-f73c282706ab`
- ephemeral tokens cleaned: YES

## Current interpretation / exact next technical step
Do NOT redo Service parity. It already passed 35/35.
Do NOT change frontend Service routing yet.
Do NOT deploy broad migration branch blindly.

The next step is a READ-ONLY routing inspection of the actual production Worker entrypoint because:
- `wrangler.toml` main is `production-shadow/index.js`
- the Service candidate was wired in `src/index_v2.js`
- a deployed candidate version still returned a fast 404 for `/v1/edge/orders/service/page`

The next chat should inspect the import/dispatch chain starting from:
1. `cloudflare-d1/production-shadow/index.js`
2. any module/handler it delegates to
3. `cloudflare-d1/src/index_v2.js`
4. `cloudflare-d1/src/edge-orders-service-v1.mjs`

Goal: identify exactly why the Service route is absent at runtime and prepare the smallest candidate wiring change. If production entrypoint wiring must change, expand the T11 scope gate only for that exact file/change, keep automatic rollback, and re-run the same narrow canary. Frontend Service cutover occurs only after Worker route live parity PASS.

## Hard safety boundaries
- no Apps Script production deployment without separate owner approval
- no change/rotation to `EDGE_SESSION_SECRET`
- no change/rotation to `TRENDOS_OPERATOR_TASK_PROXY_SECRET`
- no Gaber Material Control rollout/change
- no Task production mutation (`claimNext`, `completeTask`, claim-next, complete)
- no D1 business-write authority move
- no Sheets business-write authority change
- no RP-08
- no frontend Service cutover until Service Worker canary PASS
- keep Print/Laser/Press D1-first production reads intact
- keep `__DEBT__` on Apps Script
- keep fallback to Apps Script on read failure/staleness
- every completed step must be recorded in blackbox before proceeding to the next step

## Resume rule
On a new chat, read GitHub/blackbox first and continue from the routing inspection above. Do not rely on memory alone and do not repeat already completed T6A/T6B/Print/Laser/Press/Service contract/parity work.
