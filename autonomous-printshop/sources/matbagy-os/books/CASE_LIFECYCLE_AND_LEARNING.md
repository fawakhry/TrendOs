# Case Lifecycle + Versioning + Learning Contract — صندوق مطبعجي

> قواعد إلزامية لإدارة كل Design Case من أول فتحها حتى إغلاقها والتعلم منها.

## 1) مراحل الـCase

الحقل الرسمي:

`case_phase`

القيم:
- `OPEN`: الحالة مفتوحة وتم استلام الطلب.
- `UNDER_REVIEW`: ChatGPT و/أو Gemini يراجعان الطلب/التصميم.
- `REVISION_REQUIRED`: توجد تعديلات مطلوبة قبل الاعتماد.
- `WAITING_CUSTOMER_APPROVAL`: تم إرسال Proof/نسخة للعميل وننتظر رأيه.
- `FINAL_APPROVED`: توجد موافقة نهائية مؤكدة على نسخة محددة.
- `CLOSED`: تم إغلاق الحالة بعد حفظ القرار النهائي والدروس الأساسية.
- `REOPENED`: أعيد فتح الحالة لاحقًا مع الحفاظ على نفس Case ID والتاريخ.

`watch_status` يظل `ACTIVE` ما دامت الحالة ليست `CLOSED`. عند الإغلاق يتحول إلى `STOPPED`. عند إعادة الفتح يعود `ACTIVE`.

بعد `CLOSED` لا تنتهي دورة التعلم؛ يبدأ إجراء مستقل اسمه `KNOWLEDGE_EXTRACTION` طبقًا للعقد:

`SCHEMA/KNOWLEDGE_EXTRACTION_CONTRACT.md`

ويستخدم الحقل:

`knowledge_status`

بالقيم:
`NOT_READY | PENDING_EXTRACTION | CANDIDATES_CREATED | REVIEW_REQUIRED | VALIDATED | PROMOTED | NO_REUSABLE_KNOWLEDGE`

## 2) فصل الحقيقة عن الآراء

لا يجوز خلط الأنواع التالية:

- `CUSTOMER_FACT`: ما قاله العميل أو أرسله صراحة.
- `OWNER_DECISION`: قرار المستخدم/صاحب المشروع.
- `CHATGPT_OPINION`: رأي أو اقتراح ChatGPT.
- `GEMINI_OPINION`: رأي أو اقتراح Gemini.
- `SYSTEM_STATE`: حالة تقنية أو Workflow state.
- `INFERRED`: استنتاج يحتاج تمييزًا واضحًا.
- `UNKNOWN`: غير معروف.

رأي أي AI لا يتحول إلى حقيقة أو قرار نهائي إلا بقرار صريح من المستخدم أو دليل اعتماد عميل محفوظ.

## 3) سلطة القرار

`AI_AUTHORITY = ADVISORY_ONLY`

- ChatGPT لا يملك Final Approval.
- Gemini لا يملك Final Approval.
- أي Verdict من AI هو توصية فقط.
- المستخدم يملك Full Override.
- اعتماد العميل النهائي، إذا كان المطلوب اعتماد عميل، يجب أن يكون له Evidence واضح.

## 4) Versioning إلزامي

كل محاولة أو نسخة تصميم مستقلة تأخذ Version ID:

`V1`, `V2`, `V3` ...

لكل Version سجّل:
- `version_id`
- `based_on_version`
- `created_from_asset_ids`
- `result_asset_id`
- `change_reason`
- `proposed_by`: USER | CHATGPT | GEMINI | CUSTOMER | MIXED
- `changes_applied`
- `customer_feedback`
- `chatgpt_opinion`
- `gemini_opinion`
- `version_status`: DRAFT | REVIEWED | NEEDS_CHANGE | SENT_TO_CUSTOMER | APPROVED | REJECTED | SUPERSEDED | FAILED_NO_RESULT
- `approval_evidence`

`FAILED_NO_RESULT` يستخدم عندما تم تشغيل محاولة لكن لم تنتج ملفًا/صورة قابلة للمراجعة، حتى لا نسجل فشل التنفيذ كنسخة ناجحة.

لا تستبدل نسخة قديمة بصمت. التاريخ يبقى محفوظًا.

## 5) اختلاف ChatGPT وGemini

إذا اختلف الرأيان:

- ممنوع حذف رأي طرف أو إعادة كتابة التاريخ كأن الاتفاق كان موجودًا.
- يسجل الخلاف في `DISAGREEMENTS.md` داخل غرفة الـCase.
- كل خلاف يأخذ `disagreement_id` مثل `D001`.
- يسجل:
  - موضوع الخلاف.
  - رأي ChatGPT.
  - رأي Gemini.
  - Evidence لكل رأي إن وجد.
  - حالة الخلاف: OPEN | RESOLVED.
  - القرار النهائي: USER_DECISION | CUSTOMER_EVIDENCE | UNRESOLVED.

إذا حسم المستخدم الخلاف، يحفظ قراره بدون حذف الرأيين الأصليين.

