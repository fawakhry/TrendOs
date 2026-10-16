# SERVER-31 — Dedicated service-order reader: backend authorization gate

Status: `SPEC_TEST_ONLY / NO_LIVE_IDENTITY / NO_LIVE_ROUTE`, 2026-10-16.

This builds on, and **does not replace or re-implement**, AP-299, AP-300, AP-301 and AP-302. The machine-readable contract is [SERVICE_ORDER_READER_POLICY_V1.json](SERVICE_ORDER_READER_POLICY_V1.json), tested without network by `tests/server31_service_reader_contract.test.mjs`.

## Server-side implementation requirements (not yet shipped)

1. A separate D1 service-principal registry must have a disabled-by-default record for `trendosshop_order_reader`, credential fingerprint (never plaintext), explicit permissions `orders.read` for `print` and `laser`, rotation/revocation state, audience and expiry. A migration/provisioning change to actual D1 requires owner approval; no schema or row is created in this phase.
2. Backend issuer/verifier must check secret/token integrity, validity, role and grants independently from any browser-provided `screen`, employee session or request header. Deny missing/expired/revoked/invalid grants **before querying business D1 tables**; protect issuer from user/employee admin credential reuse.
3. D1 read adapter must enforce both department filtering and per-line authorization and project only the approved fields. For orders containing lines in multiple departments, preserve one `orderId` and distinct `lineId` per qualifying line; never expand access to service/press or new departments automatically.
4. Route registration and real credential flow remain **not implemented**; no existing 02CR human employee exchange should be relabeled as service authentication.
5. On Ubuntu, implement an independent explicitly invoked outbound-only HTTPS client after the API gate is qualified. Hard-code the verified API host, TLS validation, disallow redirects, one-shot read, size/time limits, redacted audit output, and no local customer or order file writes. Do not run the current `run.py` with defaults (`pollScreens` currently also include service/press).
6. All auth edge cases, denied scopes, cross-department mixed lines, extra fields, partial pages and revocation must pass synthetic tests before separate consent for first production canary.

## Existing Cloudflare services: reuse before adding

Existing observed inventory (owner screenshot): `trendos-d1-api` (order/auth backend); `trendos` and `trendos-ui` (distinct services); `autonomous-printshop-dashboard`, `autonomous-printshop-shadow`, `autonomous-printshop-observer` and `autonomous-printshop-employee-supervisor`. No new Cloudflare worker is requested. Their exact deployed interfaces and permissions must be individually verified, not inferred from names.

The current `trendos-d1-api` Cloudflare Production version prefix `2b40f622` was recorded as Ready/100% in the owner's screenshot, but is not cryptographically tied to GitHub commits. Neither PR #151 nor the stacked review branches constitute a deployment.

`SERVICE_PRINCIPAL_PROVISIONED=NO`; `BACKEND_AUTH_VERIFIER_IMPLEMENTED=NO`; `D1_READ=NO`; `PRODUCTION_DEPLOY=NO`; `UBUNTU_CONNECTED=NO`; `EXECUTION_AUTHORITY=NO`.
