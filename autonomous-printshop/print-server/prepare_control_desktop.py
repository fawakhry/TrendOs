"""AP-253: opt-in START/STOP desktop icons for AP-252's 75s OFFLINE demo.

GitHub-staged only. Default mode previews; --install needs separate owner
permission on Ubuntu. Creates TWO new user icons, never overwrites AP-250 icon,
runs no server and does not mark GNOME desktop launchers trusted.
"""
from __future__ import annotations

import argparse
import os
import re
import stat
from pathlib import Path

_ROOT_SUFFIX = ("TrendOs", "autonomous-printshop", "print-server")
_ALLOW_EXEC_PATH = re.compile(r"^/[A-Za-z0-9_./@+\-]+$")
_START_ICON = "TrendOS-Offline-Controlled-START.desktop"
_STOP_ICON = "TrendOS-Offline-Controlled-STOP.desktop"


def icon_specs(home: Path, source: Path) -> tuple[tuple[Path, str], ...]:
    home = home.resolve(strict=True)
    if not home.is_dir():
        raise ValueError("AP253_HOME_DIRECTORY_REQUIRED")
    root = home.joinpath(*_ROOT_SUFFIX)
    if not root.is_dir() or root.is_symlink() or root.resolve(strict=True) != root:
        raise ValueError("AP253_EXPECTED_OWNER_CHECKOUT_REQUIRED")
    expected = root / "prepare_control_desktop.py"
    if source.is_symlink() or source.resolve(strict=True) != expected:
        raise ValueError("AP253_WRONG_INSTALLER_PATH")
    demo = root / "controlled_offline_session.py"
    pilot = root / "offline_pilot.py"
    for file in (demo, pilot):
        if not file.is_file() or file.is_symlink():
            raise ValueError("AP253_REQUIRED_DEMO_FILE_MISSING")
    if not _ALLOW_EXEC_PATH.fullmatch(str(demo)):
        raise ValueError("AP253_UNSAFE_DESKTOP_EXEC_PATH")
    desktop = home / "Desktop"
    if not desktop.is_dir() or desktop.is_symlink() or desktop.resolve(strict=True) != desktop:
        raise ValueError("AP253_DESKTOP_DIR_REQUIRED_NO_CREATE")

    def spec(label: str, action: str, icon: str) -> str:
        return "\n".join((
            "[Desktop Entry]",
            "Version=1.0",
            "Type=Application",
            f"Name={label}",
            "Comment=Owner-only synthetic localhost preview; never enter credentials",
            f"Icon={icon}",
            f"Exec=/usr/bin/python3 -B {demo} {action}",
            "TryExec=/usr/bin/python3",
            "Terminal=false",
            "StartupNotify=false",
            "Categories=Graphics;",
            "X-TrendOS-Mode=OFFLINE_75S_OWNER_LOCAL",
            "",
        ))

    return (
        (desktop / _START_ICON, spec("TrendOS Offline START (75s)", "start", "media-playback-start")),
        (desktop / _STOP_ICON, spec("TrendOS Offline STOP", "stop", "media-playback-stop")),
    )


def _unlink_only_our_file(path: Path, inode: int) -> None:
    try:
        item = path.lstat()
        if stat.S_ISREG(item.st_mode) and item.st_ino == inode:
            path.unlink()
    except FileNotFoundError:
        pass


def _exclusive_create(path: Path, content: str) -> int:
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    fd = os.open(path, flags, 0o700)
    inode = os.fstat(fd).st_ino
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            stream.write(content)
            stream.flush()
            os.fchmod(stream.fileno(), 0o755)
            os.fsync(stream.fileno())
    except BaseException:
        _unlink_only_our_file(path, inode)
        raise
    return inode


def install(specs: tuple[tuple[Path, str], ...]) -> None:
    # Preflight both entries, then exclusive-create every file; no replace.
    for path, _ in specs:
        if path.exists() or path.is_symlink():
            raise FileExistsError("AP253_ICON_ALREADY_EXISTS_NO_OVERWRITE")
    created = []
    try:
        for path, content in specs:
            inode = _exclusive_create(path, content)
            created.append((path, inode))
    except BaseException:
        for path, inode in reversed(created):
            _unlink_only_our_file(path, inode)
        raise


def main(
    argv: list[str] | None = None,
    *,
    home: Path | None = None,
    source: Path | None = None,
) -> int:
    parser = argparse.ArgumentParser(description="Owner-only OFFLINE START/STOP desktop icons")
    actions = parser.add_mutually_exclusive_group()
    actions.add_argument("--preview", action="store_true", help="Read-only preview (default)")
    actions.add_argument("--install", action="store_true", help="Create exactly two new icons, without starting demo")
    args = parser.parse_args(argv)
    specs = icon_specs(Path.home() if home is None else home, Path(__file__) if source is None else source)
    if not args.install:
        for path, entry in specs:
            print(f"AP253_PREVIEW_TARGET={path}\n{entry}")
        print("AP253_PREVIEW_ONLY=YES; FILES_WRITTEN=NO; DEMO_STARTED=NO")
        return 0
    if os.geteuid() == 0:
        raise SystemExit("AP253_REFUSE_ROOT")
    try:
        install(specs)
    except FileExistsError as exc:
        raise SystemExit("AP253_ICON_ALREADY_EXISTS_NO_OVERWRITE") from exc
    print("AP253_START_STOP_ICONS_INSTALLED=YES; GNOME_ALLOW_LAUNCHING=OWNER_MANUAL")
    print("AP253_DEMO_STARTED=NO; PRODUCTION=OFF")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
