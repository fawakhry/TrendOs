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


---

## 34) قفل النطاق الحالي — واتس ايجنت فقط

بتوجيه مباشر من صاحب المشروع بتاريخ 2026-09-26:

> **العمل الحالي يخص مرحلة واتس ايجنت فقط، والتعديل المسموح به داخل GitHub هو هذا الكتاب فقط: `WHATS_AGENT_BOOK.md`.**

حتى يصدر توجيه جديد صريح:

- لا تعديل على أي ملف كود.
- لا تعديل على أي Branch آخر.
- لا Deploy.
- لا تعديل Apps Script.
- لا تعديل Cloudflare.
- لا تعديل Meta assets.
- لا تعديل WABA أو Phone Number.
- لا تغيير Secrets أو Script Properties.
- لا إنشاء PR أو Merge.
- لا تنفيذ Migration أو Deregister.
- لا إرسال WhatsApp production test.
- لا تغيير أي شيء خارج هذا الكتاب.

أي معلومة جديدة تخص واتس ايجنت يتم تسجيلها هنا أولًا.

---

## 35) خطة استكمال مرحلة واتس ايجنت

هذه هي الخطة الرسمية من آخر نقطة توقف. لا يتم القفز لمرحلة لاحقة قبل إغلاق المرحلة السابقة بدليل واضح.

### WA-01 — تثبيت هوية حساب واتساب الحالي

**الحالة: PASS / موثق من Meta Support**

المثبت حاليًا:

```text
Business: المطبعجي
Current WABA: 834859482664148
Phone: ending 2077
WABA status: ACTIVE
```

ملاحظة:

`26751382591203706` يظل WABA تاريخيًا فقط ولا يستخدم كمرجع حالي إلا إذا ظهر دليل جديد.

---

### WA-02 — تثبيت خطأ الـOnboarding الحقيقي

**الحالة: PASS / موثق من Meta Support**

الخطأ:

`INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA`

المعنى التشخيصي الحالي:

- الرقم موجود أصلًا على WhatsApp Business App.
- محاولة onboarding الحالية لا تكتمل.
- لا يتم تحويل هذا التشخيص تلقائيًا إلى قرار Migration.
- المطلوب ما زال Coexistence.

---

### WA-03 — تثبيت حالة App Association

**الحالة: PARTIAL**

المثبت:

- App موجود: `TrendOS Connect`
- App ID: `1774246503594854`
- Meta onboarding backend أظهر:
  `App Created = NOT_STARTED`

غير المثبت حتى الآن:

- هل الـWABA الحالي `834859482664148` مربوط فعليًا بـTrendOS Connect داخل مسار WhatsApp الحالي؟
- هل الـassociation ناقص في backend أم أن onboarding الجاري هو المسار الخطأ؟
- هل Coexistence eligibility متاحة لهذا الحساب/الرقم في وضعه الحالي؟

**بوابة الإغلاق:**
لا تعتبر WA-03 مغلقة إلا إذا ظهر دليل واضح من Meta أو شاشة إعدادات موثقة يحدد App ↔ WABA association.

---

### WA-04 — حسم مسار Coexistence

**الحالة: BLOCKED BY WA-03**

الهدف:

```text
WhatsApp Business App
+
نفس الرقم الحالي
+
Cloud API / TrendOS
=
Coexistence
```

الممنوع خلال هذه المرحلة:

- Migration عادي.
- Deregister.
- Delete number.
- Replace number.
- إنشاء WABA بديل لمجرد تجاوز الخطأ.

**بوابة الإغلاق:**
دليل أن الرقم مؤهل لمسار Coexistence الصحيح أو توثيق رسمي/دعم Meta يحدد سبب عدم الأهلية.

---

### WA-05 — تثبيت Meta onboarding بنجاح

**الحالة: NOT STARTED**

يبدأ فقط بعد إغلاق WA-03 وWA-04.

معيار النجاح:

- TrendOS Connect معروف لدى onboarding backend.
- WABA الصحيح ظاهر.
- Phone asset الصحيح ظاهر.
- لا يظهر `INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA` في المسار الصحيح.
- لا يوجد `Onboarding failure`.
- لا يتم فقد WhatsApp Business App نتيجة الخطوة.

---

### WA-06 — Webhook Verification

