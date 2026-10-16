"""Issue #8: source-only auth configuration guards; not a deployment attestation."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[3]
CONFIG = ROOT / "config.js"

class NativeAuthConfigGuards(unittest.TestCase):
    def test_native_auth_and_canary_are_distinct(self):
        source = CONFIG.read_text(encoding="utf-8")
        self.assertRegex(source, r"window\.MATBAGY_EMPLOYEE_NATIVE_AUTH_V1\s*=\s*true\s*;")
        self.assertRegex(source, r"window\.MATBAGY_EMPLOYEE_NATIVE_AUTH_CANARY_V1\s*=\s*false\s*;")

    def test_legacy_bridge_is_disabled_in_repository_config(self):
        source = CONFIG.read_text(encoding="utf-8")
        self.assertRegex(source, r"window\.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1\s*=\s*false\s*;")
        self.assertRegex(source, r"window\.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES\s*=\s*\[\]\s*;")

if __name__ == "__main__":
    unittest.main()
