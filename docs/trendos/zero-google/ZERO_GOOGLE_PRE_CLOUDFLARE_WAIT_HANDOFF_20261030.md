# Zero Google — pre-Cloudflare waiting checkpoint / release gates
**Owner:** TrendOS customer BACKEND | **Date:** 2026-10-30 | **Mode:** SOURCE-ONLY / NO MERGE / NO DEPLOY / NO LIVE CUSTOMER DATA

## Executive verdict
**Source preparation passes != Zero Google complete.** Actual proven retirements of the nine Google customer session actions are **0/9**. The existing customer master remains in its existing Cloudflare system; do not copy/rebuild/migrate it. Original T12 order single-writer, employee/Printshop, and EasyStore accounting are independently owned. Source can be reviewed while Cloudflare Access diagnosis is pending, but neither any source PR nor local test authorizes production cutover or a remote Stage operation.

### Cloudflare support diagnosis (authoritative correspondence as observed 2026-10-30)
- Support case **02394197**, Access-protected hostname **trendos-server68-isolated-stage.trendmall-contact.workers.dev**, Ubuntu service token **TrendOS Ubuntu Synthetic Stage**.
- Cloudflare's **2026-10-26** assertion that the Include policy referenced a *different* token was **explicitly retracted on 2026-10-28**: account had one token, not two. Do **not** replace the rule or create another token on that disproven theory. Keep Service Auth and Block Everyone enabled.
- On **2026-10-30** the owner-side team renewed that existing token and rotated its secret on Ubuntu without altering policies; direct one-time HTTPS GET / at **20:01:07 UTC** returned **HTTP 403**, Content-Type **text/html**, CF-Ray **a52d02962ab3e1d0-MRS**. Sanitized email sent to support on **2026-10-30 20:06 UTC**, asking for exact-Ray decision trace. A ticket closure warning was sent earlier that day; **do not assume the case will remain open without Cloudflare confirming**. No later Cloudflare trace was present in Gmail messages inspected in this checkpoint.
- **CRITICAL:** HTTP 403 at GET / alone is NOT sufficient to locate the failure. Some intentionally deny-all Worker routes respond 403 even after Access auth. Support must verify whether Access accepted the service identity AND whether the request invoked the Worker. Similarly an HTML 403 and old zero Worker Metrics are historical signals, not definitive current-Ray trace.
- Do **not** store, request, print or commit Client ID, Client Secret, Access cookies, D1 credentials, API tokens, customer tokens or raw customer files. Do not run repeated blind tests or turn off Access. Before a future controlled attempt, check the renewed service token has not expired (support email showed next expiry **2026-11-06** in dashboard-local time, subject to confirmation).

