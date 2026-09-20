# R6 checkpoint — current live source access + isolated synthetic ledger workbook
Date: 2026-09-20. Repo: `fawakhry/TrendOs`; branch `safety-properties-retention-cleanup-audit-20260920`.

## Owner approval and exact scope
Owner approved: **read-only inspection of the current original-bound Apps Script live source**, comparison against the isolated R6 candidate, and a **test-only** ledger setup/rehearsal. NOT approved: any mutation to the canonical production workbook, original Apps Script source/deploy, triggers, Script Properties, D1/Worker, frontend main, or deletion of historical replay keys.

## Actual live Apps Script source access — identity verified, source still inaccessible
Original production-bound project ID: `1aGQ5jJ4yYFI5QwMNSM6s1er4LlPbril3kD5nRApScEN-SsNDMXBWm_Eo`.
A fresh Google Drive metadata read **succeeded** for this exact file ID, reporting `mimeType=application/vnd.google-apps.script`, title `Untitled project`, modified `2026-09-20T13:36:19.038Z` (provider timestamp). This validates file identity and current Drive metadata **only**, not live project files, executable source or deployed Version 155.
Earlier attempted direct Google Drive media fetch of this exact Apps Script project returned HTTP **403 Forbidden**; Google Drive metadata and spreadsheet tools cannot substitute for Apps Script Projects `getContent` read access. A fresh TinyFish wallet check reported available balance `-0.138766 USD` and no automatic reload, so the metered browser automation path was unavailable; no Apps Script browser operation began. Do not claim byte-exact live `Code.gs` or Version 155 parity. GitHub `Code.gs` remains **unverified baseline**, not live source. Never copy it wholesale into production.

## Owner-private synthetic test workbook — CREATED and verified, NO production data
A separate NEW Google Sheets workbook was created under the owner's existing Google Drive connection:
`https://docs.google.com/spreadsheets/d/136diLukmM3Me7TmWP8cuwW3Z4lSb0UQZIfQ4I7eMr1Q/edit`
Title: `TrendOS R6 SYNTHETIC REPLAY LEDGER TEST ONLY — 2026-09-20`.
Google Drive metadata verified: `shared=false`, only owner permission (source-visibility classification permission metadata available).
Two tabs were created/verified:
- `README_SYNTHETIC_ONLY`: explicit notices that it is NOT the production workbook, contains no actual customer IDs/business data, has not run live Apps Script, and cannot authorize historical replay deletion.
- `TRENDOS_ORDER_REQUEST_LEDGER_V1`: exactly NINE headers `keyDigest,payloadDigest,state,responseJson,orderId,lineId,createdAt,updatedAt,schemaVersion`; one fabricated `PENDING` and one fabricated `COMMITTED` fixture using dummy digests and synthetic `TEST-001`. Read-back via connected Google Sheets API verified sheet names, header names/order and the two synthetic state examples.

**Strict caveat:** creating/verifying a synthetic workbook proves its isolation and schema can be provisioned through Sheets, NOT that the Apps Script R6 functions executed there, NOT that the production workbook was provisioned, and NOT that old replay keys are safe to delete. The candidate `trendosDurableReplayV1Sheet_` hard-gates to the production workbook ID and therefore will deliberately reject this separate workbook; running that candidate against this test workbook requires a separately authored, isolated-only test harness with injected workbook identity, NEVER changing/removing the production-ID guard in a deployable candidate.

## Engineering status
Existing GitHub Actions isolated tests for R6 durable replay, frontend same-key intent and R5 read-only observer passed on branch in run `35515011429`. Those tests are *synthetic mocks*, with no connected Google Sheets runtime or Apps Script execution. The newly-created synthetic workbook provides independent structural/rehearsal fixture only.

## Precise next gate / action needed
1. Obtain a **current authorized Apps Script Projects source export** of original bound `Head`, PLUS read-only deployed Version 155 create-path evidence, using an authorized Apps Script connector/browser session or owner-supplied sanitized source artifact. This is the first blocker; do not infer exact source from the old Google Sheet tab `سكريبت Apps Script` or the GitHub repo.
2. Compare all live `createManualOrder_`, V1908 read/save, ID allocator, activity/queue/accounting side effects, routers/overrides and exact active triggers against the isolated candidate, and confirm no alternate write clients.
3. Only after exact source verification, prepare a line-scoped reversible patch + sandbox-only **executable** Apps Script rehearsal against synthetic data and test workbook with a test-specific workbook dependency injected. Never run original ID-locked candidate directly on the synthetic workbook by deleting its guard.
4. Separately agree on any production workbook ledger creation/protection, production code deployment and replay Property retention policy. No live production mutation has occurred in this checkpoint.

## Change boundary
This checkpoint's only persistent operational action was creating the **separate** synthetic TEST-ONLY Google workbook with its own owner-private dummy rows. It did not read/move/copy actual production order rows or private backup, did not touch production Apps Script/Sheets/R5/Properties/Worker/D1/frontend main, did not deploy or enable any trigger, and did not delete a single replay record.
