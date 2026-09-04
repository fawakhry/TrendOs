# Fokha Negative Learning

> أخطاء ومخاطر وأنماط فشل يجب الاحتفاظ بها كمعرفة سلبية بدل حذفها من التاريخ.
> Synced: 2026-09-04.

## NEG-2026-000001 — Big-bang rebuild risk
- **Scope:** Fokha Global
- **Failure / Risk:** إعادة بناء نظام إنتاج شغال من الصفر قد تكسر Workflows قائمة وافتراضات تشغيلية غير ظاهرة.
- **Evidence:** TrendOS Codex project book + VOKHA implementation instructions.
- **Lesson:** Inspect first -> preserve working behavior -> minimal patch -> targeted tests -> rollback/backups.
- **Avoid:** Big-bang rewrite بدون ضرورة متحققة.
- **Confidence:** HIGH

## NEG-2026-000002 — Code/CI/deploy is not production proof
- **Scope:** Fokha Global / Technical
- **Failure / Risk:** وجود الكود أو نجاح CI أو اكتمال النشر لا يثبت أن الميزة تعمل فعليًا في Production.
- **Evidence:** TrendOS evidence hierarchy + cross-project deployment history.
- **Lesson:** اطلب Runtime-path evidence وافصل Prepared / Tested / Deployed / Verified.
- **Avoid:** إعلان النجاح من source code أو CI وحدهما.
- **Confidence:** HIGH

## NEG-2026-000003 — Local optimization can miss the real bottleneck
- **Scope:** TrendOS / Performance
- **Failure / Risk:** تحسين D1/cache وحده قد لا يحسن زمن الطلب إذا كان Auth أو fallback يستهلك أغلب الوقت.
- **Evidence:** Historical TrendOS performance handoff where cache lookup improved while total request remained auth-bound.
- **Lesson:** Profile end-to-end request path وحدد المرحلة المهيمنة قبل التحسين.
- **Avoid:** Micro-optimization بدون full-path timing.
- **Confidence:** HIGH

## NEG-2026-000004 — Full-city big-bang / unlicensed ingestion risk
- **Scope:** VOKHA
- **Failure / Risk:** محاولة بناء/نسخ مدينة كاملة مرة واحدة ترفع مخاطر الجودة والتكلفة والترخيص والتنفيذ.
- **Evidence:** VOKHA masterplan + Banha ingestion prompt.
- **Lesson:** ابدأ Pilot صغير عالي الجودة، واحتفظ بـprovenance/license، ثم توسع منطقة بمنطقة.
- **Avoid:** نسخ Street View/كاميرات/أصول غير مرخصة أو full-city ingestion دفعة واحدة.
- **Confidence:** HIGH

## NEG-2026-000005 — Raw source is not necessarily deployed runtime
- **Scope:** Awez / Deployment
- **Failure / Risk:** ملف `prototype/index.html` الخام قد يختلف عن GitHub Pages لأن deploy workflow يحقن Scripts/Styles ويحوّل الـartifact النهائي.
- **Evidence:** `fawakhry/awez -> README.md`.
- **Lesson:** اختبر مسار Build/Deploy والـdeployed artifact، لا المصدر الخام فقط.
- **Avoid:** افتراض أن local/raw HTML = production runtime.
- **Confidence:** HIGH

## NEG-2026-000006 — Rejected designs must not train the positive template
- **Scope:** Matbagy Design Workflow
- **Failure / Risk:** خلط التصميمات المرفوضة بالمقبولة قد يعيد أخطاء سبق رفضها.
- **Evidence:** Matbagy design case lifecycle + repeated design feedback.
- **Lesson:** احتفظ بالرفض كـNegative Learning؛ أعطِ `FINAL_APPROVED` و`EXPLICITLY_LIKED` أولوية أعلى في التعلم.
- **Avoid:** ترقية rejected output إلى Template أو Global Rule.
- **Confidence:** HIGH

## NEG-2026-000007 — Public repository secret exposure
- **Scope:** Fokha Global / Security
- **Failure / Risk:** وضع API keys/tokens/passwords/credentials داخل repo أو frontend عام يخلق Exposure دائمًا وقابلًا للنسخ.
- **Evidence:** TrendOS/Matbagy/VOKHA repository instructions.
- **Lesson:** الأسرار تبقى في secret/config stores المحمية؛ GitHub العام يحتفظ فقط بالمعرفة غير الحساسة والروابط.
- **Avoid:** Credentials في GitHub العام أو frontend client code.
- **Confidence:** HIGH

## Usage rule

Negative Learning لا يعني أن الخطأ سيحدث دائمًا؛ هو Evidence يجب فحصه عند اتخاذ قرار مشابه. إذا ظهر دليل جديد يناقض درسًا، يتم تحديثه أو وضع `SUPERSEDED` مع الحفاظ على التاريخ.