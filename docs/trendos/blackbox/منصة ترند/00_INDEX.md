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

## المرحلة الحالية

`PERF-CF-02CL — Production Outbox → Sheets Reconciliation Qualification`

الحالة الحالية:

**APPS SCRIPT V153 LIVE + WORKER DEFAULT-OFF LIVE — DEDICATED SECRET PROVISIONING PENDING — NO RECONCILIATION EXECUTED**

أحدث سجل مرجعي:

`TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_APPS_V153_WORKER_DEFAULT_OFF_LIVE_PASS.md`

## 02CL sequence

### Candidate + CI

- exact target: `CW-PROD-QUAL-33975124471`
- exact operation: `upsert_order_to_sheets`
- exact-target reconciliation selector prepared
- Apps Script one-record writer prepared default-OFF
- isolated Worker qualification module prepared default-OFF
- Candidate CI Run `33983980229` / Job `101354064165`: **SUCCESS**
- updated wiring CI Run `33984943262` / Job `101356624792`: **SUCCESS**
- Integrity Run `33984943269` / Job `101356624897`: **SUCCESS**

### Live read-only preflight

- target Orders-sheet matches: `0`
- Production pending outbox: `1`
- exact target outbox rows: `1`
- target status: `pending`
- attempts: `0`
- event key: `order:create:prod-qual-33975124471`
- `cutover=false`
- Sheets authoritative
- Run `33984695539` / Job `101355965286`: **SUCCESS**

### Apps Script Version 153 live/default-OFF

Existing Web App deployment was updated using the same deployment ID.

Default-OFF probe:

- Run `33986293821`
- Job `101360293029`
- conclusion: **SUCCESS**
- HTTP 200
- code `qualification-disabled`
- `persisted=false`
- `sheetsWritten=false`
- `mutationCount=0`
- `productionCutover=false`
- `sheetsAuthoritative=true`
- cleanup commit `640f10a10c21aa6465a7fd50d9f4bce44b1db4c3`

### Worker 02CL live/default-OFF

Controlled Production deploy:

- trigger commit `caccf329e0caadb271403aa851b6c8dace69185a`
- Run `33986406106`
- Job `101360642665`
- conclusion: **SUCCESS**
- Worker Version ID `434247f4-b899-4241-822b-022834983112`
- cleanup commit `47706bb1a3b6fec12a9aa404fb801ae1b09f07d3`

Post-deploy qualification health:

- `enabled=false`
- exact target rows `1`
- outbox status `pending`
- attempts `0`
- `reconcileSecretConfigured=false`
- `genericDrainEnabled=false`
- `productionCutover=false`
- `sheetsAuthoritative=true`
- exact qualification POST while OFF: HTTP `423` / `qualification-disabled`

Core Production boundary remained unchanged:

- Cloud Write ON
- Production Shadow ON / mutation-free
- pending outbox `1`
- cutover OFF
- Sheets authoritative

## Current manual boundary

Provision one dedicated secret using the same value in these two stores only:

Apps Script Script Property:

`TRENDOS_CLOUD_WRITE_PROD_RECONCILE_QUALIFY_SECRET`

GitHub Actions repository secret:

`TRENDOS_PROD_RECONCILE_QUALIFY_SECRET`

Do not paste the secret into chat or commit it to repository files.

Keep both execution gates OFF during secret provisioning:

- Apps Script enable property absent/empty/`0`
- Worker `TRENDOS_PROD_RECONCILE_QUALIFY_ENABLED = "false"`

## Production state الآن

- Production Worker: `trendos-d1-api`
- Production D1: `trendos-main`
- Production Cloud Write: **ON**
- `writesAccepted=true`
- `schemaReady=true`
- Production Shadow: **ON / read-only / mutation-free**
- Production cutover: **OFF**
- Full frontend cutover: **NO**
- Normalized-data cutover: **NO**
- Sheets / Apps Script authority: **YES**
- synthetic D1 order: `1`
- pending Sheets outbox: `1`
- target attempts: `0`
- 02CL Apps Script route: **LIVE / OFF**
- 02CL Worker route: **LIVE / OFF**
- Worker reconciliation secret: **NOT CONFIGURED YET**
- 02CL reconciliation executed: **NO**
- `EDGE_SESSION_SECRET` rotation: **NONE**

## أهم سجلات 2026-09-05

### 02CL
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_APPS_V153_WORKER_DEFAULT_OFF_LIVE_PASS.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_WORKER_WRAPPED_DEFAULT_OFF_CI_PASS_NOT_DEPLOYED.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_LIVE_READONLY_PREFLIGHT_PASS_NO_MUTATION.md`
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_CANDIDATE_PREPARED_CI_PASS_NO_PRODUCTION_MUTATION.md`

### 02CK
- `TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_PRODUCTION_BUSINESS_QUALIFICATION_PASS.md`

## نقطة البداية لأي شات جديد

1. اقرأ `00_INDEX.md` ثم `01_CURRENT_STATE.md`.
2. اعتبر 02CK مغلق PASS ولا تعيده.
3. اعتبر Apps Script V153 وWorker 02CL live لكن execution OFF.
4. لا تستهلك target outbox قبل provision secret + auth + explicit bounded enable checkpoint.
5. لا تستخدم generic outbox drain.
6. لا تعيد استخدام token الموظف المؤقت `wael` القديم.
7. لا تدوّر `EDGE_SESSION_SECRET` لهذا الغرض.
8. لا تفعل أي cutover أو authority transfer قبل إغلاق 02CL PASS.
9. سجّل كل خطوة مادية جديدة داخل هذا المجلد.
