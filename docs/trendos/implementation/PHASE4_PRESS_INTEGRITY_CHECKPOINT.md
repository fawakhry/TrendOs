# Phase 4 — Press Integrity Checkpoint

Status: **PREPARED + TESTED ON GITHUB BRANCH / NOT DEPLOYED**

Working branch: `agent/go-live-2026-09-01-integrity`

## Files

- `trendos-integrity-v1.gs`
- `trendos-press-integrity-v1.gs`
- `tests/trendos_press_integrity_v1.test.js`
- `.github/workflows/trendos-integrity-v1.yml`

Latest CI run: `33320046858` — **SUCCESS**.

## Production baseline preserved

Current live `تشغيل - جلسات المكبس` uses the existing 18-column display schema. The integrity module does **not** call legacy `pressEnsure_()` and does not blindly rewrite that header.

Current Press power/rate settings are blank and disabled. The new module preserves that state and never invents energy or cost values.

## Queue contract

`trendosPressQueueV1_()`:
- reads `بنود الأوردرات` directly.
- returns the full eligible Line queue, not a 12-row UI slice.
- includes normalized Order ID + normalized Line ID + customer + status + priority.
- excludes Press-complete/final/duplicate statuses (`جاهز للاستلام`, `تم التنفيذ`, `تم التسليم`, cancelled variants, `مكرر`).
- detects conflicting duplicate Order/Line columns when populated with different values.
- rejects invalid/missing Order ID or Line ID on a Press-eligible row.
- rejects duplicate eligible Line IDs instead of silently counting them twice.

A session cannot open while the current Press queue contains untraceable IDs.

## Durable session checkpoint

Two new canonical integrity sheets are proposed on future controlled deployment:

- `تشغيل - تكامل جلسات المكبس V1`
- `تشغيل - بنود جلسات المكبس V1`

They are not created in production by this GitHub preparation.

The metadata ledger stores:
- Session ID.
- business date.
- OPENING / OPEN / CLOSING / CLOSED state.
- operator/support/fixed start.
- start/end times.
- queue line/order counts.
- power/rate snapshot.
- full start Queue snapshot JSON + hash.
- checkpointed Stop payload.
- final result JSON.

This makes partial Start/Stop failures resumable rather than relying on cross-sheet writes being atomic.

## Start integrity

`trendosPressControlV1_(op=start)` runs under the shared ScriptLock.

Behavior:
- >1 open metadata session -> fail closed with an integrity error.
- one OPEN session -> return the same Session ID.
- one OPENING session -> repair its Line snapshot/display rows and open the same Session ID.
- one CLOSING session -> do not reopen it; surface the closing session so Stop can be retried.
- no open session -> validate current Queue, persist a complete snapshot checkpoint, populate Line ledger, then mark OPEN.

Repeated Start cannot create a second open session under the same shared lock.

## Line-level traceability

At Start every eligible Press Line is snapshotted to the session Line ledger with:
- Session ID.
- Order ID.
- Line ID.
- customer.
- priority.
- status at session start.

At Stop the ledger additionally records:
- status at close.
- whether that Line was actually completed in this Press session.
- close time.

This closes the old contract gap where sessions contained only aggregate counts and could not prove which Line was pressed.

## Stop integrity

Future Stop contract requires `sessionId`.

Completed work must be supplied as explicit `completedLineIds`.

Rules:
- completed Line IDs must be a subset of the session's immutable start snapshot.
- `ordersPressed > 0` without Line IDs fails closed (`lineIdsRequired`).
- optional submitted order count must equal the number of unique Orders derived from completed Line IDs.
- Stop first checkpoints the immutable completed-Line payload in metadata as `CLOSING`.
- a partial failure can retry/resume the same Stop payload.
- Stop retry with a different payload is rejected.
- once CLOSED, repeated Stop returns the stored result with `alreadyClosed:true` and performs no second business mutation.

## Energy/cost rule

Duration can be calculated from timestamps.

Energy/cost are only calculated when a positive configured Press kW and electricity tariff were snapshotted at Start.

With current disabled/blank live settings:
- power remains blank.
- kWh remains blank.
- electricity cost remains blank.
- cost/order remains blank.

The display note explicitly says the cost was not calculated because there is no approved configuration.

## UI compatibility requirement

Current `press-control-v1.js` Stop UI only asks for a numeric order count and does not send Session ID / completed Line IDs.

Therefore **do not wire the new backend to production before updating and testing the Press UI**.

Future UI must:
- retain the active Session ID returned by status/start.
- show the session's Line snapshot.
- let the operator select/confirm completed Line IDs.
- send `sessionId + completedLineIds` on Stop.

No Line completion will be guessed from an aggregate number.

## Automated tests passing

Tests cover:
- Press queue returns valid traceable Lines and excludes already completed Press lines.
- first Start creates one metadata session, one display row and Line snapshot rows.
- repeated Start reuses the same Session ID and creates no duplicates.
- Stop without Session ID is rejected.
- aggregate `ordersPressed` without Line IDs is rejected.
- completed Line outside session snapshot is rejected.
- explicit completed Line IDs close the session and preserve Line-level traceability.
- close status is recorded independently of the operator's completion declaration.
- blank power/rate creates no fake cost.
- repeated Stop returns `alreadyClosed` and does not add rows.
- invalid Press Queue IDs block a new session.
- multiple open sessions fail closed.

## Not yet wired

Future controlled route:

`pressControlV1` -> `trendosPressControlV1_`

only after the matching frontend Stop contract is updated and runtime-tested.

No production Apps Script, Sheet row, trigger, D1 table or deployment was changed.

## Phase 4 status

**IMPLEMENTED ON WORKING BRANCH + AUTOMATED TESTS PASS.**

Not yet `DEPLOYED` or `RUNTIME VERIFIED`.

Next implementation lane: **Invoice / Ready Sweep integrity**.
