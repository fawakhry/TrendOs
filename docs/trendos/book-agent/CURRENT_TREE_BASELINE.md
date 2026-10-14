# TrendOS Current System — Source Baseline / Full Git Tree Inventory

> 2026-10-14. **Complete Git tree snapshot** at `bd39647598ec33853181dea8632064d5586404ca`, recursive tree `bd39647598ec33853181dea8632064d5586404ca`, `truncated=false`. 2070 paths incl. 1995 blobs, 75 directories. **This is path coverage only, not content-read, relevance, runtime deployment or test coverage.**

## قواعد تدقيق الاكتمال
- كل ملف أدناه موجود في هذه اللقطة وله blob SHA خاص به. **كل سطر يبدأ `UNREVIEWED` حتى يثبت قراءة الملف**. لا يُستخدم وجوده وحده لتقرير أنه حي.
- أي ملف بداخل `docs`, تاريخ Git, مشروع مستقل لا يدخل متن كتالوج التشغيل ما لم يثبت تأثيره على النظام الحالي. الملفات القديمة لا تُحذف من المستودع بهذه المهمة.
- رمز `TEST_FILE` يعني أن الملف موجود ولا يثبت إطلاقًا أنه نُفذ. كل PASS وFAIL وBLOCKED تحتاج run مع تاريخ/SHA والسبب.
- تتطلب المطابقة النهائية: HEAD جديد ثم delta جرد، تعداد جميع routes/functions/UI events وقيم current deployment من أدلة runtime مستقلة.

## العد حسب تصنيف المسار
| تصنيف مبني على المسار | العدد |
|---|---:|
| WORKFLOW | 409 |
| CODE_OR_CONFIG_CANDIDATE | 291 |
| CROSS_PROJECT | 3 |
| ACCOUNTING_BOUNDARY | 12 |
| SEPARATE_PROJECT | 233 |
| MIGRATION_FILE_NOT_ACTIVE_PROOF | 29 |
| DOCUMENTATION_OR_HISTORY | 762 |
| TEST_FILE | 256 |

## جميع الملفات بدون إسقاط — classified by path, not by runtime

### WORKFLOW — 409

