# كتاب الحسابات — ACCOUNTING MASTER BOOK

**المشروع:** حسابات Trend Mall / EasyStore داخل TrendOS  
**المسار الأساسي المعتمد من هنا:** `accounting/MASTER_BOOK.md`  
**المستودع:** `fawakhry/TrendOs` — فرع `candidate/easystore-accounting-a2-20261005`  
**أول تجميع للسجلات:** 2026-10-12  
**نوع الكتاب:** سجل تنفيذ وتدقيق متسلسل، **ليس دفتر قيود الأموال الحقيقي**.

> هذا الكتاب مخصص لأعمال الحسابات وحدها. كان تسجيل تقدم ACC يتم بالخطأ في `TrendOS_MASTER_BOOK.md`؛ **تُحفظ الكتابات السابقة هناك كأرشيف دون حذف أو تعديل**، ويصبح هذا الملف مرجع التنفيذ الأساسي للحسابات. لا يُستخدم كتاب المطبعة الذاتية `autonomous-printshop/MASTER_BOOK.md` لتتبع المحاسبة.

## قواعد ثابتة وغير قابلة للتجاوز

- قرار التشغيل المالي **NO_GO**. آخر وضع *مُبلَّغ سابقًا* للواجهة EasyStore: `OFF`، ولـWorker المالي: `READONLY`. هذا **ليس فحصًا جديدًا للإنتاج**.
- ممنوع إصدار Cloudflare Worker/Pages، أو `D1 remote`، أو أي `Financial POST`، أو تشغيل/إعادة تشغيل Canary قديم، أو تغيير حسابات وصلاحيات الموظفين الفعلية، أو حذف/تصفير بيانات تاريخية أو أخذ/استرجاع Backup حقيقي أو Rollback حقيقي، دون إذن جديد منفصل.
- **قرار المالك المسجل:** دفاتر محاسبية جديدة دون استيراد معاملات وفواتير التاريخ القديم؛ **عدم حذف أي تاريخ موجود**، وعدم افتراض أرصدة مخزون أو عهد أو خزنة أو مديونيات سابقة صفرًا. `cutover_date_local=null` ولا يُختار إلا عند موافقة التشغيل الفعلي، لا عند انتهاء البرمجة.
- كل اختبار `SQLite :memory:`، ومحاكاة Worker، و`Wrangler --dry-run`، وفحص Git source هو **دليل صناعي فقط**، ولا يساوي اعتماد تشغيل مالي حقيقي أو إصدار إنتاج.
- كل خطوة تحتاج إثباتًا مستقلًا (commit / PR / GitHub Actions exact head / postmerge إن وُجد) قبل تسجيلها `VERIFIED_COMPLETE`. الإخفاقات والتوقفات تُسجَّل ولا تُمحى. بعد تسجيلها هنا، حدِّث سجل JSON المرتبط بنفس الحالة وIssue #84.
- [قائمة المهام القابلة للفحص الآلي](../docs/trendos/staging/ACC186_ACCOUNTING_SAFE_EXECUTION_LEDGER_20261012.json) — الرابط الصحيح داخل المستودع: `docs/trendos/staging/ACC186_ACCOUNTING_SAFE_EXECUTION_LEDGER_20261012.json`. [متابعة GitHub Issue #84](https://github.com/fawakhry/TrendOs/issues/84).

## آخر نقطة تحققت بعد فصل الإنترنت

**آخر فرع حسابات مؤكد قبل فتح هذا الكتاب:** `2128e79d5920163733602304b142674838bab96b`.  
**آخر مرحلة مصدرية مُنجزة بالكامل بالأدلة:** **ACC-193 (اختبار دفاتر جديدة صناعية؛ لا اعتماد افتتاح حقيقي)**.  
**آخر Pull Request مُدمج:** [PR #100](https://github.com/fawakhry/TrendOs/pull/100)، دمج `2128e79d5920163733602304b142674838bab96b`.  
**مراجعات ما بعد الدمج:** [ACC193 #38187854508](https://github.com/fawakhry/TrendOs/actions/runs/38187854508) و[ACC186 #38187854445](https://github.com/fawakhry/TrendOs/actions/runs/38187854445)، **SUCCESS** كلاهما.  
**فحوص رأس PR #100 قبل الدمج:** 23/23 **SUCCESS** على `7086e15ef39ba265e3faccc0be8ae6956686030a`.

## سجل المراحل التي نُفِّذت فعلًا (نقل تدقيقي من الكتاب القديم)

| المرحلة | الإنجاز الفعلي الآمن | PR / دمج / CI بعد الدمج | حالة المرحلة الصحيحة |
| --- | --- | --- | --- |
| ACC-183 | بناء Worker المجمع المسمّر بـWrangler، dry-run دون نشر، تأكد بصمات المصدر | [#64](https://github.com/fawakhry/TrendOs/pull/64) · `9af8c034992d765cf124dbf59768f01c717bc108` · [CI 38083057715](https://github.com/fawakhry/TrendOs/actions/runs/38083057715) | VERIFIED_COMPLETE **مصدر فقط** |
| ACC-184 | رفض GO إذا بوابات الإنتاج ناقصة، نموذج Rollback لعينة Worker **لا يعكس DB** | [#66](https://github.com/fawakhry/TrendOs/pull/66) · `59a79b37deb948ba7f25ceffc84633f1aaa65e78` · [CI 38084795842](https://github.com/fawakhry/TrendOs/actions/runs/38084795842) | VERIFIED_COMPLETE صناعي |
| ACC-185 | عقد مصدر الواجهة EasyStore وWorker: 10/10 أوامر، A2.13 OFF وإصلاح اختبارات cache القديمة في نسخة runner فقط | [#67](https://github.com/fawakhry/TrendOs/pull/67) · `9505c896c9c27869cf2950e1f72be423e64868ee` · [CI 38085491124](https://github.com/fawakhry/TrendOs/actions/runs/38085491124) | VERIFIED_COMPLETE مصدر/اختبار |
| ACC-186 | إنشاء 13 مرحلة تنفيذ ACC187–199 + 5 بوابات موافقات وإلزام PR/CI قبل علامة اكتمال | [#83](https://github.com/fawakhry/TrendOs/pull/83) · `93e4353536fb7b56638e9fb928638cbb3c94ba14` · لاحقًا [CI 38187854445](https://github.com/fawakhry/TrendOs/actions/runs/38187854445) SUCCESS | VERIFIED_COMPLETE للتخطيط والتدقيق |
| ACC-187 | إثبات أمان عكس الشراء عند نقص المخزون/سداد المورد؛ توثيق غياب API رد فلوس العميل؛ فتح فاتورة للمراجعة **لا يصرف refund** | [#87](https://github.com/fawakhry/TrendOs/pull/87) · `4b031ce68e9c51b1cb8f59380d7621a5d3a4c398` · [CI 38185499460](https://github.com/fawakhry/TrendOs/actions/runs/38185499460) | **IN_PROGRESS_UNVERIFIED**: مرتجعات العميل الحقيقية لم تُنفَّذ |
| ACC-188 | إصلاح إعادة محاولة قبض العميل/دفع المورد بنفس المفتاح بعد انخفاض الرصيد، دون ترحيل قيد خزنة ثانية | [#90](https://github.com/fawakhry/TrendOs/pull/90) · `805f39cad8b8ce81a14f859ad77d7c6fba421a49` · [CI 38185693970](https://github.com/fawakhry/TrendOs/actions/runs/38185693970) | VERIFIED_COMPLETE صناعي |
| ACC-188 حماية إضافية | وقف GitHub Actions A2.10 القديم من إرسال Commit تلقائي إلى فرع الحسابات؛ اختبار صلاحية `contents:read` وأثر اختبار مستقل | [#93](https://github.com/fawakhry/TrendOs/pull/93) · `efeb5128f9e804fba31baf575fae3c6d35e1525c` · [CI 38185980959](https://github.com/fawakhry/TrendOs/actions/runs/38185980959) | VERIFIED_COMPLETE حوكمة CI |
| ACC-189 | اختبار تكلفة الخامات المركبة والهالك والرصيد السالب والتزامن؛ رفض إدخال مخزون سالب في المصدر | [#96](https://github.com/fawakhry/TrendOs/pull/96) · `6ce367c924dddffaba02778873bf300a2495538d` · [CI 38186201755](https://github.com/fawakhry/TrendOs/actions/runs/38186201755) | VERIFIED_COMPLETE صناعي |
| ACC-190 | إخفاء cost/profit من JSON لأدوار ليست `full`، ومصفوفة أدوار وهمية ورفض تزوير الهوية | [#98](https://github.com/fawakhry/TrendOs/pull/98) · `e0e373fcd2fac8cd11bba3cce25408e139f4f2d3` · [CI 38186756589](https://github.com/fawakhry/TrendOs/actions/runs/38186756589) | VERIFIED_COMPLETE للأدوار الصناعية، **لم تُعتمد الأدوار الحقيقية** |
| ACC-191 | مصدر إقلاع EasyStore V1922، SSO origin/nonce/opener، وضع كتابة OFF واختبارات الواجهة القديمة | [#99](https://github.com/fawakhry/TrendOs/pull/99) · `6bc2b9b32b48fd0fe13387a17ffa5d1cc046def2` · [CI 38187201356](https://github.com/fawakhry/TrendOs/actions/runs/38187201356) | **IN_PROGRESS_UNVERIFIED** للاختبار الشامل للمتصفح وSSO الفعلي |
| ACC-193 | SQLite مؤقت: إنشاء دفاتر جديدة فارغة، عدم استيراد تاريخ قديم وعدم حذفه، حد Canary مرفوض وعدم تحديد تاريخ | [#100](https://github.com/fawakhry/TrendOs/pull/100) · `2128e79d5920163733602304b142674838bab96b` · [CI 38187854508](https://github.com/fawakhry/TrendOs/actions/runs/38187854508) | VERIFIED_COMPLETE **للتجربة المعزولة فقط**، G3 الحقيقي مفتوح |

### سجل النتائج والأخطاء التي حدثت أثناء التنفيذ

- **ACC-185:** فشل [CI 38085068086](https://github.com/fawakhry/TrendOs/actions/runs/38085068086) بسبب tag قديم في اختبارين من EasyStore، ثم فشل [CI 38085223523](https://github.com/fawakhry/TrendOs/actions/runs/38085223523) لأن الاختبار الثالث كان يفترض آلية Canary أضعف من سياسة OFF الحالية. صُحّحت الاختبارات في checkout مؤقت فقط وتأكد CI بعد الدمج؛ لم يُعدَّل إنتاج EasyStore.
- **ACC-187/ACC-186:** فشل [CI 38185381033](https://github.com/fawakhry/TrendOs/actions/runs/38185381033) لأن الاختبار افترض بقاء جميع المراحل في `QUEUED` حتى بعد بدء ACC187؛ صُحّحت معادلة حالات التقدم دون قبول دليل اكتمال مزيف.
- **ACC-188/تتبع الاعتماديات:** أصبح ACC188 مستقلًا عن ACC187 الناقصة وأُصلحت فحوص تحقق اعتماديات المراحل. Commit قديم من bot `c41317d91aff0a35ffee5b7b1addb319302b867c` عدّل رقم RUN_ID في ملف A2.10، وسلوك الإضافة التلقائية أُلغي في PR #93؛ السجل القديم لم يُحذف.
- **ACC-190/ACC-186:** فشل [CI 38186633378](https://github.com/fawakhry/TrendOs/actions/runs/38186633378) بسبب اختبار اعتمادية يفترض ACC189 ناقصة وهي اكتملت؛ صُحّح الاختبار إلى مرحلة ACC194 مع ACC193 قبل اكتمالها. بعدها 21/21 PR checks و29/29 checks بعد الدمج ناجحة.
- **ACC-191:** فشل [CI 38187099400](https://github.com/fawakhry/TrendOs/actions/runs/38187099400) بسبب تكرار اسم النسخة داخل index.html وعدم تغيير كل ظهوره في تجربة الإخفاق؛ صُحّح الاختبار فقط، ثم 22/22 PR checks والـCI بعد الدمج ناجح.
- **ACC-193:** فشل [CI 38187732591](https://github.com/fawakhry/TrendOs/actions/runs/38187732591) لأن الاختبار ظن أن `canary.enabled` الافتراضي 0، بينما القيمة 1 تعني **حارس رفض مفعل** مع users/actions فارغة وميزانية 0. صُحّح توقع الاختبار، **دون تغيير migration**. نجاح [CI 38187801450](https://github.com/fawakhry/TrendOs/actions/runs/38187801450) وCI بعد الدمج #38187854508.

## ما لم يكتمل حتى هذه المراجعة

| المرحلة | الحالة | المطلوب الباقي بدون الخلط بموافقة الإنتاج |
| --- | --- | --- |
| ACC-187 | IN_PROGRESS | تصميم واعتماد تفاصيل refunds/returns (نقد/رصيد، جزئي/كلي، هالك، أثر خزنة ومخزون وفاتورة)، ثم تنفيذ واختبار مصدر آمن. القواعد التجارية غير مقررة بعد، **لا تُخترع** |
| ACC-191 | IN_PROGRESS | اختبار متصفح فعلي في بيئة غير إنتاجية، وSSO متكامل اصطناعي، ومطابقة SHA نسخة Pages المنشورة؛ الفحص السابق مجرد مصدر |
| ACC-192 | QUEUED | تقارير الأقسام والخزنة والتقفيل اليومي وتوازن القيود في SQLite وهمي |
| ACC-193 | SYNTHETIC DONE | بقي خارج هذه المرحلة توثيق اعتماد G3 الفعلي: جرد وخزنة وعهد والتزامات وتاريخ يقرره المالك لاحقًا |
| ACC-194 | QUEUED | اختبارات D1 نسخ واسترجاع صناعية أكثر شمولًا (ليس إنتاجًا) |
| ACC-195 | QUEUED | منع اختلاف Worker/Bindings/Wrangler والإصدار |
| ACC-196 | QUEUED | تجربة فشل/رجوع وهمية لا تغيّر D1 حقيقي |
| ACC-197 | QUEUED | إعداد ملف اختبار عهدة A2.13 المحدود الحقيقي **دون تشغيله** |
| ACC-198 | QUEUED | دورة تشغيل مالية كاملة **ببيانات صناعية**؛ تعتمد على النواقص ACC187 وACC191 وACC192 |
| ACC-199 | QUEUED | ملف تسليم التشغيل وتجميع إثباتات CI مع استمرار NO_GO |

### بوابات موافقة المالك — جميعها OPEN

**G1:** تجربة عهدة A2.13 أصلية محدودة موقّعة؛ **G2:** مصفوفة صلاحيات الموظفين الفعلية [Issue #40](https://github.com/fawakhry/TrendOs/issues/40)؛ **G3:** جرد المخزون والخزنة والعهد والالتزامات وتحديد تاريخ التشغيل عند إذن نهائي؛ **G4:** قبول دورة مالية حقيقية؛ **G5:** Backup إنتاج أصلي واسترجاع مستقل والتقاط Worker المنشور وخطة رجوع ونشر مُجاز.

**القرار النهائي:** `NO_GO`. **التغييرات المالية الحقيقية خلال هذا التجميع: صفر**. لا يُحوِّل نجاح CI الصناعي أيًا من هذه البوابات إلى CLOSED.

## سجل التحويل إلى الكتاب الصحيح

- المصدر الأرشيفي السابق: [TrendOS_MASTER_BOOK.md](../TrendOS_MASTER_BOOK.md) (المسار الصحيح في جذر المستودع `TrendOS_MASTER_BOOK.md`)، ويُحتفظ به كما هو.
- سجل آلة الحالات: `docs/trendos/staging/ACC186_ACCOUNTING_SAFE_EXECUTION_LEDGER_20261012.json`، يجب أن يشير إلى هذا الكتاب وأن يتطابق مع حالاته.
- دفتر المحاسبة هذا هو **سجل أعمال البرمجة والمراجعة الأساسي** من هذه النقطة؛ لا تُسجَّل مراحل الحسابات الجديدة في كتاب مشروع المطبعة الذاتية أو في TrendOS العام بوصفه المرجع الأساسي.
- **مراجعة هذا النقل قيد PR/CI** عند كتابة السطر، ولن يوسم ناجحًا قبل التحقق من GitHub.
