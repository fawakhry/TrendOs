# ACC211 — Owner delegated technical decisions / Phase-1 cash-only scope

Date: 2026-10-19. ACCOUNTING ONLY, NOT operational pilot or Print Server.
**Single canonical accounting book:** `fawakhry/EasyStore/EASYSTORE_ACCOUNTING_MASTER_BOOK.md`, existing [EasyStore Draft #71](https://github.com/fawakhry/EasyStore/pull/71). This document is an implementation checklist, NOT a new book or financial ledger.

## Delegation interpretation and implemented safe policy

The owner directed the agent to **implement all decisions in one pass** without interrupting the work. This is authority to select conservative technical defaults and prepare **source-only staging guards**; it does **not** supply real balances, private employee identities, customer consent, independent custody evidence, bank confirmation, immutable production artifact, or verified backup. Do not claim any of those from a chat message.

| Owner decision batch | Selected engineering policy / status |
|---|---|
| D1 G2 people and access | **Strict exact authenticated employee grants required** before any Phase-1 write; never infer "admin" from names, departments or request fields. Real employee roster and independent reviewer identities **UNSUPPLIED / PENDING**. |
| D2 G3 cutover | **No assumed zero balance** and no imported fake opening amount. Require a real start date and independently reconciled customer/supplier/cash/stock openings with signed evidence. **UNSUPPLIED / PENDING**. |
| D3 G4 Day 1 scope | **CHOSEN: restricted CASH sale creation and CASH customer collection only**, with exact immutable `customerId` and unique request ID; **all other money writes blocked**, including refunds, return, opening debts, supplier payment, manual credit and inventory stock/cost mutation. This is a scope decision, **NOT operational or production approval**. |
| D4 G4 refunds/item allocations | **DISALLOW** automatic refund, store-credit restoration, same-name customer matching, prorated item discount allocation, post-close debt correction, speculative overhead/waste. Preserve the owner's previous eight ACC187 policy principles unchanged; real item-specific evidence and costing/approvers pending. |
| D5 G1/G5 custody/backup | **Require two-person custody review, offline protected backup + independent isolated restore + recorded rollback** before any actual cash. Names, hashes, locations, restores, independent verifier signatures **UNSUPPLIED / PENDING**. |
| D6 RELEASE deployment | **No deployment, finance-mode activation, D1 migration, GitHub merge, or payment action authorized** without exact immutable version pin, verified staging acceptance, trusted operator and explicit verified financial go-live signoff. **PENDING**. |

## Actual optional server-only fail-closed implementation

`cloudflare-d1/src/employee-accounting-native-v1.mjs` adds `acc211Phase1WriteRejectionV1` before write-canary or any money handler. It is independent from existing OFF/READONLY/CANARY/GENERAL authoritative finance mode, verified SSO and current command-ledger/idempotency protections.

- Server env **`EASYSTORE_FINANCE_PHASE1_SCOPE_V1`** when **ABSENT/OFF**: preserve current behavior; existing finance-mode control's default is **OFF**, nothing new is authorized or enabled. No config deployed in this PR.
- **`READONLY_LOCK`**: deny all financial writes with 403, even when another finance control accidentally says GENERAL; still allow only original authenticated read actions.
- **`ENFORCE`**: extra narrow allowlist: original native `saveEasyStoreSaleV2` with exact official `customerId`, invoice and idempotency request key; original native `savePartyLedgerTransaction` ONLY with exact `partyType='customer'`, `operation='payment_received'`, official `customerId`, valid positive piastres and cash method. Both require **existing authoritative finance mode that already allows write**, authentic server session with FULL finance access and *server-only* `ACCOUNTING_FINANCE_GRANTS_MODE_V1=ENFORCE` plus valid exact owner-approved staff grants. **`EASYSTORE_CUSTOMER_CREDIT_V1` must be OFF** so no implicit customer advance/credit liability. Unknown/invalid env scope denies writes.
- Do not enable this env on production just because the repo or fake SQLite tests are green. `ENFORCE` is a future isolated stage feature. It is NOT a switch for allowing legacy receipt replay or sending a bank transfer as cash; existing exact request key / COMMITTED / PREPARED controls still govern.
- **Important limit:** the current native direct-sale and general accounting Worker are not independently qualified for real bank settlement, per-item payment allocation, post-day-close correction, returns, or actual cash custody. This restricted technical scope is not a substitute for G1–G5.

## Tested

Dedicated source-first `tests/easystore_acc211_delegated_safe_phase1_scope_real_native_sqlite_no_go.test.mjs` adapts the actual native finance worker, SQLite migrations and synthetic verified-session fixture from ACC187, with additional Phase-1 negative cases. It checks missing strict roster, forged body role, rejection of refunds, supplier payment, reopening, stock/cost writes, arbitrary opening debt and customer-name fallback; denies all money writes if customer-credit feature is ON; verifies genuine native cash sale and customer cash receipt **ONLY inside disposable fake SQLite** with mock owner roster; `READONLY_LOCK`, invalid env and D1 control READONLY override all writes. No Cloudflare D1, real staff or bank transaction. CI `.github/workflows/easystore-acc211-delegated-finance-phase1-no-go.yml`, plus existing finance regression suite and all BOOK19 tests.

## ACCEPTANCE STOP

Do not infer approvals for real staff identity, day-0 outstanding debt, opening money, taxes/overhead, actual return/refund cases, cash custodian, bank proofs or production deploy from blanket delegation. Save those as one grouped evidence packet, not six separate interruptions. **G1,G2,G3,G4,G5 OPEN; FINANCE_RELEASE=NO_GO; DEPLOYED=NO; LIVE_VERIFIED=NO; ALL NEW PRS DRAFT/UNMERGED.**



## ACC212 owner-confirmed decisions and guarded acceptance (2026-10-19)

Owner business decisions, now recorded in the original [EasyStore accounting book PR #71](https://github.com/fawakhry/EasyStore/pull/71): 2026-10-20 **target only**, restricted cash sale/collection first phase; cash custody and invoice creation are the responsibility of **رحمه وريفان**, with **ضياء** independent cash reviewer and prospective return approver. Zero opening is **conditional** on independent confirmation of no existing historic balances/liabilities/stock/cash, never assumed from missing source rows or this target date. Returns and customer credit payouts remain OFF; after close any approved correction uses a new immutable entry on an open day. Separate encrypted storage plus isolated Ubuntu restore must be demonstrated; first UI/system trial private and all-synthetic.

**ACC212 native extra guards implemented and offline green:** two separate Ed25519 signature verifications on exact *asserted zero-opening data and source hashes* are required when ACC211 `ENFORCE` is chosen, and exactly 2 separately authenticated cashier login IDs plus a different independent reviewer login ID must be supplied via private server-only configuration. No real account identifiers/public keys/actual proof have been supplied. Signing a FALSE zero claim is still possible in principle; never treat a cryptographically valid claimed hash as proof of real zero accounts without independent verified source reconciliation. The fake CI signer keys and fixture are NOT owner signoff. Legacy D1 finance control OFF/READONLY, private owner grants and FINANCE_RELEASE NO_GO remain independent hard stops.

**ACC212 synthetic G5 rehearsal:** `scripts/acc212_fake_encrypted_backup_restore.mjs` uses AES-256-GCM and a throwaway fake SQLite file; validates restored bytes and fake sums and rejects wrong keys/tamper. It only models two temporary paths on one host, NOT an actual external separate encrypted backup nor the owner's independent Ubuntu restore. Run locally with Node 22+: `node --test tests/easystore_acc212_fake_backup_and_opening_zero_no_go.test.mjs`; no data path argument accepted.

**Checked source:** TrendOS commit `d570e3860b9e937c28c7f1e253fd98eeae5dedb9` verified **15/15 GitHub Actions SUCCESS** including [ACC211/ACC212](https://github.com/fawakhry/TrendOs/actions/runs/39290942825) and [ACC207 release checker](https://github.com/fawakhry/TrendOs/actions/runs/39290942827). Existing tests are fake/synthetic and cannot attest actual books or stage. Public repository contains no real credentials or source keys. No GitHub merge/deploy/D1 finance configuration change or money movement.

**User answer acknowledged, external evidentiary gates not closed:** `G1–G5=OPEN; FINANCE_RELEASE=NO_GO; START_DATE=TARGET_ONLY; PROD_FINANCE=OFF; ALL_NEW_CODE=DRAFT_UNMERGED`.
