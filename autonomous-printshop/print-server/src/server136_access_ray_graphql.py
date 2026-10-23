"""SERVER-136: one-shot Cloudflare Access login event lookup by a stage-only Ray ID.

Data path: local 0600 Analytics Read token -> Cloudflare GraphQL -> strict allowlisted
status/decision fields. This tool never requests a Worker, D1, an order, or a device.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import stat
from urllib import error, request

_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql"
_TOKEN_PATH = Path.home() / ".config" / "trendos-private" / "cloudflare-stage-analytics-20261023.token"
_RAY = "a4f30217e9ef9aca"  # Isolated SERVER-108 stage GET, strip '-MRS' only.
_START = "2026-10-23T18:54:00Z"
_END = "2026-10-23T19:14:00Z"
_QUERY = """query accessLoginRequestsAdaptiveGroups($accountTag: string, $rayId: string, $datetimeStart: string, $datetimeEnd: string) {
  viewer {
    accounts(filter: {accountTag: $accountTag}) {
      accessLoginRequestsAdaptiveGroups(limit: 5, filter: {
        datetime_geq: $datetimeStart, datetime_leq: $datetimeEnd, cfRayId: $rayId
      }, orderBy: [datetime_ASC]) {
        dimensions {
          cfRayId
          datetime
          isSuccessfulLogin
          approvingPolicyId
          serviceTokenId
          identityProvider
        }
      }
    }
  }
}"""


class GuardRejected(Exception):
    pass


def _read_private_token(path: Path) -> str:
    directory = path.parent
    ds = os.lstat(directory)
    fs = os.lstat(path)
    if (not stat.S_ISDIR(ds.st_mode) or stat.S_IMODE(ds.st_mode) != 0o700
            or ds.st_uid != os.getuid()):
        raise GuardRejected("SERVER136_PRIVATE_DIR_PERMISSIONS_INVALID")
    if (not stat.S_ISREG(fs.st_mode) or stat.S_IMODE(fs.st_mode) != 0o600
            or fs.st_uid != os.getuid() or not 20 <= fs.st_size <= 1024):
        raise GuardRejected("SERVER136_TOKEN_FILE_PERMISSIONS_INVALID")
    flags = os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0)
    fd = os.open(path, flags)
    try:
        current = os.fstat(fd)
        if not stat.S_ISREG(current.st_mode) or current.st_ino != fs.st_ino:
            raise GuardRejected("SERVER136_TOKEN_FILE_CHANGED")
        with os.fdopen(fd, "rb") as f:
            fd = -1
            blob = f.read(1025)
    finally:
        if fd >= 0:
            os.close(fd)
    if not 20 <= len(blob) <= 1024 or re.fullmatch(rb"[A-Za-z0-9._~-]+", blob) is None:
        raise GuardRejected("SERVER136_TOKEN_CONTENT_INVALID")
    return blob.decode("ascii")


def _send_graphql(token: str, payload: dict, opener=None) -> tuple[int, object]:
    data = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    req = request.Request(_ENDPOINT, data=data,
                          headers={"Authorization": "Bearer " + token,
                                   "Content-Type": "application/json",
                                   "Accept": "application/json"}, method="POST")
    transport = opener if opener is not None else request.build_opener()
    try:
        with transport.open(req, timeout=8) as response:
            status = response.status
            blob = response.read(131073)
    except error.HTTPError as exc:
        return int(exc.code), None
    except (error.URLError, OSError, TimeoutError, ValueError):
        return 0, None
    if len(blob) > 131072:
        return status, None
    try:
        return status, json.loads(blob)
    except (ValueError, UnicodeDecodeError):
        return status, None


def _sanitized_status(status: int, document: object) -> dict:
    out = {
        "schema": "trendos.server136.stage-cf-ray-analytics.v1",
        "graphqlHttpStatus": status if status in (200, 400, 401, 403, 404, 429, 500, 502, 503) else "other",
        "rayQueried": _RAY,
        "stageAccessAuthenticatedProven": False,
        "eventsMatched": 0,
        "decision": "UNVERIFIED",
        "serviceTokenReferenced": False,
        "policyReferenced": False,
        "ordersRead": 0,
        "productionWorkerTouched": False,
        "productionOrdersTouched": False,
        "printerOrLaserCommands": False,
    }
    if status in (401, 403):
        out["resultCode"] = "SERVER136_GRAPHQL_TOKEN_UNAUTHORIZED_OR_UNSCOPED"
        return out
    if status != 200 or not isinstance(document, dict):
        out["resultCode"] = "SERVER136_GRAPHQL_TRANSPORT_OR_JSON_FAILED"
        return out
    if document.get("errors"):
        out["resultCode"] = "SERVER136_GRAPHQL_ERRORS_REDACTED"
        return out
    try:
        accounts = document["data"]["viewer"]["accounts"]
        if not isinstance(accounts, list) or len(accounts) != 1:
            raise ValueError("unexpected account cardinality")
        groups = accounts[0]["accessLoginRequestsAdaptiveGroups"]
        if not isinstance(groups, list) or len(groups) > 5:
            raise ValueError("unexpected event cardinality")
        dimensions = []
        for row in groups:
            d = row["dimensions"]
            if not isinstance(d, dict) or d.get("cfRayId", "").lower() != _RAY:
                raise ValueError("wrong Ray ID")
            dimensions.append(d)
    except (KeyError, TypeError, AttributeError, ValueError, IndexError):
        out["resultCode"] = "SERVER136_GRAPHQL_UNEXPECTED_SHAPE"
        return out
    if not dimensions:
        out["resultCode"] = "SERVER136_NO_MATCHING_ACCESS_EVENT_UNPROVEN"
        return out
    out["eventsMatched"] = len(dimensions)
    outcomes = {d.get("isSuccessfulLogin") for d in dimensions}
    if outcomes == {0}:
        out["decision"] = "ACCESS_AUTH_FAILURE_RECORDED_FOR_RAY"
    elif outcomes == {1}:
        out["decision"] = "ACCESS_AUTH_SUCCESS_RECORDED_FOR_RAY"
    else:
        out["decision"] = "ACCESS_AUTH_MIXED_OR_UNKNOWN"
    out["serviceTokenReferenced"] = any(bool(d.get("serviceTokenId")) for d in dimensions)
    out["policyReferenced"] = any(bool(d.get("approvingPolicyId")) for d in dimensions)
    out["resultCode"] = "SERVER136_MATCHED_STAGE_RAY_ACCESS_EVENT"
    return out


def main(argv=None, *, opener=None, token_path=None) -> int:
    parser = argparse.ArgumentParser(description="SERVER-136 one-shot stage CF-Ray GraphQL lookup (read-only)")
    parser.add_argument("--stage-only-readonly", action="store_true")
    parser.add_argument("--owner-approved", action="store_true")
    parser.add_argument("--account-tag", required=False, help="32-hex Cloudflare account ID (nonsecret)")
    args = parser.parse_args(argv)
    if not (args.stage_only_readonly and args.owner_approved):
        print("SERVER136_OWNER_AND_STAGE_GATES_CLOSED")
        return 2
    if not isinstance(args.account_tag, str) or not re.fullmatch(r"[a-f0-9]{32}", args.account_tag):
        print("SERVER136_ACCOUNT_TAG_INVALID")
        return 2
    try:
        token = _read_private_token(Path(token_path) if token_path else _TOKEN_PATH)
    except (GuardRejected, OSError, ValueError):
        print("SERVER136_PRIVATE_TOKEN_NOT_READABLE_OR_UNSAFE")
        return 2
    payload = {"query": _QUERY, "variables": {
        "accountTag": args.account_tag, "rayId": _RAY,
        "datetimeStart": _START, "datetimeEnd": _END,
    }}
    status, data = _send_graphql(token, payload, opener=opener)
    del token
    out = _sanitized_status(status, data)
    print(json.dumps(out, sort_keys=True, separators=(",", ":")))
    return 0 if status == 200 and out["resultCode"] in (
        "SERVER136_MATCHED_STAGE_RAY_ACCESS_EVENT",
        "SERVER136_NO_MATCHING_ACCESS_EVENT_UNPROVEN",
    ) else 2


if __name__ == "__main__":
    raise SystemExit(main())
