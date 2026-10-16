# كتاب TrendOS القديم — قبل تقسيم المشاريع (مسودة أرشيفية)

> **قرار المالك 2026-10-16 — LEGACY / PRE-SPLIT ARCHIVE.**
> هذا الكتاب للأكواد والوظائف والقرارات التاريخية للنظام الأصلي، **بما فيها ما توقف أو انتقل إلى مشروع مستقل**. هو مختلف عن `TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md` الذي وثّق وظائف النظام الحالي حتى الفصل 31. لا تُحوَّل ميزة تاريخية إلى ميزة LIVE بمجرد توثيقها هنا.

## 1. ما نريد حفظه

المطلوب استعادة الكود الأصلي قبل التقسيم من: GitHub history/branches، المستودعات السابقة أو المستقلة التي حملت مكونات من الأصل، Google Apps Script، نسخ Google Drive/مكتبة الملفات، وأي أرشيف محلي يقدمه المالك لاحقًا. لكل مكوّن: الاسم، تاريخ/مرحلة النسخة، المصدر، path/blob SHA أو SHA-256، الدور القديم، المنقول إليه حاليًا، هل كان حيًا أم تجربة/مشروعًا متوقفًا، الأخطاء المعروفة، وطريقة الاستعادة.

**الكتاب يفهرس ويشرح الكود ويربط النسخة المحفوظة؛ لا نُدرج مئات الآلاف من الأسطر كنص مكرر ولا ننشر مصدرًا خاصًا قبل فحص الأسرار والحقوق وبيانات العملاء.** الكود الذي لم يُقرأ بالكامل يبقى `FOUND_NOT_FULLY_AUDITED` وليس `ARCHIVE_COMPLETE`.

## 2. أول نسخة خارج GitHub استُرجعت وجرى فحصها

