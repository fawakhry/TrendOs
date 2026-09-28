# TrendOS T12 Hybrid Read Overlay — Main live

Date: 2026-09-28 Cairo

## Entry 440 RESULT — HYBRID-READ-OVERLAY-LIVE-ON-MAIN

Owner explicitly authorized modifying `main` for Hybrid Read Overlay.

Production Worker prerequisite:
- A26 qualification run `36400323114`: SUCCESS.
- Authenticated SELECT-only endpoint `/v1/t12/orders/read-overlay` qualified.
- A27 production deploy run `36400429148`: SUCCESS.
- Worker Version ID: `f5416139-da80-4bd1-9042-e2482e7fd4ef`.
- Unauthenticated overlay request returns HTTP 401, proving the route is live and protected.
- Post-deploy CREATE safety: `enabled=false`, `nextOrderNumber=4323`, `canaryRemaining=0`, `generalCutover=false`.

Main frontend:
- Main commit: `cdf127629c8bdea1210d304bb8bc460487beca74`
- Commit message: `Merge T12 hybrid read overlay`
- Frontend version: `EDGE_ORDERS_READ_T12_HYBRID_20260928`
- Loader cache bust: `trendos-edge-orders-read-v1.js?v=20260928-t12-hybrid-overlay1`

Behavior now:
- Qualified fresh Edge reads remain first choice.
- If 02CR falls back because Sheets mirrors are stale, Apps Script still provides legacy rows.
- The frontend independently fetches authenticated T12 Cloud-native rows from the read-only overlay endpoint and merges them into the Apps Script result.
- Duplicate identities are removed by line/order identity.
- Cloud-native row identities seen by the frontend are blocked from `updateLine` with `T12_CLOUD_NATIVE_READ_ONLY`; Apps Script is not called for those rows.
- No Apps Script write authority change.
- No general CREATE cutover.
- No historical Orders or Order Lines backfill.

Post-merge qualification:
- A28 first qualification run `36400838856` failed only in the git diff-scope check because the shallow checkout had no merge base after `main` moved concurrently; hybrid runtime tests were skipped, not failed.
- A29 branch was created directly from exact main SHA `cdf127629c8bdea1210d304bb8bc460487beca74`.
- A29 run `36407399736`, job `108879316894`: SUCCESS.
- `T12 hybrid frontend fallback isolated PASS`.
- `POST_MERGE_FRONTEND_QUALIFICATION=PASS`.
- The test proves stale 02CR -> Apps Script legacy row + T12 Cloud-native Order 4322 -> merged result, and proves `updateLine` for `4322-01` is blocked before Apps Script.

GitHub Pages:
- Pages build/deployment run `36401207356` for exact main SHA `cdf127629c8bdea1210d304bb8bc460487beca74`: SUCCESS.

Current safety state:
```
HYBRID_READ_OVERLAY_MAIN=LIVE
ORDER_4322_CREATED=YES
ORDER_4322_INTEGRITY=PASS
CANARY_ENABLED=false
CANARY_REMAINING=0
NEXT_ORDER_NUMBER=4323
GENERAL_CREATE_CUTOVER=NO
HISTORICAL_ORDERS_BACKFILL=NO
HISTORICAL_ORDER_LINES_BACKFILL=NO
```

Next step: user-visible UI verification after hard refresh that Order 4322 appears in the print screen.
