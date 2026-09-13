# TrendOS Cloud Migration V3 — T6A Production Session Bridge Canary — PASS — 2026-09-13

## Result

T6A production canary completed successfully.

Workflow run: `34765963822` (rerun attempt with fresh login credential available)

Job: `103751417709`

Candidate branch: `cloud-migration-v3-t6a-login-canary-20260913`

Candidate head: `164bde4273c27d956986d43e5b2b74013d4e4422`

Production Worker version deployed and retained:
`5e87bbb5-0e07-43fc-b32e-15a83c81e647`

Automatic rollback: NOT TRIGGERED.

## Scope that passed

- Hard T6A scope / credential gate: PASS
- T6A contracts: PASS
- Pre-deploy production baseline: PASS
- Fresh qualification login: PASS
- Exact Worker dry-run: PASS
- Production Worker canary deploy: PASS
- Post-deploy production baseline: PASS
- Authenticated session qualification: PASS
- Operator Task route remains fail-closed unauthenticated: PASS
- Ephemeral employee token cleanup: PASS

## Fresh qualification session

The workflow performed a normal production Apps Script `login` using the existing qualification username and the newly added repository secret `TRENDOS_PROD_QUALIFY_PASSWORD`.

Login duration:
`5874 ms`

The returned employee token was masked, written only to `/tmp/t6a-employee-token`, used during this run, then deleted.

`T6A_TOKEN_PERSISTED_TO_GITHUB=NO`

A successful login writes the qualification user's fresh Token and Last Login timestamp in the Users sheet. No business-row mutation was performed.

## Production authenticated session measurements

`POST /v1/edge/session`
- HTTP 200
- success = true
- sessionBridge = `cloud-session-bridge-v3-post`
- authSource = `apps-script-post`
- duration = `3498 ms`

`POST /v1/edge/orders/session`
- HTTP 200
- success = true
- sessionBridge = `cloud-session-bridge-v3-post`
- authSource = `apps-script-post`
- duration = `2681 ms`

Both are below the T6A 15-second failure threshold.

This confirms the production session bridge no longer depends on the previously broken Apps Script GET verification lane for these exact session paths.

## Production safety state preserved

- `PRODUCTION_FRONTEND_EDGE_ORDERS_READ_CHANGED=NO`
- `PRODUCTION_D1_MIGRATION=NO`
- `PRODUCTION_AUTH_SHADOW_ENABLE=NO`
- `SHEETS_WRITE_AUTHORITY_CHANGED=NO`
- `TASK_MUTATION=NO`
- `EDGE_SESSION_SECRET_CHANGED=NO`
- `TASK_PROXY_SECRET_CHANGED=NO`
- `GABER_GATE_CHANGED=NO`

Cloudflare Worker health passed before and after deployment.

Operator Task unauthenticated route remained fail-closed with HTTP 401.

## Meaning

T6A is CLOSED / PASS.

The production Worker now contains the exact POST session bridge canary qualified by T6A while the frontend Edge Orders read flag remains unchanged/OFF and Google Sheets / Apps Script remains authoritative for business writes.

The legacy GET verification problem is not globally fixed inside Apps Script; rather, the two production Worker session-exchange paths qualified here now use the POST bridge and pass authenticated production verification.

## Next decision gate

Do not automatically proceed into the next production authority change.

The next production step is a separate owner decision because it would introduce new state/authority behavior beyond T6A. Candidate next stages include production D1 Auth Shadow migration/enablement and later frontend Orders-read canary/cutover.

No such next-stage production change was performed by this checkpoint.
