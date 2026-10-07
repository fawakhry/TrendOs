from __future__ import annotations

import base64
import os
import subprocess
import sys
import tempfile
from pathlib import Path


class LocalSettingsError(Exception):
    pass


def validate_writable_directory(raw_path: str) -> Path:
    raw = str(raw_path or "").strip().strip('"')
    if not raw:
        raise LocalSettingsError("ORDERS_ROOT_REQUIRED")
    path = Path(os.path.expandvars(os.path.expanduser(raw)))
    if not path.is_absolute():
        raise LocalSettingsError("ABSOLUTE_PATH_REQUIRED")
    try:
        path.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(
            prefix=".trendos_write_test_",
            dir=str(path),
            delete=True,
        ) as fh:
            fh.write(b"ok")
            fh.flush()
    except Exception as exc:
        raise LocalSettingsError("ORDERS_ROOT_NOT_WRITABLE:%s" % str(exc)[:300]) from exc
    return path.resolve()


def choose_windows_directory(initial_path: str = "") -> str:
    if os.name != "nt":
        raise LocalSettingsError("WINDOWS_FOLDER_PICKER_REQUIRED")

    initial = str(initial_path or "").replace("'", "''")
    script = r"""
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new()
Add-Type -AssemblyName System.Windows.Forms
$owner = New-Object System.Windows.Forms.Form
$owner.TopMost = $true
$owner.ShowInTaskbar = $false
$owner.WindowState = 'Minimized'
$dialog = New-Object System.Windows.Forms.FolderBrowserDialog
$dialog.Description = 'اختر مكان حفظ شغل TrendOS'
$dialog.ShowNewFolderButton = $true
$initial = '__INITIAL__'
if ($initial -and (Test-Path -LiteralPath $initial)) {
  $dialog.SelectedPath = $initial
}
$result = $dialog.ShowDialog($owner)
$owner.Close()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) {
  [Console]::Write($dialog.SelectedPath)
  exit 0
}
exit 3
""".replace("__INITIAL__", initial)
    encoded = base64.b64encode(script.encode("utf-16le")).decode("ascii")
    flags = getattr(subprocess, "CREATE_NO_WINDOW", 0)
    try:
        proc = subprocess.run(
            [
                "powershell.exe",
                "-NoProfile",
                "-STA",
                "-EncodedCommand",
                encoded,
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=300,
            creationflags=flags,
        )
    except subprocess.TimeoutExpired as exc:
        raise LocalSettingsError("FOLDER_PICKER_TIMEOUT") from exc
    if proc.returncode == 3:
        return ""
    if proc.returncode != 0:
        err = proc.stderr.decode("utf-8", "replace").strip()
        raise LocalSettingsError("FOLDER_PICKER_FAILED:%s" % err[:300])
    selected = proc.stdout.decode("utf-8", "replace").strip()
    return selected
