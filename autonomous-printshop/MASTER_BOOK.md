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


### AP-014 — Readiness Evidence foundation applied Default-OFF

Readiness was implemented as append-only evidence, not as free mutable booleans.

Added:
- `autonomous-printshop/migrations/0023_readiness_evidence_v1.sql`
- `autonomous-printshop/core/readiness-evidence-v1.mjs`
- `autonomous-printshop/tests/readiness_evidence_v1.test.mjs`

Evidence kinds:
- DESIGN
- MATERIAL
- MACHINE

Evidence states:
- READY
- BLOCKED
- UNKNOWN

Core rules:
- latest valid non-expired evidence wins;
- expired evidence is ignored;
- missing evidence is UNKNOWN;
- strict readiness fails closed when required evidence is UNKNOWN;
- evidence is append-only;
- control mode is OFF/SHADOW/CANARY/GENERAL and defaults to OFF;
- no employee discipline/performance judgment is derived from missing readiness evidence.

Production foundation apply:
- Run `37302083095` — SUCCESS.
- readiness tables = 3.
- `autonomous_readiness_control.mode=OFF`.
- readiness evidence rows = 0.
- readiness control events = 0.
- Orders unchanged.
- Lines unchanged.
- Operator Tasks unchanged at 0 during apply.
- Autonomy Events unchanged at 0 during apply.

Production diagnostic before evidence ingestion:
- current pending non-Fly candidates = 30;
- imported candidates = 0;
- native candidates = 30;
- design evidence present = 0;
- material/accounting mapping for those candidates = 0;
- active material catalog rows = 0;
- low-stock material rows = 0 because the catalog itself is empty;
- readiness must therefore remain SHADOW/UNKNOWN until evidence sources are populated.

The isolated production sidecar now contains a `/readiness` aggregate endpoint that evaluates the pending candidate set under strict fail-closed evidence rules without exposing employee identity or raw Order/Line IDs.

```ini
READINESS_SCHEMA=PRODUCTION_APPLIED
READINESS_CONTROL=OFF
READINESS_EVIDENCE_ROWS=0
STRICT_MISSING_EVIDENCE=FAIL_CLOSED
LIVE_ASSIGNMENT=NO
AUTOPILOT=OFF
```

Next:
`recover/maintain Native schedule coverage -> requalify Production Shadow -> observe strict Readiness Shadow -> begin evidence-source adapters`.


### AP-015 — Native Schedule recovery closed; Readiness Shadow live

Production moved while the first schedule backfill was being tested:
- Native Orders increased from 226 to 273 and then 274.
- The isolated Shadow correctly failed closed when `scheduleRows < nativeOrders`.
- No employee assignment or business write occurred during the fail-closed window.

Recovery:
- missing Native schedule rows were backfilled with the existing idempotent `0021` policy;
- `0022_t12_order_schedule_maintenance_v1.sql` installed two D1 triggers:
  - order insert -> standard Cairo create date + 2 days;
  - line insert with any Fly Print on the Order -> same Cairo create date.
- existing schedule rows remain protected by `INSERT OR IGNORE`.

Final Production qualification:
- Native Orders = 274.
- Schedule rows = 274.
- Missing schedule = 0.
- Policy mismatches = 0.
- Maintenance triggers = 2.
- Run `37359072072` — SUCCESS.
- business-table write capability in the maintenance SQL = blocked by static safety gate.
- order status mutation = NO.
- line status mutation = NO.
- employee assignment = NO.

The isolated Production Shadow was requalified after recovery:
- Sidecar Run `37358349775`, attempt 2 — SUCCESS.
- live rowCount = 507.
- ordinary candidates = 29.
- exceptions = 0.
- closed = 466.
- in-progress = 11.
- Fly Print = 1.
- recommendation exists in baseline scheduling = YES.
- main TrendOS Worker remained unchanged.

Readiness Shadow:
- route: `/readiness`
- smoke Run `37359170589` — SUCCESS.
- control mode at observation time = OFF.
- baseline candidates = 29.
- readiness evidence rows = 0.
- DESIGN: 29 UNKNOWN.
- MATERIAL: 29 UNKNOWN.
- MACHINE: 29 UNKNOWN.
- strict eligible = 0.
- strict exceptions = 29 `READINESS_UNKNOWN`.
- strict recommendation = NONE.

This is the intended fail-closed behavior. Missing evidence is never converted into READY.

```ini
NATIVE_SCHEDULE_COVERAGE=274/274
NATIVE_SCHEDULE_MAINTENANCE=LIVE
PRODUCTION_SHADOW=LIVE
BASELINE_CANDIDATES=29
READINESS_SHADOW=LIVE
READINESS_EVIDENCE=0
STRICT_ELIGIBLE=0
LIVE_ASSIGNMENT=NO
AUTOPILOT=OFF
```

Next:
`activate Autonomy/Readiness control as SHADOW only -> persist append-only shadow observations -> build evidence-source adapters`.


### AP-016 — Shadow control plane, observer, readiness collector, and Control Tower live

The autonomous runtime moved from passive schema-only state into measured SHADOW operation without enabling live employee assignment.

Control activation:
- Autonomy control changed `OFF -> SHADOW`.
- Autonomy epoch = 2.
- Readiness control changed `OFF -> SHADOW`.
- Readiness epoch = 2.
- Operator Task control remained `OFF`.
- Operator Tasks remained 0.
- Business Order/Line writes from autonomous control activation = NO.
- Run `37359690953` — SUCCESS.

Shadow Decision Observer:
- isolated Worker: `autonomous-printshop-observer`.
- public health route only; no business action route.
- cron: minute 5 of each hour.
- allowed write authority: append-only `autonomy_events` / autonomy observation lineage through the autonomy ledger.
- Order write = NO.
- Line write = NO.
- Operator Task write = NO.
- Employee assignment = NO.
- initial deploy health: PASS.
- deploy Run `37360194500` — SUCCESS.

Readiness Evidence Collector:
- isolated Worker: `autonomous-printshop-readiness-collector`.
- cron: every 10 minutes.
- allowed write authority: `autonomous_readiness_evidence` only.
- conservative source adapters currently include:
  - legacy Design `ready` evidence only when the legacy source contains an explicit recognized value;
  - Material `BLOCKED` evidence only when a mapped material has declared consumption and catalog stock is explicitly below requirement.
