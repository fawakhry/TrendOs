"""AP-257 tests: private receipt, no cloud, no real browser, no owner host writes."""
from __future__ import annotations

import contextlib
import io
import json
import math
import os
import socket
import stat
import tempfile
import threading
import time
import unittest
from pathlib import Path
from unittest.mock import patch

import controlled_offline_session as control
import offline_stop_receipt as receipt


class OfflineStopReceiptTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory(prefix="ap257-ci-")
        self.addCleanup(temp.cleanup)
        self.runtime = Path(temp.name).resolve() / "private"
        self.runtime.mkdir(mode=0o700)
        self.control_path = self.runtime / "trendos-ap252-offline-control.sock"
        self.target = self.runtime / "trendos-ap257-last-offline-result.json"
        self.sid = "1234567890abcdef" * 2

    def test_missing_receipt_is_not_success_and_does_not_create_file(self):
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            self.assertFalse(receipt.display(self.control_path))
        self.assertIn("AP257_RECEIPT=NOT_FOUND", out.getvalue())
        self.assertFalse(self.target.exists())

    def test_start_is_pending_and_cannot_claim_finished(self):
        receipt.start(self.control_path, self.sid)
        self.assertEqual(stat.S_IMODE(self.target.stat().st_mode), 0o600)
        item = receipt.read(self.control_path)
        self.assertEqual(item["session_id"], self.sid)
        self.assertEqual(item["state"], "PENDING")
        self.assertIsNone(item["reason"])
        self.assertFalse(item["http_stopped"])
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            self.assertFalse(receipt.display(self.control_path))
        self.assertIn("PENDING_OR_INTERRUPTED", out.getvalue())

    def test_owner_stop_reason_and_monotonic_seconds_visible(self):
        receipt.start(self.control_path, self.sid)
        receipt.finish(self.control_path, self.sid, "OWNER_STOP", 18.34784)
        item = receipt.read(self.control_path)
        self.assertEqual(item["state"], "STOPPED")
        self.assertEqual(item["reason"], "OWNER_STOP")
        self.assertEqual(item["elapsed_seconds"], 18.348)
        self.assertTrue(item["http_stopped"])
        self.assertTrue(item["temp_cleaned"])
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            self.assertTrue(receipt.display(self.control_path))
        self.assertIn("REASON=OWNER_STOP", out.getvalue())
        self.assertIn("ELAPSED_SECONDS=18.348", out.getvalue())
        self.assertIn(f"SESSION={self.sid}", out.getvalue())

    def test_timeout_reason_is_distinct(self):
        receipt.start(self.control_path, self.sid)
        receipt.finish(self.control_path, self.sid, "TIMEOUT", 75.013)
        self.assertEqual(receipt.read(self.control_path)["reason"], "TIMEOUT")

    def test_next_started_session_invalidates_prior_success(self):
        receipt.start(self.control_path, self.sid)
        receipt.finish(self.control_path, self.sid, "OWNER_STOP", 11.0)
        other = "a" * 32
        receipt.start(self.control_path, other)
        item = receipt.read(self.control_path)
        self.assertEqual(item["state"], "PENDING")
        self.assertEqual(item["session_id"], other)
        out = io.StringIO()
        with contextlib.redirect_stdout(out):
            self.assertFalse(receipt.display(self.control_path))
        self.assertNotIn("OWNER_STOP", out.getvalue())

    def test_session_mismatch_cannot_write_fake_finish(self):
        receipt.start(self.control_path, self.sid)
        with self.assertRaisesRegex(RuntimeError, "AP257_SESSION_RECEIPT_MISMATCH"):
            receipt.finish(self.control_path, "f" * 32, "OWNER_STOP", 2.0)
        self.assertEqual(receipt.read(self.control_path)["state"], "PENDING")

    def test_invalid_reason_and_duration_do_not_mutate(self):
        receipt.start(self.control_path, self.sid)
        existing = self.target.read_bytes()
        for value in ("SIGKILL", "CRASH", "", None):
            with self.subTest(reason=value):
                with self.assertRaisesRegex(ValueError, "AP257_REASON_INVALID"):
                    receipt.finish(self.control_path, self.sid, value, 1.0)
        for value in (float("inf"), float("nan"), -1.0, 301.0):
            with self.subTest(elapsed=value):
                with self.assertRaisesRegex(ValueError, "AP257_ELAPSED_INVALID"):
                    receipt.finish(self.control_path, self.sid, "OWNER_STOP", value)
        self.assertEqual(self.target.read_bytes(), existing)

    def test_bad_session_id_rejected(self):
        with self.assertRaisesRegex(ValueError, "AP257_SESSION_ID_INVALID"):
            receipt.start(self.control_path, "../../bad")
        self.assertFalse(self.target.exists())

    def test_existing_symlink_never_followed_or_overwritten(self):
        protected = self.runtime / "protected.txt"
        protected.write_text("SAFE", encoding="utf-8")
        self.target.symlink_to(protected)
        with self.assertRaisesRegex(RuntimeError, "AP257_EXISTING_RECEIPT_UNSAFE"):
            receipt.start(self.control_path, self.sid)
        self.assertEqual(protected.read_text(encoding="utf-8"), "SAFE")
        with self.assertRaises(RuntimeError):
            receipt.read(self.control_path)

    def test_existing_wrong_permission_or_directory_rejected(self):
        self.target.write_text("SECRET", encoding="utf-8")
        self.target.chmod(0o644)
        with self.assertRaisesRegex(RuntimeError, "AP257_EXISTING_RECEIPT_UNSAFE"):
            receipt.start(self.control_path, self.sid)
        with self.assertRaisesRegex(RuntimeError, "AP257_RECEIPT_NOT_PRIVATE"):
            receipt.read(self.control_path)
        self.target.unlink()
        self.target.mkdir()
        with self.assertRaisesRegex(RuntimeError, "AP257_EXISTING_RECEIPT_UNSAFE"):
            receipt.start(self.control_path, self.sid)

    def test_runtime_dir_must_remain_private(self):
        self.runtime.chmod(0o755)
        with self.assertRaisesRegex(RuntimeError, "AP257_PRIVATE_RUNTIME_DIR_REQUIRED"):
            receipt.start(self.control_path, self.sid)
        self.assertFalse(self.target.exists())

    def test_reject_corrupt_and_oversized_receipt(self):
        self.target.write_text("not json", encoding="utf-8")
        self.target.chmod(0o600)
        with self.assertRaisesRegex(RuntimeError, "AP257_RECEIPT_CORRUPT"):
            receipt.read(self.control_path)
        self.target.write_text("x" * 5000, encoding="utf-8")
        with self.assertRaisesRegex(RuntimeError, "AP257_RECEIPT_TOO_LARGE"):
            receipt.read(self.control_path)

    def test_reject_forged_stop_with_bad_booleans(self):
        receipt.start(self.control_path, self.sid)
        item = receipt.read(self.control_path)
        item.update(state="STOPPED", reason="OWNER_STOP", elapsed_seconds=3.1,
                    http_stopped=False, temp_cleaned=True)
        self.target.write_text(json.dumps(item), encoding="utf-8")
        self.target.chmod(0o600)
        with self.assertRaisesRegex(RuntimeError, "AP257_STOPPED_SCHEMA_INVALID"):
            receipt.read(self.control_path)

    def test_receipt_read_mode_is_read_only_and_needs_no_display(self):
        with patch.dict(os.environ, {"XDG_RUNTIME_DIR": str(self.runtime)}, clear=True):
            out = io.StringIO()
            with contextlib.redirect_stdout(out):
                self.assertEqual(control.main(["receipt"]), 2)
            self.assertIn("NOT_FOUND", out.getvalue())
            self.assertFalse(self.target.exists())
            receipt.start(self.control_path, self.sid)
            receipt.finish(self.control_path, self.sid, "TIMEOUT", 75.0)
            with contextlib.redirect_stdout(io.StringIO()) as out:
                self.assertEqual(control.main(["receipt"]), 0)
            self.assertIn("REASON=TIMEOUT", out.getvalue())

    def test_live_synthetic_natural_timeout_records_receipt(self):
        observed = []
        def fake_firefox(argv, **kwargs):
            observed.append(argv)
            return object()
        control.run_session(self.control_path, "/usr/bin/firefox", seconds=0.08,
                            browser_launch=fake_firefox)
        self.assertFalse(self.control_path.exists())
        self.assertEqual(len(observed), 1)
        item = receipt.read(self.control_path)
        self.assertEqual(item["reason"], "TIMEOUT")
        self.assertGreaterEqual(item["elapsed_seconds"], 0.08)
        self.assertTrue(item["temp_cleaned"])

    def test_live_synthetic_owner_socket_stop_records_owner_stop(self):
        observed = []
        errors = []
        def fake_firefox(argv, **kwargs):
            observed.append(argv)
            return object()
        def worker():
            try:
                control.run_session(self.control_path, "/usr/bin/firefox", seconds=5,
                                    browser_launch=fake_firefox)
            except Exception as exc:
                errors.append(exc)
        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
        try:
            deadline = time.monotonic() + 4
            while not observed and time.monotonic() < deadline:
                time.sleep(0.01)
            self.assertTrue(observed)
            self.assertTrue(control.request_stop(self.control_path))
            thread.join(timeout=3)
            self.assertFalse(thread.is_alive())
            self.assertEqual(errors, [])
            self.assertFalse(self.control_path.exists())
            item = receipt.read(self.control_path)
            self.assertEqual(item["reason"], "OWNER_STOP")
            self.assertLess(item["elapsed_seconds"], 5)
            self.assertTrue(item["http_stopped"])
        finally:
            if thread.is_alive():
                try:
                    control.request_stop(self.control_path)
                except Exception:
                    pass
                thread.join(timeout=6)

    def test_browser_error_keeps_receipt_pending_not_falsely_stopped(self):
        def browser_fails(*args, **kwargs):
            raise OSError("mock browser crash")
        with self.assertRaisesRegex(OSError, "mock browser crash"):
            control.run_session(self.control_path, "/usr/bin/firefox",
                                seconds=0.2, browser_launch=browser_fails)
        self.assertFalse(self.control_path.exists())
        self.assertEqual(receipt.read(self.control_path)["state"], "PENDING")


if __name__ == "__main__":
    unittest.main(verbosity=2)
