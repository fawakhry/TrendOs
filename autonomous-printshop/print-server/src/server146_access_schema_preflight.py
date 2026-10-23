"""SERVER-146: safe Cloudflare GraphQL Access schema preflight (no event queries).

The introspection request asks only for names of public GraphQL schema fields.
No Access login records, IPs, users, Workers, D1, orders or devices.
Requires account-scoped local Analytics Read token and explicit owner/stage gates.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from server136_access_ray_graphql import (
    GuardRejected, _ENDPOINT, _TOKEN_PATH, _read_private_token, _send_graphql
)

_ACCOUNT_TAG = "aeadb43110dbb950f8b1ed7683ad9ce0"
_QUERY = """query Server146AccessSchemaPreflight {
  filterType: __type(name: "AccountAccessLoginRequestsAdaptiveGroupsFilter_InputObject") {
    name
    inputFields { name }
  }
  dimensionsType: __type(name: "AccountAccessLoginRequestsAdaptiveGroupsDimensions") {
    name
    fields { name }
  }
}"""
_ALLOWED_FILTERS = frozenset({"appId", "datetime_geq", "datetime_leq", "cfRayId"})
_ALLOWED_DIMENSIONS = frozenset({"appId", "cfRayId", "isSuccessfulLogin", "serviceTokenId", "approvingPolicyId"})


def sanitize(status: int, document: object) -> dict:
    result = {
        "schema": "trendos.server146.stage-access-schema-preflight.v1",
        "graphqlHttpStatus": status if status in (200, 400, 401, 403, 404, 429, 500, 502, 503) else "other",
        "schemaIntrospectionAvailable": False,
        "stageAppFilterSupported": False,
        "datetimeBoundsSupported": False,
        "rayFilterSupported": False,
        "stageAppDimensionSupported": False,
        "minimumDecisionFieldsSupported": False,
        "canExplainPreviousGraphqlError": False,
        "stageAccessAuthenticatedProven": False,
        "eventsQueried": 0,
        "ordersRead": 0,
        "productionWorkerTouched": False,
        "printerOrLaserCommands": False,
        "resultCode": "SERVER146_UNVERIFIED",
    }
    if status in (401, 403):
        result["resultCode"] = "SERVER146_SCHEMA_API_AUTH_OR_PERMISSION_FAILURE"
        return result
    if status != 200 or not isinstance(document, dict):
        result["resultCode"] = "SERVER146_SCHEMA_TRANSPORT_OR_BODY_FAILURE"
        return result
    if document.get("errors"):
        result["resultCode"] = "SERVER146_SCHEMA_INTROSPECTION_ERRORS_REDACTED"
        return result
    try:
        data = document["data"]
        filter_type = data["filterType"]
        dims_type = data["dimensionsType"]
        if filter_type["name"] != "AccountAccessLoginRequestsAdaptiveGroupsFilter_InputObject":
            raise ValueError("wrong filter type")
        if dims_type["name"] != "AccountAccessLoginRequestsAdaptiveGroupsDimensions":
            raise ValueError("wrong dimensions type")
        filters = filter_type["inputFields"]
        dimensions = dims_type["fields"]
        if not isinstance(filters, list) or not isinstance(dimensions, list):
            raise ValueError("wrong fields shape")
        if len(filters) > 1000 or len(dimensions) > 1000:
            raise ValueError("unbounded schema fields")
        filter_names = {f["name"] for f in filters if isinstance(f, dict) and isinstance(f.get("name"), str)}
        dimension_names = {f["name"] for f in dimensions if isinstance(f, dict) and isinstance(f.get("name"), str)}
    except (KeyError, TypeError, ValueError, AttributeError, IndexError):
        result["resultCode"] = "SERVER146_SCHEMA_TYPE_NOT_FOUND_OR_UNEXPECTED"
        return result

    result["schemaIntrospectionAvailable"] = True
    result["stageAppFilterSupported"] = "appId" in filter_names
    result["datetimeBoundsSupported"] = {"datetime_geq", "datetime_leq"} <= filter_names
    result["rayFilterSupported"] = "cfRayId" in filter_names
    result["stageAppDimensionSupported"] = "appId" in dimension_names
    result["minimumDecisionFieldsSupported"] = {
        "cfRayId", "isSuccessfulLogin", "serviceTokenId", "approvingPolicyId"
    } <= dimension_names
    result["resultCode"] = (
        "SERVER146_REQUIRED_SCHEMA_FIELDS_PRESENT" if (
            _ALLOWED_FILTERS <= filter_names and _ALLOWED_DIMENSIONS <= dimension_names
        ) else "SERVER146_SCHEMA_FIELDS_MISSING"
    )
    # Schema introspection cannot prove the cause of runtime validation/errors.
    return result


def main(argv=None, *, opener=None, token_path=None) -> int:
    parser = argparse.ArgumentParser(
        description="SERVER-146 stage-only GraphQL schema check, no event data"
    )
    parser.add_argument("--stage-only-readonly", action="store_true")
    parser.add_argument("--owner-approved", action="store_true")
    parser.add_argument("--account-tag", required=False, help="32-hex single TrendMall account ID")
    args = parser.parse_args(argv)
    if not args.stage_only_readonly or not args.owner_approved:
        print("SERVER146_OWNER_AND_STAGE_GATES_CLOSED")
        return 2
    if args.account_tag != _ACCOUNT_TAG or not re.fullmatch(r"[a-f0-9]{32}", args.account_tag or ""):
        print("SERVER146_ACCOUNT_SCOPE_REJECTED")
        return 2
    try:
        token = _read_private_token(Path(token_path) if token_path else _TOKEN_PATH)
    except (GuardRejected, OSError, ValueError):
        print("SERVER146_PRIVATE_TOKEN_NOT_READABLE_OR_UNSAFE")
        return 2
    # Constant introspection query: does not contain an account dataset or event query.
    status, data = _send_graphql(token, {"query": _QUERY, "variables": {}}, opener=opener)
    del token
    output = sanitize(status, data)
    print(json.dumps(output, sort_keys=True, separators=(",", ":")))
    return 0 if output["schemaIntrospectionAvailable"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
