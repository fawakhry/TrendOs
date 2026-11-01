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

Interpretation (ACC238/ACC240 strict read-only provider proof):
Cloudflare D1 documents the exact table name `_cf_KV` as a RESERVED storage
table (https://developers.cloudflare.com/d1/best-practices/import-export-data/).
Do NOT query, modify, drop, or export its contents separately. The script
reports it in `tables` / `reservedStorageTables`, excludes ONLY this exact
name from `userTables`, and refuses every other unknown table name (even a
lookalike starting `_cf_`). The owner's authenticated 2026-10-24 read-only
inspection of UUID `c2fe1a54-90f5-4e6f-9d51-80ce23e21328` returned
`tables=["_cf_KV"]`; this is NO native finance schema yet.

- `EMPTY_STAGE_UNMIGRATED`: exact UUID confirmed, no application/user tables
  beyond Cloudflare's exact reserved `_cf_KV`; NOT authorization to apply.
  Owner-confirmed exclusive window and private backup restore are still required.
- `NONEMPTY_SCHEMA_UNQUALIFIED_STOP`: unexpected, missing, or mixed tables;
  `schemaApplied=false`. STOP — no reapply, drops, or guessed repairs.
- `NATIVE_SCHEMA_VERIFIED_WRITES_OFF`: all 22 original native table names
  match locally reconstructed migrations, native control mode is OFF, deny
  canary remains closed, and required invoice columns exist. This is still
  NOT a provider backup/restore qualification or a financial GO.
- Wrong UUID, malformed provider response or unsafe native control fails
  closed with an error.

Regardless of status, `mayApplyMigrations=false`,
`backupAndRestoreVerified=false`, `financeRelease=NO_GO`,
`financeWrites=OFF`. Do not reapply to any nonempty database.
This gate rejects the wrong account/UUID even if the display name matches.

**Phase B2 — PRIVATE BACKUP + LOCAL RESTORE, STILL NO D1 WRITES
(ACC241).** Only after `inspect` shows the exact expected UUID,
`userTables=[]`, and `inspectState=EMPTY_STAGE_UNMIGRATED`. This action
rechecks the provider before export; rejects any user table / mixed DB;
creates an SQL export in a protected local directory; restores it into
independent, disposable SQLite; validates integrity, foreign keys and no
application tables; hashes the protected export; rechecks live table names
for concurrent drift; and writes protected local JSON evidence.
It **never** issues remote SQL DDL, a Worker deployment or a finance POST.
The SQL file stays on the operator's Ubuntu machine: NEVER paste/upload its
contents, tokens or original finance data into chat/GitHub.

Use the verified local Wrangler binary. Run from the **newest tested
read-only ACC241 checkout**, not the stale detached ACC240 worktree:

```bash
cd "$HOME/TrendOs-finance-inspect-acc241"
umask 077
WRANGLER="$HOME/.local/share/trendos-finance-tools/node_modules/.bin/wrangler"
BACKUP_DIR="$HOME/.private-easystore-stage/backup-only-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$HOME/.private-easystore-stage"
chmod 700 "$HOME/.private-easystore-stage"
mkdir -m 700 "$BACKUP_DIR"
PYTHONDONTWRITEBYTECODE=1 python3 \
  cloudflare-d1/easystore-finance-stage/stage_d1_bootstrap.py \
  backup-verify \
  --private-backup-dir "$BACKUP_DIR" \
  --confirm-stage-uuid c2fe1a54-90f5-4e6f-9d51-80ce23e21328 \
  --wrangler "$WRANGLER"
```

Expected `result=STAGE_EXPORT_RESTORED_LOCALLY_ONLY`, private
`stage_before_migration.sql` (0600) and `stage_backup_evidence.json`
(0600). Do not send the SQL export to anyone. Do not claim independent
Ubuntu disaster recovery: `independentSecondHostRestore=NOT_RUN` until
a separate restore has actually been tested securely. This action
does NOT sign off on a future schema apply — it must take its own fresh
protected pre-migration export and explicit owner approval.

If export, restore, permissions, stage UUID, empty-schema check or
post-export live schema recheck fails, STOP; leave the private evidence/
partial file for secure local review. Do not retry `apply` as a fix.

## ACC281 — Phase B3: backup and locally restore the EXISTING 22-table native Stage

After ACC228-DB-31 already applied and verified **all 22 original accounting
tables** on this exact Stage, do **NOT** rerun migration apply/resume or use
Phase B2's historical expectation of an empty database. The EXISTING same
`stage_d1_bootstrap.py backup-verify` action has been hardened on finance
candidate commit `1a7c2e2d36d3f301f798b74e12cc348566049235` for an exact,
seed-only 22-table native Stage, while preserving its historic empty-Stage
behavior. The same existing Stage/bootstrap regression suite qualified it
offline; it has **NOT** made a current real Cloudflare backup yet.

Run only from the owner's authenticated Ubuntu Wrangler, without touching
the active `$HOME/TrendOs`, `TrendOs-ops-pilot`, server sandbox, or
production D1. The following creates a fresh detached worktree with exact
tested source (if not already present) and a protected backup folder.
Never paste the export or account credentials into chat or GitHub:

```bash
git -C "$HOME/TrendOs" fetch origin feature/acc268-easystore-standalone-customer-source-off-20261030
git -C "$HOME/TrendOs" worktree add --detach \
  "$HOME/TrendOs-finance-backup-acc281" \
  1a7c2e2d36d3f301f798b74e12cc348566049235
cd "$HOME/TrendOs-finance-backup-acc281"
umask 077
WRANGLER="$HOME/.local/share/trendos-finance-tools/node_modules/.bin/wrangler"
test -x "$WRANGLER" || { echo "LOCAL_WRANGLER_NOT_PRESENT"; exit 1; }
mkdir -p "$HOME/.private-easystore-stage"
chmod 700 "$HOME/.private-easystore-stage"
BACKUP_DIR="$HOME/.private-easystore-stage/current-verified-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -m 700 "$BACKUP_DIR"
PYTHONDONTWRITEBYTECODE=1 python3 \
  cloudflare-d1/easystore-finance-stage/stage_d1_bootstrap.py \
  backup-verify --private-backup-dir "$BACKUP_DIR" \
  --confirm-stage-uuid c2fe1a54-90f5-4e6f-9d51-80ce23e21328 \
  --wrangler "$WRANGLER"
```

Expected **only after actual owner run**:
`result=STAGE_22_TABLE_SCHEMA_EXPORT_RESTORED_LOCALLY_ONLY`,
`backup.restoredTables=22`, `privateLocalRestoreIntegrity=PASS`,
`schemaApplied=true`, `mayApplyMigrations=false`,
`cloudflareWrites=false`, `financeRelease=NO_GO`,
`independentSecondHostRestore=NOT_RUN`. The private 0600 SQL file is
`stage_current_verified_original_schema.sql` and private 0600 summary is
`stage_backup_evidence.json`. The protected SQL contains **real D1 export**
content and must stay private. The script refuses incomplete/foreign tables,
changed actual D1 finance control, missing baseline seed, any non-seed
business rows, malformed export, schema mismatch, FK/integrity failures,
changes during export and unapproved target UUID. It does not upload the
SQL anywhere, encrypt it or certify backup on a **different host**.
Additional independent encrypted transfer, second-device restore, and
verified hash are separately required BEFORE a qualified R2 Stage write
and eventual actual production release. Failure leaves finance OFF;
never run `apply` to repair a backup failure.

### ACC282 — backup certification integrity hardening (OFFLINE CHECKS ONLY)

The exact reviewed Stage source at commit `1a7c2e2d36d3f301f798b74e12cc348566049235`
adds strict comparison of ALL user-defined SQLite objects (tables, indexes,
triggers and views) before export, inside independently restored private SQL,
and after export; it exempts only the exact Cloudflare-reserved `_cf_KV`
storage table. The restored native write-canary record must itself equal
`(enabled=1, max_commands=0, commands_started=0)` rather than merely have
one row. Negative tests inject unexpected provider indexes/views/triggers,
an export-only index, and an export-only raised finance write budget.
The existing **20/20 source-only workflow runs** finished SUCCESS at
`1a7c2e2d36d3f301f798b74e12cc348566049235`, including original ACC234 Stage test
[#41299955291](https://github.com/fawakhry/TrendOs/actions/runs/41299955291).
No provider connection, remote backup, encryption, second-host restore,
financial POST, deployment, or merge occurred from these tests.

The above detached-worktree command now pins this newer exact tested source.
The earlier ACC281 initial qualification was at
`415a4540cdebbbbe0a8b4aebbdccb05b6c9087cc`; historical evidence
is retained in the canonical EasyStore book. Current owner-local Stage
backup and independent encrypted recovery test are both still NOT RUN;
`FINANCE_RELEASE=NO_GO`, `FINANCE_WRITES=OFF`.

---

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

### ACC283 — owner Ubuntu screenshot of real Stage 22-table backup, pending independent restore (2026-11-01 Cairo)

The owner supplied a screenshot of the **local Ubuntu terminal result**, after running
the ACC282 pinned detached-worktree Phase B3 command. Visible terminal JSON
includes `result=STAGE_22_TABLE_SCHEMA_EXPORT_RESTORED_LOCALLY_ONLY`,
`schemaApplied=true`, `workerDeployed=false`, the exact existing Stage
database identity, and the terminal prompt returned without an error. The
`backup-verify` code emits this success result only after export, local
disposable SQLite restore, original 22-table parity/seed checks, SHA evidence,
and the second read of the provider. The top portion of the JSON was outside
the screenshot: the private SQL hash, individual `backup.restoredTables`
and `privateLocalRestoreIntegrity` fields were **not independently read**
from the protected evidence file by this assistant.

**Evidence level:** `OWNER_TERMINAL_SCREENSHOT_PASS` (not independent
provider access or second-host disaster-recovery attestation). Do not paste
private SQL, hashes, tokens or paths into GitHub/chat. Keep all files under
the owner's private 0700 directory, with SQL/evidence mode 0600. Do not rerun
`apply` or `resume`; the 22-table Stage has already been migrated.

**New checkpoint:** `REAL_OWNER_CURRENT_22_TABLE_STAGE_EXPORT=OWNER_SCREENSHOT_SUCCESS`;
`PRIVATE_SQL_EVIDENCE_CROSSCHECK=OWNER_LOCAL_CHECK_PENDING`;
`INDEPENDENT_SECOND_HOST_ENCRYPTED_RESTORE=NOT_RUN`;
`STAGE_G1_REAL_EMPLOYEE=NOT_PROVISIONED`;
`FINANCE_WRITES=OFF`; `FINANCE_RELEASE=NO_GO`.
Earlier ACC281/ACC282 'NOT_RUN' entries are historical and superseded
**only for the owner-local backup run**, not for independent recovery.

**Next action:** Locally cross-check the private evidence file, backup SQL
hash, restored table count and OFF flags without exposing the SQL. Then
encrypt locally and copy only the encrypted backup through an owner-controlled
channel to a physically separate machine. On that second device compare
SHA-256 with the privately retained original and restore into disposable,
unshared SQLite; check schema/rows/FK/integrity before G3 may qualify. Never
claim independent recovery from the original machine's in-memory restore,
a screenshot, offline GitHub Actions or an encrypted file merely copied but
not actually restored.

### ACC284 — owner independently crosschecked the actual private backup on Ubuntu (2026-11-01 Cairo)

The owner supplied a SECOND terminal screenshot after executing the local
Python verifier in ACC283's handoff. Visible output:

```text
LOCAL_BACKUP_CHECK=PASS
RESTORED_TABLES=22
FINANCE=OFF
```

The verifier selected the latest `current-verified-*` protected owner folder,
read its local `stage_backup_evidence.json`, required the exact native 22-table
backup success result, 22 restored and 22 named original tables, local
SQLite-restore integrity PASS, native finance OFF / NO_GO, no Cloudflare
writes or Worker deploy, exact `0700` directory and `0600` private files,
and independently recomputed the SQL's SHA-256 against its protected
evidence hash. The terminal returned these three success lines without
traceback. This **owner-local evidence crosscheck is now PASS**, superseding
ACC283's PENDING flag. The assistant did not read the confidential SQL,
hash or owner provider session.

**Evidence state:** `REAL_OWNER_CURRENT_22_TABLE_STAGE_EXPORT=OWNER_SCREENSHOT_SUCCESS`;
`PRIVATE_SQL_EVIDENCE_CROSSCHECK=OWNER_LOCAL_PASS`;
`INDEPENDENT_SECOND_HOST_ENCRYPTED_RESTORE=NOT_RUN`;
`FINANCE_WRITES=OFF`, `FINANCE_RELEASE=NO_GO`. No change to G1 staff
provisioning, actual customer/supplier cash writes or production.

**Next phase B4 is owner-local encryption, not a second-host test.**
Do not send files, passphrases or raw hashes in chat or commit them. On the
same Ubuntu source, select the same latest certified private folder and
create an owner-only GnuPG AES256 encrypted tar stream containing ONLY
`stage_current_verified_original_schema.sql` and
`stage_backup_evidence.json`. This does not create an additional plaintext
archive:

```bash
(
set -euo pipefail
command -v gpg >/dev/null || { echo "GPG_NOT_INSTALLED"; exit 1; }
umask 077
ROOT="$HOME/.private-easystore-stage"
mapfile -t dirs < <(find "$ROOT" -mindepth 1 -maxdepth 1 -type d -name 'current-verified-*' | sort)
test "${#dirs[@]}" -gt 0 || { echo "VERIFIED_BACKUP_FOLDER_NOT_FOUND"; exit 1; }
BACKUP_DIR="${dirs[${#dirs[@]}-1]}"
test -f "$BACKUP_DIR/stage_current_verified_original_schema.sql"
test -f "$BACKUP_DIR/stage_backup_evidence.json"
test ! -L "$BACKUP_DIR/stage_current_verified_original_schema.sql"
test ! -L "$BACKUP_DIR/stage_backup_evidence.json"
OUT="$ROOT/easystore-stage-dr-$(date -u +%Y%m%dT%H%M%SZ).tar.gpg"
test ! -e "$OUT"
tar -C "$BACKUP_DIR" -cf - \
  stage_current_verified_original_schema.sql \
  stage_backup_evidence.json \
  | gpg --no-symkey-cache --symmetric --cipher-algo AES256 --output "$OUT"
test -s "$OUT"
test "$(stat -c %a "$OUT")" = 600
printf 'ENCRYPTED_BACKUP_READY=PASS\nTRANSFER_STATUS=NOT_RUN\n'
printf 'ENCRYPTED_ARCHIVE_NAME=%s\n' "$(basename "$OUT")"
)
```

Use a **new long unique passphrase**, entered only in GnuPG's interactive
pinentry UI, not the phone PBX PIN or any passphrase reused in another
service. Save the passphrase securely away from the encrypted copy; do not
place it in shell arguments, history, chat, GitHub, or in the same USB
drive. Copy **only** the `.tar.gpg` ciphertext through an owner-controlled
USB/SSH method to a truly different device; verify ciphertext SHA-256 source
vs destination. On that *separate* machine decrypt to a temporary protected
RAM-backed `/dev/shm` directory, compare the decrypted SQL SHA-256 to its
protected evidence record, independently open SQL in fresh SQLite,
check `integrity_check`, `foreign_key_check`, 22 native tables, seed-only
rows, OFF finance control and zero canary budget, then remove the temporary
plaintext. Record **only PASS/FAIL**, exact host separation and date. Until
this has really happened, G3 disaster recovery remains OPEN.
