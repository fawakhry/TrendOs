# TrendOS T12/R5 — CURRENT new-chat starter prompt (owner copy/paste), updated after Entry 125 / 2026-09-23

> **This version supersedes the previous frozen Entry 106 and the pre-run Entry 113 starter text.** Prior text and all older commits remain in Git history and original journal; do not rely on the earlier statement “I have not approved installing the helper,” which is now superseded by owner-reported completed installation at Entry 112. This starter prompt grants **NO new permission** to run any live function or write production data.

## Copy only the following prompt into the next chat

أنا بكمل `fawakhry/TrendOs` من **آخر نقطة مسجّلة فقط، مش من الأول**، على فرع `cloud-migration-v3-t12-order-create-ci-20260919`.

**خطوة القراءة فقط:** افحص HEAD الحقيقي على GitHub، ثم اقرأ `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_CONTINUATION_HANDOFF_2026-09-22.md` وآخر Entries من `TRENDOS_T12_CLOUDFLARE_TEST_EXECUTION_JOURNAL_2026-09-21.md`، خاصة **119–120** وما يليها. ارجع إلى `00_INDEX.md` أو الأدلة القديمة فقط لو ظهرت فجوة محددة؛ ما تعيدش تشغيل اختبارات أو طلب صور ومعلومات متوثقة.

**آخر حالة مؤكدة من المالك، لا تعتبرها قراءة مباشرة منك للـApps Script:** المالك نقل نتيجة Work بعد فتح Head الحالي الأصلي (51 ملف كود): الدالة `trendosD1TargetedRecoveryPreflightReadOnly20260919` لم تكن معرّفة. Work أكد وجود `d1OrdersLiveSyncV2CaptureAll_` و`d1OrdersLiveSyncV2BuildBaseline_` في `D1_Orders_Live_Sync_V2.gs`، و`d1FullGet_` في `D1_Full_Migration.gs`، وعدم وجود تعريف مكرر للدالة الأساسية. ثم المالك أفاد أن Work حفظ المصدر المعتمد حرفيًا في ملف Head منفصل `T12_D1_Targeted_Recovery_Preflight_ReadOnly_20260919.gs`، وفتح المشروع ثانية وتأكد من الحفظ الكامل. **لا تضف نسخة ثانية، لا تعدل Code.gs، ولا تعمل Deploy. الدالة اتشغّلت لاحقًا مرة واحدة فقط وفقًا لصورة نتيجة Work المرسلة من المالك في Entry 117.**

**نتائج GitHub المعزولة:** آخر CI للـhelper coverage: `35863725111` SUCCESS عند test-only commit `023d0a9e380e934d23f6cdaa92c6404006fc7bf8`. Entries 99–107 حفظت تسلسل R5 التاريخي ومحاكاة غموض كتابة D1، بما فيها FAIL وتصحيحه؛ Entries 108–120 تحفظ ما حدث في الشات، مع مصدر الإثبات ورابط/commit وحالة التنفيذ. لا تعيد هذه الخطوات.

**ثوابت الأمان:** Google Apps Script/Sheets وحدهما مسؤولا إنشاء وترقيم الأوردرات الحقيقية؛ D1 mirror غير مؤهل، و`NEXT_ORDER_NO=4308` ملاحظة تاريخية ليست Cloud seed. R5 كان عند 21 سبتمبر حوالي 03:13 ناجحًا بدون كتابة حسب receipt أرسله المالك، ثم عند 03:23 سجل `R5_PERIODIC_ABORT_UNEXPECTED` و`scheduledSyncDisarmed:true`. الاستثناء الأصلي ووقوع كتابة D1 فعلية قبل الخطأ مجهولان. ممنوع تشغيل/إعادة R5، إضافة triggers، تكرار مسح 150 replay properties، تغيير العدّاد، عمل D1 SQL writes/catch-up، نشر Worker أو نقل Cloud CREATE من غير موافقة جديدة منفصلة.

