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
