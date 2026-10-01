# TrendOS T12 — Employee Session/Auth Preventive Audit — Entry533 — 2026-10-01

## Scope

Repo-only preventive audit starting from Entry532.

Repository:
`fawakhry/TrendOs`

Branch:
`candidate/t12-full-cloud-cutover-a56-20260929`

Hard constraints preserved:
- no Cloudflare deploy;
- no Wrangler;
- no Worker / Secret / Variable / Binding mutation;
- no D1 migration;
- migration 0009 was not rerun;
- no Secrets were read or exposed;
- no Order ID or Order Status was changed;
- Apps Script Production was not deployed.

## Starting state

```ini
PLATFORM_CURRENTLY_WORKING=YES
ENTRY498_PRODUCTION_DEPLOYED=YES
ENTRY499_PRODUCTION_DEPLOYED=YES
ENTRY504_PRODUCTION_DEPLOYED=YES
ENTRY531_SOURCE_QUALIFIED=YES
ENTRY531_APPS_SCRIPT_PRODUCTION_DEPLOYED=NO
EMPLOYEE_LOGIN=GOOGLE_BACKED
ZERO_GOOGLE_COMPLETE=NO
CUSTOMER_MODE=GENERAL
CUSTOMER_MASTER_ROWS=247
ORDER_CREATE_MODE=GENERAL
```

Entry531 root cause remains the only destructive employee-session race found:
an old in-flight Apps Script request could present a stale token after a newer login and the old `authorize_()` implementation could erase the newer stored token.

Current source already contains the Entry531 non-destructive fix.

---

## Audit result

**No additional dangerous/destructive employee-session path was found in the current branch.**

The current source invariant is:

- missing employee token: reject only;
- stale/mismatched employee token: reject only;
- exact matching expired employee token: reject and clear only that exact expired legacy session;
- explicit logout: authoritative only when the presented token matches;
- password change: authoritative after successful authentication and old-password verification;
- independent module failures: local degradation only;
- Orders Edge 401 cache reset: local Edge token only;
- Cloud shadow/native-session failures: scoped rejection or scoped Cloud-session revocation only.

The historical pre-Entry531 `authorize_()` behavior remains dangerous **in Apps Script Production until Entry531 is manually published**. The current repository no longer contains that behavior.

---

## Complete clear / invalidate path classification

