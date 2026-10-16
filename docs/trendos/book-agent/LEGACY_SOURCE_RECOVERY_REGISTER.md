# Legacy source recovery register — original Matbagy / TrendOS before project split

> 2026-10-16 · **SOURCE INVENTORY / CODE-PROVENANCE ONLY.** Goal: aggregate historic code and source evidence outside TrendOs, without hijacking books/current ownership of later independent projects. Links to private repositories require the owner's access. No secrets, customer data, Drive raw source or employee credentials are copied into this public register.

## Source status legend
- `SOURCE_OBTAINED`: bytes read and fingerprinted.
- `GIT_VERIFIED`: GitHub repository/ref/blob actually read; provenance and relevance to pre-split system may still need testing.
- `MIGRATED_ARCHIVED`: migration report and archive history exist, no duplicate import authorized.
- `METADATA_ONLY`: located external item but did not inspect raw code.
- `HISTORICAL_NOT_FOUND`: prior discussion names a source, currently unavailable via connected accounts.
- `INDEPENDENT_PROJECT`: do not copy live project content into TrendOS old book.
- `NEEDS_REVIEW`: code ownership/date/active dependency unknown.

## 1) Owner repositories — visible at audit time

| Repo | `main` HEAD at 2026-10-16 check | Preliminary relationship to legacy TrendOS | Action |
|---|---|---|---|
| [TrendOs](https://github.com/fawakhry/TrendOs) | `6b82fd3bf00eb80669a3b5ca14ff8eab420a6074` | **Primary mixed source**: Legacy Google Apps Script, order/employee/finance/UI code, modern Cloudflare and split project material | GIT_VERIFIED; per-path inventory before cleaning |
| [Matbagy](https://github.com/fawakhry/Matbagy) | `8536c300ec1dab56968a1f937e879b2bbc47a5c9` | Separate Photo Sheets tool (README explicitly says **not** Design Cases memory), possibly historically related to production/design | GIT_VERIFIED; don't merge current ownership |
| [EasyStore](https://github.com/fawakhry/EasyStore) | `373d06381594e3ab32a55009fcc74907b1c37c9c` | Current financial project with own book | INDEPENDENT_PROJECT; historical references only |
| [Matbagy-OS](https://github.com/fawakhry/Matbagy-OS) | `577340d798ea89247434ae8047d1b500f81c35f2` | Private independent SaaS; contains verified migrated Design Workflow original archive | MIGRATED_ARCHIVED; no duplicate live code |
| [Fokha](https://github.com/fawakhry/Fokha) | `5e0e7b5ba1eee90813c2a909a4aaf461eb49ee10` | Private independent AI memory/orchestration; TrendOs FOKHA_BRAIN.md is only a router | INDEPENDENT_PROJECT; keep routing link |
| [trendos-lead-hunter](https://github.com/fawakhry/trendos-lead-hunter) | `71da9e7eae78f6018f2edb0751658552acc07237` | Standalone lead-hunter JS tool, README says functions without TrendOS | NEEDS_REVIEW for legacy provenance; no automatic code move |
| [fiber-auto-max-ezcad](https://github.com/fawakhry/fiber-auto-max-ezcad) | `3fd1eba7faf62322f40b56da924dde7a034515ac` | Separate laser tooling, not presumed part of TrendOS original | INDEPENDENT_PROJECT unless link to pre-split code proved |
| [awez](https://github.com/fawakhry/awez) | `43550864774739d6eb8600976b4326b459aa2503` | Different app; no positive original-TrendOS provenance currently identified | OUT_OF_SCOPE_PENDING_PROOF |

**Completeness boundary:** these are the 8 repositories *returned by the connected GitHub account in this audit*. It is not proof that no older forks, local bare repositories, deleted repositories, cloud storage, other GitHub identities or Apps Script deployments exist.

## 2) Original/pre-split code located on GitHub

### TrendOs root/Apps Script (mixed active and historical)
- [`Code.gs`](https://github.com/fawakhry/TrendOs/blob/6b82fd3bf00eb80669a3b5ca14ff8eab420a6074/Code.gs) — ~752 KB root monolith, a Git source artifact, **not proved identical to V1932 Library full backup**.
- [`v1932-router.gs`](https://github.com/fawakhry/TrendOs/blob/6b82fd3bf00eb80669a3b5ca14ff8eab420a6074/v1932-router.gs), [`attendance-backend-v1.gs`](https://github.com/fawakhry/TrendOs/blob/6b82fd3bf00eb80669a3b5ca14ff8eab420a6074/attendance-backend-v1.gs), `attendance-clockin-backend-v1.gs`, `hr-backend-v1.gs`, `cleaning-backend-v1.gs`, `press-control-backend-v1.gs`, `customer-manager-backend-v1932.gs`, `customer-feedback-backend-v1.gs`, `go-live-autopilot-v1.gs` — **originally/or currently related** Apps Script modules; status mixed until deployment/ref history audit.
- [`app.js`](https://github.com/fawakhry/TrendOs/blob/6b82fd3bf00eb80669a3b5ca14ff8eab420a6074/app.js), [`index.html`](https://github.com/fawakhry/TrendOs/blob/6b82fd3bf00eb80669a3b5ca14ff8eab420a6074/index.html), `config.js`, `employee-api-dispatcher-v1.js`, `trendos-edge-orders-read-v1.js`: front-end evolution; must map older functions by commit range, not just current text.
- Existing [`CURRENT_TREE_BASELINE.md`](CURRENT_TREE_BASELINE.md) captures a verified **1995-blob** 2026-10-14 tree including 291 code/config candidates, 409 workflows, 256 tests; it is *path inventory, not all legacy functions scanned*. Branch enumeration page 1 returned 100 branches, so don't infer a total until pagination is exhaustive.

### Matbagy Photo Sheets artifact listing (do not relabel as TrendOS core)

Source HEAD `8536c300ec1dab56968a1f937e879b2bbc47a5c9`.

| File | Git blob SHA | Size (bytes) |
|---|---|---:|
| [`app.js`](https://github.com/fawakhry/Matbagy/blob/8536c300ec1dab56968a1f937e879b2bbc47a5c9/app.js) | `7cb6014b57716e6206cd1e7b9196c8394ecd9d6c` | 45,750 |
| [`app_zoom_pan.js`](https://github.com/fawakhry/Matbagy/blob/8536c300ec1dab56968a1f937e879b2bbc47a5c9/app_zoom_pan.js) | `445202e0ffcff76d3070130576af3a8992340cb3` | 29,009 |
| [`print-export.js`](https://github.com/fawakhry/Matbagy/blob/8536c300ec1dab56968a1f937e879b2bbc47a5c9/print-export.js) | `a6b43add1e932f79f156438a1ad64bda56f08821` | 6,040 |
| [`google_apps_script_activation.gs`](https://github.com/fawakhry/Matbagy/blob/8536c300ec1dab56968a1f937e879b2bbc47a5c9/google_apps_script_activation.gs) | `edaed3c0f8a76eaea8b4208a0fbd942c19ed20dc` | 1,174 |
| [`index.html`](https://github.com/fawakhry/Matbagy/blob/8536c300ec1dab56968a1f937e879b2bbc47a5c9/index.html) | `a3209d39f247cb4c18ddf39cadddf7e684ce7727` | 5,891 |
| [`styles.css`](https://github.com/fawakhry/Matbagy/blob/8536c300ec1dab56968a1f937e879b2bbc47a5c9/styles.css) | `58c1ead22989596668c2ee5da8658668c9645097` | 5,164 |
| [`sw.js`](https://github.com/fawakhry/Matbagy/blob/8536c300ec1dab56968a1f937e879b2bbc47a5c9/sw.js) | `cd87cd3f3cd2b7261b4a95a26fe5a07ae387c7df` | 1,467 |

**Status:** filenames/blobs GIT_VERIFIED, but source-line ownership and relation to original TrendOS not individually reviewed. Do not use SHA identity across repos without content comparison.

## 3) Migrated/deleted repository: confirmed preservation

`fawakhry/Matbagy-Design-Workflow@agent/initial-mvp` source commit `01d7fc2fccc2907debd8de70a1018eaf4cff4574` is no longer accessible as a repo after owner-approved 2026-10-02 migration. **Do not interpret API 404 as data loss:** [migration report](https://github.com/fawakhry/Matbagy-OS/blob/577340d798ea89247434ae8047d1b500f81c35f2/MIGRATION_FROM_MATBAGY_DESIGN_WORKFLOW.md) records 146 source files, 126 exact, 20 intentionally changed, 0 missing; [file mapping with SHA-256](https://github.com/fawakhry/Matbagy-OS/blob/577340d798ea89247434ae8047d1b500f81c35f2/MIGRATION_FILE_INVENTORY.json) and `ARCHIVE/source-history.bundle` (488,751 bytes) which preserves original history; 263 canonical commits in report. Migration is complete on a **private** independent repo. Do not import private knowledge, photos, metadata or current code into a public TrendOs legacy archive.

## 4) Sources outside GitHub and recovery condition

| Source | Observation | Next step |
|---|---|---|
| ChatGPT Library `TrendOS_Code_FULL_V1932_2026-08-24.gs` | **SOURCE_OBTAINED** raw bytes 731,855; 11,811 lines; 614 line-leading definitions by regex; 620 AST declarations (617 distinct names); SHA-256 `d0d16e3e5863d6a2da7b31e5b4e60fd709b9ddd43cc2761fc64bde1d130b4e87` | Detailed diff against GitHub `Code.gs`, tag pre-split function ranges, manual secret audit; **no public upload** |
| ChatGPT Library `TrendOS_V1932_AppsScript_Deploy_Manifest.txt` | **SOURCE_OBTAINED** SHA-256 `c3f29973a7287b47e632e6a799350494db26a0d6eda3b5b781bffa7b218a254b` | Map deploy manifest items to Git blobs; don't assert exact live deployment |
| Google Drive staging (three dated Docs from 17–18 Sept 2026) | **METADATA_ONLY**; names refer to Code.gs baseline restore, authoritative source staging, diagnostic capture | Verify source byte hashes/permissions in private environment; don't copy private document contents into public GitHub |
| Google Drive `TrendOS V1932 Apps Script Deploy` | **METADATA_ONLY** folder found, visible child list not resolved by parent search | Retrieve missing source inventory in correct connected account/folder when available |
| Google Drive historical `TrendOS Apps Script Backup Before V1932 - 2026-08-24` | **HISTORICAL_NOT_FOUND** by current connected Drive filename search | Search alternate account, owner-provided export, or original backup; don't falsely mark deleted |
| Historical Apps Script deployment `Code.gs` and standalone Apps Script projects | Repo and prior chat references exist; **no verified live Script API access** | Source export/CLASP ZIP/script-id metadata + effective deployment version after authorization and safe review |
| Local machines / Ubuntu / R2 / Cloudflare Workers | Code/version references only. No disk sweep or remote snapshot in audit | Inventory exact source directories under owner's control after access approval, without touching runtime or customer assets |

**Important:** Google Drive sheets containing orders and customers are **not code archives**, and their contents must not be transferred into public GitHub. Only backup metadata/IDs needed to trace old functions are eligible for audit; PII remains outside this book.

## 5) Mandatory archive control

1. Keep `original_source`, `blob_sha/SHA256`, `first_seen`, `last_seen`, `pre_split_proof`, `deployed_proof`, `migrated_to`, `secrecy_class` and `cleanup_decision` for each source.
2. Preserve SHA-linked historical originals in Git branches/history/private secure backups. An index pointing to a still-accessible file is **not** a guarantee once that source repo is deleted: make a verified independent archive *before removal*.
3. Preserve one-to-many and changed filename mappings; never conflate `Code.gs` with all nine routed .gs modules.
4. Audit secrets and private customer content before any new publication. Never paste credential-like strings, raw JSON customer records or whole Drive docs into a public Markdown book.
5. **Deletion gate:** only after a verified independent backup, source/target exact-match or documented intentional transformation, restoration test, live dependency scan, owner approval, and **Draft PR** with reviewed file list. No force-push, branch rewrite, actual delete or merge by the archival book agent.


## 6) Initial source-shape comparison — V1932 private vs GitHub main (2026-10-16)

**Original Library file:** `TrendOS_Code_FULL_V1932_2026-08-24.gs` has 11,811 lines and **614 function declarations, all 614 names distinct** (parsed locally).

**GitHub `Code.gs`** at commit `6b82fd3bf00eb80669a3b5ca14ff8eab420a6074`, blob `179526ca2f6343067dd7edebd6d290be79a6984b`: **12,254 lines, 632 function declarations, 631 distinct names**, per a source text scan. Root file size according to GitHub contents API: 752,490 bytes.

**Result:** `SHAPE_MISMATCH_CONFIRMED`; this is **not byte-identical as a whole source file** and cannot be deduplicated or discarded purely because the names look similar. Still `FUNCTION_LEVEL_DIFF_PENDING`: need a private identifier-level + function-body diff, timestamp/commit lineage and secret redaction before archiving a new public code copy. One duplicate function declaration in current GitHub source merits code-level review but is **not proof of a runtime problem**. No original-code bytes were sent to GitHub in this work.


## 7) Completed name-level and partial body-level audit (2026-10-16)

**Reference dates and locked Git blobs**
- Original private source `TrendOS_Code_FULL_V1932_2026-08-24.gs`, SHA-256 `d0d16e3e5863d6a2da7b31e5b4e60fd709b9ddd43cc2761fc64bde1d130b4e87`.
- GitHub `Code.gs` at 2026-08-24 17:38 UTC commit `a39fe9a0dde62232a9f25db92c4697e07af158e9`, blob `22ecc41f66c5921a4adc7472f76c55152ef37769`: 622 line-leading function declarations, 621 unique.
- GitHub `Code.gs` changed again on 2026-09-29 15:13 UTC via `f6a501b1466131b7abf16b9cca593ad5e1aa4f61`; blob `179526ca2f6343067dd7edebd6d290be79a6984b`: 632 line-leading declarations, 631 unique, unchanged thereafter in observed `main` snapshot SHA `6b82fd3bf00eb80669a3b5ca14ff8eab420a6074`.
- All historical `Code.gs` commits **visible in the current `main` file history**: eight (one 2026-09-29, one 2026-08-24, six 2026-08-11..12). This is path history on `main`, **not exhaustive across all branches**. Branch listing paginated across three API pages revealed **269 branch names** at scan time, so none has been deleted.

**Results of source-name intersection:**
- **614 / 614** line-leading named function declarations in the private original found by name in 2026-08-24 GitHub `Code.gs` and current `main`; **0 historically unique names missing**.
- Seven unique names in GitHub 2026-08-24 `Code.gs` absent from private backup: `customerAccountApplyPaymentToFinalInvoicesV1932_`, `score`, `trendosAllowedScreensForUserV1932_`, `trendosV1932CheckDuplicateLinesNow`, `trendosV1932DuplicateLinesAudit_`, `trendosV1932FindLineRowById_`, `trendosV1932FixDuplicateLinesNow`. `score` is line-leading definition counted twice in the current file; check **scope**, not an automatic global duplicate.
- Ten more names added by 2026-09-29 file update: `trendosEmployeeLegacyBridgeEnabledV1_`, `trendosEmployeeLegacyBridgeSecretV1_`, `trendosEmployeeLegacyBridgeHmacV1_`, `trendosEmployeeLegacyBridgeDecodeV1_`, `trendosEmployeeLegacyStableValueV1_`, `trendosEmployeeLegacyPayloadDigestV1_`, `trendosEmployeeLegacyBridgeForbiddenActionV1_`, `trendosConsumeEmployeeLegacyBridgeNonceV1_`, `trendosVerifyEmployeeLegacyBridgeAssertionV1_`, `trendosCloudEmployeeLegacyBridgeExecuteV1_`. They appear to form a later auth bridge; **do not remove unless callers/cutover proven retired**.

**Partial body-level comparison on 2026-08-24 GitHub blob:** Using a lexical brace-pair scanner and raw function span comparisons, of 614 names: **604 source spans equal exactly**, **8 source spans differ**, and **2 span extractions were inconclusive** because scanner couldn't reliably identify closing braces; **no claim of byte parity for those 2**. The eight changed functions:

`syncOrderFromLines_`, `getMatbagyNotes_`, `saveAccountingDeptLine_`, `appendLine_`, `getRows_`, `getTrendMasterCenterV1931_`, `saveCustomerAccountMovementV1915_`, `createManualOrder_`.

Inconclusive: `trendosPortalRedirectV1931_`, `attFindToday_`. These counts are **lexical heuristic findings**, not semantic equivalence/AST-approved or runtime tests. The native file was separately parsed offline with TypeScript AST: **620 FunctionDeclaration nodes** (607 top-level, 13 nested, 617 distinct identifiers, 0 syntax errors); the 614 count intentionally follows the earlier line-anchored regex, and cannot be substituted for AST total.

**Public indexed trace:** [`TRENDOS_LEGACY_V1932_FUNCTION_NAMES_INDEX.md`](TRENDOS_LEGACY_V1932_FUNCTION_NAMES_INDEX.md) records all 614 names, original line positions and estimated functional group, **without original source bodies or secrets**.

**Private user archive generated and integrity-tested (not pushed to GitHub):** `TrendOS_Legacy_V1932_Private_Archive_20261016.zip` (190,214 bytes; SHA-256 `0eb1a5fe785c2ea07f6338713e1c314da6e10a4e03c3412f3cddcaf4976ca10f`), containing original V1932 source, source manifest, full offline 620-node AST index with function SHA-256, checksum manifest and README. ZIP integrity validated. Coarse credential scan produced 27 credential-related identifier mentions, **zero high-specificity hardcoded assignments matching the narrow pattern**; **neither result proves absence of secrets**. User must retain the private download securely to claim a backup outside ChatGPT; no proof of offsite storage here. Do not upload ZIP to public GitHub.

**Next code-level audit:** inspect diffs for eight functions without leaking private code; classify behavior change, deployment version and caller of the 10 later auth-bridge additions; build audited cleanup candidates only after independent archive and verified external live dependencies.


## 8) V1932 name-level cross-check with immutable GitHub Code.gs snapshot (2026-10-16)

**Actual completed comparison** — private original `TrendOS_Code_FULL_V1932_2026-08-24.gs` at SHA-256 `d0d16e3e5863d6a2da7b31e5b4e60fd709b9ddd43cc2761fc64bde1d130b4e87` vs [GitHub `Code.gs` at `6b82fd3`](https://github.com/fawakhry/TrendOs/blob/6b82fd3bf00eb80669a3b5ca14ff8eab420a6074/Code.gs), Git blob `179526ca2f6343067dd7edebd6d290be79a6984b`. On the old file, TypeScript AST parser detected **620 declaration nodes, 617 distinct names, of which 607 are top-level names and 13 declarations nested**; GitHub `Code.gs` was enumerated by a start-of-line `function NAME(` pattern: **632 declarations / 631 distinct names**. Because the parsers differ, only **identifier presence** is compared, not bodies or parse tree equivalence.

| Result | Names |
|---|---:|
| Shared exact function identifiers | **614** |
| Names found only in private old AST | **3** (`closeRest`, `closeWork`, `set`) — all three are **nested**, **zero top-level original names absent** |
| Names found only in current GitHub Code.gs | **17** |
| Original top-level names missing from GitHub under the regex-based scan | **0 of 607** |

**Seventeen names present in GitHub, absent from V1932 backup's AST:** `customerAccountApplyPaymentToFinalInvoicesV1932_`, `score`, `trendosAllowedScreensForUserV1932_`, `trendosCloudEmployeeLegacyBridgeExecuteV1_`, `trendosConsumeEmployeeLegacyBridgeNonceV1_`, `trendosEmployeeLegacyBridgeDecodeV1_`, `trendosEmployeeLegacyBridgeEnabledV1_`, `trendosEmployeeLegacyBridgeForbiddenActionV1_`, `trendosEmployeeLegacyBridgeHmacV1_`, `trendosEmployeeLegacyBridgeSecretV1_`, `trendosEmployeeLegacyPayloadDigestV1_`, `trendosEmployeeLegacyStableValueV1_`, `trendosV1932CheckDuplicateLinesNow`, `trendosV1932DuplicateLinesAudit_`, `trendosV1932FindLineRowById_`, `trendosV1932FixDuplicateLinesNow`, `trendosVerifyEmployeeLegacyBridgeAssertionV1_`. **Their exact first-appearance commit/history and runtime status are not proven.** In particular, the names referencing legacy bridge security are **not** safe archival/deletion candidates without dependency analysis.

**Status:** `NAME_LEVEL_DIFF_COMPLETE`; `PARTIAL_BODY_LEVEL_AUDIT_COMPLETE` (604 exact source spans, 8 different, 2 inconclusive on 2026-08-24 GitHub source; see §7); `RUNTIME_PARITY_UNKNOWN`; `PRODUCTION_VERIFIED=NO`. Original code bytes and literals remain private; this report publishes only function identifiers and counts.

**Private manifest saved in user Library folder `/TrendOS-Legacy-Archive/`:** `LEGACY_V1932_FUNCTION_INDEX.md` (all 620 rows and body SHA-256 fingerprints, no bodies), `legacy_v1932_functions_private_index.json`, `PRIVATE_ARCHIVE_MANIFEST.json`; library upload succeeded. The raw `TrendOS_Code_FULL_V1932_2026-08-24.gs` was already in the user's private Library, and is **NOT uploaded to public GitHub**. Private file-body SHA256 fingerprints enable future exact body comparison once a parser/digest of GitHub source and original bytes is established.

## 9) Current book-branch function and duplicate-byte audit — 2026-10-16

- READ_HEAD (pre-write): `2fc7c187247b7b0cbd2e95c58cf1da00838e734b`. Immutable archive branch: `6b82fd3bf00eb80669a3b5ca14ff8eab420a6074`. Book-branch `Code.gs` blob `e91d78dcceeeca2804e721d58e065a6a7181bfc2`.
- Source identities: private Library V1932 `d0d16e3e5863d6a2da7b31e5b4e60fd709b9ddd43cc2761fc64bde1d130b4e87`, 731,855 bytes; deploy manifest `c3f29973a7287b47e632e6a799350494db26a0d6eda3b5b781bffa7b218a254b`, 3,608 bytes; both materialized locally and checksums checked.
- `[LEGACY_V1932_CURRENT_BRANCH_FUNCTION_DIFF_20261016.md](LEGACY_V1932_CURRENT_BRANCH_FUNCTION_DIFF_20261016.md)`: original 614 anchored names vs current branch 641 distinct anchored names (642 definitions); 600 textual matches, 12 changed, 2 boundary-inconclusive; original-only 0; book-only 27. This is a NEW book-branch comparison, not the earlier 8-changed historical 2026-08-24 snapshot audit. `score` duplicated by anchored name in source but lexical scopes not established.
- `[LEGACY_DUPLICATE_BLOBS_AUDIT_20261016.md](LEGACY_DUPLICATE_BLOBS_AUDIT_20261016.md)`: 101 exact Git blob groups/202 paths, with 9 App Script root↔mirror pairs (18 files, same Git blob SHA). No dynamic import/deployed project membership proven. Each audit-candidate mirrored path: `UNKNOWN_NEEDS_PROOF` + property `DUPLICATE_BYTES_VERIFIED`, not `CONFLICTING_DUPLICATE` without a runtime conflict.
- Local private recovery ZIP regenerated and checked: `TrendOS_V1932_Private_Recovery_20261016.zip` (188,929 bytes), SHA256 `faaf42e0bb7cee1e9f94d43bb2a611eeb8c2f2dd286152c2951531bdd39f03dd`. Includes original/manifest/private AST fingerprints/checksum manifest; ZIP CRC and each member SHA PASS. `ARCHIVED_VERIFIED_LOCAL`, but independent encrypted offsite backup `BLOCKED`; do not publish raw bytes.
- Google Drive connected search: folder `TrendOS V1932 Apps Script Deploy` identified by metadata, 0 results in the direct child query, backup title `TrendOS Apps Script Backup Before V1932` not found. `METADATA_ONLY` or `MISSING_IN_CONNECTED_SEARCH` — do not equate with deleted.
- Repository inventory rechecked: `TrendOs`, `Matbagy`, `EasyStore`, `Matbagy-OS`, `Fokha`, `trendos-lead-hunter`, `fiber-auto-max-ezcad`, `awez`. Their eight default-branch trees were accessible, but cross-repo exact SHA match from `TrendOs@main` found **0** matching paths; this is a narrow SHA test and cannot exclude modified migrations. Previously verified Matbagy-Design-Workflow 146-file migration remains a historical record, not newly executed.
- Exact content examined this pass: private V1932 source and manifest + current book-branch `Code.gs` + 12 repository documentation files = **15 unique file contents**; other tree entries were inventoried by Git metadata only, not content-read.
- Gate: `SOURCE_ONLY` / `TESTED_NO_RUNTIME` / `PRODUCTION_VERIFIED=NO` / `APPROVED_DELETE=0` / `DELETED=0`; independent restore proof required.

### 9.1) First nine mirror modules source audit

All **nine** root Apps Script source bodies inspected. **192** named function declarations collectively. Corresponding autonomous-printshop mirrors have the same Git blob SHA. Last path-modifying Git commit and date recorded per module, NOT file creation date, runtime last use, or deployment. [Source and commit table](LEGACY_FIRST_MIRROR_PAIR_PROVENANCE_20261016.md). Source-based purpose classification: integrity, deployment, customer communication/WhatsApp, press control, materials persistence/UI/waste, and operator tasks. Scope/owner/runtime proof still UNKNOWN. Total unique file bodies read in this pass now **24** (prior 15 plus nine modules); Git tree metadata entries do not count as code read. APPROVED_DELETE=0.

## 10) Registered mirror ownership and lexical closure — 2026-10-16

- HEAD refreshed at `d89d249a8a544f56c9db1887294eec0ace0621db` before additions; backup branch immutable at `6b82fd3bf00eb80669a3b5ca14ff8eab420a6074`.
- `autonomous-printshop/manifests/SOURCE_REGISTRY_V1.json` blob `1cc07df9fa1f988b01157db507260742f98e00fc`: **9/9** `.gs` root/central mirror pairs explicitly registered with source blob, project path and retention disposition. BUILD_MATRIX blob `72c9ad859cdc8ced1a69c2d5a89e15eeaf437216`: **8/9** covered (three exact paths, five by directory grouping), Operator Task V2 not listed by exact prefix there but present in registry and candidate book. Registry upstream and reference roles must both be preserved; no assumption of actual deployment.
- Bounded references scan: 15 selected non-legacy-source files read (10 Core/Worker, 3 tests, 2 manifest JSON). None of the selected 13 code/test files names the nine `.gs` files verbatim; this says nothing about unsampled files, Apps Script IDE project sources/triggers or runtime dynamic actions.
- First nine file-pair decisions: each root is `SHARED_DEPENDENCY_KEEP` with runtime usage still `UNKNOWN_NEEDS_PROOF`, each central copy `SEPARATE_PROJECT_REFERENCE`; 0 `LEGACY_ARCHIVE_CANDIDATE` with qualified absence of consumers. Registry policy `DELETE_AFTER_CENTRAL_VERIFICATION` does not bypass owner approval.
- Previous 2 scanner boundary uncertainties resolved: original TypeScript AST spans for `trendosPortalRedirectV1931_` (61–65, 827 chars) and `attFindToday_` (11765, 447 chars) exactly match book branch source. New anchored declaration counts: original 614, exact 602, changed 12, inconclusive 0, old-only names 0, book-only names 27. `SOURCE_ONLY`; 12 changed still require semantic analysis and deployed version qualification.
- Full evidence: [LEGACY_MIRROR_DEPENDENCY_AUDIT_20261016.md](LEGACY_MIRROR_DEPENDENCY_AUDIT_20261016.md). No secret-bearing private source uploaded. Original private V1932 SHA remains `d0d16e3e5863d6a2da7b31e5b4e60fd709b9ddd43cc2761fc64bde1d130b4e87`; independent/offsite private recovery has not been proven.
