# Fokha Decisions

> Source: Google Sheet `Fokha - Idea Inbox` / tab `DECISIONS`.
> Synced: 2026-09-04.

## DEC-20260904-001
- **Date:** 2026-09-04
- **Decision:** Fokha هو العقل التنفيذي العام، وTrend Mall/TrendOS مشروع واحد تحته وله ذاكرته وصندوقه الأسود الخاص.
- **Context:** فصل هوية المستخدم وطريقة تفكيره عن أي مشروع منفرد.
- **Reason:** حتى يستطيع Fokha إدارة عدة مشاريع واتخاذ قرارات على مستوى صاحب الأعمال، لا على مستوى Trend Mall فقط.
- **Project:** Fokha
- **Status:** Confirmed
- **Outcome / Notes:** قرار تأسيسي.

## DEC-20260904-002
- **Date:** 2026-09-04
- **Decision:** Fokha يكون طبقة الربط العليا بين الأفكار والشات وGoogle Sheet وذاكرات المشاريع وGitHub، مع عدم إنشاء نسخة موازية من حقائق المشاريع.
- **Context:** المستخدم طلب ترابطًا بين أفكار فوخا والشات والستاندرد وكل المصادر.
- **Reason:** منع تشتت المعرفة وتمكين AI من فهم السياق والعلاقات بدون خلط مصادر الحقيقة.
- **Project:** Fokha
- **Status:** Confirmed
- **Outcome / Notes:** Google Sheet = capture/working memory؛ project black boxes = project truth؛ Fokha GitHub = stable executive memory عندما يكتمل المستودع المستقل.

## DEC-20260904-MATBAGY-ROUTING-001
- **Date:** 2026-09-04
- **Decision:** صندوق مطبعجي الرسمي لذاكرة التصميمات هو فقط `fawakhry/Matbagy-Design-Workflow` على branch `agent/initial-mvp`، والمدخل `صندوق_مطبعجي.md`.
- **Context:** تم اكتشاف أن شاتات قديمة كانت تختار `fawakhry/Matbagy` أو `fawakhry/TrendOs/FOKHA_BRAIN` بالاسم أو default branch وتعتبره صندوق مطبعجي.
- **Reason:** منع خلط Photo Sheets أو عقل فوخا أو TrendOS بذاكرة Design Cases.
- **Project:** Matbagy Design Memory
- **Status:** Confirmed / Active
- **Outcome / Notes:** تم تثبيت Redirect guards في repos المحتملة للالتباس، وأي مسار غير `Matbagy-Design-Workflow@agent/initial-mvp` لا يستقبل Design Cases أو ذاكرة صندوق مطبعجي.

## قاعدة القرار
لا يتم تحويل توصية AI إلى قرار Confirmed إلا إذا اعتمدها المستخدم صراحة أو وُجد عقد اعتماد موثق.
