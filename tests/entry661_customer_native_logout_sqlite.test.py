"""Entry661: actual disposable SQLite single-session CAS revocation tests."""
import pathlib
import re
import sys
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
from importlib.util import spec_from_file_location, module_from_spec
# The sibling fixture intentionally ends in .test.py, so normal Python
# package import would silently look for a non-existent module.
spec=spec_from_file_location("entry660_fixture", ROOT/"tests/entry660_customer_native_orders_sqlite.test.py")
fixture=module_from_spec(spec)
spec.loader.exec_module(fixture)
seeded,NOW,fingerprint,reader_sql=fixture.seeded,fixture.NOW,fixture.fingerprint,fixture.sql
SOURCE=(ROOT/"cloudflare-d1/src/customer-portal-native-logout-v0.mjs").read_text()
match=re.search(r"export const CUSTOMER_NATIVE_LOGOUT_CAS_SQL_V0=`(.*?)`;",SOURCE,re.S)
assert match, "missing logout CAS SQL"
CAS=match.group(1)

class NativeLogoutSqlite(unittest.TestCase):
    def setUp(self):
        self.db=seeded()
    def tearDown(self):
        self.db.close()
    def logout(self,now=NOW,mac=None):
        return self.db.execute(CAS,(now,mac or fingerprint(),now,now)).rowcount
    def session(self):
        return self.db.execute(reader_sql("CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0"),
                               (fingerprint(),NOW,NOW)).fetchone()
    def test_01_session_revocation_invalidates_future_get(self):
        self.assertIsNotNone(self.session())
        self.assertEqual(self.logout(),1)
        self.assertIsNone(self.session())
        self.assertEqual(self.logout(),0)
    def test_02_other_session_fingerprint_cannot_logout(self):
        self.assertEqual(self.logout(mac="0"*64),0)
        self.assertIsNotNone(self.session())
    def test_03_expired_and_future_issued_not_revoked(self):
        self.assertEqual(self.logout(now=NOW+31000),0)
        self.assertEqual(self.logout(now=NOW-90000),0)
    def test_04_password_session_version_mismatch_not_revoked(self):
        self.db.execute("UPDATE customer_portal_native_accounts_v1 SET session_version=2 WHERE customer_id='C1'")
        self.assertEqual(self.logout(),0)
    def test_05_disabled_control_modes_no_effect(self):
        for mode in ("OFF","SHADOW","CANARY"):
            self.db.execute("UPDATE customer_portal_native_control_v1 SET mode=?",(mode,))
            self.assertEqual(self.logout(),0)
        self.db.execute("UPDATE customer_portal_native_control_v1 SET mode='GENERAL'")
        self.assertIsNotNone(self.session())
    def test_06_ownership_mismatch_cannot_be_bypassed_with_code(self):
        self.db.execute("UPDATE t12_customers SET legacy_chat_code='DIFFERENT' WHERE customer_id='C1'")
        self.assertEqual(self.logout(),0)
    def test_07_inactive_customer_blocked(self):
        self.db.execute("UPDATE t12_customers SET active='لا' WHERE customer_id='C1'")
        self.assertEqual(self.logout(),0)
    def test_08_second_customer_session_not_revoked(self):
        # Only the matching token row is revoked, never a tenant-wide UPDATE.
        self.db.execute("""
            INSERT INTO customer_portal_native_sessions_v1
            (token_fingerprint_hex,customer_id,session_version,issued_at_ms,expires_at_ms,source)
            VALUES (?,'C2',1,?,?,'d1-customer-native')
        """,("a"*64,NOW-60000,NOW+30000))
        self.assertEqual(self.logout(),1)
        self.assertIsNone(self.db.execute(
            "SELECT revoked_at_ms FROM customer_portal_native_sessions_v1 WHERE customer_id='C2'"
        ).fetchone()["revoked_at_ms"])
if __name__=="__main__":
    unittest.main()
