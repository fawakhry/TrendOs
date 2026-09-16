# TrendOS Tasks V3 — T2 Version-Isolated Preview Qualification FAIL — 2026-09-16

## STEP
Continue T2 Production Read-Only Wael Canary from the official Apps Script V4 handoff, without touching Main Apps Script, production frontend routes, business writes, or any secret value.

Official source-of-truth handoff:
- `docs/trendos/blackbox/TASKS_V3_T2_HANDOFF_AFTER_APPS_SCRIPT_V4_2026-09-16.md`
- handoff commit: `205ec3e7e707e75f2b05ad725da2c1245818a944`

Cloudflare pre-audit established that the preferred independent T2 Worker did not exist and that the only verified Cloudflare binding named `TASKS_V3_SHARED_SECRET` was attached to the existing isolated T1 Worker. The secret value was not readable and was not present as a GitHub Actions secret.

Owner approved proceeding with safe provisioning, but the independent-worker workflow failed safely before Cloudflare mutation because the protected GitHub Actions secret `TASKS_V3_SHARED_SECRET` was absent.

To avoid reading, copying, changing, or rotating the secret, T2 qualification was then attempted as an **undeployed Version Preview** on the existing isolated T1 Worker service. This reuses the existing Worker-local secret binding while keeping the active T1 deployment unchanged.

## RESULT
**FAIL — T2 qualification did not meet correctness/acceptance. T3 remains LOCKED.**

### Cloudflare isolation / wiring
- Active service used only for version isolation: `trendos-tasks-v3-t1-preview-20260914`
- Active T1 deployment before qualification:
  - deployment ID: `42a77742-69f6-40c7-9c6e-bbc310915374`
  - active version: `62527d93-9078-46c9-a316-132e02ed3194`
  - traffic: 100%
- Active T1 deployment after qualification: **identical / unchanged**.
- T2 qualification version uploaded but **not deployed/promoted**:
  - Worker Version ID: `69b3737c-ffeb-4e21-b70a-c9cc86da6930`
  - Preview alias: `t2-wael-20260916`
- No `wrangler deploy`, no `wrangler versions deploy`, no trigger deployment, no production route, and no custom-domain attachment were used.
- `TASKS_V3_SHARED_SECRET` was verified by **name only**. Its value was never read, displayed, copied, logged, changed, or rotated.

### Preview URL smoke
The first version-preview run (`35141439617`) hit a transient preview propagation failure immediately after upload, before qualification. A separate GET-only diagnostic run (`35141600293`) then confirmed both the alias URL and exact version URL returned:
- HTTP `405`
- `Allow: POST`
- JSON code `METHOD_NOT_ALLOWED`

A retry was added to the smoke gate. In final qualification run `35141661633`, the smoke gate passed on attempt 1.

### Qualification run
Run: `35141661633`

Operation mix:
- `health`: 8
- `status`: 8
- `flyPrint`: 7
- `pressCandidates`: 7
- total: 30

Observed result:
- success count: **0 / 30**
- HTTP failures: **30**
- transport failures: **0**
- semantic-success failures: not applicable because all calls were HTTP failures
- acceptance: **FAIL**

Failure breakdown:
- first 3 `health` calls: `TASKS_V3_PREVIEW_UPSTREAM_TIMEOUT`
  - upstream timing reached the adapter cap of `5000 ms`
- remaining 27 calls: `SIGNATURE_INVALID`

No mutation operation was called. No request used `claimNext` or `completeTask`.

### Timing observations
The qualification harness intentionally reports acceptance percentiles only over successful samples, so its official success-only p50/p95/max are `null` because there were zero successful samples.

For diagnostic context only, across **all 30 failed attempts**:
- end-to-end attempt p50: `1012.99 ms`
- end-to-end attempt p95: `5368.08 ms`
- max: `5558.74 ms`
- upstream attempt p50: `911 ms`
- upstream attempt p95: `5000 ms`
- upstream max: `5000 ms`

These diagnostic percentiles are not acceptance metrics because the calls were unsuccessful.

### Safety conclusion
Cloudflare version wiring and isolation worked, but the T2 Apps Script endpoint did not accept the HMAC assertions produced using the inherited T1 Worker secret binding after initial timeout samples. Therefore the inherited binding cannot be treated as a proven valid T2 secret path.

No attempt was made to inspect either secret value or to work around `SIGNATURE_INVALID` by changing or rotating secrets.

The requested independent T2 Worker remains uncreated because safe independent secret provisioning is still unavailable through the current connected credentials without obtaining the secret value.

## COMMIT / RUN
Relevant commits:
- `51730242bec8e3f4de3f4cc01fb27b98e7cbe293` — isolated T2 Worker source
- `74df317762aa54f6c5bdbf4706db1db0531088ac` — independent T2 Wrangler config
- `8acd6fb07d405779ff9da484e2e7ce1b45f743ba` — T2 contract test
- `ed378cd44d6b2da7db927d61c60b4cc929ae4854` — initial T2 qualification runner
- `f0d17a5b6cc5fa3269ebc59af5d66c56cb4c6b86` — per-operation qualification validation
- `11a40210633bbd9819acba91998c0a15b0ae78c8` — independent T2 qualification workflow
- `51b4f5016a6b4d7610a07f28509c8a1381bb2295` — version-isolated T2 config using required existing secret binding
- `ac67b3e01b85ecf73a6b2a2de99f8e9a0e31c59b` — version-preview qualification workflow
- `550215f28ff58651181ea446f4852869447f07fa` — GET-only preview URL diagnostic
- `7aac5c86de4eda293be2083caaaa926fa7dc9dfa` — preview propagation retry before qualification

Relevant runs:
- `35141201811` — independent-worker path safe-failed before Cloudflare mutation; protected GitHub secret absent
- `35141439617` — version upload succeeded, active T1 unchanged; immediate smoke failed due preview propagation, qualification skipped
- `35141600293` — GET-only diagnostic PASS; alias and version URL both returned T2 405/METHOD_NOT_ALLOWED
- `35141661633` — final 30-sample T2 qualification completed and **FAILED**

## PRODUCTION MUTATION
**NONE.**

Specifically:
- no Task mutation
- no `claimNext`
- no `completeTask`
- no production sheet/schema write
- no business-data write
- no Main Apps Script change/deployment/property change
- no production frontend Task route
- no production Worker route/custom domain change
- no D1 business-write authority
- no secret value read/copied/changed/rotated
- no `EDGE_SESSION_SECRET` change
- no `TRENDOS_OPERATOR_TASK_PROXY_SECRET` change
- no merge to `main`
- no T3 work

The only Cloudflare mutation performed was uploading an **undeployed isolated Worker Version Preview** to the already-isolated T1 Worker service. The active T1 deployment remained byte-for-deployment unchanged before/after.

## NEXT STEP
**STOP at T2 qualification failure. T3 remains LOCKED.**

Before any further T2 attempt, Owner must explicitly authorize a new T2 diagnostic/remediation step. The unresolved items are:
1. establish why the T2 Apps Script deployment returns `SIGNATURE_INVALID` for the inherited T1 Worker secret binding without reading, exposing, changing, or rotating either secret; and
2. after authentication correctness is restored, re-run the same read-only 30-sample qualification and evaluate the real successful-call p95 against `<= 2 seconds`.

Do not start T3, do not promote the preview version, and do not attach a production route.