| المسار عند snapshot | Blob SHA | مستوى مراجعة المحتوى | حالة الإنتاج |
|---|---|---|---|
| `.github/workflows/autonomous-printshop-cloud-design-artifact-diagnostic.yml` | `391d345c4b81cf695327ddfed4ffb035bf89bf08` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-cloud-design-discovery.yml` | `a0cd54610afc4a4439d096a65e57b5f48ff3a0f7` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-cloud-file-hash-schema-production-apply.yml` | `fddf89a771700ad1b6f8257ce03996daafddba44` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-d1-backfill-readonly-diagnostic.yml` | `b8a1530d8ef9531bfac5295a9d68c11e36415fd6` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-d1-foundations-apply-controlled.yml` | `0811d6cbca4261dce125f56450d5ba4633ac4ace` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-d1-operational-counts-readonly.yml` | `3822e558ecd79d34f0849cae5c0f62f7a3d853d5` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-d1-source-overlap-readonly.yml` | `fe6f3f9c65ed2e1295c8766d80d8881ac03966ef` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-dashboard-production-deploy.yml` | `40bf38e1f99646d9b8bb389e48c8ea8ffe9756cd` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-design-approval-receipt-schema-production-apply.yml` | `085510c287eeea2d2dba6d0bdf0103b0cc40176b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-design-asset-binding-apply-controlled.yml` | `7fd91fdbed4c618faf1d395d581cf7d7b4d84500` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-design-evidence-foundation-apply-controlled.yml` | `feeea50da677a5320f5c4d73b3706a38972477a4` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-design-evidence-manual.yml` | `5f858d6493b5211c45cfe41d58af3042f1a99bb5` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-design-recipe-coverage-discovery.yml` | `85418b5246a31ff5ec1ec8e3c46703788b5fcb85` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-design-shadow-activate.yml` | `b21d567cd28389f6a9c7b7a1ae4c62ad8a8f8b5b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-employee-blocker-schema-production-apply.yml` | `d050a35d7d50a2bf207b4d281c23671b5d8b0b5e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-employee-supervisor-production-deploy.yml` | `1c31674bf53ef7c84206145b0dba37c8756fec08` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-employee-supervisor-shadow-activate.yml` | `02583f5e97ce81b3b6439379770ef9ae77f6c581` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-live-runtime-smoke.yml` | `208151ba4e65eb7dbde6b7ee6907be4a495384d5` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-machine-evidence-manual.yml` | `35ad0ba43ddcce3acbb13b483d3f9628b0dd7518` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-machine-identity-schema-production-apply.yml` | `11c5579ae020dff1ad044e055cab54ae1f622339` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-machine-readiness-apply-controlled.yml` | `34e0bb6ff546be57bf0af898bddb2f287ff3a2b8` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-machine-shadow-activate.yml` | `8c3bf4260e96a9b59bf07f1bdabed4d5b57dd0cb` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-material-authority-readonly-diagnostic.yml` | `865051706049b1ac94fca84936ed1eecb98f4b38` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-material-post-cutover-diagnostic.yml` | `6cae931ea8be890bf1f37ed6c8cb90f06d1e8185` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-native-schedule-maintenance-apply-controlled.yml` | `fb681dc964b0a1f6280f5858a240c5a8c4a23c49` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-native-schedule-readonly-diagnostic.yml` | `ee48662071fde5ef7b2c4815336555d0bbb632c9` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-native-schedule-recovery-controlled.yml` | `6898a97b81d1fa64981e0349751ea5ef1b6d5b53` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-observer-production-deploy.yml` | `f2d6b8590cb0653e9e4f9e975b548dd4c1f3bb6e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-observer-run-ledger-apply-controlled.yml` | `043b1eef9628a33253822bf1f64781288d852d4a` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-policy-v1-ci.yml` | `e9f98ffadd350c11a89ad7e28a7e7a04d637e41d` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-print-server-ci.yml` | `83099f9eaeeb7b9aafdaf2595637b0e954270dbd` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-print-server-live-auth-probe.yml` | `24530daddd3df0e779accba952d6f1d91da141d9` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-print-server-windows-package.yml` | `8ce8ea6fc4a9e4a7e644c62ecb22768fc6180417` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-production-readonly-preflight.yml` | `5c6fbbda33d125d85c9b871501fe25ed6c151786` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-production-shadow-monitor.yml` | `2b7975611259d545772e6bbac3608cffb95098f2` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-production-shadow-sidecar-deploy.yml` | `dfa2416393a13407af5034ae4afb9d9d416d5a3a` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-r2-readonly-discovery.yml` | `d279cdf663d6038f0b0acbf9a97dc996b5b20755` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-readiness-collector-production-deploy.yml` | `50af0a44e59f77e73f354a0a9466260f6e50203c` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-readiness-foundation-apply-controlled.yml` | `417c03bc891d491b146c87448c1ff68e640cf2d0` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-readiness-production-diagnostic.yml` | `2eec69ad170d4d40218da0fb2bb9c626fe7ce307` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-readiness-shadow-smoke.yml` | `5991e0b71e9551c63bc2337b8e8b252b6a7e1d1e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-shadow-controls-activate.yml` | `c11b9ca3ca85864f8cdc447c82444a608c8a7ba6` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-structured-design-preflight.yml` | `0be0147a3ea2d0673f3c7b7248249c3a2d1b1a32` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-structured-owner-design-approval.yml` | `dd8160cebd202dfa6b7e6aa89458cc266f5f2b05` | UNREVIEWED | UNKNOWN |
| `.github/workflows/autonomous-printshop-t12-order-schedule-apply-controlled.yml` | `ee672c10eab7b3858cefb47cbbc336c62259791b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t10-press-live-parity.yml` | `f0438a852a977a5148cb503d78ade85b1dac43bc` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t10-press-production-cutover.yml` | `17bf0f88911be1aec28111c8edb3add27a204f51` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-02cq-live-route-probe.yml` | `b62cbf076c77611c53f65c3cb0a82974dfaf6d6e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-02cq-status-probe.yml` | `3f5069ae02e6d09b9a0b6b1a3d4ce232d8f3e3f1` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-apps-script-health-probe.yml` | `db655e2216c0e97b89e534103d25824dc073f47a` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-direct-session-verify-diagnostic.yml` | `2460059482cf044ec0154c7ea76e7de887eb6d2f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-freshness-runtime-probe.yml` | `a05884a4663e76e6bea97e3a6cc4641cba3c173e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-freshness-runtime-status.yml` | `540d3b1ba66a9b9337ee051146f49b4ef830f125` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-getrows-contract.yml` | `13b9532d4175fa748eaa90ff3239458c3bf0a47e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-heartbeat-transport-probe.yml` | `9c97649f4673c98c075c199df441fa6619e1fd17` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-orders-headers-probe.yml` | `538d350422d8b4436fb876332bd3531067c8ecf5` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-routing-bundle-diagnostic.yml` | `67735e5561236b7522bf98f00d153adb286d0532` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-candidate-parity.yml` | `77630f00d4010199e5f995f41ae9051d7c5fad6e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-deployed-contract-parity.yml` | `32548716899aa22a984f8cf25ac7a11432a56225` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-exclusion-hashes.yml` | `0365b7a220403245550fbb3284fc2928a780fc32` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-exclusion-rule-v2.yml` | `213429024308ce94399a934d2e4bd5ba6d2f35c1` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-exclusion-rule.yml` | `7f8c7a5c3fff8b2516c7b58afdaab968c6d517d9` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-extra-orders-diagnostic.yml` | `10acf41df6f23f96ccbd22dd24597b7cc5c58a90` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-field-diff.yml` | `12657081ce5c3764a4dd804398677d583fbd6a5e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-filter-semantics.yml` | `a1d79ef2c559fdf7a0dc15495fe6ead07fa16f4e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-frontend-candidate.yml` | `7884efc3723faaa8bacbf3f82c7239c9b83f9655` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-frontend-production-cutover.yml` | `3d45316df38a55437acbd8f71b4482b3a72c4184` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-legacy-shape-diagnostic.yml` | `93b009fb0b237979814ad12f9f79de1a2f6a9f35` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-lines-exact-parity.yml` | `fc64072399dc53e3f677a9ce7979ad957413beb4` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-lines-header-probe.yml` | `350459b77119dd31d2faed5d413ddd9bb19916f1` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-live-field-origin.yml` | `fcf4bdf3ae36e060b20d1ad03f5454a2cea6b576` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-modern-shape-parity.yml` | `cd3fc3a602c00a79f1a7068ebaa48d50d4b409d3` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-ordering-diagnostic.yml` | `1b1a427772ea84ce7bae17cfc78525cba3680a27` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-orders-candidate-parity.yml` | `e34dcf8ec67e1e7af0c44cdbc649a05f484fc958` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-orders-identity-map.yml` | `bc24dc558fdb6ff67ccd8c0efde11681dafa0fa6` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-orders-projection-parity.yml` | `5323932873ceba9c2582666da669165a46322bca` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-orders-rownum-map.yml` | `a13b0bfeb0c09e4b1d3be62a7195611b0b1682e9` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-range-boundary-proof.yml` | `e05224d460203b176dbf167d39562d30fcca9075` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-row-builder-extract.yml` | `4d2ff032e591c2010af4f794f2c5c12afb86f463` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-rownum-field-map.yml` | `745074db0c736d041985aac311843376c9e25095` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-screen-contract.yml` | `8de8640974dc919085df9c6928aa7285b4eb7e57` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-screen-view-parity-v2.yml` | `05a7825dc539bf0ddcdda1925ab8a7d8b5699c61` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-screen-view-parity.yml` | `02841428e0e1f891dff40662a28ff8a7375005cc` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-sort-contract.yml` | `a2e25f6cbe6c2514f9c8deb453718173e8571de3` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-source-rule-parity.yml` | `7710ac7e3136140753ebecf0ce037a02a9c873db` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-view-formula-probe.yml` | `994e13e0a06a7553c7fcd1085ddf13a21f7ced7d` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-service-worker-production-canary.yml` | `a4cf8887a41dbf8dccca5aefdec54f511afd9203` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-stable-freshness-route-probe.yml` | `f6661630238655e568de7c38032e103a395ff54f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t11-v1932-route-contract.yml` | `1ecc3001d1d1168f21b363f7b7af81e1a131f588` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t6a-login-production-session-canary.yml` | `58d121e34f46a8b33d559a093f8953a07891ae49` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t6b-auth-shadow-production-canary.yml` | `8259a4af80d65844ad87f0f3a0f533c8e590efd5` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t6b-final-production-canary.yml` | `5fcbb1b685b4a1b343b41cdc7cbad19916b17b41` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t8-global-orders-read-cutover-v2.yml` | `3146c583e3b72412410917c6b8c9c60496c3ffa2` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t8-global-orders-read-cutover.yml` | `e61d86c0f5de8bed6d8d060e77f5b5956379a81d` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t8-print-contract-diagnostic.yml` | `cd0cd1a33429c5921071573e91c40e13ba556c31` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t8-print-global-cutover.yml` | `a36ca2f7a847b7adb72dda60f8e81d92e789c299` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t9-laser-live-parity.yml` | `00d4be47bb0b0a1aba40ac628b211602a2051207` | UNREVIEWED | UNKNOWN |
| `.github/workflows/cloud-migration-v3-t9-laser-production-cutover.yml` | `2bfde1278c82c72ecd11daba6df088c7a511e5a8` | UNREVIEWED | UNKNOWN |
| `.github/workflows/easystore-a0-d1-accounting-purge-controlled.yml` | `f108f313b3d4a645db13fa244d46002d8ba40022` | UNREVIEWED | UNKNOWN |
| `.github/workflows/easystore-a1-core-reads-ci.yml` | `b262b8aefaca4429de837fce030f7b17ccb32004` | UNREVIEWED | UNKNOWN |
| `.github/workflows/easystore-a1-current-runtime-preflight.yml` | `2156582903b7ff2de7bd0d58d2c3a840900b067a` | UNREVIEWED | UNKNOWN |
| `.github/workflows/easystore-a1-day-ops-reads-ci.yml` | `0ce01e3173dcfb347bdaaf421ba72fc07f1a9d0b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/easystore-a1-laser-quote-ci.yml` | `0ad528ec59806011df0cbdba5c9148a708c2c174` | UNREVIEWED | UNKNOWN |
| `.github/workflows/easystore-a1-party-master-ci.yml` | `9e43b0ffdff33510c5555631a35f2cdba7b327b4` | UNREVIEWED | UNKNOWN |
| `.github/workflows/easystore-a2-command-foundation-ci.yml` | `3a16da8cc637231c88a601ad7c33a30015ec9e65` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trend-master-resilience-v1931-ci.yml` | `de6128398c637155a11e7b334c14d9c4a2f248f8` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trend-master-v1931-prod-readonly-canary.yml` | `d6ad030ef9ebd63aca61530cb2b9e1689c0bc63d` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cl-off-readiness-temp.yml` | `bce20c387baa5f6a3b044aef16a173ae23e2b2ab` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cn-orders-read-hotpath-ci.yml` | `7a2e11dd5432cbd97b4505b8aa896fda686c3375` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02co-canary-wrapper-ci.yml` | `e60d6fe18350a2548b3a22a404977b8f0321294f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cq-screen-view-mirror-refresh-ci.yml` | `77d5a41bcd068414fb510f55ca7161bb8f501a59` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cr-field-completeness-ci.yml` | `42f74f1d06df933053006277deb30e226d6009ef` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02ct-frontend-cutover-ci.yml` | `6f1d0c464e3c4cca12dfdc6e7e402e34e7d06260` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cu-02cr-idle-preview-qualify.yml` | `f3553a27b8cc7ee9d05eca2190a072498cc5ef15` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cu-production-worker-baseline-readonly.yml` | `cf55c5b14e04ab945c8b9b350690135c6c0b1c22` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cu-stability-readonly.yml` | `4f59db2081ddfe4037b9cbf8fd63f34a1ca1280b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cv-order-status-ux-candidate.yml` | `39848f46b704ac94dab209e04d07102c1f55c263` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cv-order-status-ux-promote-temp.yml` | `68665b710e27bc7ccff0674a2f47580f82e0192d` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cw-fix-global-counter-patcher-temp.yml` | `3870b923212fcb93723a274b5ab338f5c5786de0` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cw-frontend-candidate-temp.yml` | `e6f10c654b5fbea2a4020d9fadca4ff9968a1e86` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cw-frontend-promote-temp.yml` | `39024d88230c851ece8fbb1bc52290a6ac314843` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cw-frontend-undefined-status-hotfix-temp.yml` | `f3c40050403cf1e57c248cd39d79d2b1df04da7e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cw-worker-codeonly-deploy-temp.yml` | `b3037c872886bb37b6f0effee65e2a0ac8dce379` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cw-worker-postdeploy-readonly-temp.yml` | `83363d95e63954bee916fd153e9cf454e204f234` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cw-worker-promote-version-temp.yml` | `78f5d2f2a6c91c996565d2dcdcdb32eb5bf98b43` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cw-worker-rollback-safe-temp.yml` | `613fc264999d8bc9fbc279bcb70ba4e5ca2681f0` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cw-worker-summary-candidate-temp.yml` | `6cf14c158538cb319906c8bc6d6063d7b5f8a713` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-02cw-worker-zero-traffic-upload-temp.yml` | `3df110769d47adfe4a49421738d99a66e24d76b2` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-a61-browser-transport-ci.yml` | `7c3e674ccdd6d00fad204c36729f8b4fb693a27c` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-accounting-binding-probe-preview-runtime.yml` | `9ea567429bc2343951c30f292daa6d7ccc9842c3` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-accounting-d1-discovery-readonly.yml` | `ad8874302f380ac85ed4fc376724b709e7eb9213` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-accounting-d1-preview-create.yml` | `a4a124ade67cab128e02ec33d31108c3f1a429c9` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-accounting-d1-preview-schema-apply.yml` | `33aa40dcfa36fd8f3f05b4e09868b98d0d32920d` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-accounting-f2-runtime.yml` | `80a1d21bf9c8659a5673e25af26d7be0d5848149` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-accounting-native-ci.yml` | `693101f8d7d2c4d76934139626ee1dadfe84da73` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-accounting-persistence-readiness-preview-runtime.yml` | `c24ec1fd30dbfe114109d4b888bea2f9dac665ea` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-accounting-persistence-schema-preflight-preview-runtime.yml` | `0f72b9e6387255e1a09236a5a399e8199f853df8` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-accounting-preview-runtime.yml` | `fc2e9d3656ed8a15cfaa2c9938c5b192f16a5d49` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-apps-script-cloud-write-dryrun.yml` | `15b87890a6450a6e95c82041756c981128d6f36d` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-apps-script-cloud-write-rehearsal.yml` | `574a5128cb1f34593cc89e5e32aa53cc82a00f50` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-apps-script-heartbeat-route-probe.yml` | `4f801c1812326d8e75ce8c628dbe8b323c369fee` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-apps-script-latency-probe-temp.yml` | `88e3673b714c309a7e2ae02b0a7e49c1ecdbd9d6` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-apps-script-staging-pull-dryrun.yml` | `3a77b14c5c1b680161c2fcc28c2c3ea22c990272` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-apps-script-v150-dryrun-integration.yml` | `f0108ec7783b6d880f410325e0c73ea0c5a7b2f3` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-apps-script-v150-live-probe.yml` | `46018392d385e588ca9205d044eb7603aa93502c` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloud-write-isolated-integration.yml` | `bea1c9bb5010a02d3ca8c456e7227480d9208205` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloud-write-order-contract-v2-staging-live-probe.yml` | `7a56b36cbd4a74391cab50f349c1575e34d592ec` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloud-write-order-contract-v2.yml` | `b478ec9107a10b779047d0971f50401147b3b7e8` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloud-write-production-preflight-readonly.yml` | `58882ef80ce4641d930f3a355c0f67f2c6745158` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloud-write-v2-apps-script-route-probe.yml` | `26da40b88a0fd98692cbf90a6f5dbcab09921633` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloud-write-v2-production-shadow-candidate.yml` | `bcad49ee8837fc5308658b1def0873169b240a4d` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloud-write-v2-production-shadow-controlled-deploy.yml` | `7ebeadb57fb1358fae817b5d4e8ed1f56ebf2d8a` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloud-write-v2-production-shadow-integration-candidate.yml` | `adf1cd1e178229d4b02a515b6026996d9e695125` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloud-write-v2-production-shadow-live-preflight.yml` | `32b582beb48196ea5268152cf50546735c7da49b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloud-write-v2-production-shadow-preview-method-probe.yml` | `fa99c70e74787d823144e7cd8834164abb087680` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloud-write-v2-production-shadow-preview.yml` | `be19cca281bacc30b4375b140298c4a40bf647b4` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloud-write-v2-production-shadow-readonly-enable.yml` | `7672ea8a4f726e9b7fc7be79e3a8aec569602086` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloud-write-v2-production-shadow.yml` | `667bcc36fdf691840086be53ff3dbeefc36eb1e4` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloud-write-v2-staging-bridge-live.yml` | `ebe27a9437653f62a0b9a60088c4cb22335277a1` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloudflare-edge-preview.yml` | `32bdba8cfa3ebef3386b19a0fbf8128a1f88132f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloudflare-freshness-diagnostics.yml` | `73cb3170675fb0cd2104dcb67227ab1964d0ba3b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloudflare-freshness-stability.yml` | `af0ba28d509379ddb26a38c7cd8e67dcf6420ada` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-cloudflare-orders-dual-signal-preview.yml` | `154d0f3066db7cd63d2a0756391df32115e8231b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-core-p0-11-e2e-readonly-gate.yml` | `9d4dcc93a07cbeeb4d81a06eaf1fb235ca7eee87` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-d1-orders-low-usage-v1.yml` | `7c14248aaaf0ff4e0a72785ed03c9a08d58d8c39` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-d1-quota-v2.yml` | `19cc2c4dc278a42a7a11cda361bea93f337c1e0b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-easystore-secure-sso-runtime-repair.yml` | `7e37e4ef7ea2b2875cea61ddf25f6982773797d8` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-edge-orders-preview-runtime-v2.yml` | `002081fc4cd4bc7252e71ab167e2fc34d68bde02` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-edge-orders-preview-runtime.yml` | `ab9ff83ecde91f9a9346651188e968b9121a693b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-edge-orders-production-alias-runtime-v2.yml` | `02ecde7204e6620156abe52a65ba6998872281aa` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-edge-orders-production-alias-runtime.yml` | `ac5a37f7047a89bbdf21e9ba885cf8a45dfee3fb` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-edge-orders-production-deploy-v2.yml` | `53fa80753d00ca8c8e342eb83a938c854b14561b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-edge-orders-production-deploy.yml` | `f16fe6b5cf47cb89480a9b051dcbbc4cf251a9e9` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-edge-orders-production-freshness-guard.yml` | `2103c2f7dc7bbf29b27803d17fe92ebc10185a83` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-edge-orders-production-preflight.yml` | `69af06c7b4e0730b8b49ef5eae579052234707a5` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-edge-orders-read-v1.yml` | `c9e7f918c0f9b1ab9b0516c0952b21cb3d964bbc` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry504-session-race-manual-bundle.yml` | `447ee8d37732da98aac64930cd850aa18f9d80d7` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry546-frontend-refresh-recovery-manual-bundle.yml` | `2aa8aa42cf4232dd31dda3849398158e28230941` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry579-frontend-create-version-only.yml` | `643e148961c6d46d0f8a8dc59ea94c6ea122a3f6` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry580-readonly-version-verify.yml` | `cdc0f524e71a80269277f64654d4bdabdea47f2b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry582-promote-exact-frontend.yml` | `19a7d6cc14c113e11be662acc7411748197ec4b0` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry582-promote-frontend-exact.yml` | `98e13dbe0f99632b10457cc9f2afa1acb8b2991f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry585-post-promote-readonly.yml` | `8541cdfc0dc4be9b71e51bb4618eb3417e23bcc0` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry594-duplicate-guard-frontend-publish.yml` | `af4d86e2c06009f6a259ef4595291cf1bfa33fbe` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry595-frontend-readonly-verify.yml` | `dcf8eec469b330174a535b9a67cee485bfb1bf3b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry596-legacy-orphan-lines-readonly.yml` | `860391d6e023044441ad058afe83497526b8662f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry597-legacy-line-runtime-ci.yml` | `cd08b6836f368fa47707cb902a550d60eaba7d67` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry598-legacy-orders-production-preflight.yml` | `49cd9e7b96d5e969f75c15a80de3a4f3a237ad31` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry599-legacy-orders-production-repair.yml` | `9e7916a47b79f0329ff9e0c2152513f79cb11b15` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry600-legacy-orders-readonly-postflight.yml` | `02bb3e81c552c31dc2c5803e970027d7208857ad` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry601-login-latency-readonly.yml` | `43438eb7a17f29d0f5d510e590fb9edbd6541183` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry602-native-auth-readiness.yml` | `9edb961dcd8b1c9aa45b213fd1502b0eb7e42ac1` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry603-login-fast-surface-ci.yml` | `ddf2b2007ba10f247ca1c3a884ba8326d64a521f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry604-login-fast-production.yml` | `e983dfcb073955a29eeb883ff643ef0fe4a745d2` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry605-login-fast-readonly-postflight.yml` | `ba5d739d4f12ae34a9c0a630d728513bcd89ba2b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry608-native-auth-bridge-readonly.yml` | `36cafd43756bc109963218a7f1d7d67aee86825e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry610-native-auth-cutover-readonly.yml` | `b51e32fc6e7c77f75675b98de6ce6c90566eadb9` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry611-native-auth-canary-repo-ci.yml` | `439c2f0082ccd5ebe612d08642cbd2516a4e9ced` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry612-native-auth-production-readonly-preflight.yml` | `b249c8ce8a4ceea7797541856a1ec759744c0a90` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry613-diya-canary-manifest-ci.yml` | `0e14bfed686c8b3e9daf95a00c839371717877dd` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry614-employee-comms-native-ci.yml` | `7756d90dc07e5c3f9cb91ee577c5da765a2daa47` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry614-employee-content-native-ci.yml` | `3a14e3850e28b23b76bb6be0823961cd2a0fe72b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry614-employee-ops-native-ci.yml` | `924b7beda5caf6f026198efec489f9e767377a15` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry614-zero-google-business-coverage-ci.yml` | `0badc1aa82c76b5661db602e30e09da2070012d3` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry614-zero-google-d1-inventory-readonly.yml` | `1a81eff143af42abd647102d3205e7b4983cc686` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry615a-cloud-auth-shadow-ttl-ci.yml` | `ab29e8f78a9bb57973f0bbd1edeeca19a493b85d` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry616-zero-google-backend-off-deploy.yml` | `912f96c9d644a136b7d369819bcdca4e9629ab59` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry617-live-frontend-diff-ci.yml` | `cf7f3313db387abe3a65fddde38625743700ef2b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry617-ops-readonly-controlled.yml` | `96beea97cbdc9fae8a3acb5cfa6edac372e61918` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry617-ops-readonly-source-ci.yml` | `874cc53841af0bec93e676c22a223f0d22ebfa6a` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry618-active-session-audit.yml` | `fffa59f373e22bc5e3497a32f02959eab40a0c96` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry618-historical-ops-observability.yml` | `5b953b7930af6560e81a7c0cb84a44308149c656` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry618-live-ops-tail.yml` | `14e5bb0835772271e89b85705a0f721073e0d71e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry618-ops-general-controlled.yml` | `4a73ff368b5444908e06c76a6994f070a4555106` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry618-ops-tail-shape.yml` | `787957954483138867139be65b11bd3891b4bf72` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry618-postrollback-reconcile.yml` | `502811dfa667dfa896356d9ac785ba6996dd463d` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry618-postsuccess-reconcile.yml` | `5601266c98e58c77fd4f0478c48bd2766e538a09` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry619-accounting-cors-diagnostic.yml` | `acfb711b6cf1d44a1a37de1fc27de3232214fc87` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry619-accounting-readonly-controlled.yml` | `89a24c565e9fbe4bcd34efc1d0c474abdf40546a` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry619-accounting-readonly-source-ci.yml` | `02646f8bbc3d5d050720c197efa8fb9d39cee3a5` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry619-easystore-sso-controlled.yml` | `2eecef20d85c00ea86337ed434fedde9c6ed1adb` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry619-easystore-sso-source-ci.yml` | `553772a81206a46df2d8c7ad90592cfafcab6dec` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry619-easystore-sso2-controlled.yml` | `ad6cfe17be10a9d2696c2bca174eab9ea50a7dd5` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry619-live-accounting-tail.yml` | `9d4f169f6afc393b646863776fec9e2ac2528e05` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry619-postsuccess-reconcile.yml` | `523282fe72a4ef7d9aba5b057c722f8b367195dc` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry619-sso-postsuccess-reconcile.yml` | `c4398be482d76898800cb3ca27c611ef0eb5faad` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry619-sso2-postsuccess-reconcile.yml` | `33e6584b66ad069950cd4ff5754e500924ec5bc8` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry620-attendance-ui-hotfix-ci.yml` | `5c74285853fd1c4a86d8f59faadd651f08d1dd7d` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry620-attendance-ui-hotfix-controlled.yml` | `7f3c6f0d4efc478cb8f9e4ba8251f38895b66a14` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry621-auth-session-readonly-audit.yml` | `582db7a31b3d1850ad916f90fbd8278da2a316b4` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry622-bridge-policies-off-controlled.yml` | `89fe3693f2826ee3308c4f7ee8a37570b9b8447c` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry623-auth-500-readonly-diagnostic.yml` | `eff2c8164c186bbfe335fa1ea9db4a9c7754e80c` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry623-auth-bootstrap-stage-ci.yml` | `62dc27955ef1ec9833ed4c68067b33aae26b2c22` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry623-auth-login-tail-diagnostic.yml` | `d2b3559aca4d734c3efd81a7bb7953d0e6cbc9a0` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry623-auth-stage-api-manual-deploy.yml` | `455333d758fca50324220ef31f37af627841361e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry623-backend-first-login-stage-probe.yml` | `3fd22fd3aaac3a342b8ff7bbe45963ad2388804e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry623-backend-native-read-smoke.yml` | `39c77ea0b90f668f9bc76eb65a4ed22359490f3d` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry623-canary-runtime-arm-controlled.yml` | `ec8d4d81bff686e1ea9d9a70226046e1f808485f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry623-deployed-auth-source-readonly.yml` | `20241fe1b1647b096fdfba209e823451f6f15b3c` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry623-diya-auth-read-smoke-controlled.yml` | `004f7927d18364a9ac709e6b464f01195507ec11` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry623-diya-frontend-canary-controlled.yml` | `43fb44eb8000b9b89355c52624889793d45a9adc` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry623-login-canary-repo-ci.yml` | `37ce5d00a4115197f8ce84a25bc9a7b994afebd4` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry623-login-incident-frontend-rollback.yml` | `e8299363d0a151bfeac094615067fb974f5eaa83` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry623-native-auth-canary-preflight.yml` | `7a28ee272c4ceeb5e20369deb698566dbe268c49` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry624-wael-frontend-canary-expand-controlled.yml` | `5404aa1cba948a4cd1f9edc0d27d75907379116b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry624-wael-second-native-canary-repo-ci.yml` | `30cb4fc36b6bf04f19902db6ab1253c84ef14a69` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry625-jaber-frontend-canary-expand-controlled.yml` | `a7abdbbb4f4e4b5684396e6408c9e6d329029b54` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry625-jaber-third-native-canary-repo-ci.yml` | `e61a6e4ba3845310cd1fcf2182f79f4323c1d1e2` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry626-remaining-employees-frontend-canary-expand-controlled.yml` | `1d71467f424a73dc14217669ece4e78d4ebcdf1b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry626-remaining-employees-native-canary-repo-ci.yml` | `088ebcb962731abd69ac59f326d7271c2f33c2ab` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry627-employee-native-alias-frontend-controlled.yml` | `ae1004558e6c899b81e568cacc75841d2de1ff51` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry627-employee-native-alias-repo-ci.yml` | `981eae7090a171f93315de86365fe2fceeaca193` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry628-core-readonly-backend-compare.yml` | `ca14764f0fc2d97441d7f674c7769e7941b2639e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry628-core-readonly-backend-smoke.yml` | `241f919af535aae886edec70e6860a1982f465b1` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry628-core-readonly-frontend-controlled.yml` | `18d93142a1852ba98d31ab772ce2f89ed7d0c21b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry628-core-readonly-repo-ci.yml` | `2f0e7faf5c7183f05d5b1b40c4c7e63bc06933bf` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry628-core-readonly-runtime-arm-controlled.yml` | `18811ea9ab9f16e880f09ca6b13e20da909fdc65` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry628-frontend-bridge13-controlled.yml` | `24405406e42bfc5f89b118339ce7d4b111967a20` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry629-content-readonly-backend-smoke.yml` | `e63a1b840b8ad5eaf5837a016208919855cc74de` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry629-content-readonly-frontend-controlled.yml` | `d29cad754b9d63e074ca508db54b8549366d39f0` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry629-content-readonly-repo-ci.yml` | `34f3b4b81a3a4ba29bee7b1f82202dbe75b427d2` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry629-content-readonly-runtime-arm-controlled.yml` | `c3c29dde9945f0b3526c76e1e61d826068edf95a` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry630-comms-readonly-backend-smoke.yml` | `1f833685ae5cb9242eda1c562e1be3e00571d0b0` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry630-comms-readonly-frontend-controlled.yml` | `556dbf67555f03f1e693c8279149c39578d39f7b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry630-comms-readonly-repo-ci.yml` | `1e2c83ed562b8fab7b92500f0f5cc6be8d2d9da0` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry630-comms-readonly-runtime-arm-controlled.yml` | `3fb77dfbc4ba0ad881de4b25b8e2f39f6204f2e4` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry631-bridge-free-canary-frontend-controlled.yml` | `0ed202c7f60b43aefbcace8e04fcaa91a530dba2` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry631-bridge-free-canary-repo-ci.yml` | `52d5b82092fbdb7fc8c0e2ef44472aff3b32625b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry632-backend-bridge-binding-audit.yml` | `6e65e220adf1868eefd8df2ca474aef7c5f07196` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry632-backend-bridge-disable-controlled.yml` | `2a6ba06b5c2ae1d7d3305836070e720fdbbd64a2` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry632-backend-bridge-off-candidate.yml` | `824332889549ceca7cae92dc598781d22810ed89` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry632-post-activation-proof.yml` | `12060c435c537613013d7e5eac6856689300c57f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry633-auth-alias-readonly-audit.yml` | `9857c147bdde36b918582ec3cfeb8406085bb50d` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry633-auth-native-key-classification.yml` | `c30410948fea69cb024e35d8a5d9ebae32b843b3` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry633-native-alias-frontend-controlled.yml` | `472da95ebf31f97492db81aa28c473f107cef924` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry633-native-username-canonicalization-ci.yml` | `fd2f48e1ad48f61801d9a9ddb72259e28f762004` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry634-disable-legacy-bootstrap-controlled.yml` | `58314e9f2348e9d0bf5c0917fec550445275fcf4` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry634-disable-legacy-bootstrap-repo-ci.yml` | `7a5f9d0790e3a860aca8ea32d7e9e530f951d77f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry634-post-activation-smoke.yml` | `3cf54d3a701f1c7e892b40c4cdf6538310b21b23` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry635-native-only-binding-controlled.yml` | `c9212f22faab8cb7e8245e00344377cbded7b444` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry635-native-only-bridge-free-repo-ci.yml` | `42b70ca240fa3a6d197b74180d1b1d23efaab228` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry635-native-only-live-proof.yml` | `9ccf5b49ed57a368d793fe1a330be759a87669d4` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry635-native-only-preflight-frontend-controlled.yml` | `eca8cc8811863cdeb334a3550610fabcf7854522` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry636-global-native-completeness-guard.yml` | `9f064348d14134596440909ce7a79b518f4bfe8e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry637-hardened-settings-baseline-repair.yml` | `fa8109c4c064d85c54b402b1abd92f87619175d0` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry637-native-user-shape-readonly.yml` | `1970a8766f917ae8d778abbcf8f8838cd11df627` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry637-sherif-bounded-bootstrap-window.yml` | `db71afe69b78cd8a062c4fb031876269ea108863` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry637-sherif-bounded-staged-window.yml` | `1c3d637128c19c0c36c82e51ebcea48d14c3c761` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry637-sherif-canary-frontend-controlled.yml` | `5622e34358985680bb49ef630eb6c43c481e4868` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry638-master-book-finalize.yml` | `5c3fdd37b2a7f25c782658e95fda50abf4a9524c` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry638-master-book-record.yml` | `a52c7789d5bd2d06db16114ee4f776367a3a749f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry639-global-native-frontend-controlled.yml` | `0eb7983a6c6ae71e5c16ee675a0a6b607748c04c` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry639-master-book-record.yml` | `ef0f333a841fcfc286f2245a3aa8801686bec688` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry640-auth-control-native-controlled.yml` | `f9ad029642a528a2feb5f452aeac52f35a017a7a` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry640-master-book-record.yml` | `df323595909912e1f62e17d1de008b9c979dc60c` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry641-legacy-auth-retirement-readonly.yml` | `4d9cf2c0c57db7fd928bcf3dc1fdd985c43b5b75` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry641-master-book-record.yml` | `8e2c878537072fa12866a50c486dc536cab1399a` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry642-deploy-resilient-auth-hardening.yml` | `02b1dffd6d7d7f034d784f22b0e631f3d03e2bb2` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry642-master-book-record.yml` | `4bbfa58fdb8f8d71b504e8f75f3843a77dfd69ac` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry644-core-general-frontend-controlled.yml` | `49443a7d2b66c52fa1cf72748e667e0a70abc82b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry644-core-general-repo-ci.yml` | `c85e229d36411a1cb90d18cd8180a8d053a55f31` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry644-core-general-runtime-arm-controlled.yml` | `5c1d60e6c1609cd3986e52cc7911d1c8784e3e5b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry645-content-r2-foundation-controlled.yml` | `d075e30894d84fc99f492dec863fded94b55d096` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry646-manager-center-core-direct-controlled.yml` | `1ffdc9640df64c0e3b5bd20b76a9422910ec5ff6` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry646-master-book-record.yml` | `22f66087c9bd92321d1f9aa8e8103222d1ebb11f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry647-auth-attendance-frontend-repair-controlled.yml` | `db36ef601701056ef2902665bd705bf9fccf6bb5` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry647-auth-attendance-repo-ci.yml` | `6e9e6f0a911313c7286c846c3e504d83a64f5cfd` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry647-employee-login-attendance-diagnostic.yml` | `cd5ebbf107226810bac60a8602cc4fd006aa5ee9` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry648-employee-login-matrix-diagnostic.yml` | `27f7226bd594216a14c9e468ca108d8d7e2790fe` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry649-employee-andon-structured-controlled.yml` | `9ccfd86172102e82c5bd4ce4a7165dc69e6fd709` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry649-employee-andon-structured-repo-ci.yml` | `e653afaf92daaaf1b0f59072d069c4414a8c991a` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry650-order-page-frontend-hotfix-controlled.yml` | `526242789fcab27bf15d0ffe740a4709849ad787` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry651-stale-session-frontend-repair-controlled.yml` | `78adb42494d07daa6cc2fbcb2d12206860b3f9c7` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry652-employee-session-lifecycle-guard-controlled.yml` | `88be31edf7a19698de2e9cc16414a86d58fe8e5a` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry653-zero-google-employee-proxy-source-ci.yml` | `384d2e966067b5bac471374e3e814889afe877c8` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry654-customer-portal-offline-ci.yml` | `ccf8dfbea75d4a126ffae9a561b146ced992301c` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry655-customer-order-ownership-offline-ci.yml` | `6b6a72ea166661db7879fb75acd171005a208d9a` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry656-zero-google-public-health-readonly.yml` | `9cb9c842da84723f4c0e2ac180c1015d09e2b975` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry657-customer-phone-otp-offline-ci.yml` | `96a68faacd96d7811b875550be564f67884271dc` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry658-customer-otp-atomic-source-ci.yml` | `747ae33ba2bf42f4a050ea2a1a01c90697897196` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-entry659-customer-enrollment-ticket-offline-ci.yml` | `4235122830a4c8e5957782d5cdd7d5199ef64a3e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-gaber-material-control-v1-ci.yml` | `8a0ab537137b0247cb8c33a9cf89f1975ea81030` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-integrity-v1.yml` | `56e6cd974c03fe7b93a605d192c51f1289b0ecac` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-normalized-import-isolated.yml` | `cfc377c024be1a5142a07cf340831097dfa2fe84` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-operator-task-appscript-readonly-preflight-v2.yml` | `1fb3bdc0caf7d5e5344deee7a818bd4569aa477f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-operator-task-cloudflare-preview-v2.yml` | `2e20cad780a1711b46859e0f7043da8e45c9620f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-operator-task-production-edge-codeonly-off.yml` | `c2957fdce7a8e623fecd711922d85671bb86409b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-operator-task-production-edge-enable.yml` | `871c595d07e86a754ed73bcae9c361978db1a633` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-operator-task-production-preactivation-readonly.yml` | `98de152d6b97ed1057c5c360c286a2a8cee7bc42` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-operator-task-proxy-secret-verify.yml` | `5ccedb5188d411c3cdcb7e0d02875d928a4b1995` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-operator-task-workflow-v2-ci.yml` | `609b251bb7ce150a67ba35630e001051629eb5fd` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-orders-02cr-visibility-regression.yml` | `906c34db810ebc33c2748c8623781e51f5a0fba5` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-prod-latency-split-temp.yml` | `95f688a053af9be7c8c3817deb28164552b1ac75` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-prod-startup-storm-hotfix-temp.yml` | `94c3ea549a986d2966ac282c9117607da173ed99` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-prod-trendmaster-lazy-hotfix-temp.yml` | `b9191e8d78d46d7d66af215fc6a831abe4debc6b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-cloud-write-business-qualification.yml` | `bb01f8090b71bddeca20e7678b50cda0ac23fa4c` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-cloud-write-controlled-enable.yml` | `83abaa15ede4983f4e12686f4fa83b044a1a34fd` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-cloud-write-pending-migrations-readonly.yml` | `3eb6a2168b892629973cc9057e66c9afcbb593ac` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-cloud-write-schema-controlled-apply.yml` | `1d84bec26ffb650409038ef075b3b092229c1a8f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-cloud-write-schema-controlled-contract.yml` | `10bf2dbe3b0e27cdcc3fd525c3a1ea41dbd62564` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-cloud-write-schema-migration-candidate.yml` | `b9aa4edc51c21772a605808881470afe3902b5bc` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-cloud-write-schema-readonly.yml` | `31575e6ad721a37742966642754272a2969fa73c` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-migration-ledger-forensics-readonly.yml` | `15d39370d8ec5a5d5d485dbbb82631fc360560fc` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-migration-ledger-reconciliation-candidate.yml` | `a25e2a1d352742e900f5ec13b2fa34fad4756d5c` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-migration-ledger-reconciliation-controlled-contract.yml` | `3ec6b45a4f2907de5fb4740d71c0faba24da38a4` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-migration-ledger-reconciliation-controlled.yml` | `03812537b1fc082112addb724f6c80246a372a89` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-migration-ledger-reconciliation-readonly.yml` | `69e21cca256145ec31b39fedcaeed715ef4fbba7` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-orders-frontend-cutover-probe.yml` | `e5055f2068f2bdd892e4cdaa39f73758792f346f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-outbox-sheets-reconcile-qualification-candidate.yml` | `2cebc1916c721b94fab87a232654887403043942` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-post-0003-stability-readonly.yml` | `ebadbb4c43b0f12a3c7af78537aecaafed760311` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-shadow-stability-observation.yml` | `fcf726942e0d4ca44d63b04e2d2944b736aa9b5e` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-production-worker-identify.yml` | `a8f2c50d15b8f2b9077dffd6ab0abec92b7e26aa` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-r4-production-recovery-controlled.yml` | `e564602f8b9682fe73d0495da149cfa7328736f0` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-r5-periodic-controlled.yml` | `508cc3cc6f574805b2f968bc85b962691067baf8` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-resume-no-autorefresh-v1-ci.yml` | `3498fbb3b5323690acfc12b540a02d5e6d902385` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-return-traffic-quiet-v1-ci.yml` | `e54d27f554f39ecd5e5cf00c81bc9606d53139f9` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-rp07-remediation-containment-ci.yml` | `15ccbe5b5b24fba41357e085cf196a3836a37d44` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-staging-synthetic-sample-bridge.yml` | `e4fdfdc355c5a5a693233344f580018db94702bf` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-staging-synthetic-sample-live-probe.yml` | `c898d483e15690a68e10dc58b7c4c1cced62518a` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-startup-request-storm-candidate-temp.yml` | `6bb4b9f71e63c9a0c5290fa5f2925af9e0a900ae` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-142-d1compatible-local-contract.yml` | `4765ef36b225bec4d3937c40a1dab1b971ffd9a9` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a51-customer-search-ci.yml` | `d88c2a829396eb99c6d22bd6dd43fe5c3d9f2518` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a51-customer-search-production-deploy.yml` | `885f026105a0de68783cf7da12c7c5f5db7bd5f6` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a53-customer-native-ci.yml` | `123b9b0dd37ffca86f2dd5c5d26d0c3d8e2de7a3` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a53-customer-native-install-bootstrap.yml` | `27bd48a39a163cbd34a6e6e8f7055c60c8c7126b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a53-customer-native-install-retry.yml` | `b5a57f3d5f02af2278e5b181c53d4fb49e70db28` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a54-native-customer-search-ci.yml` | `e2a82941162562052c4c96f2be1cbc3fe86e8ba7` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a54-native-customer-search-production-deploy.yml` | `bdbdadac0dae5dc0657898fb9b3241b3e67f5bbb` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a55-customer-legacy-projection-ci.yml` | `6323b9cfcdeff6c97f34c0566295e54eecfb8747` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a55-customer-projection-production-deploy.yml` | `0d040aaf40b60ce1554455c7faac9530d182c455` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a56-customer-cloud-only-ci.yml` | `c59176cadb6d1cf6ce7ede4a7a8078502a063d98` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a56-customer-general-cutover.yml` | `4500e0867bb52016340f5cd41aca7b52fa0dc69b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a56-full-cloud-cutover-audit.yml` | `cdb46e662463489b74cd280549189c421d37415c` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a57-cloudflare-frontend-cutover.yml` | `d713f59e850e7ea58557cccb51c854e935938fb5` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a57b-cloudflare-worker-frontend.yml` | `c27e7787afb7f92c48e569c65bf1e04fe9e25622` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a58-runtime-actions-audit.yml` | `9230920dc3704ffcc653dc1342d49d3349f1798f` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a59-native-auth-preflight.yml` | `af83e0565e438a359977cabaaad407c33f9feba2` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a61-bootstrap-timeout-off-deploy-temp.yml` | `4e13326500ccca7fcad9d8f7f90620fc9ad5b0a4` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a61-bootstrap-timeout-qualify-temp.yml` | `31bba8658501ea6afe1a66729dadfc5434db6f96` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a61-cloudflare-readonly-preflight.yml` | `adde5d1ef627bc8f603365f7256c2322a75cc9c6` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a61-diya-native-bootstrap-canary-v2-temp.yml` | `eb9fe70e2830a959a96fd4792e8d2d7cef706fb8` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a61-diya-session-enroll-canary-temp.yml` | `a9e77c2d0d7820136e0a911c6e6be46ff76312e3` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a61-legacy-auth-bridge-ci.yml` | `f96be3dfd4b447f6a2255c7f8ab360fda1d63a52` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a61-native-auth-ci.yml` | `14943a87de237075ec91641d513f22dc175e0fd8` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a61-off-state-install-preflight.yml` | `5e1ea3827e0cf870ecd9c54ce35ee45e1be193df` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a61-phase-b-d1-off-controlled.yml` | `0fc75627099b1495e07c0e81d0c9ac6b9b0de268` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a61-postdeploy-readonly-verify.yml` | `0cfb9c660f885236713eadd5316840b7abeadd48` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a61-session-enroll-off-deploy-temp.yml` | `d80b05b105ef35562dc7e70676c833a0d1e75ce0` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a61-session-enroll-qualify-temp.yml` | `063ef367989192f5d048ffadc79a0829611454ed` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a61-session-enroll-qualify-v2-temp.yml` | `b12465772bd8c6d2f239d14c5de3581edddd00c5` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a61-session-enroll-sessionbound-qualify-temp.yml` | `63104f2960ae32afc259b60b3bed1a5259475894` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-a61-sessionbound-off-deploy-temp.yml` | `58403f4b2e5ab7f920afd9c4c5a399dc1275f3ae` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-duplicate-order-guard-ci.yml` | `8cfe298c54715b1d6bfe56660afe652d466c9509` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-duplicate-order-guard-production-install.yml` | `0540c4679d6c7c6d53e739c1015a29df67e64bc0` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-duplicate-order-guard-production-preflight.yml` | `5c926cd9b7e6688e238740e42f14b558eb9d7c78` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-entry500-manual-deploy-artifacts.yml` | `b428536c5173f3102ca22dc0ac3486b8c4d80f67` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-fresh-start-4322-isolated-ci.yml` | `095a3398c81c00b2f45d382b16c4d18f04dbf37a` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-order-create-isolated-ci.yml` | `378b19ac83be5da116eac80123c0dc389bb4cb33` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-production-create-canary-controlled.yml` | `c4603edd4844591b8cdacda94dbea55f7775d6bf` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-production-create-canary-isolated-ci.yml` | `135de0a8e85e35715d62042b52f37384313401c6` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-synthetic-d1-persistent-write-qualification.yml` | `61c3b01f5606a046c8a6d397f6882c6197beef54` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-test-mirror-142-d1compat-retry-once.yml` | `487d1eb8f92212e6b9cf7826c80ff570b0e6485b` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-test-mirror-142-qualification.yml` | `68bbbd16a3746c556a9563a1fe78ae8e5739c1c8` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-test-mirror-142-readonly-guard-probe.yml` | `a50ced887503c56e166e05e0b81b501b47a1349a` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-test-mirror-142-reconcile-readonly.yml` | `699672e548b5759972a7b09a39dfe1c01380f9b7` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-test-mirror-negative-qualification.yml` | `a78770641014bea6b1982ef5480aaaa42aa708de` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-t12-test-mirror-positive-qualification.yml` | `ed746675d6d80c71b7e57994a4f534f615cd50ce` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-work-queue-v1-candidate.yml` | `7968f169c5e08845494a210173397b03fa0d1e51` | UNREVIEWED | UNKNOWN |
| `.github/workflows/trendos-work-queue-v1-inertness-gate.yml` | `0a5d8c1192f0dad4d92774ec45e9bd5f448a4379` | UNREVIEWED | UNKNOWN |

### CODE_OR_CONFIG_CANDIDATE — 291

| المسار عند snapshot | Blob SHA | مستوى مراجعة المحتوى | حالة الإنتاج |
|---|---|---|---|
| `APPS_SCRIPT_DEPLOY_V1940.md` | `6f21ba46f8ab51564362b5c7cbe6ada59a9abc45` | UNREVIEWED | UNKNOWN |
| `ATTENDANCE_V1_INTEGRATION.md` | `d9d01f9349e544be12c97964dc96fcea76a88b82` | UNREVIEWED | UNKNOWN |
| `Code.gs` | `e91d78dcceeeca2804e721d58e065a6a7181bfc2` | UNREVIEWED | UNKNOWN |
| `D1_Fast_Auth_V2_5_Safe.gs` | `f70bc159cde4810582cc6d81b1630fff8c2d8bfa` | UNREVIEWED | UNKNOWN |
| `OPERATOR_TASK_WORKFLOW_V2_CANDIDATE.md` | `9a2df860c870f6ec797e36253ee5fce1087a37f2` | UNREVIEWED | UNKNOWN |
| `README.md` | `d49f3ad86c12ef528c91d1a5080d711a34aacb60` | UNREVIEWED | UNKNOWN |
| `README_V1931.md` | `d8b99c46ffd2be23153c047e41d5f8276b671a30` | UNREVIEWED | UNKNOWN |
| `TRENDOS_ACCOUNTING_BLACKBOX_2026-09-04.md` | `6cb1a0642500deca5fff92c4eca8398fc9107410` | UNREVIEWED | UNKNOWN |
| `TRENDOS_ACCOUNTING_EXECUTION_LEDGER_2026-09-05.md` | `431d5206817d20ea21834c31e7b5d6cdd5454b39` | UNREVIEWED | UNKNOWN |
| `TRENDOS_GO_LIVE_2026-09-01_MASTER.md` | `55eebb1a777db1a3c047074896837a8eecadfdf0` | UNREVIEWED | UNKNOWN |
| `TrendOS_MASTER_BOOK.md` | `a5eb39309413c2c2b8c5b62cab4ebc581e90f71e` | UNREVIEWED | UNKNOWN |
| `V1932_RELEASE.md` | `c5904515f1642ab32057418696f40fb61ae854ef` | UNREVIEWED | UNKNOWN |
| `WHATS_AGENT_BOOK.md` | `406c5be0fccb959fc8ab0bebba2123da01682506` | UNREVIEWED | UNKNOWN |
| `WORK_QUEUE_V1_CANDIDATE.md` | `3b8889d96a00d7f9300a1c3146cd78de10886952` | UNREVIEWED | UNKNOWN |
| `app.js` | `9d90b5b1a1fc5c1ad2058cc29e97530c68c1a875` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/CLOUD_WRITE_ORDER_V2_CANONICAL_ADAPTER_DRYRUN_V1.gs` | `72ff4a277e533f5a5f705e66730c96c793c06376` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_AUTH_BRIDGE_QUALIFICATION_V1.gs` | `eeb4ffdaa3d0d1ef13986a721591ea5b56e04bc4` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_BRIDGE_V1.gs` | `f6e0820c7b45cdfa952c294979814bdb62ef0733` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_CANONICAL_TARGET_IDENTITY_V1.gs` | `2e4811ec35fc0d94a96c9e36c6fbcff51d40b130` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_FIRST_WRITE_HARNESS_V1.gs` | `4312b772696522f06684ccd6be7d24986c7a32a3` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_FIRST_WRITE_RECOVERY_V1.gs` | `c547dd2b4353a6b186c568b2f7c12beab6e0f060` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_RUNTIME_PREFLIGHT_V1.gs` | `39bfa0936841e1725c7491347d47697e87c6431b` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/CLOUD_WRITE_ORDER_V2_STAGING_SIDE_EFFECT_QUALIFICATION_V1.gs` | `dad24f4804f50363f586d750eb81fd642d2cdb11` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/CLOUD_WRITE_PRODUCTION_RECONCILE_QUALIFICATION_V1.gs` | `a4beb8b37a1c009fad414b3c7a46822566eb1e96` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/CLOUD_WRITE_RECONCILE_AUTH_SELFTEST_V1.gs` | `f4d3676b199fe9f98eb7abbf96bef22ffea83730` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/CLOUD_WRITE_RECONCILE_DRYRUN_V1.gs` | `38b4a8b9e29a0c2793d8826ad78520b4b54edf5a` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/CLOUD_WRITE_RECONCILE_REHEARSAL_LIVE_RUNNER_V1.gs` | `e90c53ada4d9a0a5533bec8e0ea37390264bc6e9` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/CLOUD_WRITE_RECONCILE_REHEARSAL_V1.gs` | `743f77b034a4cbdfb82c8a880ba70b45225e68f0` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/CLOUD_WRITE_STAGING_PULL_DRYRUN_V1.gs` | `fe47bc0dd7e2d216219f5323ab39d492726b680c` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/D1_ORDERS_LOW_USAGE_HEARTBEAT_ROUTE_V1.md` | `bf484cc1f76d55359fddaba34150903fdd83762b` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/SAVE_TIMEOUT_HOTFIX_V3_APPEND_ONLY_SAFE.gs` | `d5d9bceaae31c62716b1c4db602359bf7df95f2c` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/TIMEOUT_HOTFIX_V1_APPEND_ONLY.gs` | `c199f3371724a1b9bcc3435e8917996d6cc53f19` | UNREVIEWED | UNKNOWN |
| `apps-script/patches/TIMEOUT_HOTFIX_V2_APPEND_ONLY_SAFE.gs` | `b751ff3134c2f8b9498932206cdaf0f1102feb2e` | UNREVIEWED | UNKNOWN |
| `attendance-backend-v1.gs` | `0b77ff05442cff00903274679c0b049f3f8c4285` | UNREVIEWED | UNKNOWN |
| `attendance-clockin-backend-v1.gs` | `a153c377da0f7d1997bba4f309a1b076a7ef5df8` | UNREVIEWED | UNKNOWN |
| `attendance-clockin-ui-v1.js` | `05aaa138b4d134d6573dfc810f6c3e2e5685468b` | UNREVIEWED | UNKNOWN |
| `attendance-live-timer-v1.js` | `5ea10dd93112723e86d4884e012778337312a9a6` | UNREVIEWED | UNKNOWN |
| `attendance-v1.js` | `d7f2625aa03c18486069ee274d960adbf8cdcee4` | UNREVIEWED | UNKNOWN |
| `browser-api-transport-v1.js` | `274d99dc7a96a07aea2e5a2eb8d79e1cd487305d` | UNREVIEWED | UNKNOWN |
| `build/apps-script/TrendOS_BACKEND_UNIFIED_V147_CANDIDATE.manifest.json` | `39540d2862a035e426326b13a10c3f46bb097786` | UNREVIEWED | UNKNOWN |
| `cleaning-backend-v1.gs` | `700e03200fc810ffa00240e8a5f8cd33990c2573` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/D1_Full_Migration.gs` | `3cdc01cc078e4e420a047da0427701220b2e4363` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/D1_Normalized_Live_Sync.gs` | `a4ca3139f63c79dad17cf243ddebda8ca786e857` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/D1_Normalized_Live_Sync_V2.gs` | `3fc43cffb6e80c0fe0a05cc439518461ba88eaf0` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/D1_Operational_Enrichment_Live_Sync_02CR.gs` | `77327d52c13071ff705861afe973ca6d311285e6` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/D1_Orders_Live_Sync.gs` | `d115de386ce8e7c58914e2c0d09c2200ec92a4c3` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/D1_Orders_Live_Sync_V2.gs` | `0e0770856fdcad15a478b72a2ec22f2f8455c82b` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/D1_Orders_Low_Usage_Control_V1.gs` | `72aa72b90ddd6c11a27f8ea2501850c8551c24cf` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/D1_Orders_Low_Usage_Heartbeat_V1.gs` | `d4e3b22ca37603e9429ff842e54c857cda339812` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/D1_Orders_Read_Cutover.gs` | `b7dfb52bd0ea311bd99defd20ac08d9935e0b5a9` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/D1_Screen_View_Mirror_Refresh_02CQ.gs` | `f93906ba7146cfea66436f0022c39ec60bcdba42` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/D1_Zero_Idle_Control.gs` | `6c428363d0867dacb4c4353fb33ff0cf7a79086e` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/MIGRATION_V2_STATUS.md` | `92e0a2a2598a9cf56de099a5f4fa9c8152ab0bf6` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/apps-script-importer.gs` | `0a2984e128d14b79250eb4d4427b3591488894bd` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/preview/index.js` | `7bf7b2857cb789f5bba1ab692850aff0a5fb8860` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/preview/production-shadow-preview.mjs` | `f3f124435c3678367dec7aade5aab1db7d71f6fe` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/preview/wrangler.operator-task-v2.toml` | `fed986b1cfbed868c8bd8df72adf280ba1b50861` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/preview/wrangler.toml` | `9b58ee6430b2c5848ba2bfcfc92be8900efad4a8` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/production-shadow/index.js` | `cabf0237c3aea2479b56ab237eeb9877c86254a4` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/production-shadow/observer.mjs` | `72dd06bda31e6f9e2db1bb47c8cccb3b49302fb6` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/production-shadow/wrangler.candidate.toml` | `f4f1a34d0bc32abbc8e283ebe3e50c7eedeb3296` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/production-shadow/wrangler.production-integration-candidate.toml` | `6beaef78daad6eabb57aca17b6c9939b535dc505` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/schema-prep/accounting-finance-v1.sql` | `8d3a76316e7da9b0989dfe88d1abec329aeaa784` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/schema-prep/accounting-operations-v1.sql` | `eebf6b188ef50198222f2272e759259006a8aaa1` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/schema-prep/t12-business-create-candidate-v1.sql` | `d524796ee052162f89c403ea4c74f9e1728aaa11` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/schema-prep/t12-cloud-native-synthetic-create-v1.sql` | `a3aaee2c24aa90f7f54f723a65b2e15185f0e84f` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/schema-prep/t12-order-create-shadow-v1.sql` | `17d89f4cc122ae259207650ff42d15003b46a2f4` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/schema-prep/t12-order-id-authority-v1.sql` | `4fd9eb7cf2c9abc24841cde9c4b6edaebe26a150` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/accounting-capabilities-v1.mjs` | `a8333c5827295a3b364fb8f4805395db85caf5da` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/accounting-contract-v1.mjs` | `7f9185706e529e07cadc5dbed0d8d2585b13c5f7` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/accounting-finance-api-v1.mjs` | `5bfbeff90263a2cb0bec39ea21b9741347c6b89b` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/accounting-finance-core-v1.mjs` | `a9c7cdf197b29ad49ff1ed457dc4fd07b0f1cfe2` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/accounting-finance-safe-v1.mjs` | `28586a2b6b246802310be920e7de09608934737a` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/accounting-foundation-api-v1.mjs` | `444392556c70aef308b90b846606bc87861570c5` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/accounting-foundation-v1.mjs` | `5920f7d45a6b8add3dea9458b76d7b026608cacc` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/accounting-native-module.mjs` | `65ebbbf37a0cff1bc807bd3f434eaf7b1282d05d` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/accounting-operations-read-v1.mjs` | `81e3d05833842ab7507f30ecf873817877297caf` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/accounting-persistence-readiness-v1.mjs` | `ba4b9e5f6863f357ce5a65c8328aefff45b14fe1` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/accounting-persistence-schema-preflight-v1.mjs` | `5786b916f75f964bcd155f23d6c85636a080342b` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/accounting-preview.mjs` | `e09525d9faf1419599ccfd729d8fa2bf1fe21552` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/autonomous-printshop-shadow-v1.mjs` | `98d6d6899645317798871b556ce970d61f276310` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/cloud-auth-shadow-v1.mjs` | `96d1a8ea0925d8594ead3a282757d7f8da723a63` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/cloud-session-bridge-v3.mjs` | `7b9ad0dd88a22251ed4937d85dbd65fc5605cd3c` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/cloud-write-gate.mjs` | `677e1f6c2478a6e225b9d6b75f0aa0e0680331b2` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/cloud-write-order-contract-v2-staging.mjs` | `24c727fa26a97ee4c2a462ee5848d87efb7a97ac` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/cloud-write-order-contract-v2.mjs` | `300004fa0d5aa872bf63f09ef643b42b16edd556` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/cloud-write-order-v2-production-shadow.mjs` | `2a1d675fa2545744412c8d8704e074d0869f0641` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/cloud-write-order-v2-staging-bridge.mjs` | `3840dca854ebce98b9652b0650674a0702f0a533` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/cloud-write-production-reconcile-qualification.mjs` | `5154337c78d5c4074fe2fb6172d83aee69e5f0bf` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/cloud-write-reconcile-core.mjs` | `f48021a301d32e690e0d43f2936b2e412f20f965` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/cloud-write-staging-reconcile.mjs` | `0ca1b848db66f48978c3f77cc6da8b788a4fac5f` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/cloud-write.mjs` | `aa4e62ad5ff3c6324c288f72e6b2a1ee5a5af6d0` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/customer-portal-native-readiness-v0.mjs` | `77dd108c5a229822da6d1625337d1d8989feb0cf` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/customer-portal-order-ownership-audit-v0.mjs` | `e8748f137851e3b415bbceef094e769f49ed94fd` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/customer-portal-password-enrollment-ticket-v0.mjs` | `f4a06fdf0f7ebb82942084e360ee1f7b3617bcd3` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/customer-portal-phone-enrollment-v0.mjs` | `5841468f5875208eb5164c05bd4dee8a12c16e64` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/customer-portal-phone-otp-atomic-sql-v0.mjs` | `7ee3684295bd1a7ccf92b374576e2d237e8bc66e` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/edge-customer-search-v1.mjs` | `35d957a524d5cd262e44a838f3d6a1a307de9917` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/edge-gateway.mjs` | `db88e925cbda3ab9a9597860248a3faffa54a8ac` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/edge-orders-freshness-gate.mjs` | `34fe30371fa94b616a9c6555f40097a3ff26e7d4` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/edge-orders-idle-heartbeat.mjs` | `11fc442d0d7a2ba242f3ee60fe970adec2cc8b78` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/edge-orders-idle-verifier.mjs` | `fbb8e257e61e4d6c54c5079a34f0bc8e63fa2842` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/edge-orders-line-id-repair-02cx.mjs` | `5a1690371008e628746c7b300b150d9a313b8836` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/edge-orders-operational-enrichment-02cr.mjs` | `212bf8db1d0c71c9c8b6e1906b79bcbcce484f10` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/edge-orders-read-02cr-canary.mjs` | `fdc8b426569204e0945a87bca6559f13dd503406` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/edge-orders-read-02cr-freshness.mjs` | `5754ddc481b65465bf997842cef3f41ac14ff0fd` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/edge-orders-read-v1-canary.mjs` | `8e43f6ad7e802f181d1ffe7a2a380020c3c55d4d` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/edge-orders-read-v1.mjs` | `540cca2143e7da940b96d6f990a8951e3b5c87ab` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/edge-orders-service-v1.mjs` | `3108fb8a82dcf6c7ab7bf251ae8e6576c0a73472` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/employee-accounting-native-v1.mjs` | `66440daa0c737966221f5b279a210b4211144d2c` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/employee-auth-native-v1.mjs` | `c01156a965e7de60e7a70d44d86b41b59eb83ded` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/employee-comms-native-v1.mjs` | `f415d06ccd15ba241d679c61b7afeb6ec904e4b8` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/employee-content-native-v1.mjs` | `fab5eeeca0ecc9312380054b32f01a44639f4664` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/employee-core-native-v1.mjs` | `90b8d2d2353b3cbb2d85f8500e54bc64cfc3c82e` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/employee-legacy-bridge-v1.mjs` | `e317c9692970d8f31b2980fa07b692e882911928` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/employee-ops-native-v1.mjs` | `1a6e8c3a42cf9283cf21e0a23b0dec7f51ff710c` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/frontend-static-worker.mjs` | `f30211922a65f39dfcd4fe1ec166f89570f12f43` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/index.js` | `b789a87377b769536f422b991ac5485e58c5c3b2` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/index_v2.js` | `4a555efb4b3f44ba371549d5cec055cc7ce1777f` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/legacy-browser-transport-v1.mjs` | `d3f1407c260c4b623352469372265c01d9bd8ad4` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/mirror-delta-gate.mjs` | `7822080e6f615d34065b0f2bc042c438443431de` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/mirror-gate.mjs` | `d9321c3a9c1678fd7a53abc6a24df73dbee25ebc` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/mirror.js` | `954de2766d83fa58a3908f7d9e37ef688d4faa00` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/normalized-import-gate.mjs` | `116398e82baae83260a5698e4a8e859665a9a68e` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/operator-task-edge-v2.mjs` | `7ef7aa4a52246d6423ccd8c27c9457b76bcc8643` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/r4-guarded-recovery-production.mjs` | `e328a6b336a0a6510c0bef5aebb30ab8b5c61073` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-business-create-candidate.mjs` | `ec6275cb1aab14506e090a758dc09b82140ca92b` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-client-key-continuity-guard.mjs` | `595c8243246d50abe658c00cf7d89376c3ebc750` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-cloud-client-key-admission.mjs` | `ae407895ba6c63692402b0877e4a331a35b8f00e` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-cloud-native-synthetic-create.mjs` | `e68f59dc487d41402f460bacb80117ff5829204e` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-customer-lane-policy.mjs` | `951b6760284eec2a7ffc5de31e308077a9f42635` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-customer-legacy-projection.mjs` | `6b71315184e18e43dfc74be65795ed8b986faab7` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-customer-master.mjs` | `ca12f742d32ebab3d59dccc44e165d71435dd57a` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-customer-write-handler.mjs` | `3e604ac731a53b3c8e00994ba9fd0f32c9da4a69` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-general-create-handler.mjs` | `d8bd8d13f6e69b55839822ddb5e473585e6d8842` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-general-create.mjs` | `06ab0dfee6db7c0480f37d3445da564853ed036d` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-legacy-line-runtime.mjs` | `828389a5c57b2e91b42ad24a6726261a01e5fe4d` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-operational-runtime-handler.mjs` | `1bb1ee6e8eca9b85f20d93394aad699908cc8c80` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-order-create-cutover-state.mjs` | `b08fc160623867a6b386329b348a0fbe2d9b6e4d` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-order-create-input-guard.mjs` | `b5d9d82d7cef37bc96ccf062ed2a7af1ba75311f` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-order-create-preflight.mjs` | `16bf42997e50044aa741286ff926fd5b38b127ef` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-order-create-shadow-intent.mjs` | `17e52b3a1d8f346bd465329c258f6cde647d9ac0` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-order-create-shadow-store.mjs` | `e2f033f42c62ea3d1fbb93755ef13c230ff794f1` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-order-id-authority-candidate.mjs` | `483ee2154fe4b83e6caf2cef03bdd31098ade1c3` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-order-id-seed-evidence.mjs` | `e2880f876c55ed6b241009e3c0e090707b747594` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-production-create-canary-handler.mjs` | `853c234ab85ea00a83a8ced4cec6a0b3cce4cbf5` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-production-create-canary.mjs` | `84d4d6c3b57067d665e52d8142380b23e2c1701e` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-read-overlay-handler.mjs` | `0fc291e51ee832a71bb39cb329e76e916a9ff894` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/src/t12-read-overlay.mjs` | `ef8e9f5d6131486eaf9bd4d61ff23457379f8ba2` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/staging/index.js` | `9093174e2f229694f09d7ccd951b593b814011e8` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/staging/wrangler.toml` | `5fe28e621748ee75391704439d41cad82e8dd3fc` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/order-create-shadow-handler.mjs` | `6f6d551ed6a8512474ec74e4ae4628e3a93d3aac` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/r4-preview-local-entry.mjs` | `0ea39c4cd00e7bf52b3a80683c4a114dccd23d78` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/r4-preview-synthetic-fixture.sql` | `c2b150099312080a4b98000dc9cb1e93f4ac159a` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/r5-orders-periodic-bound-appsscript-candidate.gs` | `fef34f3742262163e9e70941ffcdfdf39d6c677e` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/r5-orders-periodic-guarded-handler-candidate.mjs` | `4f79b574f4dfd9fea271dcf66e963154124450df` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-cloud-native-synthetic-test-worker.mjs` | `abb4c8ca9871b3b3e972af6f6ebb22cd38370659` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-128-packed-cas-batch-isolated-v1.mjs` | `f03c0d7318a41e4afa45a8b7c7cac84707016822` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-128-packed-cas-planner-isolated-v1.mjs` | `55e2e3a236aae8aa7f7577b92874a95e878539f5` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-128-recovery-capacity-envelope-v1.mjs` | `79f60a0e6ae7694a4b78c797c729f4ec134bbf2e` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-142-all-row-preimage-guard-isolated-v1.mjs` | `08dbe8dbc88876ddb907fe58993b793603ea70b0` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-142-chunked-preimage-guard-isolated-v1.mjs` | `ca0a28aca901466094a748c0e59b681328f7808c` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-baseline-shape-diagnostic-readonly-20260919.gs` | `7ab9b3d6dba274a39de358727f415e8a9d280ecb` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-direct-cas-bounded-catchup-20260920.gs` | `ad0e47cdfd3420ed081bf8d1aed42fe038375cc4` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-direct-snapshot-bounded-catchup-draft-20260919.gs` | `de3f8cab480e8b1e77a4e02ce00402146519809e` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-guarded-recovery-batch-v1.mjs` | `6a7cc6e26af9b6b0c45a788986561902dc2c2ba8` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-guarded-recovery-preview-handler-v1.mjs` | `7200cf2935259dbdc6a9ea8bafd7f043aa9e4981` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-mirror-baseline-lineage-readonly-20260919.gs` | `971797bd0e1a0f9786726b4acfb25477e4a88e3f` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-mirror-catalog-readonly-20260919.gs` | `26c2217c44566d6c0aa5f35a46cff8a55f0a7a56` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-one-shot-atomic-full-rebase-20260926.gs` | `80129205329e604b35c03fc1893ee2f2bdc9f91b` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-rows-parity-readonly-20260919.gs` | `75d0099ad63237e75bc887d242a0c2394377a1ec` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-source-baseline-drift-readonly-20260919.gs` | `0a2be65d4c000a851aab29feafd4ce4d73056c6c` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-sync-metadata-readonly-20260919.gs` | `b7b08be658b61e8e2fed27c3d470fe399c302310` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-targeted-recovery-plan-v1.mjs` | `ac6b8acb1cebd724f96b9d6ad878e03af027eb45` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-d1-targeted-recovery-preflight-readonly-20260919.gs` | `16ec0f7014394a2063f90cce547119d4a2e57ec3` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-dashboard-singlefile-test-worker.js` | `354215d9f269f69824e18f194b72cee6ee7fbe84` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-existing-test-mirror-142-readonly-guard-probe-20260926.mjs` | `3baa24a2ff95bc1ddbbe07253e1161e8a8943da5` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-existing-test-mirror-142-remote-dev-worker-20260926.mjs` | `314ac2c0b47debced9a29a80275e4e7694a8c429` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-existing-test-mirror-exact-fixture-readonly-20260924.sql` | `1098d3eaca8427b17c941ecbde17c88cfcc12e3c` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-existing-test-mirror-negative-remote-dev-worker-20260926.mjs` | `ed39d2f88f0bf059d4a3dd72c4e8f33df3b8cd54` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-existing-test-mirror-packed-cas-qualification-isolated-20260924.mjs` | `aad845188c35bc8f1f18a4d9b7e9cf7ea7c0380d` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-existing-test-mirror-packed-cas-qualification-runbook-20260924.md` | `faf482e8798fc5fa2a672c92f969f9b95e8f8122` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-existing-test-mirror-positive-remote-dev-worker-20260926.mjs` | `d8152d0cb40c32c4af298cb3f050a97575739ac7` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-existing-test-mirror-schema-preflight-readonly-20260924.sql` | `f4860dd05b51d7f0d62df1e84e0f0d505d26f91d` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-existing-test-mirror-two-tab-fake-baseline-20260924.sql` | `3e5a28f93e80f5b521c8c1ed4f1b0d589a1d7f6f` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-owner-local-replay-existing-fabricated-order-20260922.ps1` | `9a86c5e603590895d8372a5dc0d1d850e348a5c4` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-owner-local-single-fabricated-order-20260922.ps1` | `909e0fe05a164edd2fc9dcbf3a7e4169a8cb9023` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-production-d1-aggregate-evidence-readonly-20260922.sql` | `9e7341f27162655929219c6a47de3eb0f0111c58` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-replay-existing-key-test-d1-readonly-pre-postflight-20260922.sql` | `f2f767546816d7f6f171600aaf34d4c324063f2b` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-script-properties-quota-audit-readonly.gs` | `42039fc75045bfe388399bda00a169d0cb7ad36d` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-script-properties-replay-backup-sheet-verify-readonly.gs` | `7f00b75e6d8174feb0579953bf3706495e98ab4a` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-script-properties-replay-cleanup-preview.gs` | `73258b81f9ccffe399ff1c45efbd6b6e642c1103` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-script-properties-replay-fixed150-delete-once.gs` | `081cda52f8f2e2bb07ad3bfac9499b3d60142f4e` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-script-properties-replay-private-backup.gs` | `28030fdc0502f903e2f66ce0c9dcc33f381c17d2` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/t12-test-mirror-structure-readonly-20260924.sql` | `8af0f07c433da83990e48908ca4fd04b0b9c2bcb` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/wrangler.r4-preview.local.toml` | `7f9ff871e9302717e25f1cf586393eebc791d680` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/t12-preview/wrangler.t12-synthetic-test.template.toml` | `ab10370086c0ef27747e707f246a43aa01652e96` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/test/cloud-auth-shadow-v1.test.mjs` | `e86d7492448a1ff6af4eccc4ecfe8d84ca1271ef` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/test/cloud-session-bridge-v3-auth-shadow.test.mjs` | `21aff14f4c4475d13e8eb7e523bbbcf19986d52b` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/test/cloud-session-bridge-v3.test.mjs` | `f2de7a07ec2838d75db2b72f6c9b84cd4b1d67ac` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/test/t8-print-live-canonical-parity.mjs` | `c1ade8ee692ba3cb787601eabddc06b109f888d4` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/wrangler.frontend.toml` | `335152e5a70870b7daf7718e295192cf3d686816` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/wrangler.toml` | `579b06e4918a9ed965be183e69742205f03cdc74` | UNREVIEWED | UNKNOWN |
| `config.js` | `8b83d9afd53d9c7fc95d9fb309ec0bfa350121d2` | UNREVIEWED | UNKNOWN |
| `customer-feedback-backend-v1.gs` | `8c35dedebace40ca380979f1f556c021731a0548` | UNREVIEWED | UNKNOWN |
| `customer-feedback-v1.js` | `2426aec33e79f1e16615ad1263fa8244d4742c45` | UNREVIEWED | UNKNOWN |
| `customer-manager-backend-v1932.gs` | `8c645d72abaa68431fe6a0213f3b96af3f27e42f` | UNREVIEWED | UNKNOWN |
| `customer-manager-send-integrity-v1.js` | `c952a64e914fe0434307ed22a41c374e255d0352` | UNREVIEWED | UNKNOWN |
| `customer-manager-v1.js` | `9627116f22f00eb5d7282638c19dbe95d89332f7` | UNREVIEWED | UNKNOWN |
| `customer_manager_d1_bridge_v1934.js` | `23bab89102868770562c147a92a73247560436ae` | UNREVIEWED | UNKNOWN |
| `customer_manager_guard_v1933.js` | `74e6bb5c34c73235ddfbdf40d2c89a9e9b4b01c2` | UNREVIEWED | UNKNOWN |
| `customer_manager_v1933.js` | `be0a6ae7ecd23179053d80e9fd9a149d4a8ecb33` | UNREVIEWED | UNKNOWN |
| `employee-andon-v1.js` | `f06f909b963a720d37eae3b9ffd28a8d10fb434c` | UNREVIEWED | UNKNOWN |
| `employee-api-dispatcher-v1.js` | `78dfb66bf9e37bd4b3b29d5e2905d2198d3c56ee` | UNREVIEWED | UNKNOWN |
| `employee-cleaning-prep-v1.js` | `76a4e492f90ddef8ecb4ea24c5426b9206edec67` | UNREVIEWED | UNKNOWN |
| `employee-manager-strips-drag-v2.js` | `b57c93df48378c588b15b6d6d07b7131a453b09e` | UNREVIEWED | UNKNOWN |
| `employee-manager-strips-v2.js` | `f4697c717f40fc4cb0c8563b8b62640aa2a05785` | UNREVIEWED | UNKNOWN |
| `employee-ops-coach-drag-v1.js` | `8d8056cb17838e6e52beaa45ee6650b1b1f7059d` | UNREVIEWED | UNKNOWN |
| `employee-ops-coach-v1.js` | `1ce5a53852dc2321e9c415807cf129882010d9b3` | UNREVIEWED | UNKNOWN |
| `employee-prayer-prep-v1.js` | `ab375bd8af4e2f22beaccb7ae42e8160cce40c2f` | UNREVIEWED | UNKNOWN |
| `gaber-daily-material-flow-v1.js` | `2826e1e6028d5cbfefafea3890c2709c4227b01f` | UNREVIEWED | UNKNOWN |
| `gaber-easystore-ledger-adapter-v1.js` | `e2916d475c963737cb41b14858e3eefeea773a4f` | UNREVIEWED | UNKNOWN |
| `gaber-ledger-daily-report-v1.js` | `5d1cce2f88e2a06e7f7f928ba89b6442e4e19861` | UNREVIEWED | UNKNOWN |
| `gaber-material-control-v1.js` | `03bb4028bf983dd0a94064ada3094b1b8e307ab0` | UNREVIEWED | UNKNOWN |
| `gaber-material-movement-ledger-v1.js` | `654c897bf199ec8e51ef6c1063bf5eb00b4d94b6` | UNREVIEWED | UNKNOWN |
| `gaber-material-persistence-backend-v1.gs` | `c8890c62e6a230492ceb9499392508a946c18ec5` | UNREVIEWED | UNKNOWN |
| `gaber-material-persistence-v1.js` | `1b57199e529f53e66dd12a28f098c3dba30581a1` | UNREVIEWED | UNKNOWN |
| `gaber-material-ui-backend-v1.gs` | `a3615c1745e0f839c6dc310ce5fac301fefcbabc` | UNREVIEWED | UNKNOWN |
| `gaber-material-ui-v1.js` | `32eefbeaed8f340c3bd4a64e9ece53611f5c9c53` | UNREVIEWED | UNKNOWN |
| `gaber-material-waste-decision-v1.gs` | `c321849222accab379b46a872da94ac09b0a4049` | UNREVIEWED | UNKNOWN |
| `go-live-autopilot-v1.gs` | `78a7fd85d542c6183d9a3787379269a950737c22` | UNREVIEWED | UNKNOWN |
| `go-live-autopilot-v1.js` | `07e79efe9dc2f72d681820355d1044d6a1713db1` | UNREVIEWED | UNKNOWN |
| `hr-backend-v1.gs` | `5c9dca6b65d9aab4e836b6ed3ec314737f848c2d` | UNREVIEWED | UNKNOWN |
| `hr-v1.js` | `002685be3041a2cf4b077e30f344a38981282011` | UNREVIEWED | UNKNOWN |
| `index.html` | `788074c5fb4c3d4db2af9dc0b4dabffe3c34cfc1` | UNREVIEWED | UNKNOWN |
| `manager-center-v1932.js` | `3d83a67f23056e2428b184c29e984fea871627b3` | UNREVIEWED | UNKNOWN |
| `matbagy_theme_v1860.css` | `18971a36b3dfd6743c48115afaf806c11181a101` | UNREVIEWED | UNKNOWN |
| `matbagy_theme_v1860.js` | `5f0b8bdc6ad685dbe2fe922ee3be3461a30c78d8` | UNREVIEWED | UNKNOWN |
| `operations-hub-v1.js` | `6c5220daefeb331c9dd6afd948342780c0dafee7` | UNREVIEWED | UNKNOWN |
| `operator-task-edge-proxy-v2.gs` | `7420d16c5fe789edc69cdb60e720832011cc5587` | UNREVIEWED | UNKNOWN |
| `operator-task-workflow-v2.gs` | `e2ee3c460756eb39d711e93809f1073ca1aa3821` | UNREVIEWED | UNKNOWN |
| `operator-task-workflow-v2.js` | `5877b083903fe3cdf5124744a9c2677edae3f1fd` | UNREVIEWED | UNKNOWN |
| `press-control-backend-v1.gs` | `ba544600f19bd5ea59dbf7efcde9440a0c758b97` | UNREVIEWED | UNKNOWN |
| `press-control-v1.js` | `3a35c53400932052923f2d4372c6b7d9b69a9377` | UNREVIEWED | UNKNOWN |
| `privacy.html` | `d8bf828232b97a1ac743359e241e40edf4ce7962` | UNREVIEWED | UNKNOWN |
| `reset-cache.html` | `ef57179a1a0522db7fca1d72cab796e86fcdd7d3` | UNREVIEWED | UNKNOWN |
| `scripts/a61_diya_session_enroll_canary.sh` | `6e78133077ee59b4cd7d1c3dd4738eac251d5297` | UNREVIEWED | UNKNOWN |
| `scripts/apply_apps_script_cloud_write_dryrun_v150.mjs` | `84fe65f214a832893ee0477d5784df13475a0c71` | UNREVIEWED | UNKNOWN |
| `scripts/entry656_public_health_probe.py` | `4ccbad8ab4a6a39be9f006850d96a840ee4f8bb2` | UNREVIEWED | UNKNOWN |
| `styles.css` | `da463cba976d46fe3a9e28386f1a8f8cb09eac13` | UNREVIEWED | UNKNOWN |
| `tools/TRENDOS_ENTRY499_DIRECT_UPLOAD_README.txt` | `35399bd203e86fcc367e9ce8519d67a4598797e4` | UNREVIEWED | UNKNOWN |
| `tools/TRENDOS_ENTRY546_DIRECT_UPLOAD_README.txt` | `3c0ec90521cb506cccd76e0b333093a955c27ac7` | UNREVIEWED | UNKNOWN |
| `tools/patch_02cv_order_status_ux.py` | `aec31b1d85056d59f23065b9deedf218f6b5c869` | UNREVIEWED | UNKNOWN |
| `tools/patch_02cw_global_counters.py` | `2df140df8c8ef59eedd025e21b559a626c5b8efc` | UNREVIEWED | UNKNOWN |
| `tools/trendos-entry499-direct-upload.cmd` | `7a130ce91e99286d1f5f77fd480464bc4e6aa8b8` | UNREVIEWED | UNKNOWN |
| `tools/trendos-entry499-direct-upload.mjs` | `cc41c15467cb2ba61d124634bc5f6265f14091c7` | UNREVIEWED | UNKNOWN |
| `tools/trendos-entry499-direct-upload.ps1` | `fb7edfd1d823bd60138217340cc6df2cac7c01cf` | UNREVIEWED | UNKNOWN |
| `tools/trendos-entry546-direct-upload.cmd` | `f54fcc78d5b0e09e21947084341eb75ff3304381` | UNREVIEWED | UNKNOWN |
| `tools/trendos-entry546-direct-upload.mjs` | `4c0d8dfef016b5d8f08a87d899387356ced354c2` | UNREVIEWED | UNKNOWN |
| `tools/trendos-entry546-direct-upload.ps1` | `d4ac185bbd68be2f80f76905ce65f885806fee54` | UNREVIEWED | UNKNOWN |
| `tools/trendos-entry579-direct-version-upload.mjs` | `5a0b3f922d25e62612489f6e6bf60ff236deeed3` | UNREVIEWED | UNKNOWN |
| `tools/trendos-entry594-direct-version-upload.mjs` | `dde083547a7e8559d22cadbf89c60a7153065fa5` | UNREVIEWED | UNKNOWN |
| `trend-master-panels-v1931.gs` | `be21b24b23b4c9eb7615c68c2b80c60441f08c14` | UNREVIEWED | UNKNOWN |
| `trend-master-resilience-v1931.js` | `105facf54f263ab2eb2fa1a014afb3651b251232` | UNREVIEWED | UNKNOWN |
| `trendos-andon-integrity-v1.gs` | `6b61b9f0c4cae9bd47a85f59efd7780e95f04765` | UNREVIEWED | UNKNOWN |
| `trendos-attendance-cleaning-integrity-v1.gs` | `fcb0f0aeee0f1f2a676c0af1c96b8b977d750732` | UNREVIEWED | UNKNOWN |
| `trendos-core-p0-registry-writer-v1.gs` | `81e994945af7fefdd38538a7ca569e73483f3d24` | UNREVIEWED | UNKNOWN |
| `trendos-core-p0-remediation-v1.gs` | `d5f7d82f07fe737f6a5d86422e0b8183d67a773d` | UNREVIEWED | UNKNOWN |
| `trendos-edge-orders-read-v1.js` | `8a6f990828e0362a4faccac71a32144a6d9ec3aa` | UNREVIEWED | UNKNOWN |
| `trendos-edge-read-v1.js` | `42fb792345bb83c7a79dce10e70fd3ed38bc5f5a` | UNREVIEWED | UNKNOWN |
| `trendos-handover-ops-integrity-v1.gs` | `4f2301d2101c45cb21ff8466e09cf63849d12cc8` | UNREVIEWED | UNKNOWN |
| `trendos-integrity-dashboard-v1.gs` | `9ce3a4c3e1a11f318a7d1c87b12d6cf0c14aa838` | UNREVIEWED | UNKNOWN |
| `trendos-integrity-router-v1.gs` | `34ae925b35fcf8295a8857dfe587cfa26b48b6b8` | UNREVIEWED | UNKNOWN |
| `trendos-integrity-runtime-tools-v1.gs` | `d9346364c3a7dd6b7f00b70359493e35e03437c6` | UNREVIEWED | UNKNOWN |
| `trendos-integrity-v1.gs` | `1696afc21856946675c621f6a8b05912fea0bc54` | UNREVIEWED | UNKNOWN |
| `trendos-integrity-v1.package.json` | `e1ac0727607ca507e799fb66662099b0575f0c6c` | UNREVIEWED | UNKNOWN |
| `trendos-invoice-integrity-v1.gs` | `18dd8783bbf7bf14531bcf7bf7d870d938d82473` | UNREVIEWED | UNKNOWN |
| `trendos-order-line-integrity-v1.gs` | `23b094a7f85137320ee4ca332f924119eb2767fc` | UNREVIEWED | UNKNOWN |
| `trendos-poll-coordinator-v1.js` | `c5245c62e9af7eb29a480b91cce45f23044f6e6d` | UNREVIEWED | UNKNOWN |
| `trendos-press-integrity-v1.gs` | `e63473445a338179ac50f39cb7d3b82424e30af3` | UNREVIEWED | UNKNOWN |
| `trendos-resume-no-autorefresh-v1.js` | `6b906e25b77c5f933a96a257a3abc11a0fb0ef0c` | UNREVIEWED | UNKNOWN |
| `trendos-return-traffic-quiet-v1.js` | `f75258a481dbb62c101189204caf6a3561432c74` | UNREVIEWED | UNKNOWN |
| `trendos-rp07-legacy-containment-v1.gs` | `47d932c76498593063ea6f0289e9c9a663686b0d` | UNREVIEWED | UNKNOWN |
| `trendos-whatsapp-integrity-v1.gs` | `c3e59c50f17de2604f0192a5b8f651e53caf9018` | UNREVIEWED | UNKNOWN |
| `v1932-router.gs` | `313dfc1eacaa8a5369ff9e0b97a0294a2df5420a` | UNREVIEWED | UNKNOWN |
| `v1940-deploy-health.gs` | `41e57f19de8e865888a1b8bad2cc478c44c438c3` | UNREVIEWED | UNKNOWN |
| `work-queue-backend-v1.gs` | `87a82c18889c1c5533d94ed3f965c875c1533485` | UNREVIEWED | UNKNOWN |
| `work-queue-v1.js` | `12f084f0ec8f3fc86f4034bf65eda726d09dd84a` | UNREVIEWED | UNKNOWN |
| `اقرأني_أولًا.md` | `e09117f3e881b66f7543907315bf1ccefa36b863` | UNREVIEWED | UNKNOWN |
| `الصندوق الاسود.md` | `e2124e39cc21182eb64e0094df4079fcb2647cf9` | UNREVIEWED | UNKNOWN |
| `عقل_فوخا.md` | `f3dbc1c6c64cb9c153d96cb10c66d0188e6332b5` | UNREVIEWED | UNKNOWN |

