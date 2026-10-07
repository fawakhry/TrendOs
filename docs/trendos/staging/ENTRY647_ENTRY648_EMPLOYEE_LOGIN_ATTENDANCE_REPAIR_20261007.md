# Entry647/648 — Employee login + attendance runtime repair — 2026-10-07

## Trigger
Owner reported:
- employee start-day attendance prompt reappears immediately after click;
- Diaa saw "Canary Native Auth غير جاهز على Cloud.";
- after repair Diaa could enter while other employees still appeared affected.

## Runtime diagnosis before repair
Read-only Entry647 diagnostic:
- Run 37614146869 / Job 112768316417 = SUCCESS.
- Auth runtime: NATIVE, nativeOnly=true, 6/6 native-ready.
- Ops: GENERAL / epoch7.
- Frontend config: global Native=true, Canary=false.
- Dispatcher live hash matched repo.
- app.js live hash matched repo.
- attendance-clockin-ui-v1.js live hash matched repo.
- attendance-v1.js live hash was stale:
  - repo qualified hash d7f2625aa03c18486069ee274d960adbf8cdcee4
  - live stale hash 4472b66306a31c365a5a3e2b98e73dece85e93f1
  - live file lacked normalizeAttendanceBackendResponse.
- D1 read-only proof for Cairo date 2026-10-07 already showed 2 attendance days, 2 clockins and 2 start pulses.
Conclusion: attendance writes were succeeding; the stale frontend response contract caused the start overlay to reappear.

## Repair source
- commit 0ee185b18d4a855c3572acc26296674333e451cc
  - restored qualified attendance response normalization;
  - cache-busted config/app/dispatcher/attendance/clockin asset URLs;
  - added stale-Canary compatibility guard: if a stale client still selects Canary but authoritative auth health is already NATIVE + nativeOnly + required native-ready count, stale transitional Canary state no longer blocks the Native path.
- repo CI Run 37614885337 = SUCCESS.

## Controlled deploy attempts
Attempt 1:
- Run 37615132869 = FAIL before deploy.
- Exact frontend version guard detected concurrent production drift from cfff20f6... to e2717f15...
- Production mutation=NO.
- New runtime was identified as the independent secure EasyStore SSO repair; it changed app.js while proving all other static assets invariant.
- Entry647 rebased on e2717f15... to preserve that repair.

Attempt 2:
- Run 37615380360 = FAIL after temporary deploy.
- Repair assets and runtime content checks passed.
- Cache-Control check failed; automatic rollback restored e2717f15...
- rollback used=YES.

Attempt 3:
- Run 37615605269 = FAIL after temporary deploy.
- Repair assets and runtime content checks passed.
- Following redirects did not solve the header assertion because Workers Static Assets serve asset responses outside the intended worker header rewrite path.
- automatic rollback restored e2717f15...
- rollback used=YES.

Attempt 4:
- Run 37615852582 = FAIL after temporary deploy.
- Removed the out-of-scope no-store header architecture change; retained versioned URL cache busting.
- Live attendance restore PASS, dispatcher hardening PASS, unrelated app/clockin preservation PASS, runtime postflight PASS.
- D1 invariant check compared Wrangler JSON files including changing execution metadata, so it failed despite business counts being unchanged.
- automatic rollback restored e2717f15...
- rollback used=YES.

Attempt 5 — final:
- Run 37616027251 / Job 112774437142 = SUCCESS.
- Pre frontend version: e2717f15-5166-43ac-b1df-702d0e76642a.
- Post frontend version: 3950c36b-c3ee-4fd4-87b6-f6c2e2eabf03.
- propagation attempt 4.
- live attendance restored PASS.
- dispatcher hardening PASS.
- app.js and attendance-clockin-ui.js preserved against exact pre-deploy runtime.
- Auth postflight NATIVE / 6 of 6.
- frontend global Native=true; Canary=false.
- D1 attendance counts before and after were exactly:
  attendanceDays=2, clockins=2, startPulses=2.
- Entry647 deployment itself performed no D1 attendance/business mutation.
- Accounting mutation=NO.
- EasyStore mutation=NO.
- rollback used=NO.

## Entry648 employee login matrix
Read-only workflow:
- commit d1f26ad5bf7a6befed9eafdfc2872beb1b32918f
- Run 37617351984 / Job 112778800227 = SUCCESS.
- frontend version 3950c36b-c3ee-4fd4-87b6-f6c2e2eabf03.
- runtime Native 6/6 PASS; global Native PASS; attendance runtime PASS.
- No password value, password hash, token value or secret was read.

Safe account/session facts:
- ضياء: active=1, failedAttempts=0, lockedNow=0, mustChange=0, activeSessions=2, last login 2026-10-07 14:30 Cairo.
- وائل: active=1, failedAttempts=0, lockedNow=0, mustChange=0, activeSessions=1, last login 2026-10-07 14:00 Cairo; attendance + clockin recorded today and still open.
- رحمه: active=1, failedAttempts=0, lockedNow=0, mustChange=0, activeSessions=14, last login 2026-10-07 14:34 Cairo; attendance + clockin recorded today and still open.
- جابر: active=1, failedAttempts=0, lockedNow=0, mustChange=0, activeSessions=0; last login 2026-10-06 14:13 Cairo.
- ريفان: active=1, failedAttempts=0, lockedNow=0, mustChange=0, activeSessions=0; last login 2026-10-06 19:29 Cairo.
- شريف: active=1, failedAttempts=0, lockedNow=0, mustChange=0, activeSessions=0; last login 2026-10-06 22:39 Cairo.

Interpretation:
- There is no D1 account-disable, lockout, must-change or native-readiness gap for any of the six employees.
- Wael and Rahma have current Native sessions and today attendance data, so their Cloud auth and attendance paths are proven functional.
- For Jaber/Revan/Sherif, failedAttempts remains zero and no new active session exists, which is consistent with their current client attempt not reaching the Native login handler rather than being rejected by it.
- Immediate operational recovery for a stale employee browser is to close old TrendOS tabs and open a fresh cache-busted root URL, then log in normally. Password reset is not justified by current runtime evidence.

```ini
ENTRY647=PASS
FRONTEND_VERSION=3950c36b-c3ee-4fd4-87b6-f6c2e2eabf03
AUTH_MODE=NATIVE
D1_NATIVE_READY=6/6
FRONTEND_GLOBAL_NATIVE_AUTH=true
FRONTEND_NATIVE_CANARY=false
ATTENDANCE_UI_CONTRACT=RESTORED
ATTENDANCE_WRITE_LOSS=NO
ROLLBACK_USED_FINAL_ATTEMPT=NO
ENTRY648=PASS_READONLY_DIAGNOSTIC
ALL_6_ACTIVE=YES
ALL_6_LOCKED_NOW=NO
ALL_6_MUST_CHANGE=NO
PASSWORD_VALUE_READ=NO
PASSWORD_HASH_READ=NO
TOKEN_VALUE_READ=NO
ACCOUNTING_MUTATION=NO
EASYSTORE_MUTATION=NO
```
