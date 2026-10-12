"""AP-236 synthetic trusted-boundary and immutable catalog tests; no host I/O."""
import ast
import dataclasses
import runpy
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "local_executor" / "trust_boundary.py"
m = runpy.run_path(str(SOURCE))
check = m["evaluate_review_handoff"]
PIN = "a" * 40
TOKEN = "c" * 64


def plan(op="git_status"):
    return {
        "schema": m["POLICY_SCHEMA"],
        "operation": op,
        "commit": PIN,
        "request_id": "ap236_synthetic_00001",
        "args": {},
    }


def review():
    return {
        "decision": "REVIEW_ONLY",
        "reason": "NO_EXECUTOR_OR_DURABLE_REPLAY_STORE",
        "replay_token": TOKEN,
    }


def record():
    return {
        "decision": "RECORDED_REVIEW_ONLY",
        "reason": "NO_EXECUTOR_OR_REAL_AUTH",
    }


def call(p=None, r=None, j=None, **overrides):
    options = {
        "expected_commit": PIN,
        "expected_catalog_digest": m["catalog_digest"](),
    }
    options.update(overrides)
    return check(
        plan() if p is None else p,
        review() if r is None else r,
        record() if j is None else j,
        **options,
    )


class TestAP236TrustBoundary(unittest.TestCase):
    def assert_denied(self, result):
        self.assertEqual(result["decision"], "DENY", result)
        self.assertEqual(set(result), {"decision", "reason"})
        self.assertNotIn(TOKEN, repr(result))

    def test_review_chain_is_always_blocked_even_with_pins(self):
        for op in ("python_version", "git_head", "git_status"):
            with self.subTest(op=op):
                result = call(p=plan(op))
                self.assertEqual(result["decision"], "BLOCKED")
                self.assertEqual(result["reason"], "INDEPENDENT_TRUST_AND_SANDBOX_NOT_IMPLEMENTED")
                self.assertEqual(result["candidate_operation"], op)
                self.assertEqual(result["unverified_gates"], m["UNVERIFIED_GATES"])
                self.assertNotIn("EXECUTE", repr(result))

    def test_all_runtime_capabilities_default_off(self):
        for key in ("EXECUTION_ENABLED", "NETWORK_ENABLED",
                    "COMMAND_DISPATCH_IMPLEMENTED", "REAL_TRUST_CHAIN_IMPLEMENTED",
                    "OS_SANDBOX_IMPLEMENTED", "AUDIT_CHAIN_IMPLEMENTED"):
            self.assertIs(m[key], False)

    def test_catalog_has_only_three_fixed_operations(self):
        ops = m["catalog"]()
        self.assertEqual(tuple(x.operation_id for x in ops),
                         ("git_head", "git_status", "python_version"))
        self.assertEqual(len(set(x.operation_id for x in ops)), 3)

    def test_catalog_entries_are_immutable(self):
        first = m["catalog"]()[0]
        with self.assertRaises(dataclasses.FrozenInstanceError):
            first.operation_id = "sudo"
        with self.assertRaises(dataclasses.FrozenInstanceError):
            first.network_access = True
        with self.assertRaises(TypeError):
            m["_CATALOG"]["shell"] = first

    def test_no_catalog_entry_grants_writes_privilege_network_or_shell(self):
        for item in m["catalog"]():
            with self.subTest(operation=item.operation_id):
                self.assertFalse(item.network_access)
                self.assertFalse(item.write_access)
                self.assertFalse(item.privileged)
                self.assertFalse(item.shell)
                self.assertLessEqual(item.max_runtime_seconds, 5)
                self.assertLessEqual(item.max_output_bytes, 1024)
                self.assertGreater(item.max_output_bytes, 0)
                self.assertNotIn("path", repr(item).lower())
                self.assertNotIn("customer", repr(item).lower())

    def test_catalog_digest_stable_hex64(self):
        first = m["catalog_digest"]()
        self.assertRegex(first, r"^[a-f0-9]{64}$")
        self.assertEqual(first, m["catalog_digest"]())

    def test_catalog_spec_tampering_cannot_affect_digest(self):
        start = m["catalog_digest"]()
        cloned = list(m["catalog"]())
        cloned.append("sudo")
        self.assertEqual(m["catalog_digest"](), start)
        self.assertEqual(len(m["catalog"]()), 3)

    def test_full_security_blocker_list_never_empty(self):
        blocked = m["UNVERIFIED_GATES"]
        self.assertIsInstance(blocked, tuple)
        self.assertGreaterEqual(len(blocked), 7)
        for gate in blocked:
            self.assertRegex(gate, r"^[a-z][a-z_]+$")

    def test_compatible_with_ap233_fixed_allowlist(self):
        source = runpy.run_path(str(ROOT / "local_executor" / "policy.py"))
        self.assertEqual(set(x.operation_id for x in m["catalog"]()),
                         source["APPROVED_OPERATIONS"])
        self.assertEqual(m["POLICY_SCHEMA"], source["POLICY_SCHEMA"])
        self.assertFalse(source["EXECUTION_ENABLED"])

    def test_compatible_with_ap234_candidate_operations(self):
        source = runpy.run_path(str(ROOT / "local_executor" / "authorization_contract.py"))
        self.assertEqual(set(x.operation_id for x in m["catalog"]()),
                         source["CANDIDATE_OPERATIONS"])
        self.assertFalse(source["EXECUTION_ENABLED"])

    def test_compatible_with_ap235_journal_ops(self):
        source = runpy.run_path(str(ROOT / "local_executor" / "receipt_journal.py"))
        self.assertEqual(set(x.operation_id for x in m["catalog"]()),
                         source["_ALLOWED"])
        self.assertFalse(source["EXECUTION_ENABLED"])

    def test_fail_closed_when_no_external_pins(self):
        self.assert_denied(check(plan(), review(), record()))
        self.assert_denied(call(expected_commit=None))
        self.assert_denied(call(expected_catalog_digest=None))
        self.assert_denied(call(expected_catalog_digest="0" * 64))

    def test_bad_plan_envelopes_denied(self):
        for bad in ([], False, "", 1, {}, {"schema": m["POLICY_SCHEMA"]},
                    {**plan(), "run": True}, {**plan(), "command": "whoami"}):
            with self.subTest(value=repr(bad)[:50]):
                self.assert_denied(call(p=bad))

    def test_unapproved_or_malformed_operation_denied(self):
        for op in ("", "sudo", "bash", "print", "d1_write", "netbird_up",
                   "git_pull", "git_status;id", "git_status\nwhoami", None, []):
            with self.subTest(op=repr(op)[:25]):
                self.assert_denied(call(p={**plan(), "operation": op}))

    def test_arbitrary_arguments_environment_and_paths_denied(self):
        for extra in ({"command": "sudo"}, {"path": "/etc/shadow"},
                      {"args": ["--delete"]}, {"args": {"cmd": "ls"}},
                      {"env": {"HOME": "/etc"}}, {"owner_gate": True}):
            with self.subTest(extra=str(extra)[:35]):
                self.assert_denied(call(p={**plan(), **extra}))

    def test_wrong_schema_and_commit_denied(self):
        for bad in ("b" * 40, "A" * 40, "a" * 39, True, None):
            self.assert_denied(call(p={**plan(), "commit": bad}))
        self.assert_denied(call(p={**plan(), "schema": "unknown"}))
        self.assert_denied(call(expected_commit="b" * 40))

    def test_untrusted_request_id_inputs_denied(self):
        for bad in ("short", "x" * 65, "../outside", "spaces no",
                    2, True, "اسم", "x\nwhoami"):
            self.assert_denied(call(p={**plan(), "request_id": bad}))

    def test_unsigned_or_forged_review_denied(self):
        for bad in ([], None, {}, {**review(), "execute": True},
                    {**review(), "decision": "EXECUTE"},
                    {**review(), "reason": "OWNER_APPROVED"},
                    {**review(), "replay_token": "x" * 64}):
            self.assert_denied(call(r=bad))

    def test_invalid_journal_receipts_denied(self):
        for bad in ([], None, {}, {**record(), "execute": True},
                    {**record(), "decision": "RUN"},
                    {**record(), "reason": "APPROVED"},
                    {**record(), "token": TOKEN}):
            self.assert_denied(call(j=bad))

    def test_owner_approval_spoof_is_not_dispatch_authority(self):
        forged = {**plan(), "owner_approved": True}
        self.assert_denied(call(p=forged))
        self.assertEqual(call()["decision"], "BLOCKED")

    def test_input_objects_unchanged(self):
        p, r, j = plan(), review(), record()
        self.assertEqual(call(p=p, r=r, j=j)["decision"], "BLOCKED")
        self.assertEqual(p, plan())
        self.assertEqual(r, review())
        self.assertEqual(j, record())

    def test_no_untrusted_ids_or_tokens_echoed(self):
        decision = call()
        self.assertNotIn(PIN, repr(decision))
        self.assertNotIn(TOKEN, repr(decision))
        self.assertNotIn(plan()["request_id"], repr(decision))

    def test_no_imported_io_or_code_execution_tools(self):
        parsed = ast.parse(SOURCE.read_text(encoding="utf-8"))
        prohibited = {"subprocess", "socket", "pathlib", "sqlite3", "os",
                      "ctypes", "urllib", "requests", "importlib", "http"}
        banned_calls = {"eval", "exec", "open", "__import__", "compile", "Popen"}
        for item in ast.walk(parsed):
            if isinstance(item, ast.Import):
                self.assertFalse({x.name.split(".")[0] for x in item.names} & prohibited)
            elif isinstance(item, ast.ImportFrom):
                self.assertNotIn((item.module or "").split(".")[0], prohibited)
            elif isinstance(item, ast.Call) and isinstance(item.func, ast.Name):
                self.assertNotIn(item.func.id, banned_calls)


if __name__ == "__main__":
    unittest.main(verbosity=2)
