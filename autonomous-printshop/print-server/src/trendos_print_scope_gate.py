"""AP-298: synthetic-only fail-closed print-screen scope preflight.

This is NOT a live TrendOS adapter, identity verifier, or authorization grant.
It accepts ONLY an explicit mock fixture, never creates HTTP connections, reads
environment secrets, touches order files, performs login or starts Print Server.
The existing AP-296 one-shot aggregate qualification is reused rather than
duplicated. Production role and API route must be independently verified.
"""
from __future__ import annotations

from src.trendos_shadow_qualifier import (
    ShadowQualificationError, qualify_screen_once,
)


class PrintReadScopeError(RuntimeError):
    """Fixed non-sensitive diagnostic code; never include upstream payloads."""


_EXPECTED_GRANT = frozenset({
    "fixtureKind", "role", "screens", "department", "requestScreen",
    "routeCandidate",
})
_ROUTE_CANDIDATE = "/v1/edge/orders/02cr/page"
_PRINT_DEPARTMENT = "طباعة"


def qualify_print_fixture_once(*, grant: dict, response: dict) -> dict:
    """Check a synthetic print-only grant and fake order rows, then count once.

    The caller must not treat grant metadata as authenticated. This function
    deliberately cannot attest real server permissions or current deployment.
    A future live adapter must separately verify authoritative session scope,
    request route, response provenance, and confidentiality before using data.
    """
    if type(grant) is not dict or frozenset(grant) != _EXPECTED_GRANT:
        raise PrintReadScopeError("AP298_GRANT_SHAPE_DENIED")
    if grant["fixtureKind"] != "SYNTHETIC_ONLY":
        raise PrintReadScopeError("AP298_NOT_SYNTHETIC")
    if (
        type(grant["role"]) is not str or grant["role"] != "print"
        or type(grant["screens"]) is not list or grant["screens"] != ["print"]
        or type(grant["department"]) is not str
        or grant["department"] != _PRINT_DEPARTMENT
        or type(grant["requestScreen"]) is not str
        or grant["requestScreen"] != "print"
    ):
        raise PrintReadScopeError("AP298_PRINT_SCOPE_NOT_EXCLUSIVE")
    if type(grant["routeCandidate"]) is not str or grant["routeCandidate"] != _ROUTE_CANDIDATE:
        raise PrintReadScopeError("AP298_ROUTE_NOT_QUALIFIED")

    if type(response) is not dict or response.get("success") is not True:
        raise PrintReadScopeError("AP298_RESPONSE_DENIED")
    rows = response.get("rows")
    if type(rows) is not list:
        raise PrintReadScopeError("AP298_ROWS_DENIED")
    for row in rows:
        if (
            type(row) is not dict
            or type(row.get("department")) is not str
            or row["department"] != _PRINT_DEPARTMENT
        ):
            raise PrintReadScopeError("AP298_NON_PRINT_ROW_DENIED")

    class _InMemoryClient:
        connected = True
        def __init__(self):
            self.calls = 0
        def get_rows(self, screen: str) -> dict:
            if screen != "print" or self.calls:
                raise PrintReadScopeError("AP298_UNEXPECTED_READ")
            self.calls += 1
            return response

    client = _InMemoryClient()
    try:
        counts = qualify_screen_once(client, "print", allowed_screens=("print",))
    except ShadowQualificationError:
        raise PrintReadScopeError("AP298_AGGREGATE_REJECTED") from None
    if client.calls != 1:
        raise PrintReadScopeError("AP298_UNEXPECTED_READ")

    return {
        "ok": True,
        "mode": "AP298_SYNTHETIC_PRINT_SCOPE_PREFLIGHT",
        "screen": "print",
        "rowCount": counts["rowCount"],
        "distinctOrderIdsPresent": counts["distinctOrderIdsPresent"],
        "distinctLineIdsPresent": counts["distinctLineIdsPresent"],
        "rowsWithoutLineId": counts["rowsWithoutLineId"],
        "rowsWithoutStatus": counts["rowsWithoutStatus"],
        "serverSideRoleVerified": False,
        "productionRouteVerified": False,
        "liveCredentialsUsed": False,
        "liveOrderReadPerformed": False,
        "localFolderWrites": False,
        "platformBusinessWrites": False,
        "printing": False,
        "productionGo": False,
    }
