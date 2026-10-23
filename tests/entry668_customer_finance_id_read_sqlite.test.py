"""Entry668: real SQLite SELECT using canonical EasyStore/TrendOS migrations.
All identities, balances and tokens are synthetic. No real D1, Google or R2.
"""
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
MAC=fixture.fingerprint()
OTHER_MAC="f"*64
SOURCE=(ROOT/"cloudflare-d1/src/customer-portal-easystore-finance-id-read-v0.mjs").read_text()
got=re.search(r"export const CUSTOMER_EASYSTORE_EXACT_ID_BALANCE_SQL_V0=`(.*?)`;",SOURCE,re.S)
assert got,"missing exact-ID financial SQL source"
QUERY=got.group(1)

class NativeCustomerFinanceExactIdSqlite(unittest.TestCase):
 def setUp(self):
  self.db=fixture.seeded()
  for name in (
   "0015_employee_accounting_zero_google_v1.sql",
   "0024_employee_accounting_party_balances_v1.sql"
  ):
   self.db.executescript((ROOT/"cloudflare-d1/migrations"/name).read_text())
  self.db.execute("UPDATE employee_accounting_control_v1 SET mode='READONLY' WHERE singleton=1")
  self.db.execute("UPDATE customer_portal_native_accounts_v1 SET must_change=0 WHERE customer_id IN ('C1','C2')")
  self.db.execute("""
   INSERT INTO customer_portal_native_sessions_v1
   (token_fingerprint_hex,customer_id,session_version,issued_at_ms,expires_at_ms,source)
   VALUES (?,'C2',1,?,?,'d1-customer-native')
  """,(OTHER_MAC,NOW-60000,NOW+30000))
  for code,amount in [("C1",125.50),("C2",983.75)]:
   self.db.execute("""
     INSERT INTO employee_accounting_party_balances_v1
     (party_type,party_id,party_name,balance,version,updated_at_ms)
     VALUES ('customer',?,?,?,3,?)
   """,(code,"FAKE CUSTOMER",amount,NOW-1000))
  self.db.execute("""
     INSERT INTO employee_accounting_party_balances_v1
     (party_type,party_id,party_name,balance,version,updated_at_ms)
     VALUES ('supplier','SUP1','FAKE CUSTOMER',8500,3,?)
  """,(NOW-1000,))
  self.db.commit()
 def tearDown(self):self.db.close()
 def read(self,mac=MAC,now=NOW):
  return self.db.execute(QUERY,(mac,now,now)).fetchone()
 def test_01_customer_balance_uses_verified_session_exact_id(self):
  before=self.db.total_changes
  row=self.read()
  self.assertEqual((row["customerId"],row["balance"]),("C1",125.5))
  self.assertEqual(row["balanceVersion"],3)
  self.assertEqual(row["balanceUpdatedAtMs"],NOW-1000)
  self.assertEqual(row["accountingMode"],"READONLY")
  self.assertEqual(self.db.total_changes,before)
 def test_02_cross_customer_and_supplier_same_name_not_leaked(self):
  self.assertEqual(self.read(OTHER_MAC)["balance"],983.75)
  self.assertNotEqual(self.read(MAC)["balance"],983.75)
  self.assertNotEqual(self.read(MAC)["balance"],8500)
  self.assertEqual(list(self.read(MAC).keys()),
   ["customerId","balance","balanceVersion","balanceUpdatedAtMs","accountingMode"])
 def test_03_missing_exact_id_returns_no_balance_not_false_zero(self):
  self.db.execute("""
    UPDATE employee_accounting_party_balances_v1
       SET party_id='PC-C1' WHERE party_type='customer' AND party_id='C1'
  """)
  self.assertIsNone(self.read())
 def test_04_revoked_and_expired_token_denied(self):
  self.db.execute("UPDATE customer_portal_native_sessions_v1 SET revoked_at_ms=? WHERE token_fingerprint_hex=?",(NOW,MAC))
  self.assertIsNone(self.read())
  self.db.execute("UPDATE customer_portal_native_sessions_v1 SET revoked_at_ms=NULL WHERE token_fingerprint_hex=?",(MAC,))
  self.assertIsNone(self.read(now=NOW+31000))
 def test_05_password_change_invalidates_financial_read(self):
  self.db.execute("UPDATE customer_portal_native_accounts_v1 SET session_version=2 WHERE customer_id='C1'")
  self.assertIsNone(self.read())
 def test_06_customer_control_modes_off_shadow_canary_denied(self):
  for mode in ("OFF","SHADOW","CANARY"):
   self.db.execute("UPDATE customer_portal_native_control_v1 SET mode=?",(mode,))
   self.assertIsNone(self.read(),mode)
 def test_07_finance_control_off_rejects(self):
  self.db.execute("UPDATE employee_accounting_control_v1 SET mode='OFF' WHERE singleton=1")
  self.assertIsNone(self.read())
 def test_08_customer_active_code_and_source_restrictions(self):
  self.db.execute("UPDATE t12_customers SET source='legacy-mirror' WHERE customer_id='C1'")
  self.assertIsNone(self.read())
  self.db.execute("UPDATE t12_customers SET source='cloud-native',active='لا' WHERE customer_id='C1'")
  self.assertIsNone(self.read())
  self.db.execute("UPDATE t12_customers SET active='نعم',legacy_chat_code='BAD' WHERE customer_id='C1'")
  self.assertIsNone(self.read())
 def test_09_ambiguous_legacy_code_blocks_balance(self):
  self.db.execute("UPDATE t12_customers SET legacy_chat_code='PC-C1' WHERE customer_id='C2'")
  self.assertIsNone(self.read())
 def test_10_missing_active_enrollment_or_must_change_blocks(self):
  self.db.execute("UPDATE customer_portal_native_accounts_v1 SET must_change=1 WHERE customer_id='C1'")
  self.assertIsNone(self.read())
  self.db.execute("UPDATE customer_portal_native_accounts_v1 SET must_change=0,verified_enrollment_ref='' WHERE customer_id='C1'")
  self.assertIsNone(self.read())
 def test_11_supplier_entry_does_not_satisfy_missing_customer_balance(self):
  self.db.execute("DELETE FROM employee_accounting_party_balances_v1 WHERE party_type='customer' AND party_id='C1'")
  self.assertIsNone(self.read())
 def test_12_finance_balance_version_zero_rejected_by_database_constraints(self):
  with self.assertRaises(Exception):
   self.db.execute("UPDATE employee_accounting_party_balances_v1 SET version=0 WHERE party_type='customer' AND party_id='C1'")
if __name__=="__main__":
 unittest.main()
