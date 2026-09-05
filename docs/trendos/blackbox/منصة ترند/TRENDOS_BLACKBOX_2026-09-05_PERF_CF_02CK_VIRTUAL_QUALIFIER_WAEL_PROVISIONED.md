# TrendOS Blackbox — PERF-CF-02CK Virtual Qualifier `wael` Provisioned

Date: 2026-09-05
Scope: TrendOS main platform / Cloudflare only.

## Why this step was taken

Repeated bounded 02CK retries with employee `رحمه` failed at the canonical Production `/v1/edge/session` exchange before any business write.

Inspection of the authoritative Apps Script source in the live TrendOS workbook identified the critical authorization rule inside `verifyEmployeeSession_`:

- Explicitly allowed usernames include `ضياء`, `جابر`, `وائل`, `diaa`, `gaber`, `wael`.
- `رحمه` / `رحمة` is **not** in this allowlist.

Therefore a valid Rahma employee session cannot satisfy the current `verifyEmployeeSession_` contract even if its username/token pair is otherwise valid.

## Dedicated virtual qualification employee

At the user's explicit request, a dedicated temporary qualification identity was provisioned directly in the authoritative `المستخدمين` sheet of the active TrendOS operations workbook.

Provisioned identity:

- Username: `wael`
- Department: `طباعة`
- Role: `تشغيل`
- Active: `نعم`
- Purpose: TrendOS 02CK virtual qualification employee only.
- Password: strong temporary value provisioned in the authoritative sheet; **not recorded in GitHub or this blackbox**.
- Employee session token: strong temporary value provisioned in the authoritative sheet; **not recorded in GitHub or this blackbox**.

The token/password values were intentionally omitted from repository history and chat-visible documentation.

## Why `wael`

`wael` is explicitly present in the current `verifyEmployeeSession_` allowlist and is distinct from the existing Arabic employee username `وائل` because `findUser_` uses normalized exact username equality.

The `طباعة` department maps through `roleFromArabic_` to the limited `print` role rather than admin/full access.

This avoids modifying Apps Script authorization code, avoids rotating `EDGE_SESSION_SECRET`, and avoids reusing a real employee's identity for the qualification.

## Workbook mutation

Authoritative workbook:

`TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY`

Target sheet:

`المستخدمين`

A new row was added for the temporary `wael` qualification identity. Existing employee rows and business data were not altered by this provisioning step.

## Safety boundary

- No Production D1 business order created by this provisioning step.
- No Cloud Write event/outbox created.
- No Worker deploy.
- No `EDGE_SESSION_SECRET` read/rotation/replacement.
- No Production cutover.
- No frontend cutover.
- Sheets / Apps Script remain authoritative.

## Required handoff before the next 02CK retry

The GitHub Actions qualification secrets cannot be updated through the connected GitHub API available in this conversation.

The operator must therefore update only these repository secrets from the newly provisioned virtual identity:

- `TRENDOS_PROD_QUALIFY_USERNAME` = `wael`
- `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN` = the temporary Token stored in the `wael` row in the authoritative `المستخدمين` sheet.

Do **not** paste the token into chat or repository files.

After the two secrets are aligned with `wael`, recheck secret presence/username match without printing the token, then run the bounded 02CK qualification once.

If 02CK passes, immediately clear the virtual employee Token and disable or remove the temporary `wael` identity.

If auth still fails, stop before business write and diagnose the Worker-to-Apps-Script session contract; do not create further employee identities or bypass `verifyEmployeeSession_`.
