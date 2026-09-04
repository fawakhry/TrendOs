# PERF-CF-02AW — Cloud Write Shadow Rehearsal Candidate CI PASS — 2026-09-04

## Result
PASS at PREPARED/CI-QUALIFIED level only. No live Apps Script deployment and no Google Sheet mutation occurred.

Following the live 02AV Staging D1 -> Apps Script dry-run PASS, a fail-closed controlled write-rehearsal candidate was prepared to prove the final write mechanics without allowing the live `الأوردرات` sheet to become a target.

## Prepared source
`apps-script/patches/CLOUD_WRITE_RECONCILE_REHEARSAL_V1.gs`

Fixed shadow target:
`__TRENDOS_CLOUD_WRITE_REHEARSAL`

Required future activation properties:
- `TRENDOS_CLOUD_WRITE_REHEARSAL_ENABLED=1`
- `TRENDOS_CLOUD_WRITE_REHEARSAL_SECRET=<separate rehearsal secret>`

Default state is OFF.

## Safety contract
The candidate:
- accepts `order` + `upsert_order_to_sheets` only;
- accepts `CW-STAGE-*` IDs only;
- requires exact synthetic identity `Staging Cloud Write Qualification` + `01001112233` + `_cloudWriteV1=true`;
- reads the live Orders headers only for schema fingerprint comparison;
- can target only the fixed pre-existing shadow sheet `__TRENDOS_CLOUD_WRITE_REHEARSAL`;
- refuses any target equal to the live Orders sheet;
- never creates a sheet;
- requires shadow headers to match live Orders headers exactly by SHA-256 fingerprint;
- rejects duplicate rehearsal IDs;
- rejects conflicting replay;
- identical replay is a no-op;
- the only candidate mutation is one `appendRow` for a new synthetic ID on the fixed shadow sheet;
- never updates or deletes a row;
- uses ScriptLock and rechecks the ID immediately before append to fail closed on a race.

## CI evidence
Workflow:
`.github/workflows/trendos-apps-script-cloud-write-rehearsal.yml`

Test:
`tests/apps_script_cloud_write_reconcile_rehearsal_v1.test.mjs`

Run/job:
- run `33913303809`
- job `101154613905`

Terminal result:
`Apps Script Cloud Write Rehearsal V1: DEFAULT-OFF + FIXED SHADOW TARGET + SYNTHETIC-ONLY + SCHEMA PARITY + IDEMPOTENT APPEND + NO PROD MUTATION PASS`

Verified cases:
- default OFF fails before Sheet access;
- wrong secret fails before Sheet access;
- non-stage ID rejected;
- non-synthetic payload rejected;
- missing shadow sheet rejected and not created;
- schema drift rejected;
- first valid synthetic order appends exactly once to shadow;
- Production Orders mutation trap remains zero;
- identical replay returns `replay_noop` with zero mutation;
- conflicting replay rejected with zero mutation;
- duplicate shadow ID rejected.

## Current production impact
NONE.

The source is not installed in live Apps Script, the shadow sheet has not been created, the rehearsal flag has not been enabled, and Production Cloud Write remains OFF.

## Next exact gate
Do not run the write rehearsal yet.

Before any live Sheet mutation, prepare the explicit operator-controlled rehearsal setup/cleanup procedure and verify the live workbook can host a dedicated shadow sheet with headers copied from `الأوردرات` without affecting any business flow. Only after explicit approval should the fixed shadow sheet be created and one synthetic append be attempted.
