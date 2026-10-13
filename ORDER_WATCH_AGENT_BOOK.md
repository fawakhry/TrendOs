# ORDER WATCH AGENT — الكتاب الرسمي لإيجنت متابعة الأوردرات

> اقرأني أولًا لأي ChatGPT Work / Chat / Developer يكمل في إيجنت متابعة أوردرات TrendOS.
>
> **المرجع الوحيد لهذا الإيجنت:** هذا الملف داخل الفرع `feature/order-watch-agent-ro-v0-20261014`.
> **الحالة:** SOURCE-ONLY TESTED / OFF / PRODUCTION NO_GO / NO LIVE DATA.
> **تاريخ الإنشاء:** 2026-10-14 — Africa/Cairo.
> **المالك:** صاحب Trend Mall / TrendOS.
> **ممنوع الدمج أو النشر أو قراءة بيانات خاصة دون إذن وصلاحيات مناسبة.**

## 0. أين نبدأ؟
- Repository: https://github.com/fawakhry/TrendOs
- This branch: https://github.com/fawakhry/TrendOs/tree/feature/order-watch-agent-ro-v0-20261014
- Draft PR #131: https://github.com/fawakhry/TrendOs/pull/131
- Base branch: `candidate/t12-full-cloud-cutover-a56-20260929`.
- Canonical platform book: `TrendOS_MASTER_BOOK.md` **في الفرع نفسه** (لا تعتبره موافقة نشر).
- Existing technical handoff: `docs/trendos/staging/ORDER_WATCH_AGENT_V0_20261014.md`.
- This book is specific to Order Watch; do not confuse it with `WHATS_AGENT_BOOK.md` الخاص بواتساب.

## 1. هدف المالك والحدود
**الهدف التجاري النهائي:** تنبيه إدارة ترند مول مبكرًا للطلبات المتأخرة أو المعلقة أو ناقصة المعلومات، تمهيدًا لتقليل اعتماد التشغيل اليومي على حضور المالك.

**المطلوب في V0:** محرك قواعد محلي، حتمي، للقراءة والتحليل فقط لنتائج GET مؤهلة سابقًا من TrendOS؛ دون تنفيذ ذاتي دائم، ودون استدعاءات شبكة أو قواعد بيانات.

**الممنوع الآن:** إرسال واتساب أو إشعارات، إسناد مهام للموظفين، تعديل الطلبات أو الحالات، نقل/حذف/تحديث بيانات، كشف أسماء أو هواتف العملاء، تحصيل أو صرف أو تسعير، دمج PR، نشر Cloudflare، تشغيل جدولة، استخدام بيانات العملاء في GitHub العام أو Actions logs.

> الإيجنت ليس "موظف AI شغال 24/7" حتى الآن. لا تخلط اجتياز اختبارات مصدر الكود مع سلامة الربط أو النشر الحقيقي.

## 2. خريطة الملفات الموجودة فعلًا
| المسار | الوظيفة | الأثر على الإنتاج |
| --- | --- | --- |
| `cloudflare-d1/src/order-watch-agent-v0.mjs` | محرك التحليل المحلي والفرز وإنشاء أكواد التنبيه | لا مسارات API أو اتصال خارجي |
| `tests/order-watch-agent-v0.test.mjs` | اختبارات بيانات اصطناعية/رفض المدخلات غير الآمنة | لا بيانات حية |
| `tools/order-watch/run-offline.mjs` | مشغل محلي يدخل له JSON عبر stdin ويخرج تقريرًا؛ افتراضيًا OFF | لا إرسال ولا اتصال |
| `tests/fixtures/order-watch-v0.synthetic.json` | مثال أوردرات وهمية بالكامل | آمن للاختبار |
| `.github/workflows/order-watch-agent-v0.yml` | Node 22، اختبار وحدات + تجربة CLI محلية وهمية | CI فقط |
| `docs/trendos/staging/ORDER_WATCH_AGENT_V0_20261014.md` | وصف مدخل القراءة والبوابات والقيود | وثيقة |
| `TrendOS_MASTER_BOOK.md` | سجل المشروع الأم وفيه بدء وتنفيذ وإصلاح الاختبارات | وثيقة |
| `ORDER_WATCH_AGENT_BOOK.md` | هذا السجل الرسمي المستمر للإيجنت | وثيقة |

