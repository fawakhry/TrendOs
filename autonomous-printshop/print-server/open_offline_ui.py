"""AP-249: owner-invoked Firefox preview for the already-isolated AP-247 pilot.

GitHub staging only until separately authorized on Ubuntu. No production run.py,
cloud calls, credentials, print jobs, persistent service or local configuration writes.
The child offline_pilot.py continues to own its 75-second loopback-only lifetime.
"""
from __future__ import annotations

import os
import queue
import re
import shutil
import subprocess
import sys
import threading
import time
from pathlib import Path

_READY = re.compile(
    r"^AP247_OFFLINE_UI_READY=http://127\.0\.0\.1:(\d{1,5})/; "
    r"GET_ONLY=YES; CLOUD=OFF; AUTO_STOP_SECONDS=75$"
)
_STOP = "AP247_OFFLINE_UI_STOPPED=YES; TEMP_CLEANED=YES; PRINTING=OFF"
_READY_TIMEOUT = 15
_TOTAL_TIMEOUT = 95


def ready_url(line: str) -> str | None:
    """Accept only the exact local, synthetic 75-second readiness receipt."""
    match = _READY.fullmatch(line.rstrip("\r\n"))
    if match is None:
        return None
    port = int(match.group(1))
    if not 1 <= port <= 65535:
        return None
    return f"http://127.0.0.1:{port}/"


def _pump_stdout(pipe, lines: queue.Queue[str | None]) -> None:
    try:
        for line in pipe:
            lines.put(line)
    finally:
        lines.put(None)


def _stop_child(child: subprocess.Popen) -> None:
    if child.poll() is not None:
        return
    child.terminate()
    try:
        child.wait(timeout=3)
    except subprocess.TimeoutExpired:
        child.kill()
        child.wait(timeout=3)


def main(argv: list[str] | None = None) -> int:
    if argv is None:
        argv = sys.argv[1:]
    if argv:
        raise SystemExit("AP249_UNSUPPORTED_ARGUMENTS")
    if not (os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY")):
        raise SystemExit("AP249_GRAPHICAL_SESSION_REQUIRED")

    firefox = shutil.which("firefox")
    if firefox is None:
        raise SystemExit("AP249_FIREFOX_NOT_FOUND_NO_INSTALL")

    pilot = Path(__file__).resolve().with_name("offline_pilot.py")
    child = subprocess.Popen(
        [sys.executable, "-B", str(pilot)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1,
    )
    assert child.stdout is not None
    lines: queue.Queue[str | None] = queue.Queue()
    threading.Thread(target=_pump_stdout, args=(child.stdout, lines), daemon=True).start()
    started = time.monotonic()
    ready = False
    stopped = False
    try:
        while True:
            elapsed = time.monotonic() - started
            if elapsed >= _TOTAL_TIMEOUT:
                raise RuntimeError("AP249_PILOT_TOTAL_TIMEOUT")
            if not ready and elapsed >= _READY_TIMEOUT:
                raise RuntimeError("AP249_READY_TIMEOUT")
            try:
                line = lines.get(timeout=min(1.0, _TOTAL_TIMEOUT - elapsed))
            except queue.Empty:
                continue
            if line is None:
                break
            print(line, end="", flush=True)
            if not ready:
                url = ready_url(line)
                if url is not None:
                    # Browser request only; owner must still visually verify Firefox.
                    # No shell, no arbitrary URL, no login and no browser installation.
                    subprocess.Popen(
                        [firefox, "--new-tab", url],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                    ready = True
                    print(f"AP249_FIREFOX_OPEN_REQUESTED={url}", flush=True)
            if line.rstrip("\r\n") == _STOP:
                stopped = True
        code = child.wait(timeout=3)
        if code != 0 or not ready or not stopped:
            raise RuntimeError(
                f"AP249_PILOT_NOT_QUALIFIED exit={code} ready={ready} stopped={stopped}"
            )
        print("AP249_FIREFOX_PILOT_COMPLETED=YES; PRODUCTION=OFF", flush=True)
        return 0
    finally:
        _stop_child(child)
        child.stdout.close()


if __name__ == "__main__":
    raise SystemExit(main())
