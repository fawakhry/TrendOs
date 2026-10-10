# ACC-181 — G3 owner direction: new accounting books, no historical import

**Date:** 2026-10-10 | **Source:** owner response in project chat: "من الصفر" to the explicit choice between starting fresh vs migrating old finances.

## Exact decision and limits

**Agreed business direction:** start new EasyStore/TrendOS accounting books from scratch; **do not migrate old customers/suppliers' outstanding balances, historic transactions, invoices or old accounting periods as the new opening financial ledger**. Keep existing accounting archives outside the new active ledger available for audit, legal obligations, collections and lookup. There has been **no authorization to delete, truncate, zero, purge, reset or overwrite any existing production D1 table, Apps Script/Google Sheet or physical stock count**, or to waive a legally outstanding debt. The owner's choice is a **cutover strategy**, not a command to perform destructive operations.

**What is not decided yet:** exact start date/time for the new books (Egypt local time); whether real physical opening stock should be loaded after a stocktake and at what valuation; who is custodian of real opening cash and any assets; operational treatment and separation of unpaid old creditors/customers; owner signature accepting opening balances and the source evidence of "zero" as distinct from no historic import. Such items may legitimately remain physically nonzero even though no historical software import is requested. G3 remains OPEN.

**Do not confuse:** a new ledger with zero historic transaction import is not automatically a zero-count physical inventory or an empty real cashbox. Don't erase an existing debt or make customers think payment is waived. If genuinely all opening financial balances are to be zero, collect an owner-approved date-specific attestation and evidence. Any physical inventory quantity opened must be traced to a signed stocktake/cutover event and source valuation instead of a made-up amount or financial import.

## Implementation and fail-closed proof

- `docs/trendos/staging/ACC181_G3_ZERO_OPENING_DECISION.json` is the owner intent record, explicitly marking no historical import/no live delete and leaving date, stock, cash, old liabilities, staff grants and final scope signoff **pending**, `release_decision: NO_GO`.
- `scripts/acc181_zero_opening_direction_preflight.mjs` enforces the unactivated scope of this record. If someone silently changes the file to say "signed" or starts a date/migration or permits a reset, CI fails rather than pretending the owner authorized it.
- `tests/acc181_zero_opening_direction_preflight.test.mjs` exercises denied actual data deletion, historical import, cutover date guessing, financial role broadening, fake owner approvals and GRANT/CANARY flags.
- `.github/workflows/easystore-acc181-g3-zero-opening-offline.yml` runs only read-only-source Node22 checks on the candidate, with no Cloudflare credentials, API financial POST, production database DML, Worker deployment, legacy data import, reset or migration.

## Owner follow-up — when to choose the start date (2026-10-10)

**Confirmed:** owner says **"وقت لما البرنامج يكمل نبدا بالتاريخ"**. Do **not** ask for, select, backdate, or auto-calculate an opening calendar date now. Choose the effective beginning of the new accounting books **at the actual, separately owner-approved financial go-live once the program and safety gates are ready**, in Egypt local time, recording the exact date/time and signoff then. Code/CI completion by itself is not a deployment command or owner authorization. No scheduled or automatic finance activation. Existing finance frontend OFF and backend READONLY remain in place until approved release.

## Remaining owner question

**The date will be selected on the approved financial launch day; none is requested from the owner today.** After that answer, the team needs a documented signed stocktake and cash/legacy-liabilities separation, zero-opening reconciliation, protected backup and separately approved controlled finance cutover. Marking past financial-data import **NOT REQUESTED** is valid; marking the entire financial opening **COMPLETED** now would be false.

G1 actual A2.13 close, G2 exact staff grants (#40), G3 approved dated opening cutover, G4 actual transaction acceptance and G5 verified production backup/rollback all remain OPEN. Frontend OFF, backend READONLY; production rows and staff unchanged.
