# SERVER-74/75 — Real Cloudflare Worker read-only provenance without paid browser (2026-10-20)

**Owner instruction:** Browser/agent credits unavailable; use already connected GitHub for read-only Cloudflare inspection. No TinyFish session, new subscription, production deploy, data copy, customer/order HTTP GET, D1 queries, Apps Script or Ubuntu operation. Original release record **D01–D06 remains NO_GO**.

## Evidence collected from real Cloudflare, not mock fixtures

- [SERVER-74 GitHub Actions #39333551367](https://github.com/fawakhry/TrendOs/actions/runs/39333551367), trigger SHA `8893252c8261205a943dcf1610335073eb9c523a`: existing repository **Cloudflare GitHub Actions secret binding worked** for three HTTPS API **GET deployment-metadata** requests.
  - `trendos`: latest active deployment created `2026-10-10T14:31:26Z` (timestamp truncated in output); deployment prefix `d0965035-8df`; active version prefix `803aa6a2-bb4` at 100%.
  - `trendos-d1-api`: latest active deployment created `2026-10-10T10:28:38Z` (timestamp truncated in output); deployment prefix `cea5aa8d-714`; active version prefix `2b40f622-60c` at 100%.
  - `trendos-d1-staging`: latest active deployment created `2026-09-04T22:48:17Z` (timestamp truncated in output); deployment prefix `845cb73d-b52`; active version prefix `99e823b2-8ee` at 100%.
  - These Cloudflare version prefixes **are not Git commit hashes**. Neither Worker-to-Git SHA parity nor configuration/Access authorization was established.
- [SERVER-75 GitHub Actions #39333811091](https://github.com/fawakhry/TrendOs/actions/runs/39333811091), trigger SHA `89bc830f71af0ca4924b872cd7ea69ab5b89e1cd`: **GET deployed script content** in ephemeral GitHub-runner memory; printed **only** bytes, truncated SHA256, and non-sensitive constant-string marker booleans. Never prints raw script, bindings, credentials or customer data.
  - `trendos` deployed content: `42594` bytes, fingerprint `badabfa77333a15d`; selected Edge orders/customer and Ubuntu markers absent.
  - `trendos-d1-api` deployed content: `1039655` bytes, fingerprint `31306e1fe9cc350f`; marker `/v1/edge/orders/02cr/page` **PRESENT**, `/v1/edge/orders/service/page` **PRESENT**, `/v1/edge/customers/search` **PRESENT**.
  - `trendos-d1-api` deployed content: `/v1/printshop/service/orders/page` **ABSENT**, `TRENDOSSHOP_SERVICE_READ_ENABLED` **ABSENT**, signed `/v1/service/mirror/stats` **ABSENT** in downloaded code. Source code for Ubuntu reader and signed mirror was added on later unmerged security/printshop branches; **source-readiness != deployed**. Absence of literal markers is strong source-level evidence but not an authenticated runtime route probe.
  - Neither active-version source parity nor live route readiness can be inferred solely from marker matching. No unauthorized API route was queried.

## Resulting shortest integration architecture

**Keep existing production D1 as source of truth**. The deployed `trendos-d1-api` already includes native orders, service and customer search handlers; do NOT create a new customer database, do NOT import production D1 rows into GitHub, and do NOT send browser employee session tokens to Ubuntu.

**Gap to close, not a rewrite:** qualified dedicated Ubuntu service route `/v1/printshop/service/orders/page` exists *in later repo source* at `cloudflare-d1/src/trendosshop-service-orders-read-v1.mjs`, and the existing Python one-shot client `autonomous-printshop/print-server/src/trendosshop_read_once.py` is already wired to that route. But the live Worker script inspected today lacks both specific marker strings. After independent D03/D04 version/change/consumer/security approval and a secure stage validation, a targeted approved production promotion of this qualified source (with server-side data restrictions, dedicated short-lived principal, no unauthenticated legacy route) is necessary before a real physical Ubuntu machine read. No immediate live login/customer copies are necessary to do source development.

Customer lookups already use `/v1/edge/customers/search` with **employee Edge identity**; they are *not* part of the machine reader permission set. Do not grant customer directory or finance to printshop principal. The six-stage book remains active and applies.

## Guarantees and caution

- Workflow #39333551367 made three GET requests to Cloudflare Worker deployment metadata only. Workflow #39333811091 made two GET requests to deployed Worker code only.
- GitHub Actions public repo: this path uses existing GitHub CI instead of paid TinyFish. Do not assume unlimited free actions minutes; the user can view any GitHub usage billing separately.
- Both workflows: **no D1/order/customer business endpoint GETs, no token log, no secrets written to repo, no script deploy/POST, no staging mutation, no physical Ubuntu login**.
- The Workers are *actually deployed* and differ in function. **We have not performed an authenticated order read, proven fresh customer/order data, or fixed `SEC-AP303-02`**.
- D01 isolated stage remote, D02 scoped secret/DO remote, D03 consumer migration, D04 version parity and change control, D05 physical Ubuntu one-shot, D06 one real-order check are pending; do not auto-open them due to metadata success.

**Source paths added for this audit:**
`.github/workflows/server74-cloudflare-deployment-metadata-readonly.yml`,
`.github/workflows/server75-deployed-worker-route-inventory-readonly.yml`.
