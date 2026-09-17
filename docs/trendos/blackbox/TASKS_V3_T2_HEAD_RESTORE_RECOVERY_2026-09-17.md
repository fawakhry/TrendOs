# Tasks V3 T2 — isolated Head restore recovery

## 2026-09-17 18:00 EEST — deterministic state and restore-method checkpoint

### CONTEXT
T2 remains Production Read-Only Wael Canary only. No T3. Active T1, Apps Script V4/V5 deployments, production routes, business data, Script Properties, and secrets remain out of scope and untouched.

Isolated Apps Script project ID: `1F7_z6csPm4Q6Sx-HV59SNDbShqzVcMXfsauZFakLFH_caEYpiCHjTOGV`.
Verified canonical restoration source: repository blob `87a94fa4a932eb94a819d7e964eecf3bbfc5626a` (`tasks-v3-bridge-readonly.gs`).

### VERIFIED HEAD STATE
A deterministic Google Drive raw Apps Script export using MIME `application/vnd.google-apps.script+json` established that the current Head project export is 738 bytes, contains the existing `appsscript` manifest plus `Code` (`server_js`), and `Code.source` is exactly empty (`""`). This supersedes earlier Monaco/UI ambiguity about whether Head was merely truncated.

The manifest is still present and retains the existing Africa/Cairo timezone, V8 runtime, webapp settings, AdSense service, and AdminDirectory service. No manifest or Service changes were made.

Drive revision history is not available for this Apps Script file through the connected Drive API: `revisions.list` returned HTTP 403 `revisionsNotSupported`.

### LATEST RESTORE LAUNCH FAILURE
After re-fetching the branch and confirming head `bb2e3e2674ad8e14756d7018e0ebc762e2570d38`, attempted to launch a restore of **only** isolated Head `Code.gs` from canonical blob `87a94fa...`, with no custom agent_config and explicit prohibitions on function execution, deployment/version creation, Script Properties, Services, manifest/settings, spreadsheet writes, and business-data writes.

TinyFish rejected the request **before run creation** with `Resource not found: TinyFish.run_web_automation.` No run ID or browser session was created, therefore this attempt caused no Apps Script mutation.

A subsequent streaming Drive export remained 738 bytes, confirming the original isolated Head was still empty at the time of this checkpoint.

### DECISION / NEXT SAFE STEP
Do not retry TinyFish blindly and do not benchmark/instrument/deploy the empty Head. Validate an alternative deterministic restoration mechanism on a **temporary copy of this isolated Apps Script project first**, never on the original project. The validation must preserve the exported manifest exactly, replace only the copied project Code source with canonical blob `87a94fa...`, perform no execution/deployment/version creation, and immediately re-export the copy as `application/vnd.google-apps.script+json` to prove exact Code-source round-trip. Only if that copy test is exact may the same mechanism be considered for the original isolated Head.

### SAFETY / ROLLBACK STATE
No Secret value was read/displayed/copied/changed/rotated. No Script Property was opened or changed. No production spreadsheet/business-data write, Task mutation, `claimNext`, `completeTask`, T1 change, V4/V5 deployment change, Worker promotion, custom route/domain change, D1 business-write authority, T3, Gaber Material Control, RP-08, or merge occurred. Existing V4/V5 and active T1 remain the rollback/reference state.