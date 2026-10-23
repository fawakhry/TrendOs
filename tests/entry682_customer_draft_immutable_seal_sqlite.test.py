"""Entry682 canonical SQLite draft seal, immutable staging, no official T12 writes."""
import importlib.util
import json
import pathlib
import re
import sqlite3
import unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('e666',
 ROOT/'tests/entry666_customer_native_r2_file_sqlite.test.py')
f=importlib.util.module_from_spec(spec);spec.loader.exec_module(f)
src=(ROOT/'cloudflare-d1/src/customer-portal-native-draft-seal-v0.mjs').read_text()
def sql(name):
 m=re.search(r'export const '+name+r'=`(.*?)`;',src,re.S)
 assert m,name
 return m.group(1)
SEAL=sql('CUSTOMER_DRAFT_SEAL_INSERT_SQL_V0')
READ=sql('CUSTOMER_DRAFT_SEAL_SCOPED_READBACK_SQL_V0')
MIGRATION=(ROOT/'cloudflare-d1/migrations/0039_customer_portal_native_draft_seal_v1.sql').read_text()
class ImmutableDraftSealSqlite(unittest.TestCase):
 def setUp(self):
  self.fx=f.PrivateNativeFileSqlite(methodName='test_01_owned_reservation_is_pending_then_ready_only_on_finalize')
  self.fx.setUp()
  self.db=self.fx.db
  self.db.executescript(MIGRATION)
 def tearDown(self):self.db.close()
 def seal(self,token=f.MAC,draft=f.DRAFT,now=f.NOW):
  return self.db.execute(SEAL,(now,draft,token,now,now)).rowcount
 def read(self,token=f.MAC,draft=f.DRAFT,now=f.NOW):
  return self.db.execute(READ,(draft,token,now,now)).fetchone()
 def count(self):
  return self.db.execute('SELECT COUNT(*) FROM customer_portal_native_draft_seals_v1').fetchone()[0]
 def order_count(self):
  return self.db.execute('SELECT COUNT(*) FROM t12_prod_orders').fetchone()[0]
 def test_01_one_statement_seal_contains_exact_registered_identity_item_and_request_key(self):
  count=self.order_count()
  self.assertEqual(self.seal(),1)
  self.assertEqual(self.seal(),0)
  row=self.read()
  self.assertEqual(row['customerId'],'C1')
  self.assertEqual(row['sealStage'],'SEALED')
  self.assertEqual(row['t12RequestKey'],'cld1_'+str(f.NOW)+'_'+f.DRAFT[4:])
  snap=json.loads(row['snapshotJson'])
  self.assertEqual(snap[1],f.DRAFT)
  self.assertEqual(snap[2],'C1')
  self.assertEqual(len(snap[6]),1)
  self.assertEqual(snap[6][0][0],f.ITEM)
  self.assertEqual(snap[7],[])
  self.assertEqual(self.count(),1)
  self.assertEqual(self.order_count(),count)
 def test_02_sealed_draft_blocks_late_item_insert_and_edit_delete(self):
  self.assertEqual(self.seal(),1)
  with self.assertRaises(sqlite3.DatabaseError):
   self.fx.db.execute('''INSERT INTO customer_portal_native_draft_items_v1
    (item_id,draft_id,request_key,payload_mac_hex,ordinal,department,item_name,qty,
     notes,heat_press,fly_print,created_at_ms)
    VALUES (?,?,?, ?,2,'ليزر','LATE',1,'',0,0,?)''',
    ('CDI-'+'99'*16,f.DRAFT,'ff'*16,'b'*64,f.NOW))
  with self.assertRaises(sqlite3.DatabaseError):
   self.db.execute('UPDATE customer_portal_native_draft_items_v1 SET qty=4 WHERE draft_id=?',(f.DRAFT,))
  with self.assertRaises(sqlite3.DatabaseError):
   self.db.execute('DELETE FROM customer_portal_native_draft_items_v1 WHERE draft_id=?',(f.DRAFT,))
  self.assertEqual(json.loads(self.read()['snapshotJson'])[6][0][4],1)
 def test_03_draft_and_seal_itself_cannot_be_updated_or_deleted(self):
  self.assertEqual(self.seal(),1)
  for q,arg in [
   ('UPDATE customer_portal_native_drafts_v1 SET state=\'CANCELLED\' WHERE draft_id=?',f.DRAFT),
   ('DELETE FROM customer_portal_native_drafts_v1 WHERE draft_id=?',f.DRAFT),
   ('DELETE FROM customer_portal_native_draft_seals_v1 WHERE draft_id=?',f.DRAFT),
   ("UPDATE customer_portal_native_draft_seals_v1 SET stage='SEALED' WHERE draft_id=?",f.DRAFT)]:
   with self.assertRaises(sqlite3.DatabaseError):self.db.execute(q,(arg,))
  self.assertEqual(self.count(),1)
 def test_04_pending_R2_prevents_seal_then_READY_can_seal_once(self):
  self.assertEqual(self.fx.reserve(),1)
  self.assertEqual(self.seal(),0)
  self.assertEqual(self.fx.finalize(),1)
  self.assertEqual(self.seal(),1)
  snap=json.loads(self.read()['snapshotJson'])
  self.assertEqual(len(snap[7]),1)
  self.assertEqual(snap[7][0][0],'CDF-'+format(1,'032x'))
  with self.assertRaises(sqlite3.DatabaseError):
   self.db.execute("UPDATE customer_portal_native_draft_files_v1 SET state='PENDING' WHERE draft_id=?",(f.DRAFT,))
  with self.assertRaises(sqlite3.DatabaseError):
   self.db.execute('DELETE FROM customer_portal_native_draft_files_v1 WHERE draft_id=?',(f.DRAFT,))
  with self.assertRaises(sqlite3.DatabaseError):
   self.db.execute('''INSERT INTO customer_portal_native_draft_files_v1
    (file_id,draft_id,item_id,customer_id,request_key,sha256_hex,content_type,byte_size,
     r2_object_key,state,created_at_ms,updated_at_ms)
    VALUES (?,?,?,'C1',?,?, 'image/png',1024,?,'READY',?,?)''',
    ('CDF-'+'77'*16,f.DRAFT,f.ITEM,'aa'*16,'b'*64,'customer-drafts/CDF-'+'77'*16,f.NOW,f.NOW))
 def test_05_owner_otp_rotation_revocation_and_control_off_fail_to_seal(self):
  self.assertEqual(self.seal(token=f.OTHER_MAC),0)
  self.db.execute('UPDATE customer_portal_native_sessions_v1 SET revoked_at_ms=? WHERE token_fingerprint_hex=?',(f.NOW,f.MAC))
  self.assertEqual(self.seal(),0)
  self.db.execute('UPDATE customer_portal_native_sessions_v1 SET revoked_at_ms=NULL WHERE token_fingerprint_hex=?',(f.MAC,))
  self.db.execute("UPDATE customer_portal_native_control_v1 SET mode='OFF'")
  self.assertEqual(self.seal(),0)
  self.db.execute("UPDATE customer_portal_native_control_v1 SET mode='GENERAL'")
  self.assertEqual(self.seal(),1)
 def test_06_existing_T12_request_and_duplicate_customer_code_block_seal(self):
  key='cld1_'+str(f.NOW)+'_'+f.DRAFT[4:]
  self.db.execute("""INSERT INTO t12_prod_request_ledger
   (request_key,actor,policy_epoch,canonical_json,order_id,status)
   VALUES (?,'FAKE_OPERATOR','FAKE_POLICY','{}','FAKE_ORDER','PREPARED')""",(key,))
  self.assertEqual(self.seal(),0)
  self.db.execute('DELETE FROM t12_prod_request_ledger WHERE request_key=?',(key,))
  self.db.execute("UPDATE t12_customers SET legacy_chat_code='PC-C1' WHERE customer_id='C2'")
  self.assertEqual(self.seal(),0)
  self.db.execute("UPDATE t12_customers SET legacy_chat_code='PC-C2' WHERE customer_id='C2'")
  self.assertEqual(self.seal(),1)
 def test_07_seal_leaves_other_draft_editable_and_leaves_finance_T12_untouched(self):
  before=self.order_count()
  self.assertEqual(self.seal(),1)
  self.assertEqual(self.fx.reserve(number=1,draft=f.OTHER_DRAFT,item=f.OTHER_ITEM,
   token=f.OTHER_MAC,key='cc'*16),1)
  self.assertEqual(self.order_count(),before)
  self.assertEqual(self.count(),1)
 def test_08_multiple_original_items_ordered_and_sealed(self):
  for n in range(2,51):
   self.db.execute("""INSERT INTO customer_portal_native_draft_items_v1
    (item_id,draft_id,request_key,payload_mac_hex,ordinal,
     department,item_name,qty,notes,heat_press,fly_print,created_at_ms)
    VALUES (?,?,?, ?,?,'طباعة',?,1,'',0,0,?)""",
    ('CDI-'+format(n,'032x'),f.DRAFT,format(n+100,'032x'),'b'*64,n,'ITEM'+str(n),f.NOW))
  self.assertEqual(self.seal(),1)
  rows=json.loads(self.read()['snapshotJson'])[6]
  self.assertEqual(len(rows),50)
  self.assertEqual([row[1] for row in rows],list(range(1,51)))
  with self.assertRaises(sqlite3.DatabaseError):
   self.db.execute('UPDATE customer_portal_native_draft_items_v1 SET qty=3 WHERE draft_id=?',(f.DRAFT,))
 def test_09_seal_scoped_readback_revoked_after_freeze_does_not_unseal(self):
  self.assertEqual(self.seal(),1)
  self.db.execute('UPDATE customer_portal_native_sessions_v1 SET revoked_at_ms=? WHERE token_fingerprint_hex=?',(f.NOW,f.MAC))
  self.assertIsNone(self.read())
  self.assertEqual(self.count(),1)
  with self.assertRaises(sqlite3.DatabaseError):
   self.db.execute('DELETE FROM customer_portal_native_draft_items_v1 WHERE draft_id=?',(f.DRAFT,))
if __name__=='__main__':unittest.main()
