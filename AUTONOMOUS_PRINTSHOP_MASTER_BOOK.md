# Autonomous Printshop — الكتاب الرئيسي المستقل

> **المشروع:** Trend Mall / Matbagy Autonomous Printshop  
> **الهدف التنفيذي:** تشغيل المطبعة يوميًا بدون تدخل روتيني من المالك، والموظفون يعملون فقط في التنفيذ الفيزيائي أو الاستثناءات التي لا يستطيع الـAI تنفيذها بأمان.  
> **تاريخ بدء الماندت:** 2026-10-05  
> **الهدف الزمني:** 2026-12-04  
> **Canonical book:** هذا الملف وحده هو سجل مشروع الأتمتة. **ممنوع تسجيل Entries هذا المشروع في `TrendOS_MASTER_BOOK.md`.**

## 0. قواعد القراءة والتنفيذ

1. هذا مشروع Orchestration/Autonomy فوق الأنظمة الموجودة، وليس نسخة ثانية من TrendOS.
2. ترتيب الدليل: `LATEST VERIFIED RUNTIME > DEPLOYED > TESTED > REPO-ONLY > HISTORICAL`.
3. نربط بالمصدر canonical بدل نسخ نفس المعرفة بين المشاريع: **LINK, DON'T DUPLICATE**.
4. TrendOS يظل Source of Truth للأوردرات/العملاء/التشغيل في النطاقات المثبتة Runtime.
5. Matbagy-OS هو المصدر الأقوى الحالي لـAI Orchestrator / Cases / Tenancy / Audit، وليس repo التصميم القديم المحذوف.
6. EasyStore يظل برنامج الحسابات المستقل؛ لا يصبح الـAI سلطة مالية من خلال هذا المشروع.
7. أي وظيفة غير مؤهلة أو غير معروفة = fail closed / exception، لا تنفيذ تلقائي.
8. حضور الموظف فعل بشري/واقعي؛ الـAI لا ينتحل حضورًا أو غيابًا.
9. الـAI يدير ترتيب الشغل، توزيع المهام، coaching، اكتشاف التعطل والتصعيد التشغيلي.
10. الفصل/الإيقاف/خفض الأجر/العقوبات الوظيفية النهائية ليست قرارات آلية؛ تبقى Owner/authorized-manager gate.
11. كل mutation آلي يجب أن يكون idempotent أو محميًا بعقد صريح.
12. كل Agent له OFF switch وShadow/Canary قبل GENERAL.

## 1. تعريف النجاح

```ini
OWNER_ROUTINE_TOUCHES_PER_DAY=0
OWNER_EXCEPTION_TOUCHES_PER_DAY_TARGET<=1
AI_AUTO_DECISION_TARGET>=95%
DIGITAL_TASKS_ROUTED_TO_HUMAN_TARGET<=5%
EMPLOYEE_NORMAL_JOB_SELECTION=0
PHYSICAL_TASKS_WITH_AI_INSTRUCTIONS=100%
ORDER_WITHOUT_NEXT_ACTION=0
OVERDUE_WITHOUT_ESCALATION=0
CRITICAL_FAILURE_WITHOUT_ALERT=0
```

المقصود ليس إلغاء الموظفين. المقصود إزالة العمل الذي تستطيع البرمجيات/AI تنفيذه بأمان، وترك البشر للحركة الفيزيائية، الحالات الاستثنائية، الصيانة، الاستلام/التغليف، والقرارات المحمية.

## 2. المصادر التي تمت مراجعتها