### CROSS_PROJECT — 3

| المسار عند snapshot | Blob SHA | مستوى مراجعة المحتوى | حالة الإنتاج |
|---|---|---|---|
| `FOKHA_BRAIN/PROMPTS/برومبت_استخراج_المعرفة_والداتا.md` | `6246d04812b34b708b5bf4e1d86e635f56bdd7d6` | UNREVIEWED | UNKNOWN |
| `FOKHA_BRAIN/STANDARD/FOKHA_EXTRACTION_STANDARD.md` | `02471883b78bb31a7b886e550b02e4f807c9496b` | UNREVIEWED | UNKNOWN |
| `FOKHA_BRAIN/اقرأني_أولا.md` | `3ed7ae5c5148f85f974e82717d1394bff2a9283a` | UNREVIEWED | UNKNOWN |

### ACCOUNTING_BOUNDARY — 12

| المسار عند snapshot | Blob SHA | مستوى مراجعة المحتوى | حالة الإنتاج |
|---|---|---|---|
| `accounting/d1-persistence-adapter-v1.js` | `6fd89901e5284613b6fa17271976495b443ace1a` | UNREVIEWED | UNKNOWN |
| `accounting/d1-persistence-adapter-v1.test.js` | `c6c1d62f66dfb8f38f03bf1d11d859cc7bab03cf` | UNREVIEWED | UNKNOWN |
| `accounting/domain-core-v1.js` | `c18388ac16c68a5754b5381c20cfabdcad86dc2d` | UNREVIEWED | UNKNOWN |
| `accounting/domain-core-v1.test.js` | `9e14695b044f77a48ec7a342f5dfa03e71f0c8f2` | UNREVIEWED | UNKNOWN |
| `accounting/memory-persistence-adapter-v1.js` | `ac9ff544263f4c965ce445576219939d674893cc` | UNREVIEWED | UNKNOWN |
| `accounting/memory-persistence-adapter-v1.test.js` | `d3531e2c6b1a346adf6839abca1d0ea5ae31abd5` | UNREVIEWED | UNKNOWN |
| `accounting/persistence-composition-v1.js` | `a45b90f8a9f7854c9a183719c56db77cbc57d26f` | UNREVIEWED | UNKNOWN |
| `accounting/persistence-composition-v1.test.js` | `676adb6a07bf9bd31e47de35d9035302700b89b3` | UNREVIEWED | UNKNOWN |
| `accounting/preview-persistence-caller-v1.js` | `1e0ac10b954e00e3995dfdc3c6049a0a4c17a3d2` | UNREVIEWED | UNKNOWN |
| `accounting/preview-persistence-caller-v1.test.js` | `78dae441f46a1af00466d6ce8ef9227d3129242b` | UNREVIEWED | UNKNOWN |
| `accounting/transaction-contract-v1.js` | `803f90a6c99611f59b084ba04e0bf5cc28d93435` | UNREVIEWED | UNKNOWN |
| `accounting/transaction-contract-v1.test.js` | `331c198e3cad4ff753f0283af51323a910d1b2e3` | UNREVIEWED | UNKNOWN |

### SEPARATE_PROJECT — 233

