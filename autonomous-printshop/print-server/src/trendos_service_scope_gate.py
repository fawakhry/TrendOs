"""AP-299: multi-service, multi-department SHADOW fixture qualification.

The owner-approved *product direction* is print + laser from one system,
with optional additional services later. This is a fake-only, in-memory
qualification gate, NOT a deployed authorization engine, network adapter or
production orders source. It reuses AP-296's one-screen validator independently
for every permitted screen and supports order lines spanning departments.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping

from src.trendos_shadow_qualifier import (
    SCREENS, ShadowQualificationError, qualify_screen_once,
)


class ServiceScopeError(RuntimeError):
    """Fixed diagnostic; never interpolate customer, order or token data."""


@dataclass(frozen=True)
class ServiceSpec:
    code: str
    screen: str
    department: str


# Starter catalog only. Each addition must be registered explicitly and its
# corresponding server-side scope/route independently qualified.
STARTER_CATALOG = {
    "print": ServiceSpec("print", "print", "طباعة"),
    "laser": ServiceSpec("laser", "laser", "ليزر"),
}
_VALID_ROLE = "department_operator"
_MAX_SCREENS = 4


def qualify_services_fixture_once(
    *, grant: dict, responses: dict,
    enabled_services: tuple[str, ...] = ("print", "laser"),
    catalog: Mapping[str, ServiceSpec] | None = None,
) -> dict:
    """Validate fake grants and aggregate allowed screens without live access.

    Catalog and enabled_services represent explicitly approved *local*
    configuration, not a trusted proof of real TrendOS permissions. New
    business services may be configured with a known screen (e.g. another
    laser work type); introducing a new screen requires separate backend/API
    and AP-296 qualification. No screen/department is inferred from order text.
    """
    if catalog is None:
        catalog = STARTER_CATALOG
    if (
        not isinstance(catalog, Mapping) or not catalog
        or any(
            type(code) is not str or not code
            or type(spec) is not ServiceSpec
            or spec.code != code
            or type(spec.screen) is not str or spec.screen not in SCREENS
            or type(spec.department) is not str or not spec.department.strip()
            for code, spec in catalog.items()
        )
    ):
        raise ServiceScopeError("AP299_CATALOG_NOT_QUALIFIED")

    if (
        type(enabled_services) is not tuple or not enabled_services
        or any(type(code) is not str or code not in catalog for code in enabled_services)
        or len(enabled_services) != len(set(enabled_services))
    ):
        raise ServiceScopeError("AP299_SERVICES_NOT_REGISTERED")

    # A single source-screen must have one department policy. Multiple service
    # variants sharing that screen + department may be introduced later.
    screen_dept = {}
    for code in enabled_services:
        spec = catalog[code]
        if spec.screen in screen_dept and screen_dept[spec.screen] != spec.department:
            raise ServiceScopeError("AP299_SCREEN_DEPARTMENT_COLLISION")
        screen_dept[spec.screen] = spec.department
    if len(screen_dept) > _MAX_SCREENS:
        raise ServiceScopeError("AP299_TOO_MANY_SCREENS")

    expected = set(screen_dept)
    if (
        type(grant) is not dict
        or set(grant) != {"fixtureKind", "role", "screens"}
        or grant.get("fixtureKind") != "SYNTHETIC_ONLY"
        or type(grant.get("role")) is not str
        or grant["role"] != _VALID_ROLE
        or type(grant.get("screens")) is not list
        or any(type(s) is not str for s in grant["screens"])
        or len(grant["screens"]) != len(expected)
        or set(grant["screens"]) != expected
    ):
        raise ServiceScopeError("AP299_GRANT_NOT_EXACT")

    if type(responses) is not dict or set(responses) != expected:
        raise ServiceScopeError("AP299_RESPONSE_SCOPE_DENIED")

    # Prevalidate ALL fake rows before returning any count; no partial success.
    for screen, dept in screen_dept.items():
        data = responses[screen]
        if type(data) is not dict or data.get("success") is not True:
            raise ServiceScopeError("AP299_RESPONSE_INVALID")
        rows = data.get("rows")
        if type(rows) is not list:
            raise ServiceScopeError("AP299_ROWS_INVALID")
        for row in rows:
            if (
                type(row) is not dict or type(row.get("department")) is not str
                or row["department"] != dept
            ):
                raise ServiceScopeError("AP299_CROSS_DEPARTMENT_ROW_DENIED")

    class _FakeClient:
        connected = True
        def __init__(self, body):
            self.body = body
            self.calls = 0
        def get_rows(self, screen):
            self.calls += 1
            return self.body

    by_screen = {}
    all_order_ids = set()
    total_rows = 0
    for screen in sorted(expected):
        # Entirely local AP-296 read on an in-memory fake client.
        client = _FakeClient(responses[screen])
        try:
            snapshot = qualify_screen_once(client, screen, allowed_screens=(screen,))
        except ShadowQualificationError:
            raise ServiceScopeError("AP299_AGGREGATE_REJECTED") from None
        if client.calls != 1:
            raise ServiceScopeError("AP299_ONE_SHOT_BROKEN")
        total_rows += snapshot["rowCount"]
        by_screen[screen] = {
            "rowCount": snapshot["rowCount"],
            "distinctOrderIdsPresent": snapshot["distinctOrderIdsPresent"],
            "rowsWithoutLineId": snapshot["rowsWithoutLineId"],
            "rowsWithoutStatus": snapshot["rowsWithoutStatus"],
        }
        for row in responses[screen]["rows"]:
            identifier = row.get("orderId") or row.get("order_id")
            if type(identifier) in (str, int) and str(identifier).strip():
                all_order_ids.add(str(identifier).strip())

    return {
        "ok": True,
        "mode": "AP299_SYNTHETIC_MULTI_SERVICE_SCOPE",
        "serviceCount": len(enabled_services),
        "screenCount": len(expected),
        "rowCount": total_rows,
        "distinctOrderIdsAcrossScreensPresent": len(all_order_ids),
        "byScreen": by_screen,
        "serverSideScopeVerified": False,
        "liveReadPerformed": False,
        "orderWorkflowAuthority": False,
        "customerDataEmitted": False,
        "credentialsUsed": False,
        "filesWritten": False,
        "platformBusinessWrites": False,
        "printing": False,
        "productionGo": False,
    }
