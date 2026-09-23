# TrendOS Apps Script V1940 — Production Deploy Manifest

> لا تستخدم شيت `سكريبت Apps Script` كمصدر للنشر. المصدر المعتمد هو `Code.gs` الحالي + الموديولات أدناه داخل نفس مشروع Google Apps Script.

## 1) الملفات المطلوب وجودها داخل مشروع Apps Script

1. `Code.gs` — الـBackend الأساسي القديم: الأوردرات، العملاء، الحسابات، المديونية، المخزون، الملاحظات، Trend Master.
2. `v1932-router.gs` — Router موحد للتحديثات الجديدة.
3. `customer-manager-backend-v1932.gs` — Customer Manager + OpenAI + WhatsApp Cloud API + webhook.
4. `customer-feedback-backend-v1.gs` — تقييم العميل بعد التسليم وCustomer Recovery trigger.
5. `attendance-backend-v1.gs` — الدوام، Start/Pause/Resume/End، Presence، مواقيت الصلاة.
6. `attendance-clockin-backend-v1.gs` — تسجيل حضور فعلي ومقارنته بموعد 12:00 أو الموعد الخاص.
7. `hr-backend-v1.gs` — HR self-service والطلبات والملفات والمهارات.
8. `cleaning-backend-v1.gs` — Checklist النظافة والتجهيز قبل التشغيل.
9. `press-control-backend-v1.gs` — تشغيل/قفل المكبس، Queue، مدة الجلسة، عدد الأوردرات، الكهرباء.
10. `go-live-autopilot-backend-v1.gs` — جاهز → Draft Invoice → Finalize permission gate → إشعار العميل.

## 2) Patch إلزامي داخل Code.gs

### في `doGet(e)` مباشرة بعد:
```javascript
e = e || { parameter: {} };
```
أضف:
```javascript
const v1940Response = trendosV1932TryRoute_(e, null);
if (v1940Response) return v1940Response;
```
ويجب أن يكون قبل Routers V1900/V1898.

### في `doPost(e)` بعد Parse الـpayload مباشرة وقبل Routers V1900/V1898 أضف:
```javascript
const v1940Response = trendosV1932TryRoute_(e, payload);
if (v1940Response) return v1940Response;
```

## 3) Script Properties المطلوبة

### أساسية للـWhatsApp / AI
- `OPENAI_API_KEY`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GRAPH_VERSION` (اختياري؛ يستخدم الافتراضي في الكود)
- `OPENAI_CUSTOMER_MODEL` (اختياري)

### لو مشروع Apps Script Standalone
- `TRENDOS_SPREADSHEET_ID`

### بيانات لم تُحدد بعد — لا تخمنها
- قدرة المكبس بالكيلووات: تُدخل في شيت `تشغيل - إعدادات المكبس` تحت `PRESS_POWER_KW`.
- تعريفة الكهرباء الفعلية جنيه/ك.و.س: `ELECTRICITY_RATE_EGP_KWH`.
- نسبة جابر وطريقة احتسابها: لا تُحسب حتى اعتماد قاعدة الاتفاق.

## 4) Frontend — ليس داخل Apps Script

ملفات الواجهة موجودة على GitHub ويتم تحميلها من `config.js`، ومنها:
- `attendance-v1.js`
- `attendance-clockin-ui-v1.js`
- `employee-prayer-prep-v1.js`
- `employee-cleaning-prep-v1.js`
- `hr-v1.js`
- `press-control-v1.js`
- `manager-center-v1932.js`
- `customer-manager-v1.js`
- `customer-feedback-v1.js`
- `employee-manager-strips-v2.js`
- `employee-manager-strips-drag-v2.js`
- `employee-andon-v1.js`
- `go-live-autopilot-v1.js`

لا تنسخ ملفات `.js` السابقة داخل Apps Script؛ هي Frontend على GitHub.

## 5) اختبار قبل الـDeploy

شغّل يدويًا من Apps Script:
```javascript
trendosV1940DeploymentHealth_()
```
المطلوب: `codeReady: true` لكل الموديولات. خصائص WhatsApp/OpenAI قد تظهر ناقصة لحين ضبطها.

## 6) Deploy

`Deploy → Manage deployments → Edit → New version → Deploy`

بعدها اختبر بالترتيب:
1. login / ping القديم.
2. attendance + clock-in.
3. cleaning.
4. HR request.
5. press control.
6. Customer Manager inbox.
7. WhatsApp webhook verification + incoming message.
8. OpenAI suggest.
9. Ready order → invoice draft → finalize → customer notification.
10. Delivered order → feedback request.

## 7) قواعد أمان تشغيلية

- ممنوع اختلاق سعر أو تسوية مالية.
- Draft Order قبل الأوردر الرسمي؛ الأوردر الرسمي بعد تأكيد العميل.
- لا Refund/خصم/تعويض تلقائي.
- لا خصم راتب/عقوبة/فصل/ترقية تلقائية من HR أو الحضور.
- تنبيه الصلاة تذكير فقط ولا يسجل/يقيم الممارسة الدينية.
- نشاط الكمبيوتر/الحضور لا يُستخدم وحده كدليل إهمال.
