# SERVER-80 — owner-gated initial Cloudflare stage bootstrap: ready in GitHub, NOT deployed

**User direction:** continue real Cloudflare↔Ubuntu integration without rewriting existing TrendOS, and defer owner decisions instead of stopping. This milestone prepares a **single manual, strictly scoped** Cloudflare stage bootstrap, does **not** assume implicit consent to change any deployed Worker, Cloudflare D1, or physical Ubuntu.

## Why this matters

The already deployed `trendos-d1-api` contains orders and customer endpoints and a bound production D1. [SERVER-79 live inspection](SERVER78_UNIFIED_SIX_STAGE_EXECUTION_20261020.md) found that the later dedicated Ubuntu reader route and scoped service credential are not deployed, and the historic `trendos-d1-staging` is **workers.dev/preview-published** with preexisting tables. Dedicated `trendos-server68-isolated-stage` is not provisioned. **Do not overwrite either production Worker or the old staging Worker, and do not copy/duplicate real customer and order records.**

## What has been implemented

1. Updated **only the isolated stage review manifest** `cloudflare-d1/wrangler.server68-isolated-stage.toml` to set both `workers_dev = false` and `preview_urls = false`. Existing 10 security-sensitive stage feature flags remain `"false"`, with **no D1/R2/KV/service bindings, routes, prod database ID, account ID or secrets**. Isolated replay Durable Object binding/migration remains as previously source-qualified.
2. Added `tools/server80_isolated_stage_deploy_guard.mjs`. CLI `--validate` is **entirely offline** and only verifies: exact new Worker name + entrypoint, no public routes or D1, every flag exactly false **once**, required reader path already present in router, exact six existing decision gates still pending, and **manual-only owner-gated** workflow. It **never deploys**, provisions keys, approves changes, or reads customer data.
3. Added **dormant manual** `.github/workflows/server80-isolated-stage-owner-gated-bootstrap.yml`: triggers only on `workflow_dispatch`, requires exact owner GitHub actor `fawakhry`, `refs/heads/main`, exact 40-character owner-reviewed commit SHA, the explicit typed phrase `SERVER80_AUTHORIZE_NEW_PRIVATE_STAGE_ONLY`, and configured Cloudflare GitHub Actions secrets. It verifies old live/new Worker absence with **three separate Cloudflare GETs**, validates source/tests, runs Wrangler dry-run, **then and only then** deploys **new isolated Worker only** via `--config cloudflare-d1/wrangler.server68-isolated-stage.toml`. Post-deploy Cloudflare GET must show **both** workers.dev and preview URLs false; any unknown result fails the task and requires operator investigation.
4. Added `tests/server80_isolated_stage_owner_bootstrap.test.mjs`, proving default deny, refusal of duplicate/true stage flags, public preview URLs, production bindings, routes, wrong worker, unapproved activity triggers, forged queue approvals and accidental cross-tenant data access. Wired into existing `.github/workflows/server68-isolated-stage-preflight.yml` so ordinary pushes execute **offline source tests and dry-run only**; the manual workflow is **never invoked automatically**.

### Verified actual hosted test result

[**GitHub Actions #39340403840**](https://github.com/fawakhry/TrendOs/actions/runs/39340403840), latest code/test SHA `bb5a144a1f63bff47f981fefa7fb8168e239daa7`: **COMPLETED/SUCCESS**. **243/243** existing Node tests, **9/9 new SERVER80** validation tests, Python 9 SERVER34 + 6 SERVER69 + 15 SERVER76 + 10 SERVER77 all passing, **Wrangler dry-run PASS**, and actual *local synthetic Workerd/SQLite D1/DO/Python-queue* PASS. Several interim guard tests correctly failed while regex/syntax defects were fixed; **do not cite them as final**.

This proves a **safe conditional stage deployment path is source-ready**, not the remote Worker actually deployed.

## Executing this later — ONLY after named owner decision

- Approve creating **new `trendos-server68-isolated-stage`** in the actual Cloudflare account and associated isolated DO, not production or existing staging. Review the exact GitHub SHA and consider any GitHub Actions Environment protection policy. The workflow lives in an unmerged **Draft PR #190**; it cannot be assumed available for manual dispatch from the GitHub UI until securely merged to the default branch.
- Dispatch the workflow **manually as repository owner** using the exact reviewed SHA and confirmation phrase. Owner grants nothing merely by reading this runbook. If the remote target exists, Cloudflare responds with missing privileges, source changes, expected branch changes, or public publication flags are not verified false, **HALT**. A failure *after* a creation attempt may require an operator to inspect the newly created stage and disable publication; do not assume automatic rollback.
- This first bootstrap creates no D1, no service secrets and no external Access configuration; **stage existence alone is insufficient for private-data or signed canary authorization**. D01 private Access and synthetic D1, D02 short-lived principal/secrets, D03 migration, D04 approved production release/rollback, D05 real physical Ubuntu and D06 one real production order remain independent **NO_GO** until independently evidenced.

## Current actual status

`SERVER80_SOURCE_GUARD=TESTED`; `SERVER80_BOOTSTRAP_WORKFLOW=PREPARED_DORMANT`; `STAGING_DEPLOYED=NO`; `WORKER_PRODUCTION_CHANGED=NO`; `CUSTOMER_D1_CHANGED=NO`; `UBUNTU_TOUCHED=NO`; `FILE_MOVED=NO`; `PRINTER_LASER_EXECUTED=NO`; `D01_D06=DEFERRED_NO_GO`.

The next **real** steps cannot be performed honestly using GitHub-only, no-deploy checks: require separate owner-authorized remote stage provisioning and a physically reachable Ubuntu host. No TinyFish browser credit is needed for the **existing Github Cloudflare CI**, but owner authorization and host accessibility are still mandatory.
