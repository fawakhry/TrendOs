"""SERVER-78: ONE read-only Cloudflare reality check for D01..D06.

Only deployed Worker metadata, Worker code marker booleans, Worker settings
binding TYPES/NAMES and Workers.dev subdomain publication booleans. No customer/order/D1/R2 reads, script writes/deploys,
Ubuntu access or credential printing. This is never a six-gate approval.
Requires an explicit CLI flag and an environment runtime interlock.
"""
from __future__ import annotations

import json
import os
import re
import ssl
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import (
    Request, build_opener, HTTPSHandler, HTTPRedirectHandler, ProxyHandler,
)

_API = "https://api.cloudflare.com/client/v4/accounts/"
_WORKERS = (
    "trendos", "trendos-d1-api", "trendos-d1-staging",
    "trendos-server68-isolated-stage",
)
_MARKERS = {
    "ordersPageSource": b"/v1/edge/orders/02cr/page",
    "ordersServiceSource": b"/v1/edge/orders/service/page",
    "customersSearchSource": b"/v1/edge/customers/search",
    "ubuntuServiceReaderSource": b"/v1/printshop/service/orders/page",
    "mirrorSignedSource": b"/v1/service/mirror/stats",
}
_GATE_IDS = ("D01", "D02", "D03", "D04", "D05", "D06")
_FLAGS = ("TRENDOSSHOP_SERVICE_READ_ENABLED",)
_BINDING_NAMES = ("DB", "TRENDOSSHOP_READER_TOKEN_SHA256_HEX",
                  "TRENDOSSHOP_READER_PRINCIPAL", "MIRROR_SERVICE_READ_REPLAY_DO")
_MAX_JSON = 256 * 1024
_MAX_CODE = 8 * 1024 * 1024


class DenyRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class RemoteEvidenceError(Exception):
    pass


def _api_get(opener, token, account, worker, suffix, *, byte_limit):
    version_read = (worker in ("trendos", "trendos-d1-api")
                    and re.fullmatch(r"/versions/[a-fA-F0-9-]{36}", suffix) is not None)
    if worker not in _WORKERS or (suffix not in ("/deployments", "/content/v2", "/settings", "/subdomain")
                                    and not version_read):
        raise RemoteEvidenceError("UNEXPECTED_WORKER_OR_API_PATH")
    if not re.fullmatch(r"[a-fA-F0-9]{32}", account):
        raise RemoteEvidenceError("INVALID_ACCOUNT_SCOPE")
    # Never redirect bearer authorization outside api.cloudflare.com.
    path = _API + account + "/workers/scripts/" + worker + suffix
    req = Request(path, method="GET", headers={
        "Authorization": "Bearer " + token,
        "Accept": "*/*" if suffix == "/content/v2" else "application/json",
    })
    try:
        with opener.open(req, timeout=15) as response:
            if response.status != 200:
                return {"verified": False, "reason": "HTTP_NON_200"}
            buf = response.read(byte_limit + 1)
            if len(buf) > byte_limit:
                return {"verified": False, "reason": "RESPONSE_TOO_LARGE"}
            if suffix == "/content/v2":
                return {"verified": True, "code": buf}
            obj = json.loads(buf)
            if (type(obj) is not dict or obj.get("success") is not True
                    or type(obj.get("result")) is not dict):
                return {"verified": False, "reason": "API_RESULT_UNVERIFIED"}
            return {"verified": True, "result": obj["result"]}
    except HTTPError as exc:
        code = exc.code
        exc.close()
        return {"verified": False, "reason": (
            "NOT_FOUND" if code == 404 else "AUTH_DENIED"
            if code in (401, 403) else "HTTP_OTHER"
        )}
    except (URLError, OSError, TimeoutError, ValueError):
        return {"verified": False, "reason": "REMOTE_READ_FAILED"}


