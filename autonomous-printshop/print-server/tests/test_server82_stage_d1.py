"""SERVER-82 source-only guard tests, no Cloudflare network/calls/devices."""
import importlib.util
import json
import os
import unittest
from unittest.mock import patch
from pathlib import Path

SOURCE = Path("autonomous-printshop/print-server/tools/server82_stage_d1.py")
spec = importlib.util.spec_from_file_location("server82_stage_d1", SOURCE)
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)

STAGE = Path("cloudflare-d1/wrangler.server68-isolated-stage.toml").read_text()
FIXTURE = Path("cloudflare-d1/fixtures/server82_stage_only_synthetic.sql").read_text()
UUID = "22222222-2222-4222-8222-222222222222"
ACCOUNT = "a" * 32
TOKEN = "NOT_A_REAL_CLOUDFLARE_STAGE_TOKEN_ABCDEFGHIJKLMNOP"


class FakeResponse:
    status = 200
    def __init__(self, obj):
        self.obj = obj
    def __enter__(self):
        return self
    def __exit__(self, *args):
        return False
    def read(self, n=-1):
        return json.dumps(self.obj).encode()[:n]


class FakeOpener:
    def __init__(self):
        self.requests = []
    def open(self, request, timeout):
        self.requests.append(request)
        assert timeout == 20
        assert request.full_url.startswith(
            "https://api.cloudflare.com/client/v4/accounts/" + ACCOUNT + "/")
        assert request.get_header("Authorization") == "Bearer " + TOKEN
        path = request.full_url.split("/client/v4/accounts/" + ACCOUNT)[-1]
        if path.endswith("/deployments"):
            result = {"deployments": [{"versions": [
                {"version_id": m.EXPECTED_STAGE_VERSION, "percentage": 100}
            ]}]}
        elif path.endswith("/subdomain"):
            result = {"enabled": False, "previews_enabled": False}
        elif path.endswith("/settings"):
            result = {"bindings": [
                {"name": "MIRROR_SERVICE_READ_REPLAY_DO",
                 "type": "durable_object_namespace"},
                {"name": "TRENDOSSHOP_SERVICE_READ_ENABLED",
                 "type": "plain_text", "text": "false"},
                {"name": "MIRROR_SERVICE_READ_ENABLED",
                 "type": "plain_text", "text": "false"},
            ]}
        elif path.startswith("/d1/database?"):
            result = []
            return FakeResponse({"success": True, "result": result,
                                 "result_info": {"total_pages": 1}})
        elif path == "/d1/database":
            result = {"name": m.DATABASE, "uuid": UUID}
        elif path.endswith("/query"):
            packet = json.loads(request.data)
            if packet["sql"].startswith("SELECT line_id"):
                result = [{"success": True, "results": [
                    {"line_id": "FAKE-S82-LASER", "order_id": "FAKE-S82-ORDER",
                     "department": "ليزر", "qty": 1},
                    {"line_id": "FAKE-S82-PRINT", "order_id": "FAKE-S82-ORDER",
                     "department": "طباعة", "qty": 2},
                ]}]
            else:
                result = [{"success": True, "results": []}]
        else:
            raise AssertionError("unexpected remote path")
        return FakeResponse({"success": True, "result": result})


