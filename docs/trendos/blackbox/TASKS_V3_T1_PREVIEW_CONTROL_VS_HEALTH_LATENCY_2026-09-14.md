# Tasks V3 T1 Preview — Control vs Health Latency Diagnostic

- Date (UTC): `2026-09-14`
- Repository: `fawakhry/TrendOs`
- Baseline commit: `782768a1af33247925e99bfd697869490b4c3d20`
- Branch: `tasks-v3-t1-preview-candidate-20260914`
- Preview Worker version: `7ce70995-20f6-4503-a188-966f1c8a1c5c`
- Operator: `wael-preview`
- Role: `WAEL`
- Classification: **CLIENT/PREVIEW OVERHEAD**

## Guardrails

Diagnostic traffic used the existing Preview Worker without deploy, promotion, timeout adjustment, Worker-version change, or code/config change.

- Control: 20 GET attempts; the Worker returns HTTP 405 before the Apps Script path.
- Real path: 20 POST attempts for read-only `health`.
- Not invoked: `claimNext`, `completeTask`, T2, D1 writes, Gaber, or RP-08.
- No secret or request signature was captured or recorded.

## Outcome

- GET control: **20/20 HTTP 405**.
- POST `health`: **18/20 HTTP 200**.
- POST transport failures: **2/20**, both curl exit 56 with `CONNECT tunnel failed` and proxy HTTP 403; no HTTP response came from the Worker for these two attempts.
- Percentiles for POST use the 18 completed HTTP responses. The two client-side tunnel failures are listed separately and excluded from HTTP latency percentiles.

| Metric | Samples | p50 | p95 |
|---|---:|---:|---:|
| GET 405 total | 20 | 9869.775 ms | 10567.749 ms |
| GET 405 TTFB | 20 | 9827.368 ms | 10523.592 ms |
| POST health total | 18 | 11538.115 ms | 13175.899 ms |
| POST health TTFB | 18 | 11496.487 ms | 13134.779 ms |

## Interpretation

The approximately 10–13 second latency is already present in the GET control path that returns 405 and does not invoke Apps Script:

- GET control total p50 is **9869.775 ms** and p95 is **10567.749 ms**.
- GET control TLS timestamp p50 is **9,588.146 ms**, while the median interval from completed TLS to first byte is only **241.463 ms**.
- POST health adds upstream/application work after TLS: its median completed-TLS-to-TTFB interval is **1,638.233 ms**.
- The dominant common delay is therefore before Worker response handling, concentrated in curl's cumulative TLS/application-connect timestamp. The final two client-side CONNECT tunnel failures reinforce that the observed dominant delay is on the client/Preview access path.

Conclusion: **CLIENT/PREVIEW OVERHEAD**. Apps Script contributes a smaller incremental delay on successful POST calls, but it does not explain the shared ~10 second baseline.

## Timing semantics

Values below are curl's cumulative timestamps from request start:

- DNS: `time_namelookup`
- connect: `time_connect`
- TLS: `time_appconnect`
- TTFB: `time_starttransfer`
- total: `time_total`

All values are milliseconds.

## Per-request ledger

