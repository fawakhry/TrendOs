# تشغيل الليزر في مبنى منفصل عن المطبعة — ربط الشبكة / Laser Remote Site (2026-10-17)

> **Trend Mall / TrendOS / Autonomous Printshop — network integration runbook, DOCS-ONLY.**  
> المصدر: بلاغ المالك يوم 2026-10-17 بنقل ماكينة الليزر إلى مبنى مجاور يبعد نحو 100 متر؛ جهاز العمل Ubuntu، والمتاح مؤقتًا هاتف Hotspot. المطلوب استقبال وإرجاع الملفات مع شبكة/سيرفر المطبعة.  
> **الحالة:** `SITE_CONNECTIVITY=DESIGN_ONLY`، `HARDWARE_LINE_OF_SIGHT=UNKNOWN`، `LASER_UBUNTU_HOST_ID=UNVERIFIED`، `SHOP_SERVER_OS_IP_AND_LIVE_READINESS=UNKNOWN`، `CUSTOMER_MEDIA_TRANSFER=NOT_TESTED`، `PRODUCTION_LINK=OFF`، `PRINT_SERVER_RUNTIME=OFF`. هذا ليس دليل نشر أو اتصال فعلي.

## 1. القرار التشغيلي

لا حاجة **تلقائية** لخط أرضي/اشتراك إنترنت ثانٍ لأن المسافة ~100 م:
1. **الحل الدائم الأول إن وجدت رؤية مباشرة آمنة:** جسر لاسلكي خارجي Point-to-Point بين المبنيين بجهازين موجّهين لبعض، مع تركيب احترافي، LAN مُقيد الصلاحيات، وسويتش/راوتر محلي عند الليزر عند الحاجة. لا يستهلك بيانات الموبايل لنقل الملفات المحلي. إن انعدمت الرؤية المباشرة، قيّم فايبر ضوئي خارجي عبر مسار مصرح به ومقاول مؤهل. **لا تستخدم وصلة نحاس Ethernet مكشوفة بين المبنيين**؛ خطر اختلاف الجهود والصواعق، وحد Ethernet النحاس القياسي 100 م يتضمن مسار القناة وليس مسافة الهواء.
2. **حل الإنترنت المؤقت/الاحتياطي:** Ubuntu الليزر على Hotspot والـhost الموجود داخل شبكة المطبعة على اتصاله المعتاد. سجّل **الجهازين فقط** في `Cloudflare Zero Trust → Networking → Mesh → Add participant → Add device` ضمن نفس المؤسسة، وأنشئ مسار SSH/SFTP محدودًا بين عناوين Mesh الخاصة. Cloudflare Mesh متاح بخطة Free لكنه Beta بتاريخ الفحص؛ تُراجع شروط الخطة وتوافر الواجهة قبل التفعيل. الاتصال عبر الإنترنت يستهلك باقة هاتف الليزر.
3. لا تعتمد خطة Tailscale Personal مجانية للعمل التجاري؛ Tailscale يصنفها للاستخدام غير التجاري. يجوز تقييم خطة مناسبة مدفوعة إذا لزم، لا تعد Tailscale المجاني حلًا تجاريًا دائمًا.

**الأولوية للأمان:** وصلة Mesh لجهازين محددين لا تعني فتح شبكة المطبعة كلها، ولا إضافة Subnet route أو Exit node أو LAN bridge افتراضي بدون جرد وعزل وموافقة مستقلة.

## 2. واقع مشروعنا المثبت من GitHub — لا تفترض جاهزية Runtime

- `UBUNTU_SERVER_BOOK.md` / Draft PR #135 يذكر iMac12,1 Ubuntu Desktop 24.04.5 `TrendosShop`, user `trend-main`, كان في **البيت** حسب دليل 2026-10-16، وليس مثبتًا في المطبعة ولا موصولًا بآلاتها. **لا نفترض أن جهاز Ubuntu المنقول مع الليزر هو نفس هذا الجهاز.**
- OpenSSH `ssh.socket` listening محليًا، UFW incoming default DENY، `passwordauthentication yes` ومفاتيح `authorized_keys` لحساب `trend-main` غير مُجهزة آنذاك؛ لا تفتح 22 للإنترنت، ولا تلغِ كلمة المرور قبل اختبار تسجيل الدخول بالمفتاح. مراجعة firewall استثنائية ضيقة من Mesh source IP لوجهة SFTP فقط بعد اختبار المصادقة.
- `autonomous-printshop/print-server/src/config.py` يضم مسار قسم `laser` و`paths.ordersRoot`, `readyRoot`؛ هذا **source** وليس خدمة إنتاج مثبتة، والمسارات الافتراضية محلية. `src/server.py` يحمل واجهة محلية مقيدة، فلا تفتحها على `0.0.0.0` ولا تعتبرها نظام توزيع ملفات بين مبانٍ.
- Matbagy media vault على Ubuntu جُرب محليًا، لكن سياسة النسخ الاحتياطي المستقل لا تزال غير مثبتة بحسب سجل 2026-10-16. **لا تخزّن أصول العملاء أو المخرجات في GitHub أو سجلات CI**. لا تحذف مصدرًا اعتمادًا على مجرد النقل.

