# TrendOS T12 — Entry491 — A61 Cloudflare OFF-state installation verified

Date: 2026-09-30  
Branch: `candidate/t12-full-cloud-cutover-a56-20260929`  
Worker: `trendos-d1-api`

## Outcome

A61 Worker source is installed in Cloudflare Production in **OFF-state only**. No native employee login, transitional bootstrap, native-only mode, legacy bridge, bridge allowlist, or bridge secret was enabled.

Authoritative post-deploy read-only verification:
- GitHub Actions run: `36688742762`
- active deployment: `f2b306fb-5d54-4ede-8a7e-cdfc7289b103`
- active version: `3232b4ce-1d1f-47d4-81a3-475c3ab5614e`
- live Worker bundle SHA-256: `befde84a727cf7bb0b7f3a8769b7b5aad560d783ab7edf9f783430e84b083494`
- exact A61 target bundle SHA-256: `befde84a727cf7bb0b7f3a8769b7b5aad560d783ab7edf9f783430e84b083494`
- live equals qualified A61 target: **YES**

## Read-only drift preflight

Run `36687886593` proved before deployment that:
- active Production version was `ec0fd00b-f4b8-4abf-8b79-449ee1637f3a`;
- live Production bundle SHA-256 was `ef841a76643c28e8ef8ea8b72e5ea758ab5b970c59f4655e1a61d0211ede32a3`;
- that hash matched the exact pre-A61 baseline byte-for-byte;
- the locked A61 target hash was `befde84a727cf7bb0b7f3a8769b7b5aad560d783ab7edf9f783430e84b083494`;
- Cloudflare source delta from the live baseline was exactly the qualified A61 set;
- `APPS_SCRIPT_API_URL` was unchanged and D1 binding still pointed to `trendos-main`;
- Customers and Orders health were `GENERAL` before install.

Deployment used a runner-only temporary Wrangler config with `keep_vars=true` to preserve Dashboard-only plaintext variables. Canonical `cloudflare-d1/wrangler.toml` was not modified for that guard. No secret put/delete/bulk command was authorized.

## Verified OFF-state

```ini
TRENDOS_EMPLOYEE_AUTH_V1_ENABLED=false
TRENDOS_EMPLOYEE_AUTH_LEGACY_BOOTSTRAP_V1_ENABLED=false
TRENDOS_EMPLOYEE_AUTH_NATIVE_ONLY_V1=false
TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED=false
EMPLOYEE_LEGACY_BRIDGE_ACTIONS=
EMPLOYEE_LEGACY_BRIDGE_SECRET_V1=DEFERRED_NOT_CONFIGURED
APPS_SCRIPT_API_URL_UNCHANGED=YES

AUTH_HEALTH=PASS_OFF
BRIDGE_HEALTH=PASS_DISABLED
D1_AUTH_CONTROL_MODE=OFF

CUSTOMER_MODE=GENERAL
CUSTOMER_COUNT=247
ORDER_CREATE_MODE=GENERAL
PROTECTED_ROUTES=PASS_AUTH_PROTECTED

NATIVE_EMPLOYEE_LOGIN=NO
EMPLOYEE_LOGIN=GOOGLE_BACKED
ZERO_GOOGLE_COMPLETE=NO
```

`/v1/employee/auth/health` reports schema ready with control mode `OFF`, environment auth disabled, bootstrap disabled, native-only disabled, and no plaintext password storage. `/v1/employee/legacy-action/health` reports bridge disabled, allowlist count zero, upstream still configured, and bridge secret not configured.

Customers remained D1-native `GENERAL` at 247 rows and Orders create remained `GENERAL`. Anonymous probes against protected Orders and Customer read routes still returned the expected authentication boundary.

## Controlled-deploy runner incident

Controlled deploy run `36688462685` successfully reached zero-traffic upload, Preview qualification, Production promotion, Production OFF-state health checks, protected-route checks, and post-deploy D1 `OFF` verification. Its final active-version assertion then exited with code `42` because the shell target-version variable was not exported into the Node subprocess.

The result-writer therefore emitted `TRENDOS_T12_A61_CLOUDFLARE_OFF_STATE_DEPLOY_RESULT_2026-09-30.txt` as an incomplete failed artifact. That file is **not authoritative for Production state** and is superseded by `TRENDOS_T12_A61_POSTDEPLOY_READONLY_VERIFY_RESULT_2026-09-30.txt`.

The rollback command did not execute; the independently verified A61 target remained the sole 100% active Production version. The verification defect did not enable any A61 runtime flag or modify business data.

## Mutation boundary

```ini
APPS_SCRIPT_MUTATION=NO_DURING_CLOUDFLARE_PHASE
D1_MIGRATION_REAPPLY=NO
D1_BUSINESS_MUTATION=NO
ORDER_MUTATION=NO
CUSTOMER_MUTATION=NO
ACCOUNTING_MUTATION=NO
SCRIPT_PROPERTIES_TOUCHED=NO
BRIDGE_SECRET_CREATED=NO
NATIVE_LOGIN_CANARY=NO
```

## Stop point

OFF-state Worker installation is complete and independently verified. **Stop here.** Do not begin native-login canary, bootstrap, native-only, legacy-bridge enablement, allowlist population, or secret creation without a new owner-approved phase and fresh read-only preflight.
