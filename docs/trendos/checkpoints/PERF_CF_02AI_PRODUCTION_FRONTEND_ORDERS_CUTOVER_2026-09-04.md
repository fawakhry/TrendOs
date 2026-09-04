# PERF-CF-02AI — Production frontend Orders read cutover — 2026-09-04

## Production branch change
A surgical promotion was applied to `main`; the working branch was NOT merged wholesale.

Production changes only:
1. added `trendos-edge-orders-read-v1.js`;
2. added `MATBAGY_EDGE_ORDERS_API_URL=https://trendos-d1-api.trendmall-contact.workers.dev` to `config.js`;
3. set `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED=true`;
4. loaded `trendos-edge-orders-read-v1.js?v=20260904b` through the existing module loader.

Main cutover commit:
`cf6a3a7e817fdb6c01fed3b6ad63c9cce8489d9a`

The loader itself was first added inertly in main commit:
`b8cae604f2eaf7bfbe8b49c99f5346af949c350c`

## Cutover scope
Only `getRowsPageV1931` eligible reads are Edge-first.
`__DEBT__` and unsupported reads remain on Apps Script.
Every Edge exception automatically invokes the original `trendosSecureApiV1922` Apps Script function.
All writes remain Apps Script/Sheets.

## Rollback
Frontend rollback is one config change:
`MATBAGY_EDGE_ORDERS_READ_V1_ENABLED=false`.
The loader may remain deployed while inert.

## Deployment
GitHub Pages build completed PASS and the github-pages deployment job completed PASS for the main cutover commit.
