"""Source-only fixed-GET assessment tests. No network calls in this test."""
import importlib.util
import pathlib
import unittest

path = pathlib.Path(__file__).resolve().parents[1] / "scripts/entry656_public_health_probe.py"
spec = importlib.util.spec_from_file_location("entry656", path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

FRONT = "window.MATBAGY_EMPLOYEE_NATIVE_AUTH_V1 = true;\nwindow.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1 = false;"
D = {
    key: {"success": True, "schemaReady": True, "mode": mode}
    for key, mode in mod.MODES.items()
}
D["bridge"] = {"success": True, "enabled": False,
               "rawNativeTokenForwarded": False, "plaintextPasswordForwarded": False}
D["auth"].update(nativeOnly=True, envEnabled=True, legacyBootstrapEnabled=False,
                 legacySessionEnrollEnabled=False, plaintextStored=False,
                 userCount=6, nativeReadyCount=6)


class Health(unittest.TestCase):
    def test_expected_pass_is_not_zero_google(self):
        out = mod.assess(D, FRONT)
        self.assertEqual(out["healthGate"], "PASS")
        self.assertEqual(out["reasons"], [])
        self.assertFalse(out["zeroGoogleComplete"])
        self.assertFalse(out["productionMutation"])
        self.assertEqual(out["observed"], len(mod.PATHS))

    def test_auth_drift_is_detected(self):
        v = {**D, "auth": {**D["auth"], "legacyBootstrapEnabled": True}}
        out = mod.assess(v, FRONT)
        self.assertEqual(out["healthGate"], "BLOCKED")
        self.assertIn("auth:LEGACY_ENROLLMENT_RESIDUE", out["reasons"])

    def test_missing_customer_schema_and_bad_frontend(self):
        v = {**D, "customers": {**D["customers"], "schemaReady": False}}
        out = mod.assess(v, "")
        self.assertIn("customers:SCHEMA_UNVERIFIED", out["reasons"])
        self.assertIn("frontend:NATIVE_AUTH_FLAG_UNVERIFIED", out["reasons"])

    def test_unknown_and_invalid_users_fail_closed(self):
        v = {**D, "auth": {**D["auth"], "userCount": None, "nativeReadyCount": 0}}
        out = mod.assess(v, FRONT)
        self.assertIn("auth:USER_READINESS_UNVERIFIED", out["reasons"])
        self.assertFalse(out["zeroGoogleComplete"])

    def test_unreachable_auth_not_misreported_as_runtime_drift(self):
        v = {**D, "auth": {}, "bridge": {}}
        out = mod.assess(v, FRONT)
        self.assertIn("auth:MISSING_OR_UNHEALTHY", out["reasons"])
        self.assertIn("bridge:MISSING_OR_UNHEALTHY", out["reasons"])
        self.assertNotIn("auth:LEGACY_ENROLLMENT_RESIDUE", out["reasons"])
        self.assertNotIn("bridge:LEGACY_EMPLOYEE_BRIDGE_ENABLED", out["reasons"])
        self.assertFalse(out["zeroGoogleComplete"])

    def test_expected_hosts_and_allowlisted_paths_only(self):
        self.assertEqual(mod.BASE, "https://trendos-d1-api.trendmall-contact.workers.dev")
        self.assertEqual(mod.FRONT, "https://trendos-ui.trendmall-contact.workers.dev/config.js")
        self.assertEqual(len(mod.PATHS), 8)
        for p in mod.PATHS.values():
            self.assertRegex(p, r"^/v1/[a-z0-9\-/]+/health$")
        self.assertIn("--max-redirs", path.read_text(encoding="utf-8"))
        self.assertIn("--proto", path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
