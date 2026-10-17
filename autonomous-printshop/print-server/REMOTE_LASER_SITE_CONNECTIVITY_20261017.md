# ربط جهاز الليزر بالمطبعة عبر الإنترنت — تصحيح التوزيع الفعلي (17 أكتوبر 2026)

> **Trend Mall / Autonomous Printshop — README / Runbook؛ توثيق ومراجعة فقط.**
>
> **تصحيح صريح من المالك 2026-10-17 (يلغي أي افتراض مخالف في النسخة السابقة):**
> - **LASER_PC:** Windows 7، في مبنى الليزر الجديد على بعد نحو 100 متر من المطبعة. الإنترنت المؤقت المقترح: هوتسبوت الموبايل.
> - **SHOP_SERVER_PC:** Windows 7، داخل المطبعة وعلى شبكتها؛ ليس Ubuntu.
> - **UBUNTU_HOST = TrendosShop:** عند المالك في **البيت حاليًا**، غير موجود عند الليزر أو في المطبعة، وليس مسار الشبكة اللازم لتشغيل الليزر غدًا.
> - وصلة كابل بين المبنيين غير مناسبة وفق إفادة المالك؛ لا تطرح توصيلًا سلكيًا كحل للصباح.
> - الـWindows7 أجهزة قديمة غير مدعومة أمنيًا؛ مرفوض فتح بورت SMB (445) أو RDP (3389) أو SSH (22) على الإنترنت.

## 1. قرار الربط الفوري: Windows 7 ↔ Windows 7، بلا Ubuntu

**التجربة الأبسط**: Radmin VPN على **جهازَي Windows 7 فقط**، يربطهما عبر الإنترنت دون الحاجة إلى إعداد Port Forwarding، بينما يصل جهاز الليزر بالهوتسبوت، ويظل جهاز المطبعة على الإنترنت المعتاد. وثائق المنتج الرسمية تؤكد توافق Windows 7، التشفير، مجانية البرنامج، وخيار Create network / Join network. راجع EULA قبل التثبيت.

مخطط:
```
المطبعة                              مبنى الليزر
Windows 7 shop server                Windows 7 laser PC
إنترنت المطبعة                       هاتف hotspot
         |                                   |
         +----- Radmin VPN encrypted -------+
               network / two peers only
```

**ليس تدفقًا آليًا من TrendOS بعد**: سيتم اختبار ملفات وهمية أولًا، ثم — إذا نجح الربط وتأهلت صلاحيات الملفات والنسخ الاحتياطية — ينقل المشغل ملفات الشغل يدويًا، ولا يوجد أي تغيير في آلة الليزر نفسها أو أوامر الحفر.

## 2. خطوات إثبات صغير ومحدود (owner-operated; لا تنفيذ من GitHub)

