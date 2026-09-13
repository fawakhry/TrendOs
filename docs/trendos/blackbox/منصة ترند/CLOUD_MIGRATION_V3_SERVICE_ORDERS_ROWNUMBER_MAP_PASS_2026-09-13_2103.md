# TrendOS Cloud Migration V3 — Service vs Orders RowNumber Map PASS

Date: 2026-09-13 21:03 Africa/Cairo
Controlled branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`

## Completed step

Compared live Production Service row fields against the D1 `الأوردرات` mirror using the numeric Service `rowNumber` as a diagnostic only. No business values were logged.

- workflow: `TrendOS T11 Service Orders RowNumber Map`
- run: `34776449470`
- job: `103775329919`
- workflow commit: `a086cb9474ca91c9311aee214288abc94fbca236`
- result: PASS / read-only diagnostic
- production business mutation: NO

## Evidence

- Service rows: 35
- rows with rowNumber: 35
- numeric row numbers found in Orders mirror: 35
- missing numeric source-row slots: 0
- Orders mirror syncedAt: `2026-09-13 18:38:19`
- Orders mirror source rows: 514
- Apps Script Service read latency: ~6339 ms (workflow wall time was much longer because the full diagnostic also fetched/processsed the mirror)

Same-number field matching was not identity-exact:
- orderId/orderCode/lineId/customerPhone/customer: no direct same-row identity matches
- department -> Orders col 9 partial 19
- itemName -> col 10 partial 19
- qty -> col 14 strong partial 32
- priority -> col 11 partial 20
- status -> col 12 only 5
- ready -> col 15 strong partial 29

## Interpretation

This does NOT contradict the proven Orders A:S source. The Service sheet is populated by:
`FILTER('الأوردرات'!A2:S..., 'الأوردرات'!A2:A...<>"")`

FILTER compacts/removes blank source rows. Therefore the Service-view row number is the output row position, not a guaranteed Orders source row number. Numeric rowNumber equality cannot be used as the join key.

The strong partial matches on order-level fields further support the Orders A:S source, while identity fields require joining by order identity rather than raw row number.

## Production state unchanged

- main: `44e0b01dd636ec81ef2a298b714a329cd3f828c9`
- Print/Laser/Press: D1-first with fallback.
- Service: Apps Script.
- all writes: Sheets/Apps Script authoritative.

## Exact next step

Correlate live Service rows to D1 Orders rows using order identity entirely in-memory, then output only aggregate source-column match counts for each Service field plus aggregate included/excluded counts by order-level status and priority. Do not log any raw IDs, phones, names, or customer data. Use this to reconstruct the exact deployed Service projection and active filter from Orders A:S.
