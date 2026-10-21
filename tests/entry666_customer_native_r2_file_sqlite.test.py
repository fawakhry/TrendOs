"""Entry666: actual D1-compatible SQL on ephemeral SQLite, no live R2/Cloudflare."""
import importlib.util
import pathlib
import re
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location(
    "entry660_fixture",ROOT/"tests/entry660_customer_native_orders_sqlite.test.py"
)
fixture=importlib.util.module_from_spec(spec)
spec.loader.exec_module(fixture)
NOW=fixture.NOW
MAC=fixture.fingerprint()
OTHER_MAC="f"*64
DRAFT="CDR-"+"22"*16
ITEM="CDI-"+"33"*16
OTHER_DRAFT="CDR-"+"44"*16
OTHER_ITEM="CDI-"+"55"*16
FILE="CDF-"+"66"*16
KEY="aa"*16
CHECKSUM="bb"*32
SOURCE=(ROOT/"cloudflare-d1/src/customer-portal-native-draft-file-r2-v0.mjs").read_text()

def sql(name):
    match=re.search(r"export const "+name+r"=`(.*?)`;",SOURCE,re.S)
    assert match, name
    return match.group(1)
RESERVE=sql("CUSTOMER_NATIVE_FILE_RESERVE_SQL_V0")
READ=sql("CUSTOMER_NATIVE_FILE_READBACK_SQL_V0")
FINALIZE=sql("CUSTOMER_NATIVE_FILE_FINALIZE_CAS_SQL_V0")

