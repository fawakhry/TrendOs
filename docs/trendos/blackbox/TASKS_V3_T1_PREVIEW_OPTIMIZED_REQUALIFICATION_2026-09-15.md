# TrendOS Tasks V3 — T1 Preview Optimized Requalification — 2026-09-15

## Scope
Read-only T1 Preview health requalification after the Script Properties snapshot optimization. No production mutation, no secret change, no T2/T3 action.

## Deployed source
- Optimized bridge source commit: `8c34ccaaef10d5e4fd1977a62421b21bce8bd95c`
- Optimization: health reads Script Properties once via a snapshot and reuses that snapshot for HMAC secret and spreadsheet ID.
- Protocol, HMAC validation, timeout, operations, spreadsheet, read-only behavior, and Worker production config unchanged.

## Requalification run
- GitHub Actions run: `34958340960`, rerun job id `104352035816`
- Versioned T1 Preview endpoint only
- 30 health attempts
- 30/30 HTTP 200 success
- 0 HTTP failures
- 0 transport failures

## Server-side results
Nearest-rank p50/p95 from 30 successful samples:

| Metric | p50 ms | p95 ms | min ms | max ms |
|---|---:|---:|---:|---:|
| workerMs | 1125 | 2388 | 869 | 3067 |
| upstreamMs | 1125 | 2388 | 869 | 3067 |
| verifyAssertionMs | 48 | 106 | 16 | 594 |
| propertiesMs | 45 | 105 | 13 | 591 |
| openSpreadsheetMs | 229 | 965 | 138 | 1373 |
| sheetLookupMs | 4 | 12 | 2 | 16 |
| totalBridgeMs | 279 | 1021 | 158 | 1994 |

Derived upstream-minus-totalBridge platform/transport overhead:
- median: ~826.5 ms
- p95: ~1344 ms
- max: 2137 ms

## Comparison with pre-optimization diagnostic
Pre-optimization 30-sample run had:
- worker/upstream p50 1349 ms, p95 2021 ms
- properties p50 96 ms, p95 211 ms
- openSpreadsheet p50 261 ms, p95 794 ms
- totalBridge p50 358 ms, p95 973 ms

The optimization materially improved the intended local path:
- properties p50 96 -> 45 ms
- properties p95 211 -> 105 ms
- totalBridge p50 358 -> 279 ms
- worker/upstream p50 1349 -> 1125 ms

However, server-side p95 regressed to 2388 ms because of Apps Script/platform variability outside the measured bridge code. One sample had upstream 2388 ms while totalBridge was only 251 ms, showing ~2137 ms outside measured bridge work. Another sample had upstream 3067 ms with totalBridge 1994 ms.

## Classification
Primary current bottleneck: **Apps Script platform/startup/upstream transport variance outside the measured bridge code**.
Secondary contributor: **SpreadsheetApp.openById variability**.
HMAC/assertion and sheet lookup are not the dominant p95 bottleneck.

## Decision
- T1 remains **FAIL** because read-only p95 target is <= 2000 ms and observed p95 is 2388 ms.
- Do not start T2.
- Do not perform claimNext/completeTask.
- No Production mutation occurred.
- Before any further architecture change, run one additional unchanged 30-call health sample to confirm whether the >2 s p95 is persistent instability versus a single sample-window outlier.
