import importlib.util
import pathlib
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
FILE=ROOT/"tools/zg_customer_stage_d1_binding_resolver_v1.py"
spec=importlib.util.spec_from_file_location("zg_customer_stage_bind_resolver",FILE)
s=importlib.util.module_from_spec(spec)
spec.loader.exec_module(s)
SRC=(ROOT/"cloudflare-d1/wrangler.customer-stage.toml").read_text(encoding="utf-8")
D1="00000000-0000-4000-8000-000000000321"
GOOD_SETTINGS={"bindings":[{"name":"DB","type":"d1","id":D1},
                           {"name":"CUSTOMER_LOGIN_RATE_STAGE_V0","type":"durable_object_namespace"}]}
GOOD_SUB={"enabled":False,"previews_enabled":False}
GOOD_DBS=[{"name":s.DBNAME,"uuid":D1},{"name":"some-other-database","uuid":"deadbeef-dead-4000-8000-000000000111"}]
def result(source=SRC,settings=GOOD_SETTINGS,sub=GOOD_SUB,dbs=GOOD_DBS):
    return s.resolved_config(source,settings,sub,dbs)

class ResolverSafety(unittest.TestCase):
    def test_real_original_stage_source_kept_off_with_exact_synthetic_db(self):
        cfg=result()
        self.assertIn('database_name = "'+s.DBNAME+'"',cfg)
        self.assertIn('database_id = "'+D1+'"',cfg)
        self.assertIn('binding = "DB"',cfg)
        self.assertIn('workers_dev = false',cfg)
        self.assertIn('preview_urls = false',cfg)
        self.assertIn('TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED = "false"',cfg)
        self.assertEqual(cfg.count("[[d1_databases]]"),1)

    def test_wrong_database_uuid_or_name_denied(self):
        with self.assertRaises(ValueError):
            result(dbs=[{"name":s.DBNAME,"uuid":"11111111-1111-4111-8111-111111111111"}])
        with self.assertRaises(ValueError):
            result(dbs=[{"name":"trendos-main","uuid":D1}])
        with self.assertRaises(ValueError):
            result(dbs=GOOD_DBS+[GOOD_DBS[0]])

    def test_public_worker_or_enabled_preview_is_denied(self):
        for sub in ({"enabled":True,"previews_enabled":False},
                    {"enabled":False,"previews_enabled":True}, {}, None):
            with self.assertRaises(ValueError):result(sub=sub)

    def test_other_db_and_r2_bindings_denied(self):
        for b in (
            {"name":"DB","type":"d1","id":"11111111-1111-4111-8111-111111111111"},
            {"name":"DB","type":"r2_bucket","bucket_name":"production"},
            {"name":"OTHER","type":"d1","id":"11111111-1111-4111-8111-111111111111"}
        ):
            with self.assertRaises(ValueError):
                result(settings={"bindings":[GOOD_SETTINGS["bindings"][0],b]})

    def test_stage_local_flag_or_route_tamper_denied(self):
        with self.assertRaises(ValueError):
            result(source=SRC.replace('TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED = "false"',
                                      'TRENDOS_CUSTOMER_PORTAL_STAGING_ENABLED = "true"'))
        with self.assertRaises(ValueError):
            result(source=SRC+'\nroutes = ["example.com/*"]\n')

    def test_missing_legacy_db_binding_denied(self):
        for settings in ({},{"bindings":[]},
                         {"bindings":[{"name":"DB","type":"d1","id":D1},{"name":"DB","type":"d1","id":D1}]}):
            with self.assertRaises(ValueError):result(settings=settings)
if __name__=="__main__":
    unittest.main()
