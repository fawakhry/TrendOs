# واتس ايجنت — الكتاب الرئيسي

> **Project Book / Execution Memory**
>
> المشروع: TrendOS / Whats Agent  
> المالك: فوخا / Trend Mall / المطبعجي  
> المستودع: `fawakhry/TrendOs`  
> فرع التسجيل الحالي: `cloud-migration-v3-t12-order-create-ci-20260919`  
> تاريخ إنشاء هذا الكتاب: 2026-09-26  
> الحالة: **ACTIVE / META ONBOARDING BLOCKED / LOCAL CODE EXISTS**
>
> الهدف من هذا الملف: أن يستطيع أي ChatGPT / Work / Codex / IT جديد فتح هذا الملف وفهم مشروع واتس ايجنت من البداية حتى آخر نقطة توقف، بدون إعادة التجارب أو فقد القرارات السابقة.

---

## 1) ما هو "واتس ايجنت"؟

واتس ايجنت هو مسار داخل TrendOS هدفه إدارة خدمة العملاء على WhatsApp وربطها ببيانات TrendOS.

الهدف التشغيلي النهائي:

```text
رسالة العميل على WhatsApp
        ↓
Webhook إلى TrendOS
        ↓
قراءة العميل + آخر أوردر + الحالة
        ↓
AI يقترح رد مناسب
        ↓
رد تلقائي أو مراجعة موظف/مدير حسب نوع الرسالة
        ↓
إرسال الرد عبر WhatsApp Cloud API
        ↓
تسجيل الرسالة والمحادثة في TrendOS
```

### المطلوب النهائي من صاحب المشروع

- الحفاظ على رقم WhatsApp الحالي إن أمكن.
- الحفاظ على WhatsApp Business App والمحادثات الحالية.
- تشغيل TrendOS/AI على نفس رقم WhatsApp من خلال **Coexistence** إذا كان الحساب مؤهلاً.
- عدم السماح للذكاء الاصطناعي باتخاذ قرارات حساسة تلقائيًا.
- الشكاوى والخصومات والتعويضات والقرارات المالية تتحول للمدير.
- عدم اختراع سعر أو ميعاد أو حالة أوردر.
- بيانات TrendOS هي مصدر الحقيقة للردود المتعلقة بالأوردر.

---

## 2) القرار الأساسي الذي لا يتغير

### المطلوب المفضل

```text
نفس رقم WhatsApp الحالي
+
WhatsApp Business App يفضل شغال
+
TrendOS / Whats Agent يرسل ويستقبل عبر Cloud API
=
Coexistence
```

### ممنوع بدون موافقة صريحة جديدة من صاحب المشروع

- Delete للرقم.
- Deregister للرقم من WhatsApp Business App.
- Migration عادي من WhatsApp Business App إلى Cloud API.
- حذف WABA.
- إنشاء WABA بديل ثم نقل الرقم إليه عشوائيًا.
- استبدال الرقم الحالي كحل تلقائي.
- تنفيذ أي خطوة قد تفقد سجل المحادثات الحالي.

---

## 3) مكونات Meta المعروفة

### Meta App

- الاسم: **TrendOS Connect**
- App ID: `1774246503594854`

### Business Portfolio

- الاسم الظاهر: **المطبعجي**
- Business Portfolio ID التاريخي الموثق: `1318894200354341`
- يجب إعادة التحقق من الـID داخل Meta قبل أي عملية حساسة إذا ظهرت حافظة أخرى.

### WABA — مهم جدًا

#### WABA التاريخي الذي ظهر في التوثيق القديم

- `26751382591203706`

هذا الـID ظهر في المحاولات القديمة والتوثيق السابق، لكنه **لم يعد يُعتبر المرجع الحالي بدون تحقق**.

#### WABA الحالي حسب تشخيص Meta Support بتاريخ 2026-09-26

- **Authoritative WABA:** `834859482664148`
- Meta قالت إنه حاليًا الـWABA الوحيد المرتبط بحافظة أعمال **المطبعجي**.
- الرقم المرتبط ينتهي بـ **2077**.
- الحساب: **Active**.

### قاعدة مهمة

من الآن فصاعدًا:

