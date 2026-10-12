"""AP-247: finite-lifetime, loopback-only offline print-server UI pilot.

Opt-in owner execution only. Never starts the production Print Server run.py.
No employee login, printshop scan, cloud request, or business-state mutation.
"""
from __future__ import annotations

import copy
import http.client
import json
import sys
import tempfile
import threading
import time
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

from src.config import DEFAULT_CONFIG
from src.server import PrintServerApp, make_handler

PILOT_SECONDS = 75
_ALLOWED_GET = frozenset(("/", "/api/status", "/api/orders", "/api/state", "/api/settings"))


def offline_config(root: Path) -> dict:
    """Construct wholly synthetic paths without reading persisted local config."""
    if not root.is_absolute():
        raise ValueError("ABSOLUTE_TEMP_ROOT_REQUIRED")
    cfg = copy.deepcopy(DEFAULT_CONFIG)
    cfg["paths"] = {
        "ordersRoot": str(root / "orders"),
        "readyRoot": str(root / "ready"),
        "stateRoot": str(root / "state"),
    }
    cfg["server"] = {"host": "127.0.0.1", "port": 0}
    cfg["trendos"].update({"enabled": False, "baseUrl": ""})
    cfg["fastMode"].update({"enabled": False, "popup": False, "openExplorer": False, "topMost": False})
    return cfg


def pilot_handler(app: PrintServerApp):
    original_handler = make_handler(app)

    class OfflinePilotHandler(original_handler):
        def _blocked(self):
            self._json(403, {"ok": False, "error": "OFFLINE_PILOT_ROUTE_BLOCKED"})

        def do_GET(self):
            path = urlsplit(self.path).path
            allowed = path in _ALLOWED_GET or path.startswith("/static/")
            if len(self.path) > 256 or not allowed:
                return self._blocked()
            return super().do_GET()

        def do_POST(self):
            return self._blocked()

        def do_PUT(self):
            return self._blocked()

        def do_PATCH(self):
            return self._blocked()

        def do_DELETE(self):
            return self._blocked()

        def do_OPTIONS(self):
            return self._blocked()

    return OfflinePilotHandler


def check_status(port: int) -> None:
    """One bounded local request, never a cloud health probe."""
    client = http.client.HTTPConnection("127.0.0.1", port, timeout=4)
    try:
        client.request("GET", "/api/status")
        reply = client.getresponse()
        payload = json.loads(reply.read(32768))
        if not (
            reply.status == 200
            and payload.get("service") == "TrendOS Print Server"
            and payload.get("trendosReadAdapter") == "DISABLED"
            and payload.get("trendos", {}).get("connected") is False
            and payload.get("bridge", {}).get("running") is False
            and payload.get("fastMode", {}).get("enabled") is False
            and payload.get("platformBusinessWrites") is False
        ):
            raise RuntimeError("PILOT_STATUS_NOT_ISOLATED")
    finally:
        client.close()


def main(argv: list[str] | None = None) -> None:
    if argv is None:
        argv = sys.argv[1:]
    if argv:
        raise SystemExit("AP247_UNSUPPORTED_ARGUMENTS")
    with tempfile.TemporaryDirectory(prefix="trendos-ap247-") as tmp:
        root = Path(tmp).resolve()
        app = PrintServerApp(
            offline_config(root),
            Path(__file__).resolve().parent / "public",
            config_path=root / "local.json",
        )
        with ThreadingHTTPServer(("127.0.0.1", 0), pilot_handler(app)) as server:
            server.daemon_threads = True
            service = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.1}, daemon=True)
            service.start()
            try:
                port = server.server_address[1]
                check_status(port)
                print(f"AP247_OFFLINE_UI_READY=http://127.0.0.1:{port}/; GET_ONLY=YES; CLOUD=OFF; AUTO_STOP_SECONDS={PILOT_SECONDS}", flush=True)
                time.sleep(PILOT_SECONDS)
            finally:
                server.shutdown()
                service.join(timeout=3)
                if service.is_alive():
                    raise RuntimeError("PILOT_DID_NOT_STOP")
    print("AP247_OFFLINE_UI_STOPPED=YES; TEMP_CLEANED=YES; PRINTING=OFF", flush=True)


if __name__ == "__main__":
    main()
