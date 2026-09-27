# TrendOS T12 — D1 7500 Diagnostic A2: Wrangler migration bookkeeping on synthetic D1
Date: 2026-09-27 Cairo
Repository: `fawakhry/TrendOs`
Working branch: `cloud-migration-v3-t12-order-create-ci-20260919`
Diagnostic branch: `diagnostic/cloudflare-token-readonly-20260927`

## Entry 419 RESULT — D1-7500-A2-MIGRATION-BOOKKEEPING-SYNTHETIC-20260927

### Scope
One bounded diagnostic step on the isolated TEST D1 only. No production migration apply, no Worker deploy, no canary arm, no Order 4322 create, no general CREATE cutover, no historical Orders/Order Lines backfill, and no Apps Script write/trigger/property change.

### Diagnostic implementation
Diagnostic branch commit:
`5fa140f18fbc0f22788fc233e207e925c5a19c0a`

Workflow:
`.github/workflows/trendos-t12-d1-migration-bookkeeping-synthetic-diagnostic.yml`

GitHub Actions:
- Run: `36335316076`
- Job: `108664941237`
- Wrangler: `4.142.0`

Fail-closed target identity passed for:
- TEST DB: `trendos-t12-synthetic-test`
- TEST DB ID: `54a3c05e-cde9-4979-814f-d40f941edcd5`
- Production DB ID `5c4b92bf-e043-4f6e-bd6d-d514a92cd825` was explicitly rejected.

### Migration payload
The isolated migration directory contained exactly one migration:
`9001_diag_pragma_only.sql`

Its SQL payload was only:
```sql
PRAGMA foreign_keys = ON;
```

The same statement had already passed direct remote execution in Diagnostic A1.

### Result
`wrangler d1 migrations apply trendos-t12-synthetic-test --remote` failed against the TEST database with the same Cloudflare response:
```
You do not have permission to perform this operation. [code: 7500]
```

The failing API path shown by Wrangler was:
`/accounts/***/d1/database/54a3c05e-cde9-4979-814f-d40f941edcd5/query`

### Conclusion
The production failure is **not specific to migration 0005's business schema statements** and is **not caused by `PRAGMA foreign_keys = ON` alone**.

The same 7500 is reproducible on a separate TEST D1 when the same GitHub secret uses Wrangler's migration-apply path with a PRAGMA-only migration. This materially narrows the blocker to one of:
1. persistent D1 write authorization available to direct/no-op paths but denied for a real mutation;
2. Wrangler migration bookkeeping SQL (for example the migration ledger create/insert/update);
3. migration-apply transaction/batch semantics or another Wrangler migration-specific API behavior.

Current diagnosis:
```
BLOCKER=WRANGLER_D1_MIGRATION_APPLY_SPECIFIC_7500
ROOT_CAUSE=UNKNOWN
MIGRATION_0005_PAYLOAD_SPECIFIC=NO_EVIDENCE
PRAGMA_FOREIGN_KEYS_DIRECT_EXECUTE=PASS
PRAGMA_ONLY_MIGRATION_APPLY=FAIL_7500
TOKEN_ROTATION_REQUIRED=NOT_PROVEN
```

### Next single diagnostic step
On `trendos-t12-synthetic-test` only, test one explicit **persistent direct DDL mutation** through `wrangler d1 execute` (create a uniquely named empty diagnostic table, reconcile by read, then remove it only after confirmed creation). This separates general persistent-write authorization from Wrangler migration bookkeeping/transaction behavior.

### Production state unchanged
```
MIGRATION_0005=NOT_APPLIED
WORKER_DEPLOY_FROM_INSTALL_DISABLED=NO
CANARY_ARMED=NO
ORDER_4322_CREATED=NO
GENERAL_CREATE_CUTOVER=NO
GOOGLE_APPS_SCRIPT_CREATE_AUTHORITY=YES
```
