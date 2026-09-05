# TrendOS Blackbox — PERF-CF-02CL Fresh Wael Auth Mismatch / Token Cleared / No Reconciliation

Date: 2026-09-05
Scope: TrendOS Main Platform / Cloudflare only.

## Starting state

- 02CK: VERIFIED PASS — CLOSED.
- 02CL Apps Script Version 153: LIVE / execution OFF.
- 02CL Worker route: LIVE / execution OFF.
- Dedicated reconciliation secret: configured on Apps Script and Worker.
- Exact target: `CW-PROD-QUAL-33975124471`.
- Target outbox status before auth: `pending`, attempts `0`.
- Target Orders-sheet row: absent.
- Production cutover: OFF.
- Sheets / Apps Script: authoritative.

## User action

User confirmed a fresh normal login as temporary qualifier `wael` and reported updating GitHub Actions secret `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN`.

Authoritative `المستخدمين` row was read immediately before auth and confirmed:
- `wael` active = `نعم`
- employee session token non-empty
- token value intentionally not recorded in GitHub

## Controlled auth-only probe

Temporary workflow:
`.github/workflows/trendos-02cl-wael-auth-readiness-temp.yml`

Trigger commit:
`71047f299b151d7731e3a21673bd0a0e6da26801`

Run:
- Run ID `33987326112`
- Job ID `101363206831`
- exact username secret readiness: PASS (`wael`)
- employee-token secret non-empty: PASS
- canonical Production `/v1/edge/session` exchange: FAILURE
- no Edge token issued
- no reconciliation route called

Cleanup commit:
`d2ea9cd9dfb1dd520e132bc06793204e93f80409`

## Decisive post-failure evidence

Immediately after the failed auth exchange, the authoritative `wael` employee row was re-read.

Result:
- `wael` remains active
- stored employee Token is now empty

Current authoritative Apps Script `authorize_` clears the employee Token when a supplied token is mismatched or expired. Therefore the GitHub credential used by the failed auth exchange must not be retried and must not be assumed reusable.

The most likely operational explanation is that the GitHub Actions token value did not exactly match the fresh authoritative employee token at the instant of exchange (or was otherwise treated as invalid/expired). Exact upstream response body was not logged, so do not overstate a narrower cause.

## Safety outcome

No 02CL reconciliation/business mutation occurred:

- outbox claim: NONE
- outbox attempts increment from 02CL: NONE
- D1 reconciliation mutation: NONE
- Sheets append/update/delete: NONE
- Apps Script qualification gate enable: NONE
- Worker qualification gate enable: NONE
- Worker deploy: NONE in this auth step
- `EDGE_SESSION_SECRET` rotation/replacement: NONE
- Production cutover: NONE
- authority transfer: NONE

## New safety rule for the next attempt

Do not call `/v1/edge/session` immediately after the next login.

Instead:
1. Perform one fresh normal login as `wael`.
2. Read the current authoritative employee token privately and compute a SHA-256 fingerprint only; never record the token.
3. Create a temporary no-network GitHub Actions probe that computes SHA-256 of `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN` and compares it to the expected fingerprint.
4. The temporary probe must output only MATCH / MISMATCH, never the token or hash input.
5. If MISMATCH: stop without calling Apps Script/Production auth; user must update only the GitHub employee-token secret.
6. If MATCH: delete the fingerprint probe and then perform exactly one canonical auth exchange.
7. Only after auth PASS may 02CL bounded gates be enabled for the exact target.

## Current status

`PERF-CF-02CL`: **SAFE BLOCKED — FRESH WAEL TOKEN CLEARED AFTER AUTH MISMATCH — NO RECONCILIATION EXECUTED**.

The existing dedicated reconciliation secret remains configured. Both 02CL execution gates remain OFF.
