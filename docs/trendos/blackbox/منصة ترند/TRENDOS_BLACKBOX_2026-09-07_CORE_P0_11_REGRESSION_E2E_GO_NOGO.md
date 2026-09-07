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

## Status

**REGRESSION PACK PASS — FULL E2E READ-ONLY PASS — CORE GO/NO-GO HOLD ON SEPARATE RP PRODUCTION-DATA/HEALTH APPROVAL BOUNDARY**

## Regression Pack evidence

- `TrendOS Integrity V1` Run `34111130037` — SUCCESS on `0dd23d5517eadd5217d3cfd3eab97d90cb162f28`.
- durable CORE-P0-11 read-only contract was wired into normal Integrity.
- later Integrity Run `34111458849` — SUCCESS on `7c98d536a1bc583b244177badd0b954c4fc188ce`.
- qualification-token lifecycle documentation Integrity Run `34111729196` — SUCCESS on `6f887cc0ca16f322a2096a84086b25ab1ead7f05`.

## Full E2E read-only gate

Workflow:

`.github/workflows/trendos-core-p0-11-e2e-readonly-gate.yml`

Contract:

`tests/core_p0_11_readonly_gate_contract.test.mjs`

The contract forbids production mutation/deployment commands. The only POST is the employee Edge session exchange required for authenticated read qualification.

### First attempt

Run `34111129906`, attempt 1:

- frontend/live safety checks PASS;
- employee Edge session exchange returned 401 because the stored qualification employee session had expired;
- gate stopped fail-closed before authenticated D1 read.

### Retry — PASS

The same failed workflow run was re-run without changing code or Production.

Run `34111129906`, retry job `101744446892`:

**CORE-P0-11 FULL E2E READ-ONLY GATE: PASS**

Live evidence:

- Production main exact lock: `2eee80b87a3aeccb5569055bc0544a43b22adcb7`;
- live frontend contract PASS;
- default filters: `الحالات الجارية فقط` + `كل الأولويات`;
- `activeSummaryCounts` live;
- Press `heatPressOrders` live;
- `WORK_PROBLEM_STATUS` absent from live `app.js`;
- Worker `/v1/edge/health` PASS;
- `/v1/cloud/write/health` PASS;
- Sheets authoritative = true;
- cutover = false;
- reconcile = OFF;
- generic drain = OFF;
- unauthenticated Orders read correctly returns 401;
- employee Edge session exchange returned 200 and supplied an Edge token;
- authenticated D1 Orders read returned 200 from `d1-edge-orders-02cr-operational`;
- `activeSummaryCounts` values were numeric and page-independent;
- `__DEBT__` returned 409 with `fallback=apps-script` as designed.

Observed live summary at qualification time:

- pageRows = 5
- activeTotal = 25
- activeOrders = 25
- heatPress = 6
- heatPressOrders = 6
- debtFallback = `apps-script`
- sheetsAuthoritative = true
- cutover = false
- reconcileEnabled = false
- genericDrainEnabled = false

This is technical/runtime E2E evidence, not synthetic user-visible acceptance for PERF-CF-02CW.

## Qualification credential lifecycle

Employee qualification tokens are session-scoped. Apps Script `sessionTtlMsV1922_()` defaults to 12 hours and clamps configured TTL to 1–72 hours. `login_()` creates a new token and writes token/last-login data to the Users sheet.

Therefore the read-only E2E gate must not auto-login to refresh itself because that would convert a read-only gate into a Production Users-sheet write. A fresh employee session credential is required when the stored qualification token expires.

## Core GO/NO-GO status

**HOLD**

The Full E2E blocker is now cleared. The remaining blocker is separate and older:

- CORE-P0 remediation RP-06/RP-07 retains an explicit Production-data/HEALTH approval boundary;
- the paused `3536-01` reconciliation remains part of that boundary;
- this checkpoint does not authorize registry writes, Apps Script Head/deploy work, or business-family activation.

Therefore current meaning is:

**Regression Pack PASS + Full E2E Read-Only PASS, but overall Core GO remains HOLD until the separately approved RP production-data/HEALTH gate is resolved.**

## Safety boundary retained

No action in CORE-P0-11 has:

- deployed Apps Script;
- written a Sheet/registry/business row;
- written/migrated D1 business data;
- changed `EDGE_SESSION_SECRET`;
- enabled 02CL/reconcile;
- enabled generic drain;
- changed write authority;
- activated ORDER_LINE or another business family.

## Next roadmap action

The next roadmap decision is the **Core GO/NO-GO boundary**. The E2E portion is complete. Any continuation into RP-06/RP-07 Production-data/HEALTH remediation must be separately bounded and explicitly approved before a production mutation is executed.
