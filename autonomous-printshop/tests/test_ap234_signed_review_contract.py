"""Synthetic security falsification for AP-234: no keys, tokens or host I/O."""
import ast
import hashlib
import hmac
import json
import runpy
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "local_executor" / "authorization_contract.py"
m = runpy.run_path(str(PATH))
evaluate = m["evaluate_signed_review"]
CONTROLLER = b"C" * 32  # fake deterministic test key; not a deployed secret
OWNER = b"O" * 32  # separate synthetic test role
COMMIT = "a" * 40
NOW = 1791800000


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode("ascii")


def sign(key, obj):
    return hmac.new(key, canonical(obj), hashlib.sha256).hexdigest()


def fixture(op="git_status"):
    proposal = {
        "schema": m["PROPOSAL_SCHEMA"],
        "target": m["EXPECTED_TARGET"],
        "issued_at": NOW - 50,
        "expires_at": NOW + 100,
        "key_id": "controller-synthetic-v1",
        "request": {
            "schema": m["REQUEST_SCHEMA"], "operation": op,
            "commit": COMMIT, "request_id": "ap234_synthetic_00001", "args": {}
        },
    }
    approval = {
        "schema": m["APPROVAL_SCHEMA"], "decision": "REVIEW_ONLY",
        "proposal_sha256": hashlib.sha256(canonical(proposal)).hexdigest(),
        "issued_at": NOW - 20, "expires_at": NOW + 40,
        "key_id": "owner-synthetic-v1",
    }
    return {
        "proposal": proposal, "proposal_mac": sign(CONTROLLER, proposal),
        "approval": approval, "approval_mac": sign(OWNER, approval),
    }


def resign(bundle):
    bundle["proposal_mac"] = sign(CONTROLLER, bundle["proposal"])
    bundle["approval"]["proposal_sha256"] = hashlib.sha256(
        canonical(bundle["proposal"])
    ).hexdigest()
    bundle["approval_mac"] = sign(OWNER, bundle["approval"])
    return bundle


def gates(**changes):
    return dict(
        controller_key=CONTROLLER, owner_key=OWNER, trusted_now=NOW,
        pinned_commit=COMMIT, seen_tokens=frozenset(), **changes
    )


