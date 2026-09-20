# TrendOS GitHub cleanup candidate manifest — audit only / 2026-09-20

All below classifications are **non-deletion recommendations pending exact owner signoff**, and the files still exist. Branch: `safety-properties-retention-cleanup-audit-20260920`. Main/default workflows, production Worker, original production-bound Apps Script, Sheets and Script Properties remain unchanged.

## Inventory boundary
The isolated repository snapshot contains 1127 tracked files, 163 `.github/workflows/` YAML files, 23 `cloudflare-d1/t12-preview/` files, 149 `tests/` files and 247 `docs/trendos/blackbox/منصة ترند/` records. These are **not** 1127 or 163 proven unused artifacts. The already-live R5 Worker deployment and Apps Script Head can still reference pinned commits and functions on different branches.

## Explicit DO NOT DELETE / KEEP INTACT while R5 is live
- `.github/workflows/trendos-r5-periodic-controlled.yml` on `main`: manual enable **and emergency disable** route, exact code commit pin `b7e85647ac205b93f22e9f9ea1da58b21d54e4c0`, currently part of production rollback.
- `cloudflare-d1/t12-preview/r5-orders-periodic-guarded-handler-candidate.mjs` and `r5-orders-periodic-bound-appsscript-candidate.gs` at pinned ancestry, `cloudflare-d1/production-shadow/index.js`, `cloudflare-d1/wrangler.toml`, `tests/t12_r5_orders_periodic_candidate.test.mjs` (if present on chosen ref), source parity/qualification evidence.
- `.github/workflows/trendos-r4-production-recovery-controlled.yml` and R4-off evidence, at least until the approved R5 rollback sequence has a separate durable tested equivalent. Never reactivate R4 as a cleanup step.
- Authoritative Roadmap and Blackbox/incident history, including the exact 150-key private-backup/reconciliation checkpoints. Deleting GitHub documentation will not release one byte of the Apps Script Property Store.
- Current frontend `index.html`, `config.js`, `app.js`, `trendos-edge-orders-read-v1.js` and existing fallback route implementations. A name containing `v1`, `v2`, or `temp` is NOT proof of no runtime reference.
- All active production Tasks/Cloud Write boundaries and necessary CI/rollback tests pending exact dependency verification. T12 shadow-create tests are not the same as R5 mirror tests.

## Qualified cleanup REVIEW candidates (do not delete yet)
1. `cloudflare-d1/t12-preview/t12-script-properties-replay-fixed150-delete-once.gs`: one-time emergency routine, already executed for the exact cohort. Candidate for **removal from current production Apps Script Head only if present**, after full project backup/source diff/trigger and caller inventory. Retain a non-executable archived copy with warning and its historic evidence; it MUST NOT be run again. Its GitHub presence alone costs no Apps Script quota.
2. `cloudflare-d1/t12-preview/t12-script-properties-replay-private-backup.gs`: one-time private backup creator; review live inclusion and absence of callers. Keep the privately held backup intact. Archive this source for forensics rather than modifying stored evidence.
3. `cloudflare-d1/t12-preview/t12-script-properties-replay-cleanup-preview.gs`: read-only diagnostic used for exact prior cohort. Can keep GitHub reference source; removing its live Head copy after qualified replacement may simplify editor but would not reduce Property Store.
4. `cloudflare-d1/t12-preview/r4-preview-local-entry.mjs`, `r4-preview-synthetic-fixture.sql`, `wrangler.r4-preview.local.toml`: isolated/local testing scaffolding, candidate for an archive index only after pinned CI/rollback references checked.
5. `.github/workflows/trendos-02cw-frontend-promote-temp.yml`, `trendos-02cw-worker-codeonly-deploy-temp.yml`, `trendos-02cw-worker-rollback-safe-temp.yml`, `trendos-02cw-worker-zero-traffic-upload-temp.yml`: initial first-80-line audit shows **push-trigger on `agent/go-live-2026-09-01-integrity` when their own YAML path changes**, plus `workflow_dispatch`. Several have production Worker deployment/rollback commands; deleting/rewriting or manually dispatching is not a harmless hygiene operation. Before removal, inspect full script and pin/resumption references and preserve rollback path.
6. `.github/workflows/trendos-prod-startup-storm-hotfix-temp.yml`, `trendos-apps-script-latency-probe-temp.yml`, `trendos-startup-request-storm-candidate-temp.yml`, `trendos-prod-trendmaster-lazy-hotfix-temp.yml`: same restricted-branch file-specific push trigger + manual dispatch from sampled preambles. Must check whether historic diagnostic/rollback still needs each workflow and any actual remote deploy or write before disabling.
7. Original-bound Apps Script `TEMP_SET_DRYRUN_SECRET.gs`, `TEMP_COPY_02CL_RECONCILE_SECRET.gs`, `TEMP_ENABLE_02CL_APPS_GATE.gs` names from 2026-09-10 old live inventory: **sensitive setup candidates**, not approved for blind deletion. Current live existence/callers/versions/triggers/backup must be rechecked. Never log or rotate secrets as part of file cleanup.

## Per-file evidence required before an exact deletion set
`path | exists_in_current_live_head | production_called_by | live trigger/entrypoint | deployment/version dependency | branch/workflow dispatch/push/schedule | read/write/secret impact | rollback SHA | candidate decision | owner approval`

NO entries meet this full evidence gate yet, because we cannot directly inspect current bound Apps Script Head using the connected read-only interfaces, and the 8 GitHub workflow preamble samples do not establish complete dependency graphs or historical operational ownership.

## Read-only next checks
- Capture original bound current file/trigger inventory with handler names only; do not surface customer rows, secrets or private replay keys.
- Obtain sanitized `trendosPropertyQuotaAuditReadOnly20260919` output. Investigate V1908 plus V1913 independently.
- Select only the exact stale live files proven not referenced by any active route, scheduler, trigger, configuration, or deployed rollback; record file-level diff, static tests and backup before asking owner for exact removal approval.
- Leave production `main` and all live Google code unchanged until the per-file classification is proven.
