# TrendOS Blackbox — PERF-CF-02CK Username Case Discovery / Session Invalidated

Date: 2026-09-05
Scope: TrendOS main platform / Cloudflare only.

## Starting state

- Active checkpoint: `PERF-CF-02CK — Production Cloud Write Business Qualification`.
- Previous blocker: dedicated GitHub Actions employee-auth secrets were absent.
- Production cutover remained OFF.
- Sheets / Apps Script remained authoritative.
- No Production business write was authorized for this step.

## User-supplied candidate

The user asked to test the literal employee username:

`Username`

with capital `U`.

## Source behavior verified before/after probe

Current `Code.gs` `findUser_` compares the stored employee username using exact normalized string equality:

`name === normalize_(username)`

so `username` and `Username` are distinct candidates.

The same current source also shows that `authorize_` clears the stored employee Token when a token is missing, mismatched, or expired. Therefore an existence probe using an invalid token is NOT mutation-free for an existing employee.

## Controlled probe

Temporary workflow:

`.github/workflows/trendos-employee-Username-probe.yml`

Trigger commit:

`32371150f14aaabc277e052fba88befd8edfaa70`

Run:

- Workflow: `TrendOS Employee Username Case Probe`
- Run ID: `33973359765`
- Job ID: `101325680403`
- Probe username: `Username`
- Dummy token: deliberately invalid, non-secret probe value

Apps Script response:

`{"success":false,"message":"انتهت الجلسة. سجل الدخول مرة أخرى."}`

## Conclusion

The literal employee username `Username` **exists** in the authoritative Apps Script / Sheets employee store.

This differs from lowercase `username`, which previously returned `المستخدم غير موجود.`.

Because the existing `authorize_` implementation clears the stored Token for an existing user when an invalid token is supplied, this probe invalidated/cleared the current employee session token for `Username` in the authoritative Users sheet.

This was an authentication-state mutation in Sheets, not a business-data write.

## Safety impact

- Production Cloud Write order: NONE.
- Production D1 business mutation: NONE.
- Cloud Write event/outbox: NONE.
- Worker deploy: NONE.
- Worker secret rotation: NONE.
- Production cutover: NONE.
- Frontend cutover: NONE.
- Authority transfer: NONE.
- Sheets business data mutation: NONE.
- Sheets authentication state: **employee Token for `Username` was cleared/invalidated by the current authoritative auth behavior**.

## Cleanup

Temporary workflow removed immediately after result.

Cleanup commit:

`1bb936db4ec78b64ac813a26e1e3289f53c6a9dd`

## Correct next step

Do not perform further invalid-token username existence probes.

Use `Username` as the candidate `TRENDOS_PROD_QUALIFY_USERNAME` only after a fresh normal employee login regenerates a valid employee session token.

Then store the fresh token only as:

`TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN`

in GitHub Actions Secrets, recheck presence without printing values, and continue the existing bounded 02CK qualification.

Do not rotate `EDGE_SESSION_SECRET` and do not enable cutover.
