from __future__ import annotations

import json
import threading
import urllib.error
import urllib.request


class TrendOSError(Exception):
    pass


class TrendOSReadClient:
    """Read-only employee-session client for the local Print Server.

    The client authenticates with TrendOS native employee auth, keeps the session
    token only in memory, and reads employee-core rows. It never calls employee
    business-write actions.
    """

    def __init__(self, config: dict):
        self.config = config["trendos"]
        self._lock = threading.RLock()
        self._username = ""
        self._token = ""
        self._user = {}
        self._expires_at = ""

    @property
    def enabled(self) -> bool:
        return bool(self.config.get("enabled", True))

    @property
    def connected(self) -> bool:
        with self._lock:
            return bool(self._username and self._token)

    def status(self) -> dict:
        with self._lock:
            return {
                "enabled": self.enabled,
                "connected": bool(self._username and self._token),
                "username": self._username,
                "user": dict(self._user),
                "expiresAt": self._expires_at,
                "passwordStored": False,
                "writeAuthority": False,
            }

    def _post(self, path: str, payload: dict, timeout: int = 12) -> dict:
        if not self.enabled:
            raise TrendOSError("TRENDOS_READ_ADAPTER_DISABLED")
        base = str(self.config.get("baseUrl") or "").rstrip("/")
        if not base:
            raise TrendOSError("TRENDOS_BASE_URL_MISSING")
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(
            base + path,
            data=data,
            method="POST",
            headers={\n                "Accept": "application/json",\n                "Content-Type": "application/json; charset=utf-8",\n                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 TrendOS-Print-Server/0.2",\n            },
        )
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                raw = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            raw = ""
            try:
                raw = exc.read().decode("utf-8")
            except Exception:
                pass
            try:
                body = json.loads(raw or "{}")
                message = body.get("message") or body.get("code") or ("HTTP_%s" % exc.code)
            except Exception:
                message = "HTTP_%s" % exc.code
            raise TrendOSError("TRENDOS_REJECTED:%s" % message) from exc
        except urllib.error.URLError as exc:
            raise TrendOSError("TRENDOS_UNREACHABLE:%s" % exc) from exc
        try:
            body = json.loads(raw or "{}")
        except ValueError as exc:
            raise TrendOSError("TRENDOS_INVALID_JSON") from exc
        if not isinstance(body, dict) or body.get("success") is False:
            raise TrendOSError("TRENDOS_REJECTED:%s" % str(body.get("message") or body.get("code") or "UNKNOWN"))
        return body

    def login(self, username: str, password: str) -> dict:
        username = str(username or "").strip()
        password = str(password or "")
        if not username or not password:
            raise TrendOSError("USERNAME_AND_PASSWORD_REQUIRED")
        body = self._post(
            str(self.config.get("authLoginPath") or "/v1/employee/auth/login"),
            {"username": username, "password": password},
        )
        user = body.get("user") if isinstance(body.get("user"), dict) else {}
        token = str(user.get("token") or body.get("token") or "").strip()
        canonical = str(user.get("username") or username).strip()
        if not token:
            raise TrendOSError("TRENDOS_LOGIN_TOKEN_MISSING")
        safe_user = dict(user)
        safe_user.pop("token", None)
        with self._lock:
            self._username = canonical
            self._token = token
            self._user = safe_user
            self._expires_at = str(body.get("expiresAt") or "")
        return self.status()

    def logout(self) -> dict:
        with self._lock:
            username, token = self._username, self._token
        if username and token:
            try:
                self._post(
                    str(self.config.get("authLogoutPath") or "/v1/employee/auth/logout"),
                    {"username": username, "token": token},
                )
            except Exception:
                pass
        with self._lock:
            self._username = ""
            self._token = ""
            self._user = {}
            self._expires_at = ""
        return self.status()

    def get_rows(self, screen: str) -> dict:
        with self._lock:
            username, token = self._username, self._token
        if not username or not token:
            raise TrendOSError("TRENDOS_LOGIN_REQUIRED")
        return self._post(
            str(self.config.get("employeeCorePath") or "/v1/employee/core"),
            {
                "action": "getRows",
                "screen": str(screen or "service"),
                "username": username,
                "token": token,
            },
        )
