# ACC237 — Stage D1 bootstrap operator procedure (not the finance master book)

**Canonical record:** `EASYSTORE_ACCOUNTING_MASTER_BOOK.md` in `fawakhry/EasyStore`, append-only. This file is a runnable operating procedure, NOT an alternate project book.

Target is the **existing** Cloudflare D1:
`easystore-accounting-staging`, UUID
`c2fe1a54-90f5-4e6f-9d51-80ce23e21328`.
Do not recreate it. Do not use `trendos-main`, `trendos-staging`, or
`trendos-accounting-preview` as the accounting D1. Never run only migration
`0031`; the reviewed sequence is `0015`, then `0020` through `0031`
(13 original migration files). The account is the owner's existing Cloudflare
account, not a newly provisioned tenant.

## On the owner's Ubuntu host, under an authenticated Wrangler session

**Phase A — OFFLINE, always safe.** Confirm the checkout is up to date and
the script is the exact reviewed PR #211 code before touching Cloudflare.
Use a current supported Wrangler installed **locally** on Ubuntu. Log in via
Wrangler's own browser flow or the owner's secure shell environment. Never
send tokens, cookies, session values, worker secrets, or exports through chat,
GitHub Actions, commit history, or public file sharing.

```bash
git fetch origin
git checkout fix/acc214-accounting-read-scope-precutover-no-go-20261020
git pull --ff-only origin fix/acc214-accounting-read-scope-precutover-no-go-20261020
python3 cloudflare-d1/easystore-finance-stage/stage_d1_bootstrap.py plan
python3 cloudflare-d1/easystore-finance-stage/tests/stage_bootstrap_safety.test.py -v
```

**Phase B — PROVIDER INSPECTION (no SQL writes).** This requires private,
authenticated local Wrangler access to the same Cloudflare account. Print
ONLY the safe identity/table-name metadata, not backup contents or tokens.

```bash
python3 cloudflare-d1/easystore-finance-stage/stage_d1_bootstrap.py inspect
```

Interpretation: if the target has ANY table already, **STOP**. Do not reapply
migrations, drop tables, assume an empty balance, or import an empty database.
Identify the existing source and reconcile manually before any SQL. This gate
also rejects wrong account/UUID even if a database has the same display name.

**Phase C — EXPLICIT STAGE-ONLY SCHEMA APPLY.** Do this **only** after owner
authorization for a dedicated exclusive Stage change window, confirmation that
this is synthetic/not production data, and a recovery operator on Ubuntu.
The command is NOT called by GitHub Actions. Before even one remote DDL
statement it exports the current Stage D1 in full into a private local SQL
file, independently restores that export to disposable SQLite, checks its
integrity/empty state, and verifies the provider schema is still empty.

```bash
umask 077
BACKUP_DIR="$HOME/.private-easystore-stage/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -m 700 -p "$BACKUP_DIR"
python3 cloudflare-d1/easystore-finance-stage/stage_d1_bootstrap.py apply \
  --private-backup-dir "$BACKUP_DIR" \
  --confirm-stage-uuid c2fe1a54-90f5-4e6f-9d51-80ce23e21328 \
  --exclusive-stage-window EXCLUSIVE_STAGE_CHANGE_WINDOW
```

Every applied migration must return explicit provider success. After the
13 files, the script independently checks exact 22 original accounting
tables, `mode=OFF`, the original canary deny budget, and `0031` invoice
columns. A successful command writes a **private** `stage_schema_evidence.json`
and protected `pre_migration_original_stage.sql` with SHA-256 hash. The
script never publishes Workers, manages secrets or sends orders/payments.

If any stage changes midway, or an export/restore/query/schema check fails:
**STOP, do not rerun**. The DB may be partially migrated. No automatic
Time Travel restore is issued; review the protected SQL export, partial
migration list and Cloudflare provider state with the owner. A destructive
point-in-time restoration requires a separately approved recovery action.
Cloudflare's Time Travel retention has plan/backend conditions; **do not
assume** a recovery bookmark exists without verifying it.

After success, test that protected evidence and backup can be restored onto
an **independent** Ubuntu machine. Until that separate recovery test and
opening-balance / Google Sheets reconciliation exist, this is NOT financial
disaster-recovery acceptance.

**Never do:** turn `FINANCE_WRITES` on; set `FINANCE_RELEASE=GO`;
run `wrangler deploy`; bind the finance Worker directly to
`trendos-staging`; merge PRs; publish `workers.dev`; disable Apps Script;
create fake zero opening balances as production accounting history; or use
real customers/money.

### After schema, but before any business transaction

The pending Stage release path is: private source Workers and separately
provisioned HMAC + original SSO fingerprint secrets; verified native employee
roles (Rahma/Revan cash recording, Diaa independent review); customer identity
**plus official order/customer ownership** from the original T12 system;
approved printing/laser line provenance via existing
`ACCOUNTING_CONNECTOR_CONTRACT_V1`; Stage-only synthetic order →
one original final invoice → one original cash receipt; duplicate and
employee access tests; reconcile original Google history and backup recovery.
The health-only finance Worker still **hard-denies all financial POSTs**.
Finance gates remain `G1-G5=OPEN`, `FINANCE_RELEASE=NO_GO`,
`FINANCE_WRITES=OFF`.
