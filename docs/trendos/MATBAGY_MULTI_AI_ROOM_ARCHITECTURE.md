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
- يدير Case ID / Order ID / Asset IDs.
- يحدد متى يحتاج Gemini لتحليل بصري أو مراجعة ثانية.
- يدمج تحليل Gemini مع الذاكرة وقواعد الطلب الحالي.
- يرجع للمستخدم قرارًا أو خطة موحدة.

### Gemini

`Visual Intelligence + Design Reviewer + Reference Comparator`

- يحلل الصور والمراجع.
- يقارن النسخ والتعديلات.
- يراجع layout/style/colors/composition.
- يفحص Must Keep / Must Avoid والحفاظ على الملامح والنصوص.
- ينفذ Visual QA وPrint/Cut QA عند الحاجة.

### User

- طرف كامل في نفس الغرفة.
- يملك الاعتماد النهائي.
- يستطيع مخاطبة Agent واحد أو الاثنين.
- يستطيع إيقاف النقاش أو طلب جولة إضافية.

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
- `reply_to_message_id`
- `created_at`

## Design memory and assets

ذاكرة التصميم الرسمية ليست ذاكرة أي Model منفردًا.

- Design memory / cases / rules: صندوق مطبعجي في `fawakhry/Matbagy-Design-Workflow`.
- Image assets: Google Drive عبر Case ID / Asset ID / Drive File ID.

العلاقة:

`Case ID -> Asset ID -> Google Drive File ID`

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
