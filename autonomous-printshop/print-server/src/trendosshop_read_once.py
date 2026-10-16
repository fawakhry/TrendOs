"""SERVER-34: one-shot, outbound-only, disabled-by-default Ubuntu reader.

This module is NEVER imported by print-server/run.py or the existing polling
bridge. Running this file alone does nothing. No filesystem/customer writes,
no printer/laser control, no credentials stored or displayed.
Network calls require BOTH explicit gates and a distinct service credential.
"""
from __future__ import annotations

import json
import re
import ssl
import urllib.error
import urllib.request
from urllib.parse import urlencode

_HOST = "trendos-d1-api.trendmall-contact.workers.dev"
_PATH = "/v1/printshop/service/orders/page"
_SCREENS = ("print", "laser")
_ALLOWED_KEYS = {"orderId", "lineId", "screen", "serviceCode", "status", "quantity"}
_MAX_RESPONSE_BYTES = 131072
_MAX_PAGE_SIZE = 20
_TIMEOUT_SECONDS = 5
_TOKEN_PATTERN = re.compile(r"^[A-Za-z0-9_-]{32,256}$")


class TrendosShopReadError(RuntimeError):
    """Constant non-sensitive diagnostic, without PII or credential values."""


class _RejectRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def _default_opener():
    return urllib.request.build_opener(
        urllib.request.ProxyHandler({}),  # pin direct TLS, ignore proxy env
        urllib.request.HTTPSHandler(context=ssl.create_default_context()),
        _RejectRedirect(),
    )


def _read_screen(opener, credential: str, screen: str) -> list[dict]:
    if screen not in _SCREENS:
        raise TrendosShopReadError("SERVER34_SCOPE_DENIED")
    query = urlencode({"screen": screen, "page": 1, "pageSize": _MAX_PAGE_SIZE})
    url = "https://" + _HOST + _PATH + "?" + query
    request = urllib.request.Request(
        url,
        method="GET",
        headers={"Accept": "application/json", "Authorization": "Bearer " + credential},
    )
    try:
        with opener.open(request, timeout=_TIMEOUT_SECONDS) as response:
            if response.status != 200:
                raise TrendosShopReadError("SERVER34_HTTP_DENIED")
            mime = str(response.headers.get("Content-Type", "")).split(";")[0].strip().lower()
            if mime != "application/json":
                raise TrendosShopReadError("SERVER34_CONTENT_TYPE_DENIED")
            raw = response.read(_MAX_RESPONSE_BYTES + 1)
    except TrendosShopReadError:
        raise
    except (urllib.error.URLError, OSError, ValueError):
        raise TrendosShopReadError("SERVER34_NETWORK_DENIED") from None

    if len(raw) > _MAX_RESPONSE_BYTES:
        raise TrendosShopReadError("SERVER34_RESPONSE_TOO_LARGE")
    try:
        payload = json.loads(raw)
    except (ValueError, UnicodeDecodeError):
        raise TrendosShopReadError("SERVER34_RESPONSE_INVALID") from None
    if type(payload) is not dict or payload.get("success") is not True or payload.get("screen") != screen:
        raise TrendosShopReadError("SERVER34_SCOPE_MISMATCH")
    if payload.get("mode") != "read-only" or payload.get("source") != "qualified-mirror-plus-t12-snapshot":
        raise TrendosShopReadError("SERVER34_UNTRUSTED_SOURCE")
    pagination = payload.get("pagination")
    if type(pagination) is not dict or pagination.get("page") != 1 or pagination.get("pageSize") != _MAX_PAGE_SIZE:
        raise TrendosShopReadError("SERVER34_UNTRUSTED_PAGE")
    rows = payload.get("rows")
    if type(rows) is not list or len(rows) > _MAX_PAGE_SIZE:
        raise TrendosShopReadError("SERVER34_PAGE_LIMIT")
    seen = set()
    for row in rows:
        if type(row) is not dict or set(row) != _ALLOWED_KEYS:
            raise TrendosShopReadError("SERVER34_PII_OR_FIELD_DENIED")
        if (
            row.get("screen") != screen or row.get("serviceCode") != screen
            or type(row.get("orderId")) is not str or not 0 < len(row["orderId"].strip()) <= 96
            or type(row.get("lineId")) is not str or not 0 < len(row["lineId"].strip()) <= 96
            or type(row.get("status")) is not str or not 0 < len(row["status"].strip()) <= 80
            or type(row.get("quantity")) not in (int, float)
            or not 0 < row["quantity"] <= 1000000
        ):
            raise TrendosShopReadError("SERVER34_ROW_SCOPE_DENIED")
        if row["lineId"] in seen:
            raise TrendosShopReadError("SERVER34_DUPLICATE_LINE")
        seen.add(row["lineId"])
    return rows


def read_trendosshop_once(
    credential: str, *, enabled: bool = False, owner_authorized: bool = False, opener=None
) -> dict:
    """One bounded GET for each approved screen; return counts, never rows.

    Callers must opt in explicitly. The app's main run.py never calls this.
    The owner must independently authorize the live credential and canary.
    """
    if enabled is not True or owner_authorized is not True:
        raise TrendosShopReadError("SERVER34_LIVE_READ_DISABLED")
    if type(credential) is not str or not _TOKEN_PATTERN.fullmatch(credential):
        raise TrendosShopReadError("SERVER34_INVALID_SERVICE_CREDENTIAL")
    client = opener if opener is not None else _default_opener()
    results = {}
    for screen in _SCREENS:
        results[screen] = _read_screen(client, credential, screen)
    seen_ids = {row["orderId"] for rows in results.values() for row in rows}
    return {
        "ok": True,
        "mode": "READ_ONLY_ONESHOT",
        "screens": list(_SCREENS),
        "byScreenCounts": {screen: len(results[screen]) for screen in _SCREENS},
        "distinctOrdersInFetchedPages": len(seen_ids),
        "hasMorePagesUnverified": True,
        "filesWritten": False,
        "businessWrites": False,
        "deviceExecution": False,
    }
