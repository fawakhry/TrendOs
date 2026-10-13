# TrendOS Order Watch Agent V0 — مراقب الأوردرات (OFF / SOURCE-ONLY)
Date: 2026-10-14 (Cairo) · Owner request: first agent for daily orders, strictly read-only.

## What exists in this PR
- Deterministic V0 rules, not an autonomous deployed AI employee.
- Source: cloudflare-d1/src/order-watch-agent-v0.mjs.
- Offline runner: tools/order-watch/run-offline.mjs (requires environment flag).
- Synthetic tests: tests/order-watch-agent-v0.test.mjs.
- This code is NOT imported by any live Worker/frontend and has NO network, D1, Apps Script, storage, scheduling, WhatsApp, finance, or order mutations. **Production: NO_GO.**

## Existing official read contract (not yet connected)
The TrendOS candidate already implements GET /v1/edge/orders/02cr/page authenticated by an existing authorized short-lived employee edge token. Its response has rows, pagination, serverPaged, dataVersion, dataSource, and version; order line fields include orderId, lineId, status, assignedTo, itemName, priority, and expectedDeliveryAt/expectedDeliveryText. V0 accepts **complete** pages with one consistent version, counts, and non-PII stable IDs. A future integration must authenticate at the upstream, verify authorized role/scope and fresh data, page *all* results and ensure a truly consistent snapshot. Client-supplied JSON is NEVER proof of live source authenticity.

## V0 alerts
- OVERDUE: delivery date before the current Africa/Cairo calendar day, only if date syntax/validity is trustworthy.
- UNASSIGNED: active order line with no assigned employee.
- ITEM_MISSING, DELIVERY_DATE_MISSING, DELIVERY_DATE_INVALID, UNKNOWN_STATUS.
- Urgent/VIP unassigned or overdue is HIGH; other issues MEDIUM/LOW. Closed statuses use the operational service-screen filter from 02CR.
- Report emits **only** orderId/lineId and reason codes, aggregate counts; it never exports customer name, phone, notes, item title, or the raw input.

## How to test locally with synthetic/private approved data
1. Install Node.js 22+ on a trusted development machine.
2. Run: node --test tests/order-watch-agent-v0.test.mjs
3. Run: TRENDOS_ORDER_WATCH_OFFLINE=YES node tools/order-watch/run-offline.mjs < tests/fixtures/order-watch-v0.synthetic.json
4. Input JSON contains asOf (e.g. 2026-10-14T14:00:00+03:00) and pages (array of complete 02CR API responses).
5. Keep any **real** authorized input local/private; never commit it, paste it into issue/CI logs, or send it to an external service. Runner does not fetch or send anything.

## Pilot release requirements — all remain BLOCKED
1. Owner or authorized manager approval of alert semantics, Cairo day cutoff and escalation policy.
2. Fresh read-only verification of currently deployed API/Orders runtime, role/screen authorization, and no customer PII leakage.
3. Add a server-issued stable snapshot/cursor contract. Equal dataVersion across mutable pages **alone** does not guarantee an atomic snapshot, so V0 must not be treated as an accurate full live dashboard until resolved.
4. Validate required delivery dates are actually stored for all cloud-native orders; source currently has empty expectedDeliveryAt for some cloud-native rows and these must not be incorrectly called overdue.
5. Complete source CI and independent review; pilot on synthetic data, then authorized redacted canary.
6. Only *later* consider controlled alerts to staff via approved channels. NO automatic send/assignment/stock/finance/refund/WhatsApp in this version.
7. Merge only after independent review of exact head and deployment approvals. This PR is Draft, no runtime access is granted.

## Operational controls
- Fail closed on missing/inconsistent pages, duplicate IDs, wrong schema/version, unsafe identifiers, invalid asOf.
- No personal data in alert text. Never treat no alerts as evidence of no problems unless snapshot is complete, current and authorized.
- Rollback of this source-only feature: do not merge the PR; nothing runs in production.
- Relevant project book: TrendOS_MASTER_BOOK.md and this handoff document.
