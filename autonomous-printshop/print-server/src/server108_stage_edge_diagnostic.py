"""SERVER-108: capture strictly safe edge response markers from SERVER-95 stage-only probe.

Separate one-shot diagnostic; never part of the legacy production order reader.
No request unless three explicit owner gates and interactive local credentials.
Never reads a response body, prints secrets, writes files or uses order endpoints.
"""
from __future__ import annotations

import argparse
import getpass
import json
import re
import sys
import urllib.error

from stage_access_probe import (
    StageProbeDenied,
    _STAGE_ORIGIN,
    _direct_tls_opener,
    probe_stage_access_once,
)

_RAY = re.compile(r"^[a-fA-F0-9]{12,32}(?:-[A-Za-z0-9]{2,8})?$", re.ASCII)
_VALID_STATUS = range(100, 600)


def _get_header(headers, name):
    if headers is None:
        return None
    try:
        return headers.get(name)
    except (AttributeError, TypeError, ValueError):
        return None


def _content_type(value):
    if not isinstance(value, str):
        return "unavailable"
    m = value.partition(";")[0].strip().lower()
    return m if m in ("text/plain", "text/html", "application/json") else "other"


class _CaptureOpener:
    def __init__(self, transport):
        self.transport = transport
        self.count = 0
        self.http_status = None
        self.cf_ray = None
        self.content_type = "unavailable"
        self.edge_challenge = False

    def _capture(self, response):
        status = getattr(response, "status", getattr(response, "code", None))
        if type(status) is int and status in _VALID_STATUS:
            self.http_status = status
        headers = getattr(response, "headers", None)
        ray = _get_header(headers, "CF-Ray")
        if isinstance(ray, str) and _RAY.fullmatch(ray):
            self.cf_ray = ray
        self.content_type = _content_type(_get_header(headers, "Content-Type"))
        self.edge_challenge = _get_header(headers, "CF-Mitigated") == "challenge"

    def open(self, request, timeout):
        self.count += 1
        try:
            response = self.transport.open(request, timeout=timeout)
        except urllib.error.HTTPError as error:
            self._capture(error)
            raise
        self._capture(response)
        return response


def diagnose_stage_once(*, client_id, client_secret, enabled=False,
                        owner_authorized=False, route_qualified=False, opener=None):
    """Return only allowlisted response metadata; never proclaim authenticated."""
    wrapper = _CaptureOpener(opener if opener is not None else _direct_tls_opener())
    try:
        report = probe_stage_access_once(
            stage_origin=_STAGE_ORIGIN, client_id=client_id, client_secret=client_secret,
            enabled=enabled, owner_authorized=owner_authorized,
            route_qualified=route_qualified, opener=wrapper,
        )
        result_code = "SERVER108_STAGE_TRANSPORT_STATUS_CAPTURED"
    except StageProbeDenied as error:
        result_code = str(error)  # SERVER-95 constant error codes only
        report = None
    return {
        "schema": "trendos.server108.edge-marker-stage-only.v1",
        "resultCode": result_code,
        "status": wrapper.http_status,
        "cfRay": wrapper.cf_ray,
        "contentType": wrapper.content_type,
        "cfMitigatedChallenge": wrapper.edge_challenge,
        "outboundHttpsGets": wrapper.count,
        "accessAuthenticatedProven": False,
        "ordersRead": 0,
        "workerOrD1Writes": False,
        "productionTouched": False,
        "printerOrLaserCommands": False,
        "stageProbeReturned": report is not None,
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description="Stage-only Cloudflare edge marker diagnostic")
    parser.add_argument("--stage-only-readonly", action="store_true")
    parser.add_argument("--owner-approved", action="store_true")
    parser.add_argument("--published-route-verified", action="store_true")
    args = parser.parse_args(argv)
    if not (args.stage_only_readonly and args.owner_approved and args.published_route_verified):
        print("SERVER108_STAGE_OR_OWNER_GATES_CLOSED")
        return 2
    if not sys.stdin.isatty():
        print("SERVER108_INTERACTIVE_TERMINAL_REQUIRED")
        return 2
    try:
        cid = getpass.getpass("Stage Access Client ID (hidden): ")
        secret = getpass.getpass("Stage Access Client Secret (hidden): ")
        result = diagnose_stage_once(client_id=cid, client_secret=secret, enabled=True,
                                     owner_authorized=True, route_qualified=True)
        print(json.dumps(result, sort_keys=True, separators=(",", ":")))
        return 0 if result["status"] in (200, 204, 403, 404) else 2
    except (EOFError, KeyboardInterrupt):
        print("SERVER108_OWNER_INPUT_CANCELLED")
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