- it does NOT infer READY from absence of a problem.
- it does NOT invent Material or Machine evidence.
- Order write = NO.
- Line write = NO.
- Material ledger write = NO.
- Operator Task write = NO.
- Employee assignment = NO.
- deploy Run `37361344636` — SUCCESS.

Control Tower:
- aggregate route: `/control-tower` on the isolated Production Shadow Worker.
- source authority: `trendos-main-d1` through qualified read-only adapters.
- aggregates:
  - operational counts;
  - employee availability and department coverage;
  - readiness coverage and strict eligibility;
  - Autonomy / Readiness / Operator Task control modes;
  - shadow-learning counts;
  - owner/management attention signals.
- no PII, employee identity, raw Order IDs, or raw Line IDs are exposed.
- writesAccepted = false.
- d1Mutation = false.
- employeeAssignment = false.
- deploy/qualification Run `37361509405` — SUCCESS.

Latest verified Sidecar snapshot during AP-016 qualification:
- Native Orders = 278.
- Schedule rows = 278.
- Missing schedules = 0.
- total normalized rows = 511.
- ordinary baseline candidates = 33.
- in progress = 11.
- Fly Print = 1.
- closed = 466.
- Employee Supervisor assignment baseline coverage = 500 / 511 = 97.85%.
- Operator Task control = OFF.
- withActiveTask = 0.
- live employee assignment = NO.

```ini
AUTONOMY_CONTROL=SHADOW
AUTONOMY_EPOCH=2
READINESS_CONTROL=SHADOW
READINESS_EPOCH=2
OPERATOR_TASK_CONTROL=OFF
SHADOW_OBSERVER=PRODUCTION_LIVE
READINESS_COLLECTOR=PRODUCTION_LIVE
CONTROL_TOWER=PRODUCTION_SHADOW_LIVE
LIVE_EMPLOYEE_ASSIGNMENT=NO
AUTOPILOT_EXECUTION=NO
```

Next:
`observe accumulated Shadow/Evidence history -> finish read-only shop dashboard -> add trustworthy Design/Material/Machine evidence sources -> qualify first readiness-complete task path`.


### AP-017 — Current handoff snapshot after network interruptions

This entry is the canonical continuation point for the next chat. It reconciles repository state, successful Production runtime evidence, and incomplete/failed candidate work. Do not infer success from file existence alone.

#### 1. Current Production Shadow truth

Direct live runtime verification on 2026-10-06:

- Control Tower route is LIVE:
  - `https://autonomous-printshop-shadow.trendmall-contact.workers.dev/control-tower`
- source authority = `trendos-main-d1`
- mode = `CONTROL_TOWER_SHADOW`
- writesAccepted = false
- d1Mutation = false
- employeeAssignment = false
- PII/raw Order IDs/raw Line IDs exposed = NO

Latest observed Production facts:
- Native Orders = 292
- Native schedule rows = 292
- missing schedule = 0
- schedule policy mismatches = 0
- normalized operational rows = 525
- ordinary baseline candidates = 29
- in progress = 11
- Fly Print = 1
- closed = 484
- operational exceptions = 0

```ini
NATIVE_ORDER_SCHEDULE=292/292
SCHEDULE_MISSING=0
SCHEDULE_POLICY_MISMATCH=0
CONTROL_TOWER=LIVE
CONTROL_TOWER_MODE=SHADOW
BUSINESS_WRITE=NO
LIVE_EMPLOYEE_ASSIGNMENT=NO
```

#### 2. Employee Supervisor Shadow

Current live aggregate:
- operators known = 4
- available = 2
- unavailable = 2
- review required = 2
- active Operator Tasks = 0
- operators with strict recommendation = 0
- assignment baseline coverage = 514 / 525 = 97.9048%
- unmatched/unassigned rows = 11

Current department aggregation:
- Laser:
  - operators = 1
  - available = 0
  - assigned rows = 308
  - ordinary = 20
  - in progress = 11
- Print:
  - operators = 1
  - available = 0
  - assigned rows = 206
  - ordinary = 9
  - in progress = 0
- Unspecified:
  - operators = 2
  - available = 2
  - no matched current assigned workload

Attendance remains availability evidence only. `REVIEW_REQUIRED` is not an adverse employee judgment.

#### 3. Autonomy / Readiness control plane

Current live controls:
- `autonomy_control.mode=SHADOW`
- Autonomy epoch = 2
- `autonomous_readiness_control.mode=SHADOW`
- Readiness epoch = 2
- `operator_task_control.mode=OFF`
- active Operator Tasks = 0

No employee assignment is authorized while Operator Task authority remains OFF.

#### 4. Shadow Decision Observer is accumulating real history

Worker:
`autonomous-printshop-observer`

Current live health:
- service = `autonomous-printshop-shadow-observer`
- mode = `SHADOW_OBSERVER`
- autonomy mode = SHADOW
- readiness mode = SHADOW
- autonomy decision events = 5
- autonomy observations = 0
- Operator Tasks = 0
- business writes = false
- employee assignment = false

This proves the scheduled observer is now running and accumulating append-only Shadow decision history.

```ini
SHADOW_OBSERVER=LIVE
AUTONOMY_EVENTS=5
AUTONOMY_OBSERVATIONS=0
OPERATOR_TASKS=0
BUSINESS_WRITE=NO
```

#### 5. Readiness remains correctly fail-closed

Current Control Tower readiness:
- baseline candidates = 29
- strict eligible = 0
- strict blocked = 29
- readiness evidence rows = 0
- required kinds:
  - DESIGN
  - MATERIAL
  - MACHINE
- DESIGN: 0 ready / 0 blocked / 29 unknown
- MATERIAL: 0 ready / 0 blocked / 29 unknown
- MACHINE: 0 ready / 0 blocked / 29 unknown
- strict exception = `READINESS_UNKNOWN` for all 29
- strict recommendation = NONE

This is intentional. Missing evidence must never be converted to READY.

#### 6. Readiness Collector Production status

Worker:
`autonomous-printshop-readiness-collector`

Latest live health:
- mode = `READINESS_EVIDENCE_COLLECTOR`
- readinessMode = SHADOW
- evidenceRows = 0
- Operator Tasks = 0
- writeAuthority = `AUTONOMOUS_READINESS_EVIDENCE_ONLY`
- businessWrites = false
- employeeAssignment = false
- designEvidenceSchemaReady = false
- designMode = `ABSENT`

