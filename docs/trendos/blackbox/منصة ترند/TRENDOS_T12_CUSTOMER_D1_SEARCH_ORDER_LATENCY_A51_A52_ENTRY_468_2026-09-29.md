# TrendOS T12 — Customer D1 Search + Orders Stale Backoff — Entry 468
Date: 2026-09-29 Cairo
Repository: `fawakhry/TrendOs`

## Owner request
Owner requested:
1. Reduce the noticeable delay before Orders appear.
2. Move customer lookup away from Google Sheets because customer reads were still Apps Script/Sheets-backed.

No new Order was created during this work. No Order status was changed.

---

## A50 prerequisite — customer enrichment mirror refreshed
A50 V4 production workflow:
- Run: `36488039329`
- Job: `109149625983`
- Result: `SUCCESS`

Verified post-refresh D1 state:
```ini
CUSTOMER_MIRROR_ROWS=248
CUSTOMER_MIRROR_SOURCE_LAST_ROW=248
CUSTOMER_MIRROR_SOURCE_LAST_COL=18
CUSTOMER_MIRROR_STATUS=ready
CUSTOMER_MIRROR_NOTE=PERF-CF-02CR enrichment live sync V1
DEBT_RESTRICTION_ROWS=1
SENSITIVE_ROWS=0
FRESHNESS_PASS=YES
GOOGLE_SHEETS_MUTATION=NO
ORDER_CREATE=NO
ORDER_STATUS_MUTATION=NO
```

The customer transfer used only the safe operational customer directory columns needed by the runtime. Portal password/session-token material was excluded.

---

## A51 — customer search moved D1-first

### Backend
New authenticated read-only route:
`GET /v1/edge/customers/search?q=...`

Implementation:
`cloudflare-d1/src/edge-customer-search-v1.mjs`

Properties:
- Uses the existing signed Orders Edge session token.
- Reads `العملاء` from D1 mirror tables.
- Requires mirror structural readiness/parity and exact enrichment note.
- Reproduces Apps Script customer-search behavior for:
  - name
  - manager
  - primary phone
  - extra phone
  - customer type
  - active flag
  - debt amount
- Returns up to 12 matches.
- Returns safe fields only.
- No customer writes.
- Fails to frontend fallback when D1 directory is unavailable.

Qualification:
- A51 customer CI corrected run: `36492570926` — `SUCCESS`
- Production-shadow route integration run: `36492827748` — `SUCCESS`

### Worker production deployment
Guarded production deploy:
- Run: `36492891790`
- Job: `109165416354`
- Result: `SUCCESS`

Verified:
```ini
A51_PREDEPLOY_QUALIFICATION=PASS
A51_CUSTOMER_MIRROR_PREFLIGHT=PASS
CUSTOMER_ROWS=248
A51_WORKER_DEPLOYED=YES
A51_PROD_CUSTOMER_ROUTE_PROTECTED=PASS
CUSTOMER_SEARCH=D1_READ_FIRST
CUSTOMER_CREATE_UPDATE=APPS_SCRIPT
ORDER_CREATE_UNCHANGED=YES
D1_MIGRATIONS=NO
A51_WORKER_PRODUCTION=PASS
```

One earlier deploy attempt (`36492647628`) saw the old Worker route during immediate propagation verification, failed closed, and automatically rolled back. No bad deployment was left active. The retry added route-propagation polling and then passed.

### Frontend
Frontend now intercepts `searchCustomers`:
1. Query D1 customer directory first.
2. If D1 returns matches, use them immediately.
3. If D1 returns zero matches, fall back to Apps Script so a newly-created customer not yet mirrored is still discoverable.
4. If D1 errors, fall back to Apps Script.

Registered-customer phone resolution before Cloud CREATE now follows the same D1-first policy.

Frontend candidate:
`candidate/t12-customer-search-d1-a51b-20260929`

Frontend CI:
- Run `36492504443` — `SUCCESS`

