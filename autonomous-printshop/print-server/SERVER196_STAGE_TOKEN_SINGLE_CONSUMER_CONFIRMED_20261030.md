# SERVER-196 — isolated Ubuntu stage is sole owner-reported Service Token consumer

**Date:** 2026-10-30 (Africa/Cairo)
**Source:** owner answered `1` to the SERVER-195 consumer scope question.

## Confirmed by owner, not independently audited
- Existing token: `TrendOS Ubuntu Synthetic Stage`.
- Owner reports the token is used **only by the isolated Ubuntu staging workflow**, with no other applications or servers depending on this token.
- This considerably limits expected disruption from rotating the secret, but is not a complete deployment-wide inventory; do not infer anything about production credentials.
- Token lifetime refresh was independently verified: `Expires: November 6, 2026 at 09:27 PM` in dashboard; duration 168 hours, status Enabled. Renewal does not restore lost secret.
- Owner separately reported no longer having a copy of the current Client Secret. Cloudflare's original secret cannot normally be retrieved after initial display.
- The next proposed controlled remedy is to rotate the **existing** token's Client Secret, preserving token identity, Include policy and Block Everyone; this is a credential mutation and requires explicit owner approval before executing. The new one-time secret must be captured into a secure local store outside the repository and must never be pasted into chat, GitHub, logs, screenshots or command history. Prepare the destination before rotation.
- There has been **no owner approval for rotation yet**, so no Cloudflare mutation, new token, policy change, Worker GET, deployment, production activity or PR merge is authorized.
- Cloudflare case `02394197`: earlier erroneous wrong-token-binding theory retracted; stale pre-rotation secret remains a hypothesis, not verified root cause.
- PR #190 checked: Open/Draft, not merged.

`SERVER196_OWNER_REPORTS_SINGLE_CONSUMER=YES`; `CLIENT_SECRET_COPY=UNAVAILABLE`; `ROTATION=NOT_YET_APPROVED`; `PRODUCTION=UNTOUCHED`; `PR190=OPEN_DRAFT`.
