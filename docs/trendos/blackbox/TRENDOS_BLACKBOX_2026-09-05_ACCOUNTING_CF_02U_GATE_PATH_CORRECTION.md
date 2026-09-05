# TrendOS Black Box — ACCT-CF-02U Gate Path Correction

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Status: `CORRECTION / ZERO-WRITE`

## Finding
During review of the newly tightened ACCT-CF-02U runtime gate, the POST-rejection probe was found to target the wrong URL path:

Wrong:
`/v1/accounting/persistence/schema-preflight`

Canonical runtime path:
`/v1/accounting/persistence-schema-preflight`

The GET compatibility probe already targets the canonical path. This is a workflow-test path typo only; no Accounting runtime code, D1 schema, financial data, or authority state is affected.

## Action
Correct the POST probe to the canonical endpoint before accepting any ACCT-CF-02U CI/runtime result.

## Safety
- zero writes;
- no migration;
- no D1 mutation;
- no write flag enablement;
- no Production change.

## Exact next step
Patch the workflow path, then require executable PASS for schema compatibility + POST rejection + unchanged financial authority.
