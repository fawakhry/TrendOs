# TrendOS T12 — Laser + Customer Service qualified 02CR routing

Date: 2026-09-28 Cairo
Entry: 453
Repository: `fawakhry/TrendOs`

## Scope
Owner explicitly prioritized Laser and Customer Service before Delivery Gate/accounting work.

No Cloudflare Worker deploy, D1 mutation, Apps Script mutation, or Google Sheets mutation was performed in this entry.

## Finding
The existing qualified `/v1/edge/orders/02cr/page` route already:
- reads line-level Orders data matching Apps Script `getRows_`;
- supports `screen=laser` and `screen=service`;
- reads T12 Cloud-native rows through `readT12CloudNativeOverlay(env, screen)`;
- merges Cloud-native rows before filters, counters, dashboard and pagination;
- returns Cloud-native line identity so status/notes writes can route to T12 runtime.

The frontend was unnecessarily sending Customer Service to the older `/v1/edge/orders/service/page` route, which reads the Orders mirror and does not include the T12 overlay.

## Frontend correction
Candidate branch:
`diagnostic/t12-laser-service-02cr-a46-20260928`

Changes to `trendos-edge-orders-read-v1.js`:
- Version: `EDGE_ORDERS_T12_LASER_SERVICE_02CR_20260928`
- `pagePathFor(...)` now always uses the qualified `/v1/edge/orders/02cr/page` for operational screens, including Customer Service.
- Service response now uses the same qualified-mirror validation and line-identity normalization as Print/Laser.
- Cloud-native line IDs returned by the qualified route are learned by the client, preserving Cloud runtime status/notes writes.
- Older Service route remains in Worker source but is no longer selected by the current frontend read wrapper.

A46 corrected frontend qualification:
- Run: `36467429782`
- Job: `109080905373`
- Conclusion: SUCCESS
- JS syntax: PASS
- Service + Laser frontend 02CR routing assertions: PASS

The earlier A46 run `36467348101` failed only because its test attempted to import Cloud source from the `main` branch where those Cloud files are not present. JS syntax passed. The test was separated correctly; no production mutation occurred from that failed diagnostic.

## Laser backend qualification
Backend diagnostic branch:
`diagnostic/t12-laser-backend-overlay-a47-20260928`

- Test commit: `a12fc565d4e39701a55a2e2dff59c1353c6e04fb`
- Workflow commit: `cd7b3bc567eaa14fe86101583d190d8955f62930`
- Run: `36467506382`
- Job: `109081158279`
- Conclusion: SUCCESS

A47 proved:
- T12 Laser mapping returns only Laser Cloud-native lines.
- Runtime status survives mapping.
- `screen=service` accepts all departments as the Apps Script Service screen does.
- Cloud identity overrides a stale/mirrored duplicate line.
- The 02CR route merges T12 rows before filters and pagination.

## Main promotion
Main frontend commit:
`c3cbf5d1ea63864c3c64c956ca7f583ecadaae56`

Main cache-bust/config commit and exact live main SHA:
`eb0329525689ab737d866ff674debbebd91f5851`

Cache:
`trendos-edge-orders-read-v1.js?v=20260928-t12-laser-service-02cr`

GitHub Pages:
- Run: `36467595843`
- Exact HEAD: `eb0329525689ab737d866ff674debbebd91f5851`
- Build: SUCCESS
- Deploy: SUCCESS
- Overall conclusion: SUCCESS

## Result
Current frontend behavior:
- Print -> qualified 02CR + T12 overlay
- Laser -> qualified 02CR + T12 overlay
- Customer Service -> qualified 02CR + T12 overlay
- On 02CR/freshness failure -> Apps Script + independent T12 hybrid overlay fallback
- Cloud-native single-line status/notes writes -> T12 operational runtime
- Legacy line writes -> Apps Script

No Worker deploy was required for this Customer Service correction because the production 02CR Worker route already contained the required T12 overlay implementation.

## Remaining validation boundary
A real Cloud-native Laser order has not yet been created after this entry, so end-to-end live Laser CREATE -> visible in Laser -> runtime status update still needs one real operational order or a separately authorized synthetic production order to close that exact live evidence.

Customer Service now uses the same deployed qualified read path as Print/Laser. Live user-session confirmation should be performed after Ctrl+F5.

## Cloud boundary
```
CLOUDFLARE_WORKER_TOUCHED=NO
D1_TOUCHED=NO
APPS_SCRIPT_TOUCHED=NO
GOOGLE_SHEETS_TOUCHED=NO
```