| Layer / path | What can be invalidated | Classification | Audit conclusion |
|---|---|---|---|
| `Code.gs login_()` | Replaces previous legacy employee token with a newly authenticated token | explicit-authoritative | Safe. A successful fresh login becomes the current legacy session. |
| `Code.gs authorize_()` — missing token | Nothing | safe-rejection | Rejects only; does not clear current token. |
| `Code.gs authorize_()` — stale/mismatched token | Nothing | safe-rejection | Entry531 fix. Stale request cannot erase a newer session. |
| `Code.gs authorize_()` — exact matching expired token | Exact currently presented expired legacy token | safe-rejection | Safe scoped invalidation; no cross-session clear. |
| `Code.gs verifyEmployeeSession_()` | Nothing directly | safe-rejection | Read/verify only; no token write. |
| `Code.gs logoutEmployee_()` | Exact matching legacy token | explicit-authoritative | Safe. Missing/stale logout cannot clear a newer token. |
| `Code.gs changePassword_()` | Authenticated current legacy token | explicit-authoritative | Safe. Requires valid session + correct old password; returns `forceRelogin`. |
| Apps Script D1 legacy bridge context | Nothing in legacy token store | safe-rejection | Assertion context is request-scoped and raw native token is not written into Apps Script employee token storage. |
| Cloud auth shadow lookup miss / stale fingerprint | Nothing outside the rejected request | safe-rejection | Returns 401 locally; does not touch Apps Script or browser employee session. |
| Cloud auth shadow new-login cleanup | Older D1 shadow fingerprints for same username | local-module-only | Scoped to Cloud shadow cache/session layer. Does not clear browser or Apps Script token. |
| Cloud auth shadow logout/password revocation | Exact presented shadow fingerprint | local-module-only | Scoped D1 shadow cleanup only. |
| Legacy browser transport 401/403/5xx | Nothing in browser employee session | safe-rejection | Returns/throws error; no storage clear. |
| Native employee verify | Nothing on miss/expired/version mismatch | safe-rejection | Read rejection; no destructive cross-session mutation. |
| Native employee logout | Exact native token fingerprint | explicit-authoritative | Safe exact-session revoke. |
| Native employee password change | All native sessions for the authenticated username through session-version/revoke | explicit-authoritative | Intentional security invalidation after valid session + old password. |
| Transitional native bootstrap cleanup | Exact temporary Apps Script token created by the bootstrap | explicit-authoritative | Safe because Apps Script logout is exact-match; cannot erase a newer token. |
| Employee legacy bridge | Nothing on rejected assertion/session | safe-rejection | Verifies native session and action policy; raw native token/password are not forwarded to Apps Script. |
| `app.js saveSession()` legacy localStorage cleanup | Obsolete localStorage copies after sessionStorage is written | local-module-only | Does not destroy the active in-memory/sessionStorage employee session. |
| `app.js clearSession()` | Browser employee session + SSO keys + `state.user` | explicit-authoritative | Current runtime call site is only `logout()`. |
| `app.js logout()` | Browser employee session; requests authoritative backend logout | explicit-authoritative | User logout path. |
| `app.js changePassword` success + `forceRelogin` | Routes to `logout()` | explicit-authoritative | Intentional after password change. |
| `app.js` restore / `loadSession()` | Nothing | safe-rejection | Restores sessionStorage only; does not clear current server session. |
| `app.js` post-login `bootMain()` | Nothing | local-module-only | Starts reads/timers; failures do not clear session. |
| `getRowsPageV1931` loader failure | Module/view state only | local-module-only | Error/degradation only. |
| Knowledge loader / `getKnowledge` failure | Knowledge UI only | local-module-only | Not a session-clear path. |
| Attendance V1 / timer / clock-in failures | Attendance UI/cache/fallback only | local-module-only | No main logout/clear. |
| Press Control failure | Press widget state only | local-module-only | No main logout/clear. |
| Customer Manager failure | Customer Manager UI only | local-module-only | No main employee session clear. |
| HR failure | HR module/fallback state only | local-module-only | No main employee session clear. |
| Cleaning prep failure | Cleaning widget/local completion marker only | local-module-only | Fallback to note; no employee session clear. |
| Additional active runtime modules | Their own UI/module state only | local-module-only | Full manifest sweep found no hidden employee-session clear path. |
| Orders Edge `clearSession()` | In-memory Orders Edge `session.token/expiresAt/inflight` only | local-module-only | Does not remove `trendos_session`, `matbagy_session_token`, SSO, or `state.user`. |
| Orders Edge 401 retry | Local Edge token only, then re-exchange | local-module-only | Cannot clear the employee browser session. |
| Historical Production pre-Entry531 `authorize_()` mismatch clear | Could clear a newer valid Apps Script employee token | dangerous/destructive | Root cause. Fixed in repo by Entry531; still present in Production until manual Apps Script publication. |

---

## Frontend active-runtime sweep

The runtime manifest was derived from `index.html` and `config.js`.

In addition to the explicitly requested modules, the audit scanned active runtime files including:

- `trendos-return-traffic-quiet-v1.js`
- `matbagy_theme_v1860.js`
- `trendos-resume-no-autorefresh-v1.js`
- `trend-master-resilience-v1931.js`
- `manager-center-v1932.js`
- `customer-feedback-v1.js`
- `employee-manager-strips-v2.js`
- `employee-manager-strips-drag-v2.js`
- `employee-andon-v1.js`
- `go-live-autopilot-v1.js`
- `operations-hub-v1.js`

