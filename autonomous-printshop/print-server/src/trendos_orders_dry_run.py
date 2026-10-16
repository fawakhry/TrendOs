"""AP-302 offline-only two-department orders-read dry run.

NO live HTTP implementation is provided or imported. The transport is an
explicit synthetic recorder injected by a test caller. All URLs use the
non-routable reserved .invalid domain; credentials are hard-coded fake markers.
No production API, account, secret, printer or local file can be contacted.
This is a request/response contract CANDIDATE, not evidence of deployed API.
"""
from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Protocol
from urllib.parse import urlencode, urlsplit

from src.trendos_service_identity_plan import (
    ServiceIdentityPlanError, example_fake_grant, qualify_fake_account_grant,
)
from src.trendos_service_scope_gate import (
    ServiceScopeError, qualify_services_fixture_once,
)

_FAKE_HOST = "trendos-synthetic.invalid"
_BASE = "https://" + _FAKE_HOST
_PAGE_PATH = "/v1/edge/orders/02cr/page"
_SESSION_PATH = "/v1/edge/orders/session"
_FAKE_EMPLOYEE_TOKEN = "AP302_FAKE_EMPLOYEE_TOKEN"
_FAKE_EDGE_TOKEN = "AP302_FAKE_EDGE_TOKEN"
_TIMEOUT_SECONDS = 5
_MAX_RESPONSE_BYTES = 128 * 1024
_PAGE_SIZE = 20
_MAX_REQUESTS = 3
_SCREENS = ("print", "laser")


class DryRunError(RuntimeError):
    """Static error code only. No upstream text or private row output."""


@dataclass(frozen=True)
class SyntheticRequest:
    method: str
    url: str
    headers: dict[str, str]
    json_body: dict[str, str] | None
    timeout_seconds: int
    max_response_bytes: int
    allow_redirects: bool = False


@dataclass(frozen=True)
class SyntheticResponse:
    status: int
    json_body: object
    actual_bytes: int
    redirected: bool = False


class SyntheticTransport(Protocol):
    """No production transport implements this in AP-302."""
    synthetic_only: bool
    def send(self, request: SyntheticRequest) -> SyntheticResponse: ...


def _call_fake_transport(transport: SyntheticTransport, request: SyntheticRequest) -> dict:
    # The contract cannot route to production; a future live implementation
    # must be separately authorized and must not reuse this entrypoint.
    uri = urlsplit(request.url)
    if (
        uri.scheme != "https" or uri.hostname != _FAKE_HOST or uri.port is not None
        or uri.username is not None or uri.password is not None or uri.fragment
        or uri.path not in (_SESSION_PATH, _PAGE_PATH)
        or request.timeout_seconds != _TIMEOUT_SECONDS
        or request.max_response_bytes != _MAX_RESPONSE_BYTES
        or request.allow_redirects is not False
    ):
        raise DryRunError("AP302_UNSAFE_REQUEST_SHAPE")
    if type(getattr(transport, "synthetic_only", None)) is not bool or transport.synthetic_only is not True:
        raise DryRunError("AP302_TRANSPORT_NOT_SYNTHETIC")
    try:
        response = transport.send(request)
    except Exception:
        raise DryRunError("AP302_MOCK_TRANSPORT_FAILED") from None
    if type(response) is not SyntheticResponse:
        raise DryRunError("AP302_MOCK_RESPONSE_INVALID")
    if response.redirected is not False or response.status != 200:
        raise DryRunError("AP302_HTTP_FAILURE_OR_REDIRECT")
    if (
        type(response.actual_bytes) is not int
        or response.actual_bytes < 0
        or response.actual_bytes > request.max_response_bytes
    ):
        raise DryRunError("AP302_RESPONSE_TOO_LARGE")
    if type(response.json_body) is not dict:
        raise DryRunError("AP302_RESPONSE_SHAPE")
    # Defend against fake response-size declarations understating the JSON.
    try:
        size = len(json.dumps(response.json_body, ensure_ascii=False).encode("utf-8"))
    except (TypeError, ValueError):
        raise DryRunError("AP302_RESPONSE_SHAPE") from None
    if size > request.max_response_bytes or size > response.actual_bytes:
        raise DryRunError("AP302_RESPONSE_SIZE_MISMATCH")
    return response.json_body


