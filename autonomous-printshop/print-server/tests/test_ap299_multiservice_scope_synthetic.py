"""AP-299 fake-only multi-service regression tests (no production endpoints)."""
from __future__ import annotations

import json
import socket
import unittest
from unittest import mock

from src.trendos_service_scope_gate import (
    ServiceScopeError, ServiceSpec, qualify_services_fixture_once,
)


def grant(screens=None, **kwargs):
    item = {"fixtureKind": "SYNTHETIC_ONLY", "role": "department_operator",
            "screens": ["print", "laser"] if screens is None else screens}
    item.update(kwargs)
    return item


def responses():
    # One order has independent work lines belonging to two departments.
    return {
        "print": {"success": True, "rows": [
            {"department": "طباعة", "orderId": "SAME-ORDER", "lineId": "LINE-PRINT",
             "status": "جديد", "customerPhone": "PRIVATE_PHONE_SENTINEL"}]},
        "laser": {"success": True, "rows": [
            {"department": "ليزر", "orderId": "SAME-ORDER", "lineId": "LINE-LASER",
             "status": "جديد", "customerName": "PRIVATE_NAME_SENTINEL"},
            {"department": "ليزر", "orderId": "LASER-ONLY", "lineId": "LINE-2",
             "status": "جديد"}]},
    }


