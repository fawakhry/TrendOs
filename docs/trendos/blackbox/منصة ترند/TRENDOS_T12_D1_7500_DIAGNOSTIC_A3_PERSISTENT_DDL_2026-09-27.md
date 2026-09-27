# TrendOS T12 — D1 7500 Diagnostic A3: persistent direct DDL on synthetic D1
Date: 2026-09-27 Cairo
Repository: `fawakhry/TrendOs`
Working branch: `cloud-migration-v3-t12-order-create-ci-20260919`
Diagnostic branch: `diagnostic/cloudflare-token-readonly-20260927`

## Entry 420 RESULT — D1-7500-A3-PERSISTENT-DIRECT-DDL-SYNTHETIC-20260927

### Scope
One bounded diagnostic step on isolated TEST D1 only. No production migration, Worker deploy, canary arm, Order 4322 create, general CREATE cutover, historical Orders/Order Lines backfill, or Apps Script write/trigger/property change.

### Diagnostic implementation
- Diagnostic branch commit: `3f36620507fbc3f89fd0d67ca01472a31c698551`
- Workflow: `.github/workflows/trendos-t12-d1-persistent-ddl-synthetic-diagnostic.yml`
- Run: `36335470930`
- Job: `108665363223`
- Wrangler: `4.142.0`
- Exact TEST D1: `trendos-t12-synthetic-test` / `54a3c05e-cde9-4979-814f-d40f941edcd5`
- Production D1 ID `5c4b92bf-e043-4f6e-bd6d-d514a92cd825` was explicitly excluded by the workflow guards.

### Exact test
Preflight read confirmed the diagnostic table did not exist (`n=0`).

Direct remote DDL attempted through Wrangler:
```sql
CREATE TABLE t12_diag_a3_persistent_write_20260927 (
  id INTEGER PRIMARY KEY,
  marker TEXT NOT NULL
);
```

### Result
The direct persistent `CREATE TABLE` command exited non-zero. Because the workflow redirected that command's stdout/stderr to `/tmp/create.txt` while running under `set -e`, the exact Cloudflare error body was not emitted to the GitHub job log before the step exited. Therefore this entry does **not** claim an exact Cloudflare error code for A3.

An independent post-attempt read then confirmed:
- diagnostic table count remained `n=0`
- no diagnostic table persisted
- cleanup was correctly skipped because creation was not confirmed
- final workflow verdict: `DIAG_A3_PERSISTENT_DDL=FAIL`

### Conclusion
A real persistent schema mutation fails through the same GitHub secret even outside `wrangler d1 migrations apply`, while direct reads, no-op DML/DDL, and direct non-persistent `PRAGMA foreign_keys = ON` succeed. This means the blocker is no longer safely characterized as migration-bookkeeping-only.

Current diagnosis:
```
BLOCKER=D1_PERSISTENT_WRITE_PATH_DENIED_OR_UNAUTHORIZED
ROOT_CAUSE=UNKNOWN
MIGRATION_0005_PAYLOAD_SPECIFIC=NO_EVIDENCE
PRAGMA_FOREIGN_KEYS_DIRECT_EXECUTE=PASS
PRAGMA_ONLY_MIGRATION_APPLY=FAIL_7500
PERSISTENT_DIRECT_DDL=FAIL_NO_RESIDUAL_SCHEMA
PERSISTENT_DIRECT_DDL_EXACT_ERROR_CODE=NOT_CAPTURED
TOKEN_ROTATION_REQUIRED=NOT_YET_PROVEN
```

### Next single diagnostic step
Use the Cloudflare D1 REST query endpoint directly against the isolated TEST D1 for one uniquely named persistent diagnostic `CREATE TABLE`, capture the JSON error response, then reconcile by read. This will determine whether the denial is at the underlying D1 API/write authorization layer rather than a Wrangler-only behavior. No production target and no token/secret change.

### Production state unchanged
```
MIGRATION_0005=NOT_APPLIED
WORKER_DEPLOY_FROM_INSTALL_DISABLED=NO
CANARY_ARMED=NO
ORDER_4322_CREATED=NO
GENERAL_CREATE_CUTOVER=NO
GOOGLE_APPS_SCRIPT_CREATE_AUTHORITY=YES
```