**نتيجة الفحص الفعلي الوحيدة — دليل المالك Screenshot من Work، وليست API receipt مباشر عندك:** المالك اختار فترة شغل هادي وسمح بفحص READ-ONLY واحد، ثم بعت Screenshot يقول إن `trendosD1TargetedRecoveryPreflightReadOnly20260919` اتشغّلت **مرة واحدة ونجحت دون errorCode**. تاب `الأوردرات`: source=705, D1 base=652, changed=11, missing=53, candidates=64, unexpected=0, duplicates=0. تاب `بنود الأوردرات`: source=761, D1 base=708, changed=11, missing=53, candidates=64, unexpected=0, duplicates=0. الإجمالي **128 موضع صف مرشح عبر التابين**، مش 128 أوردر مختلف ولا صفوف اتكتبت في D1. ملخص Work بيقول `sourceStableDuringRead=true` و`d1CatalogStableDuringRead=true` و`structuralDeltaPreconditionsPass=true`. الـJSON الكامل وتوقع سعة Script Properties مش ظاهرين بالكامل في Screenshot، ومصدر الدالة الأصلي مش بيرجع حقلي `success` أو `errorCode` عند النجاح؛ ما تخترعش receipt حرفي. **ممنوع إعادة تشغيل نفس الفحص** لمجرد استكمال المخرجات. راجع تفاصيل Entry 117.

**الخطوة الآمنة القادمة:** راجع على GitHub فقط خطة إصلاح مرآة D1 المحتملة من نفس نقطة التوقف: حدود الكتابة، تحديث المصدر بعد الفحص، توافق schema، الأرشيف، idempotency والتراجع والتحقق بعد أي كتابة، وسعة Properties لو الدليل متاح. **ممنوع أي D1 POST/SQL write، تعديل Sheet أو Script Properties، تشغيل R5/trigger، Deploy أو نقل Cloud CREATE** قبل موافقة جديدة منفصلة محددة على خطة كتابة آمنة. الفحص السابق يثبت Snapshot وقتها فقط، ومش إذن كتابة. لو محتاج JSON كامل اطلب فقط نسخة منزوعة أسرار من الـrun السابق، من غير إعادة تشغيله.

## Entry 120 planning update — next chat MUST NOT mistake plan for completed D1 write

المالك قال `نفذ` بعد عرض خطوة **مراجعة خطة إصلاح D1**؛ اتنفّذت مراجعة GitHub فقط وسُجّلت في Entry 119. النتيجة: Screenshot الفحص كان فيه **128 موضع صف مرشح** و**53 صف نمو بكل تاب**، بينما كود R4 الحالي وR5 مقيد بـ**64 مرشح إجمالي** و**5 صفوف نمو لكل تاب**؛ المسار القديم `/v1/mirror/delta` لا يتحقق من expectedBefore لكل صف داخل المعاملة، وممكن يحذف صفوفًا في بعض الحالات. **لا ترفع الأرقام عشوائيًا أو تشغّل R5 أو تقسّم كتابات التابين.**

اتحفظت خطة القرار المنفصلة، بلا أي كود أو كتابة حقيقية، في `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_128_ROW_CANDIDATE_D1_RECOVERY_PLAN_REVIEW_2026-09-23.md`، واتسجّلت في Entry 120. ابدأ بقراءتها فقط لما تحتاج المرحلة دي. الإنتاج لسه على Google في الإنشاء والترقيم، وD1 **لم تتحدّث** بالـ128 من شغل الخطة. الخطوة المسموحة بدون إذن إنتاجي جديد: تصميم واختبار **مرشح معزول ببيانات وهمية** لمعاملة D1 واحدة atomic عبر التابين وبـCAS حقيقي، بعد مراجعة حدود الطلب والمعاملة والتراجع. أي قراءة تشغيلية إضافية أو كتابة/Deploy/تفعيل trigger أو نقل إنشاء الأوردرات تحتاج تصريحًا منفصلًا محددًا، ولا تستخدم `نفذ` القديم كإذن.


## Entry 123 capacity update — إياك تكرر مراجعة سعة الـ128

بعد Entry 122، المالك قال `كمل`، واتعمل فاحص **سعة صناعي PURE COUNTS / NO SQL / NO IO** مستقل في `cloudflare-d1/t12-preview/t12-d1-128-recovery-capacity-envelope-v1.mjs` مع اختبار `tests/t12_d1_128_recovery_capacity_envelope_v1.test.mjs`. CI المعزول `35877476059` **SUCCESS** عند commit `ab2bfc6ada41f2072a80549c32edbe4d6fea3074`. تفاصيل الكود، الاختبار، أي تصحيح، وروابط الأدلة في journal **Entry 123**؛ ملف خطة الـ128 اتحدّث بقيود السعة الجديدة.

