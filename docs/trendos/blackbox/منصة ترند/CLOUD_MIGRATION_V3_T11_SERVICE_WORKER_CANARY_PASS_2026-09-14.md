# Cloud Migration V3 — T11 Service Worker Canary PASS — 2026-09-14

## Result
**PASS — LIVE SERVICE WORKER ROUTE PARITY 35/35; WORKER RETAINED; FRONTEND SERVICE CUTOVER STILL OFF**

## Production canary identifiers
- Workflow: `TrendOS T11 Service Worker Production Canary`
- Run ID: `34849337401`
- Run attempt: `2`
- Job ID: `104000507950`
- Candidate source commit: `6c6f797af4e0de672d9718dfd8cb2a4f347b1662`
- Deployed/retained Worker Version: `7964189a-2456-4f5f-bc22-532ae4971e8c`
- Previous stable Worker before this canary: `3b819fd3-e73d-46f8-9150-f73c282706ab`

## Gates before deploy
- Hard T11 runtime scope gate: PASS.
- Service runtime contracts: PASS.
- Owner-approved exclusion fingerprint count: 9.
- Pre-deploy Production baseline: PASS.
- Qualification Edge session: PASS on attempt 1.
  - login: HTTP 200 in `6298 ms`
  - Orders session: HTTP 200 in `5677 ms`
  - `authSource=apps-script-post`
- Wrangler dry-run: PASS.
- Dry-run emitted Service path/marker: PASS.

## Production deploy / route activation
- Temporary/narrow T11 Worker deploy command: PASS.
- Worker Version: `7964189a-2456-4f5f-bc22-532ae4971e8c`.
- Edge activation observations:
  - attempt 1: 404
  - attempt 2: 404
  - attempts 3, 4, 5: 401
- Route activation gate: PASS at attempt 5 after three consecutive 401 responses.
- Post-deploy Production baseline: PASS.

## Live authenticated Service route parity
Service D1 result:
- HTTP: `200`
- duration: `4295 ms`
- `success=true`
- `dataSource=d1-edge-orders-service-v1`
- total rows: `35`
- exclusion count: `9`
- freshness ok: `true`
- freshness mode: `verified-idle-source-unchanged`

Apps Script authoritative comparison:
- HTTP: `200`
- duration: `7241 ms`
- total rows: `35`

Exact parity result:
- candidate rows: `35`
- Apps Script rows: `35`
- missing: `0`
- extra: `0`
- statusCounts exact: `true`
- exclusionCount: `9`
- final marker: `T11_SERVICE_LIVE_ROUTE_PARITY=PASS`

## Safety boundary verification
- Unauthenticated Service route: 401 as required.
- Existing 02CR route unauthenticated boundary: 401 as required.
- Operator Task route unauthenticated boundary: 401 as required.
- Existing Print/Laser/Press route integrity check: PASS.
- Task route remains fail-closed.
- Ephemeral qualification tokens cleaned: YES.

## Production mutation
- Production mutation in this step: **YES — narrow T11 Service Worker canary only**.
- Worker deploy: **YES**.
- Worker Version retained after success: `7964189a-2456-4f5f-bc22-532ae4971e8c`.
- Automatic rollback: **NO — skipped because all qualification gates passed**.
- Apps Script deploy: **NO**.
- D1 migration: **NO**.
- D1 business-write authority move: **NO**.
- Sheets / Apps Script business-write authority change: **NO**.
- Frontend Service cutover: **NO**.
- Task production mutation: **NO**.
- `EDGE_SESSION_SECRET` changed: **NO**.
- `TRENDOS_OPERATOR_TASK_PROXY_SECRET` changed: **NO**.
- Gaber Material Control changed: **NO**.

## Current Production State
- Production Worker: `7964189a-2456-4f5f-bc22-532ae4971e8c` retained after successful T11 qualification.
- T6B Auth Shadow: retained.
- Print: D1-first + Apps Script fallback.
- Laser: D1-first + Apps Script fallback.
- Press: D1-first + Apps Script fallback.
- Service Worker route: qualified and live at Worker level.
- Service frontend: still Apps Script; no frontend cutover yet.
- `__DEBT__`: Apps Script.
- All business writes: Sheets / Apps Script authoritative.

## Next exact step
Inspect the current production frontend `main/config.js` and the prior Print/Laser/Press cutover pattern, then prepare the smallest Service-only frontend read cutover: add only `service` to the existing Edge Orders allowed-screen set while retaining global D1-first + Apps Script fallback semantics and keeping `__DEBT__` on Apps Script. Before changing `main`, verify the exact diff and any existing frontend qualification workflow. This is still inside T11 Service-read scope; do not touch write authority, Apps Script deployment, secrets, Tasks, Gaber Material Control, or RP-08.
