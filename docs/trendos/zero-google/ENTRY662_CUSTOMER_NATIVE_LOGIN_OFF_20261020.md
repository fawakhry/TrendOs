# Entry662 — Customer Login Native PBKDF2 + D1 session issue (SOURCE ONLY / OFF)

**Owner priority:** Stop Google dependencies without rebuilding live TrendOS employee/order cloud systems or other agents' EasyStore/Printshop/Matbagy functions. A real source login-to-session issue is now prepared as a child of Entry660 #213 and Entry661 #214. **Do not apply to production**.

## Code prepared
- `cloudflare-d1/src/customer-portal-native-login-v0.mjs`: server-only password login primitive, **not wired into Worker `index_v2.js` and NO public HTTP route**.
- Reuses existing independently enrolled Entry657/659 PBKDF2 verifier `verifyNewCustomerPasswordV0` and Entry660 HMAC bearer fingerprinting, without Google password import or token fallback.
- D1 login uses account `ACTIVE`, reviewer-issued `verified_enrollment_ref`, PBKDF2-SHA256 100000, active matching `t12_customers`, unique active code, `must_change=0`, control `GENERAL`.
- Wrong password: snapshot-bound atomic D1 CAS increases failed_attempts; 5 failed attempts block for 15 minutes. No success on unknown database acknowledgment. No customer existence disclosure in response.
- Correct password: 32-byte random bearer shown once; only HMAC fingerprint persists. One SQL INSERT ... SELECT CAS verifies the **current** salt/hash/session_version/failure count, customer binding, current General policy and lock to prevent token issue with stale login proof after password rotation or concurrent wrong attempts. Session TTL 8h; Entry660 GET and Entry661 logout validate its fingerprint without shared Google session.
- No browser login endpoint is exposed, so requirements for credential-stuffing IP+code throttling, CSRF/origin policy, audited OTP enrollment and Cloudflare+Google role-based stage review are consciously not claimed finished.

## Tests
```sh
node --test tests/entry662_customer_native_login_off.test.mjs
python3 tests/entry662_customer_native_login_sqlite.test.py -v
```

The SQLite test loads the actual 0005, 0006, 0008, 0032, 0033 schema into an **in-memory fake DB**, with fabricated customers, passwords and orders; tests lockout/recovery, revocation, account disabled, duplicate legacy code rejection, password/nonce races and D1 order read compatibility. The fake Node test checks that only HMAC and a server-verifiable proof reach the issuance CAS. Both inherited Entry660 & Entry661 regressions run under the same fake-only CI.

## Explicit ownership and unfinished prerequisites
- Zero Google employee session/source guard remains separate in [#210](https://github.com/fawakhry/TrendOs/pull/210).
- Native customer account/OTP/password activation Entry654–659 is existing source-only work in [#130](https://github.com/fawakhry/TrendOs/pull/130), not runtime-qualified. No automatic customer account provision, no imported Google secrets/passwords, no claim that a matching customer code grants identity.
- `customerLogin`, `getCustomerOrders`, `customerLogout` are now **3 action implementations prepared at source level** across this PR chain, but **0 customer actions switched OFF Google live**, and 6 other customer actions require their own native authorities.
- No EasyStore finance, BOOK24 Single Writer or print machine mutation, no new app and no testing customer real identities.
- Current Cloudflare source/bundle, protected stage, SMS/OTP grant consent, customer route + global anti-abuse, D1 schema migrations, owner-approved controlled rollout and rollback all pending.

**Final cutover gate:** `SOURCE_PREPARED_ACTIONS=3/9`, `DEPLOYED_CUSTOMER_ZERO_GOOGLE_ACTIONS=0/9`, `PRODUCTION_GO=NO`, `MERGE=NO`, `DEPLOY=NO`, `ZERO_GOOGLE_COMPLETE=NO`.
