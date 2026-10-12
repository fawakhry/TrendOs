"""AP-281: bounded local employee dashboard demo; owner opt-in execution ONLY.

Prepares fake orders under TemporaryDirectory and serves GET-only loopback UI.
Does NOT read local.json, call TrendOS cloud, use employee credentials, touch
printer/spool/Win7/EasyStore/customer files, install services or update Ubuntu.
Run only with separately approved owner command after reviewed code update.
"""
from __future__ import annotations

import base64
import http.client
import json
import sys
import tempfile
import threading
import time
from http.server import ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit

from offline_pilot import offline_config
from src.server import PrintServerApp, make_handler

DEMO_SECONDS = 75
# Unambiguously generated fixture: 1x1 transparent pixel, never customer art.
_FAKE_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7ZZiwAAAAASUVORK5CYII="
)
_ALLOWED_GET = frozenset((
    "/", "/api/status", "/api/orders", "/api/settings",
    "/api/employee/queue", "/api/order-files", "/api/preview",
))


class SyntheticEmployeeApp(PrintServerApp):
    def status(self):
        result = super().status()
        result.update({
            "mode": "SYNTHETIC_EMPLOYEE_DEMO_GET_ONLY",
            "demoMode": True,
            "demoModeMessage": "بيانات تدريب وهمية فقط — بدون كتابة أو اتصال بالمطبعة",
        })
        return result


def seed_synthetic_orders(app: SyntheticEmployeeApp, root: Path) -> None:
    """Create exactly two clearly synthetic orders in disposable temporary dirs."""
    fake_unrouted = {
        "orderId": "DEMO-281-001",
        "customerName": "عميل تجريبي - بدون ملفات",
        "claimedAt": "2026-10-12T09:00:00+03:00",
        "lines": [{"lineId": "FAKE-L1", "itemName": "تجربة فقط"}],
    }
    fake_routed = {
        "orderId": "DEMO-281-002",
        "customerName": "عميل تجريبي - قسم الليزر",
        "claimedAt": "2026-10-12T10:00:00+03:00",
        "lines": [{"lineId": "FAKE-L2", "itemName": "تجربة فقط"}],
    }
    first = app.folders.create_for_claimed_order(fake_unrouted)
    second = app.folders.create_for_claimed_order(fake_routed)
    app.folders.create_manual_folder("DEMO-281-002", "laser")
    proof = Path(second["folder"]) / "demo-sample.png"
    assert proof.is_relative_to(root)
    proof.write_bytes(_FAKE_PNG)
    assert Path(first["folder"]).is_relative_to(root)


def employee_demo_handler(app: SyntheticEmployeeApp):
    """Keep GET-only for all routes; use existing real handler for safe reads."""
    native = make_handler(app)

    class DemoHandler(native):
        def _blocked(self):
            self._json(403, {"ok": False, "error": "AP281_DEMO_GET_ONLY"})

        def do_GET(self):
            parsed = urlsplit(self.path)
            allowed = parsed.path in _ALLOWED_GET or parsed.path.startswith("/static/")
            if len(self.path) > 1024 or not allowed:
                return self._blocked()
            if parsed.path == "/api/order-files":
                # Only fake data; this endpoint enumerates generated temp files.
                if parsed.query not in ("orderId=DEMO-281-001", "orderId=DEMO-281-002"):
                    return self._blocked()
            if parsed.path == "/api/preview":
                # Only the single explicitly generated fake image can be previewed.
                from urllib.parse import parse_qs
                values = parse_qs(parsed.query).get("path", [])
                fake_root = Path(app.config["paths"]["ordersRoot"]).resolve()
                requested = Path(values[0]) if len(values) == 1 else None
                if requested is None or requested.name != "demo-sample.png":
                    return self._blocked()
                try:
                    if not requested.resolve().is_relative_to(fake_root):
                        return self._blocked()
                except (OSError, ValueError):
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

    return DemoHandler


def _check_demo(port: int) -> None:
    connection = http.client.HTTPConnection("127.0.0.1", port, timeout=3)
    try:
        connection.request("GET", "/api/status")
        reply = connection.getresponse()
        status = json.loads(reply.read(32768))
    finally:
        connection.close()
    if not (
        reply.status == 200 and status.get("demoMode") is True
        and status.get("localWriteAccess") == "LOCKED"
        and status.get("trendosReadAdapter") == "DISABLED"
        and status.get("trendos", {}).get("connected") is False
        and status.get("bridge", {}).get("running") is False
        and status.get("fastMode", {}).get("enabled") is False
        and status.get("platformBusinessWrites") is False
    ):
        raise RuntimeError("AP281_DEMO_ISOLATION_CHECK_FAILED")


def main(argv=None):
    if argv is None:
        argv = sys.argv[1:]
    if argv:
        raise SystemExit("AP281_UNSUPPORTED_ARGUMENTS")
    with tempfile.TemporaryDirectory(prefix="trendos-ap281-fake-employees-") as tmp:
        root = Path(tmp).resolve()
        cfg = offline_config(root)
        app = SyntheticEmployeeApp(
            cfg, Path(__file__).resolve().parent / "public",
            config_path=root / "NEVER_READ_OR_WRITE_PRODUCTION_CONFIG.json",
            write_token="",
        )
        seed_synthetic_orders(app, root)
        with ThreadingHTTPServer(("127.0.0.1", 0), employee_demo_handler(app)) as server:
            server.daemon_threads = True
            worker = threading.Thread(target=server.serve_forever,
                                      kwargs={"poll_interval": 0.05}, daemon=True)
            worker.start()
            try:
                port = server.server_port
                _check_demo(port)
                print(f"AP281_EMPLOYEE_DEMO_READY=http://127.0.0.1:{port}/; "
                      f"FAKE_ORDERS=2; CLOUD=OFF; WRITES=BLOCKED; "
                      f"AUTO_STOP_SECONDS={DEMO_SECONDS}", flush=True)
                try:
                    time.sleep(DEMO_SECONDS)
                except KeyboardInterrupt:
                    print("AP281_OWNER_STOP=REQUESTED", flush=True)
            finally:
                server.shutdown()
                worker.join(timeout=3)
                if worker.is_alive():
                    raise RuntimeError("AP281_HTTP_WORKER_DID_NOT_STOP")
    print("AP281_EMPLOYEE_DEMO_STOPPED=YES; TEMP_CLEANED=YES; "
          "PRINTING=OFF; CUSTOMER_DATA=OFF", flush=True)


if __name__ == "__main__":
    main()
