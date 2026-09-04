# PERF-CF-02AY — Shadow Replay-Noop Runner CI PASS — 2026-09-04

## Result
PASS at PREPARED/CI-QUALIFIED level. The live Apps Script project has not yet executed the replay runner in this checkpoint.

## Starting state
02AX already proved one controlled synthetic row exists in the hidden live shadow sheet `__TRENDOS_CLOUD_WRITE_REHEARSAL` while live `الأوردرات` remained untouched.

Synthetic identity:
- ID: `CW-STAGE-33912472435`
- customer: `Staging Cloud Write Qualification`
- phone: `01001112233`
- status: `cloud-draft`
- updatedAt: `2026-09-04T19:42:14.653Z`

## Candidate already qualified
`apps-script/patches/CLOUD_WRITE_RECONCILE_REHEARSAL_V1.gs`

02AW CI previously proved the candidate is default-OFF, fixed-shadow-only, synthetic-only, schema-parity guarded, idempotent, and has exactly one possible appendRow path for a new synthetic ID.

## New live replay runner
Added:
`apps-script/patches/CLOUD_WRITE_RECONCILE_REHEARSAL_LIVE_RUNNER_V1.gs`

Public operator function:
`runTrendOSCloudWriteRehearsalReplayNoop()`

The runner:
- refuses to run if rehearsal is already enabled;
- refuses a pre-existing rehearsal secret;
- requires the fixed shadow sheet and live Orders sheet to be different;
- requires identical header fingerprints;
- requires exactly one existing shadow match at row 2 for `CW-STAGE-33912472435`;
- requires zero matching IDs in live `الأوردرات`;
- creates a separate ephemeral rehearsal secret internally;
- temporarily sets `TRENDOS_CLOUD_WRITE_REHEARSAL_ENABLED=1` and the ephemeral `TRENDOS_CLOUD_WRITE_REHEARSAL_SECRET`;
- invokes the qualified candidate only for the already-existing synthetic payload;
- requires candidate result `decision=replay_noop`, `idempotent=true`, `sheetsWritten=false`, `mutationCount=0`;
- verifies shadow and live Orders match counts and last-row values are unchanged after the candidate call;
- deletes both rehearsal properties in `finally`;
- refuses success if cleanup did not return rehearsal to OFF/no-secret state;
- never logs or returns the secret.

The runner itself contains zero Sheet mutation APIs.

## CI evidence
Workflow:
`.github/workflows/trendos-apps-script-cloud-write-rehearsal.yml`

New test:
`tests/apps_script_cloud_write_rehearsal_live_runner_v1.test.mjs`

Run:
`33915061592`

Job:
`101160203808`

Steps passed:
- Verify default-off isolated shadow Sheet rehearsal contract
- Verify live replay-noop runner safety contract
- Safety conclusion

Terminal workflow conclusion: SUCCESS.

## Current production impact
- Live `الأوردرات` mutation in this step: NONE.
- Shadow Sheet mutation in this step: NONE.
- Apps Script deployment in this step: NONE.
- Production Cloud Write enablement: NONE.
- Production D1 write: NONE.

## Exact remaining live gate
Install the candidate + runner source into the existing Apps Script project HEAD (no Web App deploy required), then run exactly once:
`runTrendOSCloudWriteRehearsalReplayNoop`

Expected log prefix:
`REHEARSAL_REPLAY_NOOP_PASS=`

Expected invariants:
- `decision=replay_noop`
- `idempotent=true`
- `sheetsWritten=false`
- `mutationCount=0`
- shadow matches before/after = 1
- production matches before/after = 0
- rehearsal enabled after = false
- rehearsal secret present after = false

Only after this live Apps Script runtime proof may the project design the separate Production Cloud Write preflight. This checkpoint does not authorize production Orders writes.
