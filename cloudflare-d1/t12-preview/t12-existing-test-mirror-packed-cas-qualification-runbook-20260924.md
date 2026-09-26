# TrendOS T12 — EXISTING TEST mirror small CAS qualification, PREPARED ONLY

**Status:** GitHub-only source candidate. No TEST/PROD SQL, Worker route/deploy,
D1 batch or CI run was performed when preparing this file. This is NOT a
production mirror recovery and NOT full 142-row packed-CAS qualification.

**Exact target if separately authorized later:** existing Cloudflare D1 TEST
`trendos-t12-synthetic-test`, UUID
`54a3c05e-cde9-4979-814f-d40f941edcd5`. Never `trendos-main`.
Current owner screenshots: Entries 317, 320, 325 prove count 2/4/0/2/2,
fabricated row contents, and synthetic catalog metadata at separate moments.
The earlier composite WITH/CASE query returned a Cloudflare UI malformed-request
error; do not record it as a PASS, rerun it, or infer database corruption.

## Scope and existing code

Source module:
`cloudflare-d1/t12-preview/t12-existing-test-mirror-packed-cas-qualification-isolated-20260924.mjs`.

The former isolated 128/142 planner/batch + unchanged-row guards remain historical
local SQLite design/proof, NOT Cloudflare D1 validation. The existing TEST Worker
serves synthetic Order CREATE only, and is not a deployed mirror batch executor.
This new tiny two-tab source prepares fixed synthetic statements and **never
calls db.batch()**. Merely passing a claimed UUID into code cannot independently
attest the actual Cloudflare binding or account. A separate review must establish
account, exact TEST UUID, current binding, deployed code/flags and external writers
before any later test-only execution; do not create another DB or Worker.

## Candidate sequence — separate later approval required for each mutation

1. Test-only executor: exact known TEST binding, default OFF, authenticated and
   narrowly scoped; no production route, DB, credentials or Google/Apps Script.
   Independently confirm UUID/resource through Cloudflare before enable/deploy;
   verify current snapshot without repeating old schema/index/local tests.
2. Negative scenario first: one **single** D1Database.batch invocation containing
   2 full-preimage catalog guards, a deliberate synthetic line-row conflict,
   then CAS on order row 2 and line row 2. Failure of final CAS must cause rollback
   of both the artificial conflict and the earlier order CAS; if outcome unknown,
   STOP and use SELECT-only reconciliation. Never paste statements individually
   in SQL Console. Guard errors are intentional only inside the approved batch.
3. Independent SELECT-only postflight: exactly two catalog rows, four row records,
   zero migration runs and all four old fabricated row payloads unchanged. If
   mismatch or ambiguity: STOP, no cleanup or retry.
4. Positive scenario is **separately authorized** after successful negative
   rollback and a new baseline read; one D1 batch must change only row 2
   values/display on BOTH fake tabs OLD -> NEW, leaving the two header rows,
   `formulas_json`, catalog metadata, old `t12_synth_*` and `_cf_KV` intact.
   Read-only postflight must verify both NEW row payloads and unchanged headers
   and catalog, and absence of partial commit.
5. Record real observed receipts, counts/content and any errors in Journal/Book/
   Handoff before deciding on any wider 142-row, large-payload, quota, concurrency,
   writer-fence or source-to-deployed-parity qualification. Do not infer such
   qualification from this 2-row miniature.

## Hard STOP conditions

No proof of real bound TEST UUID, unexpected baseline change, runtime limit,
response loss, ambiguous batch outcome, unexpected write, guard mismatch, any
production binding/deployed parity uncertainty, or missing explicit owner consent.
No retries of unknown SQL outcome. No R4/R5/V2 Tick, no cloud CREATE transfer,
no Apps Script/Google Sheets/Properties/Triggers/Worker production deployment,
no new DB/schema/index and no writes to six existing legacy test tables.

**Preparation result only:** The GitHub source exists; TEST real D1 CAS and
transactional rollback are NOT_RUN, production D1 mirror NOT_RESTORED, Google
Sheets/Apps Script retain real business CREATE and numbering authority.


## Local SQLite contract gate — 2026-09-26

A repository test now exists at
`tests/t12_existing_test_mirror_tiny_cas_contract_isolated_v1.test.mjs`
(Git blob `943567db81bcdee12b4afbbdc7fd62f086f309ca`).
It was executed locally against the exact current candidate source blob
`aad845188c35bc8f1f18a4d9b7e9cf7ea7c0380d` and exact mirror schema blob
`1857534062b93eb24adbacdf7d3234bcaae69384` using Node v22.16.0
with `--experimental-sqlite`. Result: **PASS 6/6, exit 0**.

Covered locally: negative rollback, positive two-tab atomic mock commit,
row-preimage drift abort, catalog drift abort, lost response after commit with
blind replay failing closed, and invalid scenario rejection. This does **not**
authorize or prove real Cloudflare D1 behavior. No CI was run and no TEST
executor/route/Worker exists from this step. The separate-approval sequence
below remains unchanged: real TEST identity/binding proof → negative one-batch
execution → read-only rollback postflight → separate positive approval.


## Real Cloudflare TEST negative qualification — PASS / 2026-09-26

GitHub Actions run `36236179021`, job `108388228705`, used Wrangler 4.141.0 with local Worker execution and a remote binding to the independently verified TEST D1 UUID `54a3c05e-cde9-4979-814f-d40f941edcd5`. No Worker deployment occurred. Remote preflight was exact `2/4/0` with control=1, exact catalog=2 and exact mirror rows=4. One negative POST only returned HTTP 200 and `negativeRollbackVerified=true`; the separate read-only postflight returned the identical exact baseline. Marker: `REAL_TEST_NEGATIVE_ROLLBACK_PASS`.

The earlier run `36236017624` is not a D1 test result: Wrangler 4.33.2 treated the D1 binding as local, preflight returned 503 and no negative POST was sent. Do not repeat either run. The next gate remains a **separate owner approval** for a fresh-baseline, tiny positive TEST batch. This PASS does not qualify the 142-position payload or production recovery.
