from __future__ import annotations

import threading
from datetime import datetime
from typing import Dict, List

from .trendos_client import TrendOSError


class TrendOSStatusBridge:
    """Turns existing human status transitions into local folder creation.

    Trigger semantics are deliberately read-only: a line entering one of the
    configured start statuses is observed from TrendOS and then materialized
    locally. No platform state is mutated by this bridge.
    """

    def __init__(self, config: dict, client, folders, state):
        self.config = config["trendos"]
        self.client = client
        self.folders = folders
        self.state = state
        self.poll_seconds = max(5, int(self.config.get("pollSeconds", 15)))
        self.screens = [str(v) for v in self.config.get("pollScreens", ["service", "print", "laser", "press"])]
        self.trigger_statuses = {str(v) for v in self.config.get("startStatuses", ["بدأ التنفيذ", "تحت التنفيذ"])}
        self._stop = threading.Event()
        self._thread = None
        self._sync_lock = threading.Lock()
        self._status_lock = threading.RLock()
        self._last_error = ""
        self._last_sync_at = ""
        self._last_trigger_count = 0
        self._accessible_screens = []

    def status(self) -> dict:
        with self._status_lock:
            return {
                "running": bool(self._thread and self._thread.is_alive()),\n                "syncing": self._sync_lock.locked(),
                "lastSyncAt": self._last_sync_at,
                "lastError": self._last_error,
                "lastTriggerCount": self._last_trigger_count,
                "accessibleScreens": list(self._accessible_screens),
                "triggerStatuses": sorted(self.trigger_statuses),
                "readOnly": True,
            }

    def start(self):
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._run, name="trendos-status-bridge", daemon=True)
        self._thread.start()

    def stop(self):
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=2)

    def _run(self):
        while not self._stop.wait(self.poll_seconds):
            if not self.client.connected:
                continue
            try:
                self.sync_once()
            except Exception:
                pass

    @staticmethod
    def _line_id(row: dict) -> str:
        return str(row.get("lineId") or row.get("line_id") or "").strip()

    @staticmethod
    def _order_id(row: dict) -> str:
        return str(row.get("orderId") or row.get("order_id") or "").strip()

    def _fetch_rows(self):
        by_line = {}
        accessible = []
        errors = []
        for screen in self.screens:
            try:
                body = self.client.get_rows(screen)
                accessible.append(screen)
                for row in body.get("rows") or []:
                    if not isinstance(row, dict):
                        continue
                    line_id = self._line_id(row)
                    if line_id:
                        by_line[line_id] = row
            except TrendOSError as exc:
                errors.append("%s:%s" % (screen, exc))
        if not accessible:
            raise TrendOSError("NO_ACCESSIBLE_EMPLOYEE_SCREENS:%s" % "|".join(errors))
        return list(by_line.values()), accessible

    def sync_once(self) -> dict:
        if not self.client.connected:
            raise TrendOSError("TRENDOS_LOGIN_REQUIRED")
        if not self._sync_lock.acquire(False):
            return {"ok": True, "skipped": "SYNC_ALREADY_RUNNING", "bridge": self.status()}
        try:
            rows, accessible = self._fetch_rows()
            prior = self.state.trendos_bridge_state()
            initialized = bool(prior.get("initialized"))
            old_statuses = {str(k): str(v) for k, v in (prior.get("lineStatuses") or {}).items()}
            current_statuses = {}
            triggered = []

            for row in rows:
                line_id = self._line_id(row)
                if not line_id:
                    continue
                status = str(row.get("status") or "").strip()
                current_statuses[line_id] = status
                previous = old_statuses.get(line_id)
                enters_active = status in self.trigger_statuses and previous not in self.trigger_statuses
                if initialized and enters_active:
                    triggered.append(row)

            grouped: Dict[str, List[dict]] = {}
            for row in triggered:
                order_id = self._order_id(row)
                if order_id:
                    grouped.setdefault(order_id, []).append(row)

            created = []
            for order_id, lines in grouped.items():
                first = lines[0]
                payload = {
                    "orderId": order_id,
                    "customerName": first.get("customer") or first.get("customerName") or "",
                    "claimedAt": datetime.now().astimezone().isoformat(),
                    "lines": lines,
                }
                result = self.folders.create_for_claimed_order(payload)
                created.append({"orderId": order_id, "lineIds": [self._line_id(v) for v in lines], "folder": result.get("folder")})
                self.state.audit("TRENDOS_HUMAN_START_OBSERVED", {
                    "orderId": order_id,
                    "lineIds": [self._line_id(v) for v in lines],
                    "statuses": [str(v.get("status") or "") for v in lines],
                    "platformMutation": False,
                })

            now = datetime.now().astimezone().isoformat()
            self.state.update_trendos_bridge(
                current_statuses,
                True,
                {"accessibleScreens": accessible, "lastTriggerCount": len(triggered)},
            )
            with self._status_lock:
                self._last_sync_at = now
                self._last_error = ""
                self._last_trigger_count = len(triggered)
                self._accessible_screens = accessible
            if not initialized:
                self.state.audit("TRENDOS_BRIDGE_BASELINE_CAPTURED", {
                    "lineCount": len(rows),
                    "triggered": 0,
                    "platformMutation": False,
                })
            return {
                "ok": True,
                "baselineOnly": not initialized,
                "rowsSeen": len(rows),
                "triggeredLines": len(triggered),
                "created": created,
                "bridge": self.status(),
            }
        except Exception as exc:
            with self._status_lock:
                self._last_error = str(exc)
            raise
        finally:
            self._sync_lock.release()
