# TrendOS Tasks V3 — T2 UTF-8 HMAC root cause / remediation ready — 2026-09-17

## Result

**ROOT CAUSE STRONGLY ISOLATED — REPOSITORY REMEDIATION READY — LIVE T2 REMAINS UNCHANGED / NOT REQUALIFIED**

T3 remains **LOCKED**.

## Continuity

- Repo: `fawakhry/TrendOs`
- Branch: `tasks-v3-t2-readonly-wael-canary-20260916`
- Previous official checkpoint: `d341f6489147895807cfdc84c71dd694223a31fc`
- Previous T2 qualification run: `35141661633` — FAIL, 0/30 successful samples.
- No reset, force-push, merge to main, or restart from scratch occurred.

## Step 1 — static protocol comparison

Compared the Cloudflare signing adapter and the Apps Script verifier.

Cloudflare canonical order:
1. protocol
2. op
3. operator
4. role
5. assertedAt
6. nonce
7. payloadJson

Apps Script canonical order is the same.

Protocol remains exactly:
`TRENDOS_TASKS_V3_READONLY_1`

No field-order/protocol mismatch was found.

## Step 2 — T1 vs T2 read-only auth separation diagnostic

Added workflow:
`.github/workflows/trendos-tasks-v3-t2-auth-diagnostic.yml`

Commit:
`a691e904a4af4db6abb29b5005353664c2d61296`

Run:
`35151926569`

Scope:
- health only
- no business writes
- no Cloudflare mutation
- no Apps Script mutation
- no secret read/copy/change/rotation

Observed:

### T1 active, ASCII operator `wael-preview`
- 3 successful `200 OK` health calls
- 2 adapter timeouts at 5000ms
- successful upstream version: `TASKS_V3_READONLY_T0`

### T2 undeployed version preview, Arabic operator `وائل`
- 3 `SIGNATURE_INVALID`
- 2 adapter timeouts at 5000ms
- zero successful calls

Diagnostic result:
`T1_AUTH_OK_T2_SIGNATURE_REJECTED`

This proved that the inherited T1 Worker secret binding still authenticates against T1.

## Step 3 — isolate Arabic canonical input on the SAME T1 path

Updated the diagnostic workflow to compare ASCII vs Arabic operator text using the same active T1 Worker/binding and same T1 Apps Script endpoint.

Commit:
`687778d4ca1ca8f8b5856679af9c5d2037e82c09`

Run:
`35152480022`

Observed:

### T1 ASCII operator `wael-preview`
- 2 successful `200 OK`
- 1 timeout

### T1 Arabic operator `وائل`
- 0 successful calls
- 1 definitive `SIGNATURE_INVALID`
- 1 upstream timeout
- 1 `TASKS_V3_PREVIEW_INVALID_JSON` transient/non-JSON upstream response

### T2 Arabic operator `وائل`
- 0 successful calls
- 2 definitive `SIGNATURE_INVALID`
- 1 upstream timeout

Workflow diagnostic result:
`ARABIC_CANONICAL_HMAC_MISMATCH_CONFIRMED`

## Root-cause interpretation

The signature failure reproduces on the SAME T1 Worker secret binding and SAME T1 Apps Script endpoint when only the canonical operator text changes from ASCII to Arabic.

Therefore the evidence strongly isolates the authentication failure to non-ASCII string encoding in the HMAC canonical input, rather than to a different Cloudflare secret value.

Cloudflare signs the canonical string as UTF-8 bytes using `TextEncoder` / WebCrypto.

The Apps Script bridge had used the two-string overload:
`Utilities.computeHmacSha256Signature(value, secret)`
without an explicit character set.

Google Apps Script supports the explicit charset overload:
`Utilities.computeHmacSha256Signature(value, key, charset)`
and supports `Utilities.Charset.UTF_8`.

Reference:
- https://developers.google.com/apps-script/reference/utilities/utilities
- https://developers.google.com/apps-script/reference/utilities/charset

The live runtime proof above is stronger than assuming the undocumented/default string encoding of the no-charset overload.

## Step 4 — repository remediation

Changed ONLY the isolated Tasks V3 bridge HMAC calculation to make UTF-8 explicit:

```javascript
function tasksV3HmacHex_(value, secret) {
  return tasksV3Hex_(Utilities.computeHmacSha256Signature(
    value,
    secret,
    Utilities.Charset.UTF_8
  ));
}
```

