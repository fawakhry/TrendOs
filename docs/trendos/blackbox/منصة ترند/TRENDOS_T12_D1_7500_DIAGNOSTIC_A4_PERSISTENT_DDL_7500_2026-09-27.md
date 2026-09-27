# TrendOS T12 — D1 7500 Diagnostic A4: captured persistent DDL denial
Date: 2026-09-27 Cairo
Repository: `fawakhry/TrendOs`
Working branch: `cloud-migration-v3-t12-order-create-ci-20260919`
Diagnostic branch: `diagnostic/cloudflare-token-readonly-20260927`

## Entry 421 RESULT — D1-7500-A4-PERSISTENT-DDL-ERROR-CAPTURE-20260927

### Scope
One bounded diagnostic retry on isolated TEST D1 only, performed only after A3 independently reconciled the prior attempt as absent. No production migration, Worker deploy, canary arm, Order 4322 create, general CREATE cutover, historical Orders/Order Lines backfill, or Apps Script write/trigger/property change.

### Diagnostic implementation
- Diagnostic branch commit: `e184df1314bee2fd0481f51050da83aac8cccae4`
- Workflow: `.github/workflows/trendos-t12-d1-persistent-ddl-error-capture-synthetic.yml`
- Run: `36335688279`
- Job: `108665980369`
- Wrangler: `4.142.0`
- TEST D1: `trendos-t12-synthetic-test` / `54a3c05e-cde9-4979-814f-d40f941edcd5`
- Production D1 ID `5c4b92bf-e043-4f6e-bd6d-d514a92cd825` explicitly excluded.

### Exact test
Preflight read proved the diagnostic table absent (`n=0`). Wrangler then attempted a real persistent direct DDL statement:
```sql
CREATE TABLE t12_diag_a4_persistent_write_20260927 (
  id INTEGER PRIMARY KEY,
  marker TEXT NOT NULL
);
```

### Captured result
- Wrangler exit code: `1`
- Cloudflare API path: `/accounts/***/d1/database/54a3c05e-cde9-4979-814f-d40f941edcd5/query`
- Exact Cloudflare response: `You do not have permission to perform this operation. [code: 7500]`
- Independent post-attempt SELECT succeeded and returned table count `n=0`.
- Verdict: `DIAG_A4_PERSISTENT_DDL=FAIL_NO_RESIDUAL_SCHEMA`.

### Conclusion
The 7500 blocker is now proven outside the migration system. A real persistent D1 schema write made through `wrangler d1 execute` is denied on a separate TEST D1 using the same GitHub secret, while reads, `PRAGMA foreign_keys = ON`, and deliberately no-op DML/DDL succeed.

This rules out migration 0005 contents and Wrangler migration bookkeeping as necessary causes. The common failing condition is an actual persistent D1 mutation through the GitHub Actions credential/path.

Current diagnosis:
```
BLOCKER=D1_PERSISTENT_WRITE_PERMISSION_7500
ROOT_CAUSE=CREDENTIAL_OR_AUTHORIZATION_CONTEXT_NOT_YET_IDENTIFIED
MIGRATION_0005_PAYLOAD_SPECIFIC=NO
WRANGLER_MIGRATION_BOOKKEEPING_REQUIRED_FOR_FAILURE=NO
PERSISTENT_DIRECT_DDL=FAIL_7500
READ_PATH=PASS
NOOP_DML_DDL=PASS
TOKEN_ROTATION_REQUIRED=NOT_YET_PROVEN
```

### Important interpretation boundary
The Cloudflare UI previously displayed an existing token with visible D1 Write permission, but GitHub cannot reveal the stored secret and the earlier token-identity check did not prove that the GitHub secret is that exact UI token. Therefore the next diagnostic must identify/validate the credential context without changing or exposing the token.

### Next single diagnostic step
Inspect the current Cloudflare API-token self-verification/identity mechanism and then run a read-only GitHub-secret credential diagnostic that proves as much as possible about token validity/status/identity or permission context without printing the secret. Do not rotate or replace the token yet.

### Production state unchanged
```
MIGRATION_0005=NOT_APPLIED
WORKER_DEPLOY_FROM_INSTALL_DISABLED=NO
CANARY_ARMED=NO
ORDER_4322_CREATED=NO
GENERAL_CREATE_CUTOVER=NO
GOOGLE_APPS_SCRIPT_CREATE_AUTHORITY=YES
```
