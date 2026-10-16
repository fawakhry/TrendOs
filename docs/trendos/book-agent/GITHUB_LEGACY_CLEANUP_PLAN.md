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

Audit 2026 pre-split App Script source against GitHub `Code.gs`, group the 620 AST function declarations (614 line-anchored regex baseline) by module and status, hash/diff source without exposing secrets; scan pre-split file history to tag candidates. After verified archive, produce the **first exact-path deletion proposal** rather than removing all old files speculatively.

## 6. New audit outcome — no validated deletion set yet (2026-10-16)

- **Legacy source identity covered:** 614 of 614 line-leading function names in private V1932 snapshot remain in observed GitHub main source; **zero name-missing cases**. Partial lexical function body review: 604 identical spans, 8 changed, 2 inconclusive. Only a **function-name and text-span comparison**, not a test or deployment claim.
- **Main `Code.gs` history:** 8 path commits observed, with the last September 29 auth bridge adding 10 functions. The 24 August GitHub blob contains seven more names than the private 24 August backup. Sources must not be reduced to one file version.
- **Branch drift:** Book branch `Code.gs` has 10 unique names not in main, including `trendosLegacyOrderCreateFenceV1_` and nine `cwReconcile*`/CloudWrite helpers. **DO NOT auto-merge book branch product code and DO NOT delete these functions as assumed duplicates**.
- **All branch names scanned:** 269 across 3 paginated pages. **Not** equal to inactive/unused: no branch deletions or history rewriting.
- **Private recovery archive produced:** `TrendOS_Legacy_V1932_Private_Archive_20261016.zip`, SHA256 `0eb1a5fe785c2ea07f6338713e1c314da6e10a4e03c3412f3cddcaf4976ca10f`, zip integrity verified. This is conversation-local and not proven offsite saved; raw source not uploaded to public GitHub.
- **Safe decision for first deletion batch:** `CANDIDATES_APPROVED=0`, `FILES_REMOVED=0`, `BRANCHES_REMOVED=0`. Until call-graph, deployment proof, independent private backup and owner approval establish candidates, the right cleanup is **document and preserve, not delete**.

**First exact-path candidates for audit (all `UNKNOWN_NEEDS_PROOF`, none selected for removal):**
`Code.gs`, `v1932-router.gs`, `customer-manager-backend-v1932.gs`, `customer-feedback-backend-v1.gs`, `hr-backend-v1.gs`, `attendance-backend-v1.gs`, `press-control-backend-v1.gs`, `go-live-autopilot-v1.gs`, `.github/workflows/*`. Each can still have deployed consumers/triggers and must stay until proven otherwise.

## 7. First exact mirror audit batch (no removal) — 2026-10-16

Read-only Git tree audit of book branch starting at `2fc7c187247b7b0cbd2e95c58cf1da00838e734b`: **101** duplicate Git blob groups / **202** paths. [All SHA and paths](LEGACY_DUPLICATE_BLOBS_AUDIT_20261016.md). Of these, **9 exact `.gs` mirror pairs** reside under `autonomous-printshop/sources/trendos/` and root; Git SHA equality confirms exact bytes. Potential first **audit-only** cleanup list = nine mirrored paths, **not nine safe deletion approvals**.

- Classification: `UNKNOWN_NEEDS_PROOF` for deletion/ownership and `DUPLICATE_BYTES_VERIFIED` as a separate fact. `CONFLICTING_DUPLICATE=NOT_ESTABLISHED`.
- Before candidate promotion: enumerate Apps Script deployment manifest/project file membership, dynamic calls, make/copy/build/scripts, Git introduction commit, real referenced package path, external service and trigger dependencies, independent encrypted archive and restore test.
- Specific danger: a mirror inside the autonomous printshop may be a required packaging input, even if identical to a root file. Do not move one on the assumption that Git duplicate means orphan.
- Legacy monolith `Code.gs` is **ACTIVE/SHARED/UNKNOWN pending runtime authority evidence**, not a deletion candidate. 614 old names persist in the audited book branch; 12 source spans have changed relative to the private original, 2 parser-boundary cases unresolved. [Diff](LEGACY_V1932_CURRENT_BRANCH_FUNCTION_DIFF_20261016.md).
- Private recovery archive `TrendOS_V1932_Private_Recovery_20261016.zip` SHA256 `faaf42e0bb7cee1e9f94d43bb2a611eeb8c2f2dd286152c2951531bdd39f03dd`, ZIP & member checksums PASS in conversation-local runtime. Raw secret-risk source is **not posted publicly**. Offsite backup and environment recovery are **not verified**.
- `APPROVED_REMOVAL_PATHS=0`; `MOVED=0`; `DELETED=0`; `BRANCHES_DELETED=0`; `MERGED=0`; `DEPLOYED=0`. Next: static call graph + deployment evidence and user-reviewed path list.

### 7.1 Nine mirrored paths provenance enriched

Source bodies inspected for nine root App Script modules and 192 named function declarations counted; last path-affecting Git commit and date, Git blob SHA, module purpose and presence of external API names recorded in [provenance report](LEGACY_FIRST_MIRROR_PAIR_PROVENANCE_20261016.md). No proof of first use, last actual use, deployment project membership or absence of consumers. The corresponding nine autonomous-printshop mirror paths remain **audit-only** and **0** deletions approved; do not equate folder placement with separate-repository migration.

## 8. Disposition of nine mirror audit candidates (2026-10-16)

After validating [SOURCE_REGISTRY plus BUILD_MATRIX references](LEGACY_MIRROR_DEPENDENCY_AUDIT_20261016.md), all nine mirrored `.gs` pairs have **intentional source-to-project reference ownership** and full Git blob parity. They must **not** be placed on a deletion PR: `AUDIT_CANDIDATES_REVIEWED=9`, `REFERENCES_REGISTERED=9`, `BUILD_MATRIX_COVERED=8`, `QUALIFIED_DELETION_CANDIDATES=0`. Root: `SHARED_DEPENDENCY_KEEP` pending proof; central mirror: `SEPARATE_PROJECT_REFERENCE`. The nine historical audit paths remain recorded for traceability; no removal proposed.

Specific missing proof: newest live Apps Script editor file list and deployment version, trigger binding/caller graph, autonomous-printshop build/copy consumption, D1 authority parity, independent encrypted backup with restored source SHA and explicit owner deletion approval. The operator-task module lacks a BUILD_MATRIX path but is explicitly registered and has a non-deployed 2026-09-10 rollout candidate: do not infer stale/non-live today.

Previous textual scan updated from 600 equal/12 different/2 inconclusive to **602 equal/12 different/0 inconclusive** by TypeScript AST-bounded old text ranges + exact current text windows; this is not an approval to refactor changed behavior. `FILES_MOVED=0`, `FILES_DELETED=0`, `MERGED=0`, `DEPLOYED=0`.

### 8.1 Current Code.gs source guards: explicit keep

Review of all twelve path commits of `Code.gs` mapped changes in the twelve original V1932 functions to concrete commit SHAs and dates. [CodeGS lineage ledger](LEGACY_V1932_CODEGS_COMMIT_LINEAGE_20261016.md). Current code has later Cloud Write route integration, order-number allocation fencing and legacy auth-bridge hardening, so **never** treat the old Code.gs or these twelve functions as drop-in restore replacements without behavior and security review. `Code.gs` and related security/order handlers remain `ACTIVE_KEEP/SHARED_DEPENDENCY_KEEP`, `DELETE_APPROVED=0`, `RESTORE_OVER_PRODUCTION=PROHIBITED`.
