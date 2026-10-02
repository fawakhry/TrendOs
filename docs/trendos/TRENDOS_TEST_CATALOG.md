# TrendOS Test Suite Catalog

> Branch: `candidate/t12-full-cloud-cutover-a56-20260929`
>
> Purpose: content-reading audit of every file under `tests/`. Each row is produced after reading the test file itself and extracting its direct imports/targets and declared test cases. This catalog proves repository test coverage structure; it does **not** prove a test passed in CI unless a separate run/result is cited.

## Columns
- **Target/imports**: local repository modules/files referenced directly by the test.
- **Cases**: count of declared `test()`, `it()`, or `describe()` blocks (static count; nested structure may vary).
- **Class**: functional family inferred from content/imports.
- **External/runtime**: whether the test itself contains network/runtime/environment-dependent operations.

| # | Test file | Target/imports | Cases | Class | External/runtime |
|---:|---|---|---:|---|---|
| 1 | `tests/apps_script_cloud_write_auth_selftest_v1.test.mjs` | (inline/static) | 2 | AUTH | NO |
| 2 | `tests/apps_script_cloud_write_order_v2_canonical_adapter_dryrun_v1.test.mjs` | `../cloudflare-d1/src/cloud-write-order-contract-v2.mjs` | 1 | ORDERS/CLOUD-WRITE | YES |
| 3 | `tests/apps_script_cloud_write_order_v2_staging_auth_bridge_qualification_v1.test.mjs` | (inline/static) | 1 | AUTH | NO |
| 4 | `tests/apps_script_cloud_write_order_v2_staging_bridge_v1.test.mjs` | (inline/static) | 1 | ORDERS/CLOUD-WRITE | YES |
| 5 | `tests/apps_script_cloud_write_order_v2_staging_canonical_target_identity_v1.test.mjs` | (inline/static) | 1 | ORDERS/CLOUD-WRITE | NO |
| 6 | `tests/apps_script_cloud_write_order_v2_staging_first_write_harness_v1.test.mjs` | (inline/static) | 2 | ORDERS/CLOUD-WRITE | YES |
| 7 | `tests/apps_script_cloud_write_order_v2_staging_first_write_recovery_v1.test.mjs` | (inline/static) | 1 | ORDERS/CLOUD-WRITE | NO |
| 8 | `tests/apps_script_cloud_write_order_v2_staging_runtime_preflight_v1.test.mjs` | (inline/static) | 1 | ORDERS/CLOUD-WRITE | NO |
| 9 | `tests/apps_script_cloud_write_order_v2_staging_side_effect_qualification_v1.test.mjs` | (inline/static) | 0 | ORDERS/CLOUD-WRITE | YES |
| 10 | `tests/apps_script_cloud_write_production_reconcile_qualification_v1.test.mjs` | (inline/static) | 7 | ORDERS/CLOUD-WRITE | NO |
| 11 | `tests/apps_script_cloud_write_reconcile_dryrun_v1.test.mjs` | (inline/static) | 3 | ORDERS/CLOUD-WRITE | NO |
| 12 | `tests/apps_script_cloud_write_reconcile_rehearsal_v1.test.mjs` | (inline/static) | 1 | ORDERS/CLOUD-WRITE | NO |
| 13 | `tests/apps_script_cloud_write_reconcile_router_v150.test.mjs` | (inline/static) | 1 | ORDERS/CLOUD-WRITE | NO |
| 14 | `tests/apps_script_cloud_write_rehearsal_live_runner_v1.test.mjs` | (inline/static) | 3 | ORDERS/CLOUD-WRITE | NO |
| 15 | `tests/apps_script_cloud_write_staging_pull_dryrun_v1.test.mjs` | (inline/static) | 4 | ORDERS/CLOUD-WRITE | YES |
