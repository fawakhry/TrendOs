# TrendOS Handoff

> Read this file first in a new execution chat.
> Last consolidated: 2026-08-30.

## Active phase

**PHASE 1 — TRENDOS CORE + CLOUD**

Final TrendOS V1 launch target: **01/03/2027**.

Do not implement Smart Designer, Matbagy AI, Lead Hunter, Marketplace or Logistics in this phase unless a Core dependency requires it. Record unrelated ideas in `TRENDOS_BACKLOG.md`.

## Repository / branches

- Repo: `fawakhry/TrendOs`
- Production/default: `main`
- Working: `agent/go-live-2026-09-01-integrity`
- Safety: `backup/go-live-2026-08-30-pre-p0`
- Core master plan: `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

## Canonical memory read order

1. `docs/trendos/TRENDOS_PROJECT_MEMORY.md`
2. `docs/trendos/TRENDOS_HANDOFF.md`
3. `docs/trendos/inventory/PRODUCTION_SOURCE_RECONCILIATION.md`
4. `docs/trendos/inventory/D1_READ_PATH_INVENTORY.md`
5. `docs/trendos/inventory/D1_DASHBOARD_PATH_INVENTORY.md`
6. `docs/trendos/inventory/ORDERS_LINES_INVENTORY.md`
7. `docs/trendos/TRENDOS_TEST_MATRIX.md`
8. `docs/trendos/TRENDOS_WORKLOG.md`
9. `docs/trendos/TRENDOS_ARCHITECTURE.md`
10. `docs/trendos/TRENDOS_DECISIONS.md`
11. `TRENDOS_GO_LIVE_2026-09-01_MASTER.md`

Evidence order:

`LATEST VERIFIED > EARLIER VERIFIED > DEPLOYED > TESTED > IMPLEMENTED > PREPARED > PLANNED > UNKNOWN`

## Current production identity

Active Apps Script Web App:
- Version **143**
- timestamp shown by Apps Script: **Aug 29, 2026 11:37 PM**
- deployment ID prefix matches the ID in TrendOS `config.js`

Live `action=health` verified:
- `success:true`
- backend `V1932_FULL_GO_LIVE_20260824`
- spreadsheet `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`
- Users/Orders/Lines present
- Orders rows: 152
- Lines rows: 180
- 87 sheet names returned

Historical Version 138 is superseded as the active deployment reference.

## Important source divergence

Version 143 project history routes:
- `getDashboard` -> `getDashboardD1PrimaryV1_(e)`
- `getRowsPageV1931` -> `getRowsPageD1FastV2_(e)`

GitHub `Code.gs` still has older top-level route wiring.

**Do not overwrite Apps Script from GitHub `Code.gs` yet.**

## Current architecture

### Writes
Google Apps Script + Google Sheets remain authoritative for operational/financial writes.

### Reads
D1 is the accelerated mirror/read layer with automatic Google Sheets fallback.

### Orders page — Version 143
Production Orders read uses `getRowsPageD1FastV2_(e)`:

```text
request
 -> D1 feature flag
 -> authorize_()
 -> allowed-screen check
 -> TrendOS dataVersion
 -> V2.3 stable cache
      -> D1_FAST_STABLE_CACHE_V23 on hit
 -> D1 probe
 -> V2.2 current snapshot cache
 -> D1 snapshot/build
 -> current-page enrichment
 -> cache write
 -> D1_FAST_V22

Any D1/safety/runtime error
 -> getRowsPageV1931_()
 -> GOOGLE_SHEETS_FALLBACK
```

Verified implications:
- V2.3 stable cache is present in Version 143.
- legacy `authorize_()` runs **before** stable-cache lookup.
- Fast Auth V2.4 is **not deployed in this inspected Orders path**.
- `D1_Orders_Fast_V2_4.gs` remains PREPARED / NOT INSTALLED / NOT DEPLOYED / NOT VERIFIED.

### Dashboard — Version 143
Production Dashboard uses `getDashboardD1PrimaryV1_(e)`:

```text
request
 -> Dashboard D1 feature flag
      -> OFF: getDashboard_(e)
 -> authorize_()
 -> allowed-screen check
 -> d1OrdersPrimarySnapshotV1_()
 -> d1DashboardResultV1_(screen, snapshot)
 -> source = D1

