# TrendOS Phase 0 — Authentication Path Inventory

> Scope: read-only inventory of the current employee authentication path plus security review of prepared Fast Auth V2.4. No Apps Script save/deploy/login/logout/token mutation was executed during this inventory.

## Status

- `INV-09G — authorize_() baseline`: **PASS — SOURCE**
- `INV-09H — findUser_() authoritative lookup`: **PASS — SOURCE**
- `INV-09I — session expiry policy`: **PASS — SOURCE**
- `INV-09J — ensureUsersSetup_() hot-path work`: **PASS — SOURCE**
- current login/logout/password token invalidation: **PASS — SOURCE MAPPED**
- employee Active/deactivation write entry point in supplied monolith: **NO DEDICATED CODE PATH FOUND; sheet value is authoritative on each current lookup**
- `D1-05 — Fast Auth V2.4 invalidation/security contract`: **FAIL — PREPARED SOURCE; DO NOT DEPLOY THIS V2.4 BUILD**

Important: this V2.4 failure is for the **prepared/not-deployed file**. Current Version 143 Orders path still uses legacy `authorize_()` before V2.3 page cache.

## 1. Current `authorize_(username, token)`

```text
normalize username
 -> findUser_(...)
 -> reject missing user
 -> reject populated Active unless exactly نعم
 -> require token
 -> constant-time compare supplied token vs stored token
 -> reject expired session
      -> failure path clears stored Token when Token column exists
 -> success {ok:true,user}
```

Facts:
- no auth cache exists inside `authorize_()`.
- blank/falsy Active is not rejected by the exact current condition.
- a bad/missing/expired token can mutate auth state by clearing the stored token cell.

## 2. `findUser_(username)` — authoritative lookup

Current sequence:

```text
ensureUsersSetup_()
 -> get Users sheet
 -> full sheet.getDataRange().getValues()
 -> headersMap_(sheet)
 -> resolve username/department/role/active/password/mustChange/token/lastLogin columns
 -> sequential normalized username scan
 -> first match or null
```

There is no cache, index, targeted row lookup or D1 user lookup in the supplied function.

Every current auth attempt therefore performs synchronous Google Sheets I/O before a cached D1 Orders page can return.

The returned user object includes primitive fields such as:
- `username`
- `department`
- `role`
- `active`
- `password`
- `mustChange`
- `token`
- `lastLogin`
- column numbers

This matters directly to the prepared V2.4 security review below.

## 3. `ensureUsersSetup_()` and header helper

`ensureUsersSetup_()` runs on every `findUser_()` call:

```javascript
const sheet = ss_().getSheetByName(SHEET_NAME_USERS);
if (!sheet) throw new Error('شيت المستخدمين غير موجود.');
ensureHeaderIfAnyMissing_(sheet, ['Token', 'آخر دخول']);
```

`ensureHeaderIfAnyMissing_()`:
1. reads the header map.
2. computes missing requested headers.
3. returns without write when none are missing.
4. appends missing headers in one write when needed.

So normal auth contains schema checking on every request and can perform a schema write during authentication if Token/Last Login headers are missing.

Current Users sheet inspection confirms those headers exist now.

## 4. Header-map behavior

`headersMap_(sheet)` maps normalized header name -> column number and the later duplicate header wins.

This is relevant to wider TrendOS schema integrity because duplicate headers exist in other live sheets. Core Users auth headers were not found duplicated in the inspected baseline.

## 5. Session TTL policy

`sessionTtlMsV1922_()`:
- default **12 hours**.
- Script Property `SESSION_TTL_HOURS` override.
- clamp **1–72 hours**.

`sessionExpiredV1922_(issuedAt)` expires unparsable timestamps and timestamps older than the configured TTL.

## 6. Login / logout / password invalidation

### Login
`login_()` uses authoritative `findUser_()`, validates credentials, creates a fresh token, writes Token + Last Login, and flushes.

### Logout
`logoutEmployee_()` only clears stored Token when supplied token matches the stored token and then flushes.

### Password change
`changePassword_()` authenticates, validates old/new password, writes the new password representation, clears Token, clears must-change when present, and forces relogin.

Current legacy path therefore sees token/password invalidation authoritatively on the next request.

## 7. Employee deactivation / Active state

No dedicated Users `createUser/saveUser/updateUser` Active mutation route was found in the supplied monolith. The Users-sheet Active value is authoritative on every current legacy auth lookup.

This remains a source-search conclusion; full Version 143 project composition is tracked separately under `INV-10`.

