# Operator Task V2 — Cloudflare Preview

- Branch: `preview/operator-task-v2-20260913`
- Purpose: isolated Cloudflare preview qualification before production activation.
- Source checkpoint: `7e6e615fb844f60fb67c20f33b2fb08b6778171e`
- Operator Task production runtime remains OFF.
- No Apps Script production deploy, Script Property change, D1 write enablement, or employee rollout is authorized by this marker.
- Preview qualification target: Cloudflare build/deploy health first, then read-only/status path verification before any mutation test.
