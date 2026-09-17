# TrendOS Tasks V3 — T2 batchGet permission decision checkpoint — 2026-09-17

## Timestamp
2026-09-17 18:24 EEST

## Continuity
- Repo: `fawakhry/TrendOs`
- Branch: `tasks-v3-t2-readonly-wael-canary-20260916`
- Branch head confirmed before this checkpoint: `37054e3f0c7f6e0a273ea5f41a2c228096643fed`
- T2 remains read-only / not qualified.
- T3 remains locked.

## Apps Script Head restore retry
Attempted ONLY the previously authorized bounded restore path from staging Google Doc `1iwWgHmwV4x-W4gxAPde7coMNYfjR3EMzQjW0mJCY53o` into isolated Apps Script project `1F7_z6csPm4Q6Sx-HV59SNDbShqzVcMXfsauZFakLFH_caEYpiCHjTOGV`, `Code.gs` only, with no deploy/version/function run/properties/services/settings action.

`TinyFish.run_web_automation` again returned `Resource not found` before creating a browser run. Therefore no browser session was created and no Apps Script mutation occurred. Current Head remains broken/unrestored and must not be benchmarked or deployed.

## Read-path evidence already established
The existing nine sequential approved-column reads account for 11,292 ms of a 12,052 ms instrumented bridge path. The approved columns remain exactly `A, E, F, J, K, M, R, AG, AS`. A wide A:AS read remains forbidden by the authorization footprint.

## Official Google API evidence
Google documents two ways to call public Google APIs from Apps Script:
1. Advanced Google services, which must be explicitly enabled in the Apps Script project.
2. Direct HTTP requests using `UrlFetchApp`, with manual authorization using an OAuth token such as `ScriptApp.getOAuthToken()`.

Google also documents that direct `UrlFetch` calls to Google APIs require the necessary OAuth scopes to be specified in the script manifest when additional scopes are needed.

Google Sheets API `spreadsheets.values.batchGet` retrieves one or more A1 ranges in one HTTP request and defaults to `FORMATTED_VALUE`, closely matching the current `getDisplayValues()` value semantics. Google recommends batchGet for multiple reads for efficiency.

Therefore there are two documented single-request options for the nine non-contiguous approved ranges:
- enable the Advanced Sheets service; or
- use direct Sheets REST `values.batchGet` through `UrlFetchApp` + `ScriptApp.getOAuthToken()` with the required manifest OAuth scopes.

Both paths change project authorization/service configuration relative to the current isolated project. They are therefore treated as a permission/configuration decision and are not executed implicitly.

## Decision boundary
A fresh owner approval is required before either:
- enabling Advanced Sheets service; or
- adding/changing manifest OAuth scopes / UrlFetch-based Google API authorization for direct Sheets REST access.

Until that decision is made, do not alter Services, manifest, OAuth scopes, Apps Script deployments, timeout, acceptance criteria, or data-access footprint.

## Safety / rollback state
No Secret value was read, displayed, copied, changed, or rotated.
No Script Properties were opened or changed.
No production spreadsheet/business-data write occurred.
No Task mutation occurred.
No `claimNext` or `completeTask` occurred.
No T1 change occurred.
No V4/V5 deployment change occurred.
No Worker promotion/custom route/domain change occurred.
No D1 business-write authority transfer occurred.
No T3, Gaber Material Control, RP-08, or merge to main occurred.

Existing V4/V5 and active T1 remain the rollback/reference state.

---

## 2026-09-17 — owner decision received

Owner explicitly approved **Advanced Sheets Service for T2 only**.

Scope of approval:
- applies only to isolated Apps Script project `1F7_z6csPm4Q6Sx-HV59SNDbShqzVcMXfsauZFakLFH_caEYpiCHjTOGV`;
- permits enabling the Advanced Google Sheets service in that isolated project;
- permits replacing the nine sequential approved-column reads with a `spreadsheets.values.batchGet` implementation over exactly `A, E, F, J, K, M, R, AG, AS`;
- does not authorize any write operation, wider source-column footprint, timeout increase, deployment promotion, T1 change, V4/V5 overwrite, Secret/property changes, T3, merge to main, or production business-data mutation.

Execution order remains: restore/verify isolated Head baseline first, enable Sheets service, implement batchGet read path, static safety/contract verification, read-only smoke/latency diagnostic, then only if qualified create a new isolated version/deployment and run the exact 30-sample qualification.

---

## Repo-only batchGet implementation prepared