| Group | Run | HTTP | DNS | Connect | TLS | TTFB | Total | Note |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| GET | 1 | 405 | 0.034 | 0.236 | 10717.154 | 10971.012 | 10971.116 | — |
| GET | 2 | 405 | 0.053 | 0.146 | 9397.222 | 9618.735 | 9663.565 | — |
| GET | 3 | 405 | 0.030 | 0.120 | 9475.764 | 9705.504 | 9706.471 | — |
| GET | 4 | 405 | 0.030 | 0.114 | 9303.436 | 9600.210 | 9600.451 | — |
| GET | 5 | 405 | 0.032 | 0.122 | 9542.132 | 9848.906 | 9890.368 | — |
| GET | 6 | 405 | 0.029 | 0.114 | 9754.223 | 10014.258 | 10055.773 | — |
| GET | 7 | 405 | 0.029 | 0.313 | 9516.531 | 9770.809 | 9812.141 | — |
| GET | 8 | 405 | 0.032 | 0.122 | 9702.578 | 9920.790 | 9963.213 | — |
| GET | 9 | 405 | 0.031 | 0.120 | 10251.297 | 10523.592 | 10567.749 | — |
| GET | 10 | 405 | 0.032 | 0.172 | 9605.024 | 9820.990 | 9864.548 | — |
| GET | 11 | 405 | 0.030 | 0.112 | 9482.860 | 9812.646 | 9812.756 | — |
| GET | 12 | 405 | 0.032 | 0.129 | 9849.579 | 10088.768 | 10088.928 | — |
| GET | 13 | 405 | 0.031 | 0.116 | 10173.049 | 10436.604 | 10480.222 | — |
| GET | 14 | 405 | 0.030 | 0.102 | 9877.762 | 10100.161 | 10144.139 | — |
| GET | 15 | 405 | 0.031 | 0.123 | 9590.985 | 9825.692 | 9867.470 | — |
| GET | 16 | 405 | 0.031 | 0.116 | 9585.307 | 9829.044 | 9872.081 | — |
| GET | 17 | 405 | 0.030 | 0.113 | 9729.028 | 9993.959 | 10036.315 | — |
| GET | 18 | 405 | 0.030 | 0.117 | 9360.242 | 9581.490 | 9628.800 | — |
| GET | 19 | 405 | 0.032 | 0.124 | 9525.374 | 9761.316 | 9802.774 | — |
| GET | 20 | 405 | 0.033 | 0.132 | 9568.977 | 9795.454 | 9837.369 | — |
| POST | 1 | 200 | 0.032 | 0.149 | 9723.729 | 11340.777 | 11382.917 | — |
| POST | 2 | 200 | 0.032 | 0.122 | 9605.863 | 11988.976 | 11989.119 | — |
| POST | 3 | 200 | 0.031 | 0.333 | 9875.764 | 11601.937 | 11602.043 | — |
| POST | 4 | 200 | 0.030 | 0.112 | 10218.708 | 12125.318 | 12125.590 | — |
| POST | 5 | 200 | 0.031 | 0.114 | 9739.788 | 11287.194 | 11330.734 | — |
| POST | 6 | 200 | 0.051 | 0.135 | 11181.389 | 12840.807 | 12882.407 | — |
| POST | 7 | 200 | 0.031 | 0.122 | 9838.446 | 11198.085 | 11198.193 | — |
| POST | 8 | 200 | 0.030 | 0.135 | 9641.312 | 11575.330 | 11617.939 | — |
| POST | 9 | 200 | 0.032 | 0.146 | 10711.675 | 12777.673 | 12820.023 | — |
| POST | 10 | 200 | 0.031 | 0.114 | 9784.370 | 11273.416 | 11315.688 | — |
| POST | 11 | 200 | 0.030 | 0.119 | 10017.991 | 11483.609 | 11524.184 | — |
| POST | 12 | 200 | 0.031 | 0.128 | 10596.877 | 13134.779 | 13175.899 | — |
| POST | 13 | 200 | 0.031 | 0.122 | 10077.379 | 11445.427 | 11488.150 | — |
| POST | 14 | 200 | 0.031 | 0.117 | 9614.053 | 10998.971 | 11040.460 | — |
| POST | 15 | 200 | 0.035 | 0.140 | 9382.192 | 11175.287 | 11175.394 | — |
| POST | 16 | 200 | 0.032 | 0.108 | 9995.563 | 11509.366 | 11552.046 | — |
| POST | 17 | 200 | 0.031 | 0.119 | 10066.271 | 11251.996 | 11252.134 | — |
| POST | 18 | 200 | 0.033 | 0.121 | 9629.429 | 11614.878 | 11614.985 | — |
| POST | 19 | none | 0.032 | 0.117 | 0.000 | 0.000 | 11471.617 | CONNECT tunnel failed (proxy HTTP 403) |
| POST | 20 | none | 0.032 | 0.114 | 0.000 | 0.000 | 0.630 | CONNECT tunnel failed (proxy HTTP 403) |
