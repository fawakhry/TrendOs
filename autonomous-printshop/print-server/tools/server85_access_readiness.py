"""SERVER-85: audit Access/zone privileges before exposing isolated stage.

GET-only. Redacted booleans, no domains, identities, policies, tokens or rows
printed. Cloudflare Access presence never proves private route or authority.
"""
import json
import os
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, build_opener, HTTPSHandler, HTTPRedirectHandler, ProxyHandler

STAGE = "trendos-server68-isolated-stage"
VERSION = "d1a19c15-b745-405f-a926-38148eb12688"
DB_NAME = "trendos-server82-synthetic-20261021"
BASE = "https://api.cloudflare.com/client/v4"
ALLOWED = {
    "stage_deploy": lambda a: f"/accounts/{a}/workers/scripts/{STAGE}/deployments",
    "stage_settings": lambda a: f"/accounts/{a}/workers/scripts/{STAGE}/settings",
    "stage_subdomain": lambda a: f"/accounts/{a}/workers/scripts/{STAGE}/subdomain",
    "access_apps": lambda a: f"/accounts/{a}/access/apps?page=1&per_page=100",
    "account_zones": lambda a: f"/zones?account.id={a}&page=1&per_page=100",
}


class RefuseRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class CloudflareGet:
    def __init__(self, account, token, opener=None):
        if type(account) is not str or not re.fullmatch(r"[a-fA-F0-9]{32}", account):
            raise ValueError("SERVER85_INVALID_ACCOUNT")
        if type(token) is not str or len(token) < 16:
            raise ValueError("SERVER85_INVALID_TOKEN")
        self.account = account
        self.token = token
        self.opener = opener or build_opener(
            ProxyHandler({}), HTTPSHandler(), RefuseRedirect())

    def get(self, key):
        if key not in ALLOWED:
            raise ValueError("SERVER85_FORBIDDEN_API")
        path = ALLOWED[key](self.account)
        req = Request(BASE + path, method="GET", headers={
            "Authorization": "Bearer " + self.token,
            "Accept": "application/json",
        })
        try:
            with self.opener.open(req, timeout=15) as response:
                raw = response.read(262145)
                if response.status != 200 or len(raw) > 262144:
                    return {"ok": False, "status": "BAD_RESPONSE"}
        except HTTPError as exc:
            c = exc.code
            exc.close()
            return {"ok": False, "status": (
                "AUTH_DENIED" if c in (401, 403) else
                "NOT_FOUND" if c == 404 else "UNEXPECTED_HTTP"
            )}
        except (URLError, OSError, TimeoutError):
            return {"ok": False, "status": "NETWORK_UNVERIFIED"}
        try:
            packet = json.loads(raw)
            if type(packet) is not dict or packet.get("success") is not True:
                return {"ok": False, "status": "UNQUALIFIED_RESULT"}
            return {"ok": True, "result": packet.get("result"),
                    "info": packet.get("result_info")}
        except (ValueError, TypeError):
            return {"ok": False, "status": "NON_JSON_RESPONSE"}


