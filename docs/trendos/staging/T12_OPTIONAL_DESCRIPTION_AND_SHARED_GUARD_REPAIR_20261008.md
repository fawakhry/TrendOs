# الوصف الاختياري وإصلاح رجوع الحماية — 2026-10-08 21:38 Cairo

طلب المالك إلغاء إلزام الموظف بوصف الشغل. أزيل guard الرسالة من createOrder فقط؛ حقل الوصف يظل اختياريًا كما يقول placeholder أصلًا. safeT12CreatePayload الموجود يستخدم «أوردر جديد - القسم» عند الفراغ، ويحفظ أي وصف اختياري مكتوب. لا إلغاء لحماية الهوية/القسم أو idempotency أو تخزين pending request.

Frontend تغير فيه app.js وindex.html فقط: cache suffix optional-description. Snapshot حي46 assets؛44 أخرى unchanged؛ UI Worker source نفسه unchanged؛ versionbb8b38b2-e683-4b7f-b314-875f90d6a95a. API/source/settings بقيت ثابتة خلال خطوة UI الأخيرة.

## اختلاف Runtime الذي اكتشفته بوابة النشر

- run37824309985 FAIL قبل أي mutation: live version moved.
- run37824520010 FAIL قبل أي mutation: Accounting deployment37824155255 من1e349332 دمج shared candidate قديمًا وأعاد CREATE V1؛ API41af0719-1a20-46c6-85bb-a3fbdffd470a، SHA072bffffe8da361858899e8d04f373ac4616f6cac79bd7129206c053c5d77c2c. UI app/index كانا ما زالا مطابقين للنسخة السابقة.
- إعادة بناء merge-tree1e349332+0e3d35f0 عبرWrangler4.33.2 أعطت نفس الحزمة الحية بالبايت. overlay أربعة T12 source files فقط، مع حفظ Accounting/Core/Comms/Foundation، أعطى SHA1d8fb904d48f2d48f2cfcc5b026dba94edddd094344a78af95e94f099d1ea52a.
- run37825178166 FAIL بعد نشر API الحماية بالفعل، بسبب health propagation: hash وصل لكن GET health لم يصل V2 وقت assertion الأول. CREATE بقي OFF آمنًا؛ لم يُعدّل أمر تجاري أو migration. API الجديدef958004-b1b5-47a9-805e-a2be1577bc93 ثبت لاحقًا schema/claimReady true. تم تأهيل resume على هذا source SHA نفسه، وليس قبول أي OFF عشوائي.
- CLI --tag كان غير مدعوم؛ شُخّص dry-run محليًا وأُزيل قبل إعادة تشغيل خطوة UI. يلتقط الإصدار المنشور من Current Version ID بدلًا من التخمين، وrollback يتجنب استبدال version أخرى. لم يصل التشغيل المتعثر إلى UI deploy.

## النتيجة النهائية

[run37825677687](https://github.com/fawakhry/TrendOs/actions/runs/37825677687) / job113477791656 عند83cdd817 SUCCESS، جميع الخطوات PASS: backend SQLite/concurrency،الوصفاختياري،durable retry،duplicate guard،sessions401/lifecycle،exact snapshot،asset/settings postflight. استكمل CREATE pause المعروف وأعاد GENERAL بعد فحص الحماية والواجهة. Migration0012 كانت موجودة، ولم تُطبق أي migration إضافية. لا إنشاء أوردر تجاري اختباري أو تعديل status/allocator/policyepoch.

تحقق مستقل من workspace بعد CI: app/index يطابقان المصدر بالبايت؛ الرسالة الإلزامية غائبة؛ CREATE GENERAL/claimReady=true. Runtime APIef958004 مع source1d8fb904 يحفظ تحديث Accounting الجديد ويعيد حماية lane V2. لا rollback مستخدم. Schema0012 محفوظة.

## حماية المصدر المشترك من الرجوع مرة أخرى

Candidate shared source أضيفت إليه T12 backend4 و0012 واختباراتGeneral/partial والكتاب فقط، عند commitfe16c8b6d835dd372782e955fedf6d8fa84e865e، parent0e3d35f0 بعد read/write lease وفحص SQLite من archive مستقل. لا frontend أوAccounting/AP/Auth file change في هذا promotion، ولا force push. Candidate CI37825923492 وA61 regression37825923374 SUCCESS. عمليات Accounting التي تدمج shared base الحالي تحمل الحماية المؤهلة بدل V1 القديمة؛ هذا لا يمنع ناشرًا آخر من تجاهل shared base، لذلك version/source lease تظل لازمة لأي نشر لاحق.

أُزيل auto-push trigger لعملية UI المنتهية. الكتاب وسجل النتائج حفظا FAIL/partial recovery/SUCCESS دون اعتبار النشر الجزئي نجاحًا كاملًا.
