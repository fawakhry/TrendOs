#!/usr/bin/env python3
"""GET-only witness of the owner's Stage R2 binding; no deployment or writes.

An optional local OFF configuration is rendered from the immutable original
checkout only after the deployed code, bindings and private storage qualify.
"""
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tomllib
import urllib.error
import urllib.request

spec = importlib.util.spec_from_file_location(
    "r2_bootstrap", Path(__file__).with_name("customer_stage_private_r2_bootstrap_v1.py"))
base = importlib.util.module_from_spec(spec)
spec.loader.exec_module(base)
Stop = base.Stop
WORKER = "trendos-customer-portal-isolated-stage-v0"
ROOT_PATH = "/workers/scripts/" + WORKER
BINDING = "CUSTOMER_DRAFT_FILES_BUCKET"
BASELINE_PREFIX = "eba1cad6"  # Deployed version visible before owner binding change.
BRANCH = "feature/customer-stage-private-r2-preserve-off-20261103"
UUID = r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"


def need(ok, code):
    if not ok:
        raise Stop(code)


class ReadOnlyApi:
    def __init__(self, account, token, scope, opener=None):
        need(bool(re.fullmatch(r"[a-fA-F0-9]{32}", account)) and len(token) >= 20,
             "POSTBIND_CREDENTIAL_MISSING")
        need(scope in ("worker", "r2"), "POSTBIND_SCOPE_INVALID")
        self.origin = "https://api.cloudflare.com/client/v4/accounts/" + account
        self.token, self.scope = token, scope
        self.opener = opener or urllib.request.build_opener(base.NoRedirect())

    def get(self, path):
        worker_reads = {ROOT_PATH + suffix for suffix in
                        ("/settings", "/subdomain", "/deployments", "/versions")}
        allowed = (path in worker_reads or bool(re.fullmatch(
            re.escape(ROOT_PATH) + "/versions/" + UUID, path)) or
            bool(re.fullmatch(r"/d1/database\?page=([1-9]|[12][0-9]|30)&per_page=100", path)))
        if self.scope == "r2":
            allowed = path in {base.TARGET + "/domains/managed", base.TARGET + "/domains/custom"}
        need(allowed, "POSTBIND_ENDPOINT_OUTSIDE_READONLY_SCOPE")
        req = urllib.request.Request(self.origin + path, method="GET", headers={
            "Authorization": "Bearer " + self.token, "User-Agent": base.CLIENT})
        try:
            with self.opener.open(req, timeout=25) as response:
                value = json.loads(response.read(2_000_000))
        except urllib.error.HTTPError as error:
            raise Stop("POSTBIND_PROVIDER_HTTP_" + str(error.code)) from None
        except (ValueError, OSError):
            raise Stop("POSTBIND_PROVIDER_READ_UNAVAILABLE") from None
        need(isinstance(value, dict) and value.get("success") is True,
             "POSTBIND_PROVIDER_SUCCESS_UNVERIFIED")
        return value.get("result")


def load_original(root):
    source = Path(root).resolve()
    actual = subprocess.check_output(["git", "-C", str(source), "rev-parse", "HEAD"],
                                     text=True).strip()
    need(actual == base.SOURCE_SHA, "POSTBIND_ORIGINAL_SOURCE_PIN_MISMATCH")
    spec = importlib.util.spec_from_file_location(
        "original_stage", source / "tools/zg_customer_stage_d1_binding_resolver_v1.py")
    resolver = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(resolver)
    need(resolver.WORKER == WORKER, "POSTBIND_ORIGINAL_WORKER_MISMATCH")
    return source, resolver


def binding_map(bindings):
    need(isinstance(bindings, list) and all(isinstance(x, dict) for x in bindings),
         "POSTBIND_BINDINGS_SHAPE_UNVERIFIED")
    names = [x.get("name") for x in bindings]
    need(all(isinstance(x, str) and x for x in names) and len(set(names)) == len(names),
         "POSTBIND_BINDING_NAMES_DUPLICATE_OR_INVALID")
    return {x["name"]: x for x in bindings}


def without_approved_r2(bindings):
    names = binding_map(bindings)
    matches = [x for x in bindings if x.get("type") == "r2_bucket" or x["name"] == BINDING]
    need(len(matches) == 1 and matches[0].get("type") == "r2_bucket" and
         matches[0].get("name") == BINDING and matches[0].get("bucket_name") == base.BUCKET and
         matches[0].get("jurisdiction") in (None, "", "default"),
         "POSTBIND_EXACT_PRIVATE_R2_BINDING_REQUIRED")
    del names[BINDING]
    need(all(x.get("type") in {"plain_text", "secret_text", "d1", "durable_object_namespace"}
             for x in names.values()), "POSTBIND_UNEXPECTED_RESOURCE_BINDING")
    return list(names.values())


