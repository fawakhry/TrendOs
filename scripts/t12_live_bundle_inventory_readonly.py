"""Inspect Worker source/build parity and schema metadata without business writes.

Only the sanitized report is suitable for an Actions artifact. Live modules,
binding values, customer records and recovery bookmarks must never be uploaded.
"""
import hashlib
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone
from email.parser import BytesParser
from email.policy import default
from pathlib import Path


def normalized(data):
    return data.replace(b"\r\n", b"\n").rstrip() + b"\n"


def fingerprint(data):
    data = normalized(data)
    return {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def inventory(data):
    """Extract compiler module markers and identifiers, never string literals."""
    text = normalized(data).decode("utf-8", errors="strict")
    modules = re.findall(r"^// ([A-Za-z0-9_./@-]+\.(?:mjs|js|ts))$", text, re.M)
    functions = re.findall(r"\bfunction\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\(", text)
    return {**fingerprint(data), "modules": sorted(set(modules)),
            "functions": sorted(set(functions)), "nameWrapperCount": text.count("__name(")}


def extract_modules(content_type, raw):
    """Retain all JS modules; never assume that the largest module is the entry."""
    if "multipart/" not in content_type.lower():
        if "javascript" not in content_type.lower():
            raise ValueError("WORKER_SOURCE_NOT_JAVASCRIPT_OR_MULTIPART")
        return {"single-response-module.js": raw}, None
    msg = BytesParser(policy=default).parsebytes(
        ("Content-Type: " + content_type + "\r\nMIME-Version: 1.0\r\n\r\n").encode() + raw)
    modules, main = {}, None
    for part in msg.iter_parts():
        data = part.get_payload(decode=True) or b""
        filename = part.get_filename() or part.get_param("name", header="content-disposition") or ""
        if filename == "metadata":
            metadata = json.loads(data)
            main = metadata.get("main_module") or metadata.get("body_part")
            continue
        if "javascript" in part.get_content_type() or filename.endswith((".js", ".mjs")):
            if not re.fullmatch(r"[A-Za-z0-9_./@-]+", filename) or filename in modules:
                raise ValueError("UNSAFE_OR_DUPLICATE_MODULE_NAME")
            modules[filename] = data
    if not modules:
        raise ValueError("NO_WORKER_MODULES")
    return modules, main


def main():
    token = os.environ.get("CLOUDFLARE_API_TOKEN", "")
    account = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "")
    if not token or not re.fullmatch(r"[a-fA-F0-9]{32}", account):
        raise ValueError("CLOUDFLARE_BINDING_REQUIRED")
    worker = "trendos-d1-api"
    api = f"https://api.cloudflare.com/client/v4/accounts/{account}"

    def request(path, payload=None):
        # This helper permits only GETs, plus the single SELECT-only D1 query.
        if payload is not None:
            sql = payload.get("sql", "")
            if not path.endswith("/query") or not re.match(r"^\s*SELECT\b", sql, re.I):
                raise ValueError("NON_READONLY_OPERATION_REFUSED")
            if re.search(r"\b(INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|REPLACE|PRAGMA|ATTACH)\b", sql, re.I) or ";" in sql:
                raise ValueError("NON_READONLY_SQL_REFUSED")
        req = urllib.request.Request(api + path, data=None if payload is None else json.dumps(payload).encode(),
            headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
            method="GET" if payload is None else "POST")
        with urllib.request.urlopen(req, timeout=40) as response:
            return response.headers, response.read()

    def cf_json(path, payload=None):
        _, raw = request(path, payload)
        data = json.loads(raw)
        if data.get("success") is not True:
            raise ValueError("CLOUDFLARE_READ_FAILED")
        return data["result"]

    def active():
        data = cf_json(f"/workers/scripts/{worker}/deployments")
        ds = data.get("deployments", []) if isinstance(data, dict) else data
        ds = sorted(ds, key=lambda x: x.get("created_on", ""), reverse=True)
        if not ds:
            raise ValueError("NO_DEPLOYMENT")
        versions = ds[0].get("versions", [])
        full = [v for v in versions if v.get("percentage") == 100]
        if len(full) != 1 or len(versions) != 1:
            raise ValueError("NOT_SINGLE_100_PERCENT_VERSION")
        return {"deploymentId": ds[0]["id"], "versionId": full[0]["version_id"],
                "createdOn": ds[0].get("created_on")}

    report = {"checkedAtUTC": datetime.now(timezone.utc).isoformat(),
              "sourceHead": os.environ.get("GITHUB_SHA"), "state": "BLOCKED_SAFE",
              "deploy": False, "productionBusinessWrite": False}
    before = active()
    report["before"] = before
    version = cf_json(f"/workers/scripts/{worker}/versions/{before['versionId']}")
    report["versionMetadata"] = {"number": version.get("number"),
        "createdOn": version.get("metadata", {}).get("created_on"),
        "source": version.get("metadata", {}).get("source"),
        "scriptEtag": version.get("resources", {}).get("script", {}).get("etag")}
    headers, raw = request(f"/workers/scripts/{worker}/content/v2")
    modules, main_module = extract_modules(headers.get("Content-Type", ""), raw)
    header_entry = headers.get("cf-entrypoint")
    if header_entry in modules:
        main_module = header_entry
    if not main_module and len(modules) == 1:
        main_module = next(iter(modules))
    report["mainModule"] = main_module
    report["liveModules"] = {name: inventory(buf) for name, buf in modules.items()}
    builds = {}
    for path in sorted(Path("/tmp/t12-inventory-builds").glob("**/*.js")):
        key = str(path.relative_to("/tmp/t12-inventory-builds"))
        builds[key] = inventory(path.read_bytes())
    report["builds"] = builds
    if main_module in modules:
        live = report["liveModules"][main_module]
        report["comparisons"] = {}
        for name, build in builds.items():
            report["comparisons"][name] = {
                "exactByteMatch": live["sha256"] == build["sha256"],
                "liveOnlyModules": sorted(set(live["modules"]) - set(build["modules"])),
                "buildOnlyModules": sorted(set(build["modules"]) - set(live["modules"])),
                "liveOnlyFunctions": sorted(set(live["functions"]) - set(build["functions"])),
                "buildOnlyFunctions": sorted(set(build["functions"]) - set(live["functions"]))}
    else:
        report["entrySelection"] = "AMBIGUOUS_FAIL_CLOSED"
    db = "5c4b92bf-e043-4f6e-bd6d-d514a92cd825"
    queries = {
        "claimTable": "SELECT name,sql FROM sqlite_master WHERE type='table' AND name='t12_prod_customer_lane_claim'",
        "claimIndex": "SELECT name,sql FROM sqlite_master WHERE type='index' AND tbl_name='t12_prod_customer_lane_claim'",
        "laneClaimMigration": "SELECT name FROM d1_migrations WHERE name='0012_t12_customer_lane_claim.sql'",
        "legacyCatalog": "SELECT status,synced_at,row_count,source_last_row FROM sheet_catalog WHERE sheet_name='بنود الأوردرات'",
        "nativeCounts": "SELECT (SELECT COUNT(*) FROM t12_prod_orders) AS orders,(SELECT COUNT(*) FROM t12_prod_lines) AS lines,(SELECT COUNT(*) FROM t12_legacy_line_runtime) AS legacyOverlayRows",
        "sharedCustomerPhoneGroups": "SELECT COUNT(*) AS groupsWithDistinctNames FROM (SELECT phone FROM t12_customers WHERE active=1 AND phone<>'' GROUP BY phone HAVING COUNT(DISTINCT customer_name_key)>1)",
        "legacyRawRiskCounts": "SELECT SUM(CASE WHEN json_extract(display_json,'$[4]')='مكبس' THEN 1 ELSE 0 END) AS rawPressDepartmentRows,SUM(CASE WHEN json_extract(display_json,'$[16]') GLOB '*[٠-٩]*' THEN 1 ELSE 0 END) AS rawArabicPhoneRows FROM sheet_rows WHERE sheet_name='بنود الأوردرات' AND row_number>1",
    }
    report["d1"] = {}
    for name, sql in queries.items():
        try:
            result = cf_json(f"/d1/database/{db}/query", {"sql": sql})
            report["d1"][name] = [x.get("results", []) for x in result]
        except Exception as error:
            # No raw errors / response bodies: they may contain operational data.
            report["d1"][name] = {"state": "READ_UNVERIFIED", "errorType": type(error).__name__}
    report["after"] = active()
    bookmark_file = Path("/tmp/t12-private-recovery.json")
    if bookmark_file.exists():
        recovery = json.loads(bookmark_file.read_text())
        report["recoveryBookmarkAvailable"] = bool(recovery.get("bookmark") or recovery.get("result", {}).get("bookmark"))
        # The bookmark itself stays private and is not part of the artifact.
        bookmark_file.unlink()
    report["stableDeployment"] = before == report["after"]
    Path("/tmp/t12-inventory-report.json").write_text(json.dumps(report, indent=2))
    print("LIVE_MODULE_COUNT=" + str(len(modules)))
    print("DEPLOYMENT_STABLE=" + str(report["stableDeployment"]))
    print("EXACT_MATCHES=" + json.dumps([name for name, r in report.get("comparisons", {}).items() if r["exactByteMatch"]]))
    print("INVENTORY_REPORT_WRITTEN=SANITIZED_METADATA_ONLY")
    print("DEPLOY=NO; PRODUCTION_BUSINESS_WRITE=NO; CUSTOMER_EXPORT=NO")
    if not report["stableDeployment"] or main_module not in modules:
        raise ValueError("LIVE_DEPLOYMENT_DRIFT_OR_AMBIGUOUS_ENTRY")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("READONLY_INVENTORY_FAILED=" + type(error).__name__, file=sys.stderr)
        sys.exit(1)
