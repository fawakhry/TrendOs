# TrendOS Phase 0 — Invoice / Ready Sweep Inventory

> Scope: read-only source + live-sheet inventory. No invoice, draft, pricing, ledger, WhatsApp, or production data was modified.

## Status

`INV-03 — map invoice sweep/finalize paths`: **PASS — SOURCE + LIVE DATA MAPPED**.

Implementation correctness is **NOT PASS**. Multiple CORE-P0 gaps were identified and must be fixed before Phase 1 exit.

## 1. Entry point

Version V1932 exposes:

`goLiveAutopilotV1`

with operations:
- `sweepReady`
- `listDrafts`
- `prepareReadyInvoice`
- `sendReady`
- `finalizeAndNotify`

Access is gated by `glaAuth_()` -> V1932 auth and admin/service/accounting-compatible roles.

## 2. Ready candidate selection

`glaReadyOrders_(limit)` reads the live `بنود الأوردرات` sheet and selects an Order ID when any live line status is exactly:
- `جاهز للاستلام`
- `تم التنفيذ`

It deduplicates Order IDs **inside one sweep invocation only** using an in-memory `seen` map.

It does **not** consult:
- `حسابات - الفواتير النهائية`
- existing final invoice status
- existing Go-Live draft status `تم التقفيل`
- an order-level invoice generation state/version

Therefore being financially finalized does not remove an otherwise-ready operational order from future Ready Sweep selection.

## 3. Draft prepare / upsert

`glaPrepare_(orderId, notes)`:
1. reads order context from operational Lines.
2. reads pricing from `حسابات - فواتير الأقسام`.
3. opens/ensures `حسابات - مسودات الفواتير`.
4. calls `glaFind_(orderId)`.
5. if a row exists, updates it cell-by-cell.
6. otherwise appends a new Draft with generated `DR-...` ID.

### Concurrency gap

There is **no ScriptLock inside `glaPrepare_()`** and `sweepReady` does not wrap the find -> append sequence in a shared lock.

Two concurrent executions can both:
- observe no existing draft,
- generate different Draft IDs,
- append two rows for the same Order ID.

This is a classic check-then-write race.

## 4. Live duplicate-draft evidence

Direct read-only inspection of the current `حسابات - مسودات الفواتير` sheet found **50 Ready Sweep rows** but only **47 unique Order IDs**.

Exactly three duplicate Order IDs are visible in the current dataset:

| Order ID | Row 1 | Draft ID 1 | Row 2 | Draft ID 2 |
|---|---:|---|---:|---|
| `3577` | 16 | `DR-ceed6b65` | 17 | `DR-3466cb0d` |
| `3572` | 18 | `DR-fe3c766a` | 19 | `DR-69e8cb63` |
| `3569` | 20 | `DR-55d94661` | 21 | `DR-19c18636` |

For each pair:
- both rows were created on 2026-08-25.
- the later row was updated by Ready Sweep on 2026-08-30.
- the older duplicate remained orphaned/stale.

`glaFind_()` returns `.pop()` from matching rows, so once duplicates exist the newest/last row is updated while the older duplicate remains indefinitely.

**Conclusion:** the no-duplicate-draft gate is currently failed by live baseline evidence, not merely theoretical source analysis.

## 5. Live schema drift

Current draft sheet contains legacy semantic columns plus V1932 columns appended later. Examples:
- `Draft ID` and `ID`
- `رقم العميل` and `الهاتف`
- `مدفوع مقترح` and `المدفوع المقترح`

Current sheet has 24 populated header columns. `v1932EnsureSheet_()` preserves an existing header row and appends any exact missing V1932 header names at the end rather than migrating legacy synonyms.

V1932 draft code writes/reads the exact newer keys such as `ID`, `الهاتف`, `المدفوع المقترح`, etc. Legacy columns remain present.

This is manageable but is explicit schema drift and must be considered before cleanup/migration.

## 6. Pricing safety

`glaPricing_(orderId)` reads `حسابات - فواتير الأقسام` and:
- skips lines already closed/pulled to final invoice.
- counts only approved lines with sale amount > 0 into subtotal.
- returns a blocker if no approved priced lines exist.
- returns a blocker if pending/unapproved lines remain.

Current live Ready Sweep snapshot shows all 50 current draft rows with:
- proposed total = 0
- status = `يحتاج تسعير/اعتماد`
- blocker = `لا توجد بنود معتمدة بسعر بيع.`

This is a positive safety behavior: it does not invent a price for unpriced orders.

`REG-24` can be considered **PASS — LIVE + SOURCE** for the unpriced-order safety behavior.

## 7. Finalization path

`finalizeAndNotify` performs:

```text
glaPrepare_(orderId, recheck)
 -> reject blocker
 -> saveAccountingFinalInvoice_(...)
 -> glaUpdate_(draft, تم التقفيل + invoice fields)
 -> optional glaSendReady_()
```

If caller does not provide a request ID, it uses deterministic fallback:

`GLA-FINAL-<OrderID>`

This gives the Go-Live finalize flow a stable final-invoice request key.

## 8. `saveAccountingFinalInvoice_()` strengths

