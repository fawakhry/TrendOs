"""SERVER-69B: Python Ubuntu read-once client -> actual LOCAL Workerd HTTP bridge.

Strictly a disposable contract test, NEVER the real Ubuntu host or Cloudflare.
The injected opener permits only the exact pinned HTTPS Worker URL to be
translated to a loopback local Worker test. No other outbound destinations.
"""
from __future__ import annotations

import http.client
import json
import os
from urllib.parse import urlsplit
from src.trendosshop_read_once import (
    read_trendosshop_once, read_trendosshop_dispatch_preview_once, TrendosShopReadError,
)
from src.trendosshop_canary_once_cli import run_canary_once, CanaryDisabled

# A test-only constant matching the local Workerd synthetic bearer.
# Never share or use this fixture credential in any real Worker/host.
FAKE_TOKEN = "SYNTHETIC_SERVER69_PRINTSHOP_READ_ONLY_TOKEN_0123456789_ABC"
EXPECTED_HOST = "trendos-d1-api.trendmall-contact.workers.dev"
EXPECTED_PATH = "/v1/printshop/service/orders/page"
LOCAL_HOST = "127.0.0.1"
LOCAL_PORT = 8795

class LoopbackResponse:
    def __init__(self, status, headers, content):
        self.status = status
        self.headers = headers
        self._content = content

    def read(self, size=-1):
        data = self._content[:size] if size >= 0 else self._content
        self._content = self._content[len(data):]
        return data

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self._content = b""

class VerifiedLoopbackOnlyOpener:
    """Translate an exact, pinned API request to Workerd on 127.0.0.1 only."""
    def __init__(self):
        self.calls = []

    def open(self, request, timeout):
        url = urlsplit(request.full_url)
        if (
            url.scheme != "https" or url.hostname != EXPECTED_HOST
            or url.port is not None or url.username or url.password
            or url.path != EXPECTED_PATH or url.fragment
            or request.get_method() != "GET"
        ):
            raise TrendosShopReadError("SERVER69_UNAPPROVED_TARGET")
        if timeout != 5:
            raise TrendosShopReadError("SERVER69_UNEXPECTED_TIMEOUT")
        screen = dict(pair.split("=", 1) for pair in url.query.split("&")).get("screen")
        if screen not in ("print", "laser"):
            raise TrendosShopReadError("SERVER69_UNAPPROVED_SCREEN")
        if url.query != f"screen={screen}&page=1&pageSize=20":
            raise TrendosShopReadError("SERVER69_UNAPPROVED_PAGE")
        self.calls.append(screen)
        # Only the test adapter uses cleartext; real client always requires HTTPS.
        conn = http.client.HTTPConnection(LOCAL_HOST, LOCAL_PORT, timeout=5)
        try:
            conn.request(
                "GET", url.path + "?" + url.query,
                headers={
                    "Authorization": request.get_header("Authorization") or "",
                    "Accept": "application/json",
                },
            )
            reply = conn.getresponse()
            status = reply.status
            raw = reply.read(131073)
            headers = {"Content-Type": reply.getheader("Content-Type", "")}
        finally:
            conn.close()
        return LoopbackResponse(status, headers, raw)

