# Tasks V3 T1.5 D1 Read Replica — 30-Sample Qualification PASS — 2026-09-16

## Scope
Read-only qualification of the deployed isolated T1.5 Worker after canonical Cloudflare reconcile.

- T1 source Worker: `trendos-tasks-v3-t1-preview-20260914`
- T1.5 read replica Worker: `trendos-tasks-v3-t15-preview-20260915`
- T1.5 D1: `trendos-tasks-v3-t15-preview-20260915`
- D1 database id: `4c4d48f2-8c5d-45f2-9d41-c426c17ed93c`
- Snapshot key/operator: `wael-preview`
- Snapshot version observed: `TASKS_V3_T15_D1_SERVICE_BINDING_CANONICAL_1`
- Max snapshot age: `180s`

## Read-path qualification
GitHub Actions historical read-probe run: `34971958555`.
The existing read-only probe was re-run repeatedly; each attempt performs one `health` and one `status` POST against the deployed T1.5 Worker.

### Result
- Successful read samples: **30 / 30**
- HTTP failures: **0**
- Transport failures: **0**
- `upstream;dur`: **0.00ms on all 30 samples**
- Replica source: `D1_READ_REPLICA`
- Authoritative source reported: `SHEETS`

### Worker/D1 Server-Timing samples (ms)
`147, 140, 98, 112, 160, 152, 118, 84, 169, 157, 128, 109, 148, 133, 84, 110, 142, 133, 184, 173, 104, 115, 167, 156, 143, 142, 109, 119, 92, 109`

Nearest-rank summary:
- p50: **133ms**
- p95: **173ms**
- min: **84ms**
- max: **184ms**

Acceptance target was p95 <= 2000ms. Result: **PASS**.

## Scheduled refresh continuity
The qualification also crossed the replica age boundary and observed successful Cron refreshes instead of stale failure.

Observed sequence included:
- `refreshedAt=1789569170`, age reached `175s`
- next probe observed `refreshedAt=1789569350`, age reset to `18s`
- later probe observed `refreshedAt=1789569410`, age reset to `12s`

This confirms the deployed scheduled refresh is actively renewing the D1 snapshot during the qualification window.

## Architecture confirmed
Request read path:
`client -> isolated T1.5 Worker -> isolated D1 snapshot`

Refresh path:
`Cron -> isolated T1.5 Worker -> Service Binding -> isolated T1 source Worker -> existing read-only upstream -> D1 snapshot write`

The request read path does **not** synchronously call the upstream source.

## Safety / authority
- No Production Worker mutation.
- No Production D1 mutation.
- No Main Apps Script Production deployment.
- No secret rotation/change.
- No Task mutation.
- No `claimNext`.
- No `completeTask`.
- Sheets/Apps Script remain business-write authority.
- T2/T3 remain locked pending explicit owner approval.
- Gaber Material Control untouched.
- RP-08 untouched.

## Conclusion
T1.5 isolated D1 read-replica qualification is **PASS** for the 30-sample read-only latency gate.

Next owner-gated step: review the PASS checkpoint and decide whether to authorize the next Tasks V3 phase. Do not advance mutation authority automatically.
