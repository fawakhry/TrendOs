import importlib.util
import pathlib
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
TOOL=ROOT/"tools/zero_google_direct_stage_upload_guard_v1.py"
spec=importlib.util.spec_from_file_location("zg_cf_manual_guard",TOOL)
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
FILES={
 p:(ROOT/p).read_text(encoding="utf8")
 for p in (module.STAGE_CONFIG,module.UPLOAD_WORKFLOW,module.STAGE_JS,
           module.PROD_CONFIG,module.PROD_SHADOW)
}
class DirectCloudflareUploadSourceGate(unittest.TestCase):
    def test_isolated_off_source_has_no_remote_live_deploy_capability(self):
        report=module.inspect()
        self.assertTrue(report["sourceGuardsPass"],report["sourceFailures"])
        self.assertTrue(all(report["checks"].values()))
        self.assertEqual(report["stageWorkerName"],"trendos-customer-portal-isolated-stage-v0")
        self.assertIsNone(report["cloudflareApiTokenPresent"])
        self.assertFalse(report["actualCloudflareVersionUploaded"])
        self.assertFalse(report["workerDeployedToTraffic"])
        self.assertFalse(report["productionDataChanged"])
        self.assertFalse(report["remoteUbuntuConnected"])
        self.assertFalse(report["productionGo"])
        self.assertEqual(report["liveCustomerGoogleActionsRetiredLastProven"],0)
    def test_target_worker_changed_to_prod_is_denied(self):
        bad=FILES[module.STAGE_CONFIG].replace(
            'name = "trendos-customer-portal-isolated-stage-v0"',
            'name = "trendos-d1-api"')
        r=module.inspect({module.STAGE_CONFIG:bad})
        self.assertFalse(r["sourceGuardsPass"])
        self.assertIn("unique_nonproduction_stage_identity",r["sourceFailures"])
    def test_new_public_url_or_real_d1_binding_is_denied(self):
        bad=FILES[module.STAGE_CONFIG].replace("workers_dev = false","workers_dev = true")
        self.assertFalse(module.inspect({module.STAGE_CONFIG:bad})["sourceGuardsPass"])
        bad=FILES[module.STAGE_CONFIG]+"\n[[d1_databases]]\nbinding=\"DB\"\ndatabase_id=\"fake-prod\"\n"
        r=module.inspect({module.STAGE_CONFIG:bad})
        self.assertFalse(r["sourceGuardsPass"])
        self.assertIn("no_actual_d1_r2_kv_prod_bindings_or_external_auth",r["sourceFailures"])
    def test_accidental_stage_activation_denied(self):
        cfg=FILES[module.STAGE_CONFIG].replace(
            'TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED = "false"',
            'TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED = "true"')
        self.assertIn("all_stage_read_and_write_feature_flags_explicitly_false",
                      module.inspect({module.STAGE_CONFIG:cfg})["sourceFailures"])
    def test_changing_manual_to_push_trigger_is_denied(self):
        cfg=FILES[module.UPLOAD_WORKFLOW].replace(
            "on:\n  workflow_dispatch:","on:\n  push:\n    branches: [main]\n  workflow_dispatch:")
        self.assertIn("manual_only_no_auto_push_or_pr_cloud_upload",
                      module.inspect({module.UPLOAD_WORKFLOW:cfg})["sourceFailures"])
    def test_removing_exact_commit_or_account_requirement_is_denied(self):
        cfg=FILES[module.UPLOAD_WORKFLOW].replace(
            'test "$INPUT_EXPECTED_SHA" = "$(git rev-parse HEAD)"',
            "echo unpinned sha")
        self.assertIn("explicit_full_sha_account_and_branch_confirmation",
                      module.inspect({module.UPLOAD_WORKFLOW:cfg})["sourceFailures"])
        cfg=FILES[module.UPLOAD_WORKFLOW].replace(
            'test "$INPUT_EXPECTED_ACCOUNT_ID" = "$CLOUDFLARE_ACCOUNT_ID"',
            "echo unpinned account")
        self.assertIn("explicit_full_sha_account_and_branch_confirmation",
                      module.inspect({module.UPLOAD_WORKFLOW:cfg})["sourceFailures"])
    def test_worker_activation_or_deployment_command_denied(self):
        cfg=FILES[module.UPLOAD_WORKFLOW].replace(
            "WRANGLER_VERSIONS_DEPLOY_NOT_EXECUTED=YES",
            "WRANGLER_VERSIONS_DEPLOY_NOT_EXECUTED=NO")
        self.assertIn("upload_only_no_traffic_deploy_or_fallback",
                      module.inspect({module.UPLOAD_WORKFLOW:cfg})["sourceFailures"])
        cfg=FILES[module.UPLOAD_WORKFLOW].replace(
            'versions upload \\','versions deploy \\')
        self.assertIn("upload_only_no_traffic_deploy_or_fallback",
                      module.inspect({module.UPLOAD_WORKFLOW:cfg})["sourceFailures"])
if __name__=="__main__":
    unittest.main()
