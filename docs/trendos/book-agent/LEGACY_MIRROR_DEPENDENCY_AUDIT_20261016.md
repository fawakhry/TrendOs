# TrendOS Legacy — Nine Apps Script mirror dependency and retention audit

> 2026-10-16; SOURCE_ONLY; NO DELETE / MERGE / DEPLOY; historical source plus structural refs do not prove live deployment.

- Source head before writing: `d89d249a8a544f56c9db1887294eec0ace0621db`.
- Immutable backup branch still at `6b82fd3bf00eb80669a3b5ca14ff8eab420a6074`.
- SOURCE_REGISTRY_V1.json blob: `1cc07df9fa1f988b01157db507260742f98e00fc`; BUILD_MATRIX_V1.json blob: `72c9ad859cdc8ced1a69c2d5a89e15eeaf437216`.
- The registry explicitly lists all **nine** root+mirror pairs, with matching Git blob SHAs (byte-parity previously checked). These are intentional project reference copies, not proven accidental or disposable duplicates.
- Registry policy: source_snapshots = REFERENCE_ONLY_NOT_RUNTIME_AUTHORITY; live_upstream_dependencies = KEEP_UNTIL_REPLACEMENT_CUTOVER. Its DELETE_AFTER_CENTRAL_VERIFICATION policy is a future gate, NOT owner approval.
- BUILD_MATRIX central_sources covers **eight** of the nine: three direct file paths, and five through directory-level module entries. Operator Task V2 is registered but not explicitly covered in BUILD_MATRIX. Not listed there does NOT prove unused.
- The older integrity deployment manifest lists Integrity Dashboard and WhatsApp Integrity as suggested files but explicitly says PREPARED / NOT APPROVED. No inference of actual deployed project membership.

## Source records and classification

| Upstream root file | Mirrored project-reference path | Git blob SHA | Registry disposition | Build module | Decision |
|---|---|---|---|---|---|
| `trendos-integrity-dashboard-v1.gs` | `autonomous-printshop/sources/trendos/control-tower/trendos-integrity-dashboard-v1.gs` | `9ce3a4c3e1a11f318a7d1c87b12d6cf0c14aa838` | `KEEP_UPSTREAM_HEALTH_SOURCE` | M18/REUSE_AND_MODERNIZE | root: SHARED_DEPENDENCY_KEEP pending runtime proof; mirror: SEPARATE_PROJECT_REFERENCE; KEEP BOTH |
| `v1940-deploy-health.gs` | `autonomous-printshop/sources/trendos/control-tower/v1940-deploy-health.gs` | `41e57f19de8e865888a1b8bad2cc478c44c438c3` | `KEEP_UPSTREAM_HEALTH_SOURCE` | M18/REUSE_AND_MODERNIZE | root: SHARED_DEPENDENCY_KEEP pending runtime proof; mirror: SEPARATE_PROJECT_REFERENCE; KEEP BOTH |
| `customer-manager-backend-v1932.gs` | `autonomous-printshop/sources/trendos/customer-comms/customer-manager-backend-v1932.gs` | `8c645d72abaa68431fe6a0213f3b96af3f27e42f` | `KEEP_UPSTREAM_LIVE_DEPENDENCY` | M14/DEPENDENCY_BLOCKED | root: SHARED_DEPENDENCY_KEEP pending runtime proof; mirror: SEPARATE_PROJECT_REFERENCE; KEEP BOTH |
| `trendos-whatsapp-integrity-v1.gs` | `autonomous-printshop/sources/trendos/customer-comms/trendos-whatsapp-integrity-v1.gs` | `c3e59c50f17de2604f0192a5b8f651e53caf9018` | `KEEP_UPSTREAM_LIVE_DEPENDENCY` | M14/DEPENDENCY_BLOCKED | root: SHARED_DEPENDENCY_KEEP pending runtime proof; mirror: SEPARATE_PROJECT_REFERENCE; KEEP BOTH |
| `press-control-backend-v1.gs` | `autonomous-printshop/sources/trendos/machine-agent/press-control-backend-v1.gs` | `ba544600f19bd5ea59dbf7efcde9440a0c758b97` | `REFERENCE_ONLY_REBUILD_D1` | M15/REUSE_AND_MODERNIZE | root: SHARED_DEPENDENCY_KEEP pending runtime proof; mirror: SEPARATE_PROJECT_REFERENCE; KEEP BOTH |
| `gaber-material-persistence-backend-v1.gs` | `autonomous-printshop/sources/trendos/material-control/gaber-material-persistence-backend-v1.gs` | `c8890c62e6a230492ceb9499392508a946c18ec5` | `KEEP_UPSTREAM_UNTIL_D1_REPLACEMENT` | M10/REUSE_AND_MODERNIZE | root: SHARED_DEPENDENCY_KEEP pending runtime proof; mirror: SEPARATE_PROJECT_REFERENCE; KEEP BOTH |
| `gaber-material-ui-backend-v1.gs` | `autonomous-printshop/sources/trendos/material-control/gaber-material-ui-backend-v1.gs` | `a3615c1745e0f839c6dc310ce5fac301fefcbabc` | `KEEP_UPSTREAM_UNTIL_D1_REPLACEMENT` | M10/REUSE_AND_MODERNIZE | root: SHARED_DEPENDENCY_KEEP pending runtime proof; mirror: SEPARATE_PROJECT_REFERENCE; KEEP BOTH |
| `gaber-material-waste-decision-v1.gs` | `autonomous-printshop/sources/trendos/material-control/gaber-material-waste-decision-v1.gs` | `c321849222accab379b46a872da94ac09b0a4049` | `KEEP_UPSTREAM_UNTIL_D1_REPLACEMENT` | M10/REUSE_AND_MODERNIZE | root: SHARED_DEPENDENCY_KEEP pending runtime proof; mirror: SEPARATE_PROJECT_REFERENCE; KEEP BOTH |
| `operator-task-workflow-v2.gs` | `autonomous-printshop/sources/trendos/operator-task/operator-task-workflow-v2.gs` | `e2ee3c460756eb39d711e93809f1073ca1aa3821` | `KEEP_UPSTREAM_UNTIL_D1_CUTOVER` | Not listed | root: SHARED_DEPENDENCY_KEEP pending runtime proof; mirror: SEPARATE_PROJECT_REFERENCE; KEEP BOTH |

