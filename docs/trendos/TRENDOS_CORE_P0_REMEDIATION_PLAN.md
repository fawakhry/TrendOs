# TrendOS CORE-P0 Non-Destructive Remediation Plan

> Prepared: **2026-09-01 12:05 Africa/Cairo**  
> Repository: `fawakhry/TrendOs`  
> Working branch: `agent/go-live-2026-09-01-integrity`  
> Current approved deployed source candidate: `release/integrity-v1-predeploy-2026-08-31-r3` at `ee03adab4c733aec909511b23dd80f42ad3b927e`  
> Current production: Apps Script Version **145**, master+HEALTH ON only.  
> Status: **RP-01/RP-02/RP-03/RP-03E PASS; LEGACY PRESS VIEW CONFIRMED NON-AUTHORITATIVE; NO PRODUCTION REMEDIATION AUTHORIZED OR APPLIED**.

## 1. Objective

Close the six HEALTH CORE-P0 signals without deleting historical rows, inventing business facts, changing Order ID/Line ID contracts, enabling a business family prematurely, or moving Google Sheets away from its current authoritative-write role.

The first activation target remains ORDER_LINE, but it stays OFF until every gate in this plan that applies to it is PASS.

## 2. Non-negotiable constraints

- Do not overwrite live `Code.gs` from GitHub.
- Do not rewrite the 229 legacy Line-ID cells as a first fix.
- Keep `trendosNormalizeLineId_` globally fail-closed for Date objects.
- Order ID remains the Order key; Line ID remains the active Line key.
- Preserve all source and audit/history rows, including `مكرر`.
- No inferred attendance end time, invoice amount, Press session link, approval, or state.
- R3 remains the currently deployed/approved candidate; any remediation source must be a separately reviewed successor checkpoint, never a silent mutation of R3.
- CI PASS is not runtime PASS.
- Every production write must be exact-bounded, previewed, reversible, and followed by a Ledger checkpoint.

## 3. Evidence-backed root causes

| Signal | Verified cause | Classification | Required treatment |
|---|---|---|---|
| `INVALID_LINE_IDS` | 229 legacy Line-ID cells are numeric/date-formatted; Apps Script `getValues()` returns Date objects. 131 are closed and 98 are not closed. | Live compatibility blocker | Cell-aware display-value adapter; no bulk key rewrite |
| `DUPLICATE_ATTENDANCE_SESSIONS` | 6 excess rows across 5 past employee/day keys; blank end times and some conflicting states | Legacy operational defect | Preserve rows; deterministic canonical mapping + historical resolution record |
| `DUPLICATE_CLEANING_RECORDS` | 16 excess completed/no-problem rows across 11 past employee/day keys | Historical baseline | Exact acknowledgement only; future duplicates remain P0 |
| `DUPLICATE_INVOICE_DRAFTS` | Two active unpriced/unsent Draft rows each for Orders 3569, 3572, 3577 | Active legacy defect | Exact canonical Draft mapping; old row preserved as superseded |
| `PRESS_SOURCE_VIEW_MISMATCH` | Nine current source Lines after legacy display-value recovery; `واجهة المكبس` has headers only; Candidate R3 has no `trendosPressViewQueueV1_` provider | Contract/view ambiguity | Diagnose live consumer; never fake equality |
| `PRESS_COMPLETED_WITHOUT_SESSION` | Fourteen delivered Lines lack Line-session evidence after legacy display-value recovery; the Line-session ledger sheet does not exist | Historical/schema debt | Exact evidence-hash baseline only after consumer diagnosis; no invented session link |

## 4. Proposed remediation architecture

### 4.1 Sheet-cell-aware legacy Line ID adapter

Add a narrowly scoped helper for known Line-ID columns:

`trendosLineIdFromSheetCellV1_(rawValue, displayValue)`

Rules:

1. First try the existing `trendosNormalizeLineId_(rawValue)`.
2. Only when the raw value is a Date/number and the exact cell display text matches a valid legacy/current Line-ID shape, normalize the display text.
3. Reject empty, ambiguous, conflicting, or malformed display values.
4. Never change the global Date rejection self-test.
5. Use the adapter only in:
   - Order/Line row scan and resolution;
   - Press source queue and Line-state reads;
   - Health snapshot Line-ID extraction;
   - any later reviewed Line-ID lookup proven to read the same source column.

