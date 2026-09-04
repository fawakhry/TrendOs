# Fokha Working Standard

> Source: Google Sheet `Fokha - Idea Inbox` / tab `FOKHA_STANDARD`.
> Synced: 2026-09-04.

| Standard ID | Trigger / Situation | Required Action | Destination | Linking Rule | Promotion Rule | Authority | Status |
|---|---|---|---|---|---|---|---|
| STD-001 | المستخدم يقول: سجل فكرة | سجل الكلام فورًا بأقل احتكاك، مع الحفاظ على الفكرة الأصلية. | INBOX | أنشئ Idea ID واربط بالمشروع إن كان معروفًا؛ لا توقف الالتقاط بسبب نقص التصنيف. | لا تتحول لقرار/قاعدة إلا بعد دليل أو تأكيد مناسب. | User | Active |
| STD-002 | المستخدم يقول: سجل قرار | سجل القرار والسياق والسبب والمشروع والحالة. | DECISIONS | اربط القرار بالأفكار والقواعد والمصادر ذات الصلة. | Confirmed إذا كان قرار المستخدم صريحًا؛ وإلا Candidate. | User | Active |
| STD-003 | ظهور نمط متكرر في قرارات المستخدم | استخرج Thinking Principle مع Evidence Source وConfidence. | THINKING_MODEL / RULES | لا تستنتج سمة شخصية عامة بدون أمثلة أو قرارات داعمة. | يرتفع Confidence مع تكرار الأدلة عبر مشاريع مختلفة. | Evidence-based | Active |
| STD-004 | فكرة/قاعدة تخص مشروعًا معينًا | احتفظ بالحقيقة التفصيلية داخل ذاكرة المشروع، وضع في Fokha الرابط والخلاصة القابلة لإعادة الاستخدام فقط. | PROJECTS + SOURCE_LINKS | Link, don't duplicate source-of-truth. | ترقية الخلاصة العامة فقط إذا كانت تتجاوز مشروعًا واحدًا أو تعبّر عن طريقة الإدارة. | Source of Truth | Active |
| STD-005 | بدء عمل على مشروع موجود | اقرأ مصدر الذاكرة canonical للمشروع قبل التنفيذ. | Project source | استخدم SOURCE_LINKS لتحديد نقطة الدخول الصحيحة. | لا تطلب إعادة معلومات موثقة إذا كانت قابلة للاسترجاع. | Canonical memory | Active |
| STD-006 | تعارض بين معلومتين | طبّق Evidence Hierarchy وسجل التعارض بدل اختراع تسوية. | Relevant project memory / Fokha | `LATEST VERIFIED > EARLIER VERIFIED > DEPLOYED > TESTED > IMPLEMENTED > PREPARED > PLANNED > UNKNOWN` | لا تمسح التاريخ السابق؛ supersede مع traceability. | Evidence | Active |
| STD-007 | AI يقترح قاعدة أو قرارًا | سجله Candidate لا Confirmed ما لم يعتمد المستخدم أو توجد قاعدة اعتماد موثقة. | RULES / DECISIONS | احتفظ بمصدر الاقتراح والدليل. | AI opinion وحده لا يصبح Global Rule. | AI advisory only | Active |
| STD-008 | إنشاء Fokha GitHub repo لاحقًا | اجعله الذاكرة التنفيذية الطويلة المدى لفوخا، مع بقاء Google Sheet بوابة Capture سريعة. | GitHub + Google Sheet | نقل منظم بالمفاتيح IDs والمصادر، لا نسخ عشوائي. | GitHub يصبح canonical للمعرفة المستقرة، والشيت Inbox/working memory. | User-approved architecture | Pending GitHub repo |

## قاعدة التنفيذ السريعة

عند قول المستخدم `سجل فكرة` لا تسأل أين تُحفظ؛ التقط أولًا في Working Memory، ثم اربط وصنّف. عند توفر Fokha repo الخاص، تتم مزامنة المعرفة المستقرة إليه دون إلغاء طبقة الالتقاط السريع.
