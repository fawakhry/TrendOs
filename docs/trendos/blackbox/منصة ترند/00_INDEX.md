# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint مغلق بالكامل

`PERF-CF-02CK — Production Cloud Write Business Qualification`

الحالة: **VERIFIED PASS — CLOSED**

## المرحلة الحالية

`PERF-CF-02CL — Production Outbox → Sheets Reconciliation Qualification`

الحالة الحالية:

**AUTH PASS — EXECUTION HOLD — SECRET PLACEMENT CORRECTION REQUIRED — BOTH GATES OFF — NO RECONCILIATION**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CL_AUTH_PASS_SECRET_PLACEMENT_CORRECTION_HOLD.md`

## 02CL evidence sequence

1. Candidate exact-target reconciliation contract prepared and CI PASS.
2. Live read-only preflight PASS: target absent from Sheets; exact outbox target pending once / attempts 0.
3. Apps Script Version 153 live/default-OFF.
4. Isolated Worker 02CL route live/default-OFF.
5. Dedicated reconciliation secret was configured on Apps Script and Worker before later user-side secret-slot confusion.
6. `wael` was re-enabled for temporary auth qualification and a normal login generated a fresh employee session token.
7. Earlier mismatches occurred because the employee session token was not placed in the correct GitHub employee-token secret slot.
8. Latest rerun succeeded: Run `33987326112` / Job `101386927970` with marker `02CL_WAEL_EDGE_SESSION_EXCHANGE_PASS`.
9. The user identified that the employee token had previously been placed into `TRENDOS_PROD_RECONCILE_QUALIFY_SECRET`, which is the reconciliation secret slot, not the employee-token slot.
10. Because execution was paused immediately after auth PASS, no gates opened and no reconciliation executed.
11. Both execution gates remain OFF.

## Production state الآن

- Production Worker: `trendos-d1-api`
- Production D1: `trendos-main`
- Production Cloud Write: **ON**
- Production Shadow: **ON / read-only / mutation-free**
- Production cutover: **OFF**
- Sheets / Apps Script authority: **YES**
- last verified pending outbox before execution: `1`
- exact target: `CW-PROD-QUAL-33975124471`
- last verified exact target status: `pending`
- last verified attempts: `0`
- target Orders-sheet rows: `0`
- Apps Script 02CL gate: **OFF**
- Worker 02CL gate: **OFF**
- reconciliation executed: **NO**
- Auth exchange for `wael`: **PASS**
- `EDGE_SESSION_SECRET` rotation: **NONE**

## نقطة البداية لأي شات جديد

1. اقرأ `00_INDEX.md` ثم `01_CURRENT_STATE.md`.
2. اقرأ أحدث `AUTH_PASS_SECRET_PLACEMENT_CORRECTION_HOLD` blackbox record.
3. اعتبر 02CK مغلق PASS ولا تعيده.
4. لا تنفذ reconciliation قبل تصحيح/تأكيد فصل الأسرار.
5. استخدم `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN` فقط لتوكن جلسة الموظف المؤقت.
6. استخدم `TRENDOS_PROD_RECONCILE_QUALIFY_SECRET` فقط لسر المصالحة المحدودة 02CL.
7. أعد readiness probe للـWorker/Apps Script والبوابات OFF بعد تصحيح الأسرار.
8. لا تفتح Apps Script/Worker 02CL gates إلا مباشرة قبل bounded exact-target execution.
9. لا تستخدم generic outbox drain ولا تدوّر `EDGE_SESSION_SECRET`.
10. بعد التنفيذ: exactly one reconciliation + one replay-noop، ثم cleanup/disable فوري.
11. لا تفعل cutover أو authority transfer قبل إغلاق 02CL PASS.
