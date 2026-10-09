# AP-085 — Owner Console perimeter remediation (REVIEW ONLY; NOT APPLIED)

Date: 2026-10-09. Repository: `fawakhry/TrendOs`.
Branch: `review/ap083-failclosed-ci-staging-gates-20261008`.
Change authority: source and documentation ONLY. **No Production or Cloudflare settings change is authorized** by this runbook.

## Security incident / evidence

- Historical authenticated-free GET evidence on 2026-10-08: the Production Dashboard default `workers.dev` origin returned owner `/state` data. No operational payload or PII is copied here.
- Source evidence: `autonomous-printshop/dashboard/wrangler.toml` sets `workers_dev = true`. `dashboard/worker.mjs` checks neither identity nor an Access JWT for its GET state/HTML routes.
- Route inventory from Worker source: `/`, `/dashboard`, `/owner`, `/manager-center`, `/state`, `/api/state` are **PRIVATE**. `/health` emits system metadata only and may be kept public by a separately reviewed exception; safest first scope is ALL traffic until inspected.
- On 2026-10-09, a metadata-only no-credentials HTTPS probe could not complete from the execution environment (connection/network error). **Do not interpret this as successful access denial**. Historical exposure remains the actionable evidence.
- Cloudflare account Access applications, rules, custom routes, preview/version URLs, or an independently isolated Staging Worker have not been inspected. Cloudflare browser profiles found in this session had no saved Cloudflare sign-in.
- `OWNER_CONSOLE_ACCESS_GATE=FAILED/REMEDIATION_NOT_APPLIED`; do not assert Production is secure before an authenticated and anonymous check.

## Preferred perimeter remediation — requires owner express approval

Official Cloudflare Workers Access documentation (updated 2026-08-18) supports **Worker-level Access** for a single Worker across all domains, including `workers.dev`, custom domains, routes, and previews. Prefer this Worker-wide coverage over a hostname-only self-hosted Access app, because a second hostname may bypass a narrow rule.

1. **Read-only inventory first** using authorized Cloudflare account access: exact Worker ID, current domains/routes (including `workers.dev`, preview/version URLs), Access app/policy destinations, any bypass rules, service tokens and deployment workflow dependencies; record config hash and rollback state without copying secrets.
2. Ensure an approved owner sign-in identity is enrolled and tested for the intended Access policy. Do not select allow-everyone, bypass, or public service token exceptions. Confirm emergency recovery path.
3. Review GitHub workflow deployment/health dependencies. Existing Production dashboard workflow performs unauthenticated `GET /state`; after perimeter protection it may fail. Migrate that health probe to a non-sensitive public health endpoint **only after code/procedure review**, or have it use securely stored service-auth credentials. Do not put a service token in the repo, job logs, URL, or chat. This dependency is a mandatory change-order gate.
4. **Approval point (Production mutation):** explicitly request owner permission for the exact Cloudflare Worker-level policy and blast radius. After approval, select Workers & Pages > `autonomous-printshop-dashboard` > Access > Protect this Worker behind Access > **All traffic** > restricted owner-only policy. Carefully verify the exact Worker target before saving.
5. Independent, fresh, logged-out browser/HTTP metadata-only GET verification for all six private URLs on the default `workers.dev` origin, every custom domain, and applicable preview/version routes: **401/403 or a legitimate Cloudflare Access login redirect**; *not* 200/JSON/owner HTML. Never follow redirects or capture response bodies. Check a known approved owner identity separately and ensure the Dashboard still loads.
6. If verification fails, keep `ACCESS_GATE=FAILED`, revert only the just-authorized change according to recorded rollback plan, or immediately tighten the incomplete perimeter under a new approval. Never claim protection on the basis of a custom domain alone.

Official references:
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- https://developers.cloudflare.com/changelog/post/2026-08-14-workers-access/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/

## Defense in depth / source-level future gate

- Cloudflare's documentation says that an origin Worker consuming `Cf-Access-Jwt-Assertion` must validate the cryptographic signature, `iss`, `aud`, expiration and key rotation. Presence of the header, CORS, or a user-controlled email claim is NOT authentication.
- Consider a separately reviewed source-level JWT verifier and owner allowlist after Access AUD and team domain are securely qualified. Do not import an incomplete identity guard or break the Production UI speculatively.
- Maintain Cloudflare edge Access even when application-level JWT validation is added. Avoid redirect loops and service-binding identity confusion.
- Define whether `/health` is exposed and what metadata it may reveal. It is currently informational and not an authority proof.

## Staging and smoke update

- The existing opt-in `staging_owner_console_access_smoke_v1.mjs` now probes **six** GET routes: `/`, `/dashboard`, `/owner`, `/manager-center`, `/state`, `/api/state`. No body logging, no redirects followed, no credentials, and no implicit URL.
- This is a **source-only** improvement. Syntax-only CI does not validate a real Cloudflare policy. The probe MUST NOT run until a dedicated isolated Staging origin is independently qualified for non-Production bindings and secure access.
- The hostname regex is a useful accidental Production guard, not proof of Staging isolation; confirm the actual Worker ID, account, D1, service bindings, KV/DO bindings, secrets and environment identity separately.

## Project gates and storage comparison

- **MC-02/MC-23 = PARTIAL**. AP-083 code is a KV-like unbound adapter with fake-store tests, not an active namespace; KV eventual consistency may return older records but its read validator enforces `generatedAt + 5min` and strict forbidden fields. KV is a pragmatic low-coordination candidate for diagnostic-only, fail-closed displays **if** bounded staleness and lower operational cost are accepted.
- A Durable Object could serialize refresh/read state for stronger monotonic coordination, with different lifecycle/billing and a single-location dependency. The reported local DO draft `0cec057c` / `d1163638` was not found on remote; do not approve or claim performance/cost/consistency equivalence without the actual source and Cloudflare Staging evidence.
- **Storage selection remains BLOCKED, not a deployment approval**. Neither resource nor scheduler nor flag is created or enabled.
- One real order preparation is limited to evidence collection: same **order line** with approved/hash-qualified DESIGN artifact, authoritative MATERIAL linkage with qualified cloud accounting source, and observed/registered MACHINE identity; then separately verified operator availability and explicit supervised CANARY permission. No task assignment or protected/finance decision may be inferred from diagnostic counts.

## Release-state invariants

`Autonomy=SHADOW`; `Readiness=SHADOW`; `Operator Task=OFF`; `Accounting=READONLY (last documented epoch 39)`.
`Production policy modified=NO`; `Staging cloud test=NOT_RUN`; `Owner Console Access verified secured=NO`.
