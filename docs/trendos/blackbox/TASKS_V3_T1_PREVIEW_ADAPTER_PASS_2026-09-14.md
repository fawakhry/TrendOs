# TrendOS Tasks V3 — T1 Preview Adapter PASS — 2026-09-14

## Result

**PASS — BRANCH-ONLY / NO PRODUCTION DEPLOYMENT**

## Branch

`tasks-v3-t1-preview-candidate-20260914`

## Base / branch-start evidence

- Readiness base: `81fd46ac3d1c4a8797cce18a8de1f15df50eca8b`
- Candidate branch start checkpoint commit observed on GitHub: `f6aa5803151a059ee9c730dd2f4b9d6334d42a3e`
- Start checkpoint: `docs/trendos/blackbox/TASKS_V3_T1_CANDIDATE_BRANCH_START_2026-09-14.md`

## Candidate commits

- Worker preview adapter: `da05a6273cf1fc4c9b1eb3dc41e839ec36372e9c`
- Adapter contract tests: `d7c860ba6b4d6e87fd8f526363a0cc627ce42282`
- CI workflow: `7488adf812ea083afd890d5da2140bc2c1b6e1f6`

## Candidate files

- `cloudflare-d1/src/tasks-v3-readonly-preview.mjs`
- `tests/tasks_v3_worker_preview_contract.test.mjs`
- `.github/workflows/trendos-tasks-v3-t1-preview-contract.yml`

## Qualified contract

The branch-only adapter:

- uses only dedicated `TASKS_V3_APPS_SCRIPT_URL` as upstream;
- uses only dedicated `TASKS_V3_SHARED_SECRET` for V3 assertion signing;
- implements protocol `TRENDOS_TASKS_V3_READONLY_1`;
- permits only `health`, `status`, `flyPrint`, `pressCandidates`;
- enforces `WAEL` only in the preview adapter;
- requires a non-empty operator identity;
- signs canonical assertion payload with HMAC-SHA256;
- uses a bounded upstream timeout capped at 5000 ms;
- performs one upstream POST only;
- fails closed on missing configuration, forbidden role/op, HTTP failure, invalid JSON, network error, or timeout;
- has no legacy Operator Task V2 route fallback;
- has no main `APPS_SCRIPT_API_URL` fallback;
- has no `claimNext` route;
- has no `completeTask` route;
- is not imported by production `cloudflare-d1/src/index.js` or `index_v2.js`.

## GitHub Actions qualification

Workflow:
`TrendOS Tasks V3 T1 Preview Contract`

Run ID:
`34865035497`

Job ID:
`104046613564`

Qualified head:
`7488adf812ea083afd890d5da2140bc2c1b6e1f6`

Run / Job result:
**SUCCESS**

Successful gates:

1. Checkout candidate — PASS
2. Node 22 setup — PASS
3. Verify no production entrypoint wiring — PASS
4. Tasks V3 T0 bridge contract — PASS
5. Tasks V3 T1 preview adapter contract — PASS
6. Qualification markers — PASS
7. Runner cleanup — PASS

Markers emitted by the workflow:

- `TASKS_V3_T1_PREVIEW_CONTRACT=PASS`
- `PRODUCTION_DEPLOYMENT=NO`
- `TASK_MUTATION=NO`
- `SECRET_CHANGE=NO`

## Production mutation ledger

- Production frontend mutation: **NO**
- Production Worker deployment: **NO**
- Production Worker entrypoint wiring: **NO**
- Apps Script Production deployment: **NO**
- Apps Script project provisioning: **NO**
- Script Properties mutation: **NO**
- Business data mutation: **NO**
- `claimNext`: **ZERO**
- `completeTask`: **ZERO**
- `EDGE_SESSION_SECRET` change/rotation: **NO**
- `TRENDOS_OPERATOR_TASK_PROXY_SECRET` change/rotation: **NO**
- Gaber Material Control change: **NO**
- D1 business-write authority transfer: **NO**
- RP-08: **NO**
- Rollback required: **NO / N/A**

## Current state

- T0 isolated read-only bridge contract: **PASS / COMPLETE**
- T1 branch-only Worker preview adapter contract: **PASS / COMPLETE**
- T1 isolated Apps Script runtime + preview fixture: **NOT YET PROVISIONED**
- T1 live preview latency qualification: **NOT RUN**
- T2 production read-only Wael canary: **NOT STARTED**
- T3 mutation canary: **LOCKED — explicit owner approval required**

## Exact next safe step

Provision the isolated T1 runtime only after an owner-authorized Google action:

1. create a separate Apps Script project for Tasks V3;
2. deploy a separate Web App containing `tasks-v3-bridge-readonly.gs` only;
3. configure its own `TASKS_V3_SPREADSHEET_ID` and `TASKS_V3_SHARED_SECRET` without rotating or changing any existing TrendOS secret;
4. point it to a non-production/preview index+ledger fixture;
5. bind the preview Worker adapter to that separate URL as `TASKS_V3_APPS_SCRIPT_URL` in a non-production preview environment;
6. run contract + latency qualification;
7. record deployment identity, Run/Job IDs, p50/p95, and prove the main production Apps Script is unaffected.

No T2 production read-only canary should begin until the isolated T1 runtime passes.
