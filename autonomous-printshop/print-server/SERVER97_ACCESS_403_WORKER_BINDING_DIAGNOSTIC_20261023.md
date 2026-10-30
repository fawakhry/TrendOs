# SERVER-97 — Cloudflare Access HTTP 403 immutable Worker identity diagnosis

**Date:** 2026-10-23 Cairo. **Target:** PR #190, branch `release/server68-staging-qualification-20261016`. Source-only + Cloudflare GET-only qualification. **NO production/Ubuntu/Cloudflare mutation.**

## Verified baseline — do not repeat
- Owner's Ubuntu observed: anonymous GET stage returned HTTP 302 and Access redirect; Service Token GET returned HTTP 403 text/plain; after secret rotation still 403; stage Worker invocations observed 0, service token Last Seen `Not Seen Yet`. These observations are **not** conclusive about which layer returned 403.
- SERVER-95 stage_access_probe.py uses exact `CF-Access-Client-Id` and `CF-Access-Client-Secret` headers, exact isolated workers.dev origin, no redirect, one GET root, and never imports the existing **production-pinned** SERVER-34 reader. Its seven offline tests passed; do not rerun on Ubuntu.
- SERVER-96 GitHub Actions `39993574530` completed SUCCESS at `b496dd9`: exact Access app `TrendOS isolated stage - DENY ALL - S87` uses default **two headers**; Service Auth include references exact selected token UUID; no Require/Exclude; application has one Worker destination. This did **not** compare the destination's immutable `worker_id` with the live intended stage Worker.
- Owner has **Workers.dev Production URL ON, Preview OFF** for the separate stage Worker. The repo's source-only `wrangler.server68-isolated-stage.toml` says `workers_dev = false` and is not proof of currently deployed Worker settings or code.
- `Strict service token authentication=Off` and `Workers Observability=Disabled` were observed by the owner. Neither alone explains 403. **Never** disable Access or enable Bypass.

## Updated official Cloudflare evidence
- Access policy execution: **Service Auth is evaluated before Block and Allow**; a catch-all Block Everyone policy does not by itself preempt a matching Service Auth policy. https://developers.cloudflare.com/cloudflare-one/access-controls/policies/
- Service Token authenticates via `CF-Access-Client-Id` and `CF-Access-Client-Secret`; these are Access-edge credentials, not business API Bearer credentials. https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/
- 2026-10-02 strict Service Token setting: when ON, recognized failures produce 401/403 and are recorded; unknown Client IDs/malformed headers are **not** logged, while recognized failed tokens can be. With OFF, `Last Seen` and login logs absence do not prove headers were missing. https://developers.cloudflare.com/changelog/post/2026-10-02-strict-service-token-authentication/
- Worker-level Access runs **before** Worker invocation, so zero Worker invocations is consistent with edge denial, but not an authoritative attribution. https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- Access authentication log REST GET covers **identity** login events; non-identity machine/service authentication logs require **GraphQL Analytics API**, per Cloudflare documentation. Do not claim the REST endpoint or dashboard proves no service-token failures. https://developers.cloudflare.com/cloudflare-one/insights/logs/dashboard-logs/access-authentication-logs/

## Missing binding proof and implemented SERVER-97
- GitHub source implementation: `tools/server97_access_worker_binding_audit.py`. It reads only account-scoped Cloudflare GET endpoints:
  - `/access/apps/<exact-stage-app-id>`;
  - `/workers/workers/trendos-server68-isolated-stage`: exact named Worker GET, to match its **immutable Worker ID** against `destinations[0].worker_id` with no account-wide Worker enumeration.
- Fail closed for mismatch, missing/ambiguous destination, unexpected public path overrides, missing Worker, malformed data, unauthorized read; print only constant status codes, never API response bodies, secret credentials, worker IDs or customer information.
- Worker metadata list requires `Workers Metadata Read Only` or a qualifying Workers read permission; existing `CLOUDFLARE_ACCESS_API_TOKEN` was only confirmed for Access app/policy read. **Do not expand token permissions automatically.** A permissions failure means `UNVERIFIED`, not a product defect or real auth proof.
- `tests/test_server97_access_worker_binding_audit.py`: synthetic opener, no Cloudflare requests, exact ID success, mismatch/unsafe policy rejection, denied scope, invalid input, missing/duplicate worker.
- `.github/workflows/server97-stage-worker-binding-readonly.yml`: new tests first with credentials empty, then GET-only metadata audit using existing secret **without printing it**. Never touches Worker HTTP endpoint or D1. Existing SERVER-68 preflight may auto-trigger on branch push but SERVER-97 does **not** request running SERVER-95 again.

