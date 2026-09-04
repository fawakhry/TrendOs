# PERF-CF-02D — Sync Freshness Regression / Cutover Blocker

**Date:** 2026-09-04  
**Lane:** Performance / Cloudflare / D1  
**Status:** **SAFETY + IMPLEMENTATION PASS / PRODUCTION READ CUTOVER BLOCKED**

## Purpose

Preserve the latest verified state after re-running the Cloudflare Preview qualification and proving that the remaining blocker is no longer Edge latency, authentication, rollback, or Preview safety. The blocker is live D1 freshness: the existing Orders/Lines live sync is not advancing, and the normalized Customer Manager live sync is prepared and tested but not installed in the production Apps Script project.

This checkpoint supersedes earlier freshness observations only where the newer runtime evidence conflicts with them. Earlier PERF-CF-02B PASS evidence remains valid historical evidence and must not be deleted.

## Expected

Before any production read cutover:

1. Preview Worker deploys with Cloud Write OFF and no D1 migration side effect.
2. Anonymous Edge access fails closed.
3. Signed Edge auth succeeds.
4. Stale normalized data returns `503 stale-edge-data` with Apps Script fallback instead of serving stale D1 data.
5. Cloud Write mutation routes remain disabled/fail-closed.
6. Normalized import remains unavailable on Preview because Preview has no migration secret.
7. Orders + Lines mirror remains synchronized and no older than 180 seconds.
8. `customers / orders / messages / conversations` normalized entities remain no older than 180 seconds before Customer Manager Edge reads are eligible.
9. No production read cutover occurs until the above stays true across sustained observation windows.

## Implementation / isolated test evidence

### Cloud Write transaction contract

The real Cloud Write handler/SQL was exercised against an isolated SQLite/D1-compatible database.

Verified:

- successful write path = PASS;
- idempotency replay = PASS;
- injected mid-transaction failure = full rollback PASS;
- no partial Order/Event/Outbox rows remain after failure.

Current CI output:

`Cloud Write SQLite integration: SUCCESS + IDEMPOTENCY + ROLLBACK PASS`

Cloud Write remains disabled in Preview and is not authoritative.

### Normalized import / live-sync contract

Prepared Apps Script source:

`cloudflare-d1/D1_Normalized_Live_Sync.gs`

Blob at the verified working-branch state:

`a4ca3139f63c79dad17cf243ddebda8ca786e857`

The file is explicitly `PREPARED / NOT PRODUCTION DEPLOYED`.

Verified isolated contract:

- migration-secret auth = PASS;
- invalid source row = HTTP 422 fail-closed;
- non-final chunk cannot advance freshness = PASS;
- only successful final chunk advances freshness = PASS;
- final transaction failure rolls back rows + freshness = PASS;
- Apps Script live-sync source remains source-sheet read-only = PASS;
- short lease/claim is used instead of holding ScriptLock during network I/O = PASS.

CI output:

`Normalized Import V1: AUTH + INVALID-ROW FAIL-CLOSED + FINAL-FRESHNESS + ROLLBACK + LIVE-SYNC CONTRACT PASS`

Isolated workflow evidence:

- workflow: `TrendOS Normalized Import Isolated`
- run: `33823392027`
- job: `100870737019`
- head: `dfcb02e73345bb7c9633025552362c7a0da685f4`
- conclusion: **SUCCESS**

Integrity regression at the same head:

- run: `33823392075`
- job: `100870737418`
- conclusion: **SUCCESS**

## Live source compatibility read-only check

Production workbook source was inspected read-only.

- `الأوردرات`: 274 rows including header = 273 data rows.
- All 273 data rows in the Order-ID column have an Order ID.
- `مدير العملاء - الرسائل`: 4 data rows; all inspected rows have required message ID + phone.
- `مدير العملاء - المحادثات`: 1 data row with phone.

Conclusion: the current source snapshot is compatible with the fail-closed normalized import contract. The 422 protection is a future corruption guard, not a blocker caused by the currently inspected source rows.

## Latest Preview re-run

Original workflow run re-run:

- workflow: `TrendOS Cloudflare Auto Preview`
- run: `33823513215`
- re-run job: `100872694728`
- checked-out Cloudflare code head: `794a94af3fce734385d47a08f5ed6235b5383126`
- Preview Worker: `trendos-edge-gateway-preview`
- Preview Version ID: `dc70bcd3-dba6-40ca-b022-275768870b0d`
- job conclusion: **FAIL**, with the only material gate failure at `Gate Orders and Lines mirror freshness`.

### PASS gates before the freshness failure

- pre-deploy Edge/Cloud Write/normalized import/mirror safety tests = PASS;
- required Cloudflare deploy secrets present = PASS;
- Preview workflow has no D1 migration apply = PASS;
- Cloud Write config OFF = PASS;
- Preview deployment = PASS;
- `/v1/edge/health` = HTTP 200;
- anonymous `/v1/edge/whoami` = HTTP 401;
- signed Preview token / whoami = PASS;
- stale normalized data fail-closed contract = PASS;
- incomplete Edge session credentials fail before upstream = PASS;
- `/v1/cloud/write/health` proves writes OFF = PASS;
- `POST /v1/cloud/orders` while OFF = HTTP 423 = PASS;
- `POST /v1/import/batch` without migration secret = HTTP 401 and `schemaMutationFree=true` = PASS;
- mirror stats SELECT-only = PASS;
- atomic mirror capability = PASS;
- anonymous mirror import blocked before schema initialization = PASS;
- benchmark = PASS.

