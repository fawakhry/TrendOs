from __future__ import annotations

import threading
from datetime import datetime, timezone
from typing import Callable, Optional

import requests


class TrendOSError(Exception):
    pass


class TrendOSReadClient:
    """Read-only TrendOS employee client isolated from the local UI thread."""

    USER_AGENT = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 TrendOS-Print-Server/0.3"
    )

    def __init__(self, config: dict):
        self.config = config["trendos"]
        self._lock = threading.RLock()
        self._username = ""
        self._token = ""
        self._user = {}
        self._expires_at = ""
        self._login_state = "IDLE"
        self._last_error = ""
        self._last_attempt_at = ""
        self._login_generation = 0
        self._login_thread = None

    @staticmethod
    def _now_iso() -> str:
        return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

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
                "loginState": self._login_state,
                "lastError": self._last_error,
                "lastAttemptAt": self._last_attempt_at,
                "transport": "requests-certifi",
            }

    def _headers(self) -> dict:
        return {
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": self.USER_AGENT,
        }

    @staticmethod
    def _response_message(response, body) -> str:
        if isinstance(body, dict):
            return str(
                body.get("message")
                or body.get("detail")
                or body.get("title")
                or body.get("code")
                or ("HTTP_%s" % response.status_code)
            )
        return "HTTP_%s" % response.status_code

    def _request(self, method: str, path: str, payload=None, timeout_seconds: int = 10) -> dict:
        if not self.enabled:
            raise TrendOSError("TRENDOS_READ_ADAPTER_DISABLED")
        base = str(self.config.get("baseUrl") or "").rstrip("/")
        if not base:
            raise TrendOSError("TRENDOS_BASE_URL_MISSING")

        try:
            response = requests.request(
                method,
                base + path,
                json=payload,
                headers=self._headers(),
                timeout=(5, max(5, int(timeout_seconds))),
            )
        except requests.exceptions.SSLError as exc:
            raise TrendOSError("TRENDOS_TLS_ERROR:%s" % str(exc)[:240]) from exc
        except requests.exceptions.Timeout as exc:
            raise TrendOSError("TRENDOS_NETWORK_TIMEOUT") from exc
        except requests.exceptions.ConnectionError as exc:
            raise TrendOSError("TRENDOS_UNREACHABLE:%s" % str(exc)[:240]) from exc
        except requests.exceptions.RequestException as exc:
            raise TrendOSError("TRENDOS_NETWORK_ERROR:%s" % str(exc)[:240]) from exc

        try:
            body = response.json()
        except ValueError:
            body = None

        if response.status_code >= 400:
            raise TrendOSError("TRENDOS_REJECTED:%s" % self._response_message(response, body))
        if not isinstance(body, dict):
            raise TrendOSError("TRENDOS_INVALID_JSON")
        if body.get("success") is False:
            raise TrendOSError("TRENDOS_REJECTED:%s" % self._response_message(response, body))
        return body

    def probe(self) -> dict:
        body = self._request(
            "GET",
            str(self.config.get("authHealthPath") or "/v1/employee/auth/health"),
            None,
            timeout_seconds=8,
        )
        return {
            "ok": True,
            "mode": body.get("mode"),
            "schemaReady": body.get("schemaReady"),
            "nativeReadyCount": body.get("nativeReadyCount"),
            "userCount": body.get("userCount"),
            "transport": "requests-certifi",
        }

    def _perform_login(self, username: str, password: str) -> dict:
        username = str(username or "").strip()
        password = str(password or "")
        if not username or not password:
            raise TrendOSError("USERNAME_AND_PASSWORD_REQUIRED")
        body = self._request(
            "POST",
            str(self.config.get("authLoginPath") or "/v1/employee/auth/login"),
            {"username": username, "password": password},
            timeout_seconds=12,
        )
        user = body.get("user") if isinstance(body.get("user"), dict) else {}
        token = str(user.get("token") or body.get("token") or "").strip()
        canonical = str(user.get("username") or username).strip()
        if not token:
            raise TrendOSError("TRENDOS_LOGIN_TOKEN_MISSING")
        safe_user = dict(user)
        safe_user.pop("token", None)
        return {
            "username": canonical,
            "token": token,
            "user": safe_user,
            "expiresAt": str(body.get("expiresAt") or ""),
        }

    def _apply_login_result(self, result: dict) -> None:
        self._username = str(result.get("username") or "")
        self._token = str(result.get("token") or "")
        self._user = dict(result.get("user") or {})
        self._expires_at = str(result.get("expiresAt") or "")
        self._login_state = "CONNECTED"
        self._last_error = ""

    def login(self, username: str, password: str) -> dict:
        result = self._perform_login(username, password)
        with self._lock:
            self._last_attempt_at = self._now_iso()
            self._apply_login_result(result)
        return self.status()

    def begin_login(
        self,
        username: str,
        password: str,
        on_success: Optional[Callable[[], object]] = None,
    ) -> dict:
        username = str(username or "").strip()
        password = str(password or "")
        if not username or not password:
            raise TrendOSError("USERNAME_AND_PASSWORD_REQUIRED")

        with self._lock:
            if self._login_state == "PENDING" and self._login_thread and self._login_thread.is_alive():
                return {"ok": True, "accepted": False, "reason": "LOGIN_ALREADY_PENDING"}
            self._login_generation += 1
            generation = self._login_generation
            self._login_state = "PENDING"
            self._last_error = ""
            self._last_attempt_at = self._now_iso()

        def worker():
            secret = password
            try:
                result = self._perform_login(username, secret)
            except Exception as exc:
                with self._lock:
                    if generation == self._login_generation:
                        self._username = ""
                        self._token = ""
                        self._user = {}
                        self._expires_at = ""
                        self._login_state = "FAILED"
                        self._last_error = str(exc)[:500]
                return
            finally:
                secret = ""

            accepted = False
            with self._lock:
                if generation == self._login_generation:
                    self._apply_login_result(result)
                    accepted = True
            if accepted and on_success:
                try:
                    on_success()
                except Exception:
                    pass

        thread = threading.Thread(target=worker, name="trendos-login", daemon=True)
        with self._lock:
            self._login_thread = thread
        thread.start()
        return {"ok": True, "accepted": True, "loginState": "PENDING"}

    def logout(self) -> dict:
        with self._lock:
            self._login_generation += 1
            username, token = self._username, self._token
            self._username = ""
            self._token = ""
            self._user = {}
            self._expires_at = ""
            self._login_state = "IDLE"
            self._last_error = ""
        if username and token:
            try:
                self._request(
                    "POST",
                    str(self.config.get("authLogoutPath") or "/v1/employee/auth/logout"),
                    {"username": username, "token": token},
                    timeout_seconds=8,
                )
            except Exception:
                pass
        return self.status()

    def get_rows(self, screen: str) -> dict:
        with self._lock:
            username, token = self._username, self._token
        if not username or not token:
            raise TrendOSError("TRENDOS_LOGIN_REQUIRED")
        return self._request(
            "POST",
            str(self.config.get("employeeCorePath") or "/v1/employee/core"),
            {
                "action": "getRows",
                "screen": str(screen or "service"),
                "username": username,
                "token": token,
            },
            timeout_seconds=10,
        )
