# TrendOS Book Agent — 34 imported findings (2026-10-16)

Source: owner-supplied TrendOS Book Agent audit, chapters 8–15. Source assertions are **reported findings**, not independently revalidated here. These are TrendOS-wide items; NOT all are autonomous-printshop defects. No production changes authorized.

Status convention: INTAKE_UNVERIFIED. Priority follows supplied audit; each requires source review, synthetic test, security review where applicable, and evidence before closure. Keep historical closure evidence even when removing from active list.

Overlap with printshop backlog: TBA-04/05/07 overlap least-privilege (#11/#26); TBA-09/10/11/12 overlap read contracts (#10); TBA-29/31/33 overlap CI/runtime evidence (#24/#25). Do not double-count as resolved.

## Active intake — 34

### P0
- [ ] TBA-01 | P0 | INTAKE_UNVERIFIED | Same-day on-the-fly delivery date mismatch | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-02 | P0 | INTAKE_UNVERIFIED | Debt-block enforcement parity legacy/cloud-native | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-03 | P0 | INTAKE_UNVERIFIED | Server-side create-order role authorization | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-04 | P0 | INTAKE_UNVERIFIED | Employee logout versus Edge token revocation | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-05 | P0 | INTAKE_UNVERIFIED | Empty allowed-screen list must deny | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-06 | P0 | INTAKE_UNVERIFIED | Edge token dependency on Apps Script verification | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-07 | P0 | INTAKE_UNVERIFIED | Unknown department permission must deny | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-08 | P0 | INTAKE_UNVERIFIED | Order status transition matrix | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.

### P1 Operations
- [ ] TBA-09 | P1 Operations | INTAKE_UNVERIFIED | Pagination reads too many mirror rows | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-10 | P1 Operations | INTAKE_UNVERIFIED | No stable snapshot/cursor across pages | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-11 | P1 Operations | INTAKE_UNVERIFIED | Client post-page filter/count parity | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-12 | P1 Operations | INTAKE_UNVERIFIED | __DEBT__ alternative authority/failure path | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-13 | P1 Operations | INTAKE_UNVERIFIED | On-the-fly flag local-memory persistence | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-14 | P1 Operations | INTAKE_UNVERIFIED | Legacy/cloud-native update policy parity | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-15 | P1 Operations | INTAKE_UNVERIFIED | Network retry and idempotency | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-16 | P1 Operations | INTAKE_UNVERIFIED | Password change and session revocation atomicity | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.

### P1 Customers
- [ ] TBA-17 | P1 Customers | INTAKE_UNVERIFIED | Internal customer ID versus login code | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-18 | P1 Customers | INTAKE_UNVERIFIED | debtAmount authority versus EasyStore | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-19 | P1 Customers | INTAKE_UNVERIFIED | Duplicate Arabic names and changed phones | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-20 | P1 Customers | INTAKE_UNVERIFIED | External customer short numeric identifier collisions | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-21 | P1 Customers | INTAKE_UNVERIFIED | Customer create/edit role authorization parity | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-22 | P1 Customers | INTAKE_UNVERIFIED | Customer portal end-to-end ownership proof | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.

### P2 UI
- [ ] TBA-23 | P2 UI | INTAKE_UNVERIFIED | Local-only UI permissions versus server | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-24 | P2 UI | INTAKE_UNVERIFIED | safeRole unknown role defaults service | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-25 | P2 UI | INTAKE_UNVERIFIED | HTML output encoding/XSS review | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-26 | P2 UI | INTAKE_UNVERIFIED | Legacy Sheets save status messages | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-27 | P2 UI | INTAKE_UNVERIFIED | WhatsApp notification manual confirmation | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.

### P1/P2 Evidence
- [ ] TBA-28 | P1/P2 Evidence | INTAKE_UNVERIFIED | Tests not proven on latest full commit | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-29 | P1/P2 Evidence | INTAKE_UNVERIFIED | Entry659 failure/success SHA reconciliation | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-30 | P1/P2 Evidence | INTAKE_UNVERIFIED | 40 of 97 UI buttons need deep trace | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-31 | P1/P2 Evidence | INTAKE_UNVERIFIED | 256 test files need function/CI mapping | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-32 | P1/P2 Evidence | INTAKE_UNVERIFIED | System catalog incomplete across 1995 files | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-33 | P1/P2 Evidence | INTAKE_UNVERIFIED | Deployed frontend/Worker/flags SHA parity | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.
- [ ] TBA-34 | P1/P2 Evidence | INTAKE_UNVERIFIED | OFF/CANARY/GENERAL effective runtime state | Owner: TrendOS Book Agent / responsible TrendOS development agent | Acceptance: source reproduction, synthetic negative/positive tests, CI on same HEAD; runtime proof separately where applicable.

## First proposed fixes (no production changes)
1. TBA-02 debt-block bypass: compare legacy/cloud-native delivery transitions; fail-closed synthetic negative tests.
2. TBA-03 create-order server roles: derive policy and test unauthorized users.
3. TBA-04 and TBA-05 session and screen-scope fail-closed tests.
4. TBA-01 same-day promise and TBA-08 state machine; ensure owner signoff for business policy.

## Evidence and safety
Book agent source: https://github.com/fawakhry/TrendOs/blob/agent/trendos-book-audit-v1-20261014/docs/trendos/book-agent/TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md
Entry659 failed https://github.com/fawakhry/TrendOs/actions/runs/38316884906 ; later success https://github.com/fawakhry/TrendOs/actions/runs/38316935044 ; SHA parity unverified.
This intake does not edit TrendOS_MASTER_BOOK.md, EasyStore, or Matbagy-OS, nor assert AP-297 history. No merge/deploy/D1 writes/real orders.