def inspect(api):
    stage = {}
    for key in ("stage_deploy", "stage_settings", "stage_subdomain"):
        response = api.get(key)
        if not response.get("ok"):
            stage[key] = {"verified": False, "status": response.get("status", "UNKNOWN")}
        elif key == "stage_deploy":
            deps = response["result"].get("deployments") if type(response["result"]) is dict else None
            versions = deps[0].get("versions", []) if type(deps) is list and deps and type(deps[0]) is dict else []
            exact = (len(versions) == 1 and type(versions[0]) is dict and
                     versions[0].get("version_id") == VERSION and
                     versions[0].get("percentage") == 100)
            stage[key] = {"verified": exact, "pinnedLiveVersion": exact}
        elif key == "stage_settings":
            bindings = response["result"].get("bindings") if type(response["result"]) is dict else None
            if type(bindings) is not list:
                stage[key] = {"verified": False, "status": "BINDINGS_UNVERIFIED"}
            else:
                names = {r.get("name"): r for r in bindings if type(r) is dict}
                d1 = names.get("DB", {})
                stage[key] = {
                    "verified": True,
                    "d1BindingPresent": d1.get("type") == "d1",
                    "readerOff": names.get("TRENDOSSHOP_SERVICE_READ_ENABLED", {}).get("text") == "false",
                    "mirrorOff": names.get("MIRROR_SERVICE_READ_ENABLED", {}).get("text") == "false",
                    "readerSecretAbsent": "TRENDOSSHOP_READER_TOKEN_SHA256_HEX" not in names,
                }
        else:
            pub = response["result"]
            valid = type(pub) is dict and type(pub.get("enabled")) is bool and type(pub.get("previews_enabled")) is bool
            stage[key] = {"verified": valid,
                          "workersDevOff": valid and pub["enabled"] is False,
                          "previewUrlsOff": valid and pub["previews_enabled"] is False}
    external = {}
    for key in ("access_apps", "account_zones"):
        response = api.get(key)
        if not response.get("ok"):
            external[key] = {"verified": False, "status": response.get("status", "UNKNOWN")}
            continue
        items = response["result"]
        pagination = response.get("info")
        if type(items) is not list:
            external[key] = {"verified": False, "status": "LIST_SHAPE_UNVERIFIED"}
            continue
        page_complete = len(items) < 100
        if pagination is not None and type(pagination) is dict:
            pages = pagination.get("total_pages")
            if type(pages) is int and pages > 1:
                page_complete = False
        # We DON'T claim a policy protects the stage based on an app name.
        if key == "access_apps":
            stage_matches = 0
            for app in items:
                if type(app) is dict and app.get("type") in ("worker", "self_hosted"):
                    names = (str(app.get("name") or ""), str(app.get("domain") or ""))
                    if any(STAGE in n for n in names):
                        stage_matches += 1
            external[key] = {
                "verified": True,
                "firstPageComplete": page_complete,
                "stageNamedApplicationCount": stage_matches,
                "accessPolicyEffectVerified": False,
                "existingAppsNotDisclosed": True,
            }
        else:
            external[key] = {
                "verified": True,
                "firstPageComplete": page_complete,
                "accountHasZone": len(items) > 0,
                "zoneNamesNotDisclosed": True,
            }
    can_stage_inbound = all((
        stage.get("stage_deploy", {}).get("verified") is True,
        stage.get("stage_settings", {}).get("d1BindingPresent") is True,
        stage.get("stage_settings", {}).get("readerOff") is True,
        stage.get("stage_settings", {}).get("readerSecretAbsent") is True,
        stage.get("stage_subdomain", {}).get("workersDevOff") is True,
        stage.get("stage_subdomain", {}).get("previewUrlsOff") is True,
    ))
    return {
        "schema": "trendos.server85.access-private-route-readiness.v1",
        "scope": "CLOUDFLARE_METADATA_GET_ONLY",
        "stage": stage,
        "externalPrerequisites": external,
        "currentStageSafeOffline": can_stage_inbound,
        "privateAccessPolicyVerified": False,
        "privateHostnameRouteVerified": False,
        "shortLivedMachineCredentialIssued": False,
        "realUbuntuNetworkSessionVerified": False,
        "sourceGitShaToLiveVersionProven": False,
        "productionOrdersRead": False,
        "cloudflareWrites": False,
        "d01D06Release": "NO_GO",
    }


def main(args=None, env=None):
    argv = sys.argv[1:] if args is None else args
    cfg = os.environ if env is None else env
    if argv != ["--metadata-get-only"]:
        print("SERVER85_EXPLICIT_GET_ONLY_REQUIRED")
        return 64
    if cfg.get("SERVER85_METADATA_READ_ALLOW") != "true":
        print("SERVER85_METADATA_READ_NOT_ENABLED")
        return 2
    try:
        api = CloudflareGet(cfg.get("CLOUDFLARE_ACCOUNT_ID", ""),
                            cfg.get("CLOUDFLARE_API_TOKEN", ""))
        report = inspect(api)
        print("SERVER85_REDACTED_REPORT=" + json.dumps(
            report, sort_keys=True, separators=(",", ":")))
        return 0
    except (ValueError, TypeError):
        print("SERVER85_PRECONDITION_FAILED")
        return 3


if __name__ == "__main__":
    raise SystemExit(main())