**الحالة: NOT STARTED**

لا يبدأ قبل نجاح Meta onboarding.

المطلوب لاحقًا:

- GET verification ينجح.
- verify token موجود في Runtime بدون كشف قيمته.
- Meta تقبل Callback URL.
- Subscription تُثبت.

معيار النجاح:

```text
Meta webhook verification = PASS
```

---

### WA-07 — Inbound Message Test

**الحالة: NOT STARTED**

بعد WA-06:

- إرسال رسالة اختبار واحدة من رقم خارجي.
- وصول webhook مرة واحدة.
- استخراج Meta Message ID.
- تسجيل الرسالة مرة واحدة.
- عدم إنشاء duplicate.

معيار النجاح:

```text
1 WhatsApp message
→ 1 webhook logical event
→ 1 stored message
```

---

### WA-08 — Customer Context Test

**الحالة: NOT STARTED**

بعد نجاح الاستقبال:

- مطابقة رقم العميل.
- جلب بيانات العميل.
- جلب آخر أوردر صالح.
- قراءة حالة الأوردر.
- عدم اختراع بيانات عند عدم وجودها.

معيار النجاح:

AI/Customer Manager يرى سياق حقيقي مرتبط بالعميل الصحيح.

---

### WA-09 — AI Suggest فقط

**الحالة: NOT STARTED**

أول تشغيل للذكاء الاصطناعي يكون:

**Suggestion only — بدون Auto Send**

يتم اختبار:

- سؤال عن حالة أوردر.
- سؤال روتيني.
- شكوى.
- طلب خصم.
- طلب تعويض.

المطلوب:

- الأسئلة الآمنة → اقتراح رد.
- الشكوى/الخصم/التعويض → Manager escalation.
- لا إرسال تلقائي في هذه المرحلة.

---

### WA-10 — Outbound Manual Send

**الحالة: NOT STARTED**

بعد نجاح Suggest:

- موظف يعتمد رسالة واحدة.
- إرسال واحد فقط.
- الحصول على Meta Message ID.
- تسجيل الرسالة.
- تأكيد وصولها للموبايل الآخر.

لا Auto Retry إذا كانت نتيجة الإرسال غير محسومة.

---

### WA-11 — Idempotency / Duplicate Test

**الحالة: NOT STARTED**

اختبار نفس `clientRequestId` مرتين.

المطلوب:

```text
Request #1 → SEND
Same Request #2 → DUPLICATE PREVENTED
```

ثم اختبار ambiguous result:

- لا إعادة إرسال تلقائي.
- الحالة تتوقف للمراجعة.

---

### WA-12 — Auto Reply Canary

**الحالة: NOT STARTED**

لا يبدأ إلا بعد نجاح WA-01 إلى WA-11.

أول Auto Reply يكون محدودًا جدًا، مثل:

- تأكيد استلام الرسالة.
- حالة أوردر مؤكدة من النظام.
- معلومة ثابتة موجودة في TrendOS.

ممنوع في Canary:

- خصومات.
- تعويضات.
- Refund.
- شكاوى.
- مواعيد غير مؤكدة.
- أسعار غير موجودة في المصدر.

---

### WA-13 — Go-Live

**الحالة: NOT STARTED**

يتم إعلان واتس ايجنت Live فقط عند وجود أدلة تشغيل حقيقية على:

- Inbound PASS.
- Context PASS.
- Suggest PASS.
- Manual outbound PASS.
- Duplicate prevention PASS.
- Manager escalation PASS.
- Coexistence/phone behavior PASS.
- عدم وجود Secret في GitHub.
- وجود rollback واضح.

---

## 36) ترتيب التنفيذ المختصر

```text
WA-01 PASS
   ↓
WA-02 PASS
   ↓
WA-03 App Association
   ↓
WA-04 Coexistence Eligibility
   ↓
WA-05 Meta Onboarding
   ↓
WA-06 Webhook Verify
   ↓
WA-07 Inbound Test
   ↓
WA-08 Customer Context
   ↓
WA-09 AI Suggest
   ↓
WA-10 Manual Send
   ↓
WA-11 Idempotency
   ↓
WA-12 Auto Reply Canary
   ↓
WA-13 Go-Live
```

### آخر Gate حالي

المرحلة الحالية المتوقفة عندها:

