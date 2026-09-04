# Matbagy Multi-AI Room Architecture

**Date:** 2026-09-04  
**Status:** APPROVED ARCHITECTURE / NOT YET IMPLEMENTED OR PRODUCTION-VERIFIED

## User direction

اعتمد المستخدم اتجاه إنشاء غرفة تواصل واحدة داخل منصة مطبعجي تضم ثلاثة أطراف ظاهرين في نفس السياق:

1. المستخدم / Owner.
2. ChatGPT.
3. Gemini.

الهدف ليس مجرد تشغيل نموذجين بشكل منفصل، بل تكوين فريق AI متعدد الأدوار يتشارك نفس Context وذاكرة التصميمات والصور، مع بقاء المستخدم طرفًا ثالثًا وصاحب القرار النهائي.

## Orchestration model

منصة مطبعجي هي الوسيط والـOrchestrator:

`User <-> Matbagy AI Orchestrator <-> ChatGPT`

`User <-> Matbagy AI Orchestrator <-> Gemini`

لا يعتمد التصميم على اتصال مباشر مستقل بين ChatGPT وGemini. الـOrchestrator هو الذي يمرر الرسائل، IDs، Context، ونتائج كل Agent للآخر عند الحاجة.

## Agent roles

### ChatGPT

`Design Orchestrator + Memory Manager + Workflow Planner + Final Synthesizer`

- يفهم طلب المستخدم.
- يسترجع ذاكرة صندوق مطبعجي والحالات والقواعد ذات الصلة.
- يدير Case ID / Order ID / Asset IDs / Version IDs.
- يدير Lifecycle وTimeline بدون مسح التاريخ.
- يحدد متى يحتاج Gemini لتحليل بصري أو مراجعة ثانية.
- يدمج تحليل Gemini مع الذاكرة وقواعد الطلب الحالي.
- يعرض الخلافات بدل إخفائها.
- يرجع للمستخدم قرارًا أو خطة موحدة.

### Gemini

`Visual Intelligence + Design Reviewer + Reference Comparator`

- يحلل الصور والمراجع.
- يقارن النسخ والتعديلات.
- يراجع layout/style/colors/composition.
- يفحص Must Keep / Must Avoid والحفاظ على الملامح والنصوص.
- ينفذ Visual QA وPrint/Cut QA عند الحاجة.
- يسجل رأيه كرأي مستقل وليس كحقيقة عميل أو قرار نهائي.

### User

- طرف كامل في نفس الغرفة.
- يملك الاعتماد النهائي وFull Override.
- يستطيع مخاطبة Agent واحد أو الاثنين.
- يستطيع إيقاف النقاش أو طلب جولة إضافية.

## AI authority

`AI_AUTHORITY = ADVISORY_ONLY`

لا ChatGPT ولا Gemini يملكان Final Approval أو صلاحية إغلاق Case من نفسيهما. أي Verdict من AI استشاري فقط. إذا كان Workflow يحتاج اعتماد عميل، يجب أن يكون له Evidence واضح.

## Truth separation

لا يجوز خلط:

- `CUSTOMER_FACT`
- `OWNER_DECISION`
- `CHATGPT_OPINION`
- `GEMINI_OPINION`
- `SYSTEM_STATE`
- `INFERRED`
- `UNKNOWN`

رأي AI لا يتحول إلى حقيقة أو قرار نهائي بدون Evidence أو قرار المستخدم.

## Case lifecycle

تم اعتماد مراحل واضحة لكل Design Case:

`OPEN -> UNDER_REVIEW -> REVISION_REQUIRED / WAITING_CUSTOMER_APPROVAL -> FINAL_APPROVED -> CLOSED`

وعند العودة لاحقًا:

`REOPENED`

المتابعة تظل نشطة حتى `CLOSED`، ويمكن إعادة فتح نفس Case ID بدون إعادة بناء التاريخ.

## Versioning

كل نسخة تصميم مستقلة أو محاولة لها Version ID ثابت:

`V1`, `V2`, `V3` ...

يجب الاحتفاظ لكل Version بـ:
- سبب التعديل.
- المصدر/من اقترحه.
- Assets المستخدمة والنتيجة.
- Feedback العميل.
- رأي ChatGPT.
- رأي Gemini.
- حالة النسخة.
- Evidence الاعتماد أو الرفض.

لا يتم overwrite لنسخة قديمة بصمت. حتى الفشل الذي لم ينتج ملفًا قابلاً للمراجعة يبقى كـ`FAILED_NO_RESULT`/negative learning.

## Disagreement preservation

إذا اختلف ChatGPT وGemini:

- لا يمسح أحد الرأيين.
- يسجل الخلاف داخل Case Room.
- كل رأي يحتفظ بـEvidence إن وجد.
- الحسم يكون من المستخدم أو Customer Evidence.
- نتيجة الحسم لا تعيد كتابة التاريخ وكأن الخلاف لم يوجد.

## Lessons learned

بعد إغلاق Case:

- يتم استخراج Lessons Learned.
- يفصل `CASE_SPECIFIC` عن `REUSABLE`.
- كل Lesson ترتبط بـCase ID وVersion ID وEvidence.
- لا تتحول Recommendation من AI وحدها إلى Global Rule.
- الرفض يبقى Negative Learning بدل حذفه.

هذا يسمح مستقبلًا بقياس:
- First-pass approval rate.
- عدد النسخ حتى الاعتماد.
- أكثر التعديلات تكرارًا.
- أي اقتراحات ChatGPT/Gemini كانت أقرب للقرار النهائي.
- Patterns التي تقلل وقت التصميم والتعديل.

## Target room modes