class AP299MultiserviceSyntheticOnly(unittest.TestCase):
    def test_print_and_laser_together_one_order_multiple_departments(self):
        out = qualify_services_fixture_once(grant=grant(), responses=responses())
        self.assertEqual(out["serviceCount"], 2)
        self.assertEqual(out["screenCount"], 2)
        self.assertEqual(out["rowCount"], 3)
        self.assertEqual(out["distinctOrderIdsAcrossScreensPresent"], 2)
        self.assertEqual(out["byScreen"]["print"]["rowCount"], 1)
        self.assertEqual(out["byScreen"]["laser"]["rowCount"], 2)
        self.assertFalse(out["productionGo"])
        self.assertFalse(out["serverSideScopeVerified"])

    def test_no_private_data_or_order_ids_in_projection(self):
        out = json.dumps(qualify_services_fixture_once(grant=grant(), responses=responses()))
        for secret in ("SAME-ORDER", "LASER-ONLY", "PRIVATE_PHONE_SENTINEL",
                       "PRIVATE_NAME_SENTINEL", "LINE-PRINT", "LINE-LASER"):
            self.assertNotIn(secret, out)

    def test_print_only_is_a_valid_subcase_not_product_limit(self):
        out = qualify_services_fixture_once(
            grant=grant(screens=["print"]),
            responses={"print": responses()["print"]},
            enabled_services=("print",))
        self.assertEqual(out["screenCount"], 1)
        self.assertEqual(out["rowCount"], 1)

    def test_laser_only_is_supported_independently(self):
        out = qualify_services_fixture_once(
            grant=grant(screens=["laser"]),
            responses={"laser": responses()["laser"]},
            enabled_services=("laser",))
        self.assertEqual(out["rowCount"], 2)

    def test_reject_unapproved_screen_in_grant(self):
        for screens in (["print", "laser", "press"], ["print", "service"],
                        ["print", "print"], ["laser"], [], "print"):
            with self.subTest(screens=screens), self.assertRaisesRegex(
                    ServiceScopeError, "AP299_GRANT_NOT_EXACT"):
                qualify_services_fixture_once(grant=grant(screens=screens), responses=responses())

    def test_admin_identity_not_accepted_by_fake_gate(self):
        with self.assertRaisesRegex(ServiceScopeError, "AP299_GRANT_NOT_EXACT"):
            qualify_services_fixture_once(
                grant=grant(role="admin"), responses=responses())

    def test_grant_rejects_extra_credentials_fields(self):
        with self.assertRaisesRegex(ServiceScopeError, "AP299_GRANT_NOT_EXACT"):
            qualify_services_fixture_once(
                grant=grant(token="NEVER_STORE_TOKEN"), responses=responses())

    def test_reject_laser_rows_when_only_print_authorized(self):
        with self.assertRaisesRegex(ServiceScopeError, "AP299_RESPONSE_SCOPE_DENIED"):
            qualify_services_fixture_once(
                grant=grant(screens=["print"]),
                responses=responses(),
                enabled_services=("print",))

    def test_cross_department_row_in_laser_screen_fails_entire_fixture(self):
        data = responses()
        data["laser"]["rows"][0]["department"] = "طباعة"
        with self.assertRaisesRegex(ServiceScopeError, "AP299_CROSS_DEPARTMENT_ROW_DENIED"):
            qualify_services_fixture_once(grant=grant(), responses=data)

    def test_unknown_department_and_mixed_dept_fails_closed(self):
        for department in ("", None, "طباعة وليزر", "مكبس"):
            with self.subTest(department=department):
                data = responses()
                data["print"]["rows"][0]["department"] = department
                with self.assertRaisesRegex(ServiceScopeError, "AP299_CROSS_DEPARTMENT_ROW_DENIED"):
                    qualify_services_fixture_once(grant=grant(), responses=data)

    def test_unregistered_future_service_cannot_be_enabled_by_payload(self):
        with self.assertRaisesRegex(ServiceScopeError, "AP299_SERVICES_NOT_REGISTERED"):
            qualify_services_fixture_once(
                grant=grant(), responses=responses(),
                enabled_services=("print", "laser", "embroidery"))

    def test_future_service_requires_explicit_local_registry(self):
        catalog = {
            "print": ServiceSpec("print", "print", "طباعة"),
            "laser": ServiceSpec("laser", "laser", "ليزر"),
            "laser_engraving": ServiceSpec("laser_engraving", "laser", "ليزر"),
        }
        out = qualify_services_fixture_once(
            grant=grant(), responses=responses(),
            enabled_services=("print", "laser", "laser_engraving"),
            catalog=catalog)
        self.assertEqual(out["serviceCount"], 3)
        self.assertEqual(out["screenCount"], 2)
        self.assertEqual(out["rowCount"], 3)
        self.assertFalse(out["serverSideScopeVerified"])

    def test_same_screen_cannot_span_two_departments(self):
        catalog = {
            "print": ServiceSpec("print", "print", "طباعة"),
            "other": ServiceSpec("other", "print", "كوشيه"),
        }
        with self.assertRaisesRegex(ServiceScopeError, "AP299_SCREEN_DEPARTMENT_COLLISION"):
            qualify_services_fixture_once(
                grant=grant(screens=["print"]),
                responses={"print": responses()["print"]},
                enabled_services=("print", "other"), catalog=catalog)

    def test_unqualified_future_screen_rejected_by_known_api_screen_list(self):
        catalog = {"new": ServiceSpec("new", "new_endpoint", "تطريز")}
        with self.assertRaisesRegex(ServiceScopeError, "AP299_CATALOG_NOT_QUALIFIED"):
            qualify_services_fixture_once(
                grant=grant(screens=["new_endpoint"]),
                responses={"new_endpoint": {"success": True, "rows": []}},
                enabled_services=("new",), catalog=catalog)

    def test_invalid_registry_shapes_fail_closed(self):
        for catalog in (None, {}, {"print": {"screen": "print"}},
                        {"print": ServiceSpec("other", "print", "طباعة")},
                        {"laser": ServiceSpec("laser", "laser", "")}):
            if catalog is None:
                continue  # None intentionally means use the built-in starter catalog.
            with self.subTest(catalog=catalog), self.assertRaisesRegex(
                    ServiceScopeError, "AP299_CATALOG_NOT_QUALIFIED"):
                qualify_services_fixture_once(grant=grant(), responses=responses(), catalog=catalog)

    def test_bad_synthetic_response_does_not_convert_to_zero(self):
        for value in (None, {}, {"success": False, "rows": []},
                      {"success": 1, "rows": []}, {"success": True, "rows": None}):
            with self.subTest(value=value):
                data = responses()
                data["laser"] = value
                with self.assertRaises(ServiceScopeError):
                    qualify_services_fixture_once(grant=grant(), responses=data)

    def test_oversize_in_one_department_blocks_entire_projected_snapshot(self):
        data = responses()
        data["laser"]["rows"] = [{"department": "ليزر", "orderId": "X"}] * 5001
        with self.assertRaisesRegex(ServiceScopeError, "AP299_AGGREGATE_REJECTED"):
            qualify_services_fixture_once(grant=grant(), responses=data)

    def test_no_network_file_or_live_workflow_use(self):
        with mock.patch.object(socket.socket, "connect",
                               side_effect=AssertionError("NETWORK_NOT_ALLOWED")):
            with mock.patch("builtins.open",
                            side_effect=AssertionError("FILE_IO_NOT_ALLOWED")):
                out = qualify_services_fixture_once(grant=grant(), responses=responses())
        self.assertFalse(out["liveReadPerformed"])
        self.assertFalse(out["filesWritten"])
        self.assertFalse(out["platformBusinessWrites"])
        self.assertFalse(out["printing"])


if __name__ == "__main__":
    unittest.main()
