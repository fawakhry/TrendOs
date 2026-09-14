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

### Next exact step
Create/run a branch-only, mutation-free Wrangler bundle diagnostic that uses the same `cloudflare-d1/wrangler.toml` and Wrangler `4.33.2`, then assert that the emitted bundle contains the exact Service path and Service handler wiring. Do not deploy Production in that diagnostic. Only after bundle proof should the T11 Production canary be changed or rerun.