Any D1/safety/network/runtime error
 -> getDashboard_(e)
 -> GOOGLE_SHEETS_FALLBACK
```

The Dashboard shares the D1 mirror safety contract and keeps Google Sheets as automatic fallback.

## Orders/Lines integrity already discovered

Current inspected source already contains:
- `createManualOrder_()` ScriptLock + V1908 replay guard.
- `appendLine_()` duplicate Line-ID guard.
- `syncOrderFromLines_()` duplicate collapse / `مكرر` exclusion.

Remaining known gaps:
- `submitCustomerDraft_()` lacks one outer lock around full draft -> Order/Lines conversion.
- `updateLine_()` lacks a unified idempotent mutation + side-effect contract.

Do not add another blind duplicate-Line patch.

## Phase 0 test status

PASS:
- `INV-01` Orders/Lines repo inventory.
- `INV-09A` D1 Primary V1 helper source.
- `INV-09B` production Orders Fast V2/V2.3 source.
- `INV-09C` Fast Auth V2.4 absent from Version 143 Orders path.
- `INV-09D` production Dashboard D1 path.
- `INV-10A` active deployment Version 143.
- `INV-10B` deployment/config ID prefix match.
- `INV-10C` live runtime identity.
- `INV-10D` Version 143 D1 top-level routing.

Still partial:
- `INV-09` full D1 sync/read/auth inventory.
- `INV-10` complete Version 143 file/source composition.

## Exact current stopping point

**Next single action: inspect the D1 atomic/live sync entry point(s), read-only.**

Need to map the function(s) that actually synchronize Orders + Order Lines to D1 as:

`Trigger/Event -> Entry Point -> Lock -> Stage -> Promote -> Ready/Health -> Error behavior`

Do not run a sync, save, edit or deploy yet.

After the sync path is mapped, continue:
1. active trigger/cadence inventory,
2. Worker/API contract,
3. legacy auth + V2.4 invalidation design,
4. D1 mirror health/parity reconfirmation,
5. remaining Phase 0 lanes (Invoice, Attendance, Cleaning, Press, WhatsApp, Handover/OPS, baseline IDs/formats).

## First code after Phase 0

Create shared foundation only after inventory:

`trendos-integrity-v1.gs`

Target responsibilities:
- ID normalization,
- shared locks,
- durable idempotency,
- Business Calendar,
- automation run logging,
- centralized open/closed helpers.

Preserve working protections; do not replace them blindly.

## Non-negotiable safeguards

- Never delete valid historical data.
- Never invent price/state/payment/stock/approval facts.
- `Order ID` is the order key.
- `Line ID` is the logical active-line key.
- repeated writes must become idempotent.
- check-then-write requires locking.
- `مكرر` rows remain historical but must not count as active work.
- Google Sheets stays write authority/fallback until an approved migration changes it.
- tests record Expected / Actual / PASS|FAIL.

## Fresh-chat continuation prompt

> Continue TrendOS from canonical GitHub memory in `docs/trendos/` on repo `fawakhry/TrendOs`, working branch `agent/go-live-2026-09-01-integrity`. Active lane is PHASE 1 — CORE + CLOUD. Production Apps Script is Version 143. Orders reads use `getRowsPageD1FastV2_()` with legacy `authorize_()` before V2.3 stable cache and safe Sheets fallback; Fast Auth V2.4 is not deployed in this inspected path. Dashboard uses `getDashboardD1PrimaryV1_()` with shared D1 safety snapshot and automatic `getDashboard_()` fallback. Do not overwrite Apps Script from GitHub because deployed/editor D1 routing is ahead of GitHub `Code.gs`. Next single action is read-only inspection of the D1 atomic/live sync entry point(s): Trigger/Event -> Entry Point -> Lock -> Stage -> Promote -> Ready/Health -> Error behavior. Work one step at a time.
