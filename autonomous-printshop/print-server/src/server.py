from __future__ import annotations

import argparse
import json
import mimetypes
import platform
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from .config import application_dir, load_config, resource_dir, resolve_config_path, save_path_override
from .folders import OrderFolderService
from .fast_mode import FastModeController
from .local_settings import LocalSettingsError, choose_windows_directory, validate_writable_directory
from .platform_bridge import TrendOSStatusBridge
from .preview import PreviewError, build_preview, capabilities
from .state import StateStore
from .trendos_client import TrendOSError, TrendOSReadClient
from .watcher import FinishedFolderWatcher


class PrintServerApp:
    def __init__(self, config: dict, public_dir: Path, config_path=None):
        self.config = config
        self.config_path = resolve_config_path(config_path)
        self.public_dir = public_dir
        self.state = StateStore(config["paths"]["stateRoot"])
        self.folders = OrderFolderService(config, self.state)
        self.trendos = TrendOSReadClient(config)
        self.fast_mode = FastModeController(config, self.folders, self.state)
        self.bridge = TrendOSStatusBridge(
            config,
            self.trendos,
            self.folders,
            self.state,
            on_order=self.fast_mode.notify_order,
        )
        self.watcher = FinishedFolderWatcher(
            config["paths"]["ordersRoot"],
            config["folder"]["finishedFolderName"],
            self.state,
        )

    def status(self) -> dict:
        return {
            "ok": True,
            "service": "TrendOS Print Server",
            "mode": "LOCAL_FAIL_CLOSED",
            "ordersRoot": self.config["paths"]["ordersRoot"],
            "readyRoot": self.config["paths"]["readyRoot"],
            "trendosReadAdapter": "ENABLED" if self.trendos.enabled else "DISABLED",
            "claimIntegration": self.config["trendos"].get("claimMode", "human_status_transition_read_bridge"),
            "trendos": self.trendos.status(),
            "bridge": self.bridge.status(),
            "preview": capabilities(),
            "designReadyWrites": False,
            "operatorTaskWrites": False,
            "employeeAssignmentWrites": False,
            "accountingWrites": False,
            "platformBusinessWrites": False,
            "serverPort": getattr(self, "server_port", None),
            "storage": {
                "ordersRoot": self.config["paths"]["ordersRoot"],
                "readyRoot": self.config["paths"]["readyRoot"],
                "configPath": str(self.config_path),
            },
            "folderMode": self.config["folder"].get("mode", "MANUAL_SELECTION"),
            "manualFolderOptions": [
                {"key": key, "name": name}
                for key, name in self.folders.manual_options().items()
            ],
            "fastMode": self.fast_mode.status(),
            "runtime": {
                "python": sys.version.split()[0],
                "platform": platform.platform(),
            },
        }

    def set_orders_root(self, raw_path: str) -> dict:
        selected = validate_writable_directory(raw_path)
        old = str(self.config["paths"]["ordersRoot"])
        new = str(selected)
        if old == new:
            return {
                "ok": True,
                "changed": False,
                "ordersRoot": new,
                "previousOrdersRoot": old,
                "existingOrdersMoved": False,
            }

        save_path_override("ordersRoot", new, self.config_path)
        self.config["paths"]["ordersRoot"] = new
        self.folders.orders_root = Path(new)
        self.folders.orders_root.mkdir(parents=True, exist_ok=True)
        self.watcher.set_root(new)
        self.state.audit("ORDERS_ROOT_CHANGED", {
            "previousOrdersRoot": old,
            "ordersRoot": new,
            "existingOrdersMoved": False,
        })
        return {
            "ok": True,
            "changed": True,
            "ordersRoot": new,
            "previousOrdersRoot": old,
            "existingOrdersMoved": False,
        }

    def choose_orders_root(self) -> dict:
        selected = choose_windows_directory(self.config["paths"]["ordersRoot"])
        if not selected:
            return {
                "ok": True,
                "cancelled": True,
                "ordersRoot": self.config["paths"]["ordersRoot"],
            }
        result = self.set_orders_root(selected)
        result["cancelled"] = False
        return result

    def order_files(self, order_id: str):
        order = self.state.order(order_id)
        if not order:
            return []
        root = Path(order["folder"]).resolve()
        rows = []
        finished = self.config["folder"]["finishedFolderName"].casefold()
        preview_exts = {x.lower() for group in (
            self.config["preview"]["imageExtensions"],
            self.config["preview"]["tiffExtensions"],
            self.config["preview"]["dxfExtensions"],
        ) for x in group}
        if not root.exists():
            return []
        for path in sorted(root.rglob("*"), key=lambda v: str(v).casefold()):
            if not path.is_file():
                continue
            rel = path.relative_to(root)
            rows.append({
                "name": path.name,
                "relativePath": str(rel),
                "fullPath": str(path.resolve()),
                "sizeBytes": path.stat().st_size,
                "modifiedAt": path.stat().st_mtime,
                "inX": finished in {part.casefold() for part in rel.parts},
                "previewable": path.suffix.lower() in preview_exts,
            })
        return rows


