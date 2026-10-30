# SERVER-191 — Cloudflare service-token menu reviewed, no mutation

- Date: 2026-10-30 Africa/Cairo.
- Owner screenshot of Zero Trust Service Tokens row shows existing token `TrendOS Ubuntu Synthetic Stage`, status Enabled, expires October 30 2026 03:25 PM (as displayed), Last Seen `Not Seen Yet`.
- The open three-dot menu has Edit, Refresh token, Rotate secret, Disable token, Copy as JSON, Copy as cURL, Delete token.
- Official Cloudflare documentation distinguishes `Refresh token` (extend current token expiry by one year) from `Rotate secret` (generate new Client Secret with same Client ID). Reference: https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/
- No click on Refresh or Rotate has yet been observed. Renewal is a configuration mutation and requires owner approval. Even renewal would not confirm the Ubuntu-held Client Secret was issued after the October 23 21:09 UTC token change.
- Do not use Copy as JSON or Copy as cURL in chat/screenshots: these actions may expose credential material.
- No new Worker GET, policy edit, production operation, rotation, deployment or PR merge.

`SERVER191_MENU_VISIBLE=YES`; `RENEWAL=NOT_AUTHORIZED_YET`; `MUTATION=NONE`; `SECRET_ROTATION=NONE`; `ROOT_CAUSE_HTTP403=UNVERIFIED`; `PR190=OPEN_DRAFT`.
