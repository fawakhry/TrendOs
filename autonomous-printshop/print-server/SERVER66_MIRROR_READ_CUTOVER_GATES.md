# SERVER-66 — Legacy + Mirror GET authorization review and cutover gates
**Date:** 2026-10-16
**Status:** SOURCE-ONLY / DRAFT PR #185 / NO PRODUCTION RELEASE
**Security issue:** SEC-AP303-02 — confirmed missing local authorization guards in the owner-observed active `trendos` version prefix `803aa6a2`; external enforcement, Production exposure and exact deployed-bundle Git SHA remain unverified.

## Source qualification: distinct workers and routers
- Owner saw Cloudflare `trendos` → Edit code → `803aa6a2 (Active)`, a bundled `index_v2.js` whose source sections route to unprotected `src/index.js` legacy GET and `src/mirror.js` mirror GET. This is **not** proof that any reviewed GitHub commit is the deployed `trendos` bundle.
- Repository review branch is based on Draft PR #184 and includes existing legacy GET source deny from Draft PR #154 (five shapes). SERVER-66 makes **incremental** changes to `cloudflare-d1/src/mirror.js` and `cloudflare-d1/src/mirror-gate.mjs`. No repeated legacy guard.
- Repository `cloudflare-d1/src/index_v2.js` imports `mirror-gate.mjs`, **not** `mirror.js` for direct GET. First CI discovered that modern GETs were reaching SELECT-only handlers (fake D1 produced 503). SERVER-66 explicitly guards **both** source entrypoints: older direct mirror and modern routed mirror.
- The canonical `cloudflare-d1/wrangler.toml` targets `trendos-d1-api`, **not** the separate manually deployed `trendos` Worker. Editing or merging source here is **not** a release or proof of protection for `trendos` Production.

## Source-only defensive patch
1. `mirror.js`: unauthenticated-by-verified-server-identity GET `/v1/mirror/sheets`, `/v1/mirror/stats`, `/v1/mirror/sheet` → 403 `mirror-read-authorization-required` **before** `ensureMirrorSchema` and any D1 statement.
2. `mirror-gate.mjs`: modern routed equivalents **plus** `/v1/mirror/capabilities` → 403 before SELECT-only D1 statements.
3. `POST /v1/import/sheet`: missing/invalid migration secret → 401 before DDL. Authorized importer keeps existing code and schema init. `POST /v1/mirror/heartbeat` keeps existing secret-bound auth. OPTIONS and unknown-route behavior are tested.
4. CORS/Origin, guessed Bearer headers, and even `x-migration-secret` on GET do not grant read access. No new always-valid credentials or public debug bypass.
5. This review patch intentionally provides **no replacement authorized read API yet**. Do not deploy a blanket 403 while consumers require the old GET routes.

## Known source consumers and breakage on naive deployment
| Consumer/source | Existing read route(s) | Why blanket 403 blocks it | Required migration |
|---|---|---|---|
| `cloudflare-d1/D1_Full_Migration.gs` | `GET /v1/mirror/stats` | Migration preflight and summaries expect `success:true`; `d1FullGet_` currently does **not** send an authenticated read assertion | Dedicated authenticated server-to-server scoped diagnostic read; fail closed and demonstrate no unauthorized D1 access |
| `cloudflare-d1/D1_Orders_Live_Sync.gs` | `GET /v1/mirror/capabilities` and `/v1/mirror/stats` | Atomic capability gate throws; stage/promote sequence or final summary can stop; source does not prove current schedule is enabled | Migrate capability/stats with service-authenticated lane, rollback for staging and heartbeat |
| `cloudflare-d1/D1_Orders_Read_Cutover.gs` | `GET /v1/mirror/sheet` | Staged order/line parity read fails; may prevent a future cutover or affect any enabled legacy caller | Purpose-scoped read for operational Sheets mirror; no broad public row listing |
| `.github/workflows/trendos-r5-periodic-controlled.yml` | `GET /v1/mirror/sheets` | Controlled deployment post-check explicitly expects HTTP 200 and could fail a production release, potentially triggering its emergency action | Replace check with a privileged/non-customer metadata gate before any production rollout |
| `customer_manager_d1_bridge_v1934.js` | `trendos` legacy GET inbox/messages/orders/customer, **not** mirror | Existing mock fallback on 403 and network failure, but real session/consumer compatibility remains unknown | Qualify approved fallback or signed modern endpoint, unknown external clients require inventory |

**Note:** app Script `D1_API_URL` configuration is read from Script Properties and is not proven to point at the independent `trendos` versus `trendos-d1-api` deployment today. Inventory is SOURCE/CONTRACT only, **not** proof of current live invocation.

## Release / rollback checklist — STOP until every gate satisfied
1. Identify exact active `trendos` source artifact and Cloudflare settings/route protection using authorized **read-only** metadata. No customer-bearing HTTP probes or secret copy into chat.
2. Inventory **all** live clients for legacy & mirror reads, including Apps Script triggers, R5 workflow, customer manager and non-repository callers. Verify Owner/employee UI fallback in Stage/CANARY with fake data.
3. Specify service identity and scoped authorization: authenticated backend-only read, minimum tables/columns, per-purpose/sheet restrictions; bounded TTL/replay protection; explicit deny without D1; credentials provisioned via Cloudflare secret store, not code/GitHub/public client.
4. Implement and test the **replacement** for the exact read contracts required above. Tests with fake D1 and synthetic requests must prove: deny before DB, valid scoped read, invalid/expired creds, disabled flags, limited pagination, correct sync behavior, idempotent rollback. Real customer order reads remain OFF.
5. Provide release-safe rollback (prior Worker version recorded, Worker-binding and rollback owner approval, affected consumer versions and operator smoke plan). Do **not** automatically copy `cloudflare-d1/wrangler.toml` to the independent `trendos` target.
6. Obtain separate owner approval for any deploy, Cloudflare Access/WAF change, service credential, D1 live query, or Ubuntu integration. No implicit approval from this PR.

## Evidence and known outcomes
- First CI run [38955408023](https://github.com/fawakhry/TrendOs/actions/runs/38955408023) **FAILED** 16 modern-route synthetic tests (503 from existing modern mirror path) and **exposed the missing `mirror-gate.mjs` coverage**; intentionally preserved as regression history.
- Corrected source/test commit `bb68fc0c637b2b338ef150db21427f2bf07ed648`: [SERVER-66 offline CI run 38955614575](https://github.com/fawakhry/TrendOs/actions/runs/38955614575) **98/98 PASS, 0 FAIL** across SERVER-30, SERVER-56 and SERVER-66; [A61 CI 38955614532](https://github.com/fawakhry/TrendOs/actions/runs/38955614532) SUCCESS.
- No production release or D1 queries. Tests use `.invalid` URLs and fake D1, not a live Worker. `SOURCE_AUTHORIZATION_PATCH=TESTED` ≠ `PRODUCTION_CONTAINED` ≠ `UBUNTU_CONNECTED`.

**State:** `SEC_AP303_02=OPEN_HIGH`; `MIRROR_READ_FAILCLOSED=SOURCE_TESTED`; `MIRROR_CONSUMER_MIGRATION=BLOCKED`; `LEGACY_TRENDOS_BUNDLE_PARITY=UNVERIFIED`; `PRODUCTION_CHANGE=NO`; `OWNER_DEPLOY_APPROVAL=NOT_REQUESTED`.