def active_version(deployments):
    items = deployments.get("deployments") if isinstance(deployments, dict) else None
    need(isinstance(items, list) and items, "POSTBIND_DEPLOYMENTS_UNVERIFIED")
    versions = items[0].get("versions") if isinstance(items[0], dict) else None
    need(isinstance(versions, list) and len(versions) == 1 and
         isinstance(versions[0], dict) and versions[0].get("percentage") == 100 and
         bool(re.fullmatch(UUID, str(versions[0].get("version_id", "")))),
         "POSTBIND_SINGLE_ACTIVE_VERSION_REQUIRED")
    return versions[0]["version_id"]


def compare_versions(settings, old, current):
    before = old.get("resources") if isinstance(old, dict) else None
    after = current.get("resources") if isinstance(current, dict) else None
    need(isinstance(before, dict) and isinstance(after, dict), "POSTBIND_VERSION_RESOURCES_UNVERIFIED")
    before_script, after_script = before.get("script", {}), after.get("script", {})
    etag = before_script.get("etag")
    need(isinstance(etag, str) and bool(re.fullmatch(r"[a-fA-F0-9]{32,128}", etag)) and
         after_script.get("etag") == etag, "POSTBIND_SCRIPT_CONTENT_ETAG_CHANGED_OR_UNKNOWN")
    need(isinstance(before.get("script_runtime"), dict) and
         before.get("script_runtime") == after.get("script_runtime"),
         "POSTBIND_WORKER_RUNTIME_CHANGED_OR_UNKNOWN")
    old_map = binding_map(before.get("bindings"))
    need(not any(x.get("type") == "r2_bucket" for x in old_map.values()),
         "POSTBIND_BASELINE_ALREADY_HAS_R2")
    need(old_map == binding_map(without_approved_r2(after.get("bindings"))),
         "POSTBIND_NON_R2_BINDING_DRIFT")
    need(binding_map(settings.get("bindings")) == binding_map(after.get("bindings")),
         "POSTBIND_SETTINGS_DEPLOYED_VERSION_MISMATCH")
    return etag


def read_inventory(api):
    out = []
    for page in range(1, 31):
        # The common API strips result metadata; a short page completes this
        # bounded inventory. A full last page requires a subsequent empty page.
        rows = api.get("/d1/database?page=" + str(page) + "&per_page=100")
        need(isinstance(rows, list), "POSTBIND_D1_INVENTORY_UNVERIFIED")
        out.extend(rows)
        if len(rows) < 100:
            return out
    raise Stop("POSTBIND_D1_INVENTORY_CAP")


