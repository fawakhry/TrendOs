from __future__ import annotations

import os
import queue
import sys
import threading
from pathlib import Path
from typing import Callable, Optional


class FastModeController:
    """Fast local workflow: prompt for work type, create folder, open Explorer.

    This controller is local-only. It never mutates TrendOS business state.
    """

    def __init__(
        self,
        config: dict,
        folders,
        state,
        opener: Optional[Callable[[str], object]] = None,
    ):
        self.config = config.get("fastMode") or {}
        self.folders = folders
        self.state = state
        self._opener = opener or self._default_open
        self._ui = WindowsFastPopup(self) if self.enabled else None
        self._last_error = ""
        self._prompt_count = 0
        self._open_count = 0
        self._lock = threading.RLock()

    @property
    def enabled(self) -> bool:
        return bool(self.config.get("enabled", True))

    @property
    def popup_enabled(self) -> bool:
        return bool(self.config.get("popup", True))

    @property
    def open_explorer_enabled(self) -> bool:
        return bool(self.config.get("openExplorer", True))

    def status(self) -> dict:
        with self._lock:
            return {
                "enabled": self.enabled,
                "popupEnabled": self.popup_enabled,
                "openExplorer": self.open_explorer_enabled,
                "uiRunning": bool(self._ui and self._ui.running),
                "lastError": self._last_error,
                "promptCount": self._prompt_count,
                "openedFolderCount": self._open_count,
                "dailyFlow": "TRENDOS_START -> ONE_WORK_TYPE_CLICK -> EXPLORER",
                "platformWrites": False,
            }

    def start(self, allow_popup: bool = True) -> None:
        if not self.enabled or not self.popup_enabled or not allow_popup or not self._ui:
            return
        try:
            self._ui.start()
        except Exception as exc:
            with self._lock:
                self._last_error = "FAST_POPUP_START_FAILED:%s" % str(exc)[:300]

    def stop(self) -> None:
        if self._ui:
            self._ui.stop()

    def notify_order(self, order: dict) -> dict:
        order_id = str(order.get("orderId") or "").strip()
        if not order_id:
            return {"ok": False, "error": "ORDER_ID_REQUIRED"}
        with self._lock:
            self._prompt_count += 1
        self.state.audit("FAST_MODE_ORDER_PROMPTED", {
            "orderId": order_id,
            "customerName": str(order.get("customerName") or ""),
            "platformMutation": False,
        })
        if self._ui and self.popup_enabled:
            self._ui.enqueue(order)
        return {"ok": True, "orderId": order_id, "queued": bool(self._ui and self.popup_enabled)}

    def choose_folder(self, order_id: str, folder_key: str, open_explorer: bool = True) -> dict:
        result = self.folders.create_manual_folder(order_id, folder_key)
        opened = False
        open_error = ""
        if open_explorer and self.open_explorer_enabled:
            try:
                self._opener(str(result["path"]))
                opened = True
                with self._lock:
                    self._open_count += 1
            except Exception as exc:
                open_error = str(exc)[:300]
                with self._lock:
                    self._last_error = "EXPLORER_OPEN_FAILED:%s" % open_error

        self.state.audit("FAST_MODE_WORK_FOLDER_SELECTED", {
            "orderId": str(order_id),
            "folderKey": str(folder_key),
            "path": str(result["path"]),
            "explorerOpened": opened,
            "platformMutation": False,
        })
        return {
            **result,
            "explorerOpened": opened,
            "explorerError": open_error,
        }

    def open_order_folder(self, order_id: str) -> dict:
        order = self.state.order(order_id)
        if not order:
            raise ValueError("ORDER_NOT_REGISTERED")
        path = str(Path(order["folder"]).resolve())
        self._opener(path)
        with self._lock:
            self._open_count += 1
        self.state.audit("FAST_MODE_ORDER_FOLDER_OPENED", {
            "orderId": str(order_id),
            "path": path,
            "platformMutation": False,
        })
        return {"ok": True, "orderId": str(order_id), "path": path, "explorerOpened": True}

    @staticmethod
    def _default_open(path: str):
        if os.name == "nt":
            os.startfile(path)  # type: ignore[attr-defined]
            return
        if sys.platform == "darwin":
            import subprocess
            subprocess.Popen(["open", path])
            return
        import subprocess
        subprocess.Popen(["xdg-open", path])


