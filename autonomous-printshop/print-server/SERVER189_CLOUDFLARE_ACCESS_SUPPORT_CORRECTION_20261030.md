# SERVER-189 — Cloudflare vendor retracts token mismatch; investigate secret freshness

**Reviewed:** 2026-10-30 (Africa/Cairo); **Case:** `02394197`.

## Gmail evidence (Trend Mall mailbox)

1. Engineer reply of **2026-10-28 13:51 UTC**: account had **exactly one** Service Token. Audit records show creation 2026-10-23 13:25 UTC and modifications at 16:39 and **21:09 UTC**.
2. Engineer expressly **retracted earlier claim** of a different policy-bound versus Ubuntu token: comparison of policy Token name and Worker name did not prove a mismatch and was **not verified against an edge/Access log for the specific Ray**.
3. Engineer instructs **leave Service Auth Include rule and Block policy unchanged**. Supported Worker/Access setup depends on correct application hostname association.
4. Engineer's *hypothesis*, not yet proven: if the 21:09 update rotated Secret, a request carrying pre-rotation Secret at **21:57 UTC** can be denied even when Client ID matches. A claimed HTML403/no-Worker-invocation was also cited by the engineer, but our earlier Worker metrics zero-invocation observation covered an older interval; do not silently treat it as new-ray verification.
5. Engineer asks **read-only confirmations**: (a) Service Auth policy actually associated with correct Access app, and (b) Ubuntu stage's locally held secret came from after the 21:09 update. Do not put the Secret in Gmail, terminal output, GitHub, or chat.
6. If a request using a current valid Secret still fails, support offers to trace a new Ray + UTC timestamp. There is **no authorization or need for an immediate repeat GET**.
7. **2026-10-29 13:51 UTC** automated "Closing soon" email says two business days before auto-Resolved if no input. The 2026-10-28 earlier owner clarification was indeed sent, but this closure warning arrived afterward. Case status today has not been verified via portal, so do not label it closed or open from the reminder alone.
8. Separate 2026-10-23 email warned token expires **in one week**. With today's date **2026-10-30**, expiry is imminent/possibly reached, but current lifetime/renewal status has **not** been verified. Check expiry metadata before any future authentication testing; do not rotate or renew without owner approval.

## Safety / next action

- Do not replace/include a new token: Cloudflare explicitly corrected that advice.
- No Access policy edits, token rotation, deployment, GitHub merge, production/order/finance writes, or further live Worker probes are authorized.
- Recommended next vendor communication: succinct response referencing the correction, asking to keep case open while owner safely verifies current token expiry and Ubuntu secret provenance; no secret values must leave the secure environment.
- Existing PR #190 remains Open/Draft at review time, unmerged.

`SERVER189_VENDOR_TOKEN_MISMATCH_RETRACTED=YES`; `SECRET_ROTATION_HYPOTHESIS=UNPROVEN`; `CURRENT_TOKEN_EXPIRY=UNVERIFIED`; `CLOSING_SOON_WARNING=2026-10-29`; `STAGE_HTTP403_ROOT_CAUSE=NOT_VERIFIED`; `NO_NEW_TESTS_OR_SECURITY_CHANGES=YES`; `PR190=OPEN_DRAFT`.
