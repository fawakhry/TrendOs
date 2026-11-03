#!/usr/bin/env python3
"""GET-only witness of the owner's Stage R2 binding; no deployment or writes.

An optional local OFF configuration is rendered from the immutable original
checkout only after the deployed code, bindings and private storage qualify.
"""
import importlib.util
import hashlib
from email.parser import BytesParser
from email import policy
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
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

    def script_content(self):
        need(self.scope == "worker", "POSTBIND_CONTENT_REQUIRES_WORKER_SCOPE")
        req = urllib.request.Request(self.origin + ROOT_PATH + "/content/v2", method="GET",
            headers={"Authorization": "Bearer " + self.token, "User-Agent": base.CLIENT})
        try:
            with self.opener.open(req, timeout=25) as response:
                content_type = response.headers.get("Content-Type", "")
                raw = response.read(4_000_001)
        except urllib.error.HTTPError as error:
            raise Stop("POSTBIND_CONTENT_HTTP_" + str(error.code)) from None
        except OSError:
            raise Stop("POSTBIND_CONTENT_UNAVAILABLE") from None
        need(len(raw) <= 4_000_000, "POSTBIND_CONTENT_SIZE_EXCEEDED")
        if content_type.startswith("multipart/"):
            msg = BytesParser(policy=policy.default).parsebytes(
                ("Content-Type: " + content_type + "\r\nMIME-Version: 1.0\r\n\r\n").encode() + raw)
            need(msg.is_multipart(), "POSTBIND_CONTENT_MULTIPART_UNVERIFIED")
            parts = list(msg.iter_parts())
            scripts = [p for p in parts if p.get_content_type() in
                ("application/javascript", "application/javascript+module", "text/javascript")]
            need(len(scripts) == 1 and all(p in scripts or p.get_content_type() == "application/json"
                 for p in parts), "POSTBIND_SINGLE_JS_MODULE_REQUIRED")
            raw = scripts[0].get_payload(decode=True)
        else:
            need(content_type.split(";", 1)[0] in
                 ("application/javascript", "application/javascript+module", "text/javascript"),
                 "POSTBIND_CONTENT_TYPE_UNVERIFIED")
        need(isinstance(raw, bytes) and raw, "POSTBIND_CONTENT_EMPTY")
        return raw


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


def compare_versions(settings, old, current, source_ast_witness=False):
    before = old.get("resources") if isinstance(old, dict) else None
    after = current.get("resources") if isinstance(current, dict) else None
    need(isinstance(before, dict) and isinstance(after, dict), "POSTBIND_VERSION_RESOURCES_UNVERIFIED")
    before_script, after_script = before.get("script", {}), after.get("script", {})
    etag = before_script.get("etag")
    same_etag = (isinstance(etag, str) and bool(re.fullmatch(r"[a-fA-F0-9]{32,128}", etag)) and
                 after_script.get("etag") == etag)
    need(same_etag or source_ast_witness is True,
         "POSTBIND_SCRIPT_CONTENT_ETAG_CHANGED_OR_UNKNOWN")
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


def attest_pinned_code(actual_bytes, source):
    built = source / "cloudflare-d1/.postbind-local-build/index.js"
    need(built.is_file(), "POSTBIND_PINNED_LOCAL_BUILD_REQUIRED")
    with tempfile.TemporaryDirectory(prefix="customer-postbind-code-") as tmp:
        downloaded = Path(tmp) / "current-worker.js"
        downloaded.write_bytes(actual_bytes)
        result = subprocess.run(["node", str(Path(__file__).with_name(
            "customer_stage_code_ast_witness_v1.cjs")), str(downloaded), str(built)],
            text=True, capture_output=True, timeout=30)
    try:
        witness = json.loads(result.stdout)
    except ValueError:
        raise Stop("POSTBIND_PINNED_SOURCE_AST_UNAVAILABLE") from None
    print("POSTBIND_CURRENT_CONTENT_BYTES=" + str(len(actual_bytes)), flush=True)
    print("POSTBIND_PINNED_SOURCE_AST=" + json.dumps(witness, sort_keys=True), flush=True)
    need(result.returncode == 0 and isinstance(witness, dict) and witness.get("sameAst") is True,
         "POSTBIND_DEPLOYED_CODE_DIFFERS_FROM_PINNED_SOURCE")
    return witness


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


def version_diagnostic(version):
    resources = version.get("resources", {}) if isinstance(version, dict) else {}
    script = resources.get("script", {}) if isinstance(resources, dict) else {}
    value = script.get("etag") if isinstance(script, dict) else None
    return {"etagType": type(value).__name__,
            "etagLength": len(value) if isinstance(value, str) else None,
            "etagIsHex": bool(re.fullmatch(r"[a-fA-F0-9]{32,128}", value or "")) if isinstance(value, str) else False,
            "etagFingerprint": hashlib.sha256(value.encode()).hexdigest()[:16] if isinstance(value, str) else None}


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
    source_witness = None
    old_etag = old.get("resources", {}).get("script", {}).get("etag")
    current_etag = current.get("resources", {}).get("script", {}).get("etag")
    if old_etag != current_etag and os.environ.get("POSTBIND_COMPARE_PINNED_CODE") == "true":
        need(versions and versions[0].get("id") == current_id,
             "POSTBIND_CONTENT_LATEST_IS_NOT_DEPLOYED")
        source_witness = attest_pinned_code(worker_api.script_content(), source)
        latest = worker_api.get(ROOT_PATH + "/versions")
        need(latest.get("items", [{}])[0].get("id") == current_id,
             "POSTBIND_CONTENT_VERSION_CHANGED")
    try:
        etag = compare_versions(settings, old, current, source_witness is not None)
    except Stop:
        # Diagnostics remain read-only and never print provider messages,
        # settings values, account IDs or secrets. Keep the original failure.
        previous_id, previous = None, None
        if len(deployed["deployments"]) > 1:
            previous_id = active_version({"deployments": deployed["deployments"][1:]})
            previous = old if previous_id == candidates[0] else worker_api.get(
                ROOT_PATH + "/versions/" + previous_id)
        print("POSTBIND_VERSION_DIAGNOSTIC=" + json.dumps({
            "currentDeployedVersion": current_id, "selectedBaselineVersion": candidates[0],
            "previousDeployedVersion": previous_id,
            "selectedBaseline": version_diagnostic(old),
            "current": version_diagnostic(current), "previous": version_diagnostic(previous),
            "originalOffVarsAndSyntheticD1Preflight": True}), flush=True)
        raise
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
            "deployedCodeQualifiedAndNonR2BindingsUnchanged": True, "all11FlagsOff": True,
            "priorVersionEtagMatches": old_etag == current_etag,
            "pinnedSourceAstWitness": source_witness,
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
