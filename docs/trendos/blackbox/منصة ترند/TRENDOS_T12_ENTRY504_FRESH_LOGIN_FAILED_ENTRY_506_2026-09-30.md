# TrendOS T12 — Entry506 — Fresh employee login still expires after Entry504 — 2026-09-30

## Owner-observed production failure
After Entry504 was manually deployed to `trendos-d1-api` and active at 100% traffic, the owner performed a fresh employee login.

Observed UI:
- TrendOS opens the authenticated main screen.
- Orders/service UI is visible.
- A red banner appears immediately:
  `انتهت الجلسة. سجل الدخول مرة أخرى.`

Observed Console in the supplied screenshot:
- no visible repeated `POST /v1/legacy-api -> 502`;
- no visible `Required D1 mirror is stale: بنود الأوردرات`;
- visible startup log:
  `[TrendOS D1] Customer Manager read bridge active V1934_D1_READ_BRIDGE_20260829`.

## Qualification result
```ini
ENTRY504_PRODUCTION_DEPLOYED=YES
ENTRY504_ACTIVE_API_VERSION_SHORT=b3deae0e
ENTRY504_TRAFFIC_PERCENT=100
ENTRY504_FRESH_LOGIN_QUALIFIED=NO
ORDERS_UI_RENDERING=YES
LEGACY_502_VISIBLE_IN_CAPTURE=NO
ORDERS_STALE_WARNING_VISIBLE_IN_CAPTURE=NO
EMPLOYEE_SESSION_IMMEDIATE_EXPIRY=YES
ZERO_GOOGLE_COMPLETE=NO
```

## Interpretation
Entry504 closed the previously identified stale-token/D1-shadow race, but a separate employee-auth failure path still exists.

The next action is diagnostic, not another deploy.

## Mandatory next diagnostic
Capture the first failing employee request from Browser DevTools Network:

1. Open DevTools -> Network.
2. Enable Preserve log.
3. Clear the Network list.
4. Explicitly logout/close old TrendOS tab.
5. Open TrendOS again and perform exactly one fresh employee login.
6. Wait until the red session-expired message appears.
7. Filter Network by:
   `legacy-api`
8. Inspect requests in chronological order and identify the first response whose JSON contains:
   - `success: false`, or
   - `انتهت الجلسة`, or
   - auth/session error code.
9. Record:
   - request action;
   - HTTP status;
   - response JSON;
   - whether request body had username/token fields (do NOT expose the token value).

## Safety
Until that evidence is captured:
- no new Cloudflare deploy;
- no Wrangler;
- no Secrets/Variables/Bindings changes;
- no D1 migration;
- no Order ID/Status mutation;
- no Google/Apps Script property changes.

## Project logging rule
From Entry506 onward every operational/repository/Cloudflare/test/diagnostic step must be written to `TrendOS_MASTER_BOOK.md`, whether successful, failed, blocked, rolled back, partial, or no-op.
