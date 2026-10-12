"""AP-280: local-only employee work queue projection (no platform mutations).

This is a suggested local next step, NOT an authoritative TrendOS status,
approved-design state, printer state, or overdue/SLA determination.
"""
from __future__ import annotations

from datetime import datetime, timezone


def _created_sort_key(row: dict) -> tuple:
    raw = str(row.get("createdAt") or "")
    try:
        date = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        if date.tzinfo is None:
            date = date.replace(tzinfo=timezone.utc)
        return (0, date.astimezone(timezone.utc).timestamp())
    except (OverflowError, ValueError, OSError):
        return (1, 0)


def local_employee_queue(orders: list[dict]) -> dict:
    """Create a safe local-only queue from already persisted Print Server orders.

    No directory scans, network requests, filesystem writes, or customer status
    inference. Missing or untrusted state is treated as needing human review.
    """
    items = []
    for order in orders:
        if not isinstance(order, dict):
            continue
        order_id = str(order.get("orderId") or "").strip()
        if not order_id:
            continue
        routes = order.get("routes")
        if not isinstance(routes, dict):
            routes = {}
        # Count only explicit, non-empty manual folder registrations.
        selected = [
            key for key, route in routes.items()
            if isinstance(route, dict) and route.get("manual") is True
            and bool(str(route.get("path") or "").strip())
        ]
        needs_folder = not selected
        lines = order.get("lineIds")
        items.append({
            "orderId": order_id,
            "customerName": str(order.get("customerName") or ""),
            "localStage": "NEEDS_WORK_FOLDER" if needs_folder else "FOLDER_SELECTED",
            "nextAction": (
                "اختار نوع الشغل يدويًا قبل التجهيز"
                if needs_folder else
                "راجع ملفات الأوردر والموافقة البشرية قبل التجهيز للطباعة"
            ),
            "manualFolderCount": len(selected),
            "lineCount": len(lines) if isinstance(lines, list) else 0,
            "createdAt": str(order.get("createdAt") or ""),
            "updatedAt": str(order.get("updatedAt") or ""),
        })
    # Unrouted work first, then oldest created; no inferred priority or SLA.
    items.sort(key=lambda item: (
        item["localStage"] != "NEEDS_WORK_FOLDER",
        _created_sort_key(item),
        item["orderId"],
    ))
    return {
        "ok": True,
        "source": "LOCAL_PRINT_SERVER_STATE_ONLY",
        "authoritativeTrendOSStatus": False,
        "designApprovalVerified": False,
        "physicalPrintingVerified": False,
        "platformBusinessWrites": False,
        "summary": {
            "localOrders": len(items),
            "needsManualFolder": sum(x["localStage"] == "NEEDS_WORK_FOLDER" for x in items),
            "folderSelected": sum(x["localStage"] == "FOLDER_SELECTED" for x in items),
        },
        "items": items,
    }
