# TrendOS Blackbox — PERF-CF-02CK Auth Readiness Recheck / No Write

Date: 2026-09-05
Scope: TrendOS main platform / Cloudflare only.

## Starting point

- Latest fully closed checkpoint: `PERF-CF-02CJ — Production Ledger Reconciliation` — **VERIFIED PASS — CLOSED**.
- Active checkpoint: `PERF-CF-02CK — Production Cloud Write Business Qualification` — **SAFE BLOCKED — NO WRITE**.
- Production Cloud Write remains ON and schema-ready.
- Production cutover remains OFF.
- Sheets / Apps Script remain authoritative.
- Existing Production `EDGE_SESSION_SECRET` must not be rotated just to unblock qualification.

## Objective

Recheck, without exposing credential values and without calling Production, whether the two dedicated GitHub Actions secrets required by the existing bounded 02CK qualification are now configured:

- `TRENDOS_PROD_QUALIFY_USERNAME`
- `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN`

This was an auth-readiness check only. It was not a Production write qualification.

## Temporary read-only probe

Temporary workflow:

`.github/workflows/trendos-production-cloud-write-auth-readiness-probe.yml`

Exact one-time commit message gate:

`PROBE PROD QUALIFY AUTH READINESS 2026-09-05`

Probe creation / trigger commit:

`d7028f54197bb438f2a26ff74827db8e414db12e`

The workflow had `contents: read` only and performed only non-empty checks on the two secret-backed environment variables. It did not print credential values and did not call any Production endpoint.

## Controlled run

- Workflow: `TrendOS Production Cloud Write Auth Readiness Probe`
- Run ID: `33972215165`
- Job ID: `101322617710`
- Result: **SUCCESS — READ-ONLY NO-WRITE**

Observed readiness output:

- `TRENDOS_PROD_QUALIFY_USERNAME_PRESENT=0`
- `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN_PRESENT=0`
- `PROD_QUAL_AUTH_READINESS=NOT_READY`

Therefore both dedicated 02CK automation credential secrets remain unconfigured.

## Credential contract verified from current Apps Script source

Read-only source inspection of the current `Code.gs` confirmed the exact credential semantics used by the canonical `verifyEmployeeSession` route:

- Employee `login` requires a valid employee username and password.
- A successful login generates a fresh session token using two UUID values and stores it in the employee `Token` field together with `آخر دخول` / last-login time.
- The employee session TTL defaults to **12 hours** and can be configured through `SESSION_TTL_HOURS` within the bounded range implemented by the current source.
- `authorize_` rejects a missing, mismatched, or expired token and clears the stored token when the session is invalid/expired.
- `verifyEmployeeSession_` calls `authorize_` and also requires the employee to be permitted by the existing application authorization mode; therefore not every arbitrary user/session is eligible.
- The Production Edge session exchange calls Apps Script `action=verifyEmployeeSession` using the username and employee session token, then issues a separate short-lived Edge token using the existing `EDGE_SESSION_SECRET`.

Operational consequence for 02CK:

`TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN` must be a **fresh valid employee session token**, not a permanent API key. For the one-time Production qualification it should be generated/refreshed close to the controlled run, stored only as a GitHub Actions secret, and never committed to repository files or pasted into blackbox documentation.

The current frontend keeps the active employee session token in `sessionStorage` for the browser session (`matbagy_session_token`) rather than persistent local storage. This supports obtaining the one-time qualification token from a fresh authorized login without changing Production auth design.

## Literal `username` candidate probe

At the user's request, the literal value `username` was tested as the employee username through the existing Apps Script `verifyEmployeeSession` route using a deliberately invalid dummy token. This was a read-only existence probe only; no valid credential was supplied and no Production Cloud Write endpoint was called.

Temporary workflow:

`.github/workflows/trendos-employee-username-probe.yml`

Trigger commit:

`f68b18ffab44711eceb3807be8286ad08ef8c54c`

Controlled run:

- Workflow: `TrendOS Employee Username Probe`
- Run ID: `33973276252`
- Job ID: `101325450555`
- Result: **SUCCESS — READ-ONLY**
- Apps Script response: `{"success":false,"message":"المستخدم غير موجود."}`

Conclusion:

The literal value `username` is **not** an existing employee username in the current authoritative Apps Script/Sheets user store. It cannot be used for 02CK qualification.

The temporary workflow was removed immediately after the probe.

Cleanup commit:

`c1eef6b1e28a6fa4c9e3d091f3071ada20bc116f`

## Safety result

No business or infrastructure mutation was performed by these probes or the credential-contract inspection:

- No Production business order created.
- No D1 mutation.
- No Sheets mutation.
- No Cloud Write event created.
- No Cloud Write outbox item created.
- No Worker deploy.
- No Worker secret value read.
- No Worker secret rotation or replacement.
- No Production cutover.
- No frontend cutover.
- No authority transfer.

## Cleanup

The temporary auth-readiness probe was removed after its controlled run.

Cleanup commit:

`06dedc9021a7efff1826a346f3f9e428238c49f2`

The canonical Production qualification workflow remains:

`.github/workflows/trendos-production-cloud-write-business-qualification.yml`

and remains manual-only via `workflow_dispatch` with confirmation:

`QUALIFY_PRODUCTION_CLOUD_WRITE_ORDER`

## Current checkpoint status

`PERF-CF-02CK`: **SAFE BLOCKED — NO WRITE — AUTH READINESS RECONFIRMED NOT READY**.

This is not a failed Production write. No Production write was attempted because the canonical employee-auth inputs are still absent.

Latest fully closed checkpoint remains:

`PERF-CF-02CJ — VERIFIED PASS — CLOSED`.

## Exact safe resume point

1. Perform a fresh normal login with a dedicated employee account that is already authorized by the existing `verifyEmployeeSession` path.
2. Capture that browser session's current `username` and `matbagy_session_token` without exposing them in chat or committing them to GitHub files.
3. Configure them as the GitHub Actions repository secrets:
   - `TRENDOS_PROD_QUALIFY_USERNAME`
   - `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN`
4. Recheck secret presence without printing values.
5. Run the bounded Production business-write qualification through the canonical employee-auth exchange and require all existing 02CK safety checks to pass.

Do not rotate `EDGE_SESSION_SECRET` merely to unblock qualification. Do not transfer write authority, enable Production cutover, or perform full frontend cutover before 02CK passes.
