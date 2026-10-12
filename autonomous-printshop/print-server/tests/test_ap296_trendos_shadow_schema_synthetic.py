"""AP-296 fake getRows one-shot projection + security contracts.

No live TrendOS account, credential, HTTPS request, printer or customer files.
"""
from __future__ import annotations

import contextlib
import io
import json
import socket
import unittest
from unittest import mock

import trendos_shadow_schema_demo as demo
from src.trendos_shadow_qualifier import (
    MAX_ROWS, SCREENS, ShadowQualificationError, qualify_screen_once,
)


UNSET = object()


class FakeClient:
    connected = True

    def __init__(self, response=UNSET, exception=None):
        self.response = {"success": True, "rows": []} if response is UNSET else response
        self.exception = exception
        self.calls = []

    def get_rows(self, screen):
        self.calls.append(screen)
        if self.exception:
            raise self.exception
        return self.response

    def login(self, *a, **kw):
        raise AssertionError("LIVE_LOGIN_FORBIDDEN")

    def logout(self, *a, **kw):
        raise AssertionError("LIVE_LOGOUT_FORBIDDEN")

    def sync(self, *a, **kw):
        raise AssertionError("BRIDGE_SYNC_FORBIDDEN")


class AP296ShadowSchemaQualification(unittest.TestCase):
    def test_empty_valid_screen_does_not_infer_no_business_orders(self):
        c = FakeClient()
        res = qualify_screen_once(c, "print")
        self.assertEqual(c.calls, ["print"])
        self.assertEqual(res["rowCount"], 0)
        self.assertFalse(res["authoritativeOrderCount"])
        self.assertFalse(res["authoritativeTaskAssignments"])
        self.assertEqual(res["mode"], "SHADOW_ONE_SHOT_SCHEMA_QUALIFICATION")

    def test_rows_are_counted_but_not_exposed(self):
        secret = "PRIVATE_CUSTOMER_PHONE_AND_TOKEN_SHOULD_NEVER_LEAK"
        c = FakeClient({
            "success": True,
            "rows": [
                {"orderId": "O1", "lineId": "L1", "status": "جديد", "customer": secret, "token": secret},
                {"orderId": "O1", "lineId": "L2", "status": "طباعة"},
                {"orderId": "O2", "lineId": "L2", "status": "مجهز"},
            ],
        })
        res = qualify_screen_once(c, "print")
        self.assertEqual(res["rowCount"], 3)
        self.assertEqual(res["distinctOrderIdsPresent"], 2)
        self.assertEqual(res["distinctLineIdsPresent"], 2)
        self.assertNotIn(secret, json.dumps(res))
        self.assertNotIn("O1", json.dumps(res))
        self.assertNotIn("L1", json.dumps(res))
        self.assertNotIn("جديد", json.dumps(res))
        self.assertFalse(res["platformBusinessWrites"])
        self.assertFalse(res["dataPersisted"])

    def test_default_scope_rejects_all_other_screens_before_contact(self):
        for s in SCREENS - {"print"}:
            c = FakeClient()
            with self.subTest(screen=s), self.assertRaisesRegex(
                ShadowQualificationError, "AP296_SCREEN_NOT_SCOPED"
            ):
                qualify_screen_once(c, s)
            self.assertEqual(c.calls, [])

    def test_explicit_screen_scoping_allows_exactly_one_request(self):
        c = FakeClient()
        res = qualify_screen_once(c, "laser", allowed_screens=("laser",))
        self.assertEqual(res["screen"], "laser")
        self.assertEqual(c.calls, ["laser"])

    def test_unscoped_or_invalid_inputs_fail_before_network(self):
        for screen, allowed in (
            ("../../service", ("../../service",)),
            ("print", ()),
            ("print", ["print"]),
            (None, ("print",)),
            ("print", ("print", "untrusted")),
            ("print", ("laser",)),
            ("PRINT", ("PRINT",)),
        ):
            c = FakeClient()
            with self.subTest(screen=screen, allowed=allowed):
                with self.assertRaisesRegex(ShadowQualificationError, "AP296_SCREEN_NOT_SCOPED"):
                    qualify_screen_once(c, screen, allowed_screens=allowed)
                self.assertEqual(c.calls, [])

    def test_not_connected_fail_closed_without_read(self):
        c = FakeClient()
        c.connected = False
        with self.assertRaisesRegex(ShadowQualificationError, "AP296_READ_CLIENT_NOT_CONNECTED"):
            qualify_screen_once(c, "print")
        self.assertEqual(c.calls, [])

    def test_denied_screen_sanitizes_sensitive_errors(self):
        password = "SENSITIVE_TOKEN_NEVER_ECHO"
        c = FakeClient(exception=RuntimeError("403 unauthorized token=" + password))
        with self.assertRaises(ShadowQualificationError) as error:
            qualify_screen_once(c, "print")
        self.assertEqual(str(error.exception), "AP296_READ_FAILED")
        self.assertNotIn(password, str(error.exception))
        self.assertEqual(c.calls, ["print"])

    def test_missing_null_or_failed_rows_are_not_zeros(self):
        payloads = (
            None, [], {"success": False, "rows": []}, {"success": True},
            {"success": True, "rows": None}, {"success": True, "rows": {}},
            {"rows": "not-a-list"},
        )
        for body in payloads:
            c = FakeClient(response=body)
            with self.subTest(body=body), self.assertRaises(ShadowQualificationError):
                qualify_screen_once(c, "print")
            self.assertEqual(c.calls, ["print"])

    def test_malformed_row_fails_entire_snapshot(self):
        for invalid in (None, "not-row", 7, ["x"]):
            c = FakeClient({"rows": [{"orderId": "X"}, invalid]})
            with self.subTest(invalid=invalid), self.assertRaisesRegex(
                ShadowQualificationError, "AP296_INVALID_ROW_OBJECT"
            ):
                qualify_screen_once(c, "print")

    def test_missing_row_fields_are_explicit_not_ready(self):
        c = FakeClient({"rows": [
            {"orderId": "", "lineId": "", "status": ""},
            {"order_id": 12, "line_id": 30, "status": None},
            {"orderId": 44, "lineId": True, "status": "جديد"},
        ]})
        out = qualify_screen_once(c, "print")
        self.assertEqual(out["rowCount"], 3)
        self.assertEqual(out["distinctOrderIdsPresent"], 2)
        self.assertEqual(out["rowsWithoutLineId"], 2)
        self.assertEqual(out["rowsWithoutStatus"], 2)
        self.assertFalse(out["printedOrReadyVerified"])
        self.assertFalse(out["designApprovalVerified"])

    def test_excessive_snapshot_fails_closed(self):
        rows = [{"lineId": "x", "status": "جديد"}] * (MAX_ROWS + 1)
        c = FakeClient({"rows": rows})
        with self.assertRaisesRegex(ShadowQualificationError, "AP296_INVALID_ROWS"):
            qualify_screen_once(c, "print")

    def test_fake_demo_prints_no_customer_or_token(self):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            demo.main([])
        printed = out.getvalue()
        self.assertIn("AP296_FAKE_SHADOW_PASS=YES", printed)
        self.assertIn("REAL_PLATFORM=OFF", printed)
        self.assertNotIn("FAKE CUSTOMER DATA MUST NOT BE ECHOED", printed)
        self.assertNotIn("FAKE-296-ORDER-1", printed)
        self.assertIn('"rowCount": 2', printed)

    def test_cli_forbids_live_flags_and_credentials(self):
        for args in (["--live"], ["--url", "https://example.com"], ["--username", "x"]):
            with self.subTest(args=args), self.assertRaisesRegex(
                SystemExit, "AP296_NO_LIVE_MODE_OR_PARAMETERS"
            ):
                demo.main(args)

    def test_no_network_for_full_fake_demo(self):
        with mock.patch.object(socket.socket, "connect", side_effect=AssertionError("NETWORK_FORBIDDEN")):
            with contextlib.redirect_stdout(io.StringIO()):
                demo.main([])

    def test_result_does_not_mutate_fake_payload_or_log_private_rows(self):
        data = {"success": True, "rows": [{"orderId": "S", "lineId": "L", "status": "جديد", "customer": "SENSITIVE"}]}
        original = json.dumps(data, ensure_ascii=False)
        client = FakeClient(data)
        out = qualify_screen_once(client, "print")
        self.assertEqual(json.dumps(data, ensure_ascii=False), original)
        self.assertFalse(out["localFolderWrites"])
        self.assertFalse(out["backgroundPolling"])


if __name__ == "__main__":
    unittest.main()
