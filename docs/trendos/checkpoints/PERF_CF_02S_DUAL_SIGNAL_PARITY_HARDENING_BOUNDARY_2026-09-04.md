# PERF-CF-02S — Dual-Signal Parity Hardening Boundary — 2026-09-04

## Trigger
After `PERF-CF-02R`, inspect the exact heartbeat helper, route patch, and Edge freshness guard before any live Apps Script installation.

## Verified helper / route
- `cloudflare-d1/D1_Orders_Low_Usage_Heartbeat_V1.gs` is read-only and sanitized.
- `apps-script/patches/D1_ORDERS_LOW_USAGE_HEARTBEAT_ROUTE_V1.md` requires exactly one guarded GET action line after reconciliation with the live Version-148 source.
- Full GitHub `Code.gs` replacement remains forbidden.

## Access boundary
Google Drive can see the live TrendOS spreadsheet, but no `application/vnd.google-apps.script` project is exposed through the connected Drive surface. Plugin discovery also found no dedicated Google Apps Script source-edit connector. Therefore no blind live-source mutation is permitted from the available connector surface.

## New safety finding
The GitHub-qualified idle-heartbeat validator currently verifies the Lines source shape against D1 metadata, but only checks that the Orders source entry is present/healthy; it does not require Orders source row/column shape to equal the D1 Orders catalog.

Before any read cutover, a valid idle heartbeat must never be allowed to override a structural mismatch in either Orders or Lines.

## Decision
Harden the GitHub Edge gate before live installation:
1. inspect both `الأوردرات` and `بنود الأوردرات` catalog metadata before business-row reads;
2. require status/parity/live-note on both;
3. require heartbeat source shape to match both D1 catalogs when write-age is stale;
4. heartbeat may extend logical freshness only for age-only staleness;
5. any Orders or Lines shape/parity/status/live-note mismatch remains fail-closed to Apps Script.

## Production impact
**NONE.**
No live Apps Script change, no Production Cloudflare cutover, no Cloud Write activation.

## Next step
Implement the hardening on the working branch, extend regressions for Orders mismatch and Lines mismatch, then require CI PASS before returning to the live-source boundary.
