# TrendOS Book — Five remaining customer legacy actions / source contract audit
**Date:** 2026-10-21 · **Book audit branch HEAD before this report:** `50ef7692856a5a77a0865a323288d8802e38c290`

> `SOURCE_ONLY_READONLY` · `CUSTOMER_NATIVE_ACTIONS_NEWLY_BUILT=0` · `CUSTOMER_ACTIONS_AUDITED=5/5` · `ZERO_GOOGLE_COMPLETE=NO` · `CUSTOMER_PRODUCTION_RELEASE=NO_GO`.

## Scope and provenance
This is a **design/contract audit, not new backend implementation, CI run, or proof of deployed behavior**. Current Book branch was read, without viewing raw private customer records or tokens. Earlier Entries654–659 build OFF/unapplied foundations; draft PR chain [#213](https://github.com/fawakhry/TrendOs/pull/213)–[#216](https://github.com/fawakhry/TrendOs/pull/216) implements four other actions (660–663) behind OFF/no-Worker-import gates; do not duplicate or prematurely reuse as deployed routes. Independent [#212](https://github.com/fawakhry/TrendOs/pull/212) already records source-only four-phase release gates.

**Current customer dispatch (source-verified on this Book branch):**
- `employee-api-dispatcher-v1.js` lines 108–117 lists all 9 `CUSTOMER_SESSION_ACTIONS`; lines 746–755 and 851–857 pass them to the existing downstream `trendosSecureApiV1922`, not the employee Native Auth route.
- `cloudflare-d1/src/legacy-browser-transport-v1.mjs` lines 7–33 contains the 9-action customer allowlist, and lines 57–66 exempts customer sessions/drafts from `NativeOnly` employee upstream denial; lines 91–101 build server-owned Apps Script upstream. **Repository code establishes the legacy transport design; deployed traffic/current upstream activation remain unverified.**
- `cloudflare-d1/src/index_v2.js` lines 43–44 registers `/v1/legacy-api` route. No customer Draft/account-file native HTTP handler is registered in that reviewed Worker index.
- `cloudflare-d1/migrations/0032_customer_portal_identity_foundation_v1.sql` creates future OFF identity control/accounts/sessions only; `0033_customer_portal_native_order_ownership_v1.sql` covers verified native order links only, not drafts or ledger rows; `0034–0035` are OTP enrollment primitives, explicitly unapplied in their headers. **No authorized Production migration or tenant identity proof exists in this audit.**

**Source blobs checked:** `app.js@9d90b5b1a1fc5c1ad2058cc29e97530c68c1a875`; `employee-api-dispatcher-v1.js@78dfb66bf9e37bd4b3b29d5e2905d2198d3c56ee`; `legacy-browser-transport-v1.mjs@d3f1407c260c4b623352469372265c01d9bd8ad4`; `index_v2.js@4a555efb4b3f44ba371549d5cec055cc7ce1777f`; `0032@8d38e4b1059a9a1a31a214e877d2cc56e7c6a7d0`; `0033@2852c998fd5997f8f7dcad21b81e0878530edeb2`; `0034@5eeee6232cb749e7cb6ab04889a861d147b6d590`; `0035@86cec2bcbdf23ec231a48e0ca3c91f60c0db3889`.

## Per-action contract / invariant / blockers

### Action A — `getCustomerPortalAccountsV1859` — financial read only
- **Current frontend caller:** `app.js` lines 9317–9326, especially 9325: session `{customerCode, token}`; response `invoices[]`, `transactions[]`, `totalInvoices`, `totalPaid`, `totalRemaining`, `balance`, plus invoice line fields and transaction notes. Renders via escaped strings but **cannot make server-side ownership decisions**.
- **Native candidate required, not built here:** customer-bearer independently verified on D1, account ACTIVE and correct session/version/revocation, narrowly scoped invoice/transaction SELECTs with **customer_id and order ownership predicates on every underlying join**, no shared-phone/name/code matching, no employee-only accounting route reuse.
- **Financial system boundary:** `cloudflare-d1/src/employee-accounting-native-v1.mjs` has employee-session authorization and its own `READ_ACTIONS` (line 10), **not** a customer portal finance permission. EasyStore/Accounting custodians must approve which ledgers can be represented and whether the data is a mirror. Read-only financial visibility is not approval for ledger writes/collections/refunds.
- **Fail-closed tests required:** unrelated customer token / same phone / conflicting portal code / invoice with another customer's order / missing scoped ledger / stale mirror / NULL customer binding / wrong role → no rows/403; authorization fails before DB data; summary totals may not aggregate another customer; pagination/redaction/retention and parity by source-authorized synthetic fixture.
- **Gate:** `FINANCE_OWNER_SCOPE_AND_SOURCE_PARITY_PENDING`. Historical `getCustomerPortalAccountsV1859` Apps Script handler was **not independently inspected**; financial contract above is derived from current caller and security requirements, not a claimed server implementation.

### Action B — `createCustomerDraft` — draft identity allocation
- **Frontend caller:** `app.js` lines 3902–3912 `ensureCustomerDraftOnServer()`; sends `{customerCode,token}`; expects `{success,draftId,folderUrl}`, stores `draftId` only **after acknowledged success**.
- **Native gate:** auth-scoped customer ID from server; owned D1 draft with `DRAFT` state, typed schema, immutable customer linkage, allocated `draftId` on server only, idempotency key or recoverable one-active-draft lookup. No Google Drive folder URL as authority; any legacy folder link requires separately scoped migration or compatible file reference (not customer credentials).
- **Failure test:** dropped successful ACK, retry from same browser, concurrent devices, stolen draft ID, expired bearer and source mismatch. Guarantee **one canonical draft per idempotent operation** with recoverable result; no shadow duplicate or wrong-customer folder.
- **Gate:** `DRAFT_SCHEMA_AND_OWNER_POLICY_PENDING`; no existing customer Draft native D1 migration found in reviewed `0032–0035`; absence is bounded to those files, not a claim about all repository files.

### Action C — `addCustomerDraftItem` — independently authorized item append
- **Frontend caller:** `app.js` lines 3935–3990; server receives `draftId,department,itemName,qty,notes,heatPress,flyPrint,franchiseBranchCode` with customer code/token. Expects `itemId`. Then **uploads attachments sequentially** via Action E, and only *after all uploads finish* pushes item into `state.customerDraft.items` (lines 3970–3985).
- **Important conditional risk:** after item insert succeeds, an upload network failure may leave a durable server-side item not mirrored in the local list; clicking Add again can create a second item. This is a **source-derived failure scenario, NOT a reproduced production duplicate**. Backend idempotency or compensating recovery was not independently proved.
- **Native contract:** one customer-owned `DRAFT` parent, strict state/version check; stable `clientItemRequestId`, immutable item identity and saved canonical response; whitelist departments/quantity/flags; field-size bounds; no reliance on browser-supplied branch/vendor names as trusted pricing/authorization.
- **Fail-closed tests:** second customer guesses IDs, submit race while item uploading, replay of same request with changed contents, stale version, missing file ACK, lost response, multiple attachments, late retries after submission, phantom duplicates after browser reload.
- **Gate:** `DRAFT_IDEMPOTENCY_AND_RECOVERY_PENDING`.

### Action D — `submitCustomerDraft` — exactly-once official order commit
- **Frontend caller:** `app.js` lines 3998–4028. Client checks local draft ID/items, asks UI confirmation, sends `{draftId}` with customer auth, then marks submitted and records returned `orderId`. Current call passes **no stable idempotency request ID** in the visible payload; historical server handling was not reviewed.
- **Native invariant:** transactionally perform `DRAFT -> SUBMITTING -> SUBMITTED` with unique `draftId -> orderId` mapping, no double-created `t12_prod_orders` under lost ACK/retry/race, all item/file validations completed before commit. Use the existing T12 orders canonical creator and its permissions/single-writer authority, not an independent second order writer or bypassed debt/finance gate.
- **Fail-closed tests:** two simultaneous submits same draft; replay with lost HTTP ACK; crash between order insert and status update; deleted/revoked customer; another customer's draft; missing file; pricing/branch policy drift; multi-department order partial failure; Order ID linkage and subsequent `getCustomerOrders` visible to exactly one owner.
- **Gate:** `EXACTLY_ONCE_T12_ORDER_COMMIT_AND_SINGLE_WRITER_PENDING`. No source-only recommendation grants order creation permission.

### Action E — `uploadCustomerDraftFile` — private attachment R2 custody
- **Frontend caller:** `app.js` lines 3914–3934: sequential uploads per item via `apiPost`, inputs `{draftId,itemId,fileName,mimeType,size,base64}` and customer code/token; checks client-side `file.size <= 25 MiB`; expects `fileUrl/fileId`. Browser MIME and size are **claims**, not server controls.
- **Native contract:** server validates session and exact customer/draft/item ownership *before* accepting bytes, content-type sniffing and size/rate limits on decoded payload, privacy-safe extension and file name canonicalization, private R2 bucket/key prefix, encrypted/private signed scoped downloads with expiry, no public permanent URLs by default. Store a D1 file row with ownership, digest, immutable `uploadRequestId`, `PENDING/COMMITTED` lifecycle and orphan cleanup; reject file retrieval by unrelated customer even when file ID leaks. No Google Drive implicit public fallback.
- **Existing non-equivalent source:** `cloudflare-d1/src/employee-content-native-v1.mjs` lines 88–105 implements **employee content collection** R2 via `env.FILES` and optionally `FILES_PUBLIC_BASE_URL`; it is NOT a customer-upload authorization model and its public delivery choices must **not** be copied to private customer files. Current `cloudflare-d1/wrangler.toml` was inspected with D1 `DB` binding; no customer file R2 binding proven.
- **Fail-closed tests:** parent/draft ownership mismatch, upload to another item, revoked session, mismatched declared versus decoded size/MIME, oversized body, duplicate identical upload with lost ACK, repeated differing content with same key, R2 PUT success/D1 INSERT failure, expired signed URL, public-link enumeration and orphan cleanup without deleting unrelated files.
- **Gate:** `CUSTOMER_PRIVATE_R2_ACL_AND_ORPHAN_RECOVERY_PENDING`.

## Shared release/test matrix (owner decision recorded; no action taken)

| Gate | Required evidence | State in this audit |
|---|---|---|
| Identity / customer session | Source of verified enrollment, OTP consent, active Native account, session HMAC and logout/change-password cross-device revocation | `D02_PENDING`; #213–#216 source only OFF |
| Data ownership | Exact `customer_id` verified mapping, source-authoritative order/customer and finance joins, no phone/name fallback | `D02_PENDING`; Entry655 readiness not authority |
| Draft persistence | Schema and owner-scoped D1 create/item lifecycle, crash+replay idempotency, request ledger | `NOT_IMPLEMENTED_IN_REVIEWED_NATIVE_ACTIONS` |
| Canonical order writer | Prevent duplicate T12 ID, single-writer task/order boundary across Apps Script/D1 and finance/debt protection | `D03_PENDING` |
| Customer private files | R2 private signed ACL, file ownership+digest and D1/R2 failure recovery | `R2_CUSTOMER_AUTHORITY_PENDING` |
| Deployment parity | Current deployed Worker SHA/flags/bindings and endpoint-specific Google requests, no secrets | `D01_PENDING` |
| Isolated stage | Fake test suite, stage-only integration, restore and rollback canary | `D04_PENDING` |
| Go-live | Explicit owner and system custodians authorize, verify read-only finance and per-action cutover | `NO_GO` |

## Recommended safe implementation order (NOT an authorization to code/deploy)

1. Reuse the independently tested native customer identity/session primitives from Entries654–663 **only after stack integration is CI-qualified at the new combined SHA**.
2. Read-only **A** separately with Accounting/EasyStore authorization, to avoid accidentally exposing another customer's invoice.
3. Build D1 draft **B** with idempotent identity, followed by **C** with atomic item append and recovery.
4. Build customer-private file **E** with R2 ownership and orphan recovery and integrate into **C** before allowing order submission.
5. Build **D** last, with exactly-once T12 write, no duplicate Writer and recoverable ACK semantics.
6. Only then consider a feature-flagged, owner-controlled canary; maintain legacy customer service until exact parity and rollback, **never** change production based only on source CI.

## Repo-wide integration caution

- Book HEAD `50ef7692856a5a77a0865a323288d8802e38c290` vs #213 head `7d71168b7a1c339be6ac45a0c4b5b4cf5a8557bd`: compare returns **diverged** (Book ahead by 4 doc commits since #213 base; #213 ahead by 7); also #210 and #212 are diverged from current Book. A prior exact-PR-head CI pass does not certify the future merged tree.
- No secrets, raw personal customer rows, D1/R2 mutations, Google actions, CI triggers, merges or Worker deployments were made in this audit. Earlier privacy-held Entries596, 599, 600 remain unchanged.
- `HISTORICAL_66_INVENTORY=66/66`, `NEW_CUSTOMER_SOURCE_CANDIDATES=4/9`, `CUSTOMER_NATIVE_GO_LIVE=0/9`, `CUSTOMER_FIVE_ACTIONS_SOURCE_GAPS_CLASSIFIED=5/5`, `ZERO_GOOGLE=NO_GO`.
