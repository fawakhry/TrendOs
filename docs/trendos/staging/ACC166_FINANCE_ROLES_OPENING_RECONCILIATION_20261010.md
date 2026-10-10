# ACC-166 — Financial role trust-boundary and opening-balance reconciliation
Date: 2026-10-10 | Branch: audit/acc166-permissions-opening-readonly-20261010
Status: **G2/G3 PENDING; PRODUCTION FINANCE NO-GO**.

## Scope / actual findings
- ACC-165 is already merged in PR #46; no ACC-162/163 repeat and no old financial/supplier pilot replays.
- Inspected `cloudflare-d1/src/employee-accounting-native-v1.mjs` and native auth source. The current finance-mode resolver mixes the authenticated session role with legacy name/department hints. **Correction ACC-167:** its `b.role` / `b.department` fallback comes from `v.body`, the *verified session response*, not the raw browser request body. A forged client role does not override a trusted role in the isolated negative test. This is a potential authorization boundary weakness pending owner-reviewed mapping, not proof of a real account breach.
- New `tests/easystore_acc166_role_boundary_audit.test.mjs` exercises actual checked-in mode/permission functions in an isolated VM with synthetic employee records, checks presence of the session verification path and reports the role source risks as NO-GO. No real tokens, users or finance API requests.
- Employee financial grants are not changed. Issue #40 remains open for identity/role mapping, negative scenario signoff and controlled safe server hardening.

## G3: new executable private-data reconciliation tool
- `scripts/easystore_acc166_opening_reconcile.mjs`: offline-only per-entity comparator requiring a cutover date, authoritative source reference, target snapshot reference, ownerApproved=true and each row's evidence reference.
- Categories: customer receivables, supplier payables, inventory quantity, inventory value, cashbox, custody. Exact entity-key + amount matching at 4 decimal places, no inference from aggregate sums.
- Fail-closed for an empty source, missing category, duplicate keys, nonnumeric amounts, missing source/target entries, missing approval, or mismatches. Prints only aggregate result, never business names or balances.
- `tests/easystore_acc166_opening_reconciliation.test.mjs`: six-category SYNTHETIC fixture proves valid matching and rejects no-approval, missing reference, mismatches, omissions, duplicates and empty input.
- Private local example invocation: `node scripts/easystore_acc166_opening_reconcile.mjs /private/finance/snapshot.json`. Input format: `{ "manifest": {"cutoverDate":"YYYY-MM-DD","authorityRef":"reference","targetSnapshotRef":"reference","ownerApproved":true}, "source": [{"category":"customer_receivable","id":"private-key","sourceRef":"document-reference","amount":0}], "target": [...] }`. Supply all six categories with real per-entity records in PRIVATE files. Never commit actual account data into the public repo.
- A previous sampling of 21 legacy Sheets tabs and 60 rows is not authenticated cutover reconciliation. Google Drive search did not identify a clearly authoritative old accounting source by finance/EasyStore/suppliers terms. Therefore no source, cutover or zero opening is assumed; G3 remains unclosed and migration necessity unresolved.

## Tests and security boundary
- `.github/workflows/easystore-acc166-permissions-opening-readonly.yml` runs Node source tests and synthetic offline matching on push/PR. No Cloudflare token, Wrangler, D1 query, worker publish or finance POST.
- GitHub Actions run/conclusion to be recorded after real verification, never described as a live financial acceptance.
- Manual money-moving A2.13 workflow remains unchanged, with missing published bootstrap check before arming. It must not be dispatched or bypassed.
- Last independently observed production: frontend OFF, accounting READONLY, zero commands. No new production validation by this commit.

## Next actions / acceptance
1. G1: separately authorized maintainer installation of browser boot pre-arm gate, then freshly scoped one-command authenticated A2.13 zero-value pilot, audited D1 SELECT and rollback proof. NO LIVE RETRY in ACC-166.
2. G2: owner approves exact trusted employee IDs/roles/actions; implement fail-closed role policy, negative authorization matrix CI and controlled safe release. Do not infer approved roles from client names.
3. G3: identify signed authoritative financial source + cutover; privately supply source and matching D1 READ-ONLY snapshots; reconcile or validate controlled migration, only with separate explicit approval.
4. G4-G5 still require real integrated financial acceptance, backups, tested rollback and handover.
**Five original acceptance gates remain; G2 and G3 tooling progress does not count as closure.**

## GitHub Actions verified evidence (ACC-166)
- [PR #47 ACC-166 read-only CI run 38067717669](https://github.com/fawakhry/TrendOs/actions/runs/38067717669), job `114258659380`: **SUCCESS**. `ACC166_TRUSTED_ROLE_BASELINE=PASS`, `ACC166_ROLE_BOUNDARY_AUDIT=REVIEW_REQUIRED`, `ACC166_ROLE_RELEASE=NO_GO`, `ACC166_FINANCE_REQUESTS=ZERO`.
- Same CI: `ACC166_OPENING_EXACT_ENTITY_RECONCILIATION_SYNTHETIC=PASS`, `ACC166_OPENING_OWNER_APPROVAL_MISSING_FAIL_CLOSED=PASS`, `ACC166_OPENING_REAL_FINANCE_DATA=NOT_VERIFIED`.
- Initial push [run 38067644386](https://github.com/fawakhry/TrendOs/actions/runs/38067644386) succeeded. PR-triggered [ACC-165 SAFE-IDLE recheck 38067717570](https://github.com/fawakhry/TrendOs/actions/runs/38067717570) and independent [A61 browser transport regression 38067717699](https://github.com/fawakhry/TrendOs/actions/runs/38067717699) both completed successful jobs. These were normal PR checks, not repeat financial canaries.
- Production authority has NOT been opened. Synthetic pass / source audit are NOT proof of live financial authorization.
