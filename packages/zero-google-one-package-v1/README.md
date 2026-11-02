# TrendOS Zero Google — One Package V1

**One branch · one quality gate · one ZIP artifact · one handoff plan.**

**Status:** `OFFLINE_INTEGRATION_CANDIDATE_NO_DEPLOY`. It is **NOT** an
authorised production release or a complete replacement of Google Apps Script.

## Why this single package exists

The earlier source was spread across stacked Draft PRs. This branch is pinned
on the latest tested Zero Google source descendant, not rebuilt from scratch.
It retains native D1 customer sessions/ownership, original customer browser,
five D1 public-content views, T12 read-only full item/file/quarantine inventory,
offline/localhost private R2/ClamAV signed transport, unchanged EasyStore
balance/statement authority audit, and six Operator routes/BOOK24 writer audit.

Use this **one integration branch** as the future cross-track source candidate.
Do **not** merge every old Draft into `main` independently. `main` and the
old source chain have markedly diverged; any later integration must review
actual merge-base, build graph and conflicts, not blindly open a huge PR.

## Use / reproducible outputs (no Cloudflare or Google login)

From the repository root, with Node 22 and Python 3:

```bash
node tools/zero_google_one_package_v1.mjs
node --test tests/zero_google_one_package_v1.test.mjs
python3 tests/zero_google_one_package_build_v1.test.py -v
python3 tools/build_zero_google_one_package_v1.py \
  --output dist/TrendOS-ZeroGoogle-OnePackage-V1-OFF.zip
```

The builder only includes the exact files in `manifest.json`, rejects path
traversal/symlinks/secret directories and oversized files, embeds SHA256 per
source path in `ZERO_GOOGLE_PACKAGE_INDEX.json` and produces a reproducible
ZIP. It **never** adds secrets, database records, production Cloudflare
config, customer images or real D1/R2/Google data.

Single GitHub Actions entrypoint:
`.github/workflows/trendos-zero-google-one-package-v1-ci.yml`, three safe
verification lanes: unified source/offline tests, local original-browser
Worker/D1/DO test, real local ClamAV synthetic-signature test. After these
lanes pass, a final job emits **one** GitHub Actions ZIP artifact. It is a
source and evidence snapshot; do not deploy its contents as a standalone
production Worker. No automatic deployment or PR merge.

## Release matrix (8 strict gates — all NO_GO until independently verified)

| Gate | Independent decision & evidence |
| --- | --- |
| ZG-CF-01 | Cloudflare support case `02394197`, Oct 30 exact Ray `a52d02962ab3e1d0-MRS`: Access service token evaluation vs intentionally 403 Worker route, least-privilege remedial diagnosis; keep Service Auth and Block Everyone. |
| ZG-STAGE-02 | Owner-approved disposable isolated Stage D1/DO/R2 identity, secure bindings, zero production customer-master move, actual Ubuntu remote E2E, rollback. |
| ZG-SCAN-03 | Authenticated remote private R2 bytes, real isolated D1 replay CAS, genuine trusted fresh ClamAV signature database and signed scanner verdict; no print without all proofs. |
| ZG-T12-04 | Canonical T12 **single writer** accepts entire sealed 1–50 items and correct private file attachments with delegated authority, idempotent COMMITTED readback, no duplicate or lost ACK. The current full-inventory source is NOT submission. |
| ZG-ACCOUNT-05 | EasyStore owner verifies true `customer_id`↔`party_id`, original invoice/receipt exact owner identity and financial parity/freshness. Original 0015 ledger lacks `party_id`; no statement by matching name/code/phone. |
| ZG-BOOK24-06 | Owner inspects **both** Google Script project fingerprints, selected writer, D1/Edge modes/epochs and zero in-flight tasks; proven cross-script/D1 exclusivity; then controlled rollback-enabled migration. Never simply turn off Apps Script. |
| ZG-UI-07 | Approved real Stage original customer UI parity for all **nine** legacy customer actions plus **five** bootstrap content reads, negative authorization tests, retention and rate limits. |
| ZG-RELEASE-08 | Owner signs controlled canary, production backups, monitoring, rollback, plus staged verified actual Google retirement. |

