# SERVER-68J — Existing staging Worker bundle read-path authorization audit
**Date:** 2026-10-18 · **Source:** owner-provided ~240KB Cloudflare `Edit code` compiled JS text (5336 lines), SHA-256 `a93355e6b1708c82b136aaad4ceb06287fe103d9a17701fa5c7425c36f4095e6`. **Only review and fully offline fake-DB tests. Never tested remote HTTP or customer D1.**
**Target by owner context:** `trendos-d1-staging`, D1 binding `DB → trendos-staging` (UUID previously owner-confirmed distinct from `trendos-main`). Source text is supplied by owner: explicit Cloudflare version `99e823b2` equality is **NOT cryptographically verified**.

## Source verified
1. Bundle main `index_default.fetch` dispatches via `index_v2_default.fetch`. Its legacy fallback `src_default.fetch` services `GET /v1/orders`, `GET /v1/orders/:id`, `GET /v1/customer`, `GET /v1/messages`, and `GET /v1/inbox` **without any authentication/authorization check in those route handlers**. These can contain customer/order and message information if the bound DB contains it.
2. `handleMirrorRequest2` services `GET /v1/mirror/sheets`, `GET /v1/mirror/stats`, `GET /v1/mirror/capabilities`, `GET /v1/mirror/sheet` **without authentication**. Its sheet reader returns row arrays (up to 500 rows/request); this is a sensitive legacy mirror exposure surface. Internal CORS response headers are **not a substitute for server authentication**. No need for a browser Origin in non-browser clients.
3. Additional newer paths contain security controls: `/v1/edge/orders/page` requires an HMAC-bound bearer session and screen permission, `/v1/edge/customer-manager/...` requires bearer session, cloud-write requests require bearer session and feature flag, and import POST requires migration secret. These checks **do not protect legacy fallback / mirror reads**.
4. `cloudflare-d1` production-sensitive SEC-AP303-02 previously marked OPEN HIGH. Current owner Cloudflare UI: worker-specific Access reports *not protected*, Zero Trust Access Applications lists only `matbagy-evaluations-pilot`, workers.dev URL enabled; account/hostname-wide rules, firewall and actual installed version provenance were not independently verified.

## Explicit runtime smoke using fake data only
- A Node 22 VM loaded a transformed copy of the supplied compiled JS (stripped only the final ESM export for isolated evaluation). Web globals `Request/Response/Headers` were provided; fake in-memory D1 `prepare().bind().all()` returned strictly synthetic dummy rows. No remote fetch and no real D1 connection.
- Without Authorization, Cookie, or Origin, `GET /v1/orders`, `GET /v1/inbox`, and `GET /v1/mirror/sheets` all returned **HTTP 200** and matching dummy result arrays.
- Control: `GET /v1/edge/orders/page?screen=print` without a valid token returned **HTTP 401**.
- This is **confirmed offline reachable code behavior**, not proof that anyone accessed sensitive rows over the internet. No destructive calls; no live URL probes; zero SQL writes.

## Release response / explicit NO-GO
- **HIGH:** do **not** treat existing `trendos-d1-staging` as secure staging merely because its D1 UUID differs from `trendos-main`, or because earlier Metrics showed zero invocations.
- Do **not** attempt a blanket production security deploy: R5 periodic workflow and existing Apps Script legacy consumers expect HTTP 200 on some legacy mirror read routes; moving them to the signed-reader paths needs a controlled migration. Also consider direct consumers of legacy customer/inbox/order read endpoints.
- **Near-term reversible containment after owner approval and dependency audit:** turn off public workers.dev production/preview exposure *or* apply scoped Cloudflare Access policy with independently tested approved service identities, preserving any necessary service-to-service traffic. Do not use CORS as security. Unverified consumers require assessment before any such toggle.
- **Long-term:** apply reviewed SERVER-66 fail-closed legacy gates + SERVER-67 scoped/HMAC read APIs + SERVER-68 signed 100-row Apps Script pagination (all currently draft/source-only). Stage with isolated fake D1 + DO and synthetic authorized/unauthorized parity; prove active Cloudflare version and rollback before changing `trendos` or `trendos-d1-api`.
- Current stage is **not authorized for remote SERVER-68 canary**, Worker `99e823b2` release target remains unchanged by this audit; `SEC-AP303-02=OPEN_HIGH`; `UBUNTU_LIVE=OFF`.

**Owner action now:** choose a coordinated containment window for staging workers.dev only after identifying external clients, or prefer a new isolated non-public Worker for SERVER-68 remote tests. Do not share tokens/secrets in chat.
