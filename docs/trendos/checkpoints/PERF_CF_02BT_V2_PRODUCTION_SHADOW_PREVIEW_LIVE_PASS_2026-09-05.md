# PERF-CF-02BT — V2 Production Shadow Preview LIVE PASS

Date: 2026-09-05
Status: VERIFIED PASS — PREVIEW ONLY / MUTATION-FREE / PRODUCTION UNCHANGED

## Design
A dedicated Preview entrypoint was added under `cloudflare-d1/preview/index.js`. Production `cloudflare-d1/src/index_v2.js` does not import the Production Shadow module.

Preview route:
`/v1/preview/cloud-write/v2/production-shadow`

The observer:
- uses one fixed synthetic production-like create intent only;
- does not read live Production business data;
- does not read or write D1;
- does not call Apps Script;
- does not invoke the canonical writer;
- does not accept credentials;
- does not allocate a business Order ID;
- GET only; mutation methods fail closed.

## Worker portability hardening
The deterministic comparison fingerprint was changed from `node:crypto` to a pure-JS comparison fingerprint so the module runs on the existing Preview Worker without requiring `nodejs_compat`. The fingerprint is explicitly not an auth/security primitive.

## Preview deployment qualification
Dedicated Preview gate, disabled phase:
- run `33927801295`
- job `101200001072`
- PASS with `TRENDOS_PRODUCTION_SHADOW_PREVIEW_ENABLED=false` and route fail-closed.

Enabled Preview deployment:
- commit `98ac0b72033d3ee1c8dbeac4b1742bd2ad8f464f`
- deployed only to `trendos-edge-gateway-preview`;
- Preview binding confirmed `TRENDOS_CLOUD_WRITE_V1_ENABLED=false`;
- Preview Shadow flag confirmed `true`.

The first combined enabled deploy/probe observed a transient deploy-race after two successful GETs. It did not perform any mutation. A separate no-deploy method proof was then executed after route stabilization.

## Stable live method proof
Workflow: `TrendOS V2 Production Shadow Preview Method Probe`
Run: `33927943186`
Job: `101200423108`
Conclusion: PASS

Verified:
- GET #1 HTTP 200;
- GET #2 HTTP 200;
- deterministic same fingerprint:
  `d0056c99e27840d42bf79d92a546b5483241a81e9fb9219c681b2fdd10d667f8`;
- fixed `clientRequestId=PROD-SHADOW-PREVIEW-001`;
- `readOnly=true`;
- `mutationFree=true`;
- `d1Written=false`;
- `sheetsWritten=false`;
- `canonicalWriterInvoked=false`;
- `productionCutover=false`;
- POST HTTP 405 with `method-not-allowed`, `mutationCount=0`;
- Production same Preview path HTTP 404;
- Production Cloud Write remains OFF (`enabled=false`, `writesAccepted=false`, `cutover=false`, `sheetsAuthoritative=true`).

## Safety conclusion
Production Shadow runtime behavior is now qualified LIVE on the isolated Preview Worker only. No Production Worker deploy, D1 write/migration, Apps Script call, Sheet write, or production cutover was performed.

## Next execution boundary
Prepare a Production Shadow observer route that remains GET-only, fixed-synthetic, and write-independent. Production Cloud Write must remain OFF. Any actual production write/cutover remains outside this checkpoint and requires its own explicit gate.