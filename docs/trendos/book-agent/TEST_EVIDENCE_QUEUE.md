# TrendOS — قائمة مصالحة أدلة الاختبارات (initial audit)
**تاريخ الجرد:** 2026-10-14. **المصدر:** وصف PRs #124–#130 عند الفحص، وليس إعادة تنفيذ اختبارات مستقلة. **حالة جميع PRs وقت الجرد:** Draft وغير مدموجة.

| Entry / PR | الاختبار والدليل الأصلي | ما يمكن إثباته من وصف PR | الفجوة قبل اعتماده في الكتاب كاختبار current HEAD |
|---|---|---|---|
| Entry653 / [#124](https://github.com/fawakhry/TrendOs/pull/124) | [Actions #38312278054](https://github.com/fawakhry/TrendOs/actions/runs/38312278054), code SHA `a0c208c6c4934cec3f92c333f258612a22357bba` | أعلن صاحب PR نجاح CI المعزول لكود source-only | فحص conclusion من API، ثم exact final HEAD؛ لا نقل السلطة التشغيلية |
| Entry654 / [#125](https://github.com/fawakhry/TrendOs/pull/125) | [Actions #38313421901](https://github.com/fawakhry/TrendOs/actions/runs/38313421901), `18f468a1feac85d1d00bc26eac71e6365959acb3` | نجاح CI مذكور لاختبارات SQLite/Node وهمية | latest PR HEAD مختلف بعد docs؛ `NO_GO` للعميل الحقيقي |
| Entry655 / [#126](https://github.com/fawakhry/TrendOs/pull/126) | [Actions #38313885038](https://github.com/fawakhry/TrendOs/actions/runs/38313885038) | نتيجة offline على source head مذكورة SUCCESS | فحص SHA من run؛ last-head qualification؛ ربط هوية العميل بالأوردر `OPEN` |
| Entry656 / [#127](https://github.com/fawakhry/TrendOs/pull/127) | [Actions #38314577511](https://github.com/fawakhry/TrendOs/actions/runs/38314577511), `c6eeba7ee4fe8c08ef045bc757fb9c104865aa48` | public GET-only health SUCCESS؛ إثبات جزئي endpoints | لا يعني Zero-Google end-to-end؛ فحص head الحالي وCloudflare Builds المنفصل |
| Entry657 / [#128](https://github.com/fawakhry/TrendOs/pull/128) | [Actions #38315594943](https://github.com/fawakhry/TrendOs/actions/runs/38315594943), `c7bf20a26a0e667b5067ed923608d2d38830d2ea` | source-only offline SUCCESS موصوف | نهائي HEAD بعد إضافة التوثيق، SMS/login الحي `NOT_TESTED` |
| Entry658 / [#129](https://github.com/fawakhry/TrendOs/pull/129) | [Actions #38316390798](https://github.com/fawakhry/TrendOs/actions/runs/38316390798), `461fd92c6b12497b2c20dd7fea2f240f08903f06` | source-only SQL contract SUCCESS موصوف | exact-head check؛ transaction في D1 الحقيقية `NOT_TESTED` |
| Entry659 / [#130](https://github.com/fawakhry/TrendOs/pull/130) | [FAIL #38316884906](https://github.com/fawakhry/TrendOs/actions/runs/38316884906); [SUCCESS #38316935044](https://github.com/fawakhry/TrendOs/actions/runs/38316935044), `272244881545af6320467fc29d408962d4c2ea7a` | فشل test harness regex أولًا ثم نجاح المعالجة في code SHA لاحق | لا تخف الفشل السابق، تحقق من آخر PR HEAD `a80eb3761082659ed5a484695d08993214316e4a` ومستوى نجاحه؛ production `NO_GO` |

## الأولوية القادمة
1. **ENTRY659**: تحقق من سجلات GitHub Actions الفعلية ونتيجة آخر head، وقارن مع نص `TrendOS_MASTER_BOOK.md` والتقرير `docs/trendos/staging/ENTRY659_CUSTOMER_ONE_TIME_PASSWORD_ENROLLMENT_TICKET_20261013.md`. أضف فقط المعلومة الناقصة، ولا تكرر ما هو موثق.
2. **Cloudflare Workers Builds**: افحص الـcheck الفاشل أو missing المرتبط بالسلسلة؛ إن لم تظهر logs فمنع تفسير السبب، وسجل `ROOT_CAUSE_UNKNOWN`.
3. باقي Entries 658→653: مطابقة `run.head_sha` مع `PR.head_sha` واستقصاء snapshot doc/code الفرق. النجاح التاريخي لا يتغير، لكن `LATEST_HEAD_PASS=UNKNOWN` حتى إثباته.
4. مر على `docs/trendos/TRENDOS_TEST_CATALOG.md`, `TRENDOS_TEST_MATRIX.md` ونتائج CI المختصة بالفرع، وقارنها مع الكتاب/Journal لتكتشف الاختبارات التي **لم تُسجّل أصلاً** (هذا الجرد الحالي ليس ادعاءً بأنه شامل).

## صيغة المصالحة لكل Evidence ID
- `EVIDENCE_ID` / `TARGET_BRANCH` / `TARGET_HEAD` / `WORKFLOW_RUN_URL` / `RUN_HEAD_SHA` / `CONCLUSION` / `TEST_SCOPE` / `BOOK_ENTRY_FOUND` / `MISSING_FIELDS` / `NEXT_SAFE_ACTION`
- `TESTED_SOURCE`, `DEPLOYED_RUNTIME` و`PRODUCTION_ACCEPTED` **3 حالات مستقلة**. لا ترقّي واحدة بالأخرى.

> هذا **Discovery Queue** وليس دفتر نتائج نهائي؛ إثبات PASS/FAIL يتطلب فحص GitHub API لرقم run وcommit والاختبارات؛ وضعنا هنا ما تقوله PR descriptions فقط.


## التحقق المباشر الأول من Actions API — 2026-10-14
جرى جلب **run objects** لهذه السجلات وتأكيد `status=completed` و`conclusion` و`head_sha`، وليس الاعتماد على وصف PR فقط:
- [Entry659 run 38316884906](https://github.com/fawakhry/TrendOs/actions/runs/38316884906): `failure` في commit `a091a0317cd482442238d9b76b0c0a1561c1f6d8`؛ بدأ 2026-10-12 22:28:46 UTC. **نوع خطأ regex مذكور في PR، ولم يُراجع job log هنا بعد.**
- [Entry659 run 38316935044](https://github.com/fawakhry/TrendOs/actions/runs/38316935044): `success` في commit `272244881545af6320467fc29d408962d4c2ea7a`؛ بدأ 2026-10-12 22:29:19 UTC.
- [Entry658 run 38316390798](https://github.com/fawakhry/TrendOs/actions/runs/38316390798): `success` في `461fd92c6b12497b2c20dd7fea2f240f08903f06`؛ بدأ 2026-10-12 22:23:36 UTC.

**قيد مهم:** آخر PR #130 head وقت القراءة `a80eb3761082659ed5a484695d08993214316e4a`؛ وهو مختلف عن SHA الخاص بالـrun الناجح. لذا `ENTRY659_EXACT_PR_HEAD_PASS=UNKNOWN`، ولا يجوز تحويل source-only CI إلى Production PASS.


## فحوص الفصول 16–20 — جرد مصدر بتاريخ 2026-10-16 (لا تشغيل تجارب)

**هذه قائمة لإيجنت الاختبارات/التطوير، وليست سجل FAIL في Production.** جميع البنود `SOURCE_ONLY` و`TESTED_THIS_PASS=NO` و`PRODUCTION_VERIFIED=NO`، مع إيقاف أي اختبار على حساب/ملفات/أوردرات حقيقية حتى تصريح منفصل. تفاصيل السطور وروابط SHA المثبتة داخل [كتاب TrendOS](TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md).

| ID | الأولوية | المستهدف والفصل | الدليل الناقص واختبار القبول الآمن | الحالة |
|---|---|---|---|---|
| BOOK16-CUSTOMER-IDENTITY | P0 | بوابة العميل §16 | mock بعميلين: عدم اختلاط session/code/ownership، وعدم تمكين Native Portal دون approval | BLOCKED |
| BOOK16-DRAFT-REPLAY | P1 | مسودات وملفات §16 | fake datastore: create/add/upload/submit مع lost-ACK/retry/size/type | BLOCKED |
| BOOK17-NOTIFY-ENUM | P1 | إشعار الأوردر الجديد §17 | UI `order_registered` مقابل Native `registration`: assert rejects/accepts، ومعالجة `res.success=false` | SOURCE_CONTRACT_MISMATCH |
| BOOK17-FLY-NOTIFY | P1 | إنذار الطاير §17 | فحص triggers/polling/Browser Notification permission وغياب push الدائم | BLOCKED |
| BOOK18-BALANCE-IDENTITY | P0 | الرصيد §18 | عميلان متشابهان باسم واحد ومعرفين مختلفين: المقارنة بين قائمة/بحث وكشف الحساب | SOURCE_INCONSISTENCY_RISK |
| BOOK18-FINAL-INVOICE-ATOMICITY | P0 | الفاتورة §18 | fault inject بعد invoice batch وقبل invoice/payment ledger، تحقق recovery دون ترحيل مكرر | SOURCE_ATOMICITY_RISK |
| BOOK19-DELIVERY-GATES | P0 | Core/Runtime §15 و19 | اختبار التسليم الممنوع في Core single, bulk, Native, Legacy مع أدوار وصلاحيات متعددة | SOURCE_GUARD_GAP |
| BOOK19-TASK-AUTHORITY | P1 | Task/Autonomous §19 | proxy HMAC mock، إثبات Apps Script Task writer، تحقق Shadow لا يسند مهمة | BLOCKED |
| BOOK20-FILE-SSO-TOKEN | P0 | Remote Files §20 | فحص token في URL/سجل وصول/Referer مع اختبار معزول؛ تصميم one-time ticket | SOURCE_SECURITY_RISK |
| BOOK20-R2-GET-AUTH | P0 | Comms R2 §20 | anonymous/cross-user/hidden-file GET في mocked Worker: MUST 401/403 قبل أي R2 read؛ deployed parity | SOURCE_AUTH_GAP |
| BOOK20-R2-ORPHAN | P1 | Comms R2 §20 | fault inject بعد R2.put وقبل D1 insert وإثبات cleanup/reconcile | SOURCE_ATOMICITY_RISK |

**لإغلاق كل ID:** اربط `TEST_ID`، `TARGET_HEAD`، `TEST_COMMAND`، `ENVIRONMENT`، `ACTUAL_RESULT`، `WORKFLOW_RUN_URL`، `RUN_HEAD_SHA`، `FIX_COMMIT`، `REGRESSION_RUN`، وأخيرًا `PRODUCTION_PARITY` عند الموافقة. لا تحوّل `SOURCE_ONLY` إلى `TESTED` لمجرد وجود ملف اختبار.


## اختبارات الفصول 21–23 — 16 أكتوبر 2026 (SOURCE_ONLY؛ بدون تشغيل)

**القرار:** الإيجنت وثّق المصدر فقط، ولا يوجد `TESTED` لهذه الجولة. لا تشغيل D1 أو مصادقات أو ملفات أو حضور حقيقيين، ولا إثبات تطابق الـWorker المنشور. الأدلة داخل الفصول [21–23](TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md).

| ID | الأولوية | الفصل | الحالة وشرط الإغلاق |
|---|---|---|---|
| BOOK21-MIRROR-PAYLOAD | P1 | 21 | BLOCKED — same row count، لكن hash/row content مختلف: إثبات parity أو رفض المصدر |
| BOOK21-02CR-STALE | P1 | 21 | BLOCKED — stale snapshots + Native/Legacy overlay، منع فقد أي تغيير لم يصل للمرآة |
| BOOK21-HEARTBEAT | P1 | 21 | SOURCE_ONLY — اختبار شكل source/error/TTL/zero-idle + timeout في بيئة Mock |
| BOOK21-CI-HEAD | P1 | 21 | BLOCKED — لا توجد نتيجة CI على HEAD للكتاب في branch-runs query؛ تطابق test SHA + build SHA قبل ترقية الحالة |
| BOOK21-OBSERVABILITY | P2 | 21 | BLOCKED — ربط `requestId/correlationId` عبر الوحدات وتنبيه الأخطاء/النسخة دون PII |
| BOOK22-CONTENT-R2-ACL | P0 | 22 | SOURCE_AUTH_POLICY_GAP — GET ملفات Content قبل session؛ اختبار collection public vs private/anonymous مع mock R2 وعدم كشف بيانات خاصة |
| BOOK22-CONTENT-LOST-UPDATE | P1 | 22 | SOURCE_CONCURRENCY_RISK — CAS/version عند تحديثين متزامنين لنفس السجل |
| BOOK22-BRANCH-CUSTOMER-ID | P1 | 22 | SOURCE_AMBIGUITY_RISK — عميلان بنفس الاسم؛ منع تعيين الفرع لهوية خاطئة |
| BOOK22-CONTENT-CUTOVER | P1 | 22 | BLOCKED — source frontend READONLY مقابل server GENERAL محتمل؛ تأكيد flags/role/endpoint |
| BOOK23-ATTENDANCE-REPLAY | P1 | 23 | BLOCKED — replay heartbeat/end/clockin على Fake D1 مع race قرب منتصف الليل القاهرة |
| BOOK23-HR-PRIVACY | P1 | 23 | BLOCKED — myRequests/requests/employees و401/403 لكل دور على سجل وهمي |
| BOOK23-CLEANING-RACE | P2 | 23 | BLOCKED — طلبان متزامنان لتنظيف نفس الشخص/اليوم، إثبات idempotent |
| BOOK23-PRESS-COST | P1 | 23 | BLOCKED — تشغيل/إيقاف مكبس مع إجمالي كهرباء تقديري؛ عدم الترحيل كتكلفة مباشرة أو فاتورة دون اعتماد |

**حقول إغلاق إلزامية لكل اختبار:** `TARGET_HEAD`, `TEST_COMMAND`, `TEST_RUN_SHA`, `WORKFLOW_URL`, `EXPECTED_RESULT`, `ACTUAL_RESULT`, `FIX_SHA` عند الإصلاح، `REGRESSION_PASS`، `PRODUCTION_PARITY` عند التصريح فقط.


## اختبارات ربط المطبعة الذاتية — الفصل 24 (SOURCE_ONLY؛ 2026-10-16)
| ID | الأولوية | شرط الاختبار | الحالة |
|---|---|---|---|
| BOOK24-TASK-AUTHORITY | P0 | تحقق من مصدر Task writer الفعلي على كل مسار 02CR/Operator V2/D1، ومنع ازدواج claim/complete، ونسخة Worker المنشورة | BLOCKED |
| BOOK24-READINESS-PARITY | P1 | Design/MATERIAL/MACHINE evidence per line، TTL، unknown لا يساوي ready، والـprice/finance cutover fail-closed | BLOCKED |
| BOOK24-SHADOW-BOUNDARY | P1 | Shadow observer/dashboard لا ينفذ Order Mutation أو Employee Assignment حتى عند خطأ إعداد | SOURCE_ONLY |
| BOOK24-OWNER-APPROVAL | P0 | Owner-only exceptions مثل خصم/رد مال/إجراء وظيفي لا تتحول AI_AUTO دون approval مسجل | BLOCKED |

**مراعاة الكتاب المستقل:** أدلة `autonomous-printshop/MASTER_BOOK.md` لا تعتبر `TrendOS PRODUCTION_VERIFIED` إلا بتطابق runtime SHA والحدود بين المشروعين، ولا تكرر الـEntries هنا.


## اختبارات لوحة المدير والذكاء — الفصل 25 (SOURCE_ONLY؛ 16 أكتوبر 2026)
| ID | الأولوية | الفرضية وطريقة الإثبات | الحالة |
|---|---|---|---|
| BOOK25-MANAGER-AUTH | P0 | Fake Employee token دور print/laser يطلب `getTrendMasterCenterV1931` / `getActivityLog`: يجب عدم إرجاع قيود الديون وأسماء العملاء أو سجلات الأقسام غير المصرح بها | SOURCE_AUTH_GAP |
| BOOK25-MANAGER-PROGRESSIVE | P2 | اختبار زر Manager Center: هل يستخدم Reader المقسم أم monolithic GET؟ simulate timeout/failure/stale per panel | SOURCE_UI_GAP |
| BOOK25-KPI-TRUTH | P1 | مقارنة `messageQueue:[]`, `dayClose:null`, `duplicateHealthy` مع مصادر مستقلة، منع اعتبار UNKNOWN=0 | BLOCKED |
| BOOK25-WORKQUEUE-MIGRATION | P1 | إثبات سلطة claim واحدة بين Work Queue V1 (Apps Script) وOperator Task V2/Cloud D1، مع replay/lock | BLOCKED |
| BOOK25-FEEDBACK-AUTOMATION | P1 | AUTO_SCAN OFF حسب المصدر؛ اختبار إرسال Meta/تكرار رسالة/نتيجة تقييم 1–5 في sandbox | BLOCKED |
| BOOK25-AI-APPROVAL | P1 | أي AI verdict أو Knowledge promotion يظل ADVISORY_ONLY قبل Evidence/Owner Approval موثَّق | BLOCKED |

لا تغيير كود تشغيل أو بيانات أثناء التسجيل. `TESTED=NO` إلى أن يُرفق Workflow URL ونتيجة exact HEAD.

## اختبارات الفصل 26 — استيراد البيانات وسلامة النسخ (2026-10-16)

كل البنود مسجلة على أنها SOURCE_ONLY/BLOCKED، ولا توجد اختبارات تشغيل جديدة أو وصول لبيانات إنتاجية في جلسة الكتاب؛ راجع الفصل 26 وISSUE_REGISTER.md.

| ID | P | اختبار إثبات آمن | المعيار | الحالة |
|---|---|---|---|---|
| BOOK26-MIRROR-GET-AUTH | P0 | Mock GET /v1/mirror/sheet + /sheets + /stats بحساب anonymous وemployee غير مصرح وadmin diagnostic | يجب رفض الوصول لصفوف الأعمال قبل D1 row read، والسماح فقط بالنطاق المصرح | SOURCE_AUTH_GAP / BLOCKED |
| BOOK26-NORMALIZED-FINAL-PROOF | P1 | Mock syncFinal=true مع syncRunId فارغ، missing earlier chunk، replay final وsourceRowCounts متعارضة | freshness لا يتقدم بدون source completeness موثقة، ولا writes مزدوجة | SOURCE_INTEGRITY_RISK / BLOCKED |
| BOOK26-DELTA-CAS | P1 | Interleaved mirror/delta لنفس sheet/baseRowCount مع payload مختلف ثم lost-ACK retry | عدم lost-update أو قبول stale base، وidempotent recovery | SOURCE_CONCURRENCY_RISK / BLOCKED |
| BOOK26-DEPLOY-LINEAGE | P1 | مراجعة read-only workflow runs/deploy artifact metadata وUI config/source SHA | ربط code hash+worker version+frontend assets+control epoch ونشر exact version | EVIDENCE_MISSING / BLOCKED |

مكرر ولا يُعاد إدخاله: BOOK21-MIRROR-PAYLOAD (row-count vs full row payload hash).

عند اختبار أي ID سجل TEST_COMMAND, EXPECTED, ACTUAL, ENVIRONMENT, TARGET_SHA, RUN_URL, RUN_SHA, FIX_SHA, REGRESSION_PASS, PRODUCTION_PARITY؛ لا تحول File test source إلى TESTED تلقائيًا.

## 2026-10-16 — BOOK28-CORE-RECOVERY exact code SHA CI

- SOURCE: `fix/book28-bulk-500-result-truth-20261016@00d5f39967ec4f700a6bdea8a9b8e9d17d96e626`, direct `PREPARED` ledger insert followed by separate D1 mutations and response commit.
- CHANGE: `fix/book28-core-bulk-atomic-ledger-20261016` Draft [#165](https://github.com/fawakhry/TrendOs/pull/165), exact CODE HEAD `3c0efd19677936882a3686806bf6308990616b2e`. Bulk-only atomic transaction; archive intentionally not claimed fixed.
- TEST: `node --test tests/book28_bulk_500_result_truth_synthetic.test.mjs` 10/10 PASS, covers 500/501/1201 window, exact 500, idempotent replay, archive 501 two requests unchanged, fault before read, D1 batch rollback, lost ACK replay, 500-line statement budget and imported/native audit event parity. Dedicated [#38933618875](https://github.com/fawakhry/TrendOs/actions/runs/38933618875) SUCCESS.
- REGRESSION: 13/13 [Core line scope](https://github.com/fawakhry/TrendOs/actions/runs/38933618992) PASS, 11/11 [manager/mirror](https://github.com/fawakhry/TrendOs/actions/runs/38933618906) PASS, [Book28 bulk #38933619033](https://github.com/fawakhry/TrendOs/actions/runs/38933619033) PASS, [A61 browser #38933618869](https://github.com/fawakhry/TrendOs/actions/runs/38933618869) PASS; SQLite in-memory event count 500/500, Entry644/650 PASS.
- `RUNTIME_EVIDENCE=NOT_VERIFIED`; `PRODUCTION_VERIFIED=NO`. Pre-existing PREPARED ledgers and archive failure recovery remain blocked until authorized audit; never auto-delete/replay.

## 2026-10-16 / BOOK28 archive recovery synthetic CI evidence

- Parent old archive path was non-atomic across PREPARED/line/closure/COMMITTED; test fixture now models transactional archive lines/order maps, preserved external writer modifications and rollback. [Draft #167](https://github.com/fawakhry/TrendOs/pull/167) exact code-test SHA `4b6a143de2d46cb480a9cd395e91896f110b7030`; parent #165 `b08ffa351482daf0419e18871fa26bcc356691dd`.
- [Dedicated archive CI #38935983821](https://github.com/fawakhry/TrendOs/actions/runs/38935983821) **SUCCESS**: `node --test tests/book28_bulk_500_result_truth_synthetic.test.mjs` 17/17 PASS; fault mid-batch, stale delivered status, new cross-department line before D1 commit, lost ACK/COMMITTED replay, mixed source imported/native, 501→500+1 with final-order closure, cross-department print/laser closure; default test no network. SQLite in-memory JSON archive row construction, native unarchived guard, malformed JSON abort verified.
- Inherited [13/13 Core scope](https://github.com/fawakhry/TrendOs/actions/runs/38935983858), [11/11 auth](https://github.com/fawakhry/TrendOs/actions/runs/38935983766), [Bulk-500](https://github.com/fawakhry/TrendOs/actions/runs/38935983752), [Bulk atomic](https://github.com/fawakhry/TrendOs/actions/runs/38935983805), [Browser](https://github.com/fawakhry/TrendOs/actions/runs/38935983806): all SUCCESS at code SHA.
- **OPEN EVIDENCE**: Actual D1 SQLite release/mode, staged call, outstanding historical PREPARED audit and independent CAS for other kinds of writers. No real customer orders, Google, WhatsApp or printers; `TESTED_SYNTHETIC` is not `PRODUCTION_VERIFIED`.

## 2026-10-16 — Legacy Core PREPARED inventory synthetic

- Parent: `fix/book28-core-archive-atomic-recovery-20261016@aa471b24110d4863b14157fc6cb71598655f4a62`, [Draft #167](https://github.com/fawakhry/TrendOs/pull/167). New read-only Draft [#169](https://github.com/fawakhry/TrendOs/pull/169); code-test-workflow SHA `98420e4dd64ae977e4eee7c14f8b6faf5577659c`.
- **Mock-only** `node --test tests/book28_legacy_prepared_readonly_audit.test.mjs`: **10/10 PASS**. Verified admin READONLY diagnostic, non-admin deny before ledger query (including fake admin-looking username), unauthenticated deny, OFF deny, GENERAL allow read, paginated PREPARED only, bounded bad inputs, standalone read-only helper, zero-row status non-inference, read failure no cleanup, no external fetch; payload/canonical/PII exclusion.
- [Dedicated CI #38937116725](https://github.com/fawakhry/TrendOs/actions/runs/38937116725) SUCCESS plus 17/17 archive, 13/13 Core line scope, 11/11 auth and Entry644/Entry650, SQL read-only allowlist PASS. Other inherited seven same-code SHA workflows success.
- **Required production evidence NOT obtained:** actual PREPARED count, old worker version, source outcomes/event traces, user-approved remediation decision, D1/schema read-only staging. Do not treat a diagnostic count as authoritative status. `REPLAY=NO`, `DELETE=NO`, `PRODUCTION_VERIFIED=NO`.
