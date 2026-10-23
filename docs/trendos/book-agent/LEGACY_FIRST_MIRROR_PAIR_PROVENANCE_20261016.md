# First nine exact-byte App Script mirror pairs — source and provenance audit (2026-10-16)

> Names/commits/function counts only. Root source bodies inspected via GitHub; no secrets or body literals reproduced. All 9 mirror files matched their root by Git blob SHA in the book-branch tree.

- Source repository: fawakhry/TrendOs, branch agent/trendos-book-audit-v1-20261014.
- All nine root files actually fetched and examined by source text, not inferred from filename alone. Anchored/named function-regexp count is indicative only; nested functions may be included. Total function definitions across nine root files = 192.
- Commit references below are **latest path-affecting commits returned from the book-branch Git history**, not file birthdates and **not** runtime last-use evidence.
- Root and autonomous-printshop mirror are within the same repository. The mirror directory is an autonomous-printshop packaging/reference candidate, not proof code moved to a separate repository. Project ownership split is provisional.
- Decision for mirrored path: UNKNOWN_NEEDS_PROOF, with DUPLICATE_BYTES_VERIFIED; root path: SHARED_DEPENDENCY_KEEP until deployment/client proof. Zero deletions approved.

| Root module | Mirror package path | Purpose (inferred from code/functions) | Function decls | API names detected | Git blob SHA | Latest observed path commit (UTC date) |
|---|---|---|---:|---|---|---|
| `trendos-integrity-dashboard-v1.gs` | `autonomous-printshop/sources/trendos/control-tower/trendos-integrity-dashboard-v1.gs` | TrendOS Health & integrity | 21 | none of 4 matched | `9ce3a4c3e1a11f318a7d1c87b12d6cf0c14aa838` | [`24b4e89a3d38`](https://github.com/fawakhry/TrendOs/commit/24b4e89a3d3866f8f95d28ec609a302ba908486e) (2026-09-01) |
| `v1940-deploy-health.gs` | `autonomous-printshop/sources/trendos/control-tower/v1940-deploy-health.gs` | Legacy Apps Script deployment health | 1 | SpreadsheetApp, PropertiesService | `41e57f19de8e865888a1b8bad2cc478c44c438c3` | [`ca8e7179f2b2`](https://github.com/fawakhry/TrendOs/commit/ca8e7179f2b280e475a09b64b1c3ccf51b6b66d2) (2026-08-24) |
| `customer-manager-backend-v1932.gs` | `autonomous-printshop/sources/trendos/customer-comms/customer-manager-backend-v1932.gs` | Legacy customer communications | 22 | UrlFetchApp, PropertiesService | `8c645d72abaa68431fe6a0213f3b96af3f27e42f` | [`3a78f7d10e82`](https://github.com/fawakhry/TrendOs/commit/3a78f7d10e820a6ce6678f461e47c1ec9ae9bad5) (2026-08-23) |
| `trendos-whatsapp-integrity-v1.gs` | `autonomous-printshop/sources/trendos/customer-comms/trendos-whatsapp-integrity-v1.gs` | WhatsApp idempotency/integrity | 23 | none of 4 matched | `c3e59c50f17de2604f0192a5b8f651e53caf9018` | [`a25824a83526`](https://github.com/fawakhry/TrendOs/commit/a25824a83526afe09e433d5171467f75690fca09) (2026-08-30) |
| `press-control-backend-v1.gs` | `autonomous-printshop/sources/trendos/machine-agent/press-control-backend-v1.gs` | Press control/machine agent | 16 | none of 4 matched | `ba544600f19bd5ea59dbf7efcde9440a0c758b97` | [`ef8dc12397ae`](https://github.com/fawakhry/TrendOs/commit/ef8dc12397aee8ab5524010c41cadb838cea6042) (2026-08-24) |
| `gaber-material-persistence-backend-v1.gs` | `autonomous-printshop/sources/trendos/material-control/gaber-material-persistence-backend-v1.gs` | Materials persistence | 30 | SpreadsheetApp | `c8890c62e6a230492ceb9499392508a946c18ec5` | [`dbd4bf86a096`](https://github.com/fawakhry/TrendOs/commit/dbd4bf86a09699860e5de1d1698a2508eec92ad9) (2026-09-10) |
| `gaber-material-ui-backend-v1.gs` | `autonomous-printshop/sources/trendos/material-control/gaber-material-ui-backend-v1.gs` | Materials UI backend | 29 | SpreadsheetApp | `a3615c1745e0f839c6dc310ce5fac301fefcbabc` | [`f75b5129d622`](https://github.com/fawakhry/TrendOs/commit/f75b5129d622420625f514ea6a21e6668c73ba87) (2026-09-10) |
| `gaber-material-waste-decision-v1.gs` | `autonomous-printshop/sources/trendos/material-control/gaber-material-waste-decision-v1.gs` | Materials waste decision | 1 | none of 4 matched | `c321849222accab379b46a872da94ac09b0a4049` | [`db07a13b49c0`](https://github.com/fawakhry/TrendOs/commit/db07a13b49c0cec9fe81ddff2cb1bac945dc097b) (2026-09-10) |
| `operator-task-workflow-v2.gs` | `autonomous-printshop/sources/trendos/operator-task/operator-task-workflow-v2.gs` | Operator task workflow | 49 | SpreadsheetApp, PropertiesService | `e2ee3c460756eb39d711e93809f1073ca1aa3821` | [`1badc6c34756`](https://github.com/fawakhry/TrendOs/commit/1badc6c3475600409a39b9f9a985f4431afc5bc8) (2026-09-10) |

## Why no file removal is approved

- Apps Script deployments can reference files by project association independently of import statements. Git blob identity alone does not identify which of the two paths is bound to a live script/project.
- The extracted presence of SpreadsheetApp, PropertiesService or UrlFetchApp only identifies named API calls; absence of these four names does not establish no network, no deployment, or unused code.
- Each pair needs verified deploy manifest membership, triggering functions, caller lookup, latest branch/code policy, archive-independent copy and a tested recovery procedure. A duplicate may be intentionally embedded in standalone printing package.
- Current source `Code.gs` has two indented `function score()` occurrences, one inside or near `syncOrderFromLines_` (line ~1437) and another inside or near `trendosV1932DuplicateLinesAudit_` (line ~11577). This supports scoped/nested use rather than a confirmed global duplicate; AST proof remains open.
- Date of creation and last actual use are UNKNOWN; latest path-specific Git commit is not a substitute.

## Proposed next batch

Conduct a read-only cross-file path/use check for the nine autonomous-printshop mirror paths and report concrete deployment membership. Promote a mirrored path to LEGACY_ARCHIVE_CANDIDATE only if live absence, independent archive SHA, restoration test, and owner-reviewed removal proposal are all satisfied. NO_DELETE=TRUE, NO_DEPLOY=TRUE, NO_MERGE=TRUE.
