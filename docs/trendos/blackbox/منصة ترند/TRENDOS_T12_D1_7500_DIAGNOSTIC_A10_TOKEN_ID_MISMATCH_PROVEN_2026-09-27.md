# TrendOS T12 — D1 7500 Diagnostic A10
Date: 2026-09-27 Cairo

## Entry 427 RESULT — CLOUDFLARE-TOKEN-ID-MISMATCH-PROVEN-A10-20260927

Owner-provided Cloudflare Token Summary route exposes dashboard token ID:
`46244467c1de37daa419a38f6fb39921`

Previously verified GitHub Actions credential token ID:
`659ab8957571c4b35f019d6e8701af20`

Result:
```
DASHBOARD_TOKEN_ID=46244467c1de37daa419a38f6fb39921
GITHUB_SECRET_TOKEN_ID=659ab8957571c4b35f019d6e8701af20
TOKEN_IDENTITY_MATCH=NO
```

The dashboard token is the token whose current Cloudflare Token Summary shows D1 Write on the entire expected account. GitHub Actions is using a different active User API Token.

Root cause classification:
```
BLOCKER=GITHUB_SECRET_POINTS_TO_DIFFERENT_CLOUDFLARE_TOKEN
ROOT_CAUSE=TOKEN_IDENTITY_MISMATCH_PROVEN
GITHUB_SECRET_CORRECTION_REQUIRED=YES
MIGRATION_0005_PAYLOAD_CAUSE=NO
```

No Cloudflare token or GitHub Secret was changed in this step. No production migration, deploy, canary arm, order create, or Apps Script write was executed.

Next: correct the GitHub repository credential to an intended D1-Write credential, then requalify persistent write on `trendos-t12-synthetic-test` before any production `install-disabled` retry. `arm-one` remains forbidden.
