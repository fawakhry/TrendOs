# TrendOS T12/R5 — CURRENT new-chat starter prompt (owner copy/paste), updated after Entry 117 / 2026-09-23

> **This version supersedes the previous frozen Entry 106 and the pre-run Entry 113 starter text.** Prior text and all older commits remain in Git history and original journal; do not rely on the earlier statement “I have not approved installing the helper,” which is now superseded by owner-reported completed installation at Entry 112. This starter prompt grants **NO new permission** to run any live function or write production data.

## Copy only the following prompt into the next chat

أنا بكمل `fawakhry/TrendOs` من **آخر نقطة مسجّلة فقط، مش من الأول**، على فرع `cloud-migration-v3-t12-order-create-ci-20260919`.

**خطوة القراءة فقط:** افحص HEAD الحقيقي على GitHub، ثم اقرأ `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_CONTINUATION_HANDOFF_2026-09-22.md` وآخر Entries من `TRENDOS_T12_CLOUDFLARE_TEST_EXECUTION_JOURNAL_2026-09-21.md`، خاصة **117** وما يليها. ارجع إلى `00_INDEX.md` أو الأدلة القديمة فقط لو ظهرت فجوة محددة؛ ما تعيدش تشغيل اختبارات أو طلب صور ومعلومات متوثقة.

**آخر حالة مؤكدة من المالك، لا تعتبرها قراءة مباشرة منك للـApps Script:** المالك نقل نتيجة Work بعد فتح Head الحالي الأصلي (51 ملف كود): الدالة `trendosD1TargetedRecoveryPreflightReadOnly20260919` لم تكن معرّفة. Work أكد وجود `d1OrdersLiveSyncV2CaptureAll_` و`d1OrdersLiveSyncV2BuildBaseline_` في `D1_Orders_Live_Sync_V2.gs`، و`d1FullGet_` في `D1_Full_Migration.gs`، وعدم وجود تعريف مكرر للدالة الأساسية. ثم المالك أفاد أن Work حفظ المصدر المعتمد حرفيًا في ملف Head منفصل `T12_D1_Targeted_Recovery_Preflight_ReadOnly_20260919.gs`، وفتح المشروع ثانية وتأكد من الحفظ الكامل. **لا تضف نسخة ثانية، لا تعدل Code.gs، ولا تعمل Deploy. الدالة اتشغّلت لاحقًا مرة واحدة فقط وفقًا لصورة نتيجة Work المرسلة من المالك في Entry 117.**

**نتائج GitHub المعزولة:** آخر CI للـhelper coverage: `35863725111` SUCCESS عند test-only commit `023d0a9e380e934d23f6cdaa92c6404006fc7bf8`. Entries 99–107 حفظت تسلسل R5 التاريخي ومحاكاة غموض كتابة D1، بما فيها FAIL وتصحيحه؛ Entries 108–117 تحفظ ما حدث في الشات، مع مصدر الإثبات ورابط/commit وحالة التنفيذ. لا تعيد هذه الخطوات.

**ثوابت الأمان:** Google Apps Script/Sheets وحدهما مسؤولا إنشاء وترقيم الأوردرات الحقيقية؛ D1 mirror غير مؤهل، و`NEXT_ORDER_NO=4308` ملاحظة تاريخية ليست Cloud seed. R5 كان عند 21 سبتمبر حوالي 03:13 ناجحًا بدون كتابة حسب receipt أرسله المالك، ثم عند 03:23 سجل `R5_PERIODIC_ABORT_UNEXPECTED` و`scheduledSyncDisarmed:true`. الاستثناء الأصلي ووقوع كتابة D1 فعلية قبل الخطأ مجهولان. ممنوع تشغيل/إعادة R5، إضافة triggers، تكرار مسح 150 replay properties، تغيير العدّاد، عمل D1 SQL writes/catch-up، نشر Worker أو نقل Cloud CREATE من غير موافقة جديدة منفصلة.

**نتيجة الفحص الفعلي الوحيدة — دليل المالك Screenshot من Work، وليست API receipt مباشر عندك:** المالك اختار فترة شغل هادي وسمح بفحص READ-ONLY واحد، ثم بعت Screenshot يقول إن `trendosD1TargetedRecoveryPreflightReadOnly20260919` اتشغّلت **مرة واحدة ونجحت دون errorCode**. تاب `الأوردرات`: source=705, D1 base=652, changed=11, missing=53, candidates=64, unexpected=0, duplicates=0. تاب `بنود الأوردرات`: source=761, D1 base=708, changed=11, missing=53, candidates=64, unexpected=0, duplicates=0. الإجمالي **128 موضع صف مرشح عبر التابين**، مش 128 أوردر مختلف ولا صفوف اتكتبت في D1. ملخص Work بيقول `sourceStableDuringRead=true` و`d1CatalogStableDuringRead=true` و`structuralDeltaPreconditionsPass=true`. الـJSON الكامل وتوقع سعة Script Properties مش ظاهرين بالكامل في Screenshot، ومصدر الدالة الأصلي مش بيرجع حقلي `success` أو `errorCode` عند النجاح؛ ما تخترعش receipt حرفي. **ممنوع إعادة تشغيل نفس الفحص** لمجرد استكمال المخرجات. راجع تفاصيل Entry 117.

**الخطوة الآمنة القادمة:** راجع على GitHub فقط خطة إصلاح مرآة D1 المحتملة من نفس نقطة التوقف: حدود الكتابة، تحديث المصدر بعد الفحص، توافق schema، الأرشيف، idempotency والتراجع والتحقق بعد أي كتابة، وسعة Properties لو الدليل متاح. **ممنوع أي D1 POST/SQL write، تعديل Sheet أو Script Properties، تشغيل R5/trigger، Deploy أو نقل Cloud CREATE** قبل موافقة جديدة منفصلة محددة على خطة كتابة آمنة. الفحص السابق يثبت Snapshot وقتها فقط، ومش إذن كتابة. لو محتاج JSON كامل اطلب فقط نسخة منزوعة أسرار من الـrun السابق، من غير إعادة تشغيله.

**قاعدة ثابتة من المالك:** سجل **كل خطوة** مباشرةً بعد نتيجتها — PASS/FAIL/BLOCKED/NOT RUN، مين نفذها وبأي دليل، HEAD قبل الخطوة، ملفات/دوال/commit/CI، موافقة المالك وحدودها، هل حصل أي أثر إنتاجي، الأخطاء والمجهولات، ونقطة الاستكمال — بEntry متسلسلة append-only في نفس journal ونفس الفرع، وحدّث handoff والبرومبت عند تغير الحالة. سجل حتى محاولات الوصول الفاشلة والتصحيحات، من غير أسرار أو صفوف عملاء على GitHub. ما تقولش إن حاجة اتنفذت لأنك اقترحتها. لا تعد شغل مسجل من الأول.

**ابدأ بآخر Entry/HEAD الفعلي على GitHub، ثم نفذ فقط الخطوة الآمنة التالية ضمن الموافقة الحالية.**

---

Maintenance: This file is a *convenience starter*, not the canonical status record. The journal and newest handoff always supersede any frozen text here; do not treat it as consent to operate production.