**النتيجة المُثبتة حسابيًا فقط:** تصميم CAS الأصلي من 2 catalog guards + 128 per-row CAS + 2 catalog advances = **132 SQL statements**. صفحة Cloudflare الرسمية: 50 query لكل Worker invocation على Free و1000 على Paid؛ **نوع حسابنا غير معروف**، وبايتات payload الفعلية ومدة تنفيذ D1 والـarchive لسه غير مُقاسة. نجاح CI لا يعني إن عندنا مسار يكتب الـ128؛ الموديول الجديد لا ينتج SQL ولا يصدر أي إذن كتابة، ومفيش أي route جديدة أو تعديل إنتاجي.

**النقطة التالية فقط:** تصميم معزول/غير مربوط للإنتاج لمعاملة CAS عبر التابين تقل عن 50 statement أو إثبات خطة الحساب وحدودها أولًا، ثم اختبارات صناعية للـrollback وlost-response/NO RETRY؛ لا ترفع حدود 64/5 الموجودة، لا تبدأ مزامنة إنتاجية، ولا تعيد فحص القراءة السابق. أي TEST D1 أو production read/write يحتاج موافقة جديدة محددة.

## Entry 125 packed-CAS update — آخر حالة، لا تعيد اختبارات الـ128 القديمة

تم إنشاء نموذج **معزول وغير مربوط بالإنتاج**: `cloudflare-d1/t12-preview/t12-d1-128-packed-cas-planner-isolated-v1.mjs` و`t12-d1-128-packed-cas-batch-isolated-v1.mjs` واختبار SQLite صناعي `tests/t12_d1_128_packed_cas_batch_isolated_v1.test.mjs`. GitHub Actions CI `35878664661` عند `773479097eaa64e6cf9d51f6fc8072080dcf055b` **SUCCESS**؛ 128 موضع صف في التابين اتوزعوا على **36 عبارة SQL** في **معاملة SQLite وهمية واحدة**، مع اختبار rollback على تعارض صف/خطأ وسط العملية، وحالة الرد المفقود بعد commit بلا retry. الشرح والـcommits والأخطاء والمحاولات موثقة في journal **Entry 125**، وخطة الـ128 اتحدّثت.

**مهم:** ده اختبار SQLite محلي صناعي، مش Cloudflare D1 حي، ولا يوجد route أو Deploy أو إذن كتابة. حدود 64 candidate إجمالي/5 نمو بكل تاب في المسار الإنتاجي القديم لم تتغير؛ إنشاء الأوردرات وترقيمها مازال في Google. النوع الفعلي لحساب Cloudflare ومدة/حجم المعاملة الحقيقية وسلامة مرآة الأرشيف غير متحققين، ولقطة الـ128 السابقة قديمة.

**نقطة الاستكمال:** اختبار صناعي فقط على قاعدة **TEST D1 منفصلة ومؤكد إنها مش trendos-main** يحتاج موافقة مالك منفصلة على ذلك التشغيل؛ لا تشغّل أي TEST D1 تلقائيًا ولا تقرّب من قاعدة الإنتاج. أي write إنتاجي أو R5 restart أو baseline reset أو Cloud CREATE محتاج موافقات منفصلة لاحقًا ودليل مصدر جديد. حافظ على log كل خطوة، ولا تعد CI أو live preflight اللي اتعملوا.

**قاعدة ثابتة من المالك:** سجل **كل خطوة** مباشرةً بعد نتيجتها — PASS/FAIL/BLOCKED/NOT RUN، مين نفذها وبأي دليل، HEAD قبل الخطوة، ملفات/دوال/commit/CI، موافقة المالك وحدودها، هل حصل أي أثر إنتاجي، الأخطاء والمجهولات، ونقطة الاستكمال — بEntry متسلسلة append-only في نفس journal ونفس الفرع، وحدّث handoff والبرومبت عند تغير الحالة. سجل حتى محاولات الوصول الفاشلة والتصحيحات، من غير أسرار أو صفوف عملاء على GitHub. ما تقولش إن حاجة اتنفذت لأنك اقترحتها. لا تعد شغل مسجل من الأول.

**ابدأ بآخر Entry/HEAD الفعلي على GitHub، ثم نفذ فقط الخطوة الآمنة التالية ضمن الموافقة الحالية.**

---

Maintenance: This file is a *convenience starter*, not the canonical status record. The journal and newest handoff always supersede any frozen text here; do not treat it as consent to operate production.
