"""AP-250: opt-in desktop shortcut for AP-249's *offline 75s* Firefox preview.

No network, no production start and no write by default. Installation is an
explicit owner-only command that creates one new .desktop file under ~/Desktop.
Does not install packages, register system services, mark GNOME shortcuts trusted
or launch the pilot; visual proof is still necessary on Ubuntu after approval.
"""
from __future__ import annotations

import argparse
import os
import re
from pathlib import Path

_NAME = "TrendOS-Offline-75s.desktop"
_SAFE_ABSOLUTE_EXEC_PATH = re.compile(r"^/[A-Za-z0-9_./@+\-]+$")


def shortcut_spec(home: Path, source: Path) -> tuple[Path, str]:
    """Validate the expected home checkout and produce a shell-free .desktop entry."""
    home = home.resolve(strict=True)
    if not home.is_dir():
        raise ValueError("AP250_HOME_NOT_DIRECTORY")
    root = home / "TrendOs" / "autonomous-printshop" / "print-server"
    # Reject relocated/symlinked checkouts and accidental execution from another repo.
    if not root.is_dir() or root.resolve(strict=True) != root:
        raise ValueError("AP250_EXPECTED_REPO_PATH_REQUIRED")
    expected_source = root / "prepare_offline_desktop.py"
    if source.resolve(strict=True) != expected_source or source.is_symlink():
        raise ValueError("AP250_UNEXPECTED_INSTALLER_LOCATION")

    runner = root / "open_offline_ui.py"
    pilot = root / "offline_pilot.py"
    for item in (runner, pilot):
        if not item.is_file() or item.is_symlink():
            raise ValueError("AP250_MISSING_OR_SYMLINKED_OFFLINE_SOURCE")
    # .desktop Exec is *not* parsed by a shell. Reject characters requiring
    # escaping/field-code interpretation rather than interpolate untrusted input.
    if not _SAFE_ABSOLUTE_EXEC_PATH.fullmatch(str(runner)):
        raise ValueError("AP250_UNSAFE_DESKTOP_EXEC_PATH")

    desktop = home / "Desktop"
    if not desktop.is_dir() or desktop.is_symlink() or desktop.resolve(strict=True) != desktop:
        raise ValueError("AP250_DESKTOP_DIRECTORY_UNAVAILABLE_NO_CREATE")
    destination = desktop / _NAME
    entry = "\n".join((
        "[Desktop Entry]",
        "Version=1.0",
        "Type=Application",
        "Name=TrendOS Print Server (Offline 75s)",
        "Comment=Synthetic localhost-only preview; never enter credentials",
        "Icon=printer",
        f"Exec=/usr/bin/python3 -B {runner}",
        "TryExec=/usr/bin/python3",
        "Terminal=false",
        "StartupNotify=false",
        "Categories=Graphics;",
        "X-TrendOS-Mode=OFFLINE_GET_ONLY_75S",
        "",
    ))
    return destination, entry


def install(destination: Path, content: str) -> None:
    """Create a single new owner-scoped desktop file; refuse any overwrite."""
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    fd = os.open(destination, flags, 0o700)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            file.write(content)
            file.flush()
            os.fchmod(file.fileno(), 0o755)
            os.fsync(file.fileno())
    except BaseException:
        destination.unlink(missing_ok=True)
        raise


def main(argv: list[str] | None = None, *, home: Path | None = None, source: Path | None = None) -> int:
    parser = argparse.ArgumentParser(description="Prepare a 75s OFFLINE TrendOS desktop preview icon")
    actions = parser.add_mutually_exclusive_group()
    actions.add_argument("--preview", action="store_true", help="Show planned shortcut without changing files (default)")
    actions.add_argument("--install", action="store_true", help="Owner-approved: create only the user desktop shortcut")
    args = parser.parse_args(argv)
    if home is None:
        home = Path.home()
    if source is None:
        source = Path(__file__)
    destination, entry = shortcut_spec(home, source)
    if not args.install:
        print(f"AP250_PREVIEW_TARGET={destination}")
        print(entry, end="")
        print("AP250_PREVIEW_ONLY=YES; FILES_WRITTEN=NO; PILOT_EXECUTED=NO")
        return 0
    if os.geteuid() == 0:
        raise SystemExit("AP250_REFUSE_ROOT")
    try:
        install(destination, entry)
    except FileExistsError as exc:
        raise SystemExit("AP250_ICON_ALREADY_EXISTS_NO_OVERWRITE") from exc
    print(f"AP250_ICON_INSTALLED={destination}; GNOME_ALLOW_LAUNCHING=OWNER_MANUAL; PILOT_EXECUTED=NO")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