### TrendOS
- `TrendOS_MASTER_BOOK.md` — تمت قراءته على الحالة الحالية حتى Entry623، مع فصل Entries مشروع الأتمتة منه لاحقًا.
- `docs/trendos/blackbox/` — تم جرد الصندوق الأسود الكامل (471 ملفًا) واستخدام سلاسل المشروع ذات الصلة بدل اعتبار الأرشيف Runtime authority.
- تمت قراءة سلاسل Operator Task V2 كاملة ذات الصلة بالـrequirements/architecture/preview.
- تمت قراءة سلسلة Gaber Material Control حتى Checkpoint 05 + Shadow/Parity + Department Invoice requirements.
- تمت قراءة/فحص مصادر Employee Manager/Coach/Andon، Customer Feedback، Customer Manager، وWhats Agent.
- Runtime truth المستخدم عند بداية المشروع:
  - Orders/Customers: D1/Cloudflare qualified في المسارات المثبتة.
  - Ops: `GENERAL / epoch 7`.
  - Accounting: `READONLY / epoch 2` ومؤجل إلى EasyStore.
  - Auth: ما زال غير D1-native بالكامل في آخر evidence.
  - Content/Comms/Core: لا يُفترض أنها GENERAL لمجرد وجود source.

### عقل فوخا — `fawakhry/Fokha@main`
تمت قراءة:
- README / اقرأني أولًا.
- MEMORY index/thinking/projects/source-links/rules/decisions/ideas/knowledge/negative-learning.
- extraction/working standards.
- sync references.

المبدأ الذي نعتمده: عقل فوخا Registry + Context Router؛ لا نخزن فيه ذاكرة هذا المشروع تفصيليًا.

### تصميمات مطبعجي / Matbagy-OS — `fawakhry/Matbagy-OS@main`
تمت قراءة:
- `PROJECT_BOOK.md` كاملًا.
- Roadmap + migration report من المشروع القديم.
- صندوق مطبعجي: contracts/instructions/prompts/checkpoints.
- جميع Design Cases الحالية: `000001..000014` + `000100` + `904530`.
- Runtime architecture: orchestrator, live providers, Worker, permissions, D1 tenant store, sandbox/deployment contracts.

المشروع القديم `fawakhry/Matbagy-Design-Workflow` تم ترحيله بالكامل ثم حذفه. **Matbagy-OS هو canonical الحالي.**

### برنامج التقييمات
تمت قراءة وثائق `fawakhry/Matbagy@main/evaluations` وكتاب التنفيذ حتى الحالة التجريبية السحابية.
كما تم استرجاع source كان محفوظًا في ملفات المحادثات:
- `worker_with_ui.mjs`
- `worker.mjs`
- `README_CLOUDFLARE.md`

هذه الملفات كانت مفقودة من GitHub العام للمشروع، ولذلك تم اعتبارها Source Recovery صالحًا للاستخراج بعد فحص عدم وجود Secret literals.

## 3. القرار المعماري النهائي

لا نبني نظامًا جديدًا لكل وظيفة.

```
TrendOS Source of Truth
        |
        v
Autonomy Control Plane
(Matbagy-OS Orchestrator DNA)
        |
        +--> Customer/Order Agent
        +--> Design Agent
        +--> Preflight/QC Agent
        +--> Production Scheduler
        +--> Employee Supervisor
        +--> Customer/Employee Intelligence
        +--> Inventory/Material Agent
        |
        v
Operator Task V2 / Physical Work Queue
        |
        v
Employee executes physical task
        |
        v
Evidence / QC / completion / learning
```

### Authority boundaries

- **TrendOS:** order/customer/operational truth where Runtime-qualified.
- **Autonomy Control Plane:** decide/route/schedule/observe; never invent live state.
- **Matbagy-OS:** orchestration patterns, AI providers, cases, tenancy, audit, memory contracts.
- **EasyStore:** finance/accounting authority.
- **Employees:** physical execution + exceptions.
- **Owner:** protected/high-risk exceptions only.

## 4. المشاريع التي سنكملها ونستخدمها

### P1 — Operator Task V2 — **نكمله فورًا / Critical**
**Source:** TrendOS.

نحتفظ بـ:
- no free ordinary backlog;
- server-side next-task selection;
- `Urgent DESC -> Due Date ASC -> Order Sequence ASC`;
- missing due date => exception، لا random dispatch;
- one active ordinary task per operator;
- atomic claim+start;
- authoritative timestamps;
- exact Order/Line traceability;
- idempotent claim/complete;
- Fly Print lane منفصل لوائل;
- Press view scoped;
- metrics.

