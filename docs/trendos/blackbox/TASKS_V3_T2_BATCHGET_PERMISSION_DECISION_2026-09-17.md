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
