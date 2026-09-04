# TRENDOS BLACKBOX — PERF-CF-02AI → 02AJ — 2026-09-04

## PERF-CF-02AI — Production frontend Orders cutover
A surgical production promotion was made on `main` only; no wholesale branch merge.

Production main changes:
- add `trendos-edge-orders-read-v1.js`;
- set Orders Edge API to `https://trendos-d1-api.trendmall-contact.workers.dev`;
- set `MATBAGY_EDGE_ORDERS_READ_V1_ENABLED=true`;
- load the Orders Edge module with cache-busting version `20260904b`.

Main cutover commit: `cf6a3a7e817fdb6c01fed3b6ad63c9cce8489d9a`.
GitHub Pages build and deploy completed PASS.

Scope is read-only: eligible `getRowsPageV1931` calls are Edge-first; writes and unsupported/sensitive reads remain Apps Script; any Edge error automatically falls back to the original Apps Script function.

Rollback: set the single production config flag back to false.

## PERF-CF-02AJ — Live published-assets probe PASS
A cache-busted external Runner probe verified the actually published site assets, not just repository source:
- live config HTTP 200;
- live Orders loader HTTP 200;
- production D1 API URL present;
- Orders read flag true;
- module loader present;
- loader contains D1-first / Apps-Script-fallback mode;
- anonymous Production Orders route still returns HTTP 401.

## Exact state after cutover
- Apps Script: Version 149 heartbeat route healthy.
- Production Cloudflare Orders backend: dual-signal PASS.
- Production frontend Orders read cutover: LIVE.
- Eligible Orders reads: Cloudflare/D1 first.
- Apps Script fallback: retained.
- Debt/unsupported reads: Apps Script.
- All writes: Apps Script/Sheets.
- Cloud Write: OFF.

This completes the controlled Orders READ cutover. It does NOT authorize Cloud Write migration.
