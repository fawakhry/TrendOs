# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## النطاق

يشمل فقط:
- TrendOS Main Platform
- Cloudflare Worker / D1 / Edge Gateway / Orders mirror
- Production Shadow
- Production Cloud Write
- CI / verification / safety / cutover للمنصة الرئيسية

لا يشمل Accounting أو EasyStore أو WhatsApp-specific work أو المشروعات المستقلة الأخرى.

## آخر checkpoint مغلق بالكامل

`PERF-CF-02CK — Production Cloud Write Business Qualification`

الحالة: **VERIFIED PASS — CLOSED**

## المرحلة الحالية

`PERF-CF-02CL — Production Outbox → Sheets Reconciliation Qualification`

الحالة الحالية:

**SAFE BLOCKED — FRESH WAEL TOKEN CLEARED AFTER AUTH MISMATCH — BOTH GATES OFF — NO RECONCILIATION**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_WAEL_FRESH_AUTH_MISMATCH_TOKEN_CLEARED_NO_RECONCILIATION.md`

## 02CL evidence sequence

1. Candidate exact-target reconciliation contract prepared and CI PASS.
2. Live read-only preflight PASS: target absent from Sheets; exact outbox target pending once / attempts 0.
3. Apps Script Version 153 live and default-OFF probe PASS.
4. Isolated 02CL Worker route live and default-OFF.
5. Dedicated reconciliation secret configured on Apps Script and Worker; Worker health shows `reconcileSecretConfigured=true`.
6. Both execution gates remain OFF.
7. `wael` was re-enabled and a fresh normal login generated an employee token.
8. Auth-only Run `33987326112` / Job `101363206831` failed at canonical `/v1/edge/session` before any reconciliation.
9. Immediately after failure, authoritative `wael` Token was empty, proving the supplied token was treated as mismatch/expired and cleared by current `authorize_` behavior.
10. No reconciliation, outbox claim, Sheet write, gate enable, cutover, or Edge secret rotation occurred.

## Important run IDs

- 02CK PASS: Run `33975124471`, Job `101331797697`
- 02CL read-only live preflight: Run `33984695539`, Job `101355965286`
- Apps Script V153 default-OFF probe: Run `33986293821`, Job `101360293029`
- Worker default-OFF deploy: Run `33986406106`, Job `101360642665`
- Dedicated Worker secret provisioning: Run `33986960662`, Job `101362220690`
- Latest fresh `wael` auth-only failure: Run `33987326112`, Job `101363206831`

## Production state الآن

- Production Worker: `trendos-d1-api`
- Production D1: `trendos-main`
- Production Cloud Write: **ON**
- Production Shadow: **ON / read-only / mutation-free**
- Production cutover: **OFF**
- Full frontend cutover: **NO**
- Normalized-data cutover: **NO**
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
- current `wael` employee token: **EMPTY after failed auth**
- `EDGE_SESSION_SECRET` rotation: **NONE**

## نقطة البداية لأي شات جديد

1. اقرأ `00_INDEX.md` ثم `01_CURRENT_STATE.md`.
2. اقرأ أحدث auth-mismatch blackbox record.
3. اعتبر 02CK مغلق PASS ولا تعيده.
4. لا تعيد `/v1/edge/session` بنفس token القديم.
5. اعمل fresh normal `wael` login ثم حدّث GitHub employee-token secret.
6. قبل أي auth request، اعمل **no-network SHA-256 fingerprint MATCH** بين authoritative employee token وGitHub secret؛ لا تكشف أي token.
7. إذا MATCH فقط: نفّذ canonical auth exchange مرة واحدة.
8. لا تفتح Apps Script/Worker 02CL gates إلا بعد auth PASS ومباشرة قبل bounded exact-target execution.
9. لا تستخدم generic outbox drain.
10. لا تدوّر `EDGE_SESSION_SECRET` لهذا الغرض.
11. بعد التنفيذ المطلوب: exactly one reconciliation + one replay-noop, then immediate cleanup/disable.
12. لا تفعل cutover أو authority transfer قبل إغلاق 02CL PASS.
13. سجّل كل خطوة مادية جديدة داخل هذا المجلد.
