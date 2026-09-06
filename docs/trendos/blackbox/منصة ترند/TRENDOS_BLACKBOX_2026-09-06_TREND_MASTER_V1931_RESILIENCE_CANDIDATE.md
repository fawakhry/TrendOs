# Trend Master V1931 — Panel Resilience Candidate

Date: 2026-09-06
Scope: Trend Master Center / مركز Trend Master V1931 only
Branch: `agent/go-live-2026-09-01-integrity`

## Incident

Production users can see Trend Master panels remain indefinitely on:

- `جاري التحميل...`
- `جاري الحساب...`
- `جاري التحديث...`

Affected areas include archive, WhatsApp/automation messages, low-stock alerts, employee KPI, summary and day-close preview.

## Root cause confirmed from code

1. `app.js` calls one monolithic `getTrendMasterCenterV1931` request from `loadTrendMasterCenter()`.
2. `getTrendMasterCenterV1931_()` combines line reads, employee KPI, low stock, automation queue, archive, debt control, day close and duplicate audit in one request.
3. The shared secure API wrapper uses a 90-second AbortController timeout.
4. `loadTrendMasterCenter()` has no bounded retry and only updates the global status on failure; existing panel placeholders can therefore remain forever.
5. Production `MATBAGY_SECURE_API_PROXY_URL` is empty, so this path goes directly to Apps Script.

## Decision

Chosen architecture: **Hybrid / compatibility-preserving panelization**.

- Keep `getTrendMasterCenterV1931` unchanged as legacy compatibility fallback.
- Add one read-only panel action: `getTrendMasterPanelV1931`.
- Panels load independently: `summary`, `archive`, `messages`, `stock`, `employee`, `debt`, `dayclose`.
- Frontend intercepts only the legacy Trend Master center read and fans out bounded independent reads.
- No Orders/D1 cutover is introduced.

## Candidate behavior

Frontend candidate adds:

- per-panel loading state,
- per-panel error + explicit retry button,
- max 2 attempts per panel (initial + one retry),
- per-panel AbortController timeouts from 12–18 seconds,
- in-memory last-good cache scoped by user/panel,
- visible stale-data badge with last successful time,
- concurrent request deduplication,
- one in-flight center batch guard to prevent request storms,
- real overall refresh timestamp / partial-failure status,
- auth username/token forwarding unchanged,
- no payload/PII console logging.

Backend candidate is read-only. It deliberately avoids mutation-capable legacy helpers such as:

- `ensureAutomationQueueV1931_()`
- `ensureDebtDeliveryRestrictionsV1931_()`
- `ensureCustomerDebtHeaders_()`

Queue and debt-control panel reads use direct `getSheetByName`/range reads instead.

## Files in candidate

- `trend-master-resilience-v1931.js` — frontend panel isolation/cache/retry/dedup/timeouts/rendering.
- `trend-master-panels-v1931.gs` — read-only Apps Script panel endpoint implementation.
- `v1932-router.gs` — route for `getTrendMasterPanelV1931`.
- `manager-center-v1932.js` — manager modal uses progressive panel API when available.
- `config.js` — loads resilience module and keeps D1 frontend flag OFF.
- `tests/trend_master_resilience_v1931.test.mjs` — regression + safety tests.
- `.github/workflows/trend-master-resilience-v1931-ci.yml` — isolated CI.

No `app.js` or `index.html` rewrite was required; the candidate reuses the existing Trend Master DOM contract and intercepts only the Trend Master legacy read through the already-exposed API wrapper.

## Regression coverage

The test suite proves:

- one panel can succeed while another fails,
- timeout leaves an explicit error/retry state, not an eternal spinner,
- retries are bounded to two attempts,
- retry can recover after failure,
- stale last-good data is marked visibly,
- concurrent duplicate calls are coalesced,
- username/token are preserved on panel calls,
- no demo-data activation,
- D1 frontend read stays OFF,
- new backend file contains no known sheet-mutation helpers.

Local candidate test before commit: **PASS**.

## Candidate commit

`03300ce2d5454e497bc0be6ddc58c2b2ceb75c95`

Message:

`fix: isolate Trend Master V1931 panel loading`

## CI evidence

Exact candidate commit CI:

- Trend Master V1931 Resilience CI
  - Run `34006722152`
  - **SUCCESS**
- TrendOS Integrity V1
  - Run `34006722115`
  - **SUCCESS**

The dedicated CI includes frontend/backend syntax checks plus the resilience regression suite. The Integrity run is on the same candidate code commit.

## Security / authority boundary

Unchanged:

- Google Sheets / Apps Script remain authoritative.
- No operational data was changed for testing.
- No customer names, phone numbers, customer notes, or WhatsApp message text are written to GitHub logs by this checkpoint.
- No D1 frontend cutover.
- No Orders production Worker deployment.
- 02CL remains OFF.
- generic drain remains OFF.
- no secret rotation.
- no `EDGE_SESSION_SECRET` change.

## Deployment state

**NOT DEPLOYED.**

In particular:

- GitHub `.gs` code is only a candidate and does not mean the published Apps Script Web App changed.
- No Apps Script New Version / deployment was performed.
- No production frontend activation was performed.
- Production therefore still uses the currently published monolithic Trend Master Apps Script behavior.
- The working-branch `config.js` candidate is not authority for production `main` and does not constitute a production frontend activation.

## Required deployment order if later approved

Because true panel independence requires the new Apps Script panel route, do not activate/merge the frontend resilience flag into production before the backend route is deployed and validated.

Safe order after explicit approval:

1. deploy only the read-only Apps Script panel backend/router as a new approved Web App version,
2. validate authenticated read-only panel calls against production without operational writes,
3. only then activate/merge the frontend resilience candidate,
4. verify panel isolation, bounded retry, refresh recovery and stale state in production,
5. keep D1 frontend read OFF throughout this Trend Master checkpoint.

## Exact stop point

`TM-V1931 RESILIENCE CANDIDATE — CODE COMMIT 03300ce2 — TREND MASTER CI PASS — TRENDOS INTEGRITY PASS — APPS SCRIPT PRODUCTION DEPLOYMENT NOT AUTHORIZED / NOT PERFORMED`

Next safe action is blocked on explicit user approval for the Apps Script New Version/deployment of the new read-only Trend Master panel route. Until that approval, production remains unchanged.