1. افحص وجود اتصال إنترنت فعلي على الجهازين، مع عدم مشاركة hotspot مع أطراف غير معروفة. على جهاز الليزر افحص Wi-Fi والتوافق مع 2.4 GHz hotspot أو استخدم USB tethering إن كان تعريفه مدعومًا. لا تُوصل أي ماكينة قبل إتمام اختبار الملفات.
2. نزّل Radmin VPN **من الموقع الرسمي فقط** على الجهازين، وافحص التوقيع الرقمي وثبّتهما بعد نقطة استعادة/نسخة احتياطية مناسبة للـWindows7، خصوصًا على سيرفر المطبعة. قد يتغير مسار الشبكة مع ظهور كارت VPN جديد؛ لا تغيّر إعدادات الراوتر/الـIP المحلي.
3. في المطبعة: Radmin VPN → **Create network**؛ اختر اسم شبكة فريدًا وسرًا قويًا **لا تضعه في دردشة/GitHub**. في جهاز الليزر: **Join network** بالاسم والسر. تأكد أن جهازين فقط يظهران في الشبكة الخاصة.
4. استخرج عنوان **Radmin VPN IP** لكل جهاز من التطبيق (غالبًا `26.x.x.x` ولكن استخدم العنوان الفعلي). جرّب `ping` من قائمة التطبيق للطرف الآخر. نجاح ping لا يكفي لنجاح مشاركة الملفات.
5. لتجربة تبادل الملفات، أنشئ على **جهاز المطبعة** مجلد تجربة خاليًا من بيانات عملاء وليكن `C:\\LaserTransferTest`، واجعله مشاركة محدودة **اسمها `LaserTest`**. استخدم حساب Windows محليًا غير إداري وكلمة مرور قوية، مع Share + NTFS permissions محدودة. راجع Windows Firewall: اسمح فقط من عنوان VPN الطرف الآخر إلى SMB TCP 445 على واجهة VPN بعد فحص سياسة النظام؛ **لا تعطّل الجدار الناري ولا تفتح مشاركة `Everyone` بلا كلمة مرور، ولا تسمح بتعرّض SMB للراوتر العام أو شبكة الضيوف**.
6. من جهاز الليزر جرّب فتح `\\\\<SHOP_RADMIN_IP>\\LaserTest` في File Explorer، بالمستخدم المحدود؛ أنشئ `TEST-LASER-001.txt` ثم انسخه للمطبعة، وأرجع `TEST-LASER-REPLY.txt`. تحقق من الأحجام والمحتوى أو SHA-256. **أي فشل أو ضرورة استخدام SMBv1 قديم وغير مؤمن = توقف عن مشاركة الملفات، ولا تُضعف الإعدادات لمجرد نجاح الاتصال**.
7. اختبر انقطاع الهوتسبوت والعودة وتأكد من عدم ضياع أو تكرار الملفات؛ قس الاستهلاك والسرعة مع ملفات تجريبية وأحجام قريبة من DXF/PNG الحقيقي.
8. بعد التجربة فقط، أنشئ `Laser Inbox` و`Laser Returns` لكل أوردر وصلاحيات خاصة ودورة تسمية واضحة؛ **لا تحذف الأصل**. احتفظ بنسخ احتياطية مستقلة وتحقق من الاستعادة.

### استرجاع سريع
إذا تسبب عميل VPN أو تغيير sharing بمشكلة إنتاج: افصل VPN على الجهازين، أزل مشاركة `LaserTest` المؤقتة/قواعدها المحددة بعد توثيقها، واعد الإعدادات السابقة. لا تغيّر D1 أو Cloudflare أو TrendOS Workers أو المخزن المحلي. لا تفتح Remote Desktop/Radmin Server لأن الحاجة نقل ملفات فقط.

## 3. أمان Windows 7 — حد أساسي

- Microsoft أوقفت دعم Windows 7 يوم **14 يناير 2020**؛ ماكينات الإنتاج العاملة به لا ينبغي تعريضها للإنترنت أو توسيع صلاحياتها بشكل دائم. Radmin VPN *يضيف شبكة خاصة مشفرة* ولكنه **لا يعالج ثغرات نظام التشغيل، SMB، أو سرقة بيانات الاعتماد**. اجعل الاتصال نطاقًا ضيقًا ومؤقتًا، وخطط لجهاز gateway حديث منفصل أو تحديث منصة غير مرتبطة ببرنامج الليزر إذا استحال ترقية الجهاز نفسه.
- لا تعطل Firewall أو antivirus، ولا تستخدم share بكلمة مرور فارغة، ولا تعرض كامل القرص، ولا توصل كل أجهزة LAN خلف VPN. **SMBv1 ممنوع في المسار الجديد**؛ حتى لو كان مطلوبًا تاريخيًا لجهاز/برنامج آخر، لا تفعله لإصلاح اختبارنا. يمكن استخدام اتصال ملفات عبر بوابة Linux حديثة ذات SFTP لاحقًا إن أردنا عزل الـWindows7؛ لكن Ubuntu الموجود في البيت لا يحل محل بوابة قائمة بالمطبعة دون تركيب/تخطيط منفصل.
- بعض شبكات الموبايل تعمل NAT/CGNAT، وقد تصبح وصلة Radmin VPN Relay/TCP؛ اختبر عمليًا ولا تفترض سرعات عالية أو اتصالًا مباشرًا. نقل الملفات عبر الإنترنت يستهلك من باقة الهاتف.

