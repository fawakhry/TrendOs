# TrendOS Accounting — Native Module Direction

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## ACCT-DIR-01 — Product direction corrected/confirmed — PASS

**User direction**
TrendOS Accounting must be built to **serve TrendOS itself**. It is not a detached standalone accounting product.

## Canonical architecture decision
TrendOS Accounting is a native logical module inside the unified TrendOS platform:

`TrendOS Operations -> TrendOS Accounting -> TrendOS Profit Engine / Partner Network`

The modules remain logically separated for correctness, but the user experience, authentication, identifiers, events, dashboards, and navigation should be unified under TrendOS.

## Required native integration
Accounting must consume TrendOS operational facts using stable keys:
- Order ID
- Line ID
- Item ID
- customer reference
- approved line price / approved amount
- quantity
- operational state

Accounting must return financial facts to TrendOS:
- Invoice ID
- payment status
- paid amount
- remaining amount
- recognized cost
- factual line profit
- stock/formation result
- receivable/payable state

## Shared TrendOS platform rules
- one authentication/session model;
- one permission model;
- one Order ID / Line ID identity model;
- no duplicate customer/order identity inside Accounting;
- no invented prices;
- replay-safe/idempotent event handling;
- inventory/BOM movements auditable and atomic;
- partner/investor percentages remain in Profit Engine / Partner Network, not Accounting;
- Cloudflare/D1 may accelerate reads and later host approved services, but financial write authority changes only through an explicit cutover gate.

## Preview reinterpretation
The existing `ACCT-CF-01C` Cloudflare Accounting Preview remains useful, but it is now classified as the **UI/domain prototype of the native TrendOS Accounting module**, not a separate product.

Current Preview URL may remain as a temporary isolated engineering route. Future navigation should be available under a TrendOS-native route such as `/trendos/accounting` and use the shared TrendOS authenticated Edge session.

## Exact next implementation step
Refactor the Preview into a TrendOS-native module shell:
1. add `/trendos/accounting` as the canonical module route while preserving `/accounting` as a temporary engineering alias;
2. surface TrendOS integration state in the UI (Order ID, Line ID, shared auth/session, Operations source, Accounting authority state);
3. add a read-only `GET /v1/accounting/integration` contract describing Operations <-> Accounting events and stable IDs;
4. ensure Accounting validation/API contracts reject standalone identity keys that conflict with TrendOS identity;
5. keep financial persistence OFF until the shared authenticated write contract and idempotency ledger are proven.

**Status:** PASS — product direction is now canonical.

**Production impact:** NONE. Documentation only.

**Rollback:** documentation-only; do not revert unless the user explicitly changes the product direction later.
