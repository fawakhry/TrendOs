# TrendOS Integrity V1 — Implementation Checkpoint

> Date: 2026-08-30
> Branch: `agent/go-live-2026-09-01-integrity`
> Status: **IMPLEMENTED + CI TESTED (where noted) + NOT DEPLOYED**

This checkpoint supplements the historical `TRENDOS_TEST_MATRIX.md`.

The old Matrix deliberately preserves the **pre-fix production baseline**, including live FAIL states. Do not rewrite historical failures as production PASS merely because a GitHub patch exists.

## 1. Implementation completed on working branch

### Shared foundation

`trendos-integrity-v1.gs`

Provides:
- normalized Order ID / Line ID.
- Cairo business date/calendar.
- Friday closed by default + Special Schedule override.
- shared ScriptLock wrapper.
- durable idempotency ledger.
- automation-run ledger.
- centralized open/closed status helpers.

### Order / Line

`trendos-order-line-integrity-v1.gs`

Provides:
- Line ID authoritative mutation target.
- stale row rejection.
- active duplicate fail-closed.
- Draft Item collision detection.
- one shared lock for Draft item/file/submit paths.
- Order ID allocation checkpoint and retry reuse.

### Attendance / Cleaning

`trendos-attendance-cleaning-integrity-v1.gs`

Provides:
- one canonical employee/day session.
- shared lock around state mutations.
- Clock-in gating for work events.
- repeated-state no-op semantics.
- shared Business Calendar.
- one Cleaning row per employee/business date.
- real checklist values rather than invented completion values.

### Press

`trendos-press-integrity-v1.gs`

Provides:
- normalized/deduped Line-level Queue.
- retry-safe open/close state machine.
- Session -> Order/Line snapshot ledger.
- completed Line IDs required at close.
- no invented power/rate/cost.

### Invoice / Ready Sweep

`trendos-invoice-integrity-v1.gs`

Provides:
- one canonical Draft per Order; duplicates fail closed.
- active Final Invoice blocks Ready Sweep Draft recreation.
- explicit invoice revision after reopen.
- persisted Finalize Request Key.
- same request key reused after ambiguous finalization.
- material-change protection during FINALIZING.
- WhatsApp notification ambiguous retry blocker.

### WhatsApp

`trendos-whatsapp-integrity-v1.gs`

Provides:
- inbound Meta Message ID idempotency.
- exact-once outbound logical-send boundary using stable `clientRequestId`.
- completed retry returns prior result without another Meta send.
- ambiguous network result blocks automatic resend.

Frontend:

`customer-manager-send-integrity-v1.js`

Preserves a stable send request ID across a network retry and clears it only after confirmed success.

### Handover / OPS

`trendos-handover-ops-integrity-v1.gs`

Provides:
- structured Handover tied to Line ID + date + shift + employee + state fingerprint.
- same state replay returns same Handover event.
- changed state creates another revision.
- idempotent receipt.
- structured OPS_REPLY.
- OPS_COACH deduped by Line/state fingerprint.
- safe Trend Master automation run claim/log/retry.

### ANDON

`trendos-andon-integrity-v1.gs`

Provides:
- structured ANDON event with request ID and optional Order/Line evidence.
- idempotent retry.
- explicit resolution state.

### Integrity Dashboard / Observability

`trendos-integrity-dashboard-v1.gs`

Detects and exposes counts + IDs for:
- active duplicate Line IDs.
- invalid/date-coerced Line IDs.
- duplicate Attendance sessions.
- duplicate Cleaning rows.
- duplicate invoice Drafts.
- closed Orders with Draft.
- unpriced Drafts.
- Press Source/View mismatch.
- Press completed without session evidence.
- open ANDON.
- automation success/error.
- derived open Core P0 blockers.

### Safe Fast Auth redesign

`D1_Fast_Auth_V2_5_Safe.gs`

Prepared separately from initial Core activation.

V2.5 improvements over rejected V2.4:
- strict cached-user allowlist.
- password/token excluded from payload.
- digest key.
- per-user Auth Revision invalidation.
- lifecycle invalidation hooks.

Still NOT approved for production until lifecycle wiring + runtime auth regressions pass.

### Integration Router

`trendos-integrity-router-v1.gs`

Provides new action names only and does not overwrite legacy handlers by itself.

Safety switch:

`TRENDOS_INTEGRITY_V1_ENABLED`

Default OFF. When OFF:
- new action router is inert.
- new WhatsApp webhook router is inert.

Dependency health checks internal functions instead of checking top-level module presence only.

## 2. CI evidence

Confirmed successful runs before/through implementation:

- Attendance/Cleaning: `33319559363` — SUCCESS.
- Press: `33320046858` — SUCCESS.
- Invoice: `33323669244` — SUCCESS.
- WhatsApp: `33324339920` — SUCCESS.
- Handover/OPS: `33326904772` — SUCCESS.
- ANDON + Integrity Dashboard: `33327350322` — SUCCESS.
- Fast Auth V2.5 Safe: `33327466500` — SUCCESS.
- composed modules before Router: `33327527682` — SUCCESS.

Router-inclusive lane initially failed only because a test regex expected `الإدارة` while the actual authorized-denial message was `للإدارة`; implementation behavior was correct. Test was corrected and the Router was simultaneously hardened with a default-OFF feature flag.

Latest full lane must be green before freezing a deploy candidate.

## 3. Machine-readable package

`trendos-integrity-v1.package.json`

Core package deliberately excludes:
- GitHub `Code.gs`.
- Fast Auth V2.4.
- old standalone V1932 modules.
- Fast Auth V2.5 from initial Core activation.

Pre-deploy safety test:

`tests/trendos_predeploy_package_v1.test.js`

## 4. Deployment documentation

`docs/trendos/TRENDOS_INTEGRITY_V1_DEPLOY_MANIFEST.md`

State remains:

**PREPARED — NOT APPROVED FOR PRODUCTION**.

Production installation/activation is blocked until exact current Apps Script touched-source areas are captured and a rollback target is frozen.

## 5. Regression coverage source

`docs/trendos/TRENDOS_INTEGRITY_V1_REGRESSION_COVERAGE.md`

This file separates:
- CI contract evidence.
- historical live baseline evidence.
- post-deploy runtime evidence still pending.

## 6. What is NOT done

Do not claim these completed yet:

- new modules installed in Apps Script production.
- new Router wired to Version 143.
- feature flag enabled.
- historical live duplicate data repaired.
- D1 source-snapshot consistency runtime verified with new writers.
- approved pricing mapping verified end-to-end on live controlled test data.
- Press Source/View runtime parity.
- WhatsApp real-network repeat tests.
- Fast Auth V2.5 lifecycle wiring.
- full 20 E2E pack.
- GO decision.

## 7. Current decision

**NO-GO for production activation.**

Reason is not lack of implementation. Reason is that implementation is currently branch/CI evidence, while production source reconciliation + controlled runtime validation are mandatory safety gates.

## 8. Exact next engineering lane

1. keep full CI green including Router + package gate.
2. freeze exact deploy candidate commit SHA.
3. prepare source-capture checklist for the small touched Version 143 areas.
4. prepare runtime smoke/regression scripts with no destructive cleanup.
5. capture exact current source before any Apps Script edit.
6. only after explicit deployment approval: install files with feature flag OFF.
7. validate dependency health and unchanged legacy behavior.
8. activate route families gradually with rollback after each family.

No production mutation was performed while creating this checkpoint.