class SignedReviewContractTests(unittest.TestCase):
    def denied(self, bundle, **kw):
        result = evaluate(bundle, **kw)
        self.assertEqual(result["decision"], "DENY", result)
        self.assertEqual(set(result), {"decision", "reason"})
        return result["reason"]

    def test_requires_independent_keys(self):
        for opts in (
            {"owner_key": None}, {"controller_key": None},
            {"owner_key": CONTROLLER}, {"controller_key": b"C" * 31},
            {"owner_key": "unsafe"}, {"controller_key": bytearray(CONTROLLER)},
        ):
            with self.subTest(opts=opts):
                self.denied(fixture(), **(gates() | opts))

    def test_explicit_clock_pin_and_replay_store_required(self):
        for opts in (
            {"trusted_now": None}, {"trusted_now": True},
            {"pinned_commit": None}, {"pinned_commit": "b" * 40},
            {"seen_tokens": None}, {"seen_tokens": set()},
            {"seen_tokens": frozenset(["not-hex"])},
        ):
            with self.subTest(opts=repr(opts)):
                self.denied(fixture(), **(gates() | opts))

    def test_valid_synthetic_metadata_is_review_only(self):
        for name in ("python_version", "git_head", "git_status"):
            with self.subTest(operation=name):
                result = evaluate(fixture(name), **gates())
                self.assertEqual(result["decision"], "REVIEW_ONLY")
                self.assertEqual(result["reason"], "NO_EXECUTOR_OR_DURABLE_REPLAY_STORE")
                self.assertRegex(result["replay_token"], r"^[0-9a-f]{64}$")
        self.assertFalse(m["EXECUTION_ENABLED"])
        self.assertFalse(m["RECEIPT_STORE_IMPLEMENTED"])
        self.assertFalse(m["NETWORK_ENABLED"])

    def test_replay_denied_when_token_seen(self):
        obj = fixture()
        first = evaluate(obj, **gates())
        self.assertEqual(self.denied(obj, **(gates() | {
            "seen_tokens": frozenset([first["replay_token"]])
        })), "REPLAY_DETECTED")

    def test_untrusted_unsigned_commands_and_extra_fields_denied(self):
        for op in ("bash", "sudo", "curl", "git_pull", "run_script",
                   "print", "d1_write", "netbird_up", "ssh", "git_status;id"):
            with self.subTest(op=op):
                self.denied(resign(fixture(op)), **gates())
        for field, value in (("command", "whoami"), ("owner_approved", True),
                             ("token", "not-real"), ("args", {"path": "/etc"})):
            x = fixture()
            x["proposal"]["request"][field] = value
            self.denied(resign(x), **gates())

    def test_exact_envelope_shape_and_types(self):
        for obj in (None, [], {}, "hello", 1, True, {**fixture(), "execute": True}):
            self.denied(obj, **gates())
        x = fixture()
        x["proposal"]["request"]["args"] = []
        self.denied(x, **gates())
        x = fixture()
        x["approval"]["issued_at"] = True
        self.denied(x, **gates())
        x = fixture()
        x["proposal"]["target"] = ["TrendosShop"]
        self.denied(x, **gates())

    def test_proposal_tampering_denied(self):
        for key, val in (("target", "Windows7"), ("issued_at", NOW - 80),
                         ("key_id", "new-controller")):
            x = fixture()
            x["proposal"][key] = val
            self.denied(x, **gates())
        x = fixture()
        x["proposal"]["request"]["operation"] = "python_version"
        self.denied(x, **gates())

    def test_owner_approval_tampering_denied(self):
        for key, val in (("issued_at", NOW - 10), ("expires_at", NOW + 35),
                         ("key_id", "other-owner"), ("decision", "EXECUTE")):
            x = fixture()
            x["approval"][key] = val
            self.denied(x, **gates())

    def test_role_separation_cannot_approve_with_controller_key(self):
        x = fixture()
        x["approval_mac"] = sign(CONTROLLER, x["approval"])
        self.assertEqual(self.denied(x, **gates()), "OWNER_SIGNATURE_INVALID")
        x = fixture()
        x["proposal_mac"] = sign(OWNER, x["proposal"])
        self.assertEqual(self.denied(x, **gates()), "PROPOSAL_SIGNATURE_INVALID")

    def test_swapped_owner_receipt_denied(self):
        x = fixture()
        y = fixture("git_head")
        x["approval"] = y["approval"]
        x["approval_mac"] = y["approval_mac"]
        self.assertEqual(self.denied(x, **gates()), "APPROVAL_NOT_BOUND_TO_PROPOSAL")

    def test_missing_owner_signature_or_bad_hex_denied(self):
        for val in ("", "g" * 64, "f" * 63, 123, None, "f" * 65):
            x = fixture()
            x["approval_mac"] = val
            self.denied(x, **gates())

    def test_proposal_expiry_boundary_denied(self):
        for issued, expires, now in (
            (NOW - 301, NOW + 1, NOW), (NOW - 10, NOW, NOW),
            (NOW + 1, NOW + 40, NOW), (NOW - 2, NOW + 299, NOW)
        ):
            x = fixture()
            x["proposal"]["issued_at"] = issued
            x["proposal"]["expires_at"] = expires
            self.denied(resign(x), **(gates() | {"trusted_now": now}))

    def test_approval_expiry_and_issued_at_boundaries_denied(self):
        for issued, expires in (
            (NOW + 1, NOW + 5), (NOW - 70, NOW + 5),
            (NOW - 10, NOW), (NOW - 20, NOW + 101),
            (NOW - 400, NOW + 40),
        ):
            x = fixture()
            x["approval"]["issued_at"] = issued
            x["approval"]["expires_at"] = expires
            x["approval_mac"] = sign(OWNER, x["approval"])
            self.denied(x, **gates())

    def test_request_commit_and_target_boundaries_denied(self):
        for v in ("b" * 40, "A" * 40, "a" * 39, "a" * 41):
            x = fixture()
            x["proposal"]["request"]["commit"] = v
            self.denied(resign(x), **gates())
        x = fixture()
        x["proposal"]["target"] = "Ubuntu-other"
        self.denied(resign(x), **gates())

    def test_approval_not_elevated_by_caller_payload(self):
        x = fixture()
        x["approval"]["decision"] = "RUN"
        self.denied(resign(x), **gates())
        x = fixture()
        x["proposal"]["request"]["owner_gate"] = True
        self.denied(resign(x), **gates())

    def test_rejected_receipts_never_echo_metadata(self):
        x = fixture()
        x["proposal_mac"] = "0" * 64
        r = evaluate(x, **gates())
        self.assertNotIn(COMMIT, str(r))
        self.assertNotIn(x["proposal"]["request"]["request_id"], str(r))

    def test_no_exec_network_filesystem_or_subprocess(self):
        syntax = ast.parse(PATH.read_text(encoding="utf-8"))
        forbidden_imports = {"subprocess", "socket", "os", "ctypes",
                             "urllib", "requests", "pathlib"}
        forbidden_calls = {"eval", "exec", "open", "compile", "__import__", "Popen"}
        for node in ast.walk(syntax):
            if isinstance(node, ast.Import):
                self.assertFalse({a.name.split(".")[0] for a in node.names} & forbidden_imports)
            if isinstance(node, ast.ImportFrom):
                self.assertNotIn((node.module or "").split(".")[0], forbidden_imports)
            if isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                self.assertNotIn(node.func.id, forbidden_calls)


if __name__ == "__main__":
    unittest.main(verbosity=2)
