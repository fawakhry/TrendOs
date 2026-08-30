# TrendOS Phase 0 — Authentication Path Inventory

> Scope: read-only source inventory of the current Apps Script authentication path supplied from the active project/source context. No Apps Script edit, save, deploy, login, logout, or token mutation was intentionally executed during this inventory.

## Status

- `INV-09G — map current authorize_() baseline`: **PASS — SOURCE**
- `INV-09H — map findUser_() authoritative lookup`: **PASS — SOURCE**
- `INV-09I — map sessionExpiredV1922_() policy`: **PENDING**
- `INV-09J — map ensureUsersSetup_() hot-path work`: **PARTIAL — WRAPPER MAPPED; HEADER HELPER PENDING**
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

Important facts:
- `authorize_()` itself contains no authentication cache.
- populated Active state different from `نعم` is rejected; blank/falsy Active is not rejected by this exact condition.
- missing/bad/expired token path may clear the stored token cell using `safeSet_()`.

## 2. `findUser_(username)` — authoritative lookup

Current flow:

```text
ensureUsersSetup_()
 -> ss_().getSheetByName(SHEET_NAME_USERS)
 -> sheet.getDataRange().getValues()
 -> headersMap_(sheet)
 -> resolve user/auth columns
 -> sequential normalized username scan
 -> return first match or null
```

Every auth attempt therefore performs synchronous Google Sheets I/O before a cached D1 Orders page can return.

There is no cache/index/targeted user lookup inside the supplied `findUser_()`.

Returned data includes username, department, role, Active, password, mustChange, token, lastLogin and relevant column/row metadata.

## 3. `ensureUsersSetup_()` — wrapper now mapped

Current source:

```javascript
function ensureUsersSetup_() {
  const sheet = ss_().getSheetByName(SHEET_NAME_USERS);
  if (!sheet) throw new Error('شيت المستخدمين غير موجود.');
  ensureHeaderIfAnyMissing_(sheet, ['Token', 'آخر دخول']);
}
```

Therefore every `findUser_()` / auth attempt performs at least:

1. one `ss_().getSheetByName(SHEET_NAME_USERS)` inside `ensureUsersSetup_()`.
2. one call to `ensureHeaderIfAnyMissing_(sheet, ['Token','آخر دخول'])`.
3. then another `ss_().getSheetByName(SHEET_NAME_USERS)` inside `findUser_()`.
4. then `sheet.getDataRange().getValues()`.
5. then `headersMap_(sheet)` and sequential username matching.

### What is proven

- `ensureUsersSetup_()` is on the hot auth path for every current lookup.
- the wrapper itself does not contain a cache.
- it checks existence of the Users sheet.
- it delegates schema enforcement/checking for `Token` and `آخر دخول` to `ensureHeaderIfAnyMissing_()`.
- there are two visible `getSheetByName()` calls in the current `findUser_()` path: one in setup and one immediately afterward in `findUser_()`.

### What is not yet proven

The exact cost and side effects of `ensureHeaderIfAnyMissing_()` remain unknown.

Until that helper is inspected, do not claim `ensureUsersSetup_()` is read-only. Depending on the helper implementation, it may:
- only inspect headers,
- scan header cells,
- append missing headers,
- or perform other schema writes.

Therefore `INV-09J` remains PARTIAL rather than PASS.

## 4. Performance conclusion

Version 143 Orders Fast V2 calls legacy `authorize_()` before the V2.3 stable-page cache.

The current auth hot path now includes:

```text
authorize_
 -> findUser_
    -> ensureUsersSetup_
       -> get Users sheet
       -> ensureHeaderIfAnyMissing_
    -> get Users sheet again
    -> full getDataRange().getValues()
    -> headersMap_
    -> sequential username scan
 -> active/token/session validation
```

This is strong source evidence that repeated Spreadsheet service calls sit ahead of the fast D1 cache.

Do not attribute the entire historical ~7.45s auth duration to one call yet. The remaining setup-header helper, spreadsheet open/cold-start effects, `headersMap_()`, and session helpers have not been independently timed.

## 5. Security / correctness observations

1. bad/missing/expired token may clear the stored token.
2. blank/falsy Active status passes the current active check.
3. blank password can fall back to `employeeDefaultPassword_()`.
4. full Users used range is read for each authoritative lookup.
5. no current auth cache/index exists in `authorize_()` or `findUser_()`.
6. setup/schema checking is executed on every lookup.
7. exact session TTL remains pending.
8. Fast Auth V2.4 invalidation must preserve token/logout/deactivation/session-expiry semantics.

## 6. Fast Auth V2.4 implication

A safe performance fix should avoid repeated schema/setup/full-sheet work on every request, but must not weaken authoritative checks.

Do not install V2.4 until these are mapped:
- `ensureHeaderIfAnyMissing_()` behavior.
- `sessionExpiredV1922_()` policy.
- login/logout/token update/deactivation entry points.
- cache invalidation contract.

## Next exact action

Read-only inspect the complete current function:

`function ensureHeaderIfAnyMissing_(...)`

Need declaration through final closing brace.

Goal:
- determine whether the auth hot path performs a schema write or only a read/check,
- determine header-read cost,
- identify whether setup/migration work should be removed from normal authentication later.

Do not edit, save or deploy Apps Script during this step.
