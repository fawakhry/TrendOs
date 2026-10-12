"""AP-252 owner-gated, bounded OFFLINE Print Server with local early-stop control.

Staged on GitHub only. Does not change AP-247/AP-249, start production run.py,
connect to cloud, persist a service, inspect customer directories, or print.
The control channel is an owner-only AF_UNIX socket in XDG_RUNTIME_DIR, NOT HTTP.
"""
from __future__ import annotations

import os
import shutil
import socket
import stat
import struct
import subprocess
import sys
import tempfile
import threading
import time
import uuid
from http.server import ThreadingHTTPServer
from pathlib import Path

import offline_stop_receipt as stop_receipt
from offline_pilot import check_status, offline_config, pilot_handler
from src.server import PrintServerApp

PILOT_SECONDS = 75
_SOCKET_NAME = "trendos-ap252-offline-control.sock"
_STOP_REQUEST = b"AP252_STOP\n"
_STOP_RESPONSE = b"AP252_STOP_ACCEPTED\n"


def owner_runtime_socket() -> Path:
    """Require an existing owner-private session directory. Do not create one."""
    raw = os.environ.get("XDG_RUNTIME_DIR")
    if not raw:
        raise RuntimeError("AP252_PRIVATE_RUNTIME_DIR_REQUIRED")
    root = Path(raw)
    if not root.is_absolute() or root.is_symlink():
        raise RuntimeError("AP252_UNSAFE_RUNTIME_DIR")
    try:
        metadata = root.stat()
        if root.resolve(strict=True) != root or not stat.S_ISDIR(metadata.st_mode):
            raise RuntimeError("AP252_UNSAFE_RUNTIME_DIR")
    except (FileNotFoundError, OSError) as exc:
        raise RuntimeError("AP252_PRIVATE_RUNTIME_DIR_REQUIRED") from exc
    if metadata.st_uid != os.getuid() or stat.S_IMODE(metadata.st_mode) & 0o077:
        raise RuntimeError("AP252_PRIVATE_RUNTIME_DIR_REQUIRED")
    return root / _SOCKET_NAME


def _peer_is_owner(connection: socket.socket) -> bool:
    """Linux SO_PEERCRED prevents cross-user stop requests even on socket reuse."""
    if not hasattr(socket, "SO_PEERCRED"):
        return False
    try:
        credentials = connection.getsockopt(
            socket.SOL_SOCKET, socket.SO_PEERCRED, struct.calcsize("3i")
        )
        _pid, uid, _gid = struct.unpack("3i", credentials)
        return uid == os.getuid()
    except (OSError, ValueError, struct.error):
        return False


def request_stop(path: Path) -> bool:
    """Owner stop request. Never send a Unix signal to a guessed process ID."""
    with socket.socket(socket.AF_UNIX, socket.SOCK_STREAM) as client:
        client.settimeout(2)
        try:
            client.connect(str(path))
        except FileNotFoundError:
            print("AP252_STOP_RESULT=NO_ACTIVE_SESSION", flush=True)
            return False
        except (ConnectionRefusedError, TimeoutError) as exc:
            raise RuntimeError("AP252_STOP_NOT_DELIVERED_NO_RETRY") from exc
        client.sendall(_STOP_REQUEST)
        answer = client.recv(64)
    if answer != _STOP_RESPONSE:
        raise RuntimeError("AP252_STOP_NOT_ACKNOWLEDGED")
    print("AP252_STOP_REQUEST_ACCEPTED=YES; PRINTING=OFF", flush=True)
    return True


def _accept_stop(listener: socket.socket, stop: threading.Event, finished: threading.Event) -> None:
    listener.settimeout(0.15)
    while not finished.is_set() and not stop.is_set():
        try:
            connection, _ = listener.accept()
        except socket.timeout:
            continue
        except OSError:
            break
        with connection:
            connection.settimeout(1)
            if not _peer_is_owner(connection):
                continue
            try:
                payload = connection.recv(32)
                if payload != _STOP_REQUEST:
                    continue
                # Acknowledge only when the request was delivered to this
                # exact, current local session (not an arbitrary PID).
                stop.set()
                connection.sendall(_STOP_RESPONSE)
            except OSError:
                continue


def _remove_owned_socket(path: Path, original_inode: int) -> None:
    """Do not unlink a swapped-in path or anything other than our own socket."""
    try:
        metadata = path.lstat()
        if stat.S_ISSOCK(metadata.st_mode) and metadata.st_ino == original_inode:
            path.unlink()
    except FileNotFoundError:
        pass


