"""AP-301 service-identity plan security tests — fake data only."""
from __future__ import annotations

import json
import socket
import unittest
from dataclasses import replace
from unittest import mock

from src.trendos_service_identity_plan import (
    DEFAULT_PLAN, ServiceIdentityPlanError, example_fake_grant,
    qualify_fake_account_grant, validate_proposed_plan,
)
from src.trendos_service_scope_gate import ServiceSpec


class AP301ServiceIdentityFakeOnly(unittest.TestCase):
    def test_baseline_requires_both_print_and_laser(self):
        result = qualify_fake_account_grant(example_fake_grant())
        self.assertEqual(result["requestedServiceCount"], 2)
        self.assertEqual(result["requestedScreenCount"], 2)
        self.assertFalse(result["productionAuthorizationAllowed"])
        self.assertFalse(result["realServiceIdentityCreated"])
        self.assertFalse(result["realBackendRoleExistsVerified"])

    def test_diaa_admin_is_rejected_as_service_identity(self):
        for who in ("ضياء", "Diaa", "admin", "owner", ""):
            fake = example_fake_grant()
            fake["subject"] = who
            with self.subTest(subject=who), self.assertRaisesRegex(
                    ServiceIdentityPlanError, "AP301_IDENTITY_NOT_DEDICATED"):
                qualify_fake_account_grant(fake)

    def test_human_employee_kind_is_rejected(self):
        for kind in ("admin", "employee", "human", "service", "", None):
            fake = example_fake_grant()
            fake["identityKind"] = kind
            with self.subTest(kind=kind), self.assertRaisesRegex(
                    ServiceIdentityPlanError, "AP301_IDENTITY_NOT_DEDICATED"):
                qualify_fake_account_grant(fake)

    def test_fake_only_flag_required(self):
        for mode in ("LIVE", "PRODUCTION", "PREVIEW", False, ""):
            fake = example_fake_grant()
            fake["fixtureKind"] = mode
            with self.subTest(mode=mode), self.assertRaisesRegex(
                    ServiceIdentityPlanError, "AP301_REAL_CREDENTIALS_FORBIDDEN"):
                qualify_fake_account_grant(fake)

    def test_no_missing_laser_or_print_screen(self):
        for screens in (["print"], ["laser"], [], "print,laser",
                        ["print", "print"], ["laser", "press"], None):
            fake = example_fake_grant()
            fake["screens"] = screens
            with self.subTest(screens=screens), self.assertRaisesRegex(
                    ServiceIdentityPlanError, "AP301_EXCESS_PERMISSIONS"):
                qualify_fake_account_grant(fake)

    def test_screens_broadening_rejected(self):
        for screen in ("press", "service", "", "admin"):
            fake = example_fake_grant()
            fake["screens"].append(screen)
            with self.subTest(screen=screen), self.assertRaisesRegex(
                    ServiceIdentityPlanError, "AP301_EXCESS_PERMISSIONS"):
                qualify_fake_account_grant(fake)

    def test_allow_read_action_only(self):
        for actions in (["orders.write"], ["orders.read", "orders.write"],
                        ["finance.read"], ["orders.read", "employee.login"],
                        [], "orders.read"):
            fake = example_fake_grant()
            fake["allowedActions"] = actions
            with self.subTest(actions=actions), self.assertRaisesRegex(
                    ServiceIdentityPlanError, "AP301_EXCESS_PERMISSIONS"):
                qualify_fake_account_grant(fake)

    def test_no_hidden_laser_or_print_dept_swap(self):
        for dept in (["طباعة"], ["ليزر"], ["طباعة", "مكبس"],
                     ["طباعة", "ليزر", "خدمة العملاء"], ["طباعة", "ليزر", "ليزر"]):
            fake = example_fake_grant()
            fake["departments"] = dept
            with self.subTest(departments=dept), self.assertRaisesRegex(
                    ServiceIdentityPlanError, "AP301_EXCESS_PERMISSIONS"):
                qualify_fake_account_grant(fake)

    def test_no_order_write_permission(self):
        fake = example_fake_grant()
        fake["canWriteOrders"] = True
        with self.assertRaisesRegex(ServiceIdentityPlanError, "AP301_FORBIDDEN_CAPABILITY"):
            qualify_fake_account_grant(fake)

    def test_no_financial_permission(self):
        fake = example_fake_grant()
        fake["canAccessFinance"] = True
        with self.assertRaisesRegex(ServiceIdentityPlanError, "AP301_FORBIDDEN_CAPABILITY"):
            qualify_fake_account_grant(fake)

    def test_no_user_management_permission(self):
        fake = example_fake_grant()
        fake["canManageUsers"] = True
        with self.assertRaisesRegex(ServiceIdentityPlanError, "AP301_FORBIDDEN_CAPABILITY"):
            qualify_fake_account_grant(fake)

    def test_no_printer_execution_permission(self):
        fake = example_fake_grant()
        fake["canPrint"] = True
        with self.assertRaisesRegex(ServiceIdentityPlanError, "AP301_FORBIDDEN_CAPABILITY"):
            qualify_fake_account_grant(fake)

    def test_no_customer_directory_permission(self):
        fake = example_fake_grant()
        fake["canReadCustomerDirectory"] = True
        with self.assertRaisesRegex(ServiceIdentityPlanError, "AP301_FORBIDDEN_CAPABILITY"):
            qualify_fake_account_grant(fake)

    def test_flags_must_be_literal_false_not_falsy(self):
        for value in (0, None, "", [], "false"):
            fake = example_fake_grant()
            fake["canWriteOrders"] = value
            with self.subTest(value=value), self.assertRaisesRegex(
                    ServiceIdentityPlanError, "AP301_FORBIDDEN_CAPABILITY"):
                qualify_fake_account_grant(fake)

    def test_credentials_extra_fields_denied(self):
        for secret_field in ("token", "password", "secret", "session", "apikey"):
            fake = example_fake_grant()
            fake[secret_field] = "UNIQUE_SECRET_NEVER_ECHO"
            with self.subTest(field=secret_field), self.assertRaisesRegex(
                    ServiceIdentityPlanError, "AP301_GRANT_SHAPE_DENIED"):
                qualify_fake_account_grant(fake)

    def test_missing_grant_field_denied(self):
        for field in tuple(example_fake_grant()):
            fake = example_fake_grant()
            del fake[field]
            with self.subTest(field=field), self.assertRaisesRegex(
                    ServiceIdentityPlanError, "AP301_GRANT_SHAPE_DENIED"):
                qualify_fake_account_grant(fake)

    def test_plan_cannot_add_unregistered_service(self):
        plan = replace(DEFAULT_PLAN, service_codes=("print", "laser", "embroidery"))
        with self.assertRaisesRegex(ServiceIdentityPlanError, "AP301_INVALID_DESIRED_POLICY"):
            validate_proposed_plan(plan)

    def test_plan_cannot_silently_change_allowed_actions(self):
        for actions in (("orders.write",), ("orders.read", "orders.write"), ()):
            with self.subTest(actions=actions), self.assertRaisesRegex(
                    ServiceIdentityPlanError, "AP301_INVALID_DESIRED_POLICY"):
                validate_proposed_plan(replace(DEFAULT_PLAN, allowed_actions=actions))

    def test_future_variant_same_screen_department_only_by_registry(self):
        catalog = {
            "print": ServiceSpec("print", "print", "طباعة"),
            "laser": ServiceSpec("laser", "laser", "ليزر"),
            "laser_engraving": ServiceSpec("laser_engraving", "laser", "ليزر"),
        }
        plan = replace(DEFAULT_PLAN, service_codes=("print", "laser", "laser_engraving"))
        outcome = qualify_fake_account_grant(example_fake_grant(), plan=plan, catalog=catalog)
        self.assertEqual(outcome["requestedServiceCount"], 3)
        self.assertEqual(outcome["requestedScreenCount"], 2)
        self.assertFalse(outcome["realPermissionsVerified"])

    def test_future_service_new_screen_needs_explicit_scope_review(self):
        catalog = {
            "print": ServiceSpec("print", "print", "طباعة"),
            "laser": ServiceSpec("laser", "laser", "ليزر"),
            "other": ServiceSpec("other", "press", "مكبس"),
        }
        plan = replace(DEFAULT_PLAN, service_codes=("print", "laser", "other"))
        with self.assertRaisesRegex(ServiceIdentityPlanError, "AP301_SCOPE_MISMATCH"):
            validate_proposed_plan(plan, catalog=catalog)

    def test_unqualified_shared_screen_scope_rejected(self):
        catalog = {
            "print": ServiceSpec("print", "print", "طباعة"),
            "laser": ServiceSpec("laser", "laser", "ليزر"),
            "bad": ServiceSpec("bad", "print", "مكبس"),
        }
        plan = replace(DEFAULT_PLAN,
                       service_codes=("print", "laser", "bad"),
                       allowed_departments=("طباعة", "ليزر", "مكبس"))
        with self.assertRaisesRegex(ServiceIdentityPlanError, "AP301_SHARED_SCREEN_NOT_QUALIFIED"):
            validate_proposed_plan(plan, catalog=catalog)

    def test_result_has_no_subject_or_business_pii(self):
        result = json.dumps(qualify_fake_account_grant(example_fake_grant()))
        self.assertNotIn("FAKE_TRENDOSSHOP_READER", result)
        self.assertNotIn("ضياء", result)
        self.assertNotIn("password", result.lower())
        self.assertNotIn("token", result.lower())

    def test_in_memory_only_no_network_or_disk(self):
        with mock.patch.object(socket.socket, "connect", side_effect=AssertionError("NO_NETWORK")):
            with mock.patch("builtins.open", side_effect=AssertionError("NO_DISK")):
                result = qualify_fake_account_grant(example_fake_grant())
        self.assertFalse(result["externalRequestsMade"])
        self.assertFalse(result["ubuntuChanged"])

if __name__ == "__main__":
    unittest.main()
