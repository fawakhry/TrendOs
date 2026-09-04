# PERF-CF-02M — Dual-Signal Freshness CI PASS — 2026-09-04

## Trigger
`PERF-CF-02L` wired the new dual-signal freshness regressions into `TrendOS Integrity V1` CI.

## Verified run
Workflow: `TrendOS Integrity V1`

Run:
- ID: `33898052838`
- Run number: `436`
- Head SHA: `5d77585e8c0941b67e59411ab4349b9b34149fdc`
- Event: `push`
- Status: `completed`
- Conclusion: `success`

Job:
- `integrity-foundation`
- Job ID: `101105301994`

## New regression results
All new/affected freshness steps completed successfully:
- Cloudflare Edge Gateway V1 tests: PASS
- Cloudflare Edge Orders freshness gate tests: PASS
- Cloudflare Edge Orders idle heartbeat tests: PASS
- Cloudflare Edge Orders idle freshness integration tests: PASS

## Existing regression results
The same run also completed successfully through the existing safety suite, including:
- polling coalescing;
- Integrity foundation/runtime tools;
- CORE-P0 remediation and registry writer tests;
- Order/Line;
- Attendance/Cleaning;
- Press;
- Invoice;
- WhatsApp;
- Customer Manager stable-send IDs;
- Handover/OPS;
- ANDON;
- Integrity Dashboard;
- Fast Auth V2.5 SAFE tests;
- Integrity Router;
- composed Apps Script syntax/collision;
- pre-deploy package safety gate.

## Interpretation
The GitHub-only dual-signal model is regression-qualified:
- current write-age freshness remains the default fail-closed behavior;
- a recent healthy unchanged-source heartbeat can safely qualify only the stale-by-age case when an explicit verifier is injected;
- invalid/missing/error heartbeat remains fail-closed;
- parity/non-ready/non-live metadata cannot be overridden;
- existing Integrity safety regressions remain green.

This CI PASS is **not** a Production runtime PASS and does not prove that Version 148 exposes a heartbeat route.

## Production impact
**NONE.**
- No Apps Script source/deployment mutation.
- No Production Cloudflare deployment/cutover.
- No D1 mutation/import.
- Cloud Write remains OFF/non-authoritative.
- Sheets + Apps Script remain write authority.
- CORE-P0 remains paused.

## Exact next step
Inspect the current Version-148-compatible action-routing opportunity without modifying `Code.gs`. Determine the smallest standalone/sanitized heartbeat route contract that can be installed later under a controlled Apps Script gate, and pair it with a Preview-only Edge verifier. Do not enable Production read cutover.
