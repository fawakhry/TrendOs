# ACC-192 — Daily reports, print/laser reconciliation and per-department day close

Date: 2026-10-12. Scope strictly limited to synthetic in-memory financial records.

This stage runs the actual unchanged TrendOS native accounting Worker plus committed migrations in disposable Node SQLite. It creates fake print and laser materials, fake customer invoices, and cash/Instapay receipts. Both department reports and the total report must reconcile sales, direct job cost, profit, remaining customer receivables, cash and Instapay. It checks that the aggregated report equals the sum of the departments and that an overall day close is rejected until each individual department is closed.

The successful closings are stored with the report SHA-256 and are idempotent: replay with another request key returns the original close. No false cashbox, stock or invoice changes are allowed. A fake verified service-role impersonating admin cannot close any finance day; when the backend is READONLY, closing must reject even for verified admin.

**Limitations:** No real employee, financial receipt, cash drawer, sale, bank, internet endpoint, Worker release, D1 remote, real day close or owner acceptance. Any temporary GENERAL setting exists only within discarded SQLite memory. Actual G4 operating acceptance remains OPEN. G1–G5 and release NO_GO.

ACC192 initially IN_PROGRESS_UNVERIFIED, pending exact-head PR and independent postmerge CI. Source-only test/CI/docs changes should be reviewed before merge.