def run_session(
    runtime_path: Path,
    firefox: str,
    *,
    seconds: float = PILOT_SECONDS,
    browser_launch=subprocess.Popen,
) -> None:
    if not 0 < seconds <= PILOT_SECONDS:
        raise ValueError("AP252_DURATION_OUT_OF_BOUNDS")
    if runtime_path.exists() or runtime_path.is_symlink():
        raise RuntimeError("AP252_ACTIVE_OR_STALE_SOCKET_EXISTS_NO_OVERWRITE")

    listener = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
    owned_inode = None
    stop = threading.Event()
    finished = threading.Event()
    control_thread = None
    try:
        old_umask = os.umask(0o077)
        try:
            listener.bind(str(runtime_path))
        finally:
            os.umask(old_umask)
        owned_inode = runtime_path.lstat().st_ino
        os.chmod(runtime_path, 0o600)
        listener.listen(4)
        control_thread = threading.Thread(
            target=_accept_stop, args=(listener, stop, finished), daemon=True
        )
        control_thread.start()
        # Invalidate the old final result before this specific new session starts.
        # A crash leaves PENDING, never a misleading old OWNER_STOP receipt.
        session_id = uuid.uuid4().hex
        stop_receipt.start(runtime_path, session_id)
        # Reuse the already-qualified AP-247 synthetic GET-only server logic.
        with tempfile.TemporaryDirectory(prefix="trendos-ap252-") as temp:
            root = Path(temp).resolve()
            app = PrintServerApp(
                offline_config(root),
                Path(__file__).resolve().parent / "public",
                config_path=root / "local.json",
            )
            with ThreadingHTTPServer(("127.0.0.1", 0), pilot_handler(app)) as http:
                http.daemon_threads = True
                worker = threading.Thread(
                    target=http.serve_forever, kwargs={"poll_interval": 0.1},
                    daemon=True,
                )
                worker.start()
                try:
                    port = http.server_address[1]
                    check_status(port)
                    url = f"http://127.0.0.1:{port}/"
                    print(
                        f"AP252_OFFLINE_READY={url}; GET_ONLY=YES; "
                        f"CLOUD=OFF; AUTO_STOP_SECONDS={PILOT_SECONDS}",
                        flush=True,
                    )
                    started = time.monotonic()
                    # Launch existing browser, never an arbitrary URL or shell.
                    browser_launch(
                        [firefox, "--new-tab", url],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                    )
                    print("AP252_FIREFOX_OPEN_REQUESTED=YES", flush=True)
                    was_stopped = stop.wait(seconds)
                finally:
                    http.shutdown()
                    worker.join(timeout=3)
                    if worker.is_alive():
                        raise RuntimeError("AP252_HTTP_DID_NOT_STOP")
        reason = "OWNER_STOP" if was_stopped else "TIMEOUT"
        elapsed = time.monotonic() - started
        # Only persist STOPPED after HTTP worker shutdown and temporary-root
        # context exit; a failed or interrupted session remains PENDING.
        stop_receipt.finish(runtime_path, session_id, reason, elapsed)
        print(
            f"AP252_OFFLINE_STOPPED=YES; TEMP_CLEANED=YES; PRINTING=OFF; "
            f"REASON={reason}",
            flush=True,
        )
    finally:
        finished.set()
        listener.close()
        if control_thread is not None:
            control_thread.join(timeout=2)
        if owned_inode is not None:
            _remove_owned_socket(runtime_path, owned_inode)


def main(argv: list[str] | None = None) -> int:
    args = sys.argv[1:] if argv is None else argv
    if args == ["receipt"]:
        return 0 if stop_receipt.display(owner_runtime_socket()) else 2
    if args == ["stop"]:
        return 0 if request_stop(owner_runtime_socket()) else 2
    if args not in ([], ["start"]):
        raise SystemExit("AP257_ONLY_START_STOP_OR_RECEIPT_ALLOWED")
    if os.geteuid() == 0:
        raise SystemExit("AP252_REFUSE_ROOT")
    if not (os.environ.get("DISPLAY") or os.environ.get("WAYLAND_DISPLAY")):
        raise SystemExit("AP252_GRAPHICAL_SESSION_REQUIRED")
    firefox = shutil.which("firefox")
    if not firefox:
        raise SystemExit("AP252_EXISTING_FIREFOX_REQUIRED_NO_INSTALL")
    run_session(owner_runtime_socket(), firefox)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
