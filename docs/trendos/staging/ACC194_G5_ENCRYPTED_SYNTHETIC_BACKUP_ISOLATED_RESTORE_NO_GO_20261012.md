# ACC-194 — Encrypted synthetic financial SQLite backup and independent restore (G5 NO_GO)

Date 2026-10-12. Canonical accounting book is fawakhry/EasyStore on candidate/easystore-zero-google-audit-20261004, EASYSTORE_ACCOUNTING_MASTER_BOOK.md. This TrendOS markdown is a technical runbook, not the accounting ledger.

## Strictly isolated process

- Reuse real original finance migrations and fabricated material/supplier/request rows from successfully tested ACC-180. All data and files reside in automatically erased temporary local directories; no Cloudflare bindings, database access or credentials.
- Use ephemeral random encryption and authentication keys generated inside the test and never persisted in GitHub. Wrap fake SQL export using OpenSSL AES-256-CBC + PBKDF2 200,000 iterations, separately authenticate ciphertext with HMAC-SHA256. Test-only crypto design; production key custody/encryption/storage/retention policy is NOT approved.
- Check ciphertext integrity, independently decrypt and restore via the original ACC-180 strict source-schema/full-row fingerprint checker into a different discarded SQLite file. Also run a separate native SQLite backup and compare schema, contents, financial READONLY authority, zero canary allowance and SQLite integrity/foreign keys.
- Seven negative restore attempts: changed ciphertext byte, checksum recomputed after tamper but invalid MAC, wrong MAC key, wrong MAC digest, wrong decryption password, incorrect separately held source snapshot, and an attacker-created fresh encrypted bundle with GENERAL finance mode despite valid MAC. All must reject with no production contact.
- Upload only a sanitized JSON receipt recording digest/size, equality booleans and fake-test denial count. NEVER upload SQL, SQLite files, financial row data, encryption keys or tokens.

## Release remains blocked

No actual production D1 export, backup, encrypted key custody, restore, verification of a previous live Worker version, rollback or deployment happened. This cannot prove production RPO/RTO, independent real recovery or business acceptability. G1–G5 OPEN, finance release NO_GO, last observed frontend OFF/backend READONLY not freshly queried.

Stage ACC194 IN_PROGRESS_UNVERIFIED until exact-head PR+GitHub Actions and postmerge CI verify source tests and an append-only primary EasyStore canonical book record is completed. ACC-001–193 recovered historical accounting book with seven unverified earliest slot numbers remains unchanged.
