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


### SERVER-20261016-10 — exact local Git HEAD and comparison with current GitHub branch
- **Date/evidence:** 2026-10-16, owner screenshot from `trend-main@TrendosShop` terminal, not ChatGPT SSH or a tool run on the owner's host.
- **Local read-only command:** `git -C "$HOME/TrendOs" rev-parse HEAD`.
- **Exact owner-visible output:** `a238ce5a830bc5a7968dc020cd8168c85fa8c446`; shell returned to normal prompt.
- **GitHub comparison (read-only connector, observed in the same session):**
  - Repository: `fawakhry/TrendOs`.
  - Target branch: `feature/ap155-imac-ssh-service-absent-owner-install-20261012`.
  - Compared local `HEAD=a238ce5a830bc5a7968dc020cd8168c85fa8c446` to remote branch `HEAD=ab21183f9444b8ebb49932f1b1e4f3c381888851` (PR #95, open/draft/unmerged at verification).
  - GitHub compare status: `ahead` from local to remote, `ahead_by=98`, `behind_by=0`, `merge_base=a238ce5a830bc5a7968dc020cd8168c85fa8c446`. These are **98 GitHub commits beyond the owner Ubuntu HEAD**, not 98 locally fetched updates.
  - Earlier `git status` on the host printed `[behind 80]` relative to its **locally cached** `origin/feature/ap155-imac-ssh-service-absent-owner-install-20261012`. Difference between 80 and 98 is not contradictory: locally cached tracking refs can be stale. Do not infer exactly when the extra remote commits landed.
  - GitHub compared 47 changed paths, including print-server `src/server.py`, `src/folders.py`, `src/platform_bridge.py`, `src/config.py`, new `src/trendos_shadow_qualifier.py`, offline employee demo, security docs and fake-only tests. Diff summary is **not** approval to replace the local code; direct host worktree remains unchanged.
- **Result:** `HOST_GIT_HEAD_VERIFIED=a238ce5a830bc5a7968dc020cd8168c85fa8c446`; `GITHUB_BRANCH_HEAD_AT_CHECK=ab21183f9444b8ebb49932f1b1e4f3c381888851`; `REMOTE_AHEAD_COMMITS=98`; `REMOTE_COMPARE_BEHIND=0`; `HOST_UPDATES_APPLIED=NO`.
- **Prior deployments distinction:** The AP-281 separately approved temporary staging folder `$HOME/TrendOs-AP281-staging-66b64ab` is documented in the canonical Printshop book and must not be conflated with the current `$HOME/TrendOs` worktree.
- **Next engineering decision:** Review the 47 changed GitHub paths and prioritize least-privilege, isolated fake-data read-path qualification, not blind `git pull`. There is no permission to run `print-server/run.py` (live defaults), open port 22, activate a persistent service, access customers, or operate printers. If another Ubuntu command is required, offer only one read-only command and wait for owner screenshot.
- **Evidence/authority:** `LOCAL_SHA=OWNER_SCREENSHOT`, `GITHUB_COMPARE=READ_ONLY`, `SOURCE_DIFF=REVIEW_PENDING`, `RUNTIME_TRENDOS_CONNECTION=NOT_TESTED`, `DOCS_ONLY=YES`, `DEPLOY=NO`.


### SERVER-20261016-11 — GitHub credential lead "ضياء" reviewed WITHOUT using any credential
- **Owner statement (2026-10-16):** “تقريبا على جت هب فى سيكرت باسم ضياء”. This is a **possible** existing GitHub Actions secret, not proof of a currently populated or valid secret.
- **Prior chat record located (2026-10-09):** an assistant cited the secret **name only** `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN` as an employee session token associated with Diaa / ضياء for TrendOS/EasyStore qualification; the reported check returned `401 / Session miss`. This is **historical** evidence of an unusable session on that date, not a live retest, current state or permission to reuse it. **No secret value read or requested.**
- **Current GitHub source read-only review:** `config.js` on the repository default branch lists `ضياء/diaa` among broad employee tools, files, and accounting permissions, including purchasing. Four EasyStore canary workflows carry SQL checks for `canonical_username='ضياء' AND lower(role)='admin' AND active=1`. Such *code policy/expectations* point to a privileged identity but **do not prove live account state or current exact role**. This is not evidence of a print-only test identity. Relevant read-only source: `config.js`, `.github/workflows/easystore-a211-waste-canary-execution.yml`, `.github/workflows/easystore-a212-dept-line-canary-execution.yml`. No jobs executed.
- **Connector limitation:** connected GitHub actions available in chat have no listing/retrieval operation for Actions or Environment secret metadata; therefore `GITHUB_SECRET_CURRENTLY_EXISTS=UNVERIFIED`, `SECRET_VALUE_OR_VALIDITY=UNVERIFIED`. No endpoint, production service, login, or secret retrieval attempted.
- **Security decision:** DO NOT use old employee/session credentials or Diaa's potentially admin-scoped token as a Print Server read-only test account; do not print/export token values, use CI echo, transfer secrets to Ubuntu, or run a secret-backed workflow. First owner may verify **names only** in GitHub repository **Settings → Secrets and variables → Actions**, including relevant Environment secrets, without showing or sending secret values.
- **Next access gate:** independently qualify a dedicated least-privilege identity restricted to the print department, identify server-side action/scope before first live login, and obtain separate owner authorization for any actual live read.
- **Result:** `SERVER_CREDENTIAL_HINT=DOCUMENTED`; `KNOWN_HISTORICAL_SECRET_NAME=TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN`; `LAST_HISTORICAL_SESSION=401_SESSION_MISS`; `DIAA_PRINT_ONLY_SCOPE=NOT_PROVEN`; `GITHUB_SECRET_LISTING_ACCESS=NOT_AVAILABLE`; `CREDENTIALS_EXPOSED=NO`; `LIVE_INTEGRATION=NOT_ATTEMPTED`; `DOCS_ONLY=YES`.


### SERVER-20261016-12 — GitHub Actions secret names verified by owner screenshot (2026-10-16)
- **Evidence source:** direct owner screenshot of GitHub **Settings → Secrets and variables → Actions**, `Secrets` tab, in the TrendOS repository context discussed. The screenshot displays eight **Repository secrets**. Only names and GitHub relative last-updated labels are visible; encrypted values, username identity, expiration, access scopes, and actual authentication validity are **not** visible.
- **Verified names (names only, no values):**
  1. `CLOUDFLARE_ACCOUNT_ID`
  2. `CLOUDFLARE_API_TOKEN`
  3. `CLOUDTOKEN`
  4. `TRENDOS_EDGE_SESSION_SECRET_PREVIEW`
  5. `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN`
  6. `TRENDOS_PROD_QUALIFY_PASSWORD`
  7. `TRENDOS_PROD_QUALIFY_USERNAME`
  8. `TRENDOS_PROD_RECONCILE_QUALITY_SECRET`
- **Environment section:** screenshot shows `This environment has no secrets` for the *displayed environment view*; do not generalize this to every GitHub Environment or all deployments.
- **Reconciliation with SERVER-20261016-11:** `TRENDOS_PROD_QUALIFY_EMPLOYEE_TOKEN` **name is confirmed to exist now**. Earlier 2026-10-09 owner chat record reported an attempted qualification returning `401 / Session miss`. Current token validity, role, whether this token belongs to Diaa, and the availability of a separate dedicated print-only employee account **remain unverified**. The `USERNAME` and `PASSWORD` secret **names** are present, but their values and user identity are not visible.
- **Operational boundary:** Repository/Actions secrets are not automatically installed or readable on home Ubuntu. Do not copy or print their values to GitHub logs, shell history, screenshots, chat, application configs, or GitHub commits. Do not run a secret-backed workflow, perform live login, test production routes, change privileges or create credentials based on this metadata-only check.
- **Required engineering qualification:** analyze the actual active TrendOS employee order-read API, whether it can grant **server-enforced print department read-only** scope, and the isolated outbound HTTPS one-shot read pathway **with fake tests first**. Secure separate owner approval before creating/altering a live scoped account or using any live credential or customer data.
- **Result:** `REPOSITORY_SECRETS_METADATA_COUNT=8`, `QUALIFY_TOKEN_NAME_EXISTS=OWNER_SCREENSHOT_VERIFIED`, `QUALIFY_USERNAME_SECRET_NAME_EXISTS=YES`, `QUALIFY_PASSWORD_SECRET_NAME_EXISTS=YES`, `SECRET_VALUE_READ=NO`, `LIVE_CREDENTIAL_VALID=UNKNOWN`, `PRINT_ONLY_ROLE_PROVEN=NO`, `UBUNTU_CHANGED=NO`, `PROD_CHANGED=NO`, `DOCS_ONLY=YES`.


### SERVER-20261016-13 — Order-read scope source review (2026-10-16)
- Read-only GitHub code inspection (no local host changes or live requests).
- Default branch frontend references `/v1/edge/orders/02cr/page`. A separately inspected candidate Worker branch handles `/v1/edge/orders/page`. This source-version distinction requires verification against the actual deployed service before any real integration.
- Candidate code's `screensForRole('print')` also allows `press` and an empty screen string; the candidate `page` implementation checks a server-side allowed-screen list. Hence the sample candidate does not prove strict print-only entitlement, nor prove live role behavior.
- Next: verify current server-side read contract, strict least-privilege role scope and privacy handling using test fixtures. No live login or production access performed.
- Status: `SOURCE_REVIEW_ONLY=YES`, `EXCLUSIVE_PRINT_SCOPE=NOT_PROVEN`, `LIVE_PLATFORM_LINK=NOT_TESTED`, `HOST_CHANGED=NO`.

### SERVER-20261016-14 — Matbagy-OS local-first design archive (planning/source code only)

- **مالك المشروع:** طلب أن يصبح Ubuntu `TrendosShop` المستقبلي مقر حفظ محادثات تصميم ChatGPT وصورها ومرجع شغل مطبعجي، قابلًا لاحقًا للربط بخوادم خاصة/مفتوحة المصدر متعددة.
- **الكتاب الرسمي لهذا المشروع:** `fawakhry/Matbagy-OS@feature/ubuntu-local-first-foundation-20261016` → `PROJECT_BOOK.md` والملحق `صندوق_مطبعجي/اقرأني_أولاً.md`؛ لا يُنقل تاريخ Matbagy إلى كتاب TrendOS.
- **التغيير المُراجع في GitHub:** Draft PR https://github.com/fawakhry/Matbagy-OS/pull/9 يتضمن SQLite محلي، Local File Vault، استيراد اختياري لمحادثات ChatGPT المختارة وملفاتها، وفحص مرجعي لعدم اختراع موافقات أو أكواد أوردر. اختبارات GitHub نجحت: https://github.com/fawakhry/Matbagy-OS/actions/runs/38922608668
- **حدود الإثبات:** `SOURCE_CODE_CANDIDATE=YES`، `CI=PASS`، `UBUNTU_HOST_ACCESS=NO`، `CHATGPT_EXPORT_IMPORTED=NO`، `LIVE_CUSTOMER_ASSETS_COPIED=NO`، `HOST_DEPLOYMENT=NO`، `PRODUCTION_SWITCH=OFF`.
- **قبل النشر على المضيف:** قياس المساحة الحرة والتشفير والصلاحيات وتحديد موقع مخزن بيانات مستقل ونسخ احتياطية مع اختبار استعادة. لا تغيير SSH/UFW/DNS أو نقل أسرار، ولا ادعاء اتصال حي بين TrendOS وMatbagy-OS.
- **التغيير:** توثيق تصميم السيرفر وخط سير مستقبلي فقط؛ لا تغيير برمجي في TrendOS ولا تنفيذ على Ubuntu.

### SERVER-20261016-15 — Owner changed design-memory scope: new ChatGPT work ONLY / zero additional cost
- **Owner's latest instruction:** Do not import historical ChatGPT exports or old Google Drive design assets. Start a **fresh, zero-extra-paid-service** reusable template library from future design chats by invoking `مطبعجي نمذج` from the relevant chat.
- **Matbagy reference:** `fawakhry/Matbagy-OS@main` — `صندوق_مطبعجي/SCHEMA/NEW_CHAT_TEMPLATE_PROTOCOL.md` and `صندوق_مطبعجي/TEMPLATES/INDEX.md`. Documentation and protocol committed via merged PR https://github.com/fawakhry/Matbagy-OS/pull/10. The old ChatGPT ZIP/archive PR #9 was closed unmerged.
- **Scope:** Extract template brief, actual results, attempt history/feedback, print constraints and reusable instructions; persist sanitized text via available GitHub connector. Customer photos and original result files must **not** be claimed on Ubuntu without a verified bytes transfer and checksum. Existing old files remain untouched.
- **Server:** No live connection, upload, API endpoint, SSH/UFW change, storage deployment or backup validation performed. Future secured media intake into Ubuntu is **PENDING**, not implemented. Do not promise true one-word saving of image bytes until this gate is closed.
- **Costs:** No new API/cloud subscription; existing ChatGPT plan, hardware, home electricity and internet are not cost-free.
- **Status:** `NEW_CHAT_TEMPLATE_CONTRACT=MERGED_TO_MATBAGY_MAIN`; `TEXT_TEMPLATE_WORKFLOW=CONNECTOR_ASSISTED`; `UBUNTU_MEDIA_TRANSFER=NOT_BUILT`; `LIVE_HOST_WRITE=NO`; `DEPRECATED_OLD_IMPORT=STOPPED`.

### SERVER-20261016-16 — Matbagy Offline Local Media Vault v1 — Source merged, host not touched
- **Owner authorization:** "ابدأ" after verifying the first real Matbagy Template \`TPL-2026-000001\` was persisted as text. Task: start building **zero-new-paid-service** image preservation on home Ubuntu; no old Google Drive imports.
- **Actual repo change:** \`fawakhry/Matbagy-OS@main\`, merged PR https://github.com/fawakhry/Matbagy-OS/pull/13 at commit \`e304a817ad790c7b763c71efc62e9ac6d35f56d8\`. Added Python stdlib offline \`runtime/ubuntu/matbagy_media_vault.py\` (init/add/list/verify/locate), synthetic tests and Arabic owner runbook \`runtime/ubuntu/LOCAL_MEDIA_VAULT_GUIDE_AR.md\`. Successful PR test: https://github.com/fawakhry/Matbagy-OS/actions/runs/38928149510.
- **Storage design:** private \`~/MatbagyData/tenants/TENANT_001/TPL-2026-000001/\`; separately save real customer original photo and generated V1 design using role/version; SHA-256 verified content-addressed media, 0700 directories, 0600 files; duplicate detection. No public network services or new paid API.
- **Host baseline still not established:** Ubuntu's latest free-space/available backup, Python version and \`~/Matbagy-OS\` checkout **NOT VERIFIED**. User has not yet run read-only commands or sent results. No SSH session, filesystem write, photo transfer, upload, port, DNS, Cloudflare or firewall operation carried out on \`TrendosShop\` by this assistant.
- **Next local owner action, read-only:** \`python3 --version\`, \`df -h "$HOME"\`, \`ls -ld "$HOME/Matbagy-OS" 2>/dev/null\`. Check current SSD headroom and backup plan before adding actual images. Then use guide on \`Matbagy-OS@main\` on Ubuntu with synthetic sample first.
- **Status:** \`REPO_CODE=MERGED\`; \`PR_CI=PASS\`; \`UBUNTU_DEPLOY=NOT_STARTED\`; \`CUSTOMER_MEDIA_IMPORTED=NO\`; \`FULL_BACKUP_RESTORE_VERIFIED=NO\`; \`SAFE_TO_DELETE_CHAT=FALSE\`.

### SERVER-20261016-17 — Owner Ubuntu screenshot: Python, disk headroom, Matbagy checkout
- **الدليل:** صورة Terminal قدمها المالك في المحادثة بتاريخ 2026-10-16، ظاهر فيها المستخدم `trend-main@TrendosShop`. هذه أدلة عرض محلية من المالك، لا SSH من ChatGPT.
- **الأوامر المصورة:** `python3 --version`، `df -h "$HOME"`، واختبار `[ -d "$HOME/Matbagy-OS" ]` مع إخراج `MATBAGY_REPO=EXISTS/MISSING`.
- **النتيجة المؤكدة:** `Python 3.12.3`؛ على `/dev/sda2` mounted `/`: `Size 109G`، `Used 18G`، `Avail 85G`، `Use% 18%`. النتيجة `MATBAGY_REPO=MISSING`: المسار `$HOME/Matbagy-OS` غير موجود حين الفحص.
- **سياق إضافي منفصل:** بداية الصورة تعرض فحص `git status --porcelain=v1 --branch` على `$HOME/TrendOs-AP281-staging-66b64ab` مع `## HEAD (no branch)`؛ هذا staging مختلف، وليس سببًا لتغيير أو تحديث مستودع TrendOs.
- **القرار:** لا نحتاج تثبيت Python أو شراء استضافة للمرحلة المحلية. نستخدم دليل Matbagy الرسمي `runtime/ubuntu/LOCAL_MEDIA_VAULT_GUIDE_AR.md`، ونضيف نسخة خاصة من `fawakhry/Matbagy-OS` في مجلد مستقل بعد تأهيل مصادقة GitHub محليًا، دون تعديل TrendOs/staging أو SSH/UFW.
- **تحفظ:** 85G مساحة متاحة وقت الصورة فقط، وليست ضمانًا لأرشيف دائم. نسخة احتياطية منفصلة مع اختبار استعادة مطلوبة قبل اعتبار صور العملاء آمنة؛ اتصال ChatGPT→Ubuntu ونقل صور V1 لم يحدث.
- **النتيجة:** `PYTHON3=3.12.3_OWNER_VERIFIED`؛ `ROOT_FREE=85G_SCREENSHOT_VERIFIED`؛ `MATBAGY_CHECKOUT=MISSING`؛ `UBUNTU_MEDIA_VAULT_INITIALIZED=NO`؛ `CUSTOMER_FILES_TRANSFERRED=NO`؛ `HOST_CHANGES_BY_AGENT=NO`.

### SERVER-20261016-18 — Matbagy private clone paused at GitHub HTTPS username prompt
- **الدليل:** صورة Terminal جديدة أرسلها المالك في المحادثة بتاريخ 2026-10-16 من `trend-main@TrendosShop`. الأمر الظاهر: `git clone https://github.com/fawakhry/Matbagy-OS.git "$HOME/Matbagy-OS"`، ثم `Cloning into '/home/trend-main/Matbagy-OS'...` وبعده `Username for 'https://github.com':` مع مؤشر انتظار الإدخال.
- **النتيجة المدعومة:** HTTPS clone بدأ **لكن تنزيل محتوى المستودع لم يثبت اكتماله**؛ نقطة الوقوف هي المصادقة على GitHub لمستودع Matbagy-OS الخاص، ولا توجد رسالة نجاح، ولا يجوز اعتبار المجلد checkout صالحًا. لا توجد بيانات اعتماد ظاهرة في الصورة ولم تُطلب قيم أسرار.
- **معلومات جانبية ظاهرة:** `git -C "$HOME/TrendOs" fetch --no-tags origin feature/server33-readonly-service-endpoint-20261016` انتهى برسائل Fetch؛ هذا تنفيذ محلي مستقل قام به المالك ويخص TrendOs، ولا يعد تنزيلًا لـMatbagy-OS أو تفويضًا بتعديل ترند.
- **المتابعة الآمنة:** إلغاء Prompt الحالي بـ`Ctrl+C` ثم التحقق للقراءة فقط من وجود GitHub CLI بالأمر `command -v gh || echo "GH_NOT_INSTALLED"`. إن وُجد، استخدام تسجيل الدخول من المتصفح بدل إرسال GitHub Password أو PAT في المحادثة أو تصويرهما. يراجع المستخدم حالة مجلد Matbagy-OS بعد إلغاء clone قبل أي إعادة محاولة؛ لا حذف بدون دليل أو إذن.
- **الحالة:** `PRIVATE_GITHUB_AUTH_REQUIRED=YES`؛ `MATBAGY_CLONE_COMPLETED=NOT_VERIFIED`؛ `GH_CLI_PRESENT=UNKNOWN`؛ `CUSTOMER_MEDIA_TRANSFERRED=NO`؛ `SECRET_SHARED=NO`؛ `AGENT_HOST_ACCESS=NO`.

### SERVER-20261016-19 — Github CLI availability check on TrendosShop
- **الدليل:** صورة شاشة Terminal من المالك بتاريخ 2026-10-16، المستخدم `trend-main@TrendosShop`.
- **الأمر والنتيجة:** `command -v gh || echo "GH_NOT_INSTALLED"` أعاد `GH_NOT_INSTALLED`؛ لا يوجد أمر `gh` قابل للتشغيل ضمن PATH الحالي.
- **سياق التنزيل:** `git clone https://github.com/fawakhry/Matbagy-OS.git "$HOME/Matbagy-OS"` ظهر له `Username for 'https://github.com':` ثم `^C`، وعاد Shell prompt. لا يوجد دليل اكتمال Clone أو نجاح تسجيل دخول.
- **الخطوة التالية المقترحة للمالك على Ubuntu:** `sudo apt update && sudo apt install -y gh`، ثم `gh --version`. هذا **اقتراح** ولم يُثبت تنفيذه. بعد ذلك Login بالمتصفح دون مشاركة كلمات مرور أو رموز.
- **حدود التنفيذ:** الصورة لا تعرض تثبيت برنامج أو نقل أي صور؛ لم ينفذ المساعد أوامر Ubuntu بنفسه، ولم يغيّر بيانات اعتماد أو مفاتيح أو منافذ.
- **الحالة:** `GH_CLI=NOT_INSTALLED`، `MATBAGY_CLONE=INTERRUPTED`، `GH_AUTH=NOT_VERIFIED`، `LOCAL_MEDIA_VAULT=NOT_DEPLOYED`.

### SERVER-20261016-20 — GitHub CLI installed successfully on home Ubuntu
- **المصدر:** صورة Terminal قدمها المالك بتاريخ 2026-10-16، المستخدم `trend-main@TrendosShop`. نتيجة انتهاء تثبيت `gh` على Ubuntu.
- **الدليل:** `Setting up gh (2.45.0-1ubuntu0.3)...` ثم `gh --version` أعاد `gh version 2.45.0 (2025-07-18 Ubuntu 2.45.0-1ubuntu0.3)`، مع رابط الإصدار الرسمي. مؤشر الـShell عاد دون أخطاء.
- **حالة المرحلة:** `GITHUB_CLI_INSTALLED=VERIFIED`، `GITHUB_CLI_VERSION=2.45.0`. أظهر APT أن 36 حزمة أخرى لم تُرقّ؛ لا يُعد ذلك إذنًا بتحديثها تلقائيًا.
- **ما لم يحدث بعد:** لا يوجد دليل نجاح `gh auth login` أو اكتمال استنساخ `fawakhry/Matbagy-OS`. لم يبدأ حفظ صور المستخدم على Ubuntu.
- **الخطوة التالية للمالك:** نفذ على جهازه `gh auth login --hostname github.com --git-protocol https --web`، ثم أتم مصادقة جهاز GitHub من المتصفح مع مراجعة الأذونات. تجنب مشاركة OTP/device code، Password، PAT، أو محتويات إعدادات المصادقة في المحادثة أو الصور.
- **الحد الأمني:** لم ينفذ ChatGPT أوامر على `TrendosShop` ولم يغيّر SSH/UFW/DNS أو ينقل أسرار.
- **النتيجة:** `GH_CLI_INSTALLED=YES`؛ `GH_AUTH=NOT_VERIFIED`؛ `MATBAGY_CLONE=NOT_VERIFIED`؛ `UBUNTU_MEDIA_VAULT=NOT_DEPLOYED`.

### SERVER-20261016-21 — GitHub CLI device authorization successful (owner screenshot)
- **الدليل:** لقطة شاشة Terminal ومتصفح GitHub أرسلها المالك بتاريخ 2026-10-16. تظهر رسالة `Logged in as fawakhry` في `gh auth login`، و`Configured git protocol`، وصفحة GitHub تفيد باكتمال ربط الجهاز.
- **النتيجة:** `GH_DEVICE_AUTH=SUCCESS_OWNER_SCREENSHOT`، `GITHUB_ACCOUNT=fawakhry`، `GIT_PROTOCOL=https`. الدليل يخص مصادقة GitHub CLI على الجهاز، **ولا يثبت اكتمال Clone أو تنزيل أي صور**.
- **الخطوة المقترحة التالية:** فحص وجود `$HOME/Matbagy-OS` ثم استخدام `gh repo clone fawakhry/Matbagy-OS "$HOME/Matbagy-OS"` **فقط لو المجلد غير موجود**؛ لا تحذف ملفات ناتجة عن المحاولة السابقة بدون فحصها. التأكد من وجود `runtime/ubuntu/matbagy_media_vault.py` بعد اكتمال التنزيل.
- **الحماية:** لا حاجة لإرسال Device Code أو Token أو أي اعتماد للشات. لا تعديل على مستودع TrendOs أو SSH أو UFW؛ لا تشغيل مخزن صور قبل فحص الكود والتجربة.
- **الحالة:** `GH_AUTH=SUCCESS`، `MATBAGY_CLONE=NOT_VERIFIED`، `UBUNTU_MEDIA_VAULT=NOT_DEPLOYED`، `CUSTOMER_MEDIA_IMPORTED=NO`، `HOST_COMMANDS_BY_ASSISTANT=NONE`.

### SERVER-20261016-22 — Private Matbagy repository cloned; Ubuntu vault tool present
- **الدليل:** صورتان Terminal قدمهما المالك في محادثة ChatGPT بتاريخ 2026-10-16، من `trend-main@TrendosShop`. لا توجد جلسة SSH/remote host access بواسطة المساعد.
- **العملية الظاهرة:** أمر مشروط لا يعيد التنزيل إذا وجد المسار؛ في هذه المرة نفّذ `gh repo clone fawakhry/Matbagy-OS "$HOME/Matbagy-OS"`. stdout يؤكد: `Cloning into '/home/trend-main/Matbagy-OS'...`، `Receiving objects: 100% (625/625)`، `Resolving deltas: 100% (300/300), done.`، ثم عاد Shell prompt بدون خطأ.
- **التحقق اللاحق:** اختبار `[ -f "$HOME/Matbagy-OS/runtime/ubuntu/matbagy_media_vault.py" ]` أعاد `MATBAGY_CODE_READY`، وهو دليل وجود الأداة على Ubuntu بالفعل.
- **حالة التشغيل المثبتة:** `GH_AUTH=SUCCESS`، `MATBAGY_CLONE=COMPLETE_OWNER_SCREENSHOT`، `VAULT_SCRIPT_EXISTS=YES`؛ لم يُثبت تشغيل اختبار Python على المضيف، ولم يُنشأ مجلد بيانات مطبعجي حتى الآن.
- **الخطوة التالية للمالك:** تشغيل `python3 -m unittest discover -s "$HOME/Matbagy-OS/runtime/ubuntu" -p 'test_matbagy_media_vault.py' -v`؛ **بشرط نجاح الاختبارات** تشغيل `python3 "$HOME/Matbagy-OS/runtime/ubuntu/matbagy_media_vault.py" init --root "$HOME/MatbagyData"`. الاختبارات تنشئ بيانات اصطناعية في مسارات مؤقتة فقط؛ التهيئة تنشئ مجلدًا خاصًا فارغًا.
- **حماية نطاق العمل:** لا تغيير TrendOs، UFW/SSH، Cloudflare، أرقام الطلبات أو بيانات عملاء. قبل إدخال صور حقيقية مطلوب backup خارجي واختبار استعادة. لا ادعاء أن الصور محفوظة أو أن الأداة نشرت كخدمة.
- **الحالة:** `MATBAGY_REPO_ON_UBUNTU=YES`، `VAULT_SCRIPT_PRESENT=YES`، `UBUNTU_VAULT_TESTS=NOT_RUN_OR_NOT_EVIDENCED`، `VAULT_INITIALIZED=NOT_VERIFIED`، `CUSTOMER_MEDIA_IMPORTED=NO`.

### SERVER-20261016-23 — Matbagy Ubuntu media vault tests PASS and local initialization confirmed
- **الدليل:** صورة Terminal جديدة مقدمة من مالك السيرفر بتاريخ 2026-10-16 من `trend-main@TrendosShop`.
- **فحص الأداة:** `python3 -m unittest discover -s "$HOME/Matbagy-OS/runtime/ubuntu" -p 'test_matbagy_media_vault.py' -v`. الناتج المعروض: نجاح اختبارات التحقق من التوقيع والامتدادات/الروابط الرمزية، عبور المسار، فصل الصورة الأصلية عن الناتجة، البصمات الرقمية، رفض الأدوار والنسخ غير الصحيحة، منع التخزين داخل Git، وباقي الاختبارات. الخاتمة: `Ran 9 tests in 0.183s` ثم `OK`.
- **تهيئة مخزن الصور:** `python3 "$HOME/Matbagy-OS/runtime/ubuntu/matbagy_media_vault.py" init --root "$HOME/MatbagyData"` أعاد JSON فيه `"status": "LOCAL_VAULT_INITIALIZED"`، `"root": "/home/trend-main/MatbagyData"`، `"storage": "LOCAL_ONLY"`، `"no_remote_upload": true`.
- **ما ثبت:** `UBUNTU_VAULT_TESTS=PASS_9_OF_9`؛ `VAULT_INITIALIZED=YES_OWNER_SCREENSHOT`؛ `PRIVATE_DATA_ROOT=/home/trend-main/MatbagyData`؛ `NO_NETWORK_UPLOAD=YES`. هذا يثبت تجهيز برنامج الأرشفة ومجلده على المضيف، وليس حفظ صور عملاء أو تحقق نسخ احتياطية.
- **ما لم يتم:** لم يُعرض أي ناتج `add` لملف أصلي أو نتيجة V1؛ لم يظهر `verify` بعد حفظ صورتين؛ لا دليل على وسيلة نسخ احتياطي مستقلة أو استعادة مجربة. `CUSTOMER_MEDIA_SAVED=NO_EVIDENCE`؛ `OFFHOST_BACKUP=NOT_VERIFIED`؛ `SAFE_TO_DELETE_CHAT=FALSE`.
- **الخطوة الآمنة التالية:** فحص وسائط التخزين المتاحة قراءة فقط بواسطة `lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINTS,TRAN`، وتأكيد صلاحيات مجلد `MatbagyData` دون طباعة محتويات العملاء. بعد تخصيص نسخة احتياطية مستقلة، نقل الملفين الفعليين للنموذج `TPL-2026-000001` مع SHA-256 واختبار `verify`. لا تحتاج الخدمة منفذ شبكة أو API مدفوع.
- **حد الوصول:** النتائج أدلة من صورة Terminal مالك الجهاز، وليس اتصال SSH أو تشغيل أوامر بواسطة المساعد.

### SERVER-20261016-24 — Ubuntu storage topology and MatbagyData permissions verified
- **الدليل:** صورتان Terminal من المالك بتاريخ 2026-10-16 من `trend-main@TrendosShop`. الأمران المنفذان: `lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINTS,TRAN` و`stat -c '%A %U:%G %n' "$HOME/MatbagyData"`.
- **الأقراص المثبتة:** `sda 111.8G sata`، `sda1 1G vfat /boot/efi`، `sda2 110.7G ext4 /`. ظهور `loop*` أجهزة Snap ليس تخزينًا احتياطيًا مستقلاً.
- **USB الظاهر:** `sdb 0B usb` بلا Filesystem أو Mountpoint؛ **لا يُعتبر قرصًا احتياطيًا صالحًا**. لا تفترض حجمه أو حالته أو تكتب/تهيئ/تقسّم `/dev/sdb` بغير موافقة صريحة وفحص منفصل.
- **الأذونات المثبتة:** `drwx------ trend-main:trend-main /home/trend-main/MatbagyData`، أي `0700` ومالك المجلد `trend-main`. المخزن محفوظ ضمن قرص `sda2`، وليس على وسيط مستقل.
- **قرار المرحلة:** `LOCAL_VAULT_INITIALIZED=YES` واختبارات Ubuntu السابقة `9/9 PASS`، لكن `INDEPENDENT_BACKUP_DEVICE=NOT_DETECTED` و`RESTORE_TEST=NOT_RUN`. لا ننقل/نحذف صورة العميل الأصلية دون تحديد وسيلة نسخ منفصلة، مثل وسيط USB حقيقي موجود بالفعل أو جهاز آخر يملكه المستخدم؛ لا حاجة إلى خدمة API أو اشتراك تخزين مدفوع.
- **الخطوة التالية:** سؤال المالك هل يملك فلاشة/هارد خارجي صالح أو كمبيوتر آخر لنسخ احتياطي؛ ويمكن إجراء اختبارات إضافية بملفات اصطناعية فقط حتى توفير نسخة مستقلة. لا تغيير في TrendOs وSSH/UFW، ولا سجل تثبيت جديد أو استيراد صور عملاء.
- **النتيجة:** `DISK_LAYOUT_VERIFIED=OWNER_SCREENSHOT`; `VAULT_PERMISSIONS=0700_CORRECT`; `USB_SDB=0B_NOT_USABLE_AS_BACKUP`; `OFFHOST_BACKUP=NOT_VERIFIED`; `CUSTOMER_MEDIA_ARCHIVED=NOT_VERIFIED`.

### SERVER-20261016-25 — Owner defers external backup; disposable media smoke code merged
- **قرار المالك:** `كمل وهنحط خارد خارجى بعدين` — استكمال تجارب وأدوات الأرشفة الآن، وتأجيل توصيل الهارد الخارجي. ليس إذنًا لحذف صور العملاء الأصلية أو الادعاء بوجود نسخة احتياطية.
- **بيانات المضيف المثبتة سابقًا بالصور:** `Matbagy-OS` موجود تحت `/home/trend-main/Matbagy-OS`؛ `MatbagyData` موجود وصلاحياته `0700`؛ اختبارات الأداة الحالية على المضيف `9/9 OK`. `sda2` قرص النظام الوحيد الظاهر و`sdb=0B` غير مناسب للنسخ. لم تدخل صور عملاء فعلية، ولم يُنفَّذ `verify` بعد استيرادها.
- **التطوير المنفذ في GitHub:** `fawakhry/Matbagy-OS` merged PR https://github.com/fawakhry/Matbagy-OS/pull/14 على `main` commit `655e621006f32757e1e9e60513e251afc388b50e`. تشغيل الاختبارات على فرع PR نجح: https://github.com/fawakhry/Matbagy-OS/actions/runs/38935409985.
- **أداة التجربة الجديدة:** `runtime/ubuntu/matbagy_media_smoke.py` تقرأ Template الحقيقي `TPL-2026-000001`، وتولّد صورتين PNG اصطناعيتين داخل مسار مؤقت معزول تحت المخزن. تختبر إدخالهما كـOriginal وV1، بصمة SHA-256، منع الازدواج، الاستدعاء بكود الملف ثم إزالة **ملفات التجربة المؤقتة فقط**. اختبار CI يتحقق من تنظيف الاختبار عند النجاح والفشل. لا توجد صور خاصة أو بيانات العملاء في CI.
- **تجربة السيرفر الفعلية:** `MATBAGY_SMOKE_ON_TRENDOSSHOP=NOT_YET_RUN` (ننتظر تنفيذ المالك محليًا). التعليمات في `runtime/ubuntu/LOCAL_MEDIA_VAULT_GUIDE_AR.md`. فحص فرع `main` ونظافة Working Tree قبل `git pull --ff-only` داخل مستودع Matbagy فقط.
- **بوابة النسخ الاحتياطي:** `EXTERNAL_DISK=DEFERRED_BY_OWNER`، `OFFHOST_BACKUP=NOT_VERIFIED`، `RESTORE_FROM_BACKUP=NOT_VERIFIED`، `SAFE_TO_DELETE_CHAT=FALSE`. أي ملفات صور يمكن نسخها لاحقًا إلى Ubuntu كنسخ إضافية **فقط**، ويجب الإبقاء على الأصل وعدم اعتبار عملية النقل نسخًا احتياطيًا مستقلًا.
- **نطاق التغيير:** لا استخدام API مدفوع؛ لا تغيير SSH/UFW/DNS أو مشروع TrendOs؛ لم يتصل المساعد بمضيف Ubuntu مباشرة.

### SERVER-20261016-26 — Real Ubuntu Matbagy synthetic smoke test PASS (owner Terminal evidence)
- **الدليل:** صورة Terminal من المالك `trend-main@TrendosShop` بتاريخ 2026-10-16؛ الأمر السابق الخاص بتحديث مستودع Matbagy-OS `main` أظهر `Updating e304a81..655e621` و`Fast-forward` ثم إنشاء `runtime/ubuntu/matbagy_media_smoke.py` وملف اختباراته.
- **نتيجة الأداة المثبتة على المضيف:** JSON صريح: `"status": "MATBAGY_SMOKE_PASS"`، `"template_id": "TPL-2026-000001"`، `"synthetic_assets_verified": 2`، `"dedup_verified": true`، `"source_template_read_only": true`، `"real_vault_unchanged": true`، `"customer_media_imported": false`، `"independent_backup_verified": false`، `"safe_to_delete_chat": false`.
- **ما ثبت:** قراءة النموذج الحقيقي، مسار اختبار آمن بصور اصطناعية، إدخال أصل ونسخة V1 تجريبيتين، التحقق من الاسترجاع ومنع التكرار، ثم عدم تعديل محتويات المخزن الحقيقي وفق تقرير الأداة. `MATBAGY_SMOKE_ON_TRENDOSSHOP=PASS_OWNER_SCREENSHOT`، `REAL_VAULT_UNCHANGED=YES_REPORTED_BY_TOOL`.
- **ما لم يثبت:** لم يتم حفظ أو فحص أصل صورة العميل أو نتيجة تصميم المج الحقيقية؛ ليس هناك وصل لالتقاط ملفات ChatGPT تلقائيًا؛ لا يوجد قرص نسخ احتياطي مستقل أو اختبار استعادة. لا يتحول `SAFE_TO_DELETE_CHAT` إلى true.
- **الخطوة التالية المسموح بها:** تنزيل **ملفي التصميم الحقيقيين** يدويًا من الشات الأصلي إلى الجهاز ثم إدخالهما عبر `matbagy_media_vault.py add` كنسخ محلية إضافية مع المحافظة على الأصل، وتشغيل `verify` بعد النقل. تأكد أولًا من اسم الملف وامتداده ومحتواه. التأجيل المقرر للهارد الخارجي ما زال قائمًا، فلا تدعِ تأمين الأرشيف من تعطل قرص النظام.
- **نطاق التشغيل:** لم يستخدم المساعد وصولًا مباشرًا إلى Ubuntu ولم يغيّر شبكته أو `TrendOs`؛ التقرير كله مستند إلى صورة Terminal أرسلها المالك.

### SERVER-20261016-27 — FIRST REAL Matbagy customer images archived and verified on home Ubuntu
- **الدليل:** صورة شاشة Terminal من المالك بتاريخ 2026-10-16، `trend-main@TrendosShop` بعد تنفيذ كود محلي لاختيار صورة أصلية JPG وصورة ناتجة PNG من `$HOME/Downloads`. **المساعد لم يتصل بـUbuntu** ولم ينقل الملفات بنفسه.
- **النتيجة المعروضة:** `"status": "SAVED_AND_VERIFIED"` للصورة الناتجة `TPL-2026-000001-M002`؛ `"file_count": 2`؛ أمر `verify` أعاد `"template_id": "TPL-2026-000001"` و`"verified": true` و`"asset_count": 2`؛ `TPL-2026-000001-M001: PASS` و`TPL-2026-000001-M002: PASS`. انتهى السكربت بعبارة `MATBAGY_FIRST_DESIGN_SAVED` وعاد prompt دون خطأ.
- **معنى الإثبات:** نسختان محليتان فعليتان من الصورة الأصلية ونتيجة V1 للنموذج الأول محفوظتان تحت `/home/trend-main/MatbagyData/tenants/TENANT_001/TPL-2026-000001/`، وقد اجتازتا فحص البصمة والحجم في وقت اللقطة. **هذا حفظ محلي حقيقي وليس مجرد نتيجة CI أو نموذج نصي.** النموذج النصي المقابل: `fawakhry/Matbagy-OS`، `صندوق_مطبعجي/TEMPLATES/2026/TPL-2026-000001.json`.
- **حدود الإثبات:** لا يوجد فحص مستقل لبصمة ملف الـDownloads مقابل ملف الأرشيف خارج تقرير الأداة، ولا يوجد Backup آخر على قرص مستقل أو Restore test؛ ملفات الشات الأصلية والتنزيلات يجب أن تبقى. لا يوجد Remote API أو مزامنة آلية من ChatGPT إلى Ubuntu. سجل GitHub الخاص بالنموذج يبقى موسومًا `PENDING_LOCAL_ASSET` حتى بناء آلية إثبات/مزامنة Metadata لاحقة؛ ولا نضيف أسماء ملفات العملاء، صورهم، أو مساراتهم إلى مستودع GitHub.
- **الحالة:** `FIRST_REAL_MEDIA_ARCHIVE=SUCCESS_OWNER_SCREENSHOT`؛ `TEMPLATE=TPL-2026-000001`؛ `REAL_FILES=2`؛ `M001=PASS`؛ `M002=PASS`؛ `LOCAL_VERIFY=TRUE`؛ `OFFHOST_BACKUP=NOT_VERIFIED`؛ `SAFE_TO_DELETE_CHAT=FALSE`.
- **التالي:** إتاحة استدعاء صور النموذج بسهولة بالـAsset IDs من جهاز Ubuntu، ثم تفعيل نسخ احتياطي مستقل واختبار استعادة عند توصيل الهارد الخارجي. لا تشغّل واجهة عامة أو تحوّل المستودع إلى مخزن صور عملاء.

### SERVER-20261016-28 — Real Matbagy design V1 asset retrieved by code, checksum verified
- **الدليل:** لقطة Terminal من المالك `trend-main@TrendosShop` بتاريخ 2026-10-16. الأمر: `python3 "$HOME/Matbagy-OS/runtime/ubuntu/matbagy_media_vault.py" locate --root "$HOME/MatbagyData" --template TPL-2026-000001 --asset TPL-2026-000001-M002`.
- **ناتج محقق على جهاز المالك:** `template_id = TPL-2026-000001`؛ `asset_id = TPL-2026-000001-M002`؛ `verified = true`؛ `local_file` داخل `/home/trend-main/MatbagyData/tenants/TENANT_001/TPL-2026-000001/assets/` بامتداد `.png` واسم محتوى مبني على SHA-256.
- **معنى الاختبار:** أكدت أداة الاستدعاء إمكانية تحديد الملف الحقيقي وتصديق بصمته بعد الحفظ، وليس إثبات فتحه ومعاينته بصريًا. `V1_LOCATE=PASS_OWNER_SCREENSHOT`؛ `REAL_ASSET_BYTES=LOCAL`؛ `IMAGE_GUI_OPEN=NOT_TESTED`.
- **خطوة المتابعة السهلة:** افتح نافذة Files على Ubuntu، اضغط `Ctrl+L` واكتب المسار المحلي لمجلد `.../TPL-2026-000001/assets/` ثم افتح صورة PNG؛ لا يلزم Terminal، ولا رفعها إلى GitHub. تحتفظ بالملفات الأصلية وبالشات لأن `EXTERNAL_BACKUP=DEFERRED` و`SAFE_TO_DELETE_CHAT=FALSE`.
- **الأعمال المستقبلية المنفصلة:** زر / واجهة محلية لاستدعاء الصور بالأكواد دون Terminal، ومزامنة بيانات وصفية آمنة مع GitHub لاحقًا؛ لا يوجد وصول مباشر من ChatGPT إلى صور السيرفر ولا خدمة ويب مكشوفة.
- **نطاق الإثبات:** لم ينفذ المساعد أي أمر على سيرفر Ubuntu؛ الصور ونتائج Terminal قدمها المستخدم.
