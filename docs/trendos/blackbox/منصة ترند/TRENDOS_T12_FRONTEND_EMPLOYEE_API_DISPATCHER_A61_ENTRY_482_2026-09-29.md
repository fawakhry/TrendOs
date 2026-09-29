# TrendOS T12 — Frontend Employee API Dispatcher A61 — Entry 482

Date: 2026-09-29 Cairo
Repository: `fawakhry/TrendOs`

## Scope
A61 Phase 4: qualify the frontend routing foundation required before D1-native employee login can be enabled.

This phase was built from the current `main` frontend lineage, not from the older Cloud migration branch frontend snapshot.

No Production Cloudflare frontend redeploy occurred in this phase.
No Worker API deploy occurred.
No Apps Script deploy occurred.
No D1 migration/mutation occurred.
No Order ID/status mutation occurred.
No secret value was added to the repository.

## PR and qualification
PR #28:
`T12 A61: add default-off frontend employee API dispatcher`

CI:
`36587865304` — SUCCESS.

Checks passed:
- JS syntax for dispatcher and changed runtime modules.
- dynamic frontend dispatcher contract.
- exact legacy transport preservation while OFF.
- D1 native-token isolation from Apps Script.
- action+op bridge policy behavior.
- hybrid Orders legacy fallback routing through the bridge when native mode is later enabled.
- default-OFF boundary.

Merged to `main`:
`86bb83bb57d0d967c8c8c46b4703244d2e12c51a`

## New frontend dispatcher
File:
`employee-api-dispatcher-v1.js`

Loaded immediately after the A60 `app.js` shell in `index.html`.

### Behavior while OFF
Repository defaults:
```ini
MATBAGY_EMPLOYEE_NATIVE_AUTH_V1=false
MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1=false
MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES=[]
```

While OFF, existing frontend transport remains unchanged.

### Future native-mode routing
When separately enabled later:
- employee login/logout/session/password-change -> Cloudflare/D1 native employee auth;
- already Cloud-native customer/order actions -> existing Edge routes;
- customer-session actions -> their existing customer authority;
- approved temporary employee legacy actions -> `/v1/employee/legacy-action`;
- unapproved employee legacy actions -> fail closed.

The dispatcher removes password fields from legacy-bridge payloads and sends the D1 employee session token only to Cloudflare as a Bearer token. It never forwards that native token into the Apps Script business request.

## Direct-call modules corrected
These modules previously bypassed `window.trendosSecureApiV1922` and called `TREND_API_URL/API_URL` directly with the employee token. They now support the dispatcher while preserving the exact previous transport when native mode is OFF:
- `attendance-clockin-ui-v1.js`
- `attendance-live-timer-v1.js`
- `employee-cleaning-prep-v1.js`
- `customer-manager-v1.js`
- `customer-feedback-v1.js`
- `go-live-autopilot-v1.js`
- `hr-v1.js`
- `press-control-v1.js`

## Hybrid Orders fallback
`trendos-edge-orders-read-v1.js` now has a native-mode-safe legacy fallback:
- when native employee auth is OFF: current Apps Script fallback behavior is preserved;
- when native employee auth is ON: legacy fallback goes through `trendosEmployeeLegacyFallbackV1` and therefore through the Cloudflare employee legacy bridge.

This applies to the temporary legacy side of:
- `getRowsPageV1931` fallback;
- legacy-row `updateLine`;
- legacy-row `markCustomerNotified`.

Cloud-native order/customer paths remain Cloud-native.

## Current safe state
```ini
A61_NATIVE_AUTH_BACKEND_CODE=MERGED_CLOUD_BRANCH_DEFAULT_OFF
A61_LEGACY_AUTH_BRIDGE_CODE=MERGED_CLOUD_BRANCH_DEFAULT_OFF
A61_ACTION_CLASSIFICATION=PASS
A61_FRONTEND_DISPATCHER=MERGED_MAIN_DEFAULT_OFF
A61_FRONTEND_DISPATCHER_CI=PASS
A61_FRONTEND_REDEPLOY=NO
A61_APPS_SCRIPT_BRIDGE_DEPLOY=NO
A61_D1_MIGRATION_APPLIED=NO
EMPLOYEE_LOGIN_AUTHORITY=APPS_SCRIPT
ZERO_GOOGLE_COMPLETE=NO
```

## Next safe phase
Build the Apps Script bridge patch again from the current `main` `Code.gs` lineage.

Reason:
the Cloud migration branch contains the qualified bridge logic but its `Code.gs` ancestry is not the same as the latest production/main source. Copying or deploying the old Cloud-branch `Code.gs` wholesale could regress unrelated backend fixes.

Required next sequence:
1. create a fresh branch from current `main`;
2. apply only the qualified bridge primitives to current `Code.gs`;
3. preserve all existing main business logic;
4. add CI/security tests;
5. merge source only after qualification;
6. still do not deploy Apps Script or configure the shared secret until a separate guarded Production installation step.
