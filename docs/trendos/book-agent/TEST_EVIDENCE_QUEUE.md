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


## اختبارات الفصل 27 — UI Event/Role/Accounting handoff (2026-10-16)

**`SOURCE_ONLY` / `TESTED=NO` / `PRODUCTION_VERIFIED=NO`.** اختبارات DOM/SSO وهمية، بدون جلب بيانات عميل أو تغيير حساب أو إرسال رسالة حقيقية؛ بلاغ `BOOK25-MANAGER-AUTH` موجود سابقًا فلا يتكرر.

| ID | P | الاختبار المطلوب | معيار القبول |
|---|---|---|---|
| BOOK27-REFRESH-OVERLAP | P1 | fake DOM `refreshBtn` + تسجيل `addEventListener/onclick` عبر كل patch lifecycle مع click/refresh/timers | call واحدة أو منع duplicate fetch بوضوح، وعدم إسقاط saving/dirty عند عملية جارية |
| BOOK27-WA-OPEN-IS-SENT | P1 | mock `window.open` blocked/success/closed دون إرسال + capture request `markAutomationMessageSentV1931` | لا `sent` بناءً على window.open فقط؛ retention of pending queue وحالة provider مستقلة |
| BOOK27-DAYCLOSE-UNKNOWN | P1 | render `dayClose:null`، `dayClose:{error}`، مع `blockers:[]` مُثبتة، وrole admin/employee | NOT_READY/UNKNOWN عند فقد المعاينة؛ الخادم يرفض unsafe close ويبقى المصدر المالي بلا تغيير |
| BOOK27-ACCOUNTING-ROLE-HINT | P1 | fake EasyStore origin/session/token postMessage handshake مع modified browser storage وexpired/forged session | Backend يحكم role/scope/expiry؛ no financial privilege from UI hint ولا token للـwrong origin |

**إغلاق كل بند:** `SOURCE_FILE_SHA`, `CURRENT_TARGET_HEAD`, `TEST_COMMAND`, `ACTUAL_RESULT`, `TEST_RUN_SHA`, `WORKFLOW_RUN_URL`, `DEPLOYED_PARITY` عند التصريح. لا تخلط Source test code بنجاح تنفيذ.


## اختبارات الفصل 28 — Order UI, Native Core and Archive (2026-10-16)

**`SOURCE_ONLY`، `TESTED=NO`، `PRODUCTION_VERIFIED=NO`.** الربط المثبت من مصدر `index.html` و`app.js` و`employee-api-dispatcher-v1.js` وCore D1 على HEAD `be3faac2e557809ed78d66fd6f97be35a8ef5699`. اختبارات Fake SQLite/Cloudflare Mock فقط؛ ممنوع تعديل حالات الطلبات أو الأرشفة الحقيقية.

| ID | P | خطوات الاختبار الآمن | شروط القبول |
|---|---|---|---|
| BOOK28-CORE-LINE-SCOPE | **P0** | employee session وهمية print/laser؛ طلب `updateLine` لـlineId بقسم مختلف وstatus `تم التسليم` على عميل ممنوع، مع عزل Runtime/Imported. | 403 أو structured `success:false` و**0 writes** للقسم الآخر؛ debt guard معاد استخدام `BOOK19-DELIVERY-GATES`. |
| BOOK28-BULK-500-SCOPE | P1 | 501+ بنود مطابقة في fake D1 ثم `bulkUpdateDepartmentStatusV1926` و`archiveDeliveredDepartmentV1926`; محاكاة وصول رد success للـUI. | الواجهة لا توهم المستخدم أن جميع البنود اكتملت عند `processed=500` و`remaining>0`، مع سلوك continuation أو إشعار موثق. |
| BOOK28-CORE-RECOVERY | P1 | fault injection لعمليات bulk/archive بين `PREPARED`, `db.batch`, تحديث orders, event و`COMMITTED`؛ نفس `requestId` retry. | التعافي محكوم وآمن، لا فقد/تكرار ولا stuck requestId دائم بلا طريقة Reconcile. |
| BOOK28-FILTER-PARITY | P1 (reuse) | `BOOK13-ORDER-FILTER-PARITY`: serverPaged vs `serverPaged:false`، البحث المزدوج، `__DEBT__`, date-only filters مع D1/Legacy. | نفس عدد الصفوف والمؤشرات والصفحات، وSnapshot/test SHA موثق؛ لا تفتح Issue مكرر. |
| BOOK28-UI-STAT-FILTER | P2 | fake browser click لمؤشرات `مكبس/طباعة على الطاير/متأخر/دين` مع patch listeners المتراكبة وتحقق من `heatPressFilter` values. | عنصر واحد يطبق الفلتر الصحيح، وليس نتيجة قديمة أو full reload غير مطلوب. |

