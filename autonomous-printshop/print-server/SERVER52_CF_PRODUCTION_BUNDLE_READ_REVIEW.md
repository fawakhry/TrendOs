# SERVER-52 — Cloudflare 2b40f622 read-only editor bundle comparison

**2026-10-16 — SECURITY REVIEW / NO PRODUCTION ACTION.**

**Evidence provenance:** Owner opened `Workers & Pages / trendos-d1-api / Production / Edit code`, with selector `2b40f622 (Active) Latest`. Screenshot shows the generated `index.js` bundle and a built-in preview of `GET /` returning "Not found". Owner separately provided the text of the editor bundle (~1.0 MiB, ~18,741 source lines); SHA-256 of that **user-supplied text**: `9f43a4fa1156eb84bf441121583dbe70a29ab65681539f0830c8971ce6e0df75`. Hash records the chat artifact, **not** a Cloudflare-signed code digest, a GitHub commit, or verified byte-for-byte parity with the live deployed artifact. The whole bundle is **NOT committed or replicated** to GitHub because of its size and potential embedded integration details.

## Findings (static review; HIGH PRIORITY, external reachability NOT verified)

1. **SEC-AP303-02 — legacy sensitive GET read boundary remains present in the editor bundle.** Within the generated bundle's `// src/index.js` section (roughly lines 461–835), old customer/order/message/inbox reads route to D1 query helpers without a request authentication/authorization check in the reviewed legacy handler. In the `// src/index_v2.js` section (~17194–17282), unmatched routes reach the legacy handler through `return src_default.fetch(request, env, ctx)`, and `// production-shadow/index.js` (~18719 onward) delegates unmatched routes to `index_v2_default.fetch`. No external request was sent to any of these paths. Cloudflare Access/WAF/route restrictions and actual exposure to unauthenticated users remain **unknown**. Do not assert compromise or database disclosure.
2. **AP-303 screen scope: signed token required, empty grant insufficiently rejected in displayed bundle.** `// src/edge-orders-read-02cr-canary.mjs` (~11503–11515) verifies the signature and then only rejects an out-of-scope screen when a nonempty `screens` list was supplied. Its freshness guard similarly uses a length-conditional screen test (~11702 onward). The tested proposed branch replaces this with `allowsOrdersReadScreen()`, requiring a nonempty explicitly listed screen. This is a source-level authorization control gap, **not** a live exploit or evidence of missing cryptographic signature validation.
3. **SERVER-33 reader is not shown in the captured bundle.** No `/v1/printshop/service/orders/page` or `TRENDOSSHOP_READER_...` source markers were found in the owner-supplied 18,741-line bundle. The Draft PR #160 adds a *different*, default-disabled service reader for print+laser. The current Production API should therefore not be described as the new reader.
4. **UI preview of the root URL returning Not found is not a safety check.** It is a preview GET of `/` performed by the editor UI, with no evidence of a customer/legacy read, real Ubuntu handshake, or production security probe.
5. **Source/bundle equivalence remains qualified evidence only.** The editor selector and bundle screenshot associate the text with the active version `2b40f622`; there is no retrieved immutable version manifest, build provenance, source map comparison, or Cloudflare Access policy review. Cloudflare screenshot previously confirmed version `2b40f622` receiving 100% of traffic, but this does not prove every runtime route is protected.

## Existing fixes / no duplication

