# TrendOS — Zero Google — تنفيذ مراجعة المراحل الأربع (بدون إنتاج)

**قاعدة المصدر:** `TrendOS_MASTER_BOOK.md` → كتاب TrendOS الموحد → الكتب المستقلة Printshop/Ubuntu/EasyStore → مصدر GitHub الحالي → **دليل Cloudflare المنشور الحي**. GitHub draft/CI/flag ≠ deployed authority. هذه الوثيقة نتيجة تنفيذ فحوص مصدر واختبارات وهمية وليس تصريح تشغيل. لا نعيد إنشاء وظائف الموظفين أو الأوردرات العاملة بالفعل على Cloudflare/D1.

**المراجعة:** نُفذت على فرع مستقل مبني على آخر Book `7acf1e61c73b5eb402195c5cef4d8d04ca05c59f` بتاريخ 2026-10-20. لا Merge/Deploy/Google/D1/عملاء حقيقيون. `productionRelease=NO_GO`.

## المرحلة 1 — إجراءات بوابة العملاء التسع

المصدر: `cloudflare-d1/src/legacy-browser-transport-v1.mjs` و`cloudflare-d1/src/customer-portal-native-readiness-v0.mjs`، مع أصل Entry654–659. **هذه وظائف مستخدمة فعليًا في مسار Legacy** بحسب كود المصدر، ولا يجوز إعلان نقلها لمجرد وجود جداول D1 أو OTP primitives. ترتبط كل وظيفة بضوابط محددة:

| Legacy action | ما يلزم قبل فصل Apps Script |
|---|---|
| `customerLogin` | تحقق هوية حقيقي + OTP grant + native session |
| `customerLogout` | إبطال الجلسة Native |
| `changeCustomerPassword` | PBKDF2/CAS + إبطال الجلسات |
| `getCustomerOrders` | ملكية أوردر مؤكدة + D1 read مصرح بها لكل عميل |
| `getCustomerPortalAccountsV1859` | قراءة حساب العميل حسب الهوية + موافقة حدود EasyStore |
| `createCustomerDraft` | ربط العميل الحقيقي + إنشاء Draft في D1 |
| `addCustomerDraftItem` | ملكية Draft + كتابة بنود ذرية |
| `submitCustomerDraft` | exactly-once + حدود المديونية والحسابات |
| `uploadCustomerDraftFile` | R2 ACL + ملكية Draft + جلسة موثقة |

**المنفذ في هذه الجلسة:** جرد 9/9 آلي صارم، واختبار أن `/v1/legacy-api` يرسل هذه الأفعال التسعة إلى `script.google.com` باستخدام `fetch` وهمي فقط، واختبار عدم تسريب هوية/منح تصريح عند استكمال شهادات Source زائفة. أي زيادة أو حذف فعل يسبب FAIL. **الترحيل الحقيقي: غير معتمد، غير منشور، ولا فصلت Google**.

**قرار D02 المؤجل:** تحديد هوية العميل وربط أوردراته في الإنتاج، اختيار قناة OTP وموافقة الرسائل، إثبات D1 sessions وR2 ACL، مراجعة EasyStore المالية، ثم cutover تدريجي. لا تُغيّر أية مسارات عملاء حقيقية.

## المرحلة 2 — BOOK24 Single Writer

