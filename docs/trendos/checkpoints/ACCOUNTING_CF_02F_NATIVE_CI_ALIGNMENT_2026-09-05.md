# ACCT-CF-02F — Native CI Alignment After Concurrent F1 Merge

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## Observation
Accounting Native CI run `33926836196` failed in the `Native module tests` step while syntax checks passed. The same branch had concurrently advanced the native Accounting module to V0.5 and integrated the F1 foundation API/read-only Operations slice.

## Action
Updated `tests/cloudflare_accounting_native_v1.test.mjs` to match the current native module contract rather than the earlier pre-F1 surface.

Commit:
`70417ed15888b1eb0377085640a68c350895c5ae`

## Test separation improved
Native CI now verifies structured routing/contracts rather than duplicating brittle UI copy assertions. The deployed runtime workflow remains responsible for exact live UI text.

The native test now covers:
- integration/capabilities/contract routes;
- F1 foundation routes;
- current native version dynamically;
- EasyStore historical-baseline classification;
- Profit Center identity;
- V1 validation `persistence=none`;
- F1 foundation `authoritativeWrites=false`;
- method blocking for read-only metadata routes;
- unauthenticated `/v1/accounting/operations/line` returns 401 and cannot write;
- native UI route returns HTML with the native Accounting header.

## Safety
No production or financial data changed. Test-only alignment; no authority migration.

## Exact next step
Observe the newly triggered Native CI and Accounting runtime runs. If Native CI passes, close ACCT-CF-02. Because F1 foundation/read-only Order+Line work has already landed concurrently, next execution should inspect and harden that F1 implementation rather than reimplement it.

**Status: PASS — CI test aligned; rerun observation pending.**
