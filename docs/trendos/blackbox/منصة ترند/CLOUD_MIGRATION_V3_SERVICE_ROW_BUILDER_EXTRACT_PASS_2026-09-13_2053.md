# TrendOS Cloud Migration V3 — Service Row Builder Extract PASS

Date: 2026-09-13 20:53 Africa/Cairo
Controlled branch: `cloud-migration-v3-t6b-auth-shadow-canary-20260913`

## Completed step

Read-only extraction of the exact production `getRows_` and `getRowsPageV1931_` row-building contract.

- workflow: `TrendOS T11 Service Row Builder Extract`
- run: `34775853005`
- job: `103773700473`
- workflow commit: `2a80201c778cd590870a79f35de615cabb9990de`
- result: PASS
- production mutation: NO

## Exact findings

`getRows_`:
- authorizes the employee and checks screen permissions;
- reads `SHEET_NAME_LINES` = `بنود الأوردرات` directly;
- resolves columns with `headersMap_` + `firstCol_`;
- reads the sheet with `getValues()`;
- for Service, `dashboardMatchesScreen_` accepts every department row;
- builds one output row per qualifying source row; there is no Service grouping/deduplication in `getRows_`;
- `lineId` is assigned from `normalize_(valueAt_(row, colLineId))`;
- `colLineId = firstCol_(h, ["رقم البند", "Line ID"], 6)`;
- customer phone is separately resolved from the row/customer map;
- rows sort by `priorityRank_`, then `orderId` lexical compare.

`getRowsPageV1931_`:
- performs its own authorization, then calls `getRows_`, causing the known double-authorization path;
- applies `rowMatchesServerFiltersV1931_` after full row construction;
- computes pagination/status counts after row construction;
- does not remap `lineId` after `getRows_`.

## Important implication

The earlier live Service output showed phone/customer-like values in `lineId`, while the D1 Lines mirror exposes canonical Line IDs. Since the Apps Script code explicitly reads `lineId` via `firstCol_` + `valueAt_`, the next blocker is now narrowed to column-index/header-resolution semantics and the actual current `بنود الأوردرات` header layout. It is NOT a hidden Service grouping algorithm.

## Production state unchanged

- main: `44e0b01dd636ec81ef2a298b714a329cd3f828c9`
- Print/Laser/Press: D1-first with fallback.
- Service: Apps Script.
- writes: Sheets/Apps Script authoritative.
- no secrets/tasks/Gaber changes.

## Exact next step

Read-only inspect `headersMap_`, `firstCol_`, `valueAt_` and the D1 mirror header indexes for `بنود الأوردرات`. Reproduce the same column-resolution semantics against D1 and rerun Service parity. No Service cutover before parity PASS.
