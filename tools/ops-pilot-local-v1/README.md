# TrendOS — Local Operational Pilot V1

LOCAL ONLY / SYNTHETIC DATA / FINANCE_RELEASE=NO_GO

This is an interactive local trial, NOT production and NOT Cloudflare staging. It reuses the repository's actual manager-center-v1932.js user interface. Its local Node HTTP + in-memory SQLite is a disposable simulator, NOT production TrendOS employee-Core or EasyStore accounting.

## Run (Node 22+)

From the TrendOs repository root:

    node tools/ops-pilot-local-v1/server.mjs

Then open on the SAME computer: http://127.0.0.1:4178

On Ubuntu optionally change port:

    PILOT_PORT=4180 node tools/ops-pilot-local-v1/server.mjs

Server always binds 127.0.0.1; never expose 0.0.0.0, the LAN, VPN, a reverse proxy or a public route. Stop with Ctrl+C. All demo changes vanish at restart; no database files are created.

## Hands-on validation

1. See three fake orders: new design, in-progress print and blocked ready-to-deliver sticker.
2. Select a product and department and create fourth fake order (customer automatically fake).
3. Advance one order: طلب جديد -> جاري التنفيذ -> جاهز للتسليم -> تم التسليم.
4. Confirm that blocked ready-to-deliver order cannot be delivered.
5. Open the existing v1932 manager dashboard floating button to see live synthetic active/delivered counts, team performance and the fake delivery restriction.
6. Try changing a status out of sequence, adding customer/phone/payment input, finance endpoints, or cross-origin requests; all must be denied.

## Safety

- Only fake customer names and DEMO- order IDs. POST accepts enumerated product + department, no actual customer data.
- No cloud, D1, Google, Apps Script, WhatsApp, OpenAI, printers, actual employees, cash, collection, invoice or delivery writes.
- A synthetic local admin token drives manager UI only; this is NOT a test of trusted employee SSO or production manager rights.
- Financial routes and every nonallowlisted API operation hard denied. No automatic debt reconciliation or unlocking a delivery hold.
- No live Cloudflare/Pages/Ubuntu deployment, merge or customer write is authorized by this pilot.
- BOOK19/18/28 OPEN; G1–G5 OPEN; FINANCE_RELEASE=NO_GO, LIVE_VERIFIED=NO, DEPLOYED=NO.

## Real HTTP tests

    node --test tests/ops_pilot_local_http.test.mjs

Test starts real 127.0.0.1 HTTP server on ephemeral port with real disposable SQLite. Tests include HTTP get/create/update, manager counters, blocking conditions, financial endpoint denials and ephemeral restart. It is NOT simulated frontend-only tests and does NOT verify cloud/production integrations.

## Next release gate

Separately owner-authorized isolated cloud stage, trusted staff SSO, actual native Core handler, official immutable customer binding, genuine debt/receipt read consistency, backup and rollback, concurrency and server/cloud access are still needed before an operational/finance GO.