```text
Current diagnostic WABA = 834859482664148
Historical WABA = 26751382591203706
```

لا نفترض أن القديم ما زال مرتبطًا بالحافظة.

---

## 4) حالة الكود داخل TrendOS

### موجود بالفعل في GitHub

ملف:

`customer-manager-backend-v1932.gs`

ويحتوي على مسارات أساسية لمدير العملاء/واتساب، منها:

- `cmSuggest_()`
  - يجلب سياق العميل والأوردر.
  - يبني Prompt لخدمة العملاء.
  - يستدعي OpenAI لإنتاج رد مقترح.

- `cmMetaSend_()`
  - يرسل رسالة نصية عبر WhatsApp Cloud API.

- `customerManagerWebhookVerifyV1_()`
  - يتحقق من Webhook verification challenge الخاص بـMeta.

- `customerManagerWebhookV1_()`
  - يستقبل رسائل WhatsApp الواردة.
  - يسجل الرسالة داخل مدير العملاء.

### خصائص Apps Script التي يعتمد عليها المسار

- `OPENAI_API_KEY`
- `OPENAI_CUSTOMER_MODEL`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_GRAPH_VERSION`
- `WHATSAPP_VERIFY_TOKEN`

حالة القيم الحية الحالية ليست مثبتة في هذا الكتاب، ولا يجب نسخ أي Secret إلى GitHub.

---

## 5) طبقة WhatsApp Integrity

تمت مراجعتها أولًا على فرع:

`agent/go-live-2026-09-01-integrity`

ثم في مراجعة 2026-09-26 تم التأكد أنها موجودة **أيضًا على فرع العمل الحالي**:

`cloud-migration-v3-t12-order-create-ci-20260919`

الملفات الأساسية الموجودة على فرع العمل الحالي:

- `trendos-integrity-v1.gs`
- `trendos-whatsapp-integrity-v1.gs`
- `customer-manager-send-integrity-v1.js`

كما أن `trendos-whatsapp-integrity-v1.gs` على فرع العمل الحالي يحمل نفس Blob SHA الذي ظهر على فرع integrity وقت الفحص:

`c3e59c50f17de2604f0192a5b8f651e53caf9018`

الحالة ما زالت:

**PREPARED ONLY — DO NOT DEPLOY BLINDLY**

### ما الذي تضيفه هذه الطبقة؟

- Durable logical send claim قبل الاتصال بـMeta.
- منع إعادة إرسال نفس الطلب تلقائيًا.
- `clientRequestId` / idempotency.
- منع Duplicate outbound sends عند retry.
- التعامل مع ambiguous send result.
- منع تكرار inbound webhook بواسطة Meta Message ID.
- تسجيل آمن للرسائل.
- ربط أفضل مع D1 sync.

### لماذا هذه الطبقة مهمة؟

المسار القديم كان يمكن أن:

1. يرسل الرسالة إلى Meta.
2. يحصل failure/timeout قبل تثبيت الحالة محليًا.
3. المستخدم يعيد المحاولة.
4. نفس الرسالة تُرسل مرة ثانية.

Integrity V1 صُممت لمنع هذا السيناريو.

### الحالة الإنتاجية

وجود الملف أو نجاح CI لا يعني أنه مفعّل في Production.

حتى آخر دليل:
- الكود موجود.
- الإصلاح مجهز.
- **ليس لدينا إثبات أنه Activated على Production.**

---

## 6) مشكلة مصدر الكود القديمة

تم اكتشاف اختلافات بين:

- Standalone `customer-manager-backend-v1932.gs`
- merged `Code.gs`
- WhatsApp Send Fix builds
- Apps Script production lineage

ولهذا توجد قاعدة:

> لا تنشر `customer-manager-backend-v1932.gs` منفردًا فوق الإنتاج بدون reconciliation.

كما تم توثيق سابقًا أن بعض الـmerged snapshots كانت تستدعي helper باسم:

`cmMetaMessageExists_()`

مع عدم إثبات وجود تعريفه في كل source snapshot المتاح.

لذلك أي Deployment جديد يجب أن يتم من source composition معروف ومختبر، وليس Copy/Paste عشوائي.

---

## 7) بداية مشكلة Meta

أثناء محاولة تشغيل الرقم الحالي على TrendOS ظهر فشل في Meta onboarding.

الأخطاء التي ظهرت تاريخيًا:

- `Onboarding failure`
- `There was a problem saving your assignments`
- `Cannot assign assets`
- unexpected technical error عند إضافة App بواسطة App ID.

تمت محاولات:

- التحقق من 2FA.
- جعل متطلبات 2FA مناسبة.
- Full Control / WABA permissions.
- Manage phone numbers/templates.
- Assign phone asset.
- Add App by App ID.
- App Dashboard onboarding.

### نتيجة هذه المرحلة

- Business Support Home أظهر أن الحافظة ليس عليها قيود واضحة.
- 2FA كان ON.
- Permission assignments لم تحفظ.
- onboarding ظل يفشل.

في هذه المرحلة تم الاشتباه في:

**Meta backend / permission-sync issue**

لكن لم يكن لدينا وقتها error code حاسم.

---

## 8) القرار وقتها: Coexistence وليس Migration

الرقم الحالي كان مستخدمًا بالفعل داخل **WhatsApp Business App**.

صاحب المشروع قرر بوضوح:

- الحفاظ على الرقم.
- الحفاظ على التطبيق.
- الحفاظ على المحادثات.
- عدم deregister.
- عدم migration العادي.

وبالتالي كان الهدف:

**WhatsApp Business App + Cloud API Coexistence**

---

## 9) محاولة Meta Developer Bug Report

تم فتح:

Meta for Developers → Report a Bug

ثم اختيار:

- App: `TrendOS Connect`
- Product: WhatsApp Business API
- Category: Embedded Signup / التسجيل المضمن

### المشكلة

رغم اختيار التصنيف الصحيح، زر **Next / التالي** ظل Disabled.

تمت محاولات:

- إعادة اختيار التصنيف.
- Show all products ON/OFF.
- refresh.
- `Ctrl + F5`.
- إعادة اختيار التطبيق والتصنيف.

النتيجة:

**Bug Report UI نفسه لم يسمح بالاستمرار.**

لذلك تم ترك هذا المسار وعدم تكراره.

---

## 10) محاولة الوصول للدعم من Meta Business

تم فتح عدة مسارات:

- Meta Business Suite.
- Business Manager.
- Business Support Home.
- WhatsApp Manager.
- Help menu.
- Support paths.

في بعض الشاشات زر Help لم يعرض:

- Contact Support
- Support Cases

وظهر فقط:
- Meta AI
- Feedback

بعد التنقل داخل Business Support Home ظهر في النهاية زر:

**الاتصال بفريق الدعم**

وهذا هو المسار الذي أوصلنا أخيرًا إلى حالة الدعم القديمة والتشخيص الجديد.

---

## 11) حالة الدعم القديمة

تم العثور على Case قديم بتاريخ:

**27/08/2026**

العنوان ظهر تقريبًا:

`Onboarding Status Pending option unavailable - Existing WABA number...`

الحالة:

**Completed / مكتملة**

لكن المشكلة الفعلية لم تكن محلولة.

### رقم الحالة

`28296372606625034`

البلاغ القديم كان يشرح تقريبًا:

- Onboarding Status Pending option unavailable.
- WABA موجود.
- الرقم موجود.
- الرقم كان يظهر بجودة جيدة.
- حالة الرقم كانت Disconnected في جزء من التشخيص القديم.
- TrendOS Connect يفشل بـ`Onboarding failure`.
- لا نريد حذف/ترحيل الرقم الحالي.

---

## 12) الرسالة التي أرسلناها لإعادة التصعيد

تم استخدام معنى الرسالة التالية:

```text
My previous case 28296372606625034 was marked completed,
but the issue is still unresolved.

