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


### SERVER-20261016-15 — AP-298 implementation handoff + release gates documented
- Created [AP298_PRINT_SCOPE_REVIEW.md](AP298_PRINT_SCOPE_REVIEW.md) on the AP-298 Draft branch after reviewing hosted 32/32 fake regression results. It enumerates the current API-route/source-role mismatch and the G1–G5 requirements: actual server-side print-only role, dedicated least-privilege identity, disabled outbound-only probe with TLS/redirect/time/size controls, explicit live owner permission, and later physical canary.
- No part of this document has been deployed to the home Ubuntu machine. `DOCUMENTATION_ONLY=YES`; `LIVE_ACCESS=NO`; `PRINTING=OFF`; `PR_138=DRAFT_OPEN_UNMERGED`.


### SERVER-20261016-16 — owner corrects product scope to PRINT + LASER + future services (2026-10-16)
- **Owner direction:** “المفروض البرنامج هيبقى خاص بالطباعة والليزر وممكن اضيف خدمات تانية فليه انت عاوز الطباعه او بتتكمل عن الطباعه بس”. The prior AP-298 print-only selection was one *security fixture* and is explicitly **not** a product/module scope restriction.
- **System goal:** One extensible Trend Mall Autonomous Printshop covering `طباعة`, `ليزر`, and additional owner-approved services. One `orderId` may have multiple work lines from different departments; maintain per-department tasks/files/quality evidence and one coordinated order identity, with accounting remaining EasyStore authority.
- **Current source classification:** existing `print-server/src/config.py` already contains print/laser routes and work categories for photo, tableaux, sublimation, couche, sticker and laser. Do not replace these with a print-only hard-coded domain. Beware that `press` is a screen/heatPress condition in an inspected historic Worker, not necessarily a physical department.
- **Action:** created branch `feature/ap299-multiservice-scope-20261016` stacked on AP-298, [Draft PR #141](https://github.com/fawakhry/TrendOs/pull/141) for review only (not merged).
- **Code:** `src/trendos_service_scope_gate.py` provides a fake-only registry initially `print → طباعة`, `laser → ليزر`, explicitly registered future service variants, separate allowed screens and department checks, one in-memory AP-296 aggregate per permitted screen, and cross-screen unique order count to avoid double-counting the same fake order. Broad / unknown authorization and mixed-department rows fail closed. An unknown new API screen is blocked until separately qualified; caller-supplied test grants are NOT a live authentication proof.
- **Tests:** `tests/test_ap299_multiservice_scope_synthetic.py` (18 tests), existing AP-298 17 tests and AP-296 15 tests executed on GitHub Actions [run 38911533330](https://github.com/fawakhry/TrendOs/actions/runs/38911533330), job `117008319851`. Run completed **SUCCESS**, inspected job log shows `Ran 18 tests`, `Ran 17 tests`, `Ran 15 tests` = **50/50 PASS**, `REAL_PLATFORM=OFF`, `REAL_CREDENTIALS=NONE`, `PRINTING=OFF`. Source-only synthetic tests, no production verification.
- **Architecture/runbook:** [`AP299_MULTISERVICE_ARCHITECTURE.md`](AP299_MULTISERVICE_ARCHITECTURE.md) spells out service registry, distinct `orderId`/ `lineId` semantics, departmental permissions, and OFF→SHADOW→CANARY→AUTO eligibility. An actual configurable admin service editor, multi-department operator UI and live backend scope are **planned, not implemented by AP-299**.
- **No host impact:** home `TrendosShop` original Git worktree untouched; no fetch/pull, UFW/SSH/router modifications, live account/secret access, TrendOS Production/D1 writes, Win7 files or physical printing.
- **Result:** `PRODUCT_SCOPE=PRINT_LASER_EXTENSIBLE`, `AP298_PRINT_ONLY=SECURITY_SUBTEST`, `AP299_SYNTHETIC_TESTS=50_OF_50_PASS`, `AP299_LIVE_ORDERS=NO`, `AP299_UBUNTU_DEPLOY=NO`, `AP299_PR=OPEN_DRAFT`; next qualify real TrendOS multi-department read contract/roles before any live integration.


### SERVER-20261016-17 — AP-300 pre-live print+laser read API audit (2026-10-16)
- **Owner prompt:** “الخطوة التالية” after AP-299 print + laser + extensible product scope and 50/50 synthetic PASS.
- **Read-only GitHub source audit:** current repository frontend `trendos-edge-orders-read-v1.js` includes session exchange and `/v1/edge/orders/02cr/page`. Older shared candidate `cloudflare-d1/src/edge-orders-read-v1.mjs` accepts `/v1/edge/orders/page`, not the same page path. This is **cross-branch source divergence**, not deployed runtime evidence. Existing local Print Server `trendos_client.py` still requests `action=getRows` from `/v1/employee/core`, different from the frontend's modern `getRowsPageV1931` contract.
- **Role scope finding in historical candidate only:** `print` also authorizes `press` and an empty screen, while `laser` also authorizes empty screen. A single strictly scoped `print+laser` account is not proven by this inspected older code. Do NOT repurpose a privileged Diaa account/token or infer active server-side role behavior.
- **Document produced:** [`AP300_MULTI_DEPARTMENT_READ_CONTRACT_GATE.md`](AP300_MULTI_DEPARTMENT_READ_CONTRACT_GATE.md) with source comparison, the exact G1-G5 requirements and a single owner decision about a dedicated limited test account. This is a **planning/code audit only**; no live requests, credentials, GitHub Actions jobs, changes to local Ubuntu or Cloudflare.
- **Go/no-go:** `AP300_CODE_AUDIT=COMPLETE`, `AP300_DEPLOYED_ROUTE=NOT_VERIFIED`, `AP300_PRINT_LASER_EXCLUSIVE_IDENTITY=NOT_VERIFIED`, `AP300_HOST_CONNECTION=OFF`, `AP300_PRODUCTION_GO=NO`.


### SERVER-20261016-18 — owner approves DESIGN of restricted print + laser reader identity, AP-301 (2026-10-16)
- **Owner approval:** "موافق" in direct response to preparing a **separate service account** concept for reading `طباعة` and `ليزر` orders only, with future explicitly approved services, **on GitHub first**. The prior offer explicitly excluded automatically creating/activating a real account and excluded any live secret use or real-order access; therefore this approval is **DESIGN_ONLY**, not production provisioning consent.
- **New branch and review:** `feature/ap301-multiservice-reader-identity-20261016`, stacked on AP-299 review; [Draft PR #142](https://github.com/fawakhry/TrendOs/pull/142), not merged/deployed.
- **Proposed identity alias:** `trendosshop_order_reader` is **not a created account**. Its requested authorizations are `orders.read` restricted to `print` and `laser` (`طباعة`, `ليزر`) and zero write/finance/user management/printer/customer-directory rights; future services require review and explicit registration.
- **Source-only implementation:** `src/trendos_service_identity_plan.py` contains a proposed immutable service-identity policy and a function to verify an explicitly `SYNTHETIC_ONLY` mock grant; returns `realServiceIdentityCreated=False`, `realBackendRoleExistsVerified=False`, `productionAuthorizationAllowed=False`. This is not a service identity provider or credential issuer, does not run an HTTP request and has no access to encrypted GitHub Secrets.
- **Regression tests:** `tests/test_ap301_service_identity_plan_synthetic.py` with fake-only deny tests for broad admin identities, wrong departments/screens, unregistered services, write/finance/user-management/printer/customer-directory capabilities, unsafe grant payloads. CI workflow reruns AP-301 + AP-299 + AP-298 + AP-296; actual run status requires separate confirmation before marking PASS.
- **Runbook:** [`AP301_SERVICE_IDENTITY_READONLY_PLAN.md`](AP301_SERVICE_IDENTITY_READONLY_PLAN.md) defines conditions G1-G5 to qualify deployed API backend and create a dedicated role/account only **after new owner approval**; preserve historical/source difference for `getRows` vs `getRowsPageV1931` and `/v1/edge/orders/page` vs `/v1/edge/orders/02cr/page`.
- **Boundary:** no Ubuntu command, SSH/router/firewall opening, Cloudflare D1 or authentication updates, employee account creation, GitHub secret value read, platform login, customer read, business mutations or physical printing. `AP301_OWNER_APPROVAL=DESIGN_ONLY`; `AP301_LIVE_ACCOUNT=NOT_CREATED`; `AP301_CI=AWAIT_VERIFICATION`; `AP301_PRODUCTION_GO=NO`.


### SERVER-20261016-19 — AP-301 hosted synthetic CI evidence confirmed (2026-10-16)
- **CI run:** [AP-301 GitHub Actions #38913540470](https://github.com/fawakhry/TrendOs/actions/runs/38913540470), job `117015108663`, completed `SUCCESS`. Actual GitHub job log inspected; it reports four sequential suites: `Ran 23 tests` AP-301, `Ran 18 tests` AP-299, `Ran 17 tests` AP-298, `Ran 15 tests` AP-296, all `OK`. **73/73 hosted synthetic tests PASS**, not physical/production runtime evidence.
- Companion `Autonomous Printshop Policy V1 CI` run `38913540195` completed `SUCCESS` at the source checkpoint. The mock policy run prints `AP301_PROPOSED_IDENTITY=FAKE_ONLY; ACTIVE_ACCOUNT=NO; REAL_ROLE=UNVERIFIED` and `SECRETS_IMPORTED=NO; EXTERNAL_API=OFF; UBUNTU_CHANGED=NO; PRINTING=OFF`.
- **Security:** fake grant never provisions or validates a real user. Authentication backend role and effective `print+laser` read-only scope are still **unverified**. The proposed alias `trendosshop_order_reader` does not exist as far as this task has established.
- **Gate:** no account creation, no external API or secret use, no Ubuntu update. `AP301_HOSTED_SYNTHETIC=73_OF_73_PASS`, `AP301_LIVE_ACCOUNT=NOT_CREATED`, `AP301_PRODUCTION_GO=NO`. Next technical task is independent audit of deployed API server authorization before a separate owner-approved account provisioning request.


### SERVER-20261016-20 — AP-302 offline three-request print+laser handshake mock — 98/98 CI PASS (2026-10-16)
- **User direction:** “كمل” after AP-301 prepared a **proposed** dedicated print+laser `orders.read` service identity but before deployed role/API verification.
- **Source-only GitHub changes:** new `feature/ap302-multiservice-dryrun-20261016`, [Draft PR #144](https://github.com/fawakhry/TrendOs/pull/144) stacked on AP-301. `src/trendos_orders_dry_run.py` has a synthetic-only injected-transport simulator performing (a) one fake Edge session exchange, then (b) one `print` page and (c) one `laser` page from a **reserved `.invalid` test host**. No live HTTP implementation and no production host, secret, login or customer read used.
- **Security/shape checks:** declared 5-second timeout, 128 KiB max response payload, 20 fake rows/page, no redirect, retry, implicit pagination or Apps Script fallback in simulated request shape. Errors are sanitized; mock session is restricted to print+laser; test suite rejects broad admin permissions, cross-department rows and partial failures; reuses AP-301/299/296 gates for reduced aggregate outputs. These are **simulated** controls, not a claim that production transport implements them yet.
- **Hosted CI verified:** [AP-302 Actions #38914604319](https://github.com/fawakhry/TrendOs/actions/runs/38914604319), job `117018733216`, completed **SUCCESS**. Inspected log reports `Ran 25 tests` AP-302, `Ran 23 tests` AP-301, `Ran 18 tests` AP-299, `Ran 17 tests` AP-298, `Ran 15 tests` AP-296, all `OK`: **98/98 synthetic PASS**. The job prints `AP302_TRANSPORT=FAKE_ONLY; REAL_HOST=NONE; REAL_ACCOUNT=NONE; LIVE_ORDERS=OFF` and `GH_SECRETS=UNUSED; UBUNTU_DEPLOY=NO; PRINTING=OFF`.
- **Handoff:** [`AP302_OFFLINE_HTTPS_HANDSHAKE_GATE.md`](AP302_OFFLINE_HTTPS_HANDSHAKE_GATE.md) records the route divergence and gating G1–G5 to actual deployed backend role + session/row schema, real HTTPS transport after review, explicit owner approval for account creation/any live read, and eventual host staging separately.
- **No host/production changes:** `TrendosShop` still running owner-preserved older local Git, no Ubuntu `pull` or daemon changes; no SSH/UFW/router exposure; no Cloudflare/D1/Secrets mutation; no printer or laser job executed.
- **Gate:** `AP302_FAKE_REGRESSION=98_OF_98_PASS`; `AP302_ACCOUNT_NOT_CREATED=YES`; `AP302_REAL_ENDPOINT_NOT_VERIFIED=YES`; `AP302_LIVE_CONNECTION=NO`; `AP302_PRODUCTION_GO=NO`.


### SERVER-20261016-21 — AP-302 fail-closed request/claim hardening; latest fake CI 100/100 (2026-10-16)
- **Review after AP-302 initial 98/98 PASS:** `src/trendos_orders_dry_run.py` now checks exactly the expected simulated `POST` session fields and `GET` page fields (method, query, headers, body, fixed fake host), refusing request mutation or implicit expansion of the mock screen scope. Nested/unhashable items in fake `screens` fail closed to `AP302_FAKE_SESSION_SCOPE_DENIED` without uncaught exception or upstream data leakage.
- **New regressions:** 2 new AP-302 unittest methods for malformed session `screens` and unexpected method/URL/body/query/headers.
- **Independent hosted CI:** [run 38915205413](https://github.com/fawakhry/TrendOs/actions/runs/38915205413), job `117020775632` completed **SUCCESS**; inspected logs: `Ran 27 tests` AP302 + `23` AP301 + `18` AP299 + `17` AP298 + `15` AP296 all `OK` = **100/100 PASS**. Earlier `98/98` CI in SERVER-20261016-20 remains a factual historical checkpoint, now superseded for latest AP-302 coverage.
- **Documentation:** appended new evidence to [`AP302_OFFLINE_HTTPS_HANDSHAKE_GATE.md`](AP302_OFFLINE_HTTPS_HANDSHAKE_GATE.md). `AP302_TESTS_LATEST=100_OF_100_PASS`; `DRAFT_PR_144=OPEN`; `MOCK_ONLY=YES`; `UBUNTU_UPDATED=NO`; `ACCOUNT_CREATED=NO`; `DEPLOYED_API_VERIFIED=NO`; `LIVE_CUSTOMER_READ=NO`; `PRODUCTION_GO=NO`.


### SERVER-20261016-22 — Cloudflare owner screenshot: active `trendos` deployment is not yet the `trendos-d1-api` target (2026-10-16)
- **Owner evidence:** screenshot of **Cloudflare Workers & Pages → `trendos` → Production → Deployments** taken during Ubuntu↔TrendOS integration preparation. The screen shows **active deployment prefix `803aa6a2`**, **100%** assigned traffic, "Ready" deployment, source branch badge `main`, deployed "5 days ago" as displayed, and sampled requests/sec `0`, error rate `0%`, median CPU `0.93ms`. These metrics are a point-in-time dashboard snapshot, **not** uptime, route or auth proof. The entire 64-character version ID and exact deploy timestamp are not visible.
- **Build history observation:** multiple red "Failed" historical build attempts below the active row; no evidence that those failed attempts displaced the active deployed version. The failure cause was **not** diagnosed by this screenshot. No action to retry or roll back.
- **Critical worker name comparison:** screenshot identifies `trendos`; checked GitHub default-branch `cloudflare-d1/wrangler.toml`, which declares `name = "trendos-d1-api"` and `main = "src/index_v2.js"`; `config.js` points `MATBAGY_EDGE_ORDERS_API_URL` at `https://trendos-d1-api.trendmall-contact.workers.dev`; `autonomous-printshop/print-server/src/config.py` has matching `trendos.baseUrl`. The screenshot **does NOT establish** the deployment/version/identity of `trendos-d1-api` (or even whether it is in the same Cloudflare account). Do not map version prefix `803aa6a2` to the D1 API without separate proof.
- **Next owner UI-only step:** click the **`Workers & Pages` breadcrumb** at the upper left of Cloudflare dashboard to display the worker list. Share a screenshot showing whether `trendos-d1-api` is listed and whether its service/route can be selected. Do not open secrets, edit code or use a 'Deploy' / rollback button. If present, inspect **its** Production → Deployments and source metadata next.
- **Boundaries:** no Cloudflare API call, auth, production orders, secrets, Ubuntu command/change, SSH/UFW update, printer/laser or account creation. `CLOUDFLARE_WORKER_TRENDOS_ACTIVE_VERSION_PREFIX=803aa6a2` (owner screenshot), `API_WORKER_TRENDOS_D1_DEPLOYMENT=UNKNOWN`, `LIVE_READ_SCOPE=UNVERIFIED`, `DEPLOY=NO`, `PRODUCTION_GO=NO`.


### SERVER-20261016-23 — Cloudflare Workers inventory confirms target D1 API exists (2026-10-16)
- **Evidence source:** second owner screenshot, Cloudflare **Workers & Pages** list for the same Cloudflare account. Owner followed the requested breadcrumb; no secrets or code editor opened. Screenshot shows the following service names and domains exactly:
  - `trendos` → `trendos.trendmall-contact.workers.dev` (list shows 2 requests and 6d ago).
  - `trendos-ui` → `trendos-ui.trendmall-contact.workers.dev` (14 requests and 6d ago).
  - **`trendos-d1-api` → `trendos-d1-api.trendmall-contact.workers.dev` (about `3.8k requests` in the list, 6d ago; 3.7ms displayed).**
  - `autonomous-printshop-dashboard` → `autonomous-printshop-dashboard.trendmall-contact.workers.dev` (7d ago).
  - `autonomous-printshop-shadow` → `autonomous-printshop-shadow.trendmall-contact.workers.dev` (8d ago).
  - `autonomous-printshop-observer` → `autonomous-printshop-observer.trendmall-contact.workers.dev` (24 requests visible, 8d ago).
  - `autonomous-printshop-employee-supervisor` (name visible at lower edge; details truncated).
- **Verified naming alignment:** `cloudflare-d1/wrangler.toml` in GitHub default branch declares `name="trendos-d1-api"`, `main="src/index_v2.js"`, D1 binding `DB` / database `trendos-main`; `config.js` and local `autonomous-printshop/print-server/src/config.py` point to the matching D1 API host. This establishes service name/domain presence and source-config naming, **not** identity of an active deployment artifact or proof of a working D1 database/auth endpoint.
- **Interpretation limits:** The `6d` labels on the inventory are relative UI activity/modified display, not an independently verified exact deploy timestamp; the `3.8k requests` is the dashboard's displayed request count and not proof of successful or authorized production orders reads. Worker names such as dashboard/shadow/observer/supervisor suggest intended responsibilities, but actual routes, permissions, deployment health, connected services and operator effectiveness have **not** been inspected. They must be inventoried and reused where appropriate, not duplicated or declared operational without evidence.
- **Correction to SERVER-20261016-22:** `trendos` is a distinct listed service from `trendos-d1-api`; the prior screenshot version prefix `803aa6a2` belongs to **`trendos`**, not yet to the D1 API. The API worker is **present**, but its **active production version, deployment source, route, permission scope and data freshness** are still unverified.
- **Next screenshot — UI-only, no credential use:** In the Workers & Pages list, click **`View deployments` below `trendos-d1-api`**, or open the worker and select its **Production → Deployments** tab. Send screenshot showing active version, traffic percentage and source/commit if displayed. **Do not click Deploy, Edit code, Visit, rollback, or Secrets.**
- **Security/runtime boundary:** No GitHub secret retrieval, Cloudflare edits, network probes, Ubuntu updates, employee login, real order access, D1 writes, printer/laser commands, or external SSH exposure.
- **Result:** `CLOUDFLARE_D1_API_WORKER_LISTED=OWNER_SCREENSHOT_VERIFIED`; `CLOUDFLARE_OTHER_PRINTSHOP_WORKERS_LISTED=YES`; `CLOUDFLARE_D1_API_ACTIVE_VERSION=NOT_CHECKED`; `CLOUDFLARE_D1_API_PROD_AUTHORIZATION=UNKNOWN`; `UBUNTU_PLATFORM_LINK=OFF`; `PRODUCTION_GO=NO`.


### SERVER-20261016-24 — Cloudflare D1 API Production active deployment verified from owner screenshot (2026-10-16)
- **Owner screenshot:** Cloudflare **Workers & Pages → `trendos-d1-api` → Production → Deployments**. The active deployment is listed as **version ID prefix `2b40f622`**, `100%` traffic allocation, `Ready`, deployed about **6 days ago** (relative label at screenshot time), with release description `Owner authorized T12 customer lane V2; runtime-preserving release`, deployment type **API**, `by API token`. The screenshot does **not** expose the full Cloudflare version ID, artifact contents, GitHub SHA, or a server-side permissions contract. Version prefix must not be mistaken for a Git commit.
- **Observed dashboard snapshot:** `0 req/sec`, `0%` displayed error rate, `3.56 ms` median CPU on the screenshot. These UI metrics **do not prove** the API routes work, traffic quality, or a specific employee's permissions. Earlier successful/ready `Wrangler` and `API` versions appear in deployment history; no rollback, deploy, code edit or traffic movement was performed.
- **Verified service identity:** This deployment belongs to **`trendos-d1-api`**, matching `cloudflare-d1/wrangler.toml` declared service and `config.js`/Print Server API URL. It is NOT the separate `trendos` Worker's previously observed version `803aa6a2`. Existing Printshop support Workers remain separate and their active internals unverified.
- **GitHub source cross-check:** Read-only default-branch code search for release description `Owner authorized T12 customer lane V2`, `runtime-preserving release`, and prefix `2b40f622` returned **no matching default-branch code references**. Therefore **the exact deployed source/commit cannot be matched** to GitHub from current screenshots; an API-token deploy need not expose a GitHub branch or SHA. Do not call this version identical to `main`, `src/index_v2.js`, or the historical `edge-orders-read-v1.mjs` source without evidence.
- **Next owner UI-only action:** click the **three-dot (`...`) menu on the right of the first deployment row** labeled `2b40f622`, without choosing a command, and screenshot the menu. Seek a **View details / version detail** read-only option if present. **Do not click Deploy, Rollback, Edit code, Delete, change traffic, or expose Secrets.** If the menu has no safe details option, stop and report the choices.
- **Status:** `CLOUDFLARE_D1_API_ACTIVE_VERSION_PREFIX=2b40f622` (owner screenshot); `ACTIVE_TRAFFIC=100_PERCENT`; `ACTIVE_READY=YES`; `DEPLOYED_GITHUB_COMMIT=UNKNOWN`; `DEPLOYED_PRINT_LASER_ORDER_READ_SCOPE=UNKNOWN`; `DEDICATED_SERVICE_ACCOUNT=NOT_CREATED`; `UBUNTU_PLATFORM_LINK=NOT_VERIFIED`; `PROD_MUTATIONS=NONE`; `GO_LIVE=NO`.


### SERVER-20261016-25 — Cloudflare active version row menu is LOGS ONLY; source remains unproven (2026-10-16)
- **Owner evidence:** screenshot of `trendos-d1-api` **Production → Deployments**, opening the right-hand `...` menu for the active `2b40f622` row. The only visible menu item is **`View logs`**; there is **no View details/source/revision option in this menu**. `Ready`, `100%` active traffic and release description remain as recorded in SERVER-20261016-24.
- **Decision:** DO NOT open `View logs` just to identify source version; request/response logs may contain operational or customer identifiers, and log visibility is not the same as artifact identity. No live request, authentication, or deployed Worker changes required here.
- **Documentation check:** Cloudflare's published Workers Versions & Deployments documentation distinguishes a **version** (bundled code, bindings and configuration) from a **deployment** (version-to-traffic assignment). The Dashboard Deployments view is the supported deployment inventory; the Edit code view can show script source, but must be used strictly for **inspection without edits, Save or Deploy**. The active prefix `2b40f622` alone is still **NOT** a GitHub commit SHA and does not prove the `02cr/page` route or print+laser role.
- **Next owner UI-only evidence:** Back on this Worker's page, click **`Edit code`** once for **viewing only**. **Do not type, Save, Deploy, run preview requests, or reveal secrets.** Send a screenshot showing only the source filename/file tree (and non-sensitive top-level imports/routing if visible). If the editor asks for an action that alters deployment, STOP. The display of source is not proof of one-to-one GitHub provenance; exact version linkage is separately required.
- **Boundary/result:** `DEPLOYMENT_MENU_HAS_VIEW_DETAILS=NO`; `DEPLOYMENT_MENU_HAS_VIEW_LOGS=YES`; `WORKER_SOURCE_STILL_UNVERIFIED=YES`; `LIVE_EMPLOYEE_AUTH=NOT_TESTED`; `PRODUCTION_MUTATIONS=NONE`; `UBUNTU_CHANGES=NONE`; `PRINTING=OFF`.


### SERVER-20261016-26 — Owner pasted Cloudflare Editor Worker bundle; API source now inspectable (2026-10-16)
- **Evidence:** owner-supplied `trendos-d1-api` Cloudflare **Edit code** copy as chat attachment `Pasted text(10).txt`, ~1,039,406 bytes / 18,741 lines, SHA-256 `9f43a4fa1156eb84bf441121583dbe70a29ab65681539f0830c8971ce6e0df75`. **Do not commit raw bundle**, logs, tokens, env values or client data to GitHub. Code copy inspected only, never executed.
- **Source facts:** bundle includes `src/edge-orders-read-v1.mjs`, `src/edge-orders-read-02cr-canary.mjs`, `src/index_v2.js`, `production-shadow/index.js`; actual visible Worker router calls the 02CR handler at `/v1/edge/orders/02cr/page`; session exchange route is `/v1/edge/orders/session`. Its D1 02CR read handler applies server-side screen matching, mirror readiness, runtime/cloud overlays, pagination, and signed Edge token verification. **This resolves the prior source-only dispute that 02CR might have no handler** in the shown bundle.
- **Scope gap:** underlying `screensForRole` grants `admin` broad screens, `print` includes `press` + empty, and `laser` separately includes empty. **No strictly print+laser-only service role appears in that inspected issuer.** AP301 desired `trendosshop_order_reader` still does not exist as a live identity.
- **Security audit finding SEC-AP303-01:** 02CR handler in owner's pasted bundle and corresponding current GitHub review source checks unauthorized requested screens only if the signed token's `screens` list is nonempty; with absent/empty grant the *screen check* can be skipped. Signed HMAC token still required; this is a source-level **fail-open authorization condition**, **not proven unauthenticated production access**.
- **Security audit finding SEC-AP303-02 (HIGH PRIORITY, DO NOT PUBLICLY PROBE):** historical D1 root fallback handlers contain customer-bearing order and other reads without an explicit auth check inside those local handlers; the v2 router can delegate unmatched routes into that fallback. Actual upstream Cloudflare Access/route protections remain unknown. Treat as potentially sensitive read boundary for independent audit, not an observed customer-data leak. Do not attempt live unauthenticated requests or disclose exploit procedures in CI/logs.
- **Version caveat:** Cloudflare Editor bundle has *not been cryptographically linked* to specific active Production version prefix `2b40f622` or a particular GitHub commit. We proved source structure and a corresponding GitHub branch copy, **not** exact binary/version parity or live access.
- **Result:** `CLOUDFLARE_EDITOR_SOURCE_REVIEWED=YES`; `02CR_CODE_FOUND=YES`; `PRINT_LASER_EXCLUSIVE_AUTH_ROLE=NO_IN_REVIEWED_SOURCE`; `SEC_AP303_01=SOURCE_FINDING`; `SEC_AP303_02=HIGH_PRIORITY_AUDIT`; `DEPLOYED_BINARY_PARITY=UNKNOWN`; `PROD_MUTATION=NO`.

### SERVER-20261016-27 — AP-303 unmerged fail-closed 02CR patch and CI evidence
- **Action:** created `fix/ap303-edge-read-scope-fail-closed-20261016` based on AP302 and opened [Draft PR #151](https://github.com/fawakhry/TrendOs/pull/151). Only changed the GitHub source `cloudflare-d1/src/edge-orders-read-02cr-canary.mjs` to require a **nonempty, well-formed list that explicitly permits the requested screen** before allowing a 02CR read. Did not broaden roles, create service accounts, or modify Cloudflare Production.
- **Regression proof:** `tests/ap303_edge_orders_02cr_fail_closed.test.mjs` signs **fake HMAC tokens** and executes the handler with a fake DB that throws if reached for unauthorized requests; verifies missing/empty/mismatched screens return 403 without database read, missing token returns 401, and valid grant helper allows only matching screens. [AP303 CI run #38919460259](https://github.com/fawakhry/TrendOs/actions/runs/38919460259), job `117035301971`, verified **8/8 PASS**. Related 02CR visibility and A61 browser transport CI on this commit also PASS.
- **Separate gating failure:** [TrendOS Integrity V1 run #38919460209](https://github.com/fawakhry/TrendOs/actions/runs/38919460209) failed at `tests/trendos_polling_coalescing_v1.test.mjs` expecting `trendPollCoordinatorV1Loader` in `config.js`. Compare file blob IDs on base AP302 vs AP303 showed both source `config.js` and that test unchanged; this failure **is not attributable to AP303 file edits**, but means full CI gate is **NOT GREEN**.
- **Details:** [AP303_WORKER_SOURCE_SCOPE_AUDIT.md](AP303_WORKER_SOURCE_SCOPE_AUDIT.md) collects the source observations and needed separate review. Raw bundled code was **not** committed.
- **Status:** `AP303_PATCH=SOURCE_ONLY_DRAFT`, `AP303_UNIT_CI=8/8_PASS`, `AP303_INTEGRITY_CI=FAIL_UNRELATED_PREEXISTING_INPUTS`, `AP303_CLOUDFLARE_DEPLOY=NO`, `AP303_UBUNTU_DEPLOY=NO`, `AP303_LIVE_CUSTOMER_READ=NO`, `AP303_SERVICE_ACCOUNT_CREATED=NO`, `AP303_PRODUCTION_GO=NO`. Next: separate legacy root read authorization audit and resolve CI gate, then plan backend least privilege; no live API call without owner's new approval.
