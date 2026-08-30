# TrendOS Integrity V1 — Deployment / Wiring Manifest

> **STATUS: PREPARED — NOT APPROVED FOR PRODUCTION DEPLOYMENT**
>
> This document defines the safe package and activation sequence. It does not authorize a production change.

## 1. Safety model

Installation and activation are separate operations.

The new Integrity V1 router is controlled by Script Property:

`TRENDOS_INTEGRITY_V1_ENABLED`

Default behavior when the property is absent, blank, `0`, `false`, `off`, or equivalent:

- `trendosIntegrityTryRouteV1_()` returns `null`.
- `trendosIntegrityTryWebhookV1_()` returns `null`.
- legacy TrendOS behavior remains the active route family.

This property is the first rollback switch. It must remain **OFF during file installation and source validation**.

## 2. Canonical machine-readable package

Source of truth for package membership:

`trendos-integrity-v1.package.json`

Do not construct the package from the older `APPS_SCRIPT_DEPLOY_V1940.md` manifest.

That older manifest belongs to the modular V1932 lineage and predates the later consolidated `Code.gs` lineage.

## 3. Core Apps Script files — installation order

Install as separate Apps Script source files in this order, while the feature flag is OFF:

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

Fast Auth V2.5 is an optional performance lane and must not be coupled to the first Core correctness activation.

### Explicitly forbidden

Do not include or use as replacements:

- GitHub `Code.gs`.
- `D1_Orders_Fast_V2_4.gs`.
- old standalone V1932 Customer Manager / Feedback / Attendance / Cleaning / Press modules on top of the consolidated live Code lineage.

## 4. Frontend file

Prepared frontend shim:

`customer-manager-send-integrity-v1.js`

If/when installed, it must load **after** the current Customer Manager UI script so it can wrap the existing manual-send behavior and preserve a stable `clientRequestId` across an ambiguous network retry.

Do not activate the new WhatsApp send route until backend and frontend are deployed as one tested contract.

## 5. Router wiring boundary

Exact Version 143 Apps Script project composition is still not fully accessible through current connectors.

Therefore this manifest intentionally does **not** prescribe blind line-number edits to `doGet()` or `doPost()`.

At deployment time, first capture the exact current editor source around:

- action extraction in `doGet/doPost`.
- the current `trendosV1932TryRoute_()` call.
- WhatsApp POST dispatch.
- response serialization.

Then add one guarded Integrity V1 route call in the existing response contract.

Conceptual behavior only:

```text
existing request parse
 -> Integrity V1 router (flag OFF => null)
 -> existing V1932/legacy router
 -> existing legacy action handling
```

For a WhatsApp POST after activation:

```text
parse payload
 -> Integrity V1 WhatsApp handler
 -> if handled: STOP legacy WhatsApp side effects for that payload
 -> otherwise continue existing legacy dispatch
```

Never run both Integrity V1 and legacy WhatsApp mutation paths for the same Meta payload.

## 6. Pre-activation checks

All must pass while `TRENDOS_INTEGRITY_V1_ENABLED` is OFF:

1. GitHub CI green on the exact deployment commit.
2. `tests/trendos_integrity_composition_v1.test.js` PASS.
3. `tests/trendos_predeploy_package_v1.test.js` PASS.
4. Apps Script project saves/parses successfully with new files added.
5. direct `trendosIntegrityDependencyHealthV1_()` returns `codeReady=true` and `missing=[]`.
6. no production route behavior changes with flag OFF.
7. existing Version 143 health still returns the expected workbook/backend identity.
8. existing D1 live-sync trigger remains exactly one every-minute handler.
9. current live baseline is captured before activation.

## 7. New schemas that may be created/evolved after activation

Integrity V1 can introduce or evolve these structures when their corresponding flows execute:

- `إدارة - سجل التكامل`
- `إدارة - سجل تشغيل الأتمتة`
- `تشغيل - تكامل جلسات المكبس V1`
- `تشغيل - بنود جلسات المكبس V1`
- extra integrity columns on `حسابات - مسودات الفواتير`
- appended integrity columns on existing `إدارة - تسليم الشيفت`
- `إدارة - أحداث التشغيل V1`
- `إدارة - صحة النظام`

Rules:
- do not delete historical rows.
- schema migration must fail closed on incompatible existing headers.
- do not silently rewrite historical date-coerced Line IDs.

## 8. Activation sequence — route families, not big-bang

Activation should be performed only after an explicit approved deployment checkpoint.

Even after the global feature flag is enabled, migrate frontend/actions in a controlled order:

1. Health / observability read path.
2. Order/Line controlled mutations.
3. Attendance + Cleaning.
4. Press.
5. Invoice / Ready Sweep.
6. WhatsApp manual outbound + frontend stable request ID.
7. WhatsApp inbound webhook.
8. Handover / OPS / ANDON.
9. Trend Master scheduled automation wrapper.

Each family requires its runtime regression before moving to the next.

## 9. Fast Auth V2.5 — separate performance deployment

Prepared file:

`D1_Fast_Auth_V2_5_Safe.gs`

It must remain disabled/not wired during initial Core activation.

Before Fast Auth production wiring, verify:

- strict cached-user allowlist contains no password/token.
- login invalidation hook.
- logout invalidation hook.
- password-change invalidation hook.
- Active/deactivation invalidation hook.
- token-reset invalidation hook.
- policy for direct manual edits in Users sheet.
- first authoritative hit vs cache-hit authorization parity.
- session-expiry inside the cache TTL.

Only then replace the single Orders-read authorization call with `authorizeD1FastV25_()`.

## 10. Immediate rollback

If a new Integrity V1 route causes a runtime problem:

1. Set `TRENDOS_INTEGRITY_V1_ENABLED=0` or remove the property.
2. Confirm new router/webhook returns `null` and legacy route resumes.
3. Do not delete any integrity ledger rows already written.
4. Do not delete newly added schema columns merely to roll back code.
5. If frontend shim is involved, revert the frontend asset to the previous known build.
6. If necessary, redeploy the immediately previous Apps Script version only after confirming the deployment target/version.

Rollback is code/routing rollback, not destructive data rollback.

## 11. Production deployment remains blocked by evidence boundary

Before any production edit, capture/reconcile the exact current Apps Script editor composition around the required routing/lifecycle hooks.

Known verified facts are not enough to reconstruct the entire Version 143 project from GitHub, so **do not rebuild production from repository files**.

## 12. Approval gate

Production activation requires an explicit decision after:

- exact current-source capture for touched areas.
- current backup/checkpoint confirmed.
- deployment commit SHA frozen.
- CI green.
- rollback target/version frozen.
- runtime regression checklist ready.

Until then the correct state is:

**PREPARED / TESTED IN CI / NOT DEPLOYED / NO PRODUCTION MUTATION**.
