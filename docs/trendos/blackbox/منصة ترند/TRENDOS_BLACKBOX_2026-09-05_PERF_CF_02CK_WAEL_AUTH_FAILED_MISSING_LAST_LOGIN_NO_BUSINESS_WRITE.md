# TrendOS Blackbox — PERF-CF-02CK Wael Auth Failure / Missing Last Login

Date: 2026-09-05
Scope: TrendOS main platform / Cloudflare only.

## Context

The user kept the existing GitHub Actions secret names:

- `TRENDOS_PROD_QUALIFY_USERNAME`
- `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN`

The canonical 02CK workflow was restored to those original secret names before testing.

A temporary read-only secret-alignment probe confirmed without disclosure that:

- the username secret matched literal `wael` exactly;
- the employee-token secret was non-empty.

Probe workflow:
`.github/workflows/trendos-wael-old-secret-alignment-probe.yml`

Probe run:
- Run ID: `33975070412`
- Job ID: `101330219394`
- Result: **SUCCESS**

The probe was then deleted. No Production endpoint or employee-auth endpoint was called by that probe.

## Bounded 02CK attempt

A one-time exact-message push trigger was temporarily added to the canonical qualification workflow, preserving all existing safety assertions and using the original secret names.

Authorization commit:
`e42af3c00df3590c7c1dfe6ec1d70332b759b4de`

Workflow run:
- Run ID: `33975124471`
- Job ID: `101330359341`
- Result: **FAILURE at employee session exchange**

Preflight result:
- Production Edge health: PASS
- Production Cloud Write health: PASS
- Production Shadow: PASS
- anonymous Cloud Write POST rejected 401: PASS
- `pendingOutbox=0`
- credentials present: PASS

Employee-session exchange:
- canonical `POST /v1/edge/session`: **FAILED**
- Edge token issued: **NO**

Because auth failed:
- synthetic Production order: **SKIPPED**
- D1 business write: **NONE**
- Cloud Write outbox creation: **NONE**
- post-write verification: **SKIPPED**
- Production cutover: **OFF**
- Sheets / Apps Script authority: **UNCHANGED**
- `EDGE_SESSION_SECRET` rotation/replacement: **NONE**

## Root cause confirmed in authoritative Users sheet

After the failed exchange, the authoritative TrendOS workbook, sheet `المستخدمين`, row for virtual employee `wael` showed:

- Username: `wael`
- Department: `طباعة`
- Role: `تشغيل`
- Active: `نعم`
- Last login: **empty**
- Token: **empty after failed auth**

The virtual account had previously been provisioned with a token directly in the sheet but without a corresponding normal login timestamp.

Current authoritative `authorize_` requires both:

1. token equality with the stored employee token; and
2. a non-expired session based on `آخر دخول`.

When the token is invalid/missing/mismatched or the session is expired, `authorize_` clears the stored Token and returns session-expired.

Therefore the manually provisioned token was not a complete valid employee session. The failed `wael` exchange cleared that token as designed by the current auth implementation.

## Corrective action

The temporary virtual employee password was reset in the authoritative Users sheet to a user-known temporary test password. The plaintext password is intentionally **not recorded in GitHub or blackbox**.

Token remains empty until a real normal login occurs.

A normal TrendOS login as `wael` is now required. That login will:

- validate the temporary password;
- mint a fresh employee token;
- write `آخر دخول`;
- store both values authoritatively;
- upgrade the temporary legacy plaintext password to the normal V1922 hashed format automatically.

After that normal login, the new `matbagy_session_token` must replace the value of existing GitHub secret:

`TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN`

The username secret remains:

`TRENDOS_PROD_QUALIFY_USERNAME = wael`

Do not paste the token into chat or repository files.

## Trigger cleanup

The one-time push trigger was removed immediately after the failed attempt.

Cleanup commit:
`49f1152ccc6ceac7598f18a8b453d3098e2313a2`

Canonical workflow is back to manual `workflow_dispatch` only and reads the original secret names.

## Current status

`PERF-CF-02CK`: **SAFE BLOCKED — WAEL REAL LOGIN REQUIRED — NO BUSINESS WRITE**.

Latest fully closed checkpoint remains:

`PERF-CF-02CJ — VERIFIED PASS — CLOSED`.

## Exact safe resume point

1. Login normally to TrendOS as `wael` using the temporary test password already known to the user.
2. Confirm the login succeeds.
3. Copy the fresh `matbagy_session_token` from browser Session Storage.
4. Replace only `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN` in GitHub Actions Secrets.
5. Keep `TRENDOS_PROD_QUALIFY_USERNAME = wael`.
6. Do not run another auth attempt until the fresh token is stored.
7. Recheck exact username/token presence without disclosure.
8. Run bounded 02CK once.
9. If PASS, immediately clear the virtual employee Token and disable/remove `wael`.
10. Do not rotate `EDGE_SESSION_SECRET`; do not enable cutover before 02CK PASS.
