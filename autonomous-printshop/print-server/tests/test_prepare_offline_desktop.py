"""AP-250 mock/temporary-path tests. Never install a real desktop icon or launch Firefox."""
from __future__ import annotations

import contextlib
import io
import os
import stat
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import prepare_offline_desktop as shortcut


class DesktopIconTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory(prefix="ap250-ci-")
        self.addCleanup(temp.cleanup)
        self.home = Path(temp.name).resolve() / "fake-owner"
        self.root = self.home / "TrendOs" / "autonomous-printshop" / "print-server"
        self.root.mkdir(parents=True)
        self.source = self.root / "prepare_offline_desktop.py"
        self.source.touch()
        (self.root / "open_offline_ui.py").touch()
        (self.root / "offline_pilot.py").touch()
        (self.home / "Desktop").mkdir()

    def test_desktop_entry_is_no_shell_no_terminal_no_production(self):
        path, spec = shortcut.shortcut_spec(self.home, self.source)
        self.assertEqual(path, self.home / "Desktop" / "TrendOS-Offline-75s.desktop")
        self.assertIn(f"Exec=/usr/bin/python3 -B {self.root / 'open_offline_ui.py'}\n", spec)
        self.assertIn("Terminal=false\n", spec)
        self.assertIn("X-TrendOS-Mode=OFFLINE_GET_ONLY_75S\n", spec)
        self.assertNotIn("run.py", spec)
        self.assertNotIn("sh -c", spec)
        self.assertNotIn("http", spec.split("Exec=")[1].splitlines()[0])

    def test_default_mode_only_previews_without_file_write(self):
        receipt = io.StringIO()
        with contextlib.redirect_stdout(receipt):
            self.assertEqual(shortcut.main([], home=self.home, source=self.source), 0)
        self.assertIn("AP250_PREVIEW_ONLY=YES; FILES_WRITTEN=NO", receipt.getvalue())
        self.assertEqual(list((self.home / "Desktop").iterdir()), [])

    def test_explicit_install_creates_one_executable_user_file_only(self):
        with patch.object(shortcut.os, "geteuid", return_value=1000):
            with contextlib.redirect_stdout(io.StringIO()) as receipt:
                self.assertEqual(shortcut.main(["--install"], home=self.home, source=self.source), 0)
        path, text = shortcut.shortcut_spec(self.home, self.source)
        self.assertEqual(path.read_text(encoding="utf-8"), text)
        self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o755)
        self.assertEqual(list((self.home / "Desktop").iterdir()), [path])
        self.assertIn("PILOT_EXECUTED=NO", receipt.getvalue())

    def test_existing_shortcut_is_never_overwritten(self):
        target = self.home / "Desktop" / "TrendOS-Offline-75s.desktop"
        target.write_text("OWNER_CUSTOM_DATA", encoding="utf-8")
        with patch.object(shortcut.os, "geteuid", return_value=1000):
            with self.assertRaisesRegex(SystemExit, "AP250_ICON_ALREADY_EXISTS_NO_OVERWRITE"):
                shortcut.main(["--install"], home=self.home, source=self.source)
        self.assertEqual(target.read_text(encoding="utf-8"), "OWNER_CUSTOM_DATA")

    def test_symlinked_icon_never_replaces_external_target(self):
        external = self.home / "precious.txt"
        external.write_text("UNCHANGED", encoding="utf-8")
        (self.home / "Desktop" / "TrendOS-Offline-75s.desktop").symlink_to(external)
        with patch.object(shortcut.os, "geteuid", return_value=1000):
            with self.assertRaisesRegex(SystemExit, "AP250_ICON_ALREADY_EXISTS_NO_OVERWRITE"):
                shortcut.main(["--install"], home=self.home, source=self.source)
        self.assertEqual(external.read_text(encoding="utf-8"), "UNCHANGED")

    def test_missing_desktop_directory_fails_without_creation(self):
        (self.home / "Desktop").rmdir()
        with self.assertRaisesRegex(ValueError, "AP250_DESKTOP_DIRECTORY_UNAVAILABLE"):
            shortcut.shortcut_spec(self.home, self.source)
        self.assertFalse((self.home / "Desktop").exists())

    def test_symlinked_desktop_directory_fails_closed(self):
        (self.home / "Desktop").rmdir()
        other = self.home / "other"
        other.mkdir()
        (self.home / "Desktop").symlink_to(other)
        with self.assertRaisesRegex(ValueError, "AP250_DESKTOP_DIRECTORY_UNAVAILABLE"):
            shortcut.shortcut_spec(self.home, self.source)

    def test_missing_or_symlinked_runner_fails_closed(self):
        runner = self.root / "open_offline_ui.py"
        runner.unlink()
        with self.assertRaisesRegex(ValueError, "AP250_MISSING_OR_SYMLINKED_OFFLINE_SOURCE"):
            shortcut.shortcut_spec(self.home, self.source)
        runner.symlink_to(self.source)
        with self.assertRaisesRegex(ValueError, "AP250_MISSING_OR_SYMLINKED_OFFLINE_SOURCE"):
            shortcut.shortcut_spec(self.home, self.source)

    def test_copied_installer_cannot_write_from_wrong_location(self):
        source_elsewhere = self.home / "prepare_offline_desktop.py"
        source_elsewhere.touch()
        with self.assertRaisesRegex(ValueError, "AP250_UNEXPECTED_INSTALLER_LOCATION"):
            shortcut.shortcut_spec(self.home, source_elsewhere)

    def test_reject_exec_path_with_field_codes_or_shell_chars(self):
        with tempfile.TemporaryDirectory(prefix="ap250%unsafe-") as d:
            home = Path(d).resolve() / "owner"
            root = home / "TrendOs" / "autonomous-printshop" / "print-server"
            root.mkdir(parents=True)
            source = root / "prepare_offline_desktop.py"
            source.touch()
            (root / "open_offline_ui.py").touch()
            (root / "offline_pilot.py").touch()
            (home / "Desktop").mkdir()
            with self.assertRaisesRegex(ValueError, "AP250_UNSAFE_DESKTOP_EXEC_PATH"):
                shortcut.shortcut_spec(home, source)

    def test_root_install_denied_before_file_write(self):
        with patch.object(shortcut.os, "geteuid", return_value=0):
            with self.assertRaisesRegex(SystemExit, "AP250_REFUSE_ROOT"):
                shortcut.main(["--install"], home=self.home, source=self.source)
        self.assertEqual(list((self.home / "Desktop").iterdir()), [])

    def test_no_command_beyond_preview_or_install(self):
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(SystemExit) as cm:
                shortcut.main(["--start-production"], home=self.home, source=self.source)
        self.assertEqual(cm.exception.code, 2)
        self.assertEqual(list((self.home / "Desktop").iterdir()), [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
