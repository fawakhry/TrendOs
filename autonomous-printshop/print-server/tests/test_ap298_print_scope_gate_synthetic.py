"""AP-298 synthetic strict print-only scope and privacy regression tests."""
from __future__ import annotations

import json
import socket
import unittest
from unittest import mock

from src.trendos_print_scope_gate import (
    PrintReadScopeError, qualify_print_fixture_once,
)


def grant(**changes):
    value = {
        "fixtureKind": "SYNTHETIC_ONLY",
        "role": "print",
        "screens": ["print"],
        "department": "طباعة",
        "requestScreen": "print",
        "routeCandidate": "/v1/edge/orders/02cr/page",
    }
    value.update(changes)
    return value


def payload(rows=None):
    if rows is None:
        rows = [
            {"orderId": "FAKE-ORDER", "lineId": "FAKE-LINE", "status": "جديد",
             "department": "طباعة", "customer": "PRIVATE_PHONE_DO_NOT_LOG"}
        ]
    return {"success": True, "rows": rows}


class AP298PrintScopeFakeOnly(unittest.TestCase):
    def test_valid_fake_only_snapshot_is_aggregated_not_live(self):
        result = qualify_print_fixture_once(grant=grant(), response=payload())
        self.assertEqual(result["rowCount"], 1)
        self.assertEqual(result["distinctOrderIdsPresent"], 1)
        self.assertFalse(result["serverSideRoleVerified"])
        self.assertFalse(result["productionRouteVerified"])
        self.assertFalse(result["liveOrderReadPerformed"])
        self.assertFalse(result["productionGo"])
        self.assertNotIn("FAKE-ORDER", json.dumps(result))
        self.assertNotIn("PRIVATE_PHONE_DO_NOT_LOG", json.dumps(result))

    def test_empty_screen_does_not_establish_empty_business_orders(self):
        result = qualify_print_fixture_once(grant=grant(), response=payload([]))
        self.assertEqual(result["rowCount"], 0)
        self.assertFalse(result["productionGo"])

    def test_broad_admin_identity_denied(self):
        with self.assertRaisesRegex(PrintReadScopeError, "AP298_PRINT_SCOPE_NOT_EXCLUSIVE"):
            qualify_print_fixture_once(grant=grant(role="admin"), response=payload())

    def test_existing_candidate_print_press_and_empty_scope_denied(self):
        for screens in (["print", "press", ""], ["print", "press"],
                        ["print", ""], ["print", "laser"], []):
            with self.subTest(screens=screens):
                with self.assertRaisesRegex(PrintReadScopeError, "AP298_PRINT_SCOPE_NOT_EXCLUSIVE"):
                    qualify_print_fixture_once(grant=grant(screens=screens), response=payload())

    def test_duplicates_strings_and_case_changes_denied(self):
        for screens in (["print", "print"], "print", ("print",), ["PRINT"], ["Print"]):
            with self.subTest(screens=screens):
                with self.assertRaisesRegex(PrintReadScopeError, "AP298_PRINT_SCOPE_NOT_EXCLUSIVE"):
                    qualify_print_fixture_once(grant=grant(screens=screens), response=payload())

    def test_wrong_department_and_request_screen_denied(self):
        for changes in ({"department": "ليزر"}, {"department": "طباعة وليزر"},
                        {"requestScreen": "press"}, {"requestScreen": "service"},
                        {"role": "service"}):
            with self.subTest(changes=changes):
                with self.assertRaisesRegex(PrintReadScopeError, "AP298_PRINT_SCOPE_NOT_EXCLUSIVE"):
                    qualify_print_fixture_once(grant=grant(**changes), response=payload())

    def test_fake_flag_required_and_live_flag_denied(self):
        for kind in ("LIVE", "PRODUCTION", None, True):
            with self.subTest(kind=kind):
                with self.assertRaisesRegex(PrintReadScopeError, "AP298_NOT_SYNTHETIC"):
                    qualify_print_fixture_once(grant=grant(fixtureKind=kind), response=payload())

    def test_unknown_route_not_implicitly_approved(self):
        for route in ("/v1/edge/orders/page", "/v1/employee/core",
                      "http://test/api", "/v1/edge/orders/02cr/page?admin=1", ""):
            with self.subTest(route=route):
                with self.assertRaisesRegex(PrintReadScopeError, "AP298_ROUTE_NOT_QUALIFIED"):
                    qualify_print_fixture_once(grant=grant(routeCandidate=route), response=payload())

    def test_extra_fields_including_credentials_denied(self):
        with self.assertRaisesRegex(PrintReadScopeError, "AP298_GRANT_SHAPE_DENIED"):
            qualify_print_fixture_once(grant=grant(token="NEVER_STORE_THIS"), response=payload())
        with self.assertRaisesRegex(PrintReadScopeError, "AP298_GRANT_SHAPE_DENIED"):
            qualify_print_fixture_once(grant={"role": "print"}, response=payload())
        with self.assertRaisesRegex(PrintReadScopeError, "AP298_GRANT_SHAPE_DENIED"):
            qualify_print_fixture_once(grant=None, response=payload())

    def test_cross_department_row_denied_even_if_called_print(self):
        for dep in ("ليزر", "مكبس", "طباعة وليزر", "  طباعة", None, "", 0):
            with self.subTest(department=dep):
                row = {"department": dep, "orderId": "FAKE"}
                with self.assertRaisesRegex(PrintReadScopeError, "AP298_NON_PRINT_ROW_DENIED"):
                    qualify_print_fixture_once(grant=grant(), response=payload([row]))

    def test_unknown_department_denied(self):
        with self.assertRaisesRegex(PrintReadScopeError, "AP298_NON_PRINT_ROW_DENIED"):
            qualify_print_fixture_once(grant=grant(), response=payload([{"orderId": "FAKE"}]))

    def test_bad_response_is_never_reported_as_zero_orders(self):
        for res in (None, [], {}, {"success": False, "rows": []},
                    {"success": 1, "rows": []}, {"success": True},
                    {"success": True, "rows": None}):
            with self.subTest(res=res):
                with self.assertRaises(PrintReadScopeError):
                    qualify_print_fixture_once(grant=grant(), response=res)

    def test_bad_row_shape_denied(self):
        for row in (None, 1, [], "طباعة"):
            with self.subTest(row=row):
                with self.assertRaisesRegex(PrintReadScopeError, "AP298_NON_PRINT_ROW_DENIED"):
                    qualify_print_fixture_once(grant=grant(), response=payload([row]))

    def test_existing_ap296_row_limit_is_inherited(self):
        row = {"department": "طباعة", "orderId": "FAKE", "lineId": "F"}
        with self.assertRaisesRegex(PrintReadScopeError, "AP298_AGGREGATE_REJECTED"):
            qualify_print_fixture_once(grant=grant(), response=payload([row] * 5001))

    def test_secret_values_are_never_reflected_in_errors(self):
        secret = "UNIQUE_PRIVATE_TOKEN_MUST_STAY_PRIVATE"
        value = payload([{"department": "ليزر", "token": secret}])
        with self.assertRaises(PrintReadScopeError) as e:
            qualify_print_fixture_once(grant=grant(), response=value)
        self.assertNotIn(secret, str(e.exception))

    def test_no_network_even_when_fake_processing(self):
        with mock.patch.object(socket.socket, "connect", side_effect=AssertionError("NETWORK_FORBIDDEN")):
            result = qualify_print_fixture_once(grant=grant(), response=payload())
        self.assertTrue(result["ok"])
        self.assertFalse(result["liveCredentialsUsed"])

    def test_no_local_or_business_mutations(self):
        with mock.patch("builtins.open", side_effect=AssertionError("FILE_IO_FORBIDDEN")):
            result = qualify_print_fixture_once(grant=grant(), response=payload())
        self.assertFalse(result["localFolderWrites"])
        self.assertFalse(result["platformBusinessWrites"])
        self.assertFalse(result["printing"])


if __name__ == "__main__":
    unittest.main()
