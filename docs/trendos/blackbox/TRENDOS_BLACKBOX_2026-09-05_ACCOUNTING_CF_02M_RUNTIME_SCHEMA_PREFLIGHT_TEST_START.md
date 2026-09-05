# ACCT-CF-02M — Runtime Schema Preflight Regression Test Start

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## Pre-action record
The GET-only runtime schema-preflight diagnostic is now present in Accounting Native V0.8. Before further integration, add regression coverage proving the binding and zero-mutation boundaries.

Required proofs:
1. route detector includes `/v1/accounting/persistence-schema-preflight`;
2. no `TRENDOS_ACCOUNTING_PREVIEW_DB` fails closed as `D1_NOT_INJECTED`;
3. a generic `env.DB` must never be inspected or used as a fallback;
4. explicitly injected compatible Preview DB reports schema compatible using metadata reads only;
5. missing required columns report incompatible deterministically;
6. POST is rejected with 405;
7. statement `run()` and DB `batch()` remain at zero calls in every case;
8. `authoritativeWrites=false` and `mutationPerformed=false` remain invariant.

No migration, financial write, Google Sheets / Apps Script mutation, or cutover is permitted.

Status: STARTED
