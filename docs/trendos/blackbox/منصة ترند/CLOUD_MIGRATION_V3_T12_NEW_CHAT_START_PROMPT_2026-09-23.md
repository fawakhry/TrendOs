# TrendOS T12/R5 — CURRENT new-chat starter prompt (owner copy/paste), updated after Entry 113 / 2026-09-23

> **This version supersedes the previous frozen Entry 106 starter text.** Prior text and all older commits remain in Git history and original journal; do not rely on the earlier statement “I have not approved installing the helper,” which is now superseded by owner-reported completed installation at Entry 112. This starter prompt grants **NO new permission** to run any live function.

## Copy only the following prompt into the next chat

أنا بكمل `fawakhry/TrendOs` من **آخر نقطة مسجّلة فقط، مش من الأول**، على فرع `cloud-migration-v3-t12-order-create-ci-20260919`.

**خطوة القراءة فقط:** افحص HEAD الحقيقي على GitHub، ثم اقرأ `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_CONTINUATION_HANDOFF_2026-09-22.md` وآخر Entries من `TRENDOS_T12_CLOUDFLARE_TEST_EXECUTION_JOURNAL_2026-09-21.md`، خاصة **113** وما يليها. ارجع إلى `00_INDEX.md` أو الأدلة القديمة فقط لو ظهرت فجوة محددة؛ ما تعيدش تشغيل اختبارات أو طلب صور ومعلومات متوثقة.

**آخر حالة مؤكدة من المالك، لا تعتبرها قراءة مباشرة منك للـApps Script:** المالك نقل نتيجة Work بعد فتح Head الحالي الأصلي (51 ملف كود): الدالة `trendosD1TargetedRecoveryPreflightReadOnly20260919` لم تكن معرّفة. Work أكد وجود `d1OrdersLiveSyncV2CaptureAll_` و`d1OrdersLiveSyncV2BuildBaseline_` في `D1_Orders_Live_Sync_V2.gs`، و`d1FullGet_` في `D1_Full_Migration.gs`، وعدم وجود تعريف مكرر للدالة الأساسية. ثم المالك أفاد أن Work حفظ المصدر المعتمد حرفيًا في ملف Head منفصل `T12_D1_Targeted_Recovery_Preflight_ReadOnly_20260919.gs`، وفتح المشروع ثانية وتأكد من الحفظ الكامل. **لا تضف نسخة ثانية، لا تعدل Code.gs، ولا تعمل Deploy. الدالة لم تُشغَّل حتى هذه النقطة.**

**نتائج GitHub المعزولة:** آخر CI للـhelper coverage: `35863725111` SUCCESS عند test-only commit `023d0a9e380e934d23f6cdaa92c6404006fc7bf8`. Entries 99–107 حفظت تسلسل R5 التاريخي ومحاكاة غموض كتابة D1، بما فيها FAIL وتصحيحه؛ Entries 108–113 تحفظ كل ما حدث في هذا الشات، مع مصدر الإثبات ورابط/commit وحالة التنفيذ. لا تعيد هذه الخطوات.

**ثوابت الأمان:** Google Apps Script/Sheets وحدهما مسؤولا إنشاء وترقيم الأوردرات الحقيقية؛ D1 mirror غير مؤهل، و`NEXT_ORDER_NO=4308` ملاحظة تاريخية ليست Cloud seed. R5 كان عند 21 سبتمبر حوالي 03:13 ناجحًا بدون كتابة حسب receipt أرسله المالك، ثم عند 03:23 سجل `R5_PERIODIC_ABORT_UNEXPECTED` و`scheduledSyncDisarmed:true`. الاستثناء الأصلي ووقوع كتابة D1 فعلية قبل الخطأ مجهولان. ممنوع تشغيل/إعادة R5، إضافة triggers، تكرار مسح 150 replay properties، تغيير العدّاد، عمل D1 SQL writes/catch-up، نشر Worker أو نقل Cloud CREATE من غير موافقة جديدة منفصلة.

**الخطوة التشغيلية التالية غير منفذة بعد:** فحص `trendosD1TargetedRecoveryPreflightReadOnly20260919` مرة واحدة READ-ONLY ممكن يمسك نفس Script Lock المستخدم لإنشاء الأوردرات الحقيقية ويؤخرها. المالك وافق سابقًا على فحص واحد في وقت `دلوقتى` قبل إضافة الملف، لكن النافذة دي انتهت، وطلب حاليًا **التوثيق أولًا**؛ ما تعتبرهاش موافقة على تشغيل متأخر. قبل أي Run لازم المالك يختار نافذة هادئة **جديدة** ويوافق على احتمال تأخير أوردرات حقيقية؛ إن لم يؤكد، توقف قبل التشغيل. عند الموافقة المحددة، اختَر الاسم الدقيق فقط، مرة واحدة من غير إعادة تلقائية، وأبلغ بنتيجة إجمالية منزوعة الأسرار والبيانات الشخصية. أي إعادة مزامنة/كتابة/تفعيل trigger/نقل CREATE تحتاج قرارات لاحقة مستقلة.

**قاعدة ثابتة من المالك:** سجل **كل خطوة** مباشرةً بعد نتيجتها — PASS/FAIL/BLOCKED/NOT RUN، مين نفذها وبأي دليل، HEAD قبل الخطوة، ملفات/دوال/commit/CI، موافقة المالك وحدودها، هل حصل أي أثر إنتاجي، الأخطاء والمجهولات، ونقطة الاستكمال — بEntry متسلسلة append-only في نفس journal ونفس الفرع، وحدّث handoff والبرومبت عند تغير الحالة. سجل حتى محاولات الوصول الفاشلة والتصحيحات، من غير أسرار أو صفوف عملاء على GitHub. ما تقولش إن حاجة اتنفذت لأنك اقترحتها. لا تعد شغل مسجل من الأول.

**ابدأ بآخر Entry/HEAD الفعلي على GitHub، ثم نفذ فقط الخطوة الآمنة التالية ضمن الموافقة الحالية.**

---

Maintenance: This file is a *convenience starter*, not the canonical status record. The journal and newest handoff always supersede any frozen text here; do not treat it as consent to operate production.
