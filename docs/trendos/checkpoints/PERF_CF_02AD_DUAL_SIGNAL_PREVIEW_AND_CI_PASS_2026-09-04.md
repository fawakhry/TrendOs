# PERF-CF-02AD — Dual-signal Preview + CI PASS — 2026-09-04

## Runtime qualification
The isolated Cloudflare Preview was explicitly configured with:
- `EDGE_ORDERS_IDLE_HEARTBEAT_ENABLED="true"`
- `TRENDOS_CLOUD_WRITE_V1_ENABLED="false"`

The dedicated protected Orders qualification returned:
- HTTP `200` after Preview propagation;
- `success=true`;
- `dataSource=d1-edge-orders`;
- expected short-lived Preview Edge session subject;
- no fallback.

This proves stale `syncedAt` during a genuine unchanged-source idle period can be accepted only after the live sanitized Apps Script heartbeat verifies source freshness and the Orders+Lines metadata/parity/shape contract.

## Regression correction
The old verifier regression intentionally asserted that the Preview heartbeat flag must be absent. That assertion became obsolete after the explicit qualification phase began. It was updated to require:
- Preview heartbeat flag exactly `true`;
- Cloud Write exactly `false`.

The subsequent full Integrity CI completed PASS, including:
- Edge gateway;
- Orders freshness gate;
- idle heartbeat validator;
- idle freshness integration;
- Apps Script heartbeat helper safety;
- idle verifier;
- all existing TrendOS integrity regressions;
- composed Apps Script syntax/collision;
- pre-deploy package safety gate.

## Legacy Auto Preview note
The older generic Auto Preview job still contains a direct `syncedAt <= 600s` gate and therefore fails during legitimate idle periods even though the protected Dual-Signal Orders route is PASS. This is a legacy workflow-gate mismatch, not a runtime Orders route failure.

## Current state
- Apps Script Version 149 heartbeat route: PASS.
- Low-usage trigger: healthy.
- Isolated Preview dual-signal Orders read: PASS.
- Preview Cloud Write: OFF.
- Production Orders read cutover: still OFF.
- Production Cloud Write: OFF / not authorized.

## Next gate
Run Production Orders Preflight only. No Worker deploy and no traffic cutover until production health + mirror contract + current route state are verified.
