from __future__ import annotations

import hashlib
import re
import shutil
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple, Union

_WINDOWS_RESERVED = {
    "CON", "PRN", "AUX", "NUL",
    *(f"COM{i}" for i in range(1, 10)),
    *(f"LPT{i}" for i in range(1, 10)),
}


def safe_name(value, fallback="-") -> str:
    text = str(value or "").strip()
    text = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "-", text)
    text = re.sub(r"\s+", " ", text).strip(" .")
    if not text:
        text = fallback
    if text.upper() in _WINDOWS_RESERVED:
        text = f"_{text}"
    return text[:120]


def _order_date(order: dict) -> datetime:
    raw = order.get("claimedAt") or order.get("createdAt") or order.get("date")
    if isinstance(raw, datetime):
        return raw
    if raw:
        text = str(raw).replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(text)
        except ValueError:
            pass
    return datetime.now()


def file_sha256(path: Union[str, Path]) -> str:
    h = hashlib.sha256()
    with Path(path).open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


class OrderFolderService:
    def __init__(self, config: dict, state_store=None):
        self.config = config
        self.orders_root = Path(config["paths"]["ordersRoot"])
        self.ready_root = Path(config["paths"]["readyRoot"])
        self.finished_name = config["folder"]["finishedFolderName"]
        self.state = state_store
        self.orders_root.mkdir(parents=True, exist_ok=True)
        self.ready_root.mkdir(parents=True, exist_ok=True)

    def manual_options(self) -> dict:
        return {
            str(key): str(value)
            for key, value in (self.config["folder"].get("manualOptions") or {}).items()
        }

    def order_folder_name(self, order: dict) -> str:
        order_id = safe_name(order.get("orderId") or order.get("order_id"), "ORDER")
        customer = safe_name(order.get("customerName") or order.get("customer_name"), "عميل")
        date = _order_date(order).strftime(self.config["folder"]["dateFormat"])
        return safe_name(
            self.config["folder"]["namePattern"].format(
                order_id=order_id, date=date, customer_name=customer
            )
        )

    def create_for_claimed_order(self, order: dict) -> dict:
        """Create only the order root.

        Work folders are intentionally NOT inferred from product data. The
        operator chooses one or more work folders explicitly from the local UI.
        """
        order_id = str(order.get("orderId") or order.get("order_id") or "").strip()
        if not order_id:
            raise ValueError("ORDER_ID_REQUIRED")
        lines = order.get("lines") or []
        if not isinstance(lines, list) or not lines:
            raise ValueError("ORDER_LINES_REQUIRED")

        existing = self.state.order(order_id) if self.state else None
        if existing and existing.get("folder"):
            root = Path(existing["folder"])
        else:
            root = self.orders_root / self.order_folder_name(order)
        root.mkdir(parents=True, exist_ok=True)

        routes = {}
        for key, route in ((existing or {}).get("routes") or {}).items():
            routes[str(key)] = {
                "path": str(route.get("path") or ""),
                "lines": [str(v) for v in (route.get("lines") or [])],
                "manual": bool(route.get("manual")),
                "displayName": str(route.get("displayName") or ""),
            }

        line_ids = {
            str(v)
            for v in ((existing or {}).get("lineIds") or [])
            if str(v).strip()
        }
        incoming_ids = {
            str(line.get("lineId") or line.get("line_id") or "").strip()
            for line in lines
        }
        incoming_ids.discard("")
        line_ids.update(incoming_ids)

        now = datetime.now().astimezone().isoformat()
        payload = {
            "orderId": order_id,
            "customerName": (
                order.get("customerName")
                or order.get("customer_name")
                or (existing or {}).get("customerName")
                or ""
            ),
            "folder": str(root),
            "routes": routes,
            "unclassified": [],
            "lineIds": sorted(line_ids),
            "folderMode": "MANUAL_SELECTION",
            "createdAt": (existing or {}).get("createdAt") or now,
            "updatedAt": now,
        }
        if self.state:
            self.state.upsert_order(order_id, payload)
            self.state.audit("ORDER_FOLDER_ENSURED", {
                "orderId": order_id,
                "routeKeys": sorted(routes.keys()),
                "incomingLineIds": sorted(incoming_ids),
                "folderMode": "MANUAL_SELECTION",
                "automaticClassification": False,
            })
        return payload

    def create_manual_folder(self, order_id: str, folder_key: str) -> dict:
        if not self.state:
            raise RuntimeError("STATE_STORE_REQUIRED")
        order_id = str(order_id or "").strip()
        folder_key = str(folder_key or "").strip()
        if not order_id:
            raise ValueError("ORDER_ID_REQUIRED")

        options = self.manual_options()
        if folder_key not in options:
            raise ValueError("UNKNOWN_MANUAL_FOLDER")

        order_state = self.state.order(order_id)
        if not order_state:
            raise ValueError("ORDER_NOT_REGISTERED")

        root = Path(order_state["folder"]).resolve()
        root.mkdir(parents=True, exist_ok=True)
        display_name = safe_name(options[folder_key])
        target = root / display_name
        target.mkdir(parents=True, exist_ok=True)
        (target / self.finished_name).mkdir(exist_ok=True)

        routes = dict(order_state.get("routes") or {})
        existed = folder_key in routes and Path(str(routes[folder_key].get("path") or "")).exists()
        routes[folder_key] = {
            "path": str(target),
            "lines": list(routes.get(folder_key, {}).get("lines") or []),
            "manual": True,
            "displayName": display_name,
        }
        order_state["routes"] = routes
        order_state["unclassified"] = []
        order_state["folderMode"] = "MANUAL_SELECTION"
        order_state["updatedAt"] = datetime.now().astimezone().isoformat()
        self.state.upsert_order(order_id, order_state)
        self.state.audit("LOCAL_MANUAL_WORK_FOLDER_ENSURED", {
            "orderId": order_id,
            "folderKey": folder_key,
            "displayName": display_name,
            "path": str(target),
            "alreadyExisted": bool(existed),
            "automaticClassification": False,
        })
        return {
            "orderId": order_id,
            "folderKey": folder_key,
            "displayName": display_name,
            "path": str(target),
            "alreadyExisted": bool(existed),
            "order": order_state,
        }

    def _route_for_line(self, order_state: dict, line_id: str) -> Optional[Tuple[str, Path]]:
        for route_key, route in order_state.get("routes", {}).items():
            if str(line_id) in {str(v) for v in route.get("lines", [])}:
                return route_key, Path(route["path"])
        return None

    def _ready_parts(self, route_key: str) -> list:
        options = self.manual_options()
        if route_key in options:
            return [options[route_key]]
        legacy = self.config.get("classification", {}).get("routes", {}).get(route_key)
        if legacy:
            return list(legacy)
        raise ValueError("ROUTE_NOT_CONFIGURED")

    def publish_structured_approval(
        self,
        order_id: str,
        line_id: str,
        source_file: str,
        approval: dict,
        route_key: Optional[str] = None,
    ) -> dict:
        if not self.state:
            raise RuntimeError("STATE_STORE_REQUIRED")
        order_state = self.state.order(order_id)
        if not order_state:
            raise ValueError("ORDER_NOT_REGISTERED")

        selected_route_key = str(route_key or "").strip()
        route_info = None
        if selected_route_key:
            route = (order_state.get("routes") or {}).get(selected_route_key)
            if not route:
                raise ValueError("ROUTE_NOT_REGISTERED")
            route_info = (selected_route_key, Path(route["path"]))
        else:
            route_info = self._route_for_line(order_state, line_id)
        if not route_info:
            raise ValueError("LINE_ROUTE_NOT_REGISTERED")

        decision = str(approval.get("decision") or "").strip().upper()
        source_kind = str(approval.get("sourceKind") or "").strip().upper()
        allowed = {str(x).upper() for x in self.config["approval"]["allowedStructuredSources"]}
        if decision != "APPROVE" or source_kind not in allowed:
            raise ValueError("QUALIFIED_STRUCTURED_APPROVAL_REQUIRED")

        src = Path(source_file).resolve()
        order_root = Path(order_state["folder"]).resolve()
        try:
            src.relative_to(order_root)
        except ValueError as exc:
            raise ValueError("SOURCE_FILE_OUTSIDE_ORDER_FOLDER") from exc
        if not src.is_file():
            raise ValueError("SOURCE_FILE_MISSING")
        current_hash = file_sha256(src)
        subject_hash = str(approval.get("subjectSha256") or "").strip().lower()
        if subject_hash != current_hash:
            raise ValueError("APPROVAL_HASH_MISMATCH")

        selected_route_key, _route_path = route_info
        ready_dir = self.ready_root.joinpath(*self._ready_parts(selected_route_key))
        ready_dir.mkdir(parents=True, exist_ok=True)
        customer = safe_name(order_state.get("customerName"), "عميل")
        dest_name = safe_name(f"{order_id} - {customer} - {src.name}")
        dest = ready_dir / dest_name
        if dest.exists() and file_sha256(dest) != current_hash:
            stem, suffix = dest.stem, dest.suffix
            dest = ready_dir / f"{stem} - {current_hash[:8]}{suffix}"
        shutil.copy2(src, dest)
        self.state.audit("LOCAL_READY_QUEUE_COPY", {
            "orderId": str(order_id),
            "lineId": str(line_id),
            "routeKey": selected_route_key,
            "sourceKind": source_kind,
            "sha256": current_hash,
            "destination": str(dest),
            "designReadyGranted": False,
        })
        return {
            "orderId": str(order_id),
            "lineId": str(line_id),
            "routeKey": selected_route_key,
            "sha256": current_hash,
            "readyFile": str(dest),
            "designReadyGranted": False,
            "note": "Operational ready-queue copy only; does not grant Design READY.",
        }
