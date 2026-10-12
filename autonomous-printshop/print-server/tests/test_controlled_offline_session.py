"""AP-252 hosted-only tests: real synthetic localhost + owner-private Unix stop.

No real Firefox launch, production run.py, cloud, customer files, or persistent service.
"""
from __future__ import annotations

import contextlib
import io
import os
import socket
import stat
import tempfile
import threading
import time
import unittest
from pathlib import Path
from unittest.mock import patch

import controlled_offline_session as controlled


class ControlledOfflineSessionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="ap252-hosted-")
        self.addCleanup(self.temp.cleanup)
        self.runtime = Path(self.temp.name) / "private-runtime"
        self.runtime.mkdir(mode=0o700)
        self.path = self.runtime / "trendos-ap252-offline-control.sock"
        self.assertFalse(self.path.exists())

    def test_runtime_location_must_be_owned_and_private(self):
        with patch.dict(os.environ, {"XDG_RUNTIME_DIR": str(self.runtime)}):
            self.assertEqual(controlled.owner_runtime_socket(), self.path)
        self.runtime.chmod(0o755)
        with patch.dict(os.environ, {"XDG_RUNTIME_DIR": str(self.runtime)}):
            with self.assertRaisesRegex(RuntimeError, "AP252_PRIVATE_RUNTIME_DIR_REQUIRED"):
                controlled.owner_runtime_socket()
        self.runtime.chmod(0o700)

    def test_missing_runtime_rejected_without_creating(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "AP252_PRIVATE_RUNTIME_DIR_REQUIRED"):
                controlled.owner_runtime_socket()
        self.assertFalse(self.path.exists())

    def test_symlinked_runtime_dir_rejected(self):
        link = Path(self.temp.name) / "link-to-runtime"
        link.symlink_to(self.runtime)
        with patch.dict(os.environ, {"XDG_RUNTIME_DIR": str(link)}):
            with self.assertRaisesRegex(RuntimeError, "AP252_UNSAFE_RUNTIME_DIR"):
                controlled.owner_runtime_socket()

    def test_stop_when_not_running_does_not_create_any_file(self):
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            self.assertFalse(controlled.request_stop(self.path))
        self.assertIn("AP252_STOP_RESULT=NO_ACTIVE_SESSION", output.getvalue())
        self.assertFalse(self.path.exists())

    def test_reject_invalid_commands(self):
        for args in (["restart"], ["--port=8000"], ["start", "--production"]):
            with self.subTest(args=args), self.assertRaisesRegex(
                SystemExit, "AP252_ONLY_START_OR_STOP_ALLOWED"
            ):
                controlled.main(args)
        self.assertFalse(self.path.exists())

    def test_root_start_refused_before_socket_or_browser(self):
        with patch.object(controlled.os, "geteuid", return_value=0):
            with self.assertRaisesRegex(SystemExit, "AP252_REFUSE_ROOT"):
                controlled.main(["start"])
        self.assertFalse(self.path.exists())

    def test_missing_display_refused_before_socket_or_browser(self):
        with patch.object(controlled.os, "geteuid", return_value=1000):
            with patch.dict(os.environ, {}, clear=True):
                with self.assertRaisesRegex(SystemExit, "AP252_GRAPHICAL_SESSION_REQUIRED"):
                    controlled.main(["start"])
        self.assertFalse(self.path.exists())

    def test_browser_absent_refused_before_socket(self):
        with patch.object(controlled.os, "geteuid", return_value=1000):
            with patch.dict(os.environ, {"DISPLAY": ":0"}, clear=True):
                with patch.object(controlled.shutil, "which", return_value=None):
                    with self.assertRaisesRegex(SystemExit, "AP252_EXISTING_FIREFOX_REQUIRED"):
                        controlled.main(["start"])
        self.assertFalse(self.path.exists())

    def test_unexpected_existing_socket_never_overwritten(self):
        self.path.write_text("OWNER_DATA", encoding="utf-8")
        with self.assertRaisesRegex(RuntimeError, "AP252_ACTIVE_OR_STALE_SOCKET_EXISTS"):
            controlled.run_session(self.path, "/usr/bin/firefox", seconds=0.1)
        self.assertEqual(self.path.read_text(encoding="utf-8"), "OWNER_DATA")

    def test_bounded_duration_enforced_before_any_binding(self):
        for seconds in (0, -1, 76, 9999):
            with self.subTest(seconds=seconds), self.assertRaisesRegex(
                ValueError, "AP252_DURATION_OUT_OF_BOUNDS"
            ):
                controlled.run_session(self.path, "/usr/bin/firefox", seconds=seconds)
        self.assertFalse(self.path.exists())

    def _start_in_test_thread(self, seconds):
        result = {"error": None}
        launches = []
        output = io.StringIO()

        def fake_browser(argv, **kwargs):
            launches.append((argv, kwargs))
            return object()

        def run():
            try:
                controlled.run_session(
                    self.path, "/usr/bin/firefox", seconds=seconds,
                    browser_launch=fake_browser,
                )
            except Exception as exc:
                result["error"] = exc

        # Print capture is process-global; run only one such test at a time.
        redirect = contextlib.redirect_stdout(output)
        redirect.__enter__()
        thread = threading.Thread(target=run, daemon=True)
        thread.start()
        return thread, result, launches, output, redirect

    def test_real_loopback_http_and_private_early_stop(self):
        thread, result, launches, output, redirect = self._start_in_test_thread(4)
        try:
            deadline = time.monotonic() + 4
            while not (self.path.exists() and launches) and time.monotonic() < deadline:
                time.sleep(0.025)
            self.assertTrue(self.path.exists(), "owner-only control socket was not created")
            self.assertEqual(stat.S_IMODE(self.path.stat().st_mode), 0o600)
            self.assertTrue(launches, "synthetic HTTP server was not ready")
            url = launches[0][0][-1]
            self.assertRegex(url, r"^http://127\.0\.0\.1:\d+/$")
            self.assertEqual(launches[0][0][:2], ["/usr/bin/firefox", "--new-tab"])
            import http.client
            from urllib.parse import urlsplit
            port = urlsplit(url).port
            for method, endpoint, expected in (
                ("GET", "/", 200),
                ("GET", "/api/status", 200),
                ("GET", "/api/orders", 200),
                ("POST", "/api/settings", 403),
                ("GET", "/api/trendos/probe", 403),
            ):
                with self.subTest(method=method, endpoint=endpoint):
                    client = http.client.HTTPConnection("127.0.0.1", port, timeout=2)
                    try:
                        client.request(method, endpoint)
                        reply = client.getresponse()
                        self.assertEqual(reply.status, expected)
                        reply.read()
                    finally:
                        client.close()
            with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as impostor:
                impostor.settimeout(1)
                impostor.connect(str(self.path))
                impostor.sendall(b"AP252_WRONG_COMMAND\n")
                self.assertEqual(impostor.recv(64), b"")
            self.assertTrue(thread.is_alive(), "invalid stop request must not stop server")
            self.assertTrue(controlled.request_stop(self.path))
            thread.join(timeout=3)
            self.assertFalse(thread.is_alive(), "owner stop must finish promptly")
            self.assertIsNone(result["error"])
            self.assertFalse(self.path.exists(), "control socket should be cleaned")
            self.assertIn("AP252_OFFLINE_STOPPED=YES", output.getvalue())
            self.assertIn("REASON=OWNER_STOP", output.getvalue())
            with self.assertRaises((ConnectionRefusedError, OSError)):
                c = socket.create_connection(("127.0.0.1", port), timeout=0.5)
                c.close()
        finally:
            if thread.is_alive() and self.path.exists():
                try:
                    controlled.request_stop(self.path)
                except Exception:
                    pass
                thread.join(timeout=5)
            redirect.__exit__(None, None, None)

    def test_natural_timeout_finishes_without_stop_command(self):
        thread, result, launches, output, redirect = self._start_in_test_thread(0.12)
        try:
            thread.join(timeout=4)
            self.assertFalse(thread.is_alive())
            self.assertIsNone(result["error"])
            self.assertEqual(len(launches), 1)
            self.assertIn("REASON=TIMEOUT", output.getvalue())
            self.assertIn("TEMP_CLEANED=YES; PRINTING=OFF", output.getvalue())
            self.assertFalse(self.path.exists())
        finally:
            redirect.__exit__(None, None, None)

    def test_linux_peercred_owner_check(self):
        if not hasattr(socket, "SO_PEERCRED"):
            self.skipTest("Linux SO_PEERCRED required")
        with socket.socketpair() as pair:
            self.assertTrue(controlled._peer_is_owner(pair[0]))
        with patch.object(controlled.os, "getuid", return_value=os.getuid() + 1):
            with socket.socketpair() as pair:
                self.assertFalse(controlled._peer_is_owner(pair[0]))

    def test_source_has_no_process_kill_or_production_launch(self):
        source = Path(controlled.__file__).read_text(encoding="utf-8")
        self.assertNotIn("os.kill(", source)
        self.assertNotIn("run.py]", source)
        self.assertNotIn("subprocess.run(", source)
        self.assertNotIn("shell=True", source)
        self.assertNotIn("0.0.0.0", source)


if __name__ == "__main__":
    unittest.main(verbosity=2)
