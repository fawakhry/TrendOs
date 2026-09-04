# PERF-CF-02L — Dual-Signal Freshness CI Wiring — 2026-09-04

## Trigger
`PERF-CF-02K` implemented the dual-signal freshness proof and new regression files, but the main `TrendOS Integrity V1` workflow did not execute those tests.

## CI inspection
Reviewed:
- `.github/workflows/trendos-integrity-v1.yml`

The workflow ran the older Edge Gateway test and the Integrity suite but did not include:
- `tests/cloudflare_edge_orders_freshness_gate_v1.test.mjs`
- `tests/cloudflare_edge_orders_idle_heartbeat_v1.test.mjs`
- `tests/cloudflare_edge_orders_idle_freshness_integration_v1.test.mjs`

It also did not list the new heartbeat/freshness source files in pull-request path filtering.

## Safe change executed
Updated the GitHub-only Integrity workflow to include:
- the existing Orders freshness-gate regression;
- the new idle-heartbeat validator regression;
- the new idle-freshness integration regression;
- source/test path filters for the affected files.

Commit:
- `cfb6e4dd316e5993d48ffd215f8a262a3c95fbb4`

## Safety state
- CI permissions remain `contents: read`.
- No deployment step was added to this Integrity workflow.
- No Apps Script mutation.
- No D1 mutation.
- No Production Cloudflare change.
- No read cutover.
- No Cloud Write authority change.

## Status
**CI WIRING UPDATED / EXECUTION RESULT PENDING / PRODUCTION UNCHANGED.**

## Next step
Read the push-triggered `TrendOS Integrity V1` run for commit `cfb6e4dd316e5993d48ffd215f8a262a3c95fbb4`, inspect the exact failed/passed step(s), and record PASS/FAIL before any further implementation or Preview wiring.
