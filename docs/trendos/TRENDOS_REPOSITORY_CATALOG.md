# TrendOS — كتالوج المستودع الكامل

> **الغرض:** فهرس بحث شامل لكل مسار في مستودع TrendOS على فرع `candidate/t12-full-cloud-cutover-a56-20260929`. هذا الملف للفهرسة والوصول، وليس إثباتًا أن الملف يعمل في Production.

> **قاعدة عدم التخمين:** حالة التشغيل لا تُستنتج من اسم الملف. المرجع الحاكم للحالة الحية هو `TrendOS_MASTER_BOOK.md` + Runtime Evidence. إذا لم توجد حالة مثبتة، تعامل معها كـ **غير مثبتة تشغيليًا**.

## لقطة الجرد

- مصدر الشجرة: commit قبل إنشاء هذا الكتالوج `c2ba8079c48e64b33a4498b04193f80e0def6762` / tree `0027960f11fe516d12b41a3ab8d546b284091764`.
- Git tree API returned `truncated=false`، لذلك الجرد الأصلي كامل للشجرة في تلك اللقطة.
- بعد إضافة هذا الكتالوج: **1435 ملفًا** و **35 مجلدًا**، بإجمالي **1470 مسارًا**.
- البحث بالعربي: استخدم عمود «كلمات البحث بالعربي» بجانب اسم الملف التقني.

## توزيع الملفات حسب الجذر

| الجذر | عدد الملفات |
|---|---:|
| `.github` | 220 |
| `(root)` | 95 |
| `accounting` | 12 |
| `apps-script` | 18 |
| `build` | 1 |
| `cloudflare-d1` | 159 |
| `docs` | 713 |
| `FOKHA_BRAIN` | 3 |
| `scripts` | 2 |
| `tests` | 200 |
| `tools` | 12 |

## المجلدات

| المسار | كلمات البحث بالعربي |
|---|---|
| `.github` | مجلد، فهرس، مسار |
| `.github/workflows` | مجلد، فهرس، مسار |
| `accounting` | مجلد، فهرس، مسار |
| `apps-script` | مجلد، فهرس، مسار |
| `apps-script/patches` | مجلد، فهرس، مسار |
| `build` | مجلد، فهرس، مسار |
| `build/apps-script` | مجلد، فهرس، مسار |
| `cloudflare-d1` | مجلد، فهرس، مسار |
| `cloudflare-d1/migrations` | مجلد، فهرس، مسار |
| `cloudflare-d1/preview` | مجلد، فهرس، مسار |
| `cloudflare-d1/production-shadow` | مجلد، فهرس، مسار |
| `cloudflare-d1/schema-prep` | مجلد، فهرس، مسار |
| `cloudflare-d1/src` | مجلد، فهرس، مسار |
| `cloudflare-d1/staging` | مجلد، فهرس، مسار |
| `cloudflare-d1/t12-preview` | مجلد، فهرس، مسار |
| `cloudflare-d1/test` | مجلد، فهرس، مسار |
| `docs` | مجلد، فهرس، مسار |
| `docs/archive` | مجلد، فهرس، مسار |
| `docs/archive/trendos-master-book` | مجلد، فهرس، مسار |
| `docs/archive/trendos-master-book/2026-09-24` | مجلد، فهرس، مسار |
| `docs/trendos` | مجلد، فهرس، مسار |
| `docs/trendos/blackbox` | مجلد، فهرس، مسار |
| `docs/trendos/blackbox/EasyStore` | مجلد، فهرس، مسار |
| `docs/trendos/blackbox/منصة ترند` | مجلد، فهرس، مسار |
| `docs/trendos/checkpoints` | مجلد، فهرس، مسار |
| `docs/trendos/implementation` | مجلد، فهرس، مسار |
| `docs/trendos/inventory` | مجلد، فهرس، مسار |
| `docs/trendos/master-book` | مجلد، فهرس، مسار |
| `docs/trendos/staging` | مجلد، فهرس، مسار |
| `FOKHA_BRAIN` | مجلد، فهرس، مسار |
| `FOKHA_BRAIN/PROMPTS` | مجلد، فهرس، مسار |
| `FOKHA_BRAIN/STANDARD` | مجلد، فهرس، مسار |
| `scripts` | مجلد، فهرس، مسار |
| `tests` | مجلد، فهرس، مسار |
| `tools` | مجلد، فهرس، مسار |

## كل الملفات — بدون إسقاط أي مسار