## 6) ملفات الغرفة القياسية

لكل Case مفتوحة يفضل وجود:

`ROOMS/YYYY/<CASE_ID>/`

وفيها:
- `STATUS.md`
- `CHATGPT.md`
- `GEMINI.md`
- `DECISION.md`
- `SYNC_LOG.md`
- `VERSIONS.md`
- `DISAGREEMENTS.md`
- `LESSONS.md`

## 7) Lessons Learned بعد الإغلاق

عند الوصول إلى `CLOSED`، أنشئ/حدّث `LESSONS.md`.

افصل بين:

### Case-specific
تعلم خاص بهذه الحالة أو العميل.

### Reusable
قاعدة قابلة لإعادة الاستخدام في حالات أخرى.

لكل Lesson سجّل:
- `lesson_id`
- `lesson_type`: CASE_SPECIFIC | REUSABLE
- `rule`
- `evidence_case_id`
- `evidence_version_id`
- `evidence_type`: CUSTOMER_APPROVAL | OWNER_DECISION | REPEATED_PATTERN | REJECTION
- `confidence`
- `promoted_to_global_rules`: YES | NO

لا ترفع قاعدة إلى Global Rule لمجرد اقتراح AI. يجب أن يكون لها Evidence مناسب، ويفضل اعتماد المستخدم عند كونها قاعدة مؤثرة.

## 8) Knowledge Extraction — إلزامي بعد الإغلاق

بعد حفظ `LESSONS.md` تبدأ مرحلة أعمق لتحويل الدرس إلى معرفة قابلة للاستدعاء عبر المشروع.

التسلسل:

`FINAL_APPROVED -> CLOSED -> PENDING_EXTRACTION -> CANDIDATES_CREATED -> VALIDATED/PROMOTED`

أو إذا لا يوجد شيء يستحق التعميم:

`CLOSED -> NO_REUSABLE_KNOWLEDGE`

المعرفة تحفظ في السجل المركزي:

`صندوق_مطبعجي/KNOWLEDGE/INDEX.md`

وتتبع العقد:

`صندوق_مطبعجي/SCHEMA/KNOWLEDGE_EXTRACTION_CONTRACT.md`

الفرق بين `LESSONS.md` وKnowledge Registry:

- `LESSONS.md` = ماذا تعلمنا من هذه Case تحديدًا.
- `KNOWLEDGE/INDEX.md` = ما الذي ثبت أنه يستحق أن تستخدمه حالات أخرى، وبأي Scope وEvidence.

لا يجوز اعتبار كل Lesson قاعدة عامة.

## 9) قياس النجاح مستقبلًا

احتفظ بما يسمح لاحقًا بقياس:
- عدد النسخ قبل الاعتماد.
- First-pass approval rate.
- أكثر أنواع التعديلات تكرارًا.
- اقتراحات ChatGPT التي نجحت.
- اقتراحات Gemini التي نجحت.
- حالات اختلاف الرأيين ومن كان أقرب للقرار النهائي.
- Patterns التي تقلل وقت التصميم والتعديلات.
- Knowledge Candidates الأكثر استخدامًا ونجاحًا.
- القواعد التي تم Supersede لها بسبب Evidence أحدث.

الهدف ليس تقييم النماذج لمجرد التقييم، بل تحسين سرعة وجودة إنتاج مطبعجي.

## 10) إعادة فتح Case

إذا أعيد فتح Case بعد الإغلاق:
- لا تنشئ Case ID جديدة لنفس الشغل.
- استخدم نفس Case ID.
- غيّر `case_phase` إلى `REOPENED` ثم إلى المرحلة المناسبة.
- سجّل `reopened_at` وسبب إعادة الفتح.
- ابدأ Version جديدة بعد آخر Version محفوظة.
- لا تمسح Lessons أو القرار القديم؛ أضف Timeline جديدًا.
- إذا ظهرت Evidence جديدة تناقض Knowledge مستخرجة قديمة، لا تمسح المعرفة القديمة بصمت؛ راجع Validation أو أنشئ Superseding Rule.

## 11) قاعدة الأمان

لا يجوز لأي Agent:
- اختراع اعتماد نهائي.
- تغيير مرحلة Case إلى FINAL_APPROVED بلا Evidence.
- إغلاق Case من نفسه.
- حذف نسخة مرفوضة من التاريخ.
- مسح خلاف بين ChatGPT وGemini.
- اعتبار رأي AI حقيقة عميل.
- تحويل Lesson إلى Global Rule بدون Evidence مناسب.
- رفع Confidence لمجرد تكرار رأي AI.

## 12) الهدف النهائي

كل Case ناجحة أو فاشلة يجب أن تزيد قيمة النظام بدل أن تختفي في الأرشيف.

الناتج المستهدف بمرور الوقت:

`Cases -> Evidence -> Lessons -> Validated Knowledge -> Better Next Case`

وهذا هو أساس "عقل مطبعجي المتراكم".