## 3. تفعيل Cloudflare Mesh للأجهزة فقط — مراحل يتحقق منها المالك محليًا

**بوابة قبل أي تغيير:** حدد هل جهاز الليزر هو `TrendosShop` أم جهاز Ubuntu مختلف، ونظام تشغيل الجهاز القائم فعلًا في المطبعة (Linux/Windows 10+). Windows 7 القديم غير مؤهل لافتراض عمل عميل Cloudflare One الحديث؛ استخدم host مدعومًا داخل LAN بدلاً منه. لا تنقل token أو أسرار إلى الدردشة أو GitHub.

1. افتح لوحة Zero Trust في حساب Cloudflare المصرح، تأكد أن `Mesh` متاح لخطة Free؛ اختر Organization مخصصًا أو سياسات منفصلة عن إنتاج TrendOS. **لا تغيّر Workers/D1/DNS/Tunnels الحالية.**
2. ثبّت `Cloudflare One Client` من تعليمات `Add participant → Add device` الرسمية على **Ubuntu الليزر** و**جهاز المطبعة المدعوم**. سجّل الطرفين في نفس المنظمة بصلاحيات محصورة. في حال جهاز Ubuntu headless يحتاج إلى Mesh node، تختلف خطواته وتحتاج مراجعة مستقلة قبل استخدام token.
3. تحقّق أن حالة الطرفين `Connected`، واستخرج عنوان `Mesh IP` لكل جهاز من صفحة Mesh (العنوان لا يُحفظ في GitHub). تحقق بـ`ping` متبادل، ثم اتصال SSH بمفتاح مخصص من حساب محدود؛ استخدام Mesh IP لا ينشئ خدمة SSH ولا يجاوز UFW تلقائيًا.
4. اجعل الملفات تمر فقط بمجلدين على مخزن المطبعة المعتمد: `laser/inbox/<ORDER_ID>/` للاستقبال، و`laser/returns/<ORDER_ID>/` للإرجاع. ممنوع `chmod 777` أو مشاركة جذر القرص أو بيانات الحسابات أو البيانات الشخصية غير المطلوبة. إنشاء المجلدات وتعيين الحسابات والصلاحيات يُعمل على الـhost بعد إثبات تكوينه، لا عبر GitHub.
5. **التجربة الأولى وهمية فقط:** أرسل `TEST-LASER-001.txt` من المطبعة إلى الليزر، أعد ملف رد وهمي إلى `returns`؛ افحص البصمتين `sha256sum`، ثم إعادة اتصال بعد فصل وإعادة تشغيل Hotspot. تحقق من أحجام الملفات والسرعة والتصرف عند انقطاع الاتصال. لا تصلح نتيجة `ping` وحدها إثبات نقل ملفات.
6. بعدها، وبعد إثبات هوية الجهاز/المستخدم ومجلدات العمل ووجود نسخ احتياطية، اعتمد تدفق أوردر حقيقي بصلاحيات منفصلة. وظيفة **تشغيل ماكينة الليزر نفسها** تظل يدوية ومحلية؛ لا ترسل أوامر تشغيل ماكينة من الإنترنت.

**اختبار Linux قراءة فقط، مثال عنوان افتراضي وليس العنوان الحقيقي:**
```bash
# على جهاز Ubuntu بعد التسجيل بالواجهة الرسمية
warp-cli status
ping -c 4 <SHOP_MESH_IP>
# اختبار نقل SFTP فقط إذا كانت SSH key / UFW / role مؤهلة مسبقًا
sftp <APPROVED_SHOP_USER>@<SHOP_MESH_IP>
```