Therefore:
- the collector is LIVE;
- it is correctly refusing to fabricate READY evidence;
- the Design production evidence schema is NOT Production-applied yet.

Latest successful collector deploy after safe design-schema probing:
- Run `37473815500` — SUCCESS.

#### 7. Read-only Dashboard status

Dashboard Worker:
`autonomous-printshop-dashboard`

URL:
`https://autonomous-printshop-dashboard.trendmall-contact.workers.dev`

Confirmed live:
- root page renders `مركز المطبعة الذاتية`;
- `/health` returns success;
- mode = `READ_ONLY_CONTROL_TOWER_UI`;
- businessWrites = false;
- employeeAssignment = false;
- D1 binding = none;
- current deployed Worker Version ID observed in deploy logs:
  `1293a20c-acbe-4a44-b454-ef43d7bf7ad8`.

However dashboard data transport is NOT yet qualified:
- latest controlled deploy Run `37474274478` uploaded/deployed the Worker but concluded FAILURE;
- verification failed because the expected dashboard state route returned HTTP 404;
- direct runtime verification also confirmed the state route 404;
- the root shell and health are live, but the dashboard must not be treated as an operationally qualified data view until the state-route mismatch is fixed and a full deploy verification passes.

```ini
DASHBOARD_WORKER=DEPLOYED
DASHBOARD_ROOT=LIVE
DASHBOARD_HEALTH=PASS
DASHBOARD_DATA_ROUTE=FAIL_404
DASHBOARD_OPERATIONAL_QUALIFICATION=NO
BUSINESS_WRITE=NO
```

#### 8. Design production evidence — repo-qualified, not Production-applied

Built centrally:
- `autonomous-printshop/migrations/0024_design_production_evidence_v1.sql`
- `autonomous-printshop/core/design-production-evidence-v1.mjs`
- `autonomous-printshop/core/design-preflight-v1.mjs`
- `autonomous-printshop/design/DESIGN_RECIPE_CATALOG_V1.json`
- associated tests.

Hard rules now encoded:
- SAVED is not Approved.
- Design READY requires a real linked asset.
- content hash is required.
- Preflight must PASS.
- approval must be qualified:
  - customer/owner approval where required; or
  - explicit policy approval with policy reference where approval is not required.
- rejected output = BLOCKED.
- missing visual evidence = UNKNOWN, never PASS.
- identity-preservation constraints remain hard gates where required.

First executable recipe catalog includes:
- Mug 20×9
- Graduation/Cut Sticker 7×10
- Official ID 4×6
- Collage 50×70

The design evidence contract itself was CI-qualified, including:
`READY_REQUIRES=LINKED_ASSET+HASH+PREFLIGHT_PASS+QUALIFIED_APPROVAL`.

Production apply status:
- NOT QUALIFIED / NOT APPLIED.
- the controlled Design Evidence apply Run `37367627004` failed at its static safety gate before schema apply.
- current Collector runtime independently confirms:
  `designEvidenceSchemaReady=false`, `designMode=ABSENT`.

Do not claim Production Design Evidence tables exist until a new controlled apply proves them.

#### 9. Storage-agnostic Design Asset Binding — repo-only

Built:
- `autonomous-printshop/migrations/0025_design_asset_binding_v1.sql`
- `autonomous-printshop/core/design-asset-linking-v1.mjs`
- associated tests.

Rules:
- storage provider is not hard-coded to Google Drive;
- tenant mismatch fails closed;
- a LINKED asset requires a real provider + storage reference;
- `CUSTOMER_PRIVATE` assets cannot use explicitly public storage classes;
- binding events are append-only;
- Production Design readiness now requires a qualified linked asset.

Production apply:
- NOT qualified / NOT proven.
- prior controlled asset-binding run did not reach a successful qualification.
- treat this layer as repo-only until a successful controlled apply and D1 verification.

#### 10. Machine Readiness — repo-only foundation

Repo work exists for:
- default-OFF Machine Readiness foundation;
- freshness-aware machine readiness derivation;
- fail-closed machine mapping/evidence rules;
- controlled apply workflow.

The prior Machine Readiness controlled apply did not finish successfully. Therefore:
- do not treat Machine Readiness schema as Production authority;
- current strict readiness still has MACHINE = UNKNOWN for all 29 candidates.

#### 11. Observer run telemetry ledger — not Production-qualified

Repo work exists for append-only observer-run telemetry and related helpers/tests.

Its prior controlled apply did not finish successfully. The core Shadow Observer itself is live and has already produced 5 autonomy decision events, but the separate run-telemetry ledger must remain classified as NOT Production-qualified until re-applied and verified.

#### 12. EasyStore / Material authority boundary remains unchanged

EasyStore remains the separate financial/material authority.

Autonomous Printshop must consume material availability through a read-only connector contract. It must not:
- duplicate financial authority;
- mutate EasyStore through the readiness layer;
- treat purchase as production cost;
- synthesize unexplained variance as waste.

Current readiness evidence remains MATERIAL UNKNOWN because a trustworthy production material evidence path is not yet connected.

#### 13. Current operational safety state

```ini
AUTONOMY=SHADOW
READINESS=SHADOW
OPERATOR_TASK=OFF
AUTOPILOT_EXECUTION=NO
LIVE_EMPLOYEE_ASSIGNMENT=NO
AUTONOMY_EVENTS=5
READINESS_EVIDENCE_ROWS=0
STRICT_ELIGIBLE=0
BASELINE_CANDIDATES=29
DESIGN_SCHEMA_PRODUCTION=ABSENT
MACHINE_READINESS_PRODUCTION=NOT_PROVEN
DASHBOARD_WORKER=LIVE_BUT_DATA_ROUTE_UNQUALIFIED
MAIN_TRENDOS_AUTHORITY=UNCHANGED
```

#### 14. Exact continuation order for next chat

Continue without rebuilding completed foundations:

1. fix and fully qualify the Dashboard state/data route; prove live page receives Control Tower JSON;
2. repair the overly broad Design Evidence apply safety gate, then controlled-apply `0024` Default-OFF and verify D1;
3. controlled-apply `0025` Asset Binding only after `0024` is proven;
4. reconnect/redeploy Design collector integration and confirm `designEvidenceSchemaReady=true`;
5. qualify/apply Machine Readiness foundation Default-OFF;
6. connect a trustworthy material-readiness adapter to EasyStore/financial authority through read-only evidence;
7. allow the collector to accumulate real DESIGN/MATERIAL/MACHINE evidence;
8. prove at least one real candidate becomes readiness-complete in SHADOW;
9. only after sustained Shadow evidence, consider Operator Task Canary. Do not enable Operator Task or live assignment without an explicit qualified canary decision.


