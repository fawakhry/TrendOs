# TrendOS Cloud Migration V3 — T6A Login Gate — 2026-09-13

## T6A first production canary

Run: `34754129142`

A minimal T6A Worker was deployed temporarily with only the POST session bridge added to the production baseline. Pre-deploy and post-deploy Worker health baselines passed.

Authenticated qualification then returned `401 employee-session-rejected` for `/v1/edge/session` after 8192 ms. The workflow automatically rolled the Worker back successfully to version `1b95d243-0233-4ca2-b710-68f64032145c`.

No D1 migration, frontend Orders cutover, secret rotation, Task mutation, Gaber gate change, or Sheets business-write authority change occurred.

## Root-cause diagnostic

Read-only diagnostic run: `34754222445` — SUCCESS.

Direct POST to the production Apps Script `verifyEmployeeSession` route using the stored qualification username/token returned HTTP 200 in 4584 ms, with `success=false` and message `انتهت الجلسة. سجل الدخول مرة أخرى.`

Conclusion: the T6A POST transport is viable; the stored `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN` was expired.

## Password secret discovery

Presence-only run: `34765706914` — SUCCESS.

No existing qualification password secret was found under the checked expected names. No secret value was printed or exposed.

## Improved qualification design

Clean branch: `cloud-migration-v3-t6a-login-canary-20260913`

Base: production Worker source commit `c910d26bc01b1b143d3c9ba179792567c6d60ba2`.

The clean candidate contains only:
- `.github/workflows/cloud-migration-v3-t6a-login-production-session-canary.yml`
- `cloudflare-d1/src/cloud-session-bridge-v3.mjs`
- `cloudflare-d1/src/index_v2.js`
- `cloudflare-d1/test/cloud-session-bridge-v3.test.mjs`

The workflow no longer relies on the stale stored employee token. It requires `TRENDOS_PROD_QUALIFY_PASSWORD`, performs a normal production Apps Script `login` at runtime, masks the returned employee token, stores it only in `/tmp/t6a-employee-token` for the duration of the job, uses it for the two read-only session-exchange qualifications, and deletes the temporary file in an `always()` cleanup step.

The password and generated token are never printed and the generated token is not persisted to GitHub.

Important behavior of the Apps Script login contract: successful login writes a fresh Token and Last Login timestamp for the qualification user in the Users sheet. This is the intended authentication-session renewal only; it is not a business-row mutation.

## Missing-secret fail-closed proof

Run: `34765963822` — expected FAILURE at the credential gate.

Evidence:
- `T6A_PASSWORD_SECRET_REQUIRED=TRENDOS_PROD_QUALIFY_PASSWORD`
- `T6A_DEPLOY_BLOCKED_BEFORE_LOGIN=YES`
- login step skipped
- dry-run skipped
- Worker deploy skipped
- post-deploy checks skipped
- token cleanup step passed

Therefore this preparation run did not touch Production.

## Current blocker / owner action

Add repository Actions secret:

`TRENDOS_PROD_QUALIFY_PASSWORD`

Value: the current password for the qualification employee account referenced by existing secret `TRENDOS_PROD_QUALIFY_USERNAME`.

Do not paste the password into chat or commit it to source.

After the secret exists, rerun workflow `TrendOS Cloud Migration V3 T6A Login Production Session Canary` on branch `cloud-migration-v3-t6a-login-canary-20260913`.

The workflow retains automatic Worker rollback on any post-deploy failure.