`WA-03 — App Association = PARTIAL`

والسؤال المطلوب إغلاقه قبل أي تقدم:

**هل TrendOS Connect مرتبط فعليًا بالـWABA الحالي 834859482664148 في مسار WhatsApp/Coexistence، أم أن Meta onboarding backend لا يرى هذا الربط؟**

---

## 37) بروتوكول تسجيل كل خطوة قادمة

كل خطوة جديدة تسجل هنا بالشكل التالي:

```text
Step:
Date:
System:
Action:
Mode: READ-ONLY / WRITE
Expected:
Actual:
Evidence:
Result: PASS / FAIL / PARTIAL / BLOCKED
Production changed?: YES / NO
Next exact step:
Do not repeat:
```

ولا يتم تغيير Status لأي WA gate إلا بدليل صريح.


---

## 38) قرار المسارات الثلاثة — تبسيط تنفيذي

تم تثبيت القرار التشغيلي بصيغة بسيطة حتى لا يحصل خلط:

### المسار A — المطلوب الأساسي

```text
نفس رقم WhatsApp الحالي
+
WhatsApp Business App يظل شغال
+
TrendOS / Whats Agent يرد آليًا
=
COEXISTENCE
```

هذا هو المسار المفضل.

### المسار B — البديل السريع عند تعذر Coexistence

```text
رقم جديد مستقل
+
Cloud API / TrendOS
+
Auto Reply
```

هذا المسار لا يلمس الرقم الحالي، ويمكن استخدامه كحل عملي أو اختبار.

### المسار C — غير مطلوب حاليًا

```text
نقل الرقم الحالي بالكامل من WhatsApp Business App إلى API
=
MIGRATION
```

هذا المسار **غير معتمد حاليًا** لأنه لا يحقق هدف الإبقاء على WhatsApp Business App كما هو.

---

## 39) تصحيح نقطة Tech Provider

تم سحب افتراض أن "الانضمام كمزود خدمات تقنية" هو الخطوة التالية المؤكدة.

الحالة الصحيحة:

- خيار Tech Provider قد يكون متعلقًا ببناء حلول onboarding لعملاء آخرين.
- لم يثبت أنه مطلوب لحل حالة رقم المطبعجي نفسه.
- لذلك **لا نضغط Tech Provider ولا نبدأ أي onboarding خاص به** بدون دليل صريح أنه مطلوب لمسار Coexistence لهذا الحساب.

الحالة:

`TECH_PROVIDER_REQUIREMENT = UNCONFIRMED / DO NOT ACTION`

---

## 40) الخطوة التنفيذية التالية — بدون أي تغيير

### الهدف

معرفة هل Meta تعطي لهذا التطبيق والحساب **مسار Coexistence فعلي** أم لا.

### الإجراء

داخل:

`Meta for Developers → TrendOS Connect → WhatsApp`

نفتح صفحة WhatsApp فقط ونبحث بصريًا عن أي من الآتي:

- WhatsApp Business App
- Coexistence
- Embedded Signup
- Existing WhatsApp Business App number
- Connect existing number
- أي onboarding flow يذكر الاحتفاظ بتطبيق WhatsApp Business الحالي

### الممنوع

- لا Continue على Migration عادي.
- لا Delete.
- لا Deregister.
- لا Replace number.
- لا Create new WABA.
- لا Tech Provider onboarding.
- لا تغيير إعدادات قبل قراءة الشاشة.

### المطلوب من الدليل

Screenshot واحدة لصفحة WhatsApp داخل `TrendOS Connect`.

بعدها يتم تصنيف النتيجة:

```text
A) Coexistence option visible
   → نكمل نفس الرقم.

B) Standard onboarding only
   → لا نكمل التسجيل العادي.
   → نرجع لمسار الدعم/eligibility.

C) No usable coexistence path
   → يبقى رقم جديد هو fallback الأسرع بدون لمس الرقم الحالي.
```

### الحالة الحالية

`NEXT ACTION = READ-ONLY SCREEN INSPECTION`

لا يوجد أي تغيير Production مطلوب في هذه الخطوة.


---

## 41) Evidence — Meta for Developers Dashboard — 2026-09-26

### Screenshot observation

داخل تطبيق:

`TrendOS Connect`

ظهر في لوحة المعلومات:

