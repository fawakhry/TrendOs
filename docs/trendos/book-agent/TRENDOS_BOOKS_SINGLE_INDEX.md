# TrendOS — الباب الواحد للكتب ومنع سقوط المعرفة

> **قرار المالك:** ثلاثة كتب محفوظة، ولكن **باب قراءة واحد** و**جهة تحديث واحدة لوصف المنصة الحالية**. لا يجوز أن تتحول الكتب إلى روايات متعارضة عن حالة الإنتاج.

## من أين يبدأ أي إيجنت؟

| الدور | المرجع | سياسة الكتابة |
|---|---|---|
| **الكتاب الذي يُفتح أولًا دائمًا** | [كتالوج المنصة الحالية — 32 فصلًا](TRENDOS_CURRENT_SYSTEM_CATALOG.md) | وصف الوضع الحالي فقط مع إثبات للوظيفة، ومسارات الكود وبيئة النشر وحالة الاختبار. `PARTIALLY_VERIFIED` حتى استيفاء بوابات الأدلة. |
| سجل التغييرات الهندسية والقرارات | [TrendOS_MASTER_BOOK.md](../../../TrendOS_MASTER_BOOK.md) | الأصل التاريخي لكل Entry والخطط والحوادث؛ لا يُمسح أو يُختصر إلى الكتالوج. لا يسبق أدلة التشغيل الحالية دون تحقق. |
| أرشيف ما قبل تقسيم المشاريع | [TRENDOS_LEGACY_PRE_SPLIT_BOOK.md](TRENDOS_LEGACY_PRE_SPLIT_BOOK.md) | مصدر الأكواد الأصلية وخريطة هجرتها؛ لا ينقل وظائف قديمة إلى «LIVE» بالافتراض. |
| المرجع المحفوظ قبل الترقية | [TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md](TRENDOS_CURRENT_SYSTEM_CATALOG_DRAFT.md) | `FROZEN / PRESERVED`؛ ممنوع تحديثه بالتوازي أو حذفه لمجرد وجود الكتاب الرسمي. |

**مبدأ واحد:** نكتب الوظيفة الحالية في الكتالوج فقط؛ نربط قرارها وإصدارها بسجل التطوير، ونربط أصلها القديم بالأرشيف. التفاصيل الأصلية تظل في مصدرها، بدل نسخ عدة نسخ قابلة للتعارض.

## ماذا أثبت الفحص الآن؟

- قرأت الملفات الثلاثة من GitHub على SHA مصدر ثابت. `TrendOS_CURRENT_SYSTEM_CATALOG_DRAFT.md` يحمل **31** فصلًا، والكتالوج الرسمي يحمل **32**.
- متن الـ31 فصلًا الأصلية **متطابق نصيًا حرفًا بحرف** بين المسودة والكتالوج الحالي في النطاق المشترك البالغ **213,981 حرفًا** (من «فهرس الأبواب» حتى آخر الفصل 31)، والفصل 32 أضيف منفصلًا. هذه **شهادة عدم فقد أثناء النقل**، لا ضمان اكتمال المعرفة عن كل النظام.
- `TrendOS_MASTER_BOOK.md` يحتوي **165 عنوان قسم/فرع** و**66 رقم Entry مميزًا** ظهر في المتن (منها 58 له عنوان Entry مباشر و8 مذكورة في السياق دون عنوان Entry مطابق). رقم واحد من الـ66 ظاهر حرفيًا في الكتالوج؛ **65 لا يظهر رقمها نصيًا**. عدم ظهور رقم Entry لا يساوي ضياع وظيفته أو وجوب نسخه حرفيًا، لكنه يعني أن **66/66 Entry لم تُحسم خريطتها إلى الكتالوج بعد**.
- الكتاب القديم محفوظ بشكل منفصل وبه **14 عنوانًا** في لقطة الفحص؛ لم يُنقل محتواه إلى كتاب الحاضر تلقائيًا. حفظ أصول V1932 الخاصة والتاريخ والـGit branches شرط قائم.
- الجرد الآلي الكامل في [BOOKS_NO_LOSS_CROSSWALK_V1.json](BOOKS_NO_LOSS_CROSSWALK_V1.json): **66 سجل Entry مع السطر والـSHA والنوع والحالة `OPEN` + 165 عنوان قسم مع رقم السطر + فصول الكتالوج الـ32**. لا شيء في الجدول يُعتبر «مطابق/حالي/مُستغنى عنه» دون فحص موضوعي.

## بوابة منع ضياع أو تكرار أي معلومة

