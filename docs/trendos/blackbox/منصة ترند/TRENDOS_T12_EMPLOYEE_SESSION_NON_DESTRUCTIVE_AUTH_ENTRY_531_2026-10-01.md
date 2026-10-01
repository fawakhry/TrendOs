# TrendOS T12 — Entry531 — Employee session stale-request race root cause and non-destructive auth fix — 2026-10-01

## Production observation
After a clean explicit logout and fresh login capture, the platform started working normally again. The first login request returned `success=true` with a valid expiry and employee metadata. The first inspected post-login request was `getKnowledge`.

## Root cause found in source
The production Apps Script employee authorizer used this destructive rule:
- missing token OR mismatched token OR expired session
- => clear the stored employee token
- => return session-expired.

Entry504 already blocks stale/missing tokens at Cloudflare before forwarding, but it cannot stop a request that had already passed the Cloud gate and was in-flight toward Apps Script before a newer login completed.

Race:
1. old/background request passes Cloud shadow using the then-current old token;
2. new login succeeds and writes a brand-new token;
3. the already-in-flight old request reaches Apps Script later;
4. `authorize_()` sees token mismatch;
5. old code clears the newly stored valid token;
6. all later modules report immediate session expiry.

This matches the intermittent symptom and why a clean logout/wait/fresh-login sequence restored stability without a new deployment.

## Repo fix
Commit:
`4d5ef491af4e24baf01ed1f98ae0f298f2874785`

File:
`Code.gs`

New invariant:
- missing token => reject request only, do not clear stored session;
- mismatched/stale token => reject request only, do not clear stored session;
- exact matching token + expired session => clear that exact expired session;
- explicit logout still clears only when supplied token matches current stored token;
- password change still invalidates the authenticated matching session.

## Regression test
Test:
`tests/apps_script_employee_session_mismatch_non_destructive_entry531.test.mjs`

Coverage:
- valid current token succeeds without mutation;
- missing token fails without clearing current session;
- stale token fails without clearing current session;
- stale token cannot clear a different current session even if expiry state is true;
- exact matching expired token is cleared;
- D1-native bridge auth context remains supported.

Test commit:
`bdcf64efc240db8d88bcc2b15ae26f16f639ca6d`

CI workflow was extended to:
- syntax-check `Code.gs`;
- execute Entry531 regression;
- trigger on future `Code.gs` changes.

Workflow commits:
`e7ce471f27586073b44e2d03635dfa7e2f897e46`
`5f93fad0c08758a0ac9f6c37d5e87e4019e3a679`

Qualification:
- Run `36853268988` = SUCCESS
- Run `36853452459` = SUCCESS

## Related audit findings
- Main frontend employee state is cleared by the explicit `logout()` path; ordinary data-load failures do not call the main `clearSession()`.
- Orders Edge has a separate local Edge-token cache named `session`; clearing it on 401 does not clear the employee browser session.
- Attendance/Press/other modules read the current employee token dynamically. Some widgets may remain visually mounted briefly after logout, but their request functions stop/skip when no employee token is present.
- Entry504 remains useful as the first Cloud-side stale-token gate; Entry531 closes the remaining already-in-flight request race at the final legacy authority.

## Production state
```ini
PLATFORM_CURRENTLY_WORKING=YES
ENTRY504_PRODUCTION_DEPLOYED=YES
ENTRY531_SOURCE_QUALIFIED=YES
ENTRY531_APPS_SCRIPT_PRODUCTION_DEPLOYED=NO
EMPLOYEE_LOGIN=GOOGLE_BACKED
ZERO_GOOGLE_COMPLETE=NO
```

## Safety / next step
No Cloudflare deploy, Wrangler, Secrets, Variables, Bindings, D1 migration, Order ID or Order Status mutation was performed for Entry531.

Until Entry531 is manually published as a new Apps Script production version, the underlying legacy Apps Script destructive mismatch behavior remains present in production even though the platform is currently stable. Entry504 reduces the chance of recurrence but cannot eliminate the already-in-flight race by itself.
