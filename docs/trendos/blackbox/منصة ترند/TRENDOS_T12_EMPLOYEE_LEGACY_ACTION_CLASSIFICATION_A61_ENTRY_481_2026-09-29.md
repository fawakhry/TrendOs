# TrendOS T12 — Employee Legacy Action Classification A61 — Entry 481

Date: 2026-09-29 Cairo
Repository: `fawakhry/TrendOs`

## Scope
A61 Phase 3: classify the remaining browser/API actions before any Production native employee-login cutover.

No Production enablement.
No Worker deploy.
No Apps Script deploy.
No D1 mutation.
No Order ID/status mutation.
No secret value written to GitHub.

## A58 audit correction
The original A58 run `36573676009` reported:
- 19 active JS runtime files.
- 80 distinct literal actions.

Manual/static follow-up found that the A58 regex missed two active backend actions because their modules call helpers not named `api`:
- `hrV1` through `rawApi('hrV1', ...)`.
- `attendanceClockinV1` through `get('attendanceClockinV1', ...)`.

Therefore the corrected observed runtime-action inventory is at least:
```ini
A58_REPORTED_ACTION_STRINGS=80
A61_ADDITIONAL_MISSED_ACTIONS=2
A61_OBSERVED_ACTION_STRINGS=82
```

The 82 strings are not 82 independent backend routes. Fifteen are nested `op` values rather than top-level actions:
- Customer Manager: `handoff,inbox,resolve,send,suggest,thread`.
- Go-Live Autopilot: `finalizeAndNotify,listDrafts,prepareReadyInvoice,sendReady,sweepReady`.
- Press: `start,status,stop`.
- Customer Feedback: `scan`.

After removing those nested op labels and adding the two missed routes:
```ini
TOP_LEVEL_RUNTIME_ACTIONS=67
```

## Authority / auth classification

### 1. Never through employee legacy bridge — Native/Cloud authority
These are already Cloud-native in the active Orders/customer override and must not be routed back to Apps Script:
- `searchCustomers`
- `createCustomer`
- `createManualOrder`

Hybrid Orders routes still temporarily need bridge fallback for legacy rows/freshness failure:
- `getRowsPageV1931`
- `updateLine`
- `markCustomerNotified`

### 2. Never through employee legacy bridge — Employee auth control plane
These must move to / remain on native D1 employee auth endpoints:
- `login`
- `logout`
- `changePassword`
- `verifyEmployeeSession` when used.

### 3. Separate customer-session authority
These are customer-authenticated and are not employee bridge candidates:
- `customerLogin`
- `customerLogout`
- `changeCustomerPassword`
- `getCustomerOrders`
- `getCustomerPortalAccountsV1859`
- `createCustomerDraft`
- `addCustomerDraftItem`
- `submitCustomerDraft`
- `uploadCustomerDraftFile`

### 4. Blocked / maintenance-only
- `ensureDemoCustomer`: production route intentionally blocked.
- `initAccounting`: maintenance/init; do not include in first bridge policy.
- `recalculateAccountingMaterials`: maintenance/recalculation; do not include in first bridge policy.

### 5. Employee-authenticated legacy business actions
Static backend inspection confirmed 56 active mapped actions use employee authorization directly or through `v1932Auth_`, `cmAuth_`, `glaAuth_` or accounting authorization. After removing Native/Cloud control-plane and blocked/maintenance items, 49 top-level legacy employee-business actions remain as temporary bridge/migration candidates.

They cover:
- legacy Orders/dashboard/activity.
- Attendance/clock-in/Cleaning/HR/Press.
- Accounting and Party ledger.
- knowledge and Matbagy notes.
- order conversations/files.
- Customer Manager / feedback / Go-Live automation.
- Trend Master.
- platform/franchise/service-provider/marketplace/white-label content.

## Multiplexed actions require action + op policy
A top-level allowlist is too broad for actions that multiplex reads and writes.

The bridge now treats these as op-scoped:
- `attendanceV1`
- `attendanceClockinV1`
- `cleaningV1`
- `customerFeedbackV1`
- `customerManagerV1`
- `goLiveAutopilotV1`
- `hrV1`
- `pressControlV1`

Examples:
- `pressControlV1:status` may be allowed while `pressControlV1:start` and `:stop` remain blocked.
- `goLiveAutopilotV1:listDrafts` may be allowed while `:finalizeAndNotify` remains blocked.
- plain `pressControlV1` or plain `goLiveAutopilotV1` does not satisfy bridge policy.

## Proposed first Production pilot policy — READ-ONLY
This is a proposed qualification set only. It is **not enabled** in repository config.

28 exact policies:
```text
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
getRowsPageV1931
getServiceProviderRoutes
getTrendMasterCenterV1931
getWhiteLabelSettings
attendanceV1:state
attendanceV1:config
cleaningV1:status
customerManagerV1:inbox
customerManagerV1:thread
goLiveAutopilotV1:listDrafts
hrV1:myRequests
hrV1:requests
hrV1:employees
pressControlV1:status
```

This pilot intentionally excludes all normal business writes and external-send actions.

## Write/side-effect actions that need separate qualification
Examples include:
- `updateLine` for legacy rows.
- `markCustomerNotified` for legacy rows.
- `bulkUpdateDepartmentStatusV1926`.
- `archiveDeliveredDepartmentV1926`.
- `assignCustomerBranch`.
- `attendanceV1:start/pause/resume/restStart/prayerStart/confirm/heartbeat/missedCheck/end`.
- `attendanceClockinV1:clockin`.
- `cleaningV1:complete`.
- `hrV1:submitRequest`.
- `pressControlV1:start/stop`.
- `customerManagerV1:suggest/send/handoff/resolve`.
- `customerFeedbackV1:scan`.
- `goLiveAutopilotV1:sweepReady/prepareReadyInvoice/sendReady/finalizeAndNotify`.
- Accounting save/approve/finalize/ledger actions.
- Knowledge/note writes.
- Order conversation send/upload.
- Platform/franchise/marketplace/service-provider/white-label writes/uploads/deletes.

## Frontend routing blocker
Several active modules bypass `window.trendosSecureApiV1922` and call `TREND_API_URL/API_URL` directly using the employee token.

Confirmed direct-call modules include:
- `attendance-clockin-ui-v1.js`
- `attendance-live-timer-v1.js`
- `employee-cleaning-prep-v1.js`
- `customer-manager-v1.js`
- `customer-feedback-v1.js`
- `go-live-autopilot-v1.js`
- `hr-v1.js`

`press-control-v1.js` uses the secure wrapper first but retains a direct Apps Script fallback.

Therefore Production native login cannot be enabled until these direct employee calls are rerouted to a Cloudflare employee API dispatcher.

## Current safe state
```ini
A61_ACTION_CLASSIFICATION=DONE
A61_BRIDGE_POLICY=ACTION_PLUS_OP_FOR_MULTIPLEXERS
A61_READ_ONLY_PILOT_POLICIES=28
BRIDGE_ENABLED=false
BRIDGE_ALLOWLIST=EMPTY
NATIVE_EMPLOYEE_LOGIN_PRODUCTION=NO
ZERO_GOOGLE_COMPLETE=NO
```

## Next
Build one frontend employee API dispatcher:
1. native employee login/session/logout/password -> D1 native auth routes;
2. existing Cloud-native customer/order actions -> preserve Cloud routes;
3. temporary approved employee legacy actions -> `/v1/employee/legacy-action`;
4. customer-session actions -> unchanged until their own migration;
5. no direct employee request to Apps Script when D1 login mode is enabled.

Then qualify the dispatcher with Production flags still OFF.
