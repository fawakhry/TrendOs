# TrendOS T12 Read Overlay — Entry 438

Date: 2026-09-28 Cairo

Owner approved the T12 read overlay.

Implementation on working branch:
- cloudflare-d1/src/t12-read-overlay.mjs
- cloudflare-d1/src/edge-orders-read-02cr-canary.mjs
- tests/t12_read_overlay.test.mjs
- latest implementation HEAD before documentation: d169a10fc6eb6273a3f8945a8a3533bc078ca7f5

Behavior:
- Existing qualified 02CR reads keep the Sheets mirror rows.
- T12 Cloud-native rows are read from t12_prod_orders/t12_prod_lines and merged into the read result.
- Deduplication uses lineId and prefers the Cloud-native copy for the same identity.
- Cloud-native rows are marked cloudNative=true, readOnly=true, writeAuthority=cloudflare-t12.
- No historical Orders or Order Lines backfill was performed.

Qualification:
- A23 run 36354963557 / job 108720759812: SUCCESS.
- OVERLAY_UNIT_TEST=PASS.
- PROD_OVERLAY_SHAPE=PASS.
- ORDER_4322_READY_FOR_OVERLAY=YES.
- MIRROR_4322_MATCH_COUNT=0.
- PRODUCTION_MUTATION=NO.

Production deploy:
- A24 run 36355018666 / job 108720919540: SUCCESS.
- Workflow commit: 7378132e1bdeccef7d98eee3506c98b306f18e60.
- Worker Version ID: cd283820-11e2-4eec-a6ca-2723a70df77a.
- Post-deploy safety passed.

Current state:
T12_READ_OVERLAY_IMPLEMENTED=YES
T12_READ_OVERLAY_DEPLOYED=YES
ORDER_4322_CREATED=YES
ORDER_4322_INTEGRITY=PASS
CANARY_ENABLED=false
CANARY_REMAINING=0
NEXT_ORDER_NUMBER=4323
GENERAL_CREATE_CUTOVER=NO
HISTORICAL_ORDERS_BACKFILL=NO
HISTORICAL_ORDER_LINES_BACKFILL=NO

Next: authenticated UI verification that Order 4322 appears in the print screen.
