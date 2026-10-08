# تدقيق تكرار الأوردرات — 2026-10-08

## تحديث النشر الفعلي — 2026-10-08 الساعة21:04 بتوقيت القاهرة

**DEPLOYED / RUNTIME_VERIFIED / PASS** بعد تصريح المالك «انشر» واجتياز read-only preparation run37820899084.

- [Controlled release run37821119685](https://github.com/fawakhry/TrendOs/actions/runs/37821119685) / job113462098265 عند source4b6f30235af84aa6fd28065d9062c2e634f79023: SUCCESS، جميع خطوات التأهيل والنشر والفحص ناجحة.
- API version الجديد `17532b03-dd10-4fe3-81ab-2ff58e101113`؛ بصمة source الحي تطابق target `0c75704893862be91279911fbc21a04bb3f0350c5f21f55ed47e92a1e796d503`.
- UI version الجديد `0fc0bbe2-c078-49b2-ac2e-1c23b90ff0d4`؛ snapshot46 ملفًا، أربعة patches فقط؛ بقية42 byte-matched بعد النشر. Worker UI نفسه طابق المصدر الحي قبل النشر.
- migration0012 وحدها طُبقت مع سجل d1_migrations؛ تحقق من الجدول وPK/index وclaims0 خلال نافذة الانتقال. لم تُطبق بقية migrations أو يعاد كتابة Legacy.
- CREATE أوقف مؤقتًا وصُرفت الطلبات الجارية؛ snapshot عند drain orders496 / lines533 / ledger496 / nextNumber4818 بقي مطابقًا حتى نهاية النافذة. policy epoch والعداد والجلسات ثابتة؛ أعيد GENERAL بعد فحص API/UI. هذه أرقام وقت النافذة وليست قيدًا على طلبات الأعمال المستقبلية.
- live create health الآن `T12_GENERAL_CREATE_20261008_PER_DEPARTMENT_ATOMIC_CANDIDATE_V2`، schemaReady=true، customerLaneClaimReady=true، GENERAL. Auth NATIVE6/6 mustChange0؛ Accounting READONLY37 / writesOFF؛ CoreGENERAL2.
- فُحصت جميع settings/bindings مقارنة بالنسخ السابقة، باستثناء annotations الخاصة برسالة النشر فقط. Secret values بقيت لدى Cloudflare؛ لا export.
- تحقق مستقل من هذه البيئة بعد انتهاء النشر: app/config/index/edge تطابق source بالبايت، وGET health للأوردرات/Auth/Accounting/Core PASS. لا CREATE تجاري اختباري أو Google write أو business status write. لم يُستخدم rollback.
- التراجع المتاح: API السابقd7c65348 وUI السابق9699b0d0، مع0012 inert ودون DROP/restore تلقائي؛ لا يفتح V1 قبل مراجعة أي طلبات حقيقية دخلت بعد النشر.
- أُزيل auto-push trigger للنشر بعد نجاح العملية؛ workflow يدوي وread-only افتراضيًا. أي نشر جديد يتطلب lease وتأهيل وتصريحًا مناسبًا جديدًا، وليس إعادة استخدام موافقة هذه العملية بلا حدود.

الإجابات التالية توثق التدقيق **قبل هذا النشر**؛ حالات BLOCKED_SAFE القديمة مرجع تاريخي وقد حُسمت بواباتها في التحديث أعلاه.


الحالة: **SOURCE_ONLY / اختبارات التأهيل PASS / نشر Production BLOCKED_SAFE**.
لم يحدث Deploy أو Migration أو إنشاء أوردر تجاري على Production. قراءة Runtime وD1 هنا مستقلة ومؤرخة؛ ليست إثباتًا على حالة مستقبلية.

## 1. آخر نقطة صحيحة

آخر checkpoint للإصلاح هو release `5029d95be3c7dc69feec9fe0cf58a659b5feda9c` مع Entry652 للجلسات. بدأ التدقيق منه على `audit/t12-customer-lane-runtime-20261008`، وليس من main القديم. قرئت مقدمة الكتاب وفصول الهوية والتكرار والجلسات والحسابات والـcheckpoints المرتبطة، وجورنال الإصلاح وpreflight، ولم نفترض صحة النتائج القديمة.

مرجع المصدر المؤهل: `bc0531e3eebe133c5c8f3c009426825759cb4ffa`؛ إصلاحات التطبيق في `bb07cfbc`، واللاحق يصلح عمق checkout في CI فقط. Production ما زال على guard V1؛ CREATE GENERAL، nextOrderNumber=4796 وقت القراءة فقط. جدول claims وmigration0012 غير موجودين وقت الفحص.

## 2. الملفات التي تغيرت فعلًا

| الملف | الإصلاح |
|---|---|
| cloudflare-d1/src/t12-customer-lane-policy.mjs | المكبس Legacy يشغل PRINT؛ حفظ وتطبيع الهاتف العربي قبل mapper المشترك |
| cloudflare-d1/src/t12-general-create-handler.mjs | health لا يعلن الجاهزية دون جدول claim |
| cloudflare-d1/src/t12-general-create.mjs | replay محدود ودقيق لطلب MULTI/press محفوظ بالصيغة القديمة، بنفس actor/epoch/payload |
| trendos-edge-orders-read-v1.js | منع POST عند فشل التخزين؛ ترقية المفتاح القديم دون انتهاء 20 دقيقة أو تسريب plaintext؛ حماية محاولة أخرى عند المسح |
| config.js / index.html | cache suffix للـconfig/app/edge فقط؛ Session Epoch والـdispatcher/Andon ثابتة |

app.js وshadow-intent و0012 يحملون إصلاح release السابق، ويُضمّنون في الحزمة النهائية. أضيفت regressions في t12_general_create وt12_customer_lane_partial وt12_create_key_durability، وأدوات التشخيص read-only وبناء الحزمة، وCI والكتاب. لا تعديلات تطبيقية على Accounting/Auth/AP/EasyStore.

## 3. هل المنع مكتمل هندسيًا؟

**PASS للنطاق المختبر**: المساران PRINT/LASER مستقلان؛ MULTI ينشئ المتاح فقط ويعرض القسم المرفوض ورقم أوردره؛ لا queue للقسم المرفوض؛ claims ضمن transaction تحفظ التفرد عبر اختلاف الموظف والمحتوى؛ نفس idempotency key يعيد نفس الأوردر؛ laser لا يرث press flags. لا ندّعي أنه صار منشورًا.

خمس ثغرات جديدة فشلت قبل إصلاحها ثم نجحت. التأهيل يضم اختبارات SQLite، sessions/401، frontend، وبناء Worker المحافظ على المصدر الحي. GitHub CI النهائي [37787934224](https://github.com/fawakhry/TrendOs/actions/runs/37787934224) SUCCESS عند bc0531e3، وكل خطوات job113347412039 PASS.

## 4. Legacy

mapper مع overlay أعطى 767 بندًا: delivered638، ready73، duplicate36، cancelled20، otherOpen0؛ mirror768 بما فيه header، overlay15. حالات closed هي تم التسليم/ملغى/ملغي/مكرر؛ غيرها مفتوح بصورة محافظة. 12 صف مكبس raw كلها closed. لا هاتف عربي raw في snapshot.

15 مجموعة (orderId,lineId) مكررة ذات حالات مختلفة؛ أربع تتضمن open status؛ لا مجموعات mixed department. لم نحذف أو ندمج أو نغير حالة أي صف. هذه اختلافات تاريخية تمنع وصف البيانات بأنها نظيفة بالكامل، لكن فحص admission محافظ ويأخذ الحالة الفعلية والـoverlay. parity Google↔D1 السابقة للـ73 دليل تاريخي ولم يُعد فحص Google هنا.

## 5. Customer Identity

registered وexternal منفصلان. registered يعتمد الهاتف المطبع، ثم full normalized name فقط إذا غاب هاتف جهة؛ هاتفان معروفان مختلفان لا يتطابقان بسبب الاسم. external يعتمد externalCustomerId أولًا. claims تتطلب هوية قوية وتخزن SHA256 مع القسم.

المخاطرة الدلالية الباقية: شخصان مسجلان يشتركان في الهاتف قد يُعاملان كهوية واحدة، وغياب الهاتف في Legacy يسمح بمطابقة اسم كامل قد لا يكون فريدًا. SELECT لم يجد shared ACTIVE phone groups بأسماء مطبعة مختلفة في snapshot، لكنه لا يضمن المستقبل. لا يجوز تغيير معيار الهوية أو دمج العملاء تلقائيًا دون قرار أعمال مستقل.

## 6. التزامن وضعف الإنترنت

اختبار متزامن بموظفين مختلفين employee-a/employee-b وPRINT+MULTI يثبت PRINT واحدًا وLASER واحدًا بالضبط، claim/outbox واحدًا لكل قسم ناجح، وإعادة نفس الطلب لا تضيف سجلات. هذا أقوى من اختبار LASER<=1 السابق.

اختبار Chromium مع workerd وD1 محليين حقيقيين: PRINT موجود؛ MULTI حفظ LASER ثم أُسقط الرد؛ reload وإعادة نفس intent استخدما المفتاح نفسه وأعادا نفس رقم الأوردر. الرسالة توضح partial، الفورم والمفتاح يُمسحان بعد ACK. SELECT النهائي: orders2، lines2، outbox2، claims2، laserWithoutPress1 (يشمل seed PRINT). ProductionRequests=0؛ Auth synthetic محلي، لذلك لا نعتبر هذا اختبار تسجيل دخول Production أو قبول حركة Production.

## 7. لماذا اختلف Worker؟

Live deployment=`0b99cc58-d1ef-48c1-b214-094887858827`، version=`d7c65348-a921-4f2e-8359-f3e30ce3a1eb`، 1,024,085 bytes، SHA256=`f61e58185ec245b996dcf2aa139805d8bbac7d9d068aa7f8a7514835da3398d4`.

السبب مثبت byte-for-byte: baseline467c5e5f مع accounting-native وcore-native من ab01814dc، وبناء Wrangler4.33.2. keepNames يفسر جزءًا من الفرق؛ Accounting الحي يزيد124153 bytes؛ Core الحي سابق لـEntry650 backend alias. A2.13 run37661794220 SUCCESS يفسر النشر الأخير. إعادة البناء أعطت نفس حجم وبصمة الحزمة الحية بالضبط؛ لم نكتف بمقارنة أسماء endpoints.

البناء المرشح يُبقي Accounting/Core/Foundation دون تغيير ويغيّر خمسة ملفات backend/migration فقط. SHA256 المستهدف=`0c75704893862be91279911fbc21a04bb3f0350c5f21f55ed47e92a1e796d503`. الأداة scripts/t12_build_runtime_preserving_release.sh تمنع أي delta خارج القائمة. أربعة ملفات UI هي patchset وليست snapshot كاملة قابلة للنشر وحدها.

## 8. العمل الموازي المحفوظ

candidate0e3d35f0 يحتوي AP079/AP080؛ fixb8d4172e وrelease5029d95b محفوظان؛ accounting candidateab01814dc محفوظ. لا force push أو reset أو استبدال لهذه الفروع. Runtime Auth NATIVE6/6 mustChange0 legacyBootstrap/sessionEnroll=false؛ Accounting READONLY epoch37 authoritativeWrites=false writeAuthorityModeOFF؛ Core GENERAL epoch2. هذه قراءات وليست تغييرات.

## 9. Migration0012

Additive table/index فقط، PK(identity_key,department)، key64 chars، departmentsPRINT/LASER. لا ALTER/DROP أو backfill أو تغيير orders/status أو تفعيل CREATE. اختبرت محليًا وضمن CI؛ قابلة للتطبيق بعد الموافقة وفحص schema حديث. لا تشغيل migrations apply بشكل شامل على Production؛ تطبق0012 وحدها بإجراء معلوم ومراجع. الرجوع للكود السابق يمكنه إبقاء الجدول inert؛ لا DROP تلقائيًا. سجلات الطلبات الصحيحة لا تُحذف في rollback.

## 10. ما ينقص؟

- snapshot/version lease حديثان للـAPI والـUI وجميع bindings/settings ومسارات النشر؛ توقف إن تغير live hash أو نُشر عمل متوازٍ.
- تجميع snapshot UI الكاملة الحية مع overlay أربعة ملفات فقط، وفحص بقية الأصول byte-for-byte؛ patchset الحالي وحده لا يكفي.
- نقطة استعادة D1 حديثة وتوثيقها خاصًا ضمن مدة الاحتفاظ؛ bookmark المتاح وقت قراءة13:21/13:28UTC ليس backup دائمًا أو ترخيص restore.
- preflight أخير على المصدر/الحزمة/الـschema والـhealth؛ موافقة المالك الصريحة على نشر API/UI وتطبيق0012 وخطة نافذة الانتقال.

## 11. خطة النشر والتراجع

1. تثبيت SHA المؤهل ونتيجة CI والmanifest؛ fetch ومقارنة refs وAPI/UI live versions قبل التنفيذ. حفظ snapshot الكاملة للأصول والإعدادات، دون نسخ secrets إلى Git؛ إعادة health لكل الأنظمة.
2. إذا لزم إيقاف CREATE مؤقتًا لحماية الانتقال من old in-flight writes، يكون بنطاق CREATE فقط وضمن نافذة يعتمدها المالك؛ تصريف الطلبات الجارية؛ لا تغيير allocator أو policy epoch أو idempotency ledger أو Auth.
3. تطبيق0012 وحدها، تحقق من PK/index/schema؛ دون إعادة كتابة Legacy أو orders. البناء من الوصفة المحافظة على Runtime الحي، لا deploy checkout كاملًا.
4. نشر API المؤهل مع الحفاظ على bindings/settings/routes، ثم snapshot UI الحية مع الأربعة patches وcache pins. أي إنشاء version أو traffic promotion إجراء نشر يتطلب الموافقة. عند دعم المنصة يمكن إصدار0traffic ثم promote بعد الفحص ضمن الخطة المعتمدة.
5. تحقق GET/health ومقارنة version/hash وAuth/Accounting/Core؛ لا أوردر تجاري تجريبي عشوائي. قبول أول عملية أعمال حقيقية يتم ضمن تشغيل المالك ومراقبتها. افتح CREATE فقط بعد اكتمال بوابات الانتقال.
6. إن فشل التحقق: أوقف CREATE ضمن الخطة، أعد UI snapshot وAPI version السابقين مع settings نفسها، وأعد فحص الأنظمة. إبقاء0012 دون حذف؛ لا إزالة طلبات صحيحة أو reset للعداد. إذا حدثت كتابات صحيحة أثناء الانتقال تُراجع ledger والطلبات قبل فتح V1، إذ إن V1 أضعف في المنع. D1 restore ليس rollback تلقائيًا وقد يفقد كتابات أحدث؛ يحتاج قرارًا منفصلًا.

## 12. الحكم

SOURCE/RUNTIME BYTE PARITY=PASS؛ SOURCE TESTS=PASS؛ LOCAL CHROMIUM+D1=PASS؛ Production inventory=RUNTIME_VERIFIED READONLY. **النشر BLOCKED_SAFE** حتى إكمال UI snapshot والفحص الحديث وموافقة المالك. لا يسجل DEPLOYED قبل حدوثه والتحقق منه.

## سجل الإخفاقات والتصحيح

- gate الأصلي37779969426 FAILURE صحيح؛ عولج سبب drift بدل تجاوز gate.
- CI37787138817 FAILURE: syntax/transaction/session PASS لكن offline packaging exit128 بسبب shallow checkout؛ أصلح fetch-depth0، ثم37787934224 SUCCESS، دون تخفيف assertions.
- relay37783965362 SUCCESS لكن حد notices جعل النقل جزئيًا؛ أخذت الحقول المكتملة فقط، ثم تقرير37784540991 كامل عبر annotations. Artifact download بقي403؛ ليس دليل فشل inventory ولا نجاح تنزيله.
- تجهيز harness المتصفح تعثر في فتح create card ثم mock edgeToken؛ صُحح harness فقط؛ التشغيل النهائي PASS مع قاعدة فعلية وبدون أخطاء JS.

الأدلة المحلية sanitized محفوظة خارج checkout في /workspace/.trendos-audit/evidence، وbrowser-smoke-result.json، وlocal-worker/result-counts.json. لا تحتوي الوثيقة بيانات العملاء أو secrets أو live bundle. سجل الكتاب مكمل لهذه الوثيقة؛ تغييرات التدقيق معزولة وقابلة للمراجعة على فرع audit.
