# CLOUD MIGRATION V3 — T11 Service exclusion hashes PASS

Date: 2026-09-14
Run: 34834996275
Source commit: b23c15029d8bcf3f0af799b512b6833600a0968c

## Result
- PASS
- Exactly 9 owner-approved Service exclusions were derived.
- Each exclusion is represented only by a SHA-256 fingerprint of the order identity.
- Raw order IDs were not printed or committed.
- Customer data was not printed or committed.
- No production business mutation occurred.

## Safety
- Service routing is still unchanged at this checkpoint.
- Apps Script remains Service read authority until candidate parity passes.
- Sheets/Apps Script remains write authority.
- No Task mutation.
- No secret rotation.

## Next step
Build a Service-specific D1 candidate from `الأوردرات`, apply the 9 SHA-256 exclusions, and qualify live parity against deployed Apps Script Service before any cutover.
