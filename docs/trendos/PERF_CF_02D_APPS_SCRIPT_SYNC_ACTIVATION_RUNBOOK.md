# PERF-CF-02D — Apps Script D1 Sync Activation Runbook

**Date:** 2026-09-04  
**Status:** CONTROLLED PRODUCTION RUNBOOK — NOT YET EXECUTED BY CURRENT TOOL ENVIRONMENT

## Goal

Restore continuously fresh D1 mirrors without changing the authoritative write boundary.

Target:

- `الأوردرات` + `بنود الأوردرات` stay atomically synchronized to D1.
- `customers / orders / messages / conversations` normalized data stays continuously synchronized to D1.
- Edge serves D1 only while the required data is fresh.
- Apps Script fallback remains available.
- Google Sheets + Apps Script remain authoritative writes.
- Cloud Write remains OFF.

## Hard boundaries

1. Do **not** replace production `Code.gs` from GitHub.
2. Do **not** use the `سكريبت Apps Script` Sheet as deployment source.
3. Do **not** enable `TRENDOS_CLOUD_WRITE_V1_ENABLED`.
4. Do **not** change `config.js` / frontend production routing during this runbook.
5. Do **not** resume CORE-P0 / `3536-01` remediation here.
6. Do **not** delete audit/history rows or source Sheets.
7. Installation and runtime activation are separate gates.

## Relevant prepared files

Existing Orders + Lines live sync:

`cloudflare-d1/D1_Orders_Live_Sync.gs`

Prepared normalized live sync:

`cloudflare-d1/D1_Normalized_Live_Sync.gs`

Normalized source must be added as a **separate Apps Script file**. Do not merge it into the consolidated `Code.gs`.

## Gate 0 — capture current production state before mutation

Expected:

- serving web app remains Version 146;
- business integrity families remain unchanged;
- existing Apps Script project contains the known D1 migration/full-migration/orders-live-sync dependencies;
- no normalized live-sync trigger exists yet.

Capture:

1. Apps Script deployment/version currently serving.
2. installed triggers with handler names.
3. `getD1OrdersLiveSyncStatus()` output.
4. current Script Properties **names/status only**, never secret values.
5. current Preview mirror evidence for Orders + Lines.

If state differs materially from the recorded Version-146 checkpoint, stop and reconcile before source changes.

## Gate 1 — diagnose existing Orders + Lines live sync

Run read-only:

```javascript
getD1OrdersLiveSyncStatus()
```

Check:

- `enabled`
- trigger count/handler
- last attempt phase
- last successful run
- last error
- consecutive skips / starvation
- mirror freshness

### Expected healthy state

- enabled = true;
- exactly one `d1OrdersLiveSyncTick` time trigger;
- latest attempt = success;
- Orders and Lines have the same promote/sync point;
- mirror age <=180 seconds at observation time.

### If disabled

Do not merely add a second trigger. Use the controlled start function after dependency preflight:

```javascript
startD1OrdersLiveSync()
```

The start function must:

- confirm atomic mirror capability;
- run one full first sync;
- only create the 1-minute trigger after first-run PASS;
- remove duplicate handler triggers before creating the canonical one.

### If error

Capture exact error and do not loop/retry blindly.

Common contracts to verify before retry:

- D1 API URL/config available;
- migration/import secret configured in Apps Script properties;
- Worker atomic capability reports all staging tables present;
- source sheets `الأوردرات` and `بنود الأوردرات` exist;
- source rows can be read within execution limits;
- ScriptLock is not continuously starved.

### If script-lock starvation

Do not weaken the lock or allow concurrent promote runs.

First inspect overlapping Head/time-trigger executions. The Orders sync currently stages both sheets under one ScriptLock, so persistent overlapping traffic can starve the sync. Fix contention/trigger overlap rather than removing atomic protection.

## Gate 2 — verify one successful Orders/Lines first run

Expected:

- `success=true`
- `atomic=true`
- both sheets staged
- one atomic promote includes both sheet names
- source row counts match copied rows
- mirror stats remain schema-mutation-free

Immediately verify from Preview:

- `الأوردرات`: ready, row parity true, live-sync note correct, <=180s old
- `بنود الأوردرات`: same requirements
- both share the same fresh promote point

If this fails, stop. Do not proceed to normalized activation.

## Gate 3 — install normalized live-sync source only

Add a new Apps Script source file containing the exact reviewed source from:

`cloudflare-d1/D1_Normalized_Live_Sync.gs`

Do not modify `Code.gs` for this install.

### Required dependencies

Before activation, verify these existing functions resolve in the project:

- `ss_()`
- `d1MigrationConfig_()`
- `d1JsonFetch_()`