def verify(root, worker_api, r2_api):
    source, resolver = load_original(root)
    source_text = resolver.SOURCE.read_text(encoding="utf-8")
    settings = worker_api.get(ROOT_PATH + "/settings")
    subdomain = worker_api.get(ROOT_PATH + "/subdomain")
    need(isinstance(settings, dict), "POSTBIND_SETTINGS_UNVERIFIED")
    kept = without_approved_r2(settings.get("bindings"))
    original_settings = {**settings, "bindings": kept}
    config = resolver.resolved_config(source_text, original_settings, subdomain,
                                      read_inventory(worker_api))
    expected_vars = tomllib.loads(source_text)["vars"]
    actual_vars = {x["name"]: x.get("text") for x in kept if x.get("type") == "plain_text"}
    need(actual_vars == expected_vars and all(actual_vars.get(k) == "false"
         for k in resolver.REQUIRED_OFF), "POSTBIND_EXACT_ORIGINAL_VARS_NOT_OFF")
    deployed = worker_api.get(ROOT_PATH + "/deployments")
    current_id = active_version(deployed)
    listing = worker_api.get(ROOT_PATH + "/versions")
    versions = listing.get("items") if isinstance(listing, dict) else None
    need(isinstance(versions, list), "POSTBIND_VERSION_INVENTORY_UNVERIFIED")
    candidates = [v.get("id") for v in versions if isinstance(v, dict) and
                  str(v.get("id", "")).startswith(BASELINE_PREFIX)]
    need(len(candidates) == 1 and bool(re.fullmatch(UUID, candidates[0])),
         "POSTBIND_BASELINE_VERSION_NOT_UNIQUE")
    old = worker_api.get(ROOT_PATH + "/versions/" + candidates[0])
    current = worker_api.get(ROOT_PATH + "/versions/" + current_id)
    etag = compare_versions(settings, old, current)
    managed = r2_api.get(base.TARGET + "/domains/managed")
    custom = r2_api.get(base.TARGET + "/domains/custom")
    need(isinstance(managed, dict) and managed.get("enabled") is False and
         isinstance(custom, dict) and custom.get("domains") == [],
         "POSTBIND_R2_PRIVACY_UNVERIFIED")
    # Re-read independently after comparison; never certify a moving version.
    need(active_version(worker_api.get(ROOT_PATH + "/deployments")) == current_id and
         worker_api.get(ROOT_PATH + "/settings") == settings and
         worker_api.get(ROOT_PATH + "/subdomain") == subdomain,
         "POSTBIND_SNAPSHOT_CHANGED_DURING_READ")
    config += '\n[[r2_buckets]]\nbinding = "' + BINDING + '"\nbucket_name = "' + base.BUCKET + '"\n'
    return {"worker": WORKER, "deployedVersion": current_id,
            "baselineVersion": candidates[0], "scriptContentEtag": etag,
            "originalCodeAndNonR2BindingsUnchanged": True, "all11FlagsOff": True,
            "workersDevAndPreviewOff": True, "managedPublicAccess": False,
            "customDomains": [], "binding": BINDING, "bucket": base.BUCKET,
            "remoteWrites": False, "customerProductionReady": False}, config, source


def write_config(path, source, content):
    target = Path(path).resolve()
    need(target.parent == source / "cloudflare-d1" and
         target.name.startswith(".wrangler-customer-r2-verified-off-") and
         target.suffix == ".toml", "POSTBIND_CONFIG_PATH_OUTSIDE_DISPOSABLE_SOURCE")
    with target.open("x", encoding="utf-8") as output:
        target.chmod(0o600)
        output.write(content)


def credentials(env):
    need(env.get("GITHUB_REPOSITORY") == "fawakhry/TrendOs" and
         env.get("GITHUB_EVENT_NAME") == "pull_request" and
         env.get("GITHUB_HEAD_REF") == BRANCH and
         env.get("POSTBIND_HEAD_REPO") == "fawakhry/TrendOs",
         "POSTBIND_TRUSTED_READONLY_PR_CONTEXT_REQUIRED")
    sha = env.get("POSTBIND_SOURCE_SHA", "")
    need(bool(re.fullmatch(r"[a-f0-9]{40}", sha)) and sha == subprocess.check_output(
         ["git", "-C", str(Path(__file__).resolve().parents[1]), "rev-parse", "HEAD"],
         text=True).strip(), "POSTBIND_CHECKED_OUT_SOURCE_SHA_MISMATCH")
    account, worker, r2 = (env.get(k, "") for k in
        ("CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_R2_STAGE_API_TOKEN"))
    need(bool(re.fullmatch(r"[a-fA-F0-9]{32}", account)) and len(worker) >= 20 and
         len(r2) >= 20 and worker != r2, "POSTBIND_SEPARATE_CREDENTIALS_REQUIRED")
    return account, worker, r2


def main(argv=None, env=None):
    args = list(sys.argv[1:] if argv is None else argv)
    if args in ([], ["--plan"]):
        print(json.dumps({"mode": "OFFLINE_PLAN", "binding": BINDING,
                          "bucket": base.BUCKET, "network": False, "remoteWrites": False}))
        return 0
    need(len(args) in (2, 4) and args[0] == "--verify" and
         (len(args) == 2 or args[2] == "--write-config"), "POSTBIND_USAGE_INVALID")
    account, worker, r2 = credentials(os.environ if env is None else env)
    report, config, source = verify(args[1], ReadOnlyApi(account, worker, "worker"),
                                    ReadOnlyApi(account, r2, "r2"))
    if len(args) == 4:
        write_config(args[3], source, config)
        report["disposableOffConfigRendered"] = True
    print(json.dumps(report, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Stop as error:
        print("CUSTOMER_POSTBIND_STOP=" + str(error), file=sys.stderr)
        sys.exit(3)
    except Exception:
        print("CUSTOMER_POSTBIND_STOP=UNCLASSIFIED_FAILURE_NO_FALLBACK", file=sys.stderr)
        sys.exit(3)
