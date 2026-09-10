# TrendOS RP-06 — Next Action Boundary

Date: 2026-09-10
Branch: `agent/go-live-2026-09-01-integrity`

Owner asked: `نعمل ايه`.

Recorded next action only; no RP-06 code patch or Production mutation has been executed by this checkpoint.

## Selected sequence

1. Build one bounded RP-06 patch on the working branch only.
2. Retire historical Invoice specs for Orders `3569`, `3572`, `3577`.
3. Add only the verified live Invoice resolutions:
   - `3849`: canonical `DR-78d925aa`, superseded `DR-2c398d17`, evidence hash `2f95a7e69be9577d2958e25742fbf3674922e6e46de9737bdeeb3602a65d38b7`.
   - `3851`: canonical `DR-be3e37a2`, superseded `DR-6b61be62`, evidence hash `1eca1a5e8461b05620ef2c6ab30f5e43d68b0acfb21b4b02ef7299b6320fabda`.
4. Candidate expectedCount becomes `33`; calculate a new exact plan hash from the final patched plan.
5. Update the relevant writer/consumer tests and current RP-06 docs; preserve historical records as immutable evidence.
6. Run repository tests/CI. Failure => STOP; do not touch Apps Script Head.
7. After CI PASS only, update the exact Apps Script Head writer source to the tested blob and run only `trendosCoreP0RegistryPreviewV1` READ ONLY.
8. Required preview target: `success=true`, `readOnly=true`, `expectedCount=33`, `actualPlanCount=33`, `errors=[]`. Then STOP.
9. Registry Write remains a separate explicit approval boundary.

## Not authorized by this checkpoint

- Registry Write
- Script Property
- Apps Script Production deploy
- feature flag changes
- Source Sheet mutation
- D1 business-data write
- Code.gs mutation
- new runner/workflow
