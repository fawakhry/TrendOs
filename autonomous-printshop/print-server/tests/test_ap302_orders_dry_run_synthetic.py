"""AP-302 fully offline simulated session + print + laser HTTP-shape tests."""
from __future__ import annotations

import json
import socket
import unittest
from dataclasses import replace
from unittest import mock
from urllib.parse import parse_qs, urlsplit

from src.trendos_orders_dry_run import (
    DryRunError, SyntheticRequest, SyntheticResponse,
    _call_fake_transport, _fake_screen_request, _fake_session_request,
    simulate_orders_read_once,
)
from src.trendos_service_identity_plan import example_fake_grant


def response(body, *, status=200, redirected=False, bytes_used=None):
    if bytes_used is None:
        bytes_used = len(json.dumps(body, ensure_ascii=False).encode("utf-8"))
    return SyntheticResponse(status, body, bytes_used, redirected)


class Recorder:
    synthetic_only = True

    def __init__(self, *, session=None, pages=None, fail_at=0, status_at=None):
        self.requests = []
        self.session = session if session is not None else {
            "success": True, "fixtureKind": "SYNTHETIC_ONLY",
            "edgeToken": "AP302_FAKE_EDGE_TOKEN",
            "identityKind": "dedicated_service_reader",
            "screens": ["print", "laser"],
        }
        self.pages = pages if pages is not None else {
            "print": {"success": True, "rows": [
                {"department": "طباعة", "orderId": "SAME-FAKE",
                 "lineId": "PRINT-LINE", "customer": "SECRET_CUSTOMER_DO_NOT_ECHO"}]},
            "laser": {"success": True, "rows": [
                {"department": "ليزر", "orderId": "SAME-FAKE", "lineId": "LASER-LINE"},
                {"department": "ليزر", "orderId": "LASER-FAKE", "lineId": "L2"}]},
        }
        self.fail_at = fail_at
        self.status_at = status_at

    def send(self, req):
        self.requests.append(req)
        if self.fail_at and len(self.requests) == self.fail_at:
            raise RuntimeError("SENSITIVE_TOKEN_TRACEBACK_MUST_NOT_LEAK")
        if req.method == "POST":
            body = self.session
        else:
            screen = parse_qs(urlsplit(req.url).query)["screen"][0]
            body = self.pages[screen]
        if self.status_at == len(self.requests):
            return response(body, status=401)
        return response(body)


