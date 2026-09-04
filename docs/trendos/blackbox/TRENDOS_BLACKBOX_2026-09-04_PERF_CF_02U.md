# TrendOS Blackbox — PERF-CF-02U — 2026-09-04

A dedicated default-off dual-signal Orders Preview qualification workflow was added:
`.github/workflows/trendos-cloudflare-orders-dual-signal-preview.yml`

Commit: `a9b452bbbb2c50083834f73f2b740a8b812241ec`

First run:
- run `33900388815`
- job `101112816331`
- conclusion: SUCCESS
- mode: SAFE-SKIP because `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED` is not enabled on Preview.

When enabled later, the workflow requires the protected Preview Orders route to return HTTP 200 with `dataSource=d1-edge-orders`; otherwise it fails closed.

Current safety state remains:
- Apps Script live heartbeat route: NOT INSTALLED.
- Preview heartbeat: OFF.
- Production Orders read cutover: OFF.
- Cloud Write: OFF.
- Sheets + Apps Script: authoritative writes.

Exact next boundary: controlled live Apps Script Version-148 source edit adding the sanitized helper and one guarded route. Current connected tools do not expose Apps Script source mutation, so no blind production edit is allowed. After that route is verified, enable heartbeat on isolated Preview only and require the new qualification workflow to PASS before any Production read cutover.

Detailed checkpoint:
`docs/trendos/checkpoints/PERF_CF_02U_DUAL_SIGNAL_PREVIEW_QUALIFIER_SAFE_SKIP_PASS_2026-09-04.md`