## 8. Current performance conclusion

Current Version 143 Orders read executes legacy auth before V2.3 stable-page lookup:

```text
authorize_
 -> findUser_
    -> Users sheet lookup
    -> header schema check
    -> Users sheet lookup again
    -> full Users used-range read
    -> header read
    -> sequential username scan
 -> token/session checks
 -> only then D1 V2.3 stable page cache
```

This strongly explains why auth dominated historical runtime while the stable page cache itself was fast. Do not attribute all latency to one individual Spreadsheet call without isolated timing.

# Prepared Fast Auth V2.4 review

## 9. Intended design

Prepared `D1_Orders_Fast_V2_4.gs` defines:
- Orders-read-only fast auth.
- Script Cache TTL = **120 seconds**.
- cache key = SHA-256-based digest of normalized `username + '|' + token`, truncated to 40 chars.
- cache miss -> authoritative legacy `authorize_()`.
- cached hit still checks cached `active` and `sessionExpiredV1922_(cachedUser.lastLogin)`.

The route then uses `authorizeD1FastV24_()` before the existing V2.3 stable page cache.

## 10. Security failure: prepared V2.4 can cache raw password and token

The file comments claim it “never stores the raw token in CacheService”, but the implementation does not enforce that claim.

`d1FastAuthSanitizeUserV24_(user)` iterates **every key** in the authoritative user object and copies every primitive string/number/boolean into `cleanUser`.

Current `findUser_()` returns both:
- `password`
- `token`

as strings.

`d1FastAuthRememberV24_()` then stores:

```javascript
JSON.stringify({
  user: cleanUser,
  cachedAt: ...
})
```

in Script Cache.

Therefore the prepared build can place the raw stored password representation and raw session token inside the cache payload, even though the cache **key** is hashed.

This is unnecessary secret propagation and contradicts the stated design intent.

### Required fix

Do not “sanitize by copying primitives”. Use a strict allowlist containing only fields actually required by Orders authorization/rendering, for example identity/role/department/active/session-issued-at fields, with **no password and no token** in cached user payload.

Exact allowlist must be verified against `trendosAllowedScreensForUserV1932_()` and downstream Orders code before implementation.

## 11. Invalidation failure: forget helper exists but is not wired

Prepared V2.4 defines `d1FastAuthForgetV24_(username, token)`, but source search finds no caller of that helper inside the V2.4 file.

No V2.4 hooks were found for:
- logout.
- password change.
- employee Active/deactivation change.
- token rotation at login.

Because the key contains the token, normal login token rotation naturally creates a new key for future requests, but an **old cached token can remain authorized for up to 120 seconds** unless explicitly forgotten or the cached session expires.

Changing Active or password also does not refresh cached user data during that TTL.

Therefore the prepared cache introduces a bounded but real stale-authorization window.

## 12. Cached Active semantics

On a cache hit V2.4 accepts:

```text
!user.active OR normalize_(user.active) === 'نعم'
```

which mirrors the legacy permissive blank-Active behavior rather than tightening it.

This is compatibility-preserving but should be an explicit policy decision, not an accidental cache behavior.

## 13. V2.4 decision

**DO NOT DEPLOY the current prepared `D1_Orders_Fast_V2_4.gs`.**

Reasons:
1. cache payload can include raw password/token fields.
2. explicit invalidation helper is not wired to logout/password/deactivation/token lifecycle.
3. stale authorization can survive up to 120 seconds.
4. runtime first-hit/cache-hit regression has never been executed on this build.
5. production correctness blockers in other Core modules take priority over performance optimization.

`D1-03` and `D1-04` remain **NOT RUN / NOT DEPLOYED**.

`D1-05` is now **FAIL — PREPARED SOURCE CONTRACT**, not merely unknown.

## 14. Safer future Fast Auth contract

Before any Fast Auth deployment:
- cache key may remain digest-based.
- cache payload must use a strict non-secret allowlist.
- password/token must never be cached in the user payload.
- logout/password/deactivation/token-reset must invalidate relevant cache state immediately, or use a user auth-version/revision in the key that changes authoritatively.
- session expiry must remain enforced on every hit.
- first-hit and cache-hit tests must prove identical authorization decisions.
- disabled user / changed password / logout regression must be executed inside the TTL window.

## Phase 0 auth conclusion

The current legacy auth inventory is complete. The prepared Fast Auth V2.4 source review is also complete enough to make a decision: **keep it undeployed and redesign before testing/deployment**.

No production change is approved by this document.
