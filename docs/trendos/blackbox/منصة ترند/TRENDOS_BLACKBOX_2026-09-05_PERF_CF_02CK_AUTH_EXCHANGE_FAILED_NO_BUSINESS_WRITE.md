# TrendOS Blackbox — PERF-CF-02CK Auth Exchange Failed / No Business Write

Date: 2026-09-05
Scope: TrendOS main platform / Cloudflare only.

## Starting point

- Latest fully closed checkpoint remains `PERF-CF-02CJ — Production Ledger Reconciliation` — **VERIFIED PASS — CLOSED**.
- Active checkpoint remains `PERF-CF-02CK — Production Cloud Write Business Qualification`.
- Candidate employee username `Username` had already been confirmed to exist in the authoritative Apps Script/Sheets employee store.
- Previous discovery probe had invalidated that account's prior stored session token, so a fresh normal login was required.
- Production cutover remained OFF and Sheets / Apps Script remained authoritative.

## User instruction

The user asked to retry the qualification after preparing the employee credentials.

## Secret readiness verification

A temporary GitHub Actions assert verified only that both required repository secrets were non-empty, without printing either value and without calling Production:

- `TRENDOS_PROD_QUALIFY_USERNAME`
- `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN`

Assert trigger commit:

`7884607ea11d2c1edd05c3db41e38291309bf4b5`

Assert run:

- Workflow: `TrendOS Production Cloud Write Auth Ready Assert`
- Run ID: `33973513675`
- Result: **SUCCESS**

Conclusion: both required qualification secrets were present in GitHub Actions at retry time.

Temporary assert workflow was removed after use.

## Controlled Production qualification retry

Because the connector cannot invoke `workflow_dispatch` directly, a temporary exact-message push-gated harness was created from the canonical manual qualification workflow.

Temporary workflow:

`.github/workflows/trendos-production-cloud-write-business-qualification-authorized-on-state.yml`

Exact authorization commit message:

`AUTHORIZED PROD CLOUD WRITE QUALIFICATION RETRY 2026-09-05`

Trigger commit:

`fc71729206b0713e37a4c9176429153d7bcb1c59`

Controlled run:

- Workflow: `TrendOS Production Cloud Write Business Qualification Authorized On State`
- Run ID: `33973557299`
- Job ID: `101326203725`
- Result: **FAILURE — AUTH EXCHANGE FAILED BEFORE BUSINESS WRITE**

## Verified step results

1. Read-only Production preflight: **SUCCESS**.
   - Edge health passed.
   - Cloud Write health passed.
   - Production Shadow health passed.
   - `cutover=false` remained required.
   - Sheets remained authoritative.
   - `pendingOutbox=0` before any potential qualification write.
   - Anonymous Cloud Write POST fail-closed check passed with the expected unauthorized behavior.

2. Employee-auth qualification secret presence: **SUCCESS**.
   - Both repository secret inputs were non-empty.

3. Canonical Production employee-session exchange: **FAILURE**.
   - The harness POSTed the configured username/token to `/v1/edge/session`.
   - The step did not receive the required successful HTTP 200/session response and exited before an Edge token was accepted.
   - The harness intentionally did not print secret values.

4. Synthetic Production order step: **SKIPPED**.

5. Post-write safety verification: **SKIPPED**.

6. Qualification success conclusion: **SKIPPED**.

7. Sensitive temporary-file cleanup: **SUCCESS**.

## Business / infrastructure mutation result

No Production business write was performed by this retry.

Therefore:

- No synthetic Production Order ID was created.
- No D1 business order mutation was performed by 02CK retry.
- No new Cloud Write event/outbox item was created by the qualification retry.
- `pendingOutbox` was verified as `0` before the failed auth exchange.
- No Worker deploy.
- No `EDGE_SESSION_SECRET` read/rotation/replacement.
- No Production cutover.
- No frontend cutover.
- No authority transfer.
- Sheets / Apps Script remain authoritative.

## Authentication-state caution

The authoritative Apps Script `authorize_` implementation is known to clear the stored employee Token when a supplied token is missing, mismatched, or expired. The failed `/v1/edge/session` exchange did call the canonical Apps Script verification path upstream.

The qualification harness did not retain/log the upstream rejection body before cleanup, so this run does **not** prove which specific upstream rejection occurred. Do not guess whether it was token mismatch/expiry, employee authorization mode, or another upstream verification failure.

Because an invalid/mismatched token can clear the employee's stored session token, treat the `Username` session token used in this failed retry as no longer safe to reuse. Perform a new normal login before any next qualification attempt.

Do not perform another blind auth probe with an invalid token.

## Cleanup

Temporary authorized qualification workflow was removed immediately after the failed safe run.

Cleanup commit:

`75704ebf93218ee799722ebee77af1bba4ec1f82`

The canonical workflow remains manual-only:

`.github/workflows/trendos-production-cloud-write-business-qualification.yml`

with confirmation:

`QUALIFY_PRODUCTION_CLOUD_WRITE_ORDER`

## Current checkpoint status

`PERF-CF-02CK`: **SAFE BLOCKED — AUTH EXCHANGE FAILED — NO BUSINESS WRITE**.

Latest fully closed checkpoint remains:

`PERF-CF-02CJ — VERIFIED PASS — CLOSED`.

## Exact safe resume point

1. Log in normally again as `Username` to generate a fresh authoritative Apps Script employee session token.
2. Replace only `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN` with that newly generated token; keep `TRENDOS_PROD_QUALIFY_USERNAME` as the intended employee username if it is still `Username`.
3. Do not test that token through an invalid-token existence probe.
4. Verify secret presence only, without printing values.
5. Retry the bounded 02CK qualification once.
6. If canonical `/v1/edge/session` still fails with a freshly generated token, stop before business write and diagnose the existing `verifyEmployeeSession` permission/response contract without rotating `EDGE_SESSION_SECRET` or bypassing authentication.

Do not enable authority transfer or frontend cutover until 02CK passes.
