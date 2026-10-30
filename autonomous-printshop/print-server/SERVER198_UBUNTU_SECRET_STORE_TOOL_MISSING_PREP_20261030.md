# SERVER-198 — Ubuntu secret-tool unavailable; safe-directory alternative proposed

**Date:** 2026-10-30 (Africa/Cairo); **source:** owner Ubuntu terminal screenshot, with unrelated Asterisk terminal lines not part of this work.

## Observation
- Owner ran read-only command `command -v secret-tool` check; terminal returned exactly `SECRET_STORE_TOOL=MISSING`. This reports **executable not found**, not that Ubuntu itself is missing a keyring or that any service credential was removed.
- Existing Service Token `TrendOS Ubuntu Synthetic Stage` was renewed to Nov 6 2026 (UI time), still has no authenticated call independently proven. User approved controlled rotation **after** safe storage is ready; no rotation has yet been observed.
- Rather than add software dependencies to a multi-purpose Ubuntu/Asterisk host, select a directory outside all repositories, readable only by the logged-in OS user:
```bash
install -d -m 700 "$HOME/.local/share/trendos-stage-secrets" && \
stat -c 'SECURE_DIR_PERMISSION=%a' "$HOME/.local/share/trendos-stage-secrets"
```
- This creates a mode 0700 directory **only**. It stores no credentials, does not access Cloudflare, and prints only directory mode. Actual store file, if later approved, must use mode 0600, resist accidental overwrite/symlinks and avoid secret echo, shell history and GitHub. Note that Linux file permissions are not at-rest encryption and root/backups may access the data.
- **Await owner terminal result** before giving a new command, browser click or asking for rotation. If expected `700` appears, plan one-time masked capture of newly issued secret after rotating, with no secret-bearing screenshots, logs or messages.
- No HTTP403 GET repeated, Cloudflare Access policy edit, token rotation, worker deployment, production changes, customer data reads, Asterisk restart or other telephony modifications requested/performed by this interaction.
- PR #190 verified Open/Draft and unmerged.

`SERVER198_SECRET_TOOL=MISSING`; `SECURE_DIRECTORY_CREATED=NOT_YET_CONFIRMED`; `ROTATE_SECRET=NOT_YET_EXECUTED`; `NEXT_STEP=OWNER_RUN_DIRECTORY_SETUP`; `PR190=OPEN_DRAFT`.