**سجل الإغلاق:** TARGET_SHA، Run URL، TEST_COMMAND، EXPECTED، ACTUAL، FIX_COMMIT، REGRESSION_RUN، DEPLOYED_PARITY عند موافقة منفصلة. لا ترفع تصنيف البلاغ اعتمادًا على وجود ملف اختبار فقط.

## CH25/26 — اختبارات التطوير بعد التحقق من أحدث المصدر (2026-10-16)

**عشرة معرفات موجودة مسبقًا**؛ هذا ملحق نتائج فعلية وحواجز متابعة، وليس إضافة معرفات مكررة. كل الاختبارات التي شغلت حتى الآن صناعية/SQLite محلي داخل GitHub Actions **وليست على Worker منشور**.

| ID | TEST_COMMAND / ENVIRONMENT | TARGET_SHA / Evidence | ACTUAL_RESULT / NEXT |
|---|---|---|---|
| BOOK26-MIRROR-GET-AUTH | `node --test tests/book25_26_p0_auth_synthetic.test.mjs` + `node tests/cloudflare_mirror_safety_v1.test.mjs` / fake D1 | `08d5e39d2ae89fb17ebf1ad2240efe9f74575704` [Actions #38909856464](https://github.com/fawakhry/TrendOs/actions/runs/38909856464), [Draft #137](https://github.com/fawakhry/TrendOs/pull/137) | PASS 8 new auth tests + old Mirror Safety PASS. Stage: inventory readers needing operator `x-migration-secret`, check no public GET, verify deployed SHA; no live GET tested. |
| BOOK25-MANAGER-AUTH | same fake D1 suite + `node tests/entry646_manager_center_core_direct.test.mjs` | `08d5e39d2ae89fb17ebf1ad2240efe9f74575704` [Actions #38909856464](https://github.com/fawakhry/TrendOs/actions/runs/38909856464) | PASS on fake admin/print/laser/service/expired sessions before private SQL; confirm admin role authority against staging fixtures before go-live. |
| BOOK26-NORMALIZED-FINAL-PROOF | `node --test tests/book26_normalized_final_contract_synthetic.test.mjs` + `node --experimental-sqlite tests/cloudflare_normalized_import_v1.test.mjs` | `5401d9abbab3d6529c8d20f8c2cd6ed421c3950b` [Actions #38910255737](https://github.com/fawakhry/TrendOs/actions/runs/38910255737), [Draft #139](https://github.com/fawakhry/TrendOs/pull/139) | 4/4 + legacy SQLite PASS for **required metadata only**. Missing/out-of-order chunks, false positive source counts, replay final and lost ACK **not qualified**; require trusted manifest and transactional replay gate. |
| BOOK25-KPI-TRUTH | `node --test tests/book25_kpi_unknown_synthetic.test.mjs` and inherited P0 fake tests | `fe19d3faebebbfa4494807a657315f7907db3ce5` [Actions #38910992534](https://github.com/fawakhry/TrendOs/actions/runs/38910992534), [stacked Draft #140](https://github.com/fawakhry/TrendOs/pull/140) | Fake manager D1 + UI UNKNOWN PASS; still lacks real duplicate/queue/day-close authoritative readers. **Existing Trend Master resilience CI #38910992872 FAILS**: source lacks actual `AbortController` though old test asserts it. Do not call full regression green or invent a timeout. |
| BOOK26-DELTA-CAS | PLAN: in-memory SQLite D1.batch concurrency/replay with identical baseCount and differing row payload/hash; assert CAS and no lost update | `mirror-delta-gate.mjs` inspected `7822080e6f615d34065b0f2bc042c438443431de` | NOT_RUN / BLOCKED — current preflight and batch lack same-transaction CAS; `t12-existing-test-mirror-packed-cas` belongs to another TEST ONLY path. |
| BOOK26-DEPLOY-LINEAGE | PLAN: read-only deployed Worker/version/UI SHA and historical workflow release artifact + exact-HEAD CI+rollback metadata | `wrangler.toml` `579b06e4918a9ed965be183e69742205f03cdc74` | NOT_RUN / BLOCKED: source flag not proof of deployed mode, no deploy/rollback executed. |
| BOOK25-WORKQUEUE-MIGRATION | PLAN: fake double-claim+idempotency across V1 Apps Script, V2 Edge proxy, independent D1 task authority OFF/SHADOW/CANARY | source reviewed | NOT_RUN / BLOCKED until exclusive writer and deployed flags are proved; do not enable either. |
| BOOK25-FEEDBACK-AUTOMATION | PLAN: fake webhook reply 1-5 + retry/duplicate send ACK + low-score escalation + auto-scan OFF flag, zero WhatsApp | `config.js` source confirms AUTO_SCAN `false` | SOURCE_SAFE_FLAG_VERIFIED; full end-to-end NOT_RUN; deployed flag unknown. |
| BOOK25-AI-APPROVAL | PLAN: mock price/discount/refund/close/knowledge-write without Owner/Customer approval and verify deny-only, no external model | architecture docs only | NOT_RUN / BLOCKED role/writer mapping. |
| BOOK25-MANAGER-PROGRESSIVE | PLAN: fake panel error/stale/timeout of direct monolithic manager and alternate panel service, avoid authority cutover | direct `manager-center-v1932.js`, old Entry646 test PASS; old resilience test FAILS missing `AbortController` in current frontend | SOURCE_UI_GAP/NOT_QUALIFIED. Do not equate old stale tests or synthetic success with active production panel load. |

**Sign-off:** Test commands and CI URLs above are exact-source synthetic records, not runtime parity. `PRODUCTION_VERIFIED=NO` for all; `BOOK26_DELTA_CAS=OPEN`, `BOOK26_NORMALIZED_FULL_PROOF=OPEN`, `BOOK25_PROGRESSIVE=OPEN`. No production worker, browser user session, D1 or Apps Script mutation conducted.


## اختبارات الفصل 29 — محاسبة EasyStore والـNative والتقارير (2026-10-16)

**Status:** `SOURCE_ONLY` / `TESTED=NO` / `PRODUCTION_VERIFIED=NO`، كل الاختبارات المقترحة Synthetic فقط. لا تُجرِ Posting أو Approval على بيانات مالية حقيقية، ولا تُفعِّل GENERAL أو تغير صلاحيات المالك ضمن جولة الكتاب.

| ID | P | الخطوات المطلوبة في Test Harness معزول | معيار الإغلاق |
|---|---|---|---|
| BOOK29-DEPT-LINE-FIELD-PARITY | P1 | fake UI line with materialQty=7, laborCost=80 vs Native `materialConsumption/operatingCost`; compare totalCost, BOM and price; employee print role | Fields survive adapter; no loss/overstatement of stock usage; salary/electricity/rent separate OpEx |
| BOOK29-FINAL-INVOICE-REQUESTID | P1 | fake invoice submit twice, missing/new/stable requestId; manualDescription vs manualItem; payment method cash/Instapay/deferred | Missing id fail closed; mapped stable id prevents duplicate, manual item and correct ledger payment method preserved |
| BOOK29-OPERATING-EXPENSE-PROFIT | P1 | mock period with sales 1000, recognized job cost 400, netWaste 25, independent posted salary 150, electricity 50, rent 100; compare department gross margin vs final net profit | Classified margin 575 and net 275 **only under those assumptions**, complete P&L matches EasyStore ledger and trial balance; reporting never calls 575 net profit |
| BOOK29-APPROVAL-OWNER-POLICY | P1 | fake employee creates department bill, department approves materials, owner reviews and authorizes sensitive financial close/expense/waste/custody, try unauthorized roles | Matrix clear for technical vs financial stages; employee cannot execute owner-only final approvals, audit actor and evidence |

**Review existing evidence without duplicate:** `BOOK18-FINAL-INVOICE-ATOMICITY`, `BOOK18-BALANCE-IDENTITY`, `BOOK27-ACCOUNTING-ROLE-HINT`. Source tests `tests/frontend_employee_accounting_family_router_entry619.test.mjs`, `tests/entry614_employee_accounting_native.test.mjs`, `tests/easystore_a1_day_ops_reads_v1.test.mjs`, `tests/cloudflare_accounting_f2_finance_core_v1.test.mjs`; **وجودها لا يرفع درجة الإثبات**. سجل TEST_COMMAND, TARGET_SHA, RUN_URL, RESULT, FIX_SHA, BACKEND_PARITY, APPROVAL_AUTHORITY.

### BOOK25/26 P0 exact-head requalification — 239696ef

- **Target:** Draft #137 `fix/book25-26-p0-auth-20261016` at `239696efdf369ed5f89a7e08718e6a46fa76da6f`. `node --test tests/book25_26_p0_auth_synthetic.test.mjs` **11/11 PASS** including authorized admin mirror GET using fake native session, non-admin/expired before sheet queries, plus denied Core manager access; `node tests/cloudflare_mirror_safety_v1.test.mjs` PASS; `node tests/entry646_manager_center_core_direct.test.mjs` PASS. [CI #38911785696](https://github.com/fawakhry/TrendOs/actions/runs/38911785696). A61 browser transport [#38911785804](https://github.com/fawakhry/TrendOs/actions/runs/38911785804) PASS.
- `FIX_SHA=239696efdf369ed5f89a7e08718e6a46fa76da6f`; `REGRESSION_PASS=YES (bounded P0 test suites)`; `PRODUCTION_PARITY=NOT_VERIFIED`. Intermediate failing Bearer header test is part of audit history; do not use earlier red or previous pass as final exact head. Deployed-role parity, current Worker version and authorized consumers remain BLOCKED.

## OWNER-INBOX 2026-10-16 — CH27/CH26/CH29 recheck before testing

- **مصدر أمر التسجيل:** المستخدم أعاد إرسال مهام الفصلين 27 و29 والفصل 26؛ **12/12 IDs موجودة بالفعل** في هذه القائمة وفي `ISSUE_REGISTER.md`، فلا تُضاعف الـQueue. راجع آخر `HEAD` الفعلي والـblobs والفروع المفتوحة قبل أي اختبار/إصلاح. سجل إدخال المالك في `ISSUE_REGISTER.md` commit `e486fa6d47907ff0fd65f3cdaa6a03787ae7139f`.
- **CH27 الاختبارات القادمة (fake-only):** `BOOK27-REFRESH-OVERLAP` عدّ طلبات refresh لكل click، ومزامنة save/dirty/rerender؛ `BOOK27-WA-OPEN-IS-SENT` fake `window.open` blocked/opened/closed بلا `markSent` أو Provider ACK، ثم فصل تأكيد الموظف عن accepted/delivered؛ `BOOK27-DAYCLOSE-UNKNOWN` null/error/timeout = UNKNOWN/NOT_READY دون close أو ادعاء سلامة، مع الإبقاء على Server blockers؛ `BOOK27-ACCOUNTING-ROLE-HINT` tampered storage وexpired session وforged origin/source `postMessage` وtoken isolation من غير صلاحيات مالية من الـUI.
- **CH26 المعرفات الحالية دون تكرار:** `BOOK26-MIRROR-GET-AUTH` ارتبط بالفعل بـDraft [#137](https://github.com/fawakhry/TrendOs/pull/137) وfake CI [#38911785696](https://github.com/fawakhry/TrendOs/actions/runs/38911785696) على SHA `239696efdf369ed5f89a7e08718e6a46fa76da6f`؛ `BOOK26-NORMALIZED-FINAL-PROOF` guarded metadata في Draft [#139](https://github.com/fawakhry/TrendOs/pull/139) وfake [#38910255737](https://github.com/fawakhry/TrendOs/actions/runs/38910255737)، **ولم يثبت اكتمال chunks/Replay**؛ `BOOK26-DELTA-CAS` يحتاج isolated concurrent fake D1 وLost ACK؛ `BOOK26-DEPLOY-LINEAGE` يحتاج read-only deployed SHA/Worker/UI version evidence مصرحًا به. **هذه روابط اختبارات تاريخية محدودة النطاق، وليست تشغيلًا جديدًا في جلسة الإدخال ولا إثباتًا للإنتاج.**
- **CH29 الاختبارات القادمة (fake ledger/finance only):** `BOOK29-DEPT-LINE-FIELD-PARITY` mapping دون تضخيم الهالك أو مخزون أو نقل مرتبات/كهرباء/إيجار إلى direct job cost؛ `BOOK29-FINAL-INVOICE-REQUESTID` retry stable ID وحقول manual/payment + nonduplicate invoice؛ `BOOK29-OPERATING-EXPENSE-PROFIT` دفتر 5200 ومصروفات مُرحّلة/غير متاحة ومطابقة مجمل/صافي الربح مع الميزان؛ `BOOK29-APPROVAL-OWNER-POLICY` employee-record/owner-approve + denied employee financial close/expenses/waste/purchases/custody وتوثيق actor/timestamp. لا تغيير `READONLY/GENERAL`.
- **التسجيل الحالي:** `TESTS_RUN_NOW=NONE`; `RESULT_NOW=QUEUED_NOT_TESTED`; `REGRESSION_PASS_NOW=NOT_ASSERTED`; `DEPLOYED_PARITY=NOT_VERIFIED`; لا معاملات أو رسائل حقيقية، ولا نشر أو دمج PR. لتغيير الحالة مستقبلًا: `CURRENT_TARGET_HEAD`, `CURRENT_BLOB_SHA`, `TEST_COMMAND`, `RUN_SHA`, `CI_URL`, `EXPECTED/ACTUAL`, `FIX_SHA/PR` عند الحاجة، ثم تحقق من Backend authority.