### AP-018 — Dashboard qualified + Design/Machine foundations applied

Runtime/GitHub evidence after the interrupted session was reconciled using the authority order Runtime > deployed > tested > repo-only > historical.

#### Dashboard
- Production Worker: `autonomous-printshop-dashboard`.
- Live URL: `https://autonomous-printshop-dashboard.trendmall-contact.workers.dev`.
- Service-binding state transport is now qualified.
- Controlled deploy Run `37483382163` = SUCCESS.
- Live `/state` returns `CONTROL_TOWER_SHADOW` JSON.
- No D1 binding, business write, employee assignment, or autopilot execution was introduced.

#### Shadow Observer
- Observer is not stuck.
- Live autonomy decision events observed = 6.
- Operator Tasks = 0.
- Business writes = false.
- Employee assignment = false.
- Therefore the previously planned preview endpoint was not needed; scheduled execution itself is proven live.

#### Design Production Evidence 0024
- Controlled apply Run `37483133975` = SUCCESS.
- Verified tables = 5.
- `autonomous_design_control.mode=OFF`, epoch 1.
- artifacts = 0; approvals = 0; preflights = 0.
- Operator Task control remained OFF.

#### Design Asset Binding 0025
- Controlled apply Run `37483523898` = SUCCESS; later safety-gate correction run `37483546962` also = SUCCESS.
- Design evidence prerequisite passed.
- Append-only binding schema applied empty.
- Storage provider remains agnostic.
- CUSTOMER_PRIVATE public storage remains forbidden.
- Design control remained OFF; Operator Task remained OFF.

#### Readiness Collector refresh
- Collector redeployed after Design schema qualification.
- Runs `37483709595`, `37483973525`, and `37483980808` = SUCCESS.
- Live health now reports `designEvidenceSchemaReady=true`, `designMode=OFF`.
- Collector write authority remains `AUTONOMOUS_READINESS_EVIDENCE_ONLY`.
- Business writes = false; employee assignment = false.

#### Machine Readiness 0027
- Safety gate repaired to allow append-only `BEFORE DELETE` trigger guards while still forbidding `DELETE FROM` and destructive schema operations.
- Controlled apply Run `37483716971` = SUCCESS.
- Machine readiness foundation is applied Default-OFF and empty.
- Machine READY synthesis remains forbidden.
- Explicit machine registry/mapping/observation path was connected into the readiness collector; no mapping/observation means no MACHINE evidence.

#### Current live readiness
At verification time:
- baseline candidates = 39;
- readiness evidence rows = 0;
- DESIGN = 39 UNKNOWN;
- MATERIAL = 39 UNKNOWN;
- MACHINE = 39 UNKNOWN;
- strict eligible = 0;
- strict recommendation = none.

This is correct fail-closed behavior. No evidence was fabricated.

#### EasyStore material boundary / current gap
Source inspection confirms EasyStore has repo support for secure TrendOS employee SSO plus D1 READONLY routing. The EasyStore source qualification contract references authenticated Bearer reads to the TrendOS accounting endpoint.

However current TrendOS evidence is split:
- Entry619 EasyStore SSO Source Qualification Run `37476479548` = SUCCESS.
- Entry619 Accounting READONLY Source Qualification Run `37476479399` = FAILURE at the Production-unchanged gate.

Therefore an authenticated Production D1 material read path is **not yet proven** for Autonomous Printshop. Per policy this remains a GAP/UNKNOWN, not READY. No financial authority is moved and Autonomous Printshop does not write to EasyStore.

```ini
DASHBOARD_OPERATIONAL_QUALIFICATION=YES
DASHBOARD_STATE_ROUTE=PASS
AUTONOMY_EVENTS=6
DESIGN_EVIDENCE_0024=APPLIED_DEFAULT_OFF
DESIGN_ASSET_BINDING_0025=APPLIED_EMPTY
DESIGN_SCHEMA_READY_IN_COLLECTOR=YES
MACHINE_READINESS_0027=APPLIED_DEFAULT_OFF
MACHINE_COLLECTOR_PATH=CONNECTED_EXPLICIT_EVIDENCE_ONLY
MATERIAL_AUTHENTICATED_PRODUCTION_READ=UNKNOWN_GAP
READINESS_EVIDENCE_ROWS=0
STRICT_ELIGIBLE=0
OPERATOR_TASK_CONTROL=OFF
LIVE_EMPLOYEE_ASSIGNMENT=NO
AUTOPILOT_EXECUTION=NO
```

Next safe work:
1. qualify a real authenticated read-only material evidence path from EasyStore/TrendOS accounting authority;
2. add only explicit Machine registry/mapping/observation evidence where a real signal exists (Press first if directly evidenced);
3. keep Design control OFF until real linked asset + hash + preflight + qualified approval evidence exists;
4. accumulate SHADOW evidence and prove at least one readiness-complete real candidate before any Operator Task Canary.

### AP-019 — Shadow evidence collection controls advanced safely

This entry reconciles the next live changes after AP-018. Authority order remains Runtime > deployed > tested > repo-only > historical.

#### Design control advanced OFF -> SHADOW
- Commit `8d9b48ecabc6cb7ce7d29f21d0881df563235452` added a controlled Design SHADOW activation.
- Run `37484094517` = SUCCESS; preflight, activation, post-verification, and safety conclusion all passed.
- Activation required Design tables present, Readiness=SHADOW, Autonomy=SHADOW, Operator Task=OFF, Operator Tasks=0.
- Live collector reports `designMode=SHADOW` and `designEvidenceSchemaReady=true`.
- This does not relax Design READY: linked asset + real content SHA256 + qualified approval + preflight PASS are still required; SAVED alone remains UNKNOWN.

