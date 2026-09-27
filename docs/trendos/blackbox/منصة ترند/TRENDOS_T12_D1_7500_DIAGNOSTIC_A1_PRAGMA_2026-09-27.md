# TrendOS T12 — D1 7500 Diagnostic A1: PRAGMA foreign_keys on synthetic D1
Date: 2026-09-27 Cairo
Repository: `fawakhry/TrendOs`
Working branch: `cloud-migration-v3-t12-order-create-ci-20260919`
Pre-step working HEAD: `43b94c276edc7ba9f1f77d7a1e3a0d52d296053b`
Diagnostic branch: `diagnostic/cloudflare-token-readonly-20260927`

## Entry 418 RESULT — D1-7500-A1-PRAGMA-FOREIGN-KEYS-SYNTHETIC-20260927

### Scope
One diagnostic step only. No production migration apply, no Worker deploy, no canary arm, no Order 4322 create, no general CREATE cutover, no historical Orders/Order Lines backfill, and no Apps Script write/trigger/property change.

### Diagnostic implementation
Diagnostic branch commit:
`c139880bb935812d3515e92bcc4714e3f71b8ded`

Workflow:
`.github/workflows/trendos-t12-d1-pragma-foreign-keys-synthetic-diagnostic.yml`

GitHub Actions:
- Run: `36335043750`
- Job: `108664175135`
- Conclusion: `SUCCESS`
- Wrangler: `4.142.0`

Fail-closed target guards verified the remote target was exactly:
- TEST DB name: `trendos-t12-synthetic-test`
- TEST DB ID: `54a3c05e-cde9-4979-814f-d40f941edcd5`
- Production name `trendos-main` and production DB ID `5c4b92bf-e043-4f6e-bd6d-d514a92cd825` were explicitly rejected from the generated runtime config.

### Exact construct tested
```sql
PRAGMA foreign_keys = ON;
```

It was executed directly through Wrangler remote D1 execute. This step intentionally did **not** use `wrangler d1 migrations apply`, so migration bookkeeping/transaction behavior remains untested.

### Result
The command succeeded:
- `success=true`
- `changes=0`
- `changed_db=false`
- `rows_written=0`

Read-only schema-object count immediately before and after remained:
- before: `24`
- after: `24`

### Conclusion
`PRAGMA foreign_keys = ON` by itself is **not** sufficient to reproduce Cloudflare code 7500 on the isolated TEST D1 with the same GitHub secret and Wrangler 4.142.0.

This narrows the active blocker but does not establish the root cause:
```
BLOCKER=WRANGLER_D1_MIGRATION_APPLY_SPECIFIC_7500
ROOT_CAUSE=UNKNOWN
PRAGMA_FOREIGN_KEYS_DIRECT_EXECUTE=PASS
TOKEN_ROTATION_REQUIRED=NOT_PROVEN
```

### Next single diagnostic step
Test Wrangler **migration bookkeeping / migration-apply path** on `trendos-t12-synthetic-test` with a dedicated isolated migration directory containing only a harmless PRAGMA-only migration. That test is allowed to persist only migration bookkeeping metadata in the TEST database. Do not touch production migration 0005 yet.

### Production state unchanged
```
MIGRATION_0005=NOT_APPLIED
WORKER_DEPLOY_FROM_INSTALL_DISABLED=NO
CANARY_ARMED=NO
ORDER_4322_CREATED=NO
GENERAL_CREATE_CUTOVER=NO
GOOGLE_APPS_SCRIPT_CREATE_AUTHORITY=YES
```
