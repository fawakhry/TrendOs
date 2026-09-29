# TrendOS T12 — A61 live-head reconcile — Entry 486

Date: 2026-09-29 Cairo
Repository: `fawakhry/TrendOs`

## Decision
Do not replace Production Apps Script `Code.gs` wholesale from GitHub `main`.

A read-only export of the confirmed Production Apps Script HEAD was captured outside the editor. The live project contains 54 Apps Script files.

## Current evidence

```ini
PRODUCTION_VERSION=157
HEAD_READONLY_CAPTURE=YES
HEAD_PROJECT_FILE_COUNT=54
HEAD_CODE_SYNTAX=PASS
LIVE_HEAD_RUNTIME_FUNCTIONS=PASS
LIVE_HEAD_A61_BRIDGE=ABSENT
```

The live HEAD contains a Production-only save-timeout hotfix that is absent from current GitHub `main`. Therefore a full main-to-Production paste is unsafe.

## Additive A61 candidate

A candidate was built from the live HEAD and only the qualified A61 bridge delta was added.

```ini
LIVE_HEAD_BASE_SHA256=d41542a21c84fc495eac1e78e9f98407cb1cc41ab37b14a37b11bbde5de9284a
A61_CANDIDATE_SHA256=0980dd77395d2cc895d4344beb6db2156ad03fe1ee230fcea6c30c1ff393b295
A61_ADDED_LINES=229
CANDIDATE_SYNTAX=PASS
A61_BRIDGE_CONTRACT=PASS
PRODUCTION_HOTFIX_PRESERVED=YES
NORMALIZE_REMOVE_A61_EQUALS_LIVE_HEAD=YES
```

Exact additive patch:
`docs/trendos/blackbox/منصة ترند/TRENDOS_T12_A61_LIVE_HEAD_ADDITIVE_PATCH_2026-09-29.diff`

Patch commit:
`a1c855b52bf68ef070747d0842836ee6f4ce27aa`

## Safety boundary
No Apps Script source edit, Script Properties change, new version, deploy, D1 mutation, Cloudflare mutation, Order mutation, Customer mutation, or Accounting mutation was performed.

Immutable Version 157 source is still not captured. The accidental editor autosave therefore remains not byte-for-byte verified.

Do not deploy current GitHub `main/Code.gs` wholesale. Any Production install must preserve the live HEAD and apply only the recorded A61 additive delta.


## Backup-copy verification correction

A Drive copy request for the current Apps Script project returned a new file ID, but immediate metadata/readback on that returned ID produced `404 File not found`, and a title search did not find the copy.

Therefore the backup copy is **not accepted as verified evidence**.

```ini
PRODUCTION_BACKUP_COPY_REQUEST=RETURNED_SUCCESS
PRODUCTION_BACKUP_COPY_READBACK=FAILED_404
PRODUCTION_BACKUP_COPY_VERIFIED=NO
```

The independent read-only HEAD capture already held outside Apps Script remains the recovery artifact used for candidate construction.
