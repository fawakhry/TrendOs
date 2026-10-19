# SERVER-71 — Apps Script signed Mirror read destination pin (source only)

**Date:** 2026-10-19 | **Branch:** `release/server68-staging-qualification-20261016` | **PR:** [Draft #190](https://github.com/fawakhry/TrendOs/pull/190).
**Authority:** Owner "كمل" to continue independently safe source-only tasks. No Apps Script project changed, no Script Properties set, no Cloudflare token/deploy/Access/WAF/D1 touched, no live Ubuntu/device call.

## Finding
Earlier `cloudflare-d1/D1_Mirror_Service_Read_V1.gs` checked `D1_API_URL` only against `/^https:\/\//` before attaching the HMAC metadata/parity signature. This accepted malformed or unpinned destinations from a Script Property, including `https://other-host.invalid` and URLs with userinfo/port/path/query. No evidence any malicious property was used or any real credential leaked. Separate security credentials should never be sent to an unapproved destination.

## Source-only remediation
- When `D1_MIRROR_SERVICE_READ_V1_ENABLED=true`, `d1MirrorServiceReadV1_` **requires** a second independently configured Script Property `D1_MIRROR_SERVICE_READ_V1_EXPECTED_HOSTNAME`, containing an exact hostname (not URL); checks exact lower-case match against `D1_API_URL` authority and an HTTPS-only, no userinfo/no port/no path/no query/no fragment URL.
- Fails closed before calculating/sending signed requests when pin missing, host mismatch, or malformed destination, with non-sensitive error codes `SERVER71_SIGNED_TARGET_NOT_PINNED` / `SERVER71_SIGNED_TARGET_NOT_APPROVED`. Existing SERVER-67 `D1_MIRROR_SERVICE_READ_V1_ENABLED` is OFF by default; OFF legacy workflow path and production Apps Script properties remain **unchanged**.
- Enforces HMAC key length 32–256 consistent with SERVER-67 backend. The host pin is defense in depth against accidental configuration drift; it does **not** prevent a privileged Script Properties editor from altering both properties and does **not** replace Cloudflare Access/HTTPS trust or HMAC replay DO.
- **Operational proposed production pin for review, NOT applied:** hostname `trendos-d1-api.trendmall-contact.workers.dev`, assuming exact active Worker URL is verified by owner. For any separate approved synthetic stage use its specifically reviewed distinct hostname instead. Do NOT configure guessed account-level routes or store credentials in repository.
- Never enable secure signer before Stage Worker/DO and Apps Script service identities have been independently verified; missing hostname now deliberately blocks opt-in ON.

## Offline regression
- Existing SERVER-67 fake `UrlFetchApp` test and SERVER-70 Live Sync fake VM test were updated to supply independent **synthetic** expected hostnames ending `.invalid`.
- New `tests/server71_apps_script_signed_destination_pin.test.mjs` tests positive matching host/canonical HMAC and rejects missing/wrong pin, lookalike domain, userinfo, http, unexpected port/path/query/fragment, invalid host spelling, secret >256, and default-OFF behavior. Uses VM/injected `UrlFetchApp` with a fixed `.invalid` fixture destination, no outbound traffic.
- Included in `.github/workflows/server68-isolated-stage-preflight.yml` with no real token, secret, deploy, or D1 binding.
- **CI run and exact pass count must be checked before claiming PASS.** Do not use last successful 212/212 as proof of SERVER-71 until tests on current head complete.

## D03: Consumer cutover remains pending
This feature is source-level credential destination validation. Real Apps Script Script Properties, HMAC/DO provisioning, and opt-in deployment remain **NOT VERIFIED**. The legacy R5 workflow still relies on GET /v1/mirror/sheets=200 on an older pinned production SHA; it has not been edited. Do not cut over or deploy fail-closed legacy gates before verifying R5, customer-manager, and other external consumers.

**Status:** `SERVER71_HOST_PIN=SOURCE_PATCHED`; `SCRIPT_PROPERTIES=UNCHANGED`; `SEC-AP303-02=OPEN_HIGH`; `D03=EVIDENCE_PENDING`; `PRODUCTION=NO_CHANGE`; `CLOUDFLARE_STAGE=NO_DEPLOY`; `UBUNTU_LIVE=NO`; `PR195=UNTOUCHED`.