- [Draft PR #151](https://github.com/fawakhry/TrendOs/pull/151) includes AP-303 fail-closed signed screen-grant check, with synthetic CI success recorded previously. **NOT merged or deployed**.
- [Draft PR #154](https://github.com/fawakhry/TrendOs/pull/154) already contains the SEC-AP303-02 conservative legacy-read denial plus no-D1 mock tests, **but breaks legacy consumers if shipped without migration**. Do not merge/deploy until known consumers and backward compatibility are qualified.
- [Draft PR #160](https://github.com/fawakhry/TrendOs/pull/160) includes proposed SERVER-33/34 isolated reader, **default OFF**, separate principal and synthetic tests. Ubuntu staged worktree at `c29e8c1` previously passed 43 synthetic local tests; it is not the Production artifact.
- No new issue-repair PR, new Worker, production credential, Cloudflare setting change, routing probe, merge or deployment was created for this review.

## Go-live blockers and next non-mutating inspection

**Priority:** owner-approved urgent evaluation of external access boundary and compatibility **before any order-reader go-live**. Verify Cloudflare Zero Trust/Access/WAF configuration for the exact `workers.dev` hostname and relevant routes (CORS is not authentication); inventory consumers of historical endpoints, including external clients; obtain immutable deployment/source provenance; qualify default-deny behavior on isolated mock/staging fixtures. If the external protection is absent, seek explicit owner authorization for a narrowly scoped containment decision that preserves essential operations, with rollback plan. Never run unauthorized Production probes or view live customer records.

**Next owner UI step:** leave the Cloudflare code editor without deploying. Return to `trendos-d1-api` dashboard, open the `Access` tab, and share a screenshot showing only application/policy **names and protection status**, with sensitive identifiers, users, secrets and tokens concealed. That tab may not represent all WAF and Workers route protections; it is a starting inventory, **not confirmation of coverage**.

`SEC_AP303_02=OPEN_HIGH_PRIORITY`; `AP303_SCREEN_FIX_SOURCE_ONLY=YES`; `PROD_EXTERNAL_AUTH=UNKNOWN`; `PROD_WORKER_VERSION=2b40f622_AS_SHOWN`; `PROD_BUNDLE_SHA256_CLOUDFLARE_VERIFIED=NO`; `PR_MERGED=NO`; `PRODUCTION_DEPLOY=NO`; `UBUNTU_LIVE_ORDER_READ=NO`.


## SERVER-53 Access dashboard evidence — 2026-10-16

Owner screenshot of **`Workers & Pages → trendos-d1-api → Production → Access`** displays explicitly:

> This Worker is not protected by Access

and states no Worker-specific policy is configured and traffic remains public **unless a hostname or account policy applies**. The Worker card also says "Not protected yet" and offers "Protect this Worker behind Access".

**Conclusion limited by the screenshot:** `WORKER_SPECIFIC_ACCESS_POLICY=ABSENT_AS_SHOWN`. The screenshot does **not** establish whether a hostname-level Access application, Cloudflare WAF/rule, account policy, or another gateway controls every `workers.dev` route. Coupled with static review of unauthenticated-looking legacy D1 GET handlers and v2 fallback, the potential exposure deserves urgent owner attention; it remains **unconfirmed reachability**, not a proven breach. No probing of Production routes is authorized.

**Do NOT press "Protect this Worker behind Access" or change DNS/WAF now**. This API is shared with UI, employee/customer logins, Apps Script bridge and other integration workflows; a blanket change risks an outage. Proceed with (1) route/domain inventory from the Worker `Domains` tab (screenshot only), (2) external-access enforcement inventory including account/hostname rules, (3) legacy consumer dependency audit, (4) compatibility-tested containment fix/rollback plan, (5) distinct owner authorization for production changes. Preserve current Cloudflare Worker and Ubuntu status in the meantime.

`WORKER_ACCESS_POLICY=NO`; `HOSTNAME_ACCOUNT_CONTROLS=NOT_AUDITED`; `SEC_AP303_02=HIGH_PRIORITY_OPEN`; `NO_DEPLOY_NO_ACCESS_CHANGE=TRUE`.


## SERVER-54 Domains: public Production and Preview Worker URLs enabled — 2026-10-16

Owner screenshot of `trendos-d1-api → Production → Domains` shows:
- Production `workers.dev` host `trendos-d1-api.trendmall-contact.workers.dev`, switch visibly enabled (blue), text **"Anyone with this URL can visit. Enable Access"**.
- Preview wildcard host `*.trendos-d1-api.trendmall-contact.workers.dev`, switch visibly enabled (blue), same publicly visitable notice.
- The `Custom Domains and Routes` section shows **"No custom domains"** and has no listed custom routes.
- Combined with prior Access screenshot: this Worker has **no Worker-specific Access protection**. Account-wide rules, external security filtering (WAF/rate limits/bot rules), application-level authorization on particular routes, and preview-version permissions are not fully verified.

**Security decision:** heightened urgency for `SEC-AP303-02` source-level sensitive-read handler gap. Public host reachability **does not by itself establish data exposure** or an exploit. No live endpoint requests, unauthorized probes, sensitive logs or real D1/customer queries were performed. The distinct `trendos` Worker observed in repository's historic bridge is not necessarily the same publicly reachable surface as `trendos-d1-api`; assess each independently and do not assume bridge usage implies same endpoint reachability.

**Compatibility blockers remain:** both Production and Preview switches must stay unchanged until the owner authorizes a planned release. Existing UI/employee/Apps Script consumers may rely on those hosts. Draft PR #154's default-deny legacy GET patch must not ship without a consumer migration/rollback audit. Staged testing and targeted hardening are safer than a blanket Access switch-off.

**Read-only next step:** inspect `Settings` page **without** showing secrets, tokens or values. Ask for screenshot of non-sensitive configuration section headings and `workers.dev`/routing feature names only. Do not flip either switch, create Access policy, deploy, or change account settings.

`WORKER_PRODUCTION_URL_ENABLED=YES_AS_SHOWN`; `WORKER_PREVIEW_URL_ENABLED=YES_AS_SHOWN`; `NO_CUSTOM_ROUTES_LISTED=YES_AS_SHOWN`; `WORKER_SPECIFIC_ACCESS=ABSENT`; `EXTERNAL_REQUEST_AUTH_PATH_VERIFIED=NO`; `BREACH_CONFIRMED=NO`; `PRODUCTION_CHANGED=NO`.
