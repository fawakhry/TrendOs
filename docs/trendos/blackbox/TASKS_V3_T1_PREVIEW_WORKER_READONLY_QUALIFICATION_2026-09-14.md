# TrendOS Tasks V3 — T1 Preview Worker Read-Only Qualification — 2026-09-14

## Result

**FAIL — PREVIEW WORKER FUNCTIONALLY CORRECT ON SUCCESSFUL CALLS, BUT RELIABILITY/LATENCY QUALIFICATION DID NOT PASS**

## Branch and source

- Branch: `tasks-v3-t1-preview-candidate-20260914`
- Preview build trigger head: `f8ccd0ee2094fbce82358617a64f8997ba98c12d`
- Read-only module: `cloudflare-d1/src/tasks-v3-readonly-preview.mjs`
- Preview-only entrypoint: `cloudflare-d1/src/tasks-v3-t1-preview-worker.mjs`
- Preview-only Wrangler config: `cloudflare-d1/wrangler.tasks-v3-t1-preview.toml`

## Isolated Cloudflare Worker

- Worker name: `trendos-tasks-v3-t1-preview-20260914`
- Version prefix: `7ce70995`
- Version ID: `7ce70995-20f6-4503-a188-966f1c8a1c5c`
- Preview Worker URL: `https://7ce70995-trendos-tasks-v3-t1-preview-20260914.trendmall-contact.workers.dev`
- Preview branch: `tasks-v3-t1-preview-candidate-20260914`
- Preview URLs: enabled
- Production/custom route: none
- Active deployment remained `713d75b8`; the T1 candidate was uploaded as a versioned Preview and was not promoted.

## Runtime configuration

- `TASKS_V3_APPS_SCRIPT_URL`: configured to the standalone T1 Apps Script Web App.
- `TASKS_V3_SHARED_SECRET`: entered manually as an encrypted Cloudflare Secret.
- Secret value: **NOT READ / NOT RECORDED / NOT LOGGED / NOT CHANGED**
- `APPS_SCRIPT_API_URL`: **NOT USED**

## Test method

- HTTP method: POST
- Operator: `wael-preview`
- Role: `WAEL`
- Allowed operations only: `health`, `status`, `flyPrint`, `pressCandidates`
- Samples: 20 per operation / 80 total
- Measurement: end-to-end PowerShell stopwatch latency
- Mutation operations executed: zero

## Aggregate qualification

- Total calls: **80**
- Correct calls: **76**
- Correctness: **95%**
- Overall p50: **2668 ms**
- Overall p95: **5007 ms**
- Qualification: **FAIL**

## Per-operation results

| Operation | Correct / Runs | Correctness | p50 | p95 | Result |
|---|---:|---:|---:|---:|---|
| `health` | 19 / 20 | 95% | 2186 ms | 4258 ms | FAIL |
| `status` | 20 / 20 | 100% | 3384 ms | 4612 ms | PASS |
| `flyPrint` | 17 / 20 | 85% | 2685 ms | 5736 ms | FAIL |
| `pressCandidates` | 20 / 20 | 100% | 2552 ms | 3676 ms | PASS |

## Response summaries

### `health`

Successful responses reported:

- `success=true`
- version `TASKS_V3_READONLY_T0`
- `spreadsheetConfigured=true`
- `indexReady=true`
- `ledgerReady=true`
- `readOnly=true`

Failure count: **1**

Captured failure: HTTP 400 from the Preview Worker. The PowerShell harness did not capture the error response body.

### `status`

All 20 calls passed.

Successful response reported:

- operator `wael-preview`
- role `WAEL`
- active task `PREVIEW-TASK-001`
- active line `PREVIEW-LINE-001`
- active order `PREVIEW-ORDER-001`
- state `STARTED`
- embedded fly-print lane success with 2 eligible synthetic rows
- embedded press-candidate lane success with 2 eligible synthetic rows

### `flyPrint`

Successful responses reported:

- lane `flyPrint`
- count 2
- rows `PREVIEW-LINE-001` and `PREVIEW-LINE-003`
- preview-only order IDs
- eligible synthetic data only

Failure count: **3**

Captured failures: HTTP 400 from the Preview Worker. The PowerShell harness did not capture the error response bodies.

### `pressCandidates`

All 20 calls passed.

Successful responses reported:

- lane `press`
- count 2
- rows `PREVIEW-LINE-002` and `PREVIEW-LINE-003`
- preview-only order IDs
- eligible synthetic data only

## Failure analysis

- Four calls returned HTTP 400.
- Overall p95 was 5007 ms and the adapter timeout is 5000 ms.
- `flyPrint` p95 reached 5736 ms.
- **Inference:** the timing pattern is strongly consistent with intermittent `TASKS_V3_PREVIEW_UPSTREAM_TIMEOUT` responses, likely involving Apps Script latency/cold starts.
- Exact failure code remains unconfirmed because the first harness recorded only the PowerShell HTTP exception, not the JSON error body.
- No incorrect successful payloads or production identifiers were observed.

## Safety verification

- Operator Task V2 fallback: **NONE**
- `APPS_SCRIPT_API_URL`: **NONE**
- `claimNext`: **ZERO**
- `completeTask`: **ZERO**
- D1 business write: **ZERO**
- Production Worker deployment: **NO**
- Production route change: **NO**
- Main Apps Script change: **NO**
- Production Spreadsheet change: **NO**
- Existing secret change/rotation: **NO**
- Gaber Material Control: **NO**
- RP-08: **NO**

## Next step

Keep T2 Production canary locked. Run a small targeted read-only failure-capture pass that preserves the Preview Worker's JSON error body, confirm whether the four failures are `TASKS_V3_PREVIEW_UPSTREAM_TIMEOUT`, and investigate Apps Script cold-start/upstream latency before changing timeout policy or proceeding beyond T1.
