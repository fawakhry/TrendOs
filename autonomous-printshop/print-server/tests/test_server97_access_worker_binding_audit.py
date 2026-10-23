"""SERVER-97 synthetic-only tests. Zero network and zero Cloudflare credentials."""
import importlib.util
import json
import unittest
from pathlib import Path
from urllib.error import HTTPError

module_path = Path("autonomous-printshop/print-server/tools/server97_access_worker_binding_audit.py")
spec = importlib.util.spec_from_file_location("server97_audit", module_path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

ACCOUNT = "1234567890abcdef1234567890abcdef"
API_KEY = "FAKE_CI_READ_ONLY_ACCESS_API_TOKEN"
APPID = "28859297-b80f-47a7-98ed-78e00efc3204"
STAGE = "trendos-server68-isolated-stage"
WORKER_ID = "fake-immutable-stage-worker-id"
APP_URL = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/access/apps/{APPID}"
WORKERS_URL = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT}/workers/workers?page=1&per_page=100"


class Response:
    status = 200
    def __init__(self, payload):
        self.payload = json.dumps(payload).encode("utf-8")
    def __enter__(self):
        return self
    def __exit__(self, *_):
        return False
    def read(self, length):
        return self.payload[:length]


def app(*, worker_id=WORKER_ID, overrides=None):
    destination = {"type": "worker", "worker_id": worker_id}
    if overrides is not None:
        destination["overrides"] = overrides
    return {"success": True, "result": {
        "id": APPID, "name": "TrendOS isolated stage - DENY ALL - S87",
        "type": "self_hosted", "destinations": [destination],
    }}


def workers(*, name=STAGE, id=WORKER_ID, more=False):
    item = {"name": name, "id": id}
    return {"success": True, "result": [item], "result_info": {
        "page": 1, "total_pages": 2 if more else 1,
    }}


class FakeOpener:
    def __init__(self, *, app_payload=None, worker_payload=None, denied=False):
        self.responses = {
            APP_URL: app_payload if app_payload is not None else app(),
            WORKERS_URL: worker_payload if worker_payload is not None else workers(),
        }
        self.requests = []
        self.denied = denied

    def open(self, request, timeout):
        self.requests.append(request)
        if self.denied and request.full_url == WORKERS_URL:
            raise HTTPError(request.full_url, 403, "Forbidden", {}, None)
        if request.full_url not in self.responses:
            raise AssertionError("UNEXPECTED_NETWORK_TARGET")
        if timeout != 12 or request.get_method() != "GET":
            raise AssertionError("NOT_BOUNDED_GET")
        return Response(self.responses[request.full_url])


def audit(fake, **kwargs):
    return mod.audit_stage_worker_binding(
        account_id=ACCOUNT, audit_token=API_KEY, opener=fake, **kwargs)


class Stage97BindingTests(unittest.TestCase):
    def test_exact_worker_identity_match(self):
        fake = FakeOpener()
        self.assertEqual(audit(fake), "SERVER97_ACCESS_WORKER_ID_EXACT_MATCH")
        self.assertEqual([req.full_url for req in fake.requests], [APP_URL, WORKERS_URL])
        for req in fake.requests:
            self.assertEqual(req.get_header("Authorization"), "Bearer " + API_KEY)
            self.assertNotIn("CF-Access-Client-Id", req.headers)
            self.assertNotIn("CF-Access-Client-Secret", req.headers)

    def test_mismatched_worker_immutable_id_never_claimed_success(self):
        fake = FakeOpener(worker_payload=workers(id="different-stage-worker-id"))
        with self.assertRaisesRegex(mod.StageTargetAuditError,
                                    "ACCESS_BOUND_TO_DIFFERENT_WORKER"):
            audit(fake)
        self.assertEqual(len(fake.requests), 2)

    def test_wrong_stage_app_and_empty_public_overrides(self):
        malformed = app()
        malformed["result"]["name"] = "Some other application"
        for payload, expected in [
            (malformed, "STAGE_APP_IDENTITY_MISMATCH"),
            (app(overrides=[{"behavior": "public", "path_pattern": "/*"}]),
             "WORKER_DESTINATION_UNSAFE"),
        ]:
            with self.subTest(expected=expected):
                fake = FakeOpener(app_payload=payload)
                with self.assertRaisesRegex(mod.StageTargetAuditError, expected):
                    audit(fake)
                self.assertEqual(len(fake.requests), 1)

    def test_worker_api_scope_denied_safe(self):
        fake = FakeOpener(denied=True)
        with self.assertRaises(mod.StageTargetAuditError) as raised:
            audit(fake)
        self.assertEqual(str(raised.exception),
                         "SERVER97_WORKERS_METADATA_READ_SCOPE_UNAVAILABLE")
        self.assertNotIn(API_KEY, str(raised.exception))
        self.assertNotIn(ACCOUNT, str(raised.exception))

    def test_fake_missing_worker_no_unbounded_scan(self):
        fake = FakeOpener(worker_payload=workers(name="some-other-worker"))
        with self.assertRaisesRegex(mod.StageTargetAuditError, "STAGE_WORKER_NOT_FOUND"):
            audit(fake)
        self.assertEqual(len(fake.requests), 2)

    def test_invalid_credential_rejected_before_any_http(self):
        fake = FakeOpener()
        for account, token in [(ACCOUNT, "short"),
                               (ACCOUNT, API_KEY + "\r\nX-Evil: injected"),
                               ("not-an-account-id", API_KEY)]:
            with self.assertRaisesRegex(mod.StageTargetAuditError,
                                        "CREDENTIAL_UNAVAILABLE"):
                mod.audit_stage_worker_binding(account_id=account,
                                               audit_token=token, opener=fake)
        self.assertEqual(len(fake.requests), 0)

    def test_reject_response_shape_and_duplicate_targets(self):
        for payload, expected in [
            ({"success": True, "result": {}}, "WORKERS_LIST_INVALID"),
            ({"success": True, "result": [
                {"name": STAGE, "id": WORKER_ID},
                {"name": STAGE, "id": WORKER_ID},
            ]}, "WORKER_NAME_DUPLICATE"),
        ]:
            with self.subTest(expected=expected):
                fake = FakeOpener(worker_payload=payload)
                with self.assertRaisesRegex(mod.StageTargetAuditError, expected):
                    audit(fake)


if __name__ == "__main__":
    unittest.main()
