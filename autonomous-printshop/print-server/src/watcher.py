from __future__ import annotations

import threading
import time
from pathlib import Path


class FinishedFolderWatcher:
    """Polls local order folders and records new files that enter an `x` folder.

    This is deliberately an operational signal only. It never writes PRINTED status
    back to TrendOS and never grants Design/Material/Machine readiness.
    """

    def __init__(self, orders_root: str, finished_name: str, state_store, interval_seconds: float = 3.0):
        self.root = Path(orders_root)
        self.finished_name = finished_name.casefold()
        self.state = state_store
        self.interval = max(float(interval_seconds), 1.0)
        self._stop = threading.Event()
        self._thread = None
        self._seen = set()
        self._root_lock = threading.RLock()

    def _scan(self) -> set[str]:
        found = set()
        with self._root_lock:
            root = Path(self.root)
        if not root.exists():
            return found
        for path in root.rglob("*"):
            if not path.is_file():
                continue
            parts = {part.casefold() for part in path.parts}
            if self.finished_name in parts:
                found.add(str(path.resolve()))
        return found

    def set_root(self, orders_root: str) -> None:
        with self._root_lock:
            self.root = Path(orders_root)
            self._seen = self._scan()

    def start(self):
        if self._thread and self._thread.is_alive():
            return
        self._seen = self._scan()  # existing history is baseline, not a new print event
        self._thread = threading.Thread(target=self._run, name="trendos-x-watcher", daemon=True)
        self._thread.start()

    def stop(self):
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=2)

    def _run(self):
        while not self._stop.wait(self.interval):
            current = self._scan()
            for path in sorted(current - self._seen):
                self.state.audit("LOCAL_X_SIGNAL", {
                    "path": path,
                    "authoritativePrintedWrite": False,
                    "designReadyGranted": False,
                })
            self._seen = current
