# SERVER-200 — Ubuntu one-time Cloudflare secret capture helper ready

**Evidence:** owner screenshot 2026-10-30 evening Africa/Cairo. Ubuntu terminal `trend-main@TrendosShop` shows the end of the `save-new-secret.sh` quoted here-doc and local syntax check, with final `CAPTURE_HELPER=READY` plus returned shell prompt. No credentials are visible or entered.

## Verified versus pending
- `$HOME/.local/share/trendos-stage-secrets` was previously confirmed mode 700 by Ubuntu `stat` (SERVER-199).
- The shell helper `$HOME/.local/share/trendos-stage-secrets/save-new-secret.sh` was created and `bash -n` passed. This validates syntax and execution of the setup command but does NOT demonstrate the helper's execution, token rotation, cloud sync, or a saved Client Secret.
- Helper uses hidden `read -r -s`, `umask 077`, refuses existing/symlink destination, `set -C` for no-clobber, writes a local file `cloudflare-client-secret` and checks mode 600. Linux permission-based storage is not encryption at rest. Never print or screenshot the credential.
- Existing token `TrendOS Ubuntu Synthetic Stage` is the sole owner-reported consumer on Ubuntu isolated staging. Owner explicitly approved rotation conditional on secure capture readiness. Cloudflare policy/bindings and Block Everyone remain unchanged.

## Next one safe owner action
- In Cloudflare dashboard Service Tokens row for `TrendOS Ubuntu Synthetic Stage`, open the three-dot menu and click **Rotate secret**. If a confirmation/options dialog opens, stop before final rotation and share only a redacted screenshot (no Client ID/Secret). If rotation occurs immediately and secret appears, **DO NOT screenshot or close it**; run the pre-created local capture helper under Ubuntu and paste secret once at its hidden prompt. Only report `SECRET_SAVED=YES` and `SECRET_FILE_PERMISSION=600`. Do not expose secrets in GitHub, chat, terminal command line or history.
- No rotation, Worker GET, policy change, production actions, PR merge recorded yet. PR #190 verified open/draft/unmerged.

`SERVER200_CAPTURE_HELPER_SYNTAX=READY`; `ROTATION=NOT_YET_OBSERVED`; `SECRET_SAVED=NO_PROOF`; `PR190=OPEN_DRAFT`.