def _deployments(data):
    if not data.get("verified"):
        return {"verified": False, "reason": data.get("reason", "UNVERIFIED")}
    items = data["result"].get("deployments")
    if not isinstance(items, list) or not items or type(items[0]) is not dict:
        return {"verified": False, "reason": "DEPLOYMENT_SHAPE_UNVERIFIED"}
    top = items[0]
    versions = top.get("versions", [])
    if not isinstance(versions, list):
        versions = []
    v = [
        {"activeAt100Percent": i.get("percentage") == 100,
         "versionPrefix": str(i.get("version_id") or "")[:12]}
        for i in versions[:3] if type(i) is dict
    ]
    return {
        "verified": True, "activeVersion100": any(i["activeAt100Percent"] for i in v),
        "versionSummary": v, "createdUtc": str(top.get("created_on") or "")[:24],
        "sourceGitCommitParity": "NOT_PROVEN",
    }


def _active_version_detail(data, expected_id):
    if not data.get("verified"):
        return {"verified": False, "reason": data.get("reason", "UNVERIFIED")}
    result = data["result"]
    if result.get("id") != expected_id:
        return {"verified": False, "reason": "ACTIVE_VERSION_ID_MISMATCH"}
    resources = result.get("resources")
    script = resources.get("script", {}) if type(resources) is dict else {}
    metadata = result.get("metadata")
    source = metadata.get("source") if type(metadata) is dict else None
    etag = script.get("etag") if type(script) is dict else None
    return {
        "verified": True,
        "activeVersionIdentityMatched": True,
        "scriptEtagPrefix": etag[:12] if type(etag) is str and
                            re.fullmatch(r"[a-fA-F0-9]{64}", etag) else "UNAVAILABLE",
        "source": source if source in (
            "api", "wrangler", "dash", "terraform", "cf_cli", "integration",
            "quick_editor", "playground", "workersci", "unknown"
        ) else "UNKNOWN",
        "gitShaParity": "NOT_PROVEN",
    }


def _active_version_id(response):
    if not response.get("verified"):
        return ""
    deployments = response["result"].get("deployments")
    if not isinstance(deployments, list) or not deployments or type(deployments[0]) is not dict:
        return ""
    versions = deployments[0].get("versions")
    if not isinstance(versions, list) or len(versions) != 1 or type(versions[0]) is not dict:
        return ""
    item = versions[0]
    version_id = item.get("version_id")
    if item.get("percentage") != 100 or type(version_id) is not str:
        return ""
    if not re.fullmatch(r"[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}", version_id):
        return ""
    return version_id


def _code(data):
    if not data.get("verified"):
        return {"verified": False, "reason": data.get("reason", "UNVERIFIED")}
    body = data["code"]
    return {
        "verified": True, "bytes": len(body),
        # The Cloudflare content/v2 response may be multipart with a varying
        # boundary. A digest of its raw bytes does NOT prove deployed code drift,
        # so deliberately do not publish a misleading "source SHA".
        "markers": {name: (marker in body) for name, marker in _MARKERS.items()},
        "versionParity": "NOT_PROVEN",  # Script-name code != verified pinned active version.
    }


def _subdomain(data):
    if not data.get("verified"):
        return {"verified": False, "reason": data.get("reason", "UNVERIFIED")}
    result = data["result"]
    enabled = result.get("enabled")
    previews = result.get("previews_enabled")
    if type(enabled) is not bool or type(previews) is not bool:
        return {"verified": False, "reason": "PUBLICATION_FLAGS_UNVERIFIED"}
    return {
        "verified": True,
        "workersDevPublished": enabled,
        "previewUrlsPublished": previews,
        "cloudflareAccessVerified": False,
        "publicDataExposureProven": False,
    }