## Latest normalized freshness evidence

At approximately `2026-09-04T01:00Z`, Preview Edge health reported:

| Entity | Last imported | Age seconds | Fresh <=180s |
|---|---|---:|---|
| customers | `2026-08-27 19:31:21` | 624537 | false |
| orders | `2026-08-27 19:28:26` | 624712 | false |
| messages | `2026-08-29 10:55:34` | 482684 | false |
| conversations | `2026-08-29 12:53:15` | 475623 | false |

`staleEntities = [customers, orders, messages, conversations]`

The signed Edge Customer Manager path correctly refused to serve these rows and returned the Apps Script fallback contract.

## Latest Orders mirror evidence

At the final freshness gate:

- sheet: `الأوردرات`
- rowCount: `274`
- sourceLastRow: `274`
- sourceLastCol: `67`
- status: `ready`
- note: `TrendOS orders live sync V1`
- syncedAt: `2026-09-04 00:27:55`
- ageSeconds: `1958` (~32m38s)
- rowParitySelf: `true`
- liveSyncNote: `true`
- fresh: `false`

This is stronger evidence than the earlier temporary PERF-CF-02B recovery. The live mirror stopped advancing after `00:27:55` and remained stale across the later rerun.

The workflow throws on Orders first, so this rerun did not claim Lines fresh after Orders failed.

## Latest Preview benchmark

15 samples each:

### Edge health

- average: `380.0 ms`
- median: `376.6 ms`
- p90: `420.6 ms`
- max: `426.6 ms`

### D1 mirror Orders read

- average: `351.6 ms`
- median: `346.9 ms`
- p90: `375.3 ms`
- max: `427.9 ms`

Conclusion: Edge/D1 read latency is fast relative to the earlier Apps Script baseline. Freshness, not Edge read latency, is the immediate cutover blocker.

## Current diagnosis

**PASS:** Edge implementation, auth, stale-data fallback, Preview safety, Cloud Write kill switch, Cloud Write transaction rollback, normalized import transaction/freshness contract, mirror read capability, and Edge latency.

**FAIL / BLOCKER:** production-fed D1 freshness.

Two distinct runtime gaps remain:

1. Existing Orders/Lines live-sync path is not advancing the live mirror; last verified Orders sync is `2026-09-04 00:27:55`.
2. Normalized `customers / orders / messages / conversations` data has no continuous production live-sync installed yet; `D1_Normalized_Live_Sync.gs` is prepared/tested only.

## Production impact of this checkpoint

- No production read traffic cutover.
- No Cloud Write enablement.
- No authoritative D1 business writes.
- No `config.js` or GitHub Pages production cutover.
- No source Sheet mutation from this PERF-CF-02D work.
- No CORE-P0 / `3536-01` remediation resumed.
- No production Apps Script source-project file was installed by the current tool environment.

Production remains on Apps Script Version 146 with the existing rollback lineage. Sheets + Apps Script remain the authoritative write path.

## Apps Script tooling boundary

The connected tool environment can operate GitHub, Cloudflare-through-GitHub, and Google Sheets/Drive reads/writes, but does not expose direct source-project editing for the production Google Apps Script project.

A Drive search for a writable Apps Script project resource did not resolve the TrendOS Apps Script project.

Per the existing production rules, `سكريبت Apps Script` Sheet must **not** be used as a substitute deployment source, and GitHub `Code.gs` must never be blindly pushed over the consolidated production source.

Therefore no false production installation is claimed here.

## Exact next production gate

Use `docs/trendos/PERF_CF_02D_APPS_SCRIPT_SYNC_ACTIVATION_RUNBOOK.md` when an Apps Script source-capable execution path is available.

Required order:

1. Capture current Orders live-sync status and trigger inventory.
2. Restore/verify `d1OrdersLiveSyncTick` so Orders + Lines both advance atomically.
3. Add **only** the new `D1_Normalized_Live_Sync.gs` file to the Apps Script project; do not replace `Code.gs`.
4. Start normalized sync using its fail-closed first-run gate.
5. Verify exactly one Orders trigger and exactly one normalized trigger.
6. Re-run Preview qualification.
7. Require Orders + Lines <=180s freshness and all four normalized entities <=180s.
8. Require sustained freshness across multiple observation windows before any production read cutover.

## Rollback

If normalized activation fails or becomes unstable:

`stopD1NormalizedLiveSync()`

If a corrective Orders live-sync activation becomes unsafe:

`stopD1OrdersLiveSync()`

These controls stop mirror synchronization only; they do not delete source data. Production Apps Script/Sheets continue as authority and no Cloud Write cutover is involved.

## Exact stopping point

**PERF-CF-02D — Cloudflare/Edge safety PASS; production D1 freshness FAIL; Orders mirror frozen at 00:27:55; normalized live sync prepared/tested but not production-installed; no read/write cutover.**
