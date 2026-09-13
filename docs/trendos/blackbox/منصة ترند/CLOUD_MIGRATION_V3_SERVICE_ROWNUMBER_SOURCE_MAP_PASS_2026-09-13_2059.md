# TrendOS Cloud Migration V3 — Service RowNumber Source Map PASS

Date: 2026-09-13 20:59 Africa/Cairo
Controlled branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`

## Completed step

Performed safe rowNumber-based correlation between live Production Apps Script Service output and the current D1 `بنود الأوردرات` mirror. Only aggregate column-match counts were logged; no raw customer/business values were exposed.

- workflow: `TrendOS T11 Service RowNumber Field Map`
- run: `34776259051`
- job: `103774815073`
- workflow commit: `0af23b1a63e0afbc01b2cf11f93ef3a17fd4df21`
- result: PASS / read-only diagnostic
- Production business mutation: NO

## Evidence

- live Service rows: 35
- Service rows with `rowNumber`: 35
- numeric rowNumber values that existed in the Lines mirror: 35
- missing numeric source-row records: 0
- Lines mirror snapshot: `2026-09-13 18:38:19`
- Apps Script Service read latency: ~6549 ms

However, using the exact same numeric rowNumber in `بنود الأوردرات`:
- `orderId`: no source-column match
- `orderCode`: no source-column match
- `lineId`: no source-column match
- `customerPhone`: no source-column match

Only partial/shared-field coincidences appeared:
- department -> column 5 for 19 rows
- itemName -> column 7 for 16 rows
- qty -> column 8 for 33 rows
- priority -> column 10 for 23 rows
- status -> column 11 for only 3 rows

## Conclusion

The deployed Production Service output is not row-for-row sourced from `بنود الأوردرات`, despite the current repository branch `Code.gs` implementation doing so. The live Production Service contract differs more fundamentally from the repo branch: its `rowNumber` namespace/source appears to belong to another sheet/view.

Given the existing legacy `واجهة خدمة العملاء` screen-view mirror and the prior `/v1/edge/orders/page` implementation, the strongest current hypothesis is that deployed Service reads a Service/customer screen view (or equivalent projection), not Lines directly.

This invalidates any attempt to cut over Service by reconstructing rows directly from `بنود الأوردرات` without first identifying/refreshing the actual source view.

## Production state unchanged

- main: `44e0b01dd636ec81ef2a298b714a329cd3f828c9`
- Print/Laser/Press: D1-first with fallback.
- Service: Apps Script.
- all writes: Apps Script/Sheets authoritative.

## Exact next step

Inspect the existing `D1_Screen_View_Mirror_Refresh_02CQ.gs` one-shot/status contract and determine whether the production Apps Script exposes its read-only status / safe one-shot refresh route. If safely available, refresh the four screen-view mirrors atomically from Sheets to D1 (read-mirror update only; no source Sheet mutation), verify current `واجهة خدمة العملاء` mirror freshness/parity, then correlate Service output against that view before any Service cutover.
