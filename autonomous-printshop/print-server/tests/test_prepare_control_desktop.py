"""AP-253 temp-home tests; never create real Ubuntu shortcuts or launch processes."""
from __future__ import annotations

import contextlib
import io
import os
import stat
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import prepare_control_desktop as installer


class OfflineStartStopIconsTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory(prefix="ap253-ci-")
        self.addCleanup(temp.cleanup)
        self.home = Path(temp.name).resolve() / "owner"
        self.root = self.home / "TrendOs" / "autonomous-printshop" / "print-server"
        self.root.mkdir(parents=True)
        self.source = self.root / "prepare_control_desktop.py"
        self.source.touch()
        (self.root / "controlled_offline_session.py").touch()
        (self.root / "offline_pilot.py").touch()
        (self.home / "Desktop").mkdir()

    def target_paths(self):
        return [self.home / "Desktop" / filename for filename in (
            "TrendOS-Offline-Controlled-START.desktop",
            "TrendOS-Offline-Controlled-STOP.desktop",
        )]

    def test_exact_two_shell_free_start_stop_entries(self):
        specs = installer.icon_specs(self.home, self.source)
        self.assertEqual([t for t, _ in specs], self.target_paths())
        for (_, text), action in zip(specs, ("start", "stop")):
            self.assertIn(f"Exec=/usr/bin/python3 -B {self.root / 'controlled_offline_session.py'} {action}", text)
            self.assertIn("Terminal=false", text)
            self.assertIn("OFFLINE_75S_OWNER_LOCAL", text)
            self.assertNotIn("run.py ", text)
            self.assertNotIn("sh -c", text)

    def test_default_preview_creates_nothing(self):
        log = io.StringIO()
        with contextlib.redirect_stdout(log):
            self.assertEqual(installer.main([], home=self.home, source=self.source), 0)
        self.assertIn("AP253_PREVIEW_ONLY=YES", log.getvalue())
        self.assertEqual(list((self.home / "Desktop").iterdir()), [])

    def test_explicit_install_creates_only_two_new_755_files(self):
        with patch.object(installer.os, "geteuid", return_value=1000):
            with contextlib.redirect_stdout(io.StringIO()) as log:
                self.assertEqual(installer.main(["--install"], home=self.home, source=self.source), 0)
        self.assertIn("AP253_DEMO_STARTED=NO", log.getvalue())
        for path, expected in installer.icon_specs(self.home, self.source):
            self.assertTrue(path.is_file())
            self.assertEqual(path.read_text(encoding="utf-8"), expected)
            self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o755)
        self.assertEqual(set((self.home / "Desktop").iterdir()), set(self.target_paths()))

    def test_existing_start_prevents_all_writes(self):
        start, stop = self.target_paths()
        start.write_text("DO_NOT_TOUCH", encoding="utf-8")
        with self.assertRaises(FileExistsError):
            installer.install(installer.icon_specs(self.home, self.source))
        self.assertEqual(start.read_text(encoding="utf-8"), "DO_NOT_TOUCH")
        self.assertFalse(stop.exists())

    def test_existing_stop_prevents_creating_start(self):
        start, stop = self.target_paths()
        stop.write_text("DO_NOT_TOUCH", encoding="utf-8")
        with self.assertRaises(FileExistsError):
            installer.install(installer.icon_specs(self.home, self.source))
        self.assertEqual(stop.read_text(encoding="utf-8"), "DO_NOT_TOUCH")
        self.assertFalse(start.exists())

    def test_symlink_icon_fails_without_following_target(self):
        start, stop = self.target_paths()
        protected = self.home / "protected.txt"
        protected.write_text("UNCHANGED", encoding="utf-8")
        stop.symlink_to(protected)
        with self.assertRaises(FileExistsError):
            installer.install(installer.icon_specs(self.home, self.source))
        self.assertEqual(protected.read_text(encoding="utf-8"), "UNCHANGED")
        self.assertFalse(start.exists())

    def test_second_creation_failure_rolls_back_first_new_icon(self):
        specs = installer.icon_specs(self.home, self.source)
        original = installer._exclusive_create
        count = 0

        def fail_second(path, text):
            nonlocal count
            count += 1
            if count == 2:
                raise PermissionError("synthetic second write denied")
            return original(path, text)

        with patch.object(installer, "_exclusive_create", side_effect=fail_second):
            with self.assertRaises(PermissionError):
                installer.install(specs)
        self.assertEqual(list((self.home / "Desktop").iterdir()), [])

    def test_existing_shortcut_remains_untouched_on_second_run(self):
        specs = installer.icon_specs(self.home, self.source)
        installer.install(specs)
        with self.assertRaises(FileExistsError):
            installer.install(specs)
        for path, text in specs:
            self.assertEqual(path.read_text(encoding="utf-8"), text)

    def test_missing_control_module_denied(self):
        (self.root / "controlled_offline_session.py").unlink()
        with self.assertRaisesRegex(ValueError, "AP253_REQUIRED_DEMO_FILE_MISSING"):
            installer.icon_specs(self.home, self.source)
        self.assertFalse(any((self.home / "Desktop").iterdir()))

    def test_symlinked_control_module_denied(self):
        demo = self.root / "controlled_offline_session.py"
        demo.unlink()
        demo.symlink_to(self.source)
        with self.assertRaisesRegex(ValueError, "AP253_REQUIRED_DEMO_FILE_MISSING"):
            installer.icon_specs(self.home, self.source)

    def test_unexpected_installer_location_denied(self):
        outsider = self.home / "prepare_control_desktop.py"
        outsider.touch()
        with self.assertRaisesRegex(ValueError, "AP253_WRONG_INSTALLER_PATH"):
            installer.icon_specs(self.home, outsider)

    def test_desktop_directory_missing_or_symlinked_denied(self):
        desktop = self.home / "Desktop"
        desktop.rmdir()
        with self.assertRaisesRegex(ValueError, "AP253_DESKTOP_DIR_REQUIRED_NO_CREATE"):
            installer.icon_specs(self.home, self.source)
        outside = self.home / "other"
        outside.mkdir()
        desktop.symlink_to(outside)
        with self.assertRaisesRegex(ValueError, "AP253_DESKTOP_DIR_REQUIRED_NO_CREATE"):
            installer.icon_specs(self.home, self.source)

    def test_unsafe_home_exec_path_denied(self):
        with tempfile.TemporaryDirectory(prefix="ap253%test") as t:
            home = Path(t).resolve() / "owner"
            root = home / "TrendOs" / "autonomous-printshop" / "print-server"
            root.mkdir(parents=True)
            script = root / "prepare_control_desktop.py"
            script.touch()
            (root / "controlled_offline_session.py").touch()
            (root / "offline_pilot.py").touch()
            (home / "Desktop").mkdir()
            with self.assertRaisesRegex(ValueError, "AP253_UNSAFE_DESKTOP_EXEC_PATH"):
                installer.icon_specs(home, script)

    def test_root_install_refused_no_changes(self):
        with patch.object(installer.os, "geteuid", return_value=0):
            with self.assertRaisesRegex(SystemExit, "AP253_REFUSE_ROOT"):
                installer.main(["--install"], home=self.home, source=self.source)
        self.assertEqual(list((self.home / "Desktop").iterdir()), [])

    def test_unsupported_flags_rejected_no_changes(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as caught:
                installer.main(["--production"], home=self.home, source=self.source)
        self.assertEqual(caught.exception.code, 2)
        self.assertEqual(list((self.home / "Desktop").iterdir()), [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
