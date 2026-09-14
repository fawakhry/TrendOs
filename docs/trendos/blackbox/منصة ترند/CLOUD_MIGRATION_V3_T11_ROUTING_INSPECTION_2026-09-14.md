# Cloud Migration V3 — T11 Production Routing Inspection — 2026-09-14

## Step 1 — Resume/startup verification
Result: **PASS**

### What was verified
- Read startup authority in required order:
  1. `00_PROJECT_LOCATOR.md`
  2. `00_INDEX.md`
  3. `01_CURRENT_STATE.md`
  4. `CLOUD_MIGRATION_V3_T11_CURRENT_HANDOFF_2026-09-14.md`
- Controlled branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`.
- Branch head observed before this checkpoint: `382b66aa1fd9d1101a3b50d8de890cb3ae5464c6`.
- Commits newer than the authoritative T11 handoff are blackbox/current-state documentation updates only.
- Latest executed T11 production Worker canary remains:
  - Run ID: `34845916070`
  - Job ID: `103981697653`
  - source head: `7cf905aa5bc35ff320059975b5df0b7e186321f5`
  - conclusion: FAIL at authenticated Service route HTTP 404
  - automatic rollback: SUCCESS
  - temporary Worker Version: `606a23aa-a755-46ca-929b-97a4bea1d4d6`
  - restored stable Worker Version: `3b819fd3-e73d-46f8-9150-f73c282706ab`

### Production mutation
- Production mutation in this step: **NO**.
- Worker deploy: **NO**.
- Apps Script deploy: **NO**.
- Business writes: **NO**.
- Task mutation: **NO**.
- Secret changes: **NO**.

### Current Production State
- Stable Worker: `3b819fd3-e73d-46f8-9150-f73c282706ab`.
- Print/Laser/Press: D1-first + Apps Script fallback retained.
- Service: Apps Script only.
- `__DEBT__`: Apps Script.
- Sheets / Apps Script remain authoritative for all business writes.

## Step 2 — READ-ONLY source dispatch inspection
Result: **PASS — Service route is wired in source; no source precedence blocker found**

### Actual production dispatcher
- `cloudflare-d1/wrangler.toml` sets `main = "production-shadow/index.js"`.
- `cloudflare-d1/production-shadow/index.js` imports `../src/index_v2.js` as `core`.
- The production entrypoint handles only two exact/specific pre-core families first:
  - production reconcile qualification prefix
  - exact production shadow observer path
- All other requests are delegated with `return core.fetch(request, env, ctx)`.

### Service route source wiring
- `cloudflare-d1/src/index_v2.js` imports:
  - `handleEdgeOrdersServiceRequest`
  - `isEdgeOrdersServicePath`
  from `./edge-orders-service-v1.mjs`.
- The Service predicate is checked before the 02CR Orders route, the generic Orders route, and before falling through to `base.fetch(...)`.
- `cloudflare-d1/src/edge-orders-service-v1.mjs` defines the exact path:
  - `/v1/edge/orders/service/page`
- `isEdgeOrdersServicePath(path)` normalizes trailing slash only and performs an exact equality comparison.
- Neither `isProductionShadowPath()` nor `isProductionReconcileQualificationPath()` matches the Service path.

### Interpretation
The repository source at the controlled branch contains the expected Service runtime wiring and there is no visible route-precedence conflict that explains the fast HTTP 404. Therefore the next suspected boundary is the exact Wrangler deploy bundle / deployed artifact rather than missing source routing.

### Production mutation
- Production mutation in this step: **NO**.
- Worker deploy: **NO**.
- Apps Script deploy: **NO**.
- Business writes: **NO**.
- Task mutation: **NO**.
- Secret changes: **NO**.
- Rollback required: **NO**.

### Current Production State
Unchanged:
- stable Worker: `3b819fd3-e73d-46f8-9150-f73c282706ab`
- Print/Laser/Press D1-first retained
- Service Apps Script only
- `__DEBT__` Apps Script
- Sheets/Apps Script business-write authority retained

## Step 3 — Branch-only production entrypoint + Wrangler bundle diagnostic
Result: **PASS**

### Diagnostic workflow
- Workflow: `TrendOS T11 Routing Bundle Diagnostic`
- Run ID: `34849075212`
- Job ID: `103992137281`
- Commit SHA: `6b36abb453f0f5e6b98973f52a5cccd3fcc17b23`
- Wrangler: `4.33.2`

### Assertions passed
- Production source dispatch chain: PASS.
- Direct local execution of `production-shadow/index.js` against `/v1/edge/orders/service/page?...` reached the Service handler and returned unauthenticated HTTP `401` as expected, proving the path did not fall through to a 404 locally.
- Exact Wrangler production bundle dry-run: PASS.
- Emitted bundle contains exact Service path `/v1/edge/orders/service/page`: PASS.
- Emitted bundle contains Service handler marker `d1-edge-orders-service-v1`: PASS.

### Interpretation
No wiring patch is currently required in `production-shadow/index.js`, `src/index_v2.js`, or `src/edge-orders-service-v1.mjs`. Source dispatch and emitted Wrangler bundle both contain the qualified Service route. The attempt-3 HTTP 404 therefore occurred after bundling, at the production deployment activation/edge-verification boundary (for example serving the pre-canary stable version during verification), not because the candidate source lacked the route.

### Production mutation
- Production mutation in this step: **NO**.
- Worker deploy: **NO**.
- Apps Script deploy: **NO**.
- Business writes: **NO**.
- Task mutation: **NO**.
- Secret changes: **NO**.
- Rollback required: **NO**.

### Current Production State
Unchanged:
- stable Worker: `3b819fd3-e73d-46f8-9150-f73c282706ab`
- Print/Laser/Press D1-first retained
- Service Apps Script only
- `__DEBT__` Apps Script
- Sheets/Apps Script business-write authority retained

### Next exact step
Harden the existing narrow T11 production canary so it proves the newly deployed Worker version is actually serving the Service route before authoritative parity. Keep automatic rollback. Do not add a runtime wiring change. Add only deployment-activation verification/retry around the Service route and keep the same T11 runtime scope. Then execute the same narrow Production canary; Service frontend remains OFF until live route parity PASS.
