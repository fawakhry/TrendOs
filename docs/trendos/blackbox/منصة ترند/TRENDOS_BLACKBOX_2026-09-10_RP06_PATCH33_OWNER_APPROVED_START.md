# TrendOS RP-06 — Patch 33 Owner Approval / Start

Date: 2026-09-10
Branch: `agent/go-live-2026-09-01-integrity`

Owner instruction: `نفذ patch33`.

## Authorized scope

Execute one bounded GitHub-only RP-06 patch on the working branch:

1. retire historical Invoice specs for Orders `3569`, `3572`, `3577`;
2. add verified live Invoice resolutions:
   - `3849`: canonical `DR-78d925aa`, superseded `DR-2c398d17`, evidence hash `2f95a7e69be9577d2958e25742fbf3674922e6e46de9737bdeeb3602a65d38b7`;
   - `3851`: canonical `DR-be3e37a2`, superseded `DR-6b61be62`, evidence hash `1eca1a5e8461b05620ef2c6ab30f5e43d68b0acfb21b4b02ef7299b6320fabda`;
3. set candidate expectedCount to `33`;
4. recalculate the exact plan hash from the final patch;
5. update relevant tests and current RP-06 docs/checkpoints;
6. run/review CI and fail closed on any mismatch.

## Explicitly not authorized

- Apps Script Head mutation;
- `trendosCoreP0RegistryPreviewV1` runtime execution in this patch step;
- Registry Write;
- Script Property;
- Apps Script Production deploy;
- feature flag change;
- Source Sheet or D1 business-data mutation;
- `Code.gs` mutation;
- new runner/workflow.

Any result, failure, or stop is to be recorded in the blackbox before proceeding further.