### Hard rules
- **Google customer actions retired in production: last proven 0/9.**
- **Existing Google operator task proxy still needed**, not in those nine.
- Current Cloudflare↔Ubuntu remote Access is unqualified; a localhost signed
  transport PASS is NOT remote proof.
- Source checks passing means only that source safely stays dormant.
- No real customer upload/scan/invoice/order/task performed.
- No original T12, EasyStore, A61, BOOK24, employee or Printshop production
  mutation or migration. Do not move/copy the existing customer master.
- All migrations included in the ZIP are source-only. Never run them against
  production because they appear in a package.
- No automatic activation of Google shutdown, invoice posting, task writer
  migration, T12 printing, deployment, staging or feature flags.

## Original evidence (not equal to live release)
- Customer source freeze: [#294](https://github.com/fawakhry/TrendOs/pull/294) / book #295.
- Private HMAC scanned-byte localhost transport: [#292](https://github.com/fawakhry/TrendOs/pull/292), closed unmerged but source retained through descendant ancestry.
- Customer public-content explicit publication: [#297](https://github.com/fawakhry/TrendOs/pull/297) / book #298.
- 50-item/250-file T12 read-only metadata audit: [#300](https://github.com/fawakhry/TrendOs/pull/300) / book #301.
- EasyStore exact-ID source gap: [#304](https://github.com/fawakhry/TrendOs/pull/304) / book #305.
- Operator/Google/BOOK24 source map: [#309](https://github.com/fawakhry/TrendOs/pull/309) / book #310.
- Actual frozen issues and policy: `docs/trendos/zero-google/ZERO_GOOGLE_PRE_CLOUDFLARE_WAIT_HANDOFF_20261030.md`.
- Original ACTIVE_WRITE `TrendOS_MASTER_BOOK.md` remains the official
  journal. The frozen catalog must not be edited.

## Exact next step after CI is green

Keep this as one tested package. When the owner has authoritative Access
diagnosis and financial/BOOK24/T12 approvals, use a **separate approved**
isolated Stage installation with matching SHA; prove all release gates in
order. Re-run every negative test, original UI E2E and release checklist;
only then propose canary/Google cutover. **Do not infer final completion
from the ZIP artifact.**


## Direct Cloudflare upload without Ubuntu (manual OFF version only)

The cloud service can accept Worker code directly from GitHub Actions via
`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, **without an SSH,
Ubuntu host, Cloudflare Tunnel or Server68 Access Service Token**. The
**separate** Cloudflare–Ubuntu authentication issue in support case
`02394197` therefore does not block code upload.

The dedicated, **manual-only** GitHub workflow
`.github/workflows/trendos-zero-google-cloudflare-direct-stage-upload-only.yml`
uses **`wrangler versions upload --strict`**, NOT `wrangler deploy` or
`wrangler versions deploy`. It targets ONLY
`cloudflare-d1/wrangler.customer-stage.toml` and the unique Worker
`trendos-customer-portal-isolated-stage-v0`, which stays
`workers_dev=false`, `preview_urls=false`, no routes, feature flags OFF,
no D1 or R2 binding to production. A successful upload creates a Worker
**version only**, does not publish client traffic or grant finance/T12/file
printing approval. It does not make the original customer UI live.

**Real prerequisites and operator steps:**
1. Confirm the existing GitHub Actions Cloudflare secrets are **actually
   configured** for the intended account. They are referenced by other
   existing workflows but their existence/permissions is not verified by
   source inspection. Never paste token values into source or the chat.
2. The source is on an independently diverged Draft branch. To make
   `workflow_dispatch` selectable in GitHub Actions, an authorized
   maintainer must first put **only this manually triggered workflow** on
   the repository's default branch by a conflict-aware reviewed change,
   *not* merge the entire old source chain to current production `main`.
3. Go to Actions → **TrendOS Zero Google — Direct Cloudflare ISOLATED STAGE
   Version Upload ONLY** → Run workflow. Select source ref
   `chore/zero-google-direct-cloudflare-stage-upload-v1-20261101`. Supply
   exact current source SHA, expected Cloudflare account ID, and type
   `UPLOAD_ISOLATED_ZERO_GOOGLE_VERSION_ONLY`.
4. The job first checks exact ref, SHA, account, source tree, all Stage
   OFF flags, zero public routes and no production data bindings. It runs
   source guard tests and a local Wrangler bundle dry-run. Only then does
   it attempt the one remote `versions upload`. If the isolated Worker
   does not yet exist, the chosen Wrangler/account does not allow initial
   version creation, or policy/bindings conflict, the job **stops**. It
   **does not fall back to `deploy`**, does not create D1/R2, change
   Access policy or send any customer data.
5. Confirm Cloudflare dashboard has uploaded **version** only and that
   no `workers.dev`/preview/custom route is accessible. Separately plan
   controlled new Stage provisioning/Access/readback before live E2E.
   Record exact version ID, account, SHA and status in ACTIVE_WRITE book.

Check the read-only guard without cloud access:
```bash
python3 tools/zero_google_direct_stage_upload_guard_v1.py
python3 tests/zero_google_direct_stage_upload_guard_v1.test.py -v
```

**Do not treat Source PR, CI green, ZIP, or GitHub Actions secret names as
proof that a Cloudflare version was actually uploaded.** The direct
upload job is opt-in and not executed by the offline package tests.


## Verified isolated Cloudflare D1 Stage — 2026-11-01

The owner authorized initial isolated customer Stage D1 setup. Real direct
Cloudflare run [#41305442428](https://github.com/fawakhry/TrendOs/actions/runs/41305442428)
**SUCCESS** created database
`trendos-zg-customer-stage-synthetic-20261101-v0` in the same Cloudflare
account as the existing nonpublic Worker
`trendos-customer-portal-isolated-stage-v0`. Ten original selected SQL
migrations were applied **only to this fresh D1**, and a single synthetic
`ZG-STAGE-SYNTHETIC-C1` customer (with no login account) was inserted.
A remote D1 query confirmed `fake_customer_count=1`,
`real_enrolled_accounts=0`, `portal_mode=OFF`, `t12_mode=OFF`.

One new D1 binding named `DB` was deployed **only** on that existing isolated
Worker. Separate post-write Cloudflare REST API reads verified that binding's
actual D1 UUID matches the newly created database and that both
`workers.dev` and preview URLs are still disabled. The Stage config still
has zero custom routes, zero production D1/R2 or Google bindings, and all
customer functions OFF. No customer portal login/invoice/T12/Printshop/Google
production feature has been switched.

### Safeguard on future uploads (required)

The original checked-in `cloudflare-d1/wrangler.customer-stage.toml` is
intentionally **without** any account-specific D1 UUID and must NOT be used
directly for a future remote `wrangler deploy` or `wrangler versions upload`:
doing so may drop the currently deployed isolated D1 binding.

Instead the existing manual-only version-upload workflow calls
`tools/zg_customer_stage_d1_binding_resolver_v1.py` before upload. The resolver
performs ONLY authenticated read-only Cloudflare Worker subdomain/settings/D1
inventory calls, independently verifies that the Worker is nonpublic, that
there is exactly one `DB` D1 binding and it belongs to the exact isolated
synthetic database, then writes a temporary Wrangler config with that UUID
inside the CI runner's private filesystem. It never prints token values or
database UUID, never updates Cloudflare, and deletes its temporary file after
upload. If any identity, binding, route, token or database lookup fails,
**do not upload** or fall back to public deployment.

Run the offline negative test before changing any upload workflow:
```bash
python3 tests/zg_customer_stage_d1_binding_resolver_v1.test.py -v
```

This real remote Stage is not publicly accessible; remote browser/login E2E
has **not** been performed. Such tests require a separate explicitly approved
private Stage ingress, synthetic authenticated enrollment and policy gates.
Ubuntu Access case `02394197` remains independent and unmodified.


## Private ingress capability and Access API 403 — 2026-11-01

After explicit owner `نفذ` authorization for a **private, authenticated**
remote customer Stage test, we performed fresh *live Cloudflare read-only*
checks and a narrowly scoped fail-closed attempt to create an Access
**DENY ALL** policy for the already-existing isolated Worker. This is
separate from the old Server68 Cloudflare↔Ubuntu support case #02394197.

**Real findings:** [Access inventory run #41317011523](https://github.com/fawakhry/TrendOs/actions/runs/41317011523)
`SUCCESS`: exact Worker `workers.dev=false`, previews=false,
one exact synthetic D1 binding, account Access applications GET HTTP 200,
Access service token inventory GET HTTP 200, and **zero existing
Worker-specific Access applications**. No public URL enabled.

[Access DENY ALL attempted run #41317159101](https://github.com/fawakhry/TrendOs/actions/runs/41317159101)
`FAILURE`: exact Worker immutable ID and isolated D1 confirmed,
no existing matching Access app, but `POST /accounts/{account_id}/access/apps`
returned **HTTP 403**, **before any Access app was created**. Cloudflare
requires `Access: Apps and Policies Write` permission for this endpoint.
The current GitHub CI token has read access but its effective ability to
create apps is denied. Do **not** use the unrelated production/Ubuntu
Access app or bypass existing policies. Temporary read-only and
single-attempt write workflows were removed after diagnosis; no retries.

**Cloudflare documentation:** Worker-level `destinations:[{type:"worker",
worker_id:<immutable Worker ID>}]` Access policy protects all requests to
that exact Worker; preview/deployment URLs are **public by default** until
Access protection is verified. We did not enable any URL, any Worker
feature flag or test login/password.

**Required controlled unblock (no secrets in code/chat):**
1. Cloudflare account administrator should create a separate least-privilege
   API token scoped to the **same Cloudflare account**, with
   `Access: Apps and Policies Write`; for automated private Service Auth
   testing also `Access: Service Tokens Write`. Store it as an appropriately
   restricted GitHub Actions secret, preferably a new
   `CLOUDFLARE_ACCESS_API_TOKEN`, **not** pasted into chat or committed.
   Alternatively protect only the exact Worker via dashboard
   Workers & Pages → isolated Worker → Access → Protect Worker.
2. Protect the **immutable Worker ID**, not a production hostname or all
   Workers. Require one narrowly approved **Service Auth** policy tied to
   one dedicated, expiring Access service token. No `bypass`,
   `any_valid_service_token`, everyone allow, public override or reusable
   production token. Check Cloudflare API readback of app, Worker ID, policy
   and token ID before any route enablement.
3. Only after that may a separate approved run temporarily enable a private
   route, enroll **two synthetic customers only**, and test real Worker
   login, cross-tenant order and draft ownership, then disable the route and
   test flags, clean temporary credentials and verify rollback. Never expose
   synthetic passwords/tokens. Keep production D1/R2, Google tasks and T12
   writers unchanged.

**Permanent checked-in release guard:** 
`tools/zg_customer_private_ingress_access_guard_off_v1.py` with
`tests/zg_customer_private_ingress_access_guard_off_v1.test.py`
fail-closes on missing Access, public bypass, wrong Worker ID, mismatched
D1, public preview/routes or enabled customer features. Its synthetic PASS
is only source validation; actual live private Access protection and
remote original browser E2E are still **NOT VERIFIED**.

**Current release gate:** Stage Worker/D1 remote = PASS, public URLs OFF,
Cloudflare Access app write = 403 BLOCKED, real remote private customer E2E
NOT EXECUTED, live customer Google actions retired last-proven 0/9.

### 2026-11-02 source-only Access selector strictness

The private-ingress qualification now rejects an Access policy include entry
that mixes the single expected `service_token.token_id` with `everyone`,
`any_valid_service_token`, or any other extra selector fields, including
unexpected fields inside the token object. Cloudflare Access include selectors
can create broader matches; a structurally valid token ID alone must never
mask an extra potentially permissive selector. This is **fail-closed** even
for unrecognized future API response shapes.

This change is strictly source/test hardening on draft PR #316, not an Access
permission grant, production deploy, private route opening, remote E2E,
or customer Google retirement. The previously observed Access app create
HTTP 403 remains the account-side blocker; do not retry it without the
correct administrator-approved Access permission. Run
`python3 tests/zg_customer_private_ingress_access_guard_off_v1.test.py -v`
and the existing one-package CI for exact-head source evidence.

