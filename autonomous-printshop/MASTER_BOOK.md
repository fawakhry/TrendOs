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
- `autonomous-printshop/MASTER_BOOK.md` = هذا المشروع فقط.
- لا تُضاف أي Entry أتمتة جديدة إلى كتاب TrendOS.
- عندما نحتاج حقيقة من TrendOS نسجل reference فقط هنا.
- أي تغيير لازم يتم داخل TrendOS نفسه يظل له Runtime evidence في TrendOS حسب قواعده، لكن **سجل مشروع الأتمتة وقراراته وخارطته يبقى هنا**.

## 8. حالة ما تم بناؤه قبل الفصل

تم إنشاء foundation في TrendOS repo لأن المشروع بدأ فوق D1 الحالي:

- `autonomous-printshop/core/autonomy-policy-v1.mjs`
- `autonomous-printshop/core/autonomy-event-ledger-v1.mjs`
- `autonomous-printshop/migrations/0019_autonomy_events_v1.sql`
- `autonomous-printshop/tests/trendos_autonomy_policy_v1.test.mjs`
- `autonomous-printshop/tests/trendos_autonomy_event_ledger_v1.test.mjs`
- CI: `.github/workflows/autonomous-printshop-policy-v1-ci.yml`

Evidence:
- Autonomy Policy CI Run `37239224704` = PASS.
- A61 browser regression Run `37239224760` = PASS.

Runtime boundary:
```ini
MIGRATION_0019=REPO_ONLY_NOT_APPLIED
AUTOPILOT_RUNTIME_ENABLED=NO
PRODUCTION_BEHAVIOR_CHANGED=NO
```

تم نقل الـcanonical project copies إلى `autonomous-printshop/`. أي نسخة تبقى خارج هذا المجلد لا تُعتبر مصدر المشروع إلا إذا كانت Runtime dependency موثقة حتى cutover.

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


### AP-004 — Source extraction and project isolation

Completed:
- Removed AP-specific Entry624/Entry625 from `TrendOS_MASTER_BOOK.md`.
- Moved 60-day program to this MASTER_BOOK / Appendix A.
- Moved autonomy action seed to `autonomous-printshop/manifests/AP002_AUTONOMY_ACTION_CLASSIFICATION_SEED_V1.json`.
- CI trigger no longer treats `TrendOS_MASTER_BOOK.md` as an Autonomy project document.
- Corrected Fokha registry from deleted `Matbagy-Design-Workflow` to canonical `fawakhry/Matbagy-OS@main`.
- Added this MASTER_BOOK / Appendix B.
- Recovered historical Matbagy Evaluations executable source into:
  - `autonomous-printshop/recovered/evaluations/worker.mjs`
  - `autonomous-printshop/recovered/evaluations/worker_with_ui.mjs`
  - `autonomous-printshop/recovered/evaluations/README_CLOUDFLARE.md`
  - quarantine safety README.
- Extracted 13 initial Design Recipe candidates from canonical Matbagy-OS cases into:
  - `autonomous-printshop/manifests/DESIGN_RECIPE_EXTRACTION_SEED_V1.json`
- Completed Operator Task D1 authority audit:
  - this MASTER_BOOK / Appendix C
  - result: stable product/API contract is reusable, but current D1 Task authority is absent; historical mutation authority is Apps Script/Sheet; autonomous target must implement D1 authority.

Review-scope truth:
- TrendOS blackbox archive inventory was fully enumerated.
- The live master book and all project chains selected for reuse were deep-read through requirements, implementation/checkpoints and latest available runtime evidence.
- Not every historical incident log in the 471-file archive was semantically read line-by-line; unrelated migration/incident archaeology remains archive-only and is not treated as product truth.

```ini
PROJECT_BOOK_ISOLATION=PASS
TRENDOS_MASTER_AP_ENTRIES=REMOVED
FOKHA_MATBAGY_POINTER=CORRECTED
EVALUATIONS_SOURCE_RECOVERED=YES
EVALUATIONS_SOURCE_DEPLOYED=NO
DESIGN_RECIPE_CANDIDATES=13
OPERATOR_TASK_D1_AUTHORITY=ABSENT
NEXT_BUILD=P0_D1_OPERATOR_TASK_CORE_PLUS_MATBAGY_OS_CONNECTOR_CONTRACT
```


## Appendix A — 60-Day Execution Program

**Owner mandate date:** 2026-10-05  
**Target:** by 2026-12-04, daily printshop operations run without routine owner involvement.  
**Operating principle:** AI executes every qualified digital task. Employees receive only physical work and qualified exception work. Owner receives only protected high-risk decisions and emergency escalation.

## 1. North-star operating contract

The target operating model is:

```
Customer / WhatsApp
  -> AI Intake
  -> AI Customer + Order Context
  -> AI Quote / Rules
  -> AI Design or Template Composition
  -> AI Preflight
  -> AI Production Scheduler
  -> Operator Task V2 for physical execution only
  -> AI Quality Gate
  -> AI Customer Update
  -> Delivery / Handover
  -> Controlled Finance Link
  -> Learning + KPI loop
```

### Required end-state KPIs

```ini
OWNER_ROUTINE_TOUCHES_PER_DAY=0
OWNER_EXCEPTION_TOUCHES_PER_DAY_TARGET<=1
UNOWNED_OPERATIONAL_TASKS=0
DIGITAL_TASKS_ROUTED_TO_HUMAN_TARGET<=5%
AI_AUTO_DECISION_TARGET>=95%
PHYSICAL_TASKS_WITH_AI_INSTRUCTIONS=100%
ORDER_WITHOUT_NEXT_ACTION=0
OVERDUE_WITHOUT_ESCALATION=0
CRITICAL_FAILURE_WITHOUT_ALERT=0
EMPLOYEE_FREE_CHOICE_OF_NEXT_NORMAL_JOB=NO
```

This is a target operating contract, not permission to bypass safety, data integrity, financial controls, or employment protections.

## 2. Human work policy

Employees should only receive:

1. physical production work that software cannot perform: loading media, operating machines that require manual handling, pressing, assembly, packing, handover;
2. exception work where confidence, data, quality, or customer approval is insufficient;
3. maintenance, cleaning, stock receiving, and other real-world actions;
4. recovery work during a declared degraded mode.

Employees should not routinely decide:

- what job to do next;
- what customer to answer first;
- what standard design template to use;
- whether a standard file passes preflight;
- how to prioritize normal orders;
- when to chase a customer for missing standard information;
- which normal production queue item is next.

Those are system responsibilities.

## 3. AI supervisor policy for employees

AI may autonomously:

- assign the next qualified task;
- sequence work using due date, priority, machine availability, setup cost, and dependency state;
- provide exact execution instructions;
- check task completion evidence;
- detect lateness, inactivity, repeated rework, and queue imbalance;
- coach the employee on the current task;
- rebalance normal workloads;
- request operational clarification;
- produce performance analytics.

AI must not autonomously execute adverse employment decisions such as termination, suspension, pay reduction, or punitive disciplinary action. Those remain protected owner/authorized-manager decisions.

## 4. Control model

Every operational action is classified by `autonomy-policy-v1.mjs` into one of:

- `AI_AUTO`: system executes;
- `HUMAN_PHYSICAL`: Operator Task V2 receives the physical task;
- `HUMAN_EXCEPTION`: human handles an exception;
- `OWNER_ONLY`: protected high-risk decision;
- `BLOCKED`: safety/integrity state prevents execution.

Autopilot is **default OFF** at source level until a task family passes its qualification gate. Rollout is shadow -> canary -> partial auto -> general auto.

## 5. Existing TrendOS components to reuse

Do not create a parallel operating system.

Reuse:

- D1 / Cloudflare as the current cloud authority where already qualified;
- Employee Native Auth migration track;
- Operator Task Workflow V2 as the physical-work queue;
- existing customer/order Cloud paths;
- existing print/laser material-control work;
- Matbagy AI knowledge assets as the future controlled AI layer;
- EasyStore as the separate accounting program while Accounting remains deferred/read-only.

`work-queue-v1.js` is superseded for normal operator assignment and is not the basis of this program.

## 6. 60-day execution sequence

### Days 1-7 — Autonomy Control Plane

