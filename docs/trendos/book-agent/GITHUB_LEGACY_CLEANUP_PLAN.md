# GitHub cleanup after pre-split legacy recovery — controlled plan

> OWNER DECISION · 2026-10-16. **The goal is a tidy active GitHub, not deleting the history or current service code.** All actions in this phase are **inventory/documentation + protected archive ref only**. Do not delete/move any active file, workflow or branch just because it is old, or because a different project now owns a feature.

## 0. Current safety checkpoint (completed)

- Created and read back [`archive/trendos-before-legacy-cleanup-20261016`](https://github.com/fawakhry/TrendOs/tree/archive/trendos-before-legacy-cleanup-20261016) at SHA `6b82fd3bf00eb80669a3b5ca14ff8eab420a6074`, exactly the `main` SHA observed before cleanup. **This is GitHub-only snapshot, NOT an independently tested offsite backup.**
- Existing `docs/trendos/book-agent/CURRENT_TREE_BASELINE.md` inventories 1,995 blobs in a 2026-10-14 snapshot (2070 nodes, truncated=false); categories include 409 workflows, 291 code/config candidates, 256 tests, 233 separate project files, 29 migration candidates, 762 docs/history. These are **path classifications only**.
- A full legacy V1932 Apps Script source is recovered in ChatGPT Library, size/hash listed in `LEGACY_SOURCE_RECOVERY_REGISTER.md`; credential-like patterns flagged for private review. **No raw V1932 source in public GitHub.**
- Matbagy-Design-Workflow historical repo was already migrated with 146 files/263 canonical commits backed by a bundle into private `fawakhry/Matbagy-OS`. Do NOT recreate, delete or import it again.

## 1. Cleanup decision categories (assigned at file level)

| Type | Criterion | GitHub operation *after* verification |
|---|---|---|
| `ACTIVE_KEEP` | Exists in active build/deploy/auth/Workflow/route or referenced runtime | Keep in original active path; document owner and version |
| `SHARED_DEPENDENCY_KEEP` | Used by TrendOS and independent service or needed for upgrade/recovery | Keep current import path until safe replacement and regression |
| `LEGACY_ARCHIVE_CANDIDATE` | Historical-only with no active references; immutable code/history restored elsewhere; no live workflow | Proposal to move to `archive/legacy/... ` or retire from working tree via Draft PR after approval |
| `SEPARATE_PROJECT_REFERENCE` | Current ownership in EasyStore/Fokha/Matbagy-OS/other repo; TrendOS copy obsolete **proven** | Keep link/contract in book; migration and deletion only if hash-parity and import-boundary safe |
| `CONFLICTING_DUPLICATE` | Same module duplicated with different SHA or API contract | Resolve authority and test behavior, not `rm` by file name |
| `SENSITIVE_CODE_PRIVATE_ARCHIVE` | Apps Script / source/backup might contain credentials, customer files or proprietary private code | Archive **privately**, sanitized summaries/provenance only in public book |
| `UNKNOWN_NEEDS_PROOF` | No validated live usage and/or ownership | Keep untouched until resolved |

## 2. Packages to triage (NO deletions committed)

1. **Original Apps Script and root UI**: `Code.gs`, `v1932-router.gs`, attendance/clockin, HR, cleaning, press, customer manager, customer feedback, autopilot, frontend `app.js/index.html/styles.css/config.js`. Split by function + old-version provenance; **current worker/Legacy dependency may still call them**, so cannot remove without call-graph and deploy proof.
2. **Old migration artifacts**: `cloudflare-d1/migrations/` + many snapshot/diagnostic scripts; move only after schema version/history/recovery checks. Historical SQL might be required for clean DB setup, and deleting it could break deployment.
3. **Workflows**: 409 path-inventory candidates are not 409 obsolete workflows. Check `on:`, scheduled triggers, actions references, required-checks, secrets, deploy paths, all recent run versions before retiring anything.
4. **Separate project material embedded in TrendOs** (`autonomous-printshop/*` etc): compare authoritative project book, branch, HEAD, imports and current workers. Do **not** assume all embedded code is a copy; some may be the deployed canonical source.
5. **Original guidance/routers**: `FOKHA_BRAIN.md`, `صندوق_مطبعجي.md` and README redirect users to current owner; mark `KEEP_ROUTER` until replacement tested, **not automatic deletion candidates**.
6. **Other GitHub repos**: `Matbagy` Photo Sheets and `trendos-lead-hunter` may contain old functions but stand alone. No cleanups in their repos without separate review.
7. **External Apps Script / Drive**: inspect source version, deploys and SHA history; sensitive/private originals stay privately archived. Register missing backups as missing, not silently discard.

## 3. Archive and deletion gates

**PHASE A — inventory now:** collect all reachable GitHub repos and branches with pagination, blob hashes, selected original code/functions; Drive/Library metadata and private source hash. Index into **[`TRENDOS_LEGACY_PRE_SPLIT_BOOK.md`](TRENDOS_LEGACY_PRE_SPLIT_BOOK.md)** and [`LEGACY_SOURCE_RECOVERY_REGISTER.md`](LEGACY_SOURCE_RECOVERY_REGISTER.md). This phase may be completed docs-only.

**PHASE B — provenance scan:** for each candidate file, determine `FIRST_COMMIT`, `LAST_ACTIVE_REFERENCE`, `CURRENT_DEPLOYED_VERSION`, `OWNER_PROJECT`, `BACKUP_LOCATION`, `SECRET_SCAN_STATUS`, `RESTORE_TEST_RESULT`. The pre-split boundary date has to be inferred from actual commits and decisions; don't invent a partition cutoff date.

**PHASE C — independent verified archive:** duplicate all code about to disappear into a durable **private** archive, Git bundle or protected tag **outside the repo being cleaned**. Preserve old filenames, licenses, non-secret history, exact source and output hashes. Verify restore/diff. A snapshot branch inside TrendOs is additional defense, not the only archive.

**PHASE D — dry-run PR, approval:** produce a Markdown manifest of exact candidates: `path | former SHA | new immutable archive pointer | current imports | deployment owner | rollback method | approved_by`. Send the owner the actual list and proposed removal diff. Only with **explicit approval of that concrete deletion set** prepare a removal PR. No mass `git clean`, `rm -rf`, `git filter-repo`, force push or history rewriting.

**PHASE E — stage/check/merge under authorization:** after API tests, UI checks, workflow health, docs checks and version parity, apply small batches and validate no blocked production path. Book agent has no Merge or Deploy mandate. Never close source recovery gaps because the current runtime no longer uses a module.

## 4. Measurable progress fields

`repo_count_visible=8` · `trendos_historical_source_bytes_fingerprinted=731855` · `original_v1932_line_regex_declarations=614` · `original_v1932_ast_declarations=620` · `matbagy_design_workflow_sources_migrated=146` · `protected_snapshot_branch=CREATED_VERIFIED` · `external_sources_fully_recovered=NO` · `offsite_backup_verified=NO` · `files_removed=0` · `branches_deleted=0` · `production_code_changed=NO` · `actual_cleaning_approved=NOT_YET_REQUESTED`.

## 5. Next concrete batch

Audit 2026 pre-split App Script source against GitHub `Code.gs`, group 614 function definitions by module and status, hash/diff source without exposing secrets; scan pre-split file history to tag candidates. After verified archive, produce the **first exact-path deletion proposal** rather than removing all old files speculatively.

## 6. New audit outcome — no validated deletion set yet (2026-10-16)

- **Legacy source identity covered:** 614 of 614 line-leading function names in private V1932 snapshot remain in observed GitHub main source; **zero name-missing cases**. Partial lexical function body review: 604 identical spans, 8 changed, 2 inconclusive. Only a **function-name and text-span comparison**, not a test or deployment claim.
- **Main `Code.gs` history:** 8 path commits observed, with the last September 29 auth bridge adding 10 functions. The 24 August GitHub blob contains seven more names than the private 24 August backup. Sources must not be reduced to one file version.
- **Branch drift:** Book branch `Code.gs` has 10 unique names not in main, including `trendosLegacyOrderCreateFenceV1_` and nine `cwReconcile*`/CloudWrite helpers. **DO NOT auto-merge book branch product code and DO NOT delete these functions as assumed duplicates**.
- **All branch names scanned:** 269 across 3 paginated pages. **Not** equal to inactive/unused: no branch deletions or history rewriting.
- **Private recovery archive produced:** `TrendOS_Legacy_V1932_Private_Archive_20261016.zip`, SHA256 `0eb1a5fe785c2ea07f6338713e1c314da6e10a4e03c3412f3cddcaf4976ca10f`, zip integrity verified. This is conversation-local and not proven offsite saved; raw source not uploaded to public GitHub.
- **Safe decision for first deletion batch:** `CANDIDATES_APPROVED=0`, `FILES_REMOVED=0`, `BRANCHES_REMOVED=0`. Until call-graph, deployment proof, independent private backup and owner approval establish candidates, the right cleanup is **document and preserve, not delete**.

**First exact-path candidates for audit (all `UNKNOWN_NEEDS_PROOF`, none selected for removal):**
`Code.gs`, `v1932-router.gs`, `customer-manager-backend-v1932.gs`, `customer-feedback-backend-v1.gs`, `hr-backend-v1.gs`, `attendance-backend-v1.gs`, `press-control-backend-v1.gs`, `go-live-autopilot-v1.gs`, `.github/workflows/*`. Each can still have deployed consumers/triggers and must stay until proven otherwise.