**تعديل جوهري:** المعمار التاريخي كان Cloudflare -> Google Task Authority. هذا لم يعد الاتجاه الصحيح بعد Zero-Google. سنحافظ على public API contract ونحوّل Task authority إلى D1/Cloudflare بعد qualification.

**النتيجة في مشروعنا:** Physical Execution Engine.

### P2 — Gaber Material Control / Material Ledger — **نكمله ونعممه / Critical**
**Source:** TrendOS candidate + blackbox.

جاهز بالفعل:
- material-close decision;
- equation: issued = consumed + returned + reusable offcut + waste;
- append-only movement ledger;
- purchase evidence;
- waste reason/evidence/approval;
- manager request/approval flow;
- daily material report;
- exact Task/Order/Line drill-down;
- missing opening/closing balance fail-closed;
- deterministic fingerprints/idempotency;
- 40/39/1 reconciliation case qualified.

**التعديل المطلوب:**
- إزالة الاعتماد المستقبلي على Apps Script persistence.
- تحويل ledger/persistence إلى D1.
- الحفاظ على EasyStore كـfinancial authority عبر adapter واضح.
- منع double decrement: `TASK_ISSUE` custody only.
- تعميم المحرك من Gaber/Laser إلى Print وباقي الأقسام.

**النتيجة:** Inventory + Material + Waste Agent foundation.

### P3 — Matbagy-OS Runtime Orchestrator — **نستخدمه كأساس العقل / Critical**
**Source:** `fawakhry/Matbagy-OS@main`.

نستخدم:
- deterministic orchestration core;
- OpenAI/Gemini provider abstraction;
- shared context packets;
- truth labels;
- audit;
- D1 tenant/case/search;
- roles/permissions;
- tenant storage roots;
- retry/circuit-breaker patterns;
- Case lifecycle.

**لا ننقل:** Sandbox-specific assumptions كما هي إلى Production.

**التعديل:**
- AI authority من `ADVISORY_ONLY` إلى policy-controlled `SHADOW/CANARY/AUTO` per task family، وليس global.
- إضافة TrendOS live connector.
- إضافة Autonomy Policy Engine.
- إضافة action/event execution contract.

**النتيجة:** AI Control Plane.

### P4 — صندوق مطبعجي / Design Cases — **نستخرج المعرفة ونكمل Smart Designer / Critical**
نستخدم:
- stable Design Case IDs;
- asset/version lineage;
- must_keep / must_avoid;
- approval separation;
- negative learning;
- case search/watch;
- persistence contracts;
- extracted real design examples.

أمثلة قواعد جاهزة من الشغل الحقيقي:
- Mug/20×9 layouts.
- 7×10/Senior cutout workflows.
- collage/replacement while preserving layout.
- outpainting مع الحفاظ على الوجه/الهوية بدل إعادة توليد الشخص.
- artwork extraction من mockup.
- clean-white override.
- exact logo preservation.
- explicit position markings = high-priority constraints.
- rejected outputs لا تتحول Templates.
- save/persist ≠ customer approval.

**العمل المتبقي:** تحويل الحالات المقبولة إلى Product Recipes قابلة للتنفيذ آليًا + Preflight rules.

### P5 — Matbagy Evaluations — **نستعيده ونكمله / High**
نستخدم المصدر المسترجع بدل إعادة البناء.

نحتفظ بـ:
- evidence-first;
- observed/fact/inference separation;
- approved facts -> versioned customer profile;
- employee operational evidence;
- action proposals;
- WhatsApp TXT import;
- D1/R2 patterns;
- manual review lineage.

**التعديل:**
- دمجه مع TrendOS customer/order/task events.
- تشغيل analysis jobs بدل الإدخال اليدوي فقط.
- Employee evaluation = coaching/workflow optimization؛ لا adverse action تلقائي.
- إضافة daily/weekly learning loop للـSupervisor Agent.
- نقل البيانات من pilot namespace إلى tenant/project contracts بطريقة controlled.