def _settings(data):
    if not data.get("verified"):
        return {"verified": False, "reason": data.get("reason", "UNVERIFIED")}
    bindings = data["result"].get("bindings")
    if not isinstance(bindings, list):
        return {"verified": False, "reason": "BINDINGS_SHAPE_UNVERIFIED"}
    by_name = {b.get("name"): b for b in bindings
               if type(b) is dict and type(b.get("name")) is str}
    return {
        "verified": True,
        # Never log binding values, secret hashes, D1 IDs or credential data.
        "bindingTypes": {
            name: (str(by_name[name].get("type") or "unknown")
                   if name in by_name else "ABSENT")
            for name in _BINDING_NAMES
        },
        "readerFlagState": {
            name: (
                "ABSENT" if name not in by_name else
                "SECRET_OR_NOT_PLAINTEXT" if by_name[name].get("type") != "plain_text"
                else "EXACT_FALSE" if by_name[name].get("text") == "false"
                else "EXACT_TRUE" if by_name[name].get("text") == "true"
                else "UNKNOWN_VALUE"
            )
            for name in _FLAGS
        },
    }


def _stage_rows(queue, workers):
    # Cloudflare metadata alone never proves D01 private Access, nor a deployed
    # service role, signed HMAC migration, Ubuntu operator or order acceptance.
    by_id = {d["id"]: d for d in queue["decisions"]}
    evidence = {
        "D01": "isolated private Worker+synthetic D1+Access NOT VERIFIED; existing staging not reusable",
        "D02": "isolated rotating stage machine-reader credentials and DO NOT PROVISIONED",
        "D03": "real R5/Apps Script/external legacy consumer cutover NOT VERIFIED",
        "D04": "active production script Git-SHA parity, rollback and window NOT APPROVED",
        "D05": "physical Ubuntu operator/token/read-once NOT EXECUTED",
        "D06": "selected live order/count parity/device-off acceptance NOT EXECUTED",
    }
    flags = workers.get("trendos-d1-api", {}).get("settings", {}).get("readerFlagState", {})
    if flags.get("TRENDOSSHOP_SERVICE_READ_ENABLED") == "EXACT_TRUE":
        evidence["D04"] += "; LIVE READER FLAG TRUE REQUIRES SECURITY INVESTIGATION"
    old_stage = workers.get("trendos-d1-staging", {}).get("publication", {})
    if old_stage.get("verified") and old_stage.get("workersDevPublished") is True:
        evidence["D01"] += "; EXISTING HISTORICAL STAGE WORKERS.DEV PUBLISHED"
    isolated = workers.get("trendos-server68-isolated-stage", {})
    if isolated is not None and isolated.get("deployment", {}).get("reason") == "NOT_FOUND":
        evidence["D01"] += "; REQUIRED ISOLATED WORKER ABSENT"
    stage_pub = (isolated or {}).get("publication", {})
    if stage_pub.get("verified") and stage_pub.get("workersDevPublished") is True:
        evidence["D01"] += "; ISOLATED STAGE WORKERS.DEV PUBLICATION UNSAFE"
    live_pub = workers.get("trendos-d1-api", {}).get("publication", {})
    if live_pub.get("verified") and live_pub.get("workersDevPublished") is True:
        evidence["D04"] += "; LIVE WORKERS.DEV HOST PUBLISHED; ACCESS POLICY UNVERIFIED"
    return [
        {"id": i, "status": "DEFERRED_NO_GO",
         "priorDecisionState": by_id[i]["status"],
         "missing": evidence[i], "liveAccepted": False}
        for i in _GATE_IDS
    ]


