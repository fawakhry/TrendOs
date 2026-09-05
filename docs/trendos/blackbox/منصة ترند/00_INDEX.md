# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint مغلق بالكامل

`PERF-CF-02CK — Production Cloud Write Business Qualification`

الحالة: **VERIFIED PASS — CLOSED**

## المرحلة الحالية

`PERF-CF-02CL — Production Outbox → Sheets Reconciliation Qualification`

الحالة الحالية:

**SAFE BLOCKED — AUTHORITATIVE WAEL TOKEN PRESENT / GITHUB EMPLOYEE-TOKEN SECRET IS ANOTHER VALUE — BOTH GATES OFF — NO AUTH / NO RECONCILIATION**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_EMPLOYEE_SECRET_OTHER_VALUE_NO_AUTH.md`

## 02CL evidence sequence

1. Candidate exact-target reconciliation contract prepared and CI PASS.
2. Live read-only preflight PASS: target absent from Sheets; exact outbox target pending once / attempts 0.
3. Apps Script Version 153 live/default-OFF.
4. Isolated Worker 02CL route live/default-OFF.
5. Dedicated reconciliation secret configured on Apps Script and Worker.
6. `wael` has a current normal-login authoritative token.
7. Previous direct auth attempt showed mismatch can clear employee token; fingerprint-first protection is mandatory.
8. Latest no-network diagnostics:
   - Run `33988860989` / Job `101367336591`: mismatch
   - Run `33988899281` / Job `101367439956`: `OTHER_VALUE`
   - Run `33988944752` / Job `101367565374`: `OTHER_VALUE`
9. Current GitHub employee-token secret is neither current/previous employee token nor simple whitespace/quote variant nor reconcile secret/username/key-name.
10. `/v1/edge/session` was not called during these diagnostics, so current authoritative token remains intact.
11. Both execution gates remain OFF and no reconciliation has executed.

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
- current authoritative `wael` employee token: **PRESENT**
- GitHub employee-token secret: **OTHER VALUE / MISMATCH**
- `EDGE_SESSION_SECRET` rotation: **NONE**

## نقطة البداية لأي شات جديد

1. اقرأ `00_INDEX.md` ثم `01_CURRENT_STATE.md`.
2. اقرأ أحدث `EMPLOYEE_SECRET_OTHER_VALUE_NO_AUTH` blackbox record.
3. اعتبر 02CK مغلق PASS ولا تعيده.
4. لا تستدعِ `/v1/edge/session` قبل fingerprint MATCH.
5. لا تعمل login جديدًا طالما authoritative `wael` token ما زال موجودًا.
6. انسخ Token مباشرة من صف `wael` في sheet `المستخدمين` إلى GitHub secret `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN`.
7. أعد no-network fingerprint probe.
8. إذا MATCH فقط، نفّذ canonical auth exchange مرة واحدة.
9. لا تفتح Apps Script/Worker 02CL gates إلا بعد auth PASS ومباشرة قبل bounded exact-target execution.
10. لا تستخدم generic outbox drain ولا تدوّر `EDGE_SESSION_SECRET`.
11. بعد التنفيذ: exactly one reconciliation + one replay-noop، ثم cleanup/disable فوري.
12. لا تفعل cutover أو authority transfer قبل إغلاق 02CL PASS.
