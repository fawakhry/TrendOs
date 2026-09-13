# TrendOS Cloud Migration V3 — Service Contract Checkpoint

Date: 2026-09-13 20:52 Africa/Cairo
Repository: `fawakhry/TrendOs`
Controlled branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`

## Completed step

Reviewed the last successful authoritative Service contract extraction and the failed exact Lines projection. No production mutation was performed.

Evidence:
- Service contract extraction run: `34774706723` — PASS / read-only.
- Service exact Lines projection run: `34774744376` — FAIL-CLOSED / read-only.
- Failed candidate: 32 rows.
- Authoritative Apps Script Service output: 36 rows.
- Set difference under the attempted Lines projection: missing 36 / extra 32.
- Fresh Lines mirror used by the failed attempt: `syncedAt=2026-09-13 18:13:22`.
- Authoritative Apps Script read in that run: ~5159 ms.

## Confirmed Service contract facts

From production `Code.gs` contract extraction:

- `dashboardMatchesScreen_(screen, department, heatPress)` returns `true` for Service by default; Service is not a single department filter.
- `rowMatchesServerFiltersV1931_` applies active/status/priority/search/date/debt filtering on the projected row object.
- `priorityRank_` ranks `عاجل`/`VIP` before `عادي`, then `مؤجل`.
- Service output cannot be reproduced by taking `بنود الأوردرات` rows and simply exposing canonical line IDs.
- In authoritative Service rows, the second identity-like field can be a customer/phone/legacy key rather than department canonical Line ID.

Conclusion: Service requires an exact Service-specific projection equivalent to the Apps Script `getRowsPageV1931` row-building contract. The existing Print/Laser/Press line-level D1 path must not be reused for Service.

## Current production state

Production `main`: `44e0b01dd636ec81ef2a298b714a329cd3f828c9`.

- Print: D1-first with fallback — retained.
- Laser: D1-first with fallback — retained.
- Press: D1-first with fallback — retained.
- Service: Apps Script — NOT cut over.
- `__DEBT__`: Apps Script.
- All business writes: Sheets / Apps Script authoritative.
- No Task mutation authority change.
- No core secret change.

## Exact next step

Read-only extraction of the exact `getRowsPageV1931_` / `getRows_` / row-building functions used to construct Service rows, including the source sheet(s), column mapping, grouping/deduplication, sorting, and the origin of Service `lineId`. Then build a Service-specific D1 candidate from the correct source(s), run live parity, and only after PASS consider Service D1-first promotion.

Do not redo T6A/T6B/Print/Laser/Press.
