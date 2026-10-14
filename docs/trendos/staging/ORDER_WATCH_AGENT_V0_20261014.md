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

## 2026-10-14 — Read-only pilot qualification blueprint (NOT EXECUTED)

**Source baseline:** Order Watch remains `OFF_SOURCE_ONLY`. No fetch/token/server writes/cron/WhatsApp/Production changes. This blueprint is for a future explicitly authorized, private pilot, not evidence of release.

### Evidence established by reading actual code (not runtime)
- `edge-orders-read-02cr-canary.mjs` serves `GET /v1/edge/orders/02cr/page`, checks an HMAC-signed short-lived Edge session and its `screens` claim; `screen=service` is potentially broad. Token issuance paths and actual deployed role authorization require independent verification.
- The existing page handler reads three D1 sheet mirrors, Legacy runtime overlays and Cloud-native tables separately for **each** request. `dataVersion` equals only the Legacy lines mirror `syncedAt`. Two individually successful pages can be drawn from different operational states. No server-issued atomic snapshot/cursor exists here; client counts/deduplication cannot prove completeness during mutation.
- `edge-orders-read-02cr-freshness.mjs` may classify old mirror write-age as **advisory**, since Cloud-native rows/runtime overlays may still be current. A single `syncedAt` or warning-free 200 must NOT be treated as all-source freshness proof.
- `mapT12CloudNativeRows` currently explicitly emits `expectedDeliveryAt:''`, `expectedDeliveryText:''`. This prevents any verified overdue classification for those native rows. Preserve `DELIVERY_DATE_MISSING`; select a real authoritative due-date source and evidence-backed migration in another approved change later. Do not infer due dates from order creation, defaults, or notes.
- The handler has a conditional `if (allowed.length && !allowed.includes(screen))` check. For **empty** signed `screens` claims it does not enforce a nonempty allowlist. Actual issuance normally populates screens, but a future pilot security audit must prove tokens with missing/empty claims cannot bypass scope, and review service/department scope and authoritative identity. Do not modify live authorization in this isolated agent PR without dedicated regression and approval.
- Caller-controlled `query`, `statusFilter`, `priorityFilter`, `heatPressFilter` can restrict or reorder the population. A complete report must pin a declared `screen` and an approved, unfiltered query contract; do not accidentally report a filtered slice as all orders.
- 02CR source returns raw customer fields and session/mirror metadata. **Never** send raw output to an LLM, Fokha hub, public GitHub, error logs or notification service. Only an approved, upstream-minimized projection of non-PII IDs/status/due fields may be processed in a future private client.

### Safety-first phased pilot, with gates
1. **Source tests (available now):** `node --test tests/order-watch-agent-v0.test.mjs`; `node --test tests/order-watch-02cr-readiness.test.mjs`; `TRENDOS_ORDER_WATCH_OFFLINE=YES node tools/order-watch/run-offline.mjs < tests/fixtures/order-watch-v0.synthetic.json`. Execute in CI with synthetic input only; collect exact HEAD SHA/Actions run. Negative cases must reject tampered pages, offset dates, illegal IDs and PII echo. This stage is NOT real-time monitoring.
2. **Server contract redesign (unimplemented):** add an independently reviewed, least-privilege, read-only snapshot projection that returns only `orderId,lineId,status,assignedToPresence,itemPresence,priority,expectedDeliveryAt` (and explicit source/cutoff metadata) from a *server-certified consistent snapshot* of Legacy + runtime + Cloud-native state. One stable server-issued snapshot ID or one transactionally stable query/read view, bounded rows and TTL are required before paging. Client `dataVersion` equality is insufficient. Keep 02CR backward compatible; do not add a broad production role by default.
3. **Scope/security proof:** owner-approved role/screen/department scope, identity and expiry/revocation, fail-closed empty claims, no raw fields in responses/logs; confirm actual Worker route/version and a separately reviewed canary rollback procedure. Use an already-authorized narrow identity; never check in real tokens or PII.
4. **Due-date truth:** establish native delivery-date column, write/validation authority, timezone and effective-date semantics with independent evidence. If unavailable, leave native rows at `DELIVERY_DATE_MISSING` and explicitly label report coverage incomplete.
5. **Read-only diagnostics:** first use synthetic one-page snapshots; after owner approval test private redacted canary in a secure approved environment with no notifications or writes. Record freshness per data family, atomicity proof, filter/scope, snapshot ID, page counts, exact code sha, auth failure tests and redaction. If any proof is missing, return `BLOCKED`, not empty/healthy.
6. **Independent approval before real pilot activation:** owner confirms alert codes/severity/cutoff, included statuses (e.g. whether `جاهز للاستلام` merits attention), max data scope/retention, allowed roles and reviewer; security reviewer independently inspects source + deployment plan. Explicit separate approval required for Cloudflare deploy, cron, employee assignments or WhatsApp; none included here.

### Pilot acceptance matrix (no current claim of PASS except independently recorded test results)
| ID | Requirement | Current | Evidence to close |
| --- | --- | --- | --- |
| OW-G1 | Exact-head offline rules/privacy/negative CI | TESTABLE SOURCE ONLY | passing Actions run on latest test-source SHA |
| OW-G2 | Runtime 02CR deployed identity/role scope | BLOCKED | consented read-only version/token scope and denial proofs |
| OW-G3 | Native+Legacy atomic stable snapshot across pages | BLOCKED | transaction/snapshot token/cursor + race tests |
| OW-G4 | Per-family freshness and completeness | BLOCKED | live non-PII timestamps, overlay versions, no scope/filter drift |
| OW-G5 | Native due-date authority and delivery semantics | BLOCKED | schema & persisted write/read field parity, synthetic + approved pilot |
| OW-G6 | Privacy/redaction/independent security review | BLOCKED | least-privilege projection, safe logging, independent sign-off |
| OW-G7 | Owner alert rules and bounded pilot authorization | BLOCKED | explicit signed-off scope, threshold, environment & rollback |

**Go/no-go:** All OW-G2–G7 remain BLOCKED. Keep PR #131 Draft; `PRODUCTION=NO_GO`. Existing OFF CLI tests are not a source of snapshot authority.