class WindowsFastPopup:
    """Small top-most Windows picker. Tk is imported only inside the UI thread."""

    def __init__(self, controller: FastModeController):
        self.controller = controller
        self._queue = queue.Queue()
        self._thread = None
        self._stop = threading.Event()
        self._running = threading.Event()
        self._root = None
        self._current = None
        self._seen_in_queue = set()

    @property
    def running(self) -> bool:
        return self._running.is_set()

    def start(self) -> None:
        if os.name != "nt":
            return
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(target=self._run, name="trendos-fast-popup", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._stop.set()
        root = self._root
        if root is not None:
            try:
                root.after(0, root.destroy)
            except Exception:
                pass
        if self._thread:
            self._thread.join(timeout=2)

    def enqueue(self, order: dict) -> None:
        order_id = str(order.get("orderId") or "").strip()
        if not order_id:
            return
        key = (
            order_id,
            tuple(sorted(str(v) for v in (order.get("lineIds") or []))),
            str(order.get("updatedAt") or ""),
        )
        if key in self._seen_in_queue:
            return
        self._seen_in_queue.add(key)
        self._queue.put(dict(order))

    def _run(self) -> None:
        try:
            import tkinter as tk
        except Exception as exc:
            with self.controller._lock:
                self.controller._last_error = "TK_IMPORT_FAILED:%s" % str(exc)[:300]
            return

        try:
            root = tk.Tk()
            self._root = root
            root.withdraw()
            self._running.set()
            root.after(200, self._poll)
            root.mainloop()
        except Exception as exc:
            with self.controller._lock:
                self.controller._last_error = "FAST_POPUP_RUNTIME_FAILED:%s" % str(exc)[:300]
        finally:
            self._running.clear()
            self._root = None

    def _poll(self) -> None:
        if self._stop.is_set() or self._root is None:
            return
        if self._current is None:
            try:
                order = self._queue.get_nowait()
            except queue.Empty:
                order = None
            if order:
                self._show_order(order)
        try:
            self._root.after(200, self._poll)
        except Exception:
            pass

    def _show_order(self, order: dict) -> None:
        import tkinter as tk

        root = self._root
        if root is None:
            return
        self._current = dict(order)
        root.deiconify()
        root.title("TrendOS — اختار نوع الشغل")
        root.attributes("-topmost", bool(self.controller.config.get("topMost", True)))
        root.resizable(False, False)
        root.geometry("560x315+40+80")
        root.configure(bg="#f4f7fb")

        for child in list(root.winfo_children()):
            child.destroy()

        customer = str(order.get("customerName") or "")
        order_id = str(order.get("orderId") or "")
        title = tk.Label(
            root,
            text="أوردر #%s — %s" % (order_id, customer),
            font=("Segoe UI", 16, "bold"),
            bg="#f4f7fb",
            fg="#10273e",
            anchor="e",
        )
        title.pack(fill="x", padx=18, pady=(16, 4))

        hint = tk.Label(
            root,
            text="اضغط نوع الشغل فقط — الفولدر هيتعمل ويتفتح فورًا",
            font=("Segoe UI", 10),
            bg="#f4f7fb",
            fg="#61778c",
            anchor="e",
        )
        hint.pack(fill="x", padx=18, pady=(0, 12))

        buttons = tk.Frame(root, bg="#f4f7fb")
        buttons.pack(fill="both", expand=True, padx=16)

        options = list(self.controller.folders.manual_options().items())
        for index, (key, name) in enumerate(options):
            btn = tk.Button(
                buttons,
                text=name,
                font=("Segoe UI", 12, "bold"),
                width=16,
                height=2,
                bg="#ffffff",
                fg="#173a59",
                activebackground="#e8f3ff",
                relief="groove",
                command=lambda k=key, n=name: self._choose(k, n),
            )
            btn.grid(row=index // 3, column=index % 3, padx=6, pady=6, sticky="nsew")
        for col in range(3):
            buttons.grid_columnconfigure(col, weight=1)

        self._message = tk.Label(
            root,
            text="",
            font=("Segoe UI", 9),
            bg="#f4f7fb",
            fg="#087a50",
            anchor="e",
        )
        self._message.pack(fill="x", padx=18, pady=(4, 4))

        footer = tk.Frame(root, bg="#f4f7fb")
        footer.pack(fill="x", padx=16, pady=(0, 14))
        tk.Button(
            footer,
            text="فتح فولدر الأوردر",
            font=("Segoe UI", 9),
            command=self._open_order,
        ).pack(side="right", padx=4)
        tk.Button(
            footer,
            text="تم",
            font=("Segoe UI", 9, "bold"),
            command=self._done,
        ).pack(side="left", padx=4)

        try:
            root.lift()
            root.focus_force()
        except Exception:
            pass

    def _choose(self, key: str, name: str) -> None:
        if not self._current:
            return
        try:
            result = self.controller.choose_folder(
                str(self._current.get("orderId") or ""),
                key,
                open_explorer=True,
            )
            suffix = " وتم فتحه" if result.get("explorerOpened") else ""
            self._message.configure(text="✓ %s%s" % (name, suffix), fg="#087a50")
        except Exception as exc:
            self._message.configure(text="تعذر التنفيذ: %s" % str(exc)[:160], fg="#b42318")

    def _open_order(self) -> None:
        if not self._current:
            return
        try:
            self.controller.open_order_folder(str(self._current.get("orderId") or ""))
            self._message.configure(text="✓ تم فتح فولدر الأوردر", fg="#087a50")
        except Exception as exc:
            self._message.configure(text="تعذر فتح الفولدر: %s" % str(exc)[:160], fg="#b42318")

    def _done(self) -> None:
        self._current = None
        if self._root is not None:
            self._root.withdraw()
