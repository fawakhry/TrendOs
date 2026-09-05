# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint مغلق بالكامل

`PERF-CF-02CL — Production Outbox → Sheets Reconciliation Qualification`

الحالة: **VERIFIED PASS — CLOSED**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CL_PRODUCTION_OUTBOX_TO_SHEETS_PASS_CLOSED.md`

## checkpoint السابق المغلق

`PERF-CF-02CK — Production Cloud Write Business Qualification`

الحالة: **VERIFIED PASS — CLOSED**

## 02CL final evidence sequence

1. Candidate exact-target reconciliation contract prepared and CI PASS.
2. Live read-only preflight PASS: target absent from Sheets; exact outbox target pending once / attempts 0.
3. Apps Script Version 153 live/default-OFF.
4. Isolated Worker 02CL route live/default-OFF.
5. Dedicated reconciliation secret configured on Apps Script and Worker.
6. Temporary qualifier `wael` was re-enabled and a normal login generated a fresh employee session token.
7. Auth-only checkpoint passed after employee-token secret placement correction.
8. Apps Script 02CL gate was enabled manually by the user only for execution.
9. Worker gate was enabled only through controlled workflow commit `108c9e0f3e3fd468db1eb1bd9644a8cd5832443e`.
10. Compact execution Run `33997066271` / Job `101389338764` succeeded.
11. Exact target `CW-PROD-QUAL-33975124471` reconciled once to Sheets.
12. D1 target state became `outbox=synced`, `event=reconciled`, `sheets=synced`, `attempts=1`.
13. Authoritative Orders sheet contains the target exactly once at row `311`.
14. Replay proof succeeded as idempotent/no-op with `d1Written=false`, `sheetsWritten=false`, `mutationCount=0`.
15. Production Shadow remained read-only/mutation-free.
16. Worker gate was disabled through commit `b930a65d78bf92df8fe9444d9e56abd7850ee8ec` and OFF Run `33997108135` / Job `101389450009` passed.
17. User manually disabled Apps Script gate and provided log: `02CL APPS SCRIPT GATE DISABLED = 0`.
18. Temporary qualifier `wael` was disabled and token cleared.
19. Temporary workflow `.github/workflows/trendos-02cl-exec-temp2.yml` was deleted in cleanup commit `2e5d682bc8ee009b5c476c760176dcea2070229e`.
20. No cutover, no authority transfer, no generic drain, and no `EDGE_SESSION_SECRET` rotation occurred.

## Production state الآن

- Production Worker: `trendos-d1-api`
- Production D1: `trendos-main`
- Production Cloud Write: **ON**
- Production Shadow: **ON / read-only / mutation-free**
- Production cutover: **OFF**
- Sheets / Apps Script authority: **YES**
- exact target: `CW-PROD-QUAL-33975124471`
- exact target outbox status: `synced`
- exact event status: `reconciled`
- exact sheets status: `synced`
- exact attempts: `1`
- target Orders-sheet rows: `1`
- Apps Script 02CL gate: **OFF**
- Worker 02CL gate: **OFF**
- generic outbox drain: **not exposed / not used**
- reconciliation executed: **YES — exact target only**
- replay proof: **PASS — no-op**
- temporary qualifier `wael`: **disabled / token cleared**
- frontend cutover: **NO**
- normalized-data cutover: **NO**
- authority transfer from Sheets to D1: **NO**
- `EDGE_SESSION_SECRET` rotation: **NONE**

## نقطة البداية لأي شات جديد

1. اقرأ `00_INDEX.md` ثم `01_CURRENT_STATE.md`.
2. اقرأ أحدث 02CL PASS record:
   `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CL_PRODUCTION_OUTBOX_TO_SHEETS_PASS_CLOSED.md`
3. اعتبر 02CK و02CL مغلقين PASS ولا تعيدهما.
4. لا تفتح Apps Script/Worker 02CL gates مرة أخرى إلا داخل checkpoint جديد محدود ومؤرخ.
5. لا تستخدم generic outbox drain.
6. لا تدوّر `EDGE_SESSION_SECRET`.
7. لا تفعل frontend cutover أو authority transfer قبل موافقة صريحة وcheckpoint مستقل.
8. حافظ على Sheets / Apps Script كـauthoritative source حتى cutover مستقل.
9. الخطوة التالية الموصى بها، عند موافقة المستخدم:
   `PERF-CF-02CM — Post-02CL Production Stability / Cutover Readiness Preflight`.
10. ابدأ 02CM بقراءات صحية وأداء read-only، ثم تشخيص بطء المنصة الحالية ومسارات Apps Script/Sheets المتبقية.
