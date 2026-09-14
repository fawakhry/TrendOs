# TrendOS Tasks V3 — T1 Preview Candidate Branch Start — 2026-09-14

## Step

Create an isolated branch for branch-only Tasks V3 T1 Worker preview adapter qualification.

## Result

**PASS**

## Branch / base

- Candidate branch: `tasks-v3-t1-preview-candidate-20260914`
- Base checkpoint: `81fd46ac3d1c4a8797cce18a8de1f15df50eca8b`
- Base document: `docs/trendos/blackbox/TASKS_V3_T1_T2_READINESS_2026-09-14.md`

## Scope locked for this candidate

Branch-only implementation and CI qualification of a Tasks V3 read-only Worker preview adapter.

Required properties:

1. dedicated upstream binding `TASKS_V3_APPS_SCRIPT_URL`;
2. read-only operations only: `health`, `status`, `flyPrint`, `pressCandidates`;
3. Wael-only preview/canary capability gate;
4. HMAC assertion compatible with `TRENDOS_TASKS_V3_READONLY_1`;
5. bounded timeout and fail-closed behavior;
6. no fallback to main `APPS_SCRIPT_API_URL` or Operator Task V2;
7. no `claimNext` route;
8. no `completeTask` route;
9. no production entrypoint wiring;
10. no production deployment.

## Mutation ledger

- Production mutation: **NO**
- Apps Script deployment: **NO**
- Worker deployment: **NO**
- Business data mutation: **NO**
- `claimNext`: **ZERO**
- `completeTask`: **ZERO**
- Secret change/rotation: **NO**
- Gaber Material Control change: **NO**
- D1 write authority transfer: **NO**
- RP-08: **NO**
- Rollback: **N/A**

## Exact next step

Implement the branch-only preview adapter source, contract tests, and a no-secret CI workflow; then run qualification and record Run ID / Job ID / commit SHA.
