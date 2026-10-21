"""SERVER-85 offline-only test; fake Cloudflare metadata, no real network."""
import importlib.util
import io
import json
import os
from pathlib import Path
from unittest import TestCase, main
from unittest.mock import patch

spec=importlib.util.spec_from_file_location(
    "server85", Path("autonomous-printshop/print-server/tools/server85_access_readiness.py"))
s=importlib.util.module_from_spec(spec)
spec.loader.exec_module(s)

A="a"*32
T="NOT_REAL_TEST_CLOUDFLARE_API_KEY_0123456789"
D="trendos-server68-isolated-stage"


class Response:
    status=200
    def __init__(self,data): self.data=io.BytesIO(json.dumps(data).encode())
    def __enter__(self): return self
    def __exit__(self,*a): self.data.close()
    def read(self,n=-1): return self.data.read(n)


class Fake:
    def __init__(self, access="ALLOW", zones="ALLOW"):
        self.calls=[]
        self.access=access
        self.zones=zones
    def open(self, req, timeout):
        self.calls.append(req)
        assert timeout==15
        assert req.get_method()=="GET"
        assert req.get_header("Authorization")=="Bearer "+T
        url=req.full_url
        assert url.startswith("https://api.cloudflare.com/client/v4/")
        if url.endswith("/deployments"):
            payload={"deployments":[{"versions":[{"version_id":s.VERSION,"percentage":100}]}]}
        elif url.endswith("/settings"):
            payload={"bindings":[
                {"name":"DB","type":"d1","id":"DO_NOT_PRINT_FAKE_DB_UUID"},
                {"name":"TRENDOSSHOP_SERVICE_READ_ENABLED","type":"plain_text","text":"false"},
                {"name":"MIRROR_SERVICE_READ_ENABLED","type":"plain_text","text":"false"}]}
        elif url.endswith("/subdomain"):
            payload={"enabled":False,"previews_enabled":False}
        elif "/access/apps?" in url:
            payload=[{"name":"Other PRIVATE_ACCESS_USER","type":"self_hosted","domain":"private.example.com"}] if self.access=="ALLOW" else "wrong"
        elif url.endswith("/zones?account.id="+A+"&page=1&per_page=100"):
            payload=[{"name":"SECRET_PRIVATE_ZONE.example","status":"active"}] if self.zones=="ALLOW" else "wrong"
        else:
            raise AssertionError("unwanted API route: "+url)
        return Response({"success":True,"result":payload})


class ReadinessTest(TestCase):
    def test_no_network_without_explicit_argument_and_gate(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(s.main(["--metadata-get-only"]),2)
            self.assertEqual(s.main([]),64)

    def test_strict_api_method_allowlist(self):
        fake=Fake()
        c=s.CloudflareGet(A,T,fake)
        with self.assertRaisesRegex(ValueError,"FORBIDDEN_API"):
            c.get("customer_orders")
        self.assertEqual(fake.calls,[])

    def test_metadata_allows_stage_offline_not_live_authorization(self):
        fake=Fake()
        report=s.inspect(s.CloudflareGet(A,T,fake))
        self.assertTrue(report["currentStageSafeOffline"])
        self.assertEqual(len(fake.calls),5)
        self.assertTrue(all(q.get_method()=="GET" for q in fake.calls))
        for key in ("privateAccessPolicyVerified","privateHostnameRouteVerified",
                    "shortLivedMachineCredentialIssued","realUbuntuNetworkSessionVerified",
                    "sourceGitShaToLiveVersionProven","productionOrdersRead","cloudflareWrites"):
            self.assertFalse(report[key])
        self.assertEqual(report["d01D06Release"],"NO_GO")
        serialized=json.dumps(report)
        for secret in ("PRIVATE_ACCESS_USER","SECRET_PRIVATE_ZONE", "DO_NOT_PRINT_FAKE_DB_UUID",T,A):
            self.assertNotIn(secret,serialized)
        self.assertEqual(report["externalPrerequisites"]["access_apps"]["stageNamedApplicationCount"],0)
        self.assertTrue(report["externalPrerequisites"]["account_zones"]["accountHasZone"])

    def test_missing_access_or_zone_cannot_be_claimed_verified(self):
        for key in ("access","zones"):
            opts={key:"INVALID"}
            out=s.inspect(s.CloudflareGet(A,T,Fake(**opts)))
            target="access_apps" if key=="access" else "account_zones"
            self.assertFalse(out["externalPrerequisites"][target]["verified"])
            self.assertFalse(out["privateAccessPolicyVerified"])

    def test_access_app_by_name_does_not_establish_effective_policy(self):
        class Match(Fake):
            def open(self,req,timeout):
                if "/access/apps?" in req.full_url:
                    self.calls.append(req)
                    return Response({"success":True,"result":[
                        {"name":D,"type":"worker","id":"id123",
                         "policies":[{"include":[{"everyone":{}}]}]}
                    ]})
                return super().open(req,timeout)
        out=s.inspect(s.CloudflareGet(A,T,Match()))
        self.assertEqual(out["externalPrerequisites"]["access_apps"]["stageNamedApplicationCount"],1)
        self.assertFalse(out["externalPrerequisites"]["access_apps"]["accessPolicyEffectVerified"])
        self.assertFalse(out["privateAccessPolicyVerified"])

    def test_bad_account_or_token_fails_before_get(self):
        with self.assertRaises(ValueError): s.CloudflareGet("bad",T)
        with self.assertRaises(ValueError): s.CloudflareGet(A,"bad")


if __name__=="__main__":
    main()