## 4. الأنظمة الأخرى وملاحظات على الوثيقة السابقة

- **Cloudflare Mesh ليس حلًا مباشرًا لجهازي Windows 7:** عميل Cloudflare One الحديث لا يدعم Windows 7، ولا يوجد Ubuntu في المطبعة أو مبنى الليزر حاليًا. لا تعمل Installation على Windows7 لعميل غير مدعوم، ولا تستخدم Workers/D1 أو أدوات TrendOS السحابية كجسر لنقل صور العملاء.
- **Ubuntu TrendosShop في البيت:** السجل السابق لكتابي Ubuntu والمطبعة الذاتية يظل صحيحًا بالنسبة لاختبار هذا المضيف مستقلًا؛ لا يدّعي ارتباطه بمبنى الليزر. ملف `src/config.py` يتضمن مسار `laser` على مستوى **source only**؛ لا توجد خدمة توزيع أوردرات مثبتة Production.
- **PtP wireless bridge** قد يكون بديلًا مستقبليًا إذا المالك سمح بحل لاسلكي وتركيب أجهزة واتضحت الرؤية بين المبنيين؛ ليس جزءًا من تجربة الهوتسبوت الحالية، ولا نحتاج تمديد أسلاك بين المبنيين.

## 5. بوابات الاختبار والهوية — لا مزاعم تشغيل

| التحقق | الوضع |
|---|---|
| ثلاث أجهزة ومواقعها | VERIFIED_BY_OWNER_2026-10-17 |
| Radmin VPN installed on both Win7 hosts | NOT_VERIFIED |
| Correct Windows7 compatibility | OFFICIAL_VENDOR_DOCUMENTED; SITE_INSTALL_NOT_TESTED |
| Shop VPN IP / laser VPN IP | UNKNOWN / NEVER_RECORD_REAL_ADDRESSES_IN_PUBLIC_REPO |
| Interdevice ping | NOT_TESTED |
| Limited SMB share / auth / firewall | NOT_CONFIGURED |
| Bidirectional fake file test / integrity | NOT_TESTED |
| Hotspot reconnection / measured throughput | NOT_TESTED |
| TrendOS / Matbagy automatic laser order sync | NOT_IMPLEMENTED_OR_NOT_VERIFIED |
| Actual customer file transfer or laser control | OFF |
| Ubuntu home host involvement | NONE |

## مصادر رسمية
- Radmin VPN — [الرئيسية](https://www.radmin-vpn.com/)، [طريقة إنشاء الشبكة والانضمام ومتطلبات Windows7](https://www.radmin-vpn.com/help/)، [EULA](https://www.radmin-vpn.com/eula/).
- Microsoft [Windows 7 end of support](https://learn.microsoft.com/en-us/lifecycle/products/windows-7)؛ Microsoft [SMBv1 risks and Windows7 SMB configuration](https://learn.microsoft.com/en-us/windows-server/storage/file-server/troubleshoot/detect-enable-and-disable-smbv1-v2-v3).
- Cloudflare One [client support lifecycle](https://developers.cloudflare.com/cloudflare-one/team-and-resources/devices/cloudflare-one-client/download/support-lifecycle/).

**التغيير 2026-10-17:** استبدال خطة سابقة كانت تفترض Ubuntu في مبنى الليزر بمخطط مطابق لتصحيح المالك: Win7↔Win7 فقط؛ Ubuntu في البيت. **GITHUB_DOCS_ONLY=YES**، **NO_INSTALL_NO_DEPLOY_NO_MERGE_NO_CUSTOMER_DATA=YES**.
