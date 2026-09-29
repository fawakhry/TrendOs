# TrendOS T12 — Employee Legacy Auth Compatibility Bridge A61 — Entry 480

Date: 2026-09-29 Cairo
Repository: `fawakhry/TrendOs`

## Scope
A61 compatibility prerequisite only.

Purpose:
keep D1 as the future employee authentication authority while the remaining legacy business actions are still temporarily served by Apps Script.

This Entry does **not** enable Production native login.

No Order ID/status mutation occurred.
No D1 production mutation occurred.
No Worker production deploy occurred.
No Apps Script production deploy occurred.
No frontend login cutover occurred.
No secret value was written to GitHub.

## PR and qualification
PR #26:
`T12 A61: D1-authoritative compatibility bridge for legacy actions`

Dedicated bridge CI:
`36584280155` — SUCCESS.

Also passed:
- Native Employee Auth CI.
- JS syntax for Worker modules.
- syntax check of `Code.gs` through a temporary JS copy.
- fail-closed config checks.
- secret hygiene checks.

Merge SHA on the Cloud working branch:
`18ed4404a35a835f54912c819f4d0dcc83325b8e`

Repository-wide Integrity remains red on the existing 02CR Orders test (`expected 200, actual 502`). The bridge PR did not modify the 02CR handler/test path, so that failure remains outside this Auth scope.

## Compatibility architecture

### Browser / Cloudflare side
Exact bridge route:
- `POST /v1/employee/legacy-action`
- health: `GET /v1/employee/legacy-action/health`

Cloudflare:
1. verifies the browser employee session in D1;
2. rejects inactive employees;
3. rejects `mustChange=true`;
4. checks an explicit exact action allowlist;
5. removes credential/password fields;
6. creates a short-lived server-to-server assertion;
7. calls one dedicated Apps Script wrapper action.

The employee's raw D1 native session token is never forwarded to Apps Script.

### Assertion security
The assertion is:
- HMAC-SHA256 signed;
- short-lived (candidate default 45 seconds);
- bound to canonical employee username;
- bound to exact target action;
- bound to SHA-256 digest of the canonical target payload;
- contains a nonce.

Apps Script:
- validates the shared secret from Script Properties;
- validates signature and expiry;
- validates employee/action/payload bindings;
- consumes the nonce through Script Cache under Script Lock;
- rejects replay;
- rejects `mustChange=true`;
- creates a temporary in-execution virtual employee context.

Apps Script does **not** accept the Cloudflare assertion as a normal employee token.

### Dedicated wrapper
Cloudflare forwards only:
`action=cloudEmployeeLegacyBridgeExecuteV1`

The actual legacy business action is carried as `targetAction` and must match the signed assertion and signed request body.

Forbidden through this bridge:
- employee login
- employee logout
- employee session verification
- employee password change
- customer login/logout/password change
- the wrapper action itself

### Existing Apps Script authorization
Inside the verified wrapper execution, existing business functions can keep calling:
`authorize_(username, token)`

`authorize_` first checks the in-execution trusted Cloudflare context. Outside that wrapper, the historical Users-sheet token path remains unchanged.

This prevents a signed bridge assertion from being copied and used directly against arbitrary Apps Script actions.

## Runtime configuration
Repository defaults remain fail-closed:
```ini
TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED=false
EMPLOYEE_LEGACY_BRIDGE_ACTIONS=
EMPLOYEE_LEGACY_BRIDGE_ASSERTION_TTL_SECONDS=45
```

The shared secret is intentionally absent from `wrangler.toml` and repository documentation.

Therefore:
```ini
A61_NATIVE_AUTH_FOUNDATION=MERGED
A61_LEGACY_AUTH_BRIDGE=MERGED
A61_PRODUCTION_ENABLEMENT=NO
EMPLOYEE_LOGIN_AUTHORITY=APPS_SCRIPT
ZERO_GOOGLE_COMPLETE=NO
```

## Next safe phase
Before any Production auth cutover:
1. classify the remaining employee-authenticated Apps Script actions into read-only / business-write / maintenance / auth-forbidden;
2. build the exact temporary bridge allowlist from that classification;
3. identify actions already moved to Cloudflare so they are never bridged back to Apps Script;
4. qualify a Production installation with bridge disabled;
5. migrate employee credentials/session state to D1 under guarded controls;
6. only then enable transitional/native login and the minimum temporary bridge actions;
7. remove the bridge action-by-action as those business routes move to Cloudflare.

No production enablement is authorized by this documentation step.
