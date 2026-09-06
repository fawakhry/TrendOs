# TrendOS Blackbox — PERF-CF-02CQ Final Self-Contained Candidate

Date: 2026-09-06
Checkpoint: `PERF-CF-02CQ — Screen View Mirror Refresh / Orders View D1 Canary Prerequisite`
Branch: `agent/go-live-2026-09-01-integrity`
Status: **USER APPROVED — PRE-BOUNDARY PASS — FINAL SELF-CONTAINED CANDIDATE CI/INTEGRITY PASS — LIVE APPS SCRIPT WRITE CHANNEL UNAVAILABLE — MANUAL IDE GATE — PRODUCTION UNCHANGED**

## Why the candidate was tightened again

After explicit user approval and successful pre-deploy boundary, the production Apps Script manifest was re-read.

`APPS_SCRIPT_DEPLOY_V1940.md` lists the currently expected production modules but does not guarantee that the legacy `D1_Full_Migration.gs` helper module exists in the live project.

To obey the user's approval scope — **02CQ Apps Script only** — the candidate was changed so deployment requires only one file and no legacy/full-migration helper module.

## Final self-contained candidate

File:

- `cloudflare-d1/D1_Screen_View_Mirror_Refresh_02CQ.gs`

Final behavior:

1. One Apps Script file only; no dependency on `D1_Full_Migration.gs`.
2. Exact authoritative spreadsheet lock:
   - `1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI`
3. Exact four-sheet allow-list only:
   - `واجهة خدمة العملاء`
   - `واجهة الطباعة`
   - `واجهة الليزر`
   - `واجهة المكبس`
4. Reads `D1_API_URL` from existing Script Properties.
5. Reads `D1_MIGRATION_SECRET` only into a local variable used for the authenticated POST header.
6. Migration secret is never logged, returned, committed, or put into a result object.
7. Reads raw/display/formula values from the four source views only.
8. Uses atomic `stage` per view.
9. Uses exactly one atomic `promote` for all four views after staging is complete.
10. Refuses if live `واجهة الطباعة` is header-only.
11. Verifies Google-vs-D1 row/column parity after promote.
12. Distinguishes audit state between:
    - staging may have mutated,
    - production mirror mutated after atomic promote.
13. Default-OFF remains enforced.
14. Preferred execution entrypoint:
    - `runD1ScreenViewMirrorRefresh02CQOnce()`
15. The one-shot entrypoint refuses a pre-existing ON gate, opens only the 02CQ gate for the synchronous call, and deletes the gate property in `finally`.
16. No Sheets mutation.
17. No Worker deployment.
18. No frontend D1 read enable.
19. No authority transfer.
20. No 02CL action.
21. No generic outbox drain.
22. No `EDGE_SESSION_SECRET` rotation.
23. No customer names/phones/notes diagnostic logging.

Self-contained code commits:

- initial self-contained/source-locked refactor: `08975727d29d253ec596ddb264430663b92bbf53`
- secret-local hardening: `8681bfad98e7caf57e9578048322493a84b689c8`
- final safety-test checkpoint: `c5fddeec7e9a58633a3321368473dabf2bf63b43`

## Final validation evidence

### 02CQ Safety CI

- Workflow: `TrendOS 02CQ Screen View Mirror Refresh CI`
- Run: `34001722179`
- Job: `101401658258`
- Conclusion: **SUCCESS**
- Marker: `PERF_CF_02CQ_SCREEN_VIEW_MIRROR_REFRESH_CANDIDATE_SAFETY_PASS`

### TrendOS Integrity V1

- Run: `34001722197`
- Job: `101401658423`
- Conclusion: **SUCCESS**

Passing integrity includes:

- composed Apps Script module syntax/collision,
- pre-deploy package safety,
- core integrity,
- Edge Orders/freshness,
- accounting integrity.

## Earlier safety-test failure during self-contained hardening

One intermediate CI attempt failed because the new safety test rejected returning the migration secret inside an internal helper object.

No production execution or deployment was involved.

The implementation was tightened instead of weakening the test:

- the secret is now local to the authenticated POST path,
- no helper returns the secret,
- final CI passed.

## Deployment channel remains the only blocker

User authorization is present.

However, the connected execution environment has no write/deploy operation for the live Apps Script project:

- no `clasp` workflow,
- no Apps Script API deployment credential,
- no accessible writable `application/vnd.google-apps.script` project via connected Drive,
- no existing protected web route that can install/execute arbitrary new Apps Script code.

The temporary pre-deploy boundary workflow was removed after evidence collection:

- cleanup commit: `bb0c57e0451cc008fe5698e51794af895b19852c`

Therefore no production Apps Script write has been fabricated or bypassed.

## Current production state

Unchanged from the successful pre-deploy boundary:

- Apps Script live print rows: `8`
- D1 print mirror: header-only (`sourceLastRow=1`, `rowCount=1`)
- `pendingOutbox=0`
- `cutover=false`
- `sheetsAuthoritative=true`
- 02CL OFF
- generic drain OFF
- unauthenticated Edge orders endpoint `401`
- frontend D1 read flag OFF
- no Worker deploy
- no secret rotation
- no production four-view refresh yet
- no post-refresh canary yet

## Minimal authorized operator step

Because the final candidate is now self-contained, the only required Apps Script project write is adding this one file to the existing live TrendOS Apps Script project.

The safest operator sequence is:

1. Open the existing TrendOS Apps Script project used by production.
2. Do NOT use the Sheet tab `سكريبت Apps Script` as source.
3. Add one script file named `D1_Screen_View_Mirror_Refresh_02CQ`.
4. Copy the exact contents of `cloudflare-d1/D1_Screen_View_Mirror_Refresh_02CQ.gs` from the working branch.
5. Save.
6. Run `getD1ScreenViewMirrorRefresh02CQStatus()` once and confirm the gate reports OFF.
7. Run `runD1ScreenViewMirrorRefresh02CQOnce()` exactly once.
8. Do not edit or rotate `D1_API_URL`, `D1_MIGRATION_SECRET`, or `EDGE_SESSION_SECRET`.
9. Do not enable frontend D1 reads.

A new web-app version is not technically required merely to execute this bounded function manually from the Apps Script IDE; avoiding an unrelated web-app version change is narrower than a full production deployment. If the project operating procedure nevertheless requires a new deployment version, only the approved 02CQ module may be added; existing modules must remain unchanged.

## Continuation after operator execution

After the one-shot function is executed, continue immediately with no rediscovery:

1. Read D1 catalog for all four mirrors.
2. Require `واجهة الطباعة sourceLastRow > 1`.
3. Verify four-view source row/column parity.
4. Rerun authenticated print D1-vs-Apps-Script canary.
5. Keep `__DEBT__` on Apps Script fallback.
6. Verify final production boundary.
7. Record and close/block 02CQ.

## Safety conclusion

**PASS / READY FOR SINGLE-FILE MANUAL APPS SCRIPT IDE EXECUTION.**

All work possible through the connected tools is complete. Production remains unchanged until the approved 02CQ file is added to the live Apps Script project and its one-shot runner is executed.
