# TrendOS T12 — Entry610 Native Employee Auth Staged Cutover Plan

Date: 2026-10-03 Cairo  
Repository: `fawakhry/TrendOs`  
Branch: `candidate/t12-full-cloud-cutover-a56-20260929`

## 1. الهدف
نقل Employee Login تدريجيًا من Apps Script إلى D1 Native Auth بدون Big Bang، مع بقاء كل وظائف الموظف شغالة أثناء المرحلة الانتقالية، ومنع إرسال Native token أو plaintext password إلى Apps Script.

الهدف النهائي:
```ini
EMPLOYEE_LOGIN=D1_NATIVE
EMPLOYEE_SESSION=D1_NATIVE
GOOGLE_LOGIN_HOP=NO
PLAINTEXT_PASSWORD_STORED=NO
LEGACY_EMPLOYEE_ACTIONS=0_AFTER_MIGRATION
```

## 2. Runtime truth قبل أي cutover
آخر read-only proof:
- Entry608 Run `37120688311`, Job `111196031173` = SUCCESS.
- Entry610 Run2 `37121323955`, Job `111197852535` = SUCCESS.
- API active version: `ce156662-a698-47fc-b73c-dfd4657be9f5`.
- API active deployment: `477ee04d-10ac-4fc3-9ba6-e81691bcd286`.
- UI active version: `adfb5056-af23-4d7f-8e12-7de6417dfce2`.
- UI active deployment: `a066abb8-4c33-4050-813b-123df4140450`.
- Auth mode = OFF.
- D1 employee users = 0.
- D1 native-ready users = 0.
- D1 sessions = 0.
- Frontend Native Auth flag = false.
- Frontend Legacy Bridge flag = false.
- Cloudflare bridge enabled = false.
- Cloudflare bridge secret = absent.
- Cloudflare bridge policies = empty.
- Apps Script bridge wrapper route = live.
- Apps Script bridge enabled property = false.
- Apps Script bridge secret presence cannot be proven while its bridge flag is false without privileged Script Properties read; do not guess.
- Apps Script Production Version 159 is untouched.
- Orders GENERAL + duplicate guard + browser-refresh recovery + legacy-line runtime remain live.

## 3. Employee action inventory
Corrected active runtime action inventory:
```ini
A61_TOP_LEVEL_RUNTIME_ACTIONS=67
ACTIVE_EMPLOYEE_LEGACY_TOP_LEVEL=46
TRANSPORT_EMPLOYEE_CANDIDATES=51
DORMANT_TRANSPORT_ONLY=5
ACTIVE_OP_POLICIES=29
FULL_ACTIVE_PARITY_POLICY_COUNT=69
CURRENT_READONLY_PILOT_POLICY_COUNT=26
```

The five server-transport candidates that are not active top-level runtime actions:
```text
getTrendMasterPanelV1931
operatorTaskV2
prepareReadyInvoice
updateRowV1931
workQueueV1
```

### 3.1 Active employee legacy top-level actions — 46
```text
approveAccountingDeptInvoice
archiveDeliveredDepartmentV1926
assignCustomerBranch
attendanceClockinV1
attendanceV1
bulkUpdateDepartmentStatusV1926
cleaningV1
customerFeedbackV1
customerManagerV1
deletePlatformAd
getAccounting
getActivityLog
getDashboard
getDeptInvoiceDraftV1887
getFranchiseBranches
getKnowledge
getLeadPhoneNumbers
getMarketplace
getMatbagyNotes
getOrderConversation
getPartyAccountV1858
getPlatformAds
getPlatformSections
getRows
getServiceProviderRoutes
getTrendMasterCenterV1931
getWhiteLabelSettings
goLiveAutopilotV1
hrV1
pressControlV1
saveAccountingDeptLine
saveAccountingFinalInvoice
saveAccountingMaterial
saveAccountingTemplate
saveFranchiseBranch
saveKnowledge
saveMarketplaceProduct
saveMarketplaceVendor
saveMatbagyNote
savePartyLedgerTransaction
savePlatformSection
saveServiceProviderRoute
saveWhiteLabelSettings
sendOrderConversationMessage
uploadOrderConversationFile
uploadPlatformAd
```

### 3.2 Multiplexed active policies — action + op
These actions must never be allowlisted by top-level action alone:
```text
attendanceV1
attendanceClockinV1
cleaningV1
customerFeedbackV1
customerManagerV1
goLiveAutopilotV1
hrV1
pressControlV1
```

Observed active UI op policies:
```text
attendanceV1:state
attendanceV1:start
attendanceV1:pause
attendanceV1:resume
attendanceV1:restStart
attendanceV1:prayerStart
attendanceV1:confirm
attendanceV1:missedCheck
attendanceV1:end

attendanceClockinV1:clockin
cleaningV1:complete
customerFeedbackV1:scan

customerManagerV1:inbox
customerManagerV1:thread
customerManagerV1:suggest
customerManagerV1:send
customerManagerV1:handoff
customerManagerV1:resolve

goLiveAutopilotV1:sweepReady
goLiveAutopilotV1:listDrafts
goLiveAutopilotV1:finalizeAndNotify
goLiveAutopilotV1:sendReady
goLiveAutopilotV1:prepareReadyInvoice

hrV1:myRequests
hrV1:requests
hrV1:submitRequest

pressControlV1:status
pressControlV1:start
pressControlV1:stop
```

