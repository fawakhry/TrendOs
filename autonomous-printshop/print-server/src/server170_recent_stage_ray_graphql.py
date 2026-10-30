"""SERVER-170: immutable isolated-stage exact-Ray Access GraphQL check.

Owner gated, one account, one Access stage application, one recent 20-minute
window around the owner-observed October 24 00:11 Cairo stage HTTP403.
One Cloudflare Analytics GraphQL read only; never a Worker call or an order read.
Secrets, raw events/errors, user identifiers and policy IDs are never printed.
"""
from __future__ import annotations

import argparse
from datetime import datetime
import json
from pathlib import Path

from server136_access_ray_graphql import (
    GuardRejected, _read_private_token, _send_graphql, _TOKEN_PATH,
)
from server150_stage_app_graphql_diagnostic import (
    ACCOUNT, _STAGE_APP, error_bucket,
)

_RAY = "a4f3bc5b6b88e1c1"  # Owner screenshot, SERVER-162, without -MRS.
_START = "2026-10-23T21:00:00Z"  # 00:00 Cairo, Oct 24.
_END = "2026-10-23T21:20:00Z"    # 00:20 Cairo, Oct 24.
_LIMIT = 10

_QUERY = """query StageExactRayAccess($accountTag: string, $stageAppId: string, $rayId: string, $datetimeStart: string, $datetimeEnd: string) {
  viewer {
    accounts(filter: {accountTag: $accountTag}) {
      accessLoginRequestsAdaptiveGroups(
        limit: 10,
        filter: {appId: $stageAppId, cfRayId: $rayId, datetime_geq: $datetimeStart, datetime_leq: $datetimeEnd},
        orderBy: [datetime_ASC]
      ) {
        dimensions {
          datetime
          appId
          cfRayId
          isSuccessfulLogin
          serviceTokenId
          approvingPolicyId
        }
      }
    }
  }
}"""

def _empty_report(http_status: int) -> dict:
    return {
        "schema": "trendos.server170.stage-access-exact-ray.v1",
        "graphqlHttpStatus": http_status if http_status in
            (200, 400, 401, 403, 404, 429, 500, 502, 503) else "other",
        "isolatedAppOnly": True,
        "rayFilterApplied": True,
        "queryWindowMinutes": 20,
        "queryLimit": _LIMIT,
        "eventCount": None,
        "partialLimitReached": None,
        "decision": "UNVERIFIED",
        "serviceTokenReferenced": False,
        "approvingPolicyReferenced": False,
        "stageAccessAuthenticatedProven": False,
        "errorCategory": None,
        "resultCode": "SERVER170_UNVERIFIED",
        "ordersRead": 0,
        "productionWorkerTouched": False,
        "printerOrLaserCommands": False,
    }

def sanitize(status: int, body: object) -> dict:
    result = _empty_report(status)
    if status in (401, 403):
        result["resultCode"] = "SERVER170_GRAPHQL_PERMISSION_DENIED"
        return result
    if status != 200 or not isinstance(body, dict):
        result["resultCode"] = "SERVER170_GRAPHQL_TRANSPORT_OR_SHAPE_FAILURE"
        return result
    if body.get("errors"):
        result["resultCode"] = "SERVER170_GRAPHQL_ERRORS_CLASSIFIED"
        result["errorCategory"] = error_bucket(body.get("errors"))
        return result
    try:
        accounts = body["data"]["viewer"]["accounts"]
        if not isinstance(accounts, list) or len(accounts) != 1:
            raise ValueError("invalid accounts")
        rows = accounts[0]["accessLoginRequestsAdaptiveGroups"]
        if not isinstance(rows, list) or len(rows) > _LIMIT:
            raise ValueError("invalid event count")
        start = datetime.fromisoformat(_START.replace("Z", "+00:00"))
        end = datetime.fromisoformat(_END.replace("Z", "+00:00"))
        for row in rows:
            d = row["dimensions"]
            if not isinstance(d, dict):
                raise ValueError("invalid dimensions")
            if d.get("appId") != _STAGE_APP or d.get("cfRayId", "").lower() != _RAY:
                raise ValueError("foreign stage app or ray")
            stamp = d["datetime"]
            if not isinstance(stamp, str) or not stamp.endswith("Z"):
                raise ValueError("invalid datetime")
            when = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
            if when.tzinfo is None or not (start <= when <= end):
                raise ValueError("foreign time")
            if d.get("isSuccessfulLogin") not in (0, 1):
                raise ValueError("unexpected login decision")
    except (KeyError, ValueError, TypeError, IndexError, AttributeError):
        result["resultCode"] = "SERVER170_FOREIGN_OR_INVALID_RESPONSE"
        return result
    result["eventCount"] = len(rows)
    result["partialLimitReached"] = len(rows) == _LIMIT
    if not rows:
        result["resultCode"] = "SERVER170_NO_EVENT_UNPROVEN"
        return result
    dims = [row["dimensions"] for row in rows]
    decisions = {d["isSuccessfulLogin"] for d in dims}
    result["serviceTokenReferenced"] = any(bool(d.get("serviceTokenId")) for d in dims)
    result["approvingPolicyReferenced"] = any(bool(d.get("approvingPolicyId")) for d in dims)
    if decisions == {0}:
        result["decision"] = "ACCESS_DENIED_EVENT_FOR_EXACT_RAY"
        result["resultCode"] = "SERVER170_DENIED_EVENT_FOUND"
    elif decisions == {1}:
        result["decision"] = "ACCESS_ALLOWED_EVENT_FOR_EXACT_RAY"
        result["stageAccessAuthenticatedProven"] = True
        result["resultCode"] = "SERVER170_ALLOWED_EVENT_FOUND"
    else:
        result["decision"] = "MIXED_DECISIONS"
        result["resultCode"] = "SERVER170_MIXED_DECISIONS_UNVERIFIED"
    return result

def main(argv=None, *, opener=None, token_path=None):
    p = argparse.ArgumentParser(description="SERVER-170 recent stage-only exact-Ray Access metadata read; no secret output")
    p.add_argument("--stage-only-readonly", action="store_true")
    p.add_argument("--owner-approved", action="store_true")
    p.add_argument("--account-tag", help="approved Cloudflare Analytics account tag")
    args = p.parse_args(argv)
    if not (args.stage_only_readonly and args.owner_approved):
        print("SERVER170_OWNER_AND_STAGE_GATES_CLOSED")
        return 2
    if args.account_tag != ACCOUNT:
        print("SERVER170_ACCOUNT_SCOPE_REJECTED")
        return 2
    try:
        token = _read_private_token(Path(token_path) if token_path else _TOKEN_PATH)
    except (GuardRejected, OSError, ValueError):
        print("SERVER170_LOCAL_PRIVATE_ANALYTICS_TOKEN_UNSAFE")
        return 2
    payload = {
        "query": _QUERY,
        "variables": {
            "accountTag": ACCOUNT,
            "stageAppId": _STAGE_APP,
            "rayId": _RAY,
            "datetimeStart": _START,
            "datetimeEnd": _END,
        },
    }
    http_status, data = _send_graphql(token, payload, opener=opener)
    del token
    result = sanitize(http_status, data)
    print(json.dumps(result, separators=(",", ":"), sort_keys=True))
    return 0 if http_status == 200 and result["resultCode"] in {
        "SERVER170_NO_EVENT_UNPROVEN",
        "SERVER170_DENIED_EVENT_FOUND",
        "SERVER170_ALLOWED_EVENT_FOUND",
        "SERVER170_MIXED_DECISIONS_UNVERIFIED",
    } else 2

if __name__ == "__main__":
    raise SystemExit(main())
