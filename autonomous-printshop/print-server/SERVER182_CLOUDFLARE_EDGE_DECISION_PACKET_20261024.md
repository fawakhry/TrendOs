# SERVER-182 — Cloudflare Access / Worker Edge HTTP 403 decision packet

**Status:** SUBMITTED by owner 2026-10-24 ~01:13 Cairo; Cloudflare case **#02394197**; awaiting support response  
**Prepared:** 2026-10-24 (Africa/Cairo)  
**Evidence mode:** Existing screenshots and GitHub source only. **No new live Worker/GraphQL requests.**  
**Tracking:** `SERVER139_UBUNTU_SANDBOX_PINNED_20261023.md` records SERVER-162 to SERVER-181.  
**Repository:** `fawakhry/TrendOs`  
**Branch:** `release/server68-staging-qualification-20261016`  
**PR:** [#190](https://github.com/fawakhry/TrendOs/pull/190) — OPEN/DRAFT; do not merge.

## A. Minimal support case (copy/paste; never include service credentials)

**Suggested subject:** Cloudflare Access-protected workers.dev isolated Worker returns 403 before verified Access authentication; please identify edge decision for exact Ray

**Product/category:** Cloudflare Workers + Cloudflare Zero Trust Access / Service Auth

> We own an isolated test Worker `trendos-server68-isolated-stage` at
> `https://trendos-server68-isolated-stage.trendmall-contact.workers.dev/`.
> Cloudflare's UI identifies an Access-protected Worker destination:
> application `TrendOS isolated stage - DENY ALL - S87`, app UUID
> `28859297-b80f-47a7-98ed-78e00efc3204`.
>
> One interactive Ubuntu diagnostic sent exactly one HTTPS `GET /` to this
> hostname, including `CF-Access-Client-Id` and `CF-Access-Client-Secret`
> from masked prompts (values intentionally NOT supplied). It did not use
> cookies, redirect-following, a proxy, any data endpoint or another Worker.
>
> Approximate incident time **2026-10-23 21:57 UTC** (2026-10-24 00:57
> Africa/Cairo), **CF-Ray `a4f3feba8f550b96-MRS`** (base Ray
> `a4f3feba8f550b96`), response **HTTP 403** with
> **Content-Type: text/html**, and **CF-Mitigated: challenge not detected**.
> The diagnostic intentionally never read the response body, so no page
> branding/fingerprint or inner error code can be asserted.
>
> We verified in the UI that the named stage Service Token is Enabled and
> associated with policy `TrendOS Ubuntu Stage - Service Auth` and the
> isolated Access app. The app also has a protective `Everyone` Block
> policy that we will NOT disable, bypass or reorder to troubleshoot. We
> performed a LOCAL equality comparison of an owner-provided prior stage
> Client ID and current token Client ID; the strings matched, but this is
> NOT server-side proof of correct credentials or successful Access login.
> The owner rotated the Client Secret previously and saved the replacement,
> but its acceptance by Cloudflare remains unproven.
>
> Prior Cloudflare Access GraphQL Analytics was successfully queried
> read-only for an **older** request (~2026-10-23 21:11 UTC; different Ray)
> in the 21:00–21:20 UTC window: GraphQL HTTP 200, no GraphQL errors, zero
> matching groups. We do NOT attribute this empty result to the newer
> 21:57 UTC request. Earlier Worker Metrics showed zero invocations in the
> older incident period; we do NOT claim current Worker invocation counts.
>
> **Please correlate the EXACT newer Ray and timestamp using internal edge
> and Access decision information**, and answer:
>
> 1. Did this request reach the intended Worker-level Access application?
>    If yes, what was the Service Auth matching/authentication outcome, and
>    which policy (if any) made the deny/allow decision?
> 2. If Access did not deny it, **which Cloudflare layer produced 403**
>    (pre-routing edge validation, security/WAF enforcement, worker-level
>    protection/routing, or other)? Is the workers.dev production route
>    active and is the expected Access application the one actually applied?
> 3. Does the lack of a customer-visible Access authentication event for
>    earlier staged attempts have any relevance to this newer Ray? Please
>    distinguish unavailable/sampled logs from a confirmed Access decision.
> 4. What **read-only, smallest-scope confirmation** would distinguish the
>    competing causes before any Access or Worker configuration changes?
>
> We require fail-closed policies to remain enabled. Please do not request
> Client ID, Client Secret or API token values in the ticket, and do not
> apply policy/routing changes or deploy code on our behalf.

## B. Internal evidence ledger — verified versus NOT proven

| Evidence | Observation | Interpretation / limitation |
| --- | --- | --- |
| Isolated stage URL | Worker production `workers.dev` URL present in Cloudflare dashboard and Access notice attached (SERVER-165) | Listed destination is confirmed; a particular edge execution for the failed request is not proven. |
| Stage Worker Access | `All traffic` Access protected; Service Auth + Block Everyone visible (SERVER-166) | Correctly configured at a UI summary level; **effective decision for given Ray unknown**. |
| Service Token | Token Enabled, associated app/policy; original secret lost; new secret rotated/saved (SERVER-163/169) | NOT proof of valid Client ID+Secret pair at Cloudflare edge. |
| Local Client ID equality | Masked `CLIENT_ID_MATCH=YES` (SERVER-178) | Two owner-entered ID strings equal; historical transport/secret authentication not proven. |
| Latest stage attempt | `server108_stage_edge_diagnostic.py`: `status=403`, `text/html`, one GET, no `cfMitigated` challenge (SERVER-180) | Captured HTTP response; **script hardcodes `accessAuthenticatedProven=false`**. |
| Latest diagnostic Ray | `a4f3feba8f550b96-MRS` around 21:57 UTC Oct 23 | Correlation key for THIS attempt only. May be nonunique in some contexts; include time/hostname. |
| Earlier GraphQL read | SERVER-176 `SERVER170_NO_EVENT_UNPROVEN`, HTTP200, no errors, 0 events, **21:00–21:20Z** | Older 21:11Z request only; **NOT evidence about 21:57Z**. |
| Earlier Worker runtime Metrics | 0 invocations in previous incident-covering window (SERVER-168) | Supports pre-Worker hypothesis for older event only, not attribution or newer event. |
| Worker response body | Intentionally never captured | Cannot determine branded/unstyled 403, login form, early edge code or Worker-generated content. |
| Production / orders | No production Worker, D1, order/customer, printer/laser actions in stage diagnostic | No live data cutover demonstrated; positive end-to-end TrendOS connectivity remains unproven. |

## C. Source-reviewed network behavior

At verified Ubuntu sandbox commit `9ba166517ca48a5753cb932903ee9770be141282`:

- `src/server108_stage_edge_diagnostic.py` requires three explicit CLI gates and local masked interactive prompts. The `stageProbeReturned=true` / process exit 0 represents a **captured transport status**, NOT Access admission.
- `src/stage_access_probe.py` hard-pins `GET https://trendos-server68-isolated-stage.trendmall-contact.workers.dev/`, canonical `CF-Access-Client-Id`/`CF-Access-Client-Secret` HTTP headers, 5-second timeout, default TLS verification, no proxy, no redirects, no response-body read.
- It validates credentials only by **format** (nonempty expected character sets), not issuer validity. No worker execution, data reads, Access login or production service is proven.
- Historical comments in source claiming workers.dev OFF are older than SERVER-165 Cloudflare UI observations; do not treat historical comments as current network configuration.

## D. Decision routing AFTER provider's response (no blind repeats)

| Provider-confirmed fact | Controlled follow-up |
| --- | --- |
| Access rejected a recognized service-token attempt | With owner approval, assess only the exact token/application/policy binding and validity metadata; do not rotate by default; never share secrets. |
| Access did not match the request to intended app | Diagnose Access destination hierarchy / hostname-worker association read-only; propose config changes only with owner sign-off and rollback. |
| Edge validation / WAF / routing returned 403 | Identify exact service/rule/reason before considering scoped fix. Do not weaken catch-all Access Block. |
| Request reached Worker and Worker returned 403 | Need explicit Worker invocation evidence (not inferred from HTTP status) and a source-to-deployment comparison before source debugging. |
| No accessible decision/log entry | Keep root cause `UNRESOLVED`; record vendor limitation and ask for minimum additional evidence or escalation channel. Missing sampled logs is inconclusive. |

**Never do these as substitutes:** repeat `SERVER-108` blindly, replay the *old* SERVER-170 hardcoded GraphQL window for the newer request, rerotate service token, disable Access, reorder Block, deploy prod/Worker or query orders.

## E. Vendor escalation routes (availability depends on Cloudflare plan)

- **Paid plan with technical support enabled:** Cloudflare dashboard > Support > Technical Support > Create a Case, with Section A and the exact Ray/time.
- **Free tier / technical ticket unavailable:** official Cloudflare Community / developer Discord for guidance **without copying any credentials** or assuming volunteers can access internal Ray decisions. Do not claim a case was opened.
- **Ray correlation in dashboard:** Cloudflare Security Events can search Rays, but records may be **sampled**, and the zone-level WAF dashboard may not cover a managed `workers.dev` host in the expected way. A negative search is not proof of absence or authorization.

Official references (checked 2026-10-24):
- https://developers.cloudflare.com/support/contacting-cloudflare-support/
- https://developers.cloudflare.com/support/troubleshooting/http-status-codes/4xx-client-error/error-403/
- https://developers.cloudflare.com/fundamentals/reference/cloudflare-ray-id/
- https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- https://developers.cloudflare.com/cloudflare-one/access-controls/policies/
- https://developers.cloudflare.com/waf/analytics/security-events/
- https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-access-login-events/

## F. Submission gate and privacy

**Status update (SERVER-185):** Owner screenshot confirms Cloudflare case **#02394197** was submitted successfully on 2026-10-24 ~01:13 Cairo. No Cloudflare technical diagnosis/reply is yet known. The earlier prepared text and evidence ledger are preserved as a reference; the submission confirmation screenshot alone does **not** verify the complete final case body. Do not store screenshots revealing the current Client ID in GitHub; no credentials are in this packet. Do not run any additional Ubuntu command or Cloudflare test merely because the case was submitted.

`SERVER182_PACKET=PREPARED`; `SERVER185_CLOUDFARE_CASE=02394197`; `SUPPORT_CASE_SUBMITTED=YES_OWNER_SCREENSHOT`; `SUPPORT_REPLY=PENDING`; `NEW_LIVE_REQUESTS=0`; `ACCESS_HTTP403_ROOT_CAUSE=UNRESOLVED`; `PR190=OPEN_DRAFT`; `PRODUCTION_AND_DEVICES_UNTOUCHED=YES`.

## G. Owner email acknowledgment verified — 2026-10-24

Owner-provided Cloudflare acknowledgment email explicitly confirms creation of support case `02394197` and reproduces the full issue description. The 01:15 Cairo case UI screenshot displayed `New` and `Low` with only automated creation in the feed. **There is no substantive engineering reply yet.** This supersedes the earlier uncertainty about whether the complete description was accepted. Full details and safety constraints: `SERVER186_CLOUDFLARE_SUPPORT_CASE_CONFIRMATION_20261024.md`. Keep this dossier as already submitted; await support findings before any new live tests or configuration changes.
