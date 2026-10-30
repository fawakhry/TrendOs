# SERVER-201 — Cloudflare rotation confirmation dialog visible, owner instructed to save secret privately

**Date:** 2026-10-30 Africa/Cairo. **Evidence:** owner screenshot of Cloudflare Service Tokens rotation confirmation for the existing token `TrendOS Ubuntu Synthetic Stage`.

## Verified screenshot facts
- Modal title: `Rotate TrendOS Ubuntu Synthetic Stage?`
- Cloudflare states rotating creates a new Client Secret, and prompts for how long the current secret remains valid.
- Current option displayed: `Revoke immediately`; buttons `Cancel` and red `Rotate`.
- **No successful rotation and no new secret saved have yet been observed.** Screenshot is *pre*-confirmation.

## Owner-approved next action & safeguards
- Owner had explicitly approved controlled rotation after secret-store preparation; Ubuntu protected directory mode 700 and syntax-validated capture helper were verified in prior SERVER-199/SERVER-200.
- Owner reports token only used for isolated Ubuntu stage and old secret is unavailable. Recommended retaining `Revoke immediately`, then clicking `Rotate` once. Old secret is revoked at the operation and any unknown external consumers would lose authentication. No additional token or policy change requested.
- If Cloudflare displays newly generated Client Secret, do **not** close page or share screenshot; copy only Client Secret and execute `bash "$HOME/.local/share/trendos-stage-secrets/save-new-secret.sh"` in Ubuntu terminal. Paste secret into hidden prompt and verify only `SECRET_SAVED=YES` and `SECRET_FILE_PERMISSION=600` output. If saving fails, preserve the one-time-display screen without showing secret to assistant and report only sanitized error.
- The local file is protected by OS permissions but not encrypted at rest. Do not paste Client ID, Client Secret, private credential values or screenshots into conversation, email or GitHub.
- No repeated Worker HTTP403 GET; do not change Service Auth/Block Everyone, Asterisk, production, billing, orders, or deploy code. PR #190 was Open/Draft at check.

`SERVER201_ROTATION_DIALOG=VISIBLE`; `ROTATION=NOT_YET_VERIFIED`; `SECRET_CAPTURE=NOT_YET_VERIFIED`; `NEXT=ONE_TIME_ROTATION_AND_LOCAL_SAVE`; `PR190=OPEN_DRAFT`.
