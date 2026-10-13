# مخطط TrendOS Book VNext — إعادة تنظيم تدريجية، لا محو التاريخ
> **PROPOSAL / NOT YET ACCEPTED AS CANONICAL** · 2026-10-14. المصادر الأساسية: `الصندوق الاسود.md`, `اقرأني_أولًا.md`, `TrendOS_MASTER_BOOK.md`, وثائق `docs/trendos`، source+test+run الفعلي. أساس المراجعة الأول PR #130 (Entry659) ويجب فحص HEAD الأحدث قبل كل دورة.

## المبدأ
الطلب «اكتب الكتاب من الأول» يعني إعادة بناء **فهرس وفصول الشرح الحية** من أدلة المصدر، وليس حذف مئات Entries أو تغيير أسماء الدوال والاختبارات أو إسقاط الأرشيف. الكتاب الجديد يجب أن يكون مختصرًا للمراجعة اليومية لكن قابلًا للوصول إلى التفصيل الثابت بتوثيق `source path + SHA + Entry + run`. كل ادعاء له نطاق تاريخ/فرع/بيئة.

## تصميم الكتاب المستهدف
| رقم | القسم | المحتوى والدليل المطلوب |
|---|---|---|
| 00 | **ابدأ هنا** | سطر حالة حديث لكل subsystem، آخر verified runtime، آخر HEAD، next safe action |
| 01 | **الخريطة التشغيلية** | Trend Mall / TrendOS، الواجهات، roles، الحدود مع EasyStore وAutonomous Printshop |
| 02 | **المعمارية والسلطات** | frontend → Worker / Apps Script → D1 / Sheets / R2، مصادر الحقيقة، flags، request identities |
| 03 | **دليل الشاشات والأزرار** | مسار الزر/واجهة، entry point، permission، error، owner، frontend↔backend |
| 04 | **دليل الوحدات** | Orders, Customers, Auth, HR, Attendance, Print, Laser, Press, Portal, Notifications وغيرها |
| 05 | **خرائط البيانات** | كل جدول/مخطط وحقول الحقول الحساسة دون نشر بيانات، read/write ownership، idempotency |
| 06 | **Zero-Google** | ما نُقل، ما لم يُنقل، G-CUST gates، runtime deployment proof، blockers |
| 07 | **اختبارات وإثباتات** | test→source SHA→workflow run→conclusion→environment؛ fail history؛ pending exact-head |
| 08 | **إصلاح العطل** | symptom→observability→read-only preflight→safe stop→rollback→evidence |
| 09 | **القرارات والأجزاء المغلقة** | historical/active/superseded، أسباب القرار، triggers لإعادة الفتح |
| 10 | **فهرس تغطية كامل** | discovered/reviewed/static-tested/runtime-verified منفصلة، broken references |
| 11 | **سجل التنفيذ المختصر** | link إلى Journal append-only، latest handoff، آخر خطوة دون تكرار آلاف الأسطر |
| 12 | **العمل القادم** | ordered backlog: فجوة + أثرها + ثبوتها + safe next step + owner approval gate |

## خطة الإنجاز الآلي
- **المرحلة A (الحالية)**: معايرة فروع GitHub والكتاب الحديث، عمل Queue test reconciliation من Entries 653–659. لا تعديل منتج.
- **المرحلة B**: إنشاء Coverage Diff بين شجرة source والـRepository Catalog؛ تدقيق وحدات صغيرة بحسب خطورة التأثير ثم تحديث فهرس book-agent. لا تصنيف `REVIEWED` بلا قراءة نص المصدر.
- **المرحلة C**: بناء فصول VNext صغيرة تحت `docs/trendos/book-agent/chapters/` من أدلة الكود والتست وJournal؛ لكل claim رابط immutable source SHA.
- **المرحلة D**: توليف candidate كامل من الفصول بعد انتهاء مراجعتها، مع `legacy-link-map` وفحص الروابط والتاريخ؛ عرضه في Draft PR للموافقة البشرية. المرجع القديم محفوظ كما هو حتى مراجعة المحتوى.
- **المرحلة E**: نقل الفصول المقبولة تدريجيًا إلى كتاب TrendOS الرئيسي، وتحديث فقرة الحالة الحية من الأدلة الأحدث فقط. لا دمج آلي.

## تعريف «الناقص» في الاختبارات
`MISSING_BOOK_ENTRY` = run/commit مثبت ولم يُذكر أو لم يُربط بفصل الكتاب المناسب.
`MISSING_EXACT_HEAD_CI` = اختبار نجح على source commit لكن PR HEAD تغيّر.
`MISSING_RUNTIME_EVIDENCE` = CI موجود، لكن دلالة production غير مثبتة.
`MISSING_COVERAGE` = function/module ليس له test/owner معلوم أو خريطة book.
`FAILURE_UNTRIAGED` = check فشل وليس لدينا logs تثبت السبب.

## شرط الاكتمال
لا تنشر `COMPLETE` حتى يكون لكل ملف حي/وظيفة/عملية عمل خريطة owner/data/test/evidence، ولا توجد `UNKNOWN` أو `MISSING` غير مُعالجة أو مبررة explicit، ويتم تدقيق الـhistorical archive، ويوافق المالك على مرشح الكتاب. لا تنقل PR Draft إلى Production authority.
