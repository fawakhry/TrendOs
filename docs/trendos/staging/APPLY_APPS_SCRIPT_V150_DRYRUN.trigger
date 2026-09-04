TrendOS Apps Script V150 dry-run integration trigger.

Purpose:
- integrate the already-tested CLOUD_WRITE_RECONCILE_DRYRUN_V1 helper into Code.gs;
- add exactly one action route: cloudWriteReconcileDryRunV1;
- preserve doPost -> doGet fallback semantics;
- keep the helper append-only and mutation-free;
- create a repository candidate only.

Safety boundary:
- NO Apps Script deployment;
- NO Script Property mutation;
- NO Google Sheet write;
- NO Production Cloud Write enablement;
- Web App Version 149 remains deployed until a separate explicit deployment gate passes.