**النتيجة:** Customer Intelligence + Employee Intelligence.

### P6 — Employee Manager Strips / Ops Coach / Andon — **نأخذ UX والـsignals ونغير المحرك / High**
الموجود مفيد:
- employee sees “what to do now”;
- overdue/urgent/stale signals;
- conversation with operation manager;
- Andon blockers: machine, material, customer wait, price/decision, quality, help.

المشكلة الحالية:
- بعض UI logic يختار أول row من active list، وليس Task authority حقيقية.
- Andon في النسخ التاريخية يعتمد notes/Apps Script semantics.

**التعديل:**
- مصدر “المطلوب الآن” = Operator Task V2 / AI Scheduler فقط.
- Andon يصبح structured D1 event.
- AI Supervisor يحاول resolve تلقائيًا ما يمكنه، ثم يصعّد exception محدد.

### P7 — Customer Manager + Whats Agent + Feedback — **نكمله بعد بوابة Comms / High لكن dependency**
نستخدم:
- customer context;
- inbound/outbound integrity;
- clientRequestId / Meta Message ID duplicate protection;
- escalation policy;
- suggestion -> safe auto reply progression;
- Customer Feedback scan.

**لا نعيد onboarding القديم.**
الـWhatsApp الحالي له ملفه وMeta Coexistence gate. لا Auto Reply قبل:
- association/coexistence;
- webhook;
- inbound;
- context;
- manual outbound;
- idempotency.

### P8 — Go-Live Autopilot — **نستخرج patterns فقط / Medium**
مفيد في:
- sweep/prepare;
- ready-notification;
- idempotent operational flow.

غير مسموح:
- اعتباره Financial authority.
- دمج Accounting writes في Autopilot بينما EasyStore منفصل/READONLY.

### P9 — Lead Hunter / Growth — **مؤجل**
مفيد للنمو، لكنه لا يقلل اعتماد المطبعة على المالك خلال أول 60 يوم بنفس أثر التشغيل/التصميم/التوزيع.

## 5. ما لا نستخدمه كأساس

- `work-queue-v1.js`: superseded by Operator Task V2.
- deleted `Matbagy-Design-Workflow`: canonical أصبح Matbagy-OS.
- historical Google Task authority architecture: نحافظ على العقد لا السلطة.
- stale fixed Google Drive root IDs في بعض Design docs: نستبدلها tenant storage roots.
- client/browser timers as authority.
- AI-generated prices without deterministic pricing authority.
- AI-generated customer/order/payment facts without TrendOS lookup.
- historical stale tests/flags كدليل Runtime.

## 6. المشروع الفعلي الذي سنبنيه

اسم العمل:
**Autonomous Printshop Control Plane**

المكونات المستهدفة:

1. Autonomy Policy + Event Ledger.
2. TrendOS Live Connector.
3. AI Orchestrator.
4. Customer Intake Agent.
5. Pricing Rules Adapter.
6. Design Recipe Engine.
7. AI Preflight/QC.
8. Production Scheduler.
9. Operator Task V2 D1 Authority.
10. Material/Inventory Ledger.
11. Employee Supervisor + Andon resolver.
12. Customer/Employee Intelligence.
13. Comms Agent.
14. Owner Exception Console.

## 7. فصل الكتب

من الآن:

- `TrendOS_MASTER_BOOK.md` = TrendOS فقط.
- `AUTONOMOUS_PRINTSHOP_MASTER_BOOK.md` = هذا المشروع فقط.
- لا تُضاف أي Entry أتمتة جديدة إلى كتاب TrendOS.
- عندما نحتاج حقيقة من TrendOS نسجل reference فقط هنا.
- أي تغيير لازم يتم داخل TrendOS نفسه يظل له Runtime evidence في TrendOS حسب قواعده، لكن **سجل مشروع الأتمتة وقراراته وخارطته يبقى هنا**.

