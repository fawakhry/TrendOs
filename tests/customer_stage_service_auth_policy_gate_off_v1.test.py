#!/usr/bin/env python3
"""Fail-closed source-only synthetic tests, no Cloudflare or credentials."""
import copy
import importlib.util
from pathlib import Path
import unittest

source=Path(__file__).resolve().parents[1]/"tools/customer_stage_service_auth_policy_gate_off_v1.py"
spec=importlib.util.spec_from_file_location("stage_policy",source)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
WID="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
TID="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
def valid():
    return {
      "worker":{"name":mod.STAGE_WORKER,"id":WID},
      "subdomain":{"enabled":False,"previews_enabled":False},
      "token":{"name":mod.STAGE_TOKEN,"id":TID,"enabled":True},
      "app":{
        "name":mod.STAGE_APP,
        "destinations":[{"type":"worker","worker_id":WID}],
        "policies":[
          {"name":"DENY ALL TrendOS Isolated Stage","decision":"deny",
           "include":[{"everyone":{}}]},
          {"name":"Only Synthetic Stage Runner","decision":"non_identity",
           "include":[{"service_token":{"token_id":TID}}]}
        ]
      }
    }

class Gate(unittest.TestCase):
    def ok(self,p):self.assertTrue(mod.policy_gate_v1(**p)["readbackPolicyAdmissible"])
    def deny(self,p,reason):
        result=mod.policy_gate_v1(**p)
        self.assertFalse(result["readbackPolicyAdmissible"])
        self.assertIn(reason,result["errors"])
        self.assertEqual(result["customerProduction"],"NO_GO")
    def test_private_exact_allowlist(self):
        self.ok(valid())
        self.assertFalse(mod.policy_gate_v1(**valid())["remoteAuthenticatedE2ePassed"])
    def test_default_deny_without_readback(self):
        self.deny({"app":None,"worker":None,"subdomain":None,"token":None},"WORKER_UNVERIFIED")
    def test_wrong_customer_worker(self):
        p=valid();p["worker"]["name"]="production-worker"
        self.deny(p,"WORKER_UNVERIFIED")
    def test_worker_destination_widened(self):
        p=valid();p["app"]["destinations"]=[{"type":"all_workers"}]
        self.deny(p,"DESTINATION_NOT_EXACT_PRIVATE_WORKER")
    def test_public_override(self):
        p=valid();p["app"]["destinations"][0]["overrides"]=[
          {"behavior":"public","path_pattern":"/*"}]
        self.deny(p,"DESTINATION_NOT_EXACT_PRIVATE_WORKER")
    def test_public_worker_flag(self):
        p=valid();p["subdomain"]["enabled"]=True
        self.deny(p,"PUBLIC_OR_PREVIEW_ENABLED")
    def test_public_preview_flag(self):
        p=valid();p["subdomain"]["previews_enabled"]=True
        self.deny(p,"PUBLIC_OR_PREVIEW_ENABLED")
    def test_no_deny_everyone(self):
        p=valid();p["app"]["policies"]=p["app"]["policies"][1:]
        self.deny(p,"DENY_EVERYONE_NOT_PRESERVED")
    def test_allow_everyone_instead_of_deny(self):
        p=valid();p["app"]["policies"][0]["decision"]="allow"
        self.deny(p,"DENY_EVERYONE_NOT_PRESERVED")
    def test_bypass_alongside_service_auth(self):
        p=valid();p["app"]["policies"].append({"decision":"bypass",
           "include":[{"everyone":{}}]})
        self.deny(p,"POLICY_COUNT_NOT_EXACT_TWO")
    def test_unqualified_any_token(self):
        p=valid();p["app"]["policies"][1]["include"]=[
          {"any_valid_service_token":{}}]
        self.deny(p,"EXACT_SINGLE_SERVICE_TOKEN_REQUIRED")
    def test_wrong_token_id(self):
        p=valid();p["app"]["policies"][1]["include"]=[
          {"service_token":{"token_id":"cccccccc-cccc-4ccc-8ccc-cccccccccccc"}}]
        self.deny(p,"EXACT_SINGLE_SERVICE_TOKEN_REQUIRED")
    def test_extra_or_allow_rules(self):
        p=valid();p["app"]["policies"][1]["include"] += [
          {"everyone":{}}]
        self.deny(p,"EXACT_SINGLE_SERVICE_TOKEN_REQUIRED")
    def test_token_disabled(self):
        p=valid();p["token"]["enabled"]=False
        self.deny(p,"TOKEN_NOT_DEDICATED_OR_DISABLED")
    def test_ubuntu_token_not_reused(self):
        p=valid();p["token"]["name"]="TrendOS Ubuntu Synthetic Stage"
        self.deny(p,"TOKEN_NOT_DEDICATED_OR_DISABLED")
    def test_unsupported_policy_exclusions(self):
        p=valid();p["app"]["policies"][1]["exclude"]=[{"everyone":{}}]
        self.deny(p,"EXACT_SINGLE_SERVICE_TOKEN_REQUIRED")
    def test_unverified_app(self):
        p=valid();p["app"]["name"]="Wrong/Production Access"
        self.deny(p,"APP_WRONG_OR_MISSING")

if __name__=="__main__":unittest.main(verbosity=2)