1. **اقرأ باب الكتب هذا، ثم الكتالوج الرسمي، ثم سجل التطوير في موضع القضية، والأرشيف عند ارتباطها بالماضي.** لا تبدأ من ثلاثة كتب مرة واحدة وتعدّلها بلا عقد ملكية.
2. **قبل أي اختصار أو حذف أو نقل:** تحقق من `source_path`, `source_sha`, `destination_path`, `owner`, `function`, `consumer`, `current_runtime_status`, `test_evidence`, `reason`, `reviewed_at`. إن فقد حقلًا جوهريًا فالحالة `OPEN/BLOCKED` وليس `DONE`.
3. **كل Entry من الـ66 يمر بمصالحة إلزامية:** إما `CURRENT_FUNCTION_LINKED` إلى فصل الكتالوج بالـSHA والحالة الصحيحة، أو `HISTORICAL_ONLY_WITH_EVIDENCE` ويبقى في MASTER، أو `SEPARATE_PROJECT_OWNERSHIP_VERIFIED` وبرابط كتابه، أو `UNKNOWN_KEEP`. لا نمحو أصل النص.
4. **أضف أي وظيفة جديدة إلى الكتالوج الرسمي، لا إلى المسودة.** عند تعديل سلطة قرار أو نسخة أضف التاريخ في MASTER إذا سمحت صلاحية الكتاب وتحققت من الحالة الحالية؛ لا تحوّل وصف Master التاريخي إلى معيار تشغيل بمجرد أنه أحدث.
5. **قبل اعتبار مشكلة قديمة قائمة:** تحقق من آخر مصدر/PR والاختبارات والـdeployed SHA؛ لا تكرر Issue ID أو تعيد إصلاحًا موجودًا. سجل `SOURCE_ONLY` و`TESTED` و`PRODUCTION_VERIFIED` كلًا على حدة.
6. **أوقف إعلان الاكتمال** إذا بقيت Entries `OPEN` أو ملفات/أزرار/كاتب بيانات أو اختبارات دون خريطة واضحة. `NO_DELETE / NO_FORCE_PUSH / NO_MERGE / NO_DEPLOY` أثناء التدقيق.

## أولويات المصالحة التالية

- `MASTER_ENTRIES_OPEN=66`، `ENTRIES_EXPLICITLY_MENTIONED_IN_CATALOG=1` (لكن وجود ذكر واحد **لا يغلق المطابقة**)؛ راجع أولًا الحواجز الأمنية ومصادر الأوردرات والحسابات وواجهة الموظف وخدمات الملفات، ثم باقي الوحدات وفق خطورة أثرها على العمل.
- `MASTER_SECTION_HEADINGS_TO_REVIEW=165`؛ أي أقسام بلا Entry مباشر تظل محتفظة بمكانها ورقم سطرها في الجرد. `LEGACY_HISTORY_STATUS=NOT_FULLY_AUDITED`.
- هذه البوابة تنظيمية: لا تؤكد أن كل ملفات المستودع والـUI الديناميكي والـApps Script والـD1 وUbuntu تمت مراجعتها أو تتطابق مع الإنتاج.

## المراجع المثبتة في لحظة الجرد

- [MASTER_BOOK @ pinned audit commit](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md) — Git blob `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e`.
- [كتالوج الحاضر @ pinned audit commit](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/docs/trendos/book-agent/TRENDOS_CURRENT_SYSTEM_CATALOG.md) — Git blob `53ae4194011e8c28b12d468d0ed02754a1d03448`.
- [كتاب الأصل القديم @ pinned audit commit](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/docs/trendos/book-agent/TRENDOS_LEGACY_PRE_SPLIT_BOOK.md) — Git blob `04500f9503f25d49aada9f90b432cd6a6700adb7`.
- **اسم فرع الكتاب:** `agent/trendos-book-audit-v1-20261014`. هذا **اعتماد توثيق في فرع العمل فقط**؛ ليس دمجًا إلى `main` أو شهادة Live. [عقد الكتب للبرامج](CATALOG_AUTHORITY_MANIFEST_V1.json).

## مقتطف مباشر من جرد الـ66 Entry (الجدول الكامل داخل JSON)

| Entry ID | دليل الاسم/النص في MASTER | هل الرقم مذكور في الكتالوج؟ | حالة المصالحة |
|---:|---|---|---|
| 498 | [ذُكر داخل نص قسم](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L2931) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 533 | [ذُكر داخل نص قسم](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6647) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 595 | [ذُكر داخل نص قسم](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L3032) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 596 | [عنوان مستقل (س71)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L71) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 597 | [عنوان مستقل (س85)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L85) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 628 | [ذُكر داخل نص قسم](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6371) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 630 | [عنوان مستقل (س4736)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L4736) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 631 | [عنوان مستقل (س4778)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L4775) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 632 | [عنوان مستقل (س4826)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L4823) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 633 | [عنوان مستقل (س4885)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L4885) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 634 | [عنوان مستقل (س4922)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L4919) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 635 | [عنوان مستقل (س4975)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L4972) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 652 | [عنوان مستقل (س6671)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6671) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 653 | [عنوان مستقل (س6760)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6760) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 654 | [عنوان مستقل (س6771)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6771) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 655 | [عنوان مستقل (س6788)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6788) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 656 | [عنوان مستقل (س6799)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6799) | نعم، مجرد ذكر | OPEN / NOT_RECONCILED |
| 657 | [عنوان مستقل (س6808)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6808) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 658 | [عنوان مستقل (س6819)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6819) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |
| 659 | [عنوان مستقل (س6833)](https://github.com/fawakhry/TrendOs/blob/fe38103e1fe667f02ae20226d8113272112a1802/TrendOS_MASTER_BOOK.md#L6833) | لم يُعثر على ذكر الرقم | OPEN / NOT_RECONCILED |

**التزام صريح:** لا نعتبر أي معلومة قد سقطت لأن رقم Entry لم يظهر؛ هي ما زالت في MASTER كما كانت. لكننا كذلك **لا ندّعي** أنها أُدرجت بالكتالوج قبل إتمام المصالحة. الغرض إبقاء الـ66 عنصرًا بلا نسيان إلى حين التصنيف بالدليل.