- `@GPT`: ChatGPT فقط.
- `@Gemini`: Gemini فقط.
- `@الكل` / `BOOM MODE`: الاثنين تحت تحكم Orchestrator.

Default BOOM flow:

`User -> ChatGPT -> Gemini (when visually useful) -> ChatGPT synthesis -> User`

## Anti-loop rule

لا يسمح بحوار AI-to-AI مفتوح بلا نهاية.

الحد الافتراضي المقترح: `3` جولات AI-to-AI لكل طلب مستخدم، ثم تعاد الكلمة للمستخدم أو يصدر ChatGPT خلاصة. يمكن للمستخدم طلب جولة إضافية صريحة.

## Shared IDs

عند التنفيذ، كل رسالة/جلسة يفضل أن تحمل:

- `room_id`
- `conversation_id`
- `message_id`
- `sender`
- `case_id` إن وجد
- `order_id` إن وجد
- `asset_ids` إن وجدت
- `version_id` إن وجد
- `reply_to_message_id`
- `created_at`

## Design memory and assets

ذاكرة التصميم الرسمية ليست ذاكرة أي Model منفردًا.

- Design memory / cases / rules: صندوق مطبعجي في `fawakhry/Matbagy-Design-Workflow`.
- Image assets: Google Drive عبر Case ID / Asset ID / Drive File ID.

العلاقة:

`Case ID -> Asset ID -> Google Drive File ID`

عقود التشغيل التفصيلية في مشروع مطبعجي تشمل:
- `SCHEMA/AI_ROOM_CONTRACT.md`
- `SCHEMA/CASE_LIFECYCLE_AND_LEARNING.md`

## Google Drive project-root rule — IMPLEMENTED

تم تنفيذ تنظيم فعلي لـGoogle Drive بحيث يظهر في My Drive فولدر رئيسي واحد فقط للمشروع:

`مشروع مطبعجي - Matbagy Project`

Project Root ID:

`1kP_JAO-ZOJltX9FCkAsylxYAfRar-RQV`

والشجرة المباشرة:

- `01_Design_Cases` — `1qhoxC_c2MF3X_hhHcWiDo2SzW2ySCch_`
- `02_Orders` — `19vhyOha215dLr5_pxv8BdZy_-sq7LgDm`
- `03_Shared_Assets` — `1cBMs21DKCuTPzcfmkj2UjgFfHdqQGVgl`
- `04_Archive` — `1kke5hm_Bsq1Q_XHEuTpOkTTRkjpMEz5K`
- `05_System` — `14amOaEUH4kGP4iFWTlMDfZ1c3c9edMH7`

الفولدر القديم `صندوق مطبعجي - الصور` لم يُنسخ. تم نقله وإعادة تسميته إلى `01_Design_Cases` مع الحفاظ على نفس Folder ID، وبالتالي ظلت Year/Case/File IDs الحالية صالحة.

المسار الرسمي:

`My Drive/مشروع مطبعجي - Matbagy Project/01_Design_Cases/YYYY/<CASE_ID>/`

الحالة الحالية `DESIGN-2026-000001` احتفظت بـ:
- year folder: `1AP68g1gP0S3fNNzgyOkithg3VfH4kEgE`
- case folder: `1uA9k8SLnq0s21C4K79-SlkDE2U8qXQrj`
- linked asset file: `1srMthjL-cR0cdk7VOOkMZjrEmUCWwFS-`

Canonical detail:

`docs/trendos/MATBAGY_DRIVE_PROJECT_STRUCTURE.md`

## TrendOS truth boundary

هذا القرار لا يغير D-012 أو سلطة TrendOS الحالية.

Live operational/financial facts مثل:
- Order state
- Payment
- Production status
- Inventory
- Delivery commitments

لا تأتي من ChatGPT أو Gemini memory. إذا احتاجت الغرفة هذه الحقائق، يتم جلبها من TrendOS live connectors/source-of-truth فقط.

## Security

- OpenAI/Gemini API keys يجب أن تبقى Server-side.
- لا توضع Secrets في browser/frontend أو في Prompt history.
- لا يتم تمرير Secrets بين Agents.
- صور العملاء تبقى في مخزن الصور المعتمد ولا تنسخ إلى GitHub العام.

## Chat-deletion resilience

الـChat UI ليس الذاكرة الدائمة. أي معلومة مهمة يجب أن persist في GitHub/Case Room قبل حذف المحادثة. إذا لم يتأكد Agent من نجاح الكتابة، لا يجوز له إعلان أن الشات آمن للحذف.

## Target infrastructure

المسار المعماري المستهدف:

`Matbagy UI -> Matbagy AI Orchestrator -> OpenAI API + Gemini API -> Matbagy Design Memory + Google Drive Assets`

Cloudflare مرشح مناسب لاستضافة Orchestrator مستقبلًا، لكن هذا مجرد Target Architecture حتى يتم تنفيذ واختبار Auth, routing, rate limits, cost controls, logging, privacy, failure/fallback behavior, and runtime verification.

## Production boundary

حتى تاريخ هذه الوثيقة:

- لا يوجد إثبات أن غرفة Multi-AI منشورة Production.
- لا يوجد API bridge ChatGPT<->Gemini مثبت Runtime.
- لا يوجد frontend room مثبت Runtime.
- لا يحدث أي تغيير على Apps Script/Sheets authoritative writes بسبب هذا القرار.
- لا يعاد فتح CORE-P0 أو Cloudflare production cutover تلقائيًا بسبب هذا القرار.

أي تنفيذ لاحق يجب أن يمر بخطة مستقلة وExpected/Actual/PASS|FAIL + rollback بما يتوافق مع قواعد الصندوق الأسود.