## Read-only direct-reference scan
- 15 selected files read: 10 Core/Worker source files, three tests, and two manifest JSON files. There were 0 literal occurrences of these nine .gs basenames in the 13 selected core/test files; SOURCE_REGISTRY references all nine; BUILD_MATRIX names three exactly and references directory paths for five.
- This is NOT a whole-tree import/call-graph audit. Dynamic calls, editor file lists, generated assets, copied source, deploy bindings, triggers and real Apps Script version are unverified.
- [Historical operator-task deployment candidate](https://github.com/fawakhry/TrendOs/blob/agent%2Ftrendos-book-audit-v1-20261014/autonomous-printshop/sources/trendos/operator-task/OPERATOR_TASK_WORKFLOW_V2_CANDIDATE.md) says NOT DEPLOYED on 2026-09-10, not a current production measurement.

## Two earlier lexical scanner uncertainty cases resolved
- Local original V1932 parsed with TypeScript AST: zero syntax diagnostics. AST-bounded original trendosPortalRedirectV1931_ (line 61-65; 827 chars) matches exact current five-line source; AST-bounded attFindToday_ (line 11765; 447 chars) matches exact current one-line source.
- Revised 614 anchored declaration comparison: **602 exactly equal spans**, **12 changed**, **0 inconclusive**, **0 original-only function names**. 27 additional distinct anchored names in current book branch.
- AST boundaries applied to original, then text windows compared to current Code.gs blob `e91d78dcceeeca2804e721d58e065a6a7181bfc2`. This is not full current AST comparison, semantic behavior validation, or production verification.

## Clean-up gate
- Nine mirror files have positive provenance and must remain. **0 safe-to-delete paths**. A mirrored package asset may be used by manual installation even when runtime code has no import.
- Next: read-only deployed Apps Script project/version membership, build-script/caller inventory, and actual replacement cutover evidence; independently encrypted offsite archive SHA and restore test; then separately approved exact-path removal proposal.
- States: FOUND=9 mirror pairs; REFERENCE_REGISTERED=9; BUILD_MATRIX_COVERED=8; SOURCE_ONLY=YES; TESTED_RUNTIME=NO; PRODUCTION_VERIFIED=NO; APPROVED_DELETE=0.
