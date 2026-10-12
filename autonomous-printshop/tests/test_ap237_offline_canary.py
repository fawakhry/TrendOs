"""AP-237 pure synthetic offline canary + kill-switch model tests.

NO Ubuntu operations, customer files, real service, device identity or SSH.
"""
import ast
import dataclasses
import itertools
import runpy
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "local_executor" / "offline_canary.py"
m = runpy.run_path(str(SOURCE))
assess = m["assess_offline_canary"]
GATES = m["REQUIRED_EVIDENCE"]


def claims(override=None):
    value = dict.fromkeys(GATES, True)
    if override:
        value.update(override)
    return value


class TestAP237OfflineKillSwitch(unittest.TestCase):
    def assert_never_runs(self, receipt):
        self.assertIsInstance(receipt, m["ReviewSummary"])
        self.assertIn(receipt.decision, ("BLOCKED", "DENY"))
        self.assertIn(receipt.review_state,
                      ("SPEC_OFF", "SPEC_REVIEW_BLOCKED", "SPEC_STOP_LATCHED"))
        self.assertEqual(receipt.host_effect, "NONE")
        self.assertNotIn("RUN", receipt.decision)
        self.assertNotIn("READY", receipt.decision)

    def test_default_without_event_denies(self):
        decision = assess()
        self.assert_never_runs(decision)
        self.assertEqual(decision.reason, "UNKNOWN_EVENT_FAIL_CLOSED")

    def test_all_runtime_capabilities_off(self):
        for flag in ("EXECUTOR_ENABLED", "TRANSPORT_ENABLED", "SERVICE_INSTALLED",
                     "HOST_ATTESTATION_IMPLEMENTED", "PERSISTENT_STOP_LATCH_IMPLEMENTED",
                     "LIVE_CREDENTIALS_CONFIGURED"):
            self.assertIs(m[flag], False)

    def test_missing_evidence_is_blocked(self):
        for bad in (None, False, [], {}, "yes", 123):
            with self.subTest(evidence=repr(bad)):
                result = assess(event="OFFLINE_REVIEW", evidence=bad)
                self.assert_never_runs(result)
                self.assertEqual(result.reason, "MISSING_OR_EXTRA_CLAIMS")

    def test_extra_claim_cannot_grant_runtime(self):
        result = assess(event="OFFLINE_REVIEW",
                        evidence={**claims(), "execute": True})
        self.assert_never_runs(result)
        self.assertEqual(result.reason, "MISSING_OR_EXTRA_CLAIMS")

    def test_owner_approval_spoof_rejected_as_extra(self):
        result = assess(event="OFFLINE_REVIEW",
                        evidence={**claims(), "owner_approved": True})
        self.assert_never_runs(result)
        self.assertEqual(result.review_state, "SPEC_OFF")

    def test_every_individual_false_gate_blocks(self):
        for gate in GATES:
            with self.subTest(gate=gate):
                result = assess(event="OFFLINE_REVIEW",
                                evidence=claims({gate: False}))
                self.assert_never_runs(result)
                self.assertEqual(result.reason, "INCOMPLETE_SYNTHETIC_READINESS")
                self.assertEqual(result.missing_evidence, (gate,))

    def test_full_false_matrix_bounded(self):
        for mask in itertools.product((False, True), repeat=4):
            selected = dict(zip(GATES[:4], mask))
            result = assess(event="OFFLINE_REVIEW", evidence=claims(selected))
            self.assert_never_runs(result)
            if all(mask):
                self.assertEqual(result.reason, "ALL_CLAIMS_UNVERIFIED_AND_NO_RUNTIME")
            else:
                self.assertEqual(result.reason, "INCOMPLETE_SYNTHETIC_READINESS")

    def test_all_true_is_still_blocked(self):
        result = assess(event="OFFLINE_REVIEW", evidence=claims())
        self.assert_never_runs(result)
        self.assertEqual(result.reason, "ALL_CLAIMS_UNVERIFIED_AND_NO_RUNTIME")
        self.assertEqual(result.review_state, "SPEC_REVIEW_BLOCKED")

    def test_truthy_strings_and_integers_rejected(self):
        for bad in (1, "true", 0, None, [], {"value": True}):
            with self.subTest(value=repr(bad)):
                result = assess(event="OFFLINE_REVIEW",
                                evidence=claims({GATES[0]: bad}))
                self.assert_never_runs(result)
                self.assertEqual(result.reason, "INVALID_EVIDENCE_TYPES")

    def test_stop_from_off_even_without_evidence(self):
        result = assess(event="EMERGENCY_STOP")
        self.assert_never_runs(result)
        self.assertEqual(result.review_state, "SPEC_STOP_LATCHED")
        self.assertEqual(result.reason, "SPEC_STOP_ONLY_NO_HOST_EFFECT")

    def test_stop_from_review_blocked(self):
        result = assess("SPEC_REVIEW_BLOCKED", "EMERGENCY_STOP", claims())
        self.assert_never_runs(result)
        self.assertEqual(result.review_state, "SPEC_STOP_LATCHED")

    def test_stop_from_stopped_is_idempotent(self):
        result = assess("SPEC_STOP_LATCHED", "EMERGENCY_STOP")
        self.assert_never_runs(result)
        self.assertEqual(result.review_state, "SPEC_STOP_LATCHED")

    def test_stop_is_sticky_across_review_attempts(self):
        result = assess("SPEC_STOP_LATCHED", "OFFLINE_REVIEW", claims())
        self.assert_never_runs(result)
        self.assertEqual(result.reason, "STOP_LATCH_REQUIRES_OWNER_RESET_NOT_IMPLEMENTED")
        self.assertEqual(result.review_state, "SPEC_STOP_LATCHED")

    def test_stop_cannot_be_rearmed_by_claims(self):
        for bad in ({}, claims(), {"resume": True}):
            with self.subTest(value=str(bad)[:40]):
                result = assess("SPEC_STOP_LATCHED", "OFFLINE_REVIEW", bad)
                self.assert_never_runs(result)
                self.assertEqual(result.review_state, "SPEC_STOP_LATCHED")

    def test_unknown_event_fail_closed(self):
        for event in ("ENABLE", "RUN", "EXECUTE", "RESUME", "REARM", "DEPLOY",
                      "INSTALL", "START_SERVICE", "netbird_up", "", True, None, 1):
            with self.subTest(event=repr(event)):
                result = assess(event=event, evidence=claims())
                self.assert_never_runs(result)
                self.assertEqual(result.reason, "UNKNOWN_EVENT_FAIL_CLOSED")

    def test_unknown_state_cannot_qualify(self):
        for state in ("LIVE", "ON", "READY", "EXECUTING", None, True, [], 0):
            with self.subTest(state=repr(state)):
                result = assess(state=state, event="OFFLINE_REVIEW", evidence=claims())
                self.assert_never_runs(result)
                self.assertEqual(result.reason, "UNKNOWN_STATE_FAIL_CLOSED")

    def test_output_is_frozen(self):
        result = assess(event="OFFLINE_REVIEW", evidence=claims())
        with self.assertRaises(dataclasses.FrozenInstanceError):
            result.decision = "READY"
        with self.assertRaises(dataclasses.FrozenInstanceError):
            result.host_effect = "EXECUTED"

    def test_evidence_not_modified(self):
        original = claims({GATES[0]: False})
        prior = original.copy()
        assess(event="OFFLINE_REVIEW", evidence=original)
        self.assertEqual(original, prior)

    def test_evidence_names_consistent_with_ap236(self):
        parent = runpy.run_path(str(ROOT / "local_executor" / "trust_boundary.py"))
        self.assertEqual(GATES[:len(parent["UNVERIFIED_GATES"])],
                         parent["UNVERIFIED_GATES"])
        self.assertEqual(len(GATES), len(set(GATES)))

    def test_stop_gate_descriptions_cover_required(self):
        desc = m["required_gate_descriptions"]()
        self.assertEqual(set(desc), set(GATES))
        self.assertTrue(all(isinstance(v, str) and v for v in desc.values()))
        with self.assertRaises(TypeError):
            desc[GATES[0]] = "spoof"

    def test_no_customer_filenames_or_secrets_in_receipts(self):
        result = assess(event="OFFLINE_REVIEW", evidence=claims())
        for suspect in ("/etc/", "D:\\", "password", "token=", "CLOUDFLARE_API"):
            self.assertNotIn(suspect, repr(result))

    def test_no_host_io_or_exec_source_imports(self):
        ast_tree = ast.parse(SOURCE.read_text(encoding="utf-8"))
        banned = {"subprocess", "socket", "os", "pathlib", "sqlite3",
                  "urllib", "requests", "ctypes", "importlib", "http"}
        forbidden = {"eval", "exec", "open", "__import__", "compile", "Popen"}
        for node in ast.walk(ast_tree):
            if isinstance(node, ast.Import):
                self.assertFalse({n.name.split(".")[0] for n in node.names} & banned)
            elif isinstance(node, ast.ImportFrom):
                self.assertNotIn((node.module or "").split(".")[0], banned)
            elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                self.assertNotIn(node.func.id, forbidden)


if __name__ == "__main__":
    unittest.main(verbosity=2)
