# TrendOS Tasks V3 — T2 NEW CHAT HANDOFF CHECKPOINT — 2026-09-18

## Purpose
This is the authoritative handoff checkpoint for continuing T2 Production Read-Only Wael Canary in a new chat without restarting prior work.

## Repo / branch
- Repo: `fawakhry/TrendOs`
- Branch: `tasks-v3-t2-readonly-wael-canary-20260916`
- Branch head before this handoff commit: `ffd91bbcc112fca156a6c509f01ded2b3e8395ee`
- T3 remains LOCKED.

## Isolated Apps Script
- Project ID: `1F7_z6csPm4Q6Sx-HV59SNDbShqzVcMXfsauZFakLFH_caEYpiCHjTOGV`
- Editor URL: `https://script.google.com/home/projects/1F7_z6csPm4Q6Sx-HV59SNDbShqzVcMXfsauZFakLFH_caEYpiCHjTOGV/edit`
- Browser Context Profile used: `prof_1d816f291ab64d65`
- Connected browser account historically used: `Trendmall.contact@gmail.com`

## Authoritative source
Use ONLY:
- Commit: `31565dfdbf7b63744b32b02e5042a5f6b0664249`
- File: `tasks-v3-bridge-readonly.gs`
- Blob: `e515103e32e01643cbe60832df9ed1bbf0f6c6d8`
- GitHub connector content length observed later: 11258 characters
- GitHub connector source line count observed later: 332
- This later repository fetch is the source-of-truth for exact content identity.

Required markers:
- `TASKS_V3_READONLY_T2_WAEL_CANARY_3_BATCHGET`
- exact columns `['A', 'E', 'F', 'J', 'K', 'M', 'R', 'AG', 'AS']`
- `Sheets.Spreadsheets.Values.batchGet`
- `majorDimension: 'COLUMNS'`
- `valueRenderOption: 'FORMATTED_VALUE'`
- `Utilities.Charset.UTF_8`
- `function tasksV3ProductionProjection_`
- `function tasksV3Status_`
- `function tasksV3Health_`

Forbidden executable paths:
- `claimNext`
- `completeTask`
- executable `getDataRange(`
- `tasksV3Column_`
- sequential `getRange(...).getDisplayValues()`
- broad `A:AS` read
- `Values.update`
- `Values.append`
- `batchUpdate`
- `setValue`
- `setValues`
- `appendRow`
- clear/insert/delete write methods

