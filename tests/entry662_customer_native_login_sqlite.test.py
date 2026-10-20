"""Entry662 native password login actual SQL — isolated SQLite, no network.
Uses only *fake* D1 customer/orders SQL migrations and synthetic credentials.
"""
import hashlib
import hmac
import importlib.util
import pathlib
import re
import sqlite3
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
fixture_path=ROOT/"tests/entry660_customer_native_orders_sqlite.test.py"
spec=importlib.util.spec_from_file_location("entry660_fixture",fixture_path)
fixture=importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixture)
NOW=fixture.NOW
SOURCE=(ROOT/"cloudflare-d1/src/customer-portal-native-login-v0.mjs").read_text()
PASSWORD="FAKE-Owner-Passphrase-Not-Real-2026!"
WRONG="WRONG-BUT-LONG-PASSWORD-2026!"
SALT="09"*16
HASH=hashlib.pbkdf2_hmac("sha256",PASSWORD.encode(),bytes.fromhex(SALT),100000).hex()
TOKEN="1f"*32
SECRET=fixture.SECRET

def sql(name):
    got=re.search(r"export const "+name+r"=`(.*?)`;",SOURCE,re.S)
    assert got,"missing "+name
    return got.group(1)

def token_fingerprint():
    import json
    payload=json.dumps(["trendos-customer-native-session-v1",TOKEN],
                       separators=(",",":"),ensure_ascii=False)
    return hmac.new(SECRET.encode(),payload.encode(),hashlib.sha256).hexdigest()