This makes the 98 open legacy rows resolvable without mutating their stored keys.

Required dry-run evidence:

- 229 legacy displayed IDs resolve deterministically.
- 12 current `TM...` IDs remain unchanged.
- `INVALID_LINE_IDS = 0`.
- `ACTIVE_DUPLICATE_LINE_IDS = 0`.
- all 98 not-closed rows resolve to exactly one row and the expected Order ID.
- zero Sheet writes.

### 4.2 Auditable resolution/baseline registry

Create only after separate production-write approval:

`إدارة - معالجات السلامة V1`

Proposed headers:

1. `Metric ID`
2. `Entity Key`
3. `Canonical ID`
4. `Superseded ID`
5. `Classification`
6. `Reason`
7. `Evidence Hash`
8. `Approved At`
9. `Approved By`
10. `Active?`

Safety rules:

- exact-key matching only; no date-wide or status-wide wildcard.
- entries are append-only; a correction adds a new resolution revision.
- every entry must carry an evidence hash calculated from the protected source rows.
- if source evidence changes, the resolution fails closed and the P0 reopens.
- acknowledged historical items remain visible as WARN/audit metrics; they are not erased from observability.
- missing registry means no exclusion.

### 4.3 Attendance resolution

Candidate R3 already chooses a deterministic canonical session: clocked-in/non-ended first, then earliest row. The remediation must reuse that exact rule and persist the selected session IDs in the registry; it must not modify end times or operational states.

Exact employee/day keys:

- `ريفان|2026-08-27`
- `وائل|2026-08-29`
- `ريفان|2026-08-29`
- `ريفان|2026-08-30`
- `جابر|2026-08-31`

Before registry write, a dry run must return the canonical and superseded Session IDs plus a stable hash for every source row. Any new row or changed state cancels the write.

Future employee/day duplicates after the activation cutoff remain CORE-P0.

### 4.4 Cleaning historical baseline

Register only these exact historical employee/day keys after verifying all involved rows are completed, no-problem records:

- `جابر|2026-08-24`
- `ريفان|2026-08-25`
- `جابر|2026-08-25`
- `ريفان|2026-08-26`
- `وائل|2026-08-27`
- `جابر|2026-08-27`
- `شريف|2026-08-27`
- `ريفان|2026-08-29`
- `ريفان|2026-08-30`
- `وائل|2026-08-30`
- `جابر|2026-08-31`

No Cleaning source row is edited or deleted. Any duplicate outside these exact evidence hashes remains P0.

### 4.5 Invoice canonical Draft mappings

Recommended mappings, conditional on an immediate pre-write recheck that totals remain 0, no Invoice Number exists, no WhatsApp send state exists, the blocker remains unchanged, and the later-updated row is still the latest:

| Order ID | Canonical Draft | Superseded Draft |
|---|---|---|
| `3569` | `DR-19c18636` | `DR-55d94661` |
| `3572` | `DR-69e8cb63` | `DR-fe3c766a` |
| `3577` | `DR-3466cb0d` | `DR-ceed6b65` |

The Invoice resolver must:

- include all source rows in audit/history reads;
- exclude a Draft from active resolution only when an active exact registry mapping and matching evidence hash identify it as superseded;
- require exactly one remaining canonical Draft;
- fail closed if either ID is missing, financial/send state changed, or more than one active Draft remains.

No Draft row is deleted and no amount/status/invoice number is invented.

### 4.6 Press view contract

Before changing the metric:

1. inspect the live `Code.gs` and frontend consumer read-only to determine whether `واجهة المكبس` is still an authoritative production view.
2. If it is authoritative, implement a locked/idempotent view refresh and verify these nine exact current source Lines appear:
   - `3796-01`
   - `3803-01`
   - `3809-01`
   - `3813-01`
   - `3817-01`
   - `TM2606150097-01`
   - `TM2606150098-01`
   - `TM2606150105-01`
   - `TM2606160146-01`
3. If the sheet is obsolete and the UI consumes the Press status/source queue directly, replace the false P0 comparison with an explicit `PRESS_VIEW_PROVIDER_UNAVAILABLE`/legacy-view WARN and runtime-test the real UI provider.
4. Never define a fake provider that simply returns the source queue solely to force a PASS.

