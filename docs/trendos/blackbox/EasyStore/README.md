# EasyStore — Black Box Index

هذا المجلد هو القسم المستقل داخل الصندوق الأسود لكل ما يخص EasyStore وعلاقته بـ TrendOS Accounting.

## المرجع الرئيسي

اقرأ أولًا:

`docs/trendos/blackbox/EasyStore/EASYSTORE_BLACKBOX.md`

هذا الملف يجمع الحقيقة الحالية الكاملة عن:

- دور EasyStore التاريخي داخل TrendOS.
- التصحيح المعتمد بأنه Historical Working Baseline وليس blueprint-only.
- الوظائف والحسابات والسلوك المالي الذي كان يعمل.
- الشاشات والـSheets والـfunctions والاختبارات التاريخية.
- القواعد التي يجب الحفاظ عليها.
- العيوب المعمارية التي لا يجب نقلها.
- Migration Matrix إلى TrendOS Accounting.
- IDs / RBAC / Idempotency / Audit contracts.
- Profit at `Line ID + Profit Center`.
- Production authority and Cloudflare migration boundaries.
- تعليمات المستخدم الخاصة بعدم البدء من الصفر واستكمال التنفيذ من الصندوق الأسود.

## قاعدة التحديث

كل معلومة أو تنفيذ جديد يخص EasyStore يجب:

1. تسجيله في `EASYSTORE_BLACKBOX.md` أو في Checkpoint مرتبط منه.
2. عدم إعادة توصيف EasyStore بأنه مجرد reference blueprint.
3. عدم حذف التاريخ السابق؛ يتم إضافة تصحيح/تحديث مع التاريخ.
4. عدم حفظ كلمات مرور أو Token/Secret values داخل الصندوق الأسود.

## Canonical statement

**EasyStore هو الأساس التاريخي العامل لبرنامج الحسابات البدائي داخل TrendOS، ويُستخدم كمصدر للسلوك المالي والتشغيلي المثبت أثناء بناء TrendOS Accounting الجديد بصورة Native وآمنة.**
