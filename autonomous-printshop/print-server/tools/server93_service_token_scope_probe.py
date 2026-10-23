"""SERVER-93 GET-only Access Service Token permission probe; no token creation.

This is a permissions check, not proof of a usable Ubuntu identity.
Never print Client ID, Client Secret, token lists, names, account ID, or raw errors.
"""
import json
import os
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, build_opener, HTTPSHandler, HTTPRedirectHandler, ProxyHandler

STAGE = "trendos-server68-isolated-stage"

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

class Blocked(Exception):
    pass

def get_status(account, token, opener=None):
    if not re.fullmatch(r"[a-fA-F0-9]{32}", account or "") or not isinstance(token, str) or len(token) < 16:
        raise Blocked("SERVER93_CREDENTIAL_NOT_AVAILABLE")
    url = ("https://api.cloudflare.com/client/v4/accounts/" + account +
           "/access/service_tokens?page=1&per_page=100")
    req = Request(url, method="GET", headers={
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
    })
    transport = opener or build_opener(ProxyHandler({}), HTTPSHandler(), NoRedirect())
    try:
        with transport.open(req, timeout=15) as response:
            data = response.read(131073)
            if response.status != 200 or len(data) > 131072:
                raise Blocked("SERVER93_HTTP_RESPONSE_UNVERIFIED")
    except HTTPError as exc:
        code = exc.code
        exc.close()
        return {
            "schema": "trendos.server93.service-token-scope-probe.v1",
            "readServiceTokenInventory": "PERMISSION_NOT_VERIFIED" if code in (401,403) else "API_UNEXPECTED_STATUS",
            "missingReadPrivilegeLikely": code in (401,403),
            "existingServiceTokenNamesAndSecretsNotPrinted": True,
            "machineServiceTokenCreated": False,
            "ubuntuHostConnected": False,
            "liveAccessPolicyChanged": False,
            "productionWorkerOrD1Touched": False,
            "stageGo": False,
        }
    except (URLError, OSError, TimeoutError):
        raise Blocked("SERVER93_GET_UNREACHABLE") from None
    try:
        result = json.loads(data)
    except (ValueError, TypeError):
        raise Blocked("SERVER93_JSON_UNVERIFIED") from None
    if not isinstance(result, dict) or result.get("success") is not True:
        raise Blocked("SERVER93_API_RESULT_UNVERIFIED")
    rows = result.get("result")
    if not isinstance(rows, list) or len(rows) >= 100 or not all(isinstance(x, dict) for x in rows):
        raise Blocked("SERVER93_SERVICE_TOKENS_PAGE_INCOMPLETE_OR_INVALID")
    pages = result.get("result_info", {}).get("total_pages") if isinstance(result.get("result_info"), dict) else None
    if pages is not None and (not isinstance(pages, int) or pages != 1):
        raise Blocked("SERVER93_SERVICE_TOKENS_PAGINATION_INCOMPLETE")
    return {
        "schema": "trendos.server93.service-token-scope-probe.v1",
        "readServiceTokenInventory": "GET_OK",
        "missingReadPrivilegeLikely": False,
        "serviceTokenMetadataVisible": True,
        "existingServiceTokenNamesAndSecretsNotPrinted": True,
        "machineServiceTokenCreated": False,
        "newServiceTokenWritePermissionProven": False,
        "ubuntuHostConnected": False,
        "liveAccessPolicyChanged": False,
        "productionWorkerOrD1Touched": False,
        "stageGo": False,
    }

def main(args=None, env=None):
    argv = sys.argv[1:] if args is None else args
    settings = os.environ if env is None else env
    if argv != ["--get-only"]:
        print("SERVER93_GET_ONLY_FLAG_REQUIRED")
        return 64
    if settings.get("SERVER93_METADATA_READ_ALLOWED") != "true":
        print("SERVER93_PERMISSION_AUDIT_NOT_AUTHORIZED")
        return 2
    try:
        report = get_status(settings.get("CLOUDFLARE_ACCOUNT_ID", ""),
                            settings.get("CLOUDFLARE_ACCESS_API_TOKEN", ""))
        print("SERVER93_SAFE_RESULT=" + json.dumps(report, sort_keys=True, separators=(",", ":")))
        return 0
    except Blocked as err:
        print(str(err) if str(err).startswith("SERVER93_") else "SERVER93_UNKNOWN", file=sys.stderr)
        return 2

if __name__ == "__main__":
    raise SystemExit(main())
