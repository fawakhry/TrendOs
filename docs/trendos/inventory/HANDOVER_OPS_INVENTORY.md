# Handover / OPS Inventory

> Phase 0 read-only inventory. No production mutation was performed.

## Scope

Mapped:
- `getMatbagyNotes_()` / `saveMatbagyNote_()` backend.
- `employee-ops-coach-v1.js`.
- `employee-manager-strips-v2.js`.
- `employee-andon-v1.js`.
- current `app.js` end-day summary behavior.
- V1931 Trend Master automation queue.
- live `نوت مطبعجي`, `سجل تنبيهات التشغيل`, and `إدارة - تسليم الشيفت` evidence.

## 1. Live Handover schema stub exists, but no implemented workflow was found

Direct live Google Sheets inspection confirms a sheet named:

`إدارة - تسليم الشيفت`

It currently contains the following header only and **zero data rows**:

```text
ID
التاريخ/الوقت
الموظف
القسم
رقم الأوردر/المهمة
الحالة الحقيقية
سبب التوقف
الخطوة التالية
يسلم إلى
حالة الاستلام
ملاحظة المدير
آخر تحديث
```

So the accurate conclusion is:
- a Handover **schema stub** exists in the workbook.
- no live Handover event has been recorded in it at the inspected baseline.
- the supplied current `Code.gs` does not contain the sheet name or its distinctive headers.
- no dedicated Handover route/writer was found in the accessible source family.
- current frontend End Day flow only shows a dashboard summary; no inspected writer persists a Handover row.

The stub itself also lacks an explicit `Line ID` and explicit shift/business-date/event-key fields, so even if manually populated it would not yet satisfy the Core line-level idempotency contract.

Therefore a real auditable Handover workflow is **not implemented/proven**, although the workbook contains a prepared schema stub.

## 2. Live OPS Coach tells employees to hand over, but does not itself create Handover records

Current live `نوت مطبعجي` contains `OPS_COACH` messages from `AI مدير التشغيل`.

Examples include 2026-08-26 21:57 Cairo messages instructing:
- Jaber to record Hand-over for every open Laser job: Order ID, real status, blocker reason, next step.
- Revan to record Hand-over for every open Print/Press job plus final Press Queue status.

Those are **instructions**, not structured rows in `إدارة - تسليم الشيفت`.

The Handover sheet remains empty at the inspected baseline.

## 3. `نوت مطبعجي` backend is generic append-only

`saveMatbagyNote_()`:
- authenticates the user.
- requires note content.
- generates `NOTE-<uuid8>`.
- blindly appends category/title/content/saver/time.

It has no:
- ScriptLock.
- request/event idempotency key.
- entity key.
- Line ID field.
- Order ID field.
- shift/businessDate field.
- state fingerprint.
- duplicate detection.

Therefore it cannot enforce one logical OPS/Handover event.

## 4. OPS employee reply path is not idempotent

`employee-manager-strips-v2.js` sends employee replies using:

```text
saveMatbagyNote
category = OPS_REPLY
title = OPS_REPLY|<employee>|<new ISO timestamp>
content = free text
```

Every click/retry creates a new timestamp and the backend blindly appends.

Current live `نوت مطبعجي` contains one observed `OPS_REPLY` from Jaber, but the current small live baseline does not prove retry safety.

## 5. ANDON uses the same non-idempotent note path

`employee-andon-v1.js` writes:

```text
category = OPS_REPLY
title = OPS_REPLY|<employee>|ANDON|<reason>|<new ISO timestamp>
```

No stable request/event key exists. There is also no structured mandatory Order ID or Line ID binding; entity context is free text.

Thus an ANDON cannot reliably be joined to a specific Line ID for integrity reporting.

## 6. OPS coach generation source is not fully reconciled

Accessible frontend files read/render `OPS_COACH` notes.

The inspected merged `Code.gs` provides generic `getMatbagyNotes_` / `saveMatbagyNote_`; no dedicated current `OPS_COACH` producer/scheduler was found there.

Live notes prove that `AI مدير التشغيل` wrote OPS_COACH messages historically, but the exact producer/code path is not in the currently reconciled source set.

Treat coach-production source as **UNKNOWN until source composition is reconciled**.

## 7. Trend Master automation queue has deterministic keys, but no concurrency lock

V1931 `سجل تنبيهات التشغيل` is different from free-form OPS notes.

`appendAutomationQueueOnceV1931_()` builds deterministic keys such as:
- `STATUS|orderId|lineId|status`
- `OVERDUE|orderId|lineId|date`
- `LOWSTOCK|material|department|date`

This is good sequential idempotency design.

However the implementation is:

```text
read all existing keys
 -> if key exists return false
 -> append row
```

with no ScriptLock around check -> append.

Two concurrent runs can therefore both append the same logical event. `runTrendMasterAutomationCoreV1931_()` also has no outer durable run claim.

## 8. Installed automation trigger evidence

The inspected Apps Script trigger UI showed only `d1OrdersLiveSyncTick` at that evidence point.

No installed `runTrendMasterAutomationScheduledV1931` trigger was visible. Source has an installer, but source presence is not active-trigger proof.

## 9. Live automation queue has historical Line-ID type corruption

Current live `سجل تنبيهات التشغيل` contains historical `رقم البند` values rendered as dates such as:

```text
Tue Jan 01 3202 ...
Wed Jan 01 3186 ...
```

instead of literal `3202-01` / `3186-01` forms. Those corrupted values are also embedded in historical repetition keys.

Newer rows contain literal Line IDs.

This is strong evidence for centralized text Line-ID normalization before IDs are written or used in business keys.

Do not rewrite historical rows blindly.

## 10. Required Handover identity contract

The existing live schema stub should be evolved, not discarded blindly.

Minimum canonical event fields should include:

```text
ID
businessDate
shift/session
fromEmployee
fromDepartment
Order ID
Line ID
realStatus
blockerCode / blockerText
nextAction
nextOwner
receiptStatus
createdAt
updatedAt
request/event key
```

Conceptual stable key:

```text
HANDOVER|businessDate|shift|employee|LineID|stateRevision
```

Exact revision semantics belong in the shared integrity layer.

## Result

### Inventory

`INV-08 = PASS — SOURCE + LIVE DATA INVENTORY COMPLETE`

### Correctness status

- `REG-27 duplicate handover event`: **FAIL — WORKFLOW CONTRACT ABSENT**. A live header-only Handover schema stub exists, but there is no found backend writer, no live records, no explicit Line-ID + shift/businessDate event key, and End Day does not persist it.
- `REG-28 repeated OPS follow-up without new state`: **FAIL — SOURCE CONTRACT**. Generic OPS notes use new timestamp/UUID per write and no state fingerprint/idempotency key.
- `REG-29 two concurrent automation runs`: **FAIL — SOURCE RACE**. Trend Master deterministic-key check->append has no shared lock/run claim.

## Required future repair contract

Shared `trendos-integrity-v1.gs` should provide before module-specific patches:
1. `trendosBusinessDate_()` / Business Calendar.
2. normalized Order ID and Line ID helpers.
3. shared mutation lock wrapper.
4. durable event claim/complete/lookup.
5. automation run start/finish ledger.
6. explicit Handover event writer using the existing sheet or a controlled schema migration, keyed by Line ID + business date/shift.
7. OPS coach state fingerprint so the same recommendation is not re-emitted until source state changes.
8. ANDON structured entity binding to Order/Line when applicable.

## No production mutation

No Handover row, note, queue, trigger, Order or Line was changed during this inventory.
