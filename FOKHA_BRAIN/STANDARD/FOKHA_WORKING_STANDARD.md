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
| STD-009 | المستخدم يقول: ادخل عقل فوخا / روح على عقل فوخا، أو يتم استخراج معرفة جديدة من أي شات أو مصدر | ابدأ القراءة من GitHub عقل فوخا أولًا. بعد الاستخراج، اكتب الناتج فورًا في Google Drive داخل `Fokha - Idea Inbox` حسب نوعه، ثم اترك GitHub للمزامنة المنظمة لاحقًا. | GitHub read path + Google Drive immediate write path | GitHub = نقطة الدخول والسياق المنظم؛ Google Drive = أول مكان تُكتب فيه المعرفة المستخرجة الجديدة؛ Project Black Box يظل مصدر الحقيقة الخاص بالمشروع. | لا تُرقّى المعرفة إلى GitHub stable memory إلا بعد تنظيمها وربطها بالمصدر والـID وعدم إنشاء duplicate. | User-approved operating rule | Active |
| STD-010 | المستخدم يقول: حدّث عقل فوخا من كل المحادثات والمشاريع | ابدأ من GitHub FOKHA_BRAIN، ثم افحص كل السياق التاريخي المتاح فعليًا، ChatGPT Library، والـGitHub repositories/ذاكرات المشاريع ذات الصلة. استخرج الجديد فقط، اكتب أولًا إلى Google Drive مع provenance/IDs، ثم زامن المعرفة المنظمة غير الحساسة إلى GitHub. | Google Drive Working Memory -> GitHub FOKHA_BRAIN | لا تدّعِ تغطية كل رسالة حرفيًا إذا لم تكن قابلة للوصول؛ سجّل Coverage ومصادر الفحص، وابقِ Project Truth داخل مصدره canonical. | Promote only deduped, sourced, scoped knowledge; sensitive/private data stays out of public GitHub. | User-approved operating workflow | Active |

## قاعدة التنفيذ السريعة

- عند قول المستخدم `سجل فكرة`: لا تسأل أين تُحفظ؛ التقط أولًا في Google Drive Working Memory، ثم اربط وصنّف.
- عند قول المستخدم `ادخل عقل فوخا`: **GitHub أولًا دائمًا** لقراءة السياق، الستاندرد، الذاكرة، وروابط المشاريع.
- بعد أي استخراج جديد من Chat / GitHub / Drive / File / Project: اكتب الناتج فورًا إلى Google Drive في التاب المناسب قبل اعتبار الاستخراج مكتملًا.
- التوجيه الحالي للأنواع:
  - فكرة خام -> `INBOX`
  - قرار صريح -> `DECISIONS`
  - قاعدة -> `RULES`
  - نمط تفكير -> `THINKING_MODEL`
  - مشروع/تحديث مشروع -> `PROJECTS`
  - مصدر/رابط -> `SOURCE_LINKS`
  - معرفة مستقرة قابلة لإعادة الاستخدام -> `KNOWLEDGE`
  - فشل/خطر/ما يجب تجنبه -> `NEGATIVE_LEARNING`
- GitHub لا يستقبل كل لقطة خام؛ تتم مزامنته كطبقة معرفة منظمة ومستقرة بدون duplication.
- Bulk history ingest لا يعني افتراض الوصول إلى كل تاريخ الحساب؛ اذكر ما تم فحصه فعليًا، وما لم يتوفر يبقى خارج ادعاء التغطية.
- لا تنقل Secrets أو Credentials أو بيانات شخصية حساسة إلى FOKHA_BRAIN العام.
- إذا كان Google Drive غير متاح أو غير مصرح به، لا تدّع أن الكتابة تمت؛ أخرج payload منظمًا وعلّمه `PENDING_DRIVE_WRITE`.