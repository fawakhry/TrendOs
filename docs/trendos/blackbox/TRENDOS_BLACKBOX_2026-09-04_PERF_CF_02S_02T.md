# TrendOS Blackbox — PERF-CF-02S / 02T — 2026-09-04

## 02S — safety boundary discovered
Before live heartbeat installation, the Edge validator was found to match Lines source shape but not require the same exact source-shape match for Orders. Production remained untouched.

Decision: harden dual-signal freshness so heartbeat can never override structural mismatch in either `الأوردرات` or `بنود الأوردرات`.

## 02T — hardening verified
At head `b72e04ef262276a2f22dd2a3528d40b7a636bf93`:
- both Orders and Lines D1 catalog metadata are checked before business-row reads;
- both require ready/parity/live-note;
- heartbeat source shape must match both catalogs;
- heartbeat extends freshness only for age-only staleness;
- all mismatch/error cases fail closed to Apps Script.

CI evidence:
- Integrity run `33900147809` / job `101112052292`: SUCCESS.
- Orders-read qualification run `33900147839` / job `101112052452`: SUCCESS.
- Auto Preview run `33900147840` deployed and passed safety through benchmark; final old `syncedAt`-only gate remains the expected blocker while heartbeat is OFF.

Production state remains unchanged:
- Apps Script heartbeat route not installed live;
- Preview heartbeat verifier OFF;
- Production Orders read cutover OFF;
- Cloud Write OFF;
- Sheets + Apps Script authoritative for writes.

Next: make Auto Preview qualification dual-signal-aware while preserving default-off fail-closed behavior. Once the live read-only Apps Script route is installed and verified, explicitly enable heartbeat on Preview and require a signed protected Orders read returning `dataSource=d1-edge` before any Production cutover.

Detailed checkpoints:
- `docs/trendos/checkpoints/PERF_CF_02S_DUAL_SIGNAL_PARITY_HARDENING_BOUNDARY_2026-09-04.md`
- `docs/trendos/checkpoints/PERF_CF_02T_DUAL_SIGNAL_ORDERS_LINES_HARDENING_CI_PASS_2026-09-04.md`