#### EasyStore / material authority clarification
- Live accounting health is now directly proven as `READONLY`, policy epoch 2, `authoritativeWrites=false`, Google business calls 0, Apps Script business authority false.
- Live EasyStore config enables `EASYSTORE_ACCOUNTING_D1_READONLY=true` and points to the TrendOS accounting D1 endpoint.
- Live EasyStore app routes authenticated Bearer reads for `getAccounting` and preserves the SSO handoff.
- The native `getAccounting` response contract includes `materials[]` with material id/name/department/stockQty/minStock/version and `deptLines[]` with lineId/materialName/materialConsumption.
- Repo contract `easystore-material-readonly-connector-v1.mjs` was added fail-closed: an authenticated payload is required; only explicit insufficient stock may produce MATERIAL=BLOCKED; it never synthesizes MATERIAL=READY.
- CI Run `37484869423` = SUCCESS for the connector contract.
- Read-only aggregate diagnostic Run `37485128068` = SUCCESS and performed SELECT-only diagnostics without D1 mutation or authority change.
- An autonomous background service still does not possess a separately proven employee/service Bearer credential for a live `getAccounting` business payload. Therefore authenticated payload qualification for autonomous scheduled collection remains UNKNOWN; no READY is inferred from health/config alone.

#### Press signal assessment
- Existing `pressControlV1:status` is a read-only operational session/queue signal: open session, operator, start time, queue count and configuration.
- It does not expose machine self-test, fault, maintenance health, or equivalent direct equipment-health proof.
- Therefore `press session open` is explicitly **not** mapped to MACHINE=READY.

#### Machine control advanced OFF -> SHADOW
- Machine evidence ingestion was first gated on `autonomous_machine_control.mode=SHADOW` (commits `a33505b667640765070b6fe4f6bc4ea2bba0e0ed` and test commit `555514506b7e...`; CI PASS).
- Controlled Machine SHADOW activation commit `cb0884ad5d0a95cb2e9bb0775c83708cd911b006`.
- Run `37485546311` = SUCCESS; preflight, activation, post-verification, and safety conclusion passed.
- Live collector telemetry now reports:
  - machineMode = SHADOW;
  - machineRows = 0;
  - machineObservations = 0;
  - machineMappings = 0.
- Therefore MACHINE remains UNKNOWN for all candidates. This is intended: no explicit observation + no mapping = no machine evidence.

#### Observer run telemetry
- Migration `0026_observer_run_ledger_v1.sql` was applied via Run `37485000391` = SUCCESS after narrowing its safety gate to permit append-only DELETE-trigger guards while continuing to forbid destructive DELETE FROM operations.
- Observer worker now records append-only run telemetry for each cron execution using `recordObserverRunV1`.
- Observer production deploy Runs `37485164120` and `37485241569` = SUCCESS.
- Live Observer now has autonomyEvents = 7.
- Live read-only `/preview` proves the current decision path executes and returns READINESS_BLOCKED/HUMAN_EXCEPTION with no write, no PII, no raw order/line ids, and no employee assignment.
- `latestRun` is currently null immediately after schema/deploy because no post-deploy scheduled cron has yet populated the new ledger; this is not treated as failure.

#### Current live fail-closed state
At latest verification:
- baseline candidates = 36;
- readiness evidence rows = 0;
- DESIGN = 36 UNKNOWN;
- MATERIAL = 36 UNKNOWN;
- MACHINE = 36 UNKNOWN;
- strict eligible = 0;
- Operator Tasks = 0;
- Autonomy = SHADOW;
- Readiness = SHADOW;
- Design = SHADOW;
- Machine = SHADOW;
- Operator Task = OFF;
- business writes = false in shadow/collector/dashboard paths;
- employee assignment = false;
- autopilot execution = NO.

```ini
DESIGN_CONTROL=SHADOW
MACHINE_CONTROL=SHADOW
READINESS_CONTROL=SHADOW
AUTONOMY_CONTROL=SHADOW
MATERIAL_CONNECTOR_CONTRACT=CI_PASS_FAIL_CLOSED
MATERIAL_AUTONOMOUS_AUTHENTICATED_PAYLOAD=UNKNOWN
PRESS_STATUS_IS_MACHINE_READY_PROOF=NO
OBSERVER_RUN_LEDGER=APPLIED_APPEND_ONLY
AUTONOMY_EVENTS=7
READINESS_EVIDENCE_ROWS=0
STRICT_ELIGIBLE=0
OPERATOR_TASK_CONTROL=OFF
LIVE_EMPLOYEE_ASSIGNMENT=NO
AUTOPILOT_EXECUTION=NO
```

Next safe qualification target:
1. establish a scoped authenticated service/read identity or equivalent proven read-only transport for scheduled EasyStore material payloads without moving finance authority;
2. add real machine registry/mapping plus direct equipment-health observations only when such proof exists;
3. start accumulating real Design evidence under SHADOW from linked assets/preflight/approval;
4. keep Operator Task OFF until at least one real candidate is strict-ready across DESIGN+MATERIAL+MACHINE and the path remains stable under Shadow observation.


### AP-020 — Material authority gate qualified and live

Runtime/GitHub reconciliation after the network interruption confirmed the material authority gate is deployed and qualified.

#### Production material authority gate
- Commit `6c9795cb60ca89478ab2eb56df336f3bda9be589` gates material evidence collection on `employee_accounting_control_v1.mode='READONLY'`.
- Readiness Collector Production Deploy Run `37485989093` = SUCCESS.
- The collector will not consume material blocker candidates unless the accounting authority is explicitly READONLY.
- The gate exposes the accounting mode/epoch to collector telemetry and preserves Machine gating independently.

#### CI repair and qualification
- Follow-up test commit `5fab583a9387174d16636e9eea1cd0a7dddd9937` initially failed only because the test file accidentally contained a duplicate `import fs from 'node:fs'`.
- No runtime/business logic failure was found.
- The duplicate import was removed in commit `a757f838e17e9ddffd34f4303d5d3aabf51a7426`.
- Autonomous Printshop Policy V1 CI Run `37488728659` = SUCCESS.

#### Live runtime after qualification
- Accounting health: mode=READONLY, policyEpoch=2, authoritativeWrites=false, Google business calls=0, Apps Script business authority=false.
- Readiness Collector: SHADOW, Design=SHADOW, Machine=SHADOW, evidenceRows=0, operatorTasks=0.
- Current baseline candidates observed: 39.
- DESIGN/MATERIAL/MACHINE remain UNKNOWN for all 39 because no qualifying evidence has yet been written.
- Strict eligible = 0.
- Operator Task remains OFF.
- Business writes from Shadow/Collector remain false.
- Employee assignment remains false.

