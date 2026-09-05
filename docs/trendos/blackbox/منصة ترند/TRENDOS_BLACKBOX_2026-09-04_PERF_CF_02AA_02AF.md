# TRENDOS BLACKBOX — PERF-CF-02AA → 02AF — 2026-09-04

## Purpose
Canonical continuation record for the Cloudflare Orders-read migration after the earlier 02R–02W blackbox entries. This file records only verified execution evidence and preserves the rule: no production cutover until every gate is explicitly PASS.

## PERF-CF-02AA — Apps Script heartbeat route saved, pending deploy
The live Apps Script editor was updated with:
- separate helper file `D1_Orders_Low_Usage_Heartbeat_V1`;
- one `doGet` route: `getD1OrdersLowUsageHeartbeatV1`.
No deployment had occurred at that checkpoint.

## PERF-CF-02AB — Apps Script Version 149 deployed
The existing Web App deployment was updated to Version 149. No Cloudflare flag, Orders frontend cutover, or Cloud Write activation was part of the deployment.

## PERF-CF-02AC — Live heartbeat route PASS
A GET-only GitHub runtime probe returned HTTP 200 and `HEARTBEAT_ROUTE_STATE=INSTALLED`.
Verified safe status included:
- low-usage enabled;
- interval 5 minutes;
- exactly one low-usage trigger;
- zero legacy V1 triggers;
- zero direct V2 triggers;
- no last error;
- zero consecutive errors;
- unchanged-source idle mode;
- zero D1 request/write during idle.

## PERF-CF-02AD — Dual-signal Preview + CI PASS
Isolated Preview enabled `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED=true` while `TRENDOS_CLOUD_WRITE_V1_ENABLED=false`.
The protected Preview Orders route propagated from an initial 503 to HTTP 200 and returned `dataSource=d1-edge-orders` with no Apps Script fallback.
The full Integrity CI then passed after updating the old verifier regression to match the explicit Preview qualification phase.
The old generic Auto Preview still has a direct `syncedAt <= 600s` gate and can fail during legitimate idle; this is classified as a legacy workflow-gate mismatch, not a protected Orders-route runtime failure.

## PERF-CF-02AE — Production Preflight obsolete URL diagnosed
The first read-only production preflight targeted the obsolete `trendos.trendmall-contact.workers.dev` API URL and received `Not found`. No production deploy or data mutation occurred. The D1 production Worker target was corrected to `trendos-d1-api.trendmall-contact.workers.dev`.

## PERF-CF-02AF — Correct Production Preflight PASS
Read-only preflight on the correct production D1 Worker passed:
- Edge health: PASS; cutover false.
- Orders raw mirror: 274/274, ready, live-sync V2 note.
- Lines raw mirror: 315/315, ready, live-sync V2 note.
- Anonymous Orders Edge route: HTTP 401 as required, proving route exists and is protected.
- No Worker deployment, no D1 mutation, no frontend cutover.

## Current exact state
- Apps Script Web App: Version 149.
- Low-usage heartbeat route: installed and verified.
- Preview dual-signal Orders read: PASS.
- Production raw Orders/Lines mirror parity: PASS.
- Production Orders Edge route: present and auth-protected.
- Production Orders frontend read cutover: OFF.
- Production Cloud Write: OFF / not authorized.
- Sheets + Apps Script remain authoritative for writes.

## Immediate continuation
Inspect `trendos-edge-orders-read-v1.js` and `config.js` to determine the exact frontend feature flag, loader state, API target, fallback behavior, and one-commit rollback path. Only then prepare production heartbeat enablement and signed Orders-route qualification before frontend traffic activation.