| المسار عند snapshot | Blob SHA | مستوى مراجعة المحتوى | حالة الإنتاج |
|---|---|---|---|
| `autonomous-printshop/MASTER_BOOK.md` | `e815831ffe439bf49c934da6a36d2ce66b1401c6` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/cloud-design-ingest/worker.mjs` | `7d7e7f1775a5eae27d770acc16d75d1f10990c7f` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/accounting-cloud-cutover-guard-v1.mjs` | `f17c2b022eb384471e5124264f1293a576aad1ad` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/accounting-material-evidence-connector-v1.mjs` | `9e10db2444bb26252d22001dcfaf19ee47cf026c` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/autonomy-event-ledger-v1.mjs` | `cb8b8497d085502140bd87da5c33845139fcd4f7` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/autonomy-policy-v1.mjs` | `6cccf704fc83121fa6c47cd0baa5cd81c5f3864c` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/cloud-order-file-design-artifact-collector-v1.mjs` | `f32589e28f07da01baaecf3344100791463e9363` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/cloud-order-file-design-artifact-command-v1.mjs` | `d184f4e239b2c6ae56acfa05fc5d7411e0bcb91c` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/cloud-order-file-design-discovery-v1.mjs` | `12e0a7ee6c998c0a6dbb750c4effbf7f43d17a71` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/comms-pending-projection-v1.mjs` | `6a4e33446129060cfebfa116b93d57f58720c84b` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/control-tower-last-good-v1.mjs` | `ad04f3c346a34a2ea1a8039d377c6b8163c2aaf7` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/control-tower-panel-status-v1.mjs` | `435d589832debf3e23dabc7f45bc8df586732a2f` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/customer-portal-design-provenance-v1.mjs` | `86ca3b479823eea181dedeb8f182696a666e52d0` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/deadline-risk-projection-v1.mjs` | `95606b41598b5479c15c4759ecb53df8978338d3` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/design-approval-link-v1.mjs` | `ae829bccea3963aa8474f0c57a00f73eb9e4be67` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/design-approval-receipt-v1.mjs` | `f1954bbc01debf46a50fcb00682d0cfdd5accfd7` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/design-asset-linking-v1.mjs` | `5cebdae9393083c03814b7920d7ead5ee3ed74ae` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/design-evidence-command-v1.mjs` | `dffdc5765de24db5b8fc7224555a63d28bfe8e29` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/design-preflight-v1.mjs` | `2800bfe717fbba53444665a03bc6f88caa95d2b5` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/design-production-evidence-v1.mjs` | `00515f9df861321ac86b4b2507534532c34cffc7` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/design-readiness-collector-v1.mjs` | `00784cf20c9df66a77f331035aa7f89c6d591caa` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/design-recipe-selector-v1.mjs` | `4083e019c43dfe18d505224d5c152d05302923b2` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/easystore-material-readonly-connector-v1.mjs` | `8512e056b8c04d40e8b2a2225e30b95ee31018bd` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/employee-blocker-event-writer-v1.mjs` | `02d641331a2338faa3b3a4b87a19ebc7994426d7` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/employee-blocker-events-v1.mjs` | `b303fe3136aea98dee7aa964187685a52f0caa08` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/employee-supervisor-shadow-v1.mjs` | `a14c0464e6e58d168d1bdaea91295e51f5196d6a` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/evidence-acquisition-packet-v1.mjs` | `e8186c7c0b3ad8c32d851154a17407a3b115c061` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/evidence-pilot-target-v1.mjs` | `fc97a44aac6652eae43735438018fc9476891221` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/finance-warning-projection-v1.mjs` | `fc98756b81cbcab7c5f51d4b4856e3ee7eb550c8` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/machine-evidence-command-v1.mjs` | `b969af800bdc09b46952beb2966967582836a840` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/machine-identity-command-v1.mjs` | `aad404c7a026e73f82b5181506e947d118efb289` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/machine-identity-qualification-v1.mjs` | `82cb6ebb39ad46b7398e353aeca4909374c6bad6` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/machine-model-profile-v1.mjs` | `632b3fc2a61fe428162cd38385c843582cb1c57a` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/machine-observation-writer-v1.mjs` | `ca87dd970ccccde4840b31ce8ef80377d23dba7f` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/machine-readiness-v1.mjs` | `7d55363ae738a9b830762e58ff2fcdbb5388aa2c` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/matbagy-design-evidence-connector-v1.mjs` | `02d50431e86ae582634295b06a38ef80d5977fbe` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/material-post-cutover-requalification-v1.mjs` | `d16a4c89d8f2dd738f898127c634d7b05c95dbc2` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/material-readiness-candidate-v2.mjs` | `db5d1379f53503b23de23e429ab36191e15ac420` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/observer-run-ledger-v1.mjs` | `bcb91eba3e3c3d02b4b21d6d2aec7cbce1a5c0bf` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/operational-reality-v1.mjs` | `55fa633edaf86c3234c060b04e3cc0213c80fcc4` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/operator-task-authority-v1.mjs` | `a6423d65c2f5434fcf435e66d232a999bed78b17` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/operator-task-canary-qualification-v1.mjs` | `3615ce1fbb28ed2236560984c1527bfe4f27d3c1` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/owner-exception-model-v1.mjs` | `231bddc9d1f3c57220a40d27be3ed6cba8d28016` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/readiness-evidence-v1.mjs` | `b649555bf8939d26212492b90d0781f2ea7a97d5` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/readiness-evidence-writer-v1.mjs` | `9e546166b548b69c6046d51e32444bb89a15e91c` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/readiness-source-adapters-v1.mjs` | `49452f89f6f97d31e1ac858160796773b8e7bb32` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/structured-design-preflight-command-v1.mjs` | `6de8e5106d032c2325fb7b917ba755d4e1899fa2` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/structured-owner-design-approval-command-v1.mjs` | `b5e3353b392e1291dbc0d33cc92914567ebe5ce7` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/core/trendos-operational-reality-read-adapter-v1.mjs` | `a6df8f81eaa2005dc2ace4f20ff779605ed76f2a` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/dashboard/worker.mjs` | `bc1b5c32881a3d494c6688105b374c76f5a9c352` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/dashboard/wrangler.toml` | `dac66bfbd197461157ec0c2906bec5f4285b6c0c` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/design/DESIGN_RECIPE_CATALOG_V1.json` | `440d6782ce276bcca61eb418c8341e8f47fcd45c` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/employee-supervisor/worker.mjs` | `4fd54b444e28178adbb46dfc7155a81e46bcd0c9` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/employee-supervisor/wrangler.toml` | `9e40a48afdca962a8d90c063d233b5292c9ccad9` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/evidence/AP069_MANAGER_CENTER_TO_OWNER_EXCEPTION_CONSOLE_20261007.md` | `15589fb88f56452e24136de0043f8277160a480b` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/machine/MACHINE_MODEL_CATALOG_V1.json` | `06890f512e8b622bb28ea024a513341b6a39d4e4` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/manifests/AP002_AUTONOMY_ACTION_CLASSIFICATION_SEED_V1.json` | `e6be67147d3941b81713b00460e6556fc5fe3f9b` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/manifests/BUILD_MATRIX_V1.json` | `72c9ad859cdc8ced1a69c2d5a89e15eeaf437216` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/manifests/DESIGN_RECIPE_EXTRACTION_SEED_V1.json` | `079b8aba736342774784382ea19a7902b5ec9f1a` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/manifests/MANAGER_CENTER_MIGRATION_INVENTORY_V1.json` | `a63ab1e54d94371273c4f7a44119feeeb362046c` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/manifests/OPERATIONS_SUPERVISOR_FILTER_V1.json` | `c202c91fe692ac92662d8c7dc72cfaeccea9c564` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/manifests/SOURCE_REGISTRY_V1.json` | `1cc07df9fa1f988b01157db507260742f98e00fc` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/migrations/0019_autonomy_events_v1.sql` | `2dd8c26ffa7eb0a1b7c0c63b5624ccbaef6b446f` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/migrations/0020_operator_task_authority_v1.sql` | `e8afd955df6503a84442346477253511c0158869` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/migrations/0021_t12_order_schedule_v1.sql` | `290db5c77e0ad6225fa722784354d01051b42eb0` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/migrations/0022_t12_order_schedule_maintenance_v1.sql` | `7a7ad533c0bfb09fdafb9f9c000e6c9b96e9a37a` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/migrations/0023_readiness_evidence_v1.sql` | `186deac991b75b6486c7e4919c93570ffdda6f97` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/migrations/0024_design_production_evidence_v1.sql` | `1fabbca8bf4dfcab8fc48d39cdf836bfe5c7d149` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/migrations/0025_design_asset_binding_v1.sql` | `eec4957d6e5daeccd8954ecdfcd714196a19ce06` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/migrations/0026_observer_run_ledger_v1.sql` | `2ff07a8961ae48371783cddc1c8cc18f56812aaa` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/migrations/0027_machine_readiness_v1.sql` | `574696b86b73fd2cf71e15ecc35707e4efbfe972` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/migrations/0028_machine_identity_evidence_v1.sql` | `a08eecbbb7f2840dbc9312ba5f08eb792db50f4f` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/migrations/0029_design_approval_link_v1.sql` | `31d75a25ad2a69a3a99899d8e8ef37efd2e255e2` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/migrations/0029_design_approval_receipt_v1.sql` | `ab1c8305ea9c0cffaf9c5872c28400dfb2639992` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/migrations/0030_employee_supervisor_blocker_events_v1.sql` | `3fea3f6751c1c79c7299ed3dae65788d091e5038` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/observer/worker.mjs` | `0f37f2802dab2a72019e8908a9abbdf7e32bd486` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/observer/wrangler.toml` | `90a6b20b6c27c2829241bc523cc66bdd7cb00119` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/.gitignore` | `e7be113527fd756785b03dc56418a7e10d0652b8` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/README.md` | `296d88ac37930a7cb6e0292300a9b3bca61ce82b` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/WINDOWS.md` | `1b80d49806ba72867f9391ad78bdbfdc09fafaab` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/config/default.json` | `5d4da9d79b7c779f32f7b3c6721caab07f1fb076` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/public/app.js` | `4813a1bcc7354a4840ca85a605877aea0f3ad7ec` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/public/index.html` | `d57c3f9f123edb76708f69eaef5d23d4a3551439` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/public/styles.css` | `d3e6eb6ef0b26b357d10d0098185bf2ff8105b40` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/requirements.txt` | `15af93921dfa2fb1e4723a7339251529a385720c` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/run.py` | `d5db37de2c118ee984ed0407f8840b3c4c5b5518` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/src/__init__.py` | `d0d30665cc1aa693b30925aaa2af8160e430f0ad` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/src/classifier.py` | `5a983e2737b395d591e431c29f78cb77176828ad` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/src/config.py` | `46a526338db882a6e9cdb18ad07850d1728b5d65` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/src/fast_mode.py` | `20d89f24b3673f29216aa7f9ffb427aaeda9fdae` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/src/folders.py` | `cd1424e976a62b6e1478556b0af8040927c7f97d` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/src/local_settings.py` | `ffab0c71b1b31d4abfc0cbf6d7fa1cdb34c27d9e` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/src/platform_bridge.py` | `7321393be0299863483eb7479dc28b1917039036` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/src/preview.py` | `1a5d1d7e4b2566829559d88ad54eb3c1834a58b5` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/src/server.py` | `e92e6851ad147f5ae2bea9659b032c125e1fe70d` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/src/state.py` | `1033e10587b78eb5d75e5debf4d7fd39e32e9542` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/src/trendos_client.py` | `870c1926217c8cb974d9f805d3446a68a4e58cdf` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/src/watcher.py` | `2e56400b4df398131be5f288da80ff45124d1c22` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/start.bat` | `aa34caa309a65fd9e36155245da6e577b31a2984` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/tests/test_fast_mode.py` | `8afe58dad9b9aff8bc6801403a94a047f5063150` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/tests/test_platform_bridge.py` | `fb4cf92ca7d3e969ce02082f812967409b87c378` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/tests/test_print_server.py` | `fafbf2832700cdb0d45bf6b1b4479d1a975a89d7` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/tests/test_storage_settings.py` | `46539b76f5a3e23bcdb0f2ef02f914344931caa5` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/print-server/tests/test_trendos_client_transport.py` | `3265e7852626b78859640772a92a3b3a34b04a16` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/production-shadow/worker.mjs` | `04bc12716c721e3d6c28c885cf67e24ad010f10b` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/production-shadow/wrangler.toml` | `64b312bf86d72267caa18407c6c652a6e9fcef8b` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/readiness-collector/worker.mjs` | `b444c9c9ef863058ac4427acd95bbd9666a6c266` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/readiness-collector/wrangler.toml` | `47dff84593e68ea769cbfc861282985cafe7e848` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/recovered/evaluations/README.md` | `baef424d7650bdcac9a826eba4915f2953c2e580` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/recovered/evaluations/README_CLOUDFLARE.md` | `a6811f8e680834e7b8f755d9d9dd7f7203255fd9` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/recovered/evaluations/RECOVERY_MANIFEST.json` | `c708821e09d662196493b1242110c5506ec2a3f9` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/recovered/evaluations/worker.mjs` | `7fdf65e51347fe957dd0f3daaade7ca1d75c1136` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/recovered/evaluations/worker_with_ui.mjs` | `23b196c1966b1f1761f65492a8b33c0c709f4013` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/easystore/reference/Code.gs` | `b73e22ada3f005edaa2d63036f2edb6fd565954e` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/fokha/NEGATIVE_LEARNING.md` | `5f83825f818b2348cb7f8d4344fc0e14dac45a47` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/fokha/PROJECTS.md` | `3df3be2148bef2fbf4f922231b184d66b444f07b` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/fokha/RULES.md` | `5fe04ec5b2b8d8c4970104847ee5506aa22835b6` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/fokha/THINKING_MODEL.md` | `b6e83a1b2e4699fddf2ce125c7b535e7fc1c9dca` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-evaluations/books/خطة_البنية_التحتية.md` | `5f430bb6fb2e4d58be0823a226566c8d70edd431` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-evaluations/books/سجل_الحالة.md` | `e6e544513c2a0e357f827263e8096962c1ffe434` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-evaluations/books/كتيب_البرنامج_والتنفيذ.md` | `c44bb93749309c8a29c590ad98d4043776a48b17` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-os/books/AI_ROOM_CONTRACT.md` | `89f59fa29f37b457326ca9f81d9f8ea485f5ea26` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-os/books/APPROVAL_COMMAND_ROUTER.md` | `b9649047618d0ab164915248a3e996dc680a2a63` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-os/books/AUTO_PERSISTENCE_POLICY.md` | `0bb22706b2340a016f798ea458d3d21c8859ad1b` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-os/books/CASE_LIFECYCLE_AND_LEARNING.md` | `233448945b44290741c02f59eeef219e1e1f7e5f` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-os/books/DESIGN_CASE_SCHEMA.md` | `2e5ff38a333fc21d28196302c4490c6acc3d5c57` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-os/books/KNOWLEDGE_EXTRACTION_CONTRACT.md` | `49a6dfc93098af8cb14d9041416a135d937fa605` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-os/books/PROJECT_BOOK.md` | `df5546e0ce140a782ac1bae02448b0358aa408f7` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-os/books/ROADMAP_V1_2027-06.md` | `f253c3a9777072570091087d294c94a5da2da113` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-os/books/TENANCY_CONTRACT.md` | `9fcdd3463152437b0436b5e49029c0d6c25f801c` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-os/runtime/cloudflare-worker.mjs` | `0bdf49469ab945cd80064318ac51038e1e229936` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-os/runtime/d1-tenant-store.mjs` | `63fa375bcf60c7c9429df07e06643007138a7b95` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-os/runtime/live-providers.mjs` | `5a09d3b086523dfd93738cb7ca04051613b92b07` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-os/runtime/orchestrator-core.mjs` | `7829d8a8b465dd1666943454e5735afc6896e984` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-os/runtime/orchestrator-runtime.mjs` | `e388223c984cca35cb34e7b20a2c20a660bc5bcf` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/matbagy-os/runtime/permissions.mjs` | `fb3719e76d4a6a25c43fcc0d8a0cc1601cd8e52f` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/books/WHATS_AGENT_BOOK.md` | `406c5be0fccb959fc8ab0bebba2123da01682506` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/control-tower/go-live-autopilot-v1.js` | `07e79efe9dc2f72d681820355d1044d6a1713db1` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/control-tower/manager-center-v1932.js` | `d15220375ec88551f96386a5aaff17d660a1f9f1` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/control-tower/trend-master-resilience-v1931.js` | `105facf54f263ab2eb2fa1a014afb3651b251232` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/control-tower/trendos-integrity-dashboard-v1.gs` | `9ce3a4c3e1a11f318a7d1c87b12d6cf0c14aa838` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/control-tower/v1940-deploy-health.gs` | `41e57f19de8e865888a1b8bad2cc478c44c438c3` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/customer-comms/customer-feedback-v1.js` | `2426aec33e79f1e16615ad1263fa8244d4742c45` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/customer-comms/customer-manager-backend-v1932.gs` | `8c645d72abaa68431fe6a0213f3b96af3f27e42f` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/customer-comms/customer-manager-send-integrity-v1.js` | `c952a64e914fe0434307ed22a41c374e255d0352` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/customer-comms/customer-manager-v1.js` | `9627116f22f00eb5d7282638c19dbe95d89332f7` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/customer-comms/trendos-whatsapp-integrity-v1.gs` | `c3e59c50f17de2604f0192a5b8f651e53caf9018` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/employee-supervisor/employee-andon-v1.js` | `ca0e57973b6547735333ab2a5d8a1e118a4efcac` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/employee-supervisor/employee-manager-strips-v2.js` | `f4697c717f40fc4cb0c8563b8b62640aa2a05785` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/employee-supervisor/employee-ops-coach-v1.js` | `1ce5a53852dc2321e9c415807cf129882010d9b3` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/employee-supervisor/operations-hub-v1.js` | `6c5220daefeb331c9dd6afd948342780c0dafee7` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/lineage/AI_ORDERS_VIEW_V1890_EXTRACT.md` | `85fbeba5b66816b478e53c6ffc5adb06a3879078` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/lineage/WORK_QUEUE_V1_SUPERSEDED.md` | `3b8889d96a00d7f9300a1c3146cd78de10886952` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/machine-agent/press-control-backend-v1.gs` | `ba544600f19bd5ea59dbf7efcde9440a0c758b97` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/machine-agent/press-control-v1.js` | `3a35c53400932052923f2d4372c6b7d9b69a9377` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/material-control/gaber-daily-material-flow-v1.js` | `2826e1e6028d5cbfefafea3890c2709c4227b01f` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/material-control/gaber-easystore-ledger-adapter-v1.js` | `e2916d475c963737cb41b14858e3eefeea773a4f` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/material-control/gaber-ledger-daily-report-v1.js` | `5d1cce2f88e2a06e7f7f928ba89b6442e4e19861` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/material-control/gaber-material-control-v1.js` | `03bb4028bf983dd0a94064ada3094b1b8e307ab0` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/material-control/gaber-material-movement-ledger-v1.js` | `654c897bf199ec8e51ef6c1063bf5eb00b4d94b6` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/material-control/gaber-material-persistence-backend-v1.gs` | `c8890c62e6a230492ceb9499392508a946c18ec5` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/material-control/gaber-material-persistence-v1.js` | `1b57199e529f53e66dd12a28f098c3dba30581a1` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/material-control/gaber-material-ui-backend-v1.gs` | `a3615c1745e0f839c6dc310ce5fac301fefcbabc` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/material-control/gaber-material-ui-v1.js` | `32eefbeaed8f340c3bd4a64e9ece53611f5c9c53` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/material-control/gaber-material-waste-decision-v1.gs` | `c321849222accab379b46a872da94ac09b0a4049` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/operator-task/OPERATOR_TASK_WORKFLOW_V2_CANDIDATE.md` | `9a2df860c870f6ec797e36253ee5fce1087a37f2` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/operator-task/operator-task-edge-v2.mjs` | `7ef7aa4a52246d6423ccd8c27c9457b76bcc8643` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/operator-task/operator-task-workflow-v2.gs` | `e2ee3c460756eb39d711e93809f1073ca1aa3821` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/sources/trendos/operator-task/operator-task-workflow-v2.js` | `5877b083903fe3cdf5124744a9c2677edae3f1fd` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/accounting_cloud_cutover_guard_v1.test.mjs` | `5c5c2a5fd41c049c05b5dda35b15a1bda5c0947f` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/accounting_material_evidence_connector_v1.test.mjs` | `8d49fa569e2048597e222d72610f68de7515338e` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/autonomous_printshop_shadow_route_v1.test.mjs` | `7f39425a2aac27217888528594a1dc475c73087e` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/cloud_design_artifact_diagnostic_workflow_v1.test.mjs` | `05137c697d07bf8169f93371b30f5b263087678d` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/cloud_design_discovery_workflow_v1.test.mjs` | `0bca9991892eeb119fa56bb7a1b67932eaf78a12` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/cloud_order_file_design_artifact_collector_v1.test.mjs` | `c25b5238d849da741cea242dd982ee9692c8f8f9` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/cloud_order_file_design_artifact_command_v1.test.mjs` | `4828bb15b49f9a127b792f333432b9cb07d2534d` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/cloud_order_file_design_discovery_v1.test.mjs` | `3f6d0300331dd57cf062c5ce171f3f2ed82974c1` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/comms_pending_projection_v1.test.mjs` | `77bb3274e6a45bed30ebf89c41615f5d539076cf` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/control_tower_last_good_v1.test.mjs` | `257e665099cccb858bd52b62a2efdb0675b6bea9` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/control_tower_panel_status_v1.test.mjs` | `9577f5f951839529280b4ed00fd4d3d30f92349e` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/customer_portal_design_provenance_v1.test.mjs` | `f390c8ce6b777c98b21c9b9cef08151d9916e254` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/dashboard_last_good_v1.test.mjs` | `bcaf607ca1fb293870c7293482305151757ba25d` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/dashboard_panel_status_v1.test.mjs` | `12373042fe54a9d50b7159e3eec6c628024020c8` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/dashboard_v1.test.mjs` | `49321050307f5eab9a6a016b4c8b78a28990209d` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/deadline_risk_projection_v1.test.mjs` | `8604b866790accac07dc70d952300df7feea01a4` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/design_approval_link_v1.test.mjs` | `a1ddb40320566af33c9534291dc76ffffefe071d` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/design_approval_receipt_schema_workflow_v1.test.mjs` | `c181e979ee8341cf4969dc15554d1a03ce75de35` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/design_approval_receipt_v1.test.mjs` | `0ff3afb446df5387172f0c2c044d201a0967f575` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/design_asset_linking_v1.test.mjs` | `966fadc5e7879d7992093edf7727f8530a6c1578` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/design_evidence_command_v1.test.mjs` | `8e9af2a087fcb91b07df0848f5edc685be17b1f7` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/design_evidence_manual_workflow_v1.test.mjs` | `6efd98e65347aee5a3a557465abcee3b3db4f9b4` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/design_preflight_v1.test.mjs` | `b98ce3ede310c048bddf031f80d544c4274a0483` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/design_production_evidence_v1.test.mjs` | `e0ecd30d3ca72f5578c374784ab8c1f39401a028` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/design_readiness_collector_v1.test.mjs` | `7725a8bcb7b516cfb1fd6636ff3a78109d5f0c26` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/design_recipe_selector_v1.test.mjs` | `ceed046bc2498a5b89cd9dccfc8e73442b04a343` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/easystore_material_readonly_connector_v1.test.mjs` | `3a8b678decaac99784ff3514e851212b046b85cc` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/employee_blocker_events_v1.test.mjs` | `0a17bf5a9b203db3c87ef77cc7352d6c0568d1fb` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/employee_supervisor_service_v1.test.mjs` | `cddd328646e6ca0e393b5c49aa5b48bf3ad7aa83` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/employee_supervisor_shadow_activation_v1.test.mjs` | `c367834fff9f0196a9a54eb7438914b3a1032f45` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/employee_supervisor_shadow_v1.test.mjs` | `a37ec4d369bd3afe4e52e1b51fcdf7e42fd56a85` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/evidence_acquisition_packet_v1.test.mjs` | `0c7817afa1032f10474f324ed9c1d8d5c0ebf966` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/evidence_pilot_target_v1.test.mjs` | `05629f17b829cbf696189fa179c81e7b05efd715` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/finance_warning_projection_v1.test.mjs` | `8596c98c3e3786ad46296e056e9e5e417251668d` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/machine_evidence_command_v1.test.mjs` | `fe618fae890af1c7968976d36707c8631cc656f5` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/machine_evidence_manual_workflow_v1.test.mjs` | `726ff4c1bebdab54ac78c9d5d310accb19d26747` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/machine_identity_qualification_v1.test.mjs` | `9b807dd654aa8a9975c2576fc8581621ec253f8f` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/machine_model_profile_v1.test.mjs` | `ba62a65ee9df847e26822588c4dc5e9199695008` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/machine_observation_writer_v1.test.mjs` | `63c28f0d4822d2c994b7e7588625ef4c1c565aed` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/machine_readiness_v1.test.mjs` | `0c45b45597eaa84e1baaff827806a571c9cc2edd` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/matbagy_design_evidence_connector_v1.test.mjs` | `ff900b10c3e4316f720e6f07320cac5611a0e701` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/material_post_cutover_diagnostic_workflow_v1.test.mjs` | `7c295212c6e0af80a9164c745d596792f22d0e04` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/material_post_cutover_requalification_v1.test.mjs` | `49b65913cba492109d9404677c617cbf5765fa31` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/material_readiness_candidate_v2.test.mjs` | `42ebe277a8e664ecf0beaaf6c0d5de27b039db20` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/observer_run_ledger_v1.test.mjs` | `2e0fcfc7522576a8eb5fcdfc09211afd0e858201` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/operational_reality_v1.test.mjs` | `5743de31e33f5974095bdec62a32a395ee27344f` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/operator_task_authority_v1.test.mjs` | `36e2e105f1dac6fe7675e64ef01779171cf994bc` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/operator_task_canary_qualification_v1.test.mjs` | `a8ed6f93d2365f69edd22bdbb0307c8c8e730b1e` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/owner_exception_model_v1.test.mjs` | `e7379275419d816ca74bfc617657a468763cff04` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/production_shadow_worker_v1.test.mjs` | `aed7be3d6f3feee5148a2ce3ad9f6529b78ca73e` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/readiness_collector_v1.test.mjs` | `d9bc5b9a60922ee0470977a8176fdac7f43eabe5` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/readiness_evidence_v1.test.mjs` | `c9ae77c823f3d139eb62b59411e4e9f05bfdd4d8` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/readiness_evidence_writer_v1.test.mjs` | `a0d60270f2a775edd7af4a793edb0ebfcd7a8758` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/readiness_source_adapters_v1.test.mjs` | `f899ebab8a0fc2ccd1871983b015492a5f13ce4b` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/shadow_observer_v1.test.mjs` | `b1cf61fd161b6a4a7d5e964f1c71d4fe9f45af50` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/structured_design_preflight_command_v1.test.mjs` | `9f9006ba57b489d8168a0c29653b4cf96c1c86e1` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/structured_design_preflight_workflow_v1.test.mjs` | `7a509dba4f36d9fa54588953fffd4d273fcaf140` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/structured_owner_design_approval_command_v1.test.mjs` | `d7490451cafba08901501c12c4a571f8080cb78a` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/structured_owner_design_approval_workflow_v1.test.mjs` | `bfc5808fac6ff80f7147a7bd1579eab517aa2fd4` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/t12_order_schedule_maintenance_v1.test.mjs` | `46df711a72038a8a3a8327e72dba2d22bf774b2e` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/t12_order_schedule_v1.test.mjs` | `796e2adb4bff214ed07ecb66fc2ee9c9ab7e499b` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/trendos_autonomy_event_ledger_v1.test.mjs` | `37f5de3793e125a502ea246e03e5d9291c932164` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/trendos_autonomy_policy_v1.test.mjs` | `87c0b81045f69712ee470e0f0cebd53768fb8c85` | UNREVIEWED | UNKNOWN |
| `autonomous-printshop/tests/trendos_operational_reality_read_adapter_v1.test.mjs` | `3d51a281e07f5e858fd574fc403495b8eb7462f2` | UNREVIEWED | UNKNOWN |

### MIGRATION_FILE_NOT_ACTIVE_PROOF — 29

| المسار عند snapshot | Blob SHA | مستوى مراجعة المحتوى | حالة الإنتاج |
|---|---|---|---|
| `cloudflare-d1/migrations/0001_init.sql` | `49c58dd275f8364d0632fabd669ef48b562ea895` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0002_full_sheet_mirror.sql` | `1857534062b93eb24adbacdf7d3234bcaae69384` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0003_cloud_write_lane.sql` | `b4c81348f9b1e79519130033b5b1dffcc86eaa0b` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0004_cloud_auth_shadow_v1.sql` | `e514e4675a89c9eb801e4bfd971d640c6f6a01df` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0005_t12_production_create_canary.sql` | `95224bb1afa50a6344fd0cf755a40d20ca7b9a6a` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0006_t12_operational_runtime.sql` | `b2e3431f5132872658d81f065624b0a6e69da2ac` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0007_t12_general_create_control.sql` | `b21d0f63c6b7bfe5dce3fdc377d9dc8e6170b6af` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0008_t12_customer_master.sql` | `c638b2afca70471c9916d6f644111cdce1157b45` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0009_employee_auth_native_v1.sql` | `20739798d691286b47918299c099049cbcf50c46` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0010_t12_duplicate_order_guard.sql` | `b1a77430716a78bac85910138e40b0dea72291b2` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0011_t12_legacy_line_runtime.sql` | `d7e7396487379babe2fd1a72c709225f17b20116` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0012_employee_ops_zero_google_v1.sql` | `85ddcbfeaa0e3baffa085fda68be2f4fb23cc8e5` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0012_t12_customer_lane_claim.sql` | `6ca22920f19edabbee880a44fca04f625f61b08f` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0013_employee_content_zero_google_v1.sql` | `95f223f2da169b249b4df28c19c770c77fc836eb` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0014_employee_comms_zero_google_v1.sql` | `58454cf463d8361ae61ebc9ff824ce5f75d04b52` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0015_employee_accounting_zero_google_v1.sql` | `203e7c740369f84591cf421b4ae745c86382a22c` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0016_employee_core_zero_google_v1.sql` | `eb8582c21d7d338df8af411edb464e9e53dbbe32` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0017_employee_core_current_orders_v1.sql` | `59f0a1ff5481093a527d807db35aa6ef467d5591` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0018_zero_google_backfill_retention_v1.sql` | `fba919955de0e49b0018325183ebae871cf85e94` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0020_employee_accounting_party_master_v1.sql` | `02ed05259c5c31a0b0645a3a82690e64d353e165` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0021_employee_accounting_material_dimensions_v1.sql` | `49987f61ccf8cda8a96e5247156fedccbc6fcab0` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0022_employee_accounting_day_ops_v1.sql` | `288e21abc7565086085944cd87b79672cf9b1fda` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0023_employee_accounting_command_audit_v1.sql` | `5ba3f1ebcaabba9866fde486804eaa7f9166824d` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0024_employee_accounting_party_balances_v1.sql` | `9e282d0649e0f7f354b856753aaad7605efd75d5` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0031_employee_order_conversation_file_hash_v1.sql` | `55608ef695821a7ae3b347ac8cf6acb2437b99b3` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0032_customer_portal_identity_foundation_v1.sql` | `8d38e4b1059a9a1a31a214e877d2cc56e7c6a7d0` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0033_customer_portal_native_order_ownership_v1.sql` | `2852c998fd5997f8f7dcad21b81e0878530edeb2` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0034_customer_portal_phone_otp_enrollment_v1.sql` | `5eeee6232cb749e7cb6ab04889a861d147b6d590` | UNREVIEWED | UNKNOWN |
| `cloudflare-d1/migrations/0035_customer_portal_otp_enrollment_ticket_v1.sql` | `86cec2bcbdf23ec231a48e0ca3c91f60c0db3889` | UNREVIEWED | UNKNOWN |

### DOCUMENTATION_OR_HISTORY — 762