```ini
MATERIAL_AUTHORITY_GATE=QUALIFIED
MATERIAL_AUTHORITY_REQUIRED_MODE=READONLY
MATERIAL_AUTHORITY_RUNTIME_MODE=READONLY
MATERIAL_AUTHORITY_EPOCH=2
MATERIAL_GATE_CI=PASS
READINESS_EVIDENCE_ROWS=0
STRICT_ELIGIBLE=0
OPERATOR_TASK_CONTROL=OFF
LIVE_EMPLOYEE_ASSIGNMENT=NO
AUTOPILOT_EXECUTION=NO
```

Next safe target remains evidence acquisition, not task activation:
1. prove an authenticated scheduled/service read path that can obtain the EasyStore material payload without moving financial authority;
2. collect explicit machine health/mapping evidence only where direct proof exists;
3. collect Design evidence from linked asset + hash + preflight + qualified approval;
4. keep Operator Task OFF until a real line is strict-ready across DESIGN+MATERIAL+MACHINE.


### AP-021 — Material connector live; source inventory proven empty

The material path was advanced without moving EasyStore financial authority.

#### Connector boundary
- Added `autonomous-printshop/core/accounting-material-evidence-connector-v1.mjs`.
- The connector is read-only and fails closed unless `employee_accounting_control_v1.mode='READONLY'`.
- It returns only the minimum evidence projection needed for readiness: lineId, department, materialName, materialConsumption, materialId, stockQty, materialVersion.
- It exposes no customer PII and performs no financial writes.
- Readiness source adapters now consume this connector instead of directly querying accounting material tables.
- Policy CI Run `37489816348` = SUCCESS with the connector contract as an explicit test step.
- Readiness Collector Deploy Run `37489822970` = SUCCESS, including collector contracts, hard write-boundary gate, pre/post TrendOS health, dry-run, deploy, and live health verification.

#### Live collector proof
Live health now reports:
- accountingMode = READONLY
- accountingEpoch = 2
- materialConnector = ACCOUNTING_MATERIAL_EVIDENCE_CONNECTOR_V1
- materialAuthorityReadOnly = true
- businessWrites = false
- employeeAssignment = false
- operatorTasks = 0

#### Actual EasyStore/Spreadsheet source inspection
Read-only inspection of the Production spreadsheet `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY` confirmed the expected accounting tabs exist:
- `حسابات - الخامات`
- `حسابات - حركة المخزون`
- `حسابات - فواتير الأقسام`

However all three currently contain header rows only and no material/inventory/department-line data rows.

This matches the earlier D1 diagnostic:
- active materials = 0
- positive-stock materials = 0
- stock moves = 0
- candidate accounting links = 0
- candidate material names = 0
- candidate consumption known = 0
- candidate catalog matched = 0

Therefore the material connector is technically qualified and live, but the authoritative source currently has no usable inventory evidence. MATERIAL must remain UNKNOWN. No migration or synthetic inventory population is authorized by Autonomous Printshop.

```ini
MATERIAL_CONNECTOR=PRODUCTION_LIVE
MATERIAL_CONNECTOR_MODE=READONLY
ACCOUNTING_MODE=READONLY
ACCOUNTING_EPOCH=2
MATERIAL_SOURCE_ROWS=0
STOCK_MOVE_SOURCE_ROWS=0
DEPT_LINE_SOURCE_ROWS=0
MATERIAL_EVIDENCE_POSSIBLE=NO_SOURCE_DATA
MATERIAL_READY_SYNTHESIS=FORBIDDEN
FINANCIAL_AUTHORITY=EASYSTORE_UNCHANGED
OPERATOR_TASK_CONTROL=OFF
```

Next safe target:
1. Design evidence acquisition from real linked design assets/preflight/approval;
2. Machine evidence only from explicit direct health observations and mappings;
3. Material evidence remains blocked on real accounting source data, not on connector code.


### AP-022 — Matbagy design evidence connector qualified; live linkage gap proven

Matbagy-OS was inspected as the design/assets DNA source without assuming any storage provider for Autonomous Printshop.

#### Existing Matbagy-OS truth
- Multiple Design Cases have real LINKED assets.
- Some cases have FINAL_APPROVED or EXPLICITLY_LIKED design outcomes.
- However every currently inspected Design Case has `order_id=UNKNOWN`, and no qualifying `line_id` is present.
- Therefore no existing Matbagy case can be attached to a live TrendOS line without guessing.

#### Fail-closed connector
Added:
- `autonomous-printshop/core/matbagy-design-evidence-connector-v1.mjs`
- `autonomous-printshop/tests/matbagy_design_evidence_connector_v1.test.mjs`

A Design READY candidate is emitted only when all are explicit:
1. tenant_id
2. case_id
3. real order_id
4. real line_id
5. approval = FINAL_APPROVED or EXPLICITLY_LIKED
6. asset_binding_status = LINKED
7. real storage provider + storage reference
8. 64-char SHA256 content hash
9. preflight = PASS

`SAVED` is not approval.
`NOT_CONFIRMED` is not approval.
Missing order/line linkage returns no candidate.

Autonomous Printshop Policy V1 CI Run `37490579471` = SUCCESS.

```ini
MATBAGY_DESIGN_CONNECTOR=QUALIFIED
EXPLICIT_ORDER_LINK_REQUIRED=YES
EXPLICIT_LINE_LINK_REQUIRED=YES
LINKED_ASSET_REQUIRED=YES
SHA256_REQUIRED=YES
PREFLIGHT_PASS_REQUIRED=YES
SAVED_EQUALS_APPROVED=NO
CURRENT_IMPORTABLE_DESIGN_READY=0
OPERATOR_TASK_CONTROL=OFF
```

Current Design blocker is provenance linkage, not lack of historical design assets.


### AP-023 — Machine evidence intake path qualified; no synthetic machine truth

Machine evidence foundations were advanced without registering or inventing any Production machine.

#### Strict observation writer
Added:
- `autonomous-printshop/core/machine-observation-writer-v1.mjs`
- `autonomous-printshop/tests/machine_observation_writer_v1.test.mjs`

Rules:
- Machine control must be SHADOW.
- Machine must already exist and be active in the registry.
- READY is accepted only from direct `OPERATOR_CHECK` or `SELF_TEST`.
- READY requires `evidence.directCheck=true`.
- READY TTL maximum = 15 minutes.
- BLOCKED/MAINTENANCE TTL maximum = 8 hours.
- Absence of a fault / generic SYSTEM status cannot create READY.