def _fake_session_request() -> SyntheticRequest:
    return SyntheticRequest(
        method="POST",
        url=_BASE + _SESSION_PATH,
        headers={"Accept": "application/json", "Content-Type": "application/json"},
        json_body={"username": "FAKE_TRENDOSSHOP_READER", "token": _FAKE_EMPLOYEE_TOKEN},
        timeout_seconds=_TIMEOUT_SECONDS,
        max_response_bytes=_MAX_RESPONSE_BYTES,
    )


def _fake_screen_request(screen: str) -> SyntheticRequest:
    if screen not in _SCREENS:
        raise DryRunError("AP302_SCREEN_NOT_ALLOWED")
    query = urlencode({"screen": screen, "page": "1", "pageSize": str(_PAGE_SIZE)})
    return SyntheticRequest(
        method="GET",
        url=_BASE + _PAGE_PATH + "?" + query,
        headers={"Accept": "application/json",
                 "Authorization": "Bearer " + _FAKE_EDGE_TOKEN},
        json_body=None,
        timeout_seconds=_TIMEOUT_SECONDS,
        max_response_bytes=_MAX_RESPONSE_BYTES,
    )


def simulate_orders_read_once(
    transport: SyntheticTransport, *, fixture_grant: dict | None = None,
) -> dict:
    """Exactly 1 fake session exchange and at most 2 fake read requests.

    Result contains counts only. If ANY screen or response fails, return no
    partial count. No retry/fallback; no live URL or credentials accepted.
    """
    if type(getattr(transport, "synthetic_only", None)) is not bool or transport.synthetic_only is not True:
        raise DryRunError("AP302_TRANSPORT_NOT_SYNTHETIC")
    if fixture_grant is None:
        fixture_grant = example_fake_grant()
    try:
        qualify_fake_account_grant(fixture_grant)
    except ServiceIdentityPlanError:
        raise DryRunError("AP302_FAKE_IDENTITY_DENIED") from None

    session = _call_fake_transport(transport, _fake_session_request())
    if (
        session.get("success") is not True
        or session.get("fixtureKind") != "SYNTHETIC_ONLY"
        or session.get("edgeToken") != _FAKE_EDGE_TOKEN
        or session.get("identityKind") != "dedicated_service_reader"
        or type(session.get("screens")) is not list
        or len(session["screens"]) != 2
        or set(session["screens"]) != set(_SCREENS)
        or any(type(s) is not str for s in session["screens"])
    ):
        raise DryRunError("AP302_FAKE_SESSION_SCOPE_DENIED")

    responses = {}
    for screen in _SCREENS:
        body = _call_fake_transport(transport, _fake_screen_request(screen))
        if body.get("success") is not True or type(body.get("rows")) is not list:
            raise DryRunError("AP302_READ_SHAPE_DENIED")
        if len(body["rows"]) > _PAGE_SIZE:
            raise DryRunError("AP302_PAGE_LIMIT_EXCEEDED")
        responses[screen] = body
    try:
        aggregated = qualify_services_fixture_once(
            grant={
                "fixtureKind": "SYNTHETIC_ONLY",
                "role": "department_operator",
                "screens": list(_SCREENS),
            },
            responses=responses,
            enabled_services=_SCREENS,
        )
    except ServiceScopeError:
        raise DryRunError("AP302_DEPARTMENT_SCOPE_DENIED") from None

    return {
        "ok": True,
        "mode": "AP302_OFFLINE_MULTI_DEPARTMENT_HTTP_SHAPE_DRY_RUN",
        "simulatedRequests": _MAX_REQUESTS,
        "simulatedSessionExchanges": 1,
        "simulatedDepartmentReads": 2,
        "rowCount": aggregated["rowCount"],
        "distinctOrderIdsAcrossScreensPresent": aggregated["distinctOrderIdsAcrossScreensPresent"],
        "byScreen": aggregated["byScreen"],
        "realCredentialsUsed": False,
        "realTransportAvailable": False,
        "realEndpointVerified": False,
        "realAuthorizationVerified": False,
        "productionOrdersRead": False,
        "externalNetworkUsed": False,
        "fileWrites": False,
        "businessWrites": False,
        "physicalPrinting": False,
        "productionGo": False,
    }
