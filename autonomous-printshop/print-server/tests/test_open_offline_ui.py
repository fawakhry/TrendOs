"""AP-249: mock-only verification of Firefox launch, no browser/process actually started."""
from __future__ import annotations

import contextlib
import io
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

import open_offline_ui as launch


READY = (
    "AP247_OFFLINE_UI_READY=http://127.0.0.1:46751/; "
    "GET_ONLY=YES; CLOUD=OFF; AUTO_STOP_SECONDS=75\n"
)
STOP = "AP247_OFFLINE_UI_STOPPED=YES; TEMP_CLEANED=YES; PRINTING=OFF\n"


class FakePilot:
    def __init__(self, output: str, code: int = 0):
        self.stdout = io.StringIO(output)
        self.code = code
        self.terminated = False

    def poll(self):
        return self.code

    def wait(self, timeout=None):
        return self.code

    def terminate(self):
        self.terminated = True

    def kill(self):
        self.terminated = True


class FirefoxLauncherTests(unittest.TestCase):
    def test_ready_receipt_requires_exact_loopback_and_75_seconds(self):
        self.assertEqual(launch.ready_url(READY), "http://127.0.0.1:46751/")
        for invalid in (
            READY.replace("127.0.0.1", "0.0.0.0"),
            READY.replace("CLOUD=OFF", "CLOUD=ON"),
            READY.replace("GET_ONLY=YES", "GET_ONLY=NO"),
            READY.replace("AUTO_STOP_SECONDS=75", "AUTO_STOP_SECONDS=750"),
            READY.replace(":46751/", ":65536/"),
            READY.replace(":46751/", ":0/"),
            "http://127.0.0.1:46751/",
        ):
            with self.subTest(invalid=invalid):
                self.assertIsNone(launch.ready_url(invalid))

    def test_arguments_are_rejected_before_any_process(self):
        with patch.object(launch.subprocess, "Popen") as popen:
            with self.assertRaisesRegex(SystemExit, "AP249_UNSUPPORTED_ARGUMENTS"):
                launch.main(["--production"])
            popen.assert_not_called()

    def test_requires_local_graphical_session(self):
        with patch.dict(os.environ, {}, clear=True), patch.object(launch.subprocess, "Popen") as popen:
            with self.assertRaisesRegex(SystemExit, "AP249_GRAPHICAL_SESSION_REQUIRED"):
                launch.main([])
            popen.assert_not_called()

    def test_missing_firefox_never_starts_pilot(self):
        with patch.dict(os.environ, {"DISPLAY": ":0"}, clear=True):
            with patch.object(launch.shutil, "which", return_value=None):
                with patch.object(launch.subprocess, "Popen") as popen:
                    with self.assertRaisesRegex(SystemExit, "AP249_FIREFOX_NOT_FOUND_NO_INSTALL"):
                        launch.main([])
                    popen.assert_not_called()

    def run_mock_pilot(self, output: str, code: int = 0):
        child = FakePilot(output, code)
        calls = []

        def fake_popen(argv, **kwargs):
            calls.append((argv, kwargs))
            if len(calls) == 1:
                return child
            return object()

        log = io.StringIO()
        with patch.dict(os.environ, {"DISPLAY": ":0"}, clear=True):
            with patch.object(launch.shutil, "which", return_value="/usr/bin/firefox"):
                with patch.object(launch.subprocess, "Popen", side_effect=fake_popen):
                    with contextlib.redirect_stdout(log):
                        try:
                            result = launch.main([])
                        except RuntimeError as e:
                            result = str(e)
        return result, calls, log.getvalue()

    def test_good_pilot_launches_only_firefox_at_verified_loopback(self):
        result, calls, log = self.run_mock_pilot(READY + STOP)
        self.assertEqual(result, 0)
        self.assertEqual(len(calls), 2)
        self.assertEqual(calls[0][0][0:2], [sys.executable, "-B"])
        self.assertEqual(
            Path(calls[0][0][2]).name, "offline_pilot.py"
        )
        self.assertEqual(
            calls[1][0],
            ["/usr/bin/firefox", "--new-tab", "http://127.0.0.1:46751/"],
        )
        self.assertNotIn("shell", calls[1][1])
        self.assertIn("AP249_FIREFOX_OPEN_REQUESTED=http://127.0.0.1:46751/", log)
        self.assertIn("AP249_FIREFOX_PILOT_COMPLETED=YES; PRODUCTION=OFF", log)

    def test_no_browser_without_exact_safe_receipt(self):
        malformed = READY.replace("127.0.0.1", "0.0.0.0")
        result, calls, log = self.run_mock_pilot(malformed + STOP)
        self.assertIn("AP249_PILOT_NOT_QUALIFIED", result)
        self.assertEqual(len(calls), 1)
        self.assertNotIn("AP249_FIREFOX_OPEN_REQUESTED", log)

    def test_missing_shutdown_receipt_is_not_success(self):
        result, calls, log = self.run_mock_pilot(READY)
        self.assertIn("stopped=False", result)
        self.assertEqual(len(calls), 2)
        self.assertNotIn("AP249_FIREFOX_PILOT_COMPLETED=YES", log)

    def test_abnormal_pilot_exit_is_not_success(self):
        result, calls, _ = self.run_mock_pilot(READY + STOP, code=1)
        self.assertIn("exit=1", result)
        self.assertEqual(len(calls), 2)


if __name__ == "__main__":
    unittest.main(verbosity=2)
