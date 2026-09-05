# منصة ترند — TrendOS Main Platform Blackbox

هذا المجلد هو الذاكرة الرسمية لمسار **TrendOS Main Platform → Cloudflare**.

## آخر checkpoint منفذ

`PERF-CF-02CO — Controlled Orders D1 Read Canary / Authenticated Comparison`

الحالة: **WORKER DASHBOARD BUILDER LIVE — AUTHENTICATED CANARY BLOCKED BY EDGE SESSION 401 — FRONTEND OFF — BOUNDARY PASS**

أحدث سجل:

`TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CO_WORKER_LIVE_AUTH_BLOCKED_BOUNDARY_PASS.md`

## checkpoints سابقة

`PERF-CF-02CN — Orders Read Path Cutover Readiness / Slowness Hot-Path Fix`

الحالة: **CANDIDATE PREPARED — CI PASS — DEFAULT-OFF — NO CUTOVER**

`PERF-CF-02CM — Post-02CL Production Stability / Cutover Readiness Preflight`

الحالة: **READ-ONLY PREFLIGHT PASS — CLOSED**

`PERF-CF-02CL — Production Outbox → Sheets Reconciliation Qualification`

الحالة: **VERIFIED PASS — CLOSED**

`PERF-CF-02CK — Production Cloud Write Business Qualification`

الحالة: **VERIFIED PASS — CLOSED**

## 02CO evidence sequence

1. 02CO started after reading `00_INDEX.md`, `01_CURRENT_STATE.md`, and the latest 02CN record.
2. Created temporary workflow `.github/workflows/trendos-02co-orders-d1-read-canary-temp.yml` in commit `35780cc655d48b216bd8ff1df63acb7630e7d257`.
3. Initial run `33998555571` / Job `101393226552` failed before deploy because the static guard counted the deploy command incorrectly.
4. Fixed deploy-command guard in commit `04747c874544fd8a02aec985c7b301e3557ca3d6`.
5. Main 02CO run `33998607884` / Job `101393360747` passed static safety and required-secret presence checks.
6. Pre-deploy boundary passed: Worker health OK, Cloud Write OK, `pendingOutbox=0`, 02CL gate OFF, `cutover=false`, `sheetsAuthoritative=true`.
7. Production Worker was deployed with 02CN dashboard-builder code only.
8. Worker Version ID became `4c02c234-305c-4845-b9eb-f52bf647ff9b`.
9. No D1 migration, no `d1 execute --file`, no secret mutation, no 02CL reconciliation, no outbox drain, no frontend flag enable, and no authority cutover occurred.
10. Authenticated canary then failed at `POST /v1/edge/orders/session` with HTTP `401`.
11. No D1-vs-Apps-Script row comparison completed after the auth failure.
12. Created separate read-only post-auth-failure boundary workflow in commit `94b3c933f53950258a59fa42053d76293840ccf7`.
13. Post-auth-failure boundary run `33998657431` / Job `101393488074` passed.
14. Boundary confirmed `pendingOutbox=0`, `cutover=false`, `sheetsAuthoritative=true`, 02CL gate OFF, generic drain false, and unauthenticated orders read returned `401`.
15. Cleaned post-auth-failure boundary workflow in commit `f58ec9acc6f2502469cff931e30917e1c132072e`.
16. 02CO main workflow remains present intentionally for rerun after fresh auth secret refresh.
17. The frontend D1 orders read flag remains OFF and users are not cut over to D1 reads.

## Current production state

- Production Worker: `trendos-d1-api`
- Worker Version ID: `4c02c234-305c-4845-b9eb-f52bf647ff9b`
- 02CN D1 dashboard builder: **LIVE IN WORKER**
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
- frontend D1 orders read flag: **OFF**
- generic outbox drain: **not exposed / not used**
- frontend cutover: **NO**
- normalized-data cutover: **NO**
- authority transfer from Sheets to D1: **NO**
- `EDGE_SESSION_SECRET` rotation: **NONE**

## نقطة البداية لأي شات جديد

1. اقرأ `00_INDEX.md` ثم `01_CURRENT_STATE.md`.
2. اقرأ أحدث 02CO record:
   `TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CO_WORKER_LIVE_AUTH_BLOCKED_BOUNDARY_PASS.md`
3. اعتبر 02CK و02CL و02CM مغلقين ولا تعيدهم إلا إذا تغير المصدر ماديًا.
4. اعتبر 02CN جاهزًا، و02CO worker deploy تم، لكن authenticated canary لم يكتمل بسبب Edge session 401.
5. لا تعيد نفس التوكن القديم مرارًا.
6. لا تفتح Apps Script/Worker 02CL gates مرة أخرى إلا داخل checkpoint جديد محدود ومؤرخ.
7. لا تستخدم generic outbox drain.
8. لا تدوّر `EDGE_SESSION_SECRET`.
9. لا تفعل frontend cutover أو authority transfer قبل موافقة صريحة وcheckpoint مستقل.
10. حافظ على Sheets / Apps Script كـauthoritative source حتى cutover مستقل.
11. الخطوة التالية:
    `PERF-CF-02CO-RESUME — Fresh Auth Secret Refresh / Authenticated Orders D1 Read Canary Rerun`.
12. في 02CO-RESUME: بعد normal employee login وتحديث GitHub secret `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN`، أعد تشغيل 02CO canary workflow/job وأكمل المقارنة.
