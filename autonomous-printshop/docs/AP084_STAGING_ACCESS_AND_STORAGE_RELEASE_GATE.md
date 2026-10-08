# AP-084 — Staging security / cache release gate (SOURCE_ONLY, NO DEPLOYMENT)

Date: 2026-10-08. Branch: `review/ap083-failclosed-ci-staging-gates-20261008`.
This checkpoint adds source hardening and tests to AP-083. It does not promote AP-083, enable autonomy, create Cloudflare resources, change finance authority, or alter Production.

## 1. Source-of-truth and status

- Baseline: AP-083 draft PR #34, with an unbound **KV-like** storage adapter and fake-store tests. It is not a Durable Object implementation.
- Separately reported local branch `codex/ap-mc02-mc23-20261008` (commits `0cec057c`, `d1163638`) is **not on remote GitHub**. Its DO draft, 65 local checks and credentials cannot be inspected/assumed.
- Resolve KV versus DO only after a diff and a documented decision. KV has eventual consistency; a DO provides actor-local serialization but has different lifecycle/permissions/cost. Neither option is approved for activation by this change.
- `MC-02` and `MC-23`: **PARTIAL**. No independent two-isolate Cloudflare staging evidence.
- Operator Task stays OFF, Autonomy/Readiness SHADOW, Accounting READONLY. Strict Design + Material + Machine evidence is still a separate qualification gate.

## 2. Owner console access is a mandatory gate

The current Dashboard Worker source has GET `/state` and `/api/state` routes that return owner exception details without an in-Worker identity check. Its `wrangler.toml` includes `workers_dev = true`. The current Production deploy workflow also issues unauthenticated `curl` to `/state`. **Confirmed exposure:** an external unauthenticated GET on 2026-10-08 returned successful Owner Dashboard V1.7 health JSON and a successful live `CONTROL_TOWER_SHADOW` `/state` JSON payload from the default Worker origin. The Cloudflare Access configuration itself remains unreadable, but the effective default-host access gate has **FAILED**. No private business values are copied into this book.

Before enabling any new Staging Dashboard route or merging a security-sensitive runtime change:

1. Inspect actual Cloudflare Access applications, policies, DNS routes, Worker custom domains and the raw `workers.dev` hostname. Do not assume that a protected vanity domain protects the default Worker hostname.
2. Restrict the complete console origin including `/owner`, `/manager-center`, `/state`, `/api/state`. Use verified Cloudflare Access / equivalent gateway policy, not just CORS, obscured URLs or an unverified JWT header.
3. Prove unauthenticated requests receive **401/403** or an authenticated Access login redirect; no owner JSON or console HTML in the response. Then test permitted identities separately without recording credentials or PII.
4. Run the opt-in, **GET-only** `node autonomous-printshop/tests/staging_owner_console_access_smoke_v1.mjs` with `AUTONOMOUS_PRINTSHOP_STAGING_URL=https://<dedicated-staging-origin>/`. The script refuses the known Production host and requests an explicit staging/preview hostname. No endpoints are inferred by default.
5. If Cloudflare policy cannot be inspected or the unauthenticated test fails, record `ACCESS_GATE=BLOCKED`. Do not deploy a new publicly reachable Staging console.

**IMMEDIATE PRODUCTION OWNER ACTION REQUIRED:** prevent anonymous access on the Worker origin itself, not only on an alternative custom domain. Set an Access policy or disable the raw public Worker route after providing a verified, Access-protected replacement. Verify authorization for all JSON/HTML routes from a logged-out client and ensure the dashboard continues working for the approved owner. This remediation is **not performed here** because this GitHub-only review has no authorized Cloudflare Access configuration channel. Do not publish unprotected Staging.

The external read proved access to current read-only operational aggregates; it does not prove unauthorized business mutation or access to personal records.

## 3. Fail-closed aggregate patch

`control-tower-last-good-v1.mjs` now requires the source row count and four operation/deadline aggregates to be nonnegative safe integers before refreshing its diagnostic cache. Missing, negative, string, noninteger, NaN and infinite counts are rejected. A valid literal zero remains valid. A bad refresh cannot replace a previous qualified snapshot. Shared-cache source tests ensure an invalid snapshot generates no write. Finance and protected authority remain excluded.

The GitHub Actions printshop policy CI now triggers for any `autonomous-printshop/**` change, including docs, tests and future adapters, on both PR and push.

## 4. Required Staging cloud qualification (NOT YET RUN)

- **Isolation:** a dedicated non-Production Worker, dedicated storage, restricted API token, no Production D1/service-binding authority and no finance/PII payload. Provisioning/billing require explicit owner approval.
- **Storage design:** compare local DO source versus AP-083 KV source; approve one model and failure guarantees. Feature/scheduler default OFF; trusted scheduled observer only; public GET never invokes `put`.
- **Security:** pass unauthorized-route smoke and authenticated owner read separately. Confirm direct `workers.dev` cannot bypass the perimeter.
- **Behavior:** fresh -> source outage -> bounded stale diagnostic -> absolute TTL expiration -> unavailable -> recovery. Test two genuine Cloudflare isolates, cross-instance reads, partial subpanel failure, malformed/tampered records, clock reversal and storage errors.
- **No authority escalation:** stale data must never unlock Operator Task, readiness/Design/Material/Machine, finance, accounting, owner decisions or business writes.
- **Evidence:** save environment ID, staging URL (without credentials), exact commit SHA, Worker version, bindings/settings hash, Cloudflare run IDs, request status only, storage write counts, rollback attempt and before/after status.
- **Release:** source CI PASS + isolated staging PASS + reviewed perimeter + protected permissions + explicit deployment approval. Otherwise remain SOURCE_ONLY, `MC-02/MC-23=PARTIAL`.

## 5. Current explicit decisions

- `PRODUCTION_ANONYMOUS_OWNER_STATE_ACCESS=CONFIRMED`; `ACCESS_GATE=FAILED` and requires immediate authorized Cloudflare remediation.
- `STAGING_DEPLOYED=NO`; `STAGING_CLOUD_TEST=NOT_RUN`; `NEW_CLOUDFLARE_RESOURCE=NO`.
- `STORAGE_BACKEND_DECISION=DEFERRED_PENDING_LOCAL_DO_SOURCE`.
- `PRODUCTION_MUTATED=NO`; `OPERATOR_TASK=OFF`; `FINANCE_AUTHORITY=UNCHANGED`.
- This is a *stacked review branch* on AP-083, not a merge to the auto-deploy baseline.
