# PERF-CF-02K — Dual-Signal Freshness GitHub Implementation — 2026-09-04

## Trigger
Implementation follows the confirmed model mismatch in `PERF-CF-02I` and routing boundary in `PERF-CF-02J`.

## Scope
GitHub working branch only. No Production Apps Script source, deployment, Cloudflare Production route, D1 data, feature flag, trigger, property, or write authority was changed.

## Implemented source
### New validator
Created:
- `cloudflare-d1/src/edge-orders-idle-heartbeat.mjs`
- commit `e89582f8bca3fd9963eff2641b01c46c23a03fe9`

The validator accepts a low-usage status payload only when all fail-closed conditions pass, including:
- status success + low-usage/lightweight mode;
- controller enabled;
- exact 5-minute interval contract;
- exactly one low-usage trigger;
- zero legacy V1/direct V2 recurring trigger duplicates;
- trusted light fingerprint present;
- no last error and zero consecutive errors;
- zero unchanged-source D1 writes / Cloudflare requests;
- latest idle check is successful and exactly `unchanged-light-fingerprint-no-d1-request`;
- `sourceChanged=false`, `d1RequestMade=false`, `d1WriteMade=false`;
- Orders and Lines source fingerprint entries are present;
- Lines source shape matches the D1 catalog metadata supplied by the freshness guard;
- heartbeat age remains within a bounded budget (default 720s, clamp 300..1800s).

### Freshness gate extension
Updated:
- `cloudflare-d1/src/edge-orders-freshness-gate.mjs`
- commit `c450eb35e9cff2158c2c22fa60a8490747c1477a`

Contract:
- fresh D1 write-age continues to pass exactly as before;
- stale D1 write-age continues to FAIL by default if no verifier is supplied;
- heartbeat verification is optional/injected only;
- heartbeat may extend logical freshness **only** for the stale-by-age case;
- heartbeat can never override status, parity, or live-note failures;
- verifier error/malformed/invalid/stale heartbeat remains fail-closed to Apps Script fallback;
- no business-row query is introduced into the metadata guard.

No runtime verifier is wired from `index_v2.js` yet. Therefore the deployed/default behavior cannot silently change from this source change alone.

## Regression coverage
Created validator unit regression:
- `tests/cloudflare_edge_orders_idle_heartbeat_v1.test.mjs`
- commit `bdc00ee0ab0c788f7cdcf93abdd4a6c34e11cdc0`

Created gate integration regression:
- `tests/cloudflare_edge_orders_idle_freshness_integration_v1.test.mjs`
- commit `87f6d36dac7c3e0916b108b1e839bb17b4c8b0d8`

Coverage includes:
- stale D1 without verifier => existing fail-closed 503 contract;
- stale D1 + recent healthy unchanged-source heartbeat => allowed by optional verifier path;
- stale heartbeat => fail closed;
- recorded source error/consecutive error => fail closed;
- parity failure => fail closed and verifier is not called;
- validator trigger/fingerprint/mode/source-shape checks.

An attempted replacement of the older freshness-gate regression file was blocked by the connector's write safety layer before mutation. The existing historical test file therefore remains unchanged. New isolated regression files were added instead; this preserves the old default-behavior test and adds explicit new-path coverage.

## Status
**IMPLEMENTED ON WORKING BRANCH / TEST EXECUTION PENDING / PRODUCTION UNCHANGED.**

## Next step
Inspect the current CI workflow test list, add the two new regression files to the appropriate GitHub-only CI gate if not already covered, run/observe CI, and record exact PASS/FAIL before any Preview/runtime wiring is considered.
