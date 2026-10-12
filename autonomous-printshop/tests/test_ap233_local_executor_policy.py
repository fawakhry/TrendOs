"""AP-233 synthetic fail-closed policy qualification; NEVER touches Ubuntu."""
import ast
import runpy
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "local_executor" / "policy.py"
module = runpy.run_path(str(SOURCE))
qualify = module["qualify_plan"]
SCHEMA = module["POLICY_SCHEMA"]
COMMIT = "a" * 40


def candidate(operation="git_status"):
    return {
        "schema": SCHEMA,
        "operation": operation,
        "commit": COMMIT,
        "request_id": "synthetic_ap233_001",
        "args": {},
    }


def approved(**overrides):
    return {
        "owner_gate": True,
        "non_root": True,
        "isolated": True,
        "pinned_commit": COMMIT,
        **overrides,
    }


class LocalDiagnosticPolicyTests(unittest.TestCase):
    def assert_denied(self, request, reason=None, **kw):
        decision = qualify(request, **kw)
        self.assertEqual(decision["decision"], "DENY", decision)
        if reason:
            self.assertEqual(decision["reason"], reason)
        self.assertNotIn("operation", decision)
        return decision

    def test_disabled_by_default_even_for_valid_candidate(self):
        self.assert_denied(candidate(), "OWNER_GATE_OFF")
        self.assertFalse(module["EXECUTION_ENABLED"])
        self.assertFalse(module["NETWORK_LISTENER_ENABLED"])
        self.assertFalse(module["SHELL_EXECUTION_ENABLED"])

    def test_all_gates_required_separately(self):
        for missing in ("owner_gate", "non_root", "isolated", "pinned_commit"):
            with self.subTest(missing=missing):
                gates = approved()
                gates.pop(missing)
                self.assert_denied(candidate(), **gates)

    def test_only_fixed_readonly_operations_may_be_planned(self):
        for op in ("python_version", "git_head", "git_status"):
            with self.subTest(op=op):
                result = qualify(candidate(op), **approved())
                self.assertEqual(result, {
                    "decision": "PLAN_ONLY",
                    "reason": "NO_EXECUTOR_IMPLEMENTED",
                    "operation": op,
                })

    def test_shell_and_business_mutations_rejected(self):
        for op in (
            "bash", "/bin/sh", "sudo", "git_status; rm -rf /",
            "git_checkout", "git_pull", "git_reset", "install_runner",
            "netbird_up", "ssh", "print", "production_deploy",
            "d1_write", "windows7_copy", "", "git_status\nwhoami",
        ):
            with self.subTest(op=op):
                self.assert_denied(candidate(op), "OPERATION_NOT_ALLOWED", **approved())

    def test_no_dynamic_args_commands_paths_or_tokens(self):
        for field, value in (
            ("args", {"path": "/etc/shadow"}),
            ("args", {"cmd": "curl example.invalid"}),
            ("args", {"shell": True}),
            ("command", "whoami"),
            ("token", "secret-not-real"),
            ("env", {"PATH": "/tmp"}),
            ("owner_gate", True),
            ("execute", True),
        ):
            with self.subTest(field=field):
                request = candidate()
                request[field] = value
                self.assert_denied(request, **approved())

    def test_envelope_exact_shape_and_no_coercion(self):
        for invalid in (
            None, [], "git_status", 0, True, {}, {"schema": SCHEMA},
            {**candidate(), "request_id": 7},
            {**candidate(), "commit": ["a" * 40]},
            {**candidate(), "args": []},
            {**candidate(), "operation": None},
            {**candidate(), "schema": SCHEMA.encode()},
            {**candidate(), "args": {"unexpected": False}},
        ):
            with self.subTest(value=repr(invalid)[:90]):
                self.assert_denied(invalid, **approved())

    def test_commit_integrity_pin_fail_closed(self):
        for bad in ("", "a" * 39, "A" * 40, "b" * 40, "a" * 40 + ";whoami"):
            with self.subTest(bad=bad[:12]):
                request = candidate()
                request["commit"] = bad
                self.assert_denied(request, **approved())
        for bad_pin in (None, 0, "b" * 40, "a" * 39, "A" * 40):
            with self.subTest(pin=repr(bad_pin)[:12]):
                self.assert_denied(candidate(), **approved(pinned_commit=bad_pin))

    def test_request_ids_are_synthetic_and_bounded(self):
        for bad in ("tiny", "x" * 65, "invalid name!", "../../outside", "é" * 20, "\n" * 12):
            with self.subTest(id=bad[:12]):
                request = candidate()
                request["request_id"] = bad
                self.assert_denied(request, **approved())

    def test_owner_gate_cannot_be_spoofed_through_request(self):
        forged = candidate()
        forged["owner_gate"] = True
        self.assert_denied(forged, "INVALID_ENVELOPE")

    def test_gate_arguments_must_be_exact_booleans(self):
        for name in ("owner_gate", "non_root", "isolated"):
            with self.subTest(name=name):
                self.assert_denied(candidate(), **approved(**{name: 1}))
                self.assert_denied(candidate(), **approved(**{name: "true"}))

    def test_verdict_never_leaks_identifiers(self):
        bad = candidate("print")
        decision = self.assert_denied(bad, **approved())
        self.assertNotIn(COMMIT, repr(decision))
        self.assertNotIn(bad["request_id"], repr(decision))

    def test_no_runtime_io_and_no_execution_primitives_in_source(self):
        syntax = ast.parse(SOURCE.read_text(encoding="utf-8"))
        forbidden_imports = {"subprocess", "socket", "os", "ctypes", "urllib", "requests"}
        forbidden_calls = {"eval", "exec", "open", "compile", "__import__", "system", "Popen"}
        for node in ast.walk(syntax):
            if isinstance(node, ast.Import):
                self.assertFalse({a.name.split(".")[0] for a in node.names} & forbidden_imports)
            if isinstance(node, ast.ImportFrom):
                self.assertNotIn((node.module or "").split(".")[0], forbidden_imports)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                self.assertNotIn(node.func.id, forbidden_calls)


if __name__ == "__main__":
    unittest.main(verbosity=2)
