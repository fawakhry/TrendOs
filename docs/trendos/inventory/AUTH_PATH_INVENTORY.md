# TrendOS Phase 0 — Authentication Path Inventory

> Scope: read-only inventory of the current employee authentication path from the supplied current `Code.gs` source plus direct read-only Google Sheets inspection. No Apps Script save/deploy/login/logout/token mutation was executed during this inventory.

## Status

- `INV-09G — authorize_() baseline`: **PASS — SOURCE**
- `INV-09H — findUser_() authoritative lookup`: **PASS — SOURCE**
- `INV-09I — session expiry policy`: **PASS — SOURCE**
- `INV-09J — ensureUsersSetup_() hot-path work`: **PASS — SOURCE**
- current login/logout/password token invalidation: **PASS — SOURCE MAPPED**
- employee Active/deactivation write entry point in supplied monolith: **NO DEDICATED CODE PATH FOUND; sheet value is authoritative on each current lookup**
- `D1-05 — Fast Auth V2.4 invalidation`: **PENDING — V2.4 NOT DEPLOYED**

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

## 3. `ensureUsersSetup_()` and header helper

`ensureUsersSetup_()` runs on every `findUser_()` call:

```javascript
const sheet = ss_().getSheetByName(SHEET_NAME_USERS);
if (!sheet) throw new Error('شيت المستخدمين غير موجود.');
ensureHeaderIfAnyMissing_(sheet, ['Token', 'آخر دخول']);
```

`ensureHeaderIfAnyMissing_()` is now mapped:

1. calls `headersMap_(sheet)` once.
2. builds a list of missing requested headers.
3. if none are missing, returns without write.
4. if headers are missing, calls `sheet.getLastColumn()` and appends all missing headers in one `setValues()` write.

Therefore the normal auth hot path includes schema checking on every request and **can perform a schema write during authentication** if `Token` or `آخر دخول` is missing.

Current Users sheet inspection confirms those headers exist now, so this helper should normally be read/check-only at present; the write capability remains part of the runtime contract.

## 4. Header-map behavior

`headersMap_(sheet)` reads row 1 through the current last column and maps normalized header name -> column number.

When the same normalized header appears more than once, the later column overwrites the earlier mapping.

This is relevant to wider TrendOS schema integrity because direct inspection found duplicate header names in `بنود الأوردرات`. It is not currently a duplicate-header problem in the core Users auth columns, but the helper behavior must be considered in schema cleanup.

## 5. Session TTL policy

`sessionTtlMsV1922_()`:

- default: **12 hours**.
- configurable from Script Property `SESSION_TTL_HOURS`.
- lower bound: **1 hour**.
- upper bound: **72 hours**.

`sessionExpiredV1922_(issuedAt)` parses the stored issued time and returns expired when:

- the value cannot be parsed, or
- `Date.now() - issuedAt > sessionTtlMsV1922_()`.

So `INV-09I = PASS — SOURCE`.

## 6. Login / logout / password invalidation

### Login

`login_()`:
- rate-limits failed employee login attempts.
- calls authoritative `findUser_()`.
- rejects inactive user or bad password.
- upgrades legacy password hash when needed.
- generates a fresh token.
- writes Token + Last Login.
- flushes Spreadsheet writes.

### Logout

`logoutEmployee_()`:
- calls `findUser_()`.
- only clears stored Token when the supplied token constant-time matches the stored token.
- flushes Spreadsheet writes.

### Password change

`changePassword_()`:
- first authenticates with current token.
- validates old/new password.
- writes new password hash.
- clears stored Token.
- clears must-change-password flag when present.
- returns `forceRelogin:true`.

Therefore token rotation/logout/password-change semantics are now mapped.

## 7. Employee deactivation / Active state

Source search of the supplied monolithic `Code.gs` found the employee Users sheet auth read path but no dedicated `createUser`, `saveUser`, `updateUser`, or explicit Users Active mutation backend entry point.

Current behavior therefore treats the Users sheet Active value as authoritative at lookup time. With the legacy uncached auth path, a manual/admin sheet change to Active is observed on the next authoritative `findUser_()` request.

This is a source-search conclusion for the supplied monolith, not proof that no external Apps Script file/tool can ever mutate Users. Full Version 143 project composition remains separately partial under `INV-10`.

## 8. Performance conclusion

Current Version 143 Orders read runs legacy auth before the V2.3 stable page cache. The auth hot path contains:

```text
authorize_
 -> findUser_
    -> Users sheet lookup
    -> header schema check
       -> header row read
       -> possible schema write if missing
    -> Users sheet lookup again
    -> full Users used-range read
    -> header row read again
    -> sequential username scan
 -> token/session checks
```

This is strong source evidence for the legacy auth bottleneck and matches historical runtime where auth dominated the request while the D1 stable cache itself was fast.

Do not claim one individual Sheets call alone accounts for the full historical latency without isolated timing.

## 9. Fast Auth V2.4 safety requirement

V2.4 is still **PREPARED / NOT DEPLOYED / NOT VERIFIED**.

Any auth cache must preserve or explicitly define behavior for:
- Active/deactivation changes.
- token rotation at login.
- logout token clearing.
- password-change token clearing.
- session TTL expiry.
- failed-auth token clearing behavior (or an intentionally safer replacement).

A 120-second cache means stale authorization may otherwise survive for up to its TTL unless an invalidation hook or stronger cache key/version contract exists.

Therefore `D1-05` remains PENDING until the V2.4 implementation/invalidation contract is inspected and tested before deployment.

## Phase 0 auth conclusion

The **current auth baseline inventory is complete enough to leave source discovery**:
- authoritative source = Users sheet.
- current path = uncached full-range lookup.
- session TTL = mapped.
- setup/schema side effects = mapped.
- login/logout/password token invalidation = mapped.
- current Active check = mapped.

No production change is approved by this document.

## Next lane

Proceed to `INV-03`: map invoice Ready Sweep / draft generation / finalize entry points and idempotency risks before any implementation change.
