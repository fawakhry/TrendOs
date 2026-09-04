# PERF-CF-02T — Dual-Signal Orders + Lines Hardening CI PASS — 2026-09-04

## Trigger
`PERF-CF-02S` identified that the idle-heartbeat validator must match both Orders and Lines source shape against D1 metadata before any read cutover.

## Implemented hardening
- `edge-orders-idle-heartbeat.mjs` now requires expected source shape for both:
  - `الأوردرات`
  - `بنود الأوردرات`
- `edge-orders-freshness-gate.mjs` now reads metadata-only catalog rows for both sheets before any business-row query.
- A heartbeat can extend logical freshness only when both mirrors are structurally valid (`ready` + row parity + live-sync note) and the only failure is age.
- Heartbeat source row/column shape must match both D1 catalogs.
- Orders mismatch, Lines mismatch, parity/status/live-note failure, stale/invalid heartbeat, or verifier error all fail closed to Apps Script.
- Historical response field `mirror` remains mapped to Lines for compatibility; explicit `ordersMirror` / `mirrors` evidence was added.

## Commits
- heartbeat Orders+Lines shape hardening: `735cd78981b62a0c54607e2324784afb6c01078f`
- dual-catalog freshness gate: `2e55581afc888527c6db2198ca8c24d8f8eec834`
- heartbeat mismatch regression: `12fa1987ec139b9c26b05b693bcf5126713dea96`
- integration regression: `1fefaf68b3da93a84ed658b223bde28b2415f8dc`
- freshness metadata regression: `b72e04ef262276a2f22dd2a3528d40b7a636bf93`

## Verified CI at head
Head SHA: `b72e04ef262276a2f22dd2a3528d40b7a636bf93`

### TrendOS Integrity V1
Run: `33900147809`
Job: `integrity-foundation` / `101112052292`
Conclusion: **SUCCESS**

Explicit PASS steps include:
- Cloudflare Edge Orders freshness gate;
- idle heartbeat;
- idle freshness integration;
- low-usage heartbeat helper safety;
- idle verifier;
- all existing Integrity/Core/Press/Invoice/WhatsApp/OPS/Auth/router/composition/pre-deploy regressions.

### Orders Read qualification
Run: `33900147839`
Job: `qualify-orders-read` / `101112052452`
Conclusion: **SUCCESS**

PASS:
- Orders edge read unit contract;
- raw mirror freshness fail-closed contract;
- existing Edge regression;
- existing mirror regression.

### Auto Preview
Run: `33900147840`
Job: `deploy-edge-preview` / `101112052426`
- Preview deployment and safety checks through benchmark: PASS.
- Final legacy `Gate Orders and Lines mirror freshness`: FAIL as expected because it still uses write-timestamp age only while heartbeat is OFF.

This final failure does not invalidate the deployed Preview safety state and remains the intentional cutover blocker until the live read-only heartbeat route exists and Preview heartbeat verification is explicitly enabled.

## Production impact
**NONE.**
- no live Apps Script source mutation;
- heartbeat verifier OFF on Preview;
- Production read cutover OFF;
- Cloud Write OFF;
- Sheets + Apps Script authoritative for writes.

## Exact next step
Make Auto Preview qualification dual-signal-aware without weakening the default-off behavior: while heartbeat flag is OFF, preserve the current fail-closed legacy gate; once the flag is explicitly ON after live Apps Script route verification, qualify through the protected signed Orders Edge route and require `dataSource=d1-edge`.
