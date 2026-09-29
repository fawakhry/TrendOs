# TrendOS T12 — A61 Phase A source-install revision — Entry 487

Date: 2026-09-29 Cairo

## Decision
Phase A source installation must no longer open Script Properties.

Reason:
- prior inspection surfaced sensitive property values in tool output;
- the A61 Apps Script bridge is fail-closed unless the enable flag is exactly `true`;
- the bridge also rejects execution when its secret is absent/invalid.

Therefore the source-only installation can safely proceed with:
```ini
BRIDGE_ENABLE_FLAG=ABSENT_OR_FALSE
BRIDGE_SECRET=DEFERRED
BRIDGE_RUNTIME=OFF
```

## Production source strategy
Never replace Production `Code.gs` with GitHub `main` wholesale.

Use the current live Production HEAD as base and apply only the qualified A61 additive patch staged in draft PR #30.

Qualification already established:
```ini
LIVE_HEAD_RUNTIME_FUNCTIONS=PASS
LIVE_HEAD_A61_BRIDGE=ABSENT
A61_ADDED_LINES=229
CANDIDATE_SYNTAX=PASS
A61_BRIDGE_CONTRACT=PASS
PRODUCTION_ONLY_HOTFIX_PRESERVED=YES
NORMALIZE_REMOVE_A61_EQUALS_LIVE_HEAD=YES
```

## Source-install gate
Before saving to Apps Script, construct the patched source outside the editor and require SHA-256:
`0980dd77395d2cc895d4344beb6db2156ad03fe1ee230fcea6c30c1ff393b295`

If the patched source hash differs, stop.

Then replace the live `Code.gs` content once, save, and verify the A61 symbols plus the production-only hotfix remain present.

No Script Properties access is allowed.

## Deploy gate
Only after exact-source verification:
- edit the existing Web App deployment;
- choose New version;
- keep the same Deployment ID and access settings;
- deploy;
- verify the production endpoint still resolves;
- bridge remains OFF by construction.

No D1 or Cloudflare mutation belongs in this step.
