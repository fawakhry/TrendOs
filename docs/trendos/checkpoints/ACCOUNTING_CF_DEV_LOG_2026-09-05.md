# TrendOS Accounting + Cloudflare Development Log — 2026-09-05

Repository: `fawakhry/TrendOs`
Branch: `agent/go-live-2026-09-01-integrity`
Lane: TrendOS Accounting / isolated Cloudflare Preview
Owner request: develop the Accounting program and record every material step back into Black Box memory.

## Operating rule
Every material step in this lane must be recorded here before moving to the next material step. Production financial authority must not be changed implicitly.

## STEP ACCT-CF-00 — Canonical memory and source routing — PASS

**Action**
- Read `عقل_فوخا.md` / `FOKHA_BRAIN/اقرأني_أولا.md` and project routing.
- Read main `الصندوق الاسود.md` on the working branch.
- Read `TRENDOS_ACCOUNTING_BLACKBOX_2026-09-04.md`.
- Read the latest relevant execution-ledger checkpoint and Cloudflare preview workflow/config.
- Inspected `fawakhry/EasyStore` as the legacy accounting/inventory implementation source.

**Evidence / conclusions**
- TrendOS Accounting is a real application/program, not a spreadsheet product.
- Accounting scope includes sales, purchases, expenses, cashbox, suppliers, inventory, stock movements, items, BOM, recursive product formation, receivables/payables, factual profitability, income statement and owner financial dashboard.
- Order ID and Line ID are mandatory stable cross-module keys; factual line profitability is required.
- Partner/investor distribution percentages remain outside Accounting in Profit Engine / Partner Network.
- EasyStore is legacy implementation evidence to preserve useful workflows from, especially inventory/product-formation behavior; it is not the new canonical accounting architecture.
- Current Production remains protected: Google Sheets + Apps Script are authoritative for writes; Cloudflare/D1 is read/mirror/performance unless a later explicit cutover gate changes authority.
- Existing Cloudflare Preview workflow auto-deploys on working-branch changes under `cloudflare-d1/**`, uses the isolated `trendos-edge-gateway-preview` Worker, applies no D1 migrations, and requires Cloud Write OFF.

**Status**: PASS.

**Production impact**: NONE. Read-only source inspection and this documentation commit only.

**Rollback**: documentation-only; delete/revert this checkpoint if it is superseded by corrected evidence.

**Exact next step**
Implement `ACCT-CF-01`: an isolated TrendOS Accounting V0.1 Preview surface on the existing Preview Worker with:
1. `/accounting` Arabic-first application shell;
2. `/v1/accounting/health` read-only capability/authority contract;
3. modules surfaced for Dashboard, Sales, Purchases, Expenses, Cashbox, Inventory, BOM/Product Formation, Suppliers, Receivables/Payables and Reports;
4. zero authoritative financial writes and zero D1 schema migration;
5. explicit UI badge that Preview data is non-authoritative until the write contract/cutover is separately approved;
6. automated tests added before deployment.

Do not change Production traffic, Apps Script deployment, Script Properties, source Sheets, D1 schema/migrations, or Cloud Write authority in ACCT-CF-01.
