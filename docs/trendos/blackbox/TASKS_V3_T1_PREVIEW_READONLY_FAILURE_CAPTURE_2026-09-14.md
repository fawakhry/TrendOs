# Tasks V3 T1 Preview — Read-Only Failure Capture

- Date (UTC): 2026-09-14
- Repository: `fawakhry/TrendOs`
- Baseline commit: `db7c316e221269ac2212369f83194a77a5ece260`
- Branch: `tasks-v3-t1-preview-candidate-20260914`
- Preview Worker version: `7ce70995-20f6-4503-a188-966f1c8a1c5c`
- Operator: `wael-preview`
- Role: `WAEL`

## Scope and guardrails

The existing Preview Worker was exercised without deploy, promotion, timeout adjustment, or code/config change. Calls were limited to the read-only operations `health` and `flyPrint`, alternating until the cap of 40 calls because no failures occurred.

Not invoked: `claimNext`, `completeTask`, T2, D1 writes, Gaber, or RP-08. No secret or request signature was captured or recorded.

## Result

- Total calls: **40**
- `health`: **20/20 HTTP 200**, response code `OK`
- `flyPrint`: **20/20 HTTP 200**, response code `OK`
- HTTP 400 responses: **0**
- Captured failures: **0**
- Stop condition: **40-call cap reached**
- Overall correctness for this run: **100%**

Because this run produced no HTTP 400 response, it does **not** provide a failure body that can confirm `TASKS_V3_PREVIEW_UPSTREAM_TIMEOUT` or any alternative error code. The only response code observed in the 40 requested calls was `OK`. The timeout hypothesis therefore remains unconfirmed by this run.

## Latency summary

| Operation | Calls | Min | p50 | p95 | Max | Mean |
|---|---:|---:|---:|---:|---:|---:|
| `health` | 20 | 10,267 ms | 11,076.5 ms | 12,555 ms | 13,293 ms | 11,201 ms |
| `flyPrint` | 20 | 10,488 ms | 11,491 ms | 12,734 ms | 12,935 ms | 11,544 ms |
| Overall | 40 | 10,267 ms | 11,172 ms | 12,734 ms | 13,293 ms | 11,373 ms |

p95 uses nearest-rank over the observed samples.

## Call ledger

| # | Operation | HTTP | Latency | Response code |
|---:|---|---:|---:|---|
| 1 | health | 200 | 13,293 ms | OK |
| 2 | flyPrint | 200 | 12,667 ms | OK |
| 3 | health | 200 | 10,435 ms | OK |
| 4 | flyPrint | 200 | 12,935 ms | OK |
| 5 | health | 200 | 10,696 ms | OK |
| 6 | flyPrint | 200 | 10,568 ms | OK |
| 7 | health | 200 | 10,878 ms | OK |
| 8 | flyPrint | 200 | 10,905 ms | OK |
| 9 | health | 200 | 10,467 ms | OK |
| 10 | flyPrint | 200 | 10,580 ms | OK |
| 11 | health | 200 | 10,267 ms | OK |
| 12 | flyPrint | 200 | 11,443 ms | OK |
| 13 | health | 200 | 10,295 ms | OK |
| 14 | flyPrint | 200 | 10,883 ms | OK |
| 15 | health | 200 | 10,439 ms | OK |
| 16 | flyPrint | 200 | 10,927 ms | OK |
| 17 | health | 200 | 11,255 ms | OK |
| 18 | flyPrint | 200 | 10,488 ms | OK |
| 19 | health | 200 | 11,209 ms | OK |
| 20 | flyPrint | 200 | 10,906 ms | OK |
| 21 | health | 200 | 10,937 ms | OK |
| 22 | flyPrint | 200 | 12,170 ms | OK |
| 23 | health | 200 | 10,818 ms | OK |
| 24 | flyPrint | 200 | 11,539 ms | OK |
| 25 | health | 200 | 12,538 ms | OK |
| 26 | flyPrint | 200 | 11,711 ms | OK |
| 27 | health | 200 | 11,021 ms | OK |
| 28 | flyPrint | 200 | 11,311 ms | OK |
| 29 | health | 200 | 12,555 ms | OK |
| 30 | flyPrint | 200 | 12,226 ms | OK |
| 31 | health | 200 | 11,132 ms | OK |
| 32 | flyPrint | 200 | 12,734 ms | OK |
| 33 | health | 200 | 11,394 ms | OK |
| 34 | flyPrint | 200 | 11,584 ms | OK |
| 35 | health | 200 | 11,568 ms | OK |
| 36 | flyPrint | 200 | 11,121 ms | OK |
| 37 | health | 200 | 11,689 ms | OK |
| 38 | flyPrint | 200 | 12,274 ms | OK |
| 39 | health | 200 | 11,135 ms | OK |
| 40 | flyPrint | 200 | 11,915 ms | OK |

## HTTP 400 evidence

No HTTP 400 response occurred, so there is no JSON error body or failure latency to record for this run.