## Decision gates and next diagnostic
1. If immutable Worker ID matches: exclude mistaken Worker destination as the current cause, **not** proof that Service Token is accepted. Request a separately bounded live stage-only diagnostic showing only HTTP status, `CF-Ray`, and safe `Content-Type`/Access response marker; do **not** print secret, request headers, cookies, body, full URL query or business data. Avoid retrying unchanged Ubuntu probes merely to repeat a 403.
2. If Worker ID mismatches: stop, record mismatch, correct only after explicit owner review of exact Worker and Access app, with existing Block Everyone policy preserved.
3. If metadata access denied: mark proof `UNVERIFIED_WORKERS_READ_SCOPE`; evaluate owner-approved least-privilege, non-prod Worker-metadata-read identity or dashboard confirmation. Do not rotate Service Token.
4. To attribute 403 beyond response metadata: use correlated `CF-Ray` and access logs for non-identity requests via supported GraphQL account Analytics permissions when available; distinguish Access from WAF/edge and Worker-origin 403 before any application code change.
5. Remain on stage synthetic-only. **No production orders, D1 production, printer/laser automation, deploy, Access bypass, token rotation or approval inference.** D01–D06 / release GO gates remain intact.

`SERVER97_SOURCE_AUDIT=CREATED`; `SERVER97_CI_RESULT=PENDING_AS_OF_INITIAL_RECORD`; `CLOUDFLARE_MUTATIONS=NO`; `PRODUCTION_TOUCHED=NO`; `REAL_UBUNTU_ACCESS_PROVEN=NO`.


## Observed GitHub Actions evidence — after initial record

**Run:** https://github.com/fawakhry/TrendOs/actions/runs/39995584666

- New fake-only `fake-contract` job: **SUCCESS**, `Ran 7 tests`, all OK.
- New `cloudflare-readonly-config` job: **FAIL CLOSED**, precise sanitized diagnosis `SERVER97_WORKERS_METADATA_READ_SCOPE_UNAVAILABLE`. Existing GitHub Cloudflare audit API credential could read Access app metadata (SERVER-96) but does **not** have the independent Worker metadata read permission. No Cloudflare write and no Worker request occurred.
- This result is a **permission gap in the diagnostic reader**, *not* a proven Access service-token failure, wrong Worker binding, broken deployment, or production event.
- Owner approval is required before any expanded credential or live infrastructure change. Do not rerun the same CI credential read unchanged and expect different evidence.

`SERVER97_CI_OFFLINE=PASS_7_7`; `SERVER97_CF_READONLY_BINDING=UNVERIFIED_PERMISSION_DENIED`; `SERVER97_BRANCH_DOCUMENTED=YES`; `REAL_STAGE_ACCESS_RESULT=STILL_403_LAST_OWNER_EVIDENCE`.

## Read-scope reduction — subsequent source improvement

- Switched from the Worker-list GET to **one exact stage Worker GET** using the official Cloudflare `GET /accounts/{account_id}/workers/workers/{worker_id}` API (the path accepts Worker name or ID). The endpoint returns the immutable Worker ID. Existing audited authorization still lacks Worker metadata scope; no additional rights were granted. https://developers.cloudflare.com/api/resources/workers/subresources/beta/subresources/workers/methods/get/
- Corresponding fake-only tests and dedicated workflow updated to prove the same matching invariant while never enumerating unrelated/production Workers. A CI result remains necessary for the updated version; no claim of live approval from source changes.

## Final SERVER-97 scoped proof (exact Worker GET)

