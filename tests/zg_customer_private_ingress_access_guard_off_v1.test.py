import importlib.util
import pathlib
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
mod=ROOT/"tools/zg_customer_private_ingress_access_guard_off_v1.py"
spec=importlib.util.spec_from_file_location("stage_access_private_guard",mod)
guard=importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)
SOURCE=(ROOT/"cloudflare-d1/wrangler.customer-stage.toml").read_text(encoding="utf8")
WID="11111111-2222-4333-8444-555555555555"
DID="66666666-7777-4888-8999-000000000000"
TID="88888888-9999-4aaa-8bbb-cccccccccccc"
def fixtures():
    return {
      "worker":{"name":guard.WORKER,"id":WID},
      "subdomain":{"enabled":False,"previews_enabled":False},
      "settings":{"bindings":[{"name":"DB","type":"d1","id":DID},
                               {"name":"CUSTOMER_LOGIN_RATE_STAGE_V0","type":"durable_object_namespace"}]},
      "databases":[{"name":guard.DATABASE,"uuid":DID}],
      "access_apps":[{"name":"STAGE SERVICE TOKEN ONLY","destinations":[{"type":"worker","worker_id":WID}],
                      "policies":[{"decision":"non_identity","include":[{"service_token":{"token_id":TID}}]}]}],
      "wrangler_source":SOURCE
    }
def assess(**kwargs):
    d=fixtures();d.update(kwargs);return guard.assess_private_customer_stage(**d)

class PrivateAccessFailClosed(unittest.TestCase):
    def test_exact_one_token_access_policy_accepts_only_structural_readback_not_live_e2e(self):
        j=assess()
        self.assertTrue(j["remotePrivateIngressReady"],j["failures"])
        self.assertFalse(j["cloudflareAccessWritePermissionVerified"])
        self.assertFalse(j["customerOriginalBrowserRemoteE2ePassed"])
        self.assertFalse(j["publicRouteActivationAuthorized"])
        self.assertFalse(j["productionGo"])
        self.assertEqual(j["customerGoogleActionsRetiredLiveLastProven"],0)
    def test_absent_access_policy_or_any_public_bypass_denied(self):
        for apps in (
          [],None,
          [{"destinations":[{"type":"worker","worker_id":WID}],
            "policies":[{"decision":"bypass","include":[{"everyone":{}}]}]}],
          [{"destinations":[{"type":"worker","worker_id":WID,"overrides":[{"behavior":"public","path_pattern":"/*"}]}],
            "policies":[{"decision":"non_identity","include":[{"service_token":{"token_id":TID}}]}]}],
          [{"destinations":[{"type":"worker","worker_id":WID}],
            "policies":[{"decision":"non_identity","include":[{"any_valid_service_token":{}}]}]}],
          [{"destinations":[{"type":"worker","worker_id":WID}],
            "policies":[{"decision":"non_identity","include":[{"service_token":{"token_id":TID}}]},
                        {"decision":"allow","include":[{"everyone":{}}]}]}]
        ):
            self.assertFalse(assess(access_apps=apps)["remotePrivateIngressReady"])
    def test_wrong_worker_id_or_missing_d1_denied(self):
        for k,v in (
          ("worker",{"name":guard.WORKER,"id":"wrong"}),
          ("databases",[{"name":"trendos-main","uuid":DID}]),
          ("settings",{"bindings":[{"type":"d1","name":"DB","id":DID},{"type":"r2_bucket","name":"IMAGES"}]}),
        ):
            self.assertFalse(assess(**{k:v})["remotePrivateIngressReady"])
    def test_public_preview_or_modified_stage_routes_denied(self):
        for sub in ({"enabled":True,"previews_enabled":False},{"enabled":False,"previews_enabled":True}):
            self.assertFalse(assess(subdomain=sub)["remotePrivateIngressReady"])
        self.assertFalse(assess(wrangler_source=SOURCE+'\nroutes = ["example.com/*"]')["remotePrivateIngressReady"])
        self.assertFalse(assess(wrangler_source=SOURCE.replace(
            'TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED = "false"',
            'TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED = "true"'))["remotePrivateIngressReady"])
    def test_mixed_or_extra_selector_fields_never_qualify_as_private_service_auth(self):
        # An extra OR selector can accidentally authorize everyone even while
        # a valid-looking service_token ID is present in the same object.
        bad_selectors=(
          {"service_token":{"token_id":TID},"everyone":{}},
          {"service_token":{"token_id":TID},"any_valid_service_token":{}},
          {"service_token":{"token_id":TID,"any_valid_service_token":{}}},
          {"service_token":{"token_id":TID,"unexpected_rule":"allow"}},
          {"service_token":{"token_id":"not-a-real-id"}},
        )
        for selector in bad_selectors:
            with self.subTest(selector=selector):
                apps=[{"destinations":[{"type":"worker","worker_id":WID}],
                       "policies":[{"decision":"non_identity","include":[selector]}]}]
                report=assess(access_apps=apps)
                self.assertFalse(report["remotePrivateIngressReady"])
                self.assertIn("EXACT_TOKEN_SERVICE_AUTH_POLICY_NOT_PROVEN",report["failures"])
    def test_no_live_e2e_can_be_inferred_from_source_guard(self):
        j=guard.assess_private_customer_stage(worker=None,subdomain=None,
          settings=None,databases=None,access_apps=None,wrangler_source=SOURCE)
        self.assertFalse(j["remotePrivateIngressReady"])
        self.assertIn("EXACT_WORKER_ACCESS_APP_MISSING_OR_AMBIGUOUS",j["failures"])
        self.assertTrue(j["sourceStageOff"])
if __name__=="__main__":unittest.main()
