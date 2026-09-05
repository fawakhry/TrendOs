# TrendOS Blackbox — PERF-CF-02CK Rahma Valid Session / Allowlist Block

Date: 2026-09-05
Scope: TrendOS main platform / Cloudflare only.

## Starting point

- Latest fully closed checkpoint: `PERF-CF-02CJ — Production Ledger Reconciliation` — **VERIFIED PASS — CLOSED**.
- Active checkpoint: `PERF-CF-02CK — Production Cloud Write Business Qualification`.
- Previous Rahma retries reached canonical `/v1/edge/session` and failed before any business-write step.
- Production cutover remains OFF.
- Sheets / Apps Script remain authoritative.
- No Production business write is authorized by this diagnostic step.

## User-supplied login account

The user supplied employee account `رحمه` and asked to try the account.

No plaintext password is recorded in this blackbox and no employee token is recorded in GitHub.

## Authoritative employee-row verification

The authoritative TrendOS workbook `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`, sheet `المستخدمين`, currently shows employee `رحمه` as:

- Department: `خدمة عملاء`
- Role: `تشغيل`
- Active: `نعم`
- Must-change-password: `لا`
- Recent last-login value present for 2026-09-05
- Current employee session token: **present / non-empty**

The actual token value is intentionally not copied into this record.

This confirms the employee account itself exists, is active, and has a recently generated authoritative Apps Script session. Therefore the repeated 02CK failure is not explained by a missing employee row or an inactive account.

## Deterministic authorization blocker

Current authoritative `verifyEmployeeSession_` code contains this explicit allowlist:

- `ضياء`
- `جابر`
- `وائل`
- `diaa`
- `gaber`
- `wael`

`رحمه`, `رحمة`, and `rahma` are not included.

Therefore a valid Rahma employee session still cannot satisfy the current canonical Edge employee-verification contract. The Apps Script route returns an authorization rejection before the Worker can issue an Edge session token.

This explains the repeated `/v1/edge/session` failures with Rahma credentials.

## Safety result

This diagnostic step did not create or mutate business data:

- Production D1 business write: **NONE**
- Synthetic Production Order ID: **NONE**
- Cloud Write event/outbox: **NONE**
- Sheets business-data write: **NONE**
- Worker deploy: **NONE**
- Worker secret rotation/replacement: **NONE**
- Production cutover: **NONE**
- Frontend cutover: **NONE**
- Authority transfer: **NONE**

The existing temporary virtual qualification employee `wael` remains provisioned for 02CK because `wael` is already explicitly allowed by the current `verifyEmployeeSession_` contract and has limited `طباعة` / `تشغيل` scope.

## Current 02CK status

`PERF-CF-02CK`: **SAFE BLOCKED — RAHMA SESSION VALID/PRESENT BUT DETERMINISTICALLY BLOCKED BY VERIFY-EMPLOYEE ALLOWLIST — NO BUSINESS WRITE**.

Latest fully closed checkpoint remains `PERF-CF-02CJ`.

## Exact safe resume point

1. Do not re-run 02CK with `رحمه` while the current allowlist is unchanged; the result is deterministic.
2. Do not add Rahma to the allowlist merely to make qualification pass unless a deliberate production authorization-policy change is separately approved and evaluated.
3. Least-invasive prepared path: use the dedicated temporary `wael` qualification identity already created in `المستخدمين`.
4. Operator must align GitHub Actions secrets to `wael` and the temporary token stored only in the authoritative user row; do not paste the token into chat or repository files.
5. Recheck only secret presence/exact username match, then run bounded 02CK once through canonical `/v1/edge/session`.
6. If PASS: verify one synthetic D1 order maximum, idempotent replay, exactly one pending outbox item, Shadow mutation-free, `cutover=false`, Sheets authoritative.
7. Immediately after PASS, clear the virtual employee token and disable/remove the temporary `wael` account.
8. Do not rotate `EDGE_SESSION_SECRET` and do not transfer authority before 02CK PASS.
