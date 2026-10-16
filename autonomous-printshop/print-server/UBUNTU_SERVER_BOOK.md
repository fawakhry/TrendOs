# كتاب سيرفر TrendosShop — Ubuntu / Server Book

> **المشروع:** Trend Mall / TrendOS / Autonomous Printshop  
> **الجهاز:** iMac منزلي يحمل اسم `TrendosShop`، مستخدم Ubuntu `trend-main`  
> **الحالة:** سجل فحوصات مُثبتة بصور Terminal قدّمها المالك، وليس اتصالًا مباشرًا من ChatGPT بالسيرفر.  
> **تاريخ أحدث دليل:** 2026-10-16 (حسب جلسة الفحص وصورة Terminal).  
> **درجة الإطلاق:** `HOST_READONLY_CHECKED` / `PLATFORM_LINK_NOT_VERIFIED` / `PRINTING=OFF`.
>
> هذا هو سجل السيرفر التفصيلي. مرجعية المطبعة التشغيلية: [كتاب المطبعة](../MASTER_BOOK.md)، والمرجعية العامة للمنصة: [كتاب TrendOS](../../TrendOS_MASTER_BOOK.md).
> أي نجاح لفحص نظام التشغيل **لا** يثبت اتصال TrendOS، ولا يعني إذنًا بنشر خدمات أو تشغيل أجهزة المطبعة.

## قواعد تسجيل كل خطوة

كل فحص جديد يُوثّق بتاريخ، وأمر واحد، والنتيجة الظاهرة حرفيًا أو بمعناها الدقيق، وتصنيف الإثبات، وقرار الخطوة التالية؛ **لا تُحذف السجلات السابقة** ولا تُستنتج نتائج لم تظهر. الصور الأصلية تبقى في محادثة المالك ولا تُنسخ إلى GitHub، ولا تُحفظ كلمات مرور، مفاتيح، رموز دخول، عناوين خاصة، أو بيانات عملاء. إصلاح GitHub التوثيقي لا يساوي تطبيقه على Ubuntu.

## خط الأساس السابق (مرجع AP-156)

