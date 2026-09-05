# ACCT-CF-02L — Schema Preflight Regression Test Start

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`

## Pre-action record
The read-only Accounting persistence schema preflight module now exists. Before it can be connected to any runtime diagnostic, add regression coverage proving:

1. no injected DB => fail-closed incompatible report;
2. missing required tables are reported deterministically;
3. missing required columns are reported per table;
4. an exact compatible schema reports `SCHEMA_COMPATIBLE`;
5. the preflight performs SELECT/PRAGMA metadata reads only and never invokes statement `run()` or DB `batch()`;
6. all results remain `authoritativeWrites=false` and `mutationPerformed=false`.

No schema application or write activation is permitted in this test increment.

Status: STARTED