TrendOS Connect still fails with "Onboarding failure"
for the existing WABA.

The WhatsApp Business Account is approved, the phone number
is still present, and I must preserve the existing WhatsApp
Business App number and conversations.

Please reopen or escalate this case to the WhatsApp Embedded
Signup / Onboarding technical team.

Do not delete, migrate, or deregister the current number.
```

---

## 13) أهم تشخيص جديد من Meta — 2026-09-26

Meta Business Support قام بفحص WABA وظهرت معلومات جديدة مهمة.

### WABA الحالي

`834859482664148`

### Meta قالت

- Account status: **Active**
- الرقم المنتهي بـ **2077** linked.
- onboarding progress حوالي **40%**.
- WABA + phone setup = complete.
- App Created = **NOT_STARTED** في onboarding backend.
- النظام لا يرى association صحيحًا مكتملًا بين هذا WABA وبين App.

### أهم Error Code

`INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA`

هذا هو أهم تطور في التحقيق.

---

## 14) معنى INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA

حسب تشخيص Meta:

الرقم مسجل حاليًا على:

**WhatsApp Business App**

والـonboarding الجاري يتعامل معه كـStandard Platform onboarding، لذلك يعتبره غير مؤهل في المسار العادي.

Meta شرحت أن Standard onboarding يفترض أن الرقم لن يظل نشطًا بالطريقة العادية على WhatsApp Business App وCloud API في نفس الوقت.

### المهم

هذا لا يثبت وحده أن Coexistence غير ممكن.

هو يثبت أن:

**المسار الحالي الذي يحاول Backend تنفيذه لا يرى الرقم كـCoexistence onboarding مكتمل.**

---

## 15) فجوة App Association

رغم أن التطبيق موجود فعليًا:

- TrendOS Connect
- App ID `1774246503594854`

تشخيص Meta قال:

`App Created: NOT_STARTED`

هذا معناه أن onboarding state الخاصة بـWABA الحالي لا ترى association مكتملًا مع Meta App.

إذن لدينا نقطتان محتملتان تحتاجان فصل:

### A) نحن ندخل من Standard onboarding بدل Coexistence

وهذا يفسر:

`INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA`

### B) App ↔ WABA backend association ناقص

وهذا يفسر:

`App Created: NOT_STARTED`

رغم وجود TrendOS Connect فعليًا.

---

## 16) رد Meta عن المحادثات

Meta أوضحت نقطة مهمة جدًا:

إذا تم **Migration عادي** من WhatsApp Business App إلى WhatsApp Business Platform:

- يمكن الاحتفاظ بنفس رقم الهاتف.
- لكن chat history الموجودة داخل WhatsApp Business App لا تنتقل تلقائيًا إلى Cloud API.

ولهذا ما زال قرارنا:

**لا نعمل Migration عادي كحل متسرع.**

---

## 17) طلبنا من Meta

تم التأكيد للدعم على:

- Meta App: TrendOS Connect
- App ID: `1774246503594854`
- Diagnostic WABA: `834859482664148`
- Error: `INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA`
- الحفاظ على WhatsApp Business App.
- الحفاظ على الرقم والمحادثات.
- عدم Delete.
- عدم Deregister.
- عدم Migration عادي.
- التحقق من:
  - phone ↔ WABA
  - WABA ↔ Business Portfolio
  - WABA ↔ TrendOS Connect
  - supported Coexistence onboarding path.

---

## 18) ماذا قالت Meta بعد ذلك؟

Meta قالت إن الـWABA الحالي هو الوحيد المرتبط حاليًا بحافظة **المطبعجي**.

وأشارت إلى:

1. Verify App Association داخل Meta for Developers.
2. التأكد أن WhatsApp product مضاف إلى TrendOS Connect.
3. التأكد أن التطبيق مرتبط بالـWABA الحالي.
4. مراجعة Embedded Signup errors.
5. مراجعة Coexistence eligibility.
6. إذا كان كل شيء مضبوط وما زال الخطأ موجودًا، يتم Report a Problem / Developer Support.

Meta لم تنفذ manual backend escalation في هذه المرحلة.

---

## 19) نقطة Tech Provider — لا تعتبر قرارًا نهائيًا

في شاشة TrendOS Connect ظهر سابقًا خيار:

**الانضمام كمزود خدمات تقنية / Become a Tech Provider**

تم طرح احتمال أن مسار Tech Provider قد يكون مرتبطًا بتشغيل Embedded Signup / Coexistence.

لكن:

> لم يتم إثبات حتى الآن أن TrendOS Connect يجب أن يتحول إلى Tech Provider لحل حالة المطبعجي نفسها.

لذلك:

- لا نبدأ Tech Provider onboarding عشوائيًا.
- لا نغيّر Business topology بدون سبب.
- نفصل أولًا بين:
  - استخدام Cloud API مباشرة لنشاطنا.
  - استخدام Embedded Signup كـTech Provider لعملاء آخرين.

---

## 20) تجربة Self-Onboarding التي تم فحصها

ظهر سابقًا احتمال أن نفس Business Portfolio الذي يملك Developer App قد لا يكون صالحًا لـself-onboarding في بعض Embedded Signup topologies.

تم اختبار شاشة اختيار Business Portfolio.

النتيجة:

- Portfolio **المطبعجي** كانت قابلة للاختيار.
- لم تكن disabled بسبب “owns the app”.
- بعد الاختيار ظهر `Onboarding failure`.

لذلك:

**self-onboarding disabled-portfolio hypothesis لم يتم إثباتها كسبب مباشر.**

المؤشرات الأقوى الآن هي:

- الرقم موجود على WhatsApp Business App.
- Standard onboarding يعتبره ineligible.
- Coexistence path/association غير مكتمل.
- WABA ↔ App association backend غير مكتمل.

---

## 21) لو استخدمنا رقم جديد

تمت مناقشة خيار رقم جديد.

### رقم جديد مخصص فقط لـCloud API

يمكن أن يكون أسرع لأنه يتجنب تعقيدات الحفاظ على الرقم الحالي على WhatsApp Business App.

لكن هذا يعتبر مسارًا مختلفًا عن الهدف الأصلي.

### استخدام رقم جديد كاختبار

قد يساعد في معرفة هل المشكلة:

- خاصة بالرقم/WABA الحالي/Coexistence.
- أم عامة في TrendOS Connect / Business permissions.

### القرار الحالي

لم يتم تغيير الرقم.

الرقم الجديد يبقى **Fallback/Test option** وليس قرار التنفيذ الأساسي.

---

## 22) الحالة الحالية باختصار

### مثبت

- TrendOS Connect موجود.
- App ID معروف.
- Customer Manager / WhatsApp code موجود.
- webhook code موجود.
- send code موجود.
- AI suggestion code موجود.
- Integrity layer مجهزة في GitHub.
- WABA الحالي حسب Meta: `834859482664148`.
- الرقم المنتهي بـ2077 مرتبط بالـWABA.
- WABA Active.
- Error الحالي: `INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA`.
- onboarding progress حوالي 40%.
- Backend onboarding يظهر `App Created: NOT_STARTED`.
- الهدف هو Coexistence وليس Migration.
- البلاغ القديم: `28296372606625034`.
- البلاغ القديم اتقفل Completed بدون حل فعلي.

### غير مثبت / يحتاج تحقق

- هل TrendOS Connect مرتبط فعليًا بالـWABA `834859482664148` داخل Developer Portal.
- هل WhatsApp product configuration على App تشير إلى الـWABA الصحيح.
- هل الحساب مؤهل رسميًا لـCoexistence في وضعه الحالي.
- هل Embedded Signup configuration الحالية هي Coexistence flow بالفعل.
- هل WhatsApp Integrity V1 مفعلة على Production.
- حالة Script Properties الخاصة بواتساب حاليًا.
- حالة webhook subscription live.
- هل phone number ID الحالي مضبوط داخل Apps Script production.

---

## 23) الخطوة التالية الصحيحة

لا نعيد نفس Onboarding بشكل عشوائي.

### Next Step 1 — READ ONLY

داخل:

Meta for Developers → TrendOS Connect → WhatsApp

نتحقق من:

- WhatsApp product موجود.
- WABA المرتبط بالتطبيق.
- هل يظهر WABA `834859482664148`.
- Phone Number ID المرتبط.
- Configuration / Embedded Signup.
- أي indication لـCoexistence.
- أي error أو account eligibility banner.

### Next Step 2

إذا التطبيق غير مرتبط بالـWABA الحالي:

نعالج App ↔ WABA association بالطريقة المدعومة من Meta بدون نقل الرقم.

### Next Step 3

إذا App association صحيح لكن Coexistence ما زال يعطي:

`INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA`

نرجع إلى Support Case ونطلب تحديدًا:

```text
Please confirm whether WABA 834859482664148 and the phone ending 2077
are eligible for WhatsApp Business App + Cloud API Coexistence.

