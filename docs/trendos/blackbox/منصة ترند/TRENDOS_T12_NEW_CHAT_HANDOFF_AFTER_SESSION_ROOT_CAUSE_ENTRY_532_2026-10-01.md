# TrendOS T12 — New chat handoff after Entry531 session root cause — Entry532 — 2026-10-01

## Owner-confirmed current state
The owner confirms that the TrendOS platform is currently working again after the clean logout / fresh-login diagnostic sequence.

Important: current operational stability does **not** mean the underlying race is fully eliminated in Production.

## Root cause already found in source
Entry531 established the root cause in the legacy Apps Script employee authorizer:

Old destructive behavior in `authorize_()`:
- missing token => reject + clear stored current employee token;
- mismatched/stale token => reject + clear stored current employee token;
- expired token => reject + clear stored current employee token.

This allowed an old/background request that had already passed the Cloud gate and remained in-flight to arrive after a newer login, see a mismatch, and erase the brand-new valid token.

That explains the intermittent behavior:
1. old request passes Cloud auth shadow;
2. new login succeeds and creates a new token;
3. old in-flight request reaches Apps Script after the login;
4. old `authorize_()` sees mismatch;
5. it clears the current token;
6. all later modules report immediate session expiry.

A clean logout/wait/fresh-login can recover temporarily because the race window is no longer active.

## Entry531 repo fix
Qualified source fix already exists.

Primary commit:
`4d5ef491af4e24baf01ed1f98ae0f298f2874785`

Regression test:
`tests/apps_script_employee_session_mismatch_non_destructive_entry531.test.mjs`

CI:
- `36853268988` = SUCCESS
- `36853452459` = SUCCESS

New intended invariant:
- missing token => reject only; do not clear current session;
- stale/mismatched token => reject only; do not clear current session;
- exact matching expired token => clear that exact expired session;
- explicit logout remains authoritative;
- password change remains authoritative;
- D1/native auth bridge compatibility remains intact.

## Production state
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

Known Production versions from owner evidence:
- `trendos-ui` Entry499 active version: `71364637-50f4-4ef3-b348-0e1432cdc090`
- `trendos-d1-api` Entry504 active short version: `b3deae0e`

## Clean diagnostic chronology already proven
- explicit logout succeeded;
- DevTools Network capture began before fresh login;
- first real `legacy-api` request was `action="login"`;
- login Response returned `success=true`, valid employee metadata and expiry;
- first inspected post-login fetch was `action="getKnowledge"`;
- platform later stabilized and is currently working;
- therefore do **not** blame `getKnowledge` without new evidence;
- earlier `attendanceV1 op=state` failure was observed only after the session was already invalid and is not proven as the root trigger.

No password/token values are stored in the book.

## Mandatory next-chat mission
Do a **Repo-only preventive session/auth audit** before any new Production publication.

Review the session lifecycle comprehensively to make sure Entry531 closes the known race and no equivalent destructive path remains.

At minimum inspect:
1. `Code.gs`
   - `login_()`
   - `authorize_()`
   - `verifyEmployeeSession_()`
   - `logoutEmployee_()`
   - password-change session invalidation
   - any helpers that clear/store employee token or expiry

2. Cloudflare auth transport:
   - `cloudflare-d1/src/cloud-auth-shadow-v1.mjs`
   - `cloudflare-d1/src/legacy-browser-transport-v1.mjs`
   - any employee-native/session bridge paths

3. Frontend session lifecycle:
   - `app.js`
   - all `clearSession`, `logout`, `state.user = null`, storage-removal paths
   - post-login bootstrap sequence
   - behavior on 401/403/5xx
   - session restore/persistence

4. Independent modules:
   - `attendance-v1.js`
   - `press-control-v1.js`
   - customer manager / HR / cleaning / knowledge loaders
   - confirm failures degrade locally and cannot clear the main employee session

5. Orders Edge/session cache:
   - verify local Edge-token invalidation cannot clear employee browser session.

## Required outputs from the audit
- exact list of every path capable of clearing/invalidation;
- classify each as:
  - explicit-authoritative;
  - local-module-only;
  - safe rejection;
  - dangerous/destructive;
- fix any remaining dangerous path in the Repo;
- add regression tests for every discovered session-destruction vector;
- run CI;
- update `TrendOS_MASTER_BOOK.md` after **every** success/failure/no-op;
- only after source audit and CI are clean, decide whether Entry531 is sufficient for manual Apps Script publication or whether a follow-up Entry is needed.

## Hard constraints
- Repo work must be executed by the assistant when possible.
- No Cloudflare Deploy.
- No Wrangler.
- No Workers / Secrets / Variables / Bindings changes.
- No D1 migration.
- Do not rerun migration 0009.
- Do not read or expose Secrets.
- Do not change Order IDs or Statuses.
- Customers must remain:
  `CUSTOMER_MODE=GENERAL`
  `CUSTOMER_MASTER_ROWS=247`
- Order Create must remain:
  `ORDER_CREATE_MODE=GENERAL`
- If a manual Apps Script publish is ultimately needed, ask the owner only for that manual Production step after Repo qualification is complete.

## Reading discipline for the new chat
Read only:
1. `TrendOS_MASTER_BOOK.md` — first page only.
2. `docs/trendos/blackbox/منصة ترند/TRENDOS_T12_EMPLOYEE_SESSION_NON_DESTRUCTIVE_AUTH_ENTRY_531_2026-10-01.md`
3. this handoff file only.

Do not read the full Master Book unless a specific unresolved dependency requires it.

## Tooling note
One attempt to read Entry531 and branch HEAD together used an unavailable branch-lookup function and failed before any mutation. The retry used supported GitHub calls and succeeded.

Current branch HEAD at handoff creation:
`b99b79e50e5305d864ca7fc85d0326ac4fa14ee9`
