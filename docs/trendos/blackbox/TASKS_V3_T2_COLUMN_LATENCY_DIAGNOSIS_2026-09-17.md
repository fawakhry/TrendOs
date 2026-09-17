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

---

## 2026-09-17 16:25 EEST — contradictory second browser readout

### STEP
Confirmed branch head before this write remained `f48a6d50ade0303ca885e50c8648b76cbbcd25ae`. Performed a second independent TinyFish read-only inspection of the same isolated Apps Script project to reconcile the reported source drift and inspect Services/manifest state.

TinyFish run: `c3d91116-4641-4c21-9d1f-15184e35a80e`.

### RESULT / FAILURE
The second browser extraction contradicted both the first extraction and the repository source. It reported a mixture of wide reads (`A2:AS`, `A2:M`) and a `RangeList` over the nine approved columns, plus placeholder/stub functions not present in repository blob `87a94fa...`. It also reported enabled Services `AdSense` and `AdminDirectory`, with no Advanced Sheets API enabled.

Because the two browser extractions are mutually inconsistent and the second description includes source shapes that do not match the repository baseline, these TinyFish summaries are not accepted as authoritative source text. No live-code conclusion is drawn from either summary beyond the fact that the editor is accessible under the requested authenticated profile.

### DECISION / IMPACT
Do not edit, deploy, run, or benchmark live Apps Script Head based on these summaries. Reconcile the Apps Script Head using an exact-text retrieval method or another deterministic read-only source before changing anything. Until then, the repository blob plus previously recovered execution logs remain the only deterministic source/evidence pair.

### SAFETY / ROLLBACK STATE
No code edit/save, function execution, deployment, Services change, manifest change, property access, trigger/settings change, spreadsheet write, business-data write, Task mutation, T1 change, secret access, Worker promotion, T3, Gaber Material Control, RP-08, or merge occurred. V4/V5 and active T1 remain untouched.

---

## 2026-09-17 17:01 EEST — deterministic source retrieval attempt remained incomplete

### STEP
Immediately before this repository write, re-fetched branch `tasks-v3-t2-readonly-wael-canary-20260916` and confirmed head remained `12cadbc02ee83e5427b120ba80486c505ee7d403`.

Opened the same isolated Apps Script project with TinyFish Browser Context Profile `prof_1d816f291ab64d65` and requested a strictly read-only, non-mutating, exact-text retrieval of `Code.gs`; no source inference or summarization was permitted.

TinyFish run: `696c1462-1618-4dcf-92f1-fd2282b38251`.

### RESULT / FAILURE
TinyFish returned the first visible 32 lines of `Code.gs` verbatim. Those lines match the opening portion of repository blob `87a94fa4a932eb94a819d7e964eecf3bbfc5626a` through the start of `doPost` assertion handling.

However, the same TinyFish result explicitly warned that the extraction may contain only the visible editor viewport and may not include source beyond line 32. Therefore this run does NOT establish an exact full-Head source baseline and does not resolve the earlier contradictory browser readouts.

No conclusion is drawn about the implementation below the captured viewport, including the business-read path, enabled services, manifest, or any previously reported wide-read/RangeList shapes.

### DECISION / IMPACT
Keep the live Apps Script Head frozen. Do not edit, save, execute, deploy, or benchmark Head until the complete source is retrieved deterministically or another authoritative read-only source is available. Repository blob `87a94fa...` plus the previously recovered latency-probe execution logs remain the deterministic evidence baseline for analysis only.

### SAFETY / ROLLBACK STATE
No code edit/save, function execution, deployment, Services/manifest/property/trigger/settings change, Script Property value read, spreadsheet write, business-data write, Task mutation, `claimNext`, `completeTask`, T1 change, Worker promotion, custom route/domain change, D1 business-write authority, T3, Gaber Material Control, RP-08, or merge occurred. V4/V5 and active T1 remain untouched.

---

