# SERVER-93 — Machine Access Service Token readiness: GET audit complete, issuance intentionally deferred

**Date:** 2026-10-23, Cairo. Continuation after owner created short-lived Cloudflare account-scoped Access Apps and Policies Edit token and installed independent-stage DENY EVERYONE policy.

## What was actually tested

- Existing isolation is proven by [Cloudflare GET-only run #39958621567](https://github.com/fawakhry/TrendOs/actions/runs/39958621567): stage `trendos-server68-isolated-stage`, fake D1, workers.dev OFF, previews OFF, reader OFF, exactly one Access app scoped to Worker with **`decision=deny`, `include=[{everyone:{}}]`**.
- [**SERVER-93 live run #39959650164**](https://github.com/fawakhry/TrendOs/actions/runs/39959650164) **SUCCESS**. This is a Cloudflare **GET-only** metadata-permission probe, under `CLOUDFLARE_ACCESS_API_TOKEN`. Its single successful GET confirms the account allows **reading Access Service Token metadata**. No token names, IDs or client secrets were printed or returned in the safe report. The API inventory spans multiple pages, so we explicitly do **not** claim a complete list or an already-qualified Ubuntu identity. 5/5 fully fake offline tests passed.
- First [SERVER-93 run #39959502344](https://github.com/fawakhry/TrendOs/actions/runs/39959502344) stopped because its capability probe required a **single** pagination page; this was correctly changed to report `inventoryComplete=false` and NEVER conclude a suitable token exists.
- No service token **created/rotated/retrieved**, no Cloudflare Access policy modified, and no Worker deployment/route enabled. No physical Ubuntu call, real order/PII access or device operation.

## Permissions and next action

Cloudflare explicitly specifies **`Access: Service Tokens Write`** as the required permission to create a Service Token. The owner's current 7-day key was deliberately limited to **`Access: Apps and Policies Edit`**, so this key must **not** be treated as a service-token issuer. Docs: https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/service_tokens/methods/create/ .

**Next human step, one at a time:** On Cloudflare Zero Trust dashboard go to **Access controls → Service credentials → Service Tokens**, locate **Create Service Token**. For a narrow temporary test identity use name such as `TrendOS Ubuntu synthetic-only` and a short TTL, without exposing any client ID/secret in ChatGPT or public logs. Create only after reviewing identity storage/access plan, since the Client Secret is returned ONCE. Do not create an account-wide allow policy or reuse production auth.

Any future test must keep the current stage DENY policy or explicitly evaluate its precedence; **no direct service-token-only request should be called successful** until a separately verified narrow `service_auth` Access policy is installed and a private stage-only route is available. Stage worker's existing order reader flag remains disabled, so identity generation does not authorize real order data.

The stage does not have a routable private HTTP endpoint for real Ubuntu yet. Physical Ubuntu host and its network constraints must be verified separately.

**Bottom line:** `ACCESS_DENY_EVERYONE=VERIFIED`; `SERVICE_TOKEN_GET=OK`; `WRITE_SCOPE=NOT_PROVEN`; `MACHINE_IDENTITY=NOT_ISSUED`; `UBUNTU_CONNECTED=NO`; `REAL_ORDERS=NO`; `D01_D06_GO=NO`.
