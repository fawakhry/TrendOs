"""SERVER-97 read-only Cloudflare Access -> exact Worker identity audit.

This is a configuration-only audit. No GET to a Worker, no Cloudflare mutations,
no service Client ID/Secret, no D1, customers, printers or laser. Only run from
the already approved GitHub Actions Access API audit credential. Fail closed.
"""
from __future__ import annotations

import json
import os
import re
import ssl
import urllib.error
import urllib.request

_STAGE_APP_ID = "28859297-b80f-47a7-98ed-78e00efc3204"
_STAGE_WORKER_NAME = "trendos-server68-isolated-stage"
_ACCOUNT_RE = re.compile(r"^[a-fA-F0-9]{32}$")
_PAGE_LIMIT = 5
_PAGE_SIZE = 100
_RESPONSE_LIMIT = 262144


class StageTargetAuditError(RuntimeError):
    """Only constant, non-sensitive error codes."""


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        return None


def _safe_opener():
    return urllib.request.build_opener(
        urllib.request.ProxyHandler({}),
        urllib.request.HTTPSHandler(context=ssl.create_default_context()),
        _NoRedirect(),
    )


def audit_stage_worker_binding(*, account_id: str, audit_token: str, opener=None) -> str:
    """Return only a bounded, non-sensitive status; never echo API body or IDs."""
    if (type(account_id) is not str or not _ACCOUNT_RE.fullmatch(account_id)
            or type(audit_token) is not str or not 16 <= len(audit_token) <= 4096
            or "\r" in audit_token or "\n" in audit_token):
        raise StageTargetAuditError("SERVER97_READONLY_AUDIT_CREDENTIAL_UNAVAILABLE")

    prefix = f"https://api.cloudflare.com/client/v4/accounts/{account_id}"
    app_path = f"/access/apps/{_STAGE_APP_ID}"
    workers_path = "/workers/workers"
    safe_urls = {prefix + app_path}
    safe_urls.update(prefix + workers_path + f"?page={page}&per_page={_PAGE_SIZE}"
                     for page in range(1, _PAGE_LIMIT + 1))
    transport = opener if opener is not None else _safe_opener()

    def get_json(url: str, *, source: str):
        if url not in safe_urls:
            raise StageTargetAuditError("SERVER97_URL_ALLOWLIST_DENIED")
        request = urllib.request.Request(
            url, method="GET",
            headers={"Authorization": "Bearer " + audit_token, "Accept": "application/json"},
        )
        try:
            with transport.open(request, timeout=12) as response:
                if response.status != 200:
                    raise StageTargetAuditError("SERVER97_CLOUDFLARE_GET_STATUS_DENIED")
                data = response.read(_RESPONSE_LIMIT + 1)
        except urllib.error.HTTPError as exc:
            status = exc.code
            exc.close()
            if status in (401, 403):
                raise StageTargetAuditError(
                    "SERVER97_WORKERS_METADATA_READ_SCOPE_UNAVAILABLE" if source == "workers"
                    else "SERVER97_ACCESS_APP_READ_SCOPE_UNAVAILABLE"
                ) from None
            raise StageTargetAuditError("SERVER97_CLOUDFLARE_GET_STATUS_DENIED") from None
        except (urllib.error.URLError, OSError, TimeoutError, ValueError):
            raise StageTargetAuditError("SERVER97_CLOUDFLARE_GET_TRANSPORT_DENIED") from None
        if len(data) > _RESPONSE_LIMIT:
            raise StageTargetAuditError("SERVER97_CLOUDFLARE_RESPONSE_TOO_LARGE")
        try:
            payload = json.loads(data)
        except (ValueError, UnicodeError, TypeError):
            raise StageTargetAuditError("SERVER97_CLOUDFLARE_JSON_INVALID") from None
        if type(payload) is not dict or payload.get("success") is not True:
            raise StageTargetAuditError("SERVER97_CLOUDFLARE_API_DENIED")
        return payload

    app = get_json(prefix + app_path, source="app").get("result")
    if (type(app) is not dict or app.get("id") != _STAGE_APP_ID
            or app.get("name") != "TrendOS isolated stage - DENY ALL - S87"
            or app.get("type") != "self_hosted"):
        raise StageTargetAuditError("SERVER97_STAGE_APP_IDENTITY_MISMATCH")
    destinations = app.get("destinations")
    if type(destinations) is not list or len(destinations) != 1:
        raise StageTargetAuditError("SERVER97_STAGE_DESTINATION_AMBIGUOUS")
    dest = destinations[0]
    if (type(dest) is not dict or dest.get("type") != "worker"
            or type(dest.get("worker_id")) is not str or not dest["worker_id"]
            or dest.get("overrides")):
        raise StageTargetAuditError("SERVER97_WORKER_DESTINATION_UNSAFE")
    app_worker_id = dest["worker_id"]

    # Use Workers *immutable* ID, not script name or workers.dev hostname.
    # The list endpoint requires a separate Workers Metadata Read Only scope.
    for page in range(1, _PAGE_LIMIT + 1):
        payload = get_json(prefix + workers_path + f"?page={page}&per_page={_PAGE_SIZE}",
                           source="workers")
        items = payload.get("result")
        if type(items) is not list:
            raise StageTargetAuditError("SERVER97_WORKERS_LIST_INVALID")
        matched = [w for w in items if type(w) is dict and w.get("name") == _STAGE_WORKER_NAME]
        if len(matched) > 1:
            raise StageTargetAuditError("SERVER97_WORKER_NAME_DUPLICATE")
        if matched:
            worker_id = matched[0].get("id")
            if type(worker_id) is not str or not worker_id:
                raise StageTargetAuditError("SERVER97_WORKER_ID_MISSING")
            if worker_id != app_worker_id:
                raise StageTargetAuditError("SERVER97_ACCESS_BOUND_TO_DIFFERENT_WORKER")
            return "SERVER97_ACCESS_WORKER_ID_EXACT_MATCH"
        info = payload.get("result_info")
        if type(info) is dict and type(info.get("total_pages")) is int:
            total_pages = info["total_pages"]
            if total_pages < page or total_pages > 10000:
                raise StageTargetAuditError("SERVER97_WORKERS_PAGINATION_INVALID")
            if page >= total_pages:
                raise StageTargetAuditError("SERVER97_STAGE_WORKER_NOT_FOUND")
        elif len(items) < _PAGE_SIZE:
            raise StageTargetAuditError("SERVER97_STAGE_WORKER_NOT_FOUND")
    raise StageTargetAuditError("SERVER97_WORKERS_PAGINATION_BOUNDED_UNVERIFIED")


if __name__ == "__main__":
    try:
        result = audit_stage_worker_binding(
            account_id=os.environ.get("CLOUDFLARE_ACCOUNT_ID", ""),
            audit_token=os.environ.get("CLOUDFLARE_ACCESS_API_TOKEN", ""),
        )
        print(result)
        print("SERVER97_REAL_ACCESS_AUTHENTICATION=NOT_TESTED")
        print("SERVER97_CLOUDFLARE_MUTATION=NO; ORDERS=NO; DEVICES=NO")
    except StageTargetAuditError as error:
        print(str(error))
        print("SERVER97_ACCESS_WORKER_ID_BINDING=UNVERIFIED")
        raise SystemExit(2) from None