Deliver:

- autonomy policy engine;
- action taxonomy;
- event/audit contract;
- shadow-decision log;
- exception queue contract;
- Owner Emergency Queue contract;
- current workflow inventory mapped to AI / physical / exception / owner;
- baseline KPIs: owner touches, employee choices, rework, overdue, queue wait.

Exit gate:

```ini
AUTONOMY_POLICY_ENGINE=PASS
ALL_LIVE_WORKFLOW_FAMILIES_CLASSIFIED=YES
UNKNOWN_NEXT_ACTION_RATE=0
RUNTIME_BEHAVIOR_CHANGED=NO
```

### Days 8-14 — AI Customer Intake + Order Completeness

Deliver:

- WhatsApp/inbox intent extraction;
- customer identity resolution;
- product, dimensions, quantity, deadline, source files and required fields extraction;
- deterministic missing-information prompts;
- order draft generation;
- duplicate protection;
- owner-free normal order admission.

Exit gate: standard customer request can become a complete order draft without employee intervention.

### Days 15-21 — Pricing + Design Automation

Deliver:

- deterministic price rules as source-of-truth;
- AI may explain or compose a quote, not invent price;
- Smart Designer templates for highest-volume products first;
- print-file normalization;
- image placement rules;
- cut/stroke rules;
- standard wording/data insertion;
- version lineage.

First product families:

- Mug 20x9;
- 7x10 cutouts / Senior;
- collage/poster;
- standard invitations;
- common laser/vector name designs.

Exit gate: at least the highest-volume standard products reach proof-ready output automatically.

### Days 22-28 — AI Preflight + Production Dispatcher

Deliver:

- size/aspect/DPI checks;
- missing-image and low-quality checks;
- text/data completeness checks;
- stroke/cut readiness checks where relevant;
- print-ready package;
- production routing by department/machine;
- Operator Task V2 integration;
- no employee browsing of the normal order pool.

Exit gate:

```ini
NORMAL_NEXT_JOB_CHOSEN_BY_SYSTEM=100%
PHYSICAL_TASK_HAS_MACHINE_AND_INSTRUCTIONS=100%
DIGITAL_PREPARATION_DONE_BEFORE_OPERATOR=YES
```

### Days 29-35 — AI QC + Rework Loop

Deliver:

- expected-vs-produced QC evidence model;
- file/proof verification;
- photo/sample capture contract for physical QC where applicable;
- defect classification;
- automatic rework task creation;
- customer-impact escalation.

Exit gate: every completed production task has a recorded QC result before delivery eligibility.

### Days 36-42 — Inventory + Procurement Autopilot

Deliver:

- material consumption projection from order lines;
- reorder thresholds;
- shortage prediction;
- purchase suggestions;
- approved supplier/range rules;
- owner escalation only for out-of-policy spend or supplier exception.

Exit gate: no standard order reaches production without material readiness state.

### Days 43-49 — AI Employee Supervisor

Deliver:

- shift workload plan;
- automatic next-task assignment;
- lateness/blocker detection;
- task coaching;
- break/availability-aware dispatch;
- productivity/rework analytics;
- manager exception queue;
- protected employment-action boundary.

Exit gate:

```ini
EMPLOYEE_NORMAL_JOB_SELECTION=0
UNASSIGNED_READY_PHYSICAL_TASKS=0
AI_SUPERVISOR_COVERAGE=100%
ADVERSE_EMPLOYMENT_ACTION_AUTO=NO
```

### Days 50-56 — Owner Removal Rehearsal

Operate in owner-silent mode for routine work.

Owner dashboard changes from a work console to an exception console only.

Allowed owner notifications:

- safety/security incident;
- production outage affecting deadlines;
- financial exposure beyond configured threshold;
- legal/regulated issue;
- protected employment decision;
- major customer exception beyond policy;
- systemic data-integrity failure.

Exit gate: 7 consecutive operating days with zero routine owner actions.

### Days 57-60 — Autonomous Burn-in + Go/No-Go

Run the shop with:

```ini
AUTOPILOT_SCOPE=QUALIFIED_GENERAL
OWNER_ROUTINE_TOUCHES=0
EMPLOYEE_SCOPE=PHYSICAL_PLUS_EXCEPTIONS
OWNER_VIEW=EXCEPTIONS_ONLY
```

Go only if:

- no silent lost orders;
- no uncontrolled financial mutation;
- no queue starvation;
- no critical alert gap;
- rollback works;
- every autonomous action is auditable;
- exception ownership is deterministic.

## 7. Owner dashboard end-state

The owner should not manage queues.

The owner screen should answer only:

- Is the shop healthy?
- Is any deadline at risk?
- Is any exception waiting specifically for me?
- Are cash/material/security thresholds breached?
- Is Autopilot degraded?

Normal healthy state:

```ini
SHOP_HEALTH=GREEN
OWNER_ACTION_REQUIRED=NO
ORDERS_AT_RISK=0
UNOWNED_EXCEPTIONS=0
AUTOPILOT_DEGRADED=NO
```

## 8. Non-negotiable engineering rules

- Runtime truth > deployed > tested > repo-only > historical.
- Every mutation is idempotent or explicitly protected.
- No AI-generated final price if price authority is unavailable.
- No AI claim about order/payment/stock state without source-of-truth lookup.
- Unknown task family does not auto-execute.
- Every auto action records input, policy decision, confidence, execution result and rollback/audit reference.
- Every autonomous subsystem has an OFF switch.
- Rollout is canary-first and fail-closed.
- EasyStore/accounting remains outside this program until its separate gate is reopened.

## 9. First implementation checkpoint

Created on 2026-10-05:

- `autonomous-printshop/core/autonomy-policy-v1.mjs`
- `autonomous-printshop/tests/trendos_autonomy_policy_v1.test.mjs`
- `.github/workflows/autonomous-printshop-policy-v1-ci.yml`

This checkpoint changes no Production runtime behavior. It establishes the classification contract required before AI can take operational control.

## 10. Immediate next gate

After the policy CI is green:

1. classify every currently live operational action against the autonomy taxonomy;
2. create the append-only autonomy event schema;
3. add shadow decisions without taking action;
4. measure 24-hour mismatch rate between AI recommendation and actual human action;
5. only then enable a first low-risk automatic task family.


## Appendix B — Reuse / Extraction Map

Date: 2026-10-05  
Purpose: decide exactly what existing work is reused, continued, modified, or deferred for the autonomous-printshop program.

