# ACC-183 — Real pinned Wrangler Worker dry-run bundle and immutable offline SHA receipt

**Date:** 2026-10-10
**Stage:** G5 pre-release **source-only** build verification, without real Cloudflare deployment.
**Result:** **WRANGLER_DRYRUN_BUNDLE_PASS; FINANCE_RELEASE_NO_GO**.

## Why ACC-183 is necessary

ACC-182 reconciled both active source branches into a real temporary `git merge --no-commit` tree, proved exactly two native employee-auth `wrangler.toml` source-flag differences and tested native finance/stock/custody with shared customer and auth code. However, ACC-182 **did not verify that the exact merged Worker can be bundled using the production workflow's pinned Wrangler compiler**. ACC-183 closes this *specific offline build gap*, not actual release readiness.

Source accounts remain read-only and production frontend financial writes OFF; owner elected a new zero-history finance book with its start date **chosen only at a separately authorized actual go-live**. No deployed Finance GENERAL, staff grants or cutover is approved.

## Actual implementation

- `.github/workflows/easystore-acc183-wrangler-dryrun-no-go.yml` repeats the original ACC-182 pinned T12 source checkout, exact original accounting branch head, disposable three-way git merge, correct lossless original `:1/:2/:3` master-book resolution, actual Worker ACC-170/174/175 migrated-SQLite/verified-fake-principal tests, and shared T12 customer/auth route checks.
- After the ACC-182 exact, NO_GO source receipt, runs **real Wrangler 4.33.2** via `npx --yes wrangler@4.33.2 deploy --dry-run --config [merged cloudflare-d1/wrangler.toml] --outdir [temporary]` with `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CF_API_TOKEN` all empty and no secrets mapped into the job. `--dry-run` builds the Worker locally; there is **no production deploy**. The version matches the old manual deployment workflow's `WRANGLER_VERSION:4.33.2`.
- `scripts/easystore_acc183_wrangler_dryrun_bundle_receipt.py` verifies accounting/shared SHA-40 and actual uncommitted merged-tree SHA **against the existing ACC-182 receipt**, checks the pinned compiler version, and fingerprints every local generated bundle file by SHA-256 and byte length. It requires compiled JavaScript with finance route + supplier payment and custody markers, source-only auth/nondeployment guard fields, no planned finance date and `NO_GO`. Binary dump, bundled source, source maps, database backups, personal financial data and Cloudflare secrets **are not uploaded**; the workflow stores only a 14-day non-sensitive JSON receipt.
- `tests/easystore_acc183_wrangler_dryrun_bundle_receipt.test.py` injects wrong Wrangler version, invalid source/tree SHA, missing finance marker, forged backup/rollback/grant/GO, bad path/oversize/empty file and unwanted extension, all rejected. These checks never call Cloudflare or D1.
- Pinned shared source: `7d20cfc463ce084ceaba8ac440dffa53512fe662` at test time; any source commit or resulting merge tree changes require re-running the check. A successful build is **not** a signed immutable deployment artifact.

## Executed evidence

- Initial [ACC-183 run #38082742180](https://github.com/fawakhry/TrendOs/actions/runs/38082742180) and diagnostic [#38082795509](https://github.com/fawakhry/TrendOs/actions/runs/38082795509): real Wrangler compilation already **PASS**, but the local fingerprint checker refused `README.md` emitted by Wrangler because its extension whitelist did not include `.md`. The diagnostic run established actual output **README.md (115 B), index.js (1,039,708 B), index.js.map (1,597,605 B)**, with no deployment.
- The receipt checker was corrected to accept the actual Wrangler `.md` informational output while still rejecting unrecognized file types and recording strict local hashes.
- **[ACC-183 fully successful GitHub Actions #38082851633](https://github.com/fawakhry/TrendOs/actions/runs/38082851633)**, job `114303166313` on source `a1448e3a9ba4058fd01f4d520f79910aecb2d130`, with exact local original and merged Worker tests:
```
ACC183_SOURCE_SHA_WRANGLER_VERSION_AND_BUNDLE_PATH_NEGATIVES=PASS
ACC183_MISSING_FINANCE_ROUTE_AND_SQL_MARKERS_DENIED=PASS
ACC183_FALSE_PRODUCTION_BACKUP_ROLLBACK_AUTHORIZATION_GO_DENIED=PASS
ACC183_WRANGLER_BUNDLE_DRY_RUN=PASS
ACC183_NO_PRODUCTION_CREDENTIALS_IN_RUNNER=PASS
ACC183_DEPLOYMENT=NOT_EXECUTED
ACC183_PINNED_ACTUAL_WRANGLER_DRYRUN_BUNDLE=PASS
ACC183_BUNDLE_COUNT=3
ACC183_SOURCE_AND_BUNDLE_FINANCE_MARKERS=PASS
ACC183_PRODUCTION_WORKER_DEPLOY=NOT_EXECUTED
ACC183_RELEASE_DECISION=NO_GO
ACC183_PRODUCTION_MUTATIONS=ZERO
```

## What remains open

The old manual production deployment workflow still **fetches a floating latest shared branch** and blocks overlapping master-book histories. ACC-178/182/183 solve source-only reconciled merge/build in temporary CI **but do not authorize editing, bypassing or dispatching the old deploy action**. Need owner-reviewed plan to pin an immutable actually approved release candidate and qualify both all-family runtime integration and emergency rollback against a verified previous deployed Worker version.

G5 still requires a **real protected database export or provider backup**, independent isolated full restore, reconciliation of old operating state and monitored rollback; a Worker code rollback does **not** roll back D1 business mutations. G1 controlled actual authenticated A2.13 custody-close, G2 owner-approved employee role matrix (issue #40), G3 zero-import opening/physical stock/cash and launch-date signoff, G4 accepted real financial cycles all remain OPEN. Production backend stays READONLY, frontend OFF, owner start date unset.

**Do not deploy, dispatch, change Cloudflare secrets, amend finance production database, activate G1, change user permissions, or infer any business transaction acceptance from this synthetic/offline compilation.**