- Ubuntu Desktop 24.04.5 LTS على iMac12,1، 8 GiB RAM، SSD داخلي 120 GB؛ اسم المضيف `TrendosShop`، المستخدم `trend-main`. موقعه الحالي الذي أكده المالك: **البيت** لا المطبعة.
- تثبيت `openssh-server` الإصدار `1:9.6p1-3ubuntu13.19` ثابت بصورة Terminal سابقة. [AP-156 / Draft PR #97](https://github.com/fawakhry/TrendOs/pull/97).
- مجلد المستودع المحلي `$HOME/TrendOs`، والفرع المعروض `feature/ap155-imac-ssh-service-absent-owner-install-20261012`.
- سجلنا *الأدلة الحالية* أدناه دون أي ادعاء عن وصول من شبكة خارجية أو تشغيل إنتاجي.

## سجل فحوصات المالك — 2026-10-16

### SERVER-20261016-01 — تحقق استماع SSH Socket
- **الأمر المحلي:** `systemctl status ssh.socket --no-pager`.
- **الدليل:** صورة Terminal للمالك تعرض `Loaded: loaded ... enabled` و`Active: active (listening)` منذ 14:55 محليًا، مع `Listen: 0.0.0.0:22` و`[::]:22` و`Triggers: ssh.service`.
- **النتيجة:** `SSH_SOCKET_SYSTEMD_LISTENING=PASS`. الاستماع على كافة عناوين النظام **ليس** دليلًا على الوصول من خارج الجهاز أو عبور UFW.
- **التغيير:** لا شيء؛ فحص للقراءة فقط.

### SERVER-20261016-02 — سياسة UFW الفعلية
- **الأمر:** `sudo ufw status verbose`.
- **الدليل:** `Status: active`; `Logging: on (low)`; `Default: deny (incoming), allow (outgoing), disabled (routed)`؛ ولا تظهر قواعد سماح مخصصة في الصورة.
- **النتيجة:** `UFW_DEFAULT_INCOMING_DENY=VERIFIED`; `PORT_22_UFW_ALLOW_RULE=NOT_SHOWN`. لا ندعي اختبار اتصال من عميل خارجي.
- **التغيير:** لا شيء.

### SERVER-20261016-03 — عائق القراءة الأول لإعدادات sshd
- **الأمر:** `sudo sshd -T | grep -E '^(permitrootlogin|passwordauthentication|pubkeyauthentication|kbdinteractiveauthentication)'`.
- **الدليل:** `Missing privilege separation directory: /run/sshd`.
- **النتيجة:** فشل **فحص عرض الإعدادات** حينها، وليس إثبات فشل تثبيت OpenSSH أو فشل `ssh.socket`.

### SERVER-20261016-04 — تحقق نمط Socket Activation
- **الأمر:** `systemctl show ssh.service -p ActiveState -p SubState -p RuntimeDirectory -p RuntimeDirectoryMode`.
- **الدليل:** `RuntimeDirectory=sshd`, `RuntimeDirectoryMode=0755`, `ActiveState=inactive`, `SubState=dead`.
- **النتيجة:** حالة الخدمة عند التصوير `inactive/dead` ومتسقة مع وجود socket مفعل منفصل؛ ليس تأكيدًا أن تسجيل الدخول يعمل.

### SERVER-20261016-05 — عرض إعدادات sshd المكتوبة صراحة
- **الأمر:** بحث `grep` للخيارات `PermitRootLogin / PasswordAuthentication / PubkeyAuthentication / KbdInteractiveAuthentication / Include / Match` داخل `/etc/ssh/sshd_config` و`sshd_config.d/`.
- **الدليل:** `Include /etc/ssh/sshd_config.d/*.conf` و`KbdInteractiveAuthentication no` فقط.
- **النتيجة:** لا يجوز تفسير الخيارات غير الظاهرة على أنها مُعطلة؛ احتجنا فحص القيمة الفعلية.

### SERVER-20261016-06 — تهيئة مؤقتة لقراءة القيم الفعلية
- **الأمر المحلي المنفّذ بإرشاد المالك:** `sudo install -d -m 0755 /run/sshd && sudo sshd -T | grep -E '^(permitrootlogin|passwordauthentication|pubkeyauthentication|kbdinteractiveauthentication) '`.
- **الدليل:** `permitrootlogin without-password`، `pubkeyauthentication yes`، `passwordauthentication yes`، `kbdinteractiveauthentication no`.
- **النتيجة:** `SSHD_EFFECTIVE_AUTH_SETTINGS=VERIFIED` للحالة الافتراضية المعروضة؛ كلمة المرور **مسموح بها**. `without-password` يمنع كلمة مرور root ولكنه لا يمنع دخول root بالمفتاح.
- **التغيير الحقيقي المحدود:** إنشاء مجلد التشغيل المؤقت `/run/sshd` عند الحاجة؛ **لا** تغيير دائم في إعدادات SSH، ولا تشغيل خدمة إضافية، ولا فتح منفذ. الإعدادات الفعلية قد تختلف وفق مستخدم/عنوان عميل خاص عند استعمال `Match`.

### SERVER-20261016-07 — مفاتيح دخول المستخدم
- **الأمر:** `if [ -s "$HOME/.ssh/authorized_keys" ]; then echo "SSH_KEYS=FOUND"; else echo "SSH_KEYS=NOT_CONFIGURED"; fi`.
- **الدليل:** `SSH_KEYS=NOT_CONFIGURED`.
- **النتيجة:** لا يوجد ملف `authorized_keys` غير فارغ للمستخدم `trend-main` عند الفحص؛ **لا** يعني عدم وجود أي مفاتيح ممكنة ضمن مستخدمين أو مصادر مصادقة أخرى.
- **القرار:** لا تُعطّل `PasswordAuthentication` قبل إنشاء مفتاح دخول مناسب والتحقق من إمكانية الوصول بمفتاح من جهاز مصرح له. لا تُفتح قاعدة SSH في UFW أو الراوتر بدون تصميم وصول خاص معتمد.

### SERVER-20261016-08 — الموقع الفيزيائي
- **المصدر:** إجابة صريحة من المالك في المحادثة بتاريخ 2026-10-16: **في البيت**.
- **التأثير:** الجهاز ليس متصلًا على نحو مثبت بشبكة الطابعات أو جهاز Windows 7 في المطبعة. الأولوية لتجهيز محلي وقراءة منصة آمنة، وليس إدارة الطابعات الفعلية.

### SERVER-20261016-09 — حالة Git المحلية
- **الأمر:** `git -C "$HOME/TrendOs" status --short --branch`.
- **الدليل:** `## feature/ap155-imac-ssh-service-absent-owner-install-20261012...origin/feature/ap155-imac-ssh-service-absent-owner-install-20261012 [behind 80]` ولا تظهر أسطر ملفات معدلة.
- **النتيجة:** `GIT_LOCAL_BRANCH_TRACKING=VERIFIED`; `GIT_BEHIND_REMOTE_TRACKING=80` **في لحظة الصورة فقط**؛ `WORKTREE_CHANGES_VISIBLE=NO`.
- **مهم:** قيمة behind تحسب مقابل مرجع التتبع المحلي، ولا تثبت وحدها أن السحابة لحظيًا متقدمة بالعدد نفسه؛ لم ننفذ `fetch` أو `pull` أو `checkout` أو `reset`. لم يُعرض `HEAD` المحلي الدقيق في الصورة. أحدث مصدر GitHub واصل في فرع مراجعة منفصل، **ولم ينتقل إلى Ubuntu**.

## تجميع البوابات الحالية

| البوابة | الحالة |
| --- | --- |
| Ubuntu + OpenSSH مثبتان | `OWNER_EVIDENCE_PASS` |
| استماع `ssh.socket` محليًا | `PASS` |
| UFW مفعّل / الوارد DENY | `PASS` |
| المصادقة بكلمة المرور | `ENABLED_RISK_TO_REVIEW` |
| ملف مفاتيح `trend-main` | `NOT_CONFIGURED` |
| SSH خارجي محدود ومؤهل | `NOT_TESTED / NOT_AUTHORIZED` |
| اتصال Print Server بمنصة TrendOS الحية | `NOT_VERIFIED` |
| أوردرات عملاء / طابعات / D1 Production | `NOT_TOUCHED` |

## الترتيب التالي (أمر واحد في كل مرة على جهاز المالك)

1. **فحص READ-ONLY التالي:** `git -C "$HOME/TrendOs" rev-parse HEAD` للحصول على بصمة `HEAD` المحلية الدقيقة، ثم مقارنة المصدر مع GitHub **بدون تحديث الجهاز**.
2. مراجعة فروق الفرع وتحديد ما إذا كانت نسخة Print Server المحلية آمنة للاختبار. ممنوع بدء `run.py` بالإعدادات الافتراضية التي تتيح سلوك كتابة ومزامنة حقيقية.
3. اختبار محلي ببيانات وهمية فقط ثم — بموافقة مستقلة — تأهيل اتصال صادر للقراءة فقط عبر HTTPS إلى TrendOS دون فتح SSH للإنترنت.
4. لا تغييرات في UFW/SSH أو الراوتر أو الطابعات أو Win7 أو أوردرات العملاء أو خدمات دائمة إلا بعد فحص وموافقة منفصلين.

## سجل تغييرات هذا الكتاب

- **2026-10-16 — إنشاء سجل مركزي:** تجميع نتائج فحوصات SSH/UFW/Git الموضحة أعلاه من لقطات Terminal قدّمها المالك في المحادثة. `DOCS_ONLY=YES`, `UBUNTU_REMOTE_EXECUTION=NO`, `MERGE=NO`, `DEPLOY=NO`. تُضاف الدفعات التالية بمدخل جديد، ولا يُحذف التاريخ.
