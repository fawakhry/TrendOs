"""Entry663 source-only native password update against disposable actual SQLite."""
import hashlib
import importlib.util
import pathlib
import re
import unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location(
 "entry660_fixture",ROOT/"tests/entry660_customer_native_orders_sqlite.test.py")
fixture=importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixture)
NOW=fixture.NOW
OLD="FAKE-Owner-Passphrase-Not-Real-2026!"
NEW="FAKE-Next-Passphrase-Not-Real-2027!"
OLD_SALT="09"*16
NEW_SALT="11"*16
def h(password,salt):
    return hashlib.pbkdf2_hmac("sha256",password.encode(),bytes.fromhex(salt),100000).hex()
OLD_HASH=h(OLD,OLD_SALT)
NEW_HASH=h(NEW,NEW_SALT)
SOURCE=(ROOT/"cloudflare-d1/src/customer-portal-native-change-password-v0.mjs").read_text()
def sql(key):
    got=re.search(r"export const "+key+r"=`(.*?)`;",SOURCE,re.S)
    assert got,key
    return got.group(1)

class NativeCustomerPasswordChangeSqlite(unittest.TestCase):
    def setUp(self):
        self.db=fixture.seeded()
        self.db.execute("""
          UPDATE customer_portal_native_accounts_v1
             SET password_salt_hex=?,password_hash_hex=?,must_change=0
           WHERE customer_id='C1'
        """,(OLD_SALT,OLD_HASH))
        self.db.commit()
    def tearDown(self):
        self.db.close()
    def read(self):
        return self.db.execute(sql("CUSTOMER_NATIVE_CHANGE_PASSWORD_LOOKUP_SQL_V0"),
                               (fixture.fingerprint(),NOW,NOW)).fetchone()
    def rotate(self,snapshot=None):
        a=snapshot or self.read()
        return self.db.execute(sql("CUSTOMER_NATIVE_CHANGE_PASSWORD_CAS_SQL_V0"),(
          NEW_SALT,NEW_HASH,a["customerId"],a["portalCode"],
          a["passwordSaltHex"],a["passwordHashHex"],a["sessionVersion"],
          fixture.fingerprint(),NOW,NOW
        )).rowcount
    def customer_state(self,customer="C1"):
        return self.db.execute(
          "SELECT password_hash_hex,session_version,failed_attempts,locked_until_ms FROM customer_portal_native_accounts_v1 WHERE customer_id=?",
          (customer,)).fetchone()
    def test_01_password_change_invalidates_read_session_immediately(self):
        self.assertIsNotNone(self.read())
        self.assertEqual(self.rotate(),1)
        self.assertIsNone(self.read())
        state=self.customer_state()
        self.assertEqual(state["password_hash_hex"],NEW_HASH)
        self.assertEqual(state["session_version"],2)
        self.assertEqual(self.rotate(snapshot={
            "customerId":"C1","portalCode":"PC-C1","passwordSaltHex":OLD_SALT,
            "passwordHashHex":OLD_HASH,"sessionVersion":1}),0)
    def test_02_two_sessions_both_become_stale(self):
        self.db.execute("""
         INSERT INTO customer_portal_native_sessions_v1
         (token_fingerprint_hex,customer_id,session_version,issued_at_ms,
          expires_at_ms,source)
         VALUES (?,'C1',1,?,?,'d1-customer-native')
        """,("f"*64,NOW-60000,NOW+30000))
        self.assertEqual(self.rotate(),1)
        for fingerprint in (fixture.fingerprint(),"f"*64):
            self.assertIsNone(self.db.execute(
              fixture.sql("CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0"),
              (fingerprint,NOW,NOW)).fetchone())
        self.assertEqual(self.db.execute(
          "SELECT COUNT(*) FROM customer_portal_native_sessions_v1 WHERE customer_id='C1'"
        ).fetchone()[0],2)
    def test_03_other_customer_password_unchanged(self):
        before=dict(self.customer_state("C2"))
        self.assertEqual(self.rotate(),1)
        self.assertEqual(dict(self.customer_state("C2")),before)
    def test_04_revoked_session_cannot_rotate(self):
        old=self.read()
        self.db.execute(
          "UPDATE customer_portal_native_sessions_v1 SET revoked_at_ms=? WHERE token_fingerprint_hex=?",
          (NOW,fixture.fingerprint()))
        self.assertIsNone(self.read())
        self.assertEqual(self.rotate(old),0)
    def test_05_expired_session_cannot_rotate(self):
        old=self.read()
        self.db.execute("UPDATE customer_portal_native_sessions_v1 SET expires_at_ms=? WHERE token_fingerprint_hex=?",
                        (NOW-1,fixture.fingerprint()))
        self.assertIsNone(self.read())
        self.assertEqual(self.rotate(old),0)
    def test_06_stale_password_hash_and_version_fence(self):
        old=self.read()
        self.db.execute("UPDATE customer_portal_native_accounts_v1 SET password_hash_hex=? WHERE customer_id='C1'",("c"*64,))
        self.assertEqual(self.rotate(old),0)
        self.db.execute("UPDATE customer_portal_native_accounts_v1 SET password_hash_hex=?,session_version=2 WHERE customer_id='C1'",(OLD_HASH,))
        self.assertEqual(self.rotate(old),0)
    def test_07_control_off_and_disabled_customer_deny(self):
        old=self.read()
        self.db.execute("UPDATE customer_portal_native_control_v1 SET mode='OFF'")
        self.assertIsNone(self.read())
        self.assertEqual(self.rotate(old),0)
        self.db.execute("UPDATE customer_portal_native_control_v1 SET mode='GENERAL'")
        self.db.execute("UPDATE t12_customers SET active='لا' WHERE customer_id='C1'")
        self.assertIsNone(self.read())
        self.assertEqual(self.rotate(old),0)
    def test_08_reset_failed_attempts_after_authorized_rotation(self):
        self.db.execute("""
         UPDATE customer_portal_native_accounts_v1
            SET failed_attempts=3,locked_until_ms=0 WHERE customer_id='C1'
        """)
        self.assertEqual(self.rotate(),1)
        after=self.customer_state()
        self.assertEqual((after["failed_attempts"],after["locked_until_ms"]),(0,0))

if __name__=="__main__":
  unittest.main()
