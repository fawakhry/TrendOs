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

**DEDICATED SECRET READY — APPS SCRIPT V153 LIVE/OFF — WORKER LIVE/OFF — FRESH WAEL LOGIN REQUIRED — NO RECONCILIATION EXECUTED**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_DEDICATED_SECRET_READY_WAEL_REENABLED.md`

## 02CL evidence sequence

1. Candidate exact-target reconciliation contract prepared and CI PASS.
2. Live read-only preflight PASS: target absent from Sheets; exact outbox target pending once / attempts 0.
3. Apps Script Version 153 deployed using existing Web App deployment ID and default-OFF probe PASS.
4. Isolated 02CL Worker route deployed default-OFF; Production boundaries unchanged.
5. Dedicated reconciliation secret user-configured on Apps Script and GitHub; Worker secret provisioned through controlled GitHub Actions.
6. Post-secret Worker health PASS:
   - `enabled=false`
   - `reconcileSecretConfigured=true`
   - exact target rows `1`
   - `pending`
   - attempts `0`
   - generic drain disabled
   - cutover false
   - Sheets authoritative
7. Apps Script V153 reconfirmed default-OFF after Worker secret provisioning.
8. Authoritative `الأوردرات` exact target search repeated: `0` matches.
9. Temporary qualifier `wael` re-enabled with token still empty; fresh normal login required before execution.

## Important run IDs

- 02CK PASS: Run `33975124471`, Job `101331797697`
- 02CL read-only live preflight: Run `33984695539`, Job `101355965286`
- Apps Script V153 default-OFF probe: Run `33986293821`, Job `101360293029`
- Worker default-OFF deploy: Run `33986406106`, Job `101360642665`
- Dedicated Worker secret provisioning: Run `33986960662`, Job `101362220690`

## Production state الآن

- Production Worker: `trendos-d1-api`
- Production D1: `trendos-main`
- Production Cloud Write: **ON**
- Production Shadow: **ON / read-only / mutation-free**
- Production cutover: **OFF**
- Full frontend cutover: **NO**
- Normalized-data cutover: **NO**
- Sheets / Apps Script authority: **YES**
- pending outbox: `1`
- exact target: `CW-PROD-QUAL-33975124471`
- exact target status: `pending`
- attempts: `0`
- target Orders-sheet rows: `0`
- Apps Script 02CL gate: **OFF**
- Worker 02CL gate: **OFF**
- Worker reconciliation secret configured: **YES**
- reconciliation executed: **NO**
- `EDGE_SESSION_SECRET` rotation: **NONE**

## نقطة البداية لأي شات جديد

1. اقرأ `00_INDEX.md` ثم `01_CURRENT_STATE.md`.
2. اقرأ `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_DEDICATED_SECRET_READY_WAEL_REENABLED.md`.
3. اعتبر 02CK مغلق PASS ولا تعيده.
4. لا تستهلك target outbox قبل fresh canonical `wael` login + safe token match verification.
5. لا تستخدم generic outbox drain.
6. لا تولد employee token يدويًا.
7. لا تدوّر `EDGE_SESSION_SECRET` لهذا الغرض.
8. لا تفتح Apps Script/Worker 02CL gates إلا مباشرة قبل bounded execution.
9. بعد التنفيذ المطلوب: exactly one reconciliation + one replay-noop, then immediate cleanup/disable.
10. لا تفعل cutover أو authority transfer قبل إغلاق 02CL PASS.
11. سجّل كل خطوة مادية جديدة داخل هذا المجلد.