- حالة استخدام WhatsApp موجودة بالفعل.
- السطر الظاهر:
  **تخصيص التواصل مع العملاء من خلال حالة استخدام واتساب**
  وعليه علامة نجاح خضراء.
- هذا يثبت أن WhatsApp use case مضافة إلى التطبيق.
- الشاشة الحالية **لا تعرض WABA ID** ولا Phone Number ID ولا App ↔ WABA association.
- يوجد خيار **الانضمام كموفر خدمات تقنية** في نفس الصفحة، لكن لا يتم استخدامه حاليًا لأن الحاجة إليه ما زالت غير مثبتة.

### Result

`WA-03 = PARTIAL`

المثبت الآن:

```text
App exists ................ PASS
WhatsApp use case added ... PASS
App ↔ WABA association .... UNKNOWN
Coexistence path .......... UNKNOWN
```

### Next exact step

**READ-ONLY**

من القائمة اليمنى داخل Meta for Developers:

`حالات الاستخدام`

ثم فتح حالة استخدام WhatsApp فقط، بدون الضغط على Tech Provider أو أي Migration/Onboarding تنفيذي.

المطلوب من الخطوة التالية:

- معرفة هل تظهر إعدادات WhatsApp نفسها.
- هل يظهر WABA الحالي `834859482664148`.
- هل يظهر رقم الهاتف/Phone Number ID.
- هل يظهر Embedded Signup / Coexistence / Existing WhatsApp Business App number.

### Do not repeat / Do not action

- لا تضغط `الانضمام كموفر خدمات تقنية`.
- لا Migration.
- لا Deregister.
- لا Delete number.
- لا إنشاء WABA جديد.


---

## 42) Evidence — WhatsApp Use Case list — 2026-09-26

### Screenshot observation

داخل:

`Meta for Developers → TrendOS Connect → حالات الاستخدام`

ظهر Use Case واضح باسم:

**التواصل مع العملاء عبر واتساب**

ومعه زر:

**تخصيص**

### ما يثبته هذا الدليل

- WhatsApp Use Case موجود داخل TrendOS Connect.
- الوصول إلى إعدادات WhatsApp يتم من خلال زر **تخصيص**.
- هذه الشاشة لا تعرض WABA ID ولا Phone Number ID ولا Coexistence status حتى الآن.

### Result

`WA-03 = PARTIAL`

### Next exact step

**READ-ONLY NAVIGATION**

اضغط:

`تخصيص`

داخل بطاقة **التواصل مع العملاء عبر واتساب** فقط.

الهدف من الشاشة التالية:

- رؤية إعدادات WhatsApp المرتبطة بالتطبيق.
- البحث عن WABA الحالي `834859482664148`.
- البحث عن Phone Number / Phone Number ID.
- البحث عن Embedded Signup / Coexistence / Existing WhatsApp Business App number.

### Do not action

- لا Migration.
- لا Deregister.
- لا Delete number.
- لا Tech Provider.
- لا إنشاء WABA جديد.


---

## 43) Evidence — WhatsApp Quickstart screen — 2026-09-26

### Screenshot observation

داخل:

`Meta for Developers → TrendOS Connect → حالات الاستخدام → تخصيص → التواصل على واتساب`

ظهرت قائمة WhatsApp الجانبية وبها:

- `الأذونات والميزات`
- `البدء السريع`
- `إعداد واجهة API`
- `التكوين`
- `الموارد`

وفي شاشة **البدء السريع** ظهر:

- Business Portfolio المحدد: **المطبعجي**
- بطاقة WhatsApp Business Portfolio.
- رسالة تفيد بوجود/توفير **رقم هاتف اختباري من واتساب** لإرسال رسائل إلى عدد محدود من الأرقام.
- زر **متابعة**.

### Interpretation

هذه الشاشة تبدو كمسار Quickstart/Test القياسي، وليست دليلًا بحد ذاتها على Coexistence.

لذلك لا نضغط **متابعة** الآن، لأن هدفنا ليس بدء Standard onboarding أو Test Phone flow قبل حسم App ↔ WABA ↔ Coexistence.

### Result

`WA-03 = PARTIAL`

المثبت:

