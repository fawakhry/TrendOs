# TrendOS Integrity V1 — Deployment / Wiring Manifest

> **STATUS: PREPARED — NOT APPROVED FOR PRODUCTION DEPLOYMENT**
>
> This document defines the safe package and activation sequence. It does not authorize a production change.

## 1. Safety model

Installation and activation are separate operations.

### Master switch

`TRENDOS_INTEGRITY_V1_ENABLED`

Default: **OFF**.

### Family switches

All default **OFF** independently:

- `TRENDOS_INTEGRITY_V1_HEALTH_ENABLED`
- `TRENDOS_INTEGRITY_V1_ORDER_LINE_ENABLED`
- `TRENDOS_INTEGRITY_V1_ATTENDANCE_CLEANING_ENABLED`
- `TRENDOS_INTEGRITY_V1_PRESS_ENABLED`
- `TRENDOS_INTEGRITY_V1_INVOICE_ENABLED`
- `TRENDOS_INTEGRITY_V1_WHATSAPP_ENABLED`
- `TRENDOS_INTEGRITY_V1_OPS_ENABLED`
- `TRENDOS_INTEGRITY_V1_AUTOMATION_ENABLED`

A new route is handled only when:

```text
master flag = ON
AND
its family flag = ON
```

When either is OFF, the Integrity router returns `null` and the existing legacy route remains authoritative.

WhatsApp webhook handling additionally requires the `WHATSAPP` family flag.

This allows family-by-family activation and rollback rather than a big-bang switch.

## 2. Canonical machine-readable package

Source of truth:

`trendos-integrity-v1.package.json`

Do not construct the package from the older `APPS_SCRIPT_DEPLOY_V1940.md` manifest. That manifest belongs to the earlier modular V1932 lineage and predates the later consolidated `Code.gs` lineage.

## 3. Core Apps Script files — installation order

Install as separate source files while the master **and every family flag are OFF**:

1. `trendos-integrity-v1.gs`
2. `trendos-order-line-integrity-v1.gs`
3. `trendos-attendance-cleaning-integrity-v1.gs`
4. `trendos-press-integrity-v1.gs`
5. `trendos-invoice-integrity-v1.gs`
6. `trendos-whatsapp-integrity-v1.gs`
7. `trendos-handover-ops-integrity-v1.gs`
8. `trendos-andon-integrity-v1.gs`
9. `trendos-integrity-dashboard-v1.gs`
10. `trendos-integrity-router-v1.gs`

### Explicitly excluded from the first Core activation

`D1_Fast_Auth_V2_5_Safe.gs`

Fast Auth V2.5 is an optional performance lane and must not be coupled to initial Core correctness activation.

### Explicitly forbidden

Do not include or use as replacements:

- GitHub `Code.gs`.
- `D1_Orders_Fast_V2_4.gs`.
- old standalone V1932 Customer Manager / Feedback / Attendance / Cleaning / Press modules on top of the consolidated live Code lineage.

## 4. Frontend file

Prepared frontend shim:

`customer-manager-send-integrity-v1.js`

If installed, load it **after** the current Customer Manager UI script. It preserves a stable `clientRequestId` across ambiguous network retry.

Do not enable the `WHATSAPP` family until backend and frontend are installed/tested as one contract.

## 5. Router wiring boundary

Exact Version 143 Apps Script project composition is still not fully accessible through current connectors. Therefore this manifest does **not** prescribe blind line-number edits to `doGet()` or `doPost()`.

At deployment time first capture exact current editor source around:

- action extraction in `doGet/doPost`.
- current `trendosV1932TryRoute_()` call.
- WhatsApp POST dispatch.
- response serialization.

Then add one guarded Integrity V1 route call in the existing response contract.

Conceptual behavior only:

```text
existing request parse
 -> Integrity V1 router
    -> master OFF => null
    -> family OFF => null
    -> otherwise handled result
 -> existing V1932/legacy router
 -> existing legacy handling
```

For WhatsApp after activation:

```text
parse payload
 -> Integrity V1 webhook handler
    -> master/WHATSAPP OFF => null
    -> handled => STOP legacy WhatsApp mutation path
 -> otherwise continue legacy dispatch
```

Never execute both Integrity V1 and legacy WhatsApp mutations for the same Meta payload.

## 6. Pre-activation checks

All must pass with master + all families OFF:

1. GitHub CI green on exact candidate commit.
2. composition test PASS.
3. pre-deploy package gate PASS.
4. Apps Script project saves/parses with new files.
5. direct `trendosIntegrityDependencyHealthV1_()` returns `codeReady=true` and `missing=[]`.
6. dependency health reports all flags OFF.
7. no production route behavior changes with flags OFF.
8. Version 143 health still identifies expected backend/workbook.
9. D1 live-sync trigger remains exactly one every-minute handler.
10. current live integrity baseline captured before activation.

