# TrendOS Tasks V3 — T1 Preview Stability Confirmation — 2026-09-15

## Purpose
Confirm whether the optimized T1 health p95 > 2s was a one-window outlier or persistent platform instability. No code, Worker, secret, timeout, protocol, spreadsheet, or production changes were made between samples.

## Deployed source
- Apps Script optimized source: `8c34ccaaef10d5e4fd1977a62421b21bce8bd95c`
- Previous optimized requalification checkpoint: `791251c3127b233a028c56c7cfed47a8be6ef3f9`

## Stability sample
- GitHub Actions run: `34958340960`
- Rerun job id: `104352635661`
- Versioned T1 Preview endpoint only
- 30 health attempts
- 30/30 HTTP 200 success
- 0 HTTP failures
- 0 transport failures

## Results
Nearest-rank p50/p95:

| Metric | p50 ms | p95 ms | min ms | max ms |
|---|---:|---:|---:|---:|
| workerMs | 1183 | 2483 | 843 | 2634 |
| upstreamMs | 1183 | 2483 | 843 | 2634 |
| verifyAssertionMs | 48 | 105 | 10 | 105 |
| propertiesMs | 44 | 103 | 8 | 104 |
| openSpreadsheetMs | 226 | 1393 | 166 | 1768 |
| sheetLookupMs | 4 | 16 | 2 | 110 |
| totalBridgeMs | 283 | 1503 | 186 | 1864 |

Representative evidence of platform overhead outside measured bridge work:
- Sample 2: upstream/worker 2170 ms, totalBridge 266 ms => ~1904 ms outside bridge code.
- Sample 9: upstream/worker 2483 ms, totalBridge 502 ms => ~1981 ms outside bridge code.
- Sample 5: upstream/worker 2634 ms, totalBridge 1864 ms, with openSpreadsheet 1768 ms.

## Comparison
Optimized sample A p95: 2388 ms.
Optimized sample B p95: 2483 ms.
Both samples had 30/30 functional success but both failed the <= 2000 ms p95 acceptance gate.

## Conclusion
The >2s p95 is persistent, not a single-window outlier.

Primary blocker: Apps Script platform/startup/upstream latency outside the measured bridge code.
Secondary blocker: variable SpreadsheetApp.openById latency.

Further micro-optimization inside Code.gs cannot guarantee the <=2s p95 gate because observed outside-bridge overhead alone can approach or exceed 2s.

## Decision / guardrails
- T1 remains FAIL.
- T2 remains locked.
- No claimNext / completeTask.
- No production mutation.
- No secret rotation/change.
- Next step requires an architecture decision for the T1 read path rather than another Code.gs micro-optimization. Recommended direction: remove Apps Script from the synchronous read hot path while preserving Sheets as authority, subject to owner approval and a separate scoped design checkpoint.
