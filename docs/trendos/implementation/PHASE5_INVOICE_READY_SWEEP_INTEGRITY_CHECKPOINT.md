# Phase 5 — Invoice / Ready Sweep Integrity Checkpoint

Status: **PREPARED + TESTED ON GITHUB BRANCH / NOT DEPLOYED**

Working branch: `agent/go-live-2026-09-01-integrity`

## Files

- `trendos-invoice-integrity-v1.gs`
- `tests/trendos_invoice_integrity_v1.test.js`
- `.github/workflows/trendos-integrity-v1.yml`

## Latest implementation commits

- module: `71ec1c513c34ac232e503c5c9a42f1868d9c94f0`
- tests: `ac2931a95167d4b2c24067c96cd363d8c4f37a94`
- CI wiring: `9f9978460f43b5d5af55febde5a152491f2b31fe`

GitHub Actions run: `33323669244` — **SUCCESS**.

## Contracts implemented

- Ready Sweep is line-driven and only accepts an Order when every active non-cancelled/non-duplicate Line is `جاهز للاستلام` or `تم التنفيذ`.
- Any delivered Line blocks that Order from re-entering Ready Sweep.
- One canonical Draft row is allowed per Order ID; duplicate Draft rows fail closed.
- An active Final Invoice blocks creation/recreation of a Draft for the same Order.
- Reopened Final Invoices advance a deterministic Draft revision.
- Default finalization key is revision-aware: `TRENDOS-GLA-FINAL|<OrderID>|R<n>`.
- The revision + request key + material signature are persisted before the legacy final writer executes.
- `saveAccountingFinalInvoice_()` is called outside the wrapper ScriptLock because the legacy writer owns its own ScriptLock; this avoids nested-lock deadlock.
- Retry after an ambiguous finalization reuses the same persisted request key.
- If invoice material changes while the Draft is `FINALIZING`, retry fails closed with `MATERIAL_CHANGED_DURING_FINALIZE`.
- After a successful Final Invoice write, the Draft is reconciled to `FINALIZED`.
- WhatsApp notification enters `NOTIFYING` before network I/O. If the send result becomes ambiguous, automatic resend is blocked to avoid duplicate customer messages.

## Tests passing

Automated coverage includes:

- all-active-lines-ready eligibility.
- mixed ready/in-production Order rejection.
- historical `مكرر` Line ignored.
- delivered Order excluded from Ready Sweep.
- active Final Invoice prevents Draft recreation.
- reopened invoice advances from R1 to R2.
- repeated prepare preserves the same revision/request key.
- duplicate Draft rows fail closed.
- first finalization creates one invoice with R1 key.
- repeated finalization does not call the final writer again after an active Final Invoice exists.
- simulated timeout preserves the same request key across retry.
- material change after ambiguous timeout blocks automatic retry.
- ambiguous WhatsApp send is not automatically sent a second time.

## Production state

No Apps Script production source, deployment, spreadsheet data, D1 schema, trigger, or Web App route was changed by this checkpoint.

Future controlled wiring target:

- `goLiveAutopilotV1` -> `trendosGoLiveAutopilotV1_`

Only after production source composition is reconciled and a rollback checkpoint is ready.

## Phase status

**IMPLEMENTED ON WORKING BRANCH + AUTOMATED TESTS PASS.**

Not yet `DEPLOYED` or `RUNTIME VERIFIED`.

Next implementation lane: **WhatsApp / Webhook idempotency**.
