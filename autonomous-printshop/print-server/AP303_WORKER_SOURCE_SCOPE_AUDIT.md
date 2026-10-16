# AP-303 — Cloudflare Editor source review and unmerged screen-scope guard

**Date:** 2026-10-16. **Source:** owner-supplied Cloudflare `trendos-d1-api` **Edit code** copy, not a secret or API token.  
**Status:** `SOURCE_REVIEWED` / `PATCH_TESTED_IN_CI` / `LIVE_NO_GO`.  
**Bundle evidence:** 1,039,406 bytes, ~18,741 lines. SHA-256 `9f43a4fa1156eb84bf441121583dbe70a29ab65681539f0830c8971ce6e0df75`; **do not upload the full bundle, environment variables, or customer data to GitHub**.

## Source conclusions and limits

1. The supplied bundle explicitly includes `src/edge-orders-read-v1.mjs`, `src/edge-orders-read-02cr-canary.mjs`, `src/index_v2.js`, and `production-shadow/index.js`. Its Worker router directs `/v1/edge/orders/02cr/page` to the 02CR handler, and a separate order-session handler issues signed Edge session tokens. **Source route presence is established**; this copy has not been cryptographically tied to Cloudflare active version prefix `2b40f622`, nor exercised against live API.
2. The current role-map source grants administrative access to `service/print/laser/press/empty` and separately permits `print/press/empty` or `laser/empty`; a dedicated **`print+laser`-only** live role is not present in that mapping. `trendosshop_order_reader` from AP-301 remains a proposed policy, not a created account or proven production role.
3. **Security note SEC-AP303-01 (scoped source flaw, not confirmed exploitation):** The 02CR request handler's original guard checked whether a screen was disallowed **only when the claims list was nonempty**; a validly signed token with empty/missing screens could skip that particular check. Other signature/expiry/auth verification still applies. The repair on this review branch requires an explicit nonempty well-formed `screens` list including the requested screen.
4. **Security note SEC-AP303-02 (HIGH PRIORITY AUDIT; do not probe production):** The old D1 fallback reader source `cloudflare-d1/src/index.js` includes customer-bearing read handlers with no explicit credential gate **inside the examined handlers**. The `src/index_v2.js` router delegates unmatched requests into that reader. This source-level observation requires immediate review of *all* upstream gate/Cloudflare Access/route protections before deployment; it does **not** prove anyone has accessed data or that a live request will succeed. Do not publish exploit requests or perform unapproved live probes, and do not disable old routes without dependency/rollback analysis.
5. **Source-version note:** Different GitHub branches hold different historical Worker sources; the supplied bundle and current review branch agree on the 02CR route and guard structure. Cloudflare Editor may display script contents without a reliable matching GitHub SHA; don't claim exact artifact identity from file similarity.

## Unmerged AP-303 changes

- **[Draft PR #151](https://github.com/fawakhry/TrendOs/pull/151)**, branch `fix/ap303-edge-read-scope-fail-closed-20261016` stacked on AP-302.
- Changed only `cloudflare-d1/src/edge-orders-read-02cr-canary.mjs` for the scope guard; rejects missing/empty/malformed grants or a screen not included. No change to API routes, role mapping, credentials, account provisioning or the D1 data model.
- Added `tests/ap303_edge_orders_02cr_fail_closed.test.mjs`, offline signed synthetic token/isolated mock-DB tests; CI workflow read-only with no secrets.
- Verified **[AP-303 CI #38919460259](https://github.com/fawakhry/TrendOs/actions/runs/38919460259)**, job `117035301971`, **8/8 tests PASS**; no real D1 or Cloudflare connection.
- Parallel `TrendOS Orders 02CR visibility regression` [#38919460050](https://github.com/fawakhry/TrendOs/actions/runs/38919460050) and `A61 browser Cloud transport regression` [#38919460145](https://github.com/fawakhry/TrendOs/actions/runs/38919460145) also succeeded.
- **Unrelated but non-GO:** `TrendOS Integrity V1` [#38919460209](https://github.com/fawakhry/TrendOs/actions/runs/38919460209) failed at `tests/trendos_polling_coalescing_v1.test.mjs` expecting `trendPollCoordinatorV1Loader` in `config.js`. Compared base and AP303 branches: both the test and `config.js` have identical blob SHAs, so this discrepancy **predated AP303's two changed source/test files**. Do not call the whole workflow gate green, and don't paper over the failure here.

## Next gates

1. Investigate SEC-AP303-02 in a **separate scoped code audit**: find all deployed protections and consumers, write replacement auth controls/failing tests in an isolated Draft branch, get review for compatibility before any live patch.
2. Independently verify the exact Worker deployment code/version against current production metadata. Do not rely on the screenshot's short version prefix or the Edit code copy to claim a GitHub commit.
3. Design a genuine **server-enforced** print+laser-only account and read-only endpoint, with no hidden write/finance/printer/customer-directory rights; owner separately authorizes any actual provisioning or credential use.
4. Only after safe server authorization and audit: qualify an outbound-only TLS client/one-shot limited live read on Ubuntu with separate owner consent and sanitized results.

`SOURCE_READ_ONLY=YES`; `DRAFT_PR_151=UNMERGED`; `PRODUCTION_DEPLOYMENT_CHANGED=NO`; `UBUNTU_CHANGED=NO`; `REAL_ACCOUNT_CREATED=NO`; `LIVE_API_REQUESTED=NO`; `PRODUCTION_GO=NO`.


## Follow-up after connection interruption — full 02CR router chain

After checking the stored GitHub branch, confirmed that the target `cloudflare-d1/src/index_v2.js` routes 02CR through `edge-orders-read-02cr-freshness.mjs` (metadata guard) and only then `edge-orders-read-02cr-canary.mjs` (qualified handler). The original 8/8 AP303 test directly validated the qualified handler, but a missing/mismatched signed screen grant could reach D1 metadata **before** the qualified handler returned a denial. This was corrected in the **same unmerged Draft PR #151** by using its fail-closed `allowsOrdersReadScreen` predicate in both layers.

Two **actual-router** fake-signed-session tests assert `403` and `0 D1.prepare calls`; the refreshed [AP303 GitHub Actions run #38920667709](https://github.com/fawakhry/TrendOs/actions/runs/38920667709), job `117039452909`, returned **10/10 PASS**. Earlier 8/8 result remains historical only. The overall Integrity CI [#38920667535](https://github.com/fawakhry/TrendOs/actions/runs/38920667535) still failed on a separate prior source/test mismatch. No live API request, key usage, server deployment, Ubuntu change or account creation occurred. [`SERVER-20261016-28`](UBUNTU_SERVER_BOOK.md) records this correction.

`AP303_LATEST_SPECIFIC_CI=10_OF_10_PASS`; `INTEGRITY_CI=FAILED`; `WORKER_DEPLOY=NO`; `PR_MERGE=NO`; `LEGACY_GET_AUTH_AUDIT=PENDING`.
