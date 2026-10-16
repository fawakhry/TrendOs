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


## اختبارات الفصل 30 — اتفاقيات SSO وتزامن الجلسات (2026-10-16)

**لا توجد اختبارات منفذة في جلسة الكتاب:** SOURCE_ONLY, TESTED=NO, PRODUCTION_VERIFIED=NO. جميع الحالات تُختبر بمحاكاة محلية فقط وبدون حسابات أو بيانات حقيقية.

| ID | الأولوية | اختبار القبول |
|---|---|---|
| BOOK30-SSO-LOGOUT-RACE | P1 | محاكاة فتح شاشة EasyStore ثم خروج المستخدم قبل التأكيد؛ تأكد من توقف إعادة محاولات التسليم وعدم عودة الجلسة القديمة |
| BOOK30-SSO-AUDIENCE | P1 | مراجعة توثيق الطرف المستقبل ومطابقة الجهة والمدة والهوية ومنع الاستعمال المتكرر |
| BOOK30-LEGACY-VERIFY-QUERY | P1 | تتبع مسار التحقق القديم وتأكيد عدم استخدام بيانات الجلسة في عنوان الطلب أو إثبات تعطيل المسار |
| BOOK30-SSO-CROSSSERVICE-REVOKE | P1 | محاكاة خروج وتغيير كلمة مرور مع خدمات TrendOS وEasyStore والملفات، والتحقق من سياسة انتهاء الصلاحيات |

**مراجع سابقة بلا تكرار:** الفصل 14 انتهاء Edge Token؛ الفصل 20 رابط خادم الملفات؛ الفصل 27 صلاحية شاشة EasyStore المحلية.

**دليل الإغلاق:** CURRENT_HEAD, TEST_COMMAND, RUN_SHA, RESULT, CI_URL, FIX_COMMIT عند الحاجة، وDEPLOYED_PARITY بعد موافقة مستقلة.

## CH27-UI-SAFETY CI EVIDENCE — 2026-10-16 / PR #143