## Completed source-only preparation; no more unconditional work needed before support response
1. Existing isolated customer D1 native login/orders/logout/password/draft, R2 private byte integrity, quarantine, T12 read-only preflight, public-content read source candidates and Chromium original portal regression have local test evidence; customer UI is independently owned and must not be rewritten by this backend agent.
2. [Draft #282](https://github.com/fawakhry/TrendOs/pull/282): fail-closed local ClamAV signature-file preflight; no official vendor signature attestation.
3. [Draft #284](https://github.com/fawakhry/TrendOs/pull/284): read D1 synthetic owner snapshot/private R2 byte/hash, repeat state checks, run offline scanner. Synthetic callbacks, not real R2 bridge.
4. [Draft #286](https://github.com/fawakhry/TrendOs/pull/286): 60–120s HMAC file-bound single-use lease with audience/purpose/expiry and injected atomic nonce guard.
5. [Draft #288](https://github.com/fawakhry/TrendOs/pull/288): D1 native owner-session SQL + R2 SHA issuer, JS WebCrypto token interoperable with Python fixture, NOT imported to any Worker.
6. [Draft #290](https://github.com/fawakhry/TrendOs/pull/290): additive immutable D1 nonce CAS schema **not applied remotely**, signed lease verification and mock-D1 + real local SQLite concurrency tests.
7. [Draft #292](https://github.com/fawakhry/TrendOs/pull/292): genuine localhost Node JS→Python HTTP/HMAC synthetic byte transfer **9/9 tests**, forced 127.0.0.1 only, no production R2/Ubuntu network connection.
8. New pre-cloud source inventory command: `node tools/zero_google_precloud_freeze_audit_v0.mjs` and tests `node --test tests/zero_google_precloud_freeze_audit.test.mjs`. Its PASS means that checked-in legacy/Stage configuration remains properly **OFF and unchanged**, NOT that customer flows are running or traffic migrated.

### Exactly nine legacy Google customer actions (NOT equal to nine deployment gates)
These action names are sourced from the actual `LEGACY_CUSTOMER_SESSION_ACTIONS` Set and the employee customer-exclusion Set. Status describes local isolated source evidence, never real production cutover.

| Legacy action | Current Zero Google source status / remaining work |
| --- | --- |
| `customerLogin` | Native D1 + durable login throttle source locally tested; trusted live enrollment/session setup and Stage parity NOT qualified. |
| `customerLogout` | Native D1 session revocation locally tested; live browser/Stage routing still OFF. |
| `changeCustomerPassword` | D1 CAS rotation and session invalidation locally tested; original UI customer Native action not fully wired/qualified. |
| `getCustomerOrders` | Existing T12 D1 owner-scoped read-only source locally tested; must prove live ownership and current order parity before switch. |
| `getCustomerPortalAccountsV1859` | Customer account/financial preview source prepared; EasyStore live `customer_id`↔`party_id` proof, complete statement/invoices/transactions and isolation unqualified. |
| `createCustomerDraft` | Owner-scoped D1 draft create local tests; original customer UI Native action still OFF/unwired. |
| `addCustomerDraftItem` | Owner-scoped item local tests; no official T12 write, full line mapping or live frontend cutover. |
| `submitCustomerDraft` | **Read-only preflight only**. Full multi-item/files lossless delegated T12 single writer, idempotency, ack and reconciliation unqualified. Do not create a parallel order writer. |
| `uploadCustomerDraftFile` | Private R2/D1 quarantine + SHA256 source/local test with <=5MiB constraints; no production R2, trusted AV receipt, file transfer parity or print clearance. |

**Nine production legacy customer actions retired = 0/9 (last demonstrated).** Google calls remain possible in the old `/v1/legacy-api` path via `APPS_SCRIPT_API_URL`. Do not delete Apps Script or remove its env var on an unqualified source-only success.

### Separately blocked GOOGLE dependencies (not counted in the nine)
- The original customer UI boot calls `getPlatformAds`, `getPlatformSections`, `getFranchiseBranches`, `getMarketplace`, `getWhiteLabelSettings`. Two public-content read source candidates exist; full authenticated UI, remaining reads and independent session authority must be qualified before Google retirement.
- **Operator/Printshop tasks** can still use Apps Script through `operatorTaskEdgeProxyV2`, protected by separate Single Writer BOOK24 / task ownership / ScriptLock policies. Do not silently disable them during customer migration.
- **EasyStore finance** is authoritative for balances/invoices/transactions, separate from customer login; do not invent customer finance D1 mirror and never coerce unknown balance to zero.

## After Cloudflare's exact-Ray trace: strict dependencies, not automatic approval
**Gate C0 — resolve 403 accurately:** require support confirmation of the exact 2026-10-30 Ray: Access app matched? service token accepted? which policy/edge component rejected? Worker invoked? exact hostname? Recommended least-privilege correction? Keep Block Everyone and Service Auth; a 403 can be expected Worker-level deny, so success cannot be defined as HTTP 200 to root alone. If support asks for another test, make ONE owner-approved controlled test with redacted metadata, no customer file/URL and save Ray+UTC/Access/Worker evidence.

**Gate C1 — authorize isolated Stage:** explicit owner approval of the independent Stage Worker name, account, D1/DO/R2 disposable namespace, service token/mTLS/Access placement, single temporary synthetic test customer, retention/deletion policy, audit/rollback. No production binding or customer master relocation. Apply new replay migration ONLY to disposable Stage D1 after reviewed migration SQL with no production ID.

**Gate C2 — authenticated Cloudflare↔Ubuntu transfer:** require genuine mutual workload identity, hostname/path allowlist, TLS/Access, signed audience-specific byte+lease HMAC, nonce CAS in actual isolated shared D1, immutable owner/session/file/quarantine rechecks before/after R2 and AV scans. Check response source/signature/expiry; no public links or temporary bypass route. Tests: wrong service, expired/tampered signature, duplicate/parallel nonce, cross-owner, changed byte/metadata, network loss, 5MiB boundary, secrets/PII logs, rate-limit/timeout and safe recovery.

**Gate C3 — actual trusted malware verdict:** approved scanner identity and up-to-date authentic official ClamAV signatures, negative EICAR **only on synthetic authorized test data** and actual real signature-backed clean/threat differentiation, signed attestation bound to exact immutable object version/hash, immutable quarantine policy. No default clean on timeout, scanner failure, outdated signatures or lost ACK. Source-only `mtime` is not vendor authenticity.

**Gate C4 — actual customer app and official order:** owner-scoped native account enrollment and browser auth+logout/password, session revocation, old UI action parity, draft create/item/files, complete T12 delegated single writer and own existing order ID; no duplicate order DB or employee bearer issued to customer. Confirm order/line/attachment parity, idempotency, rollback and no lost files.

**Gate C5 — external non-Cloudflare authority:** EasyStore owner must attest live customer↔party ID and invoice/transaction/debt statement parity; task/Printshop Single Writer BOOK24 and operator-task Google removal have independent ownership and separate approval. These are NOT solved by Cloudflare Access support.

**Gate C6 — controlled cutover:** verify current deployed Git source/version, production D1/R2/bindings, complete 9 action migration and 5 startup reads on actual browser, positive and negative cross-tenant E2E; deploy canary under written authorization only, read metrics/readback, rollback route, backups, staged Apps Script retirement when no remaining task/Printshop Google callers. Confirm all nine by live evidence, not a CI or draft count.

### What can be honestly marked done when Cloudflare responds?
- **Before response:** code/staging preparation, realistic local HTTP transfer, owner/quarantine/replay source, synthetic CI and this freeze/readiness inventory. No remote Access fix has been performed.
- **After response but before C1–C6:** only C0 diagnosis/remediation can be checked. Cloudflare support does not grant Owner approval, financial authority, production migration, customer data access, T12 writer rights, or malware/print clearance.
- **Final ZERO_GOOGLE_COMPLETE:** **NO_GO** until all C0–C6 plus separate customer/employee/task Google call graph parity and rollback certified.
