# RP-03E Press Consumer / Provider Contract

> Date: **2026-09-01**  
> Mode: **READ-ONLY**  
> Production: Apps Script Version **145**, master+HEALTH ON only  
> Result: **PASS — `واجهة المكبس` is not an authoritative production queue**

## Safety boundary

No Apps Script source, Google Sheet, deployment, Script Property, trigger, route, registry, or feature flag was changed.

The current cloud-browser Google session had expired to the account chooser. No login method was selected and no credentials were requested. Therefore this checkpoint does not claim a new editor read; it uses the already verified live consolidated source capture plus exact current `main` frontend blobs.

## Backend evidence

Previously verified consolidated live-source capture:

- file: `Code.gs`
- blob: `22ecc41f66c5921a4adc7472f76c55152ef37769`
- size: 13,959 lines in the recorded source capture
- later Version-145 changes were limited to guarded Integrity route/webhook wiring; PRESS remained OFF.

Call chain:

1. `trendosV1932TryRoute_` routes action `pressControlV1` to `pressControlV1_` — `Code.gs:11835-11873`.
2. `pressControlV1_` uses `pressStatus_`.
3. `pressStatus_` uses `pressQueue_`.
4. `pressQueue_` reads `SHEET_NAME_LINES` / `بنود الأوردرات` directly — `Code.gs:12003-12013`.
5. None of `pressQueue_`, `pressStatus_`, or `pressControlV1_` reads or writes `واجهة المكبس`.

The backend route is therefore source-queue based, not legacy-view based.

## Frontend evidence

Current `main` frontend:

- `index.html` blob `c77422f1a33c46004006954bf1d609849942c4f8`;
- `app.js` blob `73c9c31e57ae3e9134313f85e0f3006b36532a68`;
- `index.html` on the working branch has the same blob as `main`.

The production entry document loads only:

- `config.js` — `index.html:1309`;
- `app.js` — `index.html:1310`;
- `matbagy_theme_v1860.js` — `index.html:1311`.

It does not load `press-control-v1.js`.

Additional consumer facts:

- `app.js:19-20` maps the legacy `press` permission to the Print screen.
- Heat Press is represented as an Order/Line filter and badge in `app.js`.
- `app.js` contains no `pressControlV1`, `press-control-v1.js`, `واجهة المكبس`, or `متابعة المكبس` consumer.
- standalone `press-control-v1.js` exists in the repository, but it is not loaded by the production entry document and is therefore not a production consumer.

## Decision

1. `واجهة المكبس` is a non-authoritative legacy/stub sheet.
2. Do not refresh, populate, reconcile, or backfill it.
3. Do not define a provider that copies the source queue merely to force metric PASS.
4. The production operational queue remains derived from `بنود الأوردرات`.
5. The RP-03 adapter preview recovered the exact nine current Press Lines from that source.
6. The existing remediation Dashboard behavior is correct:
   - no proven authoritative provider => WARN;
   - never fabricated PASS;
   - no `PRESS_SOURCE_VIEW_MISMATCH` CORE-P0 failure against the legacy sheet.
7. The 14 completed-without-Line-session records are historical/schema evidence because Press Integrity has never been activated and the Line-session ledger does not exist. A later baseline acknowledgement may use only the exact RP-03 hashes; no Session ID may be invented.

## Code impact

No new code change is required for this decision. The current remediation source already emits a non-authoritative Press-view WARN and keeps unresolved completed-without-session Lines fail-closed until exact registry evidence exists.

## Result

- Backend consumer chain: **PASS identified**
- Frontend consumer chain: **PASS identified**
- Legacy view authority: **FALSE**
- Required view repair/write: **NONE**
- Source change required: **NONE**
- Production impact: **READ-ONLY / NONE**
- Next: freeze a separately reviewed successor candidate, then perform controlled Head composition with flags unchanged. Registry, deployment, and ORDER_LINE activation remain separately gated.
