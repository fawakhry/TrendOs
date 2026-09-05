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

السجل:

`TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_PRODUCTION_BUSINESS_QUALIFICATION_PASS.md`

02CK أثبت:

- canonical employee → Edge session PASS
- Order صناعي واحد فقط: `CW-PROD-QUAL-33975124471`
- Cloud Write D1 PASS
- idempotent replay PASS
- pending outbox أصبح 1 بالضبط
- Shadow mutation-free
- `cutover=false`
- Sheets / Apps Script authoritative

## المرحلة الحالية

`PERF-CF-02CL — Production Outbox → Sheets Reconciliation Qualification`

الحالة الحالية:

**LIVE READ-ONLY PREFLIGHT PASS — APPS SCRIPT DEFAULT-OFF DEPLOYMENT PENDING — NO 02CL PRODUCTION MUTATION**

### 02CL candidate

السجل:

`TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_CANDIDATE_PREPARED_CI_PASS_NO_PRODUCTION_MUTATION.md`

- exact target فقط: `CW-PROD-QUAL-33975124471`
- exact operation: `upsert_order_to_sheets`
- Apps Script candidate default-OFF
- Worker candidate default-OFF وغير موصل بالـProduction entrypoint
- exact-target reconciliation selectors parameter-bound
- decoy pending rows proved untouched in isolated tests
- Candidate Run `33983980229` / Job `101354064165`: **SUCCESS**
- Integrity Run `33983980205` / Job `101354064040`: **SUCCESS**

### 02CL live read-only preflight

السجل الأحدث:

`TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_LIVE_READONLY_PREFLIGHT_PASS_NO_MUTATION.md`

نتيجة الـpreflight:

- authoritative Orders-sheet exact target matches: **0**
- Apps Script dry-run lineage: **live / installed / locked**
- Apps response: `unauthorized`, `sheetsWritten=false`, `mutationCount=0`
- Production `pendingOutbox=1`
- `cutover=false`
- `sheetsAuthoritative=true`
- exact D1 target rows: **1**
- exact target status: `pending`
- attempts: `0`
- event key: `order:create:prod-qual-33975124471`
- temporary read-only Run `33984695539` / Job `101355965286`: **SUCCESS**
- temporary workflow removed in cleanup commit `789c9985f21cdd01e92b5ba6e95a7f9fac6bc2df`

No D1 mutation, Sheet write, Apps Script property mutation, Worker deploy, Apps Script deploy, secret rotation, or cutover occurred.

## Current deployment boundary

Apps Script source deployment is not exposed by the connected tools in this chat.

Prepared manual default-OFF deploy manifest:

`docs/trendos/staging/APPS_SCRIPT_02CL_PRODUCTION_RECONCILE_DEPLOY_MANIFEST.md`

Required live change only:

1. Add a new Apps Script source file from:
   `apps-script/patches/CLOUD_WRITE_PRODUCTION_RECONCILE_QUALIFICATION_V1.gs`
2. Add one router line immediately after the already-live dry-run route:
   `else if (action === "cloudWriteReconcileProductionQualificationV1") result = trendosCloudWriteReconcileProductionQualificationV1_(e);`
3. Do **not** overwrite live `Code.gs` with repository `Code.gs`.
4. Keep the 02CL enable property OFF/absent during installation.
5. Deploy a New version using the existing Web App deployment ID.
6. Then run a no-secret probe and require `qualification-disabled` + zero mutation.

## Production state الآن

- Production Cloud Write: **ON**
- `writesAccepted=true`
- `schemaReady=true`
- Production Shadow: **ON / read-only / mutation-free**
- Production cutover: **OFF**
- Full frontend cutover: **NO**
- Normalized-data cutover: **NO**
- Sheets / Apps Script authority: **YES**
- synthetic D1 order: **1**
- pending Sheets outbox item: **1**
- exact target in Sheets: **0 rows**
- 02CL outbox consumption: **NONE**
- 02CL Apps Script deploy: **NOT YET**
- 02CL Worker deploy: **NOT YET**
- `EDGE_SESSION_SECRET` rotation: **NONE**

## أهم سجلات 2026-09-05

### 02CL
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_LIVE_READONLY_PREFLIGHT_PASS_NO_MUTATION.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_CANDIDATE_PREPARED_CI_PASS_NO_PRODUCTION_MUTATION.md`

### 02CK
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_PRODUCTION_BUSINESS_QUALIFICATION_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_WAEL_AUTH_FAILED_MISSING_LAST_LOGIN_NO_BUSINESS_WRITE.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_VIRTUAL_QUALIFIER_WAEL_PROVISIONED.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_RAHMA_VALID_SESSION_BUT_ALLOWLIST_BLOCK.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_AUTH_EXCHANGE_FAILED_NO_BUSINESS_WRITE.md`

## نقطة البداية لأي شات جديد

1. اقرأ `00_INDEX.md`.
2. اقرأ `01_CURRENT_STATE.md`.
3. اعتبر 02CK مغلق PASS ولا تعيده.
4. اعتبر 02CL candidate + live read-only preflight PASS، لكنه لم ينفذ reconciliation بعد.
5. اقرأ `APPS_SCRIPT_02CL_PRODUCTION_RECONCILE_DEPLOY_MANIFEST.md` قبل أي live change.
6. لا تستهلك الـpending target قبل default-OFF Apps Script deploy + probe وdefault-OFF Worker deploy + probe.
7. لا تستخدم generic outbox drain.
8. لا تعيد استخدام token الموظف المؤقت `wael` القديم.
9. لا تدوّر `EDGE_SESSION_SECRET` لهذا الغرض.
10. لا تفعل أي cutover أو authority transfer قبل إغلاق 02CL PASS.
11. سجّل كل خطوة مادية جديدة داخل هذا المجلد.
