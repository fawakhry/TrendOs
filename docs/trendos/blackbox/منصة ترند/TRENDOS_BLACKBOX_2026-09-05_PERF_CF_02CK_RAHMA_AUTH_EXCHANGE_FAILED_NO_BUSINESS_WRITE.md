# TrendOS Blackbox — PERF-CF-02CK Rahma Auth Exchange Failed / No Business Write

Date: 2026-09-05
Scope: TrendOS main platform / Cloudflare only.

## Starting point

- Latest fully closed checkpoint: `PERF-CF-02CJ — Production Ledger Reconciliation` — **VERIFIED PASS — CLOSED**.
- Active checkpoint: `PERF-CF-02CK — Production Cloud Write Business Qualification`.
- Production Cloud Write remains ON and schema-ready.
- Production cutover remains OFF.
- Sheets / Apps Script remain authoritative.
- `EDGE_SESSION_SECRET` was not read, rotated, or replaced.

## User-requested employee candidate

The user requested trying employee:

`رحمه`

Before calling Apps Script or Production auth, a temporary GitHub Actions probe compared the already-configured `TRENDOS_PROD_QUALIFY_USERNAME` secret against the two expected Rahma spellings without printing the secret value.

Probe result:

- Run ID: `33973697532`
- Job ID: `101326579972`
- Result: **SUCCESS**
- Match: `رحمه` exactly.
- `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN` was also confirmed non-empty.
- No Production endpoint was called by this match probe.

Temporary match-probe workflow was removed.

Cleanup commit:

`f7fa5b7c757741a78215b6e6e32ab612dd2900f0`

## Controlled 02CK retry with Rahma secrets

The existing previously-authorized bounded qualification job was re-run so it would consume the current repository secrets without creating a new auth bypass.

- Workflow run ID: `33973557299`
- Run attempt: `2`
- Job ID: `101326683512`
- Result: **FAILURE at canonical employee-session exchange — NO BUSINESS WRITE**

### Preflight

Passed:

- Production Edge health: valid.
- Production DB: available.
- Edge auth configured.
- Apps Script upstream configured.
- `cutover=false`.
- Production Cloud Write enabled and accepting bounded writes.
- `schemaReady=true`.
- `sheetsAuthoritative=true`.
- Production Shadow remained observer-only/read-only/mutation-free.
- Anonymous Cloud Write POST remained fail-closed with HTTP 401.
- `pendingOutbox=0` before any write step.

### Credential readiness

Passed:

- `TRENDOS_PROD_QUALIFY_USERNAME` non-empty and matched `رحمه`.
- `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN` non-empty.

No secret values were printed.

### Canonical employee session exchange

Failed at:

`POST /v1/edge/session`

The workflow stopped immediately because the canonical employee-session exchange did not satisfy its required success contract.

The exact upstream rejection body was not retained by the workflow logs, so do not guess whether the cause was token mismatch/expiry, current Apps Script authorization state, or another verification-contract issue.

## Business-write result

All business-write steps remained ineligible and were skipped:

- Synthetic Production order: **SKIPPED**.
- Idempotent replay: **SKIPPED**.
- Outbox verification: **SKIPPED**.
- Post-write safety verification: **SKIPPED**.
- Qualification success conclusion: **SKIPPED**.

Therefore:

- Production D1 business write: **NONE**.
- Production Order ID created by this attempt: **NONE**.
- Cloud Write event/outbox created by this attempt: **NONE**.
- Sheets business-data write: **NONE**.
- Worker deploy: **NONE**.
- Worker secret rotation/replacement: **NONE**.
- Production cutover: **NONE**.
- Frontend cutover: **NONE**.
- Authority transfer: **NONE**.

Sensitive temporary request/response/token files created inside the GitHub runner were cleaned by the workflow's `always()` cleanup step.

## Important auth-state caution

Current authoritative Apps Script `authorize_` can clear the stored employee Token when a supplied token is missing, mismatched, or expired. Because this canonical exchange failed, the GitHub secret token used in this attempt must not be assumed reusable.

Do not perform blind invalid-token existence probes for `رحمه` or any other employee.

## Current 02CK status

`PERF-CF-02CK`: **SAFE BLOCKED — RAHMA AUTH EXCHANGE FAILED — NO BUSINESS WRITE**.

Latest fully closed checkpoint remains:

`PERF-CF-02CJ — VERIFIED PASS — CLOSED`.

## Exact safe resume point

1. Perform a fresh normal TrendOS login as `رحمه` using the legitimate employee login flow.
2. Replace only `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN` with that fresh browser `matbagy_session_token`; keep `TRENDOS_PROD_QUALIFY_USERNAME=رحمه`.
3. Recheck only secret presence/match without sending dummy credentials to Apps Script.
4. Retry 02CK once through the canonical `/v1/edge/session` exchange.
5. If the fresh-token exchange passes, allow the existing bounded qualification to create at most one synthetic Production D1 order and complete the existing idempotency/outbox/Shadow safety assertions while keeping `cutover=false` and Sheets authoritative.
6. If the fresh-token exchange still fails, stop before any business write and diagnose the existing Apps Script `verifyEmployeeSession` / Worker session-exchange contract. Do not invent a substitute auth path and do not rotate `EDGE_SESSION_SECRET` merely to pass qualification.