| المسار عند snapshot | Blob SHA | مستوى مراجعة المحتوى | حالة الإنتاج |
|---|---|---|---|
| `docs/archive/trendos-master-book/2026-09-24/APPS_SCRIPT_DEPLOY_V1940.md` | `49f0fafea76184832942f4b4861b6f5699442796` | UNREVIEWED | UNKNOWN |
| `docs/archive/trendos-master-book/2026-09-24/CLOUD_MIGRATION_V3_T11_COMPLETE_HANDOFF_2026-09-14.md` | `9112278963fb823e5e54c9cccf67addbe244139a` | UNREVIEWED | UNKNOWN |
| `docs/archive/trendos-master-book/2026-09-24/CLOUD_MIGRATION_V3_T11_CURRENT_HANDOFF_2026-09-14.md` | `7df1f1e16094ceadcecacc4554aefd78d22bbcd8` | UNREVIEWED | UNKNOWN |
| `docs/archive/trendos-master-book/2026-09-24/CLOUD_MIGRATION_V3_T12_CURRENT_HANDOFF_2026-09-19.md` | `89662d847d1950d4176864e9899942f033d6e07c` | UNREVIEWED | UNKNOWN |
| `docs/archive/trendos-master-book/2026-09-24/CLOUD_MIGRATION_V3_T12_TEST_CLOUDFLARE_OWNER_STOP_HANDOFF_2026-09-21.md` | `aad521382a8a4050322add78bea9044d6abba0f4` | UNREVIEWED | UNKNOWN |
| `docs/archive/trendos-master-book/2026-09-24/README_V1931.md` | `e7f72eae437e4421938b7317d19db89e1fb49c28` | UNREVIEWED | UNKNOWN |
| `docs/archive/trendos-master-book/2026-09-24/TRENDOS_BLACKBOX_2026-09-13_RP07_FINAL_HEALTH_PASS_CLOSED.md` | `4388bcd61fc4bc77b14ff1dce76c5bdf943f1206` | UNREVIEWED | UNKNOWN |
| `docs/archive/trendos-master-book/2026-09-24/TRENDOS_BLACKBOX_2026-09-13_T6B_CLOUD_AUTH_SHADOW_CANARY_PASS.md` | `ee8b3f56de90097c2c2e75c185ac6059dacdcb24` | UNREVIEWED | UNKNOWN |
| `docs/archive/trendos-master-book/2026-09-24/TRENDOS_GO_LIVE_2026-09-01_MASTER.md` | `f102a1ef8b70d4858712cde4e225d5324b58e2b0` | UNREVIEWED | UNKNOWN |
| `docs/archive/trendos-master-book/2026-09-24/TRENDOS_T12_NEW_CHAT_HANDOFF_AFTER_EXACT_KEY_REPLAY_2026-09-22.md` | `fd4eaf2f31a062e1287b6b0ab969e611758f234b` | UNREVIEWED | UNKNOWN |
| `docs/archive/trendos-master-book/2026-09-24/V1932_RELEASE.md` | `36e65aa067cc6b65dbef49cb2927eb40a6b2c794` | UNREVIEWED | UNKNOWN |
| `docs/trendos/MATBAGY_DRIVE_PROJECT_STRUCTURE.md` | `72447329ea16614d0e6b0a5f07392ad0531afe86` | UNREVIEWED | UNKNOWN |
| `docs/trendos/MATBAGY_KNOWLEDGE_EXTRACTION_ARCHITECTURE.md` | `1ba58c1a388f338bcdd408bf23161f0ec7e24506` | UNREVIEWED | UNKNOWN |
| `docs/trendos/MATBAGY_MULTI_AI_ROOM_ARCHITECTURE.md` | `f4ac865c1b06ac3e7f06dc8f3efa68dedc9aa863` | UNREVIEWED | UNKNOWN |
| `docs/trendos/PERF_CF_02D_APPS_SCRIPT_SYNC_ACTIVATION_RUNBOOK.md` | `a2f0ced43416cb0e2c1853a92b8a089152f2e85c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_ACCOUNTING_FULL_REVIEW_2026-09-04.md` | `783444a1f60b38829aa9d1c3e7cdb57ee3a32899` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_ARCHITECTURE.md` | `ff8d3a65e3ffa684218f6c3a46f70d44b998e951` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_ARCHIVE_DOC_CATALOG.md` | `48ada67eb37acfed5943784d01f21f88954573a9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_BACKLOG.md` | `2567d0787bea204cf1bd33431f5292b39a08ed86` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_CORE_P0_REMEDIATION_PLAN.md` | `13e4c09e4eeaf809c0ca07b7c32a37912bbc2ecb` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_DECISIONS.md` | `6408bbd46a64f4c0212d653ded1bd3cd23517a63` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_DOC_CATALOG.md` | `9aa23b82f7ca0f2575ef62785f6a23b365dd2a89` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_ENGINEERING_MAP.md` | `54807f90fde6ad69a427c828793bb467801f6de0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_EXECUTION_LEDGER.md` | `c6c6bb00a22b49740f464596c82d511a6acd0ca9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_EXECUTION_LEDGER_APPEND_2026-09-04_PERF_CF_02A_02E.md` | `990c7c64c0e33e9895a7a27da4c269d32851e4da` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_HANDOFF.md` | `37c36bab49d43becb466d60ce1b56c00196e9b77` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_INTEGRITY_V1_CHECKPOINT.md` | `7ce1ab574a5dae941ffc105b1ec69768df586371` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_INTEGRITY_V1_DEPLOY_MANIFEST.md` | `0f440efd25bba8e4dbb8fb3d4e4c05a9dacd03ba` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_INTEGRITY_V1_REGRESSION_COVERAGE.md` | `db6175811fd6df6d207093c55ec7c179743aab2c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_PENDING_MODIFICATIONS.md` | `4847cc1935c869ca40f14f4c3daef47024d10cb4` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_PROJECT_MEMORY.md` | `15cb90ceb8b4e08d11f5ea90b6bb9e3672ef3bb1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_REPOSITORY_CATALOG.md` | `7f54f9bd9830ba39b71aba81bef15d3ab791c821` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_ROADMAP_2027-03-01.md` | `958fd0b989c7f060503dfbf932e43462821842ec` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_TEST_CATALOG.md` | `ac4dc79ccc280b9809e8783ec06a8e7965e3afab` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_TEST_MATRIX.md` | `6603c21f484ec02b5acae367dce7c0025eccaed9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_WORKFLOW_CATALOG.md` | `428778c24c350ab3c4985aa26fcb25ea6e8fb130` | UNREVIEWED | UNKNOWN |
| `docs/trendos/TRENDOS_WORKLOG.md` | `a548dd9d9028a2f678420702d8086581690f8b80` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/ACCOUNTING_CF_02S_SCHEMA_GAP_BASELINE_RUNTIME_WIRED_2026-09-05.md` | `0c90bdf0d67bd113d256e23e0069fa72a2678a3b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/ACCOUNTING_F2_PREVIEW_CALLER_NATIVE_CI_WIRING_2026-09-05.md` | `f065ce9598f5d1ff26743bcc1e0b0f1bbf25deeb` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/EasyStore/EASYSTORE_BLACKBOX.md` | `8108cfbe87cf13afb03b01d68284457728db2502` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/EasyStore/README.md` | `627113ca33a09d7c02cb925c6c80153bde095212` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_BACKEND_UNIFICATION_HANDOFF.md` | `04d91cecc756d5cde44d684c1118f122fd97442f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AA_02AF.md` | `5c6eebf7db5f3b577b0031397c10cafe32b94994` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AG.md` | `1e6d4b24976e8f30689fd924ae846a9517c239d5` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AH.md` | `f6bd3bd004061e84f019202190fd44b08938a0a3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AI_02AJ.md` | `9eef808e256e8607f79dc6adeaf1a2bdc9d51d03` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AK_02AL.md` | `d11288f25b17002a754dde8908fe78d7f046ea66` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AM.md` | `426cd78c793261a7c8395ef5a654621421fb8109` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AN_02AP.md` | `3b7189726c9b1f196f1fc9c78deea9976508c782` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AR.md` | `52cce18f7242051b36ad5cfce209bede311ecf02` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AS.md` | `3b2704d09687d257f430bf6193b7d2fd3f28de1d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AT.md` | `ab69b48eb2d98d78a49b494b91f4997ddafe6076` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AU.md` | `f37b669ac18fd2d9ec6080553f3a84fb8426036f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AV.md` | `fdcbc05b44f5ddeeaccbc80af42ba90d3bb64f02` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AW.md` | `5f4d3f59f50b0dcccd155681ee5f6ee9075bc9bd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AX.md` | `8cb2a706bd237b09939c284e182723dc769057a4` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AY.md` | `e7eeba83f7b73c38135ad78d7d042f67f3388011` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AZ.md` | `cadb023628c6f674f5ec61b35d9a101227992dde` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BA.md` | `4dc870386934688eaab4338452e44a30526bd214` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BB.md` | `b74b8d8b81ce2ebc564c3d0dca2c8c0bda83dadf` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BC.md` | `e43f0a0f06a4cf86841a5be7dde479804bce00d3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BD.md` | `288f97d3f17b1b0c486e6641d15b2968d258855b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BE.md` | `d3d731650000ee117954f29b530ed47d6edf93d9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BF.md` | `577dff1e595f1b14033261b0cc3cec02d448294c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BG.md` | `ff9a0c546745713718b1805ba8e969f3a64f9268` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02R.md` | `aa75e3f3fc98dc4cda7fb11bdb08b008bd62d1aa` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02S_02T.md` | `5e74672ddf0be7d9030651e3ad186939320c279d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02U.md` | `664aa5262d9d028f968a4b9946499993584c5da3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02V.md` | `8acaa7a0ede806f7ea4100ba50ba284aa0e26ce1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02W.md` | `c1cdcdcde4f7f766609eefd532b72a1a2a03994a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02H_RUNTIME_CI_PROOF_START.md` | `d50a596f7c9c6d9452d9c430110e07cd40ffaad7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02I_CHECKPOINT_START.md` | `0955b775fb7589aba97d13d4c1d1723b81ea5726` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02I_CI_PROOF_START.md` | `6a97e88fa0776a47fae6ad65391c2b506ab19ec6` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02I_NATIVE_CI_WIRING_START.md` | `5d7a2a2f8e41fa68bd3198428db686155f40f303` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02I_PERSISTENCE_READINESS_START.md` | `3902e369d7f58b37fcd01274a3f16335d98e2cf5` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02I_PERSISTENCE_READINESS_TEST_START.md` | `2d67a9b7041914bf80535b325690226ffca65d6f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02J_CHECKPOINT_START.md` | `cffc7d3073f8b477a6d8129b983d2a60d092543d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02J_CI_PROOF_START.md` | `52977d1af8b16ded123c43cff6f2c1a7554c5f33` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02J_DIAGNOSTIC_ROUTE_ADJUSTMENT.md` | `d62a1cfa6c01c4a9af0cf15d8d8489b1cf52dce2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02J_NATIVE_CI_WIRING_START.md` | `cfa5e6f0a4d58a7dd7d3884210fe97549b64c2de` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02J_RUNTIME_DIAGNOSTIC_TEST_START.md` | `5f461adc0c2ab8b8fe633b1b5870ed96d7b97aae` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02J_RUNTIME_READINESS_DIAGNOSTIC_START.md` | `0a4c32c73121a798ef806dd419984b4b35e36d93` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02K_CHECKPOINT_START.md` | `909bb09c48ae8caffe8bb2c0680812a285072f2f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02K_LIVE_READINESS_PROBE_START.md` | `8e11f6196e0eadef454c71e0197af481687c51d2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02L_CHECKPOINT_START.md` | `627ac007eaf94992ee83b7785d8da063e30e726d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02L_CI_PROOF_START.md` | `bcbcf8d2a6433daad5ba705c45ece640662019fd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02L_NATIVE_CI_WIRING_START.md` | `5f97f71e075f0d00277ca633abb812ff521683fe` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02L_SCHEMA_PREFLIGHT_START.md` | `1c47ca7d0d7b0cad2c9ad031741dc77c1eabd5b9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02L_SCHEMA_PREFLIGHT_TEST_START.md` | `9bbaa1e084bb55102557286d956d10cfe939512c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02M_RUNTIME_SCHEMA_PREFLIGHT_ENDPOINT.md` | `443c9eb8b50d48e2bf852b9a329b4592ce76f2b4` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02M_RUNTIME_SCHEMA_PREFLIGHT_START.md` | `25415baa8cd09e80073e37ce8750c35fd1a11ae0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02M_RUNTIME_SCHEMA_PREFLIGHT_TEST_START.md` | `9b54638dd88f17d084494b9114ce05df20ed73b1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02N_CHECKPOINT_START.md` | `85fc01cf32eb2d755d3885da03bb85ab58ea4c20` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02N_LIVE_SCHEMA_PREFLIGHT_PROBE_START.md` | `0ccc4a859a477ac0686af1f3c353b87966ad4e84` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02N_RUNTIME_PROOF_START.md` | `94ccd2e17ffaa616a905d118a61f2e3b961a9080` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02O_D1_ACCOUNT_DISCOVERY_WORKFLOW_START.md` | `e69d8b2dc9dece378d3f1c31f9a479956f11d490` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02O_DISCOVERY_RESULT_CAPTURE_START.md` | `385248bb93a8f82c0ba933d1f37d38bbd5a0b19d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02O_ISOLATED_PREVIEW_D1_DISCOVERY_START.md` | `b12115a51e14a6802caee534a9cb2ba4d07443f5` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02P_COMPLETE.md` | `def32b3219124c73ca63ab88e2702be337ed7e4b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02P_CREATE_FAILURE_DIAGNOSIS_START.md` | `ffde65aa89fed004595bb611d11e06f37bd05c89` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02P_ISOLATED_D1_CREATED.md` | `28adb0c1fb6b89afc5c04a4d681c72f9659490f0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02P_ISOLATED_D1_CREATE_START.md` | `9ef901a9a94ca0b0437aadd7a4ced8c9434da8d5` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02P_REST_CREATE_DIAGNOSTIC_START.md` | `49499f779d2a4dca102ce95a51c58a8ec4d323b0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02P_SCOPE_ASSERTION_FINAL_FIX_START.md` | `139c24a87036759acd7c607d26a6915f4800be7d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02P_WORKFLOW_SYNTAX_FIX_START.md` | `7cce3337d67016d2de3268631bcf3a189be125f7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02Q_PREVIEW_BINDING_DEPLOYED.md` | `b8cd3a2d1cc03d61c6a5c9bad4287a537f0baed4` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02Q_PREVIEW_BINDING_START.md` | `b4b62042df91ed0a7c0c4ddce70a5a8cc0e73bb8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02R_LIVE_BINDING_PROBE_IMPLEMENTED.md` | `ff4350ebd8d9c744e2dce31958f08876daaeb817` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02R_LIVE_BINDING_PROBE_START.md` | `f0ce074c32df844f7d4497c68c5da96fda62e882` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02T_ISOLATED_PREVIEW_SCHEMA_APPLY_PASS.md` | `e96dd6560873cd2de50db20c07dbe09013d9849f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02T_ISOLATED_PREVIEW_SCHEMA_APPLY_START.md` | `bf15c5ca924379bd0b2c300785cdadb3a80eb3fa` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02U_GATE_PATH_CORRECTION.md` | `a59e1469b2cb5c7b615ac8308bdbaa9edbed4efd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02U_RUNTIME_SCHEMA_COMPAT_EXEC.md` | `ee84f929004837c5f64342f94968c1a327046d83` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02U_RUNTIME_SCHEMA_COMPAT_PASS.md` | `50d182dea755f2dfc41e3447e8d8e0791306bf64` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02U_RUNTIME_SCHEMA_COMPAT_START.md` | `aea7f7cfddd77858af2d423122d1e90781e7c041` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02U_STALE_RUNTIME_ROUTE_DIAGNOSIS.md` | `dacc009244655c7452e4c11b080356b6836374b7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_CF_02V_FULL_WRITE_SCHEMA_GATE_START.md` | `4c2b4dfe80d6074dd94b023d2bf6fb27e7f516c2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_F2_D1_ADAPTER_CI_PASS.md` | `3e1515387cfd62917e213a945a483180122e01e3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_F2_D1_ADAPTER_START.md` | `ba5744eb5a746bc7e307ad06e0b12a3ffd8fe728` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_F2_PREVIEW_CALLER_START.md` | `8f90a40cddc039eb20479c3f9f87e0ec257fd085` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_F2_PREVIEW_CALLER_TEST_START.md` | `e2a99048ab14e50be966cd1c20950bfb132a31e0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_ACCOUNTING_F2_PREVIEW_PERSISTENCE_GATE.md` | `f8c70c038133d0b5fe2e334ae96c3b37b2803ace` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BH_02BJ.md` | `3bbbe5bab3b23b5db399d526dd8e19dab7667b21` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BL.md` | `3ce102997b9288195e334adf852f4f6731ea9916` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BM.md` | `02584806ea01aba83d24057ecbd1a0edc4b628ae` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BN.md` | `7fa9ad7ae85df4a7dca6f93baec307dc78ce13c8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BP.md` | `f442866b3e7bca71f9ac7c0a35bb991e80027042` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BQ.md` | `93cec2f3f797097502bb22a89455f8497ef34600` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BR.md` | `8995da383185f19202a07f5afac5b72f94631632` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BS.md` | `5c4f4830568e09fe9817f82ed860b03f75fe9648` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BT.md` | `47b3022024b0b64faec390d6a564b32067fca646` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BU.md` | `a8fdbf91bd77986f3ec3f1a4bf932ab439c6cdc8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BV.md` | `2f2f52cba906cdf6f5dbf0dc54a7c94defc1f037` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BW.md` | `a6771997f774a278233d666cb95e968f4271c821` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BX.md` | `5f8f638c830cb29ee3ad7ff8e9e795525ab090ed` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BY.md` | `c85a5e073a6d227f63f2b3f3f73a7bb8287fc7a2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BZ.md` | `af497cf63e7ab97399f368009c92e60c065def5b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CA.md` | `09d4fd98e43eff4847df29377995458d9331244d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CA_FINAL_VERIFY.md` | `4d41552a3f5c3d10194298b1e05486ce3c53aaa3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CB.md` | `73b1c3ce5a06a56118b7e694361fa3325342d4f3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CB_PRODUCTION_SHADOW_STABILITY_PASS.md` | `55834ce89c1469f33252e633b0e968220a02aede` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC.md` | `21627cd8973a8b160446c0ff2cf5cfbf419b5795` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_CLOUD_WRITE_READINESS_REVIEW_PASS.md` | `6277b9b0e0a81be8f9f836b8f8ddce64500127f9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_CLOUD_WRITE_READINESS_REVIEW_START.md` | `e2d0f2f973712987c7f56e09689a8b4d86b3938e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_READONLY_PROBE_SELF_MATCH_DIAGNOSIS.md` | `d7dcae9b279d3595a25906f7a5b718b74bdf05d7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_STALE_PRODUCTION_DB_ID_DIAGNOSIS.md` | `d90ad3a9fcea047f1be7f5937e2e52a2a574ffdd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD.md` | `0c1935a1173d61b86cf16e8726a8c26404924670` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD_PENDING_MIGRATIONS_BLOCKER.md` | `74012a50effc8953dd0fcc2de279f5482f19e816` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD_PENDING_MIGRATIONS_READONLY_START.md` | `60073cecf9f402243a290b6bff7d5e43ae310ceb` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE.md` | `be1dcf70ac0aef8120b5577bdb357a21be581cdf` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE_METADATA_QUERY_MEASUREMENT_FAILURE.md` | `8970546c26c4d6f62438d1677a0e747068506cc3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE_MIGRATION_LEDGER_RECONCILIATION_REVIEW_START.md` | `6152c4bfcb71c9f261b21f7fc5193716f0f20eee` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CF_PASS.md` | `ef24b99dd7d29799be78360a84852d6ce9840bf7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CF_START.md` | `38460996cc0c93c11f87d5080de91e7ed7f13ed5` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CG_PASS.md` | `f073bca9936679629bb9b5993d07987e720e18a6` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CG_START.md` | `47482b7dc3c4d4ff65b414b81b80862bcef8b196` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_CONTRACT_FALSE_POSITIVE.md` | `aaea7e79314baa59528aeb6bdfce0d4f1d4bdd93` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_CONTROLLED_CONTRACT_START.md` | `aad89fb71053ad4aa80e37db5bf4956a8d109324` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_PASS.md` | `be7b40ceac5d5a00577b3a53bb9ca8b6e9a428c8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_START.md` | `0187ba4f3d0fbaabd91f24aaf74fabe72a6f6ae2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CI.md` | `450ea626677ae82113d5e0c10a2667d66e03135f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CJ_LEDGER_RECONCILIATION_ON_STATE_AUTHORIZED_START.md` | `8cad4f3bcbf39aacaf639302c874bb309f5fc63d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CJ_PRODUCTION_LEDGER_RECONCILIATION_PASS.md` | `c5b2a072b6dccd1a7e6d54ea309839e00a0c8c30` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/TRENDOS_BLACKBOX_2026-09-05_PLATFORM_CF_SCOPE_AND_CURRENT_STATE.md` | `b7040cc9ef6dc130d84ed8dce09eccce3cf0dbc3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/00_INDEX.md` | `2aa80fddedf775cfa4fe8c5921e8aabf79e0ab94` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/00_PROJECT_LOCATOR.md` | `2c8b9807e4f342f1c70f8e24e751eddb8255199c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/01_CURRENT_STATE.md` | `1276d8fe309881aa12f23b7a35b2bbb20a203a21` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_02CQ_CODE_SAFETY_INSPECTION_PASS_2026-09-13_2100.md` | `475711f804c690dc1b1e197d383a0aa042199d67` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_02CQ_LIVE_ROUTE_PROBE_2026-09-13_2101.md` | `fa550ffaa09d2c652f1d511943b4984d6936ae14` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_FRESHNESS_RUNTIME_HEALTHY_2026-09-13_2058.md` | `6534f2b3496338527f95cb8037c0da8c358b0d7e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_RESUME_CHECKPOINT_2026-09-13_2051.md` | `dc76bfef4afb49b207c7e07da23f31bc8b18433d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_CONTRACT_CHECKPOINT_2026-09-13_2052.md` | `f1a0e198588c06cfccf2c73372e6781e5fceaf33` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_DEPLOYED_PARITY_ATTEMPT1_FAIL_2026-09-13_2057.md` | `7e8da70c48703205c43ca0accf4d5fa2cbca40d9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_FIELD_ORIGIN_ATTEMPT1_FAIL_2026-09-13_2055.md` | `a3aacda4088cc08476de0b59e035c3dd54e426a0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_FIELD_ORIGIN_PASS_2026-09-13_2056.md` | `dabd04adb8033e66b8d429860f5f74350789e7ea` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_HEADER_PROBE_PASS_2026-09-13_2054.md` | `886c20debf0b6029ee6e43dc5a9711f69886a45e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_ORDERS_IDENTITY_MAP_PASS_2026-09-13_2105.md` | `ebf41324a851a3ab5871a8ed5b74daaab98d3f28` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_ORDERS_ROWNUMBER_MAP_PASS_2026-09-13_2103.md` | `f0e0f6994089985b3c8f1cbcd2021d7ba9d2e154` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_ROWNUMBER_SOURCE_MAP_PASS_2026-09-13_2059.md` | `41e5b3cb99baba0fe5f0f0827b776ddb576508fb` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_ROW_BUILDER_EXTRACT_PASS_2026-09-13_2053.md` | `873ae7332d2692e4f12971cbd65e1f8ee9105953` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_SERVICE_VIEW_FORMULA_SOURCE_PASS_2026-09-13_2102.md` | `c3417eaa5f54f23b78b83c17375d76568699d280` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_APPS_SCRIPT_DEPLOYMENT_WIDE_404_2026-09-14.md` | `cd00cad97ea219eb37cd2a6371dac81b828de737` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_APPS_SCRIPT_HEALTH_RECOVERY_UNSTABLE_2026-09-14.md` | `b26e000d06f8c6a5b89c81b76badd50637d1bca4` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_APPS_SCRIPT_SOURCE_UNCHANGED_SINCE_T6B_2026-09-14.md` | `d7958496142299cc97a0d0ae51dea53acc37536d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_COMPLETE_HANDOFF_2026-09-14.md` | `71920300dfa478f56a87739da427e1c243adba2d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_CURRENT_HANDOFF_2026-09-14.md` | `f7dc357d62784b62d58ea0b517402dc557031dd7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_DIRECT_SESSION_VERIFY_REGRESSION_2026-09-14.md` | `541293d6cf1141c2001f37c7d70393df8e0e46ca` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_FRESHNESS_RUNTIME_PROBE_2026-09-14.md` | `442693f70613547b4669a13d7b569ee07a8aedc5` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_PREDEPLOY_SESSION_GATE_FAIL_2026-09-14.md` | `2378368bfc4d8b10ef3dfebce5c2d5b186e9d305` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_ROUTING_INSPECTION_2026-09-14.md` | `37b92e7dd669e8dff33b7ce47ba7319dddb6f7b1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_CANDIDATE_PARITY_NEAR_PASS_2026-09-14.md` | `fc4fb7843158c452ce9bf61bb910c12fb914edee` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_CANDIDATE_PARITY_PASS_2026-09-14.md` | `4ad9b96a2e4bd369dee10bed45be0e58e5aa2d46` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_CANDIDATE_PARITY_V1_2026-09-13.md` | `3cc9ecfe493c3e9c4b134198b13b97e7e3c710e3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_EXCLUDE_9_DECISION_2026-09-14.md` | `59fb97cac3f12616363d8270a844f22f464cda5d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_EXCLUSION_HASHES_PASS_2026-09-14.md` | `5a1dac52f37fc923c69fe4dbfde06e58ca85e0db` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_EXCLUSION_RULE_V1_2026-09-13.md` | `6a11c3c5715d0e6f6ab137ad8c299c61c009aa32` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_EXCLUSION_RULE_V2_2026-09-13.md` | `11730d3532a0ddeecea065af102b739a33aa24a6` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_FRESHNESS_GUARD_2026-09-14.md` | `2a07686bcba7326508d77de21c7f03a07a7c69c9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_FRONTEND_CANDIDATE_DIAGNOSTIC_2026-09-14.md` | `25f5e9f1a2aa619247ef5f48cddf51c63fac9a9f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_FRONTEND_CANDIDATE_PASS_2026-09-14.md` | `016f0ff88b55ccd52b5b4f6293591ecd7694662b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_FRONTEND_CUTOVER_2026-09-14.md` | `c2e9fac77a435399fe0435cd251161ccbb6265ae` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_FRONTEND_PRODUCTION_PASS_2026-09-14.md` | `fb3b0093ec664386a967550982ea23390fbcde1c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_ROUTE_CANDIDATE_2026-09-14.md` | `c586b5ba651a6f7d64e020081c56f4cd7c210cb8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_ROW270_HYPOTHESIS_REJECTED_2026-09-13.md` | `9ab2ff4531b915851bf99a79a1f6be364d1bd5e1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_SINGLE_FIELD_DIFF_2026-09-14.md` | `2ac7b83d4955f1578e1a053fcb6978ae4461a044` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_WORKER_CANARY_ATTEMPT1_ROLLBACK_2026-09-14.md` | `4f3abac5907be25ac775730394d458a0f1272ffb` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_WORKER_CANARY_ATTEMPT2_ROLLBACK_2026-09-14.md` | `a2afc580d917eea008aa38ef503a77eaf914b540` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_WORKER_CANARY_PASS_2026-09-14.md` | `cba7ca2e7139172f6db64de14a18bdcf4902b01f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T11_SERVICE_WRITE_IDENTITY_GATE_2026-09-13.md` | `de58d06470a040ee73c1dc76a18ecaec8bbd0076` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_128_ROW_CANDIDATE_D1_RECOVERY_PLAN_REVIEW_2026-09-23.md` | `cf4f201d8ee57f5c1129313f6445334e8ec7f1b3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_CLOUD_FIRST_SAFE_PIVOT_2026-09-20.md` | `5fdd2c011f9a0451b1601b23dc58d12c6fbfa59a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_CLOUD_NATIVE_SYNTHETIC_ATOMIC_CHECKPOINT_2026-09-20.md` | `99dda8a881d6b240f65e2050e69007a46b2015a9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_CONTINUATION_HANDOFF_2026-09-22.md` | `619a3a29542a44621398b24d531a499ebc50c928` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_CURRENT_HANDOFF_2026-09-19.md` | `80aa53ccd0d2c6b6ada42fb02f27e02c110f8c86` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_NEW_CHAT_START_PROMPT_2026-09-23.md` | `af74c960d8d5e8b387ed851dd7c94697f19fcbbd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_ORDER_CREATE_GITHUB_PREP_PASS_2026-09-19.md` | `16f0283019d3d59a669548f5c6706f45cf154760` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_ORDER_CREATE_PARITY_MATRIX_2026-09-19.md` | `f6872e174eaf98e2879ad413745e35439f830d7f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_PRODUCTION_D1_READONLY_OWNER_RUNBOOK_2026-09-22.md` | `f1550ebb8416a700ac0e7df4e3fd092d9ab5b76e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_R5_READONLY_RECOVERY_PREFLIGHT_OWNER_DECISION_2026-09-23.md` | `8db052f02711991ecdd94a3015aec1634c3c37c3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_READONLY_NEXT_ORDER_PROPERTY_HELPER_2026-09-22.md` | `57774d977ebff3530da3a77d6e39b1044794a94e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_READONLY_PRODUCTION_EVIDENCE_2026-09-22.md` | `698da709d8ae2dc3f20894106070a0fecff18476` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_REAL_CREATE_FENCE_AND_READONLY_DECISION_2026-09-22.md` | `cd1c597e0f0d77da9aef3dfee40916b28176e9a8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_TEST_CLOUDFLARE_OWNER_STOP_HANDOFF_2026-09-21.md` | `ebcfabc589485420c67b1e881010545ec2145dbf` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T12_TEST_RESOURCE_PROVISIONING_GATE_2026-09-21.md` | `ca7a941589c4477d281e3bed0e714bb641c19f6c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/CLOUD_MIGRATION_V3_T8_PRINT_GLOBAL_D1_READ_PASS_2026-09-13.md` | `0a96466f080e53a29727bf71f86937583025c806` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/OPERATOR_TASK_V2_CLOUDFLARE_PREVIEW_2026-09-13.md` | `f3d8bd16ed02e8b304955369e60c34ba2626daf9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_BACKEND_UNIFICATION_HANDOFF.md` | `04d91cecc756d5cde44d684c1118f122fd97442f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AA_02AF.md` | `5c6eebf7db5f3b577b0031397c10cafe32b94994` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AG.md` | `1e6d4b24976e8f30689fd924ae846a9517c239d5` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AH.md` | `f6bd3bd004061e84f019202190fd44b08938a0a3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AI_02AJ.md` | `9eef808e256e8607f79dc6adeaf1a2bdc9d51d03` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AK_02AL.md` | `d11288f25b17002a754dde8908fe78d7f046ea66` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AM.md` | `426cd78c793261a7c8395ef5a654621421fb8109` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AN_02AP.md` | `3b7189726c9b1f196f1fc9c78deea9976508c782` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AR.md` | `52cce18f7242051b36ad5cfce209bede311ecf02` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AS.md` | `3b2704d09687d257f430bf6193b7d2fd3f28de1d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AT.md` | `ab69b48eb2d98d78a49b494b91f4997ddafe6076` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AU.md` | `f37b669ac18fd2d9ec6080553f3a84fb8426036f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AV.md` | `fdcbc05b44f5ddeeaccbc80af42ba90d3bb64f02` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AW.md` | `5f4d3f59f50b0dcccd155681ee5f6ee9075bc9bd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AX.md` | `8cb2a706bd237b09939c284e182723dc769057a4` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AY.md` | `e7eeba83f7b73c38135ad78d7d042f67f3388011` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02AZ.md` | `cadb023628c6f674f5ec61b35d9a101227992dde` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BA.md` | `4dc870386934688eaab4338452e44a30526bd214` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BB.md` | `b74b8d8b81ce2ebc564c3d0dca2c8c0bda83dadf` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BC.md` | `e43f0a0f06a4cf86841a5be7dde479804bce00d3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BD.md` | `288f97d3f17b1b0c486e6641d15b2968d258855b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BE.md` | `d3d731650000ee117954f29b530ed47d6edf93d9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BF.md` | `577dff1e595f1b14033261b0cc3cec02d448294c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02BG.md` | `ff9a0c546745713718b1805ba8e969f3a64f9268` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02R.md` | `aa75e3f3fc98dc4cda7fb11bdb08b008bd62d1aa` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02S_02T.md` | `5e74672ddf0be7d9030651e3ad186939320c279d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02U.md` | `664aa5262d9d028f968a4b9946499993584c5da3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02V.md` | `8acaa7a0ede806f7ea4100ba50ba284aa0e26ce1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-04_PERF_CF_02W.md` | `c1cdcdcde4f7f766609eefd532b72a1a2a03994a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BH_02BJ.md` | `3bbbe5bab3b23b5db399d526dd8e19dab7667b21` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BL.md` | `3ce102997b9288195e334adf852f4f6731ea9916` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BM.md` | `02584806ea01aba83d24057ecbd1a0edc4b628ae` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BN.md` | `7fa9ad7ae85df4a7dca6f93baec307dc78ce13c8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BP.md` | `f442866b3e7bca71f9ac7c0a35bb991e80027042` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BQ.md` | `93cec2f3f797097502bb22a89455f8497ef34600` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BR.md` | `8995da383185f19202a07f5afac5b72f94631632` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BS.md` | `5c4f4830568e09fe9817f82ed860b03f75fe9648` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BT.md` | `47b3022024b0b64faec390d6a564b32067fca646` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BU.md` | `a8fdbf91bd77986f3ec3f1a4bf932ab439c6cdc8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BV.md` | `2f2f52cba906cdf6f5dbf0dc54a7c94defc1f037` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BW.md` | `a6771997f774a278233d666cb95e968f4271c821` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BX.md` | `5f8f638c830cb29ee3ad7ff8e9e795525ab090ed` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BY.md` | `c85a5e073a6d227f63f2b3f3f73a7bb8287fc7a2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02BZ.md` | `af497cf63e7ab97399f368009c92e60c065def5b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CA.md` | `09d4fd98e43eff4847df29377995458d9331244d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CA_FINAL_VERIFY.md` | `4d41552a3f5c3d10194298b1e05486ce3c53aaa3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CB.md` | `73b1c3ce5a06a56118b7e694361fa3325342d4f3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CB_PRODUCTION_SHADOW_STABILITY_PASS.md` | `55834ce89c1469f33252e633b0e968220a02aede` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC.md` | `21627cd8973a8b160446c0ff2cf5cfbf419b5795` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_CLOUD_WRITE_READINESS_REVIEW_PASS.md` | `6277b9b0e0a81be8f9f836b8f8ddce64500127f9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_CLOUD_WRITE_READINESS_REVIEW_START.md` | `e2d0f2f973712987c7f56e09689a8b4d86b3938e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_READONLY_PROBE_SELF_MATCH_DIAGNOSIS.md` | `d7dcae9b279d3595a25906f7a5b718b74bdf05d7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CC_STALE_PRODUCTION_DB_ID_DIAGNOSIS.md` | `d90ad3a9fcea047f1be7f5937e2e52a2a574ffdd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD.md` | `0c1935a1173d61b86cf16e8726a8c26404924670` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD_PENDING_MIGRATIONS_BLOCKER.md` | `74012a50effc8953dd0fcc2de279f5482f19e816` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CD_PENDING_MIGRATIONS_READONLY_START.md` | `60073cecf9f402243a290b6bff7d5e43ae310ceb` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE.md` | `be1dcf70ac0aef8120b5577bdb357a21be581cdf` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE_METADATA_QUERY_MEASUREMENT_FAILURE.md` | `8970546c26c4d6f62438d1677a0e747068506cc3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CE_MIGRATION_LEDGER_RECONCILIATION_REVIEW_START.md` | `6152c4bfcb71c9f261b21f7fc5193716f0f20eee` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CF_PASS.md` | `ef24b99dd7d29799be78360a84852d6ce9840bf7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CF_START.md` | `38460996cc0c93c11f87d5080de91e7ed7f13ed5` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CG_PASS.md` | `f073bca9936679629bb9b5993d07987e720e18a6` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CG_START.md` | `47482b7dc3c4d4ff65b414b81b80862bcef8b196` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_CONTRACT_FALSE_POSITIVE.md` | `aaea7e79314baa59528aeb6bdfce0d4f1d4bdd93` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_CONTROLLED_CONTRACT_START.md` | `aad89fb71053ad4aa80e37db5bf4956a8d109324` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_PASS.md` | `be7b40ceac5d5a00577b3a53bb9ca8b6e9a428c8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CH_START.md` | `0187ba4f3d0fbaabd91f24aaf74fabe72a6f6ae2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CI.md` | `450ea626677ae82113d5e0c10a2667d66e03135f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CJ_LEDGER_RECONCILIATION_ON_STATE_AUTHORIZED_START.md` | `8cad4f3bcbf39aacaf639302c874bb309f5fc63d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CJ_PRODUCTION_LEDGER_RECONCILIATION_PASS.md` | `c5b2a072b6dccd1a7e6d54ea309839e00a0c8c30` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_AUTH_BLOCKED_NO_WRITE.md` | `ed1818efb5d42195cc9f2ad4c8e924707aefe977` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_AUTH_EXCHANGE_FAILED_NO_BUSINESS_WRITE.md` | `9487d1ed06564744762afabefc607a508072ec9b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_AUTH_READINESS_RECHECK_NO_WRITE.md` | `a82c395c5cd01255b7a675a4a064c31582df9578` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_PRODUCTION_BUSINESS_QUALIFICATION_PASS.md` | `fc91413421ca1422d6ca99bb91b3549758162d18` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_RAHMA_AUTH_EXCHANGE_FAILED_NO_BUSINESS_WRITE.md` | `7d376b3e4768ceb1088653e4a81323728ed22ec5` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_RAHMA_AUTH_EXCHANGE_RETRY3_FAILED_NO_BUSINESS_WRITE.md` | `49a89ee65582d7dce81f35c99160ce41ac4fb580` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_RAHMA_VALID_SESSION_BUT_ALLOWLIST_BLOCK.md` | `f870bdba1073f2a2315bea209414a45489c6323e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_START.md` | `4c1c33aa3bb36ae5aee4dbe80afb2326bc766b34` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_USERNAME_CASE_DISCOVERY_SESSION_INVALIDATED.md` | `9db757570be1831b2c4865522b5537249aa8f556` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_VIRTUAL_EMPLOYEE_START.md` | `3c4be7b91f9f5aed0ab50e322cccc2c8dc8369ce` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_VIRTUAL_QUALIFIER_RERUN_AUTH_FAILED_NO_BUSINESS_WRITE.md` | `6126ddb6a96f76f5db87076830114e1a46a8d12e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_VIRTUAL_QUALIFIER_SECRET_PROBE_START.md` | `7c8a27f0e68b5f618cc993f72e8e346438b6d193` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_VIRTUAL_QUALIFIER_WAEL_PROVISIONED.md` | `686fcd54b788739d32b6a326c623a64ab9a500c7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CK_WAEL_AUTH_FAILED_MISSING_LAST_LOGIN_NO_BUSINESS_WRITE.md` | `7dff80b4f8d977c8ca939f524465e67f7f785d8a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_APPS_V153_WORKER_DEFAULT_OFF_LIVE_PASS.md` | `6c1559973fed959e40b5620aaec2018b0bcb37d1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_CANDIDATE_PREPARED_CI_PASS_NO_PRODUCTION_MUTATION.md` | `52cd6283425353e04f4dede7ff189f773e550ffd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_DEDICATED_SECRET_READY_WAEL_REENABLED.md` | `cb3d5bd2e70326d493db2d50c9658995406bd258` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_EMPLOYEE_SECRET_OTHER_VALUE_NO_AUTH.md` | `5facb403d1b67727954ae23319c07946981a445c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_LIVE_READONLY_PREFLIGHT_PASS_NO_MUTATION.md` | `670a07141485090ef77bcad509c9a19091762e1a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_WAEL_FRESH_AUTH_MISMATCH_TOKEN_CLEARED_NO_RECONCILIATION.md` | `179b35a7619e9ba38a924ec0847b2eb9c75ba966` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_WAEL_TOKEN_FINGERPRINT_MISMATCH_NO_AUTH_NO_RECONCILIATION.md` | `94f351c84053bdb8764ce3592e12bbe9fd335e0b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PERF_CF_02CL_WORKER_WRAPPED_DEFAULT_OFF_CI_PASS_NOT_DEPLOYED.md` | `c6ca2d76e537f032ad13180e8285a0c9d098a560` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PLATFORM_BLACKBOX_CLASSIFICATION.md` | `df4f694aaf2a6a3b54e25d79b241ab0ab822bf10` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-05_PLATFORM_CF_SCOPE_AND_CURRENT_STATE.md` | `b7040cc9ef6dc130d84ed8dce09eccce3cf0dbc3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CL_AUTH_PASS_SECRET_PLACEMENT_CORRECTION_HOLD.md` | `ddf8517b2e7f25e3b6a9415b500d3ed1078edd43` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CL_PRODUCTION_OUTBOX_TO_SHEETS_PASS_CLOSED.md` | `37b7f4d1f85d895366b434d11627472078da8d25` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CM_READONLY_STABILITY_PREFLIGHT_PASS.md` | `cfce3da98f202b6fd1116ff8d9eb104923c5b144` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CN_ORDERS_READ_HOTPATH_CANDIDATE_CI_PASS.md` | `3791cde8d0e9d60b602f5ac8e9204d174776ce70` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CO_AUTH_PASS_VIEW_MIRROR_STALE_BLOCKED_BOUNDARY_PASS.md` | `7b9bf60ae38e4f8ead8fb0b16ba5b2ddb2504125` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CO_WORKER_LIVE_AUTH_BLOCKED_BOUNDARY_PASS.md` | `50e8a53b13bc5a82c097b6eea5be2dbb08e95b14` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_APPROVED_PREBOUNDARY_PASS_DEPLOY_CHANNEL_BLOCKED.md` | `d1906b9bebe6c65413677247c06e1569b521177f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_SCREEN_VIEW_MIRROR_REFRESH.md` | `a4232f0d07b1df5d3b44d60c25a0ef1a645e737f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_SELF_CONTAINED_FINAL_CANDIDATE_PASS_MANUAL_IDE_GATE.md` | `2200c9d83ab2ff01dd5143deedb4c6fb6f9c70ca` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CQ_VERIFIED_PASS_CLOSED.md` | `7d5ecef54da9f4555f9c304c99aea44e3d95a269` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_APPROVED_PREDEPLOY_PASS_MANUAL_APPS_SCRIPT_EXECUTION_REQUIRED.md` | `99eedb2044cf0935d081d5434b2307de858d1fcd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FIELD_COMPLETENESS_REGRESSION_ROLLBACK.md` | `7d70d6d233fefe0df726d47281518562a44cb89e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_FRONTEND_STALE_CACHE_RECOVERY.md` | `9b2f6fdc2e54b0bc1e238daf65958de6c09fce56` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_PREVIEW_SOURCE_PARITY_HEARTBEAT_BOUNDARY_PASS.md` | `ee6278f1f6c118b4098ab32707a40685d8bc0059` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_VIEW_FORMULA_RANGE_FIX.md` | `a02aa86cd0b9871a53aeca85af926afbe480fcd8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CR_VIEW_FORMULA_USER_VALIDATED_PASS.md` | `981394acb52d067506a655ef55c933ef69709037` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CS_PRODUCTION_WORKER_AUTH_PREFLIGHT_BLOCKED.md` | `7f9b41c82305fe13753a8fc3a771f14f076ce206` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CS_PRODUCTION_WORKER_ROUTE_PASS_FRONTEND_OFF.md` | `95622bb238cd1a7bfa5b43895f6cb226078d6ee5` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CT_PRODUCTION_FRONTEND_CUTOVER_PASS.md` | `35917d88c828568de47f8235837d4c98afac5219` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CT_USER_VISIBLE_PASS.md` | `b3fbf806dff094e65058908fe1aad49518e3f6f6` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_02CR_DUAL_SIGNAL_IDLE_FRESHNESS_CANDIDATE.md` | `138656fbd56e4b8917d858254137028289e6187e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_DUAL_SIGNAL_PRODUCTION_PASS.md` | `499dbd4fd6c1847e3eb99bd2fcba313c99640821` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_DUAL_SIGNAL_USER_VISIBLE_PASS.md` | `7a3fd0e5133960cb6db12e9f28ea15fb46270def` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_NO_REFRESH.md` | `5ca285255d30bcdc99db978fbe426fef9e79e037` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_NAVIGATION_RETURN_USER_VISIBLE_PASS.md` | `e60ea2a48979ca90f27b311d952719f571240b13` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CU_STABILITY_FRESHNESS_RESUME_GUARDS.md` | `8aafaa7d768b6a4bac101d33a0b449f1340c0310` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CV_DURABLE_PARITY_PASS.md` | `2eb171b64f54d9ce6a7a2b939fe82041ff381f01` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CV_ORDER_STATUS_WRITE_CONSISTENCY.md` | `7b3e22b09d538c5f9c742631aa72066ca7bae65d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_PERF_CF_02CW_GLOBAL_COUNTERS_DEFAULT_FILTERS_PRESS_TOTALS.md` | `a5584a52ee715988ae3420aed59b987c050f8e06` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_TREND_MASTER_SAFE_BOUNDED_FIX.md` | `c0b02a06004fdedd6769dbbd395b3af4c8c7e2fd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_TREND_MASTER_V1931_DEPLOYMENT_CHANNEL_BLOCKED.md` | `46c5999b5b5899191b63c4530aaec2891f0959aa` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_TREND_MASTER_V1931_PRODUCTION_ACTIVATED.md` | `930ba1f4d2cab6115f4ebeeff07881cedc6131ce` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-06_TREND_MASTER_V1931_RESILIENCE_CANDIDATE.md` | `b906f7bb7a6c38c2461f7007acbee0b1151d44e0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-07_CORE_P0_11_REGRESSION_E2E_GO_NOGO.md` | `7db41a17af7164799379140f3224823000fc41ce` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-09_RP06_REGISTRY_WRITE_APPROVED_PENDING_EXECUTION.md` | `c9c129416a963c2a9da4efc826dc318cc325234a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_GABER_DAILY_MATERIAL_FLOW_REQUIREMENT.md` | `827fbe8981d5056b9c76417aa13e2ccc51418ce2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_GABER_EASYSTORE_LEDGER_ADAPTER_PRESTEP.md` | `3b6e16669c79eaa3bf31598aafae9107ff587e38` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_GABER_LASER_MATERIAL_CUSTODY_WASTE_CONTROL_V1.md` | `b6a8f197acae536b6a63f6713c61536d9e46d6d6` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_GABER_MATERIAL_CONTROL_V1_CANDIDATE_CHECKPOINT_01.md` | `ccef1c6ab956b86fd6feb849db31f90861ddbf0c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_GABER_MATERIAL_CONTROL_V1_CANDIDATE_CHECKPOINT_02_LEDGER_PASS.md` | `8a25a2ec5c4ad2dc27ae7d5fc5c8414141bb2079` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_GABER_MATERIAL_CONTROL_V1_CANDIDATE_CHECKPOINT_03_EASYSTORE_ADAPTER_PASS.md` | `495e21a404933f89f0d0ed321bda0b411170d55c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_GABER_MATERIAL_CONTROL_V1_CANDIDATE_CHECKPOINT_04_PERSISTENCE_BACKEND_PASS.md` | `0ae4797227de083805bea33b3aa95b6a3c9b36bc` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_GABER_MATERIAL_CONTROL_V1_PERSISTENCE_BACKEND_EXECUTION_PLAN.md` | `2842cfb89c921ec246b0a22baa392c7be50bce2c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_V2_EDGE_AUTH_BRIDGE_DESIGN.md` | `11f663bbe0621a48b9e5a99950a12b075bf60fce` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_V2_HYBRID_CLOUDFLARE_DESIGN_PREP.md` | `da78913bf644eb21890148e5c8f6ed887b67b2f3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_V2_OWNER_PRIORITY_LOCK.md` | `b1b557e15a23b5a0afe102fed49b3cf5f7881a75` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_WORKFLOW_IMPLEMENTATION_START.md` | `f30eebe43128f22b9e2af86f866615c82b84e1cc` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_OPERATOR_TASK_WORKFLOW_WAEL_GABER_REQUIREMENTS.md` | `1c41c51286bd7e4ba7a5fc9e0cd3c60a72782525` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_APPROVAL_HELPER_CLEARED.md` | `2bce1434da121744a1fdc6c26d4c627c3f27760d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_APPS_SCRIPT_FULL_INVENTORY_READONLY.md` | `74282ffcfd690f01c1571968c5574b34b17676dc` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_APPS_SCRIPT_INVENTORY_READONLY.md` | `ed0cdd16b68fa14794752b13c43ce4f5efcb99a8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_DUPLICATE_WRITER_PLACEMENT_CORRECTION.md` | `d1b3ce5d6edf09eef67a940e171a2143032506b2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_HELPER_CLEARED_NO_FUNCTIONS.md` | `f9d3fa893e6017b9dc1e42c5ec326a73b1a61108` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_LIVE_INVOICE_RESOLUTION_READY_PATCH.md` | `f86df843800df4f6200411a65dde4e1391b8b167` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_NEXT_ACTION_33_SPEC_PATCH.md` | `fa05b07ff07b77a08c546d4e45fc88e4f70b9441` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_PATCH33_CODE_CI_PASS.md` | `441ec4353f0a24a8b0ae4891d5b0175d2d86f856` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_PATCH33_OWNER_APPROVED_START.md` | `7cc8f4090bfc6fe9f2ff5f83974428b6c3afa12f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_PREVIEW33_EXECUTION_BLOCKED_CHAT_CAPABILITY.md` | `d661575f7cae7161cef7dc6a58e3d942dea36b1a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_PREVIEW33_PASS.md` | `dd83c1db5e21cea5844cb8d793eb5f045e767cf6` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_PREVIEW_INVOICE_RECONCILIATION_HOLD.md` | `b5413792fd93ea2a10236d1d991274b5a6944cc4` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_COMPLETE.md` | `d7a6b90869f0d4ede0d811407c506b3f6900e843` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_PATCH_CODE_CI_PASS.md` | `0aa79d2e3f9965006ca2151d8c2c0c2d1cbfce15` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_PATCH_OWNER_APPROVED_START.md` | `0a810ef2d4658cf7d1a49ab9140cc8bc6a7a581c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_PATCH_TESTS_ADDED.md` | `c65a60f6641f562689f0f9783cbf5793f4ee5818` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_PATCH_WRITER_INTERMEDIATE.md` | `24437f36fae5b0ac27ec2f3c599be235a0a7f0fd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_PREVIEW_DUPLICATE_DECLARATION_BLOCKER.md` | `b0e2273120b092da6d16cea9ce7bcac931ef672a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_PREVIEW_DUPLICATE_DECLARATION_REPEAT.md` | `e5cbfff6f1b58b5af29700cfd784419c63d6e259` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_RECOVERY_RUN_GATE_LOG.md` | `b2621cb34845137dff46563af43fc395297afb3d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_REGISTRY_WRITE_AUTO_ROLLBACK_ROOT_CAUSE.md` | `fdfa5d3bd97416173435332d13b3ef9e768743dc` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_REGISTRY_WRITE_BLOCKED_EXPLICITLY_INACTIVE.md` | `fb58d6f9e10270f2ada3ad1f9d45eff44da0fc4e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_REGISTRY_WRITE_OWNER_APPROVED_PENDING_EXECUTION.md` | `1e30b6c9f72c2774abfaf79dff22e96b1af19114` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_UPLOADED_RECOVERY_CODE_REVIEW.md` | `5393bef1ed81c21d3480be2553543af494b64e07` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP06_WORK_COMPLETE_RECOVERY_AUTHORIZATION.md` | `8fcfa6c53d7a039cdce34bf7168a0b2b6f0ebaab` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_CONTAINMENT_CI_PASS_ALIAS_CANDIDATE.md` | `f47e0af23394241a90d1adae1db19953c6a4a643` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_HEALTH_RECHECK_LIVE_FAIL.md` | `b946a3109f15a07c24c329a485748dc09785b265` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_HEALTH_RECHECK_START.md` | `91a2d2e7ae835b08f1dfcc457e51342d2e0589ec` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_REMEDIATION_CODE_CANDIDATE_PASS.md` | `9cec53a03cdcfc194dc0e1374b8f26ec26b0f24f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_REMEDIATION_CODE_START.md` | `bfbd9e28021abefd765191ad7bf1118fa20695e2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_DEPLOYMENT_BOUNDARY.md` | `f3a13410060ca0d3d5cb1f8a73f875d5c1f4c9b4` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_PHASE0_DIRECT_WORK_INVENTORY_FAIL.md` | `89401c4dde807734efc9a0b6325af35fc065df4c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_PHASE0_INVENTORY_BLOCKED.md` | `72c57912e98dcb30c28cf15b45bd7ec70f36a3e1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_RUNTIME_PHASE0_LIVE_INVENTORY_BLOCKED.md` | `07c28ece5151d033a25cebb0802b6a6141e68236` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-10_RP07_WORK_LIMIT_STOP_CHECKPOINT.md` | `2867b236487784f4af10ea3d37fc0fc415e28705` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-11_GABER_MATERIAL_CONTROL_OWNER_STATUS_LOCK_AFTER_CHECKPOINT_05.md` | `d6f30fa11acac1eaded3957278d2746bbcbac5f7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-11_GABER_MATERIAL_CONTROL_V1_CANDIDATE_CHECKPOINT_05_UI_APPROVAL_REPORT_PASS.md` | `d397363efd938f9b4fbed2048d50f48d2762f7fb` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-11_GABER_MATERIAL_UI_REPORT_EXECUTION_PLAN.md` | `bc6ed00b4a866af270543fb975df057020c198af` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-11_GABER_WASTE_APPROVAL_REQUEST_STORE_DECISION.md` | `73a0784bb2566d689930356ea36e94c519985b36` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-11_RP07_CLOSURE_VERIFICATION_HOLD.md` | `9294169576d495866e691a684bfc2837ff134bde` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-11_RP07_RUNTIME_PHASE0B_READONLY_PASS.md` | `628a2f74aa5f5e236d71d70d04758f61e61f6feb` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-11_RP07_WORK_RECALL_POINT_FLAG_DISABLE_PENDING.md` | `0f418f7aab3aa329aeff2aaac222a9ccac38673b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_DEPARTMENT_INVOICE_CONTROL_GABER_LASER_WAEL_PRINT_REQUIREMENTS.md` | `b0ab823fb8c4882b595d71aedf85ef7062f3e845` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_GABER_SHADOW_PARITY_PRIORITY_AFTER_OPERATOR_TASK.md` | `f9e0a009f29e698d368b0ef95b2d49267deec4fb` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_RP07_CORRECTIVE_TEMP_SETTER_PASS_FLAGS_OFF_HELPER_REMOVED.md` | `42383ca2346d42dc04efe9e343540a7b7a049f8b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_RP07_FLAG_DISABLE_BOUNDARY_FAIL_NO_SETTER.md` | `a550d8714f4064f43dd1665ee9227e38324e154a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_RP07_PHASE1_INSTALL_PASS.md` | `3023e1892e73fc27f0a6fd6d13f3168427056687` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_RP07_PHASE2_READONLY_PASS.md` | `096638d0bd6d9ff90b47d89ddf7872d165b4eb07` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_RP07_PHASE2_WORK_LIMIT_INTERRUPTED_RESTART_READONLY.md` | `ad3cb01ccfe5a33fd858d3ddeb1317e25713304a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_RP07_TEMP_HELPER_OWNER_DELETED_PENDING_VERIFY.md` | `44d3e9c749807d4d887fd9ba10bd43ad00a9f069` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-12_RP07_TEMP_SETTER_PRECONDITION_FAIL_RAW_VALUES.md` | `d3667ab6ea2eeda02c9d2c931d1a9a62ca9247aa` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-13_RP07_FINAL_HEALTH_PASS_CLOSED.md` | `1a4b55b9b9076608220811f84fd74e83231f1998` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_BLACKBOX_2026-09-13_T6B_CLOUD_AUTH_SHADOW_CANARY_PASS.md` | `6bd2d3c790a2c40f438fdc1584b3d3a2c6ca76e8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_D1_PAUSED_SYNC_RECOVERY_PROTOCOL_2026-09-19.md` | `85e988439dd8e6df853bc956b02995270c556aaa` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_PRODUCTION_INCIDENT_PROPERTIES_QUOTA_TRIGGER_PAUSE_LOG_2026-09-19.md` | `e50c602d35aac4c861234d14fb5afb59e4f14a3c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_BROWSER_GOOGLE_TRANSPORT_FIX_ENTRY_495_2026-09-30.md` | `6d61a9e3b6fc48ff0fb7107f132fe1865b25ddb0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_CLOUDFLARE_OFF_STATE_DEPLOY_RESULT_2026-09-30.txt` | `d7764b39274f8ac239ebe966a71311058ff5d1e8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_CLOUDFLARE_OFF_STATE_INSTALL_SUCCESS_ENTRY_491_2026-09-30.md` | `75b4e416a50a7dbeabb988be36ca1b6542f1f020` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_CLOUDFLARE_READONLY_PREFLIGHT_RESULT_2026-09-30.txt` | `fd4a92c1412d693ee78c68abec62c592e9c6f71f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_DIYA_DIRECT_BOOTSTRAP_READY_BLOCKED_ENTRY_494_2026-09-30.md` | `ed7240bcbcde325b0759f0d506127f80d7a3d98c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_DIYA_ENROLLMENT_GATE_QUALIFIED_CREDENTIAL_BLOCK_ENTRY_493_2026-09-30.md` | `800ac9f42f202485f4e99e0c50dd5defcf740fcd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_FRONTEND_OFF_STATE_AND_NATIVE_CANARY_BLOCKED_ENTRY_492_2026-09-30.md` | `efdce598aa4c1995841cc0fb00d1a1f2018483e8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_OFF_STATE_PRODUCTION_INSTALL_RUNBOOK_ENTRY_484_2026-09-29.md` | `1a678e9b4bb208a5d9e73425f1a946c931bdd458` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_PHASE_A_BROWSER_BLOCK_ENTRY_488_2026-09-29.md` | `f6d8569de49808d6d44f6a05583bd7438ae4525f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_PHASE_A_PRODUCTION_DEPLOY_SUCCESS_ENTRY_489_2026-09-30.md` | `60ae17d650788deebf73cc1493ba651937b3c2af` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_PHASE_A_SOURCE_INSTALL_REVISION_ENTRY_487_2026-09-29.md` | `636deb4f58306197bd88036e5852652a5d1b725e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_PHASE_B_D1_OFF_EXECUTION_RESULT_2026-09-30.md` | `f78aa0cf9d73ffb210e13a6a7c5ee98c49050518` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_PHASE_B_D1_OFF_EXECUTION_RESULT_2026-09-30.txt` | `0367da61211a0cf383e42fb9cf806c74cb2b9e2f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_PHASE_B_D1_OFF_SUCCESS_ENTRY_490_2026-09-30.md` | `bd3a214bb52c7223ac47c2eca69d3a8eaf03478a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_POSTDEPLOY_READONLY_VERIFY_RESULT_2026-09-30.txt` | `86699ca8fb35286eee5bb2e7ffdded48a3e7ea4d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_SOURCE_RECOVERY_FORENSICS_ENTRY_485_2026-09-29.md` | `bc4cb1ec58c89b8b1fe968556857595b3f96248b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ADD_ORDER_UI_CONTRACT_ENTRY_445_2026-09-28.md` | `bf6b20b3849daa49e53d4db4540129f07b344a85` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_APPS_SCRIPT_BRIDGE_CURRENT_MAIN_A61_ENTRY_483_2026-09-29.md` | `6a2f33f3b39fa701663c010e3c8a8ad28e142850` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_BROWSER_NETWORK_ERROR_ENTRY_444_2026-09-28.md` | `494c8ffe05e86dad5f4c7e5bfda07d0134cb3172` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_CANARY_4322_OUTBOX_RETIRED_ENTRY_452_2026-09-28.md` | `bac957fa2b3fb7d7831e43695ae2e32671dca167` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_CLOUDFLARE_TEST_EXECUTION_JOURNAL_2026-09-21.md` | `cd850e393f593c773ca338bff8e5865b21c18ad3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_CUSTOMERS_STALE_MIRROR_ORDER_LATENCY_ENTRY_457_2026-09-28.md` | `591dd5d77348e9df2d555d4e22a7b9dfd5071f61` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_CUSTOMER_D1_SEARCH_ORDER_LATENCY_A51_A52_ENTRY_468_2026-09-29.md` | `c93562441b5d6316ae58786e7da87180e05c6e7f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A10_TOKEN_ID_MISMATCH_PROVEN_2026-09-27.md` | `d8450454bf21cb8ceefbc4809f9a692a3917313a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A11_SYNTHETIC_WRITE_WORKFLOW_READY_2026-09-27.md` | `6b1df4ad4c7506d03ac25dabc81eb0dee4db51f2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A12_TOKEN_GATE_STILL_BLOCKED_2026-09-27.md` | `c61e6718d3a6850ae5942baa273dc524fd21d1e6` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A13_ACCOUNT_TOKEN_GATE_CORRECTION_2026-09-27.md` | `b9d19558e87569065dc0bb9ab73c3afe9310d158` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A14_ACCOUNT_TOKEN_VERIFIED_WORKFLOW_UNREGISTERED_2026-09-27.md` | `9963d1a8fc22037b31f426dd907702cc32248589` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A15_SYNTHETIC_WRITE_QUALIFIED_2026-09-27.md` | `ef7d929764e543d8e78198c757ce5ca7d0524293` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A1_PRAGMA_2026-09-27.md` | `7b3ec0fd8eadf7c1dae0801b1a7222b63c6e36dc` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A2_MIGRATION_BOOKKEEPING_2026-09-27.md` | `bb66ebb6f13d161a1fcea09b37b31705947e8f3e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A3_PERSISTENT_DDL_2026-09-27.md` | `bd989a285de28b4a295e7abce9041bdd273fd994` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A4_PERSISTENT_DDL_7500_2026-09-27.md` | `07fd8025009ee389d1d09ea69f744c9f0033550e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A5_TOKEN_TYPE_VERIFY_2026-09-27.md` | `2c2853eb8709e20d33b87f2e7d59384a8013e3e1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A6_TOKEN_DETAILS_READONLY_2026-09-27.md` | `31c6f62494ad144d8f342914d24a231e52b6f935` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A7_EFFECTIVE_WRITE_AUTH_2026-09-27.md` | `64509500dd623f8a11ee6d739659d2fb6707cbc4` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A8_DASHBOARD_TOKEN_LIST_2026-09-27.md` | `ca0f78d54ba256cd08436f65b6700c8bc825350a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_D1_7500_DIAGNOSTIC_A9_DASHBOARD_TOKEN_SCOPE_2026-09-27.md` | `1c6343d8e959cccb3cc51362285db7ec4f941142` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_DELIVERED_STATE_BEFORE_COLLISION_REPAIR_ENTRY_450_2026-09-28.md` | `47e144df82b21a1dd2d06cc584cc8fc38923a49c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_DISABLE_AND_4322_READONLY_VERIFIED_A20_A21_2026-09-27.md` | `d966253bbd0e7aa5509597fa2b6dc633e7474722` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_EMPLOYEE_FORCE_PASSWORD_RESET_A60_ENTRY_478_2026-09-29.md` | `09f5f6d872145e8bba353854cf8631571f84a151` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_EMPLOYEE_LEGACY_ACTION_CLASSIFICATION_A61_ENTRY_481_2026-09-29.md` | `1b7437c70f7c4ce758c0ff22af214777487ecfa0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_EMPLOYEE_LEGACY_AUTH_BRIDGE_A61_ENTRY_480_2026-09-29.md` | `6e45e844f849f5084318e9ad57bae2e28748cab1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_EMPLOYEE_SESSION_NON_DESTRUCTIVE_AUTH_ENTRY_531_2026-10-01.md` | `c8b12930065e5147a6d14c0b7e55ae452cab7868` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_EMPLOYEE_SESSION_PREVENTIVE_AUDIT_ENTRY_533_2026-10-01.md` | `a928cf479611b5466b90f26cdc16f36f9755c6f7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_EMPLOYEE_SESSION_RACE_GUARD_ENTRY_504_2026-09-30.md` | `62ab7848a554f6c888a96b94bbabdf12b001721a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ENTRY498_ENTRY499_MANUAL_ARTIFACTS_READY_ENTRY_501_2026-09-30.md` | `1d56a7cdce76b9481aa532625f78adac61eebdde` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ENTRY499_NO_WRANGLER_DIRECT_UPLOAD_READY_ENTRY_502_2026-09-30.md` | `24a3d50ca9413e27c73fcd5925cc1b7e3c42bf55` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ENTRY499_VERSION_CREATED_AWAIT_PROMOTE_ENTRY_503_2026-09-30.md` | `689dfb4e888953b5e835b63d261e8a45397c3d88` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ENTRY504_FRESH_LOGIN_FAILED_ENTRY_506_2026-09-30.md` | `f8d2adc29001fcf88753dcca900fee7783ccd2a8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ENTRY504_PRODUCTION_DEPLOY_CHECKPOINT_ENTRY_505_2026-09-30.md` | `cc3543478f8ce2d06de303af4db46a9df68912c9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_FRONTEND_EMPLOYEE_API_DISPATCHER_A61_ENTRY_482_2026-09-29.md` | `d7e02034539ad9bed92e9dfa13a711b7f25af079` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_FRONTEND_SESSION_PERSISTENCE_AND_ZERO_GOOGLE_READ_ENTRY_499_2026-09-30.md` | `c1d9d8a2d5e956a0ee51325281a1208744a429ca` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_GENERAL_CREATE_4323_CANARY_READY_ENTRY_443_2026-09-28.md` | `898b5727a2ba00b90c94a7c0649fc3805550632b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_GENERAL_CREATE_LIVE_ENTRY_447_2026-09-28.md` | `9e30a7bd182d28eaffb1a23a3006e9eab2c16c2c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_HYBRID_READ_OVERLAY_MAIN_LIVE_ENTRY_440_2026-09-28.md` | `dec8ad802ce37c88393e87525d4666abda760634` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_LASER_SERVICE_02CR_ENTRY_453_2026-09-28.md` | `4f498cba66a2726f000cb124c219b7a54b14e2fd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_LEGACY_CREATE_FENCE_COLLISION_4322_ENTRY_449_2026-09-28.md` | `19db3b58651063f8651fbc61128eb8f9762dff5c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_LEGACY_ORDERS_PRODUCTION_REPAIR_ENTRY_599_600_2026-10-02.md` | `a11cc1d691bbc42f4b2fbcb879fda938d1ce3523` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_LEGACY_WRITERS_LIVE_SHEET_4322_REKEY_ENTRY_451_2026-09-28.md` | `0818f31ca8e5331a799a9c8f8dba3c5dcf74dcd2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_LIVE_LASER_ORDER_4324_DISPLAY_GAP_ENTRY_454_2026-09-28.md` | `9c7934697ba54da5f89699e63c885b8c75e0714e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_NATIVE_EMPLOYEE_AUTH_FOUNDATION_A61_ENTRY_479_2026-09-29.md` | `c34beddaf1b07e20b9d4887d2e396842523b1c46` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_NEW_CHAT_FREEZE_AFTER_ENTRY499_DOWNLOAD_FAILURE_ENTRY_500_2026-09-30.md` | `34454c371b2417dde78d963deb116c9242508606` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_NEW_CHAT_HANDOFF_AFTER_CUSTOMER_A55_2026-09-29.md` | `8765685148a0bf22c6c0e060fb52f6af941dcdc5` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_NEW_CHAT_HANDOFF_AFTER_D1_7500_DIAGNOSTICS_2026-09-27.md` | `7b065528c599d30d55c268c3740e363a1b0e44c7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_NEW_CHAT_HANDOFF_AFTER_EXACT_KEY_REPLAY_2026-09-22.md` | `fa9be2caf77f6c282ede9e8d4a7bc9d18ceb5c12` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_NEW_CHAT_HANDOFF_AFTER_SESSION_ROOT_CAUSE_ENTRY_532_2026-10-01.md` | `650c70a522c36568ffece6f62a0cb0f60db82912` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_OPERATIONAL_RUNTIME_LIVE_ENTRY_442_2026-09-28.md` | `c2a2c3a706917380b92054bfe81b3f17983f7154` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ORDERS_02CR_DEGRADED_ENRICHMENT_VISIBILITY_ENTRY_496_2026-09-30.md` | `051b38e465d1802eb78a48dad1925075c0922cd4` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ORDERS_D1_SNAPSHOT_ZERO_GOOGLE_VISIBILITY_ENTRY_498_2026-09-30.md` | `40c1c27d8adaf5267516221e313e6ad7f65ed316` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ORDERS_READ_WRITE_AUDIT_ENTRY_448_2026-09-28.md` | `d848d3827cdef6c96fc448ea33d531fad3db136e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ORDERS_SESSION_D1_SHADOW_HANDOFF_ENTRY_497_2026-09-30.md` | `a477e4cc5896121fa0a59ee9fc48b28fcde6c637` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ORDER_4322_PRINT_UI_VISIBLE_ENTRY_441_2026-09-28.md` | `6d077a3164fba5c04874a5536815d6473a4c01c3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ORDER_4323_CANARY_VERIFIED_ENTRY_446_2026-09-28.md` | `7c24158d291de5feb5fbfd1dece40a2120e82db0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ORDER_4324_CUSTOMER_SERVICE_VISIBLE_ENTRY_456_2026-09-28.md` | `a3398c28ac4b438ef3fd78b5d56bf881f20421d1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ORDER_4324_LASER_VISIBLE_ENTRY_455_2026-09-28.md` | `b9f727428e390a0c073710c8de35ebe402be024c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_PRODUCTION_ARM_ONE_SUCCESS_A17_2026-09-27.md` | `e163fedfb6f09e771e4990b0da34e7fdef2c3d23` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_PRODUCTION_CREATE_4322_A18_BLOCKED_NO_CREATE_2026-09-27.md` | `b4168284059fe67d72be320b6f027c8a3ac1733a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_PRODUCTION_CREATE_4322_SUCCESS_A19_2026-09-27.md` | `1f0339eb807e73a07e02abad3bbac1a3b4c64948` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_PRODUCTION_INSTALL_DISABLED_SUCCESS_A16_2026-09-27.md` | `12f0ca2841bd3c88e19ec90351b21800f3e70892` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_READ_OVERLAY_ENTRY_438_2026-09-28.md` | `93099c638c9c1095e95be9b8aa4daa8fd574a540` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_READ_OVERLAY_UI_FALLBACK_ENTRY_439_2026-09-28.md` | `f36653299287a3ac310fcc0cba87f5b739bc0c25` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_REPOSITORY_ROADMAP_INCIDENT_REVIEW_2026-09-24.md` | `71cfde170353585be33e546d7ef5dd5040fc67a6` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_STALE_LEGACY_ORDERS_DIAGNOSIS_ENTRY_596_2026-10-02.md` | `129e702df02ddc37854bb5751f81def38c8eb6c2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_ZERO_GOOGLE_CUTOVER_A56_A58_ENTRY_477_2026-09-29.md` | `6ceeaf31877c313212292a83b1f3156200939db9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/book-agent/AGENT_LOG.md` | `6e4398fbd10f8d599973d6a2a0c9965353731111` | UNREVIEWED | UNKNOWN |
| `docs/trendos/book-agent/BOOK_VNEXT_OUTLINE.md` | `c793ba7f4f929ab4778022dc7f1c6ef6ad5c63c8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/book-agent/README.md` | `7ff9ea1f8ea29a4b07975b69c2b14b7e2e4dbb9a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/book-agent/TEST_EVIDENCE_QUEUE.md` | `e210a108cb7821aa44e20be69058ab474611d0e8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02A_CONTRACT_IMPLEMENTED_2026-09-05.md` | `aed7dd7cff57afdd663ec0ad3bcb4e4e2f79ad74` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02B_ROUTE_WIRING_2026-09-05.md` | `ffa7629846d920924dced4e2e898e3b6e2f8960b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02C_CONTRACT_TESTS_2026-09-05.md` | `0867ff62e92c9fe6d9dd36511b846ed811ad3cea` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02D_CI_SAFETY_WIRING_2026-09-05.md` | `a20327a0dbd2fee8fc79b292fed9d9af4b8a4030` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02E_RUNTIME_WORKFLOW_WIRING_2026-09-05.md` | `cdbe697a66749c741612ecd59df1c7fa189914c5` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02F_NATIVE_CI_ALIGNMENT_2026-09-05.md` | `9ef4078f22d261b6f75e3f657bd1d875fc34f005` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02G_RUNTIME_DEPLOY_SYNC_2026-09-05.md` | `5bb530e71acd923003ec2e082499a8af9275bf98` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02H_RUNTIME_CI_PROOF_2026-09-05.md` | `1ed77dbddca8ea01f662608195c75f79bafab767` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02I_PERSISTENCE_READINESS_CI_PASS_2026-09-05.md` | `bfd4ac09f23ce407e8e04fd112ea2a8640bd9755` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02J_RUNTIME_READINESS_DIAGNOSTIC_CI_PASS_2026-09-05.md` | `9268dd69710a3bcb0ddae7394c5cf18b45b59fce` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02K_LIVE_PERSISTENCE_READINESS_PREVIEW_PASS_2026-09-05.md` | `d072719bc10304e35e9c0eae9ad7b4f878eab7ba` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02L_PERSISTENCE_SCHEMA_PREFLIGHT_CI_PASS_2026-09-05.md` | `8918328b1236f9a847da73db4122c92c5691a713` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02M_RUNTIME_SCHEMA_PREFLIGHT_ENDPOINT_2026-09-05.md` | `256629060e101dfe5dc5bab39ddfa7b5e6ae9a34` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02N_LIVE_SCHEMA_PREFLIGHT_FAIL_CLOSED_PASS_2026-09-05.md` | `aebd8fcfd2139f1ea3ffacd9ca5d37ef4d600bd7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02R_LIVE_BINDING_PROBE_IMPLEMENTED_2026-09-05.md` | `071b155b589b3daa37297cb87b6366eacaf44bf2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02S_SCHEMA_GAP_BASELINE_RUNTIME_WIRED_2026-09-05.md` | `063b713af3d93da00f1dc9c62c14518a61cdb7d7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02S_SCHEMA_GAP_BASELINE_STARTED_2026-09-05.md` | `e3a5a09fcadc2b7cafc351cfe388bef2fae8c7a8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02T_ISOLATED_PREVIEW_SCHEMA_APPLY_PASS_2026-09-05.md` | `5554bcf127711c52605804f5be47cb8404cba896` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02_CONTRACT_PLAN_2026-09-05.md` | `9644c1247f506a54184bd45266020ed19d92741d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_02_PASS_2026-09-05.md` | `6dd90d55358cd42efff2381b8d0485517ed3a29e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_DEV_LOG_2026-09-05.md` | `99aee707fb9b4d09a7f1ad25bf712b893547feaf` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_CF_RUNTIME_PASS_2026-09-05.md` | `69f164a34bfe1a847704b22408419d66c3e00e8f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_EASYSTORE_ASSESSMENT_2026-09-05.md` | `f65f8b8956571b39c49727f31d6ac9bdf4bacbd4` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_EASYSTORE_BASELINE_CORRECTION_2026-09-05.md` | `1fa51dd03d58838d5ff37938179bfbe1252dcb66` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_EASYSTORE_BASELINE_IMPLEMENTATION_2026-09-05.md` | `8962572881a0e7f4865c38d7d70e2871903de437` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_EASYSTORE_MIGRATION_MATRIX_2026-09-05.md` | `e123558cb64fa84289042e5b2a41feb432e753f3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F1_FOUNDATION_PASS_2026-09-05.md` | `e8eabab429618086a49a6e6d9fb2e13fac1abcf3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F1_FOUNDATION_START_2026-09-05.md` | `cf9db3dbf03e1d73467bdbfd97946f896e46b4d7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2A_PREWIRE_HARDENING_2026-09-05.md` | `7994d8fa9ead951fb37077f6169723d944fc7138` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2A_SAFE_FINANCE_IMPLEMENTED_2026-09-05.md` | `813490000977cb789ff0876cccb97af0b672299e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2B_SAFE_FINANCE_TESTS_2026-09-05.md` | `bd1c86e6e6d96f42cac9187610aa43cfd526a435` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2C_PLANNING_API_WIRED_2026-09-05.md` | `2055a3f9140bc005d262f7dbd49bb9c1cef76848` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2D_RUNTIME_VERIFICATION_WIRED_2026-09-05.md` | `52dfb91f028f2fc66d610d44900de6c1f60c5cbc` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2_D1_ADAPTER_MAPPING_START_2026-09-05.md` | `9dda35ba05bb15ba13420a21be56e4b6ec7f5473` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2_D1_ADAPTER_PREPARED_CI_PASS_2026-09-05.md` | `e4c136cbb1adec7c6087fafba78e2be8a45a0481` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2_FINANCE_CORE_IMPLEMENTATION_A_2026-09-05.md` | `c37a9df4ba22f42a3d05cd9ea188add60b89dab1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2_FINANCE_CORE_PLAN_2026-09-05.md` | `af3c75262848ee8dda3f32685de0289bfdb58e0c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2_FINANCE_CORE_START_2026-09-05.md` | `d55ed1d67e5d060945ac0a6c91b7a5cff1cf2e90` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2_FINANCE_PLANNING_PASS_2026-09-05.md` | `505af9f6cdd00ce1fa2f4b8da4a5a19e6654d229` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2_PERSISTENCE_APPEND_ONLY_CORRECTION_2026-09-05.md` | `28b0b4c2c40e76b9fca2f5528dc4bc345397bbda` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2_PERSISTENCE_PREP_PLAN_2026-09-05.md` | `628c014f5cbb5ddb50b5e17273a174fe34f96b26` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2_PERSISTENCE_SCHEMA_PREPARED_2026-09-05.md` | `f9190b8d31507360a2cdefe4e0d73efa8088c261` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2_PERSISTENCE_SCHEMA_TESTS_ADDED_2026-09-05.md` | `3129d3bdcebc17d3693c2fe093d3ffbb09bdf4aa` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2_PREVIEW_CALLER_IMPLEMENTED_2026-09-05.md` | `e88c7cccc9eb67e4a5f0ce5d16269483c18f6323` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2_PREVIEW_CALLER_NATIVE_CI_WIRING_2026-09-05.md` | `735ab9c686ef981a2835870f7c80a1229e62827e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_F2_PREVIEW_PERSISTENCE_GATE_2026-09-05.md` | `c12ed7264f84a8bc9b858da2b4ee4ee3f8c8afbc` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/ACCOUNTING_NATIVE_TRENDOS_DIRECTION_2026-09-05.md` | `f730ed7d7acaaf69519d5c7622eb8213918b15ac` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/CF01_CLOUD_WRITE_LANE_2026-09-03.md` | `51666e3db682563067ef8143a86557b1f8066431` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/CF02_AUTOMATIC_CLOUDFLARE_PIPELINE_2026-09-03.md` | `7442438e71fd2a24321915a47830e5d7f8833a2a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/CLOUDFLARE_EDGE_GATEWAY_V1_2026-09-03.md` | `d9a4c22f9f11b907301a8b954904590a85710ca0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/GS01_SHEETS_ONLY_STABILIZATION_2026-09-03.md` | `c023b1912597020dfc7a83fc21e16b19338c1b2c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/GS02_EMPTY_ROWS_CLEANUP_2026-09-03.md` | `f5b48a5451310da54bec64965f183a67f2ecc376` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/GS03_APPS_SCRIPT_TIMEOUT_HOTFIX_2026-09-03.md` | `f7f198653da3a6141222f698c61cf64dd44c2279` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/GS04_PENDING_MODIFICATIONS_LEDGER_POINTER_2026-09-04.md` | `027b62459189bfa90de6856ca5d7cfac3b84a941` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/GS04_SAVE_TIMEOUT_HOTFIX_2026-09-03.md` | `c8118b8bc45685cb6d5b3c3063a93fe705ce32e6` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/GS05_BACKEND_CONSOLIDATION_REVIEW_2026-09-04.md` | `1a2d9316116abd863a00279038780b2d61d822d3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/GS06_UNIFIED_BACKEND_BUILD_GATE_2026-09-04.md` | `da4a6c85e430be00cd3f2ccdad33e16f9c698949` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/MATBAGY_AUTO_FINAL_SELECTION_2026-09-04.md` | `69f01168c520e93b505fac8dabacbbb7873961b6` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/MATBAGY_AUTO_PERSIST_2026-09-04.md` | `f416c5ae66f83e3e3e238fff930f60981eca15c2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/MATBAGY_DRIVE_SINGLE_ROOT_2026-09-04.md` | `0f41881a08142178a39ff2d1e45d6c6c3c44c3a9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/MATBAGY_FOKHA_ROUTING_SYNC_2026-09-04.md` | `b2f9a8c840ff5fb2fe0f4a76bffcf3cd5258f79c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PD04_APPS_SCRIPT_FILE_LIST_2026-08-31.md` | `a4f1643d397331dcdafef89e1ba7f323150acc93` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PD04_RUNTIME_EXECUTION_BASELINE_2026-08-31.md` | `0502749049cdf95bfc35e9b02ca93236fc83f5c8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PD05A_FOUNDATION_RUNTIME_PASS_2026-08-31.md` | `a3b6ef413f90054a5d0ad63ea8c7a23128a76c54` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PD05B_ORDER_LINE_HEAD_INSTALL_2026-08-31.md` | `14b536a764de094dc9ff3f9a0ff212313f173316` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PD05C_ATTENDANCE_CLEANING_INSTALLED_2026-08-31.md` | `7fe76bde99d8f7e420f228382955785f15a74296` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PD05_FOUNDATION_INSTALL_USER_CONFIRMED_2026-08-31.md` | `11e4125d586c556658585fdd610d21a7b9fe33a8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PD05_FOUNDATION_RUNTIME_SELFTEST_PASS_2026-08-31.md` | `cc6a60737d53c9f59f960d8bd1bf874f98e0b251` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PD05_FOUNDATION_SELFTEST_ASSERTION_CORRECTION_2026-08-31.md` | `5e8f769496a7e7ae9a9e61669417c6e9afcbaa9e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PD05_RUNTIME_FUNCTION_PICKER_FIX_2026-08-31.md` | `4e999d23c33ed1dcf4c13e73d4bd387b7ac366c0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AA_APPS_SCRIPT_HEARTBEAT_ROUTE_SAVED_PENDING_DEPLOY_2026-09-04.md` | `b14059f42fe3eff231b637e31d0566360604ea1d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AB_APPS_SCRIPT_V149_DEPLOYED_2026-09-04.md` | `d83c6d881e8eae27d108bc7b57c2dfc44c1e2e9a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AC_APPS_SCRIPT_HEARTBEAT_ROUTE_PASS_2026-09-04.md` | `d53ed0a51ce38ff91ceab0ab1f97bfab25005ab2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AD_DUAL_SIGNAL_PREVIEW_AND_CI_PASS_2026-09-04.md` | `32b18f995ff6980395563051d2b3b58a3dab9004` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AE_PRODUCTION_PREFLIGHT_OBSOLETE_URL_2026-09-04.md` | `1f6051fbdf0a5bd208a7e202288d2805dfb011e7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AF_PRODUCTION_PREFLIGHT_PASS_2026-09-04.md` | `82934dd726590a8818c627eb0c52726cc93268d2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AG_PRODUCTION_DUAL_SIGNAL_CONFIG_CI_PASS_2026-09-04.md` | `baa71297534059f74d3ce55d55a847bdb482c9e9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AH_PRODUCTION_DUAL_SIGNAL_BACKEND_PASS_2026-09-04.md` | `a2d7775639dc83d59a7ad8b62a91af1d714bae56` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AI_PRODUCTION_FRONTEND_ORDERS_CUTOVER_2026-09-04.md` | `3e9aabd7436293b5f9cee6f370b55def88cccf0d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AJ_LIVE_FRONTEND_CUTOVER_PROBE_PASS_2026-09-04.md` | `2ef756cdc4295e1593c4f238d86de29885b3edd9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AK_CLOUD_WRITE_RECONCILIATION_ISOLATED_PASS_2026-09-04.md` | `57df9842084d6983ccc570d12055e450bb81d6ed` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AL_DEDICATED_STAGING_D1_CLOUD_WRITE_PASS_2026-09-04.md` | `0df5764290cd2cbfb9630053a42dfba8f446e8a2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AM_REMOTE_STAGING_RECONCILIATION_NO_SHEETS_PASS_2026-09-04.md` | `2bf9d55b92106db53282389a662f625db9b0a958` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AN_APPS_SCRIPT_RECONCILIATION_DRYRUN_CONTRACT_CI_PASS_2026-09-04.md` | `ef23b533a982a550f4c1d2a7ee5c8942b185c8c0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AO_CODEGS_V150_DRYRUN_CANDIDATE_INTEGRATED_PASS_2026-09-04.md` | `e71dc65b8f1b1e4ca1279c26bf0210e6ace2b74b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AP_LIVE_V150_ROUTE_NOT_INSTALLED_2026-09-04.md` | `00ea5d60ce6ebd76a12c9fbecd5e341ea33b29a7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AQ_APPS_SCRIPT_V151_ROUTE_STILL_NOT_INSTALLED_2026-09-04.md` | `c63f7312dacb1ecd7933c163a238d8abce29e1dd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AR_APPS_SCRIPT_V152_DRYRUN_ROUTE_INSTALLED_LOCKED_PASS_2026-09-04.md` | `9ef08d8ba4d96e5710ea085dc1cf5bbc305107f5` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AS_V152_SECRET_GATE_AUTH_LOCK_PASS_2026-09-04.md` | `a60b1e7f178a14abe4e86f52a3eb6378aee21efe` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AT_AUTHENTICATED_DRYRUN_SELFTEST_CI_PASS_2026-09-04.md` | `c7802a79378c65d9a03159b867830100ef1e96df` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AU_STAGING_SYNTHETIC_PULL_BRIDGE_LIVE_PASS_2026-09-04.md` | `85ed909deca5beae5445b3c38d150d32cc70225d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AV_STAGING_D1_TO_APPS_SCRIPT_DRYRUN_LIVE_PASS_2026-09-04.md` | `1a92eb5439966ddcccc0176aafbc874b28eec46f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AW_CLOUD_WRITE_SHADOW_REHEARSAL_CI_PASS_2026-09-04.md` | `eb15042670c255dda539f319c5777ded694cc26c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AX_SHADOW_SHEET_REHEARSAL_LIVE_PASS_2026-09-04.md` | `65724af9dac4ee5085466ee7b49f7d76efdedd44` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AY_SHADOW_REPLAY_NOOP_RUNNER_CI_PASS_2026-09-04.md` | `be9bcd40b94dc8eea0ad014b4dbe7d0791be0ee8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02AZ_REHEARSAL_REPLAY_NOOP_LIVE_PASS_2026-09-04.md` | `aabad73900b83489b7f4947bbac207ae92cb7841` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02A_CLOUDFLARE_PREVIEW_SAFETY_2026-09-04.md` | `0773e32e83a1f415c64e6a750d00953633ed0aac` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BA_PRODUCTION_CLOUD_WRITE_PREFLIGHT_READONLY_PASS_2026-09-04.md` | `7c24eab55b2aa7b1e0e740c5d2e2bd5992373fdb` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BB_CANONICAL_ORDER_WRITE_CONTRACT_AUDIT_V1_BLOCKED_2026-09-04.md` | `f3606ed2bae7a4be7dbb5940b1ca54dd755ae3b2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BC_CLOUD_WRITE_ORDER_CONTRACT_V2_CI_PASS_2026-09-04.md` | `e5ea6155cb8d927b685388e392296b8b0f8485f5` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BD_CLOUD_WRITE_ORDER_V2_STAGING_LIVE_READONLY_PASS_2026-09-04.md` | `3ef6dca9c88b28bc0c863ab548c5313e6f7aa91c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BE_APPS_SCRIPT_V2_CANONICAL_ADAPTER_DRYRUN_CI_PASS_2026-09-04.md` | `4829fa2758d30cf34e9c9e09c3873ca6115d5b89` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BF_ISOLATED_CANONICAL_STAGING_SPREADSHEET_PROVISIONED_2026-09-04.md` | `630d885dac65492dba59b9681b44fb4f26dde656` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BG_ISOLATED_STAGING_RUNTIME_PREFLIGHT_CI_LIVE_DATA_PASS_2026-09-04.md` | `a1b72c09c7854acef9149cb7c6c6c0c8fd0eaea3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BH_STAGING_SYNTHETIC_AUTH_BRIDGE_QUALIFIED_2026-09-05.md` | `ce0f5995ae24312a332c0bf25431a3fd5b42068e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BI_CANONICAL_STAGING_SIDE_EFFECT_SHAPE_QUALIFIED_2026-09-05.md` | `0a7e36d2e2657eac2940b861c16602bbb25d70ce` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BJ_STAGING_CANONICAL_TARGET_IDENTITY_QUALIFIED_2026-09-05.md` | `26f854fd105edfbc291f2ff1639e00a0d532896b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BL_STAGING_FIRST_CANONICAL_WRITE_RECOVERY_READY_2026-09-05.md` | `bdf4c270329c0001f2acc1c198db38bd10c82fba` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BM_STAGING_CANONICAL_FIRST_WRITE_POSTVERIFY_PASS_2026-09-05.md` | `8a0d7855fcc349cbb6ff76d9f25f2c99d9c888ff` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BN_STAGING_CLOUDFLARE_APPS_SCRIPT_BRIDGE_PREDEPLOY_PASS_2026-09-05.md` | `e6e57e1b72613676044db8fb4b9f5ef2d61e49e8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BP_V2_STAGING_BRIDGE_ROUTE_WIRING_BLOCKED_2026-09-05.md` | `44dfb61c697431c50b1b19b138ee3f9391c4cf00` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BQ_V2_STAGING_BRIDGE_LIVE_PASS_2026-09-05.md` | `b87d06ce74d012e68e91e2a14ca1509437ae4697` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BR_V2_STAGING_BRIDGE_POSTWRITE_VERIFICATION_2026-09-05.md` | `ece667be128c985ca3856e9411065623793941e6` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BS_V2_PRODUCTION_SHADOW_GATE_PASS_2026-09-05.md` | `4c7b5fb9263a04f1b167118a766c0dfe4560a2ef` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BT_V2_PRODUCTION_SHADOW_PREVIEW_LIVE_PASS_2026-09-05.md` | `67c69cebd93afbe5c81e831734579279b4b1173a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BU_V2_PRODUCTION_SHADOW_CANDIDATE_PASS_2026-09-05.md` | `fb6fe27948d439c983f1358ff2783da60bbcb038` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BV_V2_PRODUCTION_SHADOW_INTEGRATION_CANDIDATE_PASS_2026-09-05.md` | `6bcca19f264c9d36430428c075ff33cac2cc411d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BW_PRODUCTION_DEPLOY_TRIGGER_AUDIT_PASS_2026-09-05.md` | `89349fc1fedabd7bae87dc2f064beb74b0efdada` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BX_PRODUCTION_SHADOW_WRAPPER_DEFAULT_OFF_NO_DEPLOY_PASS_2026-09-05.md` | `af6f51278d887de65c5666f0049120edea492686` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BY_DUAL_SIGNAL_FRESHNESS_SHADOW_REQUAL_CONTROLLED_DEPLOY_PREP_2026-09-05.md` | `fe156ecc90e349afe4d952285d45d80c6a7e925a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02BZ_PRODUCTION_SHADOW_WRAPPER_DEPLOYED_OFF_2026-09-05.md` | `22859917d84426f97594a96e91dedb5f498061b9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02B_FRESHNESS_POLLING_2026-09-04.md` | `b96fb3c864865036057cd9a59b9904ff46f3c9f1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02CA_PRODUCTION_SHADOW_READONLY_ENABLED_2026-09-05.md` | `2c262f28a760d4ed0fb606bea16a03695aec2941` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02CB_PRODUCTION_SHADOW_STABILITY_PASS_2026-09-05.md` | `0796111b31464179385bbdfbfcfc9a19bde464ab` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02CC_PRODUCTION_CLOUD_WRITE_SCHEMA_READONLY_2026-09-05.md` | `35b8cbea4ea0b3c912f9d44beec01c6c0a25543c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02CD_PRODUCTION_SCHEMA_MIGRATION_GATE_PREPARED_2026-09-05.md` | `be94a3bd6c33e1b6003c08e646ff2057fceab14d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02CE_PRODUCTION_SCHEMA_0003_APPLIED_2026-09-05.md` | `fdb5f07c001bbe87405345b18bd0995b29254286` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02C_EDGE_AUTH_FRONTEND_LOADING_2026-09-04.md` | `33e6d689178f5f652ad79166d1cf4070103689b0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02D_LATEST_RUNTIME_2026-09-04.md` | `402792af0d3e3603913169ca7619957f3ef09db9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02D_SYNC_FRESHNESS_BLOCKER_2026-09-04.md` | `73611f96672c4af5e863458dccd916a994264701` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02E_D1_FRESHNESS_RECHECK_2026-09-04.md` | `2690622fec74878051cdd355dd308838eb6c0f8f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02E_D1_QUOTA_DELTA_V2_2026-09-04.md` | `af4d1d00fb67ead10847552abb65640a215da23a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02E_ORDERS_EDGE_PRODUCTION_GUARD_2026-09-04.md` | `6ba24158b18c3f50bdcc173fd6867d57cc0df413` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02F_LOW_USAGE_AUTOTICK_RUNTIME_PASS_2026-09-04.md` | `89d355078f016e76cde133b070cde96340d00507` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02F_ZERO_IDLE_D1_2026-09-04.md` | `3b799812b4f780444d1e9194b30734aa4cc336d3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02G_RESUME_FROM_02F_2026-09-04.md` | `ec643deb31289062696569514aba6aaef967c004` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02H_FRESHNESS_RECHECK_AFTER_LOW_USAGE_2026-09-04.md` | `925a14e4f7cdb93926f5529471963f99588d5d60` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02I_IDLE_FRESHNESS_MODEL_DIAGNOSIS_2026-09-04.md` | `1e3e6d31fc81594732e8811228f96da701c33502` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02J_LOW_USAGE_HEARTBEAT_ROUTING_INSPECTION_2026-09-04.md` | `0489fa75dd1fa20c8ca28cb72af62c8e0e673c5e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02K_DUAL_SIGNAL_FRESHNESS_GITHUB_IMPLEMENTATION_2026-09-04.md` | `8ad8ce6c0929cb74a289126ffb9900624d42ffb1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02L_DUAL_SIGNAL_FRESHNESS_CI_WIRING_2026-09-04.md` | `f8dd5a093cbda69377885995886ce4c55cc86e5b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02M_DUAL_SIGNAL_FRESHNESS_CI_PASS_2026-09-04.md` | `23d818ccbe9922850b4b0da2b59211e36af0f460` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02N_APPS_SCRIPT_HEARTBEAT_ROUTE_FEASIBILITY_2026-09-04.md` | `a8deeda395d80d875c9774610184ed18236e8f71` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02O_HEARTBEAT_HELPER_AND_EDGE_VERIFIER_IMPLEMENTATION_2026-09-04.md` | `6bd8e0740dae8073753f2da0be430738f2ea566d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02P_HEARTBEAT_HELPER_VERIFIER_CI_WIRING_2026-09-04.md` | `78f8c763c47e5db74f91d15f38d7666a1e59d8c8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02Q_HEARTBEAT_HELPER_VERIFIER_CI_PASS_2026-09-04.md` | `698a27995f9626577379a561c1f463cc99ccfdcf` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02R_AUTO_PREVIEW_SAFETY_PASS_LEGACY_FRESHNESS_BLOCK_2026-09-04.md` | `422bb8935b2f445fa01ffa3dd6349723d22f8efd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02S_DUAL_SIGNAL_PARITY_HARDENING_BOUNDARY_2026-09-04.md` | `ccd172818b5f3b41b59fdf142005770ffd5c450e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02T_DUAL_SIGNAL_ORDERS_LINES_HARDENING_CI_PASS_2026-09-04.md` | `399b0e3b2c8f96a2d46ca3d5a64bfa5ae5999a63` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02U_DUAL_SIGNAL_PREVIEW_QUALIFIER_SAFE_SKIP_PASS_2026-09-04.md` | `f98b7650f4362fee29f7d50dedaed57eae7ea579` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02V_LIVE_HEARTBEAT_ROUTE_PROBE_NOT_INSTALLED_2026-09-04.md` | `1eb49d7822d32be839f2441b5b0c2332a428c3e4` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02W_NO_AUTHORIZED_APPS_SCRIPT_SOURCE_DEPLOY_PATH_2026-09-04.md` | `2698e43cf0390f8a2529e25f3cddf7e5705806e8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02X_APPS_SCRIPT_HEARTBEAT_HELPER_SAVED_2026-09-04.md` | `733df8e17ed0c8333841e4d65feab08bce60e68a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02Y_LIVE_CODEGS_ROUTE_LOCATION_CONFIRMED_2026-09-04.md` | `470559af82b46d29672122bb0e3d1b019d1c4dc7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/PERF_CF_02Z_APPS_SCRIPT_DOGET_HEARTBEAT_ROUTE_PATCH_PREPARED_2026-09-04.md` | `86b5052c3d24a4f187b579feda26dd037d9c03e6` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/RP03E_PRESS_CONSUMER_CONTRACT_2026-09-01.md` | `be388b75c71579baf606b26b615c720a7e2cf2ed` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/RP03_CORE_P0_PREVIEW_2026-09-01.md` | `21387d5140d4afb629c0344661c94607467e9eaa` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/RP06_3536_READONLY_RECONCILIATION_2026-09-04.md` | `703fd62f998d984460f88a7243bbcb627b16062e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/RP06_PRESS_DUPLICATE_HISTORY_FILTER_FIX_2026-09-04.md` | `716f912f2f36292083f23211de8485e5383d5c55` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/WHATSAPP_META_COEXISTENCE_REASSESSMENT_2026-09-05.md` | `36c0758a7d6d490b4dd19d6bd4d8af1f333f4e85` | UNREVIEWED | UNKNOWN |
| `docs/trendos/checkpoints/WHATSAPP_META_ONBOARDING_FAILURE_CONFIRMED_2026-09-05.md` | `cb0ec7d8c07bed9b94ae871d01528a1be749d58f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/implementation/PHASE2_ORDER_LINE_INTEGRITY_CHECKPOINT.md` | `1b4418ee9cc1547e54fd239da58aefbca645b60f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/implementation/PHASE3_ATTENDANCE_CLEANING_INTEGRITY_CHECKPOINT.md` | `ca89a4293bfc5cf995ce9f5bbb199d7c3d919ef6` | UNREVIEWED | UNKNOWN |
| `docs/trendos/implementation/PHASE4_PRESS_INTEGRITY_CHECKPOINT.md` | `d7432fe5517414c6d42be8641c910b1803dc48ce` | UNREVIEWED | UNKNOWN |
| `docs/trendos/implementation/PHASE5_INVOICE_READY_SWEEP_INTEGRITY_CHECKPOINT.md` | `d1f97d0b4f23a44e64b777b808c05e7cd583fbef` | UNREVIEWED | UNKNOWN |
| `docs/trendos/implementation/PHASE6_WHATSAPP_WEBHOOK_INTEGRITY_CHECKPOINT.md` | `6526fea13d20805b1a22082b23e7105f60883cc0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/inventory/APPS_SCRIPT_TRIGGER_INVENTORY.md` | `1fe31023dc423fbf63df06c5b7a8d1231f4a0f25` | UNREVIEWED | UNKNOWN |
| `docs/trendos/inventory/ATTENDANCE_CLOCKIN_INVENTORY.md` | `1d53882034e6eaf82c688ba4b3c8f32467a9a79e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/inventory/AUTH_PATH_INVENTORY.md` | `a562ecc399f804847201c0a1758c9d4a3a036cfa` | UNREVIEWED | UNKNOWN |
| `docs/trendos/inventory/CLEANING_INVENTORY.md` | `a42093de66be7abc81181ceb953f5337292d40ff` | UNREVIEWED | UNKNOWN |
| `docs/trendos/inventory/D1_ATOMIC_SYNC_INVENTORY.md` | `2c9d50d91acd011e165f03c6f17a6b5a0f4ee8a5` | UNREVIEWED | UNKNOWN |
| `docs/trendos/inventory/D1_DASHBOARD_PATH_INVENTORY.md` | `d76fd211f0f2dee2b372279b86f1b0dbf18e41d1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/inventory/D1_READ_PATH_INVENTORY.md` | `51c73fa6f4d665efca464003a2f5e2e5b3e0835d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/inventory/D1_WORKER_ATOMIC_ROUTING_INVENTORY.md` | `a9437329c2a56d337574d6e3d03123112bdab2e3` | UNREVIEWED | UNKNOWN |
| `docs/trendos/inventory/HANDOVER_OPS_INVENTORY.md` | `c7ba9fa9d1dc820c7bf608d2c7cefc2114f19db9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/inventory/INVOICE_READY_SWEEP_INVENTORY.md` | `4147c12ca71a77c2d3350fd33b842c22fabf1915` | UNREVIEWED | UNKNOWN |
| `docs/trendos/inventory/LIVE_DATA_BASELINE_2026-08-30.md` | `d3ce94deca8634c2b7014fa9920f1d3586896fc0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/inventory/LIVE_SPREADSHEET_AUDIT.md` | `798e86a7b528b6e7b84572d72d5d490af28fc18b` | UNREVIEWED | UNKNOWN |
| `docs/trendos/inventory/ORDERS_LINES_INVENTORY.md` | `b620cba702b17d1a9c4acdcc0107dd1a7e011b0f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/inventory/PRESS_INVENTORY.md` | `807c1ac264c6fcc50c9cccdc973e3480156c99c1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/inventory/PRODUCTION_SOURCE_RECONCILIATION.md` | `46e8abd5e213c85e96c4bf154b635e70a6dcd0d8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/inventory/WHATSAPP_CUSTOMER_MANAGER_INVENTORY.md` | `4e0d42c516edf814d0c2b3a3aea273961e18b502` | UNREVIEWED | UNKNOWN |
| `docs/trendos/master-book/MASTER_BOOK_PRE_COMPACTION_SNAPSHOT_POINTER_2026-09-27.md` | `93e6ccee9f6070fe627fed8ccd6d852c0e02cb13` | UNREVIEWED | UNKNOWN |
| `docs/trendos/master-book/TRENDOS_CLOSED_COMPONENTS_INDEX.md` | `f7bdcc31377dede362b8baabb4e32fa645610d92` | UNREVIEWED | UNKNOWN |
| `docs/trendos/master-book/TRENDOS_COVERAGE_DELTA_05ca9c9_TO_67aae5c.md` | `59c9ac80050051e9694914ba82a5ea041c379a80` | UNREVIEWED | UNKNOWN |
| `docs/trendos/master-book/TRENDOS_COVERAGE_INVENTORY_05ca9c9.md` | `b74dae2e6db25ac210f043d77fd610def0a179f1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/master-book/TRENDOS_HISTORICAL_ARCHIVE_BATCHES_REGISTRY.md` | `42883183f463e35ba8e8dde6a453fead5e1bfe6a` | UNREVIEWED | UNKNOWN |
| `docs/trendos/master-book/TRENDOS_MASTER_CHANGELOG_ARCHIVE_PRE_COMPACTION.md` | `703049297f7d559269d4e5d91cd4d637cf29d558` | UNREVIEWED | UNKNOWN |
| `docs/trendos/master-book/TRENDOS_T12_JOURNAL_TITLE_INDEX_SNAPSHOT_2026-09-26.md` | `0f9a69c63d13e2150f0a525a2ed15e2473b611b9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/A51_CUSTOMER_SEARCH_DEPLOY.trigger` | `72040704ccf166436058da56499870e34968b99e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/A53_CUSTOMER_NATIVE_INSTALL.trigger` | `43c20585b2b9f1ebe463d98b7ea121d6469d70e2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/A53_CUSTOMER_NATIVE_RETRY.trigger` | `ee0a18820a5ad3858d693189694d901c7dc120cf` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/A54_NATIVE_CUSTOMER_SEARCH_DEPLOY.trigger` | `b0f2e80d16aa9d1e991ca1430a83dd28c99fb823` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/A55_CUSTOMER_PROJECTION_DEPLOY.trigger` | `d37b9064875963fa18cfcd655b798631799efbcf` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/A56_CUSTOMER_GENERAL_CUTOVER.trigger` | `2d3e33ba84a5e304c9512dac32ebf7aed20cd279` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/A57B_CLOUDFLARE_WORKER_FRONTEND.trigger` | `afe9d46a1539bd934dd317f06b92ee0d432325e9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/A57_CLOUDFLARE_FRONTEND_CUTOVER.trigger` | `265b71db58d75f247d6d7ead7998b6e4d009e7c6` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/A58_RUNTIME_ACTION_AUDIT.trigger` | `fa7f12a991378fed044001ec5569b7aaae75d0ae` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/A59_NATIVE_AUTH_PREFLIGHT.trigger` | `742a3200aa818583eddc9914f6d7f476db44f4ba` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/APPLY_ACCOUNTING_PREVIEW_OPERATIONS_SCHEMA.trigger` | `7fe3f6a6de3ad6af3d4f3365c0ed72b05295cf86` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/APPLY_APPS_SCRIPT_V150_DRYRUN.trigger` | `a1bc1ca1be1827cc6d0f6f1ca70e05a7fcf320f2` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/APPS_SCRIPT_02CL_PRODUCTION_RECONCILE_DEPLOY_MANIFEST.md` | `3f303df4821e7cb3d46f2eb9978c412e5bbf2c94` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/APPS_SCRIPT_V150_DRYRUN_DEPLOY_MANIFEST.md` | `ba99ad65d1f0046c4f3f7c6a2cad3cf5a0f44a32` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY613_DIYA_PRODUCTION_CANARY_MANIFEST.json` | `5a16c542945babe8202715c794c2424d1ff1bfff` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY614_ZERO_GOOGLE_EMPLOYEE_FUNCTION_MATRIX.json` | `ab211900a61aa2b9b9ccc2ac3751d424d376628c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY615_ZERO_GOOGLE_BACKFILL_MANIFEST.json` | `56575b0cb35e9f8b365f5470d0ce1b976df58636` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY615_ZERO_GOOGLE_BACKFILL_PREVIEW.json` | `8a9969cc086bb6f13680b986406d7aa4ed526230` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY622_TRENDOS_BRIDGE_READONLY_POLICIES.json` | `2f5fc5352c9fbc5337c50a89bb4891d4145e83bd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY623_DIYA_LOGIN_CANARY_17_POLICY_MANIFEST.json` | `36c492ad0bb0c765a38df2e38b450977ae824748` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY624_WAEL_SECOND_NATIVE_CANARY_17_POLICY_MANIFEST.json` | `962b445905dd6a173ded97e867a14647a86e3da8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY625_JABER_THIRD_NATIVE_CANARY_17_POLICY_MANIFEST.json` | `b80f5ad7b156ef4fc0467cc4bed119008f4e7b22` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY626_REMAINING_EMPLOYEES_NATIVE_CANARY_17_POLICY_MANIFEST.json` | `074fe0dd68f7ee751e1f886ad8e2aba43a2c2e3d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY627_EMPLOYEE_NATIVE_ALIAS_CANARY_MANIFEST.json` | `c58418d78f4bd41a008daf53d887c57aa8ea2830` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY628_CORE_READONLY_BRIDGE_REDUCTION_MANIFEST.json` | `1c0d4d44adb369be5f5c05b8b4d77d520b1ce681` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY629_CONTENT_READONLY_BRIDGE_REDUCTION_MANIFEST.json` | `ad96684f2bea7d564ddba2c8780628dd50e689d8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY630_COMMS_READONLY_BRIDGE_ZERO_READY_MANIFEST.json` | `3600ce0af96194276bec4c8d235835e495f63b0c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY631_BRIDGE_FREE_CANARY_AUTH_PREFLIGHT_MANIFEST.json` | `ff57fc3c33550978d76b647475786d5cb3241f57` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY632_BACKEND_BRIDGE_DISABLE_MANIFEST.json` | `2ce00f33d0e6128a5cab5f4e3c2d3bd5cc22b00e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY633_NATIVE_USERNAME_CANONICALIZATION_MANIFEST.json` | `09976ba6b3af7080c5e846c1632f466cddae6e37` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY634_DISABLE_LEGACY_AUTH_BOOTSTRAP_MANIFEST.json` | `dfcf1751b282ebe2b68c5498371eb06768b3bbd9` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY635_NATIVE_ONLY_BRIDGE_FREE_MANIFEST.json` | `e84814cfd9bc250c0512ee8106a58e2f90eead19` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY636_GLOBAL_NATIVE_COMPLETENESS_AUDIT.json` | `313e70f4635cb7190ee5a8e75aee35c58a1c2a8d` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY637_FINAL_SUCCESS_20261006.md` | `9bee0f2bb4ba8b43ce747907a93a33843bd31d12` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY638_RUNTIME_NATIVE_READINESS_20261006.md` | `6ff1bdd79c2fb594e65f2ee82f13d74593d21d11` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY639_GLOBAL_NATIVE_FRONTEND_CUTOVER_20261007.md` | `a657c769133d779c56c6011e5de0bfccd10f12a5` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY640_AUTH_CONTROL_NATIVE_20261007.md` | `54123c2374fa392d60c121dae3d5457f0fbb6641` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY641_LEGACY_AUTH_RETIREMENT_READONLY_20261007.md` | `a462518c4edc51250740a5db926f5bae77f13ec7` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY642_DEPLOY_RESILIENT_AUTH_HARDENING_20261007.md` | `476b9cd57a51052f039fdba85c5308f9f902d0e4` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY644_CORE_GENERAL_CUTOVER_20261007.md` | `1369e88d8f19144602adf32968f507f0f1c68839` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY644_CORE_GENERAL_CUTOVER_MANIFEST.json` | `261a86e6b4add8cd1907b98c01c01eec8259eae4` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY645_CONTENT_R2_FOUNDATION_ATTEMPT1_20261007.md` | `91be49db9bf8d3b515546c8c4f0929a7e05972ae` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY646_MANAGER_CENTER_CORE_DIRECT_20261007.md` | `8a5ebdfd351ee93afbda318b144935320c42b904` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY647_ENTRY648_EMPLOYEE_LOGIN_ATTENDANCE_REPAIR_20261007.md` | `8bf9a098c669b6a0c5d5d1ea0eb38f04febfc65f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY653_ZERO_GOOGLE_EMPLOYEE_LEGACY_PROXY_GUARD_20261013.md` | `c94c6683832024697772260c01fedc6e40628412` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY654_CUSTOMER_PORTAL_ZERO_GOOGLE_FOUNDATION_20261013.md` | `b19b2aae94c9cda10ef83f1a04e98d12e4397b90` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY655_CUSTOMER_ORDER_OWNERSHIP_GATE_20261013.md` | `89b65e43d63c6b47bcbf71283c677f13448da01c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY656_ZERO_GOOGLE_PUBLIC_HEALTH_READONLY_20261013.md` | `ee218c8de71787327f7db10aa55a1c86e6ab4d66` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY657_CUSTOMER_PHONE_OTP_ENROLLMENT_OFF_20261013.md` | `ceb1602af48caa9adc75115d2e9da46a611679d8` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY658_CUSTOMER_PHONE_OTP_ATOMIC_PROTOCOL_20261013.md` | `ed2d67cf4a4bc308fc4ed29fe89b234137f9c54f` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/ENTRY659_CUSTOMER_ONE_TIME_PASSWORD_ENROLLMENT_TICKET_20261013.md` | `8901919abed4c770b06ed12f4013f2320dc94bdd` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/PROBE_APPS_SCRIPT_V150_DRYRUN.trigger` | `62a45217b728ad8f876e9db235f94776cf12a588` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/PROVISION_D1_STAGING.trigger` | `6026f6217f3f97c00b668e146c2d4b1b39830587` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/RUN_T12_142_D1COMPAT_LOCAL_20260926.trigger` | `06bea74fa68b09da5efac9d6a3a955ab05699ce0` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/RUN_T12_TEST_MIRROR_142_20260926.trigger` | `8e00c3a7f48d3a575c3f33a9362c99ed37e095b1` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/RUN_T12_TEST_MIRROR_142_D1COMPAT_RETRY_ONCE_20260926.trigger` | `0cb21cac8a323ca75c385488be7109eb85c5c265` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/RUN_T12_TEST_MIRROR_142_READONLY_GUARD_PROBE_20260926.trigger` | `0c4e4fa1ac57d0e6b0dd20d61e40b09830916589` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/RUN_T12_TEST_MIRROR_142_RECONCILE_READONLY_20260926.trigger` | `424552fa107ac52ed2ce935a6d8d54b6e8c3a71e` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/RUN_T12_TEST_MIRROR_NEGATIVE_20260926.trigger` | `813fa0c6cbdd10eb8639c9a14d9dab6d8b61fa88` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/RUN_T12_TEST_MIRROR_POSITIVE_20260926.trigger` | `cf264071dca30d58cfd0b1395f9c17f9329db67c` | UNREVIEWED | UNKNOWN |
| `docs/trendos/staging/TRENDOS_T12_ENTRY610_NATIVE_AUTH_STAGED_CUTOVER_PLAN.md` | `33449ec23505739a51a8935bc6766d37fd5aed3b` | UNREVIEWED | UNKNOWN |

