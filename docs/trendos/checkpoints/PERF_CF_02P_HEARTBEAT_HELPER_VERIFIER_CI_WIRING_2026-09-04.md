# PERF-CF-02P — Heartbeat Helper / Verifier CI Wiring — 2026-09-04

## Trigger
`PERF-CF-02O` implemented the sanitized Apps Script heartbeat helper and the default-off Edge verifier. This checkpoint records regression wiring before execution results are interpreted.

## New tests added
- `tests/d1_orders_low_usage_heartbeat_v1.test.mjs`
  - static safety checks for the Apps Script helper;
  - requires sanitized display-hash presence marker;
  - forbids Sheet writes, Script Property mutation, trigger creation, Spreadsheet access, and Cloudflare fetches.

- `tests/cloudflare_edge_orders_idle_verifier_v1.test.mjs`
  - verifier OFF by default;
  - explicit truthy flag required;
  - HTTPS Apps Script URL required;
  - GET-only heartbeat request;
  - malformed/non-2xx response fails closed;
  - `index_v2.js` contains explicit gated verifier wiring;
  - Preview config has no heartbeat enable flag;
  - Preview Cloud Write remains OFF.

Test commits:
- helper safety test: `f9d0ea67e9d32c9aaca383c7937991bbc4b33b23`
- Edge verifier test: `991dea585d69f7965318470bcb7ac64dc6f0a8cc`

## CI update
Updated `.github/workflows/trendos-integrity-v1.yml` to run both tests and include their source/config paths in PR filtering.

Commit:
- `40acfeb486dae5afda57d154981e482e7ea937b0`

## Safety state
- CI remains `contents: read` only.
- No deployment step was added to Integrity CI.
- Heartbeat verifier remains default OFF in Preview config.
- Production is unchanged.
- Cloud Write remains OFF/non-authoritative.

## Status
**CI WIRING COMPLETE / EXECUTION RESULT PENDING / PRODUCTION UNCHANGED.**

## Next step
Inspect the push-triggered Integrity run on the current branch head and record exact PASS/FAIL before any controlled Apps Script route install or Preview heartbeat enablement.