```text
TrendOS Connect ............. PASS
WhatsApp use case ........... PASS
Business Portfolio selected . المطبعجي
Standard Quickstart ......... VISIBLE
Current WABA association .... UNKNOWN
Coexistence path ............ UNKNOWN
```

### Next exact step

**READ-ONLY NAVIGATION**

اضغط من القائمة اليمنى:

`إعداد واجهة API`

الهدف من الصفحة التالية:

- معرفة WABA الظاهر للتطبيق.
- معرفة Phone Number / Phone Number ID إن ظهر.
- معرفة هل الصفحة تشير إلى رقم اختباري أم الرقم الحالي.
- عدم إنشاء أو تغيير أي أصل.

### Do not action

- لا تضغط `متابعة` في Quickstart الآن.
- لا Migration.
- لا Deregister.
- لا Delete.
- لا Create WABA.
- لا Tech Provider.


---

## 44) Evidence — API Setup tab still gated by WhatsApp setup — 2026-09-26

### Screenshot observation

داخل:

`Meta for Developers → TrendOS Connect → WhatsApp → إعداد واجهة API`

تم اختيار تبويب **إعداد واجهة API**، لكن محتوى الصفحة ظل يعرض نفس بطاقة إعداد WhatsApp الأساسية:

- Business Portfolio: **المطبعجي**
- رسالة تفيد بأن Meta ستوفر **رقم هاتف اختباري** لإرسال رسائل إلى عدد محدود من الأرقام.
- زر **متابعة**.
- لم يظهر:
  - WABA ID
  - Phone Number ID
  - Access Token
  - Test recipient controls
  - Existing production number
  - Coexistence controls

### Interpretation

هذا دليل مهم أن **WhatsApp developer console للتطبيق لم يصل بعد إلى شاشة API configuration الفعلية**.

الحالة المرئية تبدو كـinitial setup gate، وهو متوافق مع تشخيص Meta السابق:

`App Created = NOT_STARTED`

لكن لا نعتبر هذا وحده إثباتًا أن الضغط على **متابعة** هو مسار Coexistence الصحيح.

### Result

`WA-03 = PARTIAL / STRONGER EVIDENCE`

```text
WhatsApp Use Case added ........ PASS
Business Portfolio selected .... PASS
API console initialized ........ NOT YET VISIBLE
WABA shown in app .............. NO
Phone Number ID shown .......... NO
Coexistence option shown ....... NO
Initial setup gate ............. YES
```

### Next exact step

**READ-ONLY**

بدل الضغط على **متابعة** الآن، افتح من القائمة الجانبية داخل WhatsApp:

`التكوين`

الهدف:

- معرفة هل توجد Embedded Signup configuration.
- معرفة هل يوجد configuration ID.
- معرفة هل يوجد Webhook / Callback setup.
- البحث عن أي خيار متعلق بـ:
  - Embedded Signup
  - WhatsApp Business App
  - Coexistence
  - Existing number

### Do not action

- لا تضغط **متابعة** بعد.
- لا تنشئ رقمًا جديدًا.
- لا Migration.
- لا Deregister.
- لا Delete.
- لا Tech Provider onboarding.

### Why this step

صفحة `إعداد واجهة API` لم تعطِ أي بيانات ربط فعلية بعد. لذلك فحص `التكوين` أولًا أقل مخاطرة ويساعدنا نعرف هل التطبيق لديه Embedded Signup / Coexistence configuration قبل إنشاء أي أصول جديدة.


---

## 45) Evidence — Configuration tab is also blocked by initial setup gate — 2026-09-26

### Screenshot observation

داخل:

`Meta for Developers → TrendOS Connect → WhatsApp → التكوين`

رغم اختيار تبويب **التكوين**، ظل المحتوى يعرض نفس بطاقة الإعداد الأولي:

- Business Portfolio: **المطبعجي**
- Meta تعرض أنها ستوفر **رقم هاتف اختباري**
- زر **متابعة**
- لا يظهر WABA / Phone Number ID / Webhook / Embedded Signup configuration حتى الآن.

### Result

`WA-03 = PARTIAL / INITIAL APP SETUP GATE CONFIRMED`

كل تبويبات WhatsApp الأساسية التي تم فتحها حتى الآن ترجع لنفس initial setup gate، لذلك لا يمكن رؤية App ↔ WABA association قبل عبور هذا الـgate.

### Clarification about Continue