#### Controlled manual command path
Added:
- `autonomous-printshop/core/machine-evidence-command-v1.mjs`
- `autonomous-printshop/tests/machine_evidence_command_v1.test.mjs`
- `.github/workflows/autonomous-printshop-machine-evidence-manual.yml`
- `autonomous-printshop/tests/machine_evidence_manual_workflow_v1.test.mjs`

The workflow is `workflow_dispatch` only and has no push/schedule trigger.
Supported controlled operations:
- REGISTER_MACHINE
- RECORD_OBSERVATION
- MAP_LINE

Safety:
- validates inputs and blocks SQL injection;
- requires Machine/Readiness/Autonomy = SHADOW;
- requires Operator Task = OFF and zero operator tasks;
- mapping requires a real existing TrendOS line;
- only machine-evidence tables may be mutated;
- no order, line-business, accounting or employee-assignment writes.

Autonomous Printshop Policy V1 CI Run `37491860357` = SUCCESS.

#### Runtime truth after qualification
- machineMode = SHADOW
- machineRows = 0
- machineObservations = 0
- machineMappings = 0
- readiness evidenceRows = 0
- strict eligible = 0
- operatorTasks = 0
- employeeAssignment = false

No machine was registered because no real stable machine identifier/class was proven from current sources.

```ini
MACHINE_OBSERVATION_WRITER=QUALIFIED
MACHINE_MANUAL_EVIDENCE_PATH=QUALIFIED
MACHINE_AUTO_TRIGGER=NO
MACHINE_REGISTRY_ROWS=0
MACHINE_OBSERVATIONS=0
MACHINE_MAPPINGS=0
READY_FROM_NO_FAULT=FORBIDDEN
DIRECT_MACHINE_CHECK_REQUIRED=YES
OPERATOR_TASK_CONTROL=OFF
```


### AP-024 — Manual design evidence bundle path qualified

A controlled manual Design evidence intake path was added without importing any guessed historical design into Production.

Added:
- `autonomous-printshop/core/design-evidence-command-v1.mjs`
- `autonomous-printshop/tests/design_evidence_command_v1.test.mjs`
- `.github/workflows/autonomous-printshop-design-evidence-manual.yml`
- `autonomous-printshop/tests/design_evidence_manual_workflow_v1.test.mjs`

The workflow is `workflow_dispatch` only and has no automatic trigger.

A design bundle is accepted only when all of the following are explicit and valid:
- real TrendOS order_id
- real TrendOS line_id belonging to that order
- Matbagy case_id and source_asset_id
- 64-char content SHA256
- LINKED storage provider/reference
- qualified approval status
- explicit approval actor = CUSTOMER or OWNER
- approval evidence reference
- qualified preflight recipe
- preflight result = PASS

The command writes only the append-only Design evidence model:
- artifact
- asset binding
- approval event
- preflight run

It cannot write orders, operational lines, accounting or employee assignments.

Policy CI Run `37492388229` = SUCCESS and later full Policy CI Run `37492869446` also = SUCCESS.

No historical Matbagy case was imported because current Matbagy cases do not have proven order_id + line_id linkage.

```ini
DESIGN_MANUAL_EVIDENCE_PATH=QUALIFIED
DESIGN_AUTO_TRIGGER=NO
REAL_ORDER_LINE_MATCH_REQUIRED=YES
LINKED_ASSET_REQUIRED=YES
SHA256_REQUIRED=YES
QUALIFIED_APPROVAL_REQUIRED=YES
PREFLIGHT_PASS_REQUIRED=YES
CURRENT_IMPORTED_DESIGN_ARTIFACTS=0
OPERATOR_TASK_CONTROL=OFF
```


### AP-025 — Evidence blockers and observer run telemetry live

The shadow observability layer now exposes acquisition blockers directly from Production runtime.

#### Readiness Collector evidence status
Added read-only route:
- `/evidence-status`

Collector Production Deploy Run `37492648838` = SUCCESS.

Live Runtime:
- Design: SHADOW, artifacts=0, approvals=0, preflights=0, linkedBindings=0
  - blocker = `REAL_LINKED_APPROVED_PREFLIGHTED_ARTIFACT_MISSING`
- Material: Accounting=READONLY, activeMaterials=0, stockMoves=0, linked/consumption source rows=0
  - blocker = `AUTHORITATIVE_MATERIAL_SOURCE_DATA_MISSING`
- Machine: SHADOW, activeMachines=0, activeObservations=0, mappings=0
  - blocker = `REGISTERED_MACHINE_DIRECT_OBSERVATION_AND_MAPPING_REQUIRED`
- readiness evidenceRows=0
- Operator Task = OFF
- operatorTasks=0
- PII exposed=false
- businessWrites=false
- employeeAssignment=false

#### Dashboard
Dashboard now reads the Collector through a Cloudflare Service Binding only; no D1 binding was added.

Dashboard Production Deploy Run `37492869390` = SUCCESS.
Policy CI Run `37492869446` = SUCCESS.

Live `/state` now includes `evidenceAcquisition` with the three Runtime blockers above.

#### Observer run ledger
The first scheduled cron after the observer run-ledger deployment executed successfully:
- runId = `observer-cron-1791302733913`
- triggerKind = CRON
- status = SUCCESS
- state = READINESS_BLOCKED
- baselineCandidates = 44
- strictCandidates = 0
- evidenceRows = 0
- eventInserted = true
- decision = HUMAN_EXCEPTION
- recommendedDecision = HUMAN_EXCEPTION

Autonomy events increased from 7 to 8.
The earlier `latestRun=null` was therefore not a code defect; it was simply observed before the first post-deploy scheduled cron.

Current safety remains unchanged:
- Autonomy = SHADOW
- Readiness = SHADOW
- Design = SHADOW
- Machine = SHADOW
- Operator Task = OFF
- no live employee assignment
- no business mutation by dashboard/observer/collector
- strictEligible = 0

```ini
EVIDENCE_STATUS_ROUTE=PRODUCTION_LIVE
DASHBOARD_EVIDENCE_BLOCKERS=PRODUCTION_LIVE
OBSERVER_RUN_LEDGER=PRODUCTION_CONFIRMED
AUTONOMY_EVENTS=8
STRICT_ELIGIBLE=0
READINESS_EVIDENCE_ROWS=0
OPERATOR_TASK_CONTROL=OFF
LIVE_EMPLOYEE_ASSIGNMENT=NO
```


### AP-026 — Accounting cloud cutover guard live

