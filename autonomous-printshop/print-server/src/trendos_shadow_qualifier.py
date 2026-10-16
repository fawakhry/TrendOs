"""AP-296: single-shot TrendOS employee-screen read qualification.

No network, login, logout, platform write, local file, bridge, printer or
background thread is initiated by this module. An authenticated read-capable
client, if one is ever approved, must be passed *explicitly* by the caller.

A returned screen count is not an authoritative order, approval, priority,
machine-ready, print-complete, or customer-data display state.
"""
from __future__ import annotations

from typing import Protocol


class ShadowQualificationError(RuntimeError):
    """Code-only error: do not echo private response or credential details."""


class ReadRowsClient(Protocol):
    @property
    def connected(self) -> bool: ...

    def get_rows(self, screen: str) -> dict: ...


SCREENS = frozenset(("service", "print", "laser", "press"))
MAX_ROWS = 5000


def qualify_screen_once(client: ReadRowsClient, screen: str, *,
                        allowed_screens: tuple[str, ...] = ("print",)) -> dict:
    """One getRows() call, strict schema, privacy-minimized result.

    This is an in-memory projection only. Existing TrendOSReadClient.get_rows
    uses POST with action=getRows; it is a business *read* only if the server
    contract/role permissions are separately verified.
    """
    if (
        not isinstance(screen, str)
        or screen not in SCREENS
        or type(allowed_screens) is not tuple
        or not allowed_screens
        or any(type(x) is not str or x not in SCREENS for x in allowed_screens)
        or screen not in allowed_screens
    ):
        raise ShadowQualificationError("AP296_SCREEN_NOT_SCOPED")
    if getattr(client, "connected", False) is not True:
        raise ShadowQualificationError("AP296_READ_CLIENT_NOT_CONNECTED")

    try:
        response = client.get_rows(screen)
    except Exception:
        # Do not persist/log upstream exception: it may include tokens/URLs.
        raise ShadowQualificationError("AP296_READ_FAILED") from None
    if not isinstance(response, dict) or response.get("success") is not True:
        raise ShadowQualificationError("AP296_INVALID_RESPONSE")
    rows = response.get("rows")
    if not isinstance(rows, list) or len(rows) > MAX_ROWS:
        raise ShadowQualificationError("AP296_INVALID_ROWS")

    order_ids, line_ids = set(), set()
    missing_line_id = 0
    missing_status = 0
    for row in rows:
        if not isinstance(row, dict):
            raise ShadowQualificationError("AP296_INVALID_ROW_OBJECT")
        # Only count structured presence. Never echo sensitive row values.
        order_id = row.get("orderId") or row.get("order_id")
        line_id = row.get("lineId") or row.get("line_id")
        status = row.get("status")
        if isinstance(order_id, (str, int)) and not isinstance(order_id, bool):
            if str(order_id).strip():
                order_ids.add(str(order_id).strip())
        if isinstance(line_id, (str, int)) and not isinstance(line_id, bool) and str(line_id).strip():
            line_ids.add(str(line_id).strip())
        else:
            missing_line_id += 1
        if not isinstance(status, str) or not status.strip():
            missing_status += 1

    return {
        "ok": True,
        "mode": "SHADOW_ONE_SHOT_SCHEMA_QUALIFICATION",
        "source": "EMPLOYEE_SCREEN_GET_ROWS",
        "screen": screen,
        "rowCount": len(rows),
        "distinctOrderIdsPresent": len(order_ids),
        "distinctLineIdsPresent": len(line_ids),
        "rowsWithoutLineId": missing_line_id,
        "rowsWithoutStatus": missing_status,
        "authoritativeOrderCount": False,
        "authoritativeTaskAssignments": False,
        "designApprovalVerified": False,
        "printedOrReadyVerified": False,
        "platformBusinessWrites": False,
        "localFolderWrites": False,
        "sourceCredentialsEmitted": False,
        "dataPersisted": False,
        "backgroundPolling": False,
    }
