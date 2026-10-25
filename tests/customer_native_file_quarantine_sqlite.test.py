"""Zero Google: D1 quarantine is mandatory, append-only, even after R2 READY.
Source-only fake customer records and local SQLite, never production D1.
"""
import importlib.util
import pathlib
import sqlite3
import unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('filefixture',
 ROOT/'tests/entry666_customer_native_r2_file_sqlite.test.py')
filefixture=importlib.util.module_from_spec(spec);spec.loader.exec_module(filefixture)
MIGRATION=(ROOT/'cloudflare-d1/migrations/0040_customer_portal_native_file_quarantine_v1.sql').read_text()
class QuarantineSqliteTest(unittest.TestCase):
 def setUp(self):
  self.fx=filefixture.PrivateNativeFileSqlite(methodName='test_01_owned_reservation_is_pending_then_ready_only_on_finalize')
  self.fx.setUp();self.db=self.fx.db
 def tearDown(self):self.fx.tearDown()
 def apply(self):self.db.executescript(MIGRATION)
 def row(self):
  return self.db.execute('SELECT * FROM customer_portal_native_file_quarantine_v1 LIMIT 1').fetchone()
 def count(self):
  return self.db.execute('SELECT COUNT(*) FROM customer_portal_native_file_quarantine_v1').fetchone()[0]
 def test_01_new_reservation_auto_enters_quarantine_even_when_r2_not_ready(self):
  self.apply()
  self.assertEqual(self.fx.reserve(),1)
  row=self.row()
  self.assertEqual(row['disposition'],'QUARANTINED')
  self.assertEqual(row['scan_completed'],0)
  self.assertEqual(row['print_release_authorized'],0)
  self.assertEqual(row['sha256_hex'],filefixture.CHECKSUM)
  self.assertEqual(row['customer_id'],'C1')
  self.assertEqual(self.fx.readback()['state'],'PENDING')
  self.assertEqual(self.fx.finalize(),1)
  self.assertEqual(self.fx.readback()['state'],'READY')
  self.assertEqual(self.row()['disposition'],'QUARANTINED')
 def test_02_backfill_old_staged_file_without_granting_trust(self):
  self.assertEqual(self.fx.reserve(),1)
  self.assertEqual(self.fx.finalize(),1)
  self.apply()
  self.assertEqual(self.count(),1)
  self.assertEqual(self.row()['disposition'],'QUARANTINED')
 def test_03_quarantine_cannot_be_cleaned_or_deleted_by_client_or_operator_sql(self):
  self.apply()
  self.assertEqual(self.fx.reserve(),1)
  for q in [
   "UPDATE customer_portal_native_file_quarantine_v1 SET disposition='CLEAN'",
   "UPDATE customer_portal_native_file_quarantine_v1 SET scan_completed=1",
   "UPDATE customer_portal_native_file_quarantine_v1 SET print_release_authorized=1",
   "UPDATE customer_portal_native_file_quarantine_v1 SET disposition='QUARANTINED'",
   "DELETE FROM customer_portal_native_file_quarantine_v1"
  ]:
   with self.assertRaises(sqlite3.DatabaseError):self.db.execute(q)
  self.assertEqual(self.count(),1)
 def test_04_original_source_hash_owner_key_scope_immutable_after_reservation(self):
  self.apply()
  self.assertEqual(self.fx.reserve(),1)
  for q in [
   "UPDATE customer_portal_native_draft_files_v1 SET sha256_hex='aa'||substr(sha256_hex,3)",
   "UPDATE customer_portal_native_draft_files_v1 SET customer_id='C2'",
   "UPDATE customer_portal_native_draft_files_v1 SET r2_object_key='other/'||file_id",
   "UPDATE customer_portal_native_draft_files_v1 SET byte_size=5",
   "UPDATE customer_portal_native_draft_files_v1 SET request_key='aa'",
   "UPDATE customer_portal_native_draft_files_v1 SET created_at_ms=1"
  ]:
   with self.assertRaises(sqlite3.DatabaseError):self.db.execute(q)
  self.assertEqual(self.fx.finalize(),1)
  self.assertEqual(self.row()['sha256_hex'],filefixture.CHECKSUM)
 def test_05_idempotent_retry_does_not_duplicate_quarantine_row(self):
  self.apply()
  self.assertEqual(self.fx.reserve(),1)
  self.assertEqual(self.fx.reserve(2),0)
  self.assertEqual(self.count(),1)
 def test_06_two_owner_private_files_both_quarantined_with_exact_scopes(self):
  self.apply()
  self.assertEqual(self.fx.reserve(),1)
  self.assertEqual(self.fx.reserve(2,draft=filefixture.OTHER_DRAFT,item=filefixture.OTHER_ITEM,
    token=filefixture.OTHER_MAC,key='cc'*16),1)
  rows=self.db.execute('SELECT customer_id,disposition FROM customer_portal_native_file_quarantine_v1 ORDER BY customer_id').fetchall()
  self.assertEqual([(r[0],r[1]) for r in rows],[('C1','QUARANTINED'),('C2','QUARANTINED')])
 def test_07_untrusted_scope_and_revoked_session_cannot_reserve_or_create_quarantine(self):
  self.apply()
  self.assertEqual(self.fx.reserve(token=filefixture.OTHER_MAC),0)
  self.db.execute('UPDATE customer_portal_native_sessions_v1 SET revoked_at_ms=? WHERE token_fingerprint_hex=?',
    (filefixture.NOW,filefixture.MAC))
  self.assertEqual(self.fx.reserve(),0)
  self.assertEqual(self.count(),0)
 def test_08_official_t12_writer_and_existing_order_rows_unchanged(self):
  before=self.db.execute('SELECT COUNT(*) FROM t12_prod_orders').fetchone()[0]
  self.apply();self.assertEqual(self.fx.reserve(),1);self.assertEqual(self.fx.finalize(),1)
  after=self.db.execute('SELECT COUNT(*) FROM t12_prod_orders').fetchone()[0]
  self.assertEqual(before,after)
  schema=self.db.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='customer_portal_native_file_quarantine_v1'").fetchone()[0]
  self.assertIn("CHECK(disposition='QUARANTINED')",schema)
if __name__=='__main__':unittest.main()
