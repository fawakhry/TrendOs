# TrendOS T12 — Apps Script Employee Bridge on Current Main — Entry 483

Date: 2026-09-29 Cairo
Repository: `fawakhry/TrendOs`

## Scope
A61 Phase 5: reapply and qualify the employee legacy compatibility bridge on the current `main` Apps Script source lineage.

This phase is source-only.

No Apps Script production deployment occurred.
No Cloudflare Worker deployment occurred.
No Cloudflare frontend redeploy occurred.
No D1 migration/mutation occurred.
No Order ID/status mutation occurred.
No runtime shared secret was configured.
No auth/bridge flag was enabled.

## PR / qualification
PR #29:
`T12 A61: apply qualified employee legacy bridge to current main Code.gs`

Dedicated CI:
`36590223481` — SUCCESS.

Merged to `main`:
`12dd9d31bcd36db736f0c06191812bdcc5167bad`

## Main-lineage safety proof
Before merge and in CI, the branch `Code.gs` was normalized by removing:
1. the A61 compatibility bridge block and its modified `authorize_` wrapper context;
2. the dedicated `doPost` early wrapper route.

The normalized file matched the current `main` `Code.gs` byte-for-byte.

Result:
```ini
A61_MAIN_CODE_NORMALIZED_EQUALS_MAIN=YES
UNRELATED_BACKEND_REGRESSION=NO
```

Therefore the source merge did not replace the current backend with the older Cloud-branch Apps Script snapshot.

## Security contract
The current-main bridge now contains:
- HMAC-SHA256 server-to-server assertion validation;
- employee binding;
- exact target-action binding;
- canonical target-payload SHA-256 binding;
- short expiry;
- nonce replay protection through Script Cache + Script Lock;
- fail-closed runtime enablement;
- runtime-only shared secret through Script Properties;
- execution-scoped virtual employee context.

The assertion is accepted only through:
`cloudEmployeeLegacyBridgeExecuteV1`

It is not accepted as a normal employee token.

The wrapper removes the token before invoking the legacy business action.

Forbidden through the bridge:
- employee login;
- employee logout;
- employee session verification;
- employee password change;
- customer login/logout/password change;
- the bridge wrapper itself.

## Current exact state
```ini
MAIN_FRONTEND_DISPATCHER_SOURCE=MERGED_DEFAULT_OFF
MAIN_APPS_SCRIPT_BRIDGE_SOURCE=MERGED_DEFAULT_OFF
CLOUD_NATIVE_EMPLOYEE_AUTH_SOURCE=MERGED_CLOUD_BRANCH_DEFAULT_OFF
CLOUD_LEGACY_BRIDGE_SOURCE=MERGED_CLOUD_BRANCH_DEFAULT_OFF

APPS_SCRIPT_PRODUCTION_DEPLOY=NO
CLOUDFLARE_API_DEPLOY_FOR_A61=NO
FRONTEND_REDEPLOY_FOR_A61=NO
D1_AUTH_MIGRATION_APPLIED=NO
BRIDGE_SHARED_SECRET_CONFIGURED=NO
NATIVE_EMPLOYEE_LOGIN_ENABLED=NO
EMPLOYEE_LOGIN_AUTHORITY=APPS_SCRIPT
ZERO_GOOGLE_COMPLETE=NO
```

## Next guarded phase
A61 source foundations are now present on both required sides.

The next phase is not another code rewrite. It is Production installation planning with all switches still OFF:

1. establish a fresh shared bridge secret outside GitHub;
2. configure the same secret in Cloudflare Worker secrets and Apps Script Script Properties;
3. install/deploy the current-main Apps Script source containing the bridge with `TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED=false`;
4. deploy the Cloudflare A61 backend source with native auth + bridge flags still false and bridge allowlist empty;
5. apply the additive D1 employee-auth migration;
6. validate health endpoints and existing Google-backed login while all A61 runtime flags remain OFF;
7. migrate/seed employee verifier/session authority into D1 using the qualified bootstrap process;
8. enable only a tightly controlled canary/native login after the OFF-state installation is proven safe;
9. start with the minimum read-only bridge policy; writes stay blocked until separately qualified.

Cloudflare/D1 runtime installation remains owner-operated.
