# Knowledge Extraction Contract — صندوق مطبعجي

> **SaaS tenancy:** Knowledge تنقسم إلى `GLOBAL_PLATFORM` و`TENANT_PRIVATE`. أي Knowledge مستخرجة من Customer/tenant evidence تظل Private افتراضيًا، ولا تُرقّى إلى Global إلا بعقد Promotion يزيل البيانات الخاصة. راجع `TENANCY_CONTRACT.md`.

> الهدف: تحويل الحالات المغلقة من مجرد أرشيف إلى معرفة متراكمة قابلة لإعادة الاستخدام، مع الحفاظ على الدليل وعدم تحويل رأي AI إلى حقيقة.

## الحالة المعمارية

`APPROVED / ACTIVE_FOR_MEMORY_WORKFLOW`

هذا العقد يحدد طريقة استخراج المعرفة من الـCases. لا يعني وحده وجود Engine أو Vector DB منشور Production.

## 1) المبدأ

كل Design Case تمر بثلاث طبقات:

`RAW EVIDENCE -> CASE MEMORY -> KNOWLEDGE`

- `RAW EVIDENCE`: كلام العميل، الصور، المراجع، النسخ، التعديلات، القبول والرفض.
- `CASE MEMORY`: سجل الحالة الكامل والـVersions والقرارات والآراء.
- `KNOWLEDGE`: القواعد والأنماط المستخلصة التي يمكن أن تفيد حالات أخرى.

لا يجوز القفز من Raw Evidence إلى Global Rule بدون Case/Evidence واضح.

## 2) توقيت الاستخراج

بعد وصول Case إلى `CLOSED` يبدأ إجراء مستقل:

`KNOWLEDGE_EXTRACTION`

الحقل:

`knowledge_status`

القيم:
- `NOT_READY`: الـCase ما زالت مفتوحة أو لا يوجد Evidence كافٍ.
- `PENDING_EXTRACTION`: الـCase مغلقة وتنتظر استخراج المعرفة.
- `CANDIDATES_CREATED`: تم إنشاء Knowledge Candidates.
- `REVIEW_REQUIRED`: توجد قواعد تحتاج مراجعة المستخدم/دليل إضافي.
- `VALIDATED`: تم اعتماد المعرفة كمعرفة موثوقة.
- `PROMOTED`: تم إدخال المعرفة في سجل القواعد النشطة.
- `NO_REUSABLE_KNOWLEDGE`: الحالة أغلقت لكن لا يوجد شيء يستحق التعميم.

إغلاق الـCase لا يعني تلقائيًا أن كل ما فيها قابل للتعميم.

## 3) أنواع المعرفة

كل Knowledge Candidate يأخذ `knowledge_type` من أحد الأنواع:

- `DESIGN_RULE`: قاعدة تصميم قابلة للتكرار.
- `PRODUCT_PATTERN`: نمط خاص بمنتج/مقاس/تكوين.
- `CUSTOMER_PREFERENCE`: تفضيل خاص بعميل مؤكد فقط.
- `VISUAL_PATTERN`: نمط بصري ناجح.
- `TEXT_RULE`: قاعدة تخص النصوص/الأسماء/الصياغة.
- `PRINT_RULE`: قاعدة تجهيز للطباعة.
- `CUT_RULE`: قاعدة قص/استروك.
- `FAILURE_PATTERN`: خطأ أو مسار فشل يجب تجنبه.
- `REJECTION_PATTERN`: شيء رفضه العميل ويستخدم كـNegative Learning.
- `APPROVAL_PATTERN`: شيء ساهم في الاعتماد.
- `WORKFLOW_RULE`: قاعدة تخص سير العمل والمراجعة.
- `PROMPT_PATTERN`: تعليمات/Prompt أثبتت فائدتها مع Evidence.
- `UNKNOWN`: لا يصنف بوضوح بعد.

## 4) معرف المعرفة

كل Candidate مستقل يأخذ معرفًا ثابتًا عند الحفظ:

`KNOW-YYYY-NNNNNN`

لا يعتمد على اسم العميل أو اسم الملف.

يرتبط دائمًا بـ:
- `source_case_id`
- `source_version_id` إن وجد
- `source_asset_ids` إن وجدت
- `evidence_type`

## 5) حقول Knowledge Candidate

لكل Candidate سجّل:

- `knowledge_id`
- `knowledge_type`
- `rule_or_pattern`
- `scope`: CASE_ONLY | CUSTOMER_ONLY | PRODUCT | GLOBAL_CANDIDATE
- `source_case_id`
- `source_version_id`
- `source_asset_ids`
- `evidence_type`
- `evidence_summary`
- `positive_or_negative`: POSITIVE | NEGATIVE | MIXED
- `proposed_by`: CHATGPT | GEMINI | USER | SYSTEM | MIXED
- `validation_status`: PROPOSED | NEEDS_REVIEW | VALIDATED | REJECTED | SUPERSEDED
- `confidence`
- `owner_approval`: YES | NO | NOT_REQUIRED | PENDING
- `created_at`
- `last_validated_at`

