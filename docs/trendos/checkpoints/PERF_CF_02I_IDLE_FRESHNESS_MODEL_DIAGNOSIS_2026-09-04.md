# PERF-CF-02I — Idle Freshness Model Diagnosis — 2026-09-04

## Trigger
Follow-up to `PERF-CF-02H` after runtime proved that Orders/Lines D1 mirror advanced under V2 quota-aware sync but still failed the absolute `syncedAt <= 180s` gate during an idle period.

## Source review
Reviewed on working branch:
- `cloudflare-d1/D1_Orders_Low_Usage_Control_V1.gs`
- `cloudflare-d1/src/edge-orders-freshness-gate.mjs`
- `tests/cloudflare_edge_orders_freshness_gate_v1.test.mjs`

## Verified low-usage contract
`d1OrdersLowUsageTickV1()` checks the Google Sheets source every 5 minutes using a lightweight display-value fingerprint.

When the source fingerprint is unchanged:
- it records a successful local `lastIdleCheck` in Apps Script Script Properties;
- it records no error;
- it makes **zero Cloudflare requests**;
- it makes **zero D1 writes**;
- it intentionally leaves the D1 `sheet_catalog.synced_at` timestamp unchanged.

When the source changes:
- it delegates to `d1OrdersLiveSyncTickV2()`;
- after a successful V2 sync it advances the trusted lightweight fingerprint.

`getD1OrdersLowUsageStatusV1()` exposes the local status contract including trigger counts, lastIdleCheck, lastError, consecutiveErrors, and enabled state.

## Verified Edge freshness contract
`edge-orders-freshness-gate.mjs` currently decides freshness only from D1 `sheet_catalog.synced_at` age plus status/parity/live-note checks.

The current predicate is effectively:

`ready && parity && live && (now - syncedAt <= maxAge)`

The current tests explicitly require an old `syncedAt` to fail closed as `stale-orders-mirror`, even when row parity/status/live note are otherwise valid.

## Architectural conflict — CONFIRMED
The following two requirements cannot both be satisfied from D1 metadata alone:

1. **Zero-idle Cloudflare/D1 usage:** unchanged source => zero Cloudflare request and zero D1 write.
2. **Absolute write-age freshness:** Edge requires D1 `syncedAt` to stay within 180–600 seconds.

During legitimate source inactivity, `syncedAt` must age because no D1 write is intentionally performed. Therefore the existing Edge gate eventually classifies a logically current mirror as stale even though Apps Script has continued verifying that the source fingerprint is unchanged.

This is not evidence that the recovered low-usage trigger failed. It is a freshness-model mismatch.

## Safety conclusion
Do **not** solve this by forcing periodic D1 writes or imports. That would violate the approved low-usage objective and increase D1/Cloudflare usage without data changes.

Do **not** relax/remove fail-closed freshness protection globally. A real stopped trigger or source-read failure still must fall back to Apps Script.

## Correct design direction
Introduce a second freshness signal representing **recent verified source equality**, separate from the last D1 data-write timestamp.

Safe candidate contract:
- D1 `syncedAt` remains the last actual mirror write timestamp.
- Apps Script low-usage status provides a recent successful source verification (`lastIdleCheck`) while the source fingerprint is unchanged from the last trusted post-sync fingerprint.
- When D1 write age is within budget, Edge proceeds normally without upstream verification.
- When D1 write age exceeds budget, Edge may perform a bounded lightweight upstream verification against an explicitly exposed low-usage status route; only a recent healthy unchanged-source verification may extend logical freshness.
- Any missing/old heartbeat, disabled controller, trigger-count mismatch, lastError/consecutiveErrors, or verification failure remains fail-closed to Apps Script fallback.
- Cache/coordination may later limit repeated upstream verification; no Production change is implied by this diagnosis.

## Current decision
**DIAGNOSIS PASS / CODE CHANGE NOT YET MADE / PRODUCTION UNCHANGED.**

Next step: inspect the existing Edge upstream/fallback plumbing and production freshness-guard tests/workflow, then implement the smallest GitHub-only proof of this dual-signal freshness contract with regression tests. No Production deploy/cutover until separate runtime qualification and approval.
