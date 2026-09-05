# TrendOS Black Box — ACCT-CF-02U Stale Runtime Route Diagnosis

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Status: `DIAGNOSIS / ZERO-WRITE`

## Executable evidence
Workflow `TrendOS Accounting Persistence Schema Preflight Preview Runtime` run `33956589023`, job `101280915958`:
- source checkout: PASS;
- Accounting native version sync: PASS on attempt 19;
- live GET `/v1/accounting/persistence-schema-preflight`: returned `{"success":false,"message":"Not found"}`;
- compatibility gate: FAIL before any POST/write step.

## Source verification
Current branch source `cloudflare-d1/src/accounting-native-module.mjs` explicitly contains and handles:
`/v1/accounting/persistence-schema-preflight`
using only `env.TRENDOS_ACCOUNTING_PREVIEW_DB` and read-only schema inspection.

Therefore the failure is **not evidence of an incompatible D1 schema**. It is evidence that the live Worker route set is stale or otherwise not identical to the source revision checked out by the runtime workflow, even though the coarse `TRENDOS_ACCOUNTING_NATIVE_VERSION` string matched.

## Safety conclusion
Do not weaken the compatibility gate and do not enable any Preview write flag.

The next correction must strengthen deployment/source-revision synchronization so runtime verification proves the exact Worker source revision before probing the schema route.

## Exact next step
Inspect the isolated Preview deployment workflow/config and existing source-revision mechanism. Synchronize the Worker to the current safe source revision if needed, with Cloud Write OFF and no D1 migrations. Then rerun ACCT-CF-02U.

## Production impact
NONE.
- no D1 write;
- no migration;
- no financial mutation;
- no Production routing change;
- Sheets + Apps Script remain authoritative.