**مصدر القراءة المستهدف مستقبلًا، وليس مربوطًا حاليًا بالإيجنت:** `GET /v1/edge/orders/02cr/page`، الموجود في مصدر المنصة، وبه `rows`، `pagination`، `serverPaged`، `dataVersion`، `version`، `dataSource`. يستخدم جلسة موظف مؤهلة أصلًا من TrendOS. لا تبتكر token أو تفترض إن endpoint على Production صالح حاليًا.

## 3. سلوك V0 الحالي
- المدخل: JSON يحتوي `asOf` مع منطقة/فرق توقيت واضحين و`pages` تم جلبها وتفويضها والتحقق منها مسبقًا بواسطة قناة موثوقة.
- التحقق: صفحاته مكتملة وأرقامها متتالية ومتطابقة الحجم/العدد/الإصدار والمصدر، والـ IDs ثابتة وغير مكررة. عند أي تضارب → Fail closed؛ لا تقرير مضلل بأنه "كل شيء تمام".
- قواعد التنبيه: `OVERDUE`، `UNASSIGNED`، `ITEM_MISSING`، `DELIVERY_DATE_MISSING`، `DELIVERY_DATE_INVALID`، `UNKNOWN_STATUS`.
- موعد التأخير يُقارن بيوم التقويم في توقيت `Africa/Cairo`؛ لا يُعتبر اليوم نفسه متأخرًا. تواريخ ناقصة/غير مفهومة → تنبيه نقص/تحقق وليس تخمينًا.
- الحالات المغلقة تستبعد من التنبيه بحسب قواعد مصدر قارئ أوردرات 02CR؛ الانتباه لأي اختلاف مستقبلًا في تعريف "مكتمل".
- الشدة: `HIGH` للتأخر، أو تكليف غير موجود مع أولوية عاجل/VIP؛ ثم `MEDIUM/LOW` للملاحظات الأخرى.
- التقرير يُظهر **orderId/lineId وseverity/codes وأرقام إجمالية فقط**. لا customer/phone/notes/itemName في النتائج.
- `mode=OFF_SOURCE_ONLY`, `readOnly=true`, `sentNotifications=false`, `productionReady=false`.

## 4. التسلسل التنفيذي التاريخي الموثق
التواريخ: 2026-10-14 بتوقيت القاهرة، وبعض GitHub Actions timestamps بتوقيت UTC في 2026-10-13.

| الخطوة | التنفيذ/الدليل | النتيجة |
| --- | --- | --- |
| 1 | مراجعة `TrendOS_MASTER_BOOK.md` ومصدر 02CR/Orders وحقول الأوردرات على shared candidate | تم تحديد الواجهة والمخاطر؛ لم يحصل فحص Runtime |
| 2 | إنشاء الفرع `feature/order-watch-agent-ro-v0-20261014` من `candidate/t12-full-cloud-cutover-a56-20260929` | فرع معزول |
| 3 | commit `4e729d18d168adb996dc20048b994d3c4b492441` | إضافة المحرك OFF |
| 4 | commit `6f64862ddf34d944c53ebdf9e99851ca05207a49` | إضافة اختبارات وحدات أولية |
| 5 | commit `c98cc385648a409976c8bf9663c41ae4f1dd7f03` | إضافة CLI محلي |
| 6 | commit `0b9fbf915d0206c5c4957458f70f9816dd88f897` | handoff تقني ووثيقة NO_GO |
| 7 | commit `54b4b80f86a377842ac0ac062738d5af7224c0f6` | بيانات وهمية |
| 8 | commit `fbb7ec0326b40c711a58bf61946b25edf78e713d` | سير اختبارات GitHub Actions |
| 9 | commit `8b76a66a2c1ba6460006d1512c7785e269c87a65` | سجل أول التنفيذ في TrendOS_MASTER_BOOK |
| 10 | إنشاء Draft PR #131، إلى shared candidate، من غير merge | Open / Draft |
| 11 | CI run `38486449022` على `8b76a66...` | SUCCESS، اختبارات محلية وهمية فقط |
| 12 | commit `67fde4a57d5f50681288928d774637d72e714a86` | إضافة توثيق PR/CI في كتاب TrendOS |
| 13 | commit `48f73c34602ebda28fddc633466639a66f02a83d` | إضافة اختبارين: إلغاء الطلب وسلامة paging |
| 14 | CI run `38486549270` على `48f73c...` | **FAILURE 9/10**؛ توقع اسم خطأ مختلف |
| 15 | التشخيص من job log | المحرك رفض snapshot غير مكتمل بـ `INCOMPLETE_SNAPSHOT`؛ الاختبار توقع `PAGINATION_INVALID`، ولم يظهر تغيير إنتاج |
| 16 | commit `33975fb6ac4a4eb60ddf17505c50a216ca6c15a8` | تعديل توقع الاختبار فقط، لا تغيير في منطق المحرك |
| 17 | CI run `38486609915` على `33975fb...` | SUCCESS |
| 18 | commit `4902ad329970d3e0919da3b644e5de3737a70b5d` | تسجيل الفشل والإصلاح وإعادة الاختبار في TrendOS_MASTER_BOOK |
| 19 | CI run `38486669544` على `4902ad...` | **SUCCESS** لاختبارات المحرك وCLI |
| 20 | CI run `38486669529` على `4902ad...` | **SUCCESS** لاختبارات A61 browser/cloud transport regression |
| 21 | تعليق مراجعة PR #131 بتفاصيل latest exact-head CI | موثق في Conversation PR؛ NO_GO محفوظ |

