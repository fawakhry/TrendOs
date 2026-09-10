# TrendOS Blackbox — RP-07 Runtime Deployment Boundary

Date: 2026-09-10
Branch: `agent/go-live-2026-09-01-integrity`
Code candidate checkpoint: `2152d1d5a90d5c03f9623ee83fd5fcaded8aaeeb`
Status: **PLANNED ONLY — NOT AUTHORIZED / NOT EXECUTED**

## Objective

Install the qualified RP-07 protection code into the live Apps Script project in a **runtime-inert state**, with every Integrity feature flag OFF, then perform only exact-source and read-only dependency/regression verification.

This boundary exists to separate **code presence** from **traffic activation**. Installation must not silently transfer authority, mutate business data, or advance to RP-08.

## Hard safety invariants

Throughout this boundary:

- `TRENDOS_INTEGRITY_V1_ENABLED` must remain absent/false;
- every family flag must remain absent/false;
- no Source Sheet business row may be changed;
- no Registry write/recovery may run;
- no D1 business-data write or authority migration may run;
- no reconcile/generic drain may be enabled;
- no `EDGE_SESSION_SECRET` change;
- no merge to `main`;
- no RP-08 execution;
- no cleanup of `3839`, `3841`, `3796-01`, Attendance duplicates, or Cleaning duplicates inside the code-install boundary;
- any mismatch, missing dependency, duplicate global symbol, unexpected property state, or unexpected write capability is an immediate fail-closed STOP.

## Exact candidate blobs

Runtime preparation is locked to:

- `trendos-rp07-legacy-containment-v1.gs` = `47d932c76498593063ea6f0289e9c9a663686b0d`
- `v1932-router.gs` = `151134f2517db2ce38cecec4fea59dd2745e8b59`
- `trendos-integrity-router-v1.gs` = `34ae925b35fcf8295a8857dfe587cfa26b48b6b8`
- `trendos-press-integrity-v1.gs` = `e63473445a338179ac50f39cb7d3b82424e30af3`
- `trendos-invoice-integrity-v1.gs` = `18dd8783bbf7bf14531bcf7bf7d870d938d82473`
- `press-control-v1.js` = `cf55e023e23a1ee7dd50d2f8e724763a4e7690ed`

The normal Integrity package dependencies must also be sourced from the same branch checkpoint and exact-verified before runtime use; no legacy standalone backend file may be copied over the consolidated live lineage merely because it exists in GitHub.

## Mandatory Phase 0 — live Apps Script source inventory

Before changing Apps Script Head:

1. capture the exact live project file list;
2. locate the **single owning definition** of `trendosV1932TryRoute_`;
3. locate all existing Integrity module files/functions;
4. prove whether candidate functions already exist and where;
5. detect duplicate top-level constants/functions that would collide if a standalone file were added;
6. record current Script Property states for the Integrity master/families without changing them;
7. verify every master/family flag is absent/false;
8. record the pre-install Apps Script deployment/version state.

### Critical collision rule

`Code.gs` is a forbidden replacement artifact under the current Integrity package contract.

Therefore:

- do **not** rebuild or overwrite the production `Code.gs` from the GitHub copy;
- do **not** blindly add standalone `v1932-router.gs` if the live project already defines `trendosV1932TryRoute_` elsewhere;
- if the live definition is embedded in an existing consolidated file, patch only that exact existing function/owner location after byte/text verification;
- if the live project already has a separate router file, update that exact file instead;
- if ownership cannot be proven unambiguously, STOP.

## Phase 1 — Head installation, flags OFF

This phase requires a separate explicit runtime approval before execution.

When approved:

1. update/add only the exact required candidate modules after Phase 0 collision checks;
2. retain all Integrity flags OFF;
3. do not create a new Apps Script Production deployment yet unless separately approved;
4. save;
5. reload the project;
6. exact-verify each installed file/function against the locked candidate source;
7. verify again that all Integrity flags are still OFF;
8. STOP on any mismatch.

Expected behavior with flags OFF: existing live routes continue through the legacy/containment path; merely installing the guarded router must not activate an Integrity family.

## Phase 2 — read-only qualification with flags OFF

After exact installation verification, run only non-business-mutating checks:

- Integrity dependency health;
- router feature-state readback proving master=false and all families=false;
- route fallback checks proving legacy behavior remains selected while flags are OFF;
- no-op/read-only health checks necessary to prove modules are loadable and collision-free;
- record all outputs in the blackbox.

No remediation writer, Registry writer, invoice writer, attendance/cleaning writer, Press start/stop, or other business mutation is part of this phase.

If Phase 2 is PASS, STOP. Do not enable a family in the same authorization boundary.

## Future family activation order — separate approvals only

After a successful flags-OFF install/read-only gate, activation should be isolated by family and approved separately:

1. `ATTENDANCE_CLEANING` first — because new duplicates are actively being generated in those legacy paths;
2. `PRESS` only after the matching exact-Line frontend is deployed/verified and rollback is proven;
3. `INVOICE` only after closed-order lifecycle checks are verified and current legacy Draft data is treated separately;
4. other families remain OFF unless independently qualified.

Master/family enablement must be one family at a time, with immediate rollback evidence and a fresh read-only comparison before advancing.

## Existing data remediation — explicitly outside this boundary

This plan does not authorize changing current P0 rows.

A separate evidence-backed data-remediation plan is still required for:

- the post-baseline Attendance duplicate groups;
- the post-baseline Cleaning duplicate groups;
- closed/delivered Orders `3839` and `3841` with surviving Draft rows;
- Press line `3796-01` lacking acceptable exact-Line session evidence.

Historical rows must not be deleted or rewritten simply to force Health PASS. Remediation must be append-only/traceable wherever the existing integrity model requires it.

## RP-07 completion rule

RP-07 remains HOLD until both are true:

1. prevention/containment is installed and proven in runtime under its approved rollout sequence; and
2. a fresh RP-07 health computation proves `OPEN_CORE_P0_BLOCKERS=0` against current live data.

Only then may the blackbox consider Core GO/NO-GO again or advance to RP-08.

## Current stop point

**STOP — runtime deployment not executed.**

This document is the prepared boundary only. The next mutation would be live Apps Script source installation and therefore requires a separate explicit approval after refreshing the branch and re-reading this record.