class PrivateNativeFileSqlite(unittest.TestCase):
    def setUp(self):
        self.db=fixture.seeded()
        for file in (
            "0036_customer_portal_native_draft_create_v1.sql",
            "0037_customer_portal_native_draft_items_v1.sql",
            "0038_customer_portal_native_draft_file_r2_v1.sql"
        ):
            self.db.executescript(
                (ROOT/"cloudflare-d1/migrations"/file).read_text()
            )
        self.db.execute("""
          UPDATE customer_portal_native_accounts_v1
             SET must_change=0 WHERE customer_id IN ('C1','C2')
        """)
        self.db.execute("""
          INSERT INTO customer_portal_native_sessions_v1
          (token_fingerprint_hex,customer_id,session_version,issued_at_ms,
           expires_at_ms,source)
          VALUES (?,'C2',1,?,?,'d1-customer-native')
        """,(OTHER_MAC,NOW-60000,NOW+30000))
        for draft,item,customer,n in (
            (DRAFT,ITEM,"C1",1),(OTHER_DRAFT,OTHER_ITEM,"C2",2)
        ):
            self.db.execute("""
              INSERT INTO customer_portal_native_drafts_v1
              (draft_id,customer_id,request_key,created_at_ms,updated_at_ms)
              VALUES (?,?,?,?,?)
            """,(draft,customer,format(n,"032x"),NOW,NOW))
            self.db.execute("""
              INSERT INTO customer_portal_native_draft_items_v1
              (item_id,draft_id,request_key,payload_mac_hex,ordinal,
               department,item_name,qty,notes,heat_press,fly_print,created_at_ms)
              VALUES (?,?,?,?,1,'طباعة','FAKE PRINTER ITEM',1,'',0,0,?)
            """,(item,draft,format(n+10,"032x"),"a"*64,NOW))
        self.db.commit()
    def tearDown(self):
        self.db.close()
    def reserve(self,number=1,draft=DRAFT,item=ITEM,token=MAC,key=KEY,now=NOW,checksum=CHECKSUM):
        fid="CDF-"+format(number,"032x")
        object_key="customer-drafts/"+fid
        return self.db.execute(RESERVE,(
            fid,key,checksum,"image/png",1024,object_key,now,now,
            item,draft,token,now,now
        )).rowcount
    def readback(self,key=KEY,draft=DRAFT,item=ITEM,token=MAC,now=NOW,checksum=CHECKSUM):
        return self.db.execute(READ,(
            key,draft,item,checksum,"image/png",1024,token,now,now
        )).fetchone()
    def finalize(self,number=1,draft=DRAFT,item=ITEM,token=MAC,now=NOW,key=KEY):
        fid="CDF-"+format(number,"032x")
        return self.db.execute(FINALIZE,(
            now,fid,key,draft,item,token,now,now
        )).rowcount
    def rows(self):
        return self.db.execute(
            "SELECT COUNT(*) FROM customer_portal_native_draft_files_v1"
        ).fetchone()[0]
    def test_01_owned_reservation_is_pending_then_ready_only_on_finalize(self):
        official=self.db.execute("SELECT COUNT(*) FROM t12_prod_orders").fetchone()[0]
        self.assertEqual(self.reserve(),1)
        self.assertEqual(self.readback()["state"],"PENDING")
        self.assertEqual(self.finalize(),1)
        self.assertEqual(self.readback()["state"],"READY")
        self.assertEqual(self.db.execute("SELECT COUNT(*) FROM t12_prod_orders").fetchone()[0],official)
    def test_02_identical_retry_does_not_create_another_object_key(self):
        self.assertEqual(self.reserve(),1)
        self.assertEqual(self.finalize(),1)
        self.assertEqual(self.reserve(2),0)
        self.assertEqual(self.rows(),1)
        self.assertEqual(self.readback()["state"],"READY")
    def test_03_cross_customer_cannot_reserve_or_discover_file(self):
        self.assertEqual(self.reserve(token=OTHER_MAC),0)
        self.assertEqual(self.reserve(draft=OTHER_DRAFT,item=OTHER_ITEM),0)
        self.assertEqual(self.reserve(),1)
        self.assertIsNone(self.readback(token=OTHER_MAC))
        self.assertIsNone(self.readback(item=OTHER_ITEM,draft=OTHER_DRAFT,token=OTHER_MAC))
        self.assertEqual(self.finalize(token=OTHER_MAC),0)
    def test_04_revoked_session_prevents_finalize_after_r2_put(self):
        self.assertEqual(self.reserve(),1)
        self.db.execute(
            "UPDATE customer_portal_native_sessions_v1 SET revoked_at_ms=? WHERE token_fingerprint_hex=?",
            (NOW,MAC)
        )
        self.assertEqual(self.finalize(),0)
        self.assertIsNone(self.readback())
        row=self.db.execute("SELECT state FROM customer_portal_native_draft_files_v1").fetchone()
        self.assertEqual(row["state"],"PENDING")
    def test_05_expired_session_cannot_reserve_or_finalize(self):
        self.assertEqual(self.reserve(now=NOW+31000),0)
        self.assertEqual(self.reserve(),1)
        self.assertEqual(self.finalize(now=NOW+31000),0)
    def test_06_changed_password_version_blocks_ready(self):
        self.assertEqual(self.reserve(),1)
        self.db.execute(
            "UPDATE customer_portal_native_accounts_v1 SET session_version=2 WHERE customer_id='C1'"
        )
        self.assertEqual(self.finalize(),0)
        self.assertIsNone(self.readback())
    def test_07_cancelled_or_submitted_draft_denies_file_staging(self):
        for state in ("SUBMITTED","CANCELLED"):
            self.db.execute(
                "UPDATE customer_portal_native_drafts_v1 SET state=? WHERE draft_id=?",
                (state,DRAFT)
            )
            self.assertEqual(self.reserve(),0)
            self.assertIsNone(self.readback())
    def test_08_off_shadow_canary_prevents_private_uploads(self):
        for mode in ("OFF","SHADOW","CANARY"):
            self.db.execute(
                "UPDATE customer_portal_native_control_v1 SET mode=?",(mode,)
            )
            self.assertEqual(self.reserve(),0)
        self.assertEqual(self.rows(),0)
    def test_09_checksum_and_request_key_replay_mismatch_denied(self):
        self.assertEqual(self.reserve(),1)
        self.assertEqual(self.finalize(),1)
        self.assertEqual(self.reserve(2,checksum="c"*64),0)
        self.assertIsNone(self.readback(checksum="c"*64))
        self.assertIsNone(self.readback(key="d"*32))
        self.assertEqual(self.rows(),1)
    def test_10_five_files_max_per_item(self):
        for n in range(1,6):
            self.assertEqual(self.reserve(n,key=format(100+n,"032x")),1)
            self.assertEqual(self.finalize(n,key=format(100+n,"032x")),1)
        self.assertEqual(self.reserve(6,key=format(106,"032x")),0)
        self.assertEqual(self.rows(),5)
    def test_11_object_key_and_state_constraints_in_database(self):
        self.assertEqual(self.reserve(),1)
        with self.assertRaises(Exception):
            self.db.execute(
                "UPDATE customer_portal_native_draft_files_v1 SET r2_object_key='public/leak'"
            )
        with self.assertRaises(Exception):
            self.db.execute(
                "UPDATE customer_portal_native_draft_files_v1 SET state='PUBLISHED'"
            )
    def test_12_must_change_flag_and_duplicate_customer_code_block(self):
        self.db.execute(
            "UPDATE customer_portal_native_accounts_v1 SET must_change=1 WHERE customer_id='C1'"
        )
        self.assertEqual(self.reserve(),0)
        self.db.execute(
            "UPDATE customer_portal_native_accounts_v1 SET must_change=0 WHERE customer_id='C1'"
        )
        self.db.execute(
            "UPDATE t12_customers SET legacy_chat_code='PC-C1' WHERE customer_id='C2'"
        )
        self.assertEqual(self.reserve(),0)

if __name__=="__main__":
    unittest.main()