The normalized source intentionally reuses the existing protected migration/import configuration. Never copy secret values into source code.

## Gate 4 — normalized preflight/status

Run:

```javascript
getD1NormalizedLiveSyncStatus()
```

Expected before first activation:

- file loads without syntax/collision errors;
- enabled is false or absent;
- zero normalized handler triggers;
- no source Sheet mutation.

Verify source tabs exist:

- `الأوردرات`
- `مدير العملاء - الرسائل`
- `مدير العملاء - المحادثات`

Current read-only source evidence from PERF-CF-02D already found compatible rows, but re-check at activation time because the source can change.

## Gate 5 — first normalized activation

Run exactly:

```javascript
startD1NormalizedLiveSync()
```

Expected behavior:

1. verify migration API config without logging values;
2. remove prior normalized triggers;
3. set normalized enabled flag;
4. perform a complete first sync;
5. every entity final chunk must advance freshness;
6. if any entity fails, disable normalized sync and remove trigger;
7. only after first-run PASS create exactly one 1-minute `d1NormalizedLiveSyncTick` trigger.

Required first-run result:

`success=true`

Entities required:

- customers
- orders
- messages
- conversations

Do not proceed if any entity reports partial/failure.

## Gate 6 — trigger inventory after activation

Expected exactly:

- one `d1OrdersLiveSyncTick` time trigger;
- one `d1NormalizedLiveSyncTick` time trigger.

No duplicate handler triggers.

Check both status functions after at least one subsequent scheduled window:

```javascript
getD1OrdersLiveSyncStatus()
getD1NormalizedLiveSyncStatus()
```

Both must show recent success, not merely `Completed` executions.

## Gate 7 — Cloudflare Preview qualification

Re-run:

`TrendOS Cloudflare Auto Preview`

Required PASS:

- Preview health 200;
- anonymous Edge auth 401;
- signed Edge auth PASS;
- Cloud Write OFF;
- mutation route 423;
- Preview normalized import without secret 401;
- mirror capability read-only PASS;
- Orders + Lines <=180s;
- normalized data-freshness endpoint returns fresh=true;
- Customer Manager Edge read returns D1 data only while fresh.

## Gate 8 — sustained freshness, not one snapshot

Run the existing workflow:

`TrendOS Cloudflare Freshness Stability`

It observes 4 consecutive windows, separated by 70 seconds.

Required:

- Orders fresh in every window;
- Lines fresh in every window;
- synchronized promote point remains valid;
- no regression to stale state.

Then perform an equivalent sustained normalized freshness observation. A single successful first import is insufficient for read cutover.

## Gate 9 — performance comparison

Record:

- Preview Edge median/p90;
- D1 mirror median/p90;
- Apps Script current median/p90;
- number of frontend requests after polling coalescing;
- fallback behavior during deliberate/observed stale condition.

Latest pre-activation PERF-CF-02D benchmark for reference:

- Edge median ~376.6 ms, p90 ~420.6 ms;
- D1 mirror Orders median ~346.9 ms, p90 ~375.3 ms;
- earlier Apps Script production baseline was measured in seconds/tens of seconds.

## Gate 10 — separate production read cutover decision

Even after all sync gates PASS, **do not automatically cut production frontend reads over**.

Read cutover requires a separate checkpoint with:

- sustained Orders/Lines freshness;
- sustained normalized freshness for applicable routes;
- authenticated employee-session contract;
- Apps Script fallback;
- rollback route/config ready;
- no authoritative write change;
- recorded Expected / Actual / PASS|FAIL.

## Rollback — normalized sync

At any instability:

```javascript
stopD1NormalizedLiveSync()
```

Expected:

- normalized enabled flag becomes false;
- normalized time trigger is removed;
- claim state cleared;
- source Sheets remain untouched;
- Edge normalized reads become stale and fail closed to Apps Script fallback after freshness TTL.

## Rollback — Orders/Lines sync

If corrective activation itself causes an unsafe condition:

```javascript
stopD1OrdersLiveSync()
```

Expected:

- Orders live-sync enabled flag false;
- Orders live-sync trigger removed;
- last good D1 snapshot remains readable as a mirror but will age stale;
- frontend/Edge freshness gates must prevent stale cutover use.

Stopping D1 mirror sync does **not** alter Google Sheets source data.

## Success definition

This runbook is PASS only when all are true:

1. existing Orders/Lines sync is operational and sustained fresh;
2. normalized sync is installed and sustained fresh;
3. exactly one trigger exists per sync handler;
4. Edge auth/fallback/safety gates PASS;
5. Cloud Write remains OFF;
6. source authority remains Sheets + Apps Script;
7. no stale D1 data is served as fresh;
8. a separate production read-cutover checkpoint is still pending.
