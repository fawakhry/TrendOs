# ACCT-CF-02G — Runtime / Preview Deployment Synchronization

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## Problem observed
Independent `TrendOS Accounting Preview Runtime` can start immediately after a source push while the Cloudflare Auto Preview deployment is still serving the previous Accounting native source. This produced a false-negative integration failure even though an earlier runtime run had already passed the Accounting V1 contract itself.

Observed example:
- runtime run `33927037116` on source `70417ed15888b1eb0377085640a68c350895c5ae` failed at native integration after health passed;
- the source branch had already advanced to Accounting native V0.5/F1, while the isolated Worker could still be on an earlier revision during the first request.

## Action
Updated:
`.github/workflows/trendos-accounting-preview-runtime.yml`

Commit:
`4f5b76447e8b0a9d972c3ab5c653631246e93b10`

## New deployment-sync gate
The runtime job now:
1. checks out the exact triggering source revision;
2. derives `TRENDOS_ACCOUNTING_NATIVE_VERSION` from `accounting-native-module.mjs`;
3. polls `/v1/accounting/integration` until the isolated Worker reports the exact expected native version;
4. also requires the F1 `/v1/accounting/operations/line` endpoint declaration before continuing;
5. only after source/runtime convergence runs Accounting health, contract, validation, F1, UI and method-safety checks.

The polling window is bounded and fails clearly if deployment never converges.

## Runtime coverage expanded
The same workflow now also verifies:
- F1 foundation remains `authoritativeWrites=false`;
- Order/Line entity ownership remains TrendOS Operations;
- legacy admin bridge has no mutation permission;
- unauthenticated Accounting Operations read returns 401;
- POST to F1 foundation metadata is blocked.

## Safety
This change only hardens verification. It does not:
- enable Accounting writes;
- migrate D1 schema;
- deploy Apps Script;
- mutate Sheets;
- change production financial authority.

## Exact next step
Observe the runtime and Native CI triggered after this commit. Treat any general Auto Preview failure at the existing Orders/Lines freshness gate separately from Accounting deployment if the Worker deployment and Accounting runtime itself pass.

**Status: PASS — runtime now waits for exact deployed Accounting source before verification.**
