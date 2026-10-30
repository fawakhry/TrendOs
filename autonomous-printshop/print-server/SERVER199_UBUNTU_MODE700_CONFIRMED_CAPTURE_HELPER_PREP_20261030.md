# SERVER-199 — Ubuntu protected directory confirmed; prepare one-time secret capture helper

**Date:** 2026-10-30 (Africa/Cairo). Source: screenshot of Ubuntu terminal running under `trend-main`.

## Evidence
- User executed `install -d -m 700 "$HOME/.local/share/trendos-stage-secrets" && stat -c 'SECURE_DIR_PERMISSION=%a' "$HOME/.local/share/trendos-stage-secrets"`.
- Terminal returned **`SECURE_DIR_PERMISSION=700`**, and shell prompt returned normally. Protected secret directory exists; directory permission check passed. It contains no newly issued secret at this point.
- `secret-tool` unavailable per SERVER-198. This is an OS permissions-based storage path, NOT encrypted at rest.
- User has authorized rotating **existing** Cloudflare Stage Service Token after preparing secure storage; secret rotation has **not** yet occurred, and credential does not exist in the conversation or GitHub.
- Next safe preparation step: create a user-owned, mode-700 local-only helper script via quoted here-doc under the mode-700 secret directory, validating syntax with `bash -n` before rotation. Helper will prompt for the new secret with hidden `read -r -s`, avoid echo/history and refuse to overwrite an existing secret file; a new secret file is created with umask `077` and mode `600`. Never print content.
- Do not yet click `Rotate secret` or enter any existing credential. On success from helper-preparation step, ask owner to report only `CAPTURE_HELPER=READY` so we can then guide the Cloudflare one-time rotation and immediate private capture. Do not display a screenshot containing secret during or after the one-time reveal.
- Owner's screenshot also has Asterisk config output from a separate Trend Call Center workflow. This TrendOS token work must not modify Asterisk, its credentials, or restart telephony.
- PR #190 checked: open/draft and unmerged. No stage GET, production code/data, policy change, deployment, token rotation or secret exposed.

`SERVER199_DIRECTORY_700=CONFIRMED`; `CAPTURE_HELPER=NOT_YET_CREATED`; `ROTATION=NOT_YET_PERFORMED`; `PR190=OPEN_DRAFT`.
