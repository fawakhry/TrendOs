# WhatsApp / Customer Manager Inventory

> Phase 0 read-only inventory. No production mutation was performed.

## Scope

Mapped:
- `customerManagerWebhookV1_()` inbound WhatsApp path.
- `cmAppendMessage_()` message persistence and duplicate handling.
- `customerManagerV1_(op=send)` outbound manual send.
- `glaSendReady_()` outbound invoice-ready notification.
- Customer Feedback scan/webhook variants.
- live Google Sheets baselines for Customer Manager and Feedback.
- source-composition differences between merged `Code.gs`, standalone modules, Library fix builds and V1940 deploy-health checks.

## 1. Inbound Customer Manager — merged/current Code snapshot

The inspected merged `Code.gs` webhook does:

```text
Meta POST
 -> trendosV1932TryRoute_
 -> customerFeedbackWebhookV1_(payload)
 -> customerManagerWebhookV1_(payload)
 -> for each text message
    -> normalize phone/text/metaId
    -> cmMetaMessageExists_(metaId)
    -> cmAppendMessage_(messageData)
    -> D1 batch sync
```

### Strong duplicate protection inside `cmAppendMessage_()`

The merged/current snapshot of `cmAppendMessage_()`:
- acquires `LockService.getUserLock()` with 10s wait.
- if Meta Message ID is present, scans the message ledger's `Meta Message ID` column under the lock.
- returns the existing internal message ID instead of appending when the same Meta ID already exists.
- otherwise appends the row and updates the conversation record.

This is a real check-under-lock duplicate guard for the Google Sheets message ledger.

## 2. Critical source dependency gap: `cmMetaMessageExists_()`

The merged webhook performs a pre-check:

```javascript
if (metaId && cmMetaMessageExists_(metaId)) {
  duplicates++;
  return;
}
```

However, the definition of `cmMetaMessageExists_()` was not found in any currently accessible source snapshot:
- uploaded/current merged `Code.gs` snapshot: call exists; definition not found.
- Library `TrendOS_Code_V1932_WhatsApp_Send_Fix.gs`: call exists once; definition not found.
- other Library merged snapshots searched: no definition found.
- GitHub repository code search on the working branch: no definition found.
- Google Drive text search: no definition found.

### Evidence boundary

This does **not** prove that deployed Version 143 is definitely broken on live text webhooks, because the exact full Apps Script Version 143 file composition is still not fully reconciled (`INV-10` remains partial).

It does prove that the currently accessible merged/fix source family contains an unresolved dependency and must not be promoted/deployed as-is without reconciliation.

If a deployed source exactly matches this merged webhook and has no external definition, a text webhook reaching this line would throw before `cmAppendMessage_()` can apply its internal duplicate guard.

## 3. Standalone Customer Manager module is older

The standalone GitHub `customer-manager-backend-v1932.gs` is materially older than the merged/current Customer Manager block:
- its `cmAppendMessage_()` blindly appends a row.
- it does not contain the newer UserLock + Meta-ID duplicate guard seen in the merged source.
- its helper and send flow are simpler.

Therefore standalone-module source must not be assumed equivalent to the merged current source.

This is another reason exact Apps Script file composition matters before any deploy.

## 4. V1940 deployment-health blind spot

`v1940-deploy-health.gs` checks only top-level module function presence such as:
- `customerManagerV1_`
- `customerFeedbackV1_`
- attendance/cleaning/press/go-live functions

It does **not** check:
- `cmMetaMessageExists_`.
- inbound webhook execution.
- outbound idempotency.
- Meta-ID duplicate behavior.

Therefore `codeReady=true` from that health helper would not prove the WhatsApp webhook dependency graph is complete.

## 5. Live Customer Manager baseline

Current `مدير العملاء - الرسائل` inspection shows 4 rows, all inbound TEST WEBHOOK messages:
- `wamid.TEST_TRENDOS_WEBHOOK_001`
- `wamid.TEST_TRENDOS_WEBHOOK_002`
- `wamid.TEST_TRENDOS_WEBHOOK_003`
- `wamid.TEST_TRENDOS_WEBHOOK_004`

No repeated Meta Message ID exists in this small live baseline.

Current `مدير العملاء - المحادثات` has one TEST WEBHOOK conversation whose latest Meta ID is `...004`.

This is positive data-quality evidence only. It does not prove which Version 143 source implementation handled those historical tests.

## 6. Outbound manual send — idempotency gap

