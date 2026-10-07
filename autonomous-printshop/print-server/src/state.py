from __future__ import annotations

import json
import os
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional


class StateStore:
    def __init__(self, state_root: str):
        self.root = Path(state_root)
        self.root.mkdir(parents=True, exist_ok=True)
        self.state_path = self.root / "state.json"
        self.audit_path = self.root / "audit.jsonl"
        self._lock = threading.RLock()
        self._state = self._load()

    @staticmethod
    def now_iso() -> str:
        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    def _load(self) -> dict:
        if not self.state_path.exists():
            return {"orders": {}, "files": {}, "lastEventAt": None}
        try:
            value = json.loads(self.state_path.read_text(encoding="utf-8"))
            return value if isinstance(value, dict) else {"orders": {}, "files": {}, "lastEventAt": None}
        except Exception:
            return {"orders": {}, "files": {}, "lastEventAt": None}

    def _persist(self) -> None:
        temp = self.state_path.with_suffix(".tmp")
        temp.write_text(json.dumps(self._state, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(temp, self.state_path)

    def audit(self, event: str, payload: dict) -> None:
        record = {"at": self.now_iso(), "event": event, **payload}
        with self._lock:
            with self.audit_path.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps(record, ensure_ascii=False) + "\n")
            self._state["lastEventAt"] = record["at"]
            self._persist()

    def upsert_order(self, order_id: str, data: dict) -> None:
        with self._lock:
            self._state.setdefault("orders", {})[str(order_id)] = data
            self._state["lastEventAt"] = self.now_iso()
            self._persist()

    def order(self, order_id: str) -> Optional[dict]:
        with self._lock:
            value = self._state.get("orders", {}).get(str(order_id))
            return json.loads(json.dumps(value)) if value else None

    def orders(self) -> List[dict]:
        with self._lock:
            return json.loads(json.dumps(list(self._state.get("orders", {}).values())))

    def trendos_bridge_state(self) -> dict:
        with self._lock:
            value = self._state.get("trendosBridge") or {}
            return json.loads(json.dumps(value))

    def update_trendos_bridge(self, statuses: dict, initialized: bool, meta: Optional[dict] = None) -> None:
        with self._lock:
            current = self._state.setdefault("trendosBridge", {})
            current["initialized"] = bool(initialized)
            current["lineStatuses"] = {str(k): str(v) for k, v in (statuses or {}).items()}
            current["lastSyncAt"] = self.now_iso()
            if meta:
                current.update(meta)
            self._state["lastEventAt"] = current["lastSyncAt"]
            self._persist()

    def snapshot(self) -> dict:
        with self._lock:
            return json.loads(json.dumps(self._state))