تمت مراجعة وصف مسار WhatsApp Cloud API developer setup: زر **Continue / متابعة** في هذا الـinitial setup يقوم عادةً بربط الـMeta App بالـBusiness Manager/Portfolio المختار وإضافة **WhatsApp test phone number** لاستخدامه في الاختبار. هذا المسار لا يعني وحده Migration للرقم الحقيقي الحالي.

لكن بعد الضغط يجب فحص الشاشة الناتجة وعدم إضافة/تسجيل الرقم الحقيقي قبل التأكد من مسار Coexistence.

### Next exact step

`ACTION = PRESS CONTINUE ON INITIAL TEST SETUP`

الهدف:

1. إكمال App setup الأساسي.
2. جعل Developer Console يعرض API setup الحقيقي.
3. معرفة WABA / Phone Number IDs التي ينشئها/يعرضها التطبيق.
4. عدم لمس الرقم الحقيقي الحالي.

### Guardrails after Continue

- إذا ظهر **Test Number فقط** → نكمل قراءة الشاشة.
- إذا طلب إدخال الرقم الحقيقي → نتوقف ونوثق الشاشة.
- إذا ظهر Migration / Deregister → نتوقف.
- إذا ظهر Coexistence / Existing WhatsApp Business App → نوثق ونكمل منه.
- لا يتم حذف أو نقل الرقم الحالي.


---

## 46) Evidence — Continue reproduces Onboarding failure + temporary action block — 2026-09-26

### Action performed by user

داخل:

`Meta for Developers → TrendOS Connect → WhatsApp`

تم الضغط على زر:

**متابعة**

في شاشة الـinitial WhatsApp setup gate.

### Actual result

ظهر Toast أحمر بالنص:

```text
Onboarding failure
تم حظرك مؤقتًا من القيام بهذا الإجراء.
```

### أهمية الدليل

هذه ليست مجرد شاشة `Onboarding failure` عامة فقط؛ Meta تعرض أيضًا **temporary action block** على تنفيذ الإجراء نفسه.

بالتالي:

- تكرار الضغط على **متابعة** الآن غير مفيد.
- لا نعيد المحاولة عدة مرات.
- لا نستخدم Retry متكرر لتجاوز الحظر.
- لا نغيّر الرقم أو WABA كاستجابة للحظر.
- لا نعمل Migration أو Deregister.

### Result

`WA-03 = BLOCKED`

`WA-04 = BLOCKED`

التصنيف الحالي:

```text
WhatsApp use case ............ PASS
Business Portfolio ........... PASS
Initial app setup gate ....... REACHED
Continue action .............. FAIL
Meta toast ................... ONBOARDING FAILURE
Temporary action block ....... CONFIRMED
App ↔ WABA association ....... STILL UNRESOLVED
Coexistence eligibility ...... STILL UNRESOLVED
```

### Correlation with earlier Meta diagnostics

هذا الفشل يأتي بعد التشخيص السابق الذي أعطى:

- Current WABA: `834859482664148`
- Phone ending: `2077`
- WABA status: `ACTIVE`
- Error: `INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA`
- Onboarding progress: ~40%
- Backend state: `App Created = NOT_STARTED`

الدليل الجديد لا يلغي التشخيص السابق؛ بل يضيف أن محاولة عبور الـinitial setup gate نفسها أصبحت الآن محظورة مؤقتًا.

### Next exact step

**لا نضغط Continue مرة أخرى الآن.**

المسار التالي هو دعم Meta فقط، مع إرسال التشخيص الموحّد التالي:

```text
My WhatsApp onboarding is still blocked.

Meta App: TrendOS Connect
App ID: 1774246503594854
Current WABA: 834859482664148
Phone: ending 2077
Previous case: 28296372606625034

Previous diagnostics showed:
- WABA ACTIVE
- INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA
- onboarding progress ~40%
- App Created = NOT_STARTED

Today, when I pressed Continue in:
Meta for Developers → TrendOS Connect → WhatsApp initial setup

the UI returned:
"Onboarding failure"
and:
"تم حظرك مؤقتًا من القيام بهذا الإجراء"
(You have been temporarily blocked from taking this action.)

Please check the backend onboarding/App-to-WABA association and remove or explain the temporary action block.

Critical requirement:
I need WhatsApp Business App + Cloud API Coexistence if eligible.
Do not migrate, deregister, delete, or replace the current phone number.
```