class Stage82Test(unittest.TestCase):
    def test_synthetic_schema_exactly_nine_statements(self):
        self.assertEqual(len(m.fixture_statements(FIXTURE)), 9)
        self.assertEqual(FIXTURE.count("FAKE-S82-ORDER"), 2)

    def test_production_sql_not_allowed(self):
        for sql in ("DROP TABLE sheet_catalog;", "UPDATE t12_prod_lines SET qty=3;",
                    "DELETE FROM t12_prod_lines;", "ATTACH DATABASE 'prod';",
                    "CREATE TABLE customers (name TEXT);", "SELECT * FROM t12_prod_lines;"):
            with self.assertRaises(m.StageBlocked):
                m.fixture_statements(FIXTURE + "\n" + sql)

    def test_no_actual_customer_data_or_credentials(self):
        for forbidden in ("trendos-main", "PRIVATE_CUSTOMER",
                          "customer_phone", "CLOUDFLARE_API_TOKEN"):
            self.assertNotIn(forbidden.casefold(), FIXTURE.casefold())

    def test_original_unpublished_stage_config_unchanged(self):
        self.assertTrue(m.check_toml(STAGE))
        for fake in (STAGE.replace("workers_dev = false", "workers_dev = true"),
                     STAGE.replace("preview_urls = false", "preview_urls = true"),
                     STAGE.replace('TRENDOSSHOP_SERVICE_READ_ENABLED = "false"',
                                   'TRENDOSSHOP_SERVICE_READ_ENABLED = "true"'),
                     STAGE + '\n[[d1_databases]]\ndatabase_name = "trendos-main"\n'):
            with self.assertRaises(m.StageBlocked):
                m.check_toml(fake)

    def test_binding_manifest_stays_ephemeral_and_stage_only(self):
        cfg = m.ephemeral_bound_toml(STAGE, UUID)
        self.assertIn('database_name = "' + m.DATABASE + '"', cfg)
        self.assertIn('database_id = "' + UUID + '"', cfg)
        self.assertIn("workers_dev = false", cfg)
        self.assertIn("preview_urls = false", cfg)
        self.assertNotIn("trendos-main", cfg)
        with self.assertRaises(m.StageBlocked):
            m.ephemeral_bound_toml(STAGE, "not_uuid")

    def test_remote_client_is_strict_allowlist(self):
        opener = FakeOpener()
        c = m.Cloudflare(ACCOUNT, TOKEN, opener)
        for method, path in (
            ("GET", "/d1/database/" + UUID + "/query"),
            ("POST", "/workers/scripts/trendos-d1-api/deployments"),
            ("POST", "/d1/database/5c4b92bf-e043-4f6e-bd6d-d514a92cd825/query"),
            ("GET", "/workers/scripts/trendos-d1-staging/settings"),
            ("GET", "/d1/database?per_page=100&page=0"),
        ):
            with self.assertRaisesRegex(m.StageBlocked, "NOT_ALLOWLISTED"):
                c.call(method, path)
        self.assertEqual(opener.requests, [])

    def test_stage_preflight_without_data_reads(self):
        opener = FakeOpener()
        c = m.Cloudflare(ACCOUNT, TOKEN, opener)
        self.assertTrue(c.confirm_stage())
        self.assertEqual(len(opener.requests), 3)
        self.assertTrue(all(x.get_method() == "GET" for x in opener.requests))

    def test_exact_name_filtered_cloudflare_d1_list_without_result_info(self):
        fake = FakeOpener()
        client = m.Cloudflare(ACCOUNT, TOKEN, fake)
        self.assertTrue(client.name_absent())
        self.assertEqual(len(fake.requests), 1)
        self.assertTrue(fake.requests[0].full_url.endswith(
            '/d1/database?name='+m.DATABASE+'&page=1&per_page=100'
        ))

    def test_d1_filter_must_return_only_empty_exact_name_results(self):
        class Existing(FakeOpener):
            def open(self, request, timeout):
                if request.full_url.endswith('per_page=100'):
                    return FakeResponse({'success':True,
                                         'result':[{'name':m.DATABASE}]})
                return super().open(request,timeout)
        class NotExact(FakeOpener):
            def open(self, request, timeout):
                if request.full_url.endswith('per_page=100'):
                    return FakeResponse({'success':True,
                                         'result':[{'name':'OTHER-PRIVATE-DATABASE'}]})
                return super().open(request,timeout)
        for fake in (Existing(),NotExact()):
            with self.assertRaises(m.StageBlocked):
                m.Cloudflare(ACCOUNT,TOKEN,fake).name_absent()

    def test_fake_create_and_verify_only_in_memory_remote_mock(self):
        opener = FakeOpener()
        c = m.Cloudflare(ACCOUNT, TOKEN, opener)
        self.assertTrue(c.confirm_stage())
        self.assertTrue(c.name_absent())
        self.assertEqual(c.create(), UUID)
        self.assertTrue(c.seed_and_verify(UUID, m.fixture_statements(FIXTURE)))
        self.assertEqual(sum(x.get_method() == "POST" for x in opener.requests), 11)
        self.assertTrue(all("trendos-d1-api" not in x.full_url
                            for x in opener.requests))

    def test_reader_must_remain_off_even_for_test_account(self):
        class Unsafe(FakeOpener):
            def open(self, request, timeout):
                result = super().open(request, timeout)
                if request.full_url.endswith("/settings"):
                    result.obj["result"]["bindings"][1]["text"] = "true"
                return result
        with self.assertRaisesRegex(m.StageBlocked, "STAGE_NOT_SYNTHETIC_READY"):
            m.Cloudflare(ACCOUNT, TOKEN, Unsafe()).confirm_stage()

    def test_explicit_owner_guard_default_off(self):
        self.assertEqual(m.main(["--validate"]), 0)
        # Mode without approval is blocked before any token or network use.
        # NEVER inherit production CI credentials or authorization in tests:
        # the old test accidentally invoked live Cloudflare on 2026-10-21.
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(m.main(["--create-seed"]), 2)


if __name__ == "__main__":
    unittest.main()
