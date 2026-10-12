# ACC-199 — Exact-commit source-only PR diff safeguard (2026-10-12)

**Operational status: NO_GO.** This is a PRE-MERGE GUARD for source-only proposals in TrendOS. It does **NOT** merge PRs, deploy Workers, run D1, write accounting data, authenticate employees, qualify a browser SSO session, authorize customer returns or change printshop behavior.

## Verified current proposal scope

Original parent: TrendOS Draft PR #118 head `c97f85f3f4aa2b69c1750aff9f9ee49144827999`. Its upstream parent PR #117 and all Draft #106–#116 remain unmerged. This new downstream source-only proposal changes only one new local Python check, its adversarial offline unit tests, a read-only GitHub Actions workflow, and this staging safety note. All financial history belongs to the **original EasyStore `EASYSTORE_ACCOUNTING_MASTER_BOOK.md`** in EasyStore Draft PR #34; do not record finance stages in TrendOS's generic master book.

## Exact PR check behavior

GitHub Actions `pull_request` explicitly checks out the PR's **exact head commit**, no cached business tokens, `fetch-depth: 0`, and uses the event's **exact base SHA**, rather than a floating branch or shared-base merge. The Python safety gate reads local git commit history and `git diff --no-renames --name-status` ONLY; it refuses a base SHA that is not an ancestor of the checked-out head, mismatched pinned head, unrecognized changes, deletions/renames/symlinks and source trees outside the narrow `scripts/easystore_acc*`, `tests/easystore_acc*`, `docs/trendos/staging/ACC*`, `.github/workflows/easystore-acc*-no-go.yml` allowlist. For a newly modified workflow, it enforces read-only contents permissions and denies secret references, real Wrangler deploy/rollback/remote-D1, git mutation, deploy scripts, chained workflows and Cloudflare deployment actions. It never invokes the dangerous command to evaluate it.

**Historical hazard:** `.github/workflows/easystore-a2-accounting-readonly-api-deploy.yml` is *not safe* merely because its title says "Readonly": it contains real Cloudflare credentials, a floating shared-base merge, remote-D1 and Wrangler deploy/rollback. Static tests deliberately inspect but NEVER execute this source. This tool does **not** disable or protect the old manual workflow from being invoked separately.

## Scope and limitations

This check proves only a **syntactic, conservative local changed-file boundary on that exact PR snapshot**, NOT security of arbitrary Python/JS within allowed paths, not malicious pull-request code trust, not independent code review and **never owner approval**. Inherited legacy workflows and real production code are outside the changed-path check; they remain hazards to evaluate separately. The real manager-selected department allocation drivers and rates remain unfilled in the original EasyStore accounting policy register.

A green CI test is required but never sufficient for merging: re-check head and base against GitHub and all dependent draft approvals; perform independent reviews and original EasyStore accounting-book audit; acquire explicit separately controlled owner authorization for any production change. Changes to the legacy deploy workflow, production Worker, config, D1 migrations, actual user grants or business files are NEVER allowed by this source-only stage.

`G1=OPEN G2=OPEN G3=OPEN G4=OPEN G5=OPEN FINANCE_RELEASE=NO_GO`

**No real accounts, Cloudflare, D1, production jobs, machine settings or finance write was accessed to create this note.**

## Security correction — full PR event coverage and pretest diff check (2026-10-12)

The first version of this security workflow had a `pull_request.paths` filter that could **skip its entire CI check** when a PR changed production/runtime paths without matching the four original script/test/doc paths. A successful run for one source change therefore did **not** prove that unsafe unrelated future changes would trigger the gate. This scope problem has now been corrected **on this Draft source PR**: the `pull_request` trigger is unrestricted, and the **exact head/base diff check runs before adversarial test scripts**.

Static safety policy was extended to **reject new or changed source-only CI workflows** containing GitHub PR `paths`/`paths-ignore` or `branches`/`branches-ignore` filters, since those could suppress safety CI for unreviewed files or targets. Regression tests now read the checked-in guard workflow, reject fake filtered variants and verify the diff step comes before test execution. This is a conservative new-workflow restriction, **not retroactive protection for already inherited workflows**.

**Proof:** [Draft PR #119](https://github.com/fawakhry/TrendOs/pull/119), corrected head `fd22b7551a9637b4b67ee3319ae6abe6f0a7392e`, [ACC199 CI #38280466945](https://github.com/fawakhry/TrendOs/actions/runs/38280466945): **20/20 Python negative/guard tests PASS**, and exact-head diff `PASS_SOURCE_ONLY`, with same-head [ACC196–199 #38280466938](https://github.com/fawakhry/TrendOs/actions/runs/38280466938) and [A61 #38280467045](https://github.com/fawakhry/TrendOs/actions/runs/38280467045) both **SUCCESS**. The preceding 17-test head remains historical evidence only.

**Review caveat:** this test still runs code from a PR source checkout, including the checker itself. An attacker able to change allowlisted files could alter or bypass code inside them. The gate does NOT replace trusted independent review, protected branch rules, code-owner signoff, or runtime deployment safety checks; it does NOT neutralize the legacy manual Cloudflare deploy workflow. Future production/accounting acceptance needs separately trusted controls and explicit owner approval. This code remains **Draft/unmerged**. `G1–G5=OPEN FINANCE_RELEASE=NO_GO`.