| # | المسار | كلمات البحث بالعربي | حالة التشغيل من الجرد |
|---:|---|---|---|
| 1 | `.github/workflows/cloud-migration-v3-t10-press-live-parity.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 2 | `.github/workflows/cloud-migration-v3-t10-press-production-cutover.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 3 | `.github/workflows/cloud-migration-v3-t11-02cq-live-route-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 4 | `.github/workflows/cloud-migration-v3-t11-02cq-status-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 5 | `.github/workflows/cloud-migration-v3-t11-apps-script-health-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 6 | `.github/workflows/cloud-migration-v3-t11-direct-session-verify-diagnostic.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 7 | `.github/workflows/cloud-migration-v3-t11-freshness-runtime-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 8 | `.github/workflows/cloud-migration-v3-t11-freshness-runtime-status.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 9 | `.github/workflows/cloud-migration-v3-t11-getrows-contract.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 10 | `.github/workflows/cloud-migration-v3-t11-heartbeat-transport-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 11 | `.github/workflows/cloud-migration-v3-t11-orders-headers-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 12 | `.github/workflows/cloud-migration-v3-t11-routing-bundle-diagnostic.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 13 | `.github/workflows/cloud-migration-v3-t11-service-candidate-parity.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 14 | `.github/workflows/cloud-migration-v3-t11-service-deployed-contract-parity.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 15 | `.github/workflows/cloud-migration-v3-t11-service-exclusion-hashes.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 16 | `.github/workflows/cloud-migration-v3-t11-service-exclusion-rule-v2.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 17 | `.github/workflows/cloud-migration-v3-t11-service-exclusion-rule.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 18 | `.github/workflows/cloud-migration-v3-t11-service-extra-orders-diagnostic.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 19 | `.github/workflows/cloud-migration-v3-t11-service-field-diff.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 20 | `.github/workflows/cloud-migration-v3-t11-service-filter-semantics.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 21 | `.github/workflows/cloud-migration-v3-t11-service-frontend-candidate.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 22 | `.github/workflows/cloud-migration-v3-t11-service-frontend-production-cutover.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 23 | `.github/workflows/cloud-migration-v3-t11-service-legacy-shape-diagnostic.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 24 | `.github/workflows/cloud-migration-v3-t11-service-lines-exact-parity.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 25 | `.github/workflows/cloud-migration-v3-t11-service-lines-header-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 26 | `.github/workflows/cloud-migration-v3-t11-service-live-field-origin.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 27 | `.github/workflows/cloud-migration-v3-t11-service-modern-shape-parity.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 28 | `.github/workflows/cloud-migration-v3-t11-service-ordering-diagnostic.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 29 | `.github/workflows/cloud-migration-v3-t11-service-orders-candidate-parity.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 30 | `.github/workflows/cloud-migration-v3-t11-service-orders-identity-map.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 31 | `.github/workflows/cloud-migration-v3-t11-service-orders-projection-parity.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 32 | `.github/workflows/cloud-migration-v3-t11-service-orders-rownum-map.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 33 | `.github/workflows/cloud-migration-v3-t11-service-range-boundary-proof.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 34 | `.github/workflows/cloud-migration-v3-t11-service-row-builder-extract.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 35 | `.github/workflows/cloud-migration-v3-t11-service-rownum-field-map.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 36 | `.github/workflows/cloud-migration-v3-t11-service-screen-contract.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 37 | `.github/workflows/cloud-migration-v3-t11-service-screen-view-parity-v2.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 38 | `.github/workflows/cloud-migration-v3-t11-service-screen-view-parity.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 39 | `.github/workflows/cloud-migration-v3-t11-service-sort-contract.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 40 | `.github/workflows/cloud-migration-v3-t11-service-source-rule-parity.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 41 | `.github/workflows/cloud-migration-v3-t11-service-view-formula-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 42 | `.github/workflows/cloud-migration-v3-t11-service-worker-production-canary.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 43 | `.github/workflows/cloud-migration-v3-t11-stable-freshness-route-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 44 | `.github/workflows/cloud-migration-v3-t11-v1932-route-contract.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 45 | `.github/workflows/cloud-migration-v3-t6a-login-production-session-canary.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 46 | `.github/workflows/cloud-migration-v3-t6b-auth-shadow-production-canary.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 47 | `.github/workflows/cloud-migration-v3-t6b-final-production-canary.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 48 | `.github/workflows/cloud-migration-v3-t8-global-orders-read-cutover-v2.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 49 | `.github/workflows/cloud-migration-v3-t8-global-orders-read-cutover.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 50 | `.github/workflows/cloud-migration-v3-t8-print-contract-diagnostic.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 51 | `.github/workflows/cloud-migration-v3-t8-print-global-cutover.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 52 | `.github/workflows/cloud-migration-v3-t9-laser-live-parity.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 53 | `.github/workflows/cloud-migration-v3-t9-laser-production-cutover.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 54 | `.github/workflows/trend-master-resilience-v1931-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 55 | `.github/workflows/trend-master-v1931-prod-readonly-canary.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 56 | `.github/workflows/trendos-02cl-off-readiness-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 57 | `.github/workflows/trendos-02cn-orders-read-hotpath-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 58 | `.github/workflows/trendos-02co-canary-wrapper-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 59 | `.github/workflows/trendos-02cq-screen-view-mirror-refresh-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 60 | `.github/workflows/trendos-02cr-field-completeness-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 61 | `.github/workflows/trendos-02ct-frontend-cutover-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 62 | `.github/workflows/trendos-02cu-02cr-idle-preview-qualify.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 63 | `.github/workflows/trendos-02cu-production-worker-baseline-readonly.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 64 | `.github/workflows/trendos-02cu-stability-readonly.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 65 | `.github/workflows/trendos-02cv-order-status-ux-candidate.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 66 | `.github/workflows/trendos-02cv-order-status-ux-promote-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 67 | `.github/workflows/trendos-02cw-fix-global-counter-patcher-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 68 | `.github/workflows/trendos-02cw-frontend-candidate-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 69 | `.github/workflows/trendos-02cw-frontend-promote-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 70 | `.github/workflows/trendos-02cw-frontend-undefined-status-hotfix-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 71 | `.github/workflows/trendos-02cw-worker-codeonly-deploy-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 72 | `.github/workflows/trendos-02cw-worker-postdeploy-readonly-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 73 | `.github/workflows/trendos-02cw-worker-promote-version-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 74 | `.github/workflows/trendos-02cw-worker-rollback-safe-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 75 | `.github/workflows/trendos-02cw-worker-summary-candidate-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 76 | `.github/workflows/trendos-02cw-worker-zero-traffic-upload-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 77 | `.github/workflows/trendos-a61-browser-transport-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 78 | `.github/workflows/trendos-accounting-binding-probe-preview-runtime.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 79 | `.github/workflows/trendos-accounting-d1-discovery-readonly.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 80 | `.github/workflows/trendos-accounting-d1-preview-create.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 81 | `.github/workflows/trendos-accounting-d1-preview-schema-apply.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 82 | `.github/workflows/trendos-accounting-f2-runtime.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 83 | `.github/workflows/trendos-accounting-native-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 84 | `.github/workflows/trendos-accounting-persistence-readiness-preview-runtime.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 85 | `.github/workflows/trendos-accounting-persistence-schema-preflight-preview-runtime.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 86 | `.github/workflows/trendos-accounting-preview-runtime.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 87 | `.github/workflows/trendos-apps-script-cloud-write-dryrun.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 88 | `.github/workflows/trendos-apps-script-cloud-write-rehearsal.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 89 | `.github/workflows/trendos-apps-script-heartbeat-route-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 90 | `.github/workflows/trendos-apps-script-latency-probe-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 91 | `.github/workflows/trendos-apps-script-staging-pull-dryrun.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 92 | `.github/workflows/trendos-apps-script-v150-dryrun-integration.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 93 | `.github/workflows/trendos-apps-script-v150-live-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 94 | `.github/workflows/trendos-cloud-write-isolated-integration.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 95 | `.github/workflows/trendos-cloud-write-order-contract-v2-staging-live-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 96 | `.github/workflows/trendos-cloud-write-order-contract-v2.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 97 | `.github/workflows/trendos-cloud-write-production-preflight-readonly.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 98 | `.github/workflows/trendos-cloud-write-v2-apps-script-route-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 99 | `.github/workflows/trendos-cloud-write-v2-production-shadow-candidate.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 100 | `.github/workflows/trendos-cloud-write-v2-production-shadow-controlled-deploy.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 101 | `.github/workflows/trendos-cloud-write-v2-production-shadow-integration-candidate.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 102 | `.github/workflows/trendos-cloud-write-v2-production-shadow-live-preflight.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 103 | `.github/workflows/trendos-cloud-write-v2-production-shadow-preview-method-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 104 | `.github/workflows/trendos-cloud-write-v2-production-shadow-preview.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 105 | `.github/workflows/trendos-cloud-write-v2-production-shadow-readonly-enable.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 106 | `.github/workflows/trendos-cloud-write-v2-production-shadow.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 107 | `.github/workflows/trendos-cloud-write-v2-staging-bridge-live.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 108 | `.github/workflows/trendos-cloudflare-edge-preview.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 109 | `.github/workflows/trendos-cloudflare-freshness-diagnostics.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 110 | `.github/workflows/trendos-cloudflare-freshness-stability.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 111 | `.github/workflows/trendos-cloudflare-orders-dual-signal-preview.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 112 | `.github/workflows/trendos-core-p0-11-e2e-readonly-gate.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 113 | `.github/workflows/trendos-d1-orders-low-usage-v1.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 114 | `.github/workflows/trendos-d1-quota-v2.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 115 | `.github/workflows/trendos-edge-orders-preview-runtime-v2.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 116 | `.github/workflows/trendos-edge-orders-preview-runtime.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 117 | `.github/workflows/trendos-edge-orders-production-alias-runtime-v2.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 118 | `.github/workflows/trendos-edge-orders-production-alias-runtime.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 119 | `.github/workflows/trendos-edge-orders-production-deploy-v2.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 120 | `.github/workflows/trendos-edge-orders-production-deploy.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 121 | `.github/workflows/trendos-edge-orders-production-freshness-guard.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 122 | `.github/workflows/trendos-edge-orders-production-preflight.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 123 | `.github/workflows/trendos-edge-orders-read-v1.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 124 | `.github/workflows/trendos-entry504-session-race-manual-bundle.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 125 | `.github/workflows/trendos-entry546-frontend-refresh-recovery-manual-bundle.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 126 | `.github/workflows/trendos-entry579-frontend-create-version-only.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 127 | `.github/workflows/trendos-entry580-readonly-version-verify.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 128 | `.github/workflows/trendos-entry582-promote-exact-frontend.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 129 | `.github/workflows/trendos-entry582-promote-frontend-exact.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 130 | `.github/workflows/trendos-entry585-post-promote-readonly.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 131 | `.github/workflows/trendos-entry594-duplicate-guard-frontend-publish.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 132 | `.github/workflows/trendos-entry595-frontend-readonly-verify.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 133 | `.github/workflows/trendos-gaber-material-control-v1-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 134 | `.github/workflows/trendos-integrity-v1.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 135 | `.github/workflows/trendos-normalized-import-isolated.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 136 | `.github/workflows/trendos-operator-task-appscript-readonly-preflight-v2.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 137 | `.github/workflows/trendos-operator-task-cloudflare-preview-v2.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 138 | `.github/workflows/trendos-operator-task-production-edge-codeonly-off.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 139 | `.github/workflows/trendos-operator-task-production-edge-enable.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 140 | `.github/workflows/trendos-operator-task-production-preactivation-readonly.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 141 | `.github/workflows/trendos-operator-task-proxy-secret-verify.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 142 | `.github/workflows/trendos-operator-task-workflow-v2-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 143 | `.github/workflows/trendos-orders-02cr-visibility-regression.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 144 | `.github/workflows/trendos-prod-latency-split-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 145 | `.github/workflows/trendos-prod-startup-storm-hotfix-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 146 | `.github/workflows/trendos-prod-trendmaster-lazy-hotfix-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 147 | `.github/workflows/trendos-production-cloud-write-business-qualification.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 148 | `.github/workflows/trendos-production-cloud-write-controlled-enable.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 149 | `.github/workflows/trendos-production-cloud-write-pending-migrations-readonly.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 150 | `.github/workflows/trendos-production-cloud-write-schema-controlled-apply.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 151 | `.github/workflows/trendos-production-cloud-write-schema-controlled-contract.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 152 | `.github/workflows/trendos-production-cloud-write-schema-migration-candidate.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 153 | `.github/workflows/trendos-production-cloud-write-schema-readonly.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 154 | `.github/workflows/trendos-production-migration-ledger-forensics-readonly.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 155 | `.github/workflows/trendos-production-migration-ledger-reconciliation-candidate.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 156 | `.github/workflows/trendos-production-migration-ledger-reconciliation-controlled-contract.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 157 | `.github/workflows/trendos-production-migration-ledger-reconciliation-controlled.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 158 | `.github/workflows/trendos-production-migration-ledger-reconciliation-readonly.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 159 | `.github/workflows/trendos-production-orders-frontend-cutover-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 160 | `.github/workflows/trendos-production-outbox-sheets-reconcile-qualification-candidate.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 161 | `.github/workflows/trendos-production-post-0003-stability-readonly.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 162 | `.github/workflows/trendos-production-shadow-stability-observation.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 163 | `.github/workflows/trendos-production-worker-identify.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 164 | `.github/workflows/trendos-r4-production-recovery-controlled.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 165 | `.github/workflows/trendos-r5-periodic-controlled.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 166 | `.github/workflows/trendos-resume-no-autorefresh-v1-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 167 | `.github/workflows/trendos-return-traffic-quiet-v1-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 168 | `.github/workflows/trendos-rp07-remediation-containment-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 169 | `.github/workflows/trendos-staging-synthetic-sample-bridge.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 170 | `.github/workflows/trendos-staging-synthetic-sample-live-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 171 | `.github/workflows/trendos-startup-request-storm-candidate-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 172 | `.github/workflows/trendos-t12-142-d1compatible-local-contract.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 173 | `.github/workflows/trendos-t12-a51-customer-search-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 174 | `.github/workflows/trendos-t12-a51-customer-search-production-deploy.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 175 | `.github/workflows/trendos-t12-a53-customer-native-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 176 | `.github/workflows/trendos-t12-a53-customer-native-install-bootstrap.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 177 | `.github/workflows/trendos-t12-a53-customer-native-install-retry.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 178 | `.github/workflows/trendos-t12-a54-native-customer-search-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 179 | `.github/workflows/trendos-t12-a54-native-customer-search-production-deploy.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 180 | `.github/workflows/trendos-t12-a55-customer-legacy-projection-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 181 | `.github/workflows/trendos-t12-a55-customer-projection-production-deploy.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 182 | `.github/workflows/trendos-t12-a56-customer-cloud-only-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 183 | `.github/workflows/trendos-t12-a56-customer-general-cutover.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 184 | `.github/workflows/trendos-t12-a56-full-cloud-cutover-audit.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 185 | `.github/workflows/trendos-t12-a57-cloudflare-frontend-cutover.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 186 | `.github/workflows/trendos-t12-a57b-cloudflare-worker-frontend.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 187 | `.github/workflows/trendos-t12-a58-runtime-actions-audit.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 188 | `.github/workflows/trendos-t12-a59-native-auth-preflight.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 189 | `.github/workflows/trendos-t12-a61-bootstrap-timeout-off-deploy-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 190 | `.github/workflows/trendos-t12-a61-bootstrap-timeout-qualify-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 191 | `.github/workflows/trendos-t12-a61-cloudflare-readonly-preflight.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 192 | `.github/workflows/trendos-t12-a61-diya-native-bootstrap-canary-v2-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 193 | `.github/workflows/trendos-t12-a61-diya-session-enroll-canary-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 194 | `.github/workflows/trendos-t12-a61-legacy-auth-bridge-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 195 | `.github/workflows/trendos-t12-a61-native-auth-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 196 | `.github/workflows/trendos-t12-a61-off-state-install-preflight.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 197 | `.github/workflows/trendos-t12-a61-phase-b-d1-off-controlled.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 198 | `.github/workflows/trendos-t12-a61-postdeploy-readonly-verify.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 199 | `.github/workflows/trendos-t12-a61-session-enroll-off-deploy-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 200 | `.github/workflows/trendos-t12-a61-session-enroll-qualify-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 201 | `.github/workflows/trendos-t12-a61-session-enroll-qualify-v2-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 202 | `.github/workflows/trendos-t12-a61-session-enroll-sessionbound-qualify-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 203 | `.github/workflows/trendos-t12-a61-sessionbound-off-deploy-temp.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 204 | `.github/workflows/trendos-t12-duplicate-order-guard-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 205 | `.github/workflows/trendos-t12-duplicate-order-guard-production-install.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 206 | `.github/workflows/trendos-t12-duplicate-order-guard-production-preflight.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 207 | `.github/workflows/trendos-t12-entry500-manual-deploy-artifacts.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 208 | `.github/workflows/trendos-t12-fresh-start-4322-isolated-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 209 | `.github/workflows/trendos-t12-order-create-isolated-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 210 | `.github/workflows/trendos-t12-production-create-canary-controlled.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 211 | `.github/workflows/trendos-t12-production-create-canary-isolated-ci.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 212 | `.github/workflows/trendos-t12-synthetic-d1-persistent-write-qualification.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 213 | `.github/workflows/trendos-t12-test-mirror-142-d1compat-retry-once.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 214 | `.github/workflows/trendos-t12-test-mirror-142-qualification.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 215 | `.github/workflows/trendos-t12-test-mirror-142-readonly-guard-probe.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 216 | `.github/workflows/trendos-t12-test-mirror-142-reconcile-readonly.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 217 | `.github/workflows/trendos-t12-test-mirror-negative-qualification.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 218 | `.github/workflows/trendos-t12-test-mirror-positive-qualification.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 219 | `.github/workflows/trendos-work-queue-v1-candidate.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 220 | `.github/workflows/trendos-work-queue-v1-inertness-gate.yml` | أتمتة، GitHub Actions، سير عمل، تشغيل، نشر، اختبار | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 221 | `accounting/d1-persistence-adapter-v1.js` | حسابات، محاسبة، دفتر، فاتورة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 222 | `accounting/d1-persistence-adapter-v1.test.js` | حسابات، محاسبة، دفتر، فاتورة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 223 | `accounting/domain-core-v1.js` | حسابات، محاسبة، دفتر، فاتورة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 224 | `accounting/domain-core-v1.test.js` | حسابات، محاسبة، دفتر، فاتورة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 225 | `accounting/memory-persistence-adapter-v1.js` | حسابات، محاسبة، دفتر، فاتورة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 226 | `accounting/memory-persistence-adapter-v1.test.js` | حسابات، محاسبة، دفتر، فاتورة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 227 | `accounting/persistence-composition-v1.js` | حسابات، محاسبة، دفتر، فاتورة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 228 | `accounting/persistence-composition-v1.test.js` | حسابات، محاسبة، دفتر، فاتورة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 229 | `accounting/preview-persistence-caller-v1.js` | حسابات، محاسبة، دفتر، فاتورة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 230 | `accounting/preview-persistence-caller-v1.test.js` | حسابات، محاسبة، دفتر، فاتورة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 231 | `accounting/transaction-contract-v1.js` | حسابات، محاسبة، دفتر، فاتورة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 232 | `accounting/transaction-contract-v1.test.js` | حسابات، محاسبة، دفتر، فاتورة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 233 | `app.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 234 | `APPS_SCRIPT_DEPLOY_V1940.md` | توثيق، مرجع، ملاحظات | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 235 | `apps-script/patches/CLOUD_WRITE_ORDER_V2_CANONICAL_ADAPTER_DRYRUN_V1.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 236 | `apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_AUTH_BRIDGE_QUALIFICATION_V1.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 237 | `apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_V1.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 238 | `apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_CANONICAL_TARGET_IDENTITY_V1.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 239 | `apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_FIRST_WRITE_HARNESS_V1.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 240 | `apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_FIRST_WRITE_RECOVERY_V1.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 241 | `apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_RUNTIME_PREFLIGHT_V1.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 242 | `apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_SIDE_EFFECT_QUALIFICATION_V1.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 243 | `apps-script/patches/CLOUD_WRITE_PRODUCTION_RECONCILE_QUALIFICATION_V1.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 244 | `apps-script/patches/CLOUD_WRITE_RECONCILE_AUTH_SELFTEST_V1.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 245 | `apps-script/patches/CLOUD_WRITE_RECONCILE_DRYRUN_V1.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 246 | `apps-script/patches/CLOUD_WRITE_RECONCILE_REHEARSAL_LIVE_RUNNER_V1.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 247 | `apps-script/patches/CLOUD_WRITE_RECONCILE_REHEARSAL_V1.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 248 | `apps-script/patches/CLOUD_WRITE_STAGING_PULL_DRYRUN_V1.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 249 | `apps-script/patches/D1_ORDERS_LOW_USAGE_HEARTBEAT_ROUTE_V1.md` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 250 | `apps-script/patches/SAVE_TIMEOUT_HOTFIX_V3_APPEND_ONLY_SAFE.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 251 | `apps-script/patches/TIMEOUT_HOTFIX_V1_APPEND_ONLY.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 252 | `apps-script/patches/TIMEOUT_HOTFIX_V2_APPEND_ONLY_SAFE.gs` | Apps Script، جوجل، خلفية، legacy | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 253 | `ATTENDANCE_V1_INTEGRATION.md` | توثيق، مرجع، ملاحظات | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 254 | `attendance-backend-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 255 | `attendance-clockin-backend-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 256 | `attendance-clockin-ui-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 257 | `attendance-live-timer-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 258 | `attendance-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 259 | `browser-api-transport-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 260 | `build/apps-script/TrendOS_BACKEND_UNIFIED_V147_CANDIDATE.manifest.json` | أداة، صيانة، سكربت، بناء | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 261 | `cleaning-backend-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 262 | `cloudflare-d1/apps-script-importer.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 263 | `cloudflare-d1/D1_Full_Migration.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 264 | `cloudflare-d1/D1_Normalized_Live_Sync_V2.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 265 | `cloudflare-d1/D1_Normalized_Live_Sync.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 266 | `cloudflare-d1/D1_Operational_Enrichment_Live_Sync_02CR.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 267 | `cloudflare-d1/D1_Orders_Live_Sync_V2.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 268 | `cloudflare-d1/D1_Orders_Live_Sync.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 269 | `cloudflare-d1/D1_Orders_Low_Usage_Control_V1.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 270 | `cloudflare-d1/D1_Orders_Low_Usage_Heartbeat_V1.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 271 | `cloudflare-d1/D1_Orders_Read_Cutover.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 272 | `cloudflare-d1/D1_Screen_View_Mirror_Refresh_02CQ.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 273 | `cloudflare-d1/D1_Zero_Idle_Control.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 274 | `cloudflare-d1/MIGRATION_V2_STATUS.md` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 275 | `cloudflare-d1/migrations/0001_init.sql` | قاعدة بيانات، D1، ترحيل، migration، schema | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 276 | `cloudflare-d1/migrations/0002_full_sheet_mirror.sql` | قاعدة بيانات، D1، ترحيل، migration، schema | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 277 | `cloudflare-d1/migrations/0003_cloud_write_lane.sql` | قاعدة بيانات، D1، ترحيل، migration، schema | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 278 | `cloudflare-d1/migrations/0004_cloud_auth_shadow_v1.sql` | قاعدة بيانات، D1، ترحيل، migration، schema | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 279 | `cloudflare-d1/migrations/0005_t12_production_create_canary.sql` | قاعدة بيانات، D1، ترحيل، migration، schema | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 280 | `cloudflare-d1/migrations/0006_t12_operational_runtime.sql` | قاعدة بيانات، D1، ترحيل، migration، schema | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 281 | `cloudflare-d1/migrations/0007_t12_general_create_control.sql` | قاعدة بيانات، D1، ترحيل، migration، schema | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 282 | `cloudflare-d1/migrations/0008_t12_customer_master.sql` | قاعدة بيانات، D1، ترحيل، migration، schema | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 283 | `cloudflare-d1/migrations/0009_employee_auth_native_v1.sql` | قاعدة بيانات، D1، ترحيل، migration، schema | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 284 | `cloudflare-d1/migrations/0010_t12_duplicate_order_guard.sql` | قاعدة بيانات، D1، ترحيل، migration، schema | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 285 | `cloudflare-d1/preview/index.js` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 286 | `cloudflare-d1/preview/production-shadow-preview.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 287 | `cloudflare-d1/preview/wrangler.operator-task-v2.toml` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 288 | `cloudflare-d1/preview/wrangler.toml` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 289 | `cloudflare-d1/production-shadow/index.js` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 290 | `cloudflare-d1/production-shadow/observer.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 291 | `cloudflare-d1/production-shadow/wrangler.candidate.toml` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 292 | `cloudflare-d1/production-shadow/wrangler.production-integration-candidate.toml` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 293 | `cloudflare-d1/schema-prep/accounting-finance-v1.sql` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 294 | `cloudflare-d1/schema-prep/accounting-operations-v1.sql` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 295 | `cloudflare-d1/schema-prep/t12-business-create-candidate-v1.sql` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 296 | `cloudflare-d1/schema-prep/t12-cloud-native-synthetic-create-v1.sql` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 297 | `cloudflare-d1/schema-prep/t12-order-create-shadow-v1.sql` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 298 | `cloudflare-d1/schema-prep/t12-order-id-authority-v1.sql` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 299 | `cloudflare-d1/src/accounting-capabilities-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 300 | `cloudflare-d1/src/accounting-contract-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 301 | `cloudflare-d1/src/accounting-finance-api-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 302 | `cloudflare-d1/src/accounting-finance-core-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 303 | `cloudflare-d1/src/accounting-finance-safe-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 304 | `cloudflare-d1/src/accounting-foundation-api-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 305 | `cloudflare-d1/src/accounting-foundation-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 306 | `cloudflare-d1/src/accounting-native-module.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 307 | `cloudflare-d1/src/accounting-operations-read-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 308 | `cloudflare-d1/src/accounting-persistence-readiness-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 309 | `cloudflare-d1/src/accounting-persistence-schema-preflight-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 310 | `cloudflare-d1/src/accounting-preview.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 311 | `cloudflare-d1/src/cloud-auth-shadow-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 312 | `cloudflare-d1/src/cloud-session-bridge-v3.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 313 | `cloudflare-d1/src/cloud-write-gate.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 314 | `cloudflare-d1/src/cloud-write-order-contract-v2-staging.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 315 | `cloudflare-d1/src/cloud-write-order-contract-v2.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 316 | `cloudflare-d1/src/cloud-write-order-v2-production-shadow.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 317 | `cloudflare-d1/src/cloud-write-order-v2-staging-bridge.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 318 | `cloudflare-d1/src/cloud-write-production-reconcile-qualification.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 319 | `cloudflare-d1/src/cloud-write-reconcile-core.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 320 | `cloudflare-d1/src/cloud-write-staging-reconcile.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 321 | `cloudflare-d1/src/cloud-write.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 322 | `cloudflare-d1/src/edge-customer-search-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 323 | `cloudflare-d1/src/edge-gateway.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 324 | `cloudflare-d1/src/edge-orders-freshness-gate.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 325 | `cloudflare-d1/src/edge-orders-idle-heartbeat.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 326 | `cloudflare-d1/src/edge-orders-idle-verifier.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 327 | `cloudflare-d1/src/edge-orders-line-id-repair-02cx.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 328 | `cloudflare-d1/src/edge-orders-operational-enrichment-02cr.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 329 | `cloudflare-d1/src/edge-orders-read-02cr-canary.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 330 | `cloudflare-d1/src/edge-orders-read-02cr-freshness.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 331 | `cloudflare-d1/src/edge-orders-read-v1-canary.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 332 | `cloudflare-d1/src/edge-orders-read-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 333 | `cloudflare-d1/src/edge-orders-service-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 334 | `cloudflare-d1/src/employee-auth-native-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 335 | `cloudflare-d1/src/employee-legacy-bridge-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 336 | `cloudflare-d1/src/frontend-static-worker.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 337 | `cloudflare-d1/src/index_v2.js` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 338 | `cloudflare-d1/src/index.js` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 339 | `cloudflare-d1/src/legacy-browser-transport-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 340 | `cloudflare-d1/src/mirror-delta-gate.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 341 | `cloudflare-d1/src/mirror-gate.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 342 | `cloudflare-d1/src/mirror.js` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 343 | `cloudflare-d1/src/normalized-import-gate.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 344 | `cloudflare-d1/src/operator-task-edge-v2.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 345 | `cloudflare-d1/src/r4-guarded-recovery-production.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 346 | `cloudflare-d1/src/t12-business-create-candidate.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 347 | `cloudflare-d1/src/t12-client-key-continuity-guard.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 348 | `cloudflare-d1/src/t12-cloud-client-key-admission.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 349 | `cloudflare-d1/src/t12-cloud-native-synthetic-create.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 350 | `cloudflare-d1/src/t12-customer-legacy-projection.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 351 | `cloudflare-d1/src/t12-customer-master.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 352 | `cloudflare-d1/src/t12-customer-write-handler.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 353 | `cloudflare-d1/src/t12-general-create-handler.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 354 | `cloudflare-d1/src/t12-general-create.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 355 | `cloudflare-d1/src/t12-operational-runtime-handler.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 356 | `cloudflare-d1/src/t12-order-create-cutover-state.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 357 | `cloudflare-d1/src/t12-order-create-input-guard.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 358 | `cloudflare-d1/src/t12-order-create-preflight.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 359 | `cloudflare-d1/src/t12-order-create-shadow-intent.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 360 | `cloudflare-d1/src/t12-order-create-shadow-store.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 361 | `cloudflare-d1/src/t12-order-id-authority-candidate.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 362 | `cloudflare-d1/src/t12-order-id-seed-evidence.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 363 | `cloudflare-d1/src/t12-production-create-canary-handler.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 364 | `cloudflare-d1/src/t12-production-create-canary.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 365 | `cloudflare-d1/src/t12-read-overlay-handler.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 366 | `cloudflare-d1/src/t12-read-overlay.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 367 | `cloudflare-d1/staging/index.js` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 368 | `cloudflare-d1/staging/wrangler.toml` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 369 | `cloudflare-d1/t12-preview/order-create-shadow-handler.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 370 | `cloudflare-d1/t12-preview/r4-preview-local-entry.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 371 | `cloudflare-d1/t12-preview/r4-preview-synthetic-fixture.sql` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 372 | `cloudflare-d1/t12-preview/r5-orders-periodic-bound-appsscript-candidate.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 373 | `cloudflare-d1/t12-preview/r5-orders-periodic-guarded-handler-candidate.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 374 | `cloudflare-d1/t12-preview/t12-cloud-native-synthetic-test-worker.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 375 | `cloudflare-d1/t12-preview/t12-d1-128-packed-cas-batch-isolated-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 376 | `cloudflare-d1/t12-preview/t12-d1-128-packed-cas-planner-isolated-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 377 | `cloudflare-d1/t12-preview/t12-d1-128-recovery-capacity-envelope-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 378 | `cloudflare-d1/t12-preview/t12-d1-142-all-row-preimage-guard-isolated-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 379 | `cloudflare-d1/t12-preview/t12-d1-142-chunked-preimage-guard-isolated-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 380 | `cloudflare-d1/t12-preview/t12-d1-baseline-shape-diagnostic-readonly-20260919.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 381 | `cloudflare-d1/t12-preview/t12-d1-direct-cas-bounded-catchup-20260920.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 382 | `cloudflare-d1/t12-preview/t12-d1-direct-snapshot-bounded-catchup-draft-20260919.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 383 | `cloudflare-d1/t12-preview/t12-d1-guarded-recovery-batch-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 384 | `cloudflare-d1/t12-preview/t12-d1-guarded-recovery-preview-handler-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 385 | `cloudflare-d1/t12-preview/t12-d1-mirror-baseline-lineage-readonly-20260919.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 386 | `cloudflare-d1/t12-preview/t12-d1-mirror-catalog-readonly-20260919.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 387 | `cloudflare-d1/t12-preview/t12-d1-one-shot-atomic-full-rebase-20260926.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 388 | `cloudflare-d1/t12-preview/t12-d1-rows-parity-readonly-20260919.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 389 | `cloudflare-d1/t12-preview/t12-d1-source-baseline-drift-readonly-20260919.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 390 | `cloudflare-d1/t12-preview/t12-d1-sync-metadata-readonly-20260919.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 391 | `cloudflare-d1/t12-preview/t12-d1-targeted-recovery-plan-v1.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 392 | `cloudflare-d1/t12-preview/t12-d1-targeted-recovery-preflight-readonly-20260919.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 393 | `cloudflare-d1/t12-preview/t12-dashboard-singlefile-test-worker.js` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 394 | `cloudflare-d1/t12-preview/t12-existing-test-mirror-142-readonly-guard-probe-20260926.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 395 | `cloudflare-d1/t12-preview/t12-existing-test-mirror-142-remote-dev-worker-20260926.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 396 | `cloudflare-d1/t12-preview/t12-existing-test-mirror-exact-fixture-readonly-20260924.sql` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 397 | `cloudflare-d1/t12-preview/t12-existing-test-mirror-negative-remote-dev-worker-20260926.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 398 | `cloudflare-d1/t12-preview/t12-existing-test-mirror-packed-cas-qualification-isolated-20260924.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 399 | `cloudflare-d1/t12-preview/t12-existing-test-mirror-packed-cas-qualification-runbook-20260924.md` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 400 | `cloudflare-d1/t12-preview/t12-existing-test-mirror-positive-remote-dev-worker-20260926.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 401 | `cloudflare-d1/t12-preview/t12-existing-test-mirror-schema-preflight-readonly-20260924.sql` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 402 | `cloudflare-d1/t12-preview/t12-existing-test-mirror-two-tab-fake-baseline-20260924.sql` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 403 | `cloudflare-d1/t12-preview/t12-owner-local-replay-existing-fabricated-order-20260922.ps1` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 404 | `cloudflare-d1/t12-preview/t12-owner-local-single-fabricated-order-20260922.ps1` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 405 | `cloudflare-d1/t12-preview/t12-production-d1-aggregate-evidence-readonly-20260922.sql` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 406 | `cloudflare-d1/t12-preview/t12-replay-existing-key-test-d1-readonly-pre-postflight-20260922.sql` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 407 | `cloudflare-d1/t12-preview/t12-script-properties-quota-audit-readonly.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 408 | `cloudflare-d1/t12-preview/t12-script-properties-replay-backup-sheet-verify-readonly.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 409 | `cloudflare-d1/t12-preview/t12-script-properties-replay-cleanup-preview.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 410 | `cloudflare-d1/t12-preview/t12-script-properties-replay-fixed150-delete-once.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 411 | `cloudflare-d1/t12-preview/t12-script-properties-replay-private-backup.gs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 412 | `cloudflare-d1/t12-preview/t12-test-mirror-structure-readonly-20260924.sql` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 413 | `cloudflare-d1/t12-preview/wrangler.r4-preview.local.toml` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 414 | `cloudflare-d1/t12-preview/wrangler.t12-synthetic-test.template.toml` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 415 | `cloudflare-d1/test/cloud-auth-shadow-v1.test.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 416 | `cloudflare-d1/test/cloud-session-bridge-v3-auth-shadow.test.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 417 | `cloudflare-d1/test/cloud-session-bridge-v3.test.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 418 | `cloudflare-d1/test/t8-print-live-canonical-parity.mjs` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 419 | `cloudflare-d1/wrangler.frontend.toml` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 420 | `cloudflare-d1/wrangler.toml` | Cloudflare، D1، API، قاعدة بيانات، سحابة | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 421 | `Code.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 422 | `config.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 423 | `customer_manager_d1_bridge_v1934.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 424 | `customer_manager_guard_v1933.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 425 | `customer_manager_v1933.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 426 | `customer-feedback-backend-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 427 | `customer-feedback-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 428 | `customer-manager-backend-v1932.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 429 | `customer-manager-send-integrity-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 430 | `customer-manager-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 431 | `D1_Fast_Auth_V2_5_Safe.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 432 | `docs/archive/trendos-master-book/2026-09-24/APPS_SCRIPT_DEPLOY_V1940.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 433 | `docs/archive/trendos-master-book/2026-09-24/CLOUD_MIGRATION_V3_T11_COMPLETE_HANDOFF_2026-09-14.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 434 | `docs/archive/trendos-master-book/2026-09-24/CLOUD_MIGRATION_V3_T11_CURRENT_HANDOFF_2026-09-14.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 435 | `docs/archive/trendos-master-book/2026-09-24/CLOUD_MIGRATION_V3_T12_CURRENT_HANDOFF_2026-09-19.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 436 | `docs/archive/trendos-master-book/2026-09-24/CLOUD_MIGRATION_V3_T12_TEST_CLOUDFLARE_OWNER_STOP_HANDOFF_2026-09-21.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 437 | `docs/archive/trendos-master-book/2026-09-24/README_V1931.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 438 | `docs/archive/trendos-master-book/2026-09-24/TRENDOS_BLACKBOX_2026-09-13_RP07_FINAL_HEALTH_PASS_CLOSED.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 439 | `docs/archive/trendos-master-book/2026-09-24/TRENDOS_BLACKBOX_2026-09-13_T6B_CLOUD_AUTH_SHADOW_CANARY_PASS.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 440 | `docs/archive/trendos-master-book/2026-09-24/TRENDOS_GO_LIVE_2026-09-01_MASTER.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 441 | `docs/archive/trendos-master-book/2026-09-24/TRENDOS_T12_NEW_CHAT_HANDOFF_AFTER_EXACT_KEY_REPLAY_2026-09-22.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 442 | `docs/archive/trendos-master-book/2026-09-24/V1932_RELEASE.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 443 | `docs/trendos/blackbox/ACCOUNTING_CF_02S_SCHEMA_GAP_BASELINE_RUNTIME_WIRED_2026-09-05.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 444 | `docs/trendos/blackbox/ACCOUNTING_F2_PREVIEW_CALLER_NATIVE_CI_WIRING_2026-09-05.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 445 | `docs/trendos/blackbox/EasyStore/EASYSTORE_BLACKBOX.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 446 | `docs/trendos/blackbox/EasyStore/README.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 447 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_BACKEND_UNIFICATION_HANDOFF.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 448 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AA_02AF.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 449 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AG.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 450 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AH.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 451 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AI_02AJ.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 452 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AK_02AL.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 453 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AM.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 454 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AN_02AP.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 455 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AR.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 456 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 457 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AT.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 458 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AU.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 459 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AV.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 460 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AW.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 461 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AX.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 462 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AY.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 463 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AZ.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 464 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BA.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 465 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BB.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 466 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BC.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 467 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BD.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 468 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 469 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BF.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 470 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BG.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 471 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02R.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 472 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02S_02T.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 473 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02U.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 474 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02V.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 475 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02W.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 476 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02H_RUNTIME_CI_PROOF_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 477 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02I_CHECKPOINT_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 478 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02I_CI_PROOF_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 479 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02I_NATIVE_CI_WIRING_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 480 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02I_PERSISTENCE_READINESS_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 481 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02I_PERSISTENCE_READINESS_TEST_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 482 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02J_CHECKPOINT_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 483 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02J_CI_PROOF_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 484 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02J_DIAGNOSTIC_ROUTE_ADJUSTMENT.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 485 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02J_NATIVE_CI_WIRING_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 486 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02J_RUNTIME_DIAGNOSTIC_TEST_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 487 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02J_RUNTIME_READINESS_DIAGNOSTIC_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 488 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02K_CHECKPOINT_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 489 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02K_LIVE_READINESS_PROBE_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 490 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02L_CHECKPOINT_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 491 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02L_CI_PROOF_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 492 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02L_NATIVE_CI_WIRING_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 493 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02L_SCHEMA_PREFLIGHT_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 494 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02L_SCHEMA_PREFLIGHT_TEST_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 495 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02M_RUNTIME_SCHEMA_PREFLIGHT_ENDPOINT.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 496 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02M_RUNTIME_SCHEMA_PREFLIGHT_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 497 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02M_RUNTIME_SCHEMA_PREFLIGHT_TEST_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 498 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02N_CHECKPOINT_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 499 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02N_LIVE_SCHEMA_PREFLIGHT_PROBE_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 500 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02N_RUNTIME_PROOF_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 501 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02O_D1_ACCOUNT_DISCOVERY_WORKFLOW_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 502 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02O_DISCOVERY_RESULT_CAPTURE_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 503 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02O_ISOLATED_PREVIEW_D1_DISCOVERY_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 504 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02P_COMPLETE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 505 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02P_CREATE_FAILURE_DIAGNOSIS_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 506 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02P_ISOLATED_D1_CREATE_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 507 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02P_ISOLATED_D1_CREATED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 508 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02P_REST_CREATE_DIAGNOSTIC_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 509 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02P_SCOPE_ASSERTION_FINAL_FIX_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 510 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02P_WORKFLOW_SYNTAX_FIX_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 511 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02Q_PREVIEW_BINDING_DEPLOYED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 512 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02Q_PREVIEW_BINDING_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 513 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02R_LIVE_BINDING_PROBE_IMPLEMENTED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 514 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02R_LIVE_BINDING_PROBE_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 515 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02T_ISOLATED_PREVIEW_SCHEMA_APPLY_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 516 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02T_ISOLATED_PREVIEW_SCHEMA_APPLY_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 517 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02U_GATE_PATH_CORRECTION.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 518 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02U_RUNTIME_SCHEMA_COMPAT_EXEC.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 519 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02U_RUNTIME_SCHEMA_COMPAT_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 520 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02U_RUNTIME_SCHEMA_COMPAT_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 521 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02U_STALE_RUNTIME_ROUTE_DIAGNOSIS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 522 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02V_FULL_WRITE_SCHEMA_GATE_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 523 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_F2_D1_ADAPTER_CI_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 524 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_F2_D1_ADAPTER_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 525 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_F2_PREVIEW_CALLER_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 526 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_F2_PREVIEW_CALLER_TEST_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 527 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_F2_PREVIEW_PERSISTENCE_GATE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 528 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BH_02BJ.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 529 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BL.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 530 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BM.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 531 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BN.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 532 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BP.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 533 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BQ.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 534 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BR.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 535 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 536 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BT.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 537 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BU.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 538 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BV.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 539 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BW.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 540 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BX.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 541 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BY.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 542 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BZ.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 543 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CA_FINAL_VERIFY.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 544 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CA.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 545 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CB_PRODUCTION_SHADOW_STABILITY_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 546 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CB.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 547 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_CLOUD_WRITE_READINESS_REVIEW_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 548 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_CLOUD_WRITE_READINESS_REVIEW_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 549 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_READONLY_PROBE_SELF_MATCH_DIAGNOSIS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 550 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_STALE_PRODUCTION_DB_ID_DIAGNOSIS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 551 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 552 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD_PENDING_MIGRATIONS_BLOCKER.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 553 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD_PENDING_MIGRATIONS_READONLY_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 554 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 555 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE_METADATA_QUERY_MEASUREMENT_FAILURE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 556 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE_MIGRATION_LEDGER_RECONCILIATION_REVIEW_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 557 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 558 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CF_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 559 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CF_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 560 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CG_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 561 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CG_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 562 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_CONTRACT_FALSE_POSITIVE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 563 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_CONTROLLED_CONTRACT_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 564 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 565 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 566 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CI.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 567 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CJ_LEDGER_RECONCILIATION_ON_STATE_AUTHORIZED_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 568 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CJ_PRODUCTION_LEDGER_RECONCILIATION_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 569 | `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PLATFORM_CF_SCOPE_AND_CURRENT_STATE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 570 | `docs/trendos/blackbox/منصة ترند/00_INDEX.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 571 | `docs/trendos/blackbox/منصة ترند/00_PROJECT_LOCATOR.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 572 | `docs/trendos/blackbox/منصة ترند/01_CURRENT_STATE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 573 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_02CQ_CODE_SAFETY_INSPECTION_PASS_2026-09-13_2100.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 574 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_02CQ_LIVE_ROUTE_PROBE_2026-09-13_2101.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 575 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_FRESHNESS_RUNTIME_HEALTHY_2026-09-13_2058.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 576 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_RESUME_CHECKPOINT_2026-09-13_2051.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 577 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_CONTRACT_CHECKPOINT_2026-09-13_2052.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 578 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_DEPLOYED_PARITY_ATTEMPT1_FAIL_2026-09-13_2057.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 579 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_FIELD_ORIGIN_ATTEMPT1_FAIL_2026-09-13_2055.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 580 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_FIELD_ORIGIN_PASS_2026-09-13_2056.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 581 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_HEADER_PROBE_PASS_2026-09-13_2054.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 582 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_ORDERS_IDENTITY_MAP_PASS_2026-09-13_2105.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 583 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_ORDERS_ROWNUMBER_MAP_PASS_2026-09-13_2103.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 584 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_ROW_BUILDER_EXTRACT_PASS_2026-09-13_2053.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 585 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_ROWNUMBER_SOURCE_MAP_PASS_2026-09-13_2059.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 586 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_VIEW_FORMULA_SOURCE_PASS_2026-09-13_2102.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 587 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_APPS_SCRIPT_DEPLOYMENT_WIDE_404_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 588 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_APPS_SCRIPT_HEALTH_RECOVERY_UNSTABLE_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 589 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_APPS_SCRIPT_SOURCE_UNCHANGED_SINCE_T6B_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 590 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_COMPLETE_HANDOFF_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 591 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_CURRENT_HANDOFF_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 592 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_DIRECT_SESSION_VERIFY_REGRESSION_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 593 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_FRESHNESS_RUNTIME_PROBE_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 594 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_PREDEPLOY_SESSION_GATE_FAIL_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 595 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_ROUTING_INSPECTION_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 596 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_CANDIDATE_PARITY_NEAR_PASS_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 597 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_CANDIDATE_PARITY_PASS_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 598 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_CANDIDATE_PARITY_V1_2026-09-13.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 599 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_EXCLUDE_9_DECISION_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 600 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_EXCLUSION_HASHES_PASS_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 601 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_EXCLUSION_RULE_V1_2026-09-13.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 602 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_EXCLUSION_RULE_V2_2026-09-13.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 603 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_FRESHNESS_GUARD_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 604 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_FRONTEND_CANDIDATE_DIAGNOSTIC_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 605 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_FRONTEND_CANDIDATE_PASS_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 606 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_FRONTEND_CUTOVER_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 607 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_FRONTEND_PRODUCTION_PASS_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 608 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_ROUTE_CANDIDATE_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 609 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_ROW270_HYPOTHESIS_REJECTED_2026-09-13.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 610 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_SINGLE_FIELD_DIFF_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 611 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_WORKER_CANARY_ATTEMPT1_ROLLBACK_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 612 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_WORKER_CANARY_ATTEMPT2_ROLLBACK_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 613 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_WORKER_CANARY_PASS_2026-09-14.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 614 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_WRITE_IDENTITY_GATE_2026-09-13.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 615 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_128_ROW_CANDIDATE_D1_RECOVERY_PLAN_REVIEW_2026-09-23.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 616 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_CLOUD_FIRST_SAFE_PIVOT_2026-09-20.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 617 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_CLOUD_NATIVE_SYNTHETIC_ATOMIC_CHECKPOINT_2026-09-20.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 618 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_CONTINUATION_HANDOFF_2026-09-22.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 619 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_CURRENT_HANDOFF_2026-09-19.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 620 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_NEW_CHAT_START_PROMPT_2026-09-23.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 621 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_ORDER_CREATE_GITHUB_PREP_PASS_2026-09-19.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 622 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_ORDER_CREATE_PARITY_MATRIX_2026-09-19.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 623 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_PRODUCTION_D1_READONLY_OWNER_RUNBOOK_2026-09-22.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 624 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_R5_READONLY_RECOVERY_PREFLIGHT_OWNER_DECISION_2026-09-23.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 625 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_READONLY_NEXT_ORDER_PROPERTY_HELPER_2026-09-22.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 626 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_READONLY_PRODUCTION_EVIDENCE_2026-09-22.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 627 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_REAL_CREATE_FENCE_AND_READONLY_DECISION_2026-09-22.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 628 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_TEST_CLOUDFLARE_OWNER_STOP_HANDOFF_2026-09-21.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 629 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_TEST_RESOURCE_PROVISIONING_GATE_2026-09-21.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 630 | `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T8_PRINT_GLOBAL_D1_READ_PASS_2026-09-13.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 631 | `docs/trendos/blackbox/منصة ترند/OPERATOR_TASK_V2_CLOUDFLARE_PREVIEW_2026-09-13.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 632 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_BACKEND_UNIFICATION_HANDOFF.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 633 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AA_02AF.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 634 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AG.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 635 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AH.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 636 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AI_02AJ.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 637 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AK_02AL.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 638 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AM.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 639 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AN_02AP.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 640 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AR.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 641 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 642 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AT.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 643 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AU.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 644 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AV.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 645 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AW.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 646 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AX.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 647 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AY.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 648 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AZ.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 649 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BA.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 650 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BB.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 651 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BC.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 652 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BD.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 653 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 654 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BF.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 655 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BG.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 656 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02R.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 657 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02S_02T.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 658 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02U.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 659 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02V.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 660 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02W.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 661 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BH_02BJ.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 662 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BL.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 663 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BM.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 664 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BN.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 665 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BP.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 666 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BQ.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 667 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BR.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 668 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 669 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BT.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 670 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BU.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 671 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BV.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 672 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BW.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 673 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BX.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 674 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BY.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 675 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BZ.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 676 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CA_FINAL_VERIFY.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 677 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CA.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 678 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CB_PRODUCTION_SHADOW_STABILITY_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 679 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CB.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 680 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_CLOUD_WRITE_READINESS_REVIEW_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 681 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_CLOUD_WRITE_READINESS_REVIEW_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 682 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_READONLY_PROBE_SELF_MATCH_DIAGNOSIS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 683 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_STALE_PRODUCTION_DB_ID_DIAGNOSIS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 684 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 685 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD_PENDING_MIGRATIONS_BLOCKER.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 686 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD_PENDING_MIGRATIONS_READONLY_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 687 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 688 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE_METADATA_QUERY_MEASUREMENT_FAILURE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 689 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE_MIGRATION_LEDGER_RECONCILIATION_REVIEW_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 690 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 691 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CF_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 692 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CF_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 693 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CG_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 694 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CG_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 695 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_CONTRACT_FALSE_POSITIVE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 696 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_CONTROLLED_CONTRACT_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 697 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 698 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 699 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CI.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 700 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CJ_LEDGER_RECONCILIATION_ON_STATE_AUTHORIZED_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 701 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CJ_PRODUCTION_LEDGER_RECONCILIATION_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 702 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_AUTH_BLOCKED_NO_WRITE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 703 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_AUTH_EXCHANGE_FAILED_NO_BUSINESS_WRITE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 704 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_AUTH_READINESS_RECHECK_NO_WRITE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 705 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_PRODUCTION_BUSINESS_QUALIFICATION_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 706 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_RAHMA_AUTH_EXCHANGE_FAILED_NO_BUSINESS_WRITE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 707 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_RAHMA_AUTH_EXCHANGE_RETRY3_FAILED_NO_BUSINESS_WRITE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 708 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_RAHMA_VALID_SESSION_BUT_ALLOWLIST_BLOCK.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 709 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 710 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_USERNAME_CASE_DISCOVERY_SESSION_INVALIDATED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 711 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_VIRTUAL_EMPLOYEE_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 712 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_VIRTUAL_QUALIFIER_RERUN_AUTH_FAILED_NO_BUSINESS_WRITE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 713 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_VIRTUAL_QUALIFIER_SECRET_PROBE_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 714 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_VIRTUAL_QUALIFIER_WAEL_PROVISIONED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 715 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_WAEL_AUTH_FAILED_MISSING_LAST_LOGIN_NO_BUSINESS_WRITE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 716 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_APPS_V153_WORKER_DEFAULT_OFF_LIVE_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 717 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_CANDIDATE_PREPARED_CI_PASS_NO_PRODUCTION_MUTATION.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 718 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_DEDICATED_SECRET_READY_WAEL_REENABLED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 719 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_EMPLOYEE_SECRET_OTHER_VALUE_NO_AUTH.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 720 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_LIVE_READONLY_PREFLIGHT_PASS_NO_MUTATION.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 721 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_WAEL_FRESH_AUTH_MISMATCH_TOKEN_CLEARED_NO_RECONCILIATION.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 722 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_WAEL_TOKEN_FINGERPRINT_MISMATCH_NO_AUTH_NO_RECONCILIATION.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 723 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_WORKER_WRAPPED_DEFAULT_OFF_CI_PASS_NOT_DEPLOYED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 724 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PLATFORM_BLACKBOX_CLASSIFICATION.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 725 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PLATFORM_CF_SCOPE_AND_CURRENT_STATE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 726 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CL_AUTH_PASS_SECRET_PLACEMENT_CORRECTION_HOLD.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 727 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CL_PRODUCTION_OUTBOX_TO_SHEETS_PASS_CLOSED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 728 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CM_READONLY_STABILITY_PREFLIGHT_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 729 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CN_ORDERS_READ_HOTPATH_CANDIDATE_CI_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 730 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CO_AUTH_PASS_VIEW_MIRROR_STALE_BLOCKED_BOUNDARY_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 731 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CO_WORKER_LIVE_AUTH_BLOCKED_BOUNDARY_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 732 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_APPROVED_PREBOUNDARY_PASS_DEPLOY_CHANNEL_BLOCKED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 733 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_SCREEN_VIEW_MIRROR_REFRESH.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 734 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_SELF_CONTAINED_FINAL_CANDIDATE_PASS_MANUAL_IDE_GATE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 735 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_VERIFIED_PASS_CLOSED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 736 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_APPROVED_PREDEPLOY_PASS_MANUAL_APPS_SCRIPT_EXECUTION_REQUIRED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 737 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FIELD_COMPLETENESS_REGRESSION_ROLLBACK.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 738 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FRONTEND_STALE_CACHE_RECOVERY.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 739 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_PREVIEW_SOURCE_PARITY_HEARTBEAT_BOUNDARY_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 740 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_VIEW_FORMULA_RANGE_FIX.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 741 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_VIEW_FORMULA_USER_VALIDATED_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 742 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CS_PRODUCTION_WORKER_AUTH_PREFLIGHT_BLOCKED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 743 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CS_PRODUCTION_WORKER_ROUTE_PASS_FRONTEND_OFF.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 744 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CT_PRODUCTION_FRONTEND_CUTOVER_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 745 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CT_USER_VISIBLE_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 746 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_02CR_DUAL_SIGNAL_IDLE_FRESHNESS_CANDIDATE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 747 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_DUAL_SIGNAL_PRODUCTION_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 748 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_DUAL_SIGNAL_USER_VISIBLE_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 749 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_NO_REFRESH.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 750 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_USER_VISIBLE_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 751 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_STABILITY_FRESHNESS_RESUME_GUARDS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 752 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CV_DURABLE_PARITY_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 753 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CV_ORDER_STATUS_WRITE_CONSISTENCY.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 754 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CW_GLOBAL_COUNTERS_DEFAULT_FILTERS_PRESS_TOTALS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 755 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_TREND_MASTER_SAFE_BOUNDED_FIX.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 756 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_TREND_MASTER_V1931_DEPLOYMENT_CHANNEL_BLOCKED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 757 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_TREND_MASTER_V1931_PRODUCTION_ACTIVATED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 758 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_TREND_MASTER_V1931_RESILIENCE_CANDIDATE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 759 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-07_CORE_P0_11_REGRESSION_E2E_GO_NOGO.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 760 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-09_RP06_REGISTRY_WRITE_APPROVED_PENDING_EXECUTION.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 761 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_GABER_DAILY_MATERIAL_FLOW_REQUIREMENT.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 762 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_GABER_EASYSTORE_LEDGER_ADAPTER_PRESTEP.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 763 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_GABER_LASER_MATERIAL_CUSTODY_WASTE_CONTROL_V1.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 764 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_GABER_MATERIAL_CONTROL_V1_CANDIDATE_CHECKPOINT_01.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 765 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_GABER_MATERIAL_CONTROL_V1_CANDIDATE_CHECKPOINT_02_LEDGER_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 766 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_GABER_MATERIAL_CONTROL_V1_CANDIDATE_CHECKPOINT_03_EASYSTORE_ADAPTER_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 767 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_GABER_MATERIAL_CONTROL_V1_CANDIDATE_CHECKPOINT_04_PERSISTENCE_BACKEND_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 768 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_GABER_MATERIAL_CONTROL_V1_PERSISTENCE_BACKEND_EXECUTION_PLAN.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 769 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_V2_EDGE_AUTH_BRIDGE_DESIGN.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 770 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_V2_HYBRID_CLOUDFLARE_DESIGN_PREP.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 771 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_V2_OWNER_PRIORITY_LOCK.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 772 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_WORKFLOW_IMPLEMENTATION_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 773 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_WORKFLOW_WAEL_GABER_REQUIREMENTS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 774 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_APPROVAL_HELPER_CLEARED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 775 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_APPS_SCRIPT_FULL_INVENTORY_READONLY.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 776 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_APPS_SCRIPT_INVENTORY_READONLY.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 777 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_DUPLICATE_WRITER_PLACEMENT_CORRECTION.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 778 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_HELPER_CLEARED_NO_FUNCTIONS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 779 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_LIVE_INVOICE_RESOLUTION_READY_PATCH.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 780 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_NEXT_ACTION_33_SPEC_PATCH.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 781 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_PATCH33_CODE_CI_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 782 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_PATCH33_OWNER_APPROVED_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 783 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_PREVIEW_INVOICE_RECONCILIATION_HOLD.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 784 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_PREVIEW33_EXECUTION_BLOCKED_CHAT_CAPABILITY.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 785 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_PREVIEW33_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 786 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_COMPLETE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 787 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_PATCH_CODE_CI_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 788 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_PATCH_OWNER_APPROVED_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 789 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_PATCH_TESTS_ADDED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 790 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_PATCH_WRITER_INTERMEDIATE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 791 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_PREVIEW_DUPLICATE_DECLARATION_BLOCKER.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 792 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_PREVIEW_DUPLICATE_DECLARATION_REPEAT.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 793 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_RUN_GATE_LOG.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 794 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_REGISTRY_WRITE_AUTO_ROLLBACK_ROOT_CAUSE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 795 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_REGISTRY_WRITE_BLOCKED_EXPLICITLY_INACTIVE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 796 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_REGISTRY_WRITE_OWNER_APPROVED_PENDING_EXECUTION.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 797 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_UPLOADED_RECOVERY_CODE_REVIEW.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 798 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_WORK_COMPLETE_RECOVERY_AUTHORIZATION.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 799 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_CONTAINMENT_CI_PASS_ALIAS_CANDIDATE.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 800 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_HEALTH_RECHECK_LIVE_FAIL.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 801 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_HEALTH_RECHECK_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 802 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_REMEDIATION_CODE_CANDIDATE_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 803 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_REMEDIATION_CODE_START.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 804 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_DEPLOYMENT_BOUNDARY.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 805 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_PHASE0_DIRECT_WORK_INVENTORY_FAIL.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 806 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_PHASE0_INVENTORY_BLOCKED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 807 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_PHASE0_LIVE_INVENTORY_BLOCKED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 808 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_WORK_LIMIT_STOP_CHECKPOINT.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 809 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-11_GABER_MATERIAL_CONTROL_OWNER_STATUS_LOCK_AFTER_CHECKPOINT_05.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 810 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-11_GABER_MATERIAL_CONTROL_V1_CANDIDATE_CHECKPOINT_05_UI_APPROVAL_REPORT_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 811 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-11_GABER_MATERIAL_UI_REPORT_EXECUTION_PLAN.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 812 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-11_GABER_WASTE_APPROVAL_REQUEST_STORE_DECISION.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 813 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-11_RP07_CLOSURE_VERIFICATION_HOLD.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 814 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-11_RP07_RUNTIME_PHASE0B_READONLY_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 815 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-11_RP07_WORK_RECALL_POINT_FLAG_DISABLE_PENDING.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 816 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_DEPARTMENT_INVOICE_CONTROL_GABER_LASER_WAEL_PRINT_REQUIREMENTS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 817 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_GABER_SHADOW_PARITY_PRIORITY_AFTER_OPERATOR_TASK.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 818 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_RP07_CORRECTIVE_TEMP_SETTER_PASS_FLAGS_OFF_HELPER_REMOVED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 819 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_RP07_FLAG_DISABLE_BOUNDARY_FAIL_NO_SETTER.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 820 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_RP07_PHASE1_INSTALL_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 821 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_RP07_PHASE2_READONLY_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 822 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_RP07_PHASE2_WORK_LIMIT_INTERRUPTED_RESTART_READONLY.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 823 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_RP07_TEMP_HELPER_OWNER_DELETED_PENDING_VERIFY.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 824 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_RP07_TEMP_SETTER_PRECONDITION_FAIL_RAW_VALUES.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 825 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-13_RP07_FINAL_HEALTH_PASS_CLOSED.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 826 | `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-13_T6B_CLOUD_AUTH_SHADOW_CANARY_PASS.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 827 | `docs/trendos/blackbox/منصة ترند/TRENDOS_D1_PAUSED_SYNC_RECOVERY_PROTOCOL_2026-09-19.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 828 | `docs/trendos/blackbox/منصة ترند/TRENDOS_PRODUCTION_INCIDENT_PROPERTIES_QUOTA_TRIGGER_PAUSE_LOG_2026-09-19.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 829 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_BROWSER_GOOGLE_TRANSPORT_FIX_ENTRY_495_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 830 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_CLOUDFLARE_OFF_STATE_DEPLOY_RESULT_2026-09-30.txt` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 831 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_CLOUDFLARE_OFF_STATE_INSTALL_SUCCESS_ENTRY_491_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 832 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_CLOUDFLARE_READONLY_PREFLIGHT_RESULT_2026-09-30.txt` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 833 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_DIYA_DIRECT_BOOTSTRAP_READY_BLOCKED_ENTRY_494_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 834 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_DIYA_ENROLLMENT_GATE_QUALIFIED_CREDENTIAL_BLOCK_ENTRY_493_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 835 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_FRONTEND_OFF_STATE_AND_NATIVE_CANARY_BLOCKED_ENTRY_492_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 836 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_OFF_STATE_PRODUCTION_INSTALL_RUNBOOK_ENTRY_484_2026-09-29.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 837 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_PHASE_A_BROWSER_BLOCK_ENTRY_488_2026-09-29.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 838 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_PHASE_A_PRODUCTION_DEPLOY_SUCCESS_ENTRY_489_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 839 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_PHASE_A_SOURCE_INSTALL_REVISION_ENTRY_487_2026-09-29.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 840 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_PHASE_B_D1_OFF_EXECUTION_RESULT_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 841 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_PHASE_B_D1_OFF_EXECUTION_RESULT_2026-09-30.txt` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 842 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_PHASE_B_D1_OFF_SUCCESS_ENTRY_490_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 843 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_POSTDEPLOY_READONLY_VERIFY_RESULT_2026-09-30.txt` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 844 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_SOURCE_RECOVERY_FORENSICS_ENTRY_485_2026-09-29.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 845 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ADD_ORDER_UI_CONTRACT_ENTRY_445_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 846 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_APPS_SCRIPT_BRIDGE_CURRENT_MAIN_A61_ENTRY_483_2026-09-29.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 847 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_BROWSER_NETWORK_ERROR_ENTRY_444_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 848 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_CANARY_4322_OUTBOX_RETIRED_ENTRY_452_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 849 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_CLOUDFLARE_TEST_EXECUTION_JOURNAL_2026-09-21.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 850 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_CUSTOMER_D1_SEARCH_ORDER_LATENCY_A51_A52_ENTRY_468_2026-09-29.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 851 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_CUSTOMERS_STALE_MIRROR_ORDER_LATENCY_ENTRY_457_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 852 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A1_PRAGMA_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 853 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A10_TOKEN_ID_MISMATCH_PROVEN_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 854 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A11_SYNTHETIC_WRITE_WORKFLOW_READY_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 855 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A12_TOKEN_GATE_STILL_BLOCKED_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 856 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A13_ACCOUNT_TOKEN_GATE_CORRECTION_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 857 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A14_ACCOUNT_TOKEN_VERIFIED_WORKFLOW_UNREGISTERED_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 858 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A15_SYNTHETIC_WRITE_QUALIFIED_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 859 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A2_MIGRATION_BOOKKEEPING_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 860 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A3_PERSISTENT_DDL_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 861 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A4_PERSISTENT_DDL_7500_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 862 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A5_TOKEN_TYPE_VERIFY_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 863 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A6_TOKEN_DETAILS_READONLY_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 864 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A7_EFFECTIVE_WRITE_AUTH_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 865 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A8_DASHBOARD_TOKEN_LIST_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 866 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A9_DASHBOARD_TOKEN_SCOPE_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 867 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_DELIVERED_STATE_BEFORE_COLLISION_REPAIR_ENTRY_450_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 868 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_DISABLE_AND_4322_READONLY_VERIFIED_A20_A21_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 869 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_EMPLOYEE_FORCE_PASSWORD_RESET_A60_ENTRY_478_2026-09-29.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 870 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_EMPLOYEE_LEGACY_ACTION_CLASSIFICATION_A61_ENTRY_481_2026-09-29.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 871 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_EMPLOYEE_LEGACY_AUTH_BRIDGE_A61_ENTRY_480_2026-09-29.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 872 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_EMPLOYEE_SESSION_NON_DESTRUCTIVE_AUTH_ENTRY_531_2026-10-01.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 873 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_EMPLOYEE_SESSION_PREVENTIVE_AUDIT_ENTRY_533_2026-10-01.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 874 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_EMPLOYEE_SESSION_RACE_GUARD_ENTRY_504_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 875 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ENTRY498_ENTRY499_MANUAL_ARTIFACTS_READY_ENTRY_501_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 876 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ENTRY499_NO_WRANGLER_DIRECT_UPLOAD_READY_ENTRY_502_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 877 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ENTRY499_VERSION_CREATED_AWAIT_PROMOTE_ENTRY_503_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 878 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ENTRY504_FRESH_LOGIN_FAILED_ENTRY_506_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 879 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ENTRY504_PRODUCTION_DEPLOY_CHECKPOINT_ENTRY_505_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 880 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_FRONTEND_EMPLOYEE_API_DISPATCHER_A61_ENTRY_482_2026-09-29.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 881 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_FRONTEND_SESSION_PERSISTENCE_AND_ZERO_GOOGLE_READ_ENTRY_499_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 882 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_GENERAL_CREATE_4323_CANARY_READY_ENTRY_443_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 883 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_GENERAL_CREATE_LIVE_ENTRY_447_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 884 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_HYBRID_READ_OVERLAY_MAIN_LIVE_ENTRY_440_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 885 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_LASER_SERVICE_02CR_ENTRY_453_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 886 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_LEGACY_CREATE_FENCE_COLLISION_4322_ENTRY_449_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 887 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_LEGACY_WRITERS_LIVE_SHEET_4322_REKEY_ENTRY_451_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 888 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_LIVE_LASER_ORDER_4324_DISPLAY_GAP_ENTRY_454_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 889 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_NATIVE_EMPLOYEE_AUTH_FOUNDATION_A61_ENTRY_479_2026-09-29.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 890 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_NEW_CHAT_FREEZE_AFTER_ENTRY499_DOWNLOAD_FAILURE_ENTRY_500_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 891 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_NEW_CHAT_HANDOFF_AFTER_CUSTOMER_A55_2026-09-29.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 892 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_NEW_CHAT_HANDOFF_AFTER_D1_7500_DIAGNOSTICS_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 893 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_NEW_CHAT_HANDOFF_AFTER_EXACT_KEY_REPLAY_2026-09-22.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 894 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_NEW_CHAT_HANDOFF_AFTER_SESSION_ROOT_CAUSE_ENTRY_532_2026-10-01.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 895 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_OPERATIONAL_RUNTIME_LIVE_ENTRY_442_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 896 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ORDER_4322_PRINT_UI_VISIBLE_ENTRY_441_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 897 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ORDER_4323_CANARY_VERIFIED_ENTRY_446_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 898 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ORDER_4324_CUSTOMER_SERVICE_VISIBLE_ENTRY_456_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 899 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ORDER_4324_LASER_VISIBLE_ENTRY_455_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 900 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ORDERS_02CR_DEGRADED_ENRICHMENT_VISIBILITY_ENTRY_496_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 901 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ORDERS_D1_SNAPSHOT_ZERO_GOOGLE_VISIBILITY_ENTRY_498_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 902 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ORDERS_READ_WRITE_AUDIT_ENTRY_448_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 903 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ORDERS_SESSION_D1_SHADOW_HANDOFF_ENTRY_497_2026-09-30.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 904 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_PRODUCTION_ARM_ONE_SUCCESS_A17_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 905 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_PRODUCTION_CREATE_4322_A18_BLOCKED_NO_CREATE_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 906 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_PRODUCTION_CREATE_4322_SUCCESS_A19_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 907 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_PRODUCTION_INSTALL_DISABLED_SUCCESS_A16_2026-09-27.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 908 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_READ_OVERLAY_ENTRY_438_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 909 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_READ_OVERLAY_UI_FALLBACK_ENTRY_439_2026-09-28.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 910 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_REPOSITORY_ROADMAP_INCIDENT_REVIEW_2026-09-24.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 911 | `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ZERO_GOOGLE_CUTOVER_A56_A58_ENTRY_477_2026-09-29.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 912 | `docs/trendos/checkpoints/ACCOUNTING_CF_02_CONTRACT_PLAN_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 913 | `docs/trendos/checkpoints/ACCOUNTING_CF_02_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 914 | `docs/trendos/checkpoints/ACCOUNTING_CF_02A_CONTRACT_IMPLEMENTED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 915 | `docs/trendos/checkpoints/ACCOUNTING_CF_02B_ROUTE_WIRING_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 916 | `docs/trendos/checkpoints/ACCOUNTING_CF_02C_CONTRACT_TESTS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 917 | `docs/trendos/checkpoints/ACCOUNTING_CF_02D_CI_SAFETY_WIRING_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 918 | `docs/trendos/checkpoints/ACCOUNTING_CF_02E_RUNTIME_WORKFLOW_WIRING_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 919 | `docs/trendos/checkpoints/ACCOUNTING_CF_02F_NATIVE_CI_ALIGNMENT_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 920 | `docs/trendos/checkpoints/ACCOUNTING_CF_02G_RUNTIME_DEPLOY_SYNC_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 921 | `docs/trendos/checkpoints/ACCOUNTING_CF_02H_RUNTIME_CI_PROOF_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 922 | `docs/trendos/checkpoints/ACCOUNTING_CF_02I_PERSISTENCE_READINESS_CI_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 923 | `docs/trendos/checkpoints/ACCOUNTING_CF_02J_RUNTIME_READINESS_DIAGNOSTIC_CI_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 924 | `docs/trendos/checkpoints/ACCOUNTING_CF_02K_LIVE_PERSISTENCE_READINESS_PREVIEW_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 925 | `docs/trendos/checkpoints/ACCOUNTING_CF_02L_PERSISTENCE_SCHEMA_PREFLIGHT_CI_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 926 | `docs/trendos/checkpoints/ACCOUNTING_CF_02M_RUNTIME_SCHEMA_PREFLIGHT_ENDPOINT_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 927 | `docs/trendos/checkpoints/ACCOUNTING_CF_02N_LIVE_SCHEMA_PREFLIGHT_FAIL_CLOSED_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 928 | `docs/trendos/checkpoints/ACCOUNTING_CF_02R_LIVE_BINDING_PROBE_IMPLEMENTED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 929 | `docs/trendos/checkpoints/ACCOUNTING_CF_02S_SCHEMA_GAP_BASELINE_RUNTIME_WIRED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 930 | `docs/trendos/checkpoints/ACCOUNTING_CF_02S_SCHEMA_GAP_BASELINE_STARTED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 931 | `docs/trendos/checkpoints/ACCOUNTING_CF_02T_ISOLATED_PREVIEW_SCHEMA_APPLY_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 932 | `docs/trendos/checkpoints/ACCOUNTING_CF_DEV_LOG_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 933 | `docs/trendos/checkpoints/ACCOUNTING_CF_RUNTIME_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 934 | `docs/trendos/checkpoints/ACCOUNTING_EASYSTORE_ASSESSMENT_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 935 | `docs/trendos/checkpoints/ACCOUNTING_EASYSTORE_BASELINE_CORRECTION_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 936 | `docs/trendos/checkpoints/ACCOUNTING_EASYSTORE_BASELINE_IMPLEMENTATION_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 937 | `docs/trendos/checkpoints/ACCOUNTING_EASYSTORE_MIGRATION_MATRIX_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 938 | `docs/trendos/checkpoints/ACCOUNTING_F1_FOUNDATION_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 939 | `docs/trendos/checkpoints/ACCOUNTING_F1_FOUNDATION_START_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 940 | `docs/trendos/checkpoints/ACCOUNTING_F2_D1_ADAPTER_MAPPING_START_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 941 | `docs/trendos/checkpoints/ACCOUNTING_F2_D1_ADAPTER_PREPARED_CI_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 942 | `docs/trendos/checkpoints/ACCOUNTING_F2_FINANCE_CORE_IMPLEMENTATION_A_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 943 | `docs/trendos/checkpoints/ACCOUNTING_F2_FINANCE_CORE_PLAN_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 944 | `docs/trendos/checkpoints/ACCOUNTING_F2_FINANCE_CORE_START_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 945 | `docs/trendos/checkpoints/ACCOUNTING_F2_FINANCE_PLANNING_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 946 | `docs/trendos/checkpoints/ACCOUNTING_F2_PERSISTENCE_APPEND_ONLY_CORRECTION_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 947 | `docs/trendos/checkpoints/ACCOUNTING_F2_PERSISTENCE_PREP_PLAN_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 948 | `docs/trendos/checkpoints/ACCOUNTING_F2_PERSISTENCE_SCHEMA_PREPARED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 949 | `docs/trendos/checkpoints/ACCOUNTING_F2_PERSISTENCE_SCHEMA_TESTS_ADDED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 950 | `docs/trendos/checkpoints/ACCOUNTING_F2_PREVIEW_CALLER_IMPLEMENTED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 951 | `docs/trendos/checkpoints/ACCOUNTING_F2_PREVIEW_CALLER_NATIVE_CI_WIRING_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 952 | `docs/trendos/checkpoints/ACCOUNTING_F2_PREVIEW_PERSISTENCE_GATE_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 953 | `docs/trendos/checkpoints/ACCOUNTING_F2A_PREWIRE_HARDENING_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 954 | `docs/trendos/checkpoints/ACCOUNTING_F2A_SAFE_FINANCE_IMPLEMENTED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 955 | `docs/trendos/checkpoints/ACCOUNTING_F2B_SAFE_FINANCE_TESTS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 956 | `docs/trendos/checkpoints/ACCOUNTING_F2C_PLANNING_API_WIRED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 957 | `docs/trendos/checkpoints/ACCOUNTING_F2D_RUNTIME_VERIFICATION_WIRED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 958 | `docs/trendos/checkpoints/ACCOUNTING_NATIVE_TRENDOS_DIRECTION_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 959 | `docs/trendos/checkpoints/CF01_CLOUD_WRITE_LANE_2026-09-03.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 960 | `docs/trendos/checkpoints/CF02_AUTOMATIC_CLOUDFLARE_PIPELINE_2026-09-03.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 961 | `docs/trendos/checkpoints/CLOUDFLARE_EDGE_GATEWAY_V1_2026-09-03.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 962 | `docs/trendos/checkpoints/GS01_SHEETS_ONLY_STABILIZATION_2026-09-03.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 963 | `docs/trendos/checkpoints/GS02_EMPTY_ROWS_CLEANUP_2026-09-03.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 964 | `docs/trendos/checkpoints/GS03_APPS_SCRIPT_TIMEOUT_HOTFIX_2026-09-03.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 965 | `docs/trendos/checkpoints/GS04_PENDING_MODIFICATIONS_LEDGER_POINTER_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 966 | `docs/trendos/checkpoints/GS04_SAVE_TIMEOUT_HOTFIX_2026-09-03.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 967 | `docs/trendos/checkpoints/GS05_BACKEND_CONSOLIDATION_REVIEW_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 968 | `docs/trendos/checkpoints/GS06_UNIFIED_BACKEND_BUILD_GATE_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 969 | `docs/trendos/checkpoints/MATBAGY_AUTO_FINAL_SELECTION_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 970 | `docs/trendos/checkpoints/MATBAGY_AUTO_PERSIST_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 971 | `docs/trendos/checkpoints/MATBAGY_DRIVE_SINGLE_ROOT_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 972 | `docs/trendos/checkpoints/MATBAGY_FOKHA_ROUTING_SYNC_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 973 | `docs/trendos/checkpoints/PD04_APPS_SCRIPT_FILE_LIST_2026-08-31.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 974 | `docs/trendos/checkpoints/PD04_RUNTIME_EXECUTION_BASELINE_2026-08-31.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 975 | `docs/trendos/checkpoints/PD05_FOUNDATION_INSTALL_USER_CONFIRMED_2026-08-31.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 976 | `docs/trendos/checkpoints/PD05_FOUNDATION_RUNTIME_SELFTEST_PASS_2026-08-31.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 977 | `docs/trendos/checkpoints/PD05_FOUNDATION_SELFTEST_ASSERTION_CORRECTION_2026-08-31.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 978 | `docs/trendos/checkpoints/PD05_RUNTIME_FUNCTION_PICKER_FIX_2026-08-31.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 979 | `docs/trendos/checkpoints/PD05A_FOUNDATION_RUNTIME_PASS_2026-08-31.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 980 | `docs/trendos/checkpoints/PD05B_ORDER_LINE_HEAD_INSTALL_2026-08-31.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 981 | `docs/trendos/checkpoints/PD05C_ATTENDANCE_CLEANING_INSTALLED_2026-08-31.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 982 | `docs/trendos/checkpoints/PERF_CF_02A_CLOUDFLARE_PREVIEW_SAFETY_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 983 | `docs/trendos/checkpoints/PERF_CF_02AA_APPS_SCRIPT_HEARTBEAT_ROUTE_SAVED_PENDING_DEPLOY_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 984 | `docs/trendos/checkpoints/PERF_CF_02AB_APPS_SCRIPT_V149_DEPLOYED_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 985 | `docs/trendos/checkpoints/PERF_CF_02AC_APPS_SCRIPT_HEARTBEAT_ROUTE_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 986 | `docs/trendos/checkpoints/PERF_CF_02AD_DUAL_SIGNAL_PREVIEW_AND_CI_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 987 | `docs/trendos/checkpoints/PERF_CF_02AE_PRODUCTION_PREFLIGHT_OBSOLETE_URL_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 988 | `docs/trendos/checkpoints/PERF_CF_02AF_PRODUCTION_PREFLIGHT_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 989 | `docs/trendos/checkpoints/PERF_CF_02AG_PRODUCTION_DUAL_SIGNAL_CONFIG_CI_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 990 | `docs/trendos/checkpoints/PERF_CF_02AH_PRODUCTION_DUAL_SIGNAL_BACKEND_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 991 | `docs/trendos/checkpoints/PERF_CF_02AI_PRODUCTION_FRONTEND_ORDERS_CUTOVER_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 992 | `docs/trendos/checkpoints/PERF_CF_02AJ_LIVE_FRONTEND_CUTOVER_PROBE_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 993 | `docs/trendos/checkpoints/PERF_CF_02AK_CLOUD_WRITE_RECONCILIATION_ISOLATED_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 994 | `docs/trendos/checkpoints/PERF_CF_02AL_DEDICATED_STAGING_D1_CLOUD_WRITE_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 995 | `docs/trendos/checkpoints/PERF_CF_02AM_REMOTE_STAGING_RECONCILIATION_NO_SHEETS_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 996 | `docs/trendos/checkpoints/PERF_CF_02AN_APPS_SCRIPT_RECONCILIATION_DRYRUN_CONTRACT_CI_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 997 | `docs/trendos/checkpoints/PERF_CF_02AO_CODEGS_V150_DRYRUN_CANDIDATE_INTEGRATED_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 998 | `docs/trendos/checkpoints/PERF_CF_02AP_LIVE_V150_ROUTE_NOT_INSTALLED_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 999 | `docs/trendos/checkpoints/PERF_CF_02AQ_APPS_SCRIPT_V151_ROUTE_STILL_NOT_INSTALLED_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1000 | `docs/trendos/checkpoints/PERF_CF_02AR_APPS_SCRIPT_V152_DRYRUN_ROUTE_INSTALLED_LOCKED_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1001 | `docs/trendos/checkpoints/PERF_CF_02AS_V152_SECRET_GATE_AUTH_LOCK_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1002 | `docs/trendos/checkpoints/PERF_CF_02AT_AUTHENTICATED_DRYRUN_SELFTEST_CI_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1003 | `docs/trendos/checkpoints/PERF_CF_02AU_STAGING_SYNTHETIC_PULL_BRIDGE_LIVE_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1004 | `docs/trendos/checkpoints/PERF_CF_02AV_STAGING_D1_TO_APPS_SCRIPT_DRYRUN_LIVE_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1005 | `docs/trendos/checkpoints/PERF_CF_02AW_CLOUD_WRITE_SHADOW_REHEARSAL_CI_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1006 | `docs/trendos/checkpoints/PERF_CF_02AX_SHADOW_SHEET_REHEARSAL_LIVE_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1007 | `docs/trendos/checkpoints/PERF_CF_02AY_SHADOW_REPLAY_NOOP_RUNNER_CI_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1008 | `docs/trendos/checkpoints/PERF_CF_02AZ_REHEARSAL_REPLAY_NOOP_LIVE_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1009 | `docs/trendos/checkpoints/PERF_CF_02B_FRESHNESS_POLLING_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1010 | `docs/trendos/checkpoints/PERF_CF_02BA_PRODUCTION_CLOUD_WRITE_PREFLIGHT_READONLY_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1011 | `docs/trendos/checkpoints/PERF_CF_02BB_CANONICAL_ORDER_WRITE_CONTRACT_AUDIT_V1_BLOCKED_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1012 | `docs/trendos/checkpoints/PERF_CF_02BC_CLOUD_WRITE_ORDER_CONTRACT_V2_CI_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1013 | `docs/trendos/checkpoints/PERF_CF_02BD_CLOUD_WRITE_ORDER_V2_STAGING_LIVE_READONLY_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1014 | `docs/trendos/checkpoints/PERF_CF_02BE_APPS_SCRIPT_V2_CANONICAL_ADAPTER_DRYRUN_CI_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1015 | `docs/trendos/checkpoints/PERF_CF_02BF_ISOLATED_CANONICAL_STAGING_SPREADSHEET_PROVISIONED_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1016 | `docs/trendos/checkpoints/PERF_CF_02BG_ISOLATED_STAGING_RUNTIME_PREFLIGHT_CI_LIVE_DATA_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1017 | `docs/trendos/checkpoints/PERF_CF_02BH_STAGING_SYNTHETIC_AUTH_BRIDGE_QUALIFIED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1018 | `docs/trendos/checkpoints/PERF_CF_02BI_CANONICAL_STAGING_SIDE_EFFECT_SHAPE_QUALIFIED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1019 | `docs/trendos/checkpoints/PERF_CF_02BJ_STAGING_CANONICAL_TARGET_IDENTITY_QUALIFIED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1020 | `docs/trendos/checkpoints/PERF_CF_02BL_STAGING_FIRST_CANONICAL_WRITE_RECOVERY_READY_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1021 | `docs/trendos/checkpoints/PERF_CF_02BM_STAGING_CANONICAL_FIRST_WRITE_POSTVERIFY_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1022 | `docs/trendos/checkpoints/PERF_CF_02BN_STAGING_CLOUDFLARE_APPS_SCRIPT_BRIDGE_PREDEPLOY_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1023 | `docs/trendos/checkpoints/PERF_CF_02BP_V2_STAGING_BRIDGE_ROUTE_WIRING_BLOCKED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1024 | `docs/trendos/checkpoints/PERF_CF_02BQ_V2_STAGING_BRIDGE_LIVE_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1025 | `docs/trendos/checkpoints/PERF_CF_02BR_V2_STAGING_BRIDGE_POSTWRITE_VERIFICATION_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1026 | `docs/trendos/checkpoints/PERF_CF_02BS_V2_PRODUCTION_SHADOW_GATE_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1027 | `docs/trendos/checkpoints/PERF_CF_02BT_V2_PRODUCTION_SHADOW_PREVIEW_LIVE_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1028 | `docs/trendos/checkpoints/PERF_CF_02BU_V2_PRODUCTION_SHADOW_CANDIDATE_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1029 | `docs/trendos/checkpoints/PERF_CF_02BV_V2_PRODUCTION_SHADOW_INTEGRATION_CANDIDATE_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1030 | `docs/trendos/checkpoints/PERF_CF_02BW_PRODUCTION_DEPLOY_TRIGGER_AUDIT_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1031 | `docs/trendos/checkpoints/PERF_CF_02BX_PRODUCTION_SHADOW_WRAPPER_DEFAULT_OFF_NO_DEPLOY_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1032 | `docs/trendos/checkpoints/PERF_CF_02BY_DUAL_SIGNAL_FRESHNESS_SHADOW_REQUAL_CONTROLLED_DEPLOY_PREP_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1033 | `docs/trendos/checkpoints/PERF_CF_02BZ_PRODUCTION_SHADOW_WRAPPER_DEPLOYED_OFF_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1034 | `docs/trendos/checkpoints/PERF_CF_02C_EDGE_AUTH_FRONTEND_LOADING_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1035 | `docs/trendos/checkpoints/PERF_CF_02CA_PRODUCTION_SHADOW_READONLY_ENABLED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1036 | `docs/trendos/checkpoints/PERF_CF_02CB_PRODUCTION_SHADOW_STABILITY_PASS_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1037 | `docs/trendos/checkpoints/PERF_CF_02CC_PRODUCTION_CLOUD_WRITE_SCHEMA_READONLY_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1038 | `docs/trendos/checkpoints/PERF_CF_02CD_PRODUCTION_SCHEMA_MIGRATION_GATE_PREPARED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1039 | `docs/trendos/checkpoints/PERF_CF_02CE_PRODUCTION_SCHEMA_0003_APPLIED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1040 | `docs/trendos/checkpoints/PERF_CF_02D_LATEST_RUNTIME_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1041 | `docs/trendos/checkpoints/PERF_CF_02D_SYNC_FRESHNESS_BLOCKER_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1042 | `docs/trendos/checkpoints/PERF_CF_02E_D1_FRESHNESS_RECHECK_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1043 | `docs/trendos/checkpoints/PERF_CF_02E_D1_QUOTA_DELTA_V2_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1044 | `docs/trendos/checkpoints/PERF_CF_02E_ORDERS_EDGE_PRODUCTION_GUARD_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1045 | `docs/trendos/checkpoints/PERF_CF_02F_LOW_USAGE_AUTOTICK_RUNTIME_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1046 | `docs/trendos/checkpoints/PERF_CF_02F_ZERO_IDLE_D1_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1047 | `docs/trendos/checkpoints/PERF_CF_02G_RESUME_FROM_02F_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1048 | `docs/trendos/checkpoints/PERF_CF_02H_FRESHNESS_RECHECK_AFTER_LOW_USAGE_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1049 | `docs/trendos/checkpoints/PERF_CF_02I_IDLE_FRESHNESS_MODEL_DIAGNOSIS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1050 | `docs/trendos/checkpoints/PERF_CF_02J_LOW_USAGE_HEARTBEAT_ROUTING_INSPECTION_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1051 | `docs/trendos/checkpoints/PERF_CF_02K_DUAL_SIGNAL_FRESHNESS_GITHUB_IMPLEMENTATION_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1052 | `docs/trendos/checkpoints/PERF_CF_02L_DUAL_SIGNAL_FRESHNESS_CI_WIRING_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1053 | `docs/trendos/checkpoints/PERF_CF_02M_DUAL_SIGNAL_FRESHNESS_CI_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1054 | `docs/trendos/checkpoints/PERF_CF_02N_APPS_SCRIPT_HEARTBEAT_ROUTE_FEASIBILITY_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1055 | `docs/trendos/checkpoints/PERF_CF_02O_HEARTBEAT_HELPER_AND_EDGE_VERIFIER_IMPLEMENTATION_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1056 | `docs/trendos/checkpoints/PERF_CF_02P_HEARTBEAT_HELPER_VERIFIER_CI_WIRING_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1057 | `docs/trendos/checkpoints/PERF_CF_02Q_HEARTBEAT_HELPER_VERIFIER_CI_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1058 | `docs/trendos/checkpoints/PERF_CF_02R_AUTO_PREVIEW_SAFETY_PASS_LEGACY_FRESHNESS_BLOCK_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1059 | `docs/trendos/checkpoints/PERF_CF_02S_DUAL_SIGNAL_PARITY_HARDENING_BOUNDARY_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1060 | `docs/trendos/checkpoints/PERF_CF_02T_DUAL_SIGNAL_ORDERS_LINES_HARDENING_CI_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1061 | `docs/trendos/checkpoints/PERF_CF_02U_DUAL_SIGNAL_PREVIEW_QUALIFIER_SAFE_SKIP_PASS_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1062 | `docs/trendos/checkpoints/PERF_CF_02V_LIVE_HEARTBEAT_ROUTE_PROBE_NOT_INSTALLED_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1063 | `docs/trendos/checkpoints/PERF_CF_02W_NO_AUTHORIZED_APPS_SCRIPT_SOURCE_DEPLOY_PATH_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1064 | `docs/trendos/checkpoints/PERF_CF_02X_APPS_SCRIPT_HEARTBEAT_HELPER_SAVED_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1065 | `docs/trendos/checkpoints/PERF_CF_02Y_LIVE_CODEGS_ROUTE_LOCATION_CONFIRMED_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1066 | `docs/trendos/checkpoints/PERF_CF_02Z_APPS_SCRIPT_DOGET_HEARTBEAT_ROUTE_PATCH_PREPARED_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1067 | `docs/trendos/checkpoints/RP03_CORE_P0_PREVIEW_2026-09-01.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1068 | `docs/trendos/checkpoints/RP03E_PRESS_CONSUMER_CONTRACT_2026-09-01.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1069 | `docs/trendos/checkpoints/RP06_3536_READONLY_RECONCILIATION_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1070 | `docs/trendos/checkpoints/RP06_PRESS_DUPLICATE_HISTORY_FILTER_FIX_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1071 | `docs/trendos/checkpoints/WHATSAPP_META_COEXISTENCE_REASSESSMENT_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1072 | `docs/trendos/checkpoints/WHATSAPP_META_ONBOARDING_FAILURE_CONFIRMED_2026-09-05.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1073 | `docs/trendos/implementation/PHASE2_ORDER_LINE_INTEGRITY_CHECKPOINT.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1074 | `docs/trendos/implementation/PHASE3_ATTENDANCE_CLEANING_INTEGRITY_CHECKPOINT.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1075 | `docs/trendos/implementation/PHASE4_PRESS_INTEGRITY_CHECKPOINT.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1076 | `docs/trendos/implementation/PHASE5_INVOICE_READY_SWEEP_INTEGRITY_CHECKPOINT.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1077 | `docs/trendos/implementation/PHASE6_WHATSAPP_WEBHOOK_INTEGRITY_CHECKPOINT.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1078 | `docs/trendos/inventory/APPS_SCRIPT_TRIGGER_INVENTORY.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1079 | `docs/trendos/inventory/ATTENDANCE_CLOCKIN_INVENTORY.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1080 | `docs/trendos/inventory/AUTH_PATH_INVENTORY.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1081 | `docs/trendos/inventory/CLEANING_INVENTORY.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1082 | `docs/trendos/inventory/D1_ATOMIC_SYNC_INVENTORY.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1083 | `docs/trendos/inventory/D1_DASHBOARD_PATH_INVENTORY.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1084 | `docs/trendos/inventory/D1_READ_PATH_INVENTORY.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1085 | `docs/trendos/inventory/D1_WORKER_ATOMIC_ROUTING_INVENTORY.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1086 | `docs/trendos/inventory/HANDOVER_OPS_INVENTORY.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1087 | `docs/trendos/inventory/INVOICE_READY_SWEEP_INVENTORY.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1088 | `docs/trendos/inventory/LIVE_DATA_BASELINE_2026-08-30.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1089 | `docs/trendos/inventory/LIVE_SPREADSHEET_AUDIT.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1090 | `docs/trendos/inventory/ORDERS_LINES_INVENTORY.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1091 | `docs/trendos/inventory/PRESS_INVENTORY.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1092 | `docs/trendos/inventory/PRODUCTION_SOURCE_RECONCILIATION.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1093 | `docs/trendos/inventory/WHATSAPP_CUSTOMER_MANAGER_INVENTORY.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1094 | `docs/trendos/master-book/MASTER_BOOK_PRE_COMPACTION_SNAPSHOT_POINTER_2026-09-27.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1095 | `docs/trendos/master-book/TRENDOS_CLOSED_COMPONENTS_INDEX.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1096 | `docs/trendos/master-book/TRENDOS_COVERAGE_DELTA_05ca9c9_TO_67aae5c.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1097 | `docs/trendos/master-book/TRENDOS_COVERAGE_INVENTORY_05ca9c9.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1098 | `docs/trendos/master-book/TRENDOS_HISTORICAL_ARCHIVE_BATCHES_REGISTRY.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1099 | `docs/trendos/master-book/TRENDOS_MASTER_CHANGELOG_ARCHIVE_PRE_COMPACTION.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1100 | `docs/trendos/master-book/TRENDOS_T12_JOURNAL_TITLE_INDEX_SNAPSHOT_2026-09-26.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1101 | `docs/trendos/MATBAGY_DRIVE_PROJECT_STRUCTURE.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1102 | `docs/trendos/MATBAGY_KNOWLEDGE_EXTRACTION_ARCHITECTURE.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1103 | `docs/trendos/MATBAGY_MULTI_AI_ROOM_ARCHITECTURE.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1104 | `docs/trendos/PERF_CF_02D_APPS_SCRIPT_SYNC_ACTIVATION_RUNBOOK.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1105 | `docs/trendos/staging/A51_CUSTOMER_SEARCH_DEPLOY.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1106 | `docs/trendos/staging/A53_CUSTOMER_NATIVE_INSTALL.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1107 | `docs/trendos/staging/A53_CUSTOMER_NATIVE_RETRY.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1108 | `docs/trendos/staging/A54_NATIVE_CUSTOMER_SEARCH_DEPLOY.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1109 | `docs/trendos/staging/A55_CUSTOMER_PROJECTION_DEPLOY.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1110 | `docs/trendos/staging/A56_CUSTOMER_GENERAL_CUTOVER.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1111 | `docs/trendos/staging/A57_CLOUDFLARE_FRONTEND_CUTOVER.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1112 | `docs/trendos/staging/A57B_CLOUDFLARE_WORKER_FRONTEND.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1113 | `docs/trendos/staging/A58_RUNTIME_ACTION_AUDIT.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1114 | `docs/trendos/staging/A59_NATIVE_AUTH_PREFLIGHT.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1115 | `docs/trendos/staging/APPLY_ACCOUNTING_PREVIEW_OPERATIONS_SCHEMA.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1116 | `docs/trendos/staging/APPLY_APPS_SCRIPT_V150_DRYRUN.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1117 | `docs/trendos/staging/APPS_SCRIPT_02CL_PRODUCTION_RECONCILE_DEPLOY_MANIFEST.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1118 | `docs/trendos/staging/APPS_SCRIPT_V150_DRYRUN_DEPLOY_MANIFEST.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1119 | `docs/trendos/staging/PROBE_APPS_SCRIPT_V150_DRYRUN.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1120 | `docs/trendos/staging/PROVISION_D1_STAGING.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1121 | `docs/trendos/staging/RUN_T12_142_D1COMPAT_LOCAL_20260926.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1122 | `docs/trendos/staging/RUN_T12_TEST_MIRROR_142_20260926.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1123 | `docs/trendos/staging/RUN_T12_TEST_MIRROR_142_D1COMPAT_RETRY_ONCE_20260926.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1124 | `docs/trendos/staging/RUN_T12_TEST_MIRROR_142_READONLY_GUARD_PROBE_20260926.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1125 | `docs/trendos/staging/RUN_T12_TEST_MIRROR_142_RECONCILE_READONLY_20260926.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1126 | `docs/trendos/staging/RUN_T12_TEST_MIRROR_NEGATIVE_20260926.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1127 | `docs/trendos/staging/RUN_T12_TEST_MIRROR_POSITIVE_20260926.trigger` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1128 | `docs/trendos/TRENDOS_ACCOUNTING_FULL_REVIEW_2026-09-04.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1129 | `docs/trendos/TRENDOS_ARCHITECTURE.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1130 | `docs/trendos/TRENDOS_BACKLOG.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1131 | `docs/trendos/TRENDOS_CORE_P0_REMEDIATION_PLAN.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1132 | `docs/trendos/TRENDOS_DECISIONS.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1133 | `docs/trendos/TRENDOS_EXECUTION_LEDGER_APPEND_2026-09-04_PERF_CF_02A_02E.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1134 | `docs/trendos/TRENDOS_EXECUTION_LEDGER.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1135 | `docs/trendos/TRENDOS_HANDOFF.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1136 | `docs/trendos/TRENDOS_INTEGRITY_V1_CHECKPOINT.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1137 | `docs/trendos/TRENDOS_INTEGRITY_V1_DEPLOY_MANIFEST.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1138 | `docs/trendos/TRENDOS_INTEGRITY_V1_REGRESSION_COVERAGE.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1139 | `docs/trendos/TRENDOS_PENDING_MODIFICATIONS.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1140 | `docs/trendos/TRENDOS_PROJECT_MEMORY.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1141 | `docs/trendos/TRENDOS_REPOSITORY_CATALOG.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1142 | `docs/trendos/TRENDOS_ROADMAP_2027-03-01.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1143 | `docs/trendos/TRENDOS_TEST_MATRIX.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1144 | `docs/trendos/TRENDOS_WORKLOG.md` | توثيق، دليل، مرجع، أرشيف | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1145 | `employee-andon-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1146 | `employee-api-dispatcher-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1147 | `employee-cleaning-prep-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1148 | `employee-manager-strips-drag-v2.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1149 | `employee-manager-strips-v2.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1150 | `employee-ops-coach-drag-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1151 | `employee-ops-coach-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1152 | `employee-prayer-prep-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1153 | `FOKHA_BRAIN/PROMPTS/برومبت_استخراج_المعرفة_والداتا.md` | عقل فوخا، ذاكرة، مرجع | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1154 | `FOKHA_BRAIN/STANDARD/FOKHA_EXTRACTION_STANDARD.md` | عقل فوخا، ذاكرة، مرجع | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1155 | `FOKHA_BRAIN/اقرأني_أولا.md` | عقل فوخا، ذاكرة، مرجع | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1156 | `gaber-daily-material-flow-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1157 | `gaber-easystore-ledger-adapter-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1158 | `gaber-ledger-daily-report-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1159 | `gaber-material-control-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1160 | `gaber-material-movement-ledger-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1161 | `gaber-material-persistence-backend-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1162 | `gaber-material-persistence-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1163 | `gaber-material-ui-backend-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1164 | `gaber-material-ui-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1165 | `gaber-material-waste-decision-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1166 | `go-live-autopilot-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1167 | `go-live-autopilot-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1168 | `hr-backend-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1169 | `hr-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1170 | `index.html` | واجهة، شاشة، تصميم | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1171 | `manager-center-v1932.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1172 | `matbagy_theme_v1860.css` | واجهة، شاشة، تصميم | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1173 | `matbagy_theme_v1860.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1174 | `operations-hub-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1175 | `OPERATOR_TASK_WORKFLOW_V2_CANDIDATE.md` | توثيق، مرجع، ملاحظات | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1176 | `operator-task-edge-proxy-v2.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1177 | `operator-task-workflow-v2.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1178 | `operator-task-workflow-v2.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1179 | `press-control-backend-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1180 | `press-control-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1181 | `privacy.html` | واجهة، شاشة، تصميم | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1182 | `README_V1931.md` | توثيق، مرجع، ملاحظات | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1183 | `README.md` | توثيق، مرجع، ملاحظات | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1184 | `reset-cache.html` | واجهة، شاشة، تصميم | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1185 | `scripts/a61_diya_session_enroll_canary.sh` | أداة، صيانة، سكربت، بناء | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1186 | `scripts/apply_apps_script_cloud_write_dryrun_v150.mjs` | أداة، صيانة، سكربت، بناء | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1187 | `styles.css` | واجهة، شاشة، تصميم | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1188 | `tests/apps_script_cloud_write_auth_selftest_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1189 | `tests/apps_script_cloud_write_order_v2_canonical_adapter_dryrun_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1190 | `tests/apps_script_cloud_write_order_v2_staging_auth_bridge_qualification_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1191 | `tests/apps_script_cloud_write_order_v2_staging_bridge_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1192 | `tests/apps_script_cloud_write_order_v2_staging_canonical_target_identity_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1193 | `tests/apps_script_cloud_write_order_v2_staging_first_write_harness_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1194 | `tests/apps_script_cloud_write_order_v2_staging_first_write_recovery_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1195 | `tests/apps_script_cloud_write_order_v2_staging_runtime_preflight_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1196 | `tests/apps_script_cloud_write_order_v2_staging_side_effect_qualification_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1197 | `tests/apps_script_cloud_write_production_reconcile_qualification_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1198 | `tests/apps_script_cloud_write_reconcile_dryrun_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1199 | `tests/apps_script_cloud_write_reconcile_rehearsal_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1200 | `tests/apps_script_cloud_write_reconcile_router_v150.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1201 | `tests/apps_script_cloud_write_rehearsal_live_runner_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1202 | `tests/apps_script_cloud_write_staging_pull_dryrun_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1203 | `tests/apps_script_d1_operational_enrichment_live_sync_02cr.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1204 | `tests/apps_script_d1_screen_view_mirror_refresh_02cq.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1205 | `tests/apps_script_employee_session_mismatch_non_destructive_entry531.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1206 | `tests/cloud_write_order_contract_v2_staging.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1207 | `tests/cloud_write_order_contract_v2.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1208 | `tests/cloud_write_order_v2_production_shadow.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1209 | `tests/cloud_write_order_v2_staging_bridge.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1210 | `tests/cloudflare_a51_production_shadow_customer_route.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1211 | `tests/cloudflare_accounting_contract_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1212 | `tests/cloudflare_accounting_f1_foundation_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1213 | `tests/cloudflare_accounting_f2_finance_api_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1214 | `tests/cloudflare_accounting_f2_finance_core_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1215 | `tests/cloudflare_accounting_f2_finance_safe_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1216 | `tests/cloudflare_accounting_f2_operations_schema_prep_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1217 | `tests/cloudflare_accounting_f2_schema_prep_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1218 | `tests/cloudflare_accounting_native_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1219 | `tests/cloudflare_accounting_persistence_readiness_runtime_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1220 | `tests/cloudflare_accounting_persistence_readiness_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1221 | `tests/cloudflare_accounting_persistence_schema_preflight_runtime_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1222 | `tests/cloudflare_accounting_persistence_schema_preflight_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1223 | `tests/cloudflare_cloud_write_reconcile_exact_target_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1224 | `tests/cloudflare_cloud_write_reconcile_sqlite_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1225 | `tests/cloudflare_cloud_write_sqlite_integration_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1226 | `tests/cloudflare_cloud_write_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1227 | `tests/cloudflare_control_plane_diagnostics.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1228 | `tests/cloudflare_edge_customer_search_a51.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1229 | `tests/cloudflare_edge_freshness_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1230 | `tests/cloudflare_edge_gateway_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1231 | `tests/cloudflare_edge_orders_02cr_canary.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1232 | `tests/cloudflare_edge_orders_02cr_idle_freshness_02cu.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1233 | `tests/cloudflare_edge_orders_active_summary_02cw.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1234 | `tests/cloudflare_edge_orders_canary_wrapper_02co.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1235 | `tests/cloudflare_edge_orders_dashboard_02cn.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1236 | `tests/cloudflare_edge_orders_duplicate_headers_02cr.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1237 | `tests/cloudflare_edge_orders_freshness_gate_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1238 | `tests/cloudflare_edge_orders_idle_freshness_integration_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1239 | `tests/cloudflare_edge_orders_idle_heartbeat_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1240 | `tests/cloudflare_edge_orders_idle_verifier_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1241 | `tests/cloudflare_edge_orders_line_identity_02cx.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1242 | `tests/cloudflare_edge_orders_operational_enrichment_02cr.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1243 | `tests/cloudflare_edge_orders_operational_ordering_02cs.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1244 | `tests/cloudflare_edge_orders_read_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1245 | `tests/cloudflare_freshness_sample.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1246 | `tests/cloudflare_index_v2_02cr_route.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1247 | `tests/cloudflare_legacy_session_race_guard_entry504.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1248 | `tests/cloudflare_mirror_safety_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1249 | `tests/cloudflare_normalized_import_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1250 | `tests/cloudflare_orders_session_shadow_handoff_entry497.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1251 | `tests/cloudflare_preview_safety_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1252 | `tests/cloudflare_production_reconcile_qualification_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1253 | `tests/cloudflare_production_reconcile_qualification_wiring_default_off_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1254 | `tests/cloudflare_production_shadow_integration_candidate_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1255 | `tests/cloudflare_production_shadow_observer_candidate_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1256 | `tests/cloudflare_production_shadow_preview_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1257 | `tests/cloudflare_staging_synthetic_sample_bridge_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1258 | `tests/core_p0_11_readonly_gate_contract.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1259 | `tests/customer_manager_send_integrity_v1.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1260 | `tests/d1_fast_auth_v25_safe.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1261 | `tests/d1_normalized_live_sync_delta_v2.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1262 | `tests/d1_orders_live_sync_atomic_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1263 | `tests/d1_orders_live_sync_delta_v2.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1264 | `tests/d1_orders_low_usage_control_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1265 | `tests/d1_orders_low_usage_heartbeat_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1266 | `tests/d1_zero_idle_control_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1267 | `tests/employee_auth_native_a61.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1268 | `tests/employee_legacy_action_classification_a61.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1269 | `tests/employee_legacy_auth_bridge_a61.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1270 | `tests/frontend_edge_orders_cutover_02ct.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1271 | `tests/frontend_employee_api_dispatcher_a61.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1272 | `tests/frontend_employee_session_isolation_entry533.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1273 | `tests/frontend_flyprint_lane_stability_02cv.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1274 | `tests/frontend_legacy_module_dispatch_a61.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1275 | `tests/frontend_no_direct_google_transport_a61.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1276 | `tests/frontend_order_status_ux_02cv.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1277 | `tests/frontend_order_status_write_consistency_02cv.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1278 | `tests/frontend_orders_initial_edge_ready_entry577.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1279 | `tests/frontend_session_and_zero_google_read_entry499.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1280 | `tests/frontend_t12_customer_cloud_only_a56.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1281 | `tests/frontend_t12_duplicate_order_guard_entry590.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1282 | `tests/gaber_daily_material_flow_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1283 | `tests/gaber_easystore_ledger_adapter_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1284 | `tests/gaber_ledger_daily_report_balance_gate_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1285 | `tests/gaber_material_control_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1286 | `tests/gaber_material_movement_ledger_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1287 | `tests/gaber_material_persistence_backend_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1288 | `tests/gaber_material_persistence_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1289 | `tests/gaber_material_ui_backend_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1290 | `tests/gaber_material_ui_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1291 | `tests/gaber_material_zero_offcut_regression_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1292 | `tests/legacy_browser_transport_a61.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1293 | `tests/operator_task_edge_v2.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1294 | `tests/operator_task_gaber_material_gate_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1295 | `tests/operator_task_gaber_material_ui_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1296 | `tests/operator_task_workflow_v2_contract.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1297 | `tests/qualify_02cr_idle_preview_02cu.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1298 | `tests/rp07_legacy_attendance_cleaning_containment_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1299 | `tests/rp07_press_frontend_exact_line_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1300 | `tests/rp07_v1932_integrity_bridge_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1301 | `tests/startup_request_storm_frontend_guard.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1302 | `tests/t12_business_create_candidate.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1303 | `tests/t12_client_key_continuity_guard.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1304 | `tests/t12_cloud_client_key_admission.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1305 | `tests/t12_cloud_native_synthetic_create.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1306 | `tests/t12_cloud_native_synthetic_test_worker.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1307 | `tests/t12_customer_legacy_projection_a55.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1308 | `tests/t12_customer_master_a53.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1309 | `tests/t12_customer_master_production_shadow_a53.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1310 | `tests/t12_customer_native_search_a54.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1311 | `tests/t12_d1_128_packed_cas_batch_isolated_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1312 | `tests/t12_d1_128_recovery_capacity_envelope_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1313 | `tests/t12_d1_142_all_row_preimage_guard_isolated_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1314 | `tests/t12_d1_142_chunked_preimage_large_isolated_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1315 | `tests/t12_d1_142_packed_cas_batch_isolated_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1316 | `tests/t12_d1_142_wide_payload_budget_isolated_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1317 | `tests/t12_d1_baseline_shape_diagnostic_readonly.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1318 | `tests/t12_d1_direct_cas_bounded_catchup.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1319 | `tests/t12_d1_guarded_recovery_batch_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1320 | `tests/t12_d1_guarded_recovery_preview_handler_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1321 | `tests/t12_d1_mirror_baseline_lineage_readonly.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1322 | `tests/t12_d1_mirror_baseline_sparse_fullhash.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1323 | `tests/t12_d1_mirror_catalog_readonly.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1324 | `tests/t12_d1_one_shot_atomic_full_rebase_20260926.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1325 | `tests/t12_d1_r4_local_preview_isolation.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1326 | `tests/t12_d1_r4_production_recovery_route.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1327 | `tests/t12_d1_rows_parity_readonly.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1328 | `tests/t12_d1_source_baseline_drift_readonly.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1329 | `tests/t12_d1_sync_metadata_readonly.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1330 | `tests/t12_d1_targeted_recovery_plan_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1331 | `tests/t12_d1_targeted_recovery_preflight_readonly.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1332 | `tests/t12_dashboard_singlefile_test_worker.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1333 | `tests/t12_existing_test_mirror_142_readonly_guard_probe_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1334 | `tests/t12_existing_test_mirror_142_remote_dev_worker_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1335 | `tests/t12_existing_test_mirror_negative_remote_dev_worker_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1336 | `tests/t12_existing_test_mirror_positive_remote_dev_worker_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1337 | `tests/t12_existing_test_mirror_tiny_cas_contract_isolated_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1338 | `tests/t12_general_create.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1339 | `tests/t12_google_create_writer_inventory.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1340 | `tests/t12_google_order_lifecycle_writer_inventory.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1341 | `tests/t12_legacy_cloud_write_boundary.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1342 | `tests/t12_legacy_create_fence.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1343 | `tests/t12_order_create_cutover_state.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1344 | `tests/t12_order_create_input_guard.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1345 | `tests/t12_order_create_preflight.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1346 | `tests/t12_order_create_repo_parity.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1347 | `tests/t12_order_create_shadow_handler.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1348 | `tests/t12_order_create_shadow_intent.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1349 | `tests/t12_order_create_shadow_schema.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1350 | `tests/t12_order_create_shadow_store.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1351 | `tests/t12_order_id_authority_candidate.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1352 | `tests/t12_order_id_seed_evidence.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1353 | `tests/t12_production_create_canary.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1354 | `tests/t12_production_d1_aggregate_evidence_readonly.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1355 | `tests/t12_r5_orders_periodic_candidate.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1356 | `tests/t12_read_overlay_handler.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1357 | `tests/t12_read_overlay.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1358 | `tests/t12_scope_guard.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1359 | `tests/t12_script_properties_quota_audit_readonly.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1360 | `tests/t12_script_properties_replay_backup_sheet_verify_readonly.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1361 | `tests/t12_script_properties_replay_cleanup_preview.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1362 | `tests/t12_script_properties_replay_fixed150_delete_once.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1363 | `tests/t12_script_properties_replay_private_backup.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1364 | `tests/t12_supplemental_google_writer_inventory.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1365 | `tests/t12_synthetic_resource_config_guard.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1366 | `tests/trend_master_resilience_v1931.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1367 | `tests/trendos_andon_integrity_v1.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1368 | `tests/trendos_attendance_cleaning_integrity_v1.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1369 | `tests/trendos_core_p0_registry_writer_v1.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1370 | `tests/trendos_core_p0_remediation_v1.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1371 | `tests/trendos_handover_ops_integrity_v1.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1372 | `tests/trendos_integrity_composition_v1.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1373 | `tests/trendos_integrity_dashboard_v1.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1374 | `tests/trendos_integrity_router_v1.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1375 | `tests/trendos_integrity_runtime_tools_v1.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1376 | `tests/trendos_integrity_v1.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1377 | `tests/trendos_invoice_integrity_v1.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1378 | `tests/trendos_order_line_integrity_v1.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1379 | `tests/trendos_polling_coalescing_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1380 | `tests/trendos_predeploy_package_v1.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1381 | `tests/trendos_press_integrity_v1.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1382 | `tests/trendos_resume_no_autorefresh_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1383 | `tests/trendos_return_traffic_quiet_v1.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1384 | `tests/trendos_v1921.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1385 | `tests/trendos_v1932_static.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1386 | `tests/trendos_whatsapp_integrity_v1.test.js` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1387 | `tests/work_queue_v1_contract.test.mjs` | اختبار، تحقق، تغطية، regression | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1388 | `tools/patch_02cv_order_status_ux.py` | أداة، صيانة، سكربت، بناء | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1389 | `tools/patch_02cw_global_counters.py` | أداة، صيانة، سكربت، بناء | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1390 | `tools/TRENDOS_ENTRY499_DIRECT_UPLOAD_README.txt` | أداة، صيانة، سكربت، بناء | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1391 | `tools/TRENDOS_ENTRY546_DIRECT_UPLOAD_README.txt` | أداة، صيانة، سكربت، بناء | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1392 | `tools/trendos-entry499-direct-upload.cmd` | أداة، صيانة، سكربت، بناء | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1393 | `tools/trendos-entry499-direct-upload.mjs` | أداة، صيانة، سكربت، بناء | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1394 | `tools/trendos-entry499-direct-upload.ps1` | أداة، صيانة، سكربت، بناء | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1395 | `tools/trendos-entry546-direct-upload.cmd` | أداة، صيانة، سكربت، بناء | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1396 | `tools/trendos-entry546-direct-upload.mjs` | أداة، صيانة، سكربت، بناء | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1397 | `tools/trendos-entry546-direct-upload.ps1` | أداة، صيانة، سكربت، بناء | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1398 | `tools/trendos-entry579-direct-version-upload.mjs` | أداة، صيانة، سكربت، بناء | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1399 | `tools/trendos-entry594-direct-version-upload.mjs` | أداة، صيانة، سكربت، بناء | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1400 | `trend-master-panels-v1931.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1401 | `trend-master-resilience-v1931.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1402 | `TRENDOS_ACCOUNTING_BLACKBOX_2026-09-04.md` | توثيق، مرجع، ملاحظات | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1403 | `TRENDOS_ACCOUNTING_EXECUTION_LEDGER_2026-09-05.md` | توثيق، مرجع، ملاحظات | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1404 | `TRENDOS_GO_LIVE_2026-09-01_MASTER.md` | توثيق، مرجع، ملاحظات | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1405 | `TrendOS_MASTER_BOOK.md` | توثيق، مرجع، ملاحظات | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1406 | `trendos-andon-integrity-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1407 | `trendos-attendance-cleaning-integrity-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1408 | `trendos-core-p0-registry-writer-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1409 | `trendos-core-p0-remediation-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1410 | `trendos-edge-orders-read-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1411 | `trendos-edge-read-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1412 | `trendos-handover-ops-integrity-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1413 | `trendos-integrity-dashboard-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1414 | `trendos-integrity-router-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1415 | `trendos-integrity-runtime-tools-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1416 | `trendos-integrity-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1417 | `trendos-integrity-v1.package.json` | إعدادات، تكوين، config | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1418 | `trendos-invoice-integrity-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1419 | `trendos-order-line-integrity-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1420 | `trendos-poll-coordinator-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1421 | `trendos-press-integrity-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1422 | `trendos-resume-no-autorefresh-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1423 | `trendos-return-traffic-quiet-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1424 | `trendos-rp07-legacy-containment-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1425 | `trendos-whatsapp-integrity-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1426 | `V1932_RELEASE.md` | توثيق، مرجع، ملاحظات | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1427 | `v1932-router.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1428 | `v1940-deploy-health.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1429 | `WHATS_AGENT_BOOK.md` | توثيق، مرجع، ملاحظات | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1430 | `WORK_QUEUE_V1_CANDIDATE.md` | توثيق، مرجع، ملاحظات | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1431 | `work-queue-backend-v1.gs` | Apps Script، دالة، خلفية، كود | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1432 | `work-queue-v1.js` | JavaScript، واجهة، كود، تشغيل | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1433 | `اقرأني_أولًا.md` | توثيق، مرجع، ملاحظات | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1434 | `الصندوق الاسود.md` | أرشيف، صندوق أسود، دليل، تحقيق، تاريخ | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |
| 1435 | `عقل_فوخا.md` | عقل فوخا، ذاكرة، مرجع | غير مثبتة من الجرد وحده؛ راجع الكتاب الحي/Runtime |

## قاعدة الصيانة

عند إضافة/حذف/إعادة تسمية ملف في المستودع، يجب تحديث هذا الكتالوج ضمن نفس المهمة أو تسجيل فجوة صريحة في الكتاب الرئيسي. لا يجوز اعتبار دليل TrendOS «كاملًا» إذا أصبح هذا الفهرس أقدم من شجرة المستودع.
