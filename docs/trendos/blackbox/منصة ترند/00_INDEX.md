# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint مغلق بالكامل

`PERF-CF-02CK — Production Cloud Write Business Qualification`

الحالة: **VERIFIED PASS — CLOSED**

## المرحلة الحالية

`PERF-CF-02CL — Production Outbox → Sheets Reconciliation Qualification`

الحالة الحالية:

**SAFE BLOCKED — CURRENT WAEL SESSION PRESENT BUT GITHUB TOKEN FINGERPRINT MISMATCH — BOTH GATES OFF — NO AUTH / NO RECONCILIATION**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_WAEL_TOKEN_FINGERPRINT_MISMATCH_NO_AUTH_NO_RECONCILIATION.md`

## 02CL evidence sequence

1. Candidate exact-target reconciliation contract prepared and CI PASS.
2. Live read-only preflight PASS: target absent from Sheets; exact outbox target pending once / attempts 0.
3. Apps Script Version 153 live/default-OFF.
4. Isolated Worker 02CL route live/default-OFF.
5. Dedicated reconciliation secret configured on Apps Script and Worker.
6. User performed a fresh `wael` login.
7. Previous direct auth attempt demonstrated mismatch can clear employee token; therefore fingerprint-first protection was added.
8. Latest safe no-network fingerprint probe:
   - Run `33987645461`
   - Job `101364057055`
   - result `02CL_WAEL_TOKEN_FINGERPRINT=MISMATCH`
   - no `/v1/edge/session` call
   - no token invalidation from this probe
   - cleanup commit `4c385fe20e0673e03e75f7d72b77e37764e027b3`
9. Both execution gates remain OFF and no reconciliation has executed.

## Production state الآن

- Production Worker: `trendos-d1-api`
- Production D1: `trendos-main`
- Production Cloud Write: **ON**
- Production Shadow: **ON / read-only / mutation-free**
- Production cutover: **OFF**
- Sheets / Apps Script authority: **YES**
- last verified pending outbox: `1`
- exact target: `CW-PROD-QUAL-33975124471`
- last verified exact target status: `pending`
- last verified attempts: `0`
- target Orders-sheet rows: `0`
- Apps Script 02CL gate: **OFF**
- Worker 02CL gate: **OFF**
- Worker reconciliation secret configured: **YES**
- reconciliation executed: **NO**
- current authoritative `wael` session token: **PRESENT**
- GitHub employee-token secret fingerprint: **MISMATCH vs current authoritative token**
- `EDGE_SESSION_SECRET` rotation: **NONE**

## نقطة البداية لأي شات جديد

1. اقرأ `00_INDEX.md` ثم `01_CURRENT_STATE.md`.
2. اقرأ أحدث fingerprint-mismatch blackbox record.
3. اعتبر 02CK مغلق PASS ولا تعيده.
4. لا تستدعِ `/v1/edge/session` قبل fingerprint MATCH.
5. أبقِ جلسة `wael` الحالية مفتوحة، وانسخ `matbagy_session_token` من نفس Session Storage حرفيًا.
6. حدّث فقط GitHub secret `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN`.
7. أعد no-network fingerprint probe.
8. إذا MATCH فقط، نفّذ canonical auth exchange مرة واحدة.
9. لا تفتح Apps Script/Worker 02CL gates إلا بعد auth PASS ومباشرة قبل bounded exact-target execution.
10. لا تستخدم generic outbox drain ولا تدوّر `EDGE_SESSION_SECRET`.
11. بعد التنفيذ: exactly one reconciliation + one replay-noop، ثم cleanup/disable فوري.
12. لا تفعل cutover أو authority transfer قبل إغلاق 02CL PASS.
