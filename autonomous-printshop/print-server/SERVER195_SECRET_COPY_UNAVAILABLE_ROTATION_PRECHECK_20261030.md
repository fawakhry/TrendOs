# SERVER-195 — Owner does not hold current Cloudflare Service Token Client Secret

**Date:** 2026-10-30 Africa/Cairo. **Evidence:** owner selected answer **2** = no securely saved copy of post-rotation Client Secret.

## Confirmed and limits
- Service Token `TrendOS Ubuntu Synthetic Stage` renewed by owner, dashboard confirmed expiry 2026-11-06 21:27 UI time and `Enabled`; still `Last Seen: Not Seen Yet`.
- Owner entered credentials manually at Ubuntu hidden prompt earlier and reports not possessing a current Client Secret copy. Neither secret value nor fingerprint was requested or revealed.
- Cannot recover an original Cloudflare Client Secret from the standard dashboard after its one-time display. A controlled `Rotate secret` of the existing token can issue a new Client Secret without changing Client ID or Access policy. Rotation is a **credential mutation** and might disrupt other consumers of this token.
- Official Cloudflare Service Token docs: https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/ . Rotation offers a grace period from 1 hour to 30 days for the existing secret, or immediate revocation. Client ID remains the same. Do not assume current token is used only by Ubuntu isolated stage.

## Pre-change safeguard
Ask owner exactly one question: Is `TrendOS Ubuntu Synthetic Stage` used exclusively for the isolated Ubuntu staging diagnostic, or do any other applications/servers use it? **Do not rotate** until scope and explicit owner authorization are clear. If rotation later approved: prepare a safe local credential-storage method **before** action, capture the new secret exactly once into the secure store, never print or paste it into a chat, shell history, screenshot, or GitHub. Do not create parallel tokens, change policy Include/Block, run repeat GET tests, or deploy.
- Support case 02394197 remains unresolved as a matter of verification, despite vendor's stale-secret hypothesis.
- PR #190 verified open/draft and unmerged when logging.

`SERVER195_CURRENT_SECRET_COPY=NOT_AVAILABLE_OWNER_REPORT`; `ROTATION=NOT_APPROVED`; `EFFECT_ON_OTHER_CONSUMERS=UNKNOWN`; `CREDENTIALS_EXPOSED=NO`; `NEXT_STEP=ASCERTAIN_TOKEN_CONSUMERS`; `PR190=OPEN_DRAFT`.
