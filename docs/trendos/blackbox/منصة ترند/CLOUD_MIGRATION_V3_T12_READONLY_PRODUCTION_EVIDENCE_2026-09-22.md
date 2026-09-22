# T12 — Owner-approved read-only production evidence collection (provisional)
Date: 2026-09-22. READ-ONLY observations; not a cutover seed, deployment or authorization.

## Authorization and safeguards
The owner explicitly approved the narrowly scoped read-only verification phase proposed in the preceding T12 handoff: immutable V155/deployment identity, numeric next-order-number evidence, current/archived order-number high-water marks, production D1 mirror/binding and Integrity route flags. This did NOT authorize an Apps Script function execution, production change, Worker publish, writer freeze, main Sheet edit, D1 mutation, R5 operation or historic-key cleanup. No secrets, user records, phone numbers, customer data or raw ID rows were read or recorded as a part of this spreadsheet inspection.

## Google Drive discovery: candidate workbook, not confirmed bound production workbook
Drive search identified a native Google Sheet named `TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY` with current and archived Orders and Lines tabs. Its metadata shows 2026-09-22 modification and spreadsheet-level time zone `America/Los_Angeles`; this metadata does **not** prove the bound Apps Script Version 155 uses this workbook. The Apps Script code can select a different workbook using the private `TRENDOS_SPREADSHEET_ID` script property; no value of that property was read, and no script function was invoked. Other search hits were backups, staging and test fixtures and were NOT substituted for the original.

Read-only Sheets API values retrieval read exclusively column A/B (displayed order ID and code) in four candidate tabs, plus only header rows and `orderId` (BM) numeric alternate columns in the two line tabs. No customer-identifying columns were retrieved. Counts below reflect one sequential set of non-atomic observations; they are not frozen or transactionally consistent across the four tabs.

| Candidate tab | Observed rows excluding header | Numeric primary order IDs | Legacy alphanumeric IDs | Highest numeric primary ID | Noncanonical primary ID shapes |
| --- | ---: | ---: | ---: | ---: | ---: |
| Current Orders | 694 | 681 | 13 | 4304 | 0 |
| Current Lines | 750 | 738 | 12 | 4304 | 0 |
| Archived Orders | 2871 | 2623 | 248 | 3761 | 0 |
| Archived Lines | 4110 | 3672 | 438 | 3761 | 0 |

The lines' auxiliary `orderId` column BM contained a header but no order-ID values in the observed range of either lines tab. A separate primary ID-only cross-tab read found 681 distinct numeric current Orders IDs, 2623 distinct numeric archived Orders IDs and no numeric ID overlap between these two candidate order-summary tabs in that observation. This supports **at most** the conditional lower bound `highestObservedCandidateWorkbookId + 1 = 4305`; it is NOT a real next order number, because the authoritative Google Script Properties `TRENDOS_NEXT_SIMPLE_ORDER_NO` value, independent production D1 mirror high-water, bound-spreadsheet ID, live write race and final post-fence snapshot remain unknown. The T12 pure seed-evidence routine was NOT passed fabricated source snapshots, and no SQL/Script Properties write occurred.

## Source/deployment identity and other read-only blockers
- Previous user-uploaded 40-file Apps Script JSON is parseable only through Windows Arabic `cp1256`, not UTF-8, and demonstrated a lossy conversion of Arabic-Indic digit literals; JSON contains `scriptId`/`files` but no echoed `versionNumber`. The previous owner screenshot displays a selected deployment marked Version 155, but immutable source API request provenance and lossless per-file byte/Unicode equality are still not proven.
- No connected native Apps Script project-version/read-only Script Properties connector was available. Drive API/Sheets read cannot expose or certify Apps Script deployment-to-version binding, script property values or runtime Integrity flags. Do not run Apps Script functions to compensate.
- No connected native Cloudflare D1/Workers account connector was available. GitHub Wrangler configs and SQL schemas describe candidates; they do not verify production DB bindings, production D1 mirror freshness, R5 active state or real DB high-water. No remote Cloudflare query or Worker request was made.
- The existing T12 offline cutover readiness stays FALSE for exact source proof, independently attested sole-writer fence, historic-key continuity, production D1 mirror evidence, canonical business-create parity, replay/timeout and rollback. This evidence phase did not produce a deployable cutover seed or permission to start actual customer writes.

## Next source-specific items to obtain without an unsafe proxy action
1. Owner must verify the actual bound production spreadsheet's identity against the candidate workbook through the Apps Script editor/project settings, WITHOUT pasting script IDs, full spreadsheet URLs, token material, or sensitive property values into an open/public document. Confirm match/non-match separately; if different, do not extrapolate these numbers to production.
2. Owner should capture the already-discussed successful *read-only* Apps Script API request parameters explicitly showing `versionNumber=155`, and export the response directly as UTF-8 without ANSI/cp1256 conversion. We should then compare actual Unicode-bearing snippets and all source-file hashes against the repo.
3. Only the **numeric** value of `TRENDOS_NEXT_SIMPLE_ORDER_NO` and the current active/inactive status of the `ORDER_LINE` Integrity route are needed, not a dump of Script Properties or secrets. Do not reset, rotate, or execute historical-cleanup helpers.
4. Production Cloudflare Worker/D1 binding identity and a read-only numeric high-water/freshness observation must originate from the actual connected production account or an owner-provided timestamped official screenshot; staging/TEST D1 cannot substitute. Record only numeric aggregates/sync lineage, no raw order/customer rows.
5. Once all live sources are identity-confirmed, take a new consistent read-only baseline and separately agree any later time-bounded writer-fence/final re-read. The current sequential candidate-sheet reads are never a frozen cutover snapshot.

**Safe stop:** Continue GitHub-only source/testing work when possible. Production Google retains exclusive business order number authority; no deployment, freeze, D1 SQL write, customer CREATE, duplicate synthetic POST, R5 mutation, or historic replay-key deletion happened in this phase.


## Additional script-project metadata verification (read-only)
Using only the `scriptId` already contained in the owner-uploaded provisional JSON, Google Drive `get_file_metadata` confirmed an accessible file whose MIME type is `application/vnd.google-apps.script`. Drive labels this project `Untitled project` and reports a modification on 2026-09-20, later than the previously owner-shown Version 155 deployment dated 2026-09-06. This establishes the existence/type of the project associated with the uploaded JSON identifier, not which historical source was published. Drive returned no parent spreadsheet identifier; absence of returned parent metadata must NOT be construed as proof of the bound or standalone status. Do not infer that current Head equals immutable deployed Version 155, or that the candidate workbook is its production backend. The original private scriptId itself is intentionally not copied into this report.