RP-03E decision:

- the production backend computes its Press queue directly from `بنود الأوردرات`;
- the current `main` frontend does not load `press-control-v1.js`, and the legacy `press` role maps to the Print screen with Heat Press filters/badges;
- `واجهة المكبس` is a non-authoritative legacy/stub sheet;
- no view refresh, provider fabrication, or Sheet write is required;
- the Dashboard must keep this condition as WARN, not P0;
- exact evidence: `docs/trendos/checkpoints/RP03E_PRESS_CONSUMER_CONTRACT_2026-09-01.md`.

### 4.7 Press historical session baseline

Acknowledge only these exact completed Lines, and only when their evidence hashes still match the RP-03 checkpoint:

- `3536-01`
- `3585-02`
- `3628-01`
- `3669-01`
- `3756-01`
- `3758-01`
- `3764-01`
- `3770-01`
- `3774-01`
- `3779-01`
- `3788-01`
- `TM2606140061-01`
- `TM2606160140-01`
- `TM2606160181-01`

They remain visible as historical traceability WARN. No Session ID is backfilled without independent evidence. Any qualifying Press completion after the activation cutoff without Line-session evidence remains CORE-P0.

## 5. Execution sequence and gates

### RP-01 — GitHub-only remediation implementation

Implement on the working branch only:

- cell-aware Line-ID adapter;
- resolution-registry reader and evidence-hash validation;
- Invoice active/superseded resolution;
- baseline-aware Dashboard metrics;
- Press view contract classification;
- fail-closed dependency checks.

Expected: source + tests only.  
Actual: **PASS** — implementation commit `63d6dd50aee10b84ad35a9d06e9f4414254636d1`; cross-timezone evidence hardening commit `24b4e89a3d3866f8f95d28ec609a302ba908486e`.  
Gate: no Apps Script/Sheet/flag/deploy impact.

### RP-02 — CI and synthetic regression

Required tests:

- Date object remains rejected globally.
- known cell display adapter accepts valid display text and rejects mismatches.
- 229/98 production-shaped fixtures resolve without source mutation.
- active Line duplicate detection remains strict.
- registry absent/tampered/stale hash fails closed.
- Attendance/Cleaning exact historical keys become WARN only when hashes match.
- Invoice mappings leave one canonical row; financial/send drift reopens P0.
- Press post-cutoff missing session remains P0.
- view unavailable cannot silently become PASS.

Expected: all tests PASS.  
Actual: **PASS** — nine local safety/composition/package suites PASS; GitHub Actions `33491831765` SUCCESS.  
Rollback: revert GitHub-only remediation commits.

### RP-03 — Read-only production preview

Run a bounded preview that logs only non-secret counts/IDs/hashes:

- no Sheet insert/update/delete;
- no Script Property change;
- no trigger;
- no deployment.

Expected:

- all proposed registry entries match current evidence;
- Line adapter resolves all 98 open legacy rows uniquely;
- no new blocker appears.

Actual: **PASS for Line/Attendance/Cleaning/Invoice and evidence acquisition; PARTIAL/CORRECTED for the earlier Press scope.** The adapter recovered 229/229 legacy IDs, all 98 legacy open Lines resolve uniquely, invalid/active-duplicate/mismatch counts are zero, and Press scope is now 9 queue Lines plus 14 completed-without-Line-session records. Exact mappings and hashes: `docs/trendos/checkpoints/RP03_CORE_P0_PREVIEW_2026-09-01.md`.  
Failure action: stop; do not write registry.

### RP-03E — Press consumer contract diagnosis

Inspect the live `Code.gs` and frontend consumers read-only to establish whether `واجهة المكبس` is authoritative, obsolete, or fed by an unavailable provider.

Expected:

- exact consumer/provider call chain identified;
- no invented view/provider;
- one evidence-backed choice: locked/idempotent view repair or explicit legacy-view WARN;
- no Apps Script Head, Sheet, property, trigger, deployment, route, or flag write.

Actual: **PASS** — backend and frontend consumer chains identified; `واجهة المكبس` is non-authoritative; no source/view write is required. Evidence: `docs/trendos/checkpoints/RP03E_PRESS_CONSUMER_CONTRACT_2026-09-01.md`.  
Failure action: if later authenticated live-source evidence proves a new provider, reopen this classification before Head/registry/deploy work.

