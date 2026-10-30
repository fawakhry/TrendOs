"""Read-only draft+quarantine SQL against actual existing D1 migrations in
a disposable local SQLite database. NO Cloudflare credentials or real clients.
"""
import pathlib
import re
import sqlite3
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
CF = ROOT / "cloudflare-d1"
MODULE = CF / "customer-stage/t12-draft-lossless-inventory-ro-internal-v0.mjs"
MIGRATIONS = [
    "0036_customer_portal_native_draft_create_v1.sql",
    "0037_customer_portal_native_draft_items_v1.sql",
    "0038_customer_portal_native_draft_file_r2_v1.sql",
    "0040_customer_portal_native_file_quarantine_v1.sql",
]
DRAFT = "CDR-" + "b"*32
OWNER = "SYNTHETIC-OWNER"
NOW = 1793393000000


def sql_constant(name):
    content = MODULE.read_text()
    result = re.search(r"export const " + re.escape(name) + r"=\`(.*?)\`", content, re.S)
    if result is None:
        raise AssertionError("SQL export missing: " + name)
    return result.group(1)


class ActualSQLiteDraftInventoryQueries(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="trendos-t12-inventory-only-")
        self.addCleanup(self.tmp.cleanup)
        self.db = sqlite3.connect(pathlib.Path(self.tmp.name) / "fixture.sqlite")
        self.addCleanup(self.db.close)
        self.db.execute("PRAGMA foreign_keys=ON")
        # Only a minimal parent table substitute is needed to apply the REAL
        # immutable customer draft/item/file/quarantine source migrations.
        self.db.execute("CREATE TABLE customer_portal_native_accounts_v1 (customer_id TEXT PRIMARY KEY)")
        self.db.execute(
            "INSERT INTO customer_portal_native_accounts_v1(customer_id) VALUES (?)",
            (OWNER,),
        )
        for name in MIGRATIONS:
            self.db.executescript((CF / "migrations" / name).read_text())
        self.db.execute(
            "INSERT INTO customer_portal_native_drafts_v1 "
            "(draft_id,customer_id,request_key,state,created_at_ms,updated_at_ms) "
            "VALUES (?,?,?,?,?,?)",
            (DRAFT,OWNER,"a"*32,"DRAFT",NOW,NOW),
        )
        self.files_sql = sql_constant("T12_DRAFT_INVENTORY_FILES_SQL_V0")
        self.quarantine_sql = sql_constant("T12_DRAFT_INVENTORY_QUARANTINE_SQL_V0")

    def item(self,n):
        itemid="CDI-"+format(n,"032x")
        self.db.execute(
            "INSERT INTO customer_portal_native_draft_items_v1 "
            "(item_id,draft_id,request_key,payload_mac_hex,ordinal,department,"
            " item_name,qty,notes,heat_press,fly_print,created_at_ms) "
            "VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
            (itemid,DRAFT,format(n,"032x"),"d"*64,n,"طباعة",
             "Synthetic "+str(n),2,"",0,0,NOW),
        )
        return itemid

    def file(self,n,itemid):
        fileid="CDF-"+format(n,"032x")
        self.db.execute(
            "INSERT INTO customer_portal_native_draft_files_v1 "
            "(file_id,draft_id,item_id,customer_id,request_key,sha256_hex,"
            " content_type,byte_size,r2_object_key,state,created_at_ms,updated_at_ms)"
            " VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
            (fileid,DRAFT,itemid,OWNER,format(n+1000,"032x"),"e"*64,
             "image/png",128,"customer-drafts/"+fileid,"PENDING",NOW,NOW),
        )
        self.db.execute(
            "UPDATE customer_portal_native_draft_files_v1 SET state='READY',updated_at_ms=? "
            "WHERE file_id=?", (NOW+1,fileid)
        )
        return fileid

    def test_real_migrations_owner_scoped_file_quarantine_join_and_immutability(self):
        i1=self.item(1)
        i2=self.item(2)
        f1=self.file(1,i1)
        f2=self.file(2,i2)
        files=self.db.execute(self.files_sql,(DRAFT,OWNER)).fetchall()
        rows=self.db.execute(self.quarantine_sql,(DRAFT,OWNER)).fetchall()
        self.assertEqual(len(files),2)
        self.assertEqual(len(rows),2)
        self.assertEqual({r[0] for r in files},{f1,f2})
        self.assertEqual({r[0] for r in rows},{f1,f2})
        self.assertTrue(all(r[7]=='READY' for r in files))
        self.assertTrue(all(r[6]=='QUARANTINED' and r[7]==0 and r[8]==0 for r in rows))
        with self.assertRaises(sqlite3.DatabaseError):
            self.db.execute("UPDATE customer_portal_native_file_quarantine_v1 "
                            "SET scan_completed=1 WHERE file_id=?",(f1,))

    def test_foreign_customer_never_reads_original_draft_private_file_or_quarantine(self):
        i=self.item(1)
        self.file(1,i)
        self.assertEqual(self.db.execute(self.files_sql,(DRAFT,"OTHER-CUSTOMER")).fetchall(),[])
        self.assertEqual(self.db.execute(self.quarantine_sql,(DRAFT,"OTHER-CUSTOMER")).fetchall(),[])
        self.db.execute("UPDATE customer_portal_native_drafts_v1 SET state='CANCELLED' WHERE draft_id=?",(DRAFT,))
        self.assertEqual(self.db.execute(self.files_sql,(DRAFT,OWNER)).fetchall(),[])

    def test_unknown_item_cannot_be_bound_to_private_file_when_fk_enforced(self):
        self.item(1)
        with self.assertRaises(sqlite3.IntegrityError):
            self.file(1,"CDI-"+"f"*32)


if __name__=="__main__":
    unittest.main()
