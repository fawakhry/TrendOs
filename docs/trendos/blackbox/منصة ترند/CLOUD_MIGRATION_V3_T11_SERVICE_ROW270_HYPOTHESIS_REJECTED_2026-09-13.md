# Cloud Migration V3 — T11 Service Row-270 Hypothesis Rejected

Date: 2026-09-13
Branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`
Workflow: `TrendOS T11 Service Row 270 Boundary Proof`
Run: `34777833539`
Workflow commit: `14f7c42eda8910a82ac8e372094b4f9e2f23dc7a`
Result: **FAIL-CLOSED / READ-ONLY**

## Tested hypothesis
The old mirrored `واجهة خدمة العملاء` formula was bounded to `الأوردرات!A2:S270`. The probe tested whether this row-270 boundary explained the 9 excluded `طلب جديد` Orders.

## Result
The hypothesis is false.

- Included request-new rows: 26
  - min Orders source row: 15
  - max Orders source row: 510
  - at/below 270: 9
  - above 270: 17
- Excluded request-new rows: 9
  - min Orders source row: 2
  - max Orders source row: 14
  - at/below 270: 9
  - above 270: 0

Therefore the excluded rows are an old legacy block near the top of the Orders sheet, not rows omitted by the old row-270 formula ceiling.

No business identities were exposed. No production mutation occurred.

## Current compatibility observation
For the current dataset, `status = طلب جديد` plus Orders source row `< 15` identifies the nine excluded legacy rows. This is not yet accepted as a permanent business predicate because source row numbers are not stable identities.

## Safety concern before Service cutover
The deployed Service response maps `lineId` to customer phone rather than the production Line ID. The existing Edge read adapter contains write-identity logic designed for line-based Print/Laser/Press rows. Before enabling Service D1-first, verify Service write/update behavior and ensure the read cutover cannot redirect or corrupt writes.

## Next step
Inspect frontend Service update paths and the Edge adapter's `updateLine` handling. Build a Service-specific read contract only after write-path compatibility is proven.
