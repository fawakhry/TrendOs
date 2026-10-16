"""Offline synthetic regression checks for strict success contract; no host or network access."""
import importlib.util
from pathlib import Path
import unittest

MODULE = Path(__file__).resolve().parents[1] / "src" / "trendos_shadow_qualifier.py"
spec = importlib.util.spec_from_file_location("shadow_qualifier", MODULE)
qualifier = importlib.util.module_from_spec(spec)
spec.loader.exec_module(qualifier)

class FakeClient:
    connected = True
    def __init__(self, response): self.response = response
    def get_rows(self, screen): return self.response

class StrictSuccessTests(unittest.TestCase):
    def test_literal_true_allows_empty_rows(self):
        self.assertEqual(qualifier.qualify_screen_once(FakeClient({"success": True, "rows": []}), "print")["rowCount"], 0)

    def test_missing_or_non_boolean_success_rejected(self):
        for value in (None, False, 0, 1, "true", [], {}):
            with self.subTest(value=value):
                response = {"rows": []}
                if value is not None: response["success"] = value
                with self.assertRaises(qualifier.ShadowQualificationError):
                    qualifier.qualify_screen_once(FakeClient(response), "print")

    def test_paginated_response_is_not_silently_treated_as_complete_snapshot(self):
        for marker in ("page", "pageSize", "totalPages", "nextCursor", "cursor", "snapshotId"):
            with self.subTest(marker=marker):
                payload = {"success": True, "rows": [], marker: 1}
                with self.assertRaisesRegex(qualifier.ShadowQualificationError, "AP296_PAGINATED_CONTRACT_NOT_SUPPORTED"):
                    qualifier.qualify_screen_once(FakeClient(payload), "print")

    def test_shadow_read_action_remains_get_rows(self):
        self.assertEqual(qualifier.SHADOW_READ_ACTION, "getRows")

if __name__ == "__main__": unittest.main()