`customerManagerV1_(op='send')` currently performs:

```text
validate auth/phone/text/risk
 -> call Meta (`cmMetaSend_`) FIRST
 -> receive new Meta Message ID
 -> append message to Sheets
 -> sync message/conversation to D1
```

There is no durable logical request/event key before the Meta send.

Consequences:
- user/client retry can send a second WhatsApp message.
- if Meta accepted the first send but the Apps Script execution fails before persistence/response, retry can send again.
- Meta returns a new Meta Message ID for a second send, so downstream duplicate-by-Meta-ID storage protection does not prevent duplicate delivery.

Therefore outbound delivery is not logically idempotent.

## 7. Invoice-ready WhatsApp has the same gap

`glaSendReady_()` also calls `cmMetaSend_()` before storing notification state and has no durable notification event key.

Repeated finalize/notify can prevent a duplicate final invoice by invoice request key but still send another WhatsApp notification.

## 8. Customer Feedback — two materially different source variants

### Standalone GitHub `customer-feedback-backend-v1.gs`

This variant is stronger:
- `cfbRequest_()` uses a ScriptLock.
- it checks an existing Feedback row for the Order ID.
- once waiting/rated, it returns `duplicatePrevented:true` instead of sending again.
- it only requests feedback after `تم التسليم`.

### Merged `Code.gs` feedback block

The merged source uses `cfScan_()` with:

```text
cfHasOrder_(orderId)
 -> Meta send
 -> append feedback row
```

There is no surrounding shared lock/durable event key in that merged path.

This check-then-send-append sequence can race.

## 9. Live Feedback data proves duplicate/order drift

Current `تقييم العملاء` contains confirmed duplicate Order IDs, including at least:
- Order `3579`: two rows (rows 14/15 in inspected range).
- Order `3632`: two rows (rows 31/32).
- Order `3697`: two rows (rows 81/82).
- Order `3583`: two rows (rows 83/84).

Additional duplicate-looking Order IDs are visible in the broader live snapshot and can be reconciled during the repair pass; no rows were deleted or altered during inventory.

## 10. Feedback schema drift is live

The live Feedback header contains both standalone-module and merged-module semantic columns, including:
- `Feedback ID` and `ID`.
- `وقت إرسال التقييم` and `وقت طلب التقييم` / `وقت التسليم`.
- `الحالة` and `حالة الطلب`.
- `التقييم 1-5` and `التقييم`.
- `الملاحظة` and `ملاحظة العميل`.

This proves both schema lineages have touched the same live sheet over time.

## 11. Webhook security observation

The inspected source contains GET verification via `WHATSAPP_VERIFY_TOKEN` but no inspected `X-Hub-Signature-256` / HMAC POST-body verification path was found.

Keep this as a security hardening item. Do not add a signature implementation blindly until the exact Apps Script request/header capabilities and deployed webhook entry path are fixed/reconciled.

## Result

### Inventory

`INV-07 = PASS — SOURCE + LIVE DATA INVENTORY COMPLETE`

The paths and source conflicts are now mapped.

### Correctness / safety status

- `REG-25 inbound same Meta webhook x5`: **PARTIAL / SOURCE COMPOSITION BLOCKER**. The merged append helper has a real lock+Meta-ID guard, but the outer webhook references an unresolved helper in every accessible merged snapshot, while the standalone module is older and lacks the same guard. Exact deployed Version 143 composition is unresolved.
- `REG-26 repeated outbound retry`: **FAIL — SOURCE CONTRACT**. No pre-send durable event key; repeat can deliver another WhatsApp.
- Feedback duplicate-request invariant: **FAIL — LIVE BASELINE + MERGED SOURCE RACE**. Duplicate Feedback rows exist and the merged `cfScan_()` has no lock around check -> send -> append.

## Required future repair contract

Do not patch each flow independently first. Shared integrity layer should provide:
1. durable event key before external send (`channel + purpose + business entity + revision/version`).
2. claim-before-send / complete-after-send semantics.
3. persisted Meta Message ID and send outcome.
4. duplicate webhook Meta-ID claim under a shared deterministic lock/idempotency contract.
5. one canonical Feedback implementation/schema.
6. source-composition reconciliation so merged vs standalone duplicate definitions cannot drift.
7. deployment health that executes dependency checks for webhook helpers, not just top-level function existence.

## No production mutation

No WhatsApp message was sent and no live Sheet row was changed during this inventory.