Commit: `31565dfdbf7b63744b32b02e5042a5f6b0664249`.

Changed only `tasks-v3-bridge-readonly.gs` on the T2 branch. No Apps Script live project/deployment was changed by this commit.

Implementation details:
- version marker advanced to `TASKS_V3_READONLY_T2_WAEL_CANARY_3_BATCHGET`;
- approved columns are centralized as exactly `A, E, F, J, K, M, R, AG, AS`;
- business projection now uses one read-only `Sheets.Spreadsheets.Values.batchGet(...)` request;
- requested ranges are open-ended single columns from row 2 on the same source sheet, avoiding a separate `getLastRow()`/nine-`getRange()` sequence;
- `majorDimension` is `COLUMNS` and `valueRenderOption` is `FORMATTED_VALUE`;
- output projection/filtering semantics remain unchanged;
- `health` path remains on the existing built-in Spreadsheet service for source readiness diagnostics;
- HMAC remains explicit UTF-8;
- no write API was introduced.

Safety state remains unchanged: no Secret/property access, no production data write, no Task mutation, no deploy/version change, no T1/V4/V5 change, no T3.

---

## BatchGet contract gate PASS

Added `cloudflare-d1/test/tasks-v3-t2-batchget-contract.mjs` in commit `adbd6bed3a300abc9fb8bc6d3854cdafb07d56b0` and wired it into `.github/workflows/trendos-tasks-v3-t2-hmac-contract.yml` in commit `51aa84c0b072132c9875a7b80eed93c88d0b7266`.

GitHub Actions run: `35241339901`.
Job: `105270249734`.
Conclusion: `success`.

Passed steps:
- T2 read-only safety gate;
- T2 Worker contract;
- Arabic UTF-8 HMAC contract;
- T2 batchGet read-only contract.

The batchGet gate specifically locks:
- exactly one `Sheets.Spreadsheets.Values.batchGet(...)` call;
- exactly approved source columns `A, E, F, J, K, M, R, AG, AS`;
- `majorDimension: COLUMNS`;
- `valueRenderOption: FORMATTED_VALUE`;
- no `getDataRange`, `getRange`, `getDisplayValues`, wide `A:AS` read, Sheets write methods, `claimNext`, or `completeTask` in the bridge candidate.

This is repository/CI evidence only. The isolated Apps Script Head is still broken/unrestored because the browser runner has not created a live restore session. No live service/deployment/source mutation is claimed yet.

---

## 2026-09-17 18:41 EEST — staging document advanced to CI-passed batchGet source

### STEP
Before this repository write, confirmed branch head `185916d145e1e9384e17e803fc6d551b750d858e` and re-fetched `tasks-v3-bridge-readonly.gs` blob `e515103e32e01643cbe60832df9ed1bbf0f6c6d8` from the T2 branch.

Updated temporary staging Google Doc `1iwWgHmwV4x-W4gxAPde7coMNYfjR3EMzQjW0mJCY53o` from the prior `_2` sequential-read baseline to the exact current batchGet candidate source. The write used Google Docs revision guard `requiredRevisionId=ANLCKQn-nvDWoPwMzTnAWaWv2UwFvzm-QFnx_Y4JovAJiELk0bd6D534VqUH05MkMIA1wI0zignLtip4RXvp4EjBbYYt6JNTppqTZ2PluQ` and completed at new revision `ANLCKQmwu2b288OxJze02vPmfQdhTUPSiTayxpFGreJK_y6CXR8ZlwnYRgvuw_veEbWV9Nd4L_deYu39MNmeUiJo_xRwgzw3AQoXgbtKUg`.

### VERIFICATION
Exact-text checks against the new staging revision confirmed:
- `TASKS_V3_READONLY_T2_WAEL_CANARY_3_BATCHGET` present;
- exact source-column constant `['A', 'E', 'F', 'J', 'K', 'M', 'R', 'AG', 'AS']` present;
- `Sheets.Spreadsheets.Values.batchGet` present;
- `valueRenderOption: 'FORMATTED_VALUE'` present;
- old `function tasksV3Column_` absent.

The staging document contains no Secret value. This update changes only the temporary source staging document; it does not change Apps Script Head, Services, deployments, Script Properties, production business data, T1, V4/V5, or Cloudflare traffic.

### NEXT
The next live action remains bounded to the isolated T2 Apps Script project: replace `Code.gs` with this verified staging source, save Head only, verify static markers, then enable the owner-approved Advanced Sheets Service. No function execution or deployment occurs until those checks pass.