| ID | Existing project/module | Canonical source | Current evidence | Decision | Required modification | Autonomous target | Priority |
|---|---|---|---|---|---|---|---|
| R01 | TrendOS Orders + Customers | `fawakhry/TrendOs` | Runtime-qualified Cloud/D1 paths | REUSE IN PLACE | expose stable connector/events; do not duplicate data | Source-of-truth connector | P0 |
| R02 | TrendOS Employee Ops | `cloudflare-d1/src/employee-ops-native-v1.mjs` | Ops GENERAL / epoch 7 | REUSE IN PLACE | emit structured operational events for supervisor | Ops signal source | P0 |
| R03 | Operator Task Workflow V2 | TrendOS candidate + blackbox | Contract/preview qualified; current live status needs fresh runtime qualification | CONTINUE + MODERNIZE | replace historical Google Task authority with D1 authority; preserve API and dispatch invariants | Physical Execution Engine | P0 |
| R04 | Gaber Material Control | TrendOS candidate chain Checkpoint 01..05 | Pure core/ledger/UI/backend CI-qualified historically; not accepted as current production authority | CONTINUE + GENERALIZE | D1 persistence; EasyStore financial adapter; Laser+Print+future departments; no double decrement | Material/Inventory Agent | P0 |
| R05 | Matbagy-OS Runtime | `fawakhry/Matbagy-OS@main` | Sandbox/runtime foundation + tenant D1/contracts | REUSE AS ORCHESTRATOR BASE | TrendOS connector; per-family autonomy modes; action execution/audit | AI Control Plane | P0 |
| R06 | صندوق مطبعجي Cases/Knowledge | `Matbagy-OS/صندوق_مطبعجي/` | 16 current cases + contracts | EXTRACT KNOWLEDGE | promote approved cases into executable Product Recipes; clean stale storage assumptions | Design Recipe Engine | P0 |
| R07 | Matbagy Evaluations | `fawakhry/Matbagy/evaluations` + recovered source | Cloud pilot history; code recovered from user files | RECOVER + CONTINUE | TrendOS event connector; scheduled analysis; evidence-first profiles; protected employee decisions | Customer/Employee Intelligence | P0/P1 |
| R08 | Employee Manager Strips / Ops Coach | TrendOS frontend modules | Existing operational UX/source | REUSE UX, REPLACE DECISION SOURCE | no “first row” dispatch; task comes from Operator Task/AI Scheduler | Employee Supervisor UI | P1 |
| R09 | ANDON | TrendOS ANDON modules | Existing reason buttons + historical append-only integrity | CONTINUE | structured D1 incident/event; auto resolver; escalation ownership/SLA | Exception Engine | P1 |
| R10 | Customer Manager / Feedback | TrendOS modules | source exists; Comms family not assumed GENERAL | CONTINUE AFTER GATE | unify with intelligence profile; D1/R2; safe escalation | Customer Operations Agent | P1 |
| R11 | Whats Agent | `WHATS_AGENT_BOOK.md` + integrity source | Meta Coexistence/onboarding dependency remains | DEPENDENCY / CONTINUE SEPARATELY | finish coexistence/webhook/manual send/idempotency before auto reply | Customer Intake/Comms | P1 |
| R12 | Go-Live Autopilot | TrendOS source | operational draft/notification patterns | EXTRACT PATTERNS ONLY | remove finance authority; use only ready/follow-up workflow patterns | Completion/Notification Agent | P2 |
| R13 | EasyStore | `fawakhry/EasyStore` | Accounting READONLY in TrendOS program | KEEP SEPARATE AUTHORITY | explicit read/controlled write contracts later | Finance Authority Adapter | P1 dependency |
| R14 | Lead Hunter / CRM | TrendOS roadmap | product idea, not current 60-day blocker | DEFER | integrate only after autonomous operations stable | Growth Agent | P3 |
| R15 | Work Queue V1 | TrendOS | superseded | DO NOT USE | none | none | DROP |
| R16 | Matbagy-Design-Workflow old repo | deleted after migration | migration report proves Matbagy-OS successor | DO NOT USE | Fokha pointer corrected | none | DROP |

## P0 critical path

```
TrendOS Connector
 -> Autonomy Policy/Event Ledger
 -> Matbagy-OS Orchestrator Adapter
 -> Operator Task V2 D1 Authority
 -> Design Recipe Engine
 -> Material/Inventory Ledger
 -> Evaluations Intelligence
 -> Shadow Supervisor
```

## Source extraction rules

- Do not copy TrendOS business data into a second source of truth.
- Do not copy Matbagy-OS runtime wholesale; consume/adapt modules with explicit contracts.
- Recovered Evaluations source is imported into `autonomous-printshop/recovered/evaluations/` because its executable code was missing from GitHub.
- Design cases remain canonical in Matbagy-OS; this project stores only extracted recipe rules + source case IDs.
- Historical Google adapters may be studied for semantics but are not the target authority.
- Every reused historical candidate requires current-runtime requalification before production activation.


## Appendix C — Operator Task V2 D1 Authority Gap Audit

Date: 2026-10-05  
Project: Autonomous Printshop  
Status: REPO AUDIT / NO RUNTIME MUTATION

## Finding

The Operator Task product contract is valuable and should be reused, but there is **no current D1 Operator Task authority schema/engine** in migrations 0012–0018.

### Existing D1 Ops is not Operator Task authority

Migration `0012_employee_ops_zero_google_v1.sql` covers Attendance / HR / Cleaning / Press-related operational facts. It does not define the ordinary task ledger required by Operator Task V2.

Migrations 0013–0018 also do not provide a task-assignment table/claim engine.

### Existing Operator Task mutation authority is historical Apps Script/Sheet

`operator-task-workflow-v2.gs` stores tasks in:

`تشغيل - مهام المشغلين V2`

and performs:
- active-task lookup;
- dispatch;
- claim/start;
- source status write;
- complete;
- metrics

using Spreadsheet/Apps Script authority.

### Existing Cloudflare module is a proxy, not authority

`cloudflare-d1/src/operator-task-edge-v2.mjs` provides the stable public routes:

- `GET /v1/operator/tasks/status`
- `POST /v1/operator/tasks/claim-next`
- `POST /v1/operator/tasks/complete`
- `GET /v1/operator/fly-print`
- `GET /v1/operator/press-candidates`
- `GET /v1/operator/tasks/metrics`

but mutating operations are still proxied to Apps Script through a dedicated HMAC bridge.

## Reuse decision

**Keep the public API and product invariants. Replace the authority adapter.**

Target:

```
Operator UI
 -> Cloudflare Operator Task API
 -> D1 Operator Task Authority
 -> TrendOS Order/Line status transition
 -> Autonomy/Material events
```

No browser dual-write and no Cloudflare->Apps Script Task mutation in the final autonomous target.

## D1 V1 schema needed

Minimum entities:

### operator_tasks
- task_id PK
- line_id
- order_id
- employee_key
- department
- state: STARTING/RUNNING/COMPLETED/FAILED/CANCELLED
- claimed_at
- started_at
- completed_at
- work_sec
- final_status
- priority_snapshot
- due_at_snapshot
- order_sequence_snapshot
- source_status_before
- task_payload_json
- material_close_id nullable
- created_at / updated_at

Required uniqueness/guards:
- at most one active task per employee;
- at most one active ordinary task per line;
- exact Line/Order consistency;
- deterministic/replay-safe mutation identity.

### operator_task_events
Append-only:
- event_id PK
- task_id
- event_type
- actor
- at
- idempotency_key
- request_hash
- result_hash/status
- evidence_json

### operator_task_control
- mode OFF / SHADOW / CANARY / GENERAL
- epoch
- enabled departments/users
- updated_at

## Dispatch contract retained

```
Urgent DESC
-> Delivery Due Date ASC
-> Order Sequence ASC
-> Line ID final deterministic tie-break
```

Missing/invalid due date:
`HUMAN_EXCEPTION / SUPERVISOR_QUEUE`

Never let the employee browse and select ordinary work as fallback.

## Atomic claim requirement

D1 claim-next must atomically:

1. verify operator has no active ordinary task;
2. select first eligible unlocked line by server ordering;
3. prevent a second operator claiming the same line;
4. create task/event;
5. transition source Line to `بدء التنفيذ` through the qualified TrendOS order/line write contract;
6. return one task.

Any partial failure requires rollback/compensation so an orphan STARTING task or orphan source status is not silently left behind.

## Complete requirement

Complete must:

1. authenticate task owner/capability;
2. replay-check idempotency key;
3. run material/QC gates applicable to the department;
4. transition exact Order/Line to allowed final status;
5. finalize task timestamps and work_sec;
6. append event;
7. emit completion signal for downstream AI/QC/customer workflows.

## What can be deleted after D1 cutover

Only after verified GENERAL + rollback evidence:
- Apps Script Task Sheet as mutation authority;
- Operator Task proxy HMAC dependency;
- `TRENDOS_OPERATOR_TASK_PROXY_SECRET` for this path.

Historical records remain archive evidence.

## Gate result

```ini
OPERATOR_TASK_PRODUCT_CONTRACT=REUSE
OPERATOR_TASK_PUBLIC_API=REUSE
CURRENT_D1_TASK_AUTHORITY=ABSENT
CURRENT_APPS_SCRIPT_TASK_AUTHORITY=HISTORICAL_CANDIDATE_PATH
TARGET_TASK_AUTHORITY=D1
NEW_D1_ENGINE_REQUIRED=YES
NEXT=DESIGN_MIGRATION_AND_PURE_D1_TASK_CORE_DEFAULT_OFF
```


### AP-005 — Single-place consolidation

Owner instruction: collect required code/books/links into one project location and keep one project book.

Canonical project root:
`autonomous-printshop/`

Canonical project book:
`autonomous-printshop/MASTER_BOOK.md`

