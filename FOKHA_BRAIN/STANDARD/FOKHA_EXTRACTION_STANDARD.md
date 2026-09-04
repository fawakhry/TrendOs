# Fokha Extraction Standard

## Purpose

هذا الـStandard يحكم كيف يتحول أي مصدر خام إلى معرفة قابلة للاستخدام داخل عقل فوخا بدون خلط الحقيقة بالاستنتاج، وبدون تكرار مصادر الحقيقة الخاصة بالمشاريع.

## 1. Capture first

أي فكرة أو معلومة مهمة يتم التقاطها أولًا حتى لو كانت خامًا، ثم تنظيمها لاحقًا.

## 2. Source before interpretation

لا تُسجل قاعدة أو حقيقة بدون الاحتفاظ بمصدرها متى كان متاحًا.

## 3. Explicit beats inferred

الترتيب الافتراضي:

`EXPLICIT_USER > VERIFIED_SOURCE > INFERRED_PATTERN > AI_SUGGESTION`

الـAI لا يحول استنتاجه إلى قرار مستخدم.

## 4. Project scope before global scope

أي معرفة ظهرت داخل مشروع تبدأ كـ`PROJECT_ONLY` ما لم يوجد دليل كافٍ أنها قاعدة عامة تخص طريقة تفكير المستخدم أو إدارة أعماله عبر المشاريع.

## 5. Stable IDs

كل عنصر مهم يجب أن يحصل على ID ثابت عند دخوله السجل المنظم.

أمثلة:
- `IDEA-*`
- `DEC-*`
- `RULE-*`
- `KNOW-*`
- `TM-*`
- Project-specific IDs as defined by each project.

## 6. No duplicate truth

عقل فوخا لا يصبح نسخة ثانية من Live Operational Data.

- حقائق TrendOS الحية تبقى في TrendOS source-of-truth.
- عقل فوخا يخزن reference + meaning + lessons + links، وليس نسخة غير مضمونة من الحالة الحية.

## 7. Preserve history

لا تحذف عنصرًا قديمًا صحيحًا لمجرد وجود نسخة أحدث.

استخدم:
- superseded by
- replaced by
- deprecated
- invalidated by evidence

مع بقاء الأصل قابلًا للتتبع.

## 8. Evidence hierarchy

عند التعارض:

`LATEST VERIFIED > EARLIER VERIFIED > DEPLOYED > TESTED > IMPLEMENTED > PREPARED > PLANNED > UNKNOWN`

## 9. Promotion rule

لا تتحول المعرفة إلى `FOKHA_GLOBAL` إلا إذا كانت:

- تصريح مستخدم عام، أو
- نمطًا متكررًا عبر أكثر من حالة/مشروع، أو
- قاعدة إدارة مثبتة بوضوح.

غير ذلك تظل Candidate أو Project-only.

## 10. Negative learning

الفشل، الرفض، regression، والطرق التي لم تنجح تُحفظ كمعرفة سلبية قابلة للاستفادة ولا يتم تنظيفها من الذاكرة.

## 11. Useful over verbose

الهدف هو استخراج ما يساعد على قرار أو تنفيذ أو ربط أو تعلم لاحق، وليس تخزين نسخ طويلة من المصدر بدون قيمة إضافية.

## 12. Update behavior

عند كل استخراج جديد:

1. ابحث عن عنصر موجود له نفس المعنى.
2. إذا كان نفسه: حدّث evidence / confidence / last_updated بدل إنشاء duplicate.
3. إذا تعارض: لا تمسح القديم؛ سجل conflict ثم طبّق evidence hierarchy.
4. إذا كان جديدًا: أنشئ ID جديدًا واربطه بالمصدر والمشروع.

## 13. Security

لا تحفظ passwords, API keys, secrets, private tokens أو بيانات اعتماد حساسة داخل ملفات عقل فوخا.

يمكن حفظ اسم السر أو الغرض منه فقط عندما يكون ذلك مفيدًا معماريًا.

## 14. Destination routing

بعد الاستخراج، كل عنصر يذهب إلى واحد أو أكثر من:

- Global Thinking Model
- Rules
- Decisions
- Ideas Inbox
- Projects Index / Project link
- Knowledge Candidates
- Negative Learning
- Data References
- Project-specific Black Box / Memory

## 15. Chat behavior

عندما يُطلب من أي Chat: **«روح على GitHub عقل فوخا»**:

- يبدأ من `FOKHA_BRAIN/اقرأني_أولا.md`.
- لا يطلب من المستخدم إعادة شرح ما هو موثق ويمكن قراءته.
- ينفذ الاستخراج وفق البرومبت الرسمي.
- يذكر بوضوح ما هو صريح وما هو مستنتج.
