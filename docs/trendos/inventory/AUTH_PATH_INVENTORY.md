# TrendOS Phase 0 — Authentication Path Inventory

> Scope: read-only source inventory of the current Apps Script authentication path supplied from the active project/source context. No Apps Script edit, save, deploy, login, logout, or token mutation was intentionally executed during this inventory.

## Status

- `INV-09G — map current authorize_() baseline`: **PASS — SOURCE**
- `INV-09H — map findUser_() authoritative lookup`: **PASS — SOURCE**
- `INV-09I — map sessionExpiredV1922_() policy`: **PENDING**
- `D1-05 — Fast Auth invalidation`: **PENDING**

## 1. Current `authorize_(username, token)` sequence

```text
normalize username
 -> findUser_(...)
 -> user exists?
 -> user active?
 -> token present + constant-time token match + session not expired?
      -> NO: clear stored token cell if available, reject session
      -> YES: return { ok:true, user }
```

### Active-user check

The current check is:

`if (user.active && user.active !== 'نعم') ...`

Meaning:
- a populated active state different from `نعم` is rejected.
- a blank/falsy active value is not rejected by this specific condition.

### Token/session validation

Authorization rejects when any of the following is true:
- token missing.
- `constantTimeEqualsV1922_(user.token, normalize_(token))` fails.
- `sessionExpiredV1922_(user.lastLogin)` is true.

On token/session failure, if `user.colToken` exists, the function calls:

`safeSet_(user.sheet, user.rowNumber, user.colToken, '')`

So failed/expired auth is not purely read-only; it may clear the stored token in the Users sheet.

`authorize_()` itself contains no authentication cache.

---

## 2. `findUser_(username)` — authoritative lookup now mapped

The current function performs:

```text
ensureUsersSetup_()
 -> ss_().getSheetByName(SHEET_NAME_USERS)
 -> sheet.getDataRange().getValues()
 -> headersMap_(sheet)
 -> resolve username/department/role/active/password/mustChange/token/lastLogin columns
 -> normalize requested username
 -> sequential loop from data row 2 to end
 -> normalize each row username and compare
 -> return user object on first match
 -> null if no match
```

### Spreadsheet I/O

Every call executes:

`sheet.getDataRange().getValues()`

This reads the full used range of the Users sheet into Apps Script memory before matching one username.

There is no cache, index, binary search, TextFinder, targeted row read, Properties lookup, or D1 lookup inside the supplied `findUser_()` function.

The match is a sequential JavaScript loop over all loaded rows.

### Column resolution

The function resolves columns on each call using `headersMap_(sheet)` plus `firstCol_()` for:
- username
- department
- role
- active
- password
- must-change-password
- token
- last-login

It throws if Username or Password columns cannot be resolved.

### Returned authentication object

On a match it returns:
- `sheet`
- `rowNumber`
- normalized `username`
- `department`
- `role`
- `active`
- `password`
- `mustChange`
- `token`
- `lastLogin`
- `colPassword`
- `colToken`
- `colLastLogin`

Fallback behavior in the returned object:
- if Active column does not exist: `active = 'نعم'`.
- if password cell is blank: uses `employeeDefaultPassword_()`.

---

## 3. Performance conclusion

Version 143 Orders Fast V2 calls legacy `authorize_()` **before** the V2.3 stable-page cache.

`authorize_()` calls `findUser_()`.

`findUser_()` performs a full Users-sheet `getDataRange().getValues()` read on every auth attempt.

Therefore the current production auth critical path definitely contains synchronous Google Sheets I/O before a cached D1 Orders page can be returned.

This is strong source evidence explaining why authentication can dominate a fast D1 page-cache request.

However, do **not** state that `getDataRange().getValues()` alone has been proven to account for the entire historical ~7.45s auth duration. `ensureUsersSetup_()`, `headersMap_()`, spreadsheet open/access cost, cold-start behavior, and session helpers have not all been timed independently in this Phase 0 pass.

### Historical correlation

Earlier runtime evidence showed approximately:
- total request ~7.503s
- auth ~7.453s
- stable-page cache lookup ~20ms

The newly inspected source is consistent with that observation because the slow authoritative sheet lookup occurs before the fast cache.

---

## 4. Security / correctness observations

1. **Failed auth can mutate state:** bad/missing/expired token may clear the stored token cell.
2. **Blank Active semantics:** blank/falsy active status passes the current `authorize_()` active check.
3. **Full-sheet auth lookup:** every request reads all used Users rows/columns, including password/token fields.
4. **Password fallback:** blank stored password resolves to `employeeDefaultPassword_()`.
5. **No auth cache/index:** current baseline has no fast authoritative lookup mechanism.
6. **Session TTL remains unknown:** exact expiry policy is still inside `sessionExpiredV1922_()`.
7. **Setup helper remains important:** `ensureUsersSetup_()` runs before every Users lookup; its cost and possible writes must be inspected before designing V2.4.

---

## 5. Fast Auth V2.4 delta — now clearer

Any safe Fast Auth implementation must reduce repeated authoritative Users-sheet reads without weakening:
- user active/deactivation checks.
- token equality semantics.
- session expiry.
- logout/token rotation.
- password/token changes.

A 120-second cache cannot be approved solely for speed until invalidation is mapped for these state changes.

Do not install V2.4 yet.

---

## 6. Test status

- `INV-09G — authorize_()`: **PASS — SOURCE**.
- `INV-09H — findUser_()`: **PASS — SOURCE**.
- `INV-09I — sessionExpiredV1922_()`: **PENDING**.
- `INV-09J — ensureUsersSetup_() auth-path setup cost/side effects`: **PENDING**.
- `D1-05 — Fast Auth invalidation`: **PENDING**.

## Next exact action

Read-only inspect the complete current function:

`function ensureUsersSetup_(...)`

Need declaration through final closing brace.

Goal:
- determine whether it only checks schema or performs writes/migrations.
- count additional Spreadsheet service calls on every auth request.
- determine whether it is a meaningful contributor to auth latency.
- identify whether setup work should be separated from the hot authentication path before evaluating V2.4.

Do not edit, save or deploy Apps Script during this step.
