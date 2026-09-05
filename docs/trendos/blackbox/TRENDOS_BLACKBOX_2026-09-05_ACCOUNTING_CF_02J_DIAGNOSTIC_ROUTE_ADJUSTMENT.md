# ACCT-CF-02J — Diagnostic Route Adjustment

Date: 2026-09-05
Branch: `agent/go-live-2026-09-01-integrity`

## Pre-action adjustment record
Inspection shows `cloudflare-d1/src/accounting-preview.mjs` embeds the full Preview HTML/UI in the same source file. Replacing that large file solely to add a small health diagnostic would unnecessarily enlarge the change surface and regression risk.

The ACCT-CF-02J goal is therefore preserved but implemented more safely as a dedicated read-only Accounting Native Runtime diagnostic endpoint/module, rather than modifying the large Preview UI source.

The endpoint will expose the same persistence readiness evaluator result and will not call any persistence commit path or D1 mutation. It remains diagnostic-only and keeps `authoritativeWrites: false`.

This adjustment does not broaden capability, enable writes, or change authority. It reduces the mutation surface of this increment.

Status: APPROVED_BY_SAFETY_CONSTRAINTS / PRE-ACTION RECORDED
