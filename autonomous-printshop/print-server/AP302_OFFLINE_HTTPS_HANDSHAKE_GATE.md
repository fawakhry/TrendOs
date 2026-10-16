# AP-302 — محاكاة اتصال آمنة لقسمي الطباعة والليزر (بدون إنترنت)

**التاريخ:** 2026-10-16. **حالة المهمة:** `SYNTHETIC_CI_PASS` / `LIVE_CONNECTION_NO_GO`.

## الهدف

تجهيز خطوة قابلة للفحص نحو ربط سيرفر Ubuntu `TrendosShop` بـ TrendOS، مع الحفاظ على رؤية المشروع متعدد الخدمات: **الطباعة والليزر** أولًا، وخدمات أخرى لاحقًا بعد اعتمادها. الأوردر قد يحتوي بنودًا في قسمين؛ لا يجوز عدّه مرتين أو إصدار حالة تشغيل صحيحة من بيانات ناقصة.

## مصدر الحقيقة والفجوة الحالية

- واجهة TrendOS الحديثة في `trendos-edge-orders-read-v1.js` تعرض تبادل جلسة عبر `POST /v1/edge/orders/session` ثم طريقًا مؤهلًا في الواجهة `/v1/edge/orders/02cr/page`.
- نسخة Worker التاريخية على `candidate/t12-full-cloud-cutover-a56-20260929` في `cloudflare-d1/src/edge-orders-read-v1.mjs` تتعامل مع `/v1/edge/orders/page` وتمنح أدوار `print/laser` نطاقات ليست مثبتة بأنها حصريًا للطباعة والليزر مجتمعين.
- نسخة Print Server القديمة تستخدم `POST /v1/employee/core` مع `action=getRows` بدل عقد قراءة الواجهة الحديثة.
- لذلك **لا ندّعي أن مسار 02cr/page الموجود في الواجهة هو مسار Backend منشور حاليًا**، ولا توجد صلاحيات فعلية مثبتة لحساب `trendosshop_order_reader`. أي عميل إنتاجي سيحتاج فحص الكود المنشور وإثبات التفويض من جهة السيرفر أولًا.

## ما نُفّذ على GitHub

`src/trendos_orders_dry_run.py` يختبر محاكاة ثلاث طلبات فقط:

1. `POST https://trendos-synthetic.invalid/v1/edge/orders/session` برمز وهمي ثابت.
2. `GET https://trendos-synthetic.invalid/v1/edge/orders/02cr/page?screen=print&page=1&pageSize=20`.
3. `GET https://trendos-synthetic.invalid/v1/edge/orders/02cr/page?screen=laser&page=1&pageSize=20`.

نطاق `.invalid` محجوز للاختبار **وليس عنوان إنتاج**، والوحدة لا تضم مكتبة HTTP، ولا تطبّق أي Transport فعلي، ولا تقبل Secret من البيئة. عميل المحاكاة يجري بحقن كائن `SyntheticTransport` صريح في الاختبارات؛ لا يحتوي الكود على طريقة تصل بواسطتها هذه الوظائف إلى شبكة خارجية تلقائيًا.

**القيود داخل النموذج:** مهلة ثابتة 5 ثوان، حد استجابة 128 KiB، صفحة واحدة و20 صفًا لكل شاشة، `allow_redirects=False`، لا Retry ولا fallback، والتحقق من أن الجلسة التجريبية تتضمن بالضبط `print` و`laser`، ثم إعادة استخدام `AP-301` لفحص الحساب الوهمي و`AP-299` و`AP-296` لتجميع البيانات ورفض الصفوف العابرة للأقسام أو غير الصالحة.

**حدود النموذج:** القيم السابقة سياسة محاكاة، وليست ضمانًا لتطبيق زمن/حجم الاستجابة في شبكة فعلية؛ تنفيذ أي HTTP Client لاحق يتطلب تحقيق هذه الحدود في طبقة الشبكة نفسها. الاستجابة تحتوى عدادات تجريبية فقط، وليست كشفًا لحالة أوردرات حقيقية أو إثبات اكتمال تصميم/إنتاج/تسليم.

## نتائج CI المثبتة

- [GitHub Actions run #38914604319](https://github.com/fawakhry/TrendOs/actions/runs/38914604319)، job `117018733216`، `completed / SUCCESS`.
- تمت مراجعة سجل التشغيل: **25** اختبار AP-302، و**23** AP-301، و**18** AP-299، و**17** AP-298، و**15** AP-296؛ الإجمالي **98/98 PASS**.
- Workflows تستخدم `permissions: contents: read` و`persist-credentials: false`؛ لم تُستورد GitHub Actions Secrets في مسار الاختبار.
- `REAL_HOST=NONE`, `REAL_ACCOUNT=NONE`, `LIVE_ORDERS=OFF`, `UBUNTU_DEPLOY=NO`, `PRINTING=OFF`.

## بوابات الانتقال للتطبيق الحقيقي

1. **G1 — Backend المنشور:** إثبات خدمة `02cr/page` الحقيقية وعقد ردّها وpagination/freshness وحقول القسم والصلاحيات وغياب Fallback غير مأذون.
2. **G2 — هوية خدمة محدودة:** تأهيل/تنفيذ صلاحية `orders.read` للـ`print` و`laser` فقط في Backend (بلا إدارة/كتابة/حسابات)، ثم **طلب موافقة إضافية** قبل إنشاء حساب حي. لا يُستخدم حساب ضياء أو Secret قديم.
3. **G3 — عميل HTTPS حقيقي جديد:** بعد G1–G2، تنفيذ منفصل ومقفول افتراضيًا، بــ TLS موثوق، Host allowlist، منع Redirect، حد طلب/حجم/زمن وتدقيق أثر القراءة. اختبار اصطناعي للحالات الفاشلة قبل أي الاتصال الحقيقي.
4. **G4 — الجهاز:** مرحلة نقل الكود إلى `TrendosShop` تحتاج موافقة منفصلة. لا تحديث `~/TrendOs` ولا تشغيل `run.py` ولا فتح UFW/SSH/Router ولا تشغيل طابعة في هذه المرحلة.
5. **G5 — Live Canary:** تجربة اتصال واحدة فقط مع حساب محدود بعد إذن صريح، وإخراج مؤشرات مجردة لا تشمل عميلًا أو رقم أوردر أو كلمة مرور، ثم تسجيل القرار/الدليل في كتاب السيرفر.

`AP302_SYNTHETIC_TESTS=98/98_PASS`; `AP302_ACCOUNT_CREATED=NO`; `AP302_LIVE_TRANSPORT=NO`; `AP302_DEPLOYED_ROUTE_VERIFIED=NO`; `AP302_UBUNTU_UPDATED=NO`; `AP302_REAL_ORDERS=NO`; `AP302_PRODUCTION_GO=NO`.

[كتاب سيرفر Ubuntu](UBUNTU_SERVER_BOOK.md) | [كتاب المطبعة](../MASTER_BOOK.md)
