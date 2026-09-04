# PERF-CF-02D — Latest Runtime Freshness Evidence

**Date:** 2026-09-04  
**Lane:** Cloudflare / D1 / Performance  
**Status:** **CUTOVER BLOCKED — SOURCE-TO-D1 LIVE SYNC NOT ADVANCING**

## Latest read-only diagnostic

GitHub Actions workflow:

- Workflow: `TrendOS Cloudflare Freshness Diagnostics`
- Run: `33828590687`
- Job: `100886485240`
- Trigger commit: `ed11f11ecf7069cf3b813f8972ca9164786cf500`
- Conclusion: `SUCCESS` as a diagnostic workflow. This does **not** mean freshness passed; the workflow is observational and reports the freshness state.

No D1 import, migration, Apps Script mutation, or production cutover occurred in this run.

## Production Worker control-plane evidence

Production Worker `trendos-d1-api` remains reachable and has the expected binding names:

- `DB` = D1 binding
- `MIGRATION_SECRET` = secret binding
- `CORS_ORIGINS` = plain-text binding

Therefore the current blocker is not the absence of the production Worker/D1 binding names.

## Production Apps Script source evidence

`ping` returned HTTP 200 and confirmed the live workbook still has:

- Orders rows: `274`
- Lines rows: `315`

The published Web App still does not expose D1 control/status actions:

- `getD1OrdersLiveSyncStatus` -> `Action غير معروف.`
- `getD1OrdersPrimaryReadStatus` -> `Action غير معروف.`
- `getD1OrdersPrimaryRuntimeStatusV1` -> `Action غير معروف.`
- `getD1FullMigrationStatus` -> `Action غير معروف.`

This prevents read-only diagnosis of the current D1 sync flag / last-attempt / trigger state through the serving Web App.

## Latest D1 mirror evidence

Both live mirror snapshots are internally row-consistent but stale:

### Orders

- sheet: `الأوردرات`
- rowCount: `274`
- sourceLastRow: `274`
- sourceLastCol: `67`
- status: `ready`
- syncedAt: `2026-09-04 00:27:55 UTC`
- ageSeconds at diagnostic: `6238` (~1h43m58s)
- note: `TrendOS orders live sync V1`
- rowParitySelf: `true`
- fresh <=180s: `false`

### Lines

- sheet: `بنود الأوردرات`
- rowCount: `315`
- sourceLastRow: `315`
- sourceLastCol: `82`
- status: `ready`
- syncedAt: `2026-09-04 00:27:55 UTC`
- ageSeconds at diagnostic: `6238` (~1h43m58s)
- note: `TrendOS orders live sync V1`
- rowParitySelf: `true`
- fresh <=180s: `false`

Both snapshots stopped at exactly the same sync point. This strengthens the diagnosis that the Apps Script live-sync control path is no longer advancing, rather than an isolated D1 table failure.

## Alternative bypass investigation

A source-independent Cloudflare/GitHub pull was investigated to avoid waiting on Apps Script source installation.

Current production Web App read routes that return operational Orders data (for example `getRowsPageV1931`) use employee session authorization. The Edge Preview signed token is intentionally a separate Edge-session contract and is not an Apps Script employee credential. No safe service-to-service Apps Script credential is currently available in GitHub/Cloudflare, and no direct writable Apps Script source project resource is exposed through the connected Google Drive tools.

Creating or embedding a new employee/service credential merely to bypass this control-plane limitation would be a separate security/production mutation and is not performed implicitly.

The bound Apps Script project also does not appear as a writable `application/vnd.google-apps.script` Drive resource in the connected Drive search. The available Drive update action cannot replace native Google Apps Script project source.

Conclusion: the safe direct repair remains the controlled Apps Script activation runbook, not a credential hack or a blind `Code.gs` replacement.

## Prepared repair assets already on the working branch

- `cloudflare-d1/D1_Orders_Live_Sync.gs`
  - atomic Orders + Lines staging/promote
  - observable success/skip/error state
  - first-run PASS required before installing the canonical trigger
- `cloudflare-d1/D1_Normalized_Live_Sync.gs`
  - normalized customers/orders/messages/conversations sync
  - fail-closed final freshness advancement
  - tested transaction rollback
- `docs/trendos/PERF_CF_02D_APPS_SCRIPT_SYNC_ACTIVATION_RUNBOOK.md`
  - controlled production sequence and rollback

These are prepared/tested repository assets. They are **not claimed as installed in the production Apps Script project**.

## Exact blocker

**The remaining blocker to D1 read cutover is Apps Script production actuation: restore/activate the Orders+Lines live-sync control path and install/activate the normalized live-sync source, then prove sustained <=180s freshness.**

D1 itself, Edge auth, Preview safety, stale-data fail-closed behavior, and isolated transaction rollback have already passed their respective gates.

## Production state remains unchanged

- Apps Script + Google Sheets remain authoritative writes.
- Cloud Write remains OFF.
- No production read cutover.
- No production D1 business-write cutover.
- Version 146 serving state is unchanged by this diagnostic lane.
- `Code.gs` was not replaced.
- CORE-P0 / `3536-01` remains paused.
