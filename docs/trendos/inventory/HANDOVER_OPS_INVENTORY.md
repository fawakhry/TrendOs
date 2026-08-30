# Handover / OPS Inventory

> Phase 0 read-only inventory. No production mutation was performed.

## Scope

Mapped the currently accessible operational-coaching and end-of-day paths:
- `getMatbagyNotes_()` / `saveMatbagyNote_()` backend.
- `employee-ops-coach-v1.js`.
- `employee-manager-strips-v2.js`.
- `employee-andon-v1.js`.
- current `app.js` end-day summary behavior.
- V1931 Trend Master automation queue.
- live `نوت مطبعجي` and `سجل تنبيهات التشغيل` evidence.

## 1. No canonical Handover ledger/backend was found

In the inspected `Code.gs` snapshot there is no dedicated:
- `handover` route/function.
- shift handover sheet contract.
- business key such as `Line ID + employee/shift + businessDate`.
- explicit open-work snapshot persisted at shift close.

The current frontend End Day flow in `app.js` only refreshes Dashboard data and shows an alert summary containing counts/score. It does not persist a handover event or line-level next-step state.

Therefore a real auditable Handover workflow is **not implemented in the accessible current source**.

## 2. Live OPS Coach tells employees to hand over, but does not itself create Handover records

Current live `نوت مطبعجي` contains `OPS_COACH` messages from `AI مدير التشغيل`.

Examples include 2026-08-26 21:57 Cairo messages instructing:
- Jaber to record Hand-over for every open Laser job: Order ID, real status, blocker reason, next step.
- Revan to record Hand-over for every open Print/Press job plus final Press Queue status.

Those are **instructions**, not canonical handover records.

A search of the same live notes did not find a dedicated `HANDOVER` category/title/key. No Line-ID-scoped handover ledger was found.

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

Because every click/retry creates a new timestamp and the backend blindly appends, retrying the same logical reply can create another note.

Current live `نوت مطبعجي` contains one observed `OPS_REPLY` from Jaber, but the current small live baseline does not prove duplicate absence under retry/concurrency.

## 5. ANDON uses the same non-idempotent note path

`employee-andon-v1.js` builds:

```text
ANDON | <reason> | <optional free-text detail>
```

and writes it using:

```text
category = OPS_REPLY
title = OPS_REPLY|<employee>|ANDON|<reason>|<new ISO timestamp>
```

Again, no stable request/event key exists.

There is also no structured mandatory Order ID or Line ID field in the ANDON contract; the UI only asks the employee to mention the job/problem in free text if needed.

Thus an ANDON cannot reliably be joined to a specific Line ID for integrity reporting.

## 6. OPS coach generation source is not fully reconciled

Accessible frontend files (`employee-ops-coach-v1.js`, `employee-manager-strips-v2.js`) **read/render** `OPS_COACH` notes.

The inspected merged `Code.gs` provides only generic `getMatbagyNotes_` / `saveMatbagyNote_`; no dedicated `OPS_COACH` producer/scheduler was found there.

Live notes prove that `AI مدير التشغيل` has written OPS_COACH messages historically, but the exact producer/code path for those messages is not present in the currently reconciled source set.

Treat coach-production source as **UNKNOWN until source composition is reconciled**, not as a verified current automation.

## 7. Trend Master automation queue has deterministic keys, but no concurrency lock

V1931 `سجل تنبيهات التشغيل` is different from the free-form OPS Coach notes.

`appendAutomationQueueOnceV1931_()` builds deterministic repetition keys such as:
- `STATUS|orderId|lineId|status`
- `OVERDUE|orderId|lineId|date`
- `LOWSTOCK|material|department|date`

This is good logical-key design for sequential runs.

However the implementation is:

```text
read all existing keys
 -> if key exists return false
 -> append row
```

with no ScriptLock around check -> append.

Two concurrent automation runs can therefore both read the same pre-insert key set and append the same logical event.

`runTrendMasterAutomationCoreV1931_()` itself also has no outer shared lock or durable automation-run claim.

## 8. Installed automation trigger evidence

The previously inspected Apps Script trigger UI showed only the D1 live-sync trigger (`d1OrdersLiveSyncTick`) at that evidence point.

No installed `runTrendMasterAutomationScheduledV1931` trigger was visible then.

Source provides an installer for an hourly trigger, but source presence is not proof that it is currently installed.

Therefore do not claim the Trend Master hourly automation is currently active without newer trigger evidence.

## 9. Live automation queue has historical Line-ID type corruption

Current live `سجل تنبيهات التشغيل` contains many historical `رقم البند` values rendered as dates such as:

```text
Tue Jan 01 3202 ...
Wed Jan 01 3186 ...
```

instead of literal IDs like `3202-01` / `3186-01`.

Those corrupted values are also embedded inside historical repetition keys.

Newer rows in the same sheet visibly contain literal forms such as `3203-01`, `3212-02`, etc.

This is strong historical evidence for the global requirement that Line IDs must be normalized/stored as text before use in business keys.

Do not rewrite historical rows blindly during inventory.

## 10. Handover identity contract is missing

The required future Handover event must be line-scoped, not just free text.

Minimum key/fields:

```text
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
createdAt
request/event key
```

A recommended stable logical key is conceptually:

```text
HANDOVER|businessDate|shift|employee|LineID|stateRevision
```

Exact revision semantics should be centralized in the shared integrity layer rather than hard-coded separately in UI modules.

## Result

### Inventory

`INV-08 = PASS — SOURCE + LIVE DATA INVENTORY COMPLETE`

### Correctness status

- `REG-27 duplicate handover event`: **FAIL — CONTRACT ABSENT**. No canonical Line-ID + shift/businessDate handover event exists.
- `REG-28 repeated OPS follow-up without new state`: **FAIL — SOURCE CONTRACT**. Generic OPS notes use new timestamp/UUID per write and have no state fingerprint/idempotency key.
- `REG-29 two concurrent automation runs`: **FAIL — SOURCE RACE** for Trend Master queue check->append because no shared lock/run claim protects deterministic-key insertion.

## Required future repair contract

The shared `trendos-integrity-v1.gs` layer should provide before module-specific patches:
1. `trendosBusinessDate_()` / Business Calendar.
2. normalized Order ID and Line ID helpers.
3. shared mutation lock wrapper.
4. durable event claim/complete/lookup.
5. automation run start/finish ledger.
6. explicit Handover event model keyed by Line ID + business date/shift.
7. OPS coach state fingerprint so the same recommendation is not re-emitted until source state changes.
8. ANDON structured entity binding to Order/Line when applicable.

## No production mutation

No notes, queues, triggers, Orders or Lines were changed during this inventory.
