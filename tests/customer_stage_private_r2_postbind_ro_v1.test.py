"""Actual post-binding verifier, synthetic control-plane responses, no network."""
from collections import deque
from copy import deepcopy
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch
import urllib.error

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "postbind", ROOT / "tools/customer_stage_private_r2_postbind_ro_v1.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
OFF = (
    "TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED",
    "TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGIN_HTTP_V0_ENABLED",
    "TRENDOS_CUSTOMER_PORTAL_NATIVE_ORDERS_READ_V0_ENABLED",
    "TRENDOS_CUSTOMER_PORTAL_NATIVE_LOGOUT_V0_ENABLED",
    "TRENDOS_CUSTOMER_PORTAL_NATIVE_PUBLIC_CONTENT_V0_ENABLED",
    "TRENDOS_CUSTOMER_PORTAL_NATIVE_PASSWORD_CHANGE_V0_ENABLED",
    "TRENDOS_CUSTOMER_NATIVE_DRAFT_CREATE_V0_ENABLED",
    "TRENDOS_CUSTOMER_NATIVE_DRAFT_ITEM_V0_ENABLED",
    "TRENDOS_CUSTOMER_NATIVE_DRAFT_FILE_R2_V0_ENABLED",
    "TRENDOS_CUSTOMER_NATIVE_DRAFT_PREFLIGHT_RO_V0_ENABLED",
    "TRENDOS_CUSTOMER_PRIVATE_R2_INTEGRITY_RO_V0_ENABLED",
)
ACCOUNT, SHA = "0" * 32, "a" * 40
WORKER_TOKEN, R2_TOKEN = "SYNTHETIC_WORKER_TOKEN_NOT_REAL", "SYNTHETIC_R2_TOKEN_NOT_REAL"
OLD = "eba1cad6-0000-4000-8000-000000000001"
CURRENT = "bbbbbbbb-0000-4000-8000-000000000002"
DBID = "00000000-0000-4000-8000-000000000003"
VARS = {k: "false" for k in OFF}
VARS.update({"CORS_ORIGINS": "http://127.0.0.1:8000,http://localhost:8000",
             "TRENDOS_CUSTOMER_PORTAL_STAGE_MODE": "isolated-customer-stage-v0"})
SOURCE = ('name = "' + m.WORKER + '"\nmain = "customer-stage/index.mjs"\n'
          'workers_dev = false\npreview_urls = false\n[vars]\n' +
          '\n'.join(k + ' = ' + json.dumps(v) for k, v in VARS.items()) + '\n')
ORIGINAL_BINDINGS = [
    *[{"name": k, "type": "plain_text", "text": v} for k, v in VARS.items()],
    {"name": "DB", "type": "d1", "id": DBID},
    {"name": "CUSTOMER_LOGIN_RATE_STAGE_V0", "type": "durable_object_namespace",
     "namespace_id": "d" * 32, "class_name": "CustomerLoginThrottleStageV0"},
    {"name": "SESSION_SECRET", "type": "secret_text"},
]
R2_BINDING = {"name": m.BINDING, "type": "r2_bucket", "bucket_name": m.base.BUCKET}
SETTINGS = {"bindings": deepcopy(ORIGINAL_BINDINGS) + [R2_BINDING]}


def version(bindings):
    return {"resources": {"bindings": deepcopy(bindings), "script": {"etag": "c" * 64},
        "script_runtime": {"compatibility_date": "2026-08-27", "migration_tag": "stage_v0"}}}


def deployment(ident=CURRENT):
    return {"deployments": [{"versions": [{"version_id": ident, "percentage": 100}]}]}


class FakeApi:
    def __init__(self, mapping):
        self.mapping, self.paths = mapping, []

    def get(self, path):
        self.paths.append(path)
        result = self.mapping[path]
        return deepcopy(result.popleft() if isinstance(result, deque) else result)


class Response:
    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, limit):
        return b'{"success":true,"result":{}}'


