# Fokha Thinking Model

> Source: Google Sheet `Fokha - Idea Inbox` / tab `THINKING_MODEL` + cross-project evidence.
> Synced: 2026-09-04.

هذا الملف لا يدّعي وصف شخصية المستخدم بشكل مطلق. هو نموذج تشغيلي مبني على قرارات وأدلة حتى الآن، ويجب تحديثه عندما يظهر دليل أقوى أو أحدث.

| Model ID | Dimension | Principle | How It Shows Up | Decision Behavior | Evidence Source | Scope | Confidence | Status |
|---|---|---|---|---|---|---|---|---|
| TM-001 | Systems Thinking | ابنِ منظومة واحدة مترابطة بدل جزر منفصلة. | يربط المشاريع والوحدات والبيانات والمصادر ببعضها بمفاتيح واضحة. | يفضل الحل الذي يقلل الازدواجية ويقوي التكامل. | TrendOS D-001 + Architecture | Business / Architecture | High | Active |
| TM-002 | Fast Capture | التقاط الفكرة فور ظهورها أهم من تنظيمها في نفس اللحظة. | يستخدم Inbox سريع ثم يترك التصنيف والربط للمرحلة التالية. | يقلل الاحتكاك عند تسجيل الأفكار. | User direction + RULE-001 | Personal Workflow | High | Active |
| TM-003 | Evidence First | أحدث دليل متحقق يتغلب على الافتراض والخطة والذاكرة القديمة. | يفصل Planned / Prepared / Implemented / Tested / Deployed / Verified. | لا يعتبر CI أو النشر نجاحًا نهائيًا بدون Runtime Evidence. | TrendOS black box + Project Memory | Decision / Evidence | High | Active |
| TM-004 | Integrity Before Speed | الدقة ونزاهة البيانات والأمان تسبق تحسين السرعة. | Locks, idempotency, source-of-truth and rollback foundations. | يرفض تحسين أداء يضعف الصلاحيات أو سلامة البيانات. | TrendOS D-008 + integrity code | Execution | High | Active |
| TM-005 | Automation Bias | قلّل التدخل اليدوي كلما أمكن، لكن لا تضحِّ بالتحقق والسيطرة. | Feature flags, workflows, staged activation. | يقبل أتمتة قوية عندما تكون قابلة للتحقق والرجوع. | TrendOS workflows + deployment model | Automation | High | Active |
| TM-006 | Traceability | كل شيء مهم يحتاج ID ثابت وعلاقة قابلة للتتبع. | Order ID / Line ID / Case ID / Asset ID / Knowledge ID. | يفضل lineage واضحة لأصل القرار والفكرة والبيانات. | TrendOS identifiers + knowledge extraction | Linking / Data | High | Active |
| TM-007 | AI Authority Boundary | الـAI مساعد ومدير معرفة واقتراح، وليس مصدر الحقيقة الحية. | يفصل AI memory عن order/payment/stock/status facts. | يرفض اختراع سعر أو حالة أو موافقة أو دفع غير موثق. | TrendOS D-011 / D-012 | AI Governance | High | Active |
| TM-008 | Preserve History | لا تمسح التاريخ الصحيح أو الفشل؛ حافظ عليه واستخرج منه التعلم. | Audit trail + negative learning + superseding. | يفضل نسخة أحدث موثقة مع بقاء الأصل. | Black box + knowledge architecture | Memory | High | Active |
| TM-009 | Controlled Activation | التجهيز والتثبيت والتفعيل والتحقق مراحل منفصلة. | Feature flags, preview, checkpoints, rollback. | يفضل تفعيلًا تدريجيًا بدل cutover واسع. | TrendOS Integrity deployment model | Execution Safety | High | Active |
| TM-010 | Cumulative Learning | الشغل المنتهي لازم يقدر يعلّم الشغل القادم. | Raw Work -> Evidence -> Lessons -> Knowledge Candidates -> Validated Knowledge. | لا يعمم قاعدة من تجربة واحدة بدون Scope/Evidence كافٍ. | MATBAGY_KNOWLEDGE_EXTRACTION_ARCHITECTURE | Learning | High | Active |
| TM-011 | Owner Final Authority | المستخدم هو صاحب القرار النهائي، والـAI يرفع له ما يستحق تدخله. | AI يحلل ويراجع ويجمع، والاعتماد النهائي للمالك. | يفوض التنفيذ والتحليل مع الاحتفاظ ببوابات القرارات الجوهرية. | Matbagy Multi-AI Room architecture | Executive Governance | High | Active |
| TM-012 | Patch-Oriented Execution | طوّر النظام القائم بدل كسره؛ افهم الواقع أولًا ثم غيّر أقل مساحة لازمة. | يتكرر في TrendOS وMatbagy وVOKHA: inspect -> patch -> test -> rollback. | يميل للحفاظ على التشغيل اليومي وتقليل blast radius. | Cross-project docs and code instructions | Execution | High | Active |
| TM-013 | Operator-First Simplicity | النظام الناجح يجب أن يكون سهلًا لفريق التشغيل غير التقني ويخفي التعقيد غير الضروري. | Arabic RTL, role-specific screens, fewer manual steps, direct workflows. | يفضل UX يقلل التدريب والأخطاء والتدخل الإداري. | TrendOS Codex book + EasyStore/Matbagy interfaces | Operations / UX | High | Active |
| TM-014 | Practical Cost Consciousness | عند تساوي البدائل، الأولوية للحل العملي الأقل تكلفة والأسهل في التشغيل والصيانة. | يظهر في VOKHA ومشاريع MVP والاعتماد على مراحل مجانية/محلية قبل التوسع. | يفضل إثبات القيمة تدريجيًا قبل الالتزام ببنية أو تكلفة أكبر. | VOKHA prompts + repeated project choices | Product / Technical Strategy | Medium | Active |
| TM-015 | Pilot-First Expansion | ابدأ بجزء صغير قابل للاختبار ووسّع بعد نجاحه بدل محاولة بناء الرؤية كلها مرة واحدة. | VOKHA city pilot, staged TrendOS cutover, feature flags and gradual activation. | يقسم الرؤية الكبيرة إلى بوابات تحقق متتابعة. | VOKHA + TrendOS deployment evidence | Product / Rollout | High | Active |

## قاعدة التحديث

- Explicit user decisions أقوى من inference.
- تكرار النمط عبر أكثر من مشروع يرفع الثقة.
- أي تعارض جديد يُسجّل ولا يُطمس.
- `MEDIUM` لا تتحول تلقائيًا إلى `HIGH` إلا بدليل إضافي أو اعتماد صريح.