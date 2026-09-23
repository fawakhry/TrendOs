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


## Further ID-only referential integrity snapshot (non-atomic, read-only)
Owner confirmed the discovered workbook is their **currently operated main Sheet**, which is stronger than the initial Drive-title inference. However, Apps Script's private `TRENDOS_SPREADSHEET_ID` value and exact V155 deployment binding have NOT been independently read; do not assert a verified deployed connection merely from usage confirmation.

Another read-only pass used ONLY columns A (displayed Order number) of current/archived Orders and Lines and F (`رقم البند`, line label) of the two Lines tabs; a separate shape-only check consulted archived Lines B (displayed Order code). No name, phone, notes, debts, payment, customer row fields, exact ID row sets, private keys or secrets were exported to GitHub.

- Current Lines: 738 numeric order-number rows; 0 such rows had a numeric Order number missing from the union of current and archived Order summaries observed in that pass. Current Lines column F had 750 non-empty labels, of which 750 were in the form `<same displayed Order ID>-...`; 17 *additional* rows reused the same within-tab displayed (Order ID, line-label) pair across 15 repeated-label kinds. This is an observation about displayed row identifiers, **not** proof of duplicate business creation, and requires a separate legitimate historical-row/multi-status explanation before assuming every line row represents a distinct current logical line.
- Archived Lines: 3672 numeric order-number rows; 0 had a numeric Order number missing from the same observed summary union. Its column F contains **mixed historical label formats**: only 546/4110 displayed labels start with their row's Order ID plus a dash, while 3564 do not. Consequently counting bare repeated F labels or imposing modern `orderId-ordinal` syntax on archived Lines would be a false integrity diagnosis. A preliminary same-row-pair count saw repeated labels but is NOT actionable without a version-specific legacy ID mapping; do not use it to delete, merge, renumber or "repair" archived rows.
- Both checks are sequential API reads while normal operations continue; they are not a final frozen cutover baseline. Only summary counts have been retained in GitHub. The order-number property, D1 mirror binding/high-water, and post-fence line-number reconciliation remain unknown.

**Engineering implication:** The future canonical Cloud writer must determine the next line ordinal across all applicable current AND historic line representations and distinguish intentional historical row duplication from an actual write duplicate. The 17 current additional row-label occurrences deserve targeted **read-only** legacy semantics review before any business-line ID allocator is activated. No user-created/customer order or line was mutated by this inspection.


## Duplicate displayed line-label technical-field comparison (owner-approved read-only, non-atomic)
A further bounded pass through the **owner-confirmed currently operated workbook** retrieved ONLY four to seven isolated technical columns per Lines tab: displayed order number A, displayed line label F, status K, last update M, optional auxiliary `id` BL and `status` BS, and archived date CE for the archive tab. It did NOT retrieve customer names, phone numbers, item details, prices, credentials or original row payloads, and never exported any individual original ID, status or timestamp to the repository. Each technical column was read in a separate API call while Google may have continued writing; grouping by displayed row position across calls is **not an atomic snapshot**.

Observed aggregate-only within-tab grouping by exact displayed (Order number, Line label):

| Technical observation | Current Lines | Archived Lines |
| --- | ---: | ---: |
| Rows examined after header | 750 | 4110 |
| Distinct displayed (order,line) pairs | 733 | 3056 |
| Distinct repeated pairs | 15 | 1005 |
| Additional rows in repeated pairs | 17 | 1054 |
| Repeated pairs with more than two rows | 2 | 30 |
| Repeated pairs whose observed status fields differ | **15** | **0** |
| Repeated pairs whose last-update fields differ | 10 | 40 |
| Repeated pairs whose archived-date field differs | N/A | 21 |
| Repeated pairs with all auxiliary BL `id` entries blank | 15 | 1005 |
| Repeated pairs with all auxiliary BS `status` entries blank | 15 | 1005 |

Among unique *pair keys*, 733/733 current line labels start with their displayed order number plus dash. In archive only 390/3056 unique pair keys do, versus 2666/3056 alternate legacy label formats. The earlier row-count observation remains 546/4110 modern-prefix archived **rows**; do not confuse per-distinct-pair counts with per-row counts.

