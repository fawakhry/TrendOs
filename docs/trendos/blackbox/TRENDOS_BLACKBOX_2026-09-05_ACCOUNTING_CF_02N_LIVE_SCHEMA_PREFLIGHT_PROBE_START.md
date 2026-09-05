# ACCT-CF-02N — Live Preview Schema Preflight Probe Start

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Parent checkpoint: `ACCT-CF-02M`

## Pre-action record
ACCT-CF-02M is closed after CI proof. The next material increment is deployed-runtime verification of the GET-only persistence schema preflight endpoint on the existing isolated Accounting Preview.

Current verified Preview safety state has no explicit Accounting Preview D1 persistence binding/readiness and remains ZERO_WRITE. Therefore the safe expected live result is fail-closed:
- `GET /v1/accounting/persistence-schema-preflight` => HTTP 503;
- `code=D1_NOT_INJECTED`;
- `compatible=false`;
- `readOnly=true`;
- `authoritativeWrites=false`;
- `mutationPerformed=false`.

The probe must also verify POST is rejected with 405 and the Accounting health endpoint still reports D1 financial writes/schema mutation disabled and Google Sheets / Apps Script authoritative.

No D1 binding creation, migration, schema change, financial write, secret mutation, or cutover is part of ACCT-CF-02N.

Status: STARTED
