"""AP-265 hosted synthetic tests for declarative host boundary SPEC ONLY."""
from __future__ import annotations

import copy
import inspect
import json
from pathlib import Path
import unittest
from unittest.mock import patch

import host_boundary_profile as profile
import policy
import trust_boundary

MANIFEST = (
    Path(__file__).resolve().parents[1]
    / "local_executor" / "AP265_OFFLINE_HOST_BOUNDARY_PROFILE.json"
)


def base():
    return json.loads(MANIFEST.read_text(encoding="ascii"))


def check(candidate):
    return profile.review_host_boundary_profile(
        json.dumps(candidate, separators=(",", ":"), sort_keys=True)
    )


class AP265HostBoundaryTests(unittest.TestCase):
    def assert_all_off(self, actual):
        for key in (
            "host_attested", "owner_authenticated", "execution_authorized",
            "remote_channel_established", "sandbox_installed",
            "real_stop_installed",
        ):
            self.assertIs(actual[key], False, key)

    def assert_rejected(self, candidate):
        verdict = check(candidate)
        self.assertEqual(verdict["decision"], "DENY")
        self.assert_all_off(verdict)

    def test_versioned_reference_spec_remains_blocked(self):
        result = check(base())
        self.assertEqual(result["decision"], "BLOCKED")
        self.assertEqual(result["reason"], "SPEC_MATCH_ONLY_REAL_HOST_GATES_MISSING")
        self.assertEqual(len(result["spec_sha256"]), 64)
        self.assertEqual(result["catalog_digest"], trust_boundary.catalog_digest())
        self.assertEqual(result["unverified_gates"], trust_boundary.UNVERIFIED_GATES)
        self.assert_all_off(result)

    def test_official_manifest_has_exact_expected_shape(self):
        self.assertEqual(base(), profile.REQUIRED_PROFILE)
        self.assertEqual(base()["operations"], ["git_head", "git_status", "python_version"])

    def test_no_unlisted_operation(self):
        for op in ("shell", "apt", "print", "ssh", "git_reset"):
            data = base()
            data["operations"].append(op)
            with self.subTest(op=op):
                self.assert_rejected(data)

    def test_cannot_enable_network_transport(self):
        for value in ("ON", "SSH", "HTTPS_POLLING", "NETBIRD", "AUTO"):
            data = base()
            data["transport"] = value
            with self.subTest(value=value):
                self.assert_rejected(data)

    def test_no_inbound_network(self):
        data = base()
        data["isolation"]["inbound_network"] = "LISTEN_ON_0.0.0.0"
        self.assert_rejected(data)

    def test_no_external_egress_in_offline_pilot(self):
        data = base()
        data["isolation"]["external_network"] = "ALLOW_ALL"
        self.assert_rejected(data)

    def test_sudo_privilege_and_root_are_denied(self):
        for section, field, value in [
            ("isolation", "sudo", "ALLOWED"),
            ("isolation", "identity", "ROOT"),
        ]:
            data = base()
            data[section][field] = value
            with self.subTest(field=field):
                self.assert_rejected(data)

    def test_shell_is_forbidden(self):
        data = base()
        data["isolation"]["shell"] = "ALLOWED"
        self.assert_rejected(data)

    def test_owner_home_and_repo_view_guard(self):
        for key, value in [
            ("host_home_access", "MOUNT_RW"),
            ("source_view", "OWNER_HOME_RW"),
        ]:
            data = base()
            data["isolation"][key] = value
            with self.subTest(key=key):
                self.assert_rejected(data)

    def test_customer_and_win7_paths_never_mounted(self):
        data = base()
        data["isolation"]["customer_and_win7_mounts"] = "READ_ONLY"
        self.assert_rejected(data)

    def test_printers_forbidden(self):
        data = base()
        data["isolation"]["printer_access"] = "CUPS_ALLOWED"
        self.assert_rejected(data)

    def test_finance_data_forbidden(self):
        data = base()
        data["isolation"]["financial_data"] = "READ_ONLY"
        self.assert_rejected(data)

    def test_secrets_forbidden(self):
        data = base()
        data["isolation"]["host_secrets"] = "ENV_TOKENS"
        self.assert_rejected(data)

    def test_resource_caps_required(self):
        data = base()
        data["isolation"]["resource_caps"] = "UNLIMITED"
        self.assert_rejected(data)

    def test_no_unrestricted_filesystem_writes(self):
        data = base()
        data["isolation"]["filesystem_writes"] = "ANYWHERE"
        self.assert_rejected(data)

    def test_no_automatic_restart_and_no_execution_pilot(self):
        for key, value in [
            ("automatic_restart", "ALWAYS"),
            ("pilot_operation", "READY_TO_EXECUTE"),
            ("real_external_stop", "CLAIMED_INSTALLED"),
        ]:
            data = base()
            data["control"][key] = value
            with self.subTest(key=key):
                self.assert_rejected(data)

    def test_no_owner_approval_forged(self):
        data = base()
        data["approval"] = "GRANTED"
        self.assert_rejected(data)

    def test_no_deployment_forged(self):
        data = base()
        data["deployment"] = "INSTALLED"
        self.assert_rejected(data)

    def test_trust_cannot_be_promoted_by_bool_or_text(self):
        for key in base()["trust"]:
            data = base()
            data["trust"][key] = "VERIFIED"
            with self.subTest(key=key):
                self.assert_rejected(data)
        data = base()
        data["trust"]["device_identity"] = True
        self.assert_rejected(data)

    def test_unknown_and_missing_fields_denied(self):
        data = base()
        data["sudo_command"] = "curl"
        self.assert_rejected(data)
        data = base()
        data.pop("approval")
        self.assert_rejected(data)
        data = base()
        data["isolation"]["extra_mount"] = "/"
        self.assert_rejected(data)
        data = base()
        data["control"].pop("test_data")
        self.assert_rejected(data)

    def test_malformed_non_ascii_multiline_and_oversize_denied(self):
        for payload in (
            None, b"{}", {}, [], "[]", "null", "NaN", "{",
            "x" * (profile.MAX_INPUT_BYTES + 1),
            json.dumps(base()) + "\n", "\r" + json.dumps(base()),
            "أي بيانات عربية",
        ):
            with self.subTest(payload=str(payload)[:20]):
                result = profile.review_host_boundary_profile(payload)
                self.assertEqual(result["decision"], "DENY")
                self.assert_all_off(result)

    def test_duplicate_root_json_key_denied(self):
        raw = json.dumps(base(), sort_keys=True, separators=(",", ":"))
        duplicated = raw.replace('"transport":"OFF"', '"transport":"OFF","transport":"OFF"')
        self.assertNotEqual(duplicated, raw)
        result = profile.review_host_boundary_profile(duplicated)
        self.assertEqual(result["decision"], "DENY")
        self.assert_all_off(result)

    def test_duplicate_nested_json_key_denied(self):
        raw = json.dumps(base(), sort_keys=True, separators=(",", ":"))
        duplicated = raw.replace('"sudo":"FORBIDDEN"', '"sudo":"FORBIDDEN","sudo":"FORBIDDEN"')
        self.assertNotEqual(duplicated, raw)
        result = profile.review_host_boundary_profile(duplicated)
        self.assertEqual(result["decision"], "DENY")

    def test_ap233_catalog_drift_fails_closed(self):
        with patch.object(policy, "APPROVED_OPERATIONS", frozenset({"git_head", "print"})):
            result = check(base())
            self.assertEqual(result["decision"], "DENY")
            self.assertEqual(result["reason"], "AP233_AP236_CATALOG_DRIFT")

    def test_ap236_catalog_drift_fails_closed(self):
        original = trust_boundary.catalog
        with patch.object(trust_boundary, "catalog", lambda: original()[:-1]):
            result = check(base())
            self.assertEqual(result["decision"], "DENY")
            self.assertEqual(result["reason"], "AP233_AP236_CATALOG_DRIFT")

    def test_canonical_fingerprint_independent_of_json_order(self):
        a = base()
        raw1 = json.dumps(a, sort_keys=True, separators=(",", ":"))
        raw2 = json.dumps(a, sort_keys=False, separators=(", ", ": "))
        x = profile.review_host_boundary_profile(raw1)
        y = profile.review_host_boundary_profile(raw2)
        self.assertEqual(x["decision"], "BLOCKED")
        self.assertEqual(x["spec_sha256"], y["spec_sha256"])

    def test_never_echoes_secrets_paths_or_account_data(self):
        data = base()
        marker = "PRIVATE_CUSTOMER_RECEIPT_DO_NOT_ECHO"
        data["unsafe_text"] = marker
        result = check(data)
        self.assertEqual(result["decision"], "DENY")
        self.assertNotIn(marker, str(result))

    def test_imports_have_no_host_side_effects(self):
        source = inspect.getsource(profile)
        for forbidden in (
            "import subprocess", "import socket", "import os",
            "import pathlib", "open(", "Popen(", "eval(", "exec(",
            "systemctl", "sudo ", "import requests", "urllib",
        ):
            with self.subTest(snippet=forbidden):
                self.assertNotIn(forbidden, source)
        self.assertIs(profile.EXECUTOR_ENABLED, False)
        self.assertIs(profile.TRANSPORT_ENABLED, False)
        self.assertIs(profile.SANDBOX_INSTALLED, False)
        self.assertIs(profile.OWNER_CONSENT_GRANTED, False)
        self.assertIs(profile.REAL_STOP_ENABLED, False)
        self.assertIs(profile.LIVE_IDENTITY_ESTABLISHED, False)


if __name__ == "__main__":
    unittest.main()
