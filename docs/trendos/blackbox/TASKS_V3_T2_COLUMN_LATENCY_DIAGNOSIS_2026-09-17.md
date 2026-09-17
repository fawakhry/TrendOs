# T2 column latency diagnosis

## STEP
Resume from 7f76b3935add2a69bd56550e5c005c1c2910f3dd. Verify isolated Apps Script project identity and recover existing Head tasksV3T2LatencyProbe execution logs (Sep 16 2026 3:33:10 PM, as displayed by Apps Script). No duplicate probe run.

## RESULT
Probe completed (execution duration 12.95s). Source lookup 510ms; lastRow 117ms; lastRow=636. Nine sequential column reads, each 635 values: A 2045ms, E 1689ms, F 1506ms, J 1510ms, K 1682ms, M 1115ms, R 975ms, AG 730ms, AS 40ms. Instrumented total 12052ms. Sequential column reads account for 11292ms, proving the observed narrow-column read path exceeds the unchanged 5000ms adapter cap. This does not establish attainable end-to-end p95.

## COMMIT / RUN
Baseline branch head 7f76b3935add2a69bd56550e5c005c1c2910f3dd. Source blob 87a94fa4a932eb94a819d7e964eecf3bbfc5626a. Head editor run tasksV3T2LatencyProbe, completed; logs recovered via Executions Type=Editor. Project ID 1F7_z6csPm4Q6Sx-HV59SNDbShqzVcMXfsauZFakLFH_caEYpiCHjTOGV.

## PRODUCTION MUTATION
NONE. No secret/property access, deployment change, task mutation, spreadsheet write, T1 change or T3 during this recovery.

## NEXT STEP
Evaluate a single Sheets values.batchGet for the same nine narrow ranges with formatted values. Preserve row alignment, filtering, Wael gate, UTF-8 and live read semantics. No caching/freshness change or timeout increase. Validate parity before any new isolated T2 deployment and qualification.

---

## 2026-09-17 16:23 EEST — resume baseline and live editor drift check

### STEP
Before any repository write, fetched branch `tasks-v3-t2-readonly-wael-canary-20260916` and confirmed current head `75c290d78a8e36f5bab9a1e1d7c55b3afd4b9e45`, exactly one commit ahead of pause/resume commit `7f76b3935add2a69bd56550e5c005c1c2910f3dd`. The only file changed by that commit was this latency-diagnosis Blackbox.

Read the required continuity Blackboxes and repository source `tasks-v3-bridge-readonly.gs` at blob `87a94fa4a932eb94a819d7e964eecf3bbfc5626a`. Repository source remains `TASKS_V3_READONLY_T2_WAEL_CANARY_2` and uses nine sequential narrow `getRange(...).getDisplayValues()` reads for exactly A, E, F, J, K, M, R, AG, AS.

Opened isolated Apps Script project `1F7_z6csPm4Q6Sx-HV59SNDbShqzVcMXfsauZFakLFH_caEYpiCHjTOGV` with TinyFish Browser Context Profile `prof_1d816f291ab64d65`, strictly read-only.

TinyFish run: `f64014d5-ecbc-4f3d-91ab-80c321e5a38d`.

### RESULT / FAILURE
Read-only editor inspection reported a source drift versus the repository baseline. The current editor still exposes version string `TASKS_V3_READONLY_T2_WAEL_CANARY_2`, but the visible business read implementation was reported as a wide `sheet.getRange('A2:AS').getDisplayValues()` read with in-memory index projection, plus a separate `sheet.getRange('A2:M').getDisplayValues()` verification read. This does NOT match repository blob `87a94fa...` and would read columns outside the approved nine-column source contract.

No conclusion is yet made about whether this editor Head is a saved unpublished diagnostic variant, stale UI state, or another source revision. This discrepancy must be verified before any live code edit/deployment or new latency probe.

### DECISION / IMPACT
Stop treating repository source as automatically identical to Apps Script Head. Next action is a second read-only editor verification of the exact relevant functions and project Services/manifest state. No optimization, source upload, function execution, deployment, property access, or qualification should proceed until the live Head baseline is reconciled.

### SAFETY / ROLLBACK STATE
No Apps Script code edit/save/deploy/run occurred. No Script Properties were opened or changed. No secret value was read, copied, displayed, changed, or rotated. No business-data write, sheet/schema write, Task mutation, `claimNext`, `completeTask`, T1 change, Worker promotion, custom route/domain change, D1 business-write authority, T3, Gaber Material Control, RP-08, or merge occurred. Existing V4/V5 deployments remain untouched and are the rollback/reference state documented in prior checkpoints.
