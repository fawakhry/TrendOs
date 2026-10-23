# Customer portal native browser transport V0 — SOURCE ONLY / DEFAULT OFF

Date 2026-10-23. PREPARE. User scope: **existing customers already Cloudflare, only finish their platform**. This is not another customer data migration.

## Pinned upstream

Parent TrendOS customer Draft #221 `fca5625e53815647addc6d183ebe4040990acdf5` (OPEN DRAFT). Existing `index.html` embeds `config.js`, `browser-api-transport-v1.js`, `app.js`, then `employee-api-dispatcher-v1.js`; frontend `app.js` currently passes all actions through `window.trendosSecureApiV1922` which forwards to `window.trendosLegacyApiTransportV1` by default. Employee wrapper preserves the downstream customer path.

## Proposed exact safe unit

Add a separate `customer-native-browser-transport-v0.js` loaded *between* browser legacy transport and original app.js, add `window.TRENDOS_CUSTOMER_NATIVE_BROWSER_DISPATCH_V0_ENABLED = false` to frontend `config.js`, route **only** nine customer actions via a narrow gate in the existing app.js secure API. All other employee and existing orders calls use their unchanged downstream. OFF returns original legacy result. ON **never falls back to Google for customer actions**.

Only `getCustomerOrders` has an existing source-only native HTTP handler contract (Entry660). The adapter must require an **independent native session bearer** (64 hex, not legacy customer token), send only HTTPS `GET /v1/customer/native/orders` to the existing exact Cloudflare API origin with Authorization header and bounded page, and adapt line records to the current UI's order cards. The other eight actions, including login, must explicitly fail closed when ON because corresponding real HTTP routes are NOT qualified; turning ON is prohibited and would block login. Not a release-ready flip. Underlying actual Worker Entry660 remains NOT IMPORTED and feature flag remains OFF.

No customer record, Cloudflare secret, D1 migration, SMS, R2 object, Apps Script, EasyStore/finance, employee session, T12 writer, production flag/asset or live service changed.

## Verification and recording plan

Offline Node VM tests for all nine: OFF unchanged, non-customer untouched even when ON, native route rejects missing/wrong bearer and wrong API host, legacy params never forwarded as native customer authorization, no silent Google fallback on any error, no redirects, truncated/malformed response fail-closed, safe rendering shape. Verify exact `index.html` script order and app.js integration anchors. GitHub Actions source-only workflow, no deploy. Update THIS doc RESULT and append observed evidence to **old ACTIVE_WRITE book** in companion review branch based on its latest HEAD; never write frozen catalog or auto merge. Distinguish final exact-head Actions from any intermediate failures.

**PREPARE:** `CUSTOMER_MASTER_REBUILD=NO`; `CUSTOMER_PLATFORM_ONLY=YES`; `SOURCE_ONLY=YES`; `FEATURE_FLAG=OFF`; `LIVE_CUSTOMER_GOOGLE_RETIRED=0/9`; `PRODUCTION_CHANGE=NO`.