TrendOS Connect already exists:
App ID 1774246503594854

The onboarding backend says:
App Created = NOT_STARTED

Please identify the exact missing backend association or eligibility gate.
Do not migrate, deregister, delete, or replace the current phone number.
```

---

## 24) بعد حل Meta ماذا نفعل في TrendOS؟

بعد نجاح Coexistence وربط الرقم:

1. Verify Webhook GET.
2. Verify incoming WhatsApp POST.
3. إرسال Test message واحدة فقط.
4. التأكد من Meta Message ID.
5. التأكد من عدم Duplicate.
6. ربط incoming message بالعميل.
7. ربط العميل بآخر Order context.
8. اختبار AI suggestion.
9. اختبار escalation للشكاوى/القرارات المالية.
10. تفعيل safe send path.
11. اختبار retry/idempotency.
12. بعدها فقط التفكير في auto-reply.

---

## 25) مستويات التشغيل المقترحة

### Level 0 — Manual only

- TrendOS يرى المحادثة.
- الموظف يكتب الرد.
- TrendOS يرسل.

### Level 1 — AI Suggest

- AI يقترح.
- الموظف يوافق.
- لا إرسال تلقائي.

### Level 2 — Safe Auto Reply

Auto reply فقط للأسئلة منخفضة المخاطر مثل:

- حالة أوردر واضحة.
- ميعاد موجود فعلًا في البيانات.
- تأكيد استلام معلومة.
- أسئلة روتينية لها إجابة مؤكدة.

### Level 3 — Manager Escalation

أي رسالة تحتوي:

- شكوى.
- خصم.
- تعويض.
- استرجاع.
- مشكلة جودة.
- مشكلة قانونية.
- قرار مالي.

لا يرد فيها AI بقرار نهائي؛ تتحول للمدير.

---

## 26) قواعد سلامة واتس ايجنت

- لا تختلق حالة أوردر.
- لا تختلق تاريخ تسليم.
- لا تختلق سعر.
- لا تعد بتعويض.
- لا تعد بخصم.
- لا توافق على Refund تلقائيًا.
- لا ترسل نفس الرسالة مرتين بسبب retry.
- Meta Message ID مهم للتدقيق والدوبليكيت.
- clientRequestId مهم للإرسال الآمن.
- فشل D1 لا يجب أن يكرر إرسال WhatsApp.
- External send يجب أن يكون idempotent.
- أي ambiguous send لا يُعاد تلقائيًا.

---

## 27) ملفات مهمة للقراءة قبل أي تعديل

1. `WHATS_AGENT_BOOK.md` — هذا الكتاب.
2. `customer-manager-backend-v1932.gs`
3. `trendos-whatsapp-integrity-v1.gs`
4. `customer-manager-send-integrity-v1.js`
5. `docs/trendos/inventory/WHATSAPP_CUSTOMER_MANAGER_INVENTORY.md`
6. `docs/trendos/checkpoints/WHATSAPP_META_COEXISTENCE_REASSESSMENT_2026-09-05.md`
7. `TrendOS_Code_V1932_WhatsApp_Send_Fix.gs` — إن كان موجودًا في الفرع/المصدر المستخدم، للمقارنة فقط وليس النشر الأعمى.
8. `Code.gs` — مع الحذر الشديد من اختلاف production composition.

---

## 28) ممنوع تكرار الأخطاء السابقة

- لا تكرر Save permissions عشرات المرات.
- لا تكرر Assign assets بدون تشخيص.
- لا تنقل الرقم فقط لأن onboarding العادي رفضه.
- لا تعتبر `Completed` في Meta Support معناها أن المشكلة اتحلت.
- لا تعتمد على WABA القديم بدون التحقق من Current association.
- لا تعتبر وجود App في Developer Portal دليلًا أن onboarding backend يراه Created/Linked.
- لا تنشر standalone WhatsApp module فوق Apps Script production.
- لا تخلط بين Coexistence وMigration.
- لا تبدأ من الصفر؛ الكود والبحث السابق موجودان.

---

## 29) آخر نقطة توقف — 2026-09-26

### الحالة

```text
META WABA: ACTIVE
CURRENT WABA: 834859482664148
PHONE: ending 2077
APP: TrendOS Connect
APP ID: 1774246503594854
ONBOARDING: ~40%
ERROR: INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA
BACKEND STEP: App Created = NOT_STARTED
TARGET: Coexistence
MIGRATION: NOT APPROVED
DEREGISTER: NOT APPROVED
DELETE NUMBER: NOT APPROVED
```

### السؤال الفني الوحيد الذي يجب حسمه الآن

**لماذا onboarding backend لا يرى TrendOS Connect مرتبطًا بالـWABA الحالي، وما هو مسار Coexistence الصحيح لهذا الرقم بدون Migration؟**

أي خطوة قادمة يجب أن تجاوب على هذا السؤال، لا أن تعيد التجارب القديمة.

---

## 30) تعريف النجاح

يعتبر مسار واتس ايجنت جاهزًا للـGo-Live عندما يتحقق التالي:

- نفس الرقم المطلوب يعمل بالطريقة المعتمدة.
- إذا اخترنا Coexistence: WhatsApp Business App يظل صالحًا حسب تصميم Meta.
- Webhook يستقبل رسالة حقيقية.
- TrendOS يسجلها مرة واحدة.
- AI يستطيع قراءة سياق العميل.
- الموظف يستطيع إرسال رد.
- الرد يصل للعميل.
- إعادة المحاولة لا ترسل Duplicate.
- الشكوى/القرار المالي يتصعد للمدير.
- لا Secret موجود في GitHub.
- يوجد rollback واضح.
- يوجد Runtime evidence حقيقي، وليس مجرد code/CI.

---

## 31) سجل زمني مختصر

### قبل 2026-09-05

- Customer Manager + WhatsApp code تم بناؤه.
- Meta onboarding فشل.
- WABA permission saves فشلت.
- asset assignment فشل.
- support أشار إلى permission/backend issue.
- لم يتم حل المشكلة.

### 2026-09-05

- تمت استعادة الذاكرة القديمة.
- مراجعة GitHub أثبتت وجود send/webhook/AI code.
- تم توثيق Coexistence reassessment.
- تم فصل فرضية self-onboarding عن permission-sync.
- لم يتم لمس production WhatsApp.

### 2026-09-26

- تم الرجوع إلى Business Support Home.
- تم العثور على الـCase القديم.
- Case رقم `28296372606625034`.
- Meta diagnostics أعطت WABA الحالي `834859482664148`.
- account Active.
- phone ending 2077 linked.
- ظهر error code:
  `INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA`
- onboarding حوالي 40%.
- App Created = NOT_STARTED.
- اتضح أن المشكلة الحالية تتمحور حول Coexistence eligibility / onboarding flow / App association، وليس مجرد خطأ UI بسيط.

---

## 32) قاعدة تحديث هذا الكتاب

بعد كل خطوة مهمة في واتس ايجنت يجب تحديث هذا الملف بالآتي:

- ماذا فعلنا؟
- أين؟
- ما الـID/الكيان الذي تم فحصه؟
- ما النتيجة؟
- PASS / FAIL / PARTIAL / UNKNOWN.
- هل حدث تغيير Production؟
- ما آخر Screenshot/Runtime evidence؟
- ما الخطوة التالية بالضبط؟
- ما الذي لا يجب تكراره؟

**هذا الملف هو نقطة البداية الرسمية لأي شات جديد خاص بواتس ايجنت.**


---

## 33) مراجعة مصدر واتس ايجنت على فرع العمل — 2026-09-26

تم تنفيذ مراجعة GitHub فقط بدون أي تغيير Production.

### HEAD وقت الفحص

`73e40f7d8c6ab8713efbfd675f5fb425a8256aa3`

وكان هذا هو Commit إنشاء كتاب واتس ايجنت.

### النتيجة 1 — Integrity موجودة بالفعل على الفرع الحالي

تم التأكد من وجود:

- `trendos-integrity-v1.gs`
- `trendos-whatsapp-integrity-v1.gs`
- `customer-manager-send-integrity-v1.js`

إذن لم يعد صحيحًا اعتبار طبقة Integrity حبيسة فرع `agent/go-live-2026-09-01-integrity` فقط.

**لكن وجود الملفات في GitHub لا يثبت أنها منشورة أو مفعلة داخل Apps Script Production.**

### النتيجة 2 — الـRouter جاهز لاستدعاء Integrity إذا كانت موجودة في Runtime

`v1932-router.gs` يحتوي على guards اختيارية:

- `trendosIntegrityTryWebhookV1_`
- `trendosIntegrityTryRouteV1_`

ويحاول استخدام Integrity قبل fallback للمسار القديم.

هذا يعني أن source composition الحالي لديه bridge للتشغيل الآمن، لكن Runtime activation ما زال يحتاج إثبات.

### النتيجة 3 — المسار القديم ما زال موجودًا

`customer-manager-backend-v1932.gs` ما زال يحتوي على:

`customerManagerV1_(op="send") -> cmMetaSend_() -> append`

أي أن fallback القديم نفسه ليس logically idempotent.

الأمان الحقيقي يعتمد على أن Integrity route تكون فعلًا ضمن الـRuntime composition وتلتقط send قبل هذا fallback.

### النتيجة 4 — Health check الحالي غير كافٍ لإثبات WhatsApp live readiness

`v1940-deploy-health.gs` يتحقق من وجود:

- `OPENAI_API_KEY`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

ويتأكد من وجود top-level modules.

لكنه لا يثبت:

- قيمة `WHATSAPP_PHONE_NUMBER_ID` الصحيحة.
- ارتباطه بالـWABA الحالي.
- `WHATSAPP_VERIFY_TOKEN`.
- نجاح webhook verification.
- وصول webhook حقيقي من Meta.
- تفعيل Integrity path.
- نجاح send حقيقي.
- عدم تكرار send عند retry.

لذلك:

`readyForFullGoLive=true`

من هذا helper وحده **لا يكفي** لإعلان واتس ايجنت Live.

### النتيجة 5 — لا يوجد WABA ID hardcoded في المصدر الذي تم فحصه

بحث GitHub عن:

- `834859482664148`
- `26751382591203706`

لم يُظهر اعتمادًا برمجيًا مباشرًا في source الافتراضي.

وده جيد من ناحية التصميم: WABA نفسه لا يجب أن يكون secret أو runtime routing key hardcoded داخل send helper؛ الإرسال يعتمد على `WHATSAPP_PHONE_NUMBER_ID` وToken داخل Script Properties.

### الحالة بعد المراجعة

```text
GITHUB SOURCE:
  WhatsApp base code ........ FOUND
  Router bridge ............. FOUND
  Integrity foundation ...... FOUND
  WhatsApp Integrity ........ FOUND
  Frontend request-id patch . FOUND

PRODUCTION ACTIVATION:
  Integrity deployed ........ UNKNOWN
  Current Phone Number ID ... UNKNOWN
  Current Token validity .... UNKNOWN
  Webhook live .............. UNKNOWN
  Real send ................. BLOCKED BY META ONBOARDING

META:
  Current WABA .............. 834859482664148
  Error ..................... INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA
  App Created state ......... NOT_STARTED
  Desired mode .............. COEXISTENCE
```

### الخطوة التالية بعد هذا الفحص

الأولوية ليست كتابة send code جديد.

الأولوية:

1. حسم Meta App ↔ WABA ↔ Coexistence association.
2. بعد نجاح Meta، فحص Runtime Apps Script read-only.
3. إثبات أن Integrity موجودة في deployed composition.
4. ضبط/التحقق من Phone Number ID وWebhook properties بدون كشف Secrets.
5. اختبار inbound ثم outbound بعملية واحدة فقط.

**لا يتم إرسال أي WhatsApp production test قبل حل Meta association وتأكيد Runtime composition.**
