# ACCT-CF-02J — Runtime Readiness Diagnostic Regression Test Start

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`

## Pre-action record
The read-only endpoint `GET /v1/accounting/persistence-readiness` has been added to the Accounting Native Runtime. Before any further integration, add regression tests proving the runtime route preserves the zero-write boundary.

Required proofs:
1. default configuration returns `ZERO_WRITE`, `ready=false`, `authoritativeWrites=false`, `mutationPerformed=false`;
2. production stays blocked even when all other readiness inputs are present;
3. explicit Preview prerequisites may report readiness but do not invoke D1 `prepare` or `batch`;
4. non-GET requests are rejected and cannot mutate anything;
5. the native path detector includes the diagnostic endpoint.

No persistence commit path, D1 mutation, schema migration, Google Sheets / Apps Script mutation, or authority change is permitted.

Status: STARTED
