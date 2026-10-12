# ACC-193 — fresh accounting schema without imported historical transactions

Date: 2026-10-12. Isolated SQLite source qualification only.

The owner has chosen to start **new accounting books** without importing prior invoices or previous customer/supplier transactions. This decision does NOT authorize deleting old records or setting cash, custody, inventory and obligations to zero. It does NOT select a start date: `cutover_date_local` stays null until explicitly authorized real launch.

`tests/easystore_acc193_fresh_books_no_import_sqlite.test.mjs` creates a completely disposable in-memory SQLite database, seeds two clearly synthetic old rows in an unrelated legacy sentinel table, applies the exact committed accounting migrations (0015 and 0020–0030), and verifies key new accounting financial tables have no transactions. It also proves the fake old records stay unchanged, default backend control is OFF, canary command budget is zero, and ACC181 human sign-offs and cutover remain absent.

This is a **schema/source fixture**. It is NOT a real production backup, reconciliation of physical stock/cash/custody/liabilities, review of prior unpaid obligations, data purge, import, financial transaction, real date decision, or acceptance of the actual accounting opening.

GitHub workflow is contents:read and no-credential, with Node SQLite :memory: only; NO DEPLOY and release NO_GO. G1–G5 stay OPEN. Stage initially IN_PROGRESS_UNVERIFIED until real commit, PR and CI are checked.