### TEST_FILE — 256

| المسار عند snapshot | Blob SHA | مستوى مراجعة المحتوى | حالة الإنتاج |
|---|---|---|---|
| `tests/apps_script_cloud_write_auth_selftest_v1.test.mjs` | `76089d834b8ff1813733e3905f173598293b37f5` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_cloud_write_order_v2_canonical_adapter_dryrun_v1.test.mjs` | `d87657a063427ec73b12181a55afd865f5300669` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_cloud_write_order_v2_staging_auth_bridge_qualification_v1.test.mjs` | `8f728bbf3bc94c97442d4139af34de2dbbe12d5a` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_cloud_write_order_v2_staging_bridge_v1.test.mjs` | `b686970f2b27a1111c2d5342068f97afdc3f7697` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_cloud_write_order_v2_staging_canonical_target_identity_v1.test.mjs` | `cd71cfb3dea267508289346617db8ab67e337314` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_cloud_write_order_v2_staging_first_write_harness_v1.test.mjs` | `9d28af10b2e0e094c07bccb63e46219ab5c6f4d1` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_cloud_write_order_v2_staging_first_write_recovery_v1.test.mjs` | `82853be6a5d80321d858d690a92340f68b803f21` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_cloud_write_order_v2_staging_runtime_preflight_v1.test.mjs` | `c7d43ff6c0e66e81391025f3ab3f40f1d23c9817` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_cloud_write_order_v2_staging_side_effect_qualification_v1.test.mjs` | `ced4f24f55b45f6672645e0c8dc207837b26449b` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_cloud_write_production_reconcile_qualification_v1.test.mjs` | `b36b60031f398185a7a14c91fe5226be4d9c15e6` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_cloud_write_reconcile_dryrun_v1.test.mjs` | `9d6dbca345d2cf911cdef163be87fad96af8ab51` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_cloud_write_reconcile_rehearsal_v1.test.mjs` | `8cc04b90d236729ce52a9b260b566a6d50206d16` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_cloud_write_reconcile_router_v150.test.mjs` | `47723402458f753f9e07e7011e9dbfd305cd6a3c` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_cloud_write_rehearsal_live_runner_v1.test.mjs` | `13bf2945d30528db926f0b7d5426c149eb4409b9` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_cloud_write_staging_pull_dryrun_v1.test.mjs` | `c9f3c93e05b59203c41d947862211fd8846a2279` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_d1_operational_enrichment_live_sync_02cr.test.mjs` | `3451376f2e7b218fe3415522fa8e6db1ea640777` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_d1_screen_view_mirror_refresh_02cq.test.mjs` | `5a8b9a408f62cd74bed4fa2f59f2d4018f653ed9` | UNREVIEWED | UNKNOWN |
| `tests/apps_script_employee_session_mismatch_non_destructive_entry531.test.mjs` | `452e0a7d0f29c8d92aeff58f7aec5563f57e6354` | UNREVIEWED | UNKNOWN |
| `tests/attendance_d1_ui_contract_entry620.test.mjs` | `b0c3145eca4398da782a3fe3e7715fa715e3c11c` | UNREVIEWED | UNKNOWN |
| `tests/cloud_auth_shadow_idle_ttl_entry615a.test.mjs` | `4f2f921196b69aa4c74b3448376659309c9cf7e5` | UNREVIEWED | UNKNOWN |
| `tests/cloud_write_order_contract_v2.test.mjs` | `62ba8924a20d7d19b3fbfa3c111bf70e8b9f90e2` | UNREVIEWED | UNKNOWN |
| `tests/cloud_write_order_contract_v2_staging.test.mjs` | `d75d78b7ecddfc8c78234e8899c2f924e8913b90` | UNREVIEWED | UNKNOWN |
| `tests/cloud_write_order_v2_production_shadow.test.mjs` | `f29ca7e03a8e9ec55e7fd9a6cd2218762949c552` | UNREVIEWED | UNKNOWN |
| `tests/cloud_write_order_v2_staging_bridge.test.mjs` | `dbf6460e452524904d8bddc62e90443b9045e628` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_a51_production_shadow_customer_route.test.mjs` | `a3326297e9ae95aeae7a7aa2fdf45700fe738029` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_accounting_contract_v1.test.mjs` | `4d2163de61c5ba23ca165590c2a38e61734df051` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_accounting_f1_foundation_v1.test.mjs` | `ac347912bada2a5277a611dc74debd5fbd8c4e25` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_accounting_f2_finance_api_v1.test.mjs` | `95ceef8ed81453f403140b18b7f51b4101577a3b` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_accounting_f2_finance_core_v1.test.mjs` | `feabe103509ee3b1f517e53af961f349cb257304` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_accounting_f2_finance_safe_v1.test.mjs` | `6ef9260b5c2867d92ca83ce5789261a9477b0059` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_accounting_f2_operations_schema_prep_v1.test.mjs` | `9645c1e9df66a46cec2711d7ba6367d00070c86b` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_accounting_f2_schema_prep_v1.test.mjs` | `c5254ccce686f3db81f88f18d872bab88ef872b6` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_accounting_native_v1.test.mjs` | `da3e4dad7b825df1b17d82f1ef269749848874ee` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_accounting_persistence_readiness_runtime_v1.test.mjs` | `35697d652b7f17ff07350fe7b3bff0852a7671e5` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_accounting_persistence_readiness_v1.test.mjs` | `00a6b19163a742bbc1d117799a72d4c590bd908a` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_accounting_persistence_schema_preflight_runtime_v1.test.mjs` | `8836e3cb7802fcf043af7e1a9e4ec5392caa6a49` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_accounting_persistence_schema_preflight_v1.test.mjs` | `c5157b0cd28f088ec40f58e2b7e4f0fe79ffc347` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_cloud_write_reconcile_exact_target_v1.test.mjs` | `c5035c2eafd365d879124b3a45a5c34c26f18501` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_cloud_write_reconcile_sqlite_v1.test.mjs` | `ee8698c83ef6c3651865ed5331facf2ac8b5ded1` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_cloud_write_sqlite_integration_v1.test.mjs` | `3c2058ea212527091b2263e0ab1763339358f993` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_cloud_write_v1.test.mjs` | `9671ee8ae8e77dc82795a777c06317c231f99cb9` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_control_plane_diagnostics.mjs` | `e3bcb3abb1476f65253df0c7600a0eb9d006fe6d` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_customer_search_a51.test.mjs` | `76f0b7b627b3856fd76ded467b5413258ab4889d` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_freshness_v1.test.mjs` | `f15f681ffdc22eb3c125aba9722864b5ee1149fe` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_gateway_v1.test.mjs` | `2050c7b1a38c8e26fe84638256dc01f08bc27f12` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_orders_02cr_canary.test.mjs` | `e2a67aa35ecc62a2b2a2e1f5739eef2cbc0880ec` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_orders_02cr_idle_freshness_02cu.test.mjs` | `0c4ac1d39a6e66cb6ed311ed3e28d09c729210a4` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_orders_active_summary_02cw.test.mjs` | `60ceef5a251adb22503106b515bb7a0fd576e0a1` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_orders_canary_wrapper_02co.test.mjs` | `16383d4f806430911dac2bd00d605b93e71c38c3` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_orders_dashboard_02cn.test.mjs` | `c86efc771ba50aacdfc5b3d3aa1cb76fdaf4492b` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_orders_duplicate_headers_02cr.test.mjs` | `ebed4dbc49f63f7d2b4003f6078582b7335bf793` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_orders_freshness_gate_v1.test.mjs` | `3e532196766616fc43e21d11ddda7026cdb63f3d` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_orders_idle_freshness_integration_v1.test.mjs` | `a0f1b5114fc56be359a681a73b3419c20d78f2ed` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_orders_idle_heartbeat_v1.test.mjs` | `39856024d53b8a8e3a8c7ebcc02e448cd598d292` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_orders_idle_verifier_v1.test.mjs` | `a9ec890e84699344175073be0cdad14ebded0d33` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_orders_line_identity_02cx.test.mjs` | `834abfd727cb97ac4888ca4a8da1fbbf88248031` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_orders_operational_enrichment_02cr.test.mjs` | `61c3cbb5700a5a495c4efebcb87631d35e70cbec` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_orders_operational_ordering_02cs.test.mjs` | `1b43b56783c996a900eb70daf2423bcf19e3799d` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_edge_orders_read_v1.test.mjs` | `cb72da72dba82e92fe55c5d0b88e64968244a106` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_freshness_sample.mjs` | `ddde1fafc64357f2487b4587011b2745f6e6be27` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_index_v2_02cr_route.test.mjs` | `674903b30c5ec47b462610b8ecbaa24205b8a28c` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_legacy_session_race_guard_entry504.test.mjs` | `c6693a7474a0a393b47df3a4d4bcf6abd9bebb2f` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_mirror_safety_v1.test.mjs` | `d71a23c9a5fa2be7a048f8231c0856e7d02ae644` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_normalized_import_v1.test.mjs` | `c8764083d60fb96dab43dc178d7168348ea8f999` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_orders_session_shadow_handoff_entry497.test.mjs` | `26c6e961c271683761f07003c9132b0a6d7bd25b` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_preview_safety_v1.test.mjs` | `b752eec98b6c6bbc23afdafaf53d08d19f278484` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_production_reconcile_qualification_v1.test.mjs` | `b747eacf1445c084cecea036e4320f6a79f02c81` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_production_reconcile_qualification_wiring_default_off_v1.test.mjs` | `6c8c3cac40ee40ca74b7a7ae8a2080f4f7e66071` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_production_shadow_integration_candidate_v1.test.mjs` | `1a2bf9d7dfe56c0196050e52d68be26169c7b246` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_production_shadow_observer_candidate_v1.test.mjs` | `a021be72b38e1690678d5284cf8a88e4e4a05e83` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_production_shadow_preview_v1.test.mjs` | `639b76debd535bf1ce1607c3c15f3a081a2c1aa7` | UNREVIEWED | UNKNOWN |
| `tests/cloudflare_staging_synthetic_sample_bridge_v1.test.mjs` | `453c258027635f0e0ecfd86c00f6247e7e6532fd` | UNREVIEWED | UNKNOWN |
| `tests/core_p0_11_readonly_gate_contract.test.mjs` | `7445c2ee9cd5237d52a4cede1b340ddc29b0bf9d` | UNREVIEWED | UNKNOWN |
| `tests/customer_manager_send_integrity_v1.test.js` | `b36d6030258ad4493e67905c8489443eace2770d` | UNREVIEWED | UNKNOWN |
| `tests/d1_fast_auth_v25_safe.test.js` | `6859979164b04e0db67d4d167bde2c4950faf470` | UNREVIEWED | UNKNOWN |
| `tests/d1_normalized_live_sync_delta_v2.test.mjs` | `c683b87ec46a94f6fde528e42dc43d7e64ca72c6` | UNREVIEWED | UNKNOWN |
| `tests/d1_orders_live_sync_atomic_v1.test.mjs` | `f271e8ef2d7258c0b4601b18092a1b9fbfa80518` | UNREVIEWED | UNKNOWN |
| `tests/d1_orders_live_sync_delta_v2.test.mjs` | `17643ac68f06f007fbd47d8144d784c7b2ab0970` | UNREVIEWED | UNKNOWN |
| `tests/d1_orders_low_usage_control_v1.test.mjs` | `1a0dd11fcdbc6a6f61be557b112eb707f4767516` | UNREVIEWED | UNKNOWN |
| `tests/d1_orders_low_usage_heartbeat_v1.test.mjs` | `74c660b9ce870e4e3b69407f166bff8d174e982a` | UNREVIEWED | UNKNOWN |
| `tests/d1_zero_idle_control_v1.test.mjs` | `47d81b10b17d1f31d882010bb767094cb5261a4d` | UNREVIEWED | UNKNOWN |
| `tests/easystore_a1_core_reads_v1.test.mjs` | `bc82096d257326369ba4d112abf80c6f579fb784` | UNREVIEWED | UNKNOWN |
| `tests/easystore_a1_day_ops_reads_v1.test.mjs` | `d0ef723ad7dc9ab38c24dbfc8daecad45a78353f` | UNREVIEWED | UNKNOWN |
| `tests/easystore_a1_laser_quote_v1.test.mjs` | `a6c6e0f48941eba5b149fe3db7891a6ef0e68f57` | UNREVIEWED | UNKNOWN |
| `tests/easystore_a1_party_master_v1.test.mjs` | `0514798d2ac6367d7a6e70cdf4767001d9842bda` | UNREVIEWED | UNKNOWN |
| `tests/easystore_a2_command_foundation_v1.test.mjs` | `6d87a3ddf6190dce97c2e99ee20a3408190ddb89` | UNREVIEWED | UNKNOWN |
| `tests/employee_auth_native_a61.test.mjs` | `bb2c0c80dc2ec718065a4a8938bbcdb15455ef14` | UNREVIEWED | UNKNOWN |
| `tests/employee_legacy_action_classification_a61.test.mjs` | `0326f92b23846424bea08786d4942632456c7e6a` | UNREVIEWED | UNKNOWN |
| `tests/employee_legacy_auth_bridge_a61.test.mjs` | `6f1da81982ac0c9d0758faad69b43c90ecc8a670` | UNREVIEWED | UNKNOWN |
| `tests/entry609_native_auth_cutover_inventory.test.mjs` | `058f49f08fa531f14fabbe6650bd9f03590feba4` | UNREVIEWED | UNKNOWN |
| `tests/entry613_diya_production_canary_manifest.test.mjs` | `6ad8be24e8b2a04f6b52643b5f9be7ec10b7d998` | UNREVIEWED | UNKNOWN |
| `tests/entry614_employee_accounting_native.test.mjs` | `1977dcefe399114c99700bed6e08c19a339f2fd8` | UNREVIEWED | UNKNOWN |
| `tests/entry614_employee_comms_native.test.mjs` | `e12c19a4d30f915d421706dbe56140babac5be5b` | UNREVIEWED | UNKNOWN |
| `tests/entry614_employee_content_native.test.mjs` | `f8bf077f9f03eacdf660a81f5a2e3f2582fac98b` | UNREVIEWED | UNKNOWN |
| `tests/entry614_employee_ops_native.test.mjs` | `3175ce077af183c4a5a00d6a5decba6c874db376` | UNREVIEWED | UNKNOWN |
| `tests/entry614_zero_google_employee_business_coverage.test.mjs` | `9e81be173eda120c2807370a8896f0a02d8b9c96` | UNREVIEWED | UNKNOWN |
| `tests/entry622_trendos_bridge_readonly_policies.test.mjs` | `3b3f83fd857169c1cbac080880f4cb2149289b22` | UNREVIEWED | UNKNOWN |
| `tests/entry623_diya_login_canary_17_policy.test.mjs` | `4792c10362e84c37d6a511ca2846a6f540296e62` | UNREVIEWED | UNKNOWN |
| `tests/entry624_wael_second_native_canary_17_policy.test.mjs` | `6e3504f2331a4af5010d4a47a68e4dda766a159f` | UNREVIEWED | UNKNOWN |
| `tests/entry625_jaber_third_native_canary_17_policy.test.mjs` | `aee729cab698c6f90a3ba99eb6eaa56db165ee8f` | UNREVIEWED | UNKNOWN |
| `tests/entry626_remaining_employees_native_canary_17_policy.test.mjs` | `38f6b6c141dffecc208e0944c84d4e34ae4c659e` | UNREVIEWED | UNKNOWN |
| `tests/entry627_employee_native_alias_canary.test.mjs` | `db0805a2bc68b78397e72f4cd3854bbf96cb0803` | UNREVIEWED | UNKNOWN |
| `tests/entry628_employee_core_readonly_dispatch.test.mjs` | `f5c5410bae3b8755301b74c58c4468b4aa268cde` | UNREVIEWED | UNKNOWN |
| `tests/entry629_employee_content_readonly_dispatch.test.mjs` | `47d3f859a7deef98f09d2e029d50b81e72f011c2` | UNREVIEWED | UNKNOWN |
| `tests/entry630_employee_comms_readonly_dispatch.test.mjs` | `b51df382024579f7a9152eb2400af90dffabce64` | UNREVIEWED | UNKNOWN |
| `tests/entry631_bridge_free_canary_preflight.test.mjs` | `42d2b20594e84fd0808362fce76c41e166aa3a1d` | UNREVIEWED | UNKNOWN |
| `tests/entry633_native_username_canonicalization.test.mjs` | `2afd1b1253710709e37c99cf4b3012ec65d3f9c7` | UNREVIEWED | UNKNOWN |
| `tests/entry634_disable_legacy_auth_bootstrap.test.mjs` | `dc6b552d59979dc7de4e0c6fd960ce8e288053e5` | UNREVIEWED | UNKNOWN |
| `tests/entry635_native_only_bridge_free_preflight.test.mjs` | `136b2e81cf8d95058ee00fc5056a9d0dc4297861` | UNREVIEWED | UNKNOWN |
| `tests/entry636_global_native_completeness_guard.test.mjs` | `dddfc7cdfeef7af5a5daf9d8f37edb87e2a4d64c` | UNREVIEWED | UNKNOWN |
| `tests/entry644_employee_core_general_dispatch.test.mjs` | `9bf2ef49f80a14deb8148812873654bdb272e847` | UNREVIEWED | UNKNOWN |
| `tests/entry646_manager_center_core_direct.test.mjs` | `d7247b9db9050c194a37ad20c27ff9196492c046` | UNREVIEWED | UNKNOWN |
| `tests/entry647_employee_login_attendance_runtime_repair.test.mjs` | `f26e2cd5a23375cdfc6e17e28bef2ce45f74330a` | UNREVIEWED | UNKNOWN |
| `tests/entry649_employee_andon_structured.test.mjs` | `785037ee1015006dbabdbe74b590f3f59c94a5a2` | UNREVIEWED | UNKNOWN |
| `tests/entry650_employee_core_order_page_read.test.mjs` | `00893ac30dbbb4ee5af8cd0b655d40cb2674f686` | UNREVIEWED | UNKNOWN |
| `tests/entry651_employee_session_restore_guard.test.mjs` | `b1abd5bc82bb34e2b4f36a2ec0d458108ad01851` | UNREVIEWED | UNKNOWN |
| `tests/entry652_employee_session_lifecycle_guard.test.mjs` | `c6af484e1aa181764e13cd563d4f1ac27b375705` | UNREVIEWED | UNKNOWN |
| `tests/entry652_employee_session_runtime_401_dispatch.test.mjs` | `cb0ed4b2d56facd8e8d08cea4591e92cf41bb149` | UNREVIEWED | UNKNOWN |
| `tests/entry653_zero_google_employee_legacy_proxy_retirement.test.mjs` | `1ec4f242a6177b19b7f847b7b7e7bda629d3bdc4` | UNREVIEWED | UNKNOWN |
| `tests/entry654_customer_portal_identity_schema_sqlite.test.py` | `e24b6c9cebdd614cef845c80a5922bea06cb605e` | UNREVIEWED | UNKNOWN |
| `tests/entry654_customer_portal_native_readiness_v0.test.mjs` | `293c8ae17aa5b921b76bea1b7857d9afd7fb85e9` | UNREVIEWED | UNKNOWN |
| `tests/entry655_customer_order_ownership_audit.test.mjs` | `4711ca95613e48b74655b8071fa93a327b01d925` | UNREVIEWED | UNKNOWN |
| `tests/entry655_customer_order_ownership_sqlite.test.py` | `052f47b709e39df3064640fb340de3b590138d3d` | UNREVIEWED | UNKNOWN |
| `tests/entry656_public_health_probe_offline.test.py` | `efc21d3eadce69e6fa98e3d117643be661d115a3` | UNREVIEWED | UNKNOWN |
| `tests/entry657_customer_phone_enrollment_sqlite.test.py` | `5e0f63c0d99784bad65420057dddebb5456d200d` | UNREVIEWED | UNKNOWN |
| `tests/entry657_customer_phone_otp_offline.test.mjs` | `6312588bcdea42416b49c552d478f8d5531dcf7a` | UNREVIEWED | UNKNOWN |
| `tests/entry658_customer_otp_atomic_source.test.mjs` | `079c4cd8bb08e47fb31b3d4fa41645f7cf790234` | UNREVIEWED | UNKNOWN |
| `tests/entry658_customer_phone_otp_atomic_sqlite.test.py` | `2a8bbe95a15349e60893964970cb64154ddb1fef` | UNREVIEWED | UNKNOWN |
| `tests/entry659_customer_enrollment_ticket_source.test.mjs` | `16d4100260a702b79a57b02595f3159eff8f98ac` | UNREVIEWED | UNKNOWN |
| `tests/entry659_customer_password_ticket_sqlite.test.py` | `9716485ac7f548e51d5cb4e27d1a2f6375e77821` | UNREVIEWED | UNKNOWN |
| `tests/frontend_easystore_sso_entry619.test.js` | `4f47fd58cab29317c4a50a3db27c4370329a0e59` | UNREVIEWED | UNKNOWN |
| `tests/frontend_edge_orders_cutover_02ct.test.mjs` | `7a9a6f2211144bbe3760593b4d15cf3ffa0bf2db` | UNREVIEWED | UNKNOWN |
| `tests/frontend_employee_accounting_family_router_entry619.test.mjs` | `1032f2c6156b45dfb8bdbb31c536105e444b246e` | UNREVIEWED | UNKNOWN |
| `tests/frontend_employee_api_dispatcher_a61.test.mjs` | `32e4899b611ced3f6150137627f69061b9ca4d74` | UNREVIEWED | UNKNOWN |
| `tests/frontend_employee_native_canary_entry611.test.mjs` | `c63a5f3eb7fd82cba679cdcbfb597722b24e4e2a` | UNREVIEWED | UNKNOWN |
| `tests/frontend_employee_ops_family_router_entry617.test.mjs` | `9ca20988a0c7441f2cc2c02004d42089f37207a6` | UNREVIEWED | UNKNOWN |
| `tests/frontend_employee_ops_family_router_entry617_generated.test.mjs` | `3b825960527e5a2f2ab3bc354edb63c685077bb2` | UNREVIEWED | UNKNOWN |
| `tests/frontend_employee_session_isolation_entry533.test.mjs` | `98e99be5a5b2008282ba1af14ea33c48a9a4ce98` | UNREVIEWED | UNKNOWN |
| `tests/frontend_flyprint_lane_stability_02cv.test.mjs` | `37f9a92556c66e3ffc1d328686d1751296fe43a4` | UNREVIEWED | UNKNOWN |
| `tests/frontend_legacy_module_dispatch_a61.test.mjs` | `19ab4f7fde54bf617a3303ace328c97167c52cfc` | UNREVIEWED | UNKNOWN |
| `tests/frontend_login_fast_surface_entry603.test.mjs` | `37bb3d110fbd7a9099af368f0eb58de3201ae748` | UNREVIEWED | UNKNOWN |
| `tests/frontend_no_direct_google_transport_a61.test.mjs` | `7764b8903a319c899e1f4f5e3bda49d3ba4177ec` | UNREVIEWED | UNKNOWN |
| `tests/frontend_order_status_ux_02cv.test.mjs` | `dd8c50833ea4ed6e7b9c6063c5da9f7857f54514` | UNREVIEWED | UNKNOWN |
| `tests/frontend_order_status_write_consistency_02cv.test.mjs` | `ee4aa7ca3550ce9c1a8e60d7e7fff74522b2c94a` | UNREVIEWED | UNKNOWN |
| `tests/frontend_orders_initial_edge_ready_entry577.test.mjs` | `560e461d7598661dc9e1a22ab78dce63b595cfb0` | UNREVIEWED | UNKNOWN |
| `tests/frontend_session_and_zero_google_read_entry499.test.mjs` | `35a108cf0dd68983d93fb5f54d86a0a6e66ec4ca` | UNREVIEWED | UNKNOWN |
| `tests/frontend_t12_customer_cloud_only_a56.test.mjs` | `c0772c22b51fe6f4cf6e342b0db833100021f38b` | UNREVIEWED | UNKNOWN |
| `tests/frontend_t12_duplicate_order_guard_entry590.test.mjs` | `6c3f629786f0df8b78c109cb12d4c13a01300232` | UNREVIEWED | UNKNOWN |
| `tests/gaber_daily_material_flow_v1.test.mjs` | `d102fe1ac33bf0abd2d8d09cab8b5f732250450e` | UNREVIEWED | UNKNOWN |
| `tests/gaber_easystore_ledger_adapter_v1.test.mjs` | `27b9169f2def11fd295989a4afea0b44e5d5a195` | UNREVIEWED | UNKNOWN |
| `tests/gaber_ledger_daily_report_balance_gate_v1.test.mjs` | `4ed61995cbd344f0988d8e553580425252d51c15` | UNREVIEWED | UNKNOWN |
| `tests/gaber_material_control_v1.test.mjs` | `79b1bb834a0d8f5d7ed6b767b000da94a12e5e28` | UNREVIEWED | UNKNOWN |
| `tests/gaber_material_movement_ledger_v1.test.mjs` | `0658a7910f49627edfeb5c4b443aa14aa3c27dee` | UNREVIEWED | UNKNOWN |
| `tests/gaber_material_persistence_backend_v1.test.mjs` | `4c9e4edfb8de36d83c96f77df69de26c7aef1154` | UNREVIEWED | UNKNOWN |
| `tests/gaber_material_persistence_v1.test.mjs` | `0a2ef7f7461b3c31c754033f3dae6fcd811117e8` | UNREVIEWED | UNKNOWN |
| `tests/gaber_material_ui_backend_v1.test.mjs` | `7360266affff1903c484c34414f4bfb8503a9b62` | UNREVIEWED | UNKNOWN |
| `tests/gaber_material_ui_v1.test.mjs` | `936b5efc737567dc95cd4b6f696d9bf7f2c4633e` | UNREVIEWED | UNKNOWN |
| `tests/gaber_material_zero_offcut_regression_v1.test.mjs` | `74a572419b84e62ca7f0ad48767cd0fa5304ea23` | UNREVIEWED | UNKNOWN |
| `tests/legacy_browser_transport_a61.test.mjs` | `03892975d5172c71d0ebb1eccac0c73cf45edbdd` | UNREVIEWED | UNKNOWN |
| `tests/operator_task_edge_v2.test.mjs` | `e88a705f5247bdd2a7f4df56ce90351b122466a4` | UNREVIEWED | UNKNOWN |
| `tests/operator_task_gaber_material_gate_v1.test.mjs` | `059d974b45aca22ff0150b833ceabf4cea85fd8b` | UNREVIEWED | UNKNOWN |
| `tests/operator_task_gaber_material_ui_v1.test.mjs` | `11b17b1634d236820de08bc663fd74829807d3e6` | UNREVIEWED | UNKNOWN |
| `tests/operator_task_workflow_v2_contract.test.mjs` | `fb4c1f4f8808e38e498a6c5e3a885f96a7fbd54e` | UNREVIEWED | UNKNOWN |
| `tests/qualify_02cr_idle_preview_02cu.mjs` | `83faddf4301925e4c7962b4f877ee146de4cb59c` | UNREVIEWED | UNKNOWN |
| `tests/rp07_legacy_attendance_cleaning_containment_v1.test.mjs` | `608504edb309df70c49b1a9a788dcf6473a9d2b6` | UNREVIEWED | UNKNOWN |
| `tests/rp07_press_frontend_exact_line_v1.test.mjs` | `b364efc0b5f6e3088b3592e8deea764e11bd6fa1` | UNREVIEWED | UNKNOWN |
| `tests/rp07_v1932_integrity_bridge_v1.test.mjs` | `cf67ee7cc4f3bb9b93d7f9010c9e083520b6e96e` | UNREVIEWED | UNKNOWN |
| `tests/startup_request_storm_frontend_guard.test.mjs` | `ef920b3172e462fda869057d5a5b2d7cc5e8515d` | UNREVIEWED | UNKNOWN |
| `tests/t12_business_create_candidate.test.mjs` | `2445b5eca34920e2ae4b57cd9124212a7330a053` | UNREVIEWED | UNKNOWN |
| `tests/t12_client_key_continuity_guard.test.mjs` | `6bcbf068e2e78348c554796377e332e009a5a3d3` | UNREVIEWED | UNKNOWN |
| `tests/t12_cloud_client_key_admission.test.mjs` | `b5b05d15f57774f9b93b69b875d2de8e32903442` | UNREVIEWED | UNKNOWN |
| `tests/t12_cloud_native_synthetic_create.test.mjs` | `1197f9069abc78f283bc0165733c916e94210ef9` | UNREVIEWED | UNKNOWN |
| `tests/t12_cloud_native_synthetic_test_worker.test.mjs` | `67c273779929d906b6aff1d6ec3a2d91add539d0` | UNREVIEWED | UNKNOWN |
| `tests/t12_customer_lane_partial.test.mjs` | `e69ff75b845e206eafa876688485b0fda04c916e` | UNREVIEWED | UNKNOWN |
| `tests/t12_customer_legacy_projection_a55.test.mjs` | `42e9b4a7ea04be87f9af0fca9bcb44a79a3be7cf` | UNREVIEWED | UNKNOWN |
| `tests/t12_customer_master_a53.test.mjs` | `41c02986d4057f74573e74294fc111098263b4fb` | UNREVIEWED | UNKNOWN |
| `tests/t12_customer_master_production_shadow_a53.test.mjs` | `f666915675dfbc034ba97319192d9e45dad7b1fa` | UNREVIEWED | UNKNOWN |
| `tests/t12_customer_native_search_a54.test.mjs` | `4e450a3ada5443b01b853089fb29bb72115d42a5` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_128_packed_cas_batch_isolated_v1.test.mjs` | `8e13097653b7a6d38bfb0a8d8d3d5aa4bfe30e80` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_128_recovery_capacity_envelope_v1.test.mjs` | `0e02c623b923178d5c163bb58c3ed8c93cb3fbf2` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_142_all_row_preimage_guard_isolated_v1.test.mjs` | `f6c346dc597bc33c1b503c14348e0e92f70efea4` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_142_chunked_preimage_large_isolated_v1.test.mjs` | `ff0a30f16dc1c0e68ad64727fff435f23e53c404` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_142_packed_cas_batch_isolated_v1.test.mjs` | `a270051e0dfb2701fd4b2879656f14ebd014c8c8` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_142_wide_payload_budget_isolated_v1.test.mjs` | `01506bc00f3e3d0fc63fd56bc8e3acd611509ffc` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_baseline_shape_diagnostic_readonly.test.mjs` | `95c2be13471def9d1a98dee574b61fbbeb2ecb4a` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_direct_cas_bounded_catchup.test.mjs` | `d1c82d6ec0e619466f20c528110412523e17feda` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_guarded_recovery_batch_v1.test.mjs` | `7f578bd2372b04a01824647557186de32d1aa10a` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_guarded_recovery_preview_handler_v1.test.mjs` | `a321d0850ce207cbab0ed342e45c4d2890ab0247` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_mirror_baseline_lineage_readonly.test.mjs` | `352d9e071efa99591e9fc5d09eb51b0390d59f91` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_mirror_baseline_sparse_fullhash.test.mjs` | `3ef063f31e4138ae932ead092dbe4ececd2e06a5` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_mirror_catalog_readonly.test.mjs` | `87c2df31b215720a8f892f39315dbef0ce4405b5` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_one_shot_atomic_full_rebase_20260926.test.mjs` | `09e3b7c8dffe4779a6a31f6730d2230944230e77` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_r4_local_preview_isolation.test.mjs` | `b21ddd9b0b1b15c82bdeaa8451de7739915a148c` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_r4_production_recovery_route.test.mjs` | `d31870c3ba7a554110afce731690e8aae384aba4` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_rows_parity_readonly.test.mjs` | `7de36e109ca16ac5b224871b08f549823bc31f15` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_source_baseline_drift_readonly.test.mjs` | `aaad5b2a03061787b612c37546329c741f252ce1` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_sync_metadata_readonly.test.mjs` | `6584007b599a73d4a9bacda244d6cccdfdf96f5d` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_targeted_recovery_plan_v1.test.mjs` | `8d6795e32589e0fd6f0c61030771ef20194d9598` | UNREVIEWED | UNKNOWN |
| `tests/t12_d1_targeted_recovery_preflight_readonly.test.mjs` | `7c6fe217e9b65723eb05700e3574b362f0af0c3e` | UNREVIEWED | UNKNOWN |
| `tests/t12_dashboard_singlefile_test_worker.test.mjs` | `b016e2e6c6a58a019d2bb6ac8a44fc6cb1359219` | UNREVIEWED | UNKNOWN |
| `tests/t12_existing_test_mirror_142_readonly_guard_probe_v1.test.mjs` | `d7b06a779f831ba36ef545085db33246f6add4c7` | UNREVIEWED | UNKNOWN |
| `tests/t12_existing_test_mirror_142_remote_dev_worker_v1.test.mjs` | `590bcd1d26677e7c34b22854fe1f48c566c83225` | UNREVIEWED | UNKNOWN |
| `tests/t12_existing_test_mirror_negative_remote_dev_worker_v1.test.mjs` | `60faa40cd800a24d2f29a9d7546b7fe7bb940bc1` | UNREVIEWED | UNKNOWN |
| `tests/t12_existing_test_mirror_positive_remote_dev_worker_v1.test.mjs` | `8655c7c5dd3ef96c92e54b584d9cbdd980453926` | UNREVIEWED | UNKNOWN |
| `tests/t12_existing_test_mirror_tiny_cas_contract_isolated_v1.test.mjs` | `943567db81bcdee12b4afbbdc7fd62f086f309ca` | UNREVIEWED | UNKNOWN |
| `tests/t12_general_create.test.mjs` | `b25a0634d5e64b5ba1a376b687bbdf96ed800fba` | UNREVIEWED | UNKNOWN |
| `tests/t12_google_create_writer_inventory.test.mjs` | `8f5677e9275c9905ccb61494051b22ddef6617ac` | UNREVIEWED | UNKNOWN |
| `tests/t12_google_order_lifecycle_writer_inventory.test.mjs` | `05c037221412a3bc362ec1b478a8d5ec0c5d627c` | UNREVIEWED | UNKNOWN |
| `tests/t12_legacy_cloud_write_boundary.test.mjs` | `c5bff3d8969e39fde42869eeccde7d93f4b367fe` | UNREVIEWED | UNKNOWN |
| `tests/t12_legacy_create_fence.test.mjs` | `798bfd95e035d4a7d3069a4e6ac2ab4d9df3428c` | UNREVIEWED | UNKNOWN |
| `tests/t12_legacy_line_runtime_entry597.test.mjs` | `0a86ca9804a32e3061da461995dfac11c1950280` | UNREVIEWED | UNKNOWN |
| `tests/t12_order_create_cutover_state.test.mjs` | `d4e62a260c8ad989f17b308235576a254394d4f0` | UNREVIEWED | UNKNOWN |
| `tests/t12_order_create_input_guard.test.mjs` | `5224d242a6041700a3f07f16e1a303cd4949d0b1` | UNREVIEWED | UNKNOWN |
| `tests/t12_order_create_preflight.test.mjs` | `6540946dabe4f9fb676b525a43ec9e3674f6f0cb` | UNREVIEWED | UNKNOWN |
| `tests/t12_order_create_repo_parity.test.mjs` | `140858daf892e6580a1e118ee8c61717900157b3` | UNREVIEWED | UNKNOWN |
| `tests/t12_order_create_shadow_handler.test.mjs` | `6156a6f8b13d80f68f9e2e411fa0a19af3f4de8e` | UNREVIEWED | UNKNOWN |
| `tests/t12_order_create_shadow_intent.test.mjs` | `8912850b31b708521455a05e94e0bd9ac314c337` | UNREVIEWED | UNKNOWN |
| `tests/t12_order_create_shadow_schema.test.mjs` | `00e003873105a65961085e61bc4c3d8ec868c9a7` | UNREVIEWED | UNKNOWN |
| `tests/t12_order_create_shadow_store.test.mjs` | `40c85171d1d39d908e1946d6d2c564b80bf6d709` | UNREVIEWED | UNKNOWN |
| `tests/t12_order_id_authority_candidate.test.mjs` | `ca97d96f065a963e79572d8e8401947f98d2068a` | UNREVIEWED | UNKNOWN |
| `tests/t12_order_id_seed_evidence.test.mjs` | `827908bcf7c331f46054542ef1fa902cbfc679df` | UNREVIEWED | UNKNOWN |
| `tests/t12_production_create_canary.test.mjs` | `8d2d8c589fcffe71b8f8b57b32c376299b4e2ce2` | UNREVIEWED | UNKNOWN |
| `tests/t12_production_d1_aggregate_evidence_readonly.test.mjs` | `05673bc8e4cddeffb706ef24bcb858306fadee2f` | UNREVIEWED | UNKNOWN |
| `tests/t12_r5_orders_periodic_candidate.test.mjs` | `c4327bce7300cce465fc8cbd86e899ef5ae92627` | UNREVIEWED | UNKNOWN |
| `tests/t12_read_overlay.test.mjs` | `022bc670973fe57712e79d0d9e0d5c6d99043800` | UNREVIEWED | UNKNOWN |
| `tests/t12_read_overlay_handler.test.mjs` | `dab55ac23a63f13ba5cdf4978e2657460afe8119` | UNREVIEWED | UNKNOWN |
| `tests/t12_scope_guard.test.mjs` | `9cec4948dce95d166761bb15252a47c64d2107c2` | UNREVIEWED | UNKNOWN |
| `tests/t12_script_properties_quota_audit_readonly.test.mjs` | `80816143a052c32a2256e7a02080b94b1f27f602` | UNREVIEWED | UNKNOWN |
| `tests/t12_script_properties_replay_backup_sheet_verify_readonly.test.mjs` | `7932c48ea55c36d679248344be8bd2e669a2c39d` | UNREVIEWED | UNKNOWN |
| `tests/t12_script_properties_replay_cleanup_preview.test.mjs` | `82a544c12325f44fcebbd672048bb8d378df0f2d` | UNREVIEWED | UNKNOWN |
| `tests/t12_script_properties_replay_fixed150_delete_once.test.mjs` | `785b87d399a44f1dbbdd5f23413b2bda12a1038e` | UNREVIEWED | UNKNOWN |
| `tests/t12_script_properties_replay_private_backup.test.mjs` | `b90f4936f7cd8d9908c4bc078ef14390419451a7` | UNREVIEWED | UNKNOWN |
| `tests/t12_supplemental_google_writer_inventory.test.mjs` | `3b85303ff3656a96aa9d18f08e28685bd19485df` | UNREVIEWED | UNKNOWN |
| `tests/t12_synthetic_resource_config_guard.test.mjs` | `11681ce0720c023e4d8dec21fa44dac9a480ffde` | UNREVIEWED | UNKNOWN |
| `tests/trend_master_resilience_v1931.test.mjs` | `de1fcc91d1b8e77c011e6311876a2af7612dc8e8` | UNREVIEWED | UNKNOWN |
| `tests/trendos_andon_integrity_v1.test.js` | `33e2e91b18259c6004bae6e19d5085d396d6ec16` | UNREVIEWED | UNKNOWN |
| `tests/trendos_attendance_cleaning_integrity_v1.test.js` | `a715d5eb5fd8ddc17c680a4bc3c71f30f06b94dd` | UNREVIEWED | UNKNOWN |
| `tests/trendos_core_p0_registry_writer_v1.test.js` | `05fbd72caca6d9fd5302afa441cf8d38a66b1f7d` | UNREVIEWED | UNKNOWN |
| `tests/trendos_core_p0_remediation_v1.test.js` | `d6a3c53e22c24c08f225b073e0ea6a5256dadf63` | UNREVIEWED | UNKNOWN |
| `tests/trendos_handover_ops_integrity_v1.test.js` | `5cbc3dd0e3ac382aa135b7d9b0a2a357f5fd8226` | UNREVIEWED | UNKNOWN |
| `tests/trendos_integrity_composition_v1.test.js` | `12a0de862c2f163b8ab05b495baa449684079815` | UNREVIEWED | UNKNOWN |
| `tests/trendos_integrity_dashboard_v1.test.js` | `1869cc6d8237708122ae00fbbbd651292d2615e1` | UNREVIEWED | UNKNOWN |
| `tests/trendos_integrity_router_v1.test.js` | `b2ab3e343f84bc24acd406cf8461178c5b8b3664` | UNREVIEWED | UNKNOWN |
| `tests/trendos_integrity_runtime_tools_v1.test.js` | `3ecb24a362949a7d81dd502a0342dd530f881e2a` | UNREVIEWED | UNKNOWN |
| `tests/trendos_integrity_v1.test.js` | `204e97f9339dd6f44896dbd432593d5c87c3db9b` | UNREVIEWED | UNKNOWN |
| `tests/trendos_invoice_integrity_v1.test.js` | `8c705925e768f6f93718561e5ebc687034384fc0` | UNREVIEWED | UNKNOWN |
| `tests/trendos_order_line_integrity_v1.test.js` | `1b0370b8c579674178157f1d2efc50a2c1e39760` | UNREVIEWED | UNKNOWN |
| `tests/trendos_polling_coalescing_v1.test.mjs` | `d22482c5d2d79cd025469b701e534b36c434f2bf` | UNREVIEWED | UNKNOWN |
| `tests/trendos_predeploy_package_v1.test.js` | `5eb3a59793f53065b191e1b1164d4a642ba693cc` | UNREVIEWED | UNKNOWN |
| `tests/trendos_press_integrity_v1.test.js` | `fed827f0976589bd926c34d3e67f0830eab56437` | UNREVIEWED | UNKNOWN |
| `tests/trendos_resume_no_autorefresh_v1.test.mjs` | `d2ec9564816ef430e2b7b0ca10df6e87c334146f` | UNREVIEWED | UNKNOWN |
| `tests/trendos_return_traffic_quiet_v1.test.mjs` | `b1c81860cfc92129170244800c0713129d27af85` | UNREVIEWED | UNKNOWN |
| `tests/trendos_v1921.test.js` | `e9d1c2536c5d9034e01bf62183a680dc3dd38381` | UNREVIEWED | UNKNOWN |
| `tests/trendos_v1932_static.test.js` | `6eb168eda7923c69e184c569ec30adf2f1f8fb6f` | UNREVIEWED | UNKNOWN |
| `tests/trendos_whatsapp_integrity_v1.test.js` | `924962b313fae6170425037a3d8cd0378aaa7b8f` | UNREVIEWED | UNKNOWN |
| `tests/work_queue_v1_contract.test.mjs` | `d62a1038bff1924ad3ffa187863e5dc25ed1c151` | UNREVIEWED | UNKNOWN |