The final invoice writer:
- authenticates accounting role.
- takes `ScriptLock` with 20s wait.
- supports request key from requestId/idempotencyKey/clientRequestId.
- persists request key in `مفتاح العملية`.
- on repeat request key, returns `duplicatePrevented:true` and rechecks finance posting.
- only closes approved, non-closed accounting department lines.
- calculates total on server from selected approved lines plus explicit manual amount.
- records final invoice before marking department lines as pulled/closed.
- posts customer finance/ledger with its own idempotency helpers.

So final invoice duplicate protection is materially stronger than Ready Sweep draft creation.

## 9. Finalization partial-write recovery gap

The finalization sequence is protected by a lock but is **not a transactional multi-sheet commit**.

Important order:
1. append final invoice row.
2. attempt sales mirror append.
3. mark accounting department lines closed/pulled.
4. post finance/ledger.
5. consume held payment.
6. append activity.

If an exception occurs after the final invoice row is appended but before all department lines are marked closed, a retry with the same request key returns early from the duplicate-request branch.

That duplicate branch rechecks finance and held payment but does **not** explicitly repair/finish the department-line closure state.

Therefore a partial finalization can leave:
- final invoice exists,
- some/all department lines still open,
- retry reports duplicate prevented/success without completing those line-state mutations.

This requires a repairable finalization state machine or explicit duplicate-request completion reconciliation.

## 10. CORE-P0: finalized draft can regress on next Ready Sweep

This is the most important discovered logic gap.

After successful finalization:
- `glaUpdate_()` sets the draft state to `تم التقفيل`.
- `saveAccountingFinalInvoice_()` closes accounting/pricing lines.
- the operational production line can legitimately remain `جاهز للاستلام` until the customer actually receives it.

On the next Ready Sweep:
1. `glaReadyOrders_()` selects that same Order ID again because the operational line is still `جاهز للاستلام`.
2. `glaPrepare_()` runs again.
3. `glaPricing_()` now skips the already-closed accounting lines.
4. it returns no approved open priced lines and blocker `لا توجد بنود معتمدة بسعر بيع.`
5. `glaPrepare_()` updates the existing draft back to `يحتاج تسعير/اعتماد`, with proposed subtotal 0.

So the current source allows a successfully finalized invoice draft to regress back into the pricing queue before delivery.

**Required future fix:** Ready Sweep eligibility must exclude orders already financially finalized unless an explicit reopen/revision state authorizes regeneration.

`REG-22` is therefore **FAIL — SOURCE CONTRACT** until fixed.

## 11. WhatsApp retry/idempotency gap

`glaSendReady_(orderId)`:
- always calls `cmMetaSend_()` when invoked.
- then stores latest Meta Message ID/status.
- appends outbound message history.

It does not first reject/reuse an already-successful logical notification event.

A repeated `finalizeAndNotify` with the same stable invoice request key can:
- correctly avoid a duplicate final invoice,
- but still continue to `glaSendReady_()` and send another WhatsApp message.

Therefore invoice idempotency and notification idempotency are currently different safety levels.

This feeds the broader WhatsApp/outbound idempotency gate and must be fixed later with a durable event key.

## 12. Reopen flow

`reopenAccountingFinalInvoice_()`:
- is full-admin only.
- takes ScriptLock.
- marks invoice `تحت مراجعة ضياء`.
- stores held payment.
- reopens department lines linked to that invoice.
- clears final invoice link/pulled flag on those lines.
- uses deterministic ledger reversal request IDs `REOPEN-PAY-<invoiceNo>` and `REOPEN-INVOICE-<invoiceNo>`.
- repeated reopen detects already-under-review and finance helpers are designed to avoid duplicate reversal posting.

This is a deliberate reopen path and should become the only allowed route that permits a finalized order to re-enter invoice generation.

## 13. Current final-invoice live baseline

Direct live read found three current final invoice rows in `حسابات - الفواتير النهائية`:
- `ACC-20260810-0001` / order `2772`
- `ACC-20260810-0002` / order `2341`
- `ACC-20260810-0003` / order `1036`

These are older final invoices and do not overlap the 50 current Ready Sweep draft rows in the inspected snapshot.

This does **not** remove the source-level regression risk described above.

## 14. Required implementation contract

Before Ready Sweep can be considered safe:

1. one shared lock or durable idempotent claim around `find draft -> create/update`.
2. hard uniqueness contract: one active invoice draft per Order ID + generation/version.
3. finalized/closed invoice eligibility guard before `glaPrepare_()`.
4. explicit reopen/revision path to authorize regeneration.
5. duplicate cleanup/reconciliation for existing live duplicate Draft rows without deleting history blindly.
6. finalization completion/repair state so duplicate request can finish partial line closure.
7. durable outbound notification event key so invoice retry cannot resend the same logical WhatsApp notification.
8. preserve zero-price blocker; never invent pricing.

## Test implications

- `INV-03`: **PASS — INVENTORY COMPLETE**
- `REG-20`: **FAIL — LIVE BASELINE + SOURCE** (duplicate drafts already exist; no lock around draft upsert)
- `REG-21`: **PENDING RUNTIME** (final invoice same-request idempotency is strong in source, x10 regression not yet executed)
- `REG-22`: **FAIL — SOURCE CONTRACT** (finalized ready order can re-enter/regress through sweep)
- `REG-23`: **PENDING**
- `REG-24`: **PASS — LIVE + SOURCE** (unpriced orders explicitly blocked; no invented total)
- outbound notification retry/idempotency: **PENDING / KNOWN GAP**

No production mutation was performed during this inventory.
