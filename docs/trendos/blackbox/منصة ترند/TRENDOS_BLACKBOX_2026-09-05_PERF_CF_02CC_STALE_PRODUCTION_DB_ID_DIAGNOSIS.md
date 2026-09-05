# TrendOS Black Box — PERF-CF-02CC Stale Production D1 ID Diagnosis

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Scope: TrendOS main platform -> Cloudflare only
Stage: `PERF-CF-02CC`
Status: **DIAGNOSIS / NO PRODUCTION CONTACT / ZERO-MUTATION**

## Executable evidence
After fixing the initial self-scan bug, workflow run `33964526089` / job `101302161434` still failed in `Hard read-only safety boundary`.

All live steps remained skipped:
- Worker health GET;
- Production D1 sqlite_master SELECT;
- post-query Worker health GET.

Therefore the failed run still made no Production D1 query from this diagnostic workflow.

## Root cause
The workflow hard-coded:
`EXPECTED_DB_ID=b6784934-3144-4c8d-b688-5c601c62885f`

Current branch Production config `cloudflare-d1/wrangler.toml` declares:
- binding: `DB`
- database_name: `trendos-main`
- database_id: `5c4b92bf-e043-4f6e-bd6d-d514a92cd825`
- `TRENDOS_CLOUD_WRITE_V1_ENABLED="false"`
- `TRENDOS_PRODUCTION_SHADOW_V2_ENABLED="true"`

The stale hard-coded database ID assertion caused the fail-closed exit.

## Correction rule
Do not replace one duplicated hard-coded Production DB ID with another duplicated copy. Derive the database ID from the checked-in `cloudflare-d1/wrangler.toml` after first asserting:
- D1 binding is exactly `DB`;
- database name is exactly `trendos-main`;
- Cloud Write flag is exactly OFF;
- Production Shadow V2 is ON;
- extracted database ID is a single valid UUID-like value.

Then use that derived ID for the SELECT-only Cloudflare D1 query.

## Safety boundary remains unchanged
- no DDL;
- no DML;
- no migration apply;
- no Worker deploy;
- no secret change;
- no Cloud Write enablement;
- no business-data read;
- no Apps Script/Sheets mutation;
- no cutover.

## Exact next step
Patch only the diagnostic workflow to derive the Production DB ID from the validated wrangler config, rerun the read-only probe, and classify the live Cloud Write schema blocker from executable evidence.
