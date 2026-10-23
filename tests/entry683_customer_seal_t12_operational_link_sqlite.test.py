"""Entry683: original real SQLite D1 tables, sealed operational source vs T12.
No new order writer, no financial ledger or remote service.
"""
import importlib.util
import json
import pathlib
import sqlite3
import unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("e682",ROOT/"tests/entry682_customer_draft_immutable_seal_sqlite.test.py")
e=importlib.util.module_from_spec(spec);spec.loader.exec_module(e)
f=e.f
from re import search, S
SOURCE=(ROOT/"cloudflare-d1/src/customer-portal-native-seal-t12-link-read-v0.mjs").read_text()
def sql(name):
 match=search(r"export const "+name+r"=`(.*?)`;",SOURCE,S)
 assert match,name
 return match.group(1)
SEAL=sql("CUSTOMER_SEAL_T12_LINK_SEAL_SQL_V0")
ORDER=sql("CUSTOMER_SEAL_T12_LINK_ORDER_SQL_V0")
LINES=sql("CUSTOMER_SEAL_T12_LINK_LINES_SQL_V0")
class SealedToCanonicalT12Sqlite(unittest.TestCase):
 def setUp(self):
  self.fixture=e.ImmutableDraftSealSqlite(methodName="test_01_one_statement_seal_contains_exact_registered_identity_item_and_request_key")
  self.fixture.setUp();self.db=self.fixture.db
  self.assertEqual(self.fixture.seal(),1)
  self.snapshot=json.loads(self.fixture.read()["snapshotJson"])
  self.key='cld1_'+str(f.NOW)+'_'+f.DRAFT[4:]
  self.order_id='FAKE-ORDER-981'
 def tearDown(self):self.db.close()
 def insert(self,status="COMMITTED",line=True):
  self.db.execute("""INSERT INTO t12_prod_request_ledger
   (request_key,actor,policy_epoch,canonical_json,order_id,status)
   VALUES (?,'signed-stage-actor','FAKE_POLICY','{}',?,?)""",
   (self.key,self.order_id,status))
  self.db.execute("""INSERT INTO t12_prod_orders
   (order_id,request_key,customer_mode,customer_name,customer_phone,department,
    priority,status,source,notes,actor)
   VALUES (?,?,'registered',?,?,'طباعة','عادي','طلب جديد','customer-native-draft','',
   'signed-stage-actor')""",
   (self.order_id,self.key,self.snapshot[3],self.snapshot[4]))
  if line:
   self.db.execute("""INSERT INTO t12_prod_lines
    (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,
     qty,priority,status,heat_press,fly_print)
    VALUES (?,?,?,1,'طباعة','','FAKE PRINTER ITEM',1,'عادي','طلب جديد',0,0)""",
    (self.order_id+'-01',self.order_id,self.key))
 def records(self):
  self.db.execute("SAVEPOINT entry683_operational_read")
  try:
   return (self.db.execute(SEAL,(f.DRAFT,)).fetchall(),
    self.db.execute(ORDER,(f.DRAFT,)).fetchall(),
    self.db.execute(LINES,(f.DRAFT,)).fetchall())
  finally:self.db.execute("RELEASE SAVEPOINT entry683_operational_read")
 def test_01_original_seal_has_no_canonical_order_and_no_invoice(self):
  rows=self.records()
  self.assertEqual([len(x) for x in rows],[1,0,0])
  self.assertEqual(rows[0][0]['customerId'],'C1')
  self.assertEqual(self.db.execute("SELECT COUNT(*) FROM t12_prod_orders").fetchone()[0],5)
 def test_02_committed_canonical_order_one_exact_line_is_readable_without_mutation(self):
  self.insert()
  before=self.db.total_changes
  seal,orders,lines=self.records()
  self.assertEqual(len(seal),len(orders))
  self.assertEqual(orders[0]['ledgerStatus'],'COMMITTED')
  self.assertEqual(orders[0]['orderId'],self.order_id)
  self.assertEqual(orders[0]['ledgerActor'],orders[0]['orderActor'])
  self.assertEqual(lines[0]['lineId'],self.order_id+'-01')
  self.assertEqual(lines[0]['qty'],self.snapshot[6][0][4])
  self.assertEqual(self.db.total_changes,before)
 def test_03_prepared_ledger_is_visible_but_not_a_committed_handoff(self):
  self.insert(status="PREPARED")
  self.assertEqual(self.records()[1][0]['ledgerStatus'],'PREPARED')
  self.assertEqual(self.records()[2][0]['lineId'],self.order_id+'-01')
 def test_04_missing_or_changed_line_is_detectable_not_silent_invoice(self):
  self.insert(line=False)
  self.assertEqual(self.records()[2],[])
  self.db.execute("""INSERT INTO t12_prod_lines
   (line_id,order_id,request_key,ordinal,department,assigned_to,item_name,
    qty,priority,status,heat_press,fly_print)
   VALUES (?,?,?,1,'طباعة','','ALTERED',2,'عادي','طلب جديد',0,0)""",
   (self.order_id+'-01',self.order_id,self.key))
  self.assertNotEqual(self.records()[2][0]['itemName'],self.snapshot[6][0][3])
 def test_05_another_order_request_cannot_be_mistaken_for_sealed_draft(self):
  self.insert()
  other_key='cld1_'+str(f.NOW)+'_'+'4'*32
  self.db.execute("""INSERT INTO t12_prod_request_ledger
   (request_key,actor,policy_epoch,canonical_json,order_id,status)
   VALUES (?,'other-stage-actor','FAKE_POLICY','{}','FAKE-OTHER-982','COMMITTED')""",
   (other_key,))
  self.db.execute("""INSERT INTO t12_prod_orders
   (order_id,request_key,customer_mode,customer_name,customer_phone,department,
    priority,status,source,notes,actor)
   VALUES ('FAKE-OTHER-982',?,'registered','ANY','123','طباعة','عادي','طلب جديد',
   'customer-native-draft','','other-stage-actor')""",(other_key,))
  _,related,_=self.records()
  self.assertEqual(len(related),1)
  self.assertEqual(related[0]['orderId'],self.order_id)
 def test_06_seal_cannot_be_edited_to_match_rogue_T12_ledger(self):
  self.insert()
  with self.assertRaises(sqlite3.DatabaseError):
   self.db.execute("UPDATE customer_portal_native_draft_seals_v1 SET t12_request_key='forged' WHERE draft_id=?",(f.DRAFT,))
  self.assertEqual(self.records()[1][0]['orderId'],self.order_id)
 def test_07_no_additional_order_or_balance_mutation_from_link_readback(self):
  self.insert()
  before=self.db.total_changes
  self.records()
  self.assertEqual(self.db.total_changes,before)
  self.assertEqual(self.db.execute("SELECT COUNT(*) FROM t12_prod_orders").fetchone()[0],6)
if __name__=="__main__":unittest.main()
