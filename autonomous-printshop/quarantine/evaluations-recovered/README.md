# Recovered Matbagy Evaluations Source — Quarantine

Status: **RECOVERED SOURCE / NOT DEPLOYED / NOT CONNECTED TO PRODUCTION**

Recovered on: 2026-10-05  
Recovery source: user's prior ChatGPT/Library artifacts associated with the historical Matbagy Evaluations work.

Files:
- `worker.mjs`
- `worker_with_ui.mjs`
- `README_CLOUDFLARE.md`

## Why quarantine?

The executable source existed in prior artifacts but was not present in the public GitHub documentation tree. It is preserved here so the autonomous-printshop project can continue from the real implementation instead of rewriting it from memory.

## Safety state

The recovered Workers are designed around:
- separate `EVAL_DB`;
- separate `EVAL_FILES`;
- `MATBAGY_ADMIN_TOKEN` / optional reader token bindings;
- no literal production token committed in the recovered source;
- no automatic WhatsApp outbound;
- no TrendOS mutation;
- action proposals remain review-only.

Do **not** deploy this recovered source as production code unchanged.

Required before integration:
1. diff against the historical evaluation book and current Cloudflare pilot runtime if still present;
2. extract reusable domain core from the one-file Worker/UI;
3. replace pilot-only identity rules with TrendOS customer/employee stable IDs;
4. use TrendOS events/read APIs instead of copying operational truth;
5. preserve evidence refs and fact review lineage;
6. add AI analysis as a separate proposal layer;
7. keep adverse employee actions outside automation;
8. qualify D1/R2 retention, tenancy, auth and deletion policy.