Rules:
- Project-owned books/plans are folded into this file; no second project book is authoritative.
- Upstream system books are kept only as source snapshots under `autonomous-printshop/sources/**/books/`.
- Every source snapshot must retain provenance in `autonomous-printshop/manifests/SOURCE_REGISTRY_V1.json`.
- Runtime dependencies are not deleted from their live upstream system merely to satisfy folder tidiness.
- Project-owned duplicate files outside `autonomous-printshop/` are deleted after central verification.
- Upstream candidate/runtime files are deletion candidates only after replacement is live, rollback-tested, and no longer referenced by CI/runtime.

```ini
CENTRAL_PROJECT_ROOT=autonomous-printshop/
CENTRAL_PROJECT_BOOK=autonomous-printshop/MASTER_BOOK.md
PROJECT_BOOK_COUNT=1
UPSTREAM_BOOKS=SOURCE_SNAPSHOTS_ONLY
DELETE_PROJECT_DUPLICATES=YES
DELETE_LIVE_DEPENDENCIES_BEFORE_CUTOVER=NO
```


## Appendix D — Central Source Registry

Machine-readable registry: `autonomous-printshop/manifests/SOURCE_REGISTRY_V1.json`.

| System | Component | Original source | Central copy | Policy |
|---|---|---|---|---|
| TrendOS | Operator Task V2 | [operator-task-workflow-v2.js](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/operator-task-workflow-v2.js) | `autonomous-printshop/sources/trendos/operator-task/operator-task-workflow-v2.js` | `KEEP_UPSTREAM_UNTIL_D1_CUTOVER` |
| TrendOS | Operator Task V2 | [operator-task-workflow-v2.gs](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/operator-task-workflow-v2.gs) | `autonomous-printshop/sources/trendos/operator-task/operator-task-workflow-v2.gs` | `KEEP_UPSTREAM_UNTIL_D1_CUTOVER` |
| TrendOS | Operator Task Edge | [cloudflare-d1/src/operator-task-edge-v2.mjs](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/cloudflare-d1/src/operator-task-edge-v2.mjs) | `autonomous-printshop/sources/trendos/operator-task/operator-task-edge-v2.mjs` | `KEEP_UPSTREAM_UNTIL_D1_CUTOVER` |
| TrendOS | Material Control | [gaber-material-control-v1.js](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/gaber-material-control-v1.js) | `autonomous-printshop/sources/trendos/material-control/gaber-material-control-v1.js` | `KEEP_UPSTREAM_UNTIL_GENERALIZED_REPLACEMENT` |
| TrendOS | Material Control | [gaber-material-movement-ledger-v1.js](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/gaber-material-movement-ledger-v1.js) | `autonomous-printshop/sources/trendos/material-control/gaber-material-movement-ledger-v1.js` | `KEEP_UPSTREAM_UNTIL_GENERALIZED_REPLACEMENT` |
| TrendOS | Material Control | [gaber-material-persistence-v1.js](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/gaber-material-persistence-v1.js) | `autonomous-printshop/sources/trendos/material-control/gaber-material-persistence-v1.js` | `KEEP_UPSTREAM_UNTIL_GENERALIZED_REPLACEMENT` |
| TrendOS | Material Control | [gaber-material-persistence-backend-v1.gs](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/gaber-material-persistence-backend-v1.gs) | `autonomous-printshop/sources/trendos/material-control/gaber-material-persistence-backend-v1.gs` | `KEEP_UPSTREAM_UNTIL_D1_REPLACEMENT` |
| TrendOS | Material Control | [gaber-material-ui-v1.js](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/gaber-material-ui-v1.js) | `autonomous-printshop/sources/trendos/material-control/gaber-material-ui-v1.js` | `KEEP_UPSTREAM_UNTIL_GENERALIZED_REPLACEMENT` |
| TrendOS | Material Control | [gaber-material-ui-backend-v1.gs](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/gaber-material-ui-backend-v1.gs) | `autonomous-printshop/sources/trendos/material-control/gaber-material-ui-backend-v1.gs` | `KEEP_UPSTREAM_UNTIL_D1_REPLACEMENT` |
| TrendOS | Material Control | [gaber-material-waste-decision-v1.gs](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/gaber-material-waste-decision-v1.gs) | `autonomous-printshop/sources/trendos/material-control/gaber-material-waste-decision-v1.gs` | `KEEP_UPSTREAM_UNTIL_D1_REPLACEMENT` |
| TrendOS | Material Control | [gaber-ledger-daily-report-v1.js](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/gaber-ledger-daily-report-v1.js) | `autonomous-printshop/sources/trendos/material-control/gaber-ledger-daily-report-v1.js` | `KEEP_UPSTREAM_UNTIL_GENERALIZED_REPLACEMENT` |
| TrendOS | Material Control | [gaber-easystore-ledger-adapter-v1.js](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/gaber-easystore-ledger-adapter-v1.js) | `autonomous-printshop/sources/trendos/material-control/gaber-easystore-ledger-adapter-v1.js` | `KEEP_UPSTREAM_UNTIL_NEW_EASYSTORE_ADAPTER` |
| TrendOS | Material Control | [gaber-daily-material-flow-v1.js](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/gaber-daily-material-flow-v1.js) | `autonomous-printshop/sources/trendos/material-control/gaber-daily-material-flow-v1.js` | `KEEP_UPSTREAM_UNTIL_GENERALIZED_REPLACEMENT` |
| TrendOS | Employee Supervisor | [employee-manager-strips-v2.js](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/employee-manager-strips-v2.js) | `autonomous-printshop/sources/trendos/employee-supervisor/employee-manager-strips-v2.js` | `KEEP_UPSTREAM_UNTIL_SUPERVISOR_REPLACEMENT` |
| TrendOS | Employee Supervisor | [employee-ops-coach-v1.js](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/employee-ops-coach-v1.js) | `autonomous-printshop/sources/trendos/employee-supervisor/employee-ops-coach-v1.js` | `KEEP_UPSTREAM_UNTIL_SUPERVISOR_REPLACEMENT` |
| TrendOS | Employee Supervisor | [employee-andon-v1.js](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/employee-andon-v1.js) | `autonomous-printshop/sources/trendos/employee-supervisor/employee-andon-v1.js` | `KEEP_UPSTREAM_UNTIL_STRUCTURED_D1_ANDON` |
| TrendOS | Customer/Comms | [customer-manager-v1.js](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/customer-manager-v1.js) | `autonomous-printshop/sources/trendos/customer-comms/customer-manager-v1.js` | `KEEP_UPSTREAM_LIVE_DEPENDENCY` |
| TrendOS | Customer/Comms | [customer-feedback-v1.js](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/customer-feedback-v1.js) | `autonomous-printshop/sources/trendos/customer-comms/customer-feedback-v1.js` | `KEEP_UPSTREAM_LIVE_DEPENDENCY` |
| TrendOS | Customer/Comms | [customer-manager-send-integrity-v1.js](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/customer-manager-send-integrity-v1.js) | `autonomous-printshop/sources/trendos/customer-comms/customer-manager-send-integrity-v1.js` | `KEEP_UPSTREAM_LIVE_DEPENDENCY` |
| TrendOS | Customer/Comms | [customer-manager-backend-v1932.gs](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/customer-manager-backend-v1932.gs) | `autonomous-printshop/sources/trendos/customer-comms/customer-manager-backend-v1932.gs` | `KEEP_UPSTREAM_LIVE_DEPENDENCY` |
| TrendOS | Customer/Comms | [trendos-whatsapp-integrity-v1.gs](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/trendos-whatsapp-integrity-v1.gs) | `autonomous-printshop/sources/trendos/customer-comms/trendos-whatsapp-integrity-v1.gs` | `KEEP_UPSTREAM_LIVE_DEPENDENCY` |
| TrendOS | Whats Agent Book | [WHATS_AGENT_BOOK.md](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/WHATS_AGENT_BOOK.md) | `autonomous-printshop/sources/trendos/books/WHATS_AGENT_BOOK.md` | `KEEP_UPSTREAM_CANONICAL_WHATS_BOOK` |
| Matbagy-OS | Orchestrator | [runtime/orchestrator-core.mjs](https://github.com/fawakhry/Matbagy-OS/blob/main/runtime/orchestrator-core.mjs) | `autonomous-printshop/sources/matbagy-os/runtime/orchestrator-core.mjs` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy-OS | Orchestrator | [runtime/orchestrator-runtime.mjs](https://github.com/fawakhry/Matbagy-OS/blob/main/runtime/orchestrator-runtime.mjs) | `autonomous-printshop/sources/matbagy-os/runtime/orchestrator-runtime.mjs` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy-OS | Providers | [runtime/live-providers.mjs](https://github.com/fawakhry/Matbagy-OS/blob/main/runtime/live-providers.mjs) | `autonomous-printshop/sources/matbagy-os/runtime/live-providers.mjs` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy-OS | Worker | [runtime/cloudflare-worker.mjs](https://github.com/fawakhry/Matbagy-OS/blob/main/runtime/cloudflare-worker.mjs) | `autonomous-printshop/sources/matbagy-os/runtime/cloudflare-worker.mjs` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy-OS | Permissions | [runtime/permissions.mjs](https://github.com/fawakhry/Matbagy-OS/blob/main/runtime/permissions.mjs) | `autonomous-printshop/sources/matbagy-os/runtime/permissions.mjs` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy-OS | D1 Tenant Store | [runtime/d1-tenant-store.mjs](https://github.com/fawakhry/Matbagy-OS/blob/main/runtime/d1-tenant-store.mjs) | `autonomous-printshop/sources/matbagy-os/runtime/d1-tenant-store.mjs` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy-OS | Project Book | [PROJECT_BOOK.md](https://github.com/fawakhry/Matbagy-OS/blob/main/PROJECT_BOOK.md) | `autonomous-printshop/sources/matbagy-os/books/PROJECT_BOOK.md` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy-OS | Roadmap | [ROADMAP_V1_2027-06.md](https://github.com/fawakhry/Matbagy-OS/blob/main/ROADMAP_V1_2027-06.md) | `autonomous-printshop/sources/matbagy-os/books/ROADMAP_V1_2027-06.md` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy-OS | Design Case Schema | [صندوق_مطبعجي/SCHEMA/DESIGN_CASE_SCHEMA.md](https://github.com/fawakhry/Matbagy-OS/blob/main/%D8%B5%D9%86%D8%AF%D9%88%D9%82_%D9%85%D8%B7%D8%A8%D8%B9%D8%AC%D9%8A/SCHEMA/DESIGN_CASE_SCHEMA.md) | `autonomous-printshop/sources/matbagy-os/books/DESIGN_CASE_SCHEMA.md` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy-OS | AI Room Contract | [صندوق_مطبعجي/SCHEMA/AI_ROOM_CONTRACT.md](https://github.com/fawakhry/Matbagy-OS/blob/main/%D8%B5%D9%86%D8%AF%D9%88%D9%82_%D9%85%D8%B7%D8%A8%D8%B9%D8%AC%D9%8A/SCHEMA/AI_ROOM_CONTRACT.md) | `autonomous-printshop/sources/matbagy-os/books/AI_ROOM_CONTRACT.md` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy-OS | Approval Router | [صندوق_مطبعجي/SCHEMA/APPROVAL_COMMAND_ROUTER.md](https://github.com/fawakhry/Matbagy-OS/blob/main/%D8%B5%D9%86%D8%AF%D9%88%D9%82_%D9%85%D8%B7%D8%A8%D8%B9%D8%AC%D9%8A/SCHEMA/APPROVAL_COMMAND_ROUTER.md) | `autonomous-printshop/sources/matbagy-os/books/APPROVAL_COMMAND_ROUTER.md` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy-OS | Auto Persistence | [صندوق_مطبعجي/SCHEMA/AUTO_PERSISTENCE_POLICY.md](https://github.com/fawakhry/Matbagy-OS/blob/main/%D8%B5%D9%86%D8%AF%D9%88%D9%82_%D9%85%D8%B7%D8%A8%D8%B9%D8%AC%D9%8A/SCHEMA/AUTO_PERSISTENCE_POLICY.md) | `autonomous-printshop/sources/matbagy-os/books/AUTO_PERSISTENCE_POLICY.md` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy-OS | Case Learning | [صندوق_مطبعجي/SCHEMA/CASE_LIFECYCLE_AND_LEARNING.md](https://github.com/fawakhry/Matbagy-OS/blob/main/%D8%B5%D9%86%D8%AF%D9%88%D9%82_%D9%85%D8%B7%D8%A8%D8%B9%D8%AC%D9%8A/SCHEMA/CASE_LIFECYCLE_AND_LEARNING.md) | `autonomous-printshop/sources/matbagy-os/books/CASE_LIFECYCLE_AND_LEARNING.md` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy-OS | Knowledge Extraction | [صندوق_مطبعجي/SCHEMA/KNOWLEDGE_EXTRACTION_CONTRACT.md](https://github.com/fawakhry/Matbagy-OS/blob/main/%D8%B5%D9%86%D8%AF%D9%88%D9%82_%D9%85%D8%B7%D8%A8%D8%B9%D8%AC%D9%8A/SCHEMA/KNOWLEDGE_EXTRACTION_CONTRACT.md) | `autonomous-printshop/sources/matbagy-os/books/KNOWLEDGE_EXTRACTION_CONTRACT.md` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy-OS | Tenancy | [صندوق_مطبعجي/SCHEMA/TENANCY_CONTRACT.md](https://github.com/fawakhry/Matbagy-OS/blob/main/%D8%B5%D9%86%D8%AF%D9%88%D9%82_%D9%85%D8%B7%D8%A8%D8%B9%D8%AC%D9%8A/SCHEMA/TENANCY_CONTRACT.md) | `autonomous-printshop/sources/matbagy-os/books/TENANCY_CONTRACT.md` | `KEEP_UPSTREAM_CANONICAL` |
| Fokha | Thinking Model | [MEMORY/THINKING_MODEL.md](https://github.com/fawakhry/Fokha/blob/main/MEMORY/THINKING_MODEL.md) | `autonomous-printshop/sources/fokha/THINKING_MODEL.md` | `KEEP_UPSTREAM_CANONICAL` |
| Fokha | Rules | [MEMORY/RULES.md](https://github.com/fawakhry/Fokha/blob/main/MEMORY/RULES.md) | `autonomous-printshop/sources/fokha/RULES.md` | `KEEP_UPSTREAM_CANONICAL` |
| Fokha | Negative Learning | [MEMORY/NEGATIVE_LEARNING.md](https://github.com/fawakhry/Fokha/blob/main/MEMORY/NEGATIVE_LEARNING.md) | `autonomous-printshop/sources/fokha/NEGATIVE_LEARNING.md` | `KEEP_UPSTREAM_CANONICAL` |
| Fokha | Project Registry | [MEMORY/PROJECTS.md](https://github.com/fawakhry/Fokha/blob/main/MEMORY/PROJECTS.md) | `autonomous-printshop/sources/fokha/PROJECTS.md` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy Evaluations | Execution Book | [evaluations/كتيب_البرنامج_والتنفيذ.md](https://github.com/fawakhry/Matbagy/blob/main/evaluations/%D9%83%D8%AA%D9%8A%D8%A8_%D8%A7%D9%84%D8%A8%D8%B1%D9%86%D8%A7%D9%85%D8%AC_%D9%88%D8%A7%D9%84%D8%AA%D9%86%D9%81%D9%8A%D8%B0.md) | `autonomous-printshop/sources/matbagy-evaluations/books/كتيب_البرنامج_والتنفيذ.md` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy Evaluations | Infrastructure | [evaluations/خطة_البنية_التحتية.md](https://github.com/fawakhry/Matbagy/blob/main/evaluations/%D8%AE%D8%B7%D8%A9_%D8%A7%D9%84%D8%A8%D9%86%D9%8A%D8%A9_%D8%A7%D9%84%D8%AA%D8%AD%D8%AA%D9%8A%D8%A9.md) | `autonomous-printshop/sources/matbagy-evaluations/books/خطة_البنية_التحتية.md` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy Evaluations | Status Log | [evaluations/سجل_الحالة.md](https://github.com/fawakhry/Matbagy/blob/main/evaluations/%D8%B3%D8%AC%D9%84_%D8%A7%D9%84%D8%AD%D8%A7%D9%84%D8%A9.md) | `autonomous-printshop/sources/matbagy-evaluations/books/سجل_الحالة.md` | `KEEP_UPSTREAM_CANONICAL` |
| Matbagy Evaluations | Recovered Worker | worker.mjs | `autonomous-printshop/recovered/evaluations/worker.mjs` | `QUARANTINE_REFACTOR_BEFORE_USE` |
| Matbagy Evaluations | Recovered Worker UI | worker_with_ui.mjs | `autonomous-printshop/recovered/evaluations/worker_with_ui.mjs` | `QUARANTINE_REFACTOR_BEFORE_USE` |
| EasyStore | Accounting Authority | [Code.gs](https://github.com/fawakhry/EasyStore/blob/main/Code.gs) | `autonomous-printshop/sources/easystore/reference/Code.gs` | `KEEP_UPSTREAM_FINANCIAL_AUTHORITY` |
| TrendOS | Control Tower / Go-Live Autopilot | [go-live-autopilot-v1.js](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/go-live-autopilot-v1.js) | `autonomous-printshop/sources/trendos/control-tower/go-live-autopilot-v1.js` | `KEEP_UPSTREAM_PATTERN_SOURCE` |
| TrendOS | Deployment Health | [v1940-deploy-health.gs](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/v1940-deploy-health.gs) | `autonomous-printshop/sources/trendos/control-tower/v1940-deploy-health.gs` | `KEEP_UPSTREAM_HEALTH_SOURCE` |
| TrendOS | Integrity Dashboard | [trendos-integrity-dashboard-v1.gs](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/trendos-integrity-dashboard-v1.gs) | `autonomous-printshop/sources/trendos/control-tower/trendos-integrity-dashboard-v1.gs` | `KEEP_UPSTREAM_HEALTH_SOURCE` |

Upstream live books/indexes:

- **TrendOS:** [TrendOS_MASTER_BOOK.md](https://github.com/fawakhry/TrendOs/blob/candidate/t12-full-cloud-cutover-a56-20260929/TrendOS_MASTER_BOOK.md) — `KEEP_UPSTREAM`.
- **TrendOS Blackbox:** [docs/trendos/blackbox/](https://github.com/fawakhry/TrendOs/tree/candidate/t12-full-cloud-cutover-a56-20260929/docs/trendos/blackbox) — `KEEP_UPSTREAM`.


## Appendix E — Complete Build Matrix

Machine-readable matrix: `autonomous-printshop/manifests/BUILD_MATRIX_V1.json`.

| ID | Module | Status | Priority | Target |
|---|---|---|---|---|
| M01 | Autonomy Control Plane | `REUSE_AND_MODERNIZE` | P0 | policy, shadow/canary/general, audit, exceptions |
| M02 | TrendOS Live Connector | `NEW_BUILD_REQUIRED` | P0 | read/write contracts + events without duplicating truth |
| M03 | AI Orchestrator | `EXTRACT_AND_ADAPT` | P0 | tool-using multi-agent orchestration under autonomy policy |
| M04 | Operator Task D1 Authority | `NEW_BUILD_REQUIRED` | P0 | D1 claim/start/complete/events retaining V2 public contract |
| M05 | Production Scheduler + Capacity/Deadline Engine | `NEW_BUILD_REQUIRED` | P0 | predict completion time, machine/operator loading, deadline promises, queue rebalance |
| M06 | Employee AI Supervisor + Andon Resolver | `REUSE_AND_MODERNIZE` | P0 | system-assigned next task, coaching, blocker auto-resolution, structured D1 Andon |
| M07 | Design Recipe Engine | `EXTRACT_AND_ADAPT` | P0 | approved product recipes, asset lineage, must_keep/must_avoid, exact dimensions/text |
| M08 | AI Preflight | `NEW_BUILD_REQUIRED` | P0 | size/aspect/DPI/text/stroke/cut/asset completeness and identity-preservation checks |
| M09 | QC Vision | `NEW_BUILD_REQUIRED` | P0 | compare produced photo/camera evidence to expected design and create rework task |
| M10 | Material / Inventory Agent | `REUSE_AND_MODERNIZE` | P0 | D1 material ledger, custody, consumption, waste, reconciliation, all departments |
| M11 | Purchasing Agent | `REUSE_AND_MODERNIZE` | P1 | shortage forecasting, purchase proposals, supplier/range policies |
| M12 | Profitability Brain | `REUSE_AND_MODERNIZE` | P1 | true contribution per order/product/customer including rework/time/waste |
| M13 | Customer/Employee Intelligence | `EXTRACT_AND_ADAPT` | P1 | evidence-first profiles, coaching signals, customer value/friction, reviewed facts |
| M14 | Customer/Whats Agent | `DEPENDENCY_BLOCKED` | P1 | AI intake, context, safe auto reply, escalation |
| M15 | Machine Agent + Local Production Bridge | `NEW_BUILD_REQUIRED` | P1 | machine capability registry, local execution bridge, telemetry, maintenance, safe one-click/auto execution |
| M16 | SOP + Training Agent | `NEW_BUILD_REQUIRED` | P1 | generate/update SOPs, contextual worker guidance, skill matrix and training |
| M17 | Self-Healing / Degraded Mode | `NEW_BUILD_REQUIRED` | P1 | provider fallback, queue fallback, degraded mode, automatic recovery and escalation |
| M18 | Control Tower + Owner Exception Console | `REUSE_AND_MODERNIZE` | P0 | shop health, deadlines, exceptions, inventory/security/finance thresholds; no routine queue management |
| M19 | Owner Simulation / Absence Test | `NEW_BUILD_REQUIRED` | P0 | 7-day and later 14-day owner-silent rehearsal, every owner intervention becomes gap/bug/policy item |
| M20 | EasyStore Finance Adapter | `REUSE_IN_PLACE` | P1 | finance remains separate authority; controlled read/post/reconcile contracts only |
| M21 | Lead Hunter / Growth | `DEFER` | P3 | growth after autonomous operations stabilizes |


### AP-006 — Consolidation complete + additions gap closed

- Central project tree contains the required reusable code snapshots, upstream source books, recovered Evaluations code, manifests, project core and tests.
- Source Registry contains 50 file-level source records plus live-book/index pointers.
- Build Matrix contains 21 autonomous modules.
- The additional capabilities requested for the owner-absent shop are now explicitly covered:
  - Control Tower / Owner Exception Console;
  - QC Vision;
  - Machine Agent + Local Production Bridge;
  - Capacity/Deadline Engine;
  - Purchasing Agent;
  - Profitability Brain;
  - SOP/Training Agent;
  - Self-Healing / Degraded Mode;
  - Owner Simulation / Absence Test.
- Existing reusable foundations were copied into the central project with source URL/SHA.
- Missing mature modules are marked `NEW_BUILD_REQUIRED`; they are not allowed to become hidden side-projects.
- Project-owned duplicate docs/code outside the central tree were removed where safe.
- Upstream runtime/canonical dependencies were deliberately retained until a verified replacement cutover; deleting them early would risk TrendOS/Matbagy/EasyStore operation.

```ini
CENTRAL_TREE=autonomous-printshop/
MASTER_BOOK=autonomous-printshop/MASTER_BOOK.md
SOURCE_REGISTRY_ENTRIES=50
BUILD_MATRIX_MODULES=21
PROJECT_OWNED_DUPLICATES_CLEANED=YES
UPSTREAM_LIVE_DEPENDENCIES_DELETED=NO_BY_DESIGN
NEXT=P0_BUILD_OPERATOR_TASK_D1_AUTHORITY_AND_TRENDOS_CONNECTOR
```


### Infrastructure exception — GitHub Actions

The project is centralized under `autonomous-printshop/`. One file must remain outside that tree because GitHub only executes workflows from `.github/workflows/`:

- `.github/workflows/autonomous-printshop-policy-v1-ci.yml`

This is infrastructure plumbing only and is not a second project book or source-of-truth location.


### AP-007 — Operations Manager recovery, filtering, and execution start

Owner instruction: recover the previously built TrendOS operations-manager/employee-guidance chain, filter it, centralize the useful parts, and begin implementation.

#### Recovered / centralized sources

- `manager-center-v1932.js` -> `sources/trendos/control-tower/manager-center-v1932.js`
- `trend-master-resilience-v1931.js` -> `sources/trendos/control-tower/trend-master-resilience-v1931.js`
- `operations-hub-v1.js` -> `sources/trendos/employee-supervisor/operations-hub-v1.js`
- `press-control-v1.js` -> `sources/trendos/machine-agent/press-control-v1.js`
- `press-control-backend-v1.gs` -> `sources/trendos/machine-agent/press-control-backend-v1.gs`
- `WORK_QUEUE_V1_CANDIDATE.md` -> lineage only, explicitly superseded
- `OPERATOR_TASK_WORKFLOW_V2_CANDIDATE.md` -> canonical product-contract reference
- `AI_Orders_View V1890` -> extracted concept reference, not copied as a Sheet authority

Machine-readable filter:
`autonomous-printshop/manifests/OPERATIONS_SUPERVISOR_FILTER_V1.json`

#### Filtering decisions

```ini
AI_ORDERS_VIEW=EXTRACT_CONCEPT_ONLY
TREND_MASTER=REUSE_AND_MODERNIZE
MANAGER_CENTER=REUSE_UX_ONLY_PLUS_SIGNAL_MODEL
TREND_MASTER_RESILIENCE=REUSE_PATTERN
EMPLOYEE_OPS_COACH=SUPERSEDED_LINEAGE
EMPLOYEE_MANAGER_STRIPS_V2=REUSE_AND_MODERNIZE
OPS_REPLY_OPS_COACH=EXTRACT_EVENT_CONTRACT
EMPLOYEE_ANDON=REUSE_AND_MODERNIZE
WORK_QUEUE_V1=DROP_RUNTIME_KEEP_LINEAGE
OPERATOR_TASK_V2=REUSE_PRODUCT_CONTRACT_REBUILD_AUTHORITY
PRESS_CONTROL=EXTRACT_MACHINE_AGENT_FOUNDATION
OPERATIONS_HUB=REUSE_SHELL
ATTENDANCE=REUSE_AS_AVAILABILITY_SIGNAL
EMPLOYEE_KPI_70_30=DROP_AS_DECISION_AUTHORITY
```

#### Architecture decision

The final employee-management path is not a chatbot and not a free LLM scheduler.

```
TrendOS/D1 factual state
  -> Operational Reality Snapshot
  -> deterministic eligibility / priority / readiness
  -> Operator Task D1 Authority
  -> AI Supervisor explanation / exception resolution
  -> Employee Operations Shell
  -> Andon / evidence loop
  -> Control Tower / owner exceptions only
```

Rules decide truth, eligibility, priority, idempotency, and authority.
AI may interpret context, explain decisions, propose safe recovery, and converse with employees, but it does not invent operational facts.

#### First executable core started

Created:

- `autonomous-printshop/core/operational-reality-v1.mjs`
- `autonomous-printshop/tests/operational_reality_v1.test.mjs`

Current behavior:

- normalizes legacy/current order-line facts;
- separates ordinary work / Fly Print / closed work / exceptions;
- keeps Fly Print outside ordinary Task assignment;
- fails closed when delivery due date is missing/invalid;
- fails closed on explicit design/material/machine blockers;
- supports strict readiness qualification when requested;
- deterministic order:
  `Urgent DESC -> Due ASC -> Order ASC -> Line ASC`;
- refuses a new recommendation if the operator already has an active ordinary Task;
- refuses assignment when the operator is unavailable;
- emits evidence/reason codes with the recommended Task.

This is repository-only shadow foundation. It does not read Production, mutate D1, assign a real employee, or change live TrendOS behavior.

#### Build Matrix changes

- Operational Reality Snapshot added as P0 module M22 — implementation started repo-only.
- Production Scheduler M05 now explicitly reuses Operational Reality + Operator Task contract.
- Employee Supervisor M06 now includes Operations Hub + Operational Reality.
- Machine Agent M15 changed from NEW_BUILD_REQUIRED to REUSE_AND_MODERNIZE because Press Control provides a usable machine-session/telemetry foundation.
- Control Tower M18 now explicitly includes Manager Center + Trend Master resilience.

#### Qualification

Operational Reality contract is included in:
`.github/workflows/autonomous-printshop-policy-v1-ci.yml`

Verified CI:
- Run `37245044872` — SUCCESS on centralized CI including Operational Reality test.
- Run `37245085030` — SUCCESS after source-registry update.
- Latest build-matrix run `37245102259` was in progress when this entry was written; earlier same-code qualification already passed.

#### Safety boundary

```ini
PRODUCTION_DEPLOY=NO
D1_MUTATION=NO
APPS_SCRIPT_CHANGE=NO
EMPLOYEE_LIVE_ASSIGNMENT=NO
AUTOPILOT=OFF
EXECUTION_STATE=REPO_ONLY_SHADOW_FOUNDATION_STARTED
```

Next P0 implementation:
1. finish Autonomy Event Ledger schema correction before Production migration;
2. connect Operational Reality to stable TrendOS/D1 facts through a read-only adapter;
3. build D1 Operator Task authority default OFF;
4. feed Employee Supervisor UI from authoritative assignment rather than client-side first-row logic.


### AP-008 — Autonomy ledger schema corrected before any D1 apply

The repo-only migration candidate `0019_autonomy_events_v1.sql` was corrected before Production application.

Resolved design defects:

1. Decision events are now immutable decision facts only.
2. Later human/runtime observations were moved to append-only `autonomy_observations`.
3. Both actual policy decision and recommended decision are stored:
   - `decision / reason / target_queue`
   - `recommended_decision / recommended_reason / recommended_target_queue`
4. Input hashing now uses stable canonical JSON with recursively sorted object keys before SHA-256.
5. `autonomy_control` now carries `updated_by` and `change_reason`.
6. Every control-row update is automatically captured by an append-only `autonomy_control_events` audit trigger.
7. Append-only UPDATE/DELETE guards cover:
   - `autonomy_events`
   - `autonomy_observations`
   - `autonomy_control_events`

New ledger API:
- `stableCanonicalJsonV1()`
- `autonomyInputHashV1()`
- `recordAutonomyShadowEventV1()`
- `recordAutonomyObservationV1()`
- `readAutonomyControlV1()`

Qualification:
- Autonomous Printshop Policy V1 CI Run `37245267601` — **SUCCESS**.
- Stable-hash equivalence for differently ordered object keys = PASS.
- Observation split = PASS.
- Recommended-vs-actual shadow decision persistence = PASS.
- Destructive DDL = NO.

```ini
MIGRATION_0019=CORRECTED_REPO_ONLY
MIGRATION_0019_APPLIED_PRODUCTION=NO
AUTONOMY_EVENTS=APPEND_ONLY_DECISIONS
AUTONOMY_OBSERVATIONS=APPEND_ONLY
AUTONOMY_CONTROL_AUDIT=APPEND_ONLY_TRIGGER
INPUT_HASH=STABLE_CANONICAL_JSON_SHA256
AUTOPILOT=OFF
```

Next safe build remains:
`Operational Reality read adapter -> D1 Operator Task Authority default OFF -> Employee Supervisor shadow`.


### AP-009 — TrendOS/D1 Operational Reality read adapter started and qualified

Created:
- `autonomous-printshop/core/trendos-operational-reality-read-adapter-v1.mjs`
- `autonomous-printshop/tests/trendos_operational_reality_read_adapter_v1.test.mjs`

The adapter intentionally uses the already-qualified TrendOS Edge Orders read contract:
- version: `D1_ORDERS_READ_V1`
- source: `d1-edge-orders`
- page envelope: rows + pagination + dataVersion + mirror metadata + Edge session identity.

It is dependency-injected and performs no network call itself. A future runtime composition may provide the authenticated read function.

Safety / correctness rules:
- read only;
- source version must be exactly qualified;
- source authority must be D1 Edge Orders;
- all pages must be collected before a snapshot is accepted;
- page budget overflow fails closed rather than returning a partial shop state;
- dataVersion change between pages fails closed;
- Edge-session identity change during snapshot fails closed;
- pagination changing during snapshot fails closed;
- source/mirror read failure fails closed.

The complete rows are then passed into `Operational Reality V1`, which applies the deterministic task eligibility/priority contract.

Qualification:
- CI Run `37245407155` — **SUCCESS** including:
  - autonomy policy;
  - corrected autonomy event ledger;
  - Operational Reality core;
  - TrendOS reality read adapter.

```ini
TRENDOS_REALITY_ADAPTER=REPO_ONLY_QUALIFIED
SOURCE_CONTRACT=D1_ORDERS_READ_V1
SOURCE_AUTHORITY=d1-edge-orders
PARTIAL_SNAPSHOT=FAIL_CLOSED
DATA_VERSION_DRIFT=FAIL_CLOSED
PRODUCTION_NETWORK_WIRING=NO
PRODUCTION_WRITE=NO
```

Next implementation target:
`D1 Operator Task Authority schema + pure claim/complete core, default OFF`.


### AP-010 — Live Production Shadow entered service

An isolated Cloudflare Worker was deployed for the autonomous-printshop program:

- Worker: `autonomous-printshop-shadow`
- URL: `https://autonomous-printshop-shadow.trendmall-contact.workers.dev`
- Authority: read-only access to `trendos-main` D1.
- Main TrendOS Worker changed: NO.
- Business write authority changed: NO.
- Employee assignment changed: NO.
- PII/raw Order IDs/raw Line IDs exposed by the shadow API: NO.

The Worker qualifies the current Zero-Google operational truth before producing a snapshot:
- committed Entry615 backfill run required;
- exact source snapshot SHA required;
- committed target counts must match current D1 counts;
- imported/native Order and Line identity overlap must be zero;
- failed parity rows fail closed;
- T12 runtime overlays are applied on top of the qualified baseline.

Hourly monitor:
`.github/workflows/autonomous-printshop-production-shadow-monitor.yml`

First qualified live snapshot after source qualification:
- source rows: 458
- source composition:
  - Entry615 import + legacy runtime: 211
  - T12 native + runtime: 247
- main TrendOS health preserved.
- D1 mutation from shadow Worker: NO.

Production qualification/deploy evidence:
- Sidecar deployment Run `37247648334` — SUCCESS.
- Hourly monitor Run `37247671075` — SUCCESS.

```ini
AUTONOMOUS_PRINTSHOP_PRODUCTION_SHADOW=LIVE
MODE=PRODUCTION_SHADOW_READ_ONLY
MAIN_TRENDOS_WORKER_CHANGED=NO
D1_BUSINESS_WRITE=NO
EMPLOYEE_ASSIGNMENT=NO
```


### AP-011 — Autonomy and Operator Task D1 foundations applied Default-OFF

The corrected additive D1 foundations were applied to `trendos-main` by controlled workflow.

Applied:
- `0019_autonomy_events_v1.sql`
- `0020_operator_task_authority_v1.sql`

Verified after apply:
- Autonomy tables = 4.
- `autonomy_control.mode=OFF`.
- Operator Task authority tables = 4.
- `operator_task_control.mode=OFF`.
- autonomy decision event count = 0.
- operator task count = 0.
- employee assignment behavior changed = NO.
- business order write behavior changed = NO.

Controlled Production evidence:
- Run `37247713195` — SUCCESS.

```ini
AUTONOMY_SCHEMA=APPLIED_DEFAULT_OFF
OPERATOR_TASK_SCHEMA=APPLIED_DEFAULT_OFF
AUTOPILOT=OFF
OPERATOR_TASK_AUTHORITY=OFF
LIVE_TASK_ASSIGNMENT=NO
```


### AP-012 — Native Order Schedule metadata applied and consumed by Production Shadow

The production shadow initially failed closed on Native pending work because T12 Native Orders did not persist an expected-delivery field usable by the scheduler.

Readonly diagnostic proved:
- native Orders = 226;
- first Native created_at = 2026-09-27 19:45:21 UTC;
- last Native created_at = 2026-10-04 18:38:51 UTC;
- Fly Print Orders = 18.

Added and applied:
`autonomous-printshop/migrations/0021_t12_order_schedule_v1.sql`

Policy preserved from legacy TrendOS:
- Fly Print -> same Cairo local business date.
- Standard work -> Cairo local registration date + 2 calendar days.

Post-apply Production proof:
- native Orders = 226;
- schedule rows = 226;
- missing schedule rows = 0;
- policy mismatches = 0;
- policy rows = 226.

Controlled apply:
- Run `37299705413` — SUCCESS.

Production Shadow now treats the schedule table as a required qualification gate. If schedule coverage/policy diverges, it fails closed.

Latest qualified Shadow deployment:
- Run `37299839572` — SUCCESS.
- Worker Version ID `74dae02f-3280-4907-a746-0bde6ec3a058`.

Live snapshot after schedule activation:
- ordinary dispatch candidates = 30;
- due-date exceptions = 0;
- closed = 417;
- in-progress = 11;
- recommendation exists = YES;
- recommendation department = Laser;
- recommendation priority = Normal;
- business mutation = NO.

```ini
NATIVE_ORDER_SCHEDULE=PRODUCTION_APPLIED
SCHEDULE_ROWS=226
SCHEDULE_MISSING=0
SCHEDULE_POLICY_MISMATCH=0
PRODUCTION_SHADOW_ORDINARY=30
PRODUCTION_SHADOW_EXCEPTIONS=0
PRODUCTION_SHADOW_RECOMMENDATION=YES
EMPLOYEE_ASSIGNMENT=NO
```

Next:
`Employee Supervisor Shadow -> active-task/availability/readiness inputs -> controlled Operator Task Canary`.


### AP-013 — Employee Supervisor Shadow live on Production facts

Employee Supervisor Shadow is now deployed through the isolated read-only sidecar.

Core:
- `autonomous-printshop/core/employee-supervisor-shadow-v1.mjs`
- `autonomous-printshop/tests/employee_supervisor_shadow_v1.test.mjs`

Live route:
- `GET https://autonomous-printshop-shadow.trendmall-contact.workers.dev/supervisor`

Authority boundaries:
- legacy `assignedTo` is a comparison/routing baseline only;
- Attendance is availability evidence only;
- `missed_check` becomes `REVIEW_REQUIRED`, never an adverse employee judgment;
- an existing active Operator Task blocks a new recommendation;
- no employee identity is exposed by the public Shadow payload;
- no raw Order/Line IDs are exposed;
- no D1 mutation;
- no live employee assignment.

First real Production Shadow evidence:
- known operators = 4;
- currently available = 1;
- unavailable = 3;
- review required = 1;
- workday not started = 2;
- existing active Operator Tasks = 0;
- operators with a Shadow recommendation = 1;
- line-to-employee baseline coverage = 447 / 458 = 97.6%;
- unmatched/unassigned rows = 11 and all were CLOSED at observation time.

Runtime gap discovered and corrected:
- `employee_hr_employees_v1.primary_department` is blank in current data.
- The Supervisor no longer invents a department.
- If the profile department is blank, it derives the current operational department from ACTIVE assigned work.
- If active assigned work spans multiple departments, the label is `MULTI`.
- Closed historical work does not determine the current operational department.

Latest live derived department snapshot:
- Laser: 1 operator; 1 available; 274 baseline assigned rows; 30 ordinary; 11 in progress; 1 recommendation.
- Print: 1 operator; currently unavailable; 173 baseline assigned rows.
- Unspecified: 2 operators with no currently matched assigned workload; no recommendation.

Qualification evidence:
- Employee Supervisor core CI after active-work department derivation: Run `37300800825` — SUCCESS.
- Live Sidecar deploy with derived department logic: Run `37301082068` — SUCCESS.
- Main TrendOS production Worker remained unchanged.

```ini
EMPLOYEE_SUPERVISOR_SHADOW=PRODUCTION_LIVE
ROUTING_AUTHORITY=LEGACY_ASSIGNMENT_BASELINE_ONLY
ATTENDANCE=AVAILABILITY_EVIDENCE_ONLY
OPERATOR_TASK_CONTROL=OFF
LIVE_EMPLOYEE_ASSIGNMENT=NO
D1_MUTATION=NO
ASSIGNMENT_BASELINE_COVERAGE=97.6%
```

Next:
`Readiness Shadow (material / machine / design evidence) -> readiness-qualified Task recommendation -> Operator Task Shadow authority`.