def make_handler(app: PrintServerApp):
    class Handler(BaseHTTPRequestHandler):
        server_version = "TrendOSPrintServer/0.2"

        def log_message(self, fmt, *args):
            sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

        def _json(self, status: int, payload: dict):
            data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def _body_json(self) -> dict:
            size = int(self.headers.get("Content-Length") or 0)
            if size <= 0 or size > 5_000_000:
                raise ValueError("INVALID_BODY_SIZE")
            raw = self.rfile.read(size)
            value = json.loads(raw.decode("utf-8"))
            if not isinstance(value, dict):
                raise ValueError("JSON_OBJECT_REQUIRED")
            return value

        def _static(self, name: str):
            path = (app.public_dir / name).resolve()
            try:
                path.relative_to(app.public_dir.resolve())
            except ValueError:
                self.send_error(404)
                return
            if not path.is_file():
                self.send_error(404)
                return
            data = path.read_bytes()
            mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
            self.send_response(200)
            suffix = "; charset=utf-8" if mime.startswith("text/") or mime == "application/javascript" else ""
            self.send_header("Content-Type", mime + suffix)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def do_GET(self):
            parsed = urlparse(self.path)
            if parsed.path == "/api/status":
                return self._json(200, app.status())
            if parsed.path == "/api/trendos/probe":
                try:
                    return self._json(200, {"ok": True, "probe": app.trendos.probe()})
                except TrendOSError as exc:
                    return self._json(502, {"ok": False, "error": str(exc)})
            if parsed.path == "/api/settings":
                return self._json(200, {
                    "ok": True,
                    "ordersRoot": app.config["paths"]["ordersRoot"],
                    "readyRoot": app.config["paths"]["readyRoot"],
                    "configPath": str(app.config_path),
                })
            if parsed.path == "/api/orders":
                return self._json(200, {"ok": True, "orders": app.state.orders()})
            if parsed.path == "/api/state":
                return self._json(200, {"ok": True, "state": app.state.snapshot()})
            if parsed.path == "/api/order-files":
                params = parse_qs(parsed.query)
                order_id = (params.get("orderId") or [""])[0]
                return self._json(200, {"ok": True, "files": app.order_files(order_id)})
            if parsed.path == "/api/preview":
                params = parse_qs(parsed.query)
                file_path = (params.get("path") or [""])[0]
                try:
                    data, mime, meta = build_preview(file_path, app.config)
                except PreviewError as exc:
                    return self._json(422, {"ok": False, "error": str(exc)})
                self.send_response(200)
                self.send_header("Content-Type", mime)
                self.send_header("X-TrendOS-Preview-Meta", json.dumps(meta, ensure_ascii=False))
                self.send_header("Content-Length", str(len(data)))
                self.send_header("Cache-Control", "no-store")
                self.end_headers()
                self.wfile.write(data)
                return
            if parsed.path == "/":
                return self._static("index.html")
            if parsed.path.startswith("/static/"):
                return self._static(parsed.path[len("/static/"):])
            self.send_error(404)

        def do_POST(self):
            parsed = urlparse(self.path)
            try:
                body = self._body_json()
                if parsed.path == "/api/trendos/login":
                    pending = app.trendos.begin_login(
                        body.get("username"),
                        body.get("password"),
                        on_success=app.bridge.sync_async,
                    )
                    return self._json(202, {"ok": True, "login": pending})
                if parsed.path == "/api/trendos/logout":
                    return self._json(200, {"ok": True, "session": app.trendos.logout()})
                if parsed.path == "/api/trendos/sync":
                    return self._json(202, app.bridge.sync_async())
                if parsed.path == "/api/settings/orders-root":
                    return self._json(200, app.set_orders_root(body.get("path")))
                if parsed.path == "/api/settings/orders-root/select":
                    return self._json(200, app.choose_orders_root())
                if parsed.path == "/api/orders/manual-folder":
                    result = app.fast_mode.choose_folder(
                        str(body.get("orderId") or ""),
                        str(body.get("folderKey") or ""),
                        open_explorer=bool(body.get("openExplorer", True)),
                    )
                    return self._json(201, {"ok": True, "result": result})
                if parsed.path == "/api/orders/open-folder":
                    result = app.fast_mode.open_order_folder(
                        str(body.get("orderId") or "")
                    )
                    return self._json(200, {"ok": True, "result": result})
                if parsed.path == "/api/events/order-claimed":
                    order = body.get("order") if isinstance(body.get("order"), dict) else body
                    result = app.folders.create_for_claimed_order(order)
                    app.fast_mode.notify_order(result)
                    return self._json(201, {"ok": True, "result": result})
                if parsed.path == "/api/events/structured-approval":
                    result = app.folders.publish_structured_approval(
                        str(body.get("orderId") or ""),
                        str(body.get("lineId") or ""),
                        str(body.get("sourceFile") or ""),
                        body.get("approval") or {},
                        str(body.get("routeKey") or "") or None,
                    )
                    return self._json(201, {"ok": True, "result": result})
                return self._json(404, {"ok": False, "error": "NOT_FOUND"})
            except (ValueError, json.JSONDecodeError, TrendOSError, LocalSettingsError) as exc:
                return self._json(422, {"ok": False, "error": str(exc)})
            except Exception as exc:
                app.state.audit("SERVER_ERROR", {"path": parsed.path, "error": str(exc)[:500]})
                return self._json(500, {"ok": False, "error": "INTERNAL_ERROR"})

        def do_OPTIONS(self):
            self.send_response(204)
            self.end_headers()

    return Handler