def main():
    opener = VerifiedLoopbackOnlyOpener()
    try:
        read_trendosshop_once(FAKE_TOKEN, opener=opener)
    except TrendosShopReadError as exc:
        if str(exc) != "SERVER34_LIVE_READ_DISABLED":
            raise
    else:
        raise AssertionError("default-OFF reader unexpectedly succeeded")
    assert opener.calls == [], "disabled reader must never make a request"

    result = read_trendosshop_once(
        FAKE_TOKEN, enabled=True, owner_authorized=True, opener=opener
    )
    assert result["mode"] == "READ_ONLY_ONESHOT"
    assert result["byScreenCounts"] == {"print": 1, "laser": 1}
    assert result["distinctOrdersInFetchedPages"] == 2
    assert result["filesWritten"] is False
    assert result["businessWrites"] is False
    assert result["deviceExecution"] is False
    assert "rows" not in result
    assert opener.calls == ["print", "laser"]

    try:
        read_trendosshop_once(
            "SYNTHETIC_WRONG_SERVICE_TOKEN_0123456789_ABCDEFG",
            enabled=True, owner_authorized=True,
            opener=VerifiedLoopbackOnlyOpener()
        )
    except TrendosShopReadError as exc:
        assert str(exc) == "SERVER34_HTTP_DENIED"
    else:
        raise AssertionError("bad bearer should be rejected by local Worker")

    # SERVER-73: exercise the actual dormant CLI's two independent approval
    # gates against the existing loopback-only opener. This authorizes ZERO
    # real operations: fixture token, injected transport, synthetic D1 only.
    cli_opener = VerifiedLoopbackOnlyOpener()
    def cli_reader(token, *, enabled, owner_authorized):
        return read_trendosshop_once(
            token, enabled=enabled, owner_authorized=owner_authorized,
            opener=cli_opener
        )
    cli_fixture = {
        "TRENDOSSHOP_SERVER69_CANARY_ENABLED": "true",
        "TRENDOSSHOP_SERVER69_OWNER_APPROVED": "true",
        "TRENDOSSHOP_READER_BEARER": FAKE_TOKEN,
    }
    try:
        run_canary_once(["--canary-read"], environ=cli_fixture, reader=cli_reader)
    except CanaryDisabled:
        pass
    else:
        raise AssertionError("single CLI gate unexpectedly permitted reader")
    assert cli_opener.calls == [], "disabled CLI must never perform HTTP"
    cli_result = run_canary_once(
        ["--canary-read", "--owner-authorized"],
        environ=cli_fixture, reader=cli_reader
    )
    assert cli_result["byScreenCounts"] == {"print": 1, "laser": 1}
    assert cli_result["distinctOrdersInFetchedPages"] == 2
    assert cli_result["deviceExecution"] is False
    assert cli_result["filesWritten"] is False
    assert cli_result["businessWrites"] is False
    assert "rows" not in cli_result and "customerPhone" not in cli_result
    assert cli_opener.calls == ["print", "laser"]
    print("SERVER73_CLI_REAL_LOCAL_WORKER=PASS; TWO_EXPLICIT_GATES=PASS; "
          "COUNTS_ONLY=PASS; NO_REMOTE_CLOUDFLARE=TRUE; NO_PHYSICAL_UBUNTU=TRUE")

    # SERVER-77: existing service reader -> actual local Workerd -> safe in-memory
    # print/laser employee handoff, with no remote customer or device access.
    dispatch_transport = VerifiedLoopbackOnlyOpener()
    try:
        read_trendosshop_dispatch_preview_once(FAKE_TOKEN, opener=dispatch_transport)
    except TrendosShopReadError as exc:
        assert str(exc) == "SERVER34_LIVE_READ_DISABLED"
    else:
        raise AssertionError("SERVER77_PREVIEW_DEFAULT_OFF_MISSING")
    assert dispatch_transport.calls == [], "denied preview must cause zero HTTP"
    dispatch = read_trendosshop_dispatch_preview_once(
        FAKE_TOKEN, enabled=True, owner_authorized=True,
        opener=dispatch_transport
    )
    assert dispatch["mode"] == "IN_MEMORY_REVIEW_ONLY"
    assert dispatch["lineCount"] == 2
    assert dispatch["byScreen"] == {"print": 1, "laser": 1}
    assert len(dispatch["tasks"]) == 2
    assert all(task["readyForMachine"] is False for task in dispatch["tasks"])
    assert all(task["assetApprovalVerified"] is False for task in dispatch["tasks"])
    assert dispatch_transport.calls == ["print", "laser"]
    assert dispatch["folderWrites"] is False
    assert dispatch["platformBusinessWrites"] is False
    assert dispatch["assetBytesDownloaded"] is False
    assert dispatch["printerCommands"] is False
    assert dispatch["laserCommands"] is False
    print("SERVER77_REAL_LOCAL_DISPATCH_PREVIEW=PASS; PRINT_LASER_LINE_TASKS=2; "
          "WORKER_DATA_SYNTHETIC=YES; FILE_AND_DEVICES_OFF=YES")

    print("SERVER69_PYTHON_UBUNTU_CONTRACT=PASS; REAL_LOCAL_WORKER=PASS; "
          "RESPONSE_MINIMAL=PASS; ZERO_LOCAL_FILE_WRITES=TRUE; "
          "CLOUDFLARE_REMOTE=NO; UBUNTU_DEVICE=NO")

if __name__ == "__main__":
    main()