### Do not repeat

- لا تضغط Continue بشكل متكرر.
- لا تعيد Embedded Signup عدة مرات أثناء وجود temporary block.
- لا تبدأ Migration.
- لا Deregister.
- لا Delete.
- لا Tech Provider onboarding كحل تجريبي.


---

## 47) Evidence — Business Support thread reopened with reply box available — 2026-09-26

### Screenshot observation

داخل:

`Meta Business Support Home`

تم فتح نفس محادثة الدعم الخاصة بمشكلة WhatsApp Business Onboarding.

الرد الحالي من Meta ما زال يقول:

- لا يمكن تنفيذ manual technical escalation في الوقت الحالي.
- Verify App Association داخل TrendOS Connect.
- مراجعة Embedded Signup errors.
- مراجعة Coexistence eligibility.
- استخدام Report a Problem / Developer Support إذا استمر الخطأ.

يوجد أسفل المحادثة مربع:

**إضافة رد...**

كما ظهر Popup تقييم رضا عن المساعدة ويمكن إغلاقه بدون إرسال تقييم الآن.

### لماذا هذه نقطة جيدة؟

عندنا دليل جديد لم يكن موجودًا وقت رد Meta السابق:

```text
Onboarding failure
تم حظرك مؤقتًا من القيام بهذا الإجراء.
```

لذلك الأفضل الآن الرد **في نفس Thread** بدل بدء محادثة جديدة، حتى يبقى التشخيص القديم والجديد في سياق واحد.

### Next exact step

1. إغلاق Popup التقييم من علامة X فقط.
2. استخدام مربع **إضافة رد...**
3. إرسال النص التالي كما هو:

```text
I followed the steps you provided and verified the app setup path.

New evidence:
When I go to:
Meta for Developers → TrendOS Connect → WhatsApp

and press Continue on the initial WhatsApp setup screen, I now receive:

"Onboarding failure"
and
"تم حظرك مؤقتًا من القيام بهذا الإجراء"
(You have been temporarily blocked from taking this action.)

Current details:
App: TrendOS Connect
App ID: 1774246503594854
Current WABA: 834859482664148
Phone: ending 2077
Previous case: 28296372606625034

Your previous diagnostic showed:
- WABA ACTIVE
- INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA
- onboarding progress ~40%
- App Created = NOT_STARTED

The WhatsApp use case is already added to TrendOS Connect, but the developer console is still blocked at the initial setup gate and does not show the actual WABA/Phone Number ID configuration.

Please check:
1. the backend App ↔ WABA association,
2. the reason for the temporary action block,
3. whether this WABA/number is eligible for WhatsApp Business App + Cloud API Coexistence,
4. the exact supported path to complete Coexistence without migration.

Critical requirement:
Do NOT migrate, deregister, delete, or replace the current phone number.
I need to preserve the existing WhatsApp Business App and conversations.
```

### Guardrails

- لا تبدأ New Chat قبل تجربة الرد في نفس Thread.
- لا تضغط أي Migration/Deregister/Delete.
- لا تعيد Continue في Developer Portal أثناء وجود temporary block.
- لا تغيّر الرقم.


---

## 48) Meta Support final diagnosis — 2026-09-26

### Support response received

Meta Support returned a deeper technical diagnosis for the current WhatsApp setup.

### 1. App ↔ WABA association

Meta confirmed:

- WABA: `834859482664148`
- WABA status: **ACTIVE**
- Developer-side onboarding state: `App Created: NOT_STARTED`
- TrendOS Connect exists, but Meta backend does **not yet recognize it as the owner/linked app for this WABA's API functions**.

Meta explicitly connected this backend disconnect with the repeated:

`Onboarding failure`

### 2. Temporary block reason

Meta stated that:

`تم حظرك مؤقتًا من القيام بهذا الإجراء`

is likely a safety cooldown caused by multiple rapid attempts to link a number that the onboarding flow currently considers ineligible.

Meta's guidance:

- stop further Developer Portal attempts;
- wait approximately **24–48 hours** with no additional onboarding attempts.

### 3. Coexistence eligibility

Meta explicitly reported:

`INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA`

