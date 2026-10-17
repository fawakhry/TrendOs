# TrendOS Legacy — Code.gs twelve-commit function evolution ledger

> 2026-10-16. GitHub source history only. No secrets, literal function bodies, tokens, customer payloads or active runtime claims are included.

- Repository: `fawakhry/TrendOs`, work branch `agent/trendos-book-audit-v1-20261014`.
- Read `GET /commits?sha=<work branch>&path=Code.gs` and then fetched **all 12** historical `Code.gs` blobs at the returned commit SHAs; **12/12 fetched successfully**.
- Earliest retrieved path commit: `9168e4ad15b68ee554504ad696f677fe027a6071` (2026-08-11). This is a baseline of observed path history, **not proof of the original creation of TrendOS**.
- Latest path commit: `4d5ef491af4e24baf01ed1f98ae0f298f2874785` (2026-10-01), source blob `e91d78dcceeeca2804e721d58e065a6a7181bfc2`, identical to the previously retrieved work-branch `Code.gs` blob.
- Compared twelve designated functions by a lexical named-function span extractor across each successive GitHub `Code.gs` revision. This determines historical **text changes**, not behavioral equivalence, AST-level scope validity or deployment.

## Exact path-commit lineage for the twelve changed functions

| Commit SHA | Date (UTC) | Source comparison event | Function names affected in this audit subset |
|---|---|---|---|
| [`9168e4ad15b6`](https://github.com/fawakhry/TrendOs/commit/9168e4ad15b68ee554504ad696f677fe027a6071) | 2026-08-11 | baseline first path commit | `getTrendMasterCenterV1931_ not yet present` |
| [`e69e1c967643`](https://github.com/fawakhry/TrendOs/commit/e69e1c96764394dc62a549a6da939ff04005c543) | 2026-08-12 | changed | `createManualOrder_` |
| [`76f1917b58d6`](https://github.com/fawakhry/TrendOs/commit/76f1917b58d6b225bb6303fe48a285da8dd56b04) | 2026-08-12 | changed | `createManualOrder_` |
| [`aac6cdc7d575`](https://github.com/fawakhry/TrendOs/commit/aac6cdc7d575921818b2c121daa1a579e1dbdc5e) | 2026-08-12 | changed | `syncOrderFromLines_`, `appendLine_`, `getRows_`, `createManualOrder_` |
| [`486eba480daa`](https://github.com/fawakhry/TrendOs/commit/486eba480daa77a3c1bd9f25aa235b8a4e85a28e) | 2026-08-12 | changed | `doGet`, `createManualOrder_` |
| [`61e774639c5f`](https://github.com/fawakhry/TrendOs/commit/61e774639c5f1443dc8149e467586a10d7cfe8df) | 2026-08-12 | changed, plus name appeared | `doGet`, `getRows_`, `createManualOrder_; ADDED getTrendMasterCenterV1931_` |
| [`a39fe9a0dde6`](https://github.com/fawakhry/TrendOs/commit/a39fe9a0dde62232a9f25db92c4697e07af158e9) | 2026-08-24 | changed | `doGet`, `doPost`, `syncOrderFromLines_`, `getMatbagyNotes_`, `saveAccountingDeptLine_`, `appendLine_`, `getRows_`, `getTrendMasterCenterV1931_`, `saveCustomerAccountMovementV1915_`, `createManualOrder_` |
| [`47c12e4a121f`](https://github.com/fawakhry/TrendOs/commit/47c12e4a121f996d568bec224742b3a3f2ff71b0) | 2026-09-04 | changed | `doGet` |
| [`2fd41374cf62`](https://github.com/fawakhry/TrendOs/commit/2fd41374cf62b5b7c111270684dc52e8a1731d4f) | 2026-09-28 | changed | `doGet`, `makeOrderId_` |
| [`97b58fb75cb9`](https://github.com/fawakhry/TrendOs/commit/97b58fb75cb912155b5f3a89b2b96e50fce540bf) | 2026-09-29 | changed | `authorize_` |
| [`ddf4358b3443`](https://github.com/fawakhry/TrendOs/commit/ddf4358b3443d9691047e667a7d5bba59dc8b806) | 2026-09-29 | changed | `doPost`, `authorize_` |
| [`4d5ef491af4e`](https://github.com/fawakhry/TrendOs/commit/4d5ef491af4e24baf01ed1f98ae0f298f2874785) | 2026-10-01 | changed | `authorize_` |

## Main result

- The 24 August 2026 Apps Script private original is not byte-identical to GitHub current Code.gs, including changes already present in GitHub at the same calendar date. Eight changed textual spans were originally identified against the historical Aug-24 GitHub blob, and twelve span changes exist against the more recent branch version.
- Significant later code history includes `doGet`/Cloud Write dry-run routing at `47c12e4...`, `doGet` plus `makeOrderId_` allocator fencing at `2fd4137...`, employee bridge authorization changes at `97b58fb...` and `ddf4358...`, and stale-token auth handling at `4d5ef49...`. **These summaries follow commit titles and observed named spans, not runtime tests.**
- `getTrendMasterCenterV1931_` first appeared *within the fetched Code.gs path-history subset* at `61e774639c5f1443dc8149e467586a10d7cfe8df`, 2026-08-12; first appearance in GitHub path does not equal first function existence in all backups.
- Original private V1932 function-name scan reconciled in latest pass: `602` exact text spans, `12` changed, `0` previously inconclusive after AST-bounded recheck, `0` private-only named functions. See [current branch diff](LEGACY_V1932_CURRENT_BRANCH_FUNCTION_DIFF_20261016.md) and [mirror retention](LEGACY_MIRROR_DEPENDENCY_AUDIT_20261016.md).

## Important safety interpretation

- Do not restore the older entire script or replace newer authorization and order-ID allocation guards merely to obtain similarity with the V1932 backup.
- Later lineage means these changes may be security-critical or current-workflow-critical; current route consumers and external deploy state still unknown. All twelve updated function bodies are retained, `ACTIVE_KEEP/SHARED_DEPENDENCY_KEEP` until a validated authority migration.
- Unavailable evidence: actual Apps Script project-version source, trigger wiring, live requested action distribution, secret-safe full AST semantic equivalence of both sources. No branch deletion, merge, deployment, or source-code modification.

Status: `SOURCE_ONLY=YES`, `12_REVISION_BLOBS_FETCHED=YES`, `12_CHANGED_FUNCTIONS_LINEAGE_MAPPED=YES`, `TESTED_RUNTIME=NO`, `PRODUCTION_VERIFIED=NO`, `DELETION_APPROVED=0`.
