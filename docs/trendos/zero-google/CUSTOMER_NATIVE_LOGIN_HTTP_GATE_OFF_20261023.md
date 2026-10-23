# Entry — Customer Native Login HTTP Gate V0 (2026-10-23)
Status: PREPARE, SOURCE ONLY, DEFAULT OFF, NO DEPLOY.

## Owner scope
Customers already exist on Cloudflare per owner. Finish the **existing customer portal**, not D1 customer master migration. Keep employee API, canonical T12 writer, EasyStore accounting, old Google customer login, customer data and R2 unchanged in production.

## Exact-parent evidence
Source head PR #224 `d8e3316ffd32c679e97a6b6b0816e800384347ee` (customer browser Native OFF source; source CI SUCCESS, old unrelated V1931 resilience FAIL).
Original `cloudflare-d1/src/customer-portal-native-login-v0.mjs` blob `5223bfc2f437bffeb3394aa11009bdfca606745d`, isolated `issueNativeCustomerSessionFromPasswordV0` (PBKDF2 session, account proof, original D1 SQL, no HTTP).
Existing Native orders route `cloudflare-d1/src/customer-portal-native-orders-v0.mjs` is source-only and NOT Worker-wired. Underlying D1 customer identity migration 0032 is additive but NOT applied to Production.

## This isolated implementation unit
A narrowly bounded new unimported **HTTP adapter source** may validate request path/method/JSON/origin/size and call the ORIGINAL login function with trusted DB + HMAC secret, only after an independently durable configured dual-key (network+portal code) rate limiter authorizes attempts. Never introduce a mock/pre-approved production rate limiter. Rate keys must be privacy-preserving HMAC fingerprints, not raw phone, IP or portalCode. Enforce secure Cloudflare-edge client IP metadata requirement. Every missing requirement returns 4xx/503 fail-closed and no DB session write. No Google or retries. Original login 401 generic; no customer/user ID in response. No CORS wildcard, passwords in URLs or log, external request forwarding or auto routes.

**Hard freeze:** Do NOT import into Worker `index_v2.js`, do NOT deploy/enable switch/migrations, do NOT send SMS or use real customer credentials. Even an isolated handler success with fake environment is NOT approval: stage must validate trusted IP source/ingress, global durable throttle provider, customer account enrollment and live D1 migration + rollback. Existing browser flag stays OFF and currently has no Native login wiring.

## Verification
Node 22 synthetics with fake random & D1 and a deliberately fake durable-rate gate: OFF, wrong path, methods, missing/invalid origin, untrusted edge/IP, missing rate binding, dangerous payloads, wrong password generic, failure-after-rate, valid fake session, no Google, no PII. Then exact-code GitHub Actions; record actual SHA, failures, no production evidence in old ACTIVE_WRITE `TrendOS_MASTER_BOOK.md` on refreshed book branch, leaving new catalog FROZEN_MIGRATION_ONLY.
