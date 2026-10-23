"""Entry675 read-only pending audit of canonical D1 source ledger; no R2 writes."""
import importlib.util
import pathlib
import re
import unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location(
 "entry666_fixture",ROOT/"tests/entry666_customer_native_r2_file_sqlite.test.py"
)
f=importlib.util.module_from_spec(spec)
spec.loader.exec_module(f)
SOURCE=(ROOT/"cloudflare-d1/src/customer-portal-native-r2-pending-audit-v0.mjs").read_text()
m=re.search(r"export const CUSTOMER_R2_PENDING_AUDIT_SQL_V0=`(.*?)`;",SOURCE,re.S)
assert m
SQL=m.group(1)
class ReadOnlyPendingAuditSqlite(unittest.TestCase):
 def setUp(self):
  self.fixture=f.PrivateNativeFileSqlite(methodName="test_01_owned_reservation_is_pending_then_ready_only_on_finalize")
  self.fixture.setUp()
  self.db=self.fixture.db
  self.assertEqual(self.fixture.reserve(),1)
  self.fileId="CDF-"+format(1,"032x")
 def tearDown(self):self.db.close()
 def find(self,fileId=None):return self.db.execute(SQL,(fileId or self.fileId,)).fetchone()
 def test_01_staged_pending_scoped_to_canonical_draft_and_item(self):
  self.assertEqual(self.find()["fileId"],self.fileId)
  self.assertEqual(self.find()["draftState"],"DRAFT")
  self.assertEqual(self.find()["fileState"],"PENDING")
  self.assertEqual(self.find()["objectKey"],"customer-drafts/"+self.fileId)
 def test_02_ready_not_returned_as_pending(self):
  self.assertEqual(self.fixture.finalize(),1)
  self.assertIsNone(self.find())
 def test_03_cancelled_draft_not_misclassified_ready(self):
  self.db.execute("UPDATE customer_portal_native_drafts_v1 SET state='CANCELLED' WHERE draft_id=?",(f.DRAFT,))
  self.assertEqual(self.find()["draftState"],"CANCELLED")
 def test_04_cross_item_foreign_key_scope_tamper_excluded(self):
  self.db.execute("PRAGMA foreign_keys=OFF")
  self.db.execute("UPDATE customer_portal_native_draft_files_v1 SET customer_id='C2' WHERE file_id=?",(self.fileId,))
  self.assertIsNone(self.find())
 def test_05_readonly_audit_never_updates_ledger_or_orders(self):
  before=self.db.total_changes
  orders=self.db.execute("SELECT COUNT(*) FROM t12_prod_orders").fetchone()[0]
  self.find()
  self.assertEqual(self.db.total_changes,before)
  self.assertEqual(self.db.execute("SELECT COUNT(*) FROM t12_prod_orders").fetchone()[0],orders)
if __name__=="__main__":unittest.main()