**روابط الدليل:**
- PR: https://github.com/fawakhry/TrendOs/pull/131
- آخر source-only CI مكتمل قبل إنشاء الكتاب: https://github.com/fawakhry/TrendOs/actions/runs/38486669544
- توافق A61 عند نفس SHA: https://github.com/fawakhry/TrendOs/actions/runs/38486669529
- الفشل الموثق: https://github.com/fawakhry/TrendOs/actions/runs/38486549270
- إصلاح CI المثبت: https://github.com/fawakhry/TrendOs/actions/runs/38486609915

**ملاحظة مهمة:** تعديل هذا الكتاب يغيّر HEAD ويطلق CI جديدًا. لا تدّعِ أن اختبار `4902ad...` يغطي HEAD الجديد قبل فحص نتائج GitHub Actions له.

## 5. الاختبارات وإعادة التشغيل محليًا
- `node --test tests/order-watch-agent-v0.test.mjs`
- `TRENDOS_ORDER_WATCH_OFFLINE=YES node tools/order-watch/run-offline.mjs < tests/fixtures/order-watch-v0.synthetic.json`
- من غير متغير OFFLINE المضبوط = رفض التنفيذ. لا تستخدم بيانات حقيقية في GitHub أو CI.
- النجاح المتوقع للفكستور: تقرير `OFF_SOURCE_ONLY`، حالة `readOnly`، أوردر واحد متأخر، واحد بلا مسؤول، دون إشعارات.
- نجاح الاختبارات يعني أن القواعد الاصطناعية تعمل وليس أنها موثوقة ضد تغير بيانات الإنتاج أو صلاحيات المصدر.

## 6. القائمة الإلزامية قبل أي Pilot حي
- [ ] READ-ONLY فحص منشور/مفعل TrendOS الفعلي وversion/health والأدوار، مع دليل runtime حديث.
- [ ] فحص صلاحيات كل موظف/شاشة؛ منع أي صلاحيات واسعة أو token داخل repo/PR/logs.
- [ ] تصميم ضمان atomic consistency أو snapshot/cursor من السيرفر؛ **تطابق dataVersion عبر صفحات متحركة غير كافٍ**.
- [ ] التحقق من freshness والاستجابة لفشل/تأخر المرايا؛ Fail closed.
- [ ] فحص حقل `expectedDeliveryAt` لأوردرات Cloud-native: مصدر سابق قد يتركه فارغًا؛ عدم اختلاق تاريخ تأخير.
- [ ] مراجعة تعريف الحالات المغلقة وقواعد اليوم الحالي وأولوية العاجل وتكرار التنبيه مع المالك.
- [ ] فحص خصوصية البيانات والتسجيلات والصلاحيات والاعتمادات الأمنية على لسان مراجِع مستقل.
- [ ] اختبارات سلبية وقابلية استرجاع وتشغيل canary على بيانات مصطنعة، ثم معاينة redacted read-only بموافقة محددة.
- [ ] عند الحاجة لإشعارات/جدولة/إسناد/دمج/نشر Production: STOP واطلب قرار المالك الصريح لكل نطاق.

