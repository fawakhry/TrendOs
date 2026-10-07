from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request


class TrendOSError(Exception):
    pass


class TrendOSReadClient:
    """Read-only TrendOS orders adapter.

    It intentionally does not infer employee claim semantics. The local server receives
    a normalized ORDER_CLAIMED event from the TrendOS browser bridge. This adapter is
    retained for read-only lookup/enrichment once a native employee session token is
    supplied by the deployment environment.
    """

    def __init__(self, config: dict):
        self.config = config["trendos"]

    @property
    def enabled(self) -> bool:
        return bool(self.config.get("enabled"))

    def token(self) -> str:
        return os.environ.get(self.config.get("bearerTokenEnv", "TRENDOS_EDGE_TOKEN"), "").strip()

    def page(self, **params) -> dict:
        if not self.enabled:
            raise TrendOSError("TRENDOS_READ_ADAPTER_DISABLED")
        token = self.token()
        if not token:
            raise TrendOSError("TRENDOS_EDGE_TOKEN_MISSING")
        base = str(self.config["baseUrl"]).rstrip("/")
        path = str(self.config["ordersPagePath"])
        qs = urllib.parse.urlencode({k: v for k, v in params.items() if v is not None})
        url = base + path + ("?" + qs if qs else "")
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}", "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                body = json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, ValueError) as exc:
            raise TrendOSError(f"TRENDOS_READ_FAILED:{exc}") from exc
        if not isinstance(body, dict) or body.get("success") is False:
            raise TrendOSError("TRENDOS_READ_REJECTED")
        return body
