# SERVER-190 — Cloudflare Service Token expiration observed in owner dashboard (read-only)

**Date:** 2026-10-30 (Africa/Cairo). **Source:** owner screenshot of Cloudflare Zero Trust > Access controls > Service credentials > Service Tokens.

## Verified visible facts

- Exactly one service token row shown: `TrendOS Ubuntu Synthetic Stage`.
- Status pill: `Enabled`.
- Created: `October 23, 2026 at 04:25 PM` (UI timezone unspecified).
- Expires: **`October 30, 2026 at 03:25 PM`** (UI timezone unspecified).
- Last Seen: `Not Seen Yet`.
- Duration: `168h` (7 days).
- Screenshot was shared on evening October 30 in the owner's locale; visible expiry time is already past in that context. However, UI time zone is not explicitly shown; exact current token validity should not be asserted from the Enabled pill alone.

## Interpretation & next controlled UI step

- Cloudflare docs explain service token duration/expiry as separate from the enabled flag; dashboard supports **Refresh** to extend expiration by a year or Edit Duration to select another lifetime. A **Refresh** is distinct from secret rotation (which generates a new Client Secret). [Docs](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/).
- Since no owner approval has yet been given to renew/change a credential, **no Cloudflare mutation performed**. The safe single next action is clicking the **three-dot action menu** for the existing token and showing its available options, without selecting a modifying action.
- Do not create another token, rotate secret, change policy, remove Block Everyone, retry HTTP403, or expose Client ID / Client Secret. A future renewal (if approved) addresses lifetime but **does not validate or replace a potentially stale saved Ubuntu Client Secret**. After lifetime confirmed, verify Ubuntu stage's locally stored secret provenance without printing/entering it in chat.

## State

`SERVER190_TOKEN_ENABLED_VISIBLE=YES`; `EXPIRES_UI=2026-10-30_15:25`; `LAST_SEEN=NOT_SEEN_YET`; `TOKEN_RENEWED=NO`; `SECURITY_MUTATION=NO`; `NEW_GET_PROBES=0`; `ROOT_CAUSE_HTTP403=STILL_UNVERIFIED`; `PR190=DO_NOT_MERGE`.
