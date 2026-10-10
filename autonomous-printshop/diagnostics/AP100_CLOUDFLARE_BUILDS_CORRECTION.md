# AP-100 — Cloudflare Builds root error: diagnosis and controlled remediation

Evidence from owner's 2026-10-10 Cloudflare Worker **trendos** build screenshot:
- The build is for `feature/ap099-d1-readonly-inventory-20261010` / commit `74a27f1`, **not** production auto-deploy candidate.
- Cloudflare Builds Root directory = `/`, Build command = None, Deploy command = `npx wrangler versions upload`.
- Init/clone/install succeed; deploy phase Wrangler `4.149.0` fails with **Missing entry-point to Worker script or to assets directory**.
- The repository does not have a root `wrangler.toml` or root `package.json`. Existing config `cloudflare-d1/wrangler.toml` targets Worker `trendos-d1-api` (NOT `trendos`); `cloudflare-d1/wrangler.frontend.toml` targets `trendos-ui`, and `autonomous-printshop/production-shadow/wrangler.toml` targets `autonomous-printshop-shadow`.
- This is a proven **Cloudflare Git Build invocation/source path failure**. It does **not** prove a printshop source syntax failure, an active deployment outage, or that the `trendos` Worker should run any of those three other Worker scripts.

## Immediate safe Cloudflare correction, owner-controlled, NOT applied from GitHub

1. In **Workers & Pages → trendos → Settings → Build → Branch control**, review whether **Enable Preview Builds** is currently enabled for unrelated `feature/ap*` and `audit/*` branches. Avoid non-production builds of `trendos` from autonomous-printshop audit branches: either disable preview builds for this Worker while it has no mapped Worker entry point (scope/impact reviewed first), or use approved branch-specific filtering. Do not switch the irreversible Worker Previews model as part of this fix.
2. Under **Settings → Build → Build watch paths**, use an approved narrow Worker source path filter rather than the default all-path trigger, once the **real code source path for trendos** is verified. Do not copy paths belonging to `trendos-d1-api` or `autonomous-printshop-shadow` just to obtain a green build.
3. **Only after** the intended Worker target, actual entry-point, runtime bindings, and release branch are independently confirmed, configure the precise Wrangler project root/config or explicit script entrypoint. Preserve target worker name. Validate with a read-only/preflight build first, then seek separate explicit authorization for any `wrangler versions upload` and Production deployment. Do not create root `wrangler.toml` as a workaround: it would affect unrelated Workers and could cause accidental version uploads.
4. Repeat the **same diagnosis** separately for unrelated Worker `trendos-tasks-v3-t1-preview-20260914`; its own build log was not provided. Do not infer it has the identical missing-entrypoint failure without its log. The two failed Cloudflare Builds are not the successful GitHub `autonomy-policy-contract` job.
5. Until an authorized Cloudflare Dashboard session and D1 source authority are verified, the AP-099 read-only D1 aggregate SQL stays **OFFLINE TESTED ONLY**. No public Console route reads, no real order/line exports, no Operator Task assignment/Canary.

## Source-only contract

`node autonomous-printshop/tests/cloudflare_build_target_gate_v1.test.mjs` confirms actual repo-root mismatch, existing config names+entrypoint files, and rejects wrongly configuring `trendos` using `trendos-d1-api` or `autonomous-printshop-shadow` code. The test makes **zero** network requests or deployments and is invoked by Autonomous Printshop Policy CI.

Official Cloudflare docs: [Build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [Branch control](https://developers.cloudflare.com/workers/ci-cd/builds/build-branches/), [Build watch paths](https://developers.cloudflare.com/workers/ci-cd/builds/build-watch-paths/).

Status: `ROOT_ENTRYPOINT_FAILURE=SCREENSHOT_CONFIRMED`; `REPO_ROOT_MISSING_WORKER_CONFIG=SOURCE_CONFIRMED`; `TARGET_WORKER_MAPPING=BLOCKED_UNVERIFIED`; `CLOUDFLARE_SETTINGS_CHANGE=NO`; `PRODUCTION_DEPLOY=NO`.
