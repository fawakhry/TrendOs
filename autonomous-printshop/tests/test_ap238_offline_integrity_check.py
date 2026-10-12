"""AP-238 synthetic integrity checks on a disposable five-file bundle only.

Never touch a physical Ubuntu host or real customer/printshop files.
"""
import ast
import json
import runpy
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
MODULE = ROOT / "local_executor" / "offline_integrity_check.py"
ORIG = ROOT / "local_executor"
checker = runpy.run_path(str(MODULE))
verify = checker["check_offline_sources"]
FILES = checker["_EXPECTED"]
MANIFEST = checker["MANIFEST_NAME"]


class AP238SourceIntegrityTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="ap238-synthetic-")
        self.addCleanup(self.temp.cleanup)
        self.work = Path(self.temp.name)
        for name in (*FILES, MANIFEST):
            shutil.copyfile(ORIG / name, self.work / name)

    def expect_blocked(self, *args, **kwargs):
        verdict = verify(self.work, *args, **kwargs)
        self.assertEqual(verdict["decision"], "BLOCKED", verdict)
        self.assertEqual(set(verdict), {"decision", "reason"})
        self.assertNotIn(str(self.work), repr(verdict))
        return verdict["reason"]

    def update_manifest(self, change):
        path = self.work / MANIFEST
        obj = json.loads(path.read_text())
        change(obj)
        path.write_text(json.dumps(obj, indent=2) + "\n", encoding="utf-8")

    def test_exact_snapshot_sources_match(self):
        verdict = verify(self.work)
        self.assertEqual(verdict, {
            "decision": "SOURCE_HASHES_MATCH_ONLY",
            "source_files": 5,
            "host_attested": False,
            "execution_authorized": False,
        })

    def test_checks_actual_checkout_without_git_or_network(self):
        self.assertEqual(verify()["decision"], "SOURCE_HASHES_MATCH_ONLY")

    def test_snapshot_has_five_pinned_files(self):
        self.assertEqual(set(FILES), {
            "policy.py", "authorization_contract.py", "receipt_journal.py",
            "trust_boundary.py", "offline_canary.py",
        })
        self.assertEqual(len(FILES), 5)

    def test_checksum_changes_are_detected(self):
        for name in FILES:
            with self.subTest(file=name):
                p = self.work / name
                content = p.read_bytes()
                p.write_bytes(b"X" + content[1:])
                self.assertEqual(self.expect_blocked(), "SOURCE_SHA256_MISMATCH")
                p.write_bytes(content)

    def test_source_file_truncation_fails_closed(self):
        p = self.work / "policy.py"
        p.write_bytes(p.read_bytes()[:-1])
        self.assertEqual(self.expect_blocked(), "SOURCE_SIZE_MISMATCH")

    def test_missing_source_file_fails_closed(self):
        (self.work / "trust_boundary.py").unlink()
        self.assertEqual(self.expect_blocked(), "SOURCE_FILE_UNAVAILABLE")

    def test_missing_manifest_fails_closed(self):
        (self.work / MANIFEST).unlink()
        self.assertEqual(self.expect_blocked(), "SOURCE_FILE_UNAVAILABLE")

    def test_corrupt_utf8_manifest_fails_closed(self):
        (self.work / MANIFEST).write_bytes(b"\xff\xfe")
        self.assertEqual(self.expect_blocked(), "INVALID_MANIFEST")

    def test_invalid_json_fails_closed(self):
        (self.work / MANIFEST).write_text("{broken json", encoding="utf-8")
        self.assertEqual(self.expect_blocked(), "INVALID_MANIFEST")

    def test_duplicate_json_field_fails_closed(self):
        (self.work / MANIFEST).write_text('{"schema":"x","schema":"y"}', encoding="utf-8")
        self.assertEqual(self.expect_blocked(), "INVALID_MANIFEST")

    def test_manifest_beyond_bounded_length_fails_closed(self):
        (self.work / MANIFEST).write_bytes(b"X" * 8193)
        self.assertEqual(self.expect_blocked(), "INVALID_SOURCE_FILE_TYPE_OR_SIZE")

    def test_manifest_pin_spoof_fails_closed(self):
        self.update_manifest(lambda m: m.update(source_snapshot_commit="a" * 40))
        self.assertEqual(self.expect_blocked(), "MANIFEST_MISMATCH")

    def test_manifest_expected_hash_spoof_fails_closed(self):
        self.update_manifest(lambda m: m["entries"]["policy.py"].update(sha256="a" * 64))
        self.assertEqual(self.expect_blocked(), "MANIFEST_MISMATCH")

    def test_manifest_name_or_entry_injection_fails_closed(self):
        self.update_manifest(lambda m: m["entries"].update({"../../etc/shadow": {"sha256": "a" * 64, "bytes": 1}}))
        self.assertEqual(self.expect_blocked(), "MANIFEST_MISMATCH")

    def test_manifest_extra_execute_field_fails_closed(self):
        self.update_manifest(lambda m: m.update({"execute": True}))
        self.assertEqual(self.expect_blocked(), "MANIFEST_MISMATCH")

    def test_manifest_bool_size_type_fails_closed(self):
        self.update_manifest(lambda m: m["entries"]["policy.py"].update(bytes=True))
        self.expect_blocked()

    def test_source_symlink_to_original_is_rejected(self):
        path = self.work / "policy.py"
        path.unlink()
        path.symlink_to(ORIG / "policy.py")
        self.assertEqual(self.expect_blocked(), "SOURCE_FILE_UNAVAILABLE")

    def test_symlink_manifest_is_rejected(self):
        path = self.work / MANIFEST
        path.unlink()
        path.symlink_to(ORIG / MANIFEST)
        self.assertEqual(self.expect_blocked(), "SOURCE_FILE_UNAVAILABLE")

    def test_symlink_bundle_root_rejected(self):
        link = Path(self.temp.name).parent / (Path(self.temp.name).name + "_link")
        self.addCleanup(lambda: link.unlink(missing_ok=True))
        link.symlink_to(self.work, target_is_directory=True)
        self.assertEqual(verify(link)["decision"], "BLOCKED")

    def test_relative_and_invalid_paths_rejected(self):
        for invalid in (Path("relative"), "", 0, True):
            with self.subTest(invalid=repr(invalid)):
                self.assertEqual(verify(invalid)["decision"], "BLOCKED")

    def test_directory_instead_of_source_file_fails_closed(self):
        path = self.work / "policy.py"
        path.unlink()
        path.mkdir()
        self.expect_blocked()

    def test_directory_instead_of_manifest_fails_closed(self):
        path = self.work / MANIFEST
        path.unlink()
        path.mkdir()
        self.expect_blocked()

    def test_no_command_or_execution_gates(self):
        for name in ("EXECUTOR_ENABLED", "NETWORK_ENABLED", "OWNER_AUTH_IMPLEMENTED",
                     "PHYSICAL_HOST_ATTESTED"):
            self.assertIs(checker[name], False)
        self.assertIs(checker["SOURCE_ONLY"], True)

    def test_cli_zero_on_actual_verified_source(self):
        p = subprocess.run([sys.executable, "-B", str(MODULE)],
                           check=False, capture_output=True, text=True, timeout=8)
        self.assertEqual(p.returncode, 0, p.stdout + p.stderr)
        self.assertIn("SOURCE_HASHES_MATCH_ONLY", p.stdout)
        self.assertIn("HOST_ATTESTED=NO", p.stdout)
        self.assertIn("EXECUTOR=OFF", p.stdout)
        self.assertNotIn(str(ROOT), p.stdout)

    def test_cli_arguments_rejected(self):
        p = subprocess.run([sys.executable, "-B", str(MODULE), "--root", "/etc"],
                           check=False, capture_output=True, text=True, timeout=8)
        self.assertEqual(p.returncode, 2)
        self.assertIn("BLOCKED", p.stdout)
        self.assertNotIn("/etc", p.stdout)

    def test_manifest_expected_bytes_are_ascii_sha256(self):
        manifest = json.loads((ORIG / MANIFEST).read_text())
        self.assertEqual(manifest["schema"], checker["SCHEMA"])
        self.assertEqual(manifest["source_snapshot_commit"], checker["SOURCE_SNAPSHOT_COMMIT"])
        for name, (hex_digest, size) in FILES.items():
            with self.subTest(name=name):
                self.assertRegex(hex_digest, r"^[a-f0-9]{64}$")
                self.assertEqual(manifest["entries"][name], {"sha256": hex_digest, "bytes": size})

    def test_no_shell_network_or_git_execution_in_verifier(self):
        tree = ast.parse(MODULE.read_text(encoding="utf-8"))
        bad_imports = {"subprocess", "socket", "urllib", "requests", "http", "importlib"}
        forbidden_calls = {"eval", "exec", "__import__", "Popen", "system"}
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                self.assertFalse({a.name.split(".")[0] for a in node.names} & bad_imports)
            elif isinstance(node, ast.ImportFrom):
                self.assertNotIn((node.module or "").split(".")[0], bad_imports)
            elif isinstance(node, ast.Call) and isinstance(node.func, ast.Name):
                self.assertNotIn(node.func.id, forbidden_calls)


if __name__ == "__main__":
    unittest.main(verbosity=2)
