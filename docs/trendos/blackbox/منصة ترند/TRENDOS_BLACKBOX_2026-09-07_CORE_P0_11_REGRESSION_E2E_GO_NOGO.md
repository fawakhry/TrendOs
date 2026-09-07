# CORE-P0-11 — Regression / Full E2E / Core GO-NO-GO

Date: 2026-09-07
Repository: `fawakhry/TrendOs`
Production branch: `main`
Working branch: `agent/go-live-2026-09-01-integrity`

## Roadmap position

This checkpoint continues **Phase 1 — Core + Cloud** from the existing roadmap. It does not start a new inventory or redesign the plan.

Relevant Phase 1 sequence:

1. Core integrity families and Cloud/D1 protections
2. Regression Pack
3. Full E2E
4. Core GO/NO-GO

The existing `TrendOS Integrity V1` now acts as the durable Regression Pack across the current Core/Cloud surface.

## Status

**REGRESSION PACK PASS — LIVE FRONTEND + SAFETY BOUNDARY PASS — AUTHENTICATED E2E BLOCKED (QUALIFY TOKEN 401) — CORE GO/NO-GO HOLD**

This is a fail-closed status. The authenticated E2E gate is not weakened or bypassed to obtain a synthetic PASS.

## Regression Pack evidence

On working-branch HEAD `0dd23d5517eadd5217d3cfd3eab97d90cb162f28`:

- `TrendOS Integrity V1` Run `34111130037` — **SUCCESS**.

The pack covers the active Cloudflare/D1 and Core contracts, including Edge Gateway, 02CR qualified reads, 02CU freshness, 02CV write consistency and Fly Print lane stability, 02CW global active summary, freshness/idle protections, CORE-P0 remediation tooling, Order/Line, Attendance/Cleaning, Press, Invoice, WhatsApp, Handover/OPS, ANDON, Dashboard, Fast Auth, Apps Script composition/predeploy safety, and Accounting contracts.

## Full E2E read-only gate

Added durable workflow:

`.github/workflows/trendos-core-p0-11-e2e-readonly-gate.yml`

Contract test:

`tests/core_p0_11_readonly_gate_contract.test.mjs`

The contract explicitly forbids production mutation/deployment commands and permits only one POST: the employee Edge session exchange needed for authenticated read qualification.

The contract test is also wired into normal `TrendOS Integrity V1` so future changes cannot silently turn the E2E gate into a write/deploy path.

## First live E2E attempt

Run:

`34111129906`

Result:

**FAIL — AUTHENTICATED SESSION QUALIFICATION BLOCKED BY 401**

Steps that passed before the block:

- exact Production main lock: `2eee80b87a3aeccb5569055bc0544a43b22adcb7`;
- read-only gate contract;
- live GitHub Pages/frontend contract;
- current hotfix cache-bust present;
- default filters present: `الحالات الجارية فقط` + `كل الأولويات`;
- `activeSummaryCounts` present in live frontend;
- `heatPressOrders` present in live Press monitor;
- `WORK_PROBLEM_STATUS` absent from live `app.js`;
- Edge Orders D1 config enabled;
- Worker `/v1/edge/health` PASS;
- `/v1/cloud/write/health` PASS;
- Sheets remains authoritative;
- cutover remains false;
- reconcile remains OFF;
- generic drain remains OFF;
- unauthenticated Orders read correctly returns 401.

Blocking step:

- POST `/v1/edge/orders/session` using the stored qualification employee credentials returned `401`.

This means the gate could not continue to the authenticated D1 active-page read or `__DEBT__` fallback assertion in that run.

## Classification of the block

The current evidence does **not** identify a frontend, Worker route, D1 summary, or production-safety regression. All those checks passed before the session exchange.

The exact block is the GitHub qualification employee credential used by the E2E runner. It must remain a blocking condition because authenticated Orders behavior is part of Full E2E.

Do not remove the authentication check, accept 401 as PASS, or substitute unauthenticated reads.

## Core GO/NO-GO status

**HOLD**

Two independent conditions prevent declaring Core GO:

1. Full E2E authenticated read gate is currently blocked by qualification credential 401.
2. The older CORE-P0 remediation path retains an explicit production approval/data boundary around RP-06/RP-07 and the paused `3536-01` reconciliation. This checkpoint does not override that boundary.

Even after the qualification credential is repaired and Full E2E passes, the overall Core GO remains HOLD until the separately approved RP production-data/HEALTH gate is resolved.

## Safety boundary

No action in CORE-P0-11 has:

- deployed Apps Script;
- written a Sheet/registry/business row;
- written/migrated D1 business data;
- changed `EDGE_SESSION_SECRET`;
- enabled 02CL/reconcile;
- enabled generic drain;
- changed write authority;
- activated ORDER_LINE or another business family.

## Next executable action

Without crossing a production-write approval boundary:

1. keep the durable Regression Pack and read-only E2E gate active;
2. rerun the exact same E2E gate when the stored qualification employee credential is valid again;
3. if authenticated E2E passes, record `REGRESSION PACK + FULL E2E READ-ONLY PASS` while Core GO remains `HOLD` for the separate RP production-data/HEALTH boundary;
4. do not enter RP-06/RP-07 production mutation or business-family activation without the required explicit approval.
