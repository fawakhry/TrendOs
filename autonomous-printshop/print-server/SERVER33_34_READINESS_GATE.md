# SERVER-33/34 — TrendosShop one-shot Print + Laser read lane (REVIEW ONLY)

**Date:** 2026-10-16 · **Repository:** `fawakhry/TrendOs` · **PR:** #160 (Draft, stacked over #155) · **Production state:** `OFF` / `NOT DEPLOYED`.

## Goal and scope

Provide a genuinely executable **source-level** service-to-service read path that does not use Diaa's admin identity, current human employee tokens, or old unauthenticated fallback GETs. This is preparation for a future explicitly approved, single live canary. It does **not** prove that Ubuntu has contacted the real API or that Cloudflare is serving this patch. No production role, credential, D1 schema, print job or SSH change was made.

## Reviewed source and route

- `cloudflare-d1/wrangler.toml`: `main = "production-shadow/index.js"`, which imports `src/index_v2.js` as `core`. The new route is inserted into that existing router, not a new Worker.
- `cloudflare-d1/src/trendosshop-service-orders-read-v1.mjs`: exact `GET /v1/printshop/service/orders/page?screen=print|laser&page=1&pageSize=1..20`.
- Backend requires all of: `TRENDOSSHOP_SERVICE_READ_ENABLED=true` (unset by default), `TRENDOSSHOP_READER_PRINCIPAL=trendosshop_order_reader`, a 64-hex SHA-256 digest of a separate random service credential (`TRENDOSSHOP_READER_TOKEN_SHA256_HEX`), and short-lived `TRENDOSSHOP_READER_ISSUED_AT_MS` / `TRENDOSSHOP_READER_EXPIRES_AT_MS` valid no longer than **15 minutes**. These are **future deployment requirements**, not populated settings; no real account/credential is provisioned here. Credentials must be stored and rotated through an approved secret-management mechanism, never committed to GitHub or pasted in chat.
- The server rejects missing/invalid/expired credentials, unsupported screens/queries/methods and browser Origins **before any D1 access**. It then queries the qualified **order-lines mirror** plus selected Cloud-native T12 line fields (without joining customer directory) and applies a second exact department check. Customer/finance/notes/phone fields are never projected in the response. Response fields are exactly `orderId,lineId,screen,serviceCode,status,quantity`; one page, max 20 rows, max 128 KiB. Invalid snapshot/schema fails closed; error messages do not echo SQL or PII.
- The limited GET is a **snapshot read, not operational execution authority**. It currently does not merge every historical legacy runtime status overlay; freshness and current-business-data parity must be verified in a controlled non-production staging environment before a live canary.
- `autonomous-printshop/print-server/src/trendosshop_read_once.py`: isolated Python standard-library HTTPS client with fixed host, certificate verification, no proxy/redirect/retry, 5-second timeout, bounded response, strict schemas and per-screen validation. Called only through an **explicit function invocation** with `enabled=True` and `owner_authorized=True`; no CLI auto-execution, credentials source, background loop, file I/O or `run.py` import. Its only successful result is **aggregate counts**; no order IDs or customer data are logged or returned.
- Tests: `tests/server33_trendosshop_service_orders_read.test.mjs`, `autonomous-printshop/print-server/tests/test_server34_trendosshop_read_once.py`. Both use fake identities/responses, no live network or D1. `.github/workflows/server33-service-orders-read-ci.yml` and `server34-ubuntu-read-once-ci.yml` use `contents:read` and no secrets. Record only actually completed CI evidence.

## Deployment gates requiring separate owner authorization

1. Confirm parity of reviewed GitHub source to the specific live `trendos-d1-api` Worker version. Existing dashboard prefix `2b40f622` is **not** a GitHub SHA.
2. Close compatibility review `SEC-AP303-02` and verify all legacy consumers and actual Cloudflare Access rules; do not auto-merge source Draft PRs.
3. Validate complete Orders/Lines reads and legacy runtime overlays, department/lane edge cases, and read-only field projection on synthetic/staging fixtures. No live API probes without approval.
4. Obtain separate explicit approval to provision the dedicated service credential/configuration (and approval for any live Cloudflare change). No real secret goes to source, logs, CI or chat.
5. On Ubuntu, preserve the currently old local worktree, inspect diff/status before a controlled update. The source Python reader stays off and isolated from live `run.py`; only an owner-authorized single read may use it.
6. Once authorized, run an outbound HTTPS one-shot limited read and return **only sanitized counts** as evidence. Production printing/laser remains OFF, and each new department must pass its own policy gate.

## Evidence and status

`SERVER33_BACKEND_SOURCE_IMPLEMENTED=YES` · `SERVER34_CLIENT_SOURCE_IMPLEMENTED=YES` · `FAKE_TESTS=CI_EVIDENCE_REQUIRED` · `REAL_ACCOUNT_CREATED=NO` · `PRODUCTION_API_ENABLED=NO` · `CLOUDFLARE_DEPLOY=NO` · `UBUNTU_UPDATED=NO` · `LIVE_ORDERS_READ=NO` · `PR_MERGED=NO`.
