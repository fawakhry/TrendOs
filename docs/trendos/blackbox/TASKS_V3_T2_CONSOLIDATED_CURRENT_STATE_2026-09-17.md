# TrendOS Tasks V3 — T2 consolidated current-state checkpoint — 2026-09-17

## Purpose
Single continuity checkpoint that records the completed milestones and the exact latest T2 state so a future chat/work session can continue without reconstructing history or restarting from T1/T1.5.

Repo: `fawakhry/TrendOs`
Branch: `tasks-v3-t2-readonly-wael-canary-20260916`
Branch head before this checkpoint: `ed95dd7987210499ba52dc3af9037dc4e7b9c112`

## Completed milestones

### 1. T1.5 D1 read-replica qualification — PASS
Official checkpoint commit: `8ebc63f8a50a4be9d8e1392eafe8f4792bce83bc`

Result:
- 30/30 successful read samples
- HTTP failures: 0
- transport failures: 0
- p50: 133ms
- p95: 173ms
- max: 184ms
- upstream duration: 0ms on all 30 request-path samples
- scheduled snapshot refresh was observed working

No Production Worker/D1 mutation, secret change, Task mutation, `claimNext`, or `completeTask` occurred.

### 2. Original T2 Version Preview qualification — FAIL
Official checkpoint commit: `d341f6489147895807cfdc84c71dd694223a31fc`
Run: `35141661633`

Result:
- 0/30 success
- first 3 health requests hit the unchanged 5000ms upstream timeout
- remaining 27 requests returned `SIGNATURE_INVALID`
- active T1 stayed unchanged
- T2 preview version remained undeployed/not promoted
- no secret value was read, copied, changed, displayed, logged, or rotated

This established two separate problems to investigate: Arabic authentication correctness and upstream latency.

### 3. Arabic HMAC mismatch isolated
Read-only diagnostic runs:
- `35151926569` — T1 ASCII authentication succeeded while T2 Arabic authentication failed
- `35152480022` — on the same T1 Worker binding/path, ASCII operator succeeded while Arabic `وائل` produced `SIGNATURE_INVALID`

Diagnostic conclusion recorded in the repository:
`ARABIC_CANONICAL_HMAC_MISMATCH_CONFIRMED`

The evidence isolated the signature problem to non-ASCII canonical-string encoding rather than proving any secret mismatch. Secret values were never inspected or compared.

### 4. UTF-8 repository remediation — PASS
Apps Script bridge HMAC was changed to use explicit UTF-8:
`Utilities.computeHmacSha256Signature(value, secret, Utilities.Charset.UTF_8)`

Fix source commit:
`b42b4660e1263399b626272c0d3a9ed8aa919113`

UTF-8 contract CI run:
`35152830234`

PASS markers:
- `T2_READONLY_SAFETY_GATE_PASS`
- `TASKS_V3_T2_READONLY_WAEL_CONTRACT_PASS`
- `TASKS_V3_T2_HMAC_UTF8_CONTRACT_PASS`

Root-cause/remediation checkpoint:
`eaf0fe65c1ae3f80bc5be9266f74680ee19158ac`

### 5. UTF-8 fix published as isolated Apps Script V5
The corrected source was published as a NEW isolated Apps Script version/deployment while preserving the existing deployments.

- Apps Script V5 deployment: `AKfycbz3kOnV85cwZEmUXwTaN4ygUI9vR8nXiW0xqofez6O3NJuwD5o9x2B9Hux253tcDx1eyQ`
- Existing T1 remained Version 3
- Original T2 remained Version 4 for rollback/reference
- no Script Properties were changed
- no secret was read/changed/rotated

Deployment checkpoint:
`42f0658ff68e64ef4e5aef978e8dfbb14e42ac43`

A new undeployed/version-isolated Cloudflare T2 Worker Version was created for V5 qualification:
- Worker Version: `67dab1c9-1ced-40c7-9820-f50d911099b3`
- preview alias: `t2-utf8-v5-20260916`
- no promotion/deploy to active T1 or Production occurred

