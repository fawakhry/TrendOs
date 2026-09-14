# Tasks V3 T1 Preview — Internal Server-Timing Qualification

- Date (UTC): `2026-09-14`
- Repository: `fawakhry/TrendOs`
- Baseline commit: `c82f516ab11c4dbe3583fac2967f42db2a508901`
- Instrumentation commit: `ff9cb35415d6f73dc305de06b177b265a75e6a20`
- Branch: `tasks-v3-t1-preview-candidate-20260914`
- Versioned Preview ID: `daf384a9-27ae-4260-bf53-1757555caca0`
- Operator: `wael-preview`
- Role: `WAEL`
- Qualification: **FAIL**

## Scope

Only `cloudflare-d1/src/tasks-v3-t1-preview-worker.mjs` was changed from the baseline. The comparison is one commit ahead with one modified file. `cloudflare-d1/src/tasks-v3-readonly-preview.mjs` was not changed.

The Worker entrypoint now:

- starts `workerElapsedMs` at entry to `fetch()`;
- supplies a `fetchImpl` wrapper to `proxyTasksV3ReadonlyPreview`;
- measures the upstream fetch promise with `performance.now()`;
- emits only `worker;dur=...` and `upstream;dur=...` in the `Server-Timing` response header.

No request body, assertion body, secret, signature, or sensitive header is logged or emitted.

## Verification before upload

- Current Tasks V3 contract tests: **11/11 passed**.
- Read-only bridge contract marker: `TASKS_V3_READONLY_BRIDGE_CONTRACT=PASS`.
- Supplemental entrypoint smoke test: `TASKS_V3_T1_SERVER_TIMING_SMOKE=PASS`.
- JavaScript syntax check: passed.
- Static scan of the modified entrypoint found no console logging or forbidden mutation identifiers.

## Preview upload and production isolation

Cloudflare Workers Builds completed successfully for the isolated Preview Worker and produced Version ID `daf384a9-27ae-4260-bf53-1757555caca0`.

No Promote action was performed. No production route or timeout was changed. After qualification, the unversioned Active Worker endpoint still returned HTTP 200 with the pre-existing `Hello World!` body, confirming the tested version was not promoted to Active deployment.

## Diagnostic method

Thirty sequential POST attempts were sent to the version-specific Preview URL:

```json
{"op":"health","operator":"wael-preview","role":"WAEL","payloadJson":"{}"}
```

For each attempt, client total time came from curl `time_total`; Worker and upstream values came only from the response `Server-Timing` header. Client TLS latency is not used in the server-side qualification.

## Results

- Attempts: **30**
- HTTP 200 / response code `OK`: **29**
- Client transport failures: **1**
- The failed attempt was curl exit 28 after 30 seconds and returned no HTTP response or `Server-Timing`.
- Completed samples above 2,000 ms: **5/29**

| Server-side metric | Samples | p50 | p95 | Min | Max |
|---|---:|---:|---:|---:|---:|
| Worker elapsed | 29 | **1,402 ms** | **2,395 ms** | 1,021 ms | 2,717 ms |
| Apps Script upstream fetch | 29 | **1,402 ms** | **2,395 ms** | 1,021 ms | 2,717 ms |

Percentiles use nearest-rank p95. Values are reported to the timing resolution exposed by the Worker runtime.

## Acceptance decision

Target: T1 read-only server-side p95 <= 2,000 ms with complete stability.

Result: **FAIL**.

Reason:

1. Worker p95 is **2,395 ms**, above the 2,000 ms target.
2. Apps Script upstream-fetch p95 is **2,395 ms**, above the 2,000 ms target.
3. One of 30 client attempts failed before an HTTP response was received.

The qualification is based on internal server timing, not the much larger client TLS/Preview access latency.

## Per-attempt ledger

All timing values are milliseconds. `NA` means no Worker response/header was received.

| Run | HTTP | Client total | Worker elapsed | Upstream fetch | Result code |
|---:|---|---:|---:|---:|---|
| 1 | 200 | 12231.934 | 1840.00 | 1840.00 | OK |
| 2 | 200 | 12140.822 | 1450.00 | 1450.00 | OK |
| 3 | 200 | 11545.947 | 1397.00 | 1397.00 | OK |
| 4 | 200 | 11422.524 | 1495.00 | 1495.00 | OK |
| 5 | 200 | 10994.827 | 1118.00 | 1118.00 | OK |
| 6 | 200 | 12473.965 | 2067.00 | 2067.00 | OK |
| 7 | 200 | 12133.602 | 2003.00 | 2003.00 | OK |
| 8 | 200 | 11460.689 | 1402.00 | 1402.00 | OK |
| 9 | 200 | 11279.750 | 1050.00 | 1050.00 | OK |
| 10 | 200 | 11744.022 | 1231.00 | 1231.00 | OK |
| 11 | 200 | 12883.331 | 1113.00 | 1113.00 | OK |
| 12 | 200 | 11049.939 | 1193.00 | 1193.00 | OK |
| 13 | 200 | 11746.091 | 1237.00 | 1237.00 | OK |
| 14 | 200 | 11186.862 | 1403.00 | 1403.00 | OK |
| 15 | 200 | 11544.546 | 1391.00 | 1391.00 | OK |
| 16 | 200 | 11257.268 | 1314.00 | 1314.00 | OK |
| 17 | 200 | 11626.574 | 1560.00 | 1560.00 | OK |
| 18 | 200 | 11166.710 | 1021.00 | 1021.00 | OK |
| 19 | 200 | 11566.879 | 1381.00 | 1381.00 | OK |
| 20 | 200 | 13322.868 | 1877.00 | 1877.00 | OK |
| 21 | 200 | 13244.417 | 2717.00 | 2717.00 | OK |
| 22 | 200 | 11061.392 | 1258.00 | 1258.00 | OK |
| 23 | 200 | 12446.381 | 2395.00 | 2395.00 | OK |
| 24 | 200 | 11049.013 | 1301.00 | 1301.00 | OK |
| 25 | CURL_EXIT_28 | 30002.372 | NA | NA | NA |
| 26 | 200 | 11923.550 | 1636.00 | 1636.00 | OK |
| 27 | 200 | 11661.547 | 1841.00 | 1841.00 | OK |
| 28 | 200 | 13009.734 | 1338.00 | 1338.00 | OK |
| 29 | 200 | 11987.533 | 2172.00 | 2172.00 | OK |
| 30 | 200 | 11597.140 | 1441.00 | 1441.00 | OK |

## Guardrails

- No Production deploy or route change.
- No Active deployment promotion.
- No main Apps Script change.
- No Production Spreadsheet mutation.
- No timeout change.
- No `claimNext` or `completeTask`.
- No D1 write.
- No Gaber, RP-08, or T2 work.
