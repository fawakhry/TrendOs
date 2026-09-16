# TrendOS Tasks V3 — T2 handoff after Apps Script Version 4 — 2026-09-16

## Current branch
`tasks-v3-t2-readonly-wael-canary-20260916`

## T1.5 accepted baseline
Previous T1.5 D1 read replica qualification passed and is the predecessor baseline:
- 30/30 read samples PASS
- p50 133ms
- p95 173ms
- upstream 0ms on all samples
- Cron refresh confirmed
- Blackbox qualification commit: `8ebc63f8a50a4be9d8e1392eafe8f4792bce83bc`

## T2 Git state
Important branch commits from the T2 preparation:
- `b914ab5595c54180e3413fd9e0a78fa6d173e7fd`
- `c2f7d9e63aff6720e33f260b1bbd3a09974b292e`

Current T2 bridge source:
`tasks-v3-bridge-readonly.gs`

Current source version constant:
`TASKS_V3_READONLY_T2_WAEL_CANARY_2`

T2 source behavior verified from branch source:
- one configured Wael operator canary only
- role must be `WAEL`
- signed POST using existing `TASKS_V3_SHARED_SECRET`
- operations only: `health`, `status`, `flyPrint`, `pressCandidates`
- no claim/complete routes
- no sheet/schema writes
- no full 92-column source scan
- narrow production reads only from columns A, E, F, J, K, M, R, AG, AS of `بنود الأوردرات`
- terminal statuses blocked: `تم التسليم`, `ملغى`, `مكرر`
- `activeTask` is null in T2 status; this phase is read-only view only

## Isolated Apps Script project
Project ID:
`1F7_z6csPm4Q6Sx-HV59SNDbShqzVcMXfsauZFakLFH_caEYpiCHjTOGV`

This is the separate Tasks V3 project, not the main TrendOS Apps Script project.

Existing T1 deployment was preserved. T2 was created as a NEW deployment, not an edit of T1.

T2 deployment:
- Apps Script Version: **4**
- Deployment ID: `AKfycbzo6zcypF7mhECUrfqkP4u0NuzrV373vUQjLMk4o-TMbe4TyV93WkPnrsmeKVHSgCH1Bg`
- Web App URL: `https://script.google.com/macros/s/AKfycbzo6zcypF7mhECUrfqkP4u0NuzrV373vUQjLMk4o-TMbe4TyV93WkPnrsmeKVHSgCH1Bg/exec`

T2 script properties added while preserving existing properties:
- `TASKS_V3_T2_SPREADSHEET_ID` = production spreadsheet ID
- `TASKS_V3_T2_CANARY_OPERATOR` = `وائل`

Do NOT expose, read, copy, change, or rotate `TASKS_V3_SHARED_SECRET`.
Do NOT change the existing T1 properties/deployment.

## Production spreadsheet
Title:
`TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`

Spreadsheet ID:
`1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`

T2 reads production data only. No production spreadsheet writes are allowed in T2.

## Apps Script preflight results
Direct isolated Apps Script preflight completed before Cloudflare wiring.

Observed execution log:
- `T2_HEALTH_PREFLIGHT`: `success=true`, `version=TASKS_V3_READONLY_T2_WAEL_CANARY_2`, `readOnly=true`, elapsed about **1083ms**
- `T2_STATUS_PREFLIGHT`: `success=true`, `operator=وائل`, `role=WAEL`, `readOnly=true`, `flyPrintCount=0`, `pressCandidatesCount=13`, elapsed about **6903ms**

These are Apps Script preflight timings, not the final T2 acceptance latency measurement.

A plain browser GET to the Web App showed an Error page; this is not used as an acceptance test because the bridge contract is signed POST-only.

Blackbox commits already recorded during this stage:
- Apps Script preflight checkpoint: `06555898d0845a4d072d421e1de4d82ce61bfc99`
- T2 deployment ID / Web App URL checkpoint: `c2ae898f37c0af54ff4ef069a85a4eb88207b399`

## Safety boundaries — still locked
- T2 is read-only only.
- No `claimNext`.
- No `completeTask`.
- No Task mutation.
- No transfer of business-write authority.
- Sheets / Apps Script remain business-write authority.
- Do not touch Main TrendOS Apps Script production deployment.
- Do not change/rotate `EDGE_SESSION_SECRET`.
- Do not change/rotate `TRENDOS_OPERATOR_TASK_PROXY_SECRET`.
- Do not change/rotate `TASKS_V3_SHARED_SECRET`.
- Do not enable Gaber Material Control.
- Do not start RP-08.
- Do not merge to `main` as part of T2 qualification.
- T3 remains locked pending a new explicit owner approval after T2 acceptance.

## Exact next stage
Continue from Cloudflare / Worker wiring and T2 qualification only.

Before any Cloudflare mutation, inspect the current Cloudflare UI/state and verify the safest isolated T2 topology. Prefer a separate isolated T2 Worker if practical. Do not touch `trendos-main` or production routes. Do not assume a UI button exists; use the labels actually visible in the current Cloudflare UI.

The T2 Worker must:
- accept browser/test POST only for the four read operations
- enforce WAEL-only canary
- generate the same HMAC assertion protocol expected by Apps Script
- use the existing Tasks V3 shared secret without revealing/changing it
- point only to the new T2 Apps Script Web App URL above
- have no mutation routes or fallback to Tasks V2/main Apps Script
- remain isolated from production frontend routes during qualification

Then run T2 read-only qualification, minimum 30 samples, recording:
- success count
- HTTP/transport failures
- p50
- p95
- max
- upstream timing
- operation mix (`health`, `status`, `flyPrint`, `pressCandidates`)

Acceptance target before any future mutation discussion: p95 <= 2 seconds under normal canary conditions, no Task mutations, and no regression/mutation of the main platform.

Stop after T2 qualification. T3 requires a separate explicit owner approval.
