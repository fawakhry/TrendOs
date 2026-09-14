# Cloud Migration V3 — T11 Freshness Runtime Probe — 2026-09-14

## Step 6 — Stable Production 02CR freshness runtime diagnostics
Result: **INCONCLUSIVE / DIAGNOSTIC FAILURES ONLY**

### Purpose
Determine whether the retained stable Production Print/02CR route currently serves D1 from write-age-fresh mirror metadata, uses idle-heartbeat logical freshness, or fails closed to Apps Script. No Worker deploy, Apps Script deploy, write, secret change, or Task mutation was allowed.

### Probe A — stable 02CR route probe
- Workflow: `TrendOS T11 Stable 02CR Freshness Route Probe`
- Run ID: `34850875260`
- Job ID: `103998211240`
- Commit SHA: `24d4cf70b083484d06db3a8f9bb2470caf2b8beb`
- Result: **FAIL before the 02CR read was issued**.
- Login: HTTP 200 in `27683 ms`, success=true.
- Edge Orders session exchange: HTTP `502` in `15241 ms`, success=false.
- Therefore no authenticated stable 02CR freshness result was obtained from this probe.

### Probe B — freshness runtime probe with retrying session acquisition
- Workflow: `TrendOS T11 Freshness Runtime Probe`
- Run ID: `34850882017`
- Job ID: `103998226814`
- Commit SHA: `332cc7db04e7735a4dd239ec32b55281051e762d`
- Stable Production baseline: PASS.
- Edge session acquisition: PASS on attempt 1.
  - login HTTP 200 in `13561 ms`
  - Orders session exchange HTTP 200 in `4291 ms`
  - `authSource=apps-script-post`
- The probe then failed locally before issuing the 02CR request because Node 22 rejected a diagnostic script containing both CommonJS `require()` and top-level `await`:
  - `ERR_AMBIGUOUS_MODULE_SYNTAX`
- Ephemeral Edge token cleanup: PASS.

### Interpretation
- No new evidence yet establishes the current stable 02CR freshness path because neither probe completed the authenticated 02CR request.
- Probe A re-confirms intermittent Apps Script/session instability, but it does not change the T11 technical target.
- Probe B proves the read-only session can still succeed; its failure is only a branch-side diagnostic-script defect and is safe to correct without Production mutation.
- Existing code inspection remains unchanged: Service depends on freshness of the `الأوردرات` mirror; 02CR can pass directly when its Lines/Enrichment mirrors are write-age fresh without invoking the idle heartbeat. Runtime evidence is still required before deciding whether the Service issue is specific to the Orders mirror or common to all Orders reads.

### Production mutation
- Production mutation in this step: **NO**.
- Worker deploy: **NO**.
- Worker Version created: **NO**.
- Apps Script deploy: **NO**.
- Business writes: **NO**.
- D1 business-write authority change: **NO**.
- Sheets/Apps Script write authority change: **NO**.
- Task mutation: **NO**.
- `EDGE_SESSION_SECRET` changed: **NO**.
- `TRENDOS_OPERATOR_TASK_PROXY_SECRET` changed: **NO**.
- Gaber Material Control changed: **NO**.
- Rollback required: **NO**.

### Current Production State
Unchanged:
- stable Worker Version: `3b819fd3-e73d-46f8-9150-f73c282706ab` at 100% traffic.
- Print/Laser/Press: D1-first + Apps Script fallback retained.
- Service: Apps Script only.
- `__DEBT__`: Apps Script.
- all business writes: Sheets / Apps Script authoritative.
- frontend Service cutover: NO.

### Next exact step
Correct only the branch-side diagnostic script in `.github/workflows/cloud-migration-v3-t11-freshness-runtime-probe.yml` so Node 22 can execute the authenticated 02CR probe, then rerun it read-only. Do not deploy a Worker. Do not modify Apps Script. Record the resulting HTTP/code/dataSource/logicalFreshness metadata before any further action.
