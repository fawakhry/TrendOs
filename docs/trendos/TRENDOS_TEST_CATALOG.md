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
| 16 | `tests/apps_script_d1_operational_enrichment_live_sync_02cr.test.mjs` | (inline/static) | 0 | GENERAL | YES |
| 17 | `tests/apps_script_d1_screen_view_mirror_refresh_02cq.test.mjs` | (inline/static) | 0 | GENERAL | YES |
| 18 | `tests/apps_script_employee_session_mismatch_non_destructive_entry531.test.mjs` | (inline/static) | 0 | AUTH | YES |
| 19 | `tests/cloud_write_order_contract_v2_staging.test.mjs` | `../cloudflare-d1/src/cloud-write-order-contract-v2-staging.mjs` | 1 | ORDERS/CLOUD-WRITE | YES |
| 20 | `tests/cloud_write_order_contract_v2.test.mjs` | `../cloudflare-d1/src/cloud-write-order-contract-v2.mjs` | 2 | ORDERS/CLOUD-WRITE | YES |
| 21 | `tests/cloud_write_order_v2_production_shadow.test.mjs` | `../cloudflare-d1/src/cloud-write-order-v2-production-shadow.mjs` | 1 | ORDERS/CLOUD-WRITE | YES |
| 22 | `tests/cloud_write_order_v2_staging_bridge.test.mjs` | `../cloudflare-d1/src/cloud-write-order-v2-staging-bridge.mjs`<br>`../cloudflare-d1/src/edge-gateway.mjs` | 1 | ORDERS/CLOUD-WRITE | YES |
| 23 | `tests/cloudflare_a51_production_shadow_customer_route.test.mjs` | `../cloudflare-d1/production-shadow/index.js` | 0 | CUSTOMER | YES |
| 24 | `tests/cloudflare_accounting_contract_v1.test.mjs` | `../cloudflare-d1/src/accounting-contract-v1.mjs`<br>`../cloudflare-d1/src/accounting-native-module.mjs` | 0 | ACCOUNTING | YES |
| 25 | `tests/cloudflare_accounting_f1_foundation_v1.test.mjs` | `../cloudflare-d1/src/accounting-foundation-v1.mjs`<br>`../cloudflare-d1/src/accounting-operations-read-v1.mjs`<br>`../cloudflare-d1/src/accounting-foundation-api-v1.mjs` | 0 | ACCOUNTING | YES |
| 26 | `tests/cloudflare_accounting_f2_finance_api_v1.test.mjs` | `../cloudflare-d1/src/accounting-finance-api-v1.mjs`<br>`../cloudflare-d1/src/accounting-native-module.mjs` | 1 | ACCOUNTING | YES |
| 27 | `tests/cloudflare_accounting_f2_finance_core_v1.test.mjs` | `../cloudflare-d1/src/accounting-finance-core-v1.mjs` | 0 | ACCOUNTING | YES |
| 28 | `tests/cloudflare_accounting_f2_finance_safe_v1.test.mjs` | `../cloudflare-d1/src/accounting-finance-safe-v1.mjs` | 3 | ACCOUNTING | YES |
| 29 | `tests/cloudflare_accounting_f2_operations_schema_prep_v1.test.mjs` | (inline/static) | 0 | ACCOUNTING | YES |
| 30 | `tests/cloudflare_accounting_f2_schema_prep_v1.test.mjs` | (inline/static) | 2 | ACCOUNTING | YES |