No hidden main employee-session clear path was found.

---

## Preventive regression

Added:

`tests/frontend_employee_session_isolation_entry533.test.mjs`

Initial commit:
`0d32359d96b46dbf983ef5c7e91ee7c0caaee6dc`

Broadened active-runtime version:
`90802d691820f8119307738756179ee5c2644bc1`

The test now:

1. verifies main `app.js clearSession()` is called only by explicit `logout()`;
2. derives active JavaScript runtime files automatically from `index.html` + `config.js`;
3. prevents active modules from clearing browser storage wholesale, removing employee session/SSO keys, nulling the main employee user, defining/calling a main-style `clearSession`, or issuing employee logout implicitly;
4. proves Orders Edge `clearSession()` remains local to the Edge cache;
5. proves browser transport does not clear employee state;
6. locks `Code.gs` employee-token mutations to exactly:
   - login;
   - exact-match expiry;
   - explicit logout;
   - password change;
7. proves `verifyEmployeeSession_()` does not mutate the employee token.

CI workflow:
`.github/workflows/trendos-a61-browser-transport-ci.yml`

Qualification:
- `36855420798` = SUCCESS after first Entry533 CI wiring;
- `36855971271` = SUCCESS after broadening to the full active-runtime manifest;
- job `isolated-regression` = SUCCESS;
- `Syntax` = SUCCESS;
- `Isolated transport, dispatcher, Orders and A61 regressions` = SUCCESS.

---

## Apps Script publish-scope proof

The GitHub history for `Code.gs` on the candidate branch shows that the **latest commit touching `Code.gs` is exactly Entry531**:

`4d5ef491af4e24baf01ed1f98ae0f298f2874785`

Current `Code.gs` blob SHA:

`e91d78dcceeeca2804e721d58e065a6a7181bfc2`

Entry531 commit `Code.gs` blob SHA:

`e91d78dcceeeca2804e721d58e065a6a7181bfc2`

Result:

```ini
CURRENT_CODE_GS_IDENTICAL_TO_ENTRY531=YES
POST_ENTRY531_CODE_GS_RUNTIME_CHANGES=0
```

Therefore publishing the current `Code.gs` source does not accidentally include a later unqualified Apps Script runtime change.

---

## Decision

```ini
ENTRY533_PREVENTIVE_SESSION_AUDIT=PASS
ADDITIONAL_DANGEROUS_SESSION_PATHS_FOUND=0
NEW_RUNTIME_FIX_REQUIRED_BEFORE_ENTRY531_PUBLISH=NO

ENTRY531_SOURCE_QUALIFIED=YES
ENTRY531_APPS_SCRIPT_PRODUCTION_DEPLOYED=NO
ENTRY531_APPS_SCRIPT_PRODUCTION_PUBLISH_READY=YES

PLATFORM_CURRENTLY_WORKING=YES
EMPLOYEE_LOGIN=GOOGLE_BACKED
ZERO_GOOGLE_COMPLETE=NO

CUSTOMER_MODE=GENERAL
CUSTOMER_MASTER_ROWS=247
ORDER_CREATE_MODE=GENERAL
```

**Entry531 is sufficient for the next manual Apps Script Production publication.**

Entry533 adds preventive audit coverage, documentation, and regression protection; it does not introduce a new Apps Script runtime fix that must be published first.

---

## The only manual Production action authorized next

Publish the **current Entry531-qualified `Code.gs` source** as a **new version of the existing Apps Script Web App deployment**.

Preserve:
- the existing deployment;
- the existing deployment URL / deployment ID;
- the existing execute-as setting;
- the existing access setting.

Do not change Cloudflare, Workers, Secrets, Variables, Bindings, or D1 as part of this step.

After the owner confirms that Apps Script publication completed, the next validation is employee-session stability; after that the planned T12 path resumes with the Cloud-native duplicate-order guard and then Zero-Google migration.
