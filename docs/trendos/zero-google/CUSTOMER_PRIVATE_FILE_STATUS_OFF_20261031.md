# Customer private draft-file status — source-only OFF (2026-10-31)

## Scope and authority

This is a **stacked Draft**, [PR #314](https://github.com/fawakhry/TrendOs/pull/314), on top of the existing [Zero Google PR #311](https://github.com/fawakhry/TrendOs/pull/311) head branch `integration/zero-google-one-package-v1-20261031`. It reuses Entry660 D1-native customer HMAC sessions, Entry666 private R2 file metadata, migration 0038, quarantine migration 0040, and the existing customer draft/item IDs. No new customer master, new R2 bucket, or public frontend photo service is created.

## What is implemented

- `cloudflare-d1/customer-stage/private-file-status-ro-v0.mjs` exports a **NOT WIRED** handler for `GET /v1/customer/native/drafts/:draftId/items/:itemId/files/:fileId/status`. The flag `TRENDOS_CUSTOMER_PRIVATE_FILE_STATUS_RO_V0_ENABLED` is **OFF by default** and is absent from the production Worker. Source remains on a development branch, without any Cloudflare deploy.
- Exact-origin CORS only, strict opaque IDs and no query strings, D1-native HMAC session fingerprint, full session validation *before and after* reading, and customerId ownership checks **bound to file, draft and item**. Draft must still be DRAFT, quarantine rows must match immutable file SHA/size/type, and scan/print flags must still be zero.
- Returns **only** a JSON status `STORED_QUARANTINED` or `UPLOAD_PENDING_QUARANTINED` plus an Arabic description and explicit `previewAvailable:false`, `scanCompleted:false`, `printReleaseAuthorized:false`. Status refers to recorded D1 metadata, NOT confirmation that R2 bytes still exist. It never returns file bytes, customer name, SHA, R2 object key, URL, public download route, photo or attachment preview. `R2.get/put/delete` is never called, D1 is never modified, and no Apps Script/Google fallback is invoked.
- `tests/customer_private_file_status_off.test.mjs` uses **two synthetic customers** and a fake D1 session/file query to test cross-owner 404, revocation, quarantine denial, wrong identifiers, default-OFF, CORS and absence of sensitive URLs/bytes.
- `tests/customer_private_file_status_sqlite.test.py` exercises the **actual D1-compatible query** on an ephemeral SQLite database using existing Entry666 fixture and immutable quarantine migration 0040. Checks two customers with different IDs, cross-file/draft/item denial, PENDING/READY still quarantined, no official order write, cancelled/submitted draft denial, and SQL fails closed without quarantine table. This is a SQL/behavior test, not a live Cloudflare or real customer proof.

## Release gates / what this is NOT

- **NOT** an image viewer. A customer-facing preview of real bytes cannot be implemented until independent scanner attestation (not just a local clean observation), private R2 object integrity, authenticated one-customer byte delivery, MIME/safe image transformations, customer quota/retention and audit controls are separately verified.
- **NOT** a claim that all original photos have been made private. The live Apps Script `Code.gs` can still use Google Drive `ANYONE_WITH_LINK` and customer-name order matching. Zero Google customer action retirement remains last proven **0/9**. No production customer backend change has been made.
- This is **not** imported into Worker `index_v2.js`; no Wrangler R2 binding or D1 migration is applied and **no staged Cloudflare worker** was deployed.
- Current source R2 limit is 5 MiB against the previous Google path's 25 MB; product parity and thumbnail UX need owner approval and real Stage validation.
- `CUSTOMER_UI_ON=NO`, `LIVE_PRIVATE_MEDIA_PREVIEW=NO`, `SCAN_CERTIFIED=NO`, `PRINT_READY=NO`, `OPENAI_PAID=OFF`, `CUSTOMER_RELEASE=NO_GO`.

## Continuation

Before any customer-release gate can be opened, qualify Zero Google native enrollment+session in a truly isolated Stage, use disposable D1/R2 fixtures and two authenticated clients with same display name and different IDs, verify rejected cross-owner requests with real Access policy, and design an attested scanner and authorized byte reader. Preserve Entry666/0040 source authority and use PR #314 rather than building a second parallel media system.


## Integrated Stage HTTP / SQLite proof — 2026-10-31

- **Code handoff:** [PR #314](https://github.com/fawakhry/TrendOs/pull/314) was MERGED **to the Zero Google development branch only**, merge SHA `dc9068e06ecfb0e1fb56b1185bcfdfe57cdad251`. It contributes private customer file **status**, no bytes, no route active. [PR #315](https://github.com/fawakhry/TrendOs/pull/315) then MERGED into the same Zero Google branch at `7827ea06e68704ae518679a8c35da2d551384190` with a real disposable HTTP→HMAC→SQLite D1 test.
- The additional `tests/customer_private_file_status_http_e2e_fixture.py` builds actual disposable SQLite from existing Entry660/666 fixtures and migration 0040, with fake customer A/B sessions and file IDs. `tests/customer_private_file_status_local_http_sqlite_e2e.test.mjs` calls the **actual** `handleCustomerPrivateFileStatusStageV0` with `Request` and Node 22 experimental local SQLite DB adapter; validates two accounts and owner-scoped file status, cross-owner 404, revoked bearer 401, submitted draft 404, missing quarantine schema 503, CORS deny, no bytes, no URL, no T12 order mutation. **This is not Cloudflare Worker deployment or live D1/R2 tests.**
- [PR #315 push test #41220581158](https://github.com/fawakhry/TrendOs/actions/runs/41220581158) SUCCESS, [PR #315 test #41220603613](https://github.com/fawakhry/TrendOs/actions/runs/41220603613) SUCCESS, parent status CI #41220603610 SUCCESS, A61 browser #41220603665 SUCCESS. Source head `96ff382bc89b0d5075804c184d050c8cbcac84b0`.
- **No release status change:** `CUSTOMER_PRIVATE_STATUS_WORKER_WIRED=NO`, `LIVE_CLOUDFLARE_DEPLOY=NO`, `PRIVATE_IMAGE_PREVIEW=NO`, `SCANNER_ATTESTATION=NOT_VERIFIED`, `GOOGLE_CUSTOMER_ACTIONS_RETIRED_LAST_PROVEN=0/9`, `CUSTOMER_GO_LIVE=NO_GO`. Parent Zero Google PR #311 remains Draft and owns release approval.
