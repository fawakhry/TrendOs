# Accounting F2-D — Runtime Verification Wired

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## Action
Added a dedicated isolated Cloudflare runtime verifier for the F2 Finance planning surface:

`.github/workflows/trendos-accounting-f2-runtime.yml`

Commit:
`153a67b1b4ef4c09ff54ea18e4479948cac87d65`

## Runtime synchronization
The workflow derives the exact `TRENDOS_ACCOUNTING_NATIVE_VERSION` from the triggering source and waits until the isolated Worker reports the same version before testing F2. This prevents false negatives caused by Actions starting before Cloudflare Preview finishes deploying.

## Live checks required
- integration exposes the exact expected native version;
- integration exposes `/v1/accounting/finance/plan` and stable `Treasury ID / Cashbox ID` identity;
- `GET /v1/accounting/finance` reports F2 `posting-plan-only`;
- `persisted=false`, `authoritativeWrites=false`, `persistence=none`;
- customer collection plan produces a balanced double-entry journal in integer piastres;
- Treasury leg carries stable Treasury/Cashbox ID;
- receivable leg carries stable Party ID;
- missing Treasury ID fails closed with HTTP 422;
- treasury transfer requires and preserves distinct source/destination Treasury IDs;
- metadata POST and plan GET methods are blocked with HTTP 405.

## Safety boundary
The workflow exercises the live isolated Preview only. No route in this F2 surface can persist a financial mutation.

No:
- D1 financial write;
- D1 migration;
- Apps Script mutation/deploy;
- Google Sheets financial mutation;
- Cloud Write enablement;
- production Accounting cutover.

## Exact next step
Observe Accounting Native CI, F2 Runtime, Cloudflare Auto Preview and Integrity runs. If the exact-version F2 Runtime and Native CI pass, record F2 Finance Planning PASS. Classify the existing Orders/Lines mirror freshness gate separately if Auto Preview deployment itself succeeds before that unrelated gate.

**Status: RUNTIME VERIFICATION WIRED — run observation pending.**