class AP302OfflineOnly(unittest.TestCase):
    def test_three_requests_are_one_session_two_exact_department_reads(self):
        t = Recorder()
        result = simulate_orders_read_once(t)
        self.assertEqual([r.method for r in t.requests], ["POST", "GET", "GET"])
        self.assertEqual(len(t.requests), 3)
        self.assertEqual(result["rowCount"], 3)
        self.assertEqual(result["distinctOrderIdsAcrossScreensPresent"], 2)
        self.assertFalse(result["realAuthorizationVerified"])
        self.assertFalse(result["productionGo"])

    def test_all_urls_nonroutable_https_and_redirects_disabled(self):
        t = Recorder()
        simulate_orders_read_once(t)
        for req in t.requests:
            self.assertEqual(urlsplit(req.url).hostname, "trendos-synthetic.invalid")
            self.assertEqual(urlsplit(req.url).scheme, "https")
            self.assertIs(req.allow_redirects, False)
            self.assertEqual(req.timeout_seconds, 5)
            self.assertEqual(req.max_response_bytes, 131072)

    def test_no_production_host_ever_used(self):
        t = Recorder()
        simulate_orders_read_once(t)
        urls = " ".join(r.url for r in t.requests)
        self.assertNotIn("trendmall-contact.workers.dev", urls)
        self.assertNotIn("github", urls.lower())

    def test_no_customer_or_line_ids_in_output(self):
        t = Recorder()
        out = json.dumps(simulate_orders_read_once(t), ensure_ascii=False)
        for private in ("SAME-FAKE", "LASER-FAKE", "SECRET_CUSTOMER_DO_NOT_ECHO",
                        "PRINT-LINE", "LASER-LINE"):
            self.assertNotIn(private, out)

    def test_no_real_secrets_in_requests(self):
        t = Recorder()
        simulate_orders_read_once(t)
        values = json.dumps([r.__dict__ for r in t.requests], ensure_ascii=False)
        self.assertIn("AP302_FAKE_EMPLOYEE_TOKEN", values)
        self.assertIn("AP302_FAKE_EDGE_TOKEN", values)
        self.assertNotIn("TRENDOS_PROD_QUALIFY", values)

    def test_admin_grant_denied_before_transport_called(self):
        t = Recorder()
        grant = example_fake_grant()
        grant["subject"] = "ضياء"
        with self.assertRaisesRegex(DryRunError, "AP302_FAKE_IDENTITY_DENIED"):
            simulate_orders_read_once(t, fixture_grant=grant)
        self.assertEqual(t.requests, [])

    def test_extra_grant_permission_denied_before_transport(self):
        t = Recorder()
        grant = example_fake_grant()
        grant["canWriteOrders"] = True
        with self.assertRaisesRegex(DryRunError, "AP302_FAKE_IDENTITY_DENIED"):
            simulate_orders_read_once(t, fixture_grant=grant)
        self.assertEqual(t.requests, [])

    def test_transport_requires_explicit_fake_mode(self):
        t = Recorder()
        t.synthetic_only = False
        with self.assertRaisesRegex(DryRunError, "AP302_TRANSPORT_NOT_SYNTHETIC"):
            simulate_orders_read_once(t)
        self.assertEqual(t.requests, [])

    def test_session_cannot_allow_broad_scope(self):
        for screens in (["print", "laser", "press"], ["print"], ["print", "print"],
                        [], None, "print,laser"):
            t = Recorder(session={**Recorder().session, "screens": screens})
            with self.subTest(screens=screens), self.assertRaisesRegex(
                    DryRunError, "AP302_FAKE_SESSION_SCOPE_DENIED"):
                simulate_orders_read_once(t)
            self.assertEqual(len(t.requests), 1)

    def test_malformed_nested_session_screens_fails_with_fixed_code(self):
        for screens in (["print", ["laser"]], ["print", {"laser": True}]):
            t = Recorder(session={**Recorder().session, "screens": screens})
            with self.subTest(screens=str(screens)), self.assertRaisesRegex(
                    DryRunError, "AP302_FAKE_SESSION_SCOPE_DENIED"):
                simulate_orders_read_once(t)
            self.assertEqual(len(t.requests), 1)

    def test_transport_rejects_unexpected_method_query_and_headers(self):
        t = Recorder()
        cases = [
            replace(_fake_session_request(), method="GET"),
            replace(_fake_session_request(), json_body={"username": "FAKE_TRENDOSSHOP_READER", "token": "WRONG"}),
            replace(_fake_session_request(), url=_fake_session_request().url + "?debug=1"),
            replace(_fake_screen_request("print"), method="POST"),
            replace(_fake_screen_request("laser"), headers={"Authorization": "Bearer OTHER"}),
            replace(_fake_screen_request("print"),
                    url="https://trendos-synthetic.invalid/v1/edge/orders/02cr/page?screen=service&page=1&pageSize=20"),
            replace(_fake_screen_request("print"), json_body={"status": "update"}),
        ]
        for req in cases:
            with self.subTest(url=req.url), self.assertRaisesRegex(
                    DryRunError, "AP302_UNSAFE_REQUEST_SHAPE"):
                _call_fake_transport(t, req)
        self.assertEqual(t.requests, [])

    def test_session_requires_fake_token(self):
        for token in ("REAL_TOKEN", "", None):
            t = Recorder(session={**Recorder().session, "edgeToken": token})
            with self.subTest(token=token), self.assertRaisesRegex(
                    DryRunError, "AP302_FAKE_SESSION_SCOPE_DENIED"):
                simulate_orders_read_once(t)

    def test_wrong_identity_kind_denied(self):
        t = Recorder(session={**Recorder().session, "identityKind": "admin"})
        with self.assertRaisesRegex(DryRunError, "AP302_FAKE_SESSION_SCOPE_DENIED"):
            simulate_orders_read_once(t)

    def test_http_401_does_not_retry(self):
        for failing_request in (1, 2, 3):
            t = Recorder(status_at=failing_request)
            with self.subTest(at=failing_request), self.assertRaisesRegex(
                    DryRunError, "AP302_HTTP_FAILURE_OR_REDIRECT"):
                simulate_orders_read_once(t)
            self.assertEqual(len(t.requests), failing_request)

    def test_transport_exception_does_not_echo_private_data(self):
        for failing_request in (1, 2, 3):
            t = Recorder(fail_at=failing_request)
            with self.subTest(at=failing_request), self.assertRaises(DryRunError) as exc:
                simulate_orders_read_once(t)
            self.assertEqual(str(exc.exception), "AP302_MOCK_TRANSPORT_FAILED")
            self.assertEqual(len(t.requests), failing_request)

    def test_redirect_detected_even_with_200(self):
        t = Recorder()
        class RedirectRecorder(Recorder):
            def send(self, req):
                got = super().send(req)
                return replace(got, redirected=True)
        with self.assertRaisesRegex(DryRunError, "AP302_HTTP_FAILURE_OR_REDIRECT"):
            simulate_orders_read_once(RedirectRecorder())

    def test_laser_row_in_print_response_denied(self):
        t = Recorder()
        t.pages["print"]["rows"][0]["department"] = "ليزر"
        with self.assertRaisesRegex(DryRunError, "AP302_DEPARTMENT_SCOPE_DENIED"):
            simulate_orders_read_once(t)

    def test_unknown_row_department_denied(self):
        t = Recorder()
        t.pages["laser"]["rows"][0].pop("department")
        with self.assertRaisesRegex(DryRunError, "AP302_DEPARTMENT_SCOPE_DENIED"):
            simulate_orders_read_once(t)

    def test_invalid_second_response_does_not_return_partial_count(self):
        t = Recorder()
        t.pages["laser"] = {"success": False, "rows": []}
        with self.assertRaisesRegex(DryRunError, "AP302_READ_SHAPE_DENIED"):
            simulate_orders_read_once(t)

    def test_no_automatic_pagination(self):
        t = Recorder()
        simulate_orders_read_once(t)
        query_values = [parse_qs(urlsplit(r.url).query) for r in t.requests[1:]]
        self.assertEqual([q["page"] for q in query_values], [["1"], ["1"]])
        self.assertEqual([q["pageSize"] for q in query_values], [["20"], ["20"]])

    def test_oversize_page_denied_without_retry(self):
        t = Recorder()
        t.pages["print"]["rows"] = [{"department": "طباعة"}] * 21
        with self.assertRaisesRegex(DryRunError, "AP302_PAGE_LIMIT_EXCEEDED"):
            simulate_orders_read_once(t)
        self.assertEqual(len(t.requests), 2)

    def test_response_size_claim_understates_real_json(self):
        t = Recorder()
        class BadSizeRecorder(Recorder):
            def send(self, req):
                got = super().send(req)
                return replace(got, actual_bytes=0)
        with self.assertRaisesRegex(DryRunError, "AP302_RESPONSE_SIZE_MISMATCH"):
            simulate_orders_read_once(BadSizeRecorder())

    def test_transport_response_over_limit(self):
        t = Recorder()
        class TooLarge(Recorder):
            def send(self, req):
                got = super().send(req)
                return replace(got, actual_bytes=131073)
        with self.assertRaisesRegex(DryRunError, "AP302_RESPONSE_TOO_LARGE"):
            simulate_orders_read_once(TooLarge())

    def test_wrong_url_or_non_https_blocked_before_send(self):
        t = Recorder()
        original = _fake_session_request()
        for bad in ("http://trendos-synthetic.invalid/v1/edge/orders/session",
                    "https://evil.example/v1/edge/orders/session",
                    "https://trendos-synthetic.invalid:444/v1/edge/orders/session"):
            with self.subTest(url=bad), self.assertRaisesRegex(DryRunError, "AP302_UNSAFE_REQUEST_SHAPE"):
                _call_fake_transport(t, replace(original, url=bad))
        self.assertEqual(t.requests, [])

    def test_request_method_and_headers_are_exact(self):
        t = Recorder()
        simulate_orders_read_once(t)
        self.assertEqual(t.requests[0].json_body["username"], "FAKE_TRENDOSSHOP_READER")
        self.assertTrue(all(x.json_body is None for x in t.requests[1:]))
        self.assertEqual(t.requests[1].headers["Authorization"], "Bearer AP302_FAKE_EDGE_TOKEN")

    def test_no_socket_or_disk_access(self):
        t = Recorder()
        with mock.patch.object(socket.socket, "connect", side_effect=AssertionError("NETWORK_FORBIDDEN")):
            with mock.patch("builtins.open", side_effect=AssertionError("DISK_FORBIDDEN")):
                result = simulate_orders_read_once(t)
        self.assertTrue(result["ok"])
        self.assertFalse(result["externalNetworkUsed"])
        self.assertFalse(result["fileWrites"])

    def test_no_credentials_or_business_side_effects(self):
        result = simulate_orders_read_once(Recorder())
        for key in ("realCredentialsUsed", "productionOrdersRead",
                    "businessWrites", "physicalPrinting", "productionGo"):
            self.assertIs(result[key], False)


if __name__ == "__main__":
    unittest.main()
