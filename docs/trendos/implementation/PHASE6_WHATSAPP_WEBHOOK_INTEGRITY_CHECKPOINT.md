# Phase 6 — WhatsApp / Webhook Integrity Checkpoint

Status: **PREPARED + TESTED ON GITHUB BRANCH / NOT DEPLOYED**

Working branch: `agent/go-live-2026-09-01-integrity`

## Files

- `trendos-whatsapp-integrity-v1.gs`
- `customer-manager-send-integrity-v1.js`
- `tests/trendos_whatsapp_integrity_v1.test.js`
- `tests/customer_manager_send_integrity_v1.test.js`
- `.github/workflows/trendos-integrity-v1.yml`

## Implementation commits

- backend integrity module: `a25824a83526afe09e433d5171467f75690fca09`
- frontend stable send ID shim: `5023a7d1e13fcb5702f96a6346d8852adf8c7de2`
- backend tests: `191e3a69f5201f1a3f32823bbf90dcad2feb0c78`
- frontend tests: `f44c244b58f33493e74cdd70af5257beddeba4d0`
- CI wiring: `cb67bbff17bec267aae690c7dffb108baf3e14df`

GitHub Actions run: `33324339920` — **SUCCESS**.

## Source gap confirmed before implementation

Current Customer Manager outbound send calls Meta first, then writes Sheets/D1. It has no durable `requestId` / `clientRequestId` before `cmMetaSend_()`. Therefore an ambiguous network timeout after Meta acceptance can cause a second customer message if the user retries.

The current inbound webhook also separates Customer Feedback and Customer Manager side effects before a single shared exact-once gate.

## Contracts implemented

### Outbound Customer Manager send

`trendosWhatsAppSendExactOnceV1_()`:

- requires a stable business request ID.
- event key: `WHATSAPP_OUT|<requestId>`.
- binds the request ID to a phone + text fingerprint; reusing the same ID for different content fails closed.
- claims the send in the shared idempotency ledger under ScriptLock before network I/O.
- `COMPLETED` replays the stored result and never calls Meta again.
- `CLAIMED` means the previous send may be in flight or ambiguous; automatic resend is blocked.
- explicit known pre-send / explicit Meta rejection failures become `FAILED` and may retry using the same request ID.
- network/unknown failures stay ambiguous and are not automatically retried.
- Meta success with no Message ID is treated as ambiguous and is not retried automatically.
- if Meta accepted the message but idempotency completion fails, the response explicitly says the send may already have happened and blocks automatic resend.

`trendosCustomerManagerV1_()`:

- intercepts only `op=send`.
- preserves existing risk/admin authorization gates.
- writes the outgoing Customer Manager row once by Meta Message ID.
- updates D1 only after durable Sheets state; D1 failure does not resend WhatsApp.

### Frontend stable request ID

`customer-manager-send-integrity-v1.js`:

- wraps `window.trendosSecureApiV1922` only for `customerManagerV1 / send`.
- creates one `clientRequestId` per intended phone+text send.
- stores the pending request in `sessionStorage`.
- a retry after a thrown network error reuses the exact same request ID.
- a successful response clears the pending request.
- unrelated TrendOS API calls are not modified.

### Incoming Meta webhook

`trendosWhatsAppWebhookV1_()`:

- event key: `WHATSAPP_IN|<Meta Message ID>`.
- uses the shared ScriptLock/idempotency ledger before local webhook side effects.
- a completed Meta Message ID is skipped on delivery retry.
- Customer Feedback handling and Customer Manager message logging run inside the same Meta-message exact-once boundary.
- Customer Manager message logging is additionally protected by Meta Message ID.
- D1 sync is best effort after durable local state.

### Customer Feedback request send

`trendosCustomerFeedbackScanV1_()`:

- reserves the feedback row under ScriptLock before network send.
- deterministic send request: `FEEDBACK_REQUEST|<OrderID>`.
- ambiguous send is marked `غير محسوم - لا تعِد الإرسال تلقائيًا`.
- an existing feedback row blocks another automatic request for the same Order.

## Automated tests passing

Coverage includes:

- missing outbound request ID fails closed before Meta.
- first outbound send calls Meta exactly once.
- replay of the same completed request returns the stored Meta Message ID with no second Meta call.
- same request ID + different text fails closed.
- ambiguous timeout blocks automatic retry.
- explicit Meta rejection can retry with the same stable request ID.
- Customer Manager replay writes one outgoing message row only.
- duplicate inbound webhook delivery executes Customer Feedback + Customer Manager local side effects once.
- frontend success clears the stable request ID.
- frontend network failure retains the stable request ID.
- frontend retry of the same phone+text reuses that exact ID.

## Future controlled production wiring

Do not keep the current production webhook pair:

1. `customerFeedbackWebhookV1_(payload)`
2. `customerManagerWebhookV1_(payload)`

Future controlled router wiring must replace that pair with one call:

`trendosWhatsAppWebhookV1_(payload)`

This ensures one Meta Message ID gates both feedback and Customer Manager side effects.

Future route targets:

- `customerManagerV1` -> `trendosCustomerManagerV1_`
- `customerFeedbackV1` -> `trendosCustomerFeedbackV1_`

Frontend integration target:

- load `customer-manager-send-integrity-v1.js` with the Customer Manager UI that uses `trendosSecureApiV1922`.
- do not wire the older direct-GET Customer Manager UI unless it is updated to send a stable `clientRequestId`; the integrity backend intentionally fails closed without one.

## Production state

No production Apps Script source, Meta configuration, Web App deployment, spreadsheet data, D1 schema, trigger, or live frontend was changed by this checkpoint.

## Phase status

**IMPLEMENTED ON WORKING BRANCH + AUTOMATED TESTS PASS.**

Not yet `DEPLOYED` or `RUNTIME VERIFIED`.

Next implementation lane: **Handover / OPS integrity**.
