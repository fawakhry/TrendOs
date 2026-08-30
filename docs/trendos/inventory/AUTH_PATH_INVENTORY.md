# TrendOS Phase 0 — Authentication Path Inventory

> Scope: read-only source inventory of the current Apps Script `authorize_()` path supplied from the active project/source context. No Apps Script edit, save, deploy, login, logout, or token mutation was intentionally executed during this inventory.

## Status

`INV-09G — map current authorize_() baseline`: **PASS — FUNCTION BODY MAPPED**.

Full user lookup / session-expiry helper internals remain pending.

## Current `authorize_(username, token)` sequence

```text
normalize username
 -> findUser_(...)
 -> user exists?
 -> user active?
 -> token present + constant-time token match + session not expired?
      -> NO: clear stored token cell if available, reject session
      -> YES: return { ok:true, user }
```

## 1. User lookup

The function begins with:

`findUser_(normalize_(username))`

If no user is returned:

`{ ok:false, message:'المستخدم غير موجود.' }`

Important performance boundary:
- `authorize_()` itself contains no cache lookup.
- actual user lookup cost depends on `findUser_()` and is not yet mapped from current Version 143 source.
- because Version 143 Orders Fast V2 calls `authorize_()` before the V2.3 stable-page cache, any expensive `findUser_()` work sits on every page request before the fast cache can return.

## 2. Active-user check

The current check is:

`if (user.active && user.active !== 'نعم') ...`

Meaning:
- if `user.active` is populated and is not exactly `نعم`, authorization is rejected.
- if the field is empty/falsy, this specific condition does not reject the user.

This is a source fact, not a statement that blank active status is operationally intended. Data rules for the Users sheet should be inventoried separately before changing this behavior.

## 3. Token and session validation

Authorization rejects the session if any of the following is true:

- token is missing.
- `constantTimeEqualsV1922_(user.token, normalize_(token))` is false.
- `sessionExpiredV1922_(user.lastLogin)` is true.

Positive authorization therefore requires all three:

1. token supplied.
2. token constant-time matches the stored user token.
3. session age is still valid according to `sessionExpiredV1922_()`.

## 4. Invalid / expired session side effect

On token/session failure, the function performs:

`safeSet_(user.sheet, user.rowNumber, user.colToken, '')`

when `user.colToken` exists.

Then it returns:

`{ ok:false, message:'انتهت الجلسة. سجل الدخول مرة أخرى.' }`

Important consequence:
- the current `authorize_()` path is not strictly read-only on failed authentication.
- a bad/missing/expired token can clear the stored token in the Users sheet.
- therefore retries or stale-token requests can have an authentication-state write side effect.
- locking/idempotency behavior of this token-clear path is not yet mapped because `safeSet_()` / surrounding auth mutation contract has not been inventoried in this pass.

## 5. Successful authorization

On success:

`{ ok:true, user:user }`

No cache is populated by `authorize_()` itself in the supplied function.

## 6. Fast Auth V2.4 delta — what is now certain

Current Version 143 Orders read path calls legacy `authorize_()` before the V2.3 stable-page cache.

The supplied `authorize_()` contains no authentication cache. Therefore:

- Fast Auth V2.4 is definitely not implemented inside this baseline function.
- any V2.4 acceleration must replace/wrap the `findUser_()` + token/session validation path or introduce a verified cache before the expensive authoritative lookup.
- invalidation must preserve current security semantics for user deactivation, token changes, session expiry, and logout/token clearing.

Do not install V2.4 until these invalidation semantics are mapped and tested.

## 7. Current risks / questions to reconcile

1. **Primary latency candidate:** `findUser_()` may scan/read the Users sheet per request; exact implementation pending.
2. **Auth mutation on failure:** invalid/expired token path clears the stored token cell.
3. **Blank active state behavior:** blank/falsy `user.active` is not rejected by this condition.
4. **Session policy unknown here:** exact TTL/timezone logic is inside `sessionExpiredV1922_()` and remains pending.
5. **Token-clear concurrency:** locking/atomicity of `safeSet_()` on failed auth remains pending.
6. **Cache invalidation requirements:** any future auth cache must invalidate on at least token change/logout, user deactivation, and session expiry; exact write entry points remain to be mapped.

## Test status

- `INV-09G — current authorize_() function`: **PASS — SOURCE**.
- `INV-09H — findUser_() authoritative lookup cost/source`: **PENDING**.
- `INV-09I — sessionExpiredV1922_() policy`: **PENDING**.
- `D1-05 — Fast Auth invalidation`: **PENDING**.

## Next exact action

Read-only inspect the complete current function:

`function findUser_(...)`

Need declaration through final closing brace.

Goal:
- identify the Users sheet read pattern,
- determine whether it calls `getDataRange()` / full-sheet scans,
- identify any existing cache/index,
- identify normalized username matching,
- identify returned token/active/lastLogin metadata,
- establish the actual latency source before evaluating V2.4.

Do not edit, save or deploy Apps Script during this step.
