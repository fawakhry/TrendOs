# SERVER-204 — one owner-approved isolated-stage GET with locally stored rotated Secret still HTTP403

**Evidence:** owner Ubuntu terminal screenshot on 2026-10-30; terminal indicates read-only diagnostic completed and returned sanitized JSON. Branch `release/server68-staging-qualification-20261016`; PR #190 remains Open/Draft (verified).
 
## Fresh, distinct incident
- `schema: trendos.server108.edge-marker-stage-only.v1`
- `resultCode: SERVER108_STAGE_TRANSPORT_STATUS_CAPTURED`: transport markers were captured; **not** authentication success.
- `status: 403`
- **`cfRay: a52d02962ab3e1d0-MRS`**
- `utcStarted: 2026-10-30T20:01:07+00:00`
- `utcFinished: 2026-10-30T20:01:07+00:00`
- `contentType: text/html`
- `cfMitigatedChallenge: false`
- `outboundHttpsGets: 1`
- `accessAuthenticatedProven: false`
- `ordersRead: 0`, `workerOrD1Writes: false`, `productionTouched: false`, `printerOrLaserCommands: false`, `stageProbeReturned: true`.
- The Ubuntu command used pinned stage commit `9ba166517ca48a5753cb932903ee9770be141282`, read the Client Secret from owner-reported mode-600 local file, prompted for Client ID hidden. Local capture and use are evidenced, but **actual Cloudflare acceptance, supplied-ID correctness, confirmed rotation dashboard state, and origin of HTTP403 are NOT independently proven**. This is one **new** request with a potentially changed credential pair, distinct from old Oct 23 Ray.
- Existing reviewed stage source: `src/server108_stage_edge_diagnostic.py` and `src/stage_access_probe.py` constrain one GET to exact isolated workers.dev stage, deny redirects/proxies, consume no response body, sanitize output. No right to infer Access rejection or Worker invocation from HTTP403 alone; even Worker intentionally returning 403 is not excluded until correlated log evidence.
- Owner has already spent many hours retrying 403; **NO further blind tests**. Do not rotate again, create a second token, change Service Auth Include/Block Everyone, deploy, change Asterisk/UFW, or merge PR #190.

## Provider case
- Cloudflare case `02394197`. Oct 28 engineer retracted a mistaken second-token hypothesis; considered stale pre-rotation Secret, but that is not yet proven. Post-rotation failure requires vendor exact-Ray explanation.
- Gmail checked 2026-10-30: an automated `Closing soon` notice dated **2026-10-30 13:51Z** warns of case auto-resolution in **one business day** without input; actual case state at vendor portal not verified.
- Created **UNSENT Gmail reply draft** to `reply@cloudflare.com` in the engineer's existing conversation. It contains the *new* sanitized UTC/Ray/HTTP findings, asks whether this request passed Access and whether Worker intentional 403 could be returned, demands exact rule/component and corrective steps, and asks to keep case open. No Secret/Client ID included. Draft Gmail ID `r-6535676904832344638`; conversation `1a182c7d447e0cd8`. Sending requires explicit owner approval.

`SERVER204_ONE_STAGE_GET=HTTP403`; `NEW_RAY=a52d02962ab3e1d0-MRS`; `TIMESTAMP_UTC=2026-10-30T20:01:07Z`; `OUTBOUND_REQUESTS=1`; `CLOUD_ACCESS_AUTH=NOT_PROVEN`; `VENDOR_FOLLOWUP_DRAFT=UNSENT`; `PR190=OPEN_DRAFT`; `PRODUCTION_UNTOUCHED=YES`.