class NativeCustomerLoginSqlite(unittest.TestCase):
    def setUp(self):
        self.db=fixture.seeded()
        self.db.execute("""
          UPDATE customer_portal_native_accounts_v1
             SET password_salt_hex=?,password_hash_hex=?,must_change=0
           WHERE customer_id='C1'
        """,(SALT,HASH))
        self.db.commit()
    def tearDown(self):
        self.db.close()
    def lookup(self):
        return self.db.execute(sql("CUSTOMER_NATIVE_LOGIN_LOOKUP_SQL_V0"),
                               ("PC-C1",)).fetchone()
    def issue(self,snapshot=None,tokenmac=None):
        a=snapshot or self.lookup()
        return self.db.execute(sql("CUSTOMER_NATIVE_LOGIN_ISSUE_SESSION_SQL_V0"),(
            tokenmac or token_fingerprint(),NOW,NOW+8*3600000,
            a["customerId"],a["portalCode"],a["passwordSaltHex"],
            a["passwordHashHex"],a["sessionVersion"],a["failedAttempts"],NOW
        )).rowcount
    def fail_password(self,snapshot=None,now=NOW):
        a=snapshot or self.lookup()
        return self.db.execute(sql("CUSTOMER_NATIVE_LOGIN_FAILURE_CAS_SQL_V0"),(
            now+900000,a["customerId"],a["portalCode"],a["passwordSaltHex"],
            a["passwordHashHex"],a["sessionVersion"],a["failedAttempts"],now
        )).rowcount
    def test_01_pinned_native_password_session_works_with_entry660_reader(self):
        a=self.lookup()
        self.assertEqual(a["passwordHashHex"],HASH)
        self.assertEqual(self.issue(a),1)
        read=self.db.execute(fixture.sql("CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0"),
                             (token_fingerprint(),NOW,NOW)).fetchone()
        self.assertEqual(read["customerId"],"C1")
        self.assertEqual({row["orderId"] for row in self.db.execute(
            fixture.sql("CUSTOMER_NATIVE_ORDER_LINES_SQL_V0"),("C1",41,0))},{"O1","O5"})
        row=self.db.execute(
            "SELECT token_fingerprint_hex,expires_at_ms,source FROM customer_portal_native_sessions_v1 WHERE token_fingerprint_hex=?",
            (token_fingerprint(),)).fetchone()
        self.assertEqual(row["source"],"d1-customer-native")
        self.assertEqual(row["expires_at_ms"],NOW+8*3600000)
        self.assertNotEqual(row["token_fingerprint_hex"],TOKEN)
    def test_02_wrong_password_failure_cas_and_locked_after_five(self):
        for i in range(1,6):
            a=self.lookup()
            self.assertEqual(self.fail_password(a),1)
            q=self.db.execute("SELECT failed_attempts,locked_until_ms FROM customer_portal_native_accounts_v1 WHERE customer_id='C1'").fetchone()
            self.assertEqual(q["failed_attempts"],i)
            self.assertEqual(q["locked_until_ms"],NOW+900000 if i==5 else 0)
        self.assertEqual(self.issue(self.lookup()),0)
        self.assertEqual(self.fail_password(self.lookup()),0)
    def test_03_lock_expiry_resets_failure_count(self):
        for i in range(5):
            self.fail_password(self.lookup())
        self.assertEqual(self.fail_password(self.lookup(),NOW+900001),1)
        q=self.db.execute("SELECT failed_attempts,locked_until_ms FROM customer_portal_native_accounts_v1 WHERE customer_id='C1'").fetchone()
        self.assertEqual((q["failed_attempts"],q["locked_until_ms"]),(1,0))
    def test_04_password_rotation_after_pbkdf2_lookup_prevents_stale_issue(self):
        before=self.lookup()
        self.db.execute("UPDATE customer_portal_native_accounts_v1 SET password_hash_hex=? WHERE customer_id='C1'",("c"*64,))
        self.assertEqual(self.issue(before),0)
        self.assertEqual(self.fail_password(before),0)
    def test_05_failed_attempt_counter_race_invalidates_verified_snapshot(self):
        before=self.lookup()
        self.assertEqual(self.fail_password(before),1)
        self.assertEqual(self.issue(before),0)
        self.assertEqual(self.issue(self.lookup(),tokenmac="f"*64),1)
    def test_06_version_rotation_invalidates_login_and_future_reader(self):
        before=self.lookup()
        self.db.execute("UPDATE customer_portal_native_accounts_v1 SET session_version=2 WHERE customer_id='C1'")
        self.assertEqual(self.issue(before),0)
        self.assertEqual(self.fail_password(before),0)
    def test_07_control_off_canary_shadow_prevent_login(self):
        for mode in ("OFF","CANARY","SHADOW"):
            self.db.execute("UPDATE customer_portal_native_control_v1 SET mode=?",(mode,))
            self.assertIsNone(self.lookup())
            a=dict(self.db.execute("SELECT customer_id AS customerId,portal_code AS portalCode,password_salt_hex AS passwordSaltHex,password_hash_hex AS passwordHashHex,session_version AS sessionVersion,failed_attempts AS failedAttempts FROM customer_portal_native_accounts_v1 WHERE customer_id='C1'").fetchone())
            self.assertEqual(self.issue(a),0)
        self.db.execute("UPDATE customer_portal_native_control_v1 SET mode='GENERAL'")
        self.assertIsNotNone(self.lookup())
    def test_08_fake_same_code_second_active_customer_denies_login(self):
        self.db.execute("UPDATE t12_customers SET legacy_chat_code='PC-C1' WHERE customer_id='C2'")
        self.assertIsNone(self.lookup())
        old=dict(self.db.execute("SELECT customer_id AS customerId,portal_code AS portalCode,password_salt_hex AS passwordSaltHex,password_hash_hex AS passwordHashHex,session_version AS sessionVersion,failed_attempts AS failedAttempts FROM customer_portal_native_accounts_v1 WHERE customer_id='C1'").fetchone())
        self.assertEqual(self.issue(old),0)
    def test_09_inactive_or_unapproved_customer_denies_login(self):
        for update in [
          "UPDATE t12_customers SET active='لا' WHERE customer_id='C1'",
          "UPDATE customer_portal_native_accounts_v1 SET state='DISABLED' WHERE customer_id='C1'",
          "UPDATE customer_portal_native_accounts_v1 SET must_change=1 WHERE customer_id='C1'"
        ]:
            self.db.close()
            self.db=fixture.seeded()
            self.db.execute("UPDATE customer_portal_native_accounts_v1 SET password_salt_hex=?,password_hash_hex=?,must_change=0 WHERE customer_id='C1'",(SALT,HASH))
            self.db.execute(update)
            self.assertIsNone(self.lookup())
    def test_10_login_token_only_and_reader_denies_revocation(self):
        self.assertEqual(self.issue(),1)
        row=self.db.execute(fixture.sql("CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0"),
                            (token_fingerprint(),NOW,NOW)).fetchone()
        self.assertEqual(row["customerId"],"C1")
        self.db.execute("UPDATE customer_portal_native_sessions_v1 SET revoked_at_ms=? WHERE token_fingerprint_hex=?",(NOW,token_fingerprint()))
        after=self.db.execute(fixture.sql("CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0"),
                              (token_fingerprint(),NOW,NOW)).fetchone()
        self.assertIsNone(after)

if __name__=="__main__":
    unittest.main()