def _open_browser_later(url: str):
    timer = threading.Timer(0.8, lambda: webbrowser.open(url, new=1))
    timer.daemon = True
    timer.start()


def main(argv=None):
    parser = argparse.ArgumentParser(description="TrendOS Print Server")
    parser.add_argument("--config", default=None)
    parser.add_argument("--no-browser", action="store_true")
    parser.add_argument("--no-popup", action="store_true")
    args = parser.parse_args(argv)
    cfg = load_config(args.config)
    public_dir = resource_dir() / "public"
    app = PrintServerApp(cfg, public_dir, args.config)
    host = cfg["server"]["host"]
    preferred_port = int(cfg["server"]["port"])
    server = None
    port = preferred_port
    last_error = None
    for candidate in range(preferred_port, preferred_port + 5):
        try:
            server = ThreadingHTTPServer((host, candidate), make_handler(app))
            port = candidate
            break
        except OSError as exc:
            last_error = exc
    if server is None:
        raise RuntimeError("NO_LOCAL_PORT_AVAILABLE:%s" % last_error)
    app.server_port = port
    try:
        state_dir = application_dir() / "data" / "state"
        state_dir.mkdir(parents=True, exist_ok=True)
        (state_dir / "startup.log").open("a", encoding="utf-8").write(
            "SERVER_LISTENING http://127.0.0.1:%s\n" % port
        )
    except Exception:
        pass
    app.watcher.start()
    app.fast_mode.start(allow_popup=not args.no_popup)
    app.bridge.start()

    browser_host = "127.0.0.1" if host in {"0.0.0.0", "::"} else host
    url = "http://%s:%s" % (browser_host, port)
    print("TrendOS Print Server: %s" % url)
    if not args.no_browser:
        _open_browser_later(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        app.bridge.stop()
        app.fast_mode.stop()
        app.watcher.stop()
        server.server_close()


if __name__ == "__main__":
    main()
