"""Entry664 — actual SQL against disposable D1-compatible SQLite migrations.
No real users, accounts, Google, Worker deployments, financial orders or R2.
"""
import importlib.util
import pathlib
import re
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location(
    "entry660_fixture",ROOT/"tests/entry660_customer_native_orders_sqlite.test.py"
)
fixture=importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixture)
NOW=fixture.NOW
MAC=fixture.fingerprint()
OTHER_MAC="f"*64
KEY1="cd"*16
KEY2="ef"*16
SOURCE=(ROOT/"cloudflare-d1/src/customer-portal-native-draft-create-v0.mjs").read_text()
def contract(name):
    match=re.search(r"export const "+name+r"=`(.*?)`;",SOURCE,re.S)
    assert match,name
    return match.group(1)
INSERT=contract("CUSTOMER_NATIVE_DRAFT_INSERT_SQL_V0")
READ=contract("CUSTOMER_NATIVE_DRAFT_READBACK_SQL_V0")
def did(n):
    return "CDR-"+format(n,"032x")

class NativeDraftCreateSqlite(unittest.TestCase):
    def setUp(self):
        self.db=fixture.seeded()
        self.db.executescript((ROOT/"cloudflare-d1/migrations/0036_customer_portal_native_draft_create_v1.sql").read_text())
        self.db.execute(
            "UPDATE customer_portal_native_accounts_v1 SET must_change=0 WHERE customer_id IN ('C1','C2')"
        )
        self.db.execute("""
            INSERT INTO customer_portal_native_sessions_v1
            (token_fingerprint_hex,customer_id,session_version,issued_at_ms,expires_at_ms,source)
            VALUES (?,'C2',1,?,?,'d1-customer-native')
        """,(OTHER_MAC,NOW-60000,NOW+30000))
        self.db.commit()
    def tearDown(self):
        self.db.close()
    def create(self,draftId=None,key=KEY1,mac=MAC,now=NOW):
        draftId=draftId or did(1)
        return self.db.execute(INSERT,
             (draftId,key,now,now,mac,now,now,now-86400000)).rowcount
    def owned(self,key=KEY1,mac=MAC,now=NOW):
        return self.db.execute(READ,(key,mac,now,now)).fetchone()
    def count(self):
        return self.db.execute("SELECT COUNT(*) FROM customer_portal_native_drafts_v1").fetchone()[0]
    def test_01_native_authenticated_client_creates_staging_only(self):
        orders=self.db.execute("SELECT COUNT(*) FROM t12_prod_orders").fetchone()[0]
        self.assertEqual(self.create(),1)
        row=self.owned()
        self.assertEqual((row["draftId"],row["state"]),(did(1),"DRAFT"))
        self.assertEqual(self.db.execute("SELECT customer_id FROM customer_portal_native_drafts_v1").fetchone()[0],"C1")
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM t12_prod_orders").fetchone()[0],orders)
        self.assertEqual(self.count(),1)
    def test_02_request_key_replay_keeps_one_draft(self):
        self.assertEqual(self.create(),1)
        self.assertEqual(self.create(did(2)),0)
        self.assertEqual(self.count(),1)
        self.assertEqual(self.owned()["draftId"],did(1))
    def test_03_request_key_cannot_cross_customers(self):
        self.assertEqual(self.create(),1)
        self.assertIsNone(self.owned(mac=OTHER_MAC))
        self.assertEqual(self.create(did(9),KEY1,OTHER_MAC),0)
        self.assertIsNone(self.owned(mac=OTHER_MAC))
        self.assertEqual(self.create(did(2),KEY2,OTHER_MAC),1)
        self.assertIsNone(self.owned(KEY2,MAC))
        self.assertEqual(self.owned(KEY2,OTHER_MAC)["draftId"],did(2))
    def test_04_revoked_session_denies_create_and_replay(self):
        self.assertEqual(self.create(),1)
        self.db.execute("UPDATE customer_portal_native_sessions_v1 SET revoked_at_ms=? WHERE token_fingerprint_hex=?",(NOW,MAC))
        self.assertIsNone(self.owned())
        self.assertEqual(self.create(did(2),KEY2),0)
    def test_05_expired_or_future_issued_session_denied(self):
        self.assertEqual(self.create(now=NOW+31000),0)
        self.assertEqual(self.create(now=NOW-90000),0)
        self.assertIsNone(self.owned(now=NOW+31000))
    def test_06_account_password_rotation_invalidates_session(self):
        self.db.execute("UPDATE customer_portal_native_accounts_v1 SET session_version=2 WHERE customer_id='C1'")
        self.assertEqual(self.create(),0)
        self.assertIsNone(self.owned())
    def test_07_off_shadow_canary_controls_deny(self):
        for mode in ("OFF","SHADOW","CANARY"):
            self.db.execute("UPDATE customer_portal_native_control_v1 SET mode=?",(mode,))
            self.assertEqual(self.create(),0)
            self.assertIsNone(self.owned())
        self.assertEqual(self.count(),0)
    def test_08_account_must_change_and_inactive_customer_deny(self):
        self.db.execute("UPDATE customer_portal_native_accounts_v1 SET must_change=1 WHERE customer_id='C1'")
        self.assertEqual(self.create(),0)
        self.db.execute("UPDATE customer_portal_native_accounts_v1 SET must_change=0 WHERE customer_id='C1'")
        self.db.execute("UPDATE t12_customers SET active='لا' WHERE customer_id='C1'")
        self.assertEqual(self.create(),0)
    def test_09_code_mismatch_or_ambiguous_active_code_denied(self):
        self.db.execute("UPDATE t12_customers SET legacy_chat_code='WRONG' WHERE customer_id='C1'")
        self.assertEqual(self.create(),0)
        self.db.execute("UPDATE t12_customers SET legacy_chat_code='PC-C1' WHERE customer_id='C1'")
        self.db.execute("UPDATE t12_customers SET legacy_chat_code='PC-C1' WHERE customer_id='C2'")
        self.assertEqual(self.create(),0)
    def test_10_only_twenty_new_drafts_per_day_but_replay_existing_allowed(self):
        for i in range(20):
            self.assertEqual(self.create(did(i+1),format(i+1,'032x')),1)
        self.assertEqual(self.count(),20)
        self.assertEqual(self.create(did(999),KEY2),0)
        self.assertEqual(self.create(did(99),format(1,'032x')),0)
        self.assertEqual(self.owned(format(1,'032x'))["draftId"],did(1))
    def test_11_older_drafts_do_not_consume_one_day_budget(self):
        for i in range(20):
            self.assertEqual(self.create(did(i+1),format(i+1,'032x')),1)
        self.db.execute(
            "UPDATE customer_portal_native_drafts_v1 SET created_at_ms=?,updated_at_ms=?",
            (NOW-90000000,NOW-90000000)
        )
        self.assertEqual(self.create(did(30),KEY2),1)
    def test_12_version_and_state_enforced_by_actual_sql_constraints(self):
        self.assertEqual(self.create(),1)
        with self.assertRaises(Exception):
            self.db.execute("UPDATE customer_portal_native_drafts_v1 SET state='PAID' WHERE draft_id=?",(did(1),))
        with self.assertRaises(Exception):
            self.db.execute("UPDATE customer_portal_native_drafts_v1 SET request_key='invalid' WHERE draft_id=?",(did(1),))
        self.assertEqual(self.count(),1)

if __name__=="__main__":
    unittest.main()
