"""SERVER-150 stage-only Access GraphQL follow-up, additive to SERVER-141.

A read-only 1-hour stage-app-only query. Adds datetime as an explicitly
selected dimension when ordering by datetime_ASC, matching Cloudflare examples.
GraphQL errors are reduced to allowlisted categories; no raw records printed.
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
from server136_access_ray_graphql import GuardRejected, _TOKEN_PATH, _read_private_token, _send_graphql
from server141_stage_app_access_events import (
    _STAGE_APP, _START, _END, _LIMIT, _RAY, sanitize as sanitize141,
    _QUERY as ORIGINAL_QUERY,
)

ACCOUNT = "aeadb43110dbb950f8b1ed7683ad9ce0"
_QUERY = ORIGINAL_QUERY.replace(
    "dimensions {\n          appId",
    "dimensions {\n          datetime\n          appId",
)
if _QUERY == ORIGINAL_QUERY or _QUERY.count("          datetime\n") != 1:
    raise RuntimeError("SERVER150_QUERY_SHAPE_GUARD_FAILED")

def error_bucket(errors):
    """Return a category only; the error text must never leave the process."""
    if not isinstance(errors, list) or len(errors) > 32:
        return "UNCLASSIFIED"
    fragments = []
    for err in errors:
        if isinstance(err, dict):
            fragments.append(str(err.get("message", ""))[:800])
            ext = err.get("extensions")
            if isinstance(ext, dict):
                fragments.append(str(ext.get("code", ""))[:100])
    data = " ".join(fragments).lower()
    if any(word in data for word in ("permission", "unauthorized", "forbidden", "access denied")):
        return "PERMISSION"
    if any(word in data for word in ("rate limit", "quota", "too many requests")):
        return "QUOTA"
    if any(word in data for word in ("time range", "date range", "retention")):
        return "TIME_WINDOW"
    if any(word in data for word in ("validation", "argument", "variable", "expected type",
                                     "unknown field", "cannot query field")):
        return "GRAPHQL_VALIDATION"
    if any(word in data for word in ("limit", "complexity", "resource", "cost")):
        return "RESOURCE_LIMIT"
    if "datetime" in data or "order" in data:
        return "TIME_OR_SORT"
    return "UNCLASSIFIED"

def sanitize(status, body):
    result = sanitize141(status, body)
    result["schema"] = "trendos.server150.stage-access-graphql-diagnostic.v1"
    result["queryHasSortTimestampDimension"] = True
    result["queryWindowMinutes"] = 60
    result["queryLimit"] = _LIMIT
    result["errorCategory"] = None
    # The error state of SERVER-141 contains placeholder zeroes. Never treat
    # those as proof of zero events from an errored GraphQL query.
    if result["resultCode"] == "SERVER141_GRAPHQL_ERRORS_REDACTED":
        result["resultCode"] = "SERVER150_GRAPHQL_ERRORS_CLASSIFIED"
        result["appEventsCount"] = None
        result["exactRayEvents"] = None
        result["partialLimitReached"] = None
        result["errorCategory"] = error_bucket(body.get("errors")) if isinstance(body, dict) else "UNCLASSIFIED"
        return result
    if result["resultCode"] in (
        "SERVER141_GRAPHQL_PERMISSION_DENIED",
        "SERVER141_GRAPHQL_TRANSPORT_OR_SHAPE_FAILURE",
        "SERVER141_UNEXPECTED_OR_FOREIGN_EVENT",
    ):
        result["resultCode"] = "SERVER150_" + result["resultCode"].removeprefix("SERVER141_")
        result["appEventsCount"] = None
        result["exactRayEvents"] = None
        result["partialLimitReached"] = None
        return result
    # Enforce the one-hour window on all rows before accepting counts.
    try:
        events = body["data"]["viewer"]["accounts"][0]["accessLoginRequestsAdaptiveGroups"]
        begin = datetime.fromisoformat(_START.replace("Z", "+00:00"))
        end = datetime.fromisoformat(_END.replace("Z", "+00:00"))
        for row in events:
            stamp = row["dimensions"]["datetime"]
            if not isinstance(stamp, str) or not stamp.endswith("Z"):
                raise ValueError("bad datetime")
            moment = datetime.fromisoformat(stamp.replace("Z", "+00:00"))
            if not (begin <= moment <= end) or moment.tzinfo is None:
                raise ValueError("out of window")
    except (KeyError, TypeError, ValueError, IndexError, AttributeError):
        result["resultCode"] = "SERVER150_RESPONSE_TIME_OR_SHAPE_REJECTED"
        result["appEventsCount"] = None
        result["exactRayEvents"] = None
        result["partialLimitReached"] = None
        return result
    result["resultCode"] = result["resultCode"].replace("SERVER141_", "SERVER150_")
    if result.get("partialLimitReached") and not result.get("exactRayEvents"):
        result["resultCode"] = "SERVER150_LIMIT_REACHED_TARGET_RAY_UNVERIFIED"
    return result

def main(argv=None, *, opener=None, token_path=None):
    parser = argparse.ArgumentParser(
        description="SERVER-150 1-hour stage Access metadata probe, error details redacted"
    )
    parser.add_argument("--stage-only-readonly", action="store_true")
    parser.add_argument("--owner-approved", action="store_true")
    parser.add_argument("--account-tag", help="single approved TrendMall account ID")
    args = parser.parse_args(argv)
    if not (args.stage_only_readonly and args.owner_approved):
        print("SERVER150_OWNER_AND_STAGE_GATES_CLOSED")
        return 2
    if args.account_tag != ACCOUNT:
        print("SERVER150_ACCOUNT_SCOPE_REJECTED")
        return 2
    try:
        token = _read_private_token(Path(token_path) if token_path else _TOKEN_PATH)
    except (GuardRejected, OSError, ValueError):
        print("SERVER150_LOCAL_PRIVATE_TOKEN_UNSAFE")
        return 2
    payload = {"query": _QUERY, "variables": {
        "accountTag": ACCOUNT, "stageAppId": _STAGE_APP,
        "datetimeStart": _START, "datetimeEnd": _END,
    }}
    status, body = _send_graphql(token, payload, opener=opener)
    del token
    output = sanitize(status, body)
    print(json.dumps(output, separators=(",", ":"), sort_keys=True))
    return 0 if status == 200 and output["resultCode"] in {
        "SERVER150_MATCHED_TARGET_RAY_STAGE_APP",
        "SERVER150_STAGE_APP_EVENTS_BUT_NO_TARGET_RAY",
        "SERVER150_NO_STAGE_APP_EVENTS_UNPROVEN",
        "SERVER150_LIMIT_REACHED_TARGET_RAY_UNVERIFIED",
    } else 2

if __name__ == "__main__":
    raise SystemExit(main())
