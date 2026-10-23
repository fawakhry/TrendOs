"""SERVER-95 fake-only Access probe tests: NO real network, secrets or D1."""
import unittest
from urllib.error import HTTPError, URLError
from src.stage_access_probe import StageProbeDenied, probe_stage_access_once

ORIGIN = "https://trendos-server68-isolated-stage.trendmall-contact.workers.dev"
ID = "FAKE_TEST_ID_012345678901.access"
SECRET = "FAKE_LOCAL_STAGE_SECRET_0123456789"
FLAGS = {"enabled": True, "owner_authorized": True, "route_qualified": True}

class Response:
    def __init__(self, code=204):
        self.status = code
    def __enter__(self):
        return self
    def __exit__(self,*args):
        pass
    def read(self,*args):
        raise AssertionError("PROBE MUST NOT READ A RESPONSE BODY")

class FakeTransport:
    def __init__(self, code=204):
        self.requests=[]
        self.code=code
    def open(self,req,timeout):
        self.requests.append((req,timeout))
        if self.code==403:
            raise HTTPError(req.full_url,403,"Forbidden",{},None)
        if self.code=="NETWORK":
            raise URLError("closed fake transport")
        return Response(self.code)


def run_probe(fake, **kwargs):
    return probe_stage_access_once(stage_origin=ORIGIN,client_id=ID,
                                   client_secret=SECRET,opener=fake,**kwargs)


class StageAccessProbeTests(unittest.TestCase):
    def test_default_all_off_and_no_requests(self):
        fake=FakeTransport()
        for gates in ({},{'enabled':True},
                      {'enabled':True,'owner_authorized':True},
                      {'enabled':True,'route_qualified':True}):
            with self.assertRaisesRegex(StageProbeDenied,"GATE_CLOSED"):
                run_probe(fake,**gates)
        self.assertEqual(fake.requests,[])

    def test_production_api_and_malicious_host_rejected_before_headers(self):
        fake=FakeTransport()
        for host in (
            "https://trendos-d1-api.trendmall-contact.workers.dev",
            "https://trendos.trendmall-contact.workers.dev",
            "https://example.invalid",
            ORIGIN+"/v1/printshop/service/orders/page",
            ORIGIN+"?next=production",
            "http://trendos-server68-isolated-stage.trendmall-contact.workers.dev",
        ):
            with self.subTest(host=host):
                with self.assertRaisesRegex(StageProbeDenied,"NON_STAGE_ORIGIN"):
                    probe_stage_access_once(stage_origin=host,client_id=ID,
                                            client_secret=SECRET,opener=fake,**FLAGS)
        self.assertEqual(fake.requests,[])

    def test_no_credential_leak_from_invalid_values(self):
        fake=FakeTransport()
        for cid,secret in [(ID+"\r\nX-Hacked: 1",SECRET),
                           ("fake",SECRET), (ID,SECRET+"\n"),(ID,"too-short")]:
            with self.assertRaises(StageProbeDenied) as e:
                probe_stage_access_once(stage_origin=ORIGIN,client_id=cid,
                                        client_secret=secret,opener=fake,**FLAGS)
            self.assertNotIn(secret,str(e.exception))
            self.assertNotIn(cid,str(e.exception))
        self.assertEqual(fake.requests,[])

    def test_exact_stage_get_and_access_headers_no_bearer_or_orders(self):
        fake=FakeTransport()
        report=run_probe(fake,**FLAGS)
        self.assertEqual(len(fake.requests),1)
        req,timeout=fake.requests[0]
        self.assertEqual(timeout,5)
        self.assertEqual(req.get_method(),"GET")
        self.assertEqual(req.full_url,ORIGIN+"/")
        self.assertEqual(req.get_header("Cf-access-client-id"),ID)
        self.assertEqual(req.get_header("Cf-access-client-secret"),SECRET)
        self.assertIsNone(req.get_header("Authorization"))
        self.assertEqual(report["outboundHttpsGets"],1)
        self.assertFalse(report["accessAuthenticatedProven"])
        self.assertFalse(report["orderReaderAuthenticated"])
        self.assertFalse(report["productionTouched"])
        self.assertNotIn(ID,str(report))
        self.assertNotIn(SECRET,str(report))

    def test_403_not_counted_as_authentication(self):
        report=run_probe(FakeTransport(403),**FLAGS)
        self.assertEqual(report["status"],403)
        self.assertFalse(report["accessAuthenticatedProven"])

    def test_transport_error_fails_closed_without_detail(self):
        fake=FakeTransport("NETWORK")
        with self.assertRaisesRegex(StageProbeDenied,"TRANSPORT_FAILED"):
            run_probe(fake,**FLAGS)
        self.assertEqual(len(fake.requests),1)

    def test_bad_response_code_is_not_success(self):
        with self.assertRaisesRegex(StageProbeDenied,"RESPONSE_UNVERIFIED"):
            run_probe(FakeTransport(302),**FLAGS)


if __name__=="__main__":
    unittest.main()
