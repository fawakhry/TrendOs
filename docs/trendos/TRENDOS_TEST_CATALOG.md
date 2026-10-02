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
| 31 | `tests/cloudflare_accounting_native_v1.test.mjs` | `../cloudflare-d1/src/accounting-native-module.mjs` | 0 | ACCOUNTING | YES |
| 32 | `tests/cloudflare_accounting_persistence_readiness_runtime_v1.test.mjs` | `../cloudflare-d1/src/accounting-native-module.mjs`<br>`../cloudflare-d1/src/accounting-persistence-readiness-v1.mjs` | 5 | ACCOUNTING | YES |
| 33 | `tests/cloudflare_accounting_persistence_readiness_v1.test.mjs` | `../cloudflare-d1/src/accounting-persistence-readiness-v1.mjs` | 6 | ACCOUNTING | YES |
| 34 | `tests/cloudflare_accounting_persistence_schema_preflight_runtime_v1.test.mjs` | `../cloudflare-d1/src/accounting-native-module.mjs` | 7 | ACCOUNTING | YES |
| 35 | `tests/cloudflare_accounting_persistence_schema_preflight_v1.test.mjs` | `../cloudflare-d1/src/accounting-persistence-schema-preflight-v1.mjs` | 4 | ACCOUNTING | YES |
| 36 | `tests/cloudflare_cloud_write_reconcile_exact_target_v1.test.mjs` | `../cloudflare-d1/src/edge-gateway.mjs`<br>`../cloudflare-d1/src/cloud-write-gate.mjs`<br>`../cloudflare-d1/src/cloud-write-reconcile-core.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 37 | `tests/cloudflare_cloud_write_reconcile_sqlite_v1.test.mjs` | `../cloudflare-d1/src/edge-gateway.mjs`<br>`../cloudflare-d1/src/cloud-write-gate.mjs`<br>`../cloudflare-d1/src/cloud-write-reconcile-core.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 38 | `tests/cloudflare_cloud_write_sqlite_integration_v1.test.mjs` | `../cloudflare-d1/src/edge-gateway.mjs`<br>`../cloudflare-d1/src/cloud-write-gate.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 39 | `tests/cloudflare_cloud_write_v1.test.mjs` | `../cloudflare-d1/src/edge-gateway.mjs`<br>`../cloudflare-d1/src/cloud-write.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 40 | `tests/cloudflare_control_plane_diagnostics.mjs` | (inline/static) | 0 | CLOUDFLARE/EDGE | YES |
| 41 | `tests/cloudflare_edge_customer_search_a51.test.mjs` | `../cloudflare-d1/src/edge-customer-search-v1.mjs`<br>`../cloudflare-d1/src/edge-orders-read-v1.mjs` | 0 | CUSTOMER | YES |
| 42 | `tests/cloudflare_edge_freshness_v1.test.mjs` | `../cloudflare-d1/src/edge-gateway.mjs` | 0 | CLOUDFLARE/EDGE | YES |
| 43 | `tests/cloudflare_edge_gateway_v1.test.mjs` | `../cloudflare-d1/src/edge-gateway.mjs` | 0 | CLOUDFLARE/EDGE | YES |
| 44 | `tests/cloudflare_edge_orders_02cr_canary.test.mjs` | `../cloudflare-d1/src/edge-orders-read-v1.mjs`<br>`../cloudflare-d1/src/edge-orders-read-02cr-canary.mjs` | 4 | ORDERS/CLOUD-WRITE | YES |
| 45 | `tests/cloudflare_edge_orders_02cr_idle_freshness_02cu.test.mjs` | `../cloudflare-d1/src/edge-orders-read-v1.mjs`<br>`../cloudflare-d1/src/edge-orders-read-02cr-freshness.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 46 | `tests/cloudflare_edge_orders_active_summary_02cw.test.mjs` | `../cloudflare-d1/src/edge-orders-read-v1.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 47 | `tests/cloudflare_edge_orders_canary_wrapper_02co.test.mjs` | `../cloudflare-d1/src/edge-orders-read-v1-canary.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 48 | `tests/cloudflare_edge_orders_dashboard_02cn.test.mjs` | `../cloudflare-d1/src/edge-orders-read-v1.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 49 | `tests/cloudflare_edge_orders_duplicate_headers_02cr.test.mjs` | `../cloudflare-d1/src/edge-orders-read-v1.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 50 | `tests/cloudflare_edge_orders_freshness_gate_v1.test.mjs` | `../cloudflare-d1/src/edge-orders-read-v1.mjs`<br>`../cloudflare-d1/src/edge-orders-freshness-gate.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 51 | `tests/cloudflare_edge_orders_idle_freshness_integration_v1.test.mjs` | `../cloudflare-d1/src/edge-orders-read-v1.mjs`<br>`../cloudflare-d1/src/edge-orders-freshness-gate.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 52 | `tests/cloudflare_edge_orders_idle_heartbeat_v1.test.mjs` | `../cloudflare-d1/src/edge-orders-idle-heartbeat.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 53 | `tests/cloudflare_edge_orders_idle_verifier_v1.test.mjs` | `../cloudflare-d1/src/edge-orders-idle-verifier.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 54 | `tests/cloudflare_edge_orders_line_identity_02cx.test.mjs` | `../cloudflare-d1/src/edge-orders-line-id-repair-02cx.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 55 | `tests/cloudflare_edge_orders_operational_enrichment_02cr.test.mjs` | `../cloudflare-d1/src/edge-orders-operational-enrichment-02cr.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 56 | `tests/cloudflare_edge_orders_operational_ordering_02cs.test.mjs` | `../cloudflare-d1/src/edge-orders-read-02cr-canary.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 57 | `tests/cloudflare_edge_orders_read_v1.test.mjs` | `../cloudflare-d1/src/edge-orders-read-v1.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 58 | `tests/cloudflare_freshness_sample.mjs` | (inline/static) | 1 | CLOUDFLARE/EDGE | YES |
| 59 | `tests/cloudflare_index_v2_02cr_route.test.mjs` | (inline/static) | 0 | CLOUDFLARE/EDGE | YES |
| 60 | `tests/cloudflare_legacy_session_race_guard_entry504.test.mjs` | `../cloudflare-d1/src/legacy-browser-transport-v1.mjs`<br>`../cloudflare-d1/src/cloud-auth-shadow-v1.mjs` | 5 | AUTH | YES |
| 61 | `tests/cloudflare_mirror_safety_v1.test.mjs` | `../cloudflare-d1/src/mirror-gate.mjs` | 0 | CLOUDFLARE/EDGE | YES |
| 62 | `tests/cloudflare_normalized_import_v1.test.mjs` | `../cloudflare-d1/src/normalized-import-gate.mjs` | 0 | CLOUDFLARE/EDGE | YES |
| 63 | `tests/cloudflare_orders_session_shadow_handoff_entry497.test.mjs` | `../cloudflare-d1/src/legacy-browser-transport-v1.mjs`<br>`../cloudflare-d1/src/cloud-session-bridge-v3.mjs`<br>`../cloudflare-d1/src/cloud-auth-shadow-v1.mjs` | 5 | AUTH | YES |
| 64 | `tests/cloudflare_preview_safety_v1.test.mjs` | `../cloudflare-d1/src/cloud-write-gate.mjs`<br>`../cloudflare-d1/src/accounting-preview.mjs`<br>`../cloudflare-d1/src/accounting-native-module.mjs` | 0 | ACCOUNTING | YES |
| 65 | `tests/cloudflare_production_reconcile_qualification_v1.test.mjs` | `../cloudflare-d1/src/edge-gateway.mjs`<br>`../cloudflare-d1/src/cloud-write-gate.mjs`<br>`../cloudflare-d1/src/cloud-write-production-reconcile-qualification.mjs` | 0 | ORDERS/CLOUD-WRITE | YES |
| 66 | `tests/cloudflare_production_reconcile_qualification_wiring_default_off_v1.test.mjs` | `../cloudflare-d1/production-shadow/index.js` | 0 | CLOUDFLARE/EDGE | YES |
| 67 | `tests/cloudflare_production_shadow_integration_candidate_v1.test.mjs` | (inline/static) | 2 | CLOUDFLARE/EDGE | YES |
| 68 | `tests/cloudflare_production_shadow_observer_candidate_v1.test.mjs` | `../cloudflare-d1/production-shadow/observer.mjs` | 7 | CLOUDFLARE/EDGE | YES |
| 69 | `tests/cloudflare_production_shadow_preview_v1.test.mjs` | `../cloudflare-d1/preview/production-shadow-preview.mjs` | 1 | CLOUDFLARE/EDGE | YES |
| 70 | `tests/cloudflare_staging_synthetic_sample_bridge_v1.test.mjs` | `../cloudflare-d1/src/cloud-write-staging-reconcile.mjs` | 2 | ORDERS/CLOUD-WRITE | YES |
| 71 | `tests/core_p0_11_readonly_gate_contract.test.mjs` | (inline/static) | 0 | GENERAL | YES |
| 72 | `tests/customer_manager_send_integrity_v1.test.js` | (inline/static) | 0 | CUSTOMER | NO |
| 73 | `tests/d1_fast_auth_v25_safe.test.js` | (inline/static) | 4 | AUTH | NO |
| 74 | `tests/d1_normalized_live_sync_delta_v2.test.mjs` | `../cloudflare-d1/src/normalized-import-gate.mjs` | 0 | CLOUDFLARE/EDGE | YES |
| 75 | `tests/d1_orders_live_sync_atomic_v1.test.mjs` | (inline/static) | 0 | ORDERS/CLOUD-WRITE | YES |