Source:
`tasks-v3-bridge-readonly.gs`

Commit:
`b42b4660e1263399b626272c0d3a9ed8aa919113`

No secret value was read, copied, changed, or rotated.
No Apps Script deployment was changed by this repository commit.

## Step 5 — UTF-8 contract lock

Added:
`cloudflare-d1/test/tasks-v3-t2-hmac-utf8-contract.mjs`

Commit:
`5ee141b00eeb37328b3ec0b520563e727aff3d5d`

The test proves:
- Worker signature for Arabic `وائل` matches Node HMAC-SHA256 over explicit UTF-8 bytes.
- Apps Script bridge source explicitly uses `Utilities.Charset.UTF_8`.
- canonical field ordering stays aligned.
- `claimNext` and `completeTask` remain absent.

Added isolated CI workflow:
`.github/workflows/trendos-tasks-v3-t2-hmac-contract.yml`

Commit:
`fc966d344b9a4b9eb854a0ad4fd071043fe07255`

Run:
`35152830234`

PASS evidence:
- `T2_READONLY_SAFETY_GATE_PASS`
- `TASKS_V3_T2_READONLY_WAEL_CONTRACT_PASS`
- `TASKS_V3_T2_HMAC_UTF8_CONTRACT_PASS`

No external credentials were used by this CI workflow.

## Google project inspection attempt

A read-only browser attempt was made against isolated Apps Script project:
`1F7_z6csPm4Q6Sx-HV59SNDbShqzVcMXfsauZFakLFH_caEYpiCHjTOGV`

Result:
- project editor requires Google authentication
- the available browser profile had no Google credentials
- no code/settings/properties/deployments were opened or changed
- no secret value was exposed

An authenticated Google Drive search for `application/vnd.google-apps.script` also returned no accessible script file through the current Drive connector.

## Current live state

The live T2 Apps Script Version 4 / deployment remains unchanged:
- deployment ID: `AKfycbzo6zcypF7mhECUrfqkP4u0NuzrV373vUQjLMk4o-TMbe4TyV93WkPnrsmeKVHSgCH1Bg`
- current Web App URL remains the previously documented URL

The currently uploaded Cloudflare T2 qualification version remains undeployed:
- version: `69b3737c-ffeb-4e21-b70a-c9cc86da6930`

Active T1 was not changed during these diagnostics.

## Safety / production mutation ledger

Business / production mutations in this diagnostic-remediation pass: **NONE**.

Explicitly zero:
- `claimNext`
- `completeTask`
- Task mutation
- sheet/schema write
- business data write
- Main TrendOS Apps Script mutation
- production frontend Task route
- production Worker route/custom domain change
- D1 business-write authority transfer
- secret read/display/copy/change/rotation
- `EDGE_SESSION_SECRET` change
- `TRENDOS_OPERATOR_TASK_PROXY_SECRET` change
- `TASKS_V3_SHARED_SECRET` change
- Gaber Material Control
- RP-08
- merge to main
- T3

Repository-only reversible commits and read-only HTTP diagnostics were performed.

## Remaining gate before requalification

The fixed Apps Script source is not live yet.

Safest next action is to publish the corrected source as a NEW version/deployment in the same isolated Tasks V3 Apps Script project while preserving:
- existing T1 deployment
- current T2 Version 4 deployment for rollback/reference
- existing Script Properties unchanged
- `TASKS_V3_SHARED_SECRET` unchanged and never revealed

Then point a NEW undeployed/version-isolated Cloudflare T2 preview only at that new T2 Web App URL and run:
1. small Arabic health authentication proof
2. exact 30-sample read-only qualification
3. verify active T1 before/after unchanged

Acceptance remains:
- 30/30 semantic success
- zero HTTP/transport/semantic failures
- p95 <= 2000ms
- no Task mutations

## Known next risk

Authentication remediation does not solve the separate upstream latency problem.
Recent T1/T2 read-only diagnostics still produced intermittent 5000ms adapter timeouts.
Do not change the 5s adapter timeout or the 2s acceptance target without explicit owner approval.

## Decision boundary

Current connected tools do not have authenticated access to the Apps Script editor/project deployment controls.
The next live remediation step therefore requires an owner decision/action to provide an authenticated Google Apps Script path or explicitly choose the deployment method.

T3 remains locked regardless of the T2 result until separate explicit owner approval.
