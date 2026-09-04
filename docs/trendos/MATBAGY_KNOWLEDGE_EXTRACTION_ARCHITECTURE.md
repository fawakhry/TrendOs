# Matbagy Knowledge Extraction Architecture

**Date:** 2026-09-04  
**Status:** APPROVED ARCHITECTURE / MEMORY WORKFLOW ACTIVE / AUTOMATED ENGINE NOT YET PRODUCTION-VERIFIED

## User direction

تم اعتماد أن قيمة مطبعجي ليست في أرشفة الشاتات والتصميمات فقط، بل في تحويل الشغل الحقيقي المتراكم إلى معرفة قابلة لإعادة الاستخدام.

الهدف النهائي:

`Raw Work -> Evidence -> Case Memory -> Lessons -> Validated Knowledge -> Better Next Order/Design`

أي Case مغلقة يجب أن تكون مصدرًا محتملًا للتعلم، لكن ليس كل Case تنتج Global Rule.

## Core principle

الصندوق الأسود لترند مول يحتفظ بالحقيقة التنفيذية للمشروع، وصندوق مطبعجي يحتفظ بذاكرة التصميم والخبرة التفصيلية.

طبقة Knowledge Extraction تربط الخبرة السابقة بالمستقبل، بدون خلطها مع Live Facts.

### Matbagy design memory

- customer requests
- design chats
- images/references
- versions
- revisions
- approvals/rejections
- ChatGPT/Gemini opinions
- owner decisions
- lessons and knowledge candidates

### TrendOS live truth

- order status
- payment
- production status
- inventory
- delivery commitments
- operational/financial authoritative facts

Live facts تظل من TrendOS source-of-truth/connectors طبقًا لـD-012 ولا تتحول إلى AI memory truth.

## Knowledge pipeline

بعد اعتماد وإغلاق Design Case:

`FINAL_APPROVED -> CLOSED -> KNOWLEDGE_EXTRACTION -> CANDIDATES_CREATED -> REVIEW/VALIDATION -> PROMOTION`

أو:

`CLOSED -> NO_REUSABLE_KNOWLEDGE`

لا يتم اعتبار `CLOSED` مساويًا لـ`GLOBAL_KNOWLEDGE`.

## Knowledge status

- `NOT_READY`
- `PENDING_EXTRACTION`
- `CANDIDATES_CREATED`
- `REVIEW_REQUIRED`
- `VALIDATED`
- `PROMOTED`
- `NO_REUSABLE_KNOWLEDGE`

## Knowledge categories

المعرفة المستخرجة قد تشمل:

- Design rules.
- Product patterns.
- Customer-specific preferences.
- Visual patterns.
- Text/name rules.
- Print/cut rules.
- Failure/rejection patterns.
- Approval patterns.
- Workflow rules.
- Prompt patterns.

كل Knowledge يجب أن تحتفظ بـScope واضح حتى لا تتحول تفضيلات عميل واحد إلى قاعدة على كل العملاء.

## Evidence boundary

الـEvidence الأقوى:

`REPEATED CUSTOMER APPROVAL > SINGLE EXPLICIT CUSTOMER APPROVAL > OWNER DECISION > REPEATED OBSERVED PATTERN > SINGLE OBSERVED PATTERN > AI OPINION`

ChatGPT/Gemini opinions يمكن أن تنشئ Candidate، لكنها لا تكفي وحدها لتفعيل Global Rule.

## Future ingestion vision

المعمارية مهيأة تدريجيًا لاستقبال Evidence من:

1. ChatGPT design conversations.
2. Gemini reviews.
3. WhatsApp customer conversations and proof approvals بعد ربط مصرح به.
4. Design files stored on local work computers بعد ingestion/indexing منظم.
5. Google Drive design assets.
6. TrendOS Order context عبر connectors موثوقة.

كل مصدر يجب أن يحتفظ بـ`source_type`, IDs, timestamps/evidence، ولا يتم دمج مصادر مختلفة اعتمادًا على اسم عميل أو Filename فقط.

## Cross-system linking

المفاتيح الحالية:

- `Case ID`: Design memory key.
- `Order ID`: TrendOS order key عندما يكون معروفًا.
- `Asset ID`: image/design asset key.
- `Version ID`: design attempt/version key.
- `Knowledge ID`: extracted knowledge key.

العلاقة المستهدفة:

`Order ID <-> Case ID <-> Version ID <-> Asset ID <-> Knowledge ID`

مع السماح بأن يكون Order ID غير معروف في Design Case قديمة دون اختراع قيمة.

## Privacy

- صور العملاء لا توضع في GitHub العام.
- GitHub يحتفظ بالmetadata والقواعد والـEvidence references.
- الملفات المرئية تبقى في storage خاص/Google Drive المعتمد.
- Customer-only knowledge لا تطبق على عميل آخر.
- مستقبلًا يجب تطبيق tenant isolation قبل أي منتج متعدد المطابع.

## AI authority

`AI_AUTHORITY = ADVISORY_ONLY`

AI يمكنه:
- اقتراح Knowledge Candidate.
- ربط Evidence.
- اكتشاف repeated patterns.
- اقتراح promotion/rejection.

AI لا يملك:
- اختراع Evidence.
- ترقية قاعدة عامة حساسة بدون شروط العقد.
- تغيير live operational truth.
- إغلاق Case أو اعتماد تصميم نهائي من نفسه.

## Current implementation state

في `fawakhry/Matbagy-Design-Workflow` على `agent/initial-mvp` تم تثبيت:

- `صندوق_مطبعجي/SCHEMA/KNOWLEDGE_EXTRACTION_CONTRACT.md`
- `صندوق_مطبعجي/KNOWLEDGE/INDEX.md`
- دمج `knowledge_status` ودورة الاستخراج في `CASE_LIFECYCLE_AND_LEARNING.md`.

الحالة القديمة `DESIGN-2026-000001` ما زالت مفتوحة، لذلك `knowledge_status: NOT_READY` ولا توجد Knowledge معتمدة مخترعة منها.

## Future engine

لاحقًا يمكن نقل السجل من Markdown-only إلى searchable structured storage/index مثل D1 + embeddings، مع بقاء Evidence lineage وGitHub protocol كمرجع حوكمة.

Hybrid retrieval المقترح مستقبلًا:

`customer scope > product > dimensions > approved knowledge > semantic similarity > visual similarity > recency`

لكن أي Vector/AI search لا يلغي التحقق من Scope وEvidence.

## Production boundary

هذه المعمارية لا تعني أن WhatsApp ingestion أو local-PC indexing أو Knowledge DB أو automated promotion قد تم نشرها Production.

كل Integration له مسار تنفيذ واختبار وPrivacy/Auth مستقل قبل اعتباره Runtime Verified.