إذا كان Ubuntu سطح مكتب، يمكن فتح File Manager → Other Locations → Connect to Server وكتابة `sftp://<APPROVED_SHOP_USER>@<SHOP_MESH_IP>` بعد إعداد مفتاح SSH على خادم المطبعة، دون فتح شبكة SMB عامة. `sftp` يسمح تنزيل/رفع ملف باستخدام `get`/`put`، لكنه لا يخلق أو يزامن مجلدات تلقائيًا. أي أتمتة لاحقة تحتاج سياسة منع التكرار، صلاحيات أقل، وعزل أوردرات الموظفين.

## 4. الربط الدائم بين المبنيين

- افحص رؤية مباشرة بين نقطة تركيب مرتفعة في المطبعة ونقطة الليزر. القياس الحقيقي لمسار الهواء والتشويش والكابلات الداخلية والتأريض مطلوب قبل شراء الأجهزة.
- إن توافرت، يثبت متخصص زوج معدات Outdoor PtP في وضع bridge/point-to-point، مع PoE، تأريض ومانع صواعق حسب المعيار وتعليمات المصنع، وأمن لاسلكي مناسب وكلمة مرور قوية؛ ثم VLAN أو Firewall لإتاحة مخزن الليزر فقط.
- إن فشلت الرؤية المباشرة، جرّب مسار فايبر آمن قانونيًا، لا شدّ نحاس بين المبنيين. لا تتصل بكابلات كهرباء أو أعمدة/واجهات بدون أذونات.
- بعد الربط المحلي، تستطيع المطبعة نقل الملفات دون إنترنت، بينما يظل Hotspot/Mesh مسارًا احتياطيًا فقط. DNS وDHCP وحماية الوصول تُراجع قبل وصل LAN بالمبنيين.

## 5. شروط القبول (لا تُعلِم التشغيل PASS بغير دليل حي)

| Check | مطلوب | الحالة الآن |
|---|---|---|
| Host identity | تحديد جهاز Ubuntu الجديد، جهاز المطبعة، وOS/IP محليًا | UNKNOWN |
| Cloudflare Mesh | Connected على الطرفين مع عنوانين وصلاحيات محدودة | NOT_CONFIGURED |
| Authentication | حساب SFTP محدود + SSH key tested + UFW scope | NOT_VERIFIED |
| Transfer both directions | ملفان fake، SHA256 identical، بدون صور عملاء | NOT_TESTED |
| Recovery | قطع Hotspot وإعادته بدون ضياع أو تكرار | NOT_TESTED |
| Wireless/fiber | تركيب وموافقة ومسح رؤية واختبار throughput | NOT_INSTALLED |
| TrendOS/Matbagy automatic job flow | مراجعة مستقلة وخدمة فعلية مقاسة | OFF / NOT_VERIFIED |

## 6. استرجاع آمن / Rollback

إذا ظهر أثر على شبكة الإنتاج، افصل `Cloudflare One Client` من الجهاز التجريبي أو ألغِ Enrollment من لوحة Zero Trust، وأوقف قاعدة SFTP الضيقة المنشأة للتجربة إن وجدت. لا تُمسّ Workers/D1/TrendOS، لا يُمسّ مخزن `MatbagyData`، لا تُلغَ DHCP/DNS المحلية. وصلة PtP تُعزل بفصل كابلها بعد أخذ نسخة من إعداداتها. أبقِ نسخة أصلية من كل ملف حتى اجتياز فحص سلامة النسخ واستعادة النسخ الاحتياطية.

## 7. مراجع المصدر

- Ubuntu host verified record: [UBUNTU_SERVER_BOOK.md](./UBUNTU_SERVER_BOOK.md), [Draft #135](https://github.com/fawakhry/TrendOs/pull/135).
- Print Server local code: [config.py](./src/config.py), [server.py](./src/server.py).
- Cloudflare Mesh [device-to-device](https://developers.cloudflare.com/cloudflare-one/setup/replace-vpn/device-to-device/), [getting started](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-mesh/get-started/), [platform Free Beta](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-mesh/platform/).
- Physical PtP example by manufacturer: [TP-Link CPE510](https://www.tp-link.com/us/service-provider/business-wireless/cpe510/) — **not a purchase order**.
- Tailscale [pricing and commercial plan rule](https://tailscale.com/pricing).

**CHANGE LOG 2026-10-17:** New offsite laser networking architecture; documented only via GitHub. No server access, package install, port opening, automatic printing, cloud changes, customer transfer, purchases, or live test.
