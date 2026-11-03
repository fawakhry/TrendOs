#!/usr/bin/env python3
"""One empty private Stage bucket only. Plan is offline; execute is manual-only.

Reuses the immutable original isolated Worker/D1 resolver. Never modifies
Workers, permissions, tokens, billing, public domains, objects or production.
"""
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.error
import urllib.request

BUCKET = "trendos-customer-stage-private-synthetic-20261103-v0"
SOURCE_SHA = "6b31228887f9073c1aa8c6f2c06597b194f567df"
CONFIRMATION = "CREATE_ONE_EMPTY_PRIVATE_CUSTOMER_STAGE_R2"
CLIENT = "TrendOS-Customer-Stage-Qualification/1.0"
PREFIX = "/r2/buckets"
TARGET = PREFIX + "/" + BUCKET


class Stop(RuntimeError):
    pass


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class StageR2Api:
    def __init__(self, account, token, opener=None):
        if not re.fullmatch(r"[a-fA-F0-9]{32}", account) or len(token) < 20:
            raise Stop("DEDICATED_R2_CREDENTIAL_MISSING")
        self._base = "https://api.cloudflare.com/client/v4/accounts/" + account
        self._token = token
        self._opener = opener or urllib.request.build_opener(NoRedirect())

    def call(self, method, path, payload=None):
        reads = {PREFIX + "?per_page=1000", TARGET + "/domains/managed",
                 TARGET + "/domains/custom"}
        allowed = (method == "GET" and path in reads and payload is None) or (
            method == "POST" and path == PREFIX and payload == {"name": BUCKET})
        if not allowed:
            raise Stop("R2_ENDPOINT_OUTSIDE_APPROVED_STAGE_SCOPE")
        request = urllib.request.Request(
            self._base + path, method=method,
            headers={"Authorization": "Bearer " + self._token,
                     "Content-Type": "application/json", "User-Agent": CLIENT},
            data=json.dumps(payload).encode() if payload is not None else None)
        try:
            with self._opener.open(request, timeout=25) as response:
                value = json.loads(response.read(2_000_000))
        except urllib.error.HTTPError as error:
            # Never include provider response text, request headers or token.
            try:
                body = json.loads(error.read(12000))
                codes = [x.get("code") for x in body.get("errors", [])
                         if isinstance(x, dict) and isinstance(x.get("code"), int)]
            except (ValueError, AttributeError):
                codes = []
            raise Stop("R2_PROVIDER_HTTP_" + str(error.code) + "_CODES_" +
                       ",".join(map(str, codes))) from None
        except (OSError, ValueError):
            raise Stop("R2_PROVIDER_RESPONSE_UNAVAILABLE") from None
        if not isinstance(value, dict) or value.get("success") is not True:
            raise Stop("R2_PROVIDER_SUCCESS_NOT_VERIFIED")
        return value.get("result")


def bootstrap(api):
    inventory = api.call("GET", PREFIX + "?per_page=1000")
    buckets = inventory.get("buckets") if isinstance(inventory, dict) else None
    if not isinstance(buckets, list):
        raise Stop("R2_INVENTORY_UNVERIFIED")
    if any(not isinstance(x, dict) or not isinstance(x.get("name"), str)
           for x in buckets):
        raise Stop("R2_INVENTORY_UNVERIFIED")
    if any(x["name"] == BUCKET for x in buckets):
        raise Stop("STAGE_BUCKET_ALREADY_EXISTS_REQUIRES_REVIEW")
    created = api.call("POST", PREFIX, {"name": BUCKET})
    if not isinstance(created, dict) or created.get("name") != BUCKET:
        raise Stop("STAGE_BUCKET_CREATE_RESULT_UNVERIFIED")
    print("ONE_EMPTY_STAGE_BUCKET_CREATED=YES", flush=True)
    managed = api.call("GET", TARGET + "/domains/managed")
    custom = api.call("GET", TARGET + "/domains/custom")
    if not isinstance(managed, dict) or managed.get("enabled") is not False:
        raise Stop("STAGE_R2_MANAGED_PUBLIC_ACCESS_NOT_CONFIRMED_OFF")
    if not isinstance(custom, dict) or custom.get("domains") != []:
        raise Stop("STAGE_R2_CUSTOM_DOMAINS_NOT_CONFIRMED_EMPTY")
    return {"bucket": BUCKET, "managedPublicAccess": False, "customDomains": [],
            "objectWrites": False, "workerBindingChanged": False,
            "customerProductionReady": False}