## 2026-09-17 17:07 EEST — complete deterministic Code.gs Head extraction

### STEP
Immediately before this write, fetched branch `tasks-v3-t2-readonly-wael-canary-20260916` and confirmed head `f0f08dea7aa104ffd80b839aa02f142b13b4ec5e`.

Performed a second strict read-only deterministic extraction of `Code.gs` using TinyFish Browser Context Profile `prof_1d816f291ab64d65`, explicitly requiring sequential line-numbered capture with no gaps and no source inference.

TinyFish run: `62dde7b3-b6c0-4ce8-a868-151960c9b240`.

### RESULT
TinyFish established the current `Code.gs` file contains exactly 33 lines, with complete contiguous coverage lines 1-33 and no missing ranges. Lines 1-30 match the opening portion of repository blob `87a94fa4a932eb94a819d7e964eecf3bbfc5626a` through:
`if (!verified.ok) return tasksV3Output_({ success: false, code: verified.code });`
Lines 31-33 are blank.

Therefore `Code.gs` Head is definitively not byte/content-equivalent to repository `tasks-v3-bridge-readonly.gs`; the repository contains substantial additional functions and the full production projection/read path that are absent from this specific Head file.

This result supersedes the earlier ambiguous viewport-only summaries for `Code.gs` itself. It does NOT yet prove that the Apps Script project as a whole lacks the remaining functions because they may exist in other `.gs` files.

### DECISION / IMPACT
Do not restore, edit, deploy, run, or benchmark yet. Next read-only action is to enumerate every project file and determine whether the remaining T2 functions exist in other files. Only after full project-source reconciliation can a safe live Head baseline be established.

### SAFETY / ROLLBACK STATE
No code edit/save, function execution, deployment, Services/manifest/property/trigger/settings change, Script Property value read, spreadsheet write, business-data write, Task mutation, `claimNext`, `completeTask`, T1 change, Worker promotion, custom route/domain change, D1 business-write authority, T3, Gaber Material Control, RP-08, or merge occurred. V4/V5 and active T1 remain untouched.

---

## 2026-09-17 17:09 EEST — complete project file inventory confirms truncated Head

### STEP
Before this repository write, confirmed branch head `daad51e40810874ad6090ead9f5f2bc65cc7a5df`.

Used TinyFish Browser Context Profile `prof_1d816f291ab64d65` to enumerate the isolated Apps Script project's Files pane strictly read-only.

TinyFish run: `424a05f6-4c88-4fb2-ab69-bfc24bac913a`.

### RESULT / FAILURE
The project contains exactly one source file: `Code.gs`. There are no additional `.gs` files or folders in the Files pane, and `appsscript.json` is not visible.

Combined with the deterministic 33-line extraction from run `62dde7b3-b6c0-4ce8-a868-151960c9b240`, this proves the current Apps Script Head source is truncated and does not contain the complete repository bridge implementation.

The UI also lists AdSense and AdminDirectory under Libraries/Services; no Advanced Sheets service was observed. No service configuration was changed.

### DECISION / IMPACT
The live Head cannot be used as the current business-read baseline or benchmark target. The safe baseline restoration source is repository blob `87a94fa4a932eb94a819d7e964eecf3bbfc5626a`, which is the exact source previously published as V5 and contains the full T2 read-only bridge with explicit UTF-8 HMAC and nine approved narrow source columns.

Next permitted action is to restore the isolated project's Head from that exact repository source only (no deployment), then perform static safety/contract verification before any read-only diagnostic execution.

### SAFETY / ROLLBACK STATE
No code edit/save, function execution, deployment, Services/manifest/property/trigger/settings change, Script Property value read, spreadsheet write, business-data write, Task mutation, `claimNext`, `completeTask`, T1 change, Worker promotion, custom route/domain change, D1 business-write authority, T3, Gaber Material Control, RP-08, or merge occurred. V4/V5 and active T1 remain untouched.
