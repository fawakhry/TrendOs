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
| STD-011 | TrendOS أو محادثته/مسار عمله يبدو متوقفًا أو لا يتقدم | ابدأ من الصندوق الأسود وآخر Verified checkpoint/Execution Ledger، حدّد سبب التوقف من الأدلة، ثم نفّذ أو استأنف أكثر خطوة آمنة ومفيدة متاحة بالأدوات الحالية. يجوز اتخاذ قرار روتيني منخفض المخاطر وقابل للرجوع بدون انتظار المستخدم، مع تسجيل Expected/Actual/PASS\|FAIL وRollback عند التغيير المؤثر. | TrendOS canonical project memory + available execution tools + Fokha working memory | لا تتجاوز Project Source of Truth أو الصلاحيات. لا تعتبر محادثة صامتة وحدها دليلًا على فشل؛ افحص آخر Evidence أولًا. | Autonomous execution only for routine, reversible, low-risk actions. Escalate irreversible/high-impact/destructive/financial/security/authority-changing decisions unless specifically pre-authorized. | Explicit user delegation DEC-20260904-004 | Active |

## قاعدة التنفيذ السريعة

- عند قول المستخدم `سجل فكرة`: لا تسأل أين تُحفظ؛ التقط أولًا في Google Drive Working Memory، ثم اربط وصنّف.
- عند قول المستخدم `ادخل عقل فوخا`: **GitHub أولًا دائمًا** لقراءة السياق، الستاندرد، الذاكرة، وروابط المشاريع.
- TrendOS هو الأولوية التنفيذية الحالية: قبل التحرك فيه اقرأ الصندوق الأسود وآخر Verified Evidence.
- إذا ظهر أن TrendOS متوقف: شخّص أولًا، ثم استأنف تلقائيًا إذا كانت الخطوة متاحة، آمنة، منخفضة المخاطر وقابلة للرجوع.
- لا تنتظر المستخدم لقرارات تشغيلية صغيرة واضحة، لكن لا تتخذ قرارًا جوهريًا/غير قابل للرجوع/مالي الالتزام/أمني حساس/هدام/مغيرًا للسلطات بدون موافقته إلا إذا كانت هناك قاعدة مسبقة صريحة تسمح بذلك.
- بعد أي استخراج جديد من Chat / GitHub / Drive / File / Project: اكتب الناتج فورًا إلى Google Drive في التاب المناسب قبل اعتبار الاستخراج مكتملًا.
- التوجيه الحالي للأنواع: `INBOX`, `DECISIONS`, `RULES`, `THINKING_MODEL`, `PROJECTS`, `SOURCE_LINKS`, `KNOWLEDGE`, `NEGATIVE_LEARNING`.
- GitHub لا يستقبل كل لقطة خام؛ تتم مزامنته كطبقة معرفة منظمة ومستقرة بدون duplication.
- لا تنقل Secrets أو Credentials أو بيانات شخصية حساسة إلى FOKHA_BRAIN العام.
- إذا كان Google Drive غير متاح أو غير مصرح به، لا تدّع أن الكتابة تمت؛ أخرج payload منظمًا وعلّمه `PENDING_DRIVE_WRITE`.