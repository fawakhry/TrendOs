# TrendOS V1932 — Manager Layer

هذه الدفعة مبنية فوق أحدث `main` بعد V1931، وهدفها إغلاق التحديثات التشغيلية المتفق عليها بدون كسر الحسابات أو الطلبات الحالية.

## الموجود بالفعل من V1931 وتمت مراجعته

- Bulk status على مستوى القسم.
- أرشفة «تم التسليم» مع البحث والاسترجاع.
- Server paging لتقليل حجم القراءة وتحسين السرعة.
- سياسة التسليم النهائية: العميل يستلم عادي، والمنع فقط عبر قائمة ضياء عند وجود مديونية فعلية.
- مركز Trend Master: تنبيهات تشغيل، رسائل معلقة، مخزون منخفض، قفلة اليوم، وتقييم الموظفين.
- فصل واجهة EasyStore للحسابات مع مشاركة Backend موحد حتى لا تتعارض الفواتير والمديونيات.
- Attendance V1.1 Hybrid: بداية اليوم، Pause/Resume/Rest، تأكيد التواجد، إنتاجية الموظف، Dashboard الإدارة.
- بوابة العملاء، محادثة الأوردر، معرفة WhatsApp AI، AI Orders View.

## الإضافات في V1932

### 1) لوحة المدير
ملف `manager-center-v1932.js` يعرض من بيانات Trend Master الحالية:
- البنود النشطة والمؤرشفة.
- البنود/الحالات المتأخرة.
- أداء الموظفين ونسب الإنجاز.
- الخامات عند أو تحت حد التنبيه.
- الرسائل التشغيلية المعلقة.
- الحالات الموجودة في قائمة منع التسليم.
- قائمة مختصرة بالقرارات التي تحتاج تدخل الإدارة.

يتم تحميله تلقائياً من `config.js` ويعمل على Backend V1931 الحالي.

### 2) مدير العملاء + WhatsApp + OpenAI
- `customer-manager-v1.js`: Inbox داخل TrendOS لخدمة العملاء والإدارة.
- `customer-manager-backend-v1932.gs`: حفظ المحادثات، ربط الهاتف بآخر أوردر، Thread كامل، اقتراح رد، إرسال WhatsApp، تصعيد، وحل الحالة.
- الشكاوى، التعويضات/الخصومات، والتصعيد القانوني لا تحصل على رد آلي؛ تتحول للمدير.
- الرد الذكي لا يخترع سعر/ميعاد/حالة، ويعتبر بيانات TrendOS مصدر الحقيقة.
- OpenAI عبر `https://api.openai.com/v1/responses`، والموديل الافتراضي `gpt-5.6-luna` ويمكن تغييره من Script Properties.
- الأسرار لا تدخل GitHub.

### 3) Webhook WhatsApp
`customerManagerWebhookV1_` يستقبل رسائل WhatsApp Cloud API ويحفظها في:
- `مدير العملاء - المحادثات`
- `مدير العملاء - الرسائل`

### 4) Route Adapter + منع الديمو
`v1932-router.gs` يجمع:
- Route أصلي لـ `attendanceV1`.
- Route لـ `customerManagerV1`.
- استقبال/تحقق Meta Webhook.
- حجب `ensureDemoCustomer` في الإنتاج.

## التعديل المطلوب داخل Code.gs عند نشر Apps Script

في بداية `doGet(e)` وقبل الراوترات القديمة:

```javascript
const v1932Response = trendosV1932TryRoute_(e, null);
if (v1932Response) return v1932Response;
```

وفي `doPost(e)` بعد قراءة `payload` مباشرة وقبل الراوترات القديمة:

```javascript
const v1932Response = trendosV1932TryRoute_(e, payload);
if (v1932Response) return v1932Response;
```

هذا هو التعديل الوحيد المطلوب داخل الملف الكبير؛ باقي V1932 في ملفات مستقلة.

## Script Properties المطلوبة

### WhatsApp
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GRAPH_VERSION` (اختياري)

### OpenAI
- `OPENAI_API_KEY`
- `OPENAI_CUSTOMER_MODEL` (اختياري؛ الافتراضي `gpt-5.6-luna`)

### الموجودة أصلاً
- `TRENDOS_SPREADSHEET_ID` عند استخدام Standalone Apps Script.
- `EMPLOYEE_DEFAULT_PASSWORD` عند الحاجة.

## قواعد الأمان

- لا مفاتيح API أو Tokens داخل الريبو.
- مدير العملاء متاح للإدارة وخدمة العملاء فقط.
- الشكاوى/التعويضات/القرارات المالية والقانونية = تصعيد للمدير.
- لا يتم اتخاذ عقوبة آلية من Attendance؛ عدم الرد على فحص التواجد = «يحتاج مراجعة» فقط.
- Demo operations متوقفة عبر Route Adapter عند نشر V1932.

## اختبار سريع قبل النشر

```bash
node --check customer-manager-v1.js
node --check manager-center-v1932.js
cp customer-manager-backend-v1932.gs /tmp/cm-v1932.js && node --check /tmp/cm-v1932.js
cp v1932-router.gs /tmp/router-v1932.js && node --check /tmp/router-v1932.js
node tests/trendos_v1932_static.test.js
```

## حالة النشر

واجهة لوحة المدير قابلة للعمل فور دمج ملفات GitHub Pages. مدير العملاء وBackend Attendance الأصلي يحتاجان إدخال ملفات `.gs` في مشروع Apps Script، إضافة سطري الراوتر أعلاه، ثم إنشاء Deployment جديد. إلى أن يحدث ذلك يستمر Attendance بالـHybrid الحالي.