## 6) Evidence hierarchy للمعرفة

ترتيب القوة:

`REPEATED CUSTOMER APPROVAL > SINGLE EXPLICIT CUSTOMER APPROVAL > OWNER DECISION > REPEATED OBSERVED PATTERN > SINGLE OBSERVED PATTERN > AI OPINION`

رأي ChatGPT أو Gemini وحده لا يكفي لتحويل Candidate إلى Global Rule.

## 7) التعميم الآمن

### Customer-only
إذا كانت القاعدة تخص عميلًا محددًا:

`scope: CUSTOMER_ONLY`

لا تطبق على عميل آخر.

### Product rule
إذا كانت القاعدة تخص منتجًا/مقاسًا:

`scope: PRODUCT`

تطبق فقط عند مطابقة المنتج/المقاس/القيود.

### Global candidate
لا تصبح قاعدة عامة إلا بعد Evidence مناسب أو اعتماد المستخدم.

`GLOBAL_CANDIDATE != GLOBAL_ACTIVE`

## 8) Negative Learning

المرفوض والفاشل لا يحذف.

يتم حفظه كأحد:
- `FAILURE_PATTERN`
- `REJECTION_PATTERN`

ويستخدم لمنع تكرار نفس الخطأ، وليس كنموذج إيجابي.

## 9) Knowledge Registry

المسار الرسمي لسجل المعرفة:

`صندوق_مطبعجي/KNOWLEDGE/INDEX.md`

السجل لا يحتوي صور العملاء. يحتفظ بالـmetadata والقاعدة وEvidence references فقط.

الصور تظل في Google Drive وترتبط عبر Asset IDs عند الحاجة.

## 10) الاستدعاء في شغل جديد

عند Case جديدة:

1. افهم طلب العميل الحالي أولًا.
2. استرجع Knowledge مرتبطة بالمنتج/المقاس/العميل/التكوين.
3. أولوية طلب العميل الحالي أعلى من أي قاعدة قديمة.
4. استخدم Positive Knowledge لاقتراح أفضل بداية.
5. استخدم Negative Knowledge لتجنب الأخطاء المتكررة.
6. اعرض أي تعارض مهم بدل تطبيق قاعدة قديمة بصمت.

## 11) التعلم المتراكم

عند تكرار نفس Candidate في Cases متعددة:

- أضف Evidence references جديدة بدل إنشاء قواعد مكررة إن كانت المعنى نفسه.
- ارفع `confidence` فقط بناءً على Evidence، لا على عدد مرات تكرار رأي AI.
- عند تعارض Evidence جديد مع قاعدة قديمة، لا تمسح القديمة؛ غيّر حالتها أو أنشئ superseding rule مع تاريخ واضح.

## 12) مصادر مستقبلية

المعمارية مصممة لاستقبال المعرفة مستقبلًا من:
- ChatGPT design chats.
- WhatsApp customer conversations بعد الربط المصرح به.
- Design proofs and approvals.
- ملفات التصميم الموجودة على أجهزة العمل بعد ingestion منظم.
- TrendOS Order context عبر source-of-truth connectors.

لكن كل مصدر يجب أن يحتفظ بـ`source_type` وEvidence ولا يختلط مع غيره بلا ربط موثوق.

## 13) حدود TrendOS

المعرفة المستخلصة تساعد القرار والتصميم، لكنها ليست مصدر الحقائق التشغيلية الحية.

Order/Payment/Production/Inventory/Delivery live facts تظل من TrendOS source-of-truth.

## 14) قاعدة الإغلاق

لا تعتبر Case مكتملة معرفيًا لمجرد `CLOSED`.

التسلسل الأفضل:

`FINAL_APPROVED -> CLOSED -> KNOWLEDGE_EXTRACTION -> CANDIDATES -> VALIDATION -> PROMOTION`

إذا لا يوجد شيء قابل للتعميم:

`knowledge_status: NO_REUSABLE_KNOWLEDGE`

## 15) هدف المنظومة

الهدف النهائي ليس حفظ الشغل القديم فقط، بل تكوين "عقل مطبعجي المتراكم":

- يعرف ما الذي ينجح غالبًا.
- يعرف ما الذي يرفض غالبًا.
- يبدأ الشغل الجديد من خبرة سابقة موثقة.
- يقلل عدد التعديلات والزمن والتكلفة.
- يظل قادرًا على تفسير كل قاعدة: من أي Case جاءت ولماذا نثق بها.
