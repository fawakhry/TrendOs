"""SERVER-87: zero-network dry regression of stage-specific DENY ALL Access."""
import importlib.util
import json
import os
from pathlib import Path
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location(
    "stage87",Path("autonomous-printshop/print-server/tools/server87_stage_access_denyall.py"))
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

WORKER="a"*32
APP="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"

class FakeAPI(m.API):
    def __init__(self,mode="OK"):
        self.acct="c"*32
        self.mode=mode
        self.calls=[]
        self.created=False
    def call(self,method,path,body=None):
        self.calls.append((method,path,body))
        if path.endswith("/deployments"):
            return {"deployments":[
                {"versions":[{"version_id":m.VERSION,"percentage":100}]},
                {"versions":[{"version_id":"00000000-0000-0000-0000-000000000000","percentage":100}]}
            ]}
        if path.endswith("/settings"):
            return {"bindings":[
                {"name":"DB","type":"d1"},
                {"name":"TRENDOSSHOP_SERVICE_READ_ENABLED","type":"plain_text","text":"false"},
                {"name":"MIRROR_SERVICE_READ_ENABLED","type":"plain_text","text":"false"},
            ]}
        if path.endswith("/subdomain"):
            return {"enabled":False,"previews_enabled":False}
        if path.endswith("/workers/workers"):
            return [{"name":m.STAGE,"id":WORKER}]
        if path.endswith("/access/apps?page=1&per_page=100"):
            if self.mode=="EXISTS":
                return [{"name":"other","destinations":[{"type":"worker","worker_id":WORKER}]}]
            return []
        if method=="POST" and path.endswith("/access/apps"):
            self.created=True
            return {"id":APP}
        if path.endswith("/access/apps/"+APP):
            return {"type":"self_hosted","name":m.APP_NAME,
                    "destinations":[{"type":"worker","worker_id":WORKER}]}
        if path.endswith("/access/apps/"+APP+"/policies"):
            if self.mode=="UNSAFE_ALLOW":
                return [{"decision":"allow","include":[{"everyone":{}}]}]
            return [{"decision":"deny","include":[{"everyone":{}}]}]
        raise AssertionError("Unexpected endpoint "+method+" "+path)


class StageAccessTest(unittest.TestCase):
    def test_one_exact_deny_all_app_and_no_publication(self):
        a=FakeAPI()
        self.assertTrue(a.create_and_verify())
        self.assertTrue(a.created)
        writes=[t for t in a.calls if t[0]!="GET"]
        self.assertEqual(len(writes),1)
        self.assertEqual(writes[0][1],"/accounts/"+a.acct+"/access/apps")
        self.assertEqual(writes[0][2],m.exact_deny_payload(WORKER))
        self.assertEqual(writes[0][2]["policies"][0]["decision"],"deny")
        self.assertEqual(writes[0][2]["destinations"],[{"type":"worker","worker_id":WORKER}])
        self.assertNotIn("trendos-d1-api",str(a.calls))
        self.assertNotIn("/d1/database",str(a.calls))

    def test_existing_worker_protection_never_overwritten(self):
        a=FakeAPI("EXISTS")
        with self.assertRaisesRegex(m.StageDenied,"ALREADY_EXISTS"):
            a.create_and_verify()
        self.assertFalse(a.created)

    def test_cloudflare_allow_everyone_not_qualified(self):
        a=FakeAPI("UNSAFE_ALLOW")
        with self.assertRaisesRegex(m.StageDenied,"NOT_DENY_ALL"):
            a.create_and_verify()

    def test_bad_worker_identity_prevents_any_access_write(self):
        class Spoof(FakeAPI):
            def call(self,method,path,body=None):
                if path.endswith("/workers/workers"):
                    return [{"name":"trendos-d1-api","id":WORKER}]
                return super().call(method,path,body)
        a=Spoof()
        with self.assertRaisesRegex(m.StageDenied,"UNRESOLVED"):
            a.create_and_verify()
        self.assertFalse(a.created)

    def test_unverified_stage_version_blocks(self):
        class Drift(FakeAPI):
            def call(self,method,path,body=None):
                if path.endswith("/deployments"):
                    return {"deployments":[{"versions":[
                        {"version_id":"00000000-0000-0000-0000-000000000000","percentage":100}]}]}
                return super().call(method,path,body)
        a=Drift()
        with self.assertRaisesRegex(m.StageDenied,"VERSION_DRIFT"):
            a.create_and_verify()
        self.assertFalse(a.created)

    def test_source_default_execution_denied_without_owner_gate(self):
        with patch.dict(os.environ,{},clear=True):
            self.assertEqual(m.main(["--install-exact-deny-all"]),2)
            self.assertEqual(m.main([]),64)

    def test_use_separate_access_write_token_and_existing_worker_read_token(self):
        class R:
            status=200
            def __enter__(self): return self
            def __exit__(self,*a): pass
            def read(self,n=-1): return b'{"success":true,"result":{}}'
        class Spy:
            def __init__(self): self.seen=[]
            def open(self,req,timeout):
                self.seen.append((req.get_method(),req.full_url,req.get_header("Authorization")))
                return R()
        spy=Spy()
        writer="ACCESS_ONLY_FAKE_TOKEN_0123456789"
        reader="WORKER_READ_FAKE_TOKEN_0123456789"
        acct="c"*32
        a=m.API(acct,writer,opener=spy,worker_read_token=reader)
        self.assertEqual(a.call("GET",f"/accounts/{acct}/workers/scripts/{m.STAGE}/settings"),{})
        self.assertEqual(a.call("GET",f"/accounts/{acct}/access/apps?page=1&per_page=100"),{})
        self.assertEqual(a.call("POST",f"/accounts/{acct}/access/apps",m.exact_deny_payload(WORKER)),{})
        self.assertEqual([x[2] for x in spy.seen],
                         ["Bearer "+reader,"Bearer "+writer,"Bearer "+writer])
        self.assertTrue(all("trendos-d1-api" not in x[1] for x in spy.seen))

    def test_no_access_token_from_worker_read_only_secret_in_main(self):
        with patch.dict(os.environ,{
            "SERVER87_OWNER_STAGE_AUTH_ONLY":"true",
            "CLOUDFLARE_ACCOUNT_ID":"c"*32,
            "CLOUDFLARE_API_TOKEN":"WORKER_READ_ONLY_LONG_TOKEN_123456",
            "CLOUDFLARE_ACCESS_API_TOKEN":""
        },clear=True):
            self.assertEqual(m.main(["--install-exact-deny-all"]),2)

    def test_allowlist_request_cannot_target_production_scripts(self):
        a=m.API("c"*32,"FAKE_TOKEN_01234567890123456789",opener=object())
        with self.assertRaisesRegex(m.StageDenied,"ENDPOINT_OR_METHOD_DENIED"):
            a.call("POST","/accounts/"+"c"*32+"/workers/scripts/trendos-d1-api",{})
        with self.assertRaisesRegex(m.StageDenied,"ENDPOINT_OR_METHOD_DENIED"):
            a.call("DELETE","/accounts/"+"c"*32+"/access/apps")


if __name__=="__main__":
    unittest.main()
