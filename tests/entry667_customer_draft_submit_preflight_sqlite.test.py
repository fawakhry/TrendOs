"""Entry667: canonical submit preflight read-only over real ephemeral SQLite.
No D1 production, no official order or finance mutation and no Google.
"""
import importlib.util
import pathlib
import re
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location(
 "entry666_fixture",ROOT/"tests/entry666_customer_native_r2_file_sqlite.test.py"
)
fixture=importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixture)
NOW=fixture.NOW
DRAFT=fixture.DRAFT
MAC=fixture.MAC
SOURCE=(ROOT/"cloudflare-d1/src/customer-portal-native-submit-preflight-v0.mjs").read_text()
def sql(name):
 m=re.search(r"export const "+name+r"=`(.*?)`;",SOURCE,re.S)
 assert m,name
 return m.group(1)
OWNER=sql("CUSTOMER_DRAFT_SUBMIT_SCOPED_SQL_V0")
ITEMS=sql("CUSTOMER_DRAFT_SUBMIT_ITEMS_SQL_V0")
FILES=sql("CUSTOMER_DRAFT_SUBMIT_FILES_SQL_V0")
EXISTING=sql("CUSTOMER_DRAFT_SUBMIT_EXISTING_T12_REQUEST_SQL_V0")

class NativeSubmitPreflightSqlite(unittest.TestCase):
 def setUp(self):
  f=fixture.PrivateNativeFileSqlite(methodName="test_01_owned_reservation_is_pending_then_ready_only_on_finalize")
  f.setUp()
  self.db=f.db
  self.db.execute("UPDATE t12_customers SET phone='01012345678' WHERE customer_id='C1'")
  self.db.commit()
 def tearDown(self):self.db.close()
 def owner(self,mac=MAC,now=NOW,draft=DRAFT):
  return self.db.execute(OWNER,(draft,mac,now,now)).fetchone()
 def items(self,draft=DRAFT):
  return self.db.execute(ITEMS,(draft,)).fetchall()
 def files(self,draft=DRAFT):
  return self.db.execute(FILES,(draft,)).fetchone()
 def official_count(self):
  return self.db.execute("SELECT COUNT(*) FROM t12_prod_orders").fetchone()[0]
 def test_01_exact_owner_one_line_no_files_read_only(self):
  before=self.official_count()
  row=self.owner()
  self.assertIsNotNone(row)
  self.assertEqual(row["customerId"],"C1")
  self.assertEqual(row["customerSource"],"cloud-native")
  self.assertEqual(len(self.items()),1)
  self.assertEqual(self.files()["fileCount"],0)
  self.assertEqual(self.official_count(),before)
 def test_02_cross_customer_cannot_retrieve_draft(self):
  self.assertIsNone(self.owner(fixture.OTHER_MAC))
  self.assertIsNone(self.owner("a"*64))
 def test_03_revoked_session_no_preflight(self):
  self.db.execute("UPDATE customer_portal_native_sessions_v1 SET revoked_at_ms=? WHERE token_fingerprint_hex=?",(NOW,MAC))
  self.assertIsNone(self.owner())
 def test_04_password_rotation_no_preflight(self):
  self.db.execute("UPDATE customer_portal_native_accounts_v1 SET session_version=2 WHERE customer_id='C1'")
  self.assertIsNone(self.owner())
 def test_05_off_shadow_canary_and_customer_inactive_denied(self):
  for mode in ("OFF","CANARY","SHADOW"):
   self.db.execute("UPDATE customer_portal_native_control_v1 SET mode=?",(mode,))
   self.assertIsNone(self.owner())
  self.db.execute("UPDATE customer_portal_native_control_v1 SET mode='GENERAL'")
  self.db.execute("UPDATE t12_customers SET active='لا' WHERE customer_id='C1'")
  self.assertIsNone(self.owner())
 def test_06_non_native_legacy_customer_cannot_create_delegated_intent(self):
  self.db.execute("UPDATE t12_customers SET source='legacy-mirror' WHERE customer_id='C1'")
  self.assertIsNone(self.owner())
 def test_07_submitted_and_cancelled_drafts_denied(self):
  for state in ("SUBMITTED","CANCELLED"):
   self.db.execute("UPDATE customer_portal_native_drafts_v1 SET state=? WHERE draft_id=?",(state,DRAFT))
   self.assertIsNone(self.owner())
 def test_08_more_than_one_independent_draft_item_visible_and_must_refuse(self):
  self.db.execute("""
    INSERT INTO customer_portal_native_draft_items_v1
      (item_id,draft_id,request_key,payload_mac_hex,ordinal,
       department,item_name,qty,notes,heat_press,fly_print,created_at_ms)
    VALUES (?,?,?, ?,2,'ليزر','FAKE ITEM TWO',1,'',0,0,?)
  """,("CDI-"+"99"*16,DRAFT,"ee"*16,"a"*64,NOW))
  self.assertEqual(len(self.items()),2)
  self.assertEqual(self.official_count(),5)
 def test_09_pending_and_ready_r2_files_require_explicit_t12_handoff(self):
  self.assertEqual(self.files()["fileCount"],0)
  self.assertEqual(fixture.PrivateNativeFileSqlite.reserve(self,number=1),1)
  self.assertEqual(self.files()["fileCount"],1)
  self.assertEqual(self.files()["notReady"],1)
  self.assertEqual(fixture.PrivateNativeFileSqlite.finalize(self,number=1),1)
  self.assertEqual(self.files()["fileCount"],1)
  self.assertEqual(self.files()["notReady"],0)
 def test_10_ambiguous_or_duplicate_customer_code_and_session_expiry_denied(self):
  self.db.execute("UPDATE t12_customers SET legacy_chat_code='PC-C1' WHERE customer_id='C2'")
  self.assertIsNone(self.owner())
  self.db.execute("UPDATE t12_customers SET legacy_chat_code='PC-C2' WHERE customer_id='C2'")
  self.assertIsNone(self.owner(now=NOW+31000))
 def test_11_t12_existing_cloud_request_needs_manual_reconciliation(self):
  key='cld1_'+str(NOW)+'_'+DRAFT[4:]
  self.assertIsNone(self.db.execute(EXISTING,(DRAFT,)).fetchone())
  self.db.execute("""
    INSERT INTO t12_prod_request_ledger
      (request_key,actor,policy_epoch,canonical_json,order_id,status)
    VALUES (?, 'FAKE_ACTOR', 'FAKE_EPOCH', '{}', 'FAKE_ORDER', 'PREPARED')
  """,(key,))
  self.assertEqual(self.db.execute(EXISTING,(DRAFT,)).fetchone()['status'],'PREPARED')
  self.db.execute("UPDATE t12_prod_request_ledger SET status='COMMITTED' WHERE request_key=?",(key,))
  self.assertEqual(self.db.execute(EXISTING,(DRAFT,)).fetchone()['status'],'COMMITTED')
  self.assertIsNone(self.db.execute(EXISTING,(fixture.OTHER_DRAFT,)).fetchone())
 def test_13_owner_items_files_and_t12_ledger_share_read_transaction(self):
  self.db.execute("SAVEPOINT entry681_submit_read")
  try:
   owner=self.db.execute(OWNER,(DRAFT,MAC,NOW,NOW)).fetchall()
   items=self.db.execute(ITEMS,(DRAFT,)).fetchall()
   files=self.db.execute(FILES,(DRAFT,)).fetchall()
   prior=self.db.execute(EXISTING,(DRAFT,)).fetchall()
   self.assertEqual(len(owner),1)
   self.assertEqual(len(items),1)
   self.assertEqual(files[0]["fileCount"],0)
   self.assertEqual(prior,[])
  finally:
   self.db.execute("RELEASE SAVEPOINT entry681_submit_read")
 def test_12_read_only_sql_does_not_change_source_orders_or_drafts(self):
  before=self.db.total_changes
  self.owner();self.items();self.files();self.db.execute(EXISTING,(DRAFT,)).fetchone()
  self.assertEqual(self.db.total_changes,before)
if __name__=="__main__":unittest.main()
