# TrendOS T12/R5 — new-chat starter prompt (owner copy/paste), 2026-09-23

## Paste the following into the next chat

أنا بكمل مشروع `fawakhry/TrendOs` من **آخر نقطة مسجّلة، مش من البداية**. فرع الشغل هو `cloud-migration-v3-t12-order-create-ci-20260919`.

**أول خطوة إلزامية:** افتح GitHub واقرأ `docs/trendos/blackbox/منصة ترند/00_INDEX.md`، ثم `CLOUD_MIGRATION_V3_T12_CONTINUATION_HANDOFF_2026-09-22.md`، ثم **آخر Entry** في `TRENDOS_T12_CLOUDFLARE_TEST_EXECUTION_JOURNAL_2026-09-21.md`. راجع آخر branch HEAD والـ CI فعلًا قبل أي تعديل؛ ما تعتمدش على ZIP قديم أو HEAD مكتوب في برومبت. ملف قرار الفحص القادم هو `CLOUD_MIGRATION_V3_T12_R5_READONLY_RECOVERY_PREFLIGHT_OWNER_DECISION_2026-09-23.md`. ما تطلبش مني أعيد رفع صور أو أكرر اختبارات وقراءات موجودة ومسجلة.

**الحالة المؤكدة لحد Entry 106 قبل إنشاء ملف البرومبت:** الإنتاج الحقيقي ما زال ينشئ الأوردرات ويخصص رقمها عن طريق Google Apps Script/Sheets؛ نقل سلطة الإنشاء إلى Cloudflare **لم يحدث**. أنا أكدت الشيت الأساسي، وبعت قراءة قديمة للعداد `NEXT_ORDER_NO=4308` وهي **مش seed نهائي**. ربط الـWorker `trendos-d1-api` باسم `DB` إلى D1 `trendos-main` ظهر في صورة Cloudflare. قراءة D1 للفهارس والجداول نجحت، لكن مرآة D1 مش مؤهلة كنسخة حديثة: أوردرات وبنود حالية 652/708 صفًا شامل الرأس وتاريخ آخر مزامنة مسجل `2026-09-20 17:43:19`، والأرشيف 2765/3984 وتواريخ `2026-08-29`. قراءة منفصلة سابقة للشيت الأصلي 698/754 صفًا للحالي و2872/4111 للأرشيف؛ المقارنة **غير متزامنة** ولا تثبت عددًا نهائيًا للسجلات المتأخرة أو فقدان بيانات.

**حادثة امتلاء Script Properties:** يوم 19 سبتمبر حُذف مشغّلان قديمان مختلفان عن R5، واتمسحت **مرة واحدة فقط** 150 خاصية replay قديمة بعد نسخة احتياطية خاصة وفحوصات وموافقة مني على المخاطرة. **ممنوع تكرار الحذف أو حذف baseline أو العدّاد أو الأسرار.** اتعمل R5 جديد يوم 20 سبتمبر. في سجل Executions الأصلي، تشغيل R5 الآلي يوم **21 سبتمبر نحو 3:13 صباحًا** كان `success:true,mutationPerformed:false,postflightRowParityVerified:true,scheduledSyncDisarmed:false` حسب الـreceipt اللي بعتّه. تشغيل R5 التالي **3:23 صباحًا** سجّل `success:false,errorCode:"R5_PERIODIC_ABORT_UNEXPECTED",scheduledSyncDisarmed:true,postflightRowParityVerified:false`، وصفحة Triggers الحالية بتعرض صفر مشغّلات لحسابي. ده دليل إن R5 أوقف جدوله لحماية البيانات، لكن **الاستثناء الأصلي وسبب الفشل الدقيق مجهولين**.

**نتيجة اختبار مهمة:** CI المعزول أثبت إن الـreceipt العام `R5_PERIODIC_ABORT_UNEXPECTED` ممكن يظهر في محاكاة **قبل أي كتابة** أو **بعد كتابة D1 مؤكدة ثم خطأ في تحرير القفل**، بنفس المخرجات العامة؛ عشان كده `mutationPerformed:false` في هذا الـreceipt مش إثبات مستقل إن D1 لم تتغير. وأثبتت اختبارات معزولة إن حد R5 الدوري لزيادة الصفوف هو **5 صفوف لكل شيت في الجولة**، بينما الفرق التاريخي المرصود كان 46 لكل شيت حالي؛ **ممنوع إعادة تشغيل R5 عشوائيًا**. راجع Entry 99–106 للـCI الناجح والفاشل وتصحيحه، وحدود كل تجربة.

**أسلوب الشغل المطلوب:** كمل تلقائيًا كل خطوة آمنة ممكنة في الجولة، ومتقفش لمجرد نجاح اختبار. سجل **كل خطوة PASS/FAIL/BLOCKED وتصحيحها** في نفس فرع T12، بسجل Entries متسلسل وCommits وروابط الـCI، وحدّث ملف التسليم للشات اللي بعده. ما تعملش تغيير إنتاجي بدون إذن منفصل واضح، ولا تخلط بين نجاح الاختبارات المعزولة وبين تشغيل الإنتاج الحقيقي. ما تبعتش مفاتيح أو بيانات عملاء أو نسخ Script Properties كاملة إلى GitHub.

**نقطة الاستكمال والقرار المطلوب فقط لو لازم:** فيه فحص جاهز، *لم يُشغَّل الآن*، اسمه `trendosD1TargetedRecoveryPreflightReadOnly20260919` داخل `cloudflare-d1/t12-preview/t12-d1-targeted-recovery-preflight-readonly-20260919.gs`. بيقرأ الشيت الحالي ومرآة D1 فقط، لكن بياخد **Script Lock** وقد يؤخر إنشاء أوردرات حقيقية أثناء القراءة. لو الدالة مش موجودة بالفعل في مشروع Apps Script الأصلي، إضافتها لملف `.gs` منفصل تعدّل Head حتى من غير Deploy. **أنا لم أوافق بعد على تشغيل الفحص ده أو إضافة ملف Head جديد.** لازم تراجع الـrunbook المذكور، وتسألني موافقة محددة على فحص قراءة فقط مرة واحدة في وقت شغل هادي، مع توضيح احتمال تأخير الأوردرات، وبشكل منفصل عن أي إذن للإضافة إلى Head إن لزم. لو مش موافق، كمل تجهيزات GitHub الآمنة فقط. بعد فحص مُصرّح به، أي catch-up أو استعادة trigger أو نقل Cloud CREATE محتاج قرارات منفصلة بعد فحص توافق المصدر/المرآة والتراجع الآمن.

ابدأ بذكر آخر Entry وHEAD الحقيقي اللي لقيتهم في GitHub، وبعدها اشتغل من نقطة الاستكمال فقط.

---

## Maintenance note
This prompt reflects the branch when checked at Entry 106. Before use, ALWAYS follow the branch's newest journal entry; any later recorded approval, refusal, test failure, or revised decision supersedes the frozen text here. It grants **no new operational permission** by itself.