Backend capabilities that are not part of the currently observed active UI list must not be enabled merely because the backend supports them. Examples include `attendanceV1:heartbeat`, `hrV1:decide`, `hrV1:skills`, `customerFeedbackV1:request`, `customerFeedbackV1:list`, `goLiveAutopilotV1:deliveryChoice`. Qualify separately if a live caller is introduced.

## 4. Current read-only bridge pilot — 26 exact policies
This pilot is for controlled compatibility verification only. It is not currently enabled.

```text
attendanceV1:config
attendanceV1:state
customerManagerV1:inbox
customerManagerV1:thread
getAccounting
getActivityLog
getDashboard
getDeptInvoiceDraftV1887
getFranchiseBranches
getKnowledge
getLeadPhoneNumbers
getMarketplace
getMatbagyNotes
getOrderConversation
getPartyAccountV1858
getPlatformAds
getPlatformSections
getRows
getServiceProviderRoutes
getTrendMasterCenterV1931
getWhiteLabelSettings
goLiveAutopilotV1:listDrafts
hrV1:employees
hrV1:myRequests
hrV1:requests
pressControlV1:status
```

Important corrections versus old A61 pilot:
- `getRowsPageV1931` is Cloud/Edge authority and must not be a bridge policy.
- `cleaningV1:status` is stale/unsupported; current Cleaning backend accepts `complete` only.

## 5. Full active parity policy — 69 exact policies
This is a qualification target, not a one-shot Production allowlist. Do not enable all 69 in one Big Bang.

```text
approveAccountingDeptInvoice
archiveDeliveredDepartmentV1926
assignCustomerBranch
attendanceClockinV1:clockin
attendanceV1:confirm
attendanceV1:end
attendanceV1:missedCheck
attendanceV1:pause
attendanceV1:prayerStart
attendanceV1:restStart
attendanceV1:resume
attendanceV1:start
attendanceV1:state
bulkUpdateDepartmentStatusV1926
cleaningV1:complete
customerFeedbackV1:scan
customerManagerV1:handoff
customerManagerV1:inbox
customerManagerV1:resolve
customerManagerV1:send
customerManagerV1:suggest
customerManagerV1:thread
deletePlatformAd
getAccounting
getActivityLog
getDashboard
getDeptInvoiceDraftV1887
getFranchiseBranches
getKnowledge
getLeadPhoneNumbers
getMarketplace
getMatbagyNotes
getOrderConversation
getPartyAccountV1858
getPlatformAds
getPlatformSections
getRows
getServiceProviderRoutes
getTrendMasterCenterV1931
getWhiteLabelSettings
goLiveAutopilotV1:finalizeAndNotify
goLiveAutopilotV1:listDrafts
goLiveAutopilotV1:prepareReadyInvoice
goLiveAutopilotV1:sendReady
goLiveAutopilotV1:sweepReady
hrV1:myRequests
hrV1:requests
hrV1:submitRequest
markCustomerNotified
pressControlV1:start
pressControlV1:status
pressControlV1:stop
saveAccountingDeptLine
saveAccountingFinalInvoice
saveAccountingMaterial
saveAccountingTemplate
saveFranchiseBranch
saveKnowledge
saveMarketplaceProduct
saveMarketplaceVendor
saveMatbagyNote
savePartyLedgerTransaction
savePlatformSection
saveServiceProviderRoute
saveWhiteLabelSettings
sendOrderConversationMessage
updateLine
uploadOrderConversationFile
uploadPlatformAd
```

`updateLine` and `markCustomerNotified` are included only for the explicit legacy-row fallback paths. Cloud-native rows stay on Edge/D1.

## 6. Safe enrollment / migration model
No password is extracted from Google, D1, logs, or source.

Two server-side mechanisms exist:

### A. Legacy-session enrollment endpoint
`/v1/employee/auth/enroll-legacy-session`

Requirements:
- D1 auth control mode = `TRANSITIONAL`.
- `TRENDOS_EMPLOYEE_AUTH_V1_ENABLED=true`.
- `TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED=true`.
- one exact canary user configured.
- enrollment nonce configured.
- native-only = false.
- caller supplies current username + current legacy session token + password + nonce.
- Cloudflare verifies the legacy session against Apps Script.
- Cloudflare derives PBKDF2-SHA256 verifier and stores only salt/hash/iterations.
- plaintext password is not stored.

### B. Transitional login bootstrap
When a user has no native verifier yet, a controlled native login can verify username/password through the legacy upstream once, then persist only the PBKDF2 verifier.

