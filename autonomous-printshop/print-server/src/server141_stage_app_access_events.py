"""SERVER-141: account-scoped, stage-application-only Access auth event cross-check.

This is a separate follow-up to the exact-CF-Ray lookup that returned zero events.
Only metadata for the isolated Access app within a one-hour window is requested.
No production app, order, D1, Worker, print or laser call occurs.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from server136_access_ray_graphql import GuardRejected, _read_private_token, _send_graphql, _TOKEN_PATH, _RAY

# Obtained from owner-verified isolated-stage Access application UI URL.
_STAGE_APP = "28859297-b80f-47a7-98ed-78e00efc3204"
_START = "2026-10-23T18:30:00Z"
_END = "2026-10-23T19:30:00Z"
_LIMIT = 20

_QUERY = """query StageAppOnlyAccessEvents($accountTag: string, $stageAppId: string, $datetimeStart: string, $datetimeEnd: string) {
  viewer {
    accounts(filter: {accountTag: $accountTag}) {
      accessLoginRequestsAdaptiveGroups(
        limit: 20,
        filter: {appId: $stageAppId, datetime_geq: $datetimeStart, datetime_leq: $datetimeEnd},
        orderBy: [datetime_ASC]
      ) {
        dimensions {
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


def sanitize(status: int, document: object) -> dict:
    """Never print raw records, rays from other requests, IDs, token or API errors."""
    result = {
        "schema": "trendos.server141.stage-access-app-events.v1",
        "graphqlHttpStatus": status if status in (200, 400, 401, 403, 404, 429, 500, 502, 503) else "other",
        "isolatedAppOnly": True,
        "stageAccessAuthenticatedProven": False,
        "appEventsCount": 0,
        "exactRayEvents": 0,
        "matchingRayOutcome": "UNVERIFIED",
        "resultCode": "SERVER141_UNVERIFIED",
        "partialLimitReached": False,
        "ordersRead": 0,
        "productionWorkerTouched": False,
        "printerOrLaserCommands": False,
    }
    if status in (401, 403):
        result["resultCode"] = "SERVER141_GRAPHQL_PERMISSION_DENIED"
        return result
    if status != 200 or not isinstance(document, dict):
        result["resultCode"] = "SERVER141_GRAPHQL_TRANSPORT_OR_SHAPE_FAILURE"
        return result
    if document.get("errors"):
        result["resultCode"] = "SERVER141_GRAPHQL_ERRORS_REDACTED"
        return result
    try:
        accounts = document["data"]["viewer"]["accounts"]
        if not isinstance(accounts, list) or len(accounts) != 1:
            raise ValueError("account cardinality invalid")
        events = accounts[0]["accessLoginRequestsAdaptiveGroups"]
        if not isinstance(events, list) or len(events) > _LIMIT:
            raise ValueError("event cardinality invalid")
        for event in events:
            dimensions = event["dimensions"]
            if not isinstance(dimensions, dict) or dimensions.get("appId") != _STAGE_APP:
                raise ValueError("foreign app record")
            if not isinstance(dimensions.get("cfRayId"), str):
                raise ValueError("invalid ray")
    except (KeyError, ValueError, TypeError, IndexError, AttributeError):
        result["resultCode"] = "SERVER141_UNEXPECTED_OR_FOREIGN_EVENT"
        return result

    result["appEventsCount"] = len(events)
    result["partialLimitReached"] = len(events) == _LIMIT
    matched = [
        item["dimensions"]
        for item in events
        if item["dimensions"]["cfRayId"].lower() == _RAY
    ]
    result["exactRayEvents"] = len(matched)
    if matched:
        success = {d.get("isSuccessfulLogin") for d in matched}
        if success == {0}:
            result["matchingRayOutcome"] = "ACCESS_DENIED_EVENT_FOR_TARGET_RAY"
        elif success == {1}:
            result["matchingRayOutcome"] = "ACCESS_ALLOWED_EVENT_FOR_TARGET_RAY"
        else:
            result["matchingRayOutcome"] = "TARGET_RAY_OUTCOME_MIXED_OR_UNKNOWN"
        result["resultCode"] = "SERVER141_MATCHED_TARGET_RAY_STAGE_APP"
    elif events:
        result["resultCode"] = "SERVER141_STAGE_APP_EVENTS_BUT_NO_TARGET_RAY"
    else:
        result["resultCode"] = "SERVER141_NO_STAGE_APP_EVENTS_UNPROVEN"
    return result


def main(argv=None, *, opener=None, token_path=None) -> int:
    parser = argparse.ArgumentParser(
        description="SERVER-141 read-only short-window Access events for isolated staging app"
    )
    parser.add_argument("--stage-only-readonly", action="store_true")
    parser.add_argument("--owner-approved", action="store_true")
    parser.add_argument("--account-tag", help="Cloudflare account ID, 32 hexadecimal characters")
    args = parser.parse_args(argv)
    if not (args.stage_only_readonly and args.owner_approved):
        print("SERVER141_OWNER_AND_STAGE_GATES_CLOSED")
        return 2
    if not isinstance(args.account_tag, str) or not re.fullmatch(r"[a-f0-9]{32}", args.account_tag):
        print("SERVER141_ACCOUNT_TAG_INVALID")
        return 2
    try:
        token = _read_private_token(Path(token_path) if token_path else _TOKEN_PATH)
    except (GuardRejected, OSError, ValueError):
        print("SERVER141_PRIVATE_TOKEN_NOT_READABLE_OR_UNSAFE")
        return 2
    # No user input can alter appId, one-hour time interval, API endpoint or the LIMIT.
    payload = {"query": _QUERY, "variables": {
        "accountTag": args.account_tag, "stageAppId": _STAGE_APP,
        "datetimeStart": _START, "datetimeEnd": _END,
    }}
    status, body = _send_graphql(token, payload, opener=opener)
    del token
    result = sanitize(status, body)
    print(json.dumps(result, sort_keys=True, separators=(",", ":")))
    return 0 if status == 200 and result["resultCode"] in (
        "SERVER141_MATCHED_TARGET_RAY_STAGE_APP",
        "SERVER141_STAGE_APP_EVENTS_BUT_NO_TARGET_RAY",
        "SERVER141_NO_STAGE_APP_EVENTS_UNPROVEN"
    ) else 2


if __name__ == "__main__":
    raise SystemExit(main())
