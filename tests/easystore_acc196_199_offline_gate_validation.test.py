#!/usr/bin/env python3
"""Adversarial tests for simulated rollback, A2.13 and financial owner STOP."""
import copy
import importlib.util
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/easystore_acc196_199_offline_gate_validation.py"
spec = importlib.util.spec_from_file_location("acc196_199", SOURCE)
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)
DOC = json.loads((ROOT / "docs/trendos/staging/ACC196_199_SAFE_PREPARATION_NO_GO_20261012.json").read_text(encoding="utf-8"))


class OfflineGatesTest(unittest.TestCase):
    def test_acc186_queue_remains_unverified(self):
        ledger = json.loads((ROOT / "docs/trendos/staging/ACC186_ACCOUNTING_SAFE_EXECUTION_LEDGER_20261012.json").read_text(encoding="utf-8"))
        self.assertEqual(ledger["release_decision"], "NO_GO")
        self.assertEqual(set(ledger["gates"].values()), {"OPEN"})
        tracked = {x["id"]: x for x in ledger["safe_queue"]}
        for stage in ("ACC-195", "ACC-196", "ACC-197", "ACC-198", "ACC-199"):
            task = tracked[stage]
            self.assertEqual(task["state"], "IN_PROGRESS_UNVERIFIED")
            self.assertIsNone(task["verified_at"])
            self.assertIsNone(task["ci_run"])
            self.assertIsNone(task["pr"])

    def test_baseline_no_go(self):
        self.assertTrue(guard.validate_manifest(DOC))

    def reject(self, operation):
        changed = copy.deepcopy(DOC)
        operation(changed)
        with self.assertRaises(ValueError):
            guard.validate_manifest(changed)

    def test_go_forgery_rejected(self):
        self.reject(lambda d: d.update(release_decision="GO"))

    def test_real_canary_rejected(self):
        self.reject(lambda d: d.update(real_canary_approved=True))

    def test_real_worker_version_assumption_rejected(self):
        self.reject(lambda d: d.update(previous_live_worker_version_id="unknown-real-worker"))

    def test_real_rollback_approval_rejected(self):
        self.reject(lambda d: d.update(production_rollback_approved=True))

    def test_g1_forgery_rejected(self):
        self.reject(lambda d: d["gates"].update(G1="CLOSED"))

    def test_deployed_operation_rejected(self):
        self.reject(lambda d: d["remote_operations"].append("wrangler deploy"))

    def test_a213_trial_forgery_rejected(self):
        self.reject(lambda d: d["a213_protocol"].update(trial_run_id=12345))

    def test_integrated_signoff_forgery_rejected(self):
        self.reject(lambda d: d["stages"]["ACC-198"].update(status="VERIFIED_COMPLETE"))

    def test_missing_refund_gap_rejected(self):
        self.reject(lambda d: d["gaps"].pop("ACC-187"))

    def test_fake_rollback_does_not_rewind_ledger(self):
        candidate, original = guard.simulate_code_pointer_rollback("PASS")
        previous, after = guard.simulate_code_pointer_rollback("FAIL")
        self.assertEqual(candidate, "SYNTHETIC_CANDIDATE")
        self.assertEqual(previous, "SYNTHETIC_PREVIOUS")
        self.assertEqual(original, after)

    def test_fake_rollback_data_mutation_denied(self):
        with self.assertRaisesRegex(ValueError, "fake ledger changed"):
            guard.simulate_code_pointer_rollback("FAIL", mutate_data=True)


if __name__ == "__main__":
    unittest.main()
