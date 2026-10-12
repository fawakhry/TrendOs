"""AP-260 GitHub-hosted offline snapshot tests; all writes stay in CI temp git fixtures."""
from __future__ import annotations

import contextlib
import io
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import offline_snapshot as probe
import policy


class OwnerLocalSnapshotTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory(prefix="ap260-ci-")
        self.addCleanup(temp.cleanup)
        self.home = Path(temp.name).resolve() / "fake-owner"
        self.repo = self.home / "TrendOs"
        self.repo.mkdir(parents=True)
        self.code = self.repo / "autonomous-printshop" / "local_executor" / "offline_snapshot.py"
        self.code.parent.mkdir(parents=True)
        self.code.touch()
        subprocess.run(["git", "init", "-q", "-b", "feature/ap260-ci", str(self.repo)], check=True, capture_output=True)
        self.tracked = self.repo / "synthetic-source.txt"
        self.tracked.write_text("synthetic not a customer\n", encoding="utf-8")
        subprocess.run(["git", "-C", str(self.repo), "add", "synthetic-source.txt"], check=True, capture_output=True)
        subprocess.run([
            "git", "-C", str(self.repo), "-c", "user.name=CI",
            "-c", "user.email=ci@example.invalid", "commit", "-q", "-m", "CI fixture"
        ], check=True, capture_output=True)

    def inspect(self):
        return probe.snapshot(home=self.home, source=self.code)

    def test_clean_fixture_has_exact_redacted_schema(self):
        report = self.inspect()
        self.assertEqual(report["schema"], "trendos.ap260.owner-local-snapshot.v1")
        self.assertRegex(report["git_head"], r"^[0-9a-f]{40}$")
        self.assertEqual(report["git_branch"], "feature/ap260-ci")
        self.assertEqual(report["tracked_changes"], "NO")
        self.assertEqual(report["untracked_files"], "NOT_SCANNED")
        self.assertEqual(report["remote_executor"], "NOT_ESTABLISHED")
        self.assertEqual(report["production"], "NOT_ACCESSED")
        self.assertEqual(len(report), 9)

    def test_worktree_modified_is_dirty_without_leaking_path(self):
        self.tracked.write_text("changed sensitive string SHOULD_NOT_PRINT\n", encoding="utf-8")
        report = self.inspect()
        self.assertEqual(report["tracked_changes"], "YES")
        self.assertNotIn("synthetic-source", str(report))
        self.assertNotIn("sensitive", str(report))

    def test_staged_change_is_dirty(self):
        self.tracked.write_text("staged\n", encoding="utf-8")
        subprocess.run(["git", "-C", str(self.repo), "add", "synthetic-source.txt"], check=True, capture_output=True)
        self.assertEqual(self.inspect()["tracked_changes"], "YES")

    def test_untracked_files_are_explicitly_unchecked(self):
        (self.repo / "SECRET_OWNER_DATA_NEVER_SCAN").write_text("secret\n", encoding="utf-8")
        report = self.inspect()
        self.assertEqual(report["tracked_changes"], "NO")
        self.assertEqual(report["untracked_files"], "NOT_SCANNED")
        self.assertNotIn("SECRET_OWNER_DATA", str(report))

    def test_reject_root(self):
        with patch.object(probe.os, "geteuid", return_value=0):
            with self.assertRaisesRegex(probe.ProbeDenied, "ROOT_NOT_ALLOWED"):
                self.inspect()

    def test_reject_missing_home_or_checkout(self):
        nonexistent = self.home / "not-here"
        with self.assertRaises(probe.ProbeDenied):
            probe.snapshot(home=nonexistent, source=self.code)
        self.code.unlink()
        with self.assertRaisesRegex(probe.ProbeDenied, "UNEXPECTED_SOURCE_LOCATION"):
            self.inspect()

    def test_reject_symlinked_checkout(self):
        moved = self.home / "moved-repo"
        self.repo.rename(moved)
        self.repo.symlink_to(moved)
        with self.assertRaisesRegex(probe.ProbeDenied, "UNSAFE_CHECKOUT"):
            self.inspect()

    def test_reject_symlinked_git_dir(self):
        moved = self.home / "git-metadata"
        (self.repo / ".git").rename(moved)
        (self.repo / ".git").symlink_to(moved)
        with self.assertRaisesRegex(probe.ProbeDenied, "UNSAFE_GIT_DIR"):
            self.inspect()

    def test_reject_source_outside_expected_repo(self):
        outside = self.home / "rogue.py"
        outside.write_text("#fake", encoding="utf-8")
        with self.assertRaisesRegex(probe.ProbeDenied, "UNEXPECTED_SOURCE_LOCATION"):
            probe.snapshot(home=self.home, source=outside)

    def test_bad_cli_flag_never_enters_git(self):
        with patch.object(probe, "snapshot") as snapshot:
            log = io.StringIO()
            with contextlib.redirect_stdout(log):
                self.assertEqual(probe.main(["--production"]), 2)
            snapshot.assert_not_called()
            self.assertIn("EXPLICIT_SNAPSHOT_FLAG_REQUIRED", log.getvalue())

    def test_main_denies_without_leaking_local_paths(self):
        with patch.object(probe.Path, "home", return_value=self.home):
            with patch.object(probe, "snapshot", side_effect=probe.ProbeDenied("GIT_READ_UNAVAILABLE")):
                output = io.StringIO()
                with contextlib.redirect_stdout(output):
                    self.assertEqual(probe.main(["--snapshot"]), 2)
        self.assertNotIn(str(self.home), output.getvalue())
        self.assertIn("REASON=GIT_READ_UNAVAILABLE", output.getvalue())

    def test_malicious_branch_rejected_without_echo(self):
        with patch.object(probe, "_git_value", side_effect=["a"*40, "feature/\nLEAK_SECRET"]):
            with self.assertRaisesRegex(probe.ProbeDenied, "INVALID_BRANCH"):
                self.inspect()

    def test_git_invocations_have_no_shell_hooks_network_or_user_paths(self):
        observed = []
        actual = subprocess.run
        def inspect_git(argv, **kwargs):
            observed.append((argv, kwargs))
            return actual(argv, **kwargs)
        with patch.object(probe.subprocess, "run", side_effect=inspect_git):
            self.inspect()
        self.assertEqual(len(observed), 4)
        for argv, opts in observed:
            self.assertEqual(argv[0:2], ["/usr/bin/git", "--no-optional-locks"])
            self.assertIn("core.hooksPath=/dev/null", argv)
            self.assertIn("core.fsmonitor=false", argv)
            self.assertNotIn("shell", opts)
            self.assertEqual(opts["env"]["GIT_CONFIG_NOSYSTEM"], "1")
            self.assertEqual(opts["env"]["GIT_OPTIONAL_LOCKS"], "0")
            self.assertNotIn("DISPLAY", opts["env"])
            self.assertEqual(opts["timeout"], 4)
            self.assertIs(opts["stderr"], subprocess.DEVNULL)
            self.assertNotIn("fetch", argv)
            self.assertNotIn("pull", argv)
            self.assertNotIn("run.py", argv)

    def test_git_process_failure_denied(self):
        with patch.object(probe.subprocess, "run", side_effect=OSError("fake error")):
            with self.assertRaisesRegex(probe.ProbeDenied, "GIT_READ_UNAVAILABLE"):
                self.inspect()

    def test_git_timeout_denied(self):
        with patch.object(probe.subprocess, "run", side_effect=subprocess.TimeoutExpired(["git"], 4)):
            with self.assertRaisesRegex(probe.ProbeDenied, "GIT_READ_UNAVAILABLE"):
                self.inspect()

    def test_policy_allowlist_stays_separate_and_non_executable(self):
        self.assertEqual(policy.APPROVED_OPERATIONS, frozenset(("python_version", "git_head", "git_status")))
        self.assertFalse(policy.EXECUTION_ENABLED)
        self.assertFalse(policy.NETWORK_LISTENER_ENABLED)
        self.assertFalse(policy.SHELL_EXECUTION_ENABLED)

    def test_invalid_git_head_never_returned(self):
        with patch.object(probe, "_git_value", side_effect=["not a sha", "feature/test"]):
            with self.assertRaisesRegex(probe.ProbeDenied, "INVALID_HEAD"):
                self.inspect()


if __name__ == "__main__":
    unittest.main(verbosity=2)
