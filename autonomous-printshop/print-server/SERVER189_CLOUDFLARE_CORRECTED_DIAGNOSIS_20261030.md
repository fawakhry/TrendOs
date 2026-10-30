# SERVER-189 — Cloudflare corrected diagnosis and closure warning

**Observed 2026-10-30 (Africa/Cairo)** by read-only Gmail search of the already connected Trend Mall inbox. **Case:** `02394197`. No new HTTP/Worker/GraphQL test.

## New vendor evidence

- **2026-10-28 13:51 UTC** engineer Prathyusha, technical reply: Cloudflare account has **exactly one** Service Token; its audit history shows creation on 2026-10-23 13:25 UTC and modifications at 16:39 and **21:09 UTC**. The token selected by the Access policy `TrendOS Ubuntu Stage - Service Auth` is therefore the only token available, not a second token as asserted in the October 26 reply.
- Engineer expressly **retracted the October 26 "wrong token bound" conclusion** as an inference from service-token name versus Worker name; she did **not** verify that assertion from an edge/Access log entry for the exact `CF-Ray=a4f3feba8f550b96-MRS`.
- **Hypothesis, not verified root cause:** the failed request at ~21:57 UTC may have used the old Client Secret if the 21:09 UTC modification was a rotation. Equal Client IDs are compatible with a stale Client Secret. The 48-minute interval is suggestive, not a definitive Access event decision. Engineer also inferred pre-Worker Access rejection from the HTML403 and earlier lack of invocation; independent latest-Ray proof remains unavailable.
- Engineer requests **read-only checks, without new HTTP requests:** (1) verify Service Auth policy is associated with Access application, not merely saved; (2) verify server holds secret issued after the 21:09 modification. No secret contents may appear in chat, Gmail, log, GitHub or screenshots.
- Vendor says Access protection of exact `workers.dev` hostname is supported. If the **current** secret still yields 403, vendor requests a **fresh Ray + UTC time** to trace. DO NOT run this probe until owner authorizes a single, safe stage-only request after the read-only verification.
- **2026-10-29 13:51 UTC:** Cloudflare automated `Closing soon` notice says case may become Resolved after two additional business days with no response. Current case status cannot be established from an email alone. A follow-up reply may be appropriate to preserve the case; **none was sent as part of SERVER-189**.
- Earlier Cloudflare token expiration reminder dated 2026-10-23 says `TrendOS Ubuntu Synthetic Stage` expires in one week, indicating around 2026-10-30. **Actual present expiration/status must be read from Cloudflare before any further test; do not assume still valid.**

## Safeguards and next safe action

1. Keep the `TrendOS isolated stage - DENY ALL - S87` Access policy design fail-closed: preserve both Service Auth and Block Everyone; **do not** change policy bindings based on the retracted October 26 assertion.
2. When authorized, inspect current policy association, token expiration, and local secret **provenance/timestamp only**, without exposing any token contents. Do not rotate or deploy without owner approval.
3. Case `02394197` must remain open pending corroboration. Reply to the existing support case if needed; never duplicate ticket.
4. PR #190 remains **Open/Draft**, no merge, no staging/production change in this entry.

**Sources:** user-connected Gmail, technical response 2026-10-28 (message 1a182c7d447e0cd8), closure-warning 2026-10-29 (message 1a187ee5bf4e405d). See prior SERVER-188.

`SERVER189_VENDOR_RETRACTION=YES`; `ROOT_CAUSE=STALE_SECRET_POSSIBLE_NOT_PROVEN`; `ACCESS_POLICY_CHANGE=NO`; `SERVICE_TOKEN_ROTATED=NO`; `STAGE_GET=NO`; `SUPPORT_REPLY_SENT=NO`; `PR190=OPEN_DRAFT`; `PRODUCTION_UNTOUCHED=YES`.