**Interpretation limit:** All 15 repeated current pair groups have differing observed primary `الحالة` statuses, compatible with—but NOT proof of—different status/history snapshots. The 1005 repeated archive pairs have equal observed statuses, with some differing timestamps. Neither observation proves a duplicate customer CREATE or qualifies a distinct canonical line-ID mapping. Because BL/BS are blank on the repeated groups, these optional fields do NOT supply a stable per-row identity for those groups. NEVER automatically merge, delete, renumber, or allocate next line number from repeated displayed F labels. Before actual Cloud CREATE/line lifecycle cutover, separately qualify lineage/identity of every current and archived logical line from **independently consistent authorized evidence**, with a deterministic non-destructive migration policy and rollback. `historicalLineIdentityMappingQualified` MUST remain unsatisfied; this read-only profile has not resolved it.


## Owner-reported next-order-number property after one-time helper / 2026-09-22

**Direct owner-supplied output in this chat:** `NEXT_ORDER_NO=4308`. This is a decimal integer within JavaScript's safe-integer range, is at least 1001, and was produced *according to the owner* after receiving the narrowly scoped helper `trendosT12ReadNextSimpleOrderNoOnce_20260922` which reads only `TRENDOS_NEXT_SIMPLE_ORDER_NO`. The assistant did not access the Apps Script runtime, see the helper execution screen, independently attest project/deployment identity, or run the function. The owner did not supply a timestamped, coherent multi-system frozen snapshot or evidence that the helper file has been removed. Do NOT silently treat a reported output as direct connector-verified observation.

**Relation to earlier main workbook observations:** Earlier owner-confirmed operational Sheets ID-only, NON-ATOMIC reads had current Orders high-water 4304, archived Orders high-water 3761; the owner-reported property text 4308 is numerically above both. Those Sheets reads and this property result were not simultaneous and normal Google business creation may have continued. No missing-order anomaly or guarantee that business ID 4308 is unallocated can be established from this comparison. Specifically, do NOT reset the property to 4305 or advance/fix any old order.

**Seed status:** `scriptPropertiesNext` observation can now be recorded as **OWNER-REPORTED / HISTORICAL / NOT FROZEN**, not as `allocatorSeedPinned`. Production D1 mirror/actual binding/high-water, exact deployed V155 source and the effective bound-project/source identity, all five Google writer fences, full archived/current source consistency, R5 ownership and post-freeze final recheck are not qualified. No real Cloud CREATE order or D1 allocator seed was issued. The pure `reconcileT12OrderIdSeedEvidence` must NOT receive fabricated production D1 or same-snapshot source values just to produce a candidate.

**Safety and traceability:** This output is a single numeric Script Property value, not a dump of other properties or authentication tokens. The owner-side helper's code is read-only, but adding/saving its separate temporary `.gs` file would modify the Apps Script draft/Head. Do not assert that source was not edited; do not infer deployment or triggered execution changes without evidence. Any later removal of that temporary source file is a separate owner decision/action, not implied by this observation.


## Fresh read-only ID-column observation after owner counter output / 2026-09-22

**Sequential API reads from the owner-confirmed main workbook (NOT a frozen snapshot):** Connected Google Sheets metadata now reports grid row counts 698 current Orders, 754 current Lines, 2872 archived Orders, and 4111 archived Lines, each including header. A fresh pass retrieved **only column A displayed order number** across those four tabs, no customer, item, financial, status or private data, and computed these counts without persisting raw ID arrays:

| Tab | Displayed nonempty order-number rows | Numeric rows | Legacy/non-numeric rows | Maximum numeric order ID |
| --- | ---: | ---: | ---: | ---: |
| Current Orders | 697 | 684 | 13 | **4307** |
| Current Lines | 753 | 741 | 12 | **4307** |
| Archived Orders | 2871 | 2623 | 248 | **3761** |
| Archived Lines | 4110 | 3672 | 438 | **3761** |