| ID | المصدر | ما تحقق | حالة الحفظ |
|---|---|---|---|
| LEGACY-AS-1932-FULL | **ChatGPT Library**، الملف `TrendOS_Code_FULL_V1932_2026-08-24.gs` | بايتات موجودة؛ 731,855 بايت، **11,811 سطرًا**، **614 تعريف دالة فريدًا**؛ SHA-256 `d0d16e3e5863d6a2da7b31e5b4e60fd709b9ddd43cc2761fc64bde1d130b4e87`. أمثلة عائلات الدوال: Orders, Customers, Accounting, Attendance, HR, Cleaning, Press, Router | `PRIVATE_BYTES_RECOVERED`؛ **NOT_PUBLISHED**. فحص نصي أولي رصد أنماطًا قد تمثل بيانات اعتماد؛ لا نص الملف ولا بيانات حقيقية على GitHub العام قبل فحص يدوي وتطهير آمن |
| LEGACY-AS-1932-MANIFEST | ChatGPT Library، `TrendOS_V1932_AppsScript_Deploy_Manifest.txt` | 3,608 بايت؛ SHA-256 `c3f29973a7287b47e632e6a799350494db26a0d6eda3b5b781bffa7b218a254b` | `PRIVATE_BYTES_RECOVERED`؛ للربط والتحقق فقط |
| LEGACY-AS-STAGING | Google Drive: `TEMP TrendOS T2 Code.gs baseline restore 2026-09-17` و`TEMP TrendOS T2 Code.gs diagnostic capture 2026-09-18` و`TEMP TrendOS T2 authoritative source staging 2026-09-18` | **أسماء ووجود ملفات** عبر Drive metadata؛ المحتوى ولمطابقته مع نسخة V1932 لم يُفحصا بعد | `FOUND_METADATA_ONLY` |
| LEGACY-AS-BACKUP-UNRESOLVED | نسخة باسم `TrendOS Apps Script Backup Before V1932 - 2026-08-24` مذكورة في محادثات تاريخية | بحث Drive بالاسم لم يعثر عليها في الفهرس المتاح؛ قد تكون في حساب أو مكان غير متصل | `HISTORICAL_REFERENCE_UNVERIFIED` |
| LEGACY-AS-CURRENT-GIT | [`fawakhry/TrendOs@main/Code.gs`](https://github.com/fawakhry/TrendOs/blob/6b82fd3bf00eb80669a3b5ca14ff8eab420a6074/Code.gs) | ملف مصدر حجمه نحو 752 KB في المستودع؛ **لم يُثبت تطابقه بايت-ببايت مع نسخة V1932 الخاصة** | `GIT_SOURCE_PRESENT_DIFFERENCE_UNVERIFIED` |

**ممنوع:** حذف النسخة الخارجية أو استبدالها بملف GitHub قبل إثبات التطابق. حساب عدد الدوال ليس إثباتًا أن كل وظيفة بقيت تعمل أو أن كل نسخة المنشور كانت هي المستخدمة.

## 3. استرجاع ما قبل تقسيم «صندوق مطبعجي» — مثبت بالنقل السابق

- المصدر التاريخي: `fawakhry/Matbagy-Design-Workflow@agent/initial-mvp`، commit `01d7fc2fccc2907debd8de70a1018eaf4cff4574`؛ المستودع الأصلي **حُذف يوم 2026-10-02 بعد موافقة المالك** وفق [تقرير النقل الموثق](https://github.com/fawakhry/Matbagy-OS/blob/577340d798ea89247434ae8047d1b500f81c35f2/MIGRATION_FROM_MATBAGY_DESIGN_WORKFLOW.md).
- نُقلت **146** ملفًا إلى [`fawakhry/Matbagy-OS`](https://github.com/fawakhry/Matbagy-OS) (126 مطابقًا، و20 بتغييرات هوية/توجيه مقصودة، 0 مفقود حسب تقرير النقل)؛ يوجد [`MIGRATION_FILE_INVENTORY.json`](https://github.com/fawakhry/Matbagy-OS/blob/577340d798ea89247434ae8047d1b500f81c35f2/MIGRATION_FILE_INVENTORY.json) مع source blobs/digests، و[`ARCHIVE/source-history.bundle`](https://github.com/fawakhry/Matbagy-OS/blob/577340d798ea89247434ae8047d1b500f81c35f2/ARCHIVE/source-history.bundle) بحجم 488,751 بايت؛ التقرير يذكر حفظ 263 commit من تاريخ الفرع canonical بالإضافة إلى الفروع الأصلية.
- الحالة: `MIGRATED_ARCHIVED_EXTERNALLY`، **لا تُكرر الملفات أو الـDesign Cases/صور العملاء داخل TrendOS العام**. نكتب في هذا الكتاب **ما كان مرتبطًا بالنظام القديم فقط**، بينما الكتاب الحالي للمشروع SaaS هو `Matbagy-OS/PROJECT_BOOK.md`.

## 4. المستودعات التي تظهر في الحساب وتقرير ملكية الكود

الجرد الأولي وجد **8 مستودعات متاحة**. لا نفترض أن كل مستودع جزء من النظام القديم. في `LEGACY_SOURCE_RECOVERY_REGISTER.md` جدول كامل بالـHEAD ونوع الملكية؛ القرار النهائي لكل ملف بناءً على تاريخ إضافته ووظيفته، لا تشابه الاسم.

- **TrendOs:** المصدر التشغيلي والـApps Script القديم؛ به `Code.gs`, `v1932-router.gs`, وحدات HR/Attendance/Press/WhatsApp/Orders، وفروع تطوير تاريخية كثيرة. جرد `CURRENT_TREE_BASELINE.md` قديم يحتوي **1,995 ملفًا** وليس تصريحًا أن كلها Legacy. الحالة `MIXED_ACTIVE_AND_LEGACY`.
- **Matbagy:** مشروع منفصل موصوف في README بأنه Photo Sheets؛ يحتفظ بـ`app.js`, `app_zoom_pan.js`, `print-export.js`, `google_apps_script_activation.gs`. قد يقدّم سياقًا تاريخيًا للطباعة، **لا يُدمج في TrendOS قبل فحص الأصل والملكية**.
- **EasyStore / Matbagy-OS / Fokha:** كتب ومستودعات مستقلة حالية. الارتباط التاريخي بالقديم يوثَّق بالفهرس فقط، ولا تُنقل أكوادها الحالية إلى هذا الكتاب.
- **trendos-lead-hunter:** أداة مستقلة بحسب README؛ لا تُنقل إلا أجزاء قديمة مثبتة provenance.
- **fiber-auto-max-ezcad:** برنامج ليزر منفصل؛ افصل ملكية الكود عن تاريخ TrendOS.
- **awez:** لا يوجد حتى الآن دليل أنه جزء من TrendOS الأصلي؛ `OUT_OF_SCOPE_PENDING_PROOF`.

## 5. لقطة أمان قبل تنظيف GitHub

تم إنشاء الفرع [`archive/trendos-before-legacy-cleanup-20261016`](https://github.com/fawakhry/TrendOs/tree/archive/trendos-before-legacy-cleanup-20261016) من `main` عند commit `6b82fd3bf00eb80669a3b5ca14ff8eab420a6074`، وتُحقّق أن SHA الفرع يساوي SHA المصدر. هذا **snapshot محفوظ عبر Git ref**، ولا يعني Backup خارج GitHub أو اختبار استعادة.

لا يزال **التنظيف غير منفذ**: لا delete/move، لا تعديل source/config/workflows ولا Merge، ولا تغيير مستودع EasyStore/Fokha/Matbagy-OS. سيُعدّ جدول قرار لكل ملف `ACTIVE_KEEP` / `LEGACY_ARCHIVE_CANDIDATE` / `SHARED_DEPENDENCY_KEEP` / `SEPARATE_PROJECT_REFERENCE` / `UNKNOWN_NEEDS_PROOF`، ثم Draft PR مراجعة لكل حزمة صغيرة، وبعد أرشيف متحقق وموافقة على الحذف فقط تبدأ الإزالة من الفروع التشغيلية.

## 6. الملفات والحالات غير المكتملة

- خارجي: **Google Apps Script المنشور** ومدخلاته، ونسخ Google Drive/الجهاز المحلي/البنية القديمة التي لم تُمنح لنا قراءتها؛ لا نستنتج الكمال من بحث Drive.
- محفوظ جزئيًا: ملف V1932 الـPrivate Library محفوظ ومثبت hash، لكن **فحص الأسرار والمقارنة مع GitHub واستخراج خرائط الدوال والتاريخ لم يُكمل**.
- GitHub: Branches كثيرة، وصف الحالية فقط لا يثبت أنها كلها آمنة للحذف؛ Git history مطلوب للحفظ، ولا حذف باستخدام force/rewrites.
- **NEXT:** قراءة فرق نسخة V1932 مقابل نسخ GitHub وتقييم Legacy modules ثم حفظ كود آمن مستقل (بعد مراجعة الأسرار)، والعمل على `GITHUB_LEGACY_CLEANUP_PLAN.md`. الحالة الشاملة `LEGACY_ARCHIVE_IN_PROGRESS`، وليس `BOOK_COMPLETE`.

*تاريخ الإدخال: 2026-10-16. هذه مادة أرشيفية تاريخية وليست امتدادًا للادعاءات الإنتاجية في الفصول 1–31.*