## 7. New schemas that may be created/evolved after activation

Integrity V1 may introduce/evolve:

- `إدارة - سجل التكامل`
- `إدارة - سجل تشغيل الأتمتة`
- `تشغيل - تكامل جلسات المكبس V1`
- `تشغيل - بنود جلسات المكبس V1`
- integrity columns on `حسابات - مسودات الفواتير`
- appended integrity columns on existing `إدارة - تسليم الشيفت`
- `إدارة - أحداث التشغيل V1`
- `إدارة - صحة النظام`

Rules:
- never delete historical rows.
- schema migration fails closed on incompatible existing headers.
- never silently rewrite historical date-coerced Line IDs.

## 8. Activation sequence — one family at a time

Only after an explicit approved deployment checkpoint:

### Step 0 — install, everything OFF

Master OFF and all family flags OFF.

### Step 1 — Health

Set:
- master ON.
- `HEALTH` ON.
- every other family OFF.

Run dependency/read-only checks and Integrity Dashboard smoke.

### Step 2 — Order/Line

Enable `ORDER_LINE`; run its controlled runtime regression; disable immediately if any failure.

### Step 3 — Attendance/Cleaning

Enable `ATTENDANCE_CLEANING`; run Clock-in/Resume/Friday/Cleaning regressions.

### Step 4 — Press

Enable `PRESS`; verify source/view/session Line IDs and Start/Stop retry safety.

### Step 5 — Invoice

Enable `INVOICE`; verify Ready Sweep/finalize/reopen on controlled test Orders and exact pricing evidence.

### Step 6 — WhatsApp

Install frontend shim, then enable `WHATSAPP`; test manual outbound first, then inbound webhook with repeated Meta ID.

### Step 7 — OPS

Enable `OPS`; test Handover/receipt/OPS_REPLY/OPS_COACH/ANDON.

### Step 8 — Automation

Enable `AUTOMATION` only after manual OPS flows pass. Validate run claim/retry before scheduling.

After each family: refresh Health, record Expected/Actual/PASS|FAIL, and keep the next family OFF until current family is green.

## 9. Fast Auth V2.5 — separate performance deployment

Prepared file:

`D1_Fast_Auth_V2_5_Safe.gs`

Separate switch:

`TRENDOS_FAST_AUTH_V25_ENABLED`

Default: **OFF**.

When V2.5 is wired but this flag remains OFF, `authorizeD1FastV25_()` bypasses CacheService and calls authoritative legacy `authorize_()` directly. This provides a performance-feature rollback independent of Integrity Core.

Before turning Fast Auth ON verify:

- strict cached-user allowlist contains no password/token.
- login invalidation hook.
- logout invalidation hook.
- password-change invalidation hook.
- Active/deactivation invalidation hook.
- token-reset invalidation hook.
- policy for direct manual Users-sheet edits.
- first authoritative hit vs cache-hit parity.
- session expiry inside TTL.

Only after those tests should the Fast Auth flag be enabled.

## 10. Immediate rollback

### One family fails

Set only its family flag to `0`/OFF. Other validated families may remain enabled.

### Multiple/new-router problem

Set `TRENDOS_INTEGRITY_V1_ENABLED=0` or remove it. All Integrity routes/webhook become inert.

### Fast Auth problem

Set `TRENDOS_FAST_AUTH_V25_ENABLED=0`. The wrapper returns to authoritative legacy auth without using V2.5 cache.

Then:
- confirm legacy behavior resumes.
- do not delete integrity ledger rows.
- do not delete added schema merely to roll back code.
- revert frontend shim if its family is rolled back.
- redeploy previous Apps Script version only if a code-level rollback is necessary and the target version is verified.

Rollback is routing/code rollback, not destructive data rollback.

## 11. Production deployment remains blocked by evidence boundary

Before production edits, capture/reconcile exact current Apps Script source around touched routing/lifecycle areas.

Known Version 143 evidence is insufficient to reconstruct the entire project from GitHub, so **do not rebuild production from repository files**.

## 12. Approval gate

Production installation/activation requires:

- exact current-source capture for touched areas.
- backup/checkpoint confirmed.
- deployment commit SHA frozen.
- full CI green.
- rollback version frozen.
- runtime regression checklist ready.

Until then:

**PREPARED / CI TESTED / NOT DEPLOYED / NO PRODUCTION MUTATION**.
