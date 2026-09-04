# PERF-CF-02F — Low-Usage Auto-Tick Runtime PASS — 2026-09-04

## Evidence source
User-provided Google Apps Script **Executions** screenshot after activating `startD1OrdersLowUsageSyncV1()`.

## Latest verified production runtime evidence
- Time-driven handler: `d1OrdersLowUsageTickV1`
- Execution source: `Head`
- Started: Sep 4, 2026 7:23:13 PM (Apps Script UI local display)
- Duration: **3.889 s**
- Result: **Completed**

Adjacent Web App executions visible in the same screenshot:
- `doPost` — Version **148** — 7:23:11 PM — **4.811 s** — Completed
- `doGet` — Version **148** — 7:23:26 PM — **158.461 s** — Completed

## Gate result
**Expected:** the newly installed 5-minute time-driven low-usage trigger fires automatically and completes without the previous long-running/timeout behavior.

**Actual:** `d1OrdersLowUsageTickV1` fired automatically and completed in 3.889 s.

**Result: PASS.**

This proves the recurring trigger was installed and the automatic tick itself is healthy at this sample.

## What this screenshot does NOT prove
The Apps Script Executions row alone does not expose the returned object from `d1OrdersLowUsageTickV1`. Therefore this evidence by itself does **not** prove which internal branch was taken:
- unchanged lightweight fingerprint => zero Cloudflare requests / zero D1 writes, or
- source changed => V2 delta sync invoked.

It also does not by itself prove current D1 mirror `syncedAt`, freshness age, Orders/Lines parity, or Production `/v1/edge/orders/page` readability.

The V1.1 source contract on the working branch states that an unchanged lightweight fingerprint makes zero Cloudflare requests and zero D1 writes; a real source change delegates to V2 delta sync.

## Performance interpretation
The 3.889 s automatic tick is a major improvement over the earlier long-running recurring sync path.

The adjacent `doGet` taking 158.461 s is a separate Web App request and remains strong evidence that Apps-Script-first reads are still a major latency bottleneck. It does not invalidate the low-usage tick PASS.

## Read-cutover gate
Orders Read Cutover remains a **separate controlled gate**. Before enabling it, require fresh runtime evidence for:
1. D1 Orders/Lines freshness and source row parity.
2. Production signed Orders Edge route returns `dataSource=d1-edge`.
3. Apps Script fallback remains available.
4. Cloud Write remains unchanged/OFF.

Rollback for the read cutover remains: disable the Orders Edge read feature flag and return reads to Apps Script.

## Safety state
- Google Sheets remains source of truth.
- No Cloud Write authority change is implied by this PASS.
- CORE-P0 remains paused/unrelated.
