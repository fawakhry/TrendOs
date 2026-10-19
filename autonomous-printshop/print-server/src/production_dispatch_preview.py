"""SERVER-76: pure in-memory TrendOS -> printshop employee handoff PREVIEW.

This deliberately performs NO HTTPS/IO, file downloads/copies, R2 access,
customer-directory queries, scheduler jobs, production writes or device calls.
Caller must use an independently approved server-side scoped read adapter.
Neither linked customer files nor caller-supplied booleans grant design approval.
"""
from __future__ import annotations

import math
import re
from typing import Mapping

_SCREENS = ("print", "laser")
_ALLOWED_ROW = {"orderId", "lineId", "screen", "serviceCode", "status", "quantity"}
_ALLOWED_ARTIFACT = {
    "orderId", "lineId", "fileId", "mimeType", "contentSha256",
    "storageProvider", "activeLineMatch", "archived",
}
_ID = re.compile(r"^[A-Za-z0-9_.:/-]{1,96}$")
_FILE_ID = re.compile(r"^[A-Za-z0-9_.:/-]{1,180}$")
_SHA256 = re.compile(r"^[a-f0-9]{64}$")
_ACCEPTED_MIMES = {"image/jpeg", "image/png", "image/tiff", "image/webp", "application/pdf"}
_CLOSED = {
    "تم التسليم", "جاهز للاستلام", "ملغي", "ملغى",
    "مكرر", "مدمج", "مغلق", "ملغي/مغلق",
}


class DispatchPreviewError(ValueError):
    """Fixed, nonsensitive error codes only."""


def _valid_id(value: object, pattern=_ID) -> bool:
    return type(value) is str and bool(pattern.fullmatch(value)) and value == value.strip()


def _validate_response(screen: str, packet: object) -> list[dict]:
    if type(packet) is not dict or packet.get("success") is not True:
        raise DispatchPreviewError("SERVER76_UNQUALIFIED_RESPONSE")
    if (packet.get("screen") != screen or packet.get("mode") != "read-only"
            or packet.get("source") != "qualified-mirror-plus-t12-snapshot"):
        raise DispatchPreviewError("SERVER76_UNQUALIFIED_SOURCE")
    pagination = packet.get("pagination")
    if (type(pagination) is not dict or pagination.get("page") != 1
            or pagination.get("pageSize") != 20
            or type(pagination.get("hasMore")) is not bool
            or pagination["hasMore"] is not False):
        raise DispatchPreviewError("SERVER76_INCOMPLETE_SNAPSHOT")
    rows = packet.get("rows")
    if type(rows) is not list or len(rows) > 20:
        raise DispatchPreviewError("SERVER76_UNQUALIFIED_ROWS")
    for row in rows:
        if type(row) is not dict or set(row) != _ALLOWED_ROW:
            raise DispatchPreviewError("SERVER76_FIELD_SCOPE_DENIED")
        if not (_valid_id(row["orderId"]) and _valid_id(row["lineId"])
                and row["screen"] == screen and row["serviceCode"] == screen
                and type(row["status"]) is str and 0 < len(row["status"].strip()) <= 80
                and row["status"] == row["status"].strip()
                and type(row["quantity"]) in (int, float)
                and math.isfinite(row["quantity"])
                and 0 < row["quantity"] <= 1000000):
            raise DispatchPreviewError("SERVER76_LINE_SCOPE_DENIED")
    return rows


def _validated_artifacts(artifacts: object, line_to_order: Mapping[str, str]) -> dict[str, int]:
    if type(artifacts) not in (tuple, list) or len(artifacts) > 80:
        raise DispatchPreviewError("SERVER76_ARTIFACT_LIST_DENIED")
    counts: dict[str, int] = {}
    seen_ids: set[str] = set()
    for artifact in artifacts:
        if type(artifact) is not dict or set(artifact) != _ALLOWED_ARTIFACT:
            raise DispatchPreviewError("SERVER76_ARTIFACT_FIELDS_DENIED")
        oid, lid, fid = (artifact["orderId"], artifact["lineId"], artifact["fileId"])
        if not (_valid_id(oid) and _valid_id(lid) and _valid_id(fid, _FILE_ID)
                and lid in line_to_order and line_to_order[lid] == oid):
            raise DispatchPreviewError("SERVER76_ARTIFACT_BINDING_DENIED")
        if fid in seen_ids:
            raise DispatchPreviewError("SERVER76_DUPLICATE_ARTIFACT")
        seen_ids.add(fid)
        sha = artifact["contentSha256"]
        mime = artifact["mimeType"]
        if (type(sha) is not str or not _SHA256.fullmatch(sha)
                or type(mime) is not str or mime not in _ACCEPTED_MIMES
                or artifact["storageProvider"] != "R2"
                or artifact["activeLineMatch"] is not True
                or artifact["archived"] is not False):
            raise DispatchPreviewError("SERVER76_ARTIFACT_NOT_QUALIFIED")
        counts[lid] = counts.get(lid, 0) + 1
    return counts


def build_employee_dispatch_preview(responses: object, artifacts: object = ()) -> dict:
    """Create a bounded handoff PREVIEW from two already authenticated packets.

    The returned items are for a local operator to review. A matching hash is
    a file-inventory hint, NOT trusted provenance, design approval, a device
    authorization, or permission to download/write anything.
    """
    if type(responses) is not dict or set(responses) != set(_SCREENS):
        raise DispatchPreviewError("SERVER76_SCREEN_SCOPE_DENIED")
    rows_by_screen = {s: _validate_response(s, responses[s]) for s in _SCREENS}
    line_to_order: dict[str, str] = {}
    for screen in _SCREENS:
        for row in rows_by_screen[screen]:
            line_id = row["lineId"]
            if line_id in line_to_order:
                raise DispatchPreviewError("SERVER76_DUPLICATE_LINE")
            line_to_order[line_id] = row["orderId"]
    counts = _validated_artifacts(artifacts, line_to_order)
    tasks = []
    by_screen = {}
    for screen in _SCREENS:
        by_screen[screen] = 0
        for row in rows_by_screen[screen]:
            closed = row["status"] in _CLOSED
            count = counts.get(row["lineId"], 0)
            action = ("DO_NOT_DISPATCH_CLOSED_LINE" if closed else
                      "REVIEW_DESIGN_AND_VERIFY_FILE_BEFORE_TRANSFER" if count
                      else "REQUEST_QUALIFIED_DESIGN_FILE_AND_REVIEW")
            tasks.append({
                "orderId": row["orderId"],
                "lineId": row["lineId"],
                "screen": screen,
                "quantity": row["quantity"],
                "status": row["status"],
                "linkedFileCandidates": count,
                "nextOperatorAction": action,
                "assetApprovalVerified": False,
                "fileHashRecheckedOnHost": False,
                "readyForMachine": False,
            })
            by_screen[screen] += 1
    return {
        "schema": "trendos.server76.employee-dispatch-preview.v1",
        "mode": "IN_MEMORY_REVIEW_ONLY",
        "scope": list(_SCREENS),
        "orderCount": len(set(line_to_order.values())),
        "lineCount": len(tasks),
        "byScreen": by_screen,
        "tasks": tasks,
        "requiresHumanDesignReview": True,
        "requiresAuthorizedFileRetrieval": True,
        "customerDirectoryRead": False,
        "assetBytesDownloaded": False,
        "folderWrites": False,
        "networkRequests": False,
        "printerCommands": False,
        "laserCommands": False,
        "platformBusinessWrites": False,
        "productionAuthorized": False,
    }