class Tests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / "cloudflare-d1").mkdir()
        source = self.root / "cloudflare-d1/wrangler.customer-stage.toml"
        source.write_text(SOURCE)
        self.resolver = SimpleNamespace(SOURCE=source, REQUIRED_OFF=OFF,
            resolved_config=Mock(return_value=SOURCE +
                '\n[[d1_databases]]\nbinding="DB"\ndatabase_name="SYNTHETIC"\ndatabase_id="' + DBID + '"\n'))
        self.worker = FakeApi({
            m.ROOT_PATH + "/settings": SETTINGS,
            m.ROOT_PATH + "/subdomain": {"enabled": False, "previews_enabled": False},
            "/d1/database?page=1&per_page=100": [{"name": "SYNTHETIC", "uuid": DBID}],
            m.ROOT_PATH + "/deployments": deployment(),
            m.ROOT_PATH + "/versions": {"items": [{"id": CURRENT}, {"id": OLD}]},
            m.ROOT_PATH + "/versions/" + OLD: version(ORIGINAL_BINDINGS),
            m.ROOT_PATH + "/versions/" + CURRENT: version(SETTINGS["bindings"]),
        })
        self.r2 = FakeApi({m.base.TARGET + "/domains/managed": {"enabled": False},
                           m.base.TARGET + "/domains/custom": {"domains": []}})

    def tearDown(self):
        self.tmp.cleanup()

    def verify(self):
        with patch.object(m, "load_original", return_value=(self.root, self.resolver)):
            return m.verify(self.root, self.worker, self.r2)

    def test_offline_plan_never_reads_credentials_or_network(self):
        with patch.object(m, "credentials") as creds, patch.object(m, "ReadOnlyApi") as api, \
                contextlib.redirect_stdout(io.StringIO()) as out:
            self.assertEqual(m.main(["--plan"], {}), 0)
            self.assertFalse(json.loads(out.getvalue())["network"])
            creds.assert_not_called()
            api.assert_not_called()

    def test_verified_binding_renders_off_configuration_without_secret(self):
        report, config, source = self.verify()
        self.assertTrue(report["originalCodeAndNonR2BindingsUnchanged"])
        self.assertFalse(report["remoteWrites"])
        self.assertFalse(report["customerProductionReady"])
        self.assertNotIn("SESSION_SECRET", config)
        parsed = m.tomllib.loads(config)
        self.assertEqual(parsed["r2_buckets"], [{"binding": m.BINDING, "bucket_name": m.base.BUCKET}])
        self.assertFalse(parsed["workers_dev"])
        self.assertTrue(all(parsed["vars"][x] == "false" for x in OFF))
        # The original resolver is reused unchanged only after the ONE approved
        # R2 binding has been validated and excluded from its old no-R2 schema.
        validated = self.resolver.resolved_config.call_args.args[1]
        self.assertFalse(any(x["type"] == "r2_bucket" for x in validated["bindings"]))
        self.assertEqual(source, self.root)

    def test_reject_wrong_bucket_binding_duplicate_and_extra_resource(self):
        for replacement in [
            [{**R2_BINDING, "bucket_name": "production"}],
            [{**R2_BINDING, "name": "WRONG_BUCKET"}],
            [R2_BINDING, R2_BINDING],
            [R2_BINDING, {"name": "OTHER", "type": "r2_bucket", "bucket_name": "other"}],
            [R2_BINDING, {"name": "EXTRA", "type": "service", "service": "production"}],
        ]:
            with self.subTest(replacement=replacement), self.assertRaises(m.Stop):
                m.without_approved_r2(deepcopy(ORIGINAL_BINDINGS) + replacement)

    def test_reject_changed_code_runtime_and_non_r2_binding(self):
        old = version(ORIGINAL_BINDINGS)
        changed = [version(SETTINGS["bindings"]) for _ in range(3)]
        changed[0]["resources"]["script"]["etag"] = "e" * 64
        changed[1]["resources"]["script_runtime"]["migration_tag"] = "changed"
        changed[2]["resources"]["bindings"][0]["text"] = "true"
        for after in changed:
            with self.subTest(after=after), self.assertRaises(m.Stop):
                m.compare_versions(SETTINGS, old, after)

    def test_reject_settings_from_undeployed_latest(self):
        settings = deepcopy(SETTINGS)
        settings["bindings"][0]["text"] = "true"
        with self.assertRaisesRegex(m.Stop, "SETTINGS_DEPLOYED_VERSION_MISMATCH"):
            m.compare_versions(settings, version(ORIGINAL_BINDINGS), version(SETTINGS["bindings"]))

    def test_reject_flag_on_and_unexpected_plaintext_var_before_version_reads(self):
        for bindings in [deepcopy(SETTINGS["bindings"]), deepcopy(SETTINGS["bindings"])]:
            if bindings == SETTINGS["bindings"]:
                bindings[0]["text"] = "true"
            self.worker.mapping[m.ROOT_PATH + "/settings"] = {"bindings": bindings}
            with self.assertRaisesRegex(m.Stop, "ORIGINAL_VARS_NOT_OFF"):
                self.verify()
            self.assertNotIn(m.ROOT_PATH + "/versions", self.worker.paths)
            self.worker.paths.clear()
        self.worker.mapping[m.ROOT_PATH + "/settings"] = {
            "bindings": deepcopy(SETTINGS["bindings"]) + [{"name": "EXTRA", "type": "plain_text", "text": "x"}]}
        with self.assertRaises(m.Stop):
            self.verify()

    def test_reject_uncertain_baseline_or_split_deployment(self):
        self.worker.mapping[m.ROOT_PATH + "/versions"] = {"items": [{"id": CURRENT}]}
        with self.assertRaisesRegex(m.Stop, "BASELINE_VERSION_NOT_UNIQUE"):
            self.verify()
        split = deployment()
        split["deployments"][0]["versions"][0]["percentage"] = 50
        with self.assertRaisesRegex(m.Stop, "SINGLE_ACTIVE_VERSION"):
            m.active_version(split)

    def test_reject_snapshot_change_after_privacy_reads(self):
        self.worker.mapping[m.ROOT_PATH + "/deployments"] = deque([deployment(), deployment(OLD)])
        with self.assertRaisesRegex(m.Stop, "SNAPSHOT_CHANGED_DURING_READ"):
            self.verify()

    def test_reject_enabled_managed_or_custom_domain(self):
        for managed, custom in [({"enabled": True}, {"domains": []}),
                                ({"enabled": False}, {"domains": [{"domain": "fake.invalid"}]})]:
            self.r2.mapping[m.base.TARGET + "/domains/managed"] = managed
            self.r2.mapping[m.base.TARGET + "/domains/custom"] = custom
            with self.assertRaisesRegex(m.Stop, "PRIVACY_UNVERIFIED"):
                self.verify()

    def test_http_boundary_is_get_only_same_origin_separate_credentials(self):
        opener = Mock()
        opener.open.return_value = Response()
        api = m.ReadOnlyApi(ACCOUNT, WORKER_TOKEN, "worker", opener)
        api.get(m.ROOT_PATH + "/settings")
        request = opener.open.call_args.args[0]
        self.assertEqual(request.method, "GET")
        self.assertEqual(request.get_header("Authorization"), "Bearer " + WORKER_TOKEN)
        self.assertEqual(request.get_header("User-agent"), m.base.CLIENT)
        for path in ["/workers/scripts/production/settings", m.base.TARGET + "/domains/managed",
                     "/d1/database/arbitrary/query", m.ROOT_PATH + "/versions/invalid"]:
            with self.assertRaises(m.Stop):
                api.get(path)
        r2 = m.ReadOnlyApi(ACCOUNT, R2_TOKEN, "r2", opener)
        with self.assertRaises(m.Stop):
            r2.get(m.base.PREFIX + "?per_page=1000")
        r2.get(m.base.TARGET + "/domains/custom")
        self.assertEqual(opener.open.call_args.args[0].get_header("Authorization"), "Bearer " + R2_TOKEN)

    def test_provider_error_body_never_exposes_secrets_or_redirects(self):
        for code in [302, 403]:
            opener = Mock()
            opener.open.side_effect = urllib.error.HTTPError(
                "https://api.cloudflare.com", code, "Error", {}, io.BytesIO(R2_TOKEN.encode()))
            with self.assertRaises(m.Stop) as raised:
                m.ReadOnlyApi(ACCOUNT, R2_TOKEN, "r2", opener).get(m.base.TARGET + "/domains/custom")
            self.assertNotIn(R2_TOKEN, str(raised.exception))
            self.assertIn(str(code), str(raised.exception))
        self.assertIsNone(m.base.NoRedirect().redirect_request(None, None, 302, "", {}, "https://other.invalid"))

    def test_credential_context_pin_and_same_token_fail_before_provider(self):
        data = {"GITHUB_REPOSITORY": "fawakhry/TrendOs", "GITHUB_EVENT_NAME": "pull_request",
                "GITHUB_HEAD_REF": m.BRANCH, "POSTBIND_HEAD_REPO": "fawakhry/TrendOs",
                "POSTBIND_SOURCE_SHA": SHA, "CLOUDFLARE_ACCOUNT_ID": ACCOUNT,
                "CLOUDFLARE_API_TOKEN": WORKER_TOKEN, "CLOUDFLARE_R2_STAGE_API_TOKEN": R2_TOKEN}
        with patch.object(m.subprocess, "check_output", return_value=SHA):
            self.assertEqual(m.credentials(data), (ACCOUNT, WORKER_TOKEN, R2_TOKEN))
            for key, value in [("POSTBIND_HEAD_REPO", "fork/TrendOs"),
                               ("GITHUB_HEAD_REF", "main"), ("GITHUB_EVENT_NAME", "push"),
                               ("POSTBIND_SOURCE_SHA", "b" * 40),
                               ("CLOUDFLARE_R2_STAGE_API_TOKEN", WORKER_TOKEN)]:
                with self.subTest(key=key), self.assertRaises(m.Stop):
                    m.credentials({**data, key: value})
        with patch.object(m.subprocess, "check_output", return_value="b" * 40), \
                patch.object(m.importlib.util, "spec_from_file_location") as loader:
            with self.assertRaisesRegex(m.Stop, "ORIGINAL_SOURCE_PIN_MISMATCH"):
                m.load_original(self.root)
            loader.assert_not_called()

    def test_local_config_cannot_overwrite_original_or_escape_checkout(self):
        path = self.root / "cloudflare-d1/.wrangler-customer-r2-verified-off-test.toml"
        m.write_config(path, self.root, SOURCE)
        self.assertEqual(path.stat().st_mode & 0o777, 0o600)
        with self.assertRaises(FileExistsError):
            m.write_config(path, self.root, "overwrite")
        for invalid in [self.root / "outside.toml", self.resolver.SOURCE]:
            with self.assertRaises(m.Stop):
                m.write_config(invalid, self.root, "overwrite")
        self.assertEqual(self.resolver.SOURCE.read_text(), SOURCE)


if __name__ == "__main__":
    unittest.main()