### RP-03F — Freeze remediation successor candidate

Create a separate reviewed release branch from the synchronized working-branch checkpoint. Do not move Candidate R3.

Expected:

- new successor branch points to one exact commit;
- package contains the 12 reviewed modules including `trendos-core-p0-remediation-v1.gs`;
- CI SUCCESS on the frozen ref;
- Candidate R3 remains unchanged;
- no production impact.

Actual: PENDING.  
Rollback: delete or abandon only the new candidate ref; production remains Version 145.

### RP-04 — Head composition with flags unchanged

Install only the reviewed remediation source into Apps Script Head, save/reload/exact-verify, then run dependency and legacy no-change checks.

Expected:

- composition PASS;
- `codeReady=true`, `missing=[]`;
- master+HEALTH ON only;
- all business families and Fast Auth OFF;
- Version 145 behavior unchanged because no deployment occurred.

Actual: PENDING.  
Rollback: restore exact Version-145 Head source files from the captured checkpoint.

### RP-05 — Controlled deployment

Requires a separate deployment checkpoint/approval.

Deploy the reviewed successor version on the same Deployment ID with the business-family flags still OFF and HEALTH only active.

Expected:

- legacy base route PASS;
- HEALTH route PASS;
- exactly one D1 sync trigger;
- no business mutation.

Actual: PENDING.  
Rollback: restore Version 145 immediately; Version 144 remains deeper rollback.

### RP-06 — Exact-bounded registry write

Requires separate explicit production-data-write approval after RP-01 through RP-05 PASS.

Use one ScriptLock-protected helper that:

1. rechecks every source row and evidence hash;
2. creates the registry only with the exact approved schema;
3. appends only the exact attendance, cleaning, invoice, and Press baseline mappings listed above;
4. verifies the row count and hashes;
5. performs no source-sheet mutation.

Expected: registry exact; source sheets byte/value-equivalent before/after.  
Actual: PENDING.  
Rollback: deactivate the inserted registry entries by an append-only resolution revision; never delete the source evidence.

### RP-07 — HEALTH recheck

Expected CORE-P0 result after code + exact registry:

- `INVALID_LINE_IDS = 0`
- `ACTIVE_DUPLICATE_LINE_IDS = 0`
- acknowledged Attendance/Cleaning baselines appear as WARN, not P0
- active duplicate Invoice Drafts = 0
- completed pre-Integrity Press Lines appear as WARN, not P0
- Press source/view result matches the verified real consumer contract
- `OPEN_CORE_P0_BLOCKERS = 0`

Actual: PENDING.

Any unexpected P0 keeps all business-family flags OFF.

### RP-08 — ORDER_LINE activation checkpoint

Only after RP-07 PASS and separate flag-activation approval:

1. enable ORDER_LINE only;
2. run read/resolve regression across all 98 open legacy Lines;
3. run a separately approved no-op/idempotent mutation regression on a designated safe Line;
4. verify legacy UI, D1 mirror/fallback, trigger count, and HEALTH;
5. disable ORDER_LINE immediately on any mismatch.

Attendance/Cleaning, Press, Invoice, WhatsApp, OPS, and Automation remain OFF until their own family checkpoints.

## 6. Approval boundaries

Current user approval covers preparation of this plan only.

No additional approval is needed for later GitHub-only implementation/tests that have zero production impact.

Explicit approval remains required for:

1. updating the production deployment;
2. creating/writing the resolution registry;
3. activating ORDER_LINE or any later family.

## 7. Current exact stopping point

**RP-01/RP-02/RP-03/RP-03E COMPLETE; LEGACY PRESS VIEW CONFIRMED NON-AUTHORITATIVE; PRESS SCOPE IS 9 QUEUE / 14 HISTORICAL COMPLETED-WITHOUT-LINE-SESSION; VERSION 145 + HEALTH ONLY REMAINS LIVE; STOP BEFORE REMEDIATION HEAD INSTALL, REGISTRY, DEPLOY, OR ORDER_LINE.**

Exact next technical action: execute RP-03F and freeze a separate remediation successor candidate from the synchronized working branch, verify CI, and checkpoint the exact ref/SHA before any Apps Script or Sheet change.