## 8. حالة ما تم بناؤه قبل الفصل

تم إنشاء foundation في TrendOS repo لأن المشروع بدأ فوق D1 الحالي:

- `cloudflare-d1/src/autonomy-policy-v1.mjs`
- `cloudflare-d1/src/autonomy-event-ledger-v1.mjs`
- `cloudflare-d1/migrations/0019_autonomy_events_v1.sql`
- `tests/trendos_autonomy_policy_v1.test.mjs`
- `tests/trendos_autonomy_event_ledger_v1.test.mjs`
- CI: `.github/workflows/trendos-autonomy-policy-v1-ci.yml`

Evidence:
- Autonomy Policy CI Run `37239224704` = PASS.
- A61 browser regression Run `37239224760` = PASS.

Runtime boundary:
```ini
MIGRATION_0019=REPO_ONLY_NOT_APPLIED
AUTOPILOT_RUNTIME_ENABLED=NO
PRODUCTION_BEHAVIOR_CHANGED=NO
```

هذه artifacts تبقى تقنيًا في TrendOS integration layer حاليًا، لكن سجلها وقرارها أصبحا في هذا الكتاب فقط.

## 9. أول Extraction/Reuse Gate

قبل أول Production Autopilot:

1. complete action inventory;
2. finish Operator Task V2 D1 authority design;
3. import recovered Evaluations source under project quarantine;
4. build Matbagy-OS -> TrendOS connector contract;
5. extract Design Cases into Product Recipe candidates;
6. qualify structured Andon event model;
7. apply autonomy event schema OFF only after exact D1 preflight;
8. run Shadow decisions against real operations;
9. compare AI recommendation vs real human action;
10. enable one low-risk digital family only after mismatch/error gate passes.

## 10. Entries

### AP-001 — 60-day owner mandate
```ini
OWNER_MANDATE=AI_FIRST_HUMAN_BY_EXCEPTION
TARGET_DATE=2026-12-04
OWNER_ROUTINE_TOUCH_TARGET=0
PRODUCTION_AUTOPILOT=OFF
```

### AP-002 — Autonomy policy foundation
```ini
AUTONOMY_POLICY_SOURCE=cloudflare-d1/src/autonomy-policy-v1.mjs
AUTONOMY_POLICY_CI=PASS
AUTONOMY_POLICY_CI_RUN=37239224704
A61_REGRESSION=PASS
A61_REGRESSION_RUN=37239224760
MIGRATION_0019=REPO_ONLY_NOT_APPLIED
ACTION_CLASSIFICATION_COMPLETE=NO
PRODUCTION_BEHAVIOR_CHANGED=NO
```

### AP-003 — Full source review / reuse decision
Reviewed Fokha + TrendOS live book + relevant TrendOS blackbox project histories + Matbagy-OS book/runtime/contracts/all current Design Cases + Matbagy Evaluations docs and recovered source.

Decision:
```ini
BUILD_NEW_PARALLEL_TRENDOS=NO
USE_TRENDOS_AS_SOURCE_OF_TRUTH=YES
USE_MATBAGY_OS_ORCHESTRATOR_DNA=YES
USE_DESIGN_CASES_AS_RECIPE_SOURCE=YES
RECOVER_AND_CONTINUE_EVALUATIONS=YES
CONTINUE_OPERATOR_TASK_V2=YES
REPLACE_OPERATOR_GOOGLE_AUTHORITY_WITH_D1_TARGET=YES
CONTINUE_AND_GENERALIZE_MATERIAL_CONTROL=YES
USE_OPS_COACH_AND_ANDON_AS_SIGNAL_UX=YES
WHATSAPP_AUTOREPLY_DEPENDS_ON_COMMS_GATE=YES
ACCOUNTING_AUTHORITY=EASYSTORE
AUTONOMOUS_PROJECT_BOOK_SEPARATE=YES
```

Next:
`AP-004 = source extraction manifest + recovered evaluations import + Operator Task D1 authority gap audit`.
