# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint مغلق بالكامل

`PERF-CF-02CM — Post-02CL Production Stability / Cutover Readiness Preflight`

الحالة: **READ-ONLY PREFLIGHT PASS — CLOSED**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CM_READONLY_STABILITY_PREFLIGHT_PASS.md`

## checkpoints سابقة مغلقة

`PERF-CF-02CL — Production Outbox → Sheets Reconciliation Qualification`

الحالة: **VERIFIED PASS — CLOSED**

`PERF-CF-02CK — Production Cloud Write Business Qualification`

الحالة: **VERIFIED PASS — CLOSED**

## 02CM final evidence sequence

1. 02CM started only after reading `00_INDEX.md`, `01_CURRENT_STATE.md`, and the latest 02CL PASS record.
2. 02CM scope was explicitly read-only.
3. Temporary workflow `.github/workflows/trendos-02cm-readonly-preflight-temp.yml` was created.
4. Initial run failed before any Production probe due to a Node runner syntax issue only.
5. Runner script was corrected.
6. Successful 02CM run `33997663961` / Job `101390904237` passed.
7. Static no-write guard passed.
8. No Worker deploy, no D1 migration, no `d1 execute --file`, no secret mutation, no Apps Script property mutation, no reconciliation execution, no outbox drain, and no cutover occurred.
9. Worker `/health` returned database healthy.
10. Cloud Write health returned ON, schema ready, auth configured, writes accepted, `pendingOutbox=0`, `cutover=false`, `sheetsAuthoritative=true`.
11. 02CL reconcile health stayed OFF and confirmed exact target `synced / reconciled / sheets=synced / attempts=1`.
12. Production Shadow stayed read-only/mutation-free with zero writes and stable fingerprint.
13. Mirror capabilities showed atomic/heartbeat tables present and no missing required tables.
14. Mirror stats showed `87` sheets ready, `0` pending, `31276` mirrored rows.
15. Orders mirror parity: `rowCount=311`, `sourceLastRow=311`, `sourceLastCol=67`, status ready.
16. Lines mirror parity: `rowCount=355`, `sourceLastRow=355`, `sourceLastCol=82`, status ready.
17. Exact 02CL target read returned HTTP 200 and correct Order ID.
18. Edge orders page without token returned HTTP 401, proving it remained protected.
19. GitHub Pages root returned HTTP 200.
20. Apps Script blank ping returned HTTP 200 but was the slowest measured endpoint at `1306 ms`.
21. Temporary workflow was deleted in cleanup commit `208a7b1c73258814cecbf4a67d912b89de97400e`.
22. 02CM was closed as **READ-ONLY PREFLIGHT PASS**.

## Current production state

- Production Worker: `trendos-d1-api`
- Production D1: `trendos-main`
- Production Cloud Write: **ON**
- Cloud Write pending outbox: `0`
- Production Shadow: **ON / read-only / mutation-free**
- Production cutover: **OFF**
- Sheets / Apps Script authority: **YES**
- exact 02CL target: `CW-PROD-QUAL-33975124471`
- exact target outbox status: `synced`
- exact event status: `reconciled`
- exact sheets status: `synced`
- exact attempts: `1`
- Apps Script 02CL gate: **OFF**
- Worker 02CL gate: **OFF**
- generic outbox drain: **not exposed / not used**
- frontend cutover: **NO**
- normalized-data cutover: **NO**
- authority transfer from Sheets to D1: **NO**
- `EDGE_SESSION_SECRET` rotation: **NONE**

## 02CM diagnosis

Worker/D1 health and mirror readiness are good. The likely remaining source of the user's reported platform slowness is the frontend still using Apps Script / Google Sheets hot paths for orders list/page/dashboard behavior. 02CM does not authorize cutover.

## نقطة البداية لأي شات جديد

1. اقرأ `00_INDEX.md` ثم `01_CURRENT_STATE.md`.
2. اقرأ أحدث 02CM PASS record:
   `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CM_READONLY_STABILITY_PREFLIGHT_PASS.md`
3. اعتبر 02CK و02CL و02CM مغلقين ولا تعيدهم إلا إذا تغير المصدر ماديًا.
4. لا تفتح Apps Script/Worker 02CL gates مرة أخرى إلا داخل checkpoint جديد محدود ومؤرخ.
5. لا تستخدم generic outbox drain.
6. لا تدوّر `EDGE_SESSION_SECRET`.
7. لا تفعل frontend cutover أو authority transfer قبل موافقة صريحة وcheckpoint مستقل.
8. حافظ على Sheets / Apps Script كـauthoritative source حتى cutover مستقل.
9. الخطوة التالية الموصى بها، عند موافقة المستخدم:
   `PERF-CF-02CN — Orders Read Path Cutover Readiness / Slowness Hot-Path Fix`.
10. ابدأ 02CN بتفتيش مسارات frontend orders reads الحالية، ثم default-OFF D1 primary-read/fallback patch، بدون cutover تلقائي.