### 6. Arabic authentication proof on V5 — PASS
Three Arabic `health` smoke calls returned HTTP 200 with the expected T2 read-only version.

Observed upstream times:
- 1584ms
- 1812ms
- 2620ms

No `SIGNATURE_INVALID` occurred in these smoke calls or in the subsequent 30-sample qualification.

Therefore the UTF-8 authentication defect is considered fixed for the tested T2 V5 path.

## Latest official T2 qualification — FAIL on latency
Run: `35157734701`
Job: `105001059130`
Evidence commit: `c8126da8a2eb3e1c5a0563507caa5f52716e896e`
Final checkpoint commit: `ed95dd7987210499ba52dc3af9037dc4e7b9c112`

Exact result:

| Operation | Success | Failure |
|---|---:|---:|
| health | 8/8 | 0 |
| status | 0/8 | 8 |
| flyPrint | 0/7 | 7 |
| pressCandidates | 0/7 | 7 |
| Total | 8/30 | 22 |

Failure details:
- all 22 business-read attempts returned HTTP 400 `TASKS_V3_PREVIEW_UPSTREAM_TIMEOUT`
- all 22 reached the unchanged 5000ms adapter timeout
- transport failures: 0
- HTTP-200 semantic failures: 0
- `SIGNATURE_INVALID`: 0

Success-only timing (the eight successful health calls only):
- p50: 1724.71ms
- p95: 2359.50ms
- max: 2359.50ms
- upstream p50/p95/max: 1617 / 2333 / 2333ms

All-attempt diagnostic timing:
- p50: 5185.78ms
- p95: 5241.07ms
- max: 5267.97ms
- upstream p50/p95/max: 5000 / 5000 / 5000ms

Acceptance remains unchanged:
- 30/30 success
- zero HTTP/transport/semantic failures
- p95 <= 2000ms

Result: **T2 FAIL**.

No timeout increase, sample substitution, acceptance relaxation, or repeat-run selection was used.

## Isolation / safety state at latest checkpoint
Confirmed unchanged:
- active Cloudflare T1 deployment: `42a77742-69f6-40c7-9c6e-bbc310915374`
- active T1 version: `62527d93-9078-46c9-a316-132e02ed3194`
- traffic: 100%
- Apps Script T1 remains Version 3
- original T2 remains Version 4
- V5 exists separately

Explicitly NOT performed:
- `claimNext`
- `completeTask`
- any Task mutation
- business-data write
- production spreadsheet write
- Main Apps Script modification
- Production frontend Task route
- Production Worker route/custom-domain change
- D1 business-write authority transfer
- secret value read/display/copy/change/rotation
- `EDGE_SESSION_SECRET` change
- `TRENDOS_OPERATOR_TASK_PROXY_SECRET` change
- `TASKS_V3_SHARED_SECRET` change
- Gaber Material Control
- RP-08
- merge to `main`
- T3

## Exact current interpretation
Authentication and UTF-8 correctness are no longer the active T2 blocker on the V5 tested path.

The current blocker is **read latency/completion** for `status`, `flyPrint`, and `pressCandidates`: every business-read sample exceeded the existing 5-second adapter cap, while even the successful health-only p95 was 2359.50ms and therefore above the 2000ms acceptance target.

The precise internal source of that business-read latency has NOT yet been proven. Do not attribute it to a specific sheet call, projection, Cloudflare layer, Apps Script runtime, or network segment without new evidence.

## Next permitted scope
Continue only with a scoped **T2 read-only latency diagnostic/remediation** using the same safety constraints and the same acceptance target.

Do not:
- raise the 5000ms timeout merely to pass qualification
- relax the 2000ms p95 target
- promote the T2 preview
- modify active T1
- touch secret values
- add mutation operations
- start T3

Any diagnostic, code change, test run, deployment, rollback, failure, or decision must be written to the appropriate `docs/trendos/blackbox/` checkpoint immediately with relevant commit/run IDs.

## T3 gate
**T3 remains LOCKED.**
A fresh explicit owner approval is required after T2 meets its acceptance criteria or the owner makes a separate documented decision.