def unified_report(queue, opener=None, token="", account="", enabled=False):
    if (type(queue) is not dict or queue.get("schema") !=
            "trendos.server69.review-decision-queue.v1"
            or type(queue.get("decisions")) is not list
            or [x.get("id") for x in queue["decisions"]] != list(_GATE_IDS)
            or not all(x.get("defaultSafe") and x.get("status") != "approved"
                       for x in queue["decisions"])):
        raise RemoteEvidenceError("SOURCE_DECISION_QUEUE_UNVERIFIED")
    # No remote access without BOTH explicit interlocks and well-formed secrets.
    remote = (enabled is True and opener is not None and
              type(token) is str and len(token) >= 16 and
              type(account) is str and
              re.fullmatch(r"[a-fA-F0-9]{32}", account) is not None)
    workers = {}
    if remote:
        for worker in _WORKERS:
            endpoints = ("/deployments", "/content/v2", "/settings", "/subdomain") if worker == "trendos-d1-api" else (
                "/deployments", "/content/v2", "/subdomain") if worker == "trendos" else ("/deployments", "/subdomain")
            detail = {}
            active_version_id = ""
            for suffix in endpoints:
                data = _api_get(opener, token, account, worker, suffix,
                                byte_limit=_MAX_CODE if suffix == "/content/v2" else _MAX_JSON)
                if suffix == "/deployments":
                    active_version_id = _active_version_id(data)
                key = {"/deployments": "deployment", "/content/v2": "code",
                       "/settings": "settings", "/subdomain": "publication"}[suffix]
                detail[key] = {"/deployments": _deployments, "/content/v2": _code,
                               "/settings": _settings, "/subdomain": _subdomain}[suffix](data)
            if worker in ("trendos", "trendos-d1-api"):
                if active_version_id:
                    detail["activeVersion"] = _active_version_detail(
                        _api_get(opener, token, account, worker,
                                 "/versions/" + active_version_id, byte_limit=_MAX_JSON),
                        active_version_id
                    )
                else:
                    detail["activeVersion"] = {
                        "verified": False, "reason": "NO_UNAMBIGUOUS_ACTIVE_VERSION"
                    }
            workers[worker] = detail
    return {
        "schema": "trendos.server78.unified-six-stage-live-reality.v1",
        "reportKind": "CLOUD_METADATA_SOURCE_AUDIT_ONLY",
        "remoteCloudflareApiGetPerformed": bool(remote),
        "scope": "WORKER_DEPLOYMENTS_SCRIPT_CONTENT_BINDING_AND_SUBDOMAIN_METADATA_ONLY",
        "workers": workers,
        "steps": _stage_rows(queue, workers),
        "release": "NO_GO",
        "cloudflareWrites": False, "d1Queries": False,
        "customerOrOrderReads": False, "realUbuntuAccess": False,
        "fileDownloads": False, "printerOrLaserCommands": False,
        "credentialValuesPrinted": False,
        "note": "GitHub CI SUCCESS means report executed, not permission to deploy.",
    }


def main(args=None, environ=None):
    argv = list(sys.argv[1:] if args is None else args)
    env = os.environ if environ is None else environ
    if argv != ["--read-only-cloudflare"]:
        print("SERVER78_REQUIRES_EXPLICIT_READ_ONLY_FLAG")
        return 64
    path = Path("autonomous-printshop/print-server/SERVER69_RELEASE_DECISIONS.json")
    try:
        queue = json.loads(path.read_text(encoding="utf-8"))
        # Secrets are strictly ephemeral to this subprocess.
        token, account = env.get("CLOUDFLARE_API_TOKEN", ""), env.get("CLOUDFLARE_ACCOUNT_ID", "")
        allowed = env.get("SERVER78_ALLOW_CLOUDFLARE_METADATA_READ") == "true"
        opener = (
            build_opener(ProxyHandler({}),
                         HTTPSHandler(context=ssl.create_default_context()),
                         DenyRedirect())
            if allowed else None
        )
        report = unified_report(queue, opener, token, account, enabled=allowed)
    except (ValueError, TypeError, KeyError, RemoteEvidenceError, OSError):
        print("SERVER78_SOURCE_INTEGRITY_FAILURE")
        return 3
    print("SERVER78_UNIFIED_RELEASE_REPORT=" + json.dumps(
        report, separators=(",", ":"), ensure_ascii=True, sort_keys=True))
    return 0  # an informational CI check, NOT approval for release


if __name__ == "__main__":
    sys.exit(main())
