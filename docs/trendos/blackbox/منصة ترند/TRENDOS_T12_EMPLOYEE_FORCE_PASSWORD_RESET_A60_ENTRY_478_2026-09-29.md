# TrendOS T12 — Employee Force Password Reset A60 — Entry 478
Date: 2026-09-29 Cairo

## Owner instruction
Reset all current employee accounts to one temporary owner-provided password and require a password change on first login.

## Live Users sheet mutation
Target:
- Spreadsheet: TrendOS production workbook
- Sheet: `المستخدمين`

Rows with a non-empty username were updated.
Result:
```ini
EMPLOYEE_ACCOUNTS_UPDATED=8
TEMP_PASSWORD_RESET=YES
MUST_CHANGE_FIRST_LOGIN=YES
EXISTING_EMPLOYEE_TOKENS_CLEARED=YES
```

The temporary credential value is intentionally not recorded in repository documentation.

Current usernames affected:
- ضياء
- وائل
- رحمه
- ريفان
- شريف
- جابر
- wael
- Rahma

Readback after mutation verified:
```ini
ALL_PASSWORDS_RESET=YES
ALL_MUST_CHANGE_FLAGS=YES
ALL_OLD_TOKENS_REVOKED=YES
```

## Frontend enforcement
Previously the UI opened the password-change modal when `mustChange=true`, but the Cancel button still allowed bypass.

A60 changes:
- hide and disable Cancel while `state.user.mustChange` is true;
- `closePasswordModal()` refuses to close during a mandatory password change;
- show a message that the temporary password must be changed before continuing;
- cache-bust `app.js`.

The existing password-change backend already:
- validates the old password;
- requires the new password to be at least 6 characters;
- writes the new password hash;
- sets the must-change field to `لا`;
- clears the employee token;
- forces re-login.

Qualification:
- CI run `36576533460` — SUCCESS.

Promotion:
- PR #24 merged.
- Main functional SHA: `6e96f9b9c9a870c9c1f961dc3e2f5f72d9ca11d7`
- Follow-up logging hygiene SHA: `e5efcb39acf33a70ce13f16125e307a51994bb65`

Cloudflare frontend redeployment:
- run `36576677571` — SUCCESS.

## Current result
```ini
EMPLOYEE_TEMP_RESET=LIVE
FIRST_LOGIN_PASSWORD_CHANGE=MANDATORY
CANCEL_MANDATORY_CHANGE=BLOCKED
OLD_EMPLOYEE_SESSIONS=REVOKED
CLOUDFLARE_FRONTEND_UPDATED=YES
```

This does not complete native D1 employee authentication. Employee authentication authority remains on the current login backend until the later zero-Google auth cutover.
