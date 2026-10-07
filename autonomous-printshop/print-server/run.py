from __future__ import annotations

import os
import sys
import traceback
from datetime import datetime
from pathlib import Path


def _app_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def _write_boot_log(name: str, text: str) -> None:
    try:
        root = _app_dir() / "data" / "state"
        root.mkdir(parents=True, exist_ok=True)
        path = root / name
        stamp = datetime.now().astimezone().isoformat()
        with path.open("a", encoding="utf-8") as fh:
            fh.write("[%s] %s\n" % (stamp, text))
    except Exception:
        pass


def main_wrapper():
    _write_boot_log("startup.log", "BOOT_START exe=%s cwd=%s" % (sys.executable, os.getcwd()))
    try:
        from src.server import main
        _write_boot_log("startup.log", "IMPORT_SERVER_OK")
        main()
    except KeyboardInterrupt:
        _write_boot_log("startup.log", "BOOT_STOP_KEYBOARD")
    except BaseException as exc:
        details = "%s: %s\n%s" % (
            type(exc).__name__,
            exc,
            traceback.format_exc(),
        )
        _write_boot_log("crash.log", details)
        try:
            print("TrendOS Print Server could not start.")
            print(details)
            print("Crash log: %s" % (_app_dir() / "data" / "state" / "crash.log"))
        except Exception:
            pass
        raise


if __name__ == "__main__":
    main_wrapper()