PR:
- `#14`

Main promotion:
`1557c78b0b75c3267905097b6a0e257e899771e7`

GitHub Pages:
- Run `36492972706`
- Exact SHA `1557c78b0b75c3267905097b6a0e257e899771e7`
- Result: `SUCCESS`

A51 state:
```ini
CUSTOMER_SEARCH=D1_FIRST
CUSTOMER_SEARCH_MISS_OR_ERROR=APPS_SCRIPT_FALLBACK
CUSTOMER_CREATE_UPDATE=APPS_SCRIPT
CUSTOMER_WRITE_CUTOVER=NO
```

---

## A52 — repeated stale Orders double-hop removed

### Problem
02CR correctly fails closed when the Customer/Restriction enrichment mirror is older than its freshness budget. Because the browser previously retried 02CR on every Orders refresh, a known-stale mirror could cause:

```
D1/02CR attempt
-> stale response
-> Apps Script fallback
-> render
```

on every read, adding a repeated avoidable network hop.

The backend freshness/debt guard must not be weakened because current debt/restriction data is operationally important.

### Fix
A frontend-only stale fallback cooldown was added.

When a known mirror-stale response is observed:
- `EDGE_MIRROR_STALE`, or
- `02cr-mirror-stale`

TrendOS opens a 2-minute cooldown.

During that cooldown, subsequent Orders reads do not first call the already-known-stale 02CR route. They go directly to:
- authoritative Apps Script legacy read
- plus the T12 Cloud-native overlay

This removes repeated stale double-hop latency without treating stale D1 debt/customer enrichment as current.

The cooldown:
- defaults to 2 minutes;
- is capped at 5 minutes if configured;
- expires automatically;
- does not persist across browser reloads;
- does not affect `__DEBT__` routing;
- does not change Worker freshness logic;
- does not change Order CREATE/runtime authority.

Frontend candidate:
`candidate/t12-orders-stale-backoff-a52-20260929`

A52 CI:
- Run `36493414696`
- Result: `SUCCESS`

PR:
- `#15`

Main promotion:
`b1345af6076cf2350f03842f3d0071bb4b6cb84d`

Frontend version:
`EDGE_ORDERS_T12_CUSTOMER_D1_A51_STALE_BACKOFF_A52_20260929`

Cache:
`20260929-t12-a52-stale-backoff`

GitHub Pages:
- Run `36493477410`
- Exact SHA `b1345af6076cf2350f03842f3d0071bb4b6cb84d`
- Result: `SUCCESS`

A52 state:
```ini
REPEATED_STALE_02CR_DOUBLE_HOP=MITIGATED
BACKEND_FRESHNESS_GUARD=UNCHANGED
DEBT_READ_SAFETY=UNCHANGED
T12_CLOUD_OVERLAY=PRESERVED
ORDER_CREATE_PATH=UNCHANGED
```

---

## Current authority map
```ini
CUSTOMER_SEARCH=D1_FIRST
CUSTOMER_SEARCH_FALLBACK=APPS_SCRIPT_ON_MISS_OR_ERROR
CUSTOMER_CREATE_UPDATE=APPS_SCRIPT
CUSTOMER_WRITE_AUTHORITY=GOOGLE_SHEETS
ORDER_READ=02CR_FIRST_WHEN_QUALIFIED
ORDER_STALE_COOLDOWN=2_MINUTES
ORDER_FALLBACK=APPS_SCRIPT_PLUS_T12_OVERLAY
ORDER_CREATE=T12_CLOUD_GENERAL
ORDER_STATUS_FOR_CLOUD_NATIVE=T12_RUNTIME
```

## What remains
Customer reads/search are now Cloud/D1-first, but customer CREATE/update authority is **not** yet cut over. The next customer phase is a separately qualified Cloud-native customer write path with stable identity, idempotency, validation, and migration/reconciliation rules before Google Sheets can cease being the customer write authority.
