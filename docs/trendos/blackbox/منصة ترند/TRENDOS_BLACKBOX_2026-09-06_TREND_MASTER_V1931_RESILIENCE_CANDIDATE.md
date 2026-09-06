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

## Security / authority boundary

Unchanged:

- Google Sheets / Apps Script remain authoritative.
- No operational data was changed for testing.
- No customer names, phone numbers, notes, or WhatsApp message text are written to GitHub logs.
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

## CI evidence

Pending immediately after candidate commit. This record must be updated with exact GitHub Actions run IDs/results before closing the checkpoint.

## Exact stop point

`TREND MASTER V1931 RESILIENCE CANDIDATE PREPARED — LOCAL TEST PASS — APPS SCRIPT DEPLOYMENT NOT AUTHORIZED / NOT PERFORMED`

Next safe action after CI PASS: request explicit user approval before any Apps Script production deployment of the new panel route/backend. Until that approval, production keeps the currently published monolithic Apps Script behavior.
