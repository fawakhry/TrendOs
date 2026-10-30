# SERVER-194 — Ubuntu stage Service Token Client Secret entered manually

**Date:** 2026-10-30 (Africa/Cairo). **Source:** owner answered option `3` to the question of how the Client Secret was used in prior tests.

## Owner-reported facts
- Stage diagnostic on Ubuntu was run with manual copy/paste of the `CF-Access-Client-Secret` at the hidden interactive prompt. The owner has **not** confirmed that any secret is persisted on Ubuntu.
- This does **not** establish whether the copied secret was issued before or after Cloudflare's 2026-10-23 21:09 UTC token update; it also does not prove that the token was authenticated at Access.
- The existing token `TrendOS Ubuntu Synthetic Stage` expiry was independently verified extended to 2026-11-06 21:27 as displayed in Cloudflare UI. Extension does **not** automatically rotate or validate the prior secret.

## No-secret next step
- Ask owner only whether they **still have a securely saved copy of the Client Secret issued after the 21:09 UTC modification on 2026-10-23**, or whether its issuance date is unknown. Response should be `yes / no / unsure`; **never** request credential values, hashes, screenshots, or paste of shell history.
- If no safe current copy exists, consider a controlled secret rotation only after reviewing impact on any existing users and obtaining owner's explicit approval. Do not create a second token or alter Service Auth / Block policies.
- No new Worker GET, Cloudflare mutation, token rotation, production traffic, PR merge or Ubuntu credential inspection performed.

`SERVER194_SECRET_ENTRY=MANUAL_HIDDEN_PROMPT`; `LOCAL_SECRET_PERSISTENCE=UNCONFIRMED`; `POST_ROTATION_SECRET_PROVENANCE=UNKNOWN`; `NEXT_OWNER_QUESTION=DO_YOU_HOLD_POST_2109_SECRET`; `PR190=OPEN_DRAFT`.
