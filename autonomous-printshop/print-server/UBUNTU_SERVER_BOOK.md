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


### SERVER-20261016-14 — AP-298 synthetic print-only scope safety gate (2026-10-16)
- **Task:** make measurable source-only progress after owner said "كمل"; extend previously tested AP-296 one-shot aggregation rather than re-create a live TrendOS client or use Diaa secrets.
- **Branch:** `feature/ap298-print-only-shadow-guard-20261016`, stacked for review on the server-book branch `docs/trendosshop-ubuntu-host-checkpoints-20261016`; [Draft PR #138](https://github.com/fawakhry/TrendOs/pull/138), do not merge or deploy.
- **New source:** `autonomous-printshop/print-server/src/trendos_print_scope_gate.py` exposes `qualify_print_fixture_once` for **explicit SYNTHETIC_ONLY fixtures**. It checks a declared exact role `print`, exact screen list `['print']`, department `طباعة`, screen `print`, candidate path `/v1/edge/orders/02cr/page`, successful fake response and strictly print-department rows, then delegates to existing AP-296 `qualify_screen_once` to report only privacy-minimized counts. Any broader role/screen, mixed department, unexpected route, missing data or oversized rows fails closed with a fixed error code. The supplied fake grant **is not a trusted server attestation**, and the route is **only a code contract candidate**, not production endpoint proof.
- **New tests:** `tests/test_ap298_print_scope_gate_synthetic.py` has 17 regression cases (admin, existing candidate print+press role, malformed scope, wrong row department, invalid response, oversized snapshot, credential leak, no network/file access). Existing AP-296 15 tests rerun without altering source.
- **CI:** `.github/workflows/autonomous-printshop-ap298-print-scope-ci.yml`; `permissions: contents: read`, `persist-credentials: false`; no GitHub Secrets imported into the job.
- **Verified hosted execution:** [AP-298 run #38909869852](https://github.com/fawakhry/TrendOs/actions/runs/38909869852), job `117002698599`, completed **SUCCESS**, actual inspected log reports `Ran 17 tests` (AP-298) plus `Ran 15 tests` (AP-296), total **32/32 PASS**, followed by `AP298_FAKE_ONLY_TESTED=YES` and `REAL_TRENDOS_CONNECTION=OFF; SECRETS_USED=NO; CUSTOMER_DATA=NONE; PRINTERS=OFF`. Test output claims are synthetic only.
- **Limitation:** This does not verify whether live TrendOS honors exclusive print scope; inspected candidate Worker grants print + press + empty screen, while frontend and older candidate read routes differ. No real account, token, password or order used. No Ubuntu source update, no host command, UFW/SSH/router change, Print Server production startup, Cloudflare/D1 mutation or printer access.
- **Next:** review actual currently deployed orders-read server contract and how a dedicated read-only print identity can be provisioned; then design a future bounded, independently authorized outbound HTTPS read. `AP298_SYNTHETIC_CI=32/32_PASS`; `AP298_LIVE_PERMISSION=NOT_VERIFIED`; `AP298_PRODUCTION_GO=NO`; `AP298_HOST_RUNTIME=NOT_EXECUTED`.