This is acceptable only during a bounded TRANSITIONAL window. It does not satisfy the final no-Google login target until every employee is native-ready.

## 7. Staged cutover gates

### Gate 0 — OFF baseline
Current state. Keep:
```ini
AUTH_CONTROL_MODE=OFF
AUTH_ENV_ENABLED=NO
FRONTEND_NATIVE_AUTH=false
FRONTEND_LEGACY_BRIDGE=false
BRIDGE_ENABLED=NO
BRIDGE_POLICY_COUNT=0
D1_NATIVE_READY_USERS=0
```

### Gate 1 — Compatibility bridge preparation, still OFF
Requires explicit Production approval because it touches secrets/config.

Actions:
1. create one random shared bridge secret outside repo/chat/logs;
2. set the same secret in Cloudflare Worker secret and Apps Script Script Property;
3. verify secret presence only, never value;
4. load only the 26 read-only pilot policies in Cloudflare config;
5. keep Cloudflare bridge enable flag false;
6. keep Apps Script bridge enable flag false;
7. keep frontend Native Auth false;
8. keep Auth control OFF.

Pass condition:
- both sides prove secret configured;
- policy count exactly 26;
- no traffic behavior changed.

### Gate 2 — Bridge compatibility canary
Requires explicit Production approval.

Actions:
1. turn bridge server-side enablement on for the prepared read-only policy only;
2. keep normal frontend login legacy;
3. create one native canary session through controlled enrollment/bootstrap;
4. call every 26 read-only policy through `/v1/employee/legacy-action`;
5. prove:
   - assertion action-bound;
   - assertion payload-bound;
   - nonce replay rejected;
   - raw native token never forwarded;
   - plaintext password never forwarded;
   - forbidden auth/customer actions rejected;
   - unauthorised op rejected.

Pass condition:
```ini
READONLY_BRIDGE_CANARY=PASS
NATIVE_TOKEN_TO_APPS_SCRIPT=NO
PLAINTEXT_PASSWORD_TO_APPS_SCRIPT=NO
LEGACY_AUTH_CONTROL_ACTIONS_VIA_BRIDGE=NO
```

### Gate 3 — D1 enrollment/bootstrap
Requires explicit Production approval and one bounded canary employee at a time.

Actions:
1. set D1 auth control `TRANSITIONAL`;
2. enable auth server-side but keep Native-only false;
3. enable exactly one enrollment/bootstrap canary;
4. create native verifier;
5. verify D1 count moves 0 -> 1;
6. verify native login succeeds without Apps Script for the second login;
7. verify native session verify/logout/change-password;
8. verify no plaintext storage.

Do not enable global frontend Native Auth while native-ready users are incomplete.

### Gate 4 — Essential employee operations
Expand bridge policy in small domain batches, each with preflight + postflight:
1. attendance / clock-in / cleaning / HR;
2. press;
3. manager/customer tools;
4. notes / conversations / uploads;
5. accounting/content writes;
6. only then legacy-order fallback writes.

Every batch must prove existing permissions and business side-effects are unchanged.

### Gate 5 — Controlled frontend Native Login
Prerequisites:
- all employees intended for the cutover are native-ready;
- bridge compatibility covers every still-legacy active employee action used by those employees;
- no missing permission/screen mapping;
- D1 sessions verified;
- rollback path prepared.

Then and only then:
1. set frontend Native Auth true in a controlled release;
2. keep bridge true temporarily;
3. postflight login + attendance + HR + press + manager + customer tools + orders;
4. verify login latency no longer depends on Apps Script;
5. verify duplicate guard and refresh fixes remain live.

### Gate 6 — Native-only
Only after all employees are migrated and there is no need for legacy auth fallback:
- `TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1=true`;
- legacy bootstrap/enrollment OFF;
- no Apps Script auth verification fallback.

### Gate 7 — Remove bridge
After each legacy business action has moved to Cloud/D1:
- remove its bridge policy;
- when policy count reaches zero, disable bridge on both sides;
- remove shared secret;
- remove Apps Script dependency from employee runtime;
- prove Zero-Google employee runtime.

## 8. Rollback rules
Fail closed. Do not rollback Orders/Customers to Google.

If an Auth stage fails:
- frontend Native Auth -> false;
- auth control returns to previous safe state;
- preserve existing legacy employee login while investigation continues;
- do not delete D1 verifier/session rows as an emergency reflex;
- do not rotate shared secret unless compromise is suspected;
- do not touch Order/Customer data.

## 9. Explicit Production approval boundary
The following are NOT authorized by Entry610:
- setting Cloudflare bridge secret;
- setting Apps Script Script Property secret;
- changing Apps Script Properties;
- changing Auth mode OFF -> TRANSITIONAL;
- enabling enrollment/bootstrap;
- creating/migrating employee users;
- enabling bridge;
- changing frontend Native Auth flag;
- Apps Script deploy/version change;
- API/frontend deploy that changes Auth behavior.

Entry610 is repo-only qualification and planning.