Autonomous Printshop is now explicitly coordinated with the EasyStore Accounting cloud migration instead of treating Material readiness as an isolated subsystem.

#### External accounting checkpoint consumed as runtime evidence
EasyStore Accounting central book currently records through ACC-036:
- migration `0029_employee_accounting_canary_mode_v1.sql` applied successfully;
- CANARY-aware accounting backend deployed successfully;
- current Production accounting mode remains `READONLY`;
- policy epoch remains 2;
- authoritativeWrites=false;
- write canary ready/enabled but allowed users=0 and allowed actions=0;
- all tracked accounting business tables remain 0 rows;
- current accounting API version at ACC-036: `81bcc92e-fe06-464d-aa8c-93301b6617dc`;
- no financial write and no Production accounting business-data mutation occurred.

Autonomous Printshop does not change that authority and does not arm the accounting canary.

#### Accounting cloud cutover guard
Added:
- `autonomous-printshop/core/accounting-cloud-cutover-guard-v1.mjs`
- `autonomous-printshop/tests/accounting_cloud_cutover_guard_v1.test.mjs`

Rules:
- Accounting `READONLY`: Material connector may collect explicit blocker evidence only.
- Accounting `CANARY`: Material evidence collection freezes automatically.
- Accounting `GENERAL`: Material remains frozen until an explicit Autonomous Printshop post-cutover requalification is completed.
- Material READY remains forbidden during accounting migration.
- EasyStore remains finance/accounting authority.

The existing accounting material connector is now cutover-aware and returns the cloud stage/freeze state instead of treating all non-READONLY states generically.

#### Production observability
Readiness Collector now exposes:
- accountingMode
- accountingEpoch
- cloudStage
- materialFrozen
- blockerCollectionAllowed
- readyEvidenceAllowed
- writeCanaryReady/enabled
- writeCanaryAllowedUsers/actions
- authoritative material/dept-line counts

Current live values:
```ini
ACCOUNTING_MODE=READONLY
ACCOUNTING_EPOCH=2
ACCOUNTING_CLOUD_STAGE=CLOUD_BACKEND_READONLY_DATA_PENDING
WRITE_CANARY_READY=true
WRITE_CANARY_ENABLED=true
WRITE_CANARY_ALLOWED_USERS=0
WRITE_CANARY_ALLOWED_ACTIONS=0
ACTIVE_MATERIALS=0
STOCK_MOVES=0
DEPT_LINES_WITH_LINE_ID=0
DEPT_LINES_WITH_MATERIAL=0
DEPT_LINES_WITH_CONSUMPTION=0
MATERIAL_FROZEN=false
MATERIAL_BLOCKER_COLLECTION_ALLOWED=true
MATERIAL_READY_EVIDENCE_ALLOWED=false
MATERIAL_BLOCKER=ACCOUNTING_CLOUD_DATA_MIGRATION_PENDING
```

Qualification:
- Readiness Collector Production Deploy Run `37495872234` = SUCCESS.
- Autonomous Printshop Policy V1 CI Run `37495985352` = SUCCESS.
- Dashboard Production Deploy Run `37495985488` = SUCCESS.
- Dashboard now displays the Accounting cloud stage and whether Material is frozen.

#### Safety
- no accounting mutation by Autonomous Printshop;
- no accounting canary arming;
- no financial write;
- no Operator Task activation;
- no live employee assignment;
- Design and Machine work can continue independently while accounting migrates.

```ini
ACCOUNTING_CLOUD_COORDINATION=PRODUCTION_LIVE
EASYSTORE_FINANCIAL_AUTHORITY=UNCHANGED
MATERIAL_READY_DURING_ACCOUNTING_MIGRATION=NO
CANARY_MATERIAL_FREEZE=AUTOMATIC
GENERAL_REQUIRES_AP_REQUALIFICATION=YES
OPERATOR_TASK_CONTROL=OFF
LIVE_EMPLOYEE_ASSIGNMENT=NO
```


### AP-027 — Material post-cutover requalification gate qualified repo-only

Prepared the fail-closed gate that Autonomous Printshop will use after EasyStore Accounting finishes its cloud write cutover.

Added:
- `autonomous-printshop/core/material-post-cutover-requalification-v1.mjs`
- `autonomous-printshop/tests/material_post_cutover_requalification_v1.test.mjs`
- `.github/workflows/autonomous-printshop-material-post-cutover-diagnostic.yml`
- `autonomous-printshop/tests/material_post_cutover_diagnostic_workflow_v1.test.mjs`

The diagnostic is `workflow_dispatch` only and is read-only.

Qualification requires all of the following before Material may even become eligible for future SHADOW READY evaluation:
- Accounting runtime mode is `GENERAL`;
- an explicit accounting master-book checkpoint such as `ACC-050` is supplied;
- that accounting checkpoint explicitly confirms cloud stock authority;
- Apps Script business authority is false;
- Google business calls are zero;
- at least one active material exists;
- real accounting line linkage exists;
- material mapping exists;
- material consumption exists.

Even when all conditions pass:
- the diagnostic itself performs no activation;
- it writes no Material READY evidence;
- it does not change accounting;
- it does not change Operator Task;
- it does not assign employees.

Current Accounting runtime remains below this gate:
```ini
ACCOUNTING_MODE=READONLY
LATEST_CONSUMED_ACCOUNTING_CHECKPOINT=ACC-036
MATERIAL_POST_CUTOVER_QUALIFICATION=NOT_RUN_NOT_ELIGIBLE
MATERIAL_READY_ACTIVATION=NO
```

Qualification CI:
- Autonomous Printshop Policy V1 CI Run `37496871728` = SUCCESS.
- Core requalification contract = PASS.
- Diagnostic workflow contract = PASS.
- workflow is dispatch-only and contains no INSERT/UPDATE/DELETE/REPLACE business mutation.

```ini
POST_CUTOVER_MATERIAL_GATE=QUALIFIED_REPO_ONLY
ACCOUNTING_GENERAL_REQUIRED=YES
ACCOUNTING_CHECKPOINT_REQUIRED=YES
STOCK_AUTHORITY_CONFIRMATION_REQUIRED=YES
DIAGNOSTIC_D1_MUTATION=NO
READY_EVIDENCE_WRITTEN=NO
OPERATOR_TASK_CONTROL=OFF
LIVE_EMPLOYEE_ASSIGNMENT=NO
```
