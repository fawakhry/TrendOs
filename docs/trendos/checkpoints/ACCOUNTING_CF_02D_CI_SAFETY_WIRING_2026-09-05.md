# ACCT-CF-02D — Contract CI + Preview Safety Wiring

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Predecessor: `ACCT-CF-02C`

## Actions
1. Extended the mandatory Cloudflare Preview safety test so the new Accounting contract is proven validation-only against a mock D1 binding.
2. Updated the dedicated Accounting Native CI workflow to include contract syntax, dedicated contract tests, native module tests and Preview zero-write safety.

## Commits
- Preview safety gate: `26bd79980879a8d36605171c6e3d9f2d2871dd82`
- Accounting Native CI: `7b6c68f5afc717c473a3dc4bf6f392c266a5e716`

## Safety evidence encoded in tests
The Preview safety suite now asserts:
- `GET /v1/accounting/contract` is validation metadata only;
- `POST /v1/accounting/validate` can validate a future SalesInvoiceLine command;
- Line/Order mismatch is rejected;
- contract responses keep `authoritativeWrites=false` and `persistence=none`;
- D1 mock write operation count remains exactly zero throughout Accounting contract calls;
- production/preview entry continues to route native Accounting explicitly;
- Cloud Write remains OFF and Preview migrations remain absent.

## CI trigger coverage
Accounting Native CI now triggers when any of these change:
- Accounting native module;
- Accounting Preview;
- Accounting capabilities;
- Accounting contract;
- Worker entrypoint;
- native/contract/safety tests;
- Accounting CI workflow itself.

## Production impact
NONE. No financial persistence, schema migration, source Sheet mutation, Apps Script deployment or production cutover.

## Exact next step
Extend independent Cloudflare runtime verification to check the deployed `/v1/accounting/contract` and `/v1/accounting/validate` behavior, and fix the stale native-UI text assertion that currently expects pre-EasyStore banner wording. Then record runtime-workflow wiring before observing Actions/deployment results.

**Status: PASS — local/CI safety gates wired; runtime verification update pending.**