## Production source contract
- Spreadsheet ID: `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
- Sheet: `بنود الأوردرات`
- Exactly 9 approved source columns:
  `A, E, F, J, K, M, R, AG, AS`
- Never widen to full sheet / `getDataRange` / broad `A:AS`.
- HMAC must use explicit UTF-8.

## Core safety guardrails
Do NOT:
- read/display/copy/change/rotate `TASKS_V3_SHARED_SECRET`
- change any Script Properties/Secrets
- touch T1 production
- overwrite V4/V5
- change production Worker/routes/domains
- claimNext
- completeTask
- perform any Task/business-data mutation
- change D1 business-write authority
- start T3
- touch Gaber Material Control / RP-08
- merge to main

## Completed work in this continuation

### 1. Full Blackbox continuity review
All previously relevant T0/T1/T1.5/T2 Blackbox history was reviewed and reconciled before resuming work.

Checkpoint:
- `TASKS_V3_T2_FULL_BLACKBOX_REVIEW_RESUME_2026-09-18.md`
- commit `7a33f335a0cabc6fed4ecf63c121c16bc96b788d`

### 2. Current Code.gs was proven empty
Read-only inspection proved the isolated project Head had empty `Code.gs`.

Checkpoint:
- `TASKS_V3_T2_CURRENT_CODE_INSPECTION_EMPTY_2026-09-18.md`
- commit `5a8f1c0b9c2cabbae5ec4745d5e4a5956d0e787e`

### 3. Multiple bounded reconciliation attempts and state checks
Earlier browser paste paths were unreliable:
- one paste truncated;
- independent inspection proved Head empty again;
- raw GitHub validation was attempted;
- TinyFish provider temporarily returned 502;
- later raw source view validation passed;
- a later reconciliation timed out;
- post-timeout inspection again proved Code.gs empty.

Relevant commits:
- `2fafa2c27fed7ac60d250d3ca7943c31de368a1b`
- `725c1e20cb76cdd24f90cabec266b86b18328b71`
- `cd87f9668063e23808d4cb70b97fac2468c9d4d1`
- `dde0e50a1c861812fa1b61ff7c72033890f6e3e9`
- `129ff44e01378b491a2cdefdc1dfa4d349782d75`
- `32da76ae94b87db631d3690f605baf096601b0f1`
- `da05fcd7043eaafb9198702c347095dfcd9d12d4`

### 4. Direct raw-source Save claims were not trusted without independent verification
A simplified raw reconciliation run reported Saved to Drive, but an independent marker inspection later proved Code.gs still empty.

Relevant checkpoints:
- `TASKS_V3_T2_RECONCILIATION_SAVE_SUCCESS_2026-09-18.md`
- commit `b212931cd54b43f6675a3bb940ec39eda2c4efca`
- verification UI attempt was cancelled when it tried to move toward Version 5 restore:
  commit `fd6fe6ac0dfdb2602b0f5649b3da586dfc54d37c`
- Drive raw and ordinary Apps Script reads returned HTTP 403:
  commits `9f5168a7576ba14a10feebd7ba32bfaa7110affe`, `bad504a9a539311a495d4c2fdd5cc0835d313b44`
- minimal required-marker inspection then proved saved Code.gs was still empty:
  commit `56b74122de5d7d62440107dcdeabfed9aca06f5a`

### 5. Writable staging Google Doc was created and independently verified
Staging Doc:
- Document ID: `1vmf2imlim5T5B9Z75RgLeWf20e7eZa8xWOXF1F9iAvQ`
- Title: `TEMP TrendOS T2 authoritative source staging 2026-09-18`
- shared writer to `Trendmall.contact@gmail.com`
- exact GitHub source inserted through Google Docs API

Structural API readback showed the staging content matches the authoritative GitHub source completely, with only Google Docs' mandatory terminal newline added.

Checkpoint:
- `TASKS_V3_T2_WRITABLE_STAGING_SOURCE_READY_2026-09-18.md`
- commit `211efddf298e65d8bfc7a01af76c19aa847552a4`

### 6. Staging-based reconciliation was saved
TinyFish run:
`7c55ff4f-46fe-4de5-a9d2-4abf40f5e545`

It copied staging text into Code.gs and reported clean Saved to Drive.

Checkpoint:
- `TASKS_V3_T2_STAGING_RECONCILIATION_SAVE_SUCCESS_2026-09-18.md`
- commit `00f05aa071ca421d2322e98ff063433b719e53e6`

### 7. Monaco semantic/transcription verification was found unreliable
TinyFish editor inspections produced mutually inconsistent descriptions of the same saved source:
- one reported 7/9 markers, `ROWS` instead of `COLUMNS`, and missing UTF-8;
- a focused follow-up transcribed a materially different batchGet block.

Those semantic/transcription results were NOT accepted as source-of-truth.

Relevant commits:
- `b9b28abb00f9ef9b3137f5c79aead5296c121388`
- `f31114f7ee3730007012c32d0ba219d6d1fac665`

### 8. Deterministic diagnostic capture resolved source identity
Diagnostic capture Doc:
- Document ID: `1Ckz_hqvUreXZGVZ2eRiRKff7lNFKWaktO0F4XF5uYtc`
- Title: `TEMP TrendOS T2 Code.gs diagnostic capture 2026-09-18`
- shared writer to `Trendmall.contact@gmail.com`

TinyFish run:
`5a041a76-07b5-47f8-82ab-d02fed8d7f4f`

It copied current saved Code.gs read-only into the diagnostic Google Doc. Only the Doc was modified.

Checkpoint:
- `TASKS_V3_T2_DIAGNOSTIC_CAPTURE_COMPLETED_2026-09-18.md`
- commit `bcd4442808a5c57b9e77cbb4279622445c32fcc8`

Google Docs API readback then proved:
- all required markers present, including `majorDimension: 'COLUMNS'` and `Utilities.Charset.UTF_8`;
- after normalizing line-leading whitespace introduced by Google Docs, the captured source matches the exact authoritative GitHub source;
- executable forbidden-path scan passed completely.

Comparison checkpoint:
- `TASKS_V3_T2_CAPTURE_API_COMPARISON_2026-09-18.md`
- commit `d35bde58b0a0d5f88d994b8b71008a3281e1aa29`

Final static verification checkpoint:
- `TASKS_V3_T2_STATIC_VERIFICATION_PASS_2026-09-18.md`
- commit `fb327ec5034d66e0da57f03cc1b0a8d1399f2dbd`

### 9. Google Sheets API / Sheets v4 Advanced Service enabled
Only after static verification PASS, the previously owner-approved service gate was opened.

TinyFish run:
`29f7791c-c727-4ceb-95d7-e93d7d93f61d`

Result:
- Google Sheets API added to isolated T2 Apps Script project
- existing AdSense unchanged
- existing AdminDirectory unchanged
- no source edit
- no Run
- no Deploy/version
- no Properties/Secrets

Checkpoint:
- `TASKS_V3_T2_SHEETS_V4_ENABLED_2026-09-18.md`
- commit `d6b0c4834c8bd064eb22d2ac7b92921691c07965`

### 10. Direct latency smoke through private helper was blocked
Attempted to run `tasksV3ProductionProjection_` directly from Apps Script editor.

TinyFish run:
`eac1762c-e9a5-45be-97be-f297100f2692`

No function execution occurred. The private helper was not available in the editor function dropdown because its name ends in underscore.

Checkpoint:
- `TASKS_V3_T2_LATENCY_SMOKE_PRIVATE_FUNCTION_BLOCKED_2026-09-18.md`
- commit `c34749b10a262e78af12f302d3aa7f1cefce3be5`

Decision analysis checkpoint:
- `TASKS_V3_T2_LATENCY_SMOKE_DECISION_POINT_2026-09-18.md`
- commit `566177f6880cb6aaa07495b149287c21c4238f30`

### 11. Owner explicitly authorized a temporary read-only smoke wrapper
Owner message:
`نفّذ الـwrapper المؤقت.`

Authorization checkpoint:
- `TASKS_V3_T2_TEMP_WRAPPER_AUTHORIZED_2026-09-18.md`
- commit `336ebf8e19061d24f38d0b384fba41c4a2847120`

Exact temporary wrapper:

```javascript
function tasksV3LatencySmoke() {
  const startedAt = Date.now();
  tasksV3ProductionProjection_();
  return {
    success: true,
    elapsedMs: Date.now() - startedAt
  };
}
```

### 12. Temporary wrapper was appended and saved
TinyFish run:
`7e0b83c2-1e22-477b-83ef-0afd04257524`

Result:
- wrapper appended to end of Code.gs
- Head saved
- clean Saved to Drive
- no function run
- no Deploy/version
- no other project setting changed

Checkpoint:
- `TASKS_V3_T2_TEMP_WRAPPER_SAVED_2026-09-18.md`
- commit `3413aec5770f0f141a7573260983c4a266fb0551`

## CURRENT LIVE APPS SCRIPT STATE — CRITICAL
The temporary function `tasksV3LatencySmoke` is currently still present in isolated T2 Head.

The authoritative source has NOT yet been restored after the wrapper append.

Do NOT forget the rollback.

## 13. Three-run smoke did NOT start because TinyFish wallet had insufficient funds
Attempted to create the TinyFish run that would execute `tasksV3LatencySmoke` exactly 3 times.

TinyFish rejected the request BEFORE run creation:
- wallet balance reported: `-$0.13`
- zero Apps Script smoke executions occurred
- zero latency measurements collected
- zero business-data reads occurred from the smoke
- no OAuth consent appeared
- no source change occurred during the blocked attempt

Checkpoint:
- `TASKS_V3_T2_SMOKE_BLOCKED_TINYFISH_FUNDS_2026-09-18.md`
- commit `ffd91bbcc112fca156a6c509f01ded2b3e8395ee`

## CURRENT REQUIRED NEXT SEQUENCE
On resume, do NOT redo source reconciliation or static verification from scratch.

1. Re-fetch current branch HEAD.
2. Read this handoff checkpoint plus the last wrapper/smoke blocker checkpoints.
3. Check TinyFish wallet/tool availability.
4. If TinyFish access is restored, execute ONLY `tasksV3LatencySmoke` exactly 3 times sequentially.
5. Record per run:
   - success/failure;
   - elapsed duration;
   - exact error message/code if a run fails;
   - do not expose returned business-data contents.
6. If new OAuth consent appears, STOP before granting it and ask Owner.
7. Immediately after the 3 smoke attempts, rollback `Code.gs` to the exact authoritative source using the already verified writable staging Doc or exact GitHub source.
8. Save Head only.
9. Independently verify restored source:
   - temporary wrapper absent;
   - all 9 required markers present;
   - forbidden executable paths absent;
   - normalized capture matches authoritative source.
10. Record rollback and verification in Blackbox.
11. Then evaluate smoke result.
12. Do NOT start T3 without explicit Owner approval.

## Smoke scope
This 3-run smoke is only a diagnostic smoke. It does NOT replace the official T2 acceptance run.

Official acceptance remains exactly:
- health: 8
- status: 8
- flyPrint: 7
- pressCandidates: 7
- total 30/30 success
- p95 <= 2000 ms
- timeout <= 5000 ms

Never:
- increase timeout;
- cherry-pick samples;
- remove slow samples;
- accept health-only.

## Historical performance context
Official prior T2 qualification:
- 8/30 success
- health 8/8
- status/flyPrint/pressCandidates timed out
- 22 business-read failures at upstream 5000 ms timeout
- health p95 previously 2359.50 ms
- all-attempt p95 previously 5241.07 ms

Recovered old sequential source-read probe:
- total 12052 ms
- sequential 9 column reads = 11292 ms
This was the bottleneck that motivated the Sheets v4 batchGet remediation.

T1.5 D1 read replica separately passed 30/30 with p95 173 ms, but do NOT switch T2 to D1 without a new explicit architecture decision.

## Existing T1 reference
T1 active Cloudflare deployment:
`42a77742-69f6-40c7-9c6e-bbc310915374`

T1 active version:
`62527d93-9078-46c9-a316-132e02ed3194`

T1 Apps Script remains Version 3 and must remain unchanged.

## Final safety statement
At handoff:
- no T3
- no merge
- no production Worker promotion
- no production route/domain change
- no Task mutation
- no business-data write
- no claimNext
- no completeTask
- no Properties/Secret change
- Google Sheets API service remains enabled only in isolated T2
- temporary latency wrapper remains in isolated T2 Head pending smoke + mandatory rollback
