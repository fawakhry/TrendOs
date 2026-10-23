"""Entry679 manifest: scoped read-only SQL on actual disposable canonical D1 schema."""
import importlib.util
import pathlib
import re
import unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location("entry666_fixture",
 ROOT/"tests/entry666_customer_native_r2_file_sqlite.test.py")
f=importlib.util.module_from_spec(spec)
spec.loader.exec_module(f)
SOURCE=(ROOT/"cloudflare-d1/src/customer-portal-native-handoff-manifest-v0.mjs").read_text()
match=re.search(r"export const CUSTOMER_DRAFT_HANDOFF_FILES_SQL_V0=`(.*?)`;",SOURCE,re.S)
assert match
SQL=match.group(1)
class ReadOnlyHandoffManifestSqlite(unittest.TestCase):
 def setUp(self):
  self.fixture=f.PrivateNativeFileSqlite(methodName="test_01_owned_reservation_is_pending_then_ready_only_on_finalize")
  self.fixture.setUp()
  self.db=self.fixture.db
 def tearDown(self):self.db.close()
 def files(self,draft=f.DRAFT):return self.db.execute(SQL,(draft,)).fetchall()
 def test_01_empty_ready_inventory_before_file_staging(self):
  self.assertEqual(len(self.files()),0)
 def test_02_ready_and_pending_rows_reflect_canonical_file_ledger(self):
  self.assertEqual(self.fixture.reserve(),1)
  self.assertEqual(self.files()[0]["fileState"],"PENDING")
  self.assertEqual(self.files()[0]["itemId"],f.ITEM)
  self.assertEqual(self.files()[0]["customerId"],"C1")
  self.assertEqual(self.fixture.finalize(),1)
  self.assertEqual(self.files()[0]["fileState"],"READY")
 def test_03_other_customer_draft_files_never_included(self):
  self.assertEqual(self.fixture.reserve(),1)
  self.assertEqual(len(self.files(f.OTHER_DRAFT)),0)
  self.assertEqual(len(self.files()),1)
 def test_04_select_never_mutates_finance_or_order(self):
  self.assertEqual(self.fixture.reserve(),1)
  changes=self.db.total_changes
  orderCount=self.db.execute("SELECT COUNT(*) FROM t12_prod_orders").fetchone()[0]
  self.files()
  self.assertEqual(self.db.total_changes,changes)
  self.assertEqual(self.db.execute("SELECT COUNT(*) FROM t12_prod_orders").fetchone()[0],orderCount)
if __name__=="__main__":unittest.main()
