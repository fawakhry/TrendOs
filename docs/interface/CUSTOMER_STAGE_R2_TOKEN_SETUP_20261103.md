# Approved dedicated Stage R2 access — 2026-11-03

The owner explicitly replied **“agree”** to creating/providing a dedicated same-account Cloudflare token with `Workers R2 Storage Write` and saving it in GitHub Secrets. Approval is recorded; do not ask again for the same scope. This is not approval for public R2, production customer activation, broader account access or replacing the existing Worker/D1 token.


## Latest verified state — private bucket and original Stage binding verified

The owner completed the secure manual setup in their own authenticated sessions, selected one Trend Mall account and R2 Edit only, expiration **November 10, 2026**, and confirmed the repository Actions secret was saved. The assistant never received the token value. The following real run proves the separate secret was available to Actions and authorized this operation.

- [Run41699904718](https://github.com/fawakhry/TrendOs/actions/runs/41699904718), Job126140166953, workflow_dispatch, exact source `3bcf2c6a892efff5711bb78d05ee28debf55c493`: **SUCCESS**, started November 3 at19:05:02UTC /21:05:02 Cairo.
- Actual log:11 tests PASS; original nonpublic OFF Stage and synthetic D1 preflight PASS19:05:31UTC; `ONE_EMPTY_STAGE_BUCKET_CREATED=YES`19:05:32; private readback19:05:34.
- Bucket `trendos-customer-stage-private-synthetic-20261103-v0` exists. Managed r2.dev disabled; custom domains empty; no objects written; no Worker binding/deploy or customer activation.
- **Do not rerun bootstrap or create another bucket.** Keep the existing approved bucket; the runner rejects the same-name existing bucket instead of recreating/adopting it.
- The owner subsequently saved CUSTOMER_DRAFT_FILES_BUCKET on the original isolated Stage using Cloudflare Deploy. GET-only Run41705383110 / Job126159193400 (source08e05b7eb53a9540c29b47017d8d78cd8d332a5c) independently verified exact binding, private domain settings, all11 flags OFF, original synthetic D1/DO/runtime, and full AST equality with freshly bundled immutable original6b312288. Provider etag differed; cause unknown and no byte-equality claim. See [binding report](CUSTOMER_STAGE_PRIVATE_R2_BINDING_20261103.md) and customer book §48.
- Source helper customer_stage_private_r2_postbind_ro_v1.py can render a verified disposable OFF configuration with exact existing R2. The original tracked config/resolver are unchanged; never remove the original no-R2 guard or run an old deployment that drops this binding. No new token/bucket or public URL is needed.
- The old missing-token/403 blocker is resolved for this operation. Next are Native two-account/private-media/scanner/viewer/T12 E2E and exact-live rollout. Customer production remains OFF/NO_GO.

## Earlier browser blocker — historical, superseded by secure owner setup

Browser Google sign-in was attempted with secure credential entry. Cloudflare returned `Unable to sign in. Try again or use your email and password.` A fresh tab to the intended API-token page still required sign-in. No signed-in Cloudflare session was established; no API token was created or copied, and no GitHub secret was added. This is the observed result in this browser, not proof of an outage, wrong password or bot detection. Do not repeat the failed sign-in automatically.

## Secure one-time setup — completed, retained as operator reference

An account administrator can complete the following in their normal authenticated Cloudflare and GitHub sessions; this procedure does not rely on sharing browser cookies with the assistant.

1. Cloudflare **My Profile → API Tokens → Create Token → Custom token**. Create `TrendOS Customer Stage R2 Bootstrap 20261103`, with **Account / Workers R2 Storage / Edit** (API permission `Workers R2 Storage Write`), restricted to the **same single account** that owns `trendos-customer-portal-isolated-stage-v0`. Use a short expiration, for example seven days. Do not add Workers/D1/Access permissions, all-account resources, or use an S3 access-key/secret-key pair instead of the Cloudflare API token.
2. In **fawakhry/TrendOs → Settings → Secrets and variables → Actions → New repository secret**, use exactly `CLOUDFLARE_R2_STAGE_API_TOKEN`. Paste the new token directly into GitHub's encrypted secret field and save. Keep `CLOUDFLARE_API_TOKEN` and the existing Account ID/Access secrets unchanged. Never put the value in chat, code, workflow inputs, logs or screenshots.
3. After the secret exists, the operator/assistant can continue the already-authorized Stage qualification. First use the committed offline plan; then run the manual workflow below only for the reviewed source SHA.

## Prepared execution path

- Source: `tools/customer_stage_private_r2_bootstrap_v1.py`.
- Default `--plan`: no credentials and no network.
- `.github/workflows/customer-stage-dedicated-private-r2-bootstrap.yml` supports **workflow_dispatch only**. No push/PR automatic provisioning.
- Exact confirmation: `CREATE_ONE_EMPTY_PRIVATE_CUSTOMER_STAGE_R2`.
- `expected_source_sha` must be the full reviewed commit SHA for that workflow run, matching `GITHUB_SHA`.
- Reuses original Stage resolver at immutable `6b31228887f9073c1aa8c6f2c06597b194f567df`; checks exact original nonpublic OFF Worker, all 11 deployed flags OFF and its separate synthetic D1 before any R2 operation. Worker/D1 checks use the existing token read-only; only R2 gets the separate token.
- Only new bucket: `trendos-customer-stage-private-synthetic-20261103-v0`. Refuses to adopt an existing same-name bucket. One create POST, then verifies managed r2.dev access disabled and no custom domains.
- No object writes, Worker binding/deploy, token/policy modification, billing enrollment, public domain enablement or production data operation. Redirects are disabled so authorization is never forwarded to another host. R2 errors expose only status/numeric codes, never provider messages/credentials.
- Missing/reused secret, nonmanual context, wrong repo/SHA/confirmation, forbidden endpoint, existing bucket or uncertain privacy readback stops; no fallback to the broad token.

11 synthetic tests execute actual helper functions and cover plan-only behavior, missing/separate credentials, incorrect manual context, forbidden storage/ACL/deletion operations, the original 403/10000 condition stopping before create, existing-name rejection, private successful create, public-domain rejection, redirects and the original-source pin. At the earlier source checkpoint there had been no credentialed run; the actual successful run in Latest verified state above supersedes that status.

A new empty private bucket is only the next Stage prerequisite. Native two-account login/draft/private-media E2E, scanner/private viewer and original T12 official-order handoff still need qualification before any customer production activation. Owner-private Sites and paid AI remain unchanged/OFF.


## Verified source checkpoint

[PR348](https://github.com/fawakhry/TrendOs/pull/348) merged to main at `a058653c8a394821e66571960f44ca15205566f1`, tested source `cce86a627d6e2098da026b0007a1de6554fc3121`. Source Actions chat41695917100, readiness41695917092 and P0 mocks41695917087 succeeded; readiness includes all11 Python tests. A separate existing tasks-v3-t1-preview Workers Builds check fails on both source and base; no claim that all external checks passed. At that source checkpoint the manual provisioning workflow had not been dispatched and no dedicated secret or bucket existed; the later verified success above supersedes that historical status. Any later documentation-only main SHA differs: read/verify the full workflow source SHA at dispatch rather than copying this merge SHA blindly.