At these separate read times, **no displayed numeric ID at or above the owner's reported property value 4308** was observed in those columns. The new current Orders and current Lines totals each have three more rows than the earlier provisional observations (earlier 694 and 750 non-header rows). This is compatible with continued business activity, but a row-count difference cannot identify who created rows or prove they are newly completed business orders. The user-provided property observation 4308 and these subsequent Sheets reads are **not atomic**; do not assert that 4308 remains the current unused next ID now or that a duplicate is impossible. The only established fact about that number is the owner's earlier one-time output.

**Bounded static source audit, source identity caveat:** The repository's `Code.gs` source and the owner's previously uploaded lossy V155 JSON both contain the function `makeOrderId_`, whose visible ASCII code reads `TRENDOS_NEXT_SIMPLE_ORDER_NO`, uses a sheet scan only on missing/zero property, derives `orderId=String(next)`, then calls `props.setProperty(key,String(next+1))` **before** returning the newly chosen order ID to the calling writer. The visible fallback `getNextSimpleOrderNumber_` scans current Orders and Lines only; it does not reference archived Orders/Lines in the observed function body. This is static code observation only: the uploaded purported V155 export is lossily encoded, does not prove deployed immutable source/version, and live deployment/runtime equivalence is not attested. A counter larger than a sequential Sheet maximum therefore is **not proof** of a missing customer order or a safe instruction to reset/reseed property.

**Still blocked:** No production D1 high-water/freshness/binding observation or final fenced snapshot; the actual deployed Version 155 source/Integrity flags and full lifecycle parity remain unqualified. Do not run any more create/replay tests or alter original Sheet/number property based on this comparison. The owner's helper output is historical, not a promise of an unallocated business ID.


## Owner-run Cloudflare D1 Query 2 catalog result / 2026-09-23

The owner supplied a cropped, owner-run SQL Console result for the prepared SELECT-only catalog Query 2 after visually confirming the `trendos-d1-api` Worker binding `DB` → `trendos-main` and showing all three required tables in Query 1. The screenshot visibly shows four expected tab-name rows and the first five result columns. Its far-right `reported_last_sync_at` and complete result grid are **off-screen due to horizontal scrolling**; no sync timestamp can be inferred. The screenshot does not itself show a database UUID, full query text or immutable deployment ID.

| Tab | catalog status | source_last_row including header | source_column_count | catalog row_count | actual counted sheet_rows |
| --- | --- | ---: | ---: | ---: | ---: |
| أرشيف الأوردرات | ready | 2765 | 71 | 2765 | 2765 |
| أرشيف بنود الأوردرات | ready | 3984 | 86 | 3984 | 3984 |
| الأوردرات | ready | 652 | 67 | 652 | 652 |
| بنود الأوردرات | ready | 708 | 82 | 708 | 708 |

**Observed result:** Within the shown D1 catalog snapshot, declared row counts equal the actual D1 `sheet_rows` counts for all four tabs, and statuses say `ready`. This establishes **internal D1 count consistency only**. It does NOT establish that the mirrored source row values are current, that the source spreadsheet and D1 were sampled atomically, or that content is correct. Earlier separate read-only Google workbook observations reported **698 current Orders, 754 current Lines, 2872 archived Orders, 4111 archived Lines, each including header**; those older independently sampled source counts exceed the shown D1 catalog values by **46, 46, 107, 127** rows respectively. Because source observations and D1 screenshot are from different times and `synced_at` is not visible, this is a **material freshness discrepancy to investigate**, NOT proof of a permanent lost order, wrong database, or an exact current lag amount. No missing rows should be inserted or the mirror job restarted on this basis. `mirror-freshness-qualified` and `allocatorSeedPinned` remain **UNVERIFIED/BLOCKED**.

**Next single read-only step:** In the same Query 2 result, drag the bottom horizontal scrollbar fully to the right and send a cropped image showing the `tab_name` if possible and `reported_last_sync_at` for all four result rows. If the name column scrolls out, retain the row order shown above. Do not run Query 3 or 4, trigger R5, alter any table or adjust the Google next-number property until the dates and nature of this divergence have been reviewed. Google remains exclusive live business CREATE/number authority.
