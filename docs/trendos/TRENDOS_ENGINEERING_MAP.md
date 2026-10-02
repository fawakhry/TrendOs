# TrendOS Engineering Map — خريطة المستودع الهندسية

> الحالة: **IN_PROGRESS**
>
> الفرع: `candidate/t12-full-cloud-cutover-a56-20260929`
>
> الغرض: تحويل جرد المستودع الكامل إلى خريطة تشغيل وصيانة موثقة، مع قراءة محتوى الملفات نفسها وربطها بالشاشات، الدوال، المسارات، البيانات، الاختبارات، وRuntime Evidence. هذا الملف لا يستبدل `TrendOS_MASTER_BOOK.md`؛ بل هو المرجع الهندسي التفصيلي المرتبط به.

## 1) Baseline الجرد

- إجمالي الملفات في الكتالوج: **1435**
- docs/: **713**
- .github/workflows/: **220**
- tests/: **200**
- cloudflare-d1/: **159**
- ملفات root: **95**
- apps-script/: **18**
- accounting/: **12**
- tools/: **12**
- مسارات أخرى: **6**

المرجع الخام لكل المسارات:
`docs/trendos/TRENDOS_REPOSITORY_CATALOG.md`

## 2) تصنيف الحالة

كل ملف يُصنف فقط بدليل، وليس بالاسم:

- **LIVE**: مثبت أنه داخل المسار التشغيلي الحالي.
- **TRANSITIONAL**: مستخدم أثناء نقل/توافق مؤقت وما زال له أثر فعلي أو dependency قائمة.
- **CANDIDATE**: كود/خطة جاهزة أو مجربة لكن غير مثبت نشرها كسلطة حالية.
- **TEST**: اختبار/fixture/diagnostic لا يساوي Production authority.
- **HISTORICAL**: محفوظ للتاريخ/الاسترجاع ولا يمثل الحالة الحالية.
- **DOC**: توثيق؛ قوته تعتمد على حداثته والدليل الذي يشير إليه.
- **UNKNOWN**: لم يكتمل دليل حالته بعد.

ترتيب الدليل:
`LATEST VERIFIED RUNTIME > DEPLOYED > TESTED > REPO-ONLY > HISTORICAL`.

## 3) سجل التغطية

| Batch | النطاق | الملفات المقروءة فعليًا | الحالة |
|---|---|---:|---|
| B00 | Repository catalog / baseline | 1 | DONE |
| B01 | Root frontend + runtime entrypoints | 0 | PENDING |
| B02 | Cloudflare D1 primary worker/src | 0 | PENDING |
| B03 | D1 migrations/schema | 0 | PENDING |
| B04 | Apps Script + Code.gs families | 0 | PENDING |
| B05 | Attendance/Cleaning/HR/Press | 0 | PENDING |
| B06 | Customers/Feedback/Manager | 0 | PENDING |
| B07 | Accounting + material control | 0 | PENDING |
| B08 | Integrity/queue/operator tasks | 0 | PENDING |
| B09 | GitHub Actions current + historical workflows | 0 | PENDING |
| B10 | tests/ | 0 | PENDING |
| B11 | docs/ active engineering docs | 0 | PENDING |
| B12 | archive/historical docs + cross-check | 0 | PENDING |
| B13 | Coverage audit: screens/buttons/functions/data | 0 | PENDING |

## 4) قواعد القراءة والحفظ

1. كل Batch يقرأ **محتوى الملفات** وليس الاسم فقط.
2. لكل ملف كود نسجل عند الإمكان: SHA، الغرض، exports/functions، routes/actions، storage/table dependencies، callers/callees، والحالة بالدليل.
3. لا نرفع ملفًا إلى LIVE لمجرد أنه موجود في GitHub.
4. الاختبارات والـworkflows تُربط بالكود الذي تثبته، ولا تُستخدم وحدها لإثبات Production.
5. أي تضارب بين توثيق قديم وRuntime يُسجل، والحالة الحالية تتبع Runtime.
6. بعد كل Batch يتم commit فوري لهذا الملف؛ وبالتالي يمكن الاستئناف من آخر Batch بدون إعادة القراءة من البداية.

## 5) معيار الإغلاق النهائي

لا يصبح هذا الملف COMPLETE إلا عندما يتحقق:

```ini
REPOSITORY_PATHS_INDEXED=1435
CONTENT_REVIEW_REQUIRED=YES
LIVE_FUNCTION_WITHOUT_BOOK_MAP=0
LIVE_CODE_WITH_UNKNOWN_OWNER_OR_PURPOSE=0
LIVE_DATA_WITH_UNKNOWN_SOURCE_OR_DESTINATION=0
SCREEN_ACTION_WITHOUT_BACKEND_MAP=0
```

## 6) سجل التنفيذ

### 2026-10-02 — Engineering Map initialized
- تم ربط الخريطة بالكتالوج الكامل.
- لم يتم الادعاء بقراءة الملفات التي لم تُقرأ بعد.
- نقطة الاستئناف: **B01 — Root frontend + runtime entrypoints**.