- **REGRESSION HEAD:** `61431e19f85afc0c5b440ce6a477d8cd4c25951c`, `fix/book27-ui-safety-20261016`, [Draft PR #143](https://github.com/fawakhry/TrendOs/pull/143); [GitHub Actions #38914688601](https://github.com/fawakhry/TrendOs/actions/runs/38914688601) **PASS**, log proves 10/10 actual synthetic tests, old Entry619 SSO and no-auto-refresh contracts PASS. [A61 browser #38914688624](https://github.com/fawakhry/TrendOs/actions/runs/38914688624) PASS on same HEAD. Source-only fake browser/D1/Sheets with **no network, real WhatsApp or financial close**.
- **BOOK27-REFRESH-OVERLAP:** delayed `loadRows` + repeated click / dirty / editing / saving / modal fake DOM. **PASS** coalesced one refresh while in flight; no reset of saving/editing and suppressed historical onclick.
- **BOOK27-WA-OPEN-IS-SENT:** fake `window.open` success, blocked, unapproved URL and Code.gs `markAutomationMessageSentV1931_` with fake auth and sheet function that would throw if called. **PASS**: zero `markSent`, zero sheet operations, server returns `PROVIDER_ACK_REQUIRED`. **Unverified** delivery/provider ACK; no provider test possible in this UI-only patch.
- **BOOK27-DAYCLOSE-UNKNOWN:** fake `null`, exception, malformed, inconsistent, blocked and legitimate ready preview. **PASS**: unknown NOT_READY, valid blocker disables button, only unblocked verified preview shows ready; no financial mutation or real day-close run.
- **BOOK27-ACCOUNTING-ROLE-HINT:** fake tampered browser storage, untrusted HTTP/HTTPS origin, allowlisted EasyStore URL and SSO token NOT in URL. **PASS UI-only**; role/expired-session enforcement by receiving EasyStore backend and SSO audience/expiry/revoke cross-service NOT VERIFIED. Subsequent tests should emulate expired native session and forged ACK with a verified destination provider contract, plus release staging.
- **REGRESSION LIMIT:** VM source extraction and synthetic handlers are not full browser E2E; old code used multiple identical function names (`roleMode`) and test extraction was corrected after a red run. `CI_GREEN_SYNTHETIC=true` only, `APP_DEPLOYED_SHA=UNKNOWN`, `BACKEND_EASYSTORE_VERIFIED=false`. No regression run proves real customer or monetary operation.


## اختبارات الفصل 31 — Ubuntu TrendosShop وPrint/Laser Service (2026-10-16)

**نوع الدليل:** `SOURCE_ONLY` + Host Owner Terminal evidence for existing Ubuntu checkpoints. `TESTED_NOW=NO`, `PRODUCTION_VERIFIED=NO`. أول مرحلة مجازة تصميميًا فقط، **بمحاكاة خارج السيرفر وبدون بيانات/توكنات فعلية**، والسيرفر **في البيت** وليس على شبكة ماكينة إنتاج مثبتة.

| ID | P | تجربة تحقق معزولة | معيار القبول |
|---|---|---|---|
| BOOK31-PRINT-ONLY-POLL-SCOPE | P1 | Fake TrendOS client allows getRows(print), denies service/laser/press؛ initialize Bridge configured `pollScreens=['print']` and capture baseline + status transition, observeOnly true | no privilege expansion, no cross-dept data, snapshot success limited to authorized screens, no real order/folder writes |
| BOOK31-LOCAL-READ-ACL | P1 | Mock HTTP GET of status/state/orders/order-files/preview from unauthorized identity under future reverse-proxy assumptions; assert POST remains token-gated | classify public vs private routes, deny private customer reads, preserve loopback-only default and no route publicly exposed |
| BOOK31-HOST-SOURCE-PARITY | P1 | Compare owner-observed local HEAD `a238ce5a830bc5a7968dc020cd8168c85fa8c446` with AP155 candidate `ab21183f9444b8ebb49932f1b1e4f3c381888851`, config and tested code IDs; stage-only mock harness if separately approved | no blind pull, no claim CI result applies to host until same tested artifact/config proved |
| BOOK31-SAFE-START-PROFILE | P2 | Controlled offline fake run with temp storage, TrendOS+FastMode disabled; default live mode MUST fail closed, no real popup/network/printing | `AP277_LIVE_CAPABILITIES_BLOCKED_BY_DEFAULT` intact, `observeOnly` doesn't misrepresent startup disk effects |
| BOOK31-HOST-SECURITY | existing | Independent Server Book SERVER-20261016-01…13: SSH socket/UFW/password/key/owner Git evidence; no remote scans; **do not duplicate issue** | keep host hardening/read-only access approval gates open |
| BOOK31-FILE-SSO | existing | Chapter 20/30 token-in-URL and revocation concerns; separate `files.matbagy.com` service, not local port 4782 | deny unauthorized file read by server ACL after independent review |

**Source tests to inspect (not executed):** `autonomous-printshop/print-server/tests/test_ap277_write_guard_synthetic.py`, `test_ap279_bridge_shadow_synthetic.py`, `test_ap296_trendos_shadow_schema_synthetic.py`, `test_platform_bridge.py`. On closing each ID require `TARGET_SOURCE_HEAD`, `LOCAL_HOST_HEAD`, `TEST_COMMAND`, `ACTUAL_RESULT`, `CI_RUN_URL/TEST_SHA`, `DEPLOYED_PARITY` and owner approval for any real login or Ubuntu changes. No Print/Laser/Files/Agent service is declared LIVE from GitHub docs.

## CH27 + BOOK30 login-handshake retry — latest exact SHA (2026-10-16)

- `TEST_SHA=95326bbf0b07dfdddb2bc430564eab2eb3b542c6`; [Book27 #38915520537](https://github.com/fawakhry/TrendOs/actions/runs/38915520537) PASS **13/13** (previous 10 + 3 mock SSO missing-session/forged-ACK/logout cases); old Entry619 and no-autorefresh regressions PASS; [A61 #38915520552](https://github.com/fawakhry/TrendOs/actions/runs/38915520552) PASS.
- `BOOK30-SSO-LOGOUT-RACE` covered **at browser sender layer only**, checks active role/token/identity at send and each resend, no stale token posted after account switch; receiving EasyStore backend expiry/revocation/role trust and real browser integration `NOT_TESTED`.
- `BOOK27-ACCOUNTING-ROLE-HINT` remains `PARTIAL_PATCH_TESTED` despite green UI suites. No financial operation, real login, WhatsApp send or deployed Worker touched.

## CH29 ACCOUNTING READONLY — exact fake-D1 run (2026-10-16)

- `RUN_SHA=97df4efdf350246ce08e04663fdb58866e57ae87`; `node --test tests/book29_accounting_readonly_contract_synthetic.test.mjs` **6/6 PASS** and `node tests/entry614_employee_accounting_native.test.mjs` PASS; [Actions #38916388100](https://github.com/fawakhry/TrendOs/actions/runs/38916388100), A61 browser [#38916388082](https://github.com/fawakhry/TrendOs/actions/runs/38916388082) PASS same SHA. [Draft PR #146](https://github.com/fawakhry/TrendOs/pull/146).
- Fake D1 simulates the real Native route's `READONLY` control: unauthorized/non-read actions (`saveAccountingDeptLine`, `approveAccountingDeptInvoice`, `saveAccountingFinalInvoice`, `saveAccountingMaterial`, `saveAccountingTemplate`, `savePartyLedgerTransaction`) return 503 **before business SQL and with 0 writes**, including repeated/fake requestId.
- Source assertions detect existing UI↔Native `materialQty/materialConsumption`, `laborCost/operatingCost`, `manualDescription/manualItem` and missing Native client request ID; test passes because the incompatibility is **documented**, not resolved.
- `STILL_PENDING`: backend Legacy accounting write authority, classifying independent salaries/electricity/rent, ledger 5200 and real net profit, final-invoice stable idempotency after network loss, owner approval/actor/timestamp controls. `MODE_FLAG_CHANGE=NO`, `REAL_FINANCE=NO`, `PRODUCTION_VERIFIED=NO`.

## CH29-invoice-and-material — latest fake test runs (2026-10-16)

- **BOOK29-FINAL-INVOICE-REQUESTID** [Draft #148](https://github.com/fawakhry/TrendOs/pull/148) `RUN_SHA=be1d813499593bfdc981b253c219a96b4b1397eb`: `node --test tests/book29_final_invoice_idempotency_synthetic.test.mjs` **8/8 PASS**, `node --test tests/book29_legacy_invoice_dedupe_fake.test.mjs` **3/3 PASS**, `node tests/frontend_employee_accounting_family_router_entry619.test.mjs` PASS, `node tests/entry614_employee_accounting_native.test.mjs` PASS; [CI #38919621027](https://github.com/fawakhry/TrendOs/actions/runs/38919621027) PASS and [A61 #38919621182](https://github.com/fawakhry/TrendOs/actions/runs/38919621182) PASS same SHA. Failure before green: initial test wording expected another Arabic synonym; old Entry619 test used obsolete Native-auth flag false; isolated Code.gs VM needed synthetic accounting version constant. Corrected **tests only**, runtime config remained unchanged. Fake lost ACK, reload, changed payload, double-click, no WebCrypto, manually selected payment, stable invoice replay with synthetic ScriptLock/Sheets (zero append). **No real invoice or customer data.**
- **BOOK29-DEPT-LINE-FIELD-PARITY** [Draft #150](https://github.com/fawakhry/TrendOs/pull/150) `RUN_SHA=d58cfe5970686aa8cac8b421d95f415e9f85d381`: `node --test tests/book29_native_dept_line_parity_synthetic.test.mjs` **6/6 PASS** (materialQty alias positive, conflict/invalid negative, nonzero labor refusal, validation-before-SQL source guard, fake READONLY 0 D1 financial writes) and old `node tests/entry614_employee_accounting_native.test.mjs` PASS; [CI #38919240749](https://github.com/fawakhry/TrendOs/actions/runs/38919240749) and [A61 #38919241051](https://github.com/fawakhry/TrendOs/actions/runs/38919241051) PASS on same exact SHA.
- **Still QUEUED / NOT_TESTED:** `BOOK29-OPERATING-EXPENSE-PROFIT` — source-of-truth mapping account 5200, salary/electricity/rent operating expenses, separate gross/net and trial balance; `BOOK29-APPROVAL-OWNER-POLICY` — owner-only financial approval, separate technical department signoff, actor/time, user-role / name collision and customer finance isolation on *actual* server. `BOOK29_NATIVE_GENERAL=NOT_TESTED`, `PRODUCTION_VERIFIED=NO`; any future production write needs explicit owner approval + staging.

## LEGACY V1932 evidence checks — 2026-10-16

These are archival qualification tests, not production application tests.

| ID | Qualification | Pass condition | State |
|---|---|---|---|
| LEGACY-ARCHIVE-001 | Secure offsite copy and clean restore | Private source, manifest and AST index match recorded SHA256 after independent recovery | LOCAL_ZIP_CRC_SHA_PASS / OFFSITE_NOT_TESTED |
| LEGACY-ARCHIVE-002 | Static/deployed Apps Script call graph for 9 mirrored pairs | Each path proved used or retired, packaging dependency established | BLOB_EQUAL_PASS / DEPLOYMENT_BLOCKED |
| LEGACY-ARCHIVE-003 | Historical backup discovery in alternate Drive/Apps Script export | Authenticated source + hash or documented unavailable | METADATA_ONLY / SEARCH_MISSING |
| LEGACY-ARCHIVE-004 | Both Code.gs files via identical AST engine | Compare 614 original names, 12 changed spans, 2 ambiguous, scoped score, 27 added book-only names | LEXICAL_DONE / AST_CURRENT_NOT_TESTED |

Evidence: book-branch Code.gs blob e91d78dcceeeca2804e721d58e065a6a7181bfc2; private original SHA256 d0d16e3e5863d6a2da7b31e5b4e60fd709b9ddd43cc2761fc64bde1d130b4e87. No runtime testing or production qualification.

## CH28 platform-only next work — P0 line scope + P1 partial bulk (2026-10-16)

- **Finance handoff:** Every accounting/EasyStore/credit/refund/profit, finance role and owner approval finding was removed **only from the current platform workload**, **not** from historical evidence or permanent IDs. Canonical finance status remains `fawakhry/EasyStore:EASYSTORE_ACCOUNTING_MASTER_BOOK.md`; platform-only index [ACTIVE_NON_ACCOUNTING_ISSUES_20261016.md](ACTIVE_NON_ACCOUNTING_ISSUES_20261016.md). Finance tests were NOT rerun in this handoff.
- **BOOK28-CORE-LINE-SCOPE P0** — [Draft #157](https://github.com/fawakhry/TrendOs/pull/157), `TEST_RUN_SHA=44893219e4701fd1c1b5cc9c1d1ee9c308015491`, [Book28 fake D1 #38924015331](https://github.com/fawakhry/TrendOs/actions/runs/38924015331) **13/13 PASS**; inherited [manager/mirror #38924015125](https://github.com/fawakhry/TrendOs/actions/runs/38924015125) **11/11 PASS**, Entry644/Entry650 PASS, [A61 #38924015041](https://github.com/fawakhry/TrendOs/actions/runs/38924015041) PASS. Fake native/imported lines, print/laser/service/admin session role, spoofed `screen` and admin-looking username, invalid session, no writes for denied Core lines. Authorization bridge may legitimately update **session audit metadata**; assertion checks **zero Core business writes** for denial. Initial attempt [#38923695266](https://github.com/fawakhry/TrendOs/actions/runs/38923695266) FAILED from counting that separate auth metadata; subsequent intermediate [#38923855951](https://github.com/fawakhry/TrendOs/actions/runs/38923855951) FAILED inherited Entry650's obsolete index asset pin. Both corrected before final green, no runtime flags changed.
- **BOOK28-BULK-500-SCOPE P1** — [Draft #159](https://github.com/fawakhry/TrendOs/pull/159), `TEST_RUN_SHA=00d5f39967ec4f700a6bdea8a9b8e9d17d96e626`, [Book28 501-row fake Core #38925036096](https://github.com/fawakhry/TrendOs/actions/runs/38925036096) **5/5 PASS**; independent inherited [P0 scope #38925036145](https://github.com/fawakhry/TrendOs/actions/runs/38925036145) PASS (13/13), [P0 mirror/manager #38925035997](https://github.com/fawakhry/TrendOs/actions/runs/38925035997) PASS (11/11) and [A61 #38925036019](https://github.com/fawakhry/TrendOs/actions/runs/38925036019) PASS on exact SHA. Original Entry644/Entry650 PASS. Fake 501 matches → 500 changed, remaining 1 explicitly; same requestId replay is **no write** and returns same snapshot result, new ID picks remaining 1; same for archive, exact 500 → no false partial. UI warns when count over 500. **No real D1/customer/order mutation**.
- **Next platform queue only:** `BOOK22-CONTENT-R2-ACL` private assets, `BOOK26-NORMALIZED-FINAL-PROOF` missing chunks, `BOOK26-DELTA-CAS` concurrency, `BOOK28-CORE-RECOVERY` partial commit and `BOOK25-WORKQUEUE-MIGRATION` one Task writer. Finance-specific delivery restrictions remain with EasyStore agent; no owner finance approval/release here.
- `SOURCE_PATCH_TESTED_SYNTHETIC=YES`; `PRODUCTION_VERIFIED=NO`; `DRAFT_ONLY=YES`; `DEPLOY=NO`; `MERGE=NO`.

### LEGACY evidence gate follow-up (reference and boundaries) — 2026-10-16

| Gate | Input/target | Result and remaining test |
|---|---|---|
| LEGACY-ARCHIVE-002 | SOURCE_REGISTRY `1cc07df9fa1f988b01157db507260742f98e00fc`, BUILD_MATRIX `72c9ad859cdc8ced1a69c2d5a89e15eeaf437216` | **PASS SOURCE**: 9/9 registered; 8/9 Build Matrix represented. **BLOCKED RUNTIME**: live Apps Script file list, deployment, triggers and copy tasks unavailable. |
| LEGACY-ARCHIVE-004 | V1932 AST original line ranges and Code.gs current blob `e91d78dcceeeca2804e721d58e065a6a7181bfc2` | **PASS EXACT-TEXT**: portal redirect old/new both 827 chars equal, attFindToday old/new both 447 chars equal. Remaining 12 changed bodies need AST+semantic review; no prod test. |
| LEGACY-ARCHIVE-001 | private V1932 ZIP | Prior local ZIP integrity PASS, external independently encrypted backup + clean restore **NOT TESTED**. |
| LEGACY-ARCHIVE-003 | connected Drive | Historical backup name absent from connected search; alternate source read **BLOCKED**. |

Do not replace these with CI/build green labels. Actual application `TESTED_RUNTIME=NO` and `PRODUCTION_VERIFIED=NO`. [Report](LEGACY_MIRROR_DEPENDENCY_AUDIT_20261016.md).

## CH22 R2 Public Content ACL — synthetic PR161 (2026-10-16)

- `BOOK22-CONTENT-R2-ACL` `TEST_SHA=b4fafcf15baffa4ae998736d0ce07456d142fee1` [Draft #161](https://github.com/fawakhry/TrendOs/pull/161). [Fake D1/R2 #38926438556](https://github.com/fawakhry/TrendOs/actions/runs/38926438556) **11/11 PASS** via `node --test tests/book22_content_r2_public_asset_acl_synthetic.test.mjs`; inherited `node tests/entry614_employee_content_native.test.mjs` and `node tests/entry629_employee_content_readonly_dispatch.test.mjs` PASS; [A61 #38926438516](https://github.com/fawakhry/TrendOs/actions/runs/38926438516) PASS same SHA.
- Positive: public sections, marketplace vendor/product and ads images GET without employee login. Negative: private Knowledge/Notes/branch/service; hidden/inactive owners, HTML/SVG, key/path/ID spoofing and absent file all deny **before R2 GET**. Raw public base blocks **new** Content uploads before PUT.
- Initial [#38926108546](https://github.com/fawakhry/TrendOs/actions/runs/38926108546) 10/11 due fake auth session audit counted as Content writes; [#38926248566](https://github.com/fawakhry/TrendOs/actions/runs/38926248566) 11/11 but inherited Entry629 stale bridge preflight/count and OFF versus READONLY config fixture. Adjusted test instrumentation/fixture only, no runtime flags.
- Still BLOCKED: old raw public R2 URLs and bucket/custom domain metadata, deployed Worker/source SHA, image consumer browser staging. `PRODUCTION_VERIFIED=NO`; `DEPLOY=NO`; `MERGE=NO`.

## 2026-10-16 — BOOK24 Edge/D1 optional single-writer guard fake CI

- Baseline `agent/trendos-book-audit-v1-20261014@69e1eae80b06ad9a5d5f6e39f86c6e32291c10f0`; [Draft #173](https://github.com/fawakhry/TrendOs/pull/173). New helper `cloudflare-d1/src/operator-task-single-writer-guard-v1.mjs`; Edge pre-upstream fail-closed `route.mutation` check.
- `node --test tests/book24_operator_edge_d1_writer_guard_synthetic.test.mjs`: mock-only mode OFF/SHADOW/CANARY/GENERAL, default-off bypass, missing D1/table/invalid mode/failed SELECT, auth/idem deny before D1, read-only routes, OPTIONS, concurrent duplicate Edge claims denied when D1 in GENERAL; fake fetch never touches Google.
- Existing `node --test tests/operator_task_edge_v2.test.mjs`, `node --test tests/cloudflare_edge_gateway_v1.test.mjs`, static only-one-SELECT and default-off assertion and A61 browser regression. First code SHA `f0b3ab8c42aad2e42161f84b1d35f96579aa4f05` [CI #38939579487](https://github.com/fawakhry/TrendOs/actions/runs/38939579487) PASS **14/14** pre-concurrency; [browser #38939579738](https://github.com/fawakhry/TrendOs/actions/runs/38939579738) SUCCESS. Updated test `ba22529b3c17d6cf50eb34070d64f0b02c78a295` adds simultaneous Edge claim negative proof; final exact-HEAD CI evidence to be appended in PR after Book updates.
- **What test does not prove:** actual production Edge guard activation, direct Apps Script worker fencing, cross-store atomicity, D1 runtime authority role/mode, production source lineage or cutover safety. `BOOK24-TASK-AUTHORITY=STILL_OPEN`.