## 7. التشغيل والاسترجاع والمخاطر
| البند | الحالة |
| --- | --- |
| مصدر الكود | موجود في الفرع ومختبر اصطناعيًا |
| AI automation/autonomous reasoning | **لم تُنفذ بعد**؛ V0 محرك قواعد حتمي |
| طلبات إنتاج حقيقية | لم تُقرأ بواسطة الإيجنت |
| اتصال D1/Apps Script | غير موجود في المحرك |
| تكامل WhatsApp/Email | غير موجود |
| وظائف دورية/خلفية | غير موجودة |
| دمج PR #131 | Draft، لم يتم دمجه |
| نشر Cloudflare | لم يتم |
| التدخل المالي | غير مصرح وغير موجود |
| حكم إطلاق إنتاجي | **NO_GO** |

Rollback الحالي: لا تدمج فرع الإيجنت. لا توجد آثار على Production تحتاج rollback لأن الإيجنت لم يُنشر. إذا قام مطور مستقبلًا بعمل deploy، **يجب** توثيق rollback version والتحقق المستقل قبل الموافقة.

## 8. التعليمات الدائمة لأي ChatGPT Work يكمل المشروع
1. افتح PR #131 وملف `ORDER_WATCH_AGENT_BOOK.md` أولًا **في الفرع المحدد**، ثم `TrendOS_MASTER_BOOK.md` وملفات source/tests/handoff؛ تأكد من HEAD والحالة الحقيقية دون الاعتماد على الشات.
2. افصل `RUNTIME VERIFIED` عن `DEPLOYED` عن `TESTED` عن `REPO-ONLY` عن `PLANNED`.
3. أعِد تشغيل اختبارات synthetic، وافحص آخر CI وعيوب تزامن الصفحات وموعد التسليم وأمان المخرجات. أصلح source-only في نفس فرع الـPR إذا لزم، مع اختبارات regression.
4. قبل طلب أي صلاحية على بيانات حية: راجع read-only الحالة المنشورة والهوية والتفويض والخصوصية؛ إن تعذّر ذلك، اكتب BLOCKED بوضوح.
5. سلّم تقييم الجاهزية وخطة Pilot آمنة، واقترح Minimal Integration لاحقًا؛ لا تنشر ولا تدمج، لا تفتح مهام مالية أو ترسل رسائل.
6. سجّل **كل خطوة فعلية** في هذا الكتاب بنمط Entry مستمر: `وقت القاهرة / PREPARE / الإجراء / commit أو run / النتائج PASS|FAIL|BLOCKED / الأدلة / المخاطر / الخطوة التالية`، بما فيها المحاولات الفاشلة. امنع الأسرار والبيانات الشخصية.
7. عند إجراء تعديل يدخل ضمن TrendOS، ضع إحالة موجزة له في `TrendOS_MASTER_BOOK.md`، دون نسخ الكتاب كله، مع المحافظة على استقلال EasyStore وتقييمات مطبعجي.
8. حافظ على Draft/NO_GO حتى يوافق المالك صراحة على كل تغيير صلاحيات أو بيئة أو نشر.

## 9. سجل الاستكمال — append only
### Entry OW-001 — 2026-10-14 / كتاب الإيجنت
- PREPARE: طلب المالك إرسال برومبت ChatGPT Work وتسجيل جميع الخطوات في كتاب الإيجنت بفرعه. تم التحقق من PR #131: **open Draft، head 4902ad329970d3e0919da3b644e5de3737a70b5d، base candidate/t12-full-cloud-cutover-a56-20260929**.
- تم مراجعة handoff وTrendOS_MASTER_BOOK والـPR، وفحص شجرة HEAD: لم يكن هناك كتاب خاص بـOrder Watch قبل هذه الإضافة؛ يوجد كتاب منفصل لواتساب ولا يجب خلطهما.
- ACTION: إنشاء `ORDER_WATCH_AGENT_BOOK.md` كمرجع رسمي مستقل داخل نفس فرع الإيجنت؛ جمع السياق، التغييرات، CI، الفشل والإصلاح، الصلاحيات، Stop Gates، بروتوكول Work.
- النتيجة: **توثيق فقط / NO_GO / لا Production changes**. commit هذه الإضافة يظهر في GitHub History؛ لا تفترض أن CI الخاص بالـHEAD الجديد مكتمل حتى يتم التحقق منه.
- الخطوة التالية: ربط مصدر القراءة الآمن وتجربة التحقق من snapshot/freshness والصلاحيات فقط بعد مراجعة الحدود؛ لا دمج أو نشر.