- [Actions run 39996393864](https://github.com/fawakhry/TrendOs/actions/runs/39996393864) after direct exact-Worker GET revision: **7/7 synthetic tests PASS**.
- Real configuration-read attempt: **fail-closed** `SERVER97_WORKERS_METADATA_READ_SCOPE_UNAVAILABLE` (`Access app GET` permitted; `Worker exact GET` not authorized). Not evidence of a staging service-token failure or misbinding.
- Only next missing authorization: *individual stage Worker metadata read only* or an equivalent owner UI read-only proof. Existing CI credential must not be broadened automatically. Do not rerun a denied request with unchanged permissions.
- Keep `HTTP_403_ROOT_CAUSE=UNRESOLVED`, `REAL_CLOUD_ACCESS_AUTH=NOT_PROVEN`, `WORKER_D1_MUTATIONS=0`, `PRODUCTION_TOUCHED=NO`.

## Owner screenshot: Cloudflare Access incident narrowed (2026-10-23, 21:17 Cairo)

- The owner opened Cloudflare's **official** incident detail at `https://www.cloudflarestatus.com/incidents/t0p23w62n13j` (read-only; no settings changed).
- **Access Availability Issues**: incident **started October 23, 2026 at 12:01 PM GMT+3**, **identified 12:12**, **monitoring 12:15**, and **resolved 12:22 PM GMT+3**.
- The stated initial issue specifically referred to Cloudflare Access **when using Microsoft Entra ID**; the bulletin does **not** state that Access Service Token credentials were impacted.
- Therefore this incident **cannot be used as evidence for the SERVER-95 Ubuntu machine-token HTTP 403**, and re-running the identical probe just because the incident resolved is not justified.
- `CF_ACCESS_INCIDENT=RESOLVED_ENTRA_ID_SCOPED_NOTICE`; `SERVICE_TOKEN_INCIDENT_CAUSATION=NOT_ESTABLISHED`; `ACCESS_POLICY_CHANGED=NO`; `UBUNTU_OR_PRODUCTION_TOUCHED=NO`.

## OWNER-UI reconciliation — stage destination, policy precedence and Service Auth failure (2026-10-23, 21:26 Cairo)

- The owner navigated Cloudflare Worker `trendos-server68-isolated-stage` → **Access** and opened the linked application `TrendOS isolated stage - DENY ALL - S87`. Worker All traffic is protected, with both Block Everyone and `TrendOS Ubuntu Stage - Service Auth` displayed.
- In the **actual Access application Destinations editor**, Worker Scope is `trendos-server68-isolated-stage`, Type `A Worker's production and preview URLs`. The Access Applications list independently displays the same Worker destination. The Preview widget's `No destinations assigned` text does **not** disprove this configured destination.
- GUI name match resolves the concern that **no stage Worker destination is assigned**, but **immutable UUID equality** is still `UNVERIFIED` because the existing read-only audit credential cannot read exact Workers metadata. No new API permissions should be granted merely to repeat the UI-proven name binding.
- Cloudflare says Service Auth is evaluated before Block. So policy list order is **not** an identified cause of 403.
- Under `Additional settings → Service Auth failure`, `Return 401 Response` is **OFF**; owner left via **Cancel** without saving. This response-mode choice is not itself evidence of the HTTP403 root cause.
- User API-token summary `TrendOS Access Stage` shows **Access: Apps and Policies: Edit**, no Workers metadata read, expiry 2026-10-30. Dashboard token name is **not cryptographic proof** it is the exact token bound in GitHub Actions. No Client Secret was displayed, copied or rotated.
- The owner supplied 28 UI checkpoints in conversation; canonical roll-up: `autonomous-printshop/MASTER_BOOK.md` SERVER-20261023-99; line-by-line history: `autonomous-printshop/print-server/UBUNTU_SERVER_BOOK.md` SERVER-20261023-99. Original screenshot files remain in conversation, not GitHub.
- **Next evidence:** non-identity machine-auth rejection logs or a protected stage-only CF-Ray correlation when safely available; never Access Bypass, policies/Secret changes, real orders or printer/laser. `HTTP403_ROOT_CAUSE=UNRESOLVED`, `REAL_UBUNTU_ACCESS=NOT_VERIFIED`, `OWNER_CLOUDFLARE_EDIT_SAVED=NO_EVIDENCE`, `PR190=DRAFT`.