def execution_credentials(env):
    if (env.get("GITHUB_EVENT_NAME") != "workflow_dispatch" or
            env.get("GITHUB_REPOSITORY") != "fawakhry/TrendOs" or
            env.get("R2_STAGE_CONFIRMATION") != CONFIRMATION or
            not re.fullmatch(r"[a-f0-9]{40}", env.get("R2_EXPECTED_SOURCE_SHA", "")) or
            env.get("R2_EXPECTED_SOURCE_SHA") != env.get("GITHUB_SHA")):
        raise Stop("MANUAL_EXACT_SOURCE_CONTEXT_REQUIRED")
    account = env.get("CLOUDFLARE_ACCOUNT_ID", "")
    worker_token = env.get("CLOUDFLARE_API_TOKEN", "")
    r2_token = env.get("CLOUDFLARE_R2_STAGE_API_TOKEN", "")
    if (not re.fullmatch(r"[a-fA-F0-9]{32}", account) or len(worker_token) < 20
            or len(r2_token) < 20):
        raise Stop("DEDICATED_R2_STAGE_SECRET_REQUIRED")
    if worker_token == r2_token:
        raise Stop("R2_SECRET_MUST_BE_SEPARATE_FROM_WORKER_TOKEN")
    return account, worker_token, r2_token


def original_stage_preflight(root, account, worker_token):
    # A different checkout/version must never qualify this one-shot operation.
    source = Path(root).resolve()
    actual = subprocess.check_output(["git", "-C", str(source), "rev-parse", "HEAD"],
                                     text=True).strip()
    if actual != SOURCE_SHA:
        raise Stop("ORIGINAL_STAGE_SOURCE_SHA_MISMATCH")
    script = source / "tools/zg_customer_stage_d1_binding_resolver_v1.py"
    spec = importlib.util.spec_from_file_location("original_customer_stage", script)
    resolver = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(resolver)
    prefix = "/workers/scripts/" + resolver.WORKER
    subdomain = resolver.api_get(account, worker_token, prefix + "/subdomain")["result"]
    settings = resolver.api_get(account, worker_token, prefix + "/settings")["result"]
    databases = resolver.read_d1_inventory(account, worker_token)
    resolver.resolved_config(resolver.SOURCE.read_text(), settings, subdomain, databases)
    flags = {x.get("name"): x.get("text") for x in settings["bindings"]
             if x.get("type") == "plain_text"}
    if any(flags.get(key) != "false" for key in resolver.REQUIRED_OFF):
        raise Stop("REMOTE_CUSTOMER_STAGE_FEATURE_NOT_OFF")
    print("ORIGINAL_NONPUBLIC_OFF_STAGE_SYNTHETIC_D1=PASS", flush=True)


def main(argv=None, env=None):
    args = list(sys.argv[1:] if argv is None else argv)
    if args in ([], ["--plan"]):
        print(json.dumps({"mode": "OFFLINE_PLAN", "bucket": BUCKET,
                          "secretName": "CLOUDFLARE_R2_STAGE_API_TOKEN",
                          "networkRequests": False, "productionReady": False}))
        return 0
    if len(args) != 2 or args[0] != "--execute":
        raise Stop("USE_PLAN_OR_EXECUTE_WITH_PINNED_SOURCE_DIRECTORY")
    account, worker_token, r2_token = execution_credentials(os.environ if env is None else env)
    original_stage_preflight(args[1], account, worker_token)
    print(json.dumps(bootstrap(StageR2Api(account, r2_token)), sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Stop as error:
        print("CUSTOMER_R2_STOP=" + str(error), file=sys.stderr)
        sys.exit(3)
    except Exception:
        print("CUSTOMER_R2_STOP=UNCLASSIFIED_FAILURE_NO_FALLBACK", file=sys.stderr)
        sys.exit(3)
