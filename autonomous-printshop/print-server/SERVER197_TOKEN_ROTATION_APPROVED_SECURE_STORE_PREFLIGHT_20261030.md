# SERVER-197 — Owner approves controlled rotation; secure storage preflight first

**Date:** 2026-10-30 Africa/Cairo  
**User authorization:** "agreee" replying to request to rotate the *existing* Cloudflare Service Token secret only after a safe storage destination is ready.

## Constraints and scope
- Token: `TrendOS Ubuntu Synthetic Stage`. Owner reports it is only used on isolated Ubuntu staging and that they do **not** have a saved copy of the current Client Secret.
- Dashboard independently showed token enabled, renewed expiry Nov 6 2026 21:27 displayed UI time, Duration 168h, Last Seen Not Seen Yet. No successful Access authentication yet.
- Owner authorization covers a controlled **Client Secret rotation** of the existing token, **not** creating a second token, changing Service Auth Include or Block Everyone policies, merging PR #190, running production workloads or repeated GET probes.
- Cloudflare docs: https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/ — rotation keeps Client ID, issues a new one-time-displayed Client Secret, may allow a bounded grace period for the old secret.
- Before clicking Rotate, verify that Ubuntu has a safe secret store. Recommend `secret-tool` backed by a logged-in user's GNOME Keyring when available; secret material must never be typed into shell commands, saved in GitHub, screenshots, public chat, terminal output, or shell history.
- Exactly one initial owner terminal action (read-only capability check):
```bash
if command -v secret-tool >/dev/null 2>&1; then printf 'SECRET_STORE_TOOL=READY\n'; else printf 'SECRET_STORE_TOOL=MISSING\n'; fi
```
- The command exposes no credentials, makes no network request, and performs no mutation. `READY` indicates the tool executable exists, not that the active keyring is unlocked/available; establish actual functionality without creating/reading real credentials before rotation.
- No rotation has been performed or observed yet. Do not assume user performed any Cloudflare action until they show evidence.

`SERVER197_OWNER_ROTATION_AUTHORIZATION=YES_CONDITIONAL_ON_STORE`; `SECRET_STORE_TOOL=NOT_YET_CHECKED`; `SECRET_ROTATED=NO`; `TOKEN_POLICY_CHANGED=NO`; `WORKER_TESTS=0`; `PR190=OPEN_DRAFT`.