المصدر المستقل: [PR #194](https://github.com/fawakhry/TrendOs/pull/194) — `autonomous-printshop/core/book24-task-writer-cutover-preflight-v1.mjs`، مع PRs #171/#173 والتشغيل الحالي `cloudflare-d1/src/operator-task-edge-v2.mjs`.

**ملاحظة مهمة:** Edge Operator Task V2 ما زال يمرر Mutation عبر `operatorTaskEdgeProxyV2` إلى Apps Script. نجاح Cloud D1 في تخزين أوردرات وموظفين لا يثبت أن Apps Script `WORK_QUEUE_V1` و`OPERATOR_TASK_V2` وD1 لا يكتبون نفس المهمة. ScriptLock في مشروعين منفصلين ليس Mutex عالميًا.

**المنفذ:** فحص مصدر Route موجود، واستهلاك **نسخة تقرير PR #194 بدون نسخ منطقها**؛ تحقق من بالضبط مساري Script ومن تقرير `configurationConsistent`، مع اختبارات تنكر لأسماء lanes، ورفع `activationCertified` بشكل مزيف. حتى لو كان report متوافقًا ومصدر الدليل يبدو حيًا، لن تعطي وظيفة المراجعة Authority للعملاء أو Writer للمهام.

**قرار D03:** مطابقة المشروعين ScriptLock + نسخ Deploy + Edge/D1 flags والـEpoch والـwriter fence و0 active tasks ببيانات نطاقها المناسب؛ فصل الكتابة المكررة يحتاج موافقة مسؤولي النظام وخطة rollback. `BOOK24_TASK_AUTHORITY=P0_OPEN`؛ لا يتم أي تبديل Flag أثناء هذه الجلسة.

## المرحلة 3 — مطابقة GitHub بإصدارات Cloudflare

المصادر: `TrendOS_MASTER_BOOK.md` و`cloudflare-d1/wrangler.toml` و`config.js`. الكتاب يحتوي **بصمات Deployment تاريخية** لـ `trendos-ui` و`trendos-d1-api`، وليس توقيعًا لإصدار اللحظة الحالية. كتابة `NATIVE_ONLY=true` في GitHub لا تثبت deployed Worker env.

**المنفذ:** أداة تحقق من worker+deployment+version وأدلة القراءة بدون كشف secrets، واختبارات رفض فقدان بصمة النشر أو تغيرها. وحتى إدخال معرفات وهمية مطابقة لا يجعل `productionVerified` true (لأن الاستدلال داخل repo لا يشهد على Cloudflare). `trendos` legacy و`trendos-d1-staging` و`trendos-staging` وR5 لها مخاطر اعتماد مسجلة؛ لا حذف أو تعديل لأي منها.

**قرار D01:** جلب Read-only Cloudflare Deployments وbindings/flags/Routes وسجل Consumers بنطاق مصرح به، مقارنة SHA/bundle فعلي بالـrepo، تحديث مرجع النشر وتحديد اختلافات Google للمسارات القديمة. لا يمكن ادعاء إتمام هذه المرحلة إنتاجيًا بدون Cloudflare runtime evidence.

## المرحلة 4 — اختبار الانتقال والرجوع قبل التشغيل

**المنفذ:** محاكاة برمجية لسلسلة 10 مراحل تشمل backup/restore، صلاحيات stage، Single Writer، customer identity/finance، Canary read/write المحدود، عدم تكرار الأوردر، ثم موافقة المالك. اختبار **حقن الفشل في كل واحدة من 10 مراحل** يعطي `NO_GO` و0 Cloudflare/Google/D1 calls و0 customer writes، مع خطتين واضحتين: عدم تغيير النظام قبل القطع، أو إجراءات احتواء واسترجاع متطلبة للمالك بعد القطع.

**قرار D04:** Stage محمي بمعرّفات وشهادات مستقلة، نسخة احتياطية واسترجاع ناجح، صلاحيات الموظفين، مقارنة source/deploy، خطة توقف/عودة وحضور المالك. لا يتم تنفيذ rollback فعلي أو canary مادي بالاختبارات الوهمية.

## ملفات التنفيذ والتشغيل الآمن

- `tools/zero-google-release-v1/four-phase-gate.mjs`: أربع مصنفات الأدلة مع fail-closed flags.
- `tools/zero-google-release-v1/run-offline-audit.mjs`: JSON مخفف لا يقرأ بيانات أو أسرارًا، يؤكد `NO_GO`.
- `tests/zero_google_four_phase_release_gate.test.mjs`: عينات وهمية واختبارات حدود المراحل الأربع وسلوك Legacy الفعلي مع fake fetch.
- `.github/workflows/zero-google-four-phase-offline-release-gate.yml`: source/tests دون أسرار أو اعتماد خدمة خارجية.

```bash
node --test tests/zero_google_four_phase_release_gate.test.mjs
node tools/zero-google-release-v1/run-offline-audit.mjs
```

**ملف قرار مستقل قابل للفحص الآلي:** [FOUR_PHASE_DECISION_REGISTER_V1.json](FOUR_PHASE_DECISION_REGISTER_V1.json)، يشمل D01–D04 والأدلة المطلوبة، مع `live_cutover_phases_certified=0`.

### Decision register — القرارات محفوظة، لا تعطل تنفيذ المصدر

| الرمز | يحتاج دليلًا خارجيًا/موافقة | الحالة |
|---|---|---|
| D01 | Current read-only Cloudflare deployed SHA/flags/routes | PENDING |
| D02 | Customers OTP/ownership/D1/R2 + EasyStore clearance | PENDING |
| D03 | Single Writer live Google/D1 cross-project exclusivity | PENDING |
| D04 | Stage, backup/restore, canary, rollback and owner GO | PENDING |

**Final invariant:** `OFFLINE_SOURCE_PHASES=4/4`; `CUSTOMER_LEGACY_ACTIONS_DOCUMENTED=9/9`; `ZERO_GOOGLE_LIVE_COMPLETE=NO`; `CUSTOMER_GO_LIVE=NO`; `TASK_AUTHORITY_SWITCH=NO`; `PRODUCTION_DEPLOY=NO`; `FINANCE_WRITE=NO`. A false-green declaration in these circumstances would be incorrect.
