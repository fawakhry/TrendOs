"""SERVER-95: isolated-stage-only Cloudflare Access connectivity probe.

NEVER imported by run.py or the legacy production-pinned order reader.
Only one HTTPS GET /; no order/customer query, D1 write, device command or files.
Stage workers.dev and preview URLs are currently OFF: do not invoke live until
a distinct stage route is independently qualified and expressly owner-approved.
Cloudflare Access credentials authenticate the edge, NOT the order-reader API.
"""
from __future__ import annotations

import re
import ssl
import urllib.error
import urllib.request

# Exact-stage host reference only, NOT evidence that this route is published.
# No caller may change this to trendos-d1-api / any other host.
_STAGE_ORIGIN = "https://trendos-server68-isolated-stage.trendmall-contact.workers.dev"
_ID = re.compile(r"^[A-Za-z0-9._@-]{16,256}$", re.ASCII)
_SECRET = re.compile(r"^[A-Za-z0-9._~+/=-]{16,512}$", re.ASCII)
_TIMEOUT = 5


class StageProbeDenied(RuntimeError):
    """Always constant diagnostic; never includes a secret or user-provided URL."""


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def _direct_tls_opener():
    return urllib.request.build_opener(
        urllib.request.ProxyHandler({}),
        urllib.request.HTTPSHandler(context=ssl.create_default_context()),
        _NoRedirect(),
    )


def probe_stage_access_once(
    *, stage_origin: str, client_id: str, client_secret: str,
    enabled: bool = False, owner_authorized: bool = False,
    route_qualified: bool = False, opener=None,
) -> dict:
    """Bounded transport-only one-shot; no data returned, never checks orders.

    All 3 flags must be literal booleans True. 'route_qualified' must only be
    supplied after independent live Cloudflare stage routing evidence; current
    Cloudflare production/preview URL switches remain OFF.
    """
    if enabled is not True or owner_authorized is not True or route_qualified is not True:
        raise StageProbeDenied("SERVER95_STAGE_ROUTE_OR_OWNER_GATE_CLOSED")
    if type(stage_origin) is not str or stage_origin != _STAGE_ORIGIN:
        raise StageProbeDenied("SERVER95_NON_STAGE_ORIGIN_DENIED")
    if type(client_id) is not str or not _ID.fullmatch(client_id):
        raise StageProbeDenied("SERVER95_INVALID_ACCESS_ID")
    if type(client_secret) is not str or not _SECRET.fullmatch(client_secret):
        raise StageProbeDenied("SERVER95_INVALID_ACCESS_SECRET")
    request = urllib.request.Request(
        stage_origin + "/", method="GET",
        headers={
            "Accept": "text/plain",
            "CF-Access-Client-Id": client_id,
            "CF-Access-Client-Secret": client_secret,
        }
    )
    op = opener if opener is not None else _direct_tls_opener()
    try:
        with op.open(request, timeout=_TIMEOUT) as response:
            status = response.status
            if type(status) is not int or status not in (200, 204, 404):
                raise StageProbeDenied("SERVER95_STAGE_HTTP_RESPONSE_UNVERIFIED")
            # Never consume response body: may contain undesired business data.
    except StageProbeDenied:
        raise
    except urllib.error.HTTPError as error:
        status = error.code
        error.close()
        if status not in (403, 404):
            raise StageProbeDenied("SERVER95_STAGE_HTTP_DENIED") from None
    except (urllib.error.URLError, OSError, ValueError, TimeoutError):
        raise StageProbeDenied("SERVER95_STAGE_TRANSPORT_FAILED") from None
    return {
        "schema": "trendos.server95.stage-access-transport-only.v1",
        "status": status,
        "stageOriginExact": True,
        "outboundHttpsGets": 1,
        "accessAuthenticatedProven": False,  # status alone is not Access proof
        "orderReaderAuthenticated": False,
        "stageOrderReaderEnabled": False,
        "ordersRead": 0,
        "customerDataRead": False,
        "filesWritten": False,
        "workerOrD1Writes": False,
        "printerOrLaserCommands": False,
        "productionTouched": False,
        "ubuntuLiveApproved": False,
    }
