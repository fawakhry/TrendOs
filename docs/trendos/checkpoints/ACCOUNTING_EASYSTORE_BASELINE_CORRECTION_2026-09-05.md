# TrendOS Accounting — EasyStore Baseline Correction

Date: 2026-09-05
Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`

## ACCT-DIR-02 — EasyStore historical role corrected — PASS

**User clarification**
EasyStore was not merely a separate legacy reference product. It was the **primitive/early Accounting implementation that was already operating as part of TrendOS**.

## Corrected source interpretation

`fawakhry/EasyStore` is now classified as:

**Historical working baseline of TrendOS Accounting**

—not merely an external blueprint.

This means the new Accounting program must preserve verified useful business workflows from EasyStore unless deliberately replaced by a safer/canonical TrendOS design.

## Development rule

We are **not starting Accounting from zero**.

The migration path is:

`EasyStore primitive TrendOS Accounting -> normalize architecture -> preserve verified workflows -> replace brittle coupling -> integrate natively into current TrendOS -> Cloudflare Preview -> controlled production migration`

## What should be preserved from EasyStore where verified

- sales/final invoices;
- purchases;
- suppliers;
- customer accounts and debt collections;
- supplier/customer ledger behavior;
- treasury/cashbox movements;
- materials and stock movements;
- department purchases;
- custody/advance settlement;
- department day close;
- waste/adjustment/reversal behavior;
- actual job cost and profit logic;
- audit trail;
- health/integrity checks;
- request IDs / duplicate protection / idempotency concepts;
- role-based workflow intent;
- existing tested behaviors.

## What should be replaced/refactored

- monolithic Apps Script coupling;
- employee-name-based authorization;
- duplicated/weak identity based on names;
- direct standalone frontend-to-Apps-Script coupling;
- browser state as anything beyond cache/UI state;
- any accounting summary logic that loses `Order ID + Line ID + Profit Center` granularity;
- any hidden linkage that cannot be audited.

## Final target

The final system is **TrendOS Accounting**, a complete accounting program integrated into TrendOS, with:
- shared TrendOS login/session;
- shared permission/RBAC model;
- shared Order ID / Line ID / Item ID / Customer ID identity;
- server-authoritative financial records;
- inventory and BOM;
- receivables/payables;
- treasury;
- expenses;
- department accounting and custody;
- closing/reconciliation;
- line-level cost and profit;
- reports and audit;
- migration from the existing EasyStore accounting behavior rather than a clean-room rewrite that ignores prior working flows.

## Important correction to prior checkpoint

The prior `ACCOUNTING_EASYSTORE_ASSESSMENT_2026-09-05.md` remains useful for its technical findings, but its wording `functional-blueprint-only` is superseded by this checkpoint.

Canonical wording from now on:

**EasyStore = historical working baseline of primitive TrendOS Accounting + source of verified business rules and migration behavior.**

## Production impact
NONE. Documentation/source interpretation only.

**Status: PASS.**
