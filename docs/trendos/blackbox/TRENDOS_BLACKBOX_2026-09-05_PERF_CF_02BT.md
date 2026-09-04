# TrendOS Black Box — PERF-CF-02BT

Date: 2026-09-05
Event: Production Shadow V2 Preview live qualification

Verified:
- dedicated Preview entrypoint deployed to `trendos-edge-gateway-preview`;
- Production source entrypoint remains free of the Shadow import;
- Production Shadow Preview flag is enabled only in Preview;
- Preview Cloud Write V1 remains OFF;
- two live GETs returned the same deterministic shadow fingerprint;
- live response reports read-only, mutation-free, no D1 write, no Sheet write, no canonical writer invocation, no production cutover;
- POST to the Preview Shadow route returned HTTP 405 and mutationCount=0;
- Production does not expose the Preview Shadow path (HTTP 404);
- Production Cloud Write remains OFF.

Stable proof:
- workflow run `33927943186`
- job `101200423108`
- result PASS.

No Production Worker deploy or authoritative write was performed.

Next safe boundary: Production Shadow observer preparation only; actual production write/cutover remains prohibited until its own explicit gate.