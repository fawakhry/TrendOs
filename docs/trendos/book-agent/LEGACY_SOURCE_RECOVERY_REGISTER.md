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
| ChatGPT Library `TrendOS_Code_FULL_V1932_2026-08-24.gs` | **SOURCE_OBTAINED** raw bytes 731,855; 11,811 lines; 614 unique function definitions; SHA-256 `d0d16e3e5863d6a2da7b31e5b4e60fd709b9ddd43cc2761fc64bde1d130b4e87` | Detailed diff against GitHub `Code.gs`, tag pre-split function ranges, manual secret audit; **no public upload** |
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
