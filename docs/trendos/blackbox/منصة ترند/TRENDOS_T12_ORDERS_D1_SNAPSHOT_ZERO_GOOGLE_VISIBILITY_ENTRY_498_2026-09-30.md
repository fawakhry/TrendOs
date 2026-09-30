# TrendOS T12 — Entry498 — Orders D1 snapshot Zero-Google visibility — 2026-09-30

## Scope
Repo-only repair after Entry497 production install. No Cloudflare deploy by ChatGPT, no Wrangler, no D1 migration, no Google mutation, no Secrets/Variables/Bindings mutation.

## Production symptom after Entry497
Employee Orders session no longer failed on the second Apps Script session verification. The next blocker was:
```
GET /v1/edge/orders/02cr/page -> 503
Orders lines mirror is stale and the source-unchanged proof failed closed.
```

## Root cause
The 02CR visibility guard still treated the Google/Apps Script low-usage heartbeat as mandatory whenever the D1 `بنود الأوردرات` snapshot was older than the short wall-clock freshness budget.

That design conflicts with the Zero-Google cutover:
- the qualified D1 snapshot is the historical/base dataset;
- new Cloud-native Orders/Lines are merged by the T12 native overlay;
- requiring a Google heartbeat merely to prove the old Google source had not changed reintroduced a runtime dependency on Google before Orders could render.

## Fix
Commit:
`09b630b12e8d2abfbfe003c3701a90444a1a30a8`

The 02CR read gate now:
- still requires structural qualification for Lines, Customers and debt restrictions;
- still rejects missing/broken metadata or row-count parity;
- treats wall-clock age of a structurally qualified Lines snapshot as advisory;
- does not call Apps Script/Google heartbeat for operational Orders visibility;
- exposes `baseSnapshotFreshness` with:
  - `authority=d1-qualified-snapshot+t12-native-overlay`
  - `googleHeartbeatRequired=false`
  - `degraded=true` when the base snapshot is older than the former short freshness budget;
- adds warning `02CR_LINES_STALE_SNAPSHOT_ADVISORY`;
- preserves Entry496 degraded customer/restriction enrichment behavior;
- keeps the `__DEBT__` lane outside this operational Cloud read path.

## Tests
Updated:
- `tests/cloudflare_edge_orders_02cr_idle_freshness_02cu.test.mjs`
- `tests/cloudflare_index_v2_02cr_route.test.mjs`

Commits:
- `2f8527e317f6ff24700d3864ba8a52a32192de49`
- `8f1dc09dd2e9f61434b645659bdd2604e02f2d3e`

Qualification:
- Orders 02CR visibility regression run `36747545768` = SUCCESS
- A61 browser Cloud transport regression run `36747545745` = SUCCESS

## State
```ini
ENTRY498_SOURCE_QUALIFIED=YES
ENTRY498_PRODUCTION_DEPLOYED=NO
ORDERS_02CR_GOOGLE_HEARTBEAT_REQUIRED=NO
ORDERS_LINES_STRUCTURAL_QUALIFICATION=REQUIRED
ORDERS_LINES_WALL_CLOCK_STALENESS=ADVISORY
ORDERS_READ_AUTHORITY=D1_QUALIFIED_SNAPSHOT_PLUS_T12_NATIVE_OVERLAY
BROWSER_DIRECT_GOOGLE=NO
D1_MUTATION=NO
GOOGLE_MUTATION=NO
```

## Manual production sequence
1. Publish the qualified API Worker to `trendos-d1-api`, preserving all existing Bindings, Variables and Secrets.
2. No frontend deploy is required.
3. Ensure the new Worker version receives 100% traffic.
4. Hard-refresh TrendOS.
5. Sign in once if needed.
6. Open Customer Service.
7. Confirm `/v1/edge/orders/02cr/page` returns 200 and Orders cards render.
8. Console must not show `script.google.com` or the old source-unchanged heartbeat error.

## Important remaining Zero-Google work
Legacy historical line mutation paths are a separate migration concern. Entry498 removes Google only from the read-visibility proof; it does not claim that all legacy operational write actions are D1-native.

After Production verification, the next agreed engineering task is duplicate-order creation protection.
