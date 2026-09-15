# Tasks V3 T1 — Health Stage Diagnostic — 2026-09-15

## Result

**T1 REMAINS FAIL — STABILITY PASSED, LATENCY MISSED TARGET BY 21 ms**

## Scope

This checkpoint records the read-only T1 health-stage diagnostic after the owner manually updated the existing standalone Apps Script Web App deployment with the prepared diagnostic source.

No optimization was performed in this step.

## Isolated resources

- Branch: `tasks-v3-t1-preview-candidate-20260914`
- Standalone Apps Script project: `TrendOS Tasks V3 T1 Preview Bridge 2026-09-14`
- Script ID: `1F7_z6csPm4Q6Sx-HV59SNDbShqzVcMXfsauZFakLFH_caEYpiCHjTOGV`
- Existing Web App deployment ID retained: `AKfycbya5NyWMpBLEt_wR7Qklq1YC7PPFJI02-M1xKTMgx-0CdoI4zzW0z0rwAix8JYRst6bJA`
- Diagnostic source origin: code commit `26c7695dca91f4c0381e23661dad7d5aaf4b5112`
- Versioned Cloudflare Preview ID: `daf384a9-27ae-4260-bf53-1757555caca0`
- Versioned Preview URL: `https://daf384a9-trendos-tasks-v3-t1-preview-20260914.trendmall-contact.workers.dev`

The owner reported that `Code.gs` was replaced with the diagnostic source, saved, and the same existing Web App deployment was updated using a new version while preserving deployment identity/settings.

## Diagnostic runner

An isolated GitHub Actions diagnostic runner was added only on the T1 branch:

- Workflow: `.github/workflows/trendos-tasks-v3-t1-health-diagnostic.yml`
- Initial workflow commit: `8c04a03631516a697d4737f6007a9320d6e819c4`
- Connectivity hardening commit: `f22b1dc9c6606d8a28a282bec7d64673066b02d3`
- Nested diagnostic parser fix: `4d11fa58d8be4d54cf4c2e0f6586374225d71682`

Runner history:

1. Run `34958046478`: default client identity received HTTP 403 before entering the Worker. Discarded as qualification evidence.
2. Run `34958161516`: browser-like request path succeeded; 29/30 successful calls and one confirmed `TASKS_V3_PREVIEW_UPSTREAM_TIMEOUT`. This run also revealed that bridge diagnostics are nested under `body.diagnostic`; its stage metrics were therefore not used as authoritative.
3. Run `34958340960`: authoritative stage diagnostic after parser correction.

## Authoritative 30-call result

Run: `34958340960`

- Attempts: **30**
- HTTP 200 success: **30/30**
- HTTP failures: **0**
- Transport failures: **0**
- Operator: `wael-preview`
- Role: `WAEL`
- Operation: `health` only
- Mutation operations: **zero**

Nearest-rank percentiles:

| Metric | Samples | p50 | p95 | Min | Max |
|---|---:|---:|---:|---:|---:|
| Worker elapsed | 30 | **1,349 ms** | **2,021 ms** | 915 ms | 2,084 ms |
| Apps Script upstream fetch | 30 | **1,349 ms** | **2,021 ms** | 915 ms | 2,084 ms |
| Assertion verification | 30 | **51 ms** | **106 ms** | 20 ms | 118 ms |
| Script Properties access | 30 | **96 ms** | **211 ms** | 53 ms | 217 ms |
| `SpreadsheetApp.openById` | 30 | **261 ms** | **794 ms** | 163 ms | 895 ms |
| Sheet lookup | 30 | **4 ms** | **16 ms** | 2 ms | 21 ms |
| Total instrumented bridge | 30 | **358 ms** | **973 ms** | 259 ms | 1,030 ms |

Acceptance target: server-side/read-only p95 <= **2,000 ms** with stability.

Decision: **FAIL** because p95 is **2,021 ms**, exceeding the target by **21 ms**. Stability for this run passed at 30/30 successful responses.

## Bottleneck classification

Worker elapsed and upstream fetch are equal sample-by-sample, so Cloudflare Worker compute overhead is negligible for this path.

Derived upstream time outside the instrumented bridge (`upstreamMs - totalBridgeMs`):

- p50: **932 ms**
- p95: **1,243 ms**
- min: 628 ms
- max: 1,395 ms

This remainder is larger than any single measured bridge stage and is consistent with Apps Script platform/startup/request execution and upstream HTTP/runtime overhead that occurs outside the timed bridge body.

Within the bridge itself, `SpreadsheetApp.openById` is the dominant measured stage:

- openById p95: **794 ms**
- total bridge p95: **973 ms**
- assertion p95: 106 ms
- properties p95: 211 ms
- sheet lookup p95: 16 ms

Classification:

1. **Primary:** Apps Script platform/startup/upstream overhead outside the instrumented bridge.
2. **Secondary:** `SpreadsheetApp.openById` variability inside the bridge.
3. **Not material:** sheet lookup.
4. **Minor:** assertion/HMAC and Script Properties access.

## Safety ledger

- Main TrendOS Apps Script mutation: **NO**
- Main Apps Script Production deployment: **NO**
- Production spreadsheet mutation: **NO**
- Production Worker deployment: **NO**
- Active Worker promotion: **NO**
- Production/custom route change: **NO**
- Existing secret change/rotation: **NO**
- `claimNext`: **ZERO**
- `completeTask`: **ZERO**
- D1 business write: **ZERO**
- Gaber Material Control: **NO**
- RP-08: **NO**
- T2: **NOT STARTED / LOCKED**

## Exact next step

Do not start T2.

Propose the smallest isolated T1 optimization experiment based on this evidence, targeting the Apps Script platform/open-spreadsheet cost without changing protocol, HMAC validation, timeout policy, allowed operations, read-only behavior, spreadsheet authority, secrets, or Production wiring. Requalify T1 after the optimization and require p95 <= 2,000 ms with stability before requesting owner approval for T2.
