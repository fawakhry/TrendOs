"""Entry656: fixed public GET-only runtime health, sanitized output, NO_GO.

No Authorization headers, credential input, POST, Cloudflare management APIs,
customer/order GETs, production writes, raw-body logs, or Google requests.
"""
import json
import re
import subprocess
import sys

BASE = "https://trendos-d1-api.trendmall-contact.workers.dev"
FRONT = "https://trendos-ui.trendmall-contact.workers.dev/config.js"
PATHS = {
    "auth": "/v1/employee/auth/health",
    "bridge": "/v1/employee/legacy-action/health",
    "ops": "/v1/employee/ops/health",
    "core": "/v1/employee/core/health",
    "content": "/v1/employee/content/health",
    "comms": "/v1/employee/comms/health",
    "accounting": "/v1/employee/accounting/health",
    "customers": "/v1/t12/customers/write/health",
}
MODES = {"auth": "NATIVE", "ops": "GENERAL", "core": "GENERAL",
         "content": "READONLY", "comms": "READONLY",
         "accounting": "READONLY", "customers": "GENERAL"}


class PublicHealthHttpError(Exception):
    def __init__(self, status):
        super().__init__("public GET failed")
        self.status = status


def get_public(path_or_url):
    url = path_or_url if path_or_url == FRONT else BASE + path_or_url
    if url != FRONT and not url.startswith(BASE + "/v1/"):
        raise ValueError("host/path not allowlisted")
    # Curl matches the transport already used by historical CI qualification.
    # No redirects, only HTTPS, GET, bounded size/time; no credentials or body logs.
    cmd = ["curl", "--silent", "--show-error", "--max-time", "12",
           "--max-redirs", "0", "--proto", "=https", "--request", "GET",
           "--max-filesize", "65536", "--write-out", "\\nENTRY656_HTTP_STATUS:%{http_code}", url]
    done = subprocess.run(cmd, capture_output=True, text=True, timeout=15, check=False)
    if "ENTRY656_HTTP_STATUS:" not in done.stdout:
        raise ValueError("public GET transport failed")
    payload, status = done.stdout.rsplit("\\nENTRY656_HTTP_STATUS:", 1)
    status = status.strip()
    if done.returncode != 0 or status != "200":
        raise PublicHealthHttpError(status if status.isdigit() else "UNKNOWN")
    if len(payload.encode("utf-8")) > 65536:
        raise ValueError("oversized response")
    return payload

def assess(snapshots, frontend):
    reasons = []
    for name in PATHS:
        value = snapshots.get(name)
        if not isinstance(value, dict) or value.get("success") is not True:
            reasons.append(name + ":MISSING_OR_UNHEALTHY")
            continue
        if name in MODES and value.get("mode") != MODES[name]:
            reasons.append(name + ":UNEXPECTED_MODE")
        if name in ("ops", "core", "content", "comms", "accounting", "customers"):
            if value.get("schemaReady") is not True:
                reasons.append(name + ":SCHEMA_UNVERIFIED")
    auth = snapshots.get("auth") or {}
    if isinstance(auth, dict) and auth.get("success") is True:
        if auth.get("nativeOnly") is not True or auth.get("envEnabled") is not True:
            reasons.append("auth:NATIVE_ONLY_NOT_PROVED")
        if auth.get("legacyBootstrapEnabled") is not False or auth.get("legacySessionEnrollEnabled") is not False:
            reasons.append("auth:LEGACY_ENROLLMENT_RESIDUE")
        if auth.get("plaintextStored") is not False:
            reasons.append("auth:PASSWORD_HYGIENE_NOT_PROVED")
        users = auth.get("userCount")
        ready = auth.get("nativeReadyCount")
        if (type(users) is not int or type(ready) is not int or users < 1 or ready != users):
            reasons.append("auth:USER_READINESS_UNVERIFIED")
    bridge = snapshots.get("bridge") or {}
    if isinstance(bridge, dict) and bridge.get("success") is True:
        if bridge.get("enabled") is not False:
            reasons.append("bridge:LEGACY_EMPLOYEE_BRIDGE_ENABLED")
        if bridge.get("rawNativeTokenForwarded") is not False or bridge.get("plaintextPasswordForwarded") is not False:
            reasons.append("bridge:CREDENTIAL_BOUNDARY_UNVERIFIED")
    if not re.search(r"window\.MATBAGY_EMPLOYEE_NATIVE_AUTH_V1\s*=\s*true\s*;", frontend):
        reasons.append("frontend:NATIVE_AUTH_FLAG_UNVERIFIED")
    if not re.search(r"window\.MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1\s*=\s*false\s*;", frontend):
        reasons.append("frontend:LEGACY_BRIDGE_FLAG_UNVERIFIED")
    # Public health never proves deployed source parity, customer-login native
    # authorization, elimination of Google order reads/files, or global GO.
    return {"observed": len(snapshots),
            "modes": {name: str(snapshots.get(name, {}).get("mode", "UNKNOWN"))
                      for name in MODES},
            "authUserCount": auth.get("userCount") if type(auth.get("userCount")) is int else None,
            "nativeReadyCount": auth.get("nativeReadyCount") if type(auth.get("nativeReadyCount")) is int else None,
            "reasons": sorted(set(reasons)),
            "healthGate": "PASS" if not reasons else "BLOCKED",
            "zeroGoogleComplete": False,
            "productionMutation": False}


def main():
    snapshots = {}
    blockers = []
    for name, path in PATHS.items():
        try:
            snapshots[name] = json.loads(get_public(path))
            if not isinstance(snapshots[name], dict):
                snapshots[name] = {}
                blockers.append(name + ":INVALID_JSON_OBJECT")
        except PublicHealthHttpError as err:
            snapshots[name] = {}
            blockers.append(name + ":HTTP_" + str(err.status))
        except Exception:
            snapshots[name] = {}
            blockers.append(name + ":PUBLIC_GET_UNAVAILABLE")
    try:
        frontend = get_public(FRONT)
    except PublicHealthHttpError as err:
        frontend = ""
        blockers.append("frontend:HTTP_" + str(err.status))
    except Exception:
        frontend = ""
        blockers.append("frontend:PUBLIC_GET_UNAVAILABLE")
    output = assess(snapshots, frontend)
    output["reasons"] = sorted(set(output["reasons"] + blockers))
    output["healthGate"] = "PASS" if not output["reasons"] else "BLOCKED"
    for name in MODES:
        print("ENTRY656_" + name.upper() + "_MODE=" + output["modes"][name])
    print("ENTRY656_NATIVE_USER_COUNT=" + str(output["authUserCount"]))
    print("ENTRY656_NATIVE_READY_COUNT=" + str(output["nativeReadyCount"]))
    print("ENTRY656_PUBLIC_HEALTH_GATE=" + output["healthGate"])
    for reason in output["reasons"]:
        print("ENTRY656_BLOCKER=" + reason)
    print("ENTRY656_ZERO_GOOGLE_COMPLETE=NO")
    print("ENTRY656_PRODUCTION_MUTATION=NO")
    return 0 if not output["reasons"] else 1


if __name__ == "__main__":
    sys.exit(main())