and said that the current phone/WABA combination is **not eligible for standard coexistence in its current state**.

Meta described the current options as:

- Standard path: mobile app OR API.
- Coexistence path: specialized / eligibility-gated.
- If Continue fails, the backend has not flagged this WABA/number as eligible for coexistence.

### 4. Conversation preservation requirement

The project requirement remains:

- keep the existing WhatsApp Business App;
- keep the current number;
- keep existing conversations;
- do not migrate/deregister/delete.

Meta warned that moving the number to Cloud API via the standard migration path does not preserve the existing WhatsApp Business App chat history in the required way.

Therefore:

`STANDARD MIGRATION = REJECTED FOR THIS PROJECT`

### 5. Meta's recommended fallback

Meta recommended using a **separate dedicated phone number** for TrendOS / API automation if API features are needed while preserving the current mobile app setup.

---

## 49) Updated gate status after Meta diagnosis

### WA-03 — App Association

`BLOCKED / BACKEND ASSOCIATION INCOMPLETE`

Evidence:

`App Created = NOT_STARTED`

Meta backend does not recognize TrendOS Connect as the linked owner/app for WABA `834859482664148`.

### WA-04 — Coexistence Eligibility

`BLOCKED / CURRENTLY INELIGIBLE`

Evidence:

`INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA`

Meta explicitly stated that the current WABA/phone combination is not eligible for standard coexistence in its current state.

### WA-05 — Meta Onboarding

`BLOCKED`

Reason:

- onboarding failure;
- backend app association incomplete;
- current coexistence eligibility absent;
- temporary action cooldown active.

### Temporary cooldown

`WAIT 24–48 HOURS — NO MORE ONBOARDING ATTEMPTS`

Do not press Continue repeatedly during this period.

---

## 50) Current decision tree

### Path A — Preserve current WhatsApp number + chats

This remains the highest-priority preservation requirement.

Current status:

`COEXISTENCE = NOT AVAILABLE / NOT ELIGIBLE IN CURRENT STATE`

No migration action is approved.

### Path B — Dedicated new number for Whats Agent

This is now the clean fallback path recommended by Meta if automation is needed without touching the current WhatsApp Business App.

Target architecture:

```text
Current number
→ remains on WhatsApp Business App
→ conversations preserved

New dedicated number
→ WhatsApp Cloud API
→ TrendOS Connect
→ Whats Agent automation
```

### Path C — Standard migration of current number

`NOT APPROVED`

Reason:

- conflicts with requirement to preserve current WhatsApp Business App usage and conversation history.

---

## 51) Next action after this diagnosis

For the next **24–48 hours**:

- no Developer Portal onboarding attempts;
- no Continue retries;
- no Migration;
- no Deregister;
- no Delete;
- no Tech Provider experiment.

After cooldown expires, the project owner has two safe options:

### Option 1 — Recheck eligibility once

Do one read-only/controlled eligibility recheck to see whether the temporary block cleared and whether Meta changed the WABA eligibility state.

If the same error remains:

`INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA`

stop retrying.

### Option 2 — Start dedicated-number setup

Use a new phone number exclusively for Whats Agent / Cloud API while leaving the current WhatsApp Business App untouched.

This becomes the practical implementation path if preserving the current number and chats is non-negotiable and Meta keeps coexistence ineligible.

---

## 52) Current authoritative status snapshot

```text
APP:
  Name ...................... TrendOS Connect
  App ID .................... 1774246503594854

CURRENT WABA:
  WABA ID ................... 834859482664148
  Status .................... ACTIVE
  Phone ..................... ending 2077

META ONBOARDING:
  Progress .................. ~40%
  App Created ............... NOT_STARTED
  Error ..................... INELIGIBLE_WHATSAPP_BUSINESS_APP_WABA
  Continue .................. ONBOARDING FAILURE
  Temporary action block .... ACTIVE

COEXISTENCE:
  Current eligibility ....... NOT ELIGIBLE / NOT ENABLED

PROJECT POLICY:
  Preserve current chats .... REQUIRED
  Preserve current app ...... REQUIRED
  Migration ................. NOT APPROVED
  Deregister ................ NOT APPROVED
  Delete current number ..... NOT APPROVED

FALLBACK:
  Dedicated new API number .. RECOMMENDED PRACTICAL PATH
```
