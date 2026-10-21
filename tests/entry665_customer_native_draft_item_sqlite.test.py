"""Entry665: native customer D1 draft-item SQL on disposable SQLite only."""
import pathlib,importlib.util,hashlib,hmac,json,re,unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location(
  "entry660_fixture",ROOT/"tests/entry660_customer_native_orders_sqlite.test.py")
fixture=importlib.util.module_from_spec(spec);spec.loader.exec_module(fixture)
NOW=fixture.NOW
MAC=fixture.fingerprint()
C2_MAC="f"*64
SECRET=fixture.SECRET
DRAFT="CDR-"+("22"*16)
OTHER="CDR-"+("44"*16)
def item_id(n):return "CDI-"+format(n,"032x")
def request_key(n):return format(n,"032x")
SOURCE=(ROOT/"cloudflare-d1/src/customer-portal-native-draft-item-v0.mjs").read_text()
def contract(k):
 m=re.search(r"export const "+k+r"=`(.*?)`;",SOURCE,re.S)
 assert m,k
 return m.group(1)
INSERT=contract("NATIVE_DRAFT_ITEM_INSERT_SQL_V0")
READ=contract("NATIVE_DRAFT_ITEM_READBACK_SQL_V0")
def mac(draft,key,department="طباعة",name="مج",qty=2,notes="",heat=False,fly=False):
 values=["trendos-native-draft-item-v0",draft,key,department,name,qty,notes,heat,fly]
 payload=json.dumps(values,ensure_ascii=False,separators=(",",":"))
 return hmac.new(SECRET.encode(),payload.encode(),hashlib.sha256).hexdigest()
class NativeDraftItemSqlite(unittest.TestCase):
 def setUp(self):
  self.db=fixture.seeded()
  for p in ("0036_customer_portal_native_draft_create_v1.sql",
            "0037_customer_portal_native_draft_items_v1.sql"):
   self.db.executescript((ROOT/"cloudflare-d1/migrations"/p).read_text())
  self.db.execute("UPDATE customer_portal_native_accounts_v1 SET must_change=0 WHERE customer_id IN ('C1','C2')")
  self.db.execute("""
    INSERT INTO customer_portal_native_sessions_v1
    (token_fingerprint_hex,customer_id,session_version,issued_at_ms,expires_at_ms,source)
    VALUES (?,'C2',1,?,?,'d1-customer-native')
  """,(C2_MAC,NOW-60000,NOW+30000))
  for draft,customer,key in [(DRAFT,"C1",request_key(888)),(OTHER,"C2",request_key(889))]:
   self.db.execute("""
    INSERT INTO customer_portal_native_drafts_v1
    (draft_id,customer_id,request_key,created_at_ms,updated_at_ms)
    VALUES (?,?,?,?,?)
   """,(draft,customer,key,NOW,NOW))
  self.db.commit()
 def tearDown(self):self.db.close()
 def item(self,n=1,draft=DRAFT,token=MAC,key=None,name="مج",dep="طباعة",qty=2,
          notes="",heat=False,fly=False):
  key=key or request_key(n)
  digest=mac(draft,key,dep,name,qty,notes,heat,fly)
  return self.db.execute(INSERT,(
    item_id(n),key,digest,dep,name,qty,notes,int(heat),int(fly),
    NOW,draft,token,NOW,NOW
  )).rowcount
 def read(self,draft=DRAFT,token=MAC,key=None,name="مج",dep="طباعة",qty=2,
          notes="",heat=False,fly=False):
  key=key or request_key(1)
  digest=mac(draft,key,dep,name,qty,notes,heat,fly)
  return self.db.execute(READ,(key,draft,digest,token,NOW,NOW)).fetchone()
 def total(self):
  return self.db.execute("SELECT COUNT(*) FROM customer_portal_native_draft_items_v1").fetchone()[0]
 def test_01_item_belongs_only_to_native_customer_draft(self):
  official=self.db.execute("SELECT COUNT(*) FROM t12_prod_orders").fetchone()[0]
  self.assertEqual(self.item(),1)
  r=self.read()
  self.assertEqual((r["itemId"],r["ordinal"]),(item_id(1),1))
  self.assertEqual(self.db.execute("SELECT draft_id FROM customer_portal_native_draft_items_v1").fetchone()[0],DRAFT)
  self.assertEqual(self.db.execute("SELECT COUNT(*) FROM t12_prod_orders").fetchone()[0],official)
 def test_02_replayed_key_returns_same_item_no_duplicate(self):
  self.assertEqual(self.item(),1)
  self.assertEqual(self.item(2,key=request_key(1)),0)
  self.assertEqual(self.total(),1)
  self.assertEqual(self.read()["itemId"],item_id(1))
 def test_03_same_key_changed_payload_is_not_idempotent_success(self):
  self.assertEqual(self.item(),1)
  self.assertEqual(self.item(3,key=request_key(1),name="مختلف"),0)
  self.assertIsNone(self.read(name="مختلف"))
  self.assertEqual(self.read()["itemId"],item_id(1))
 def test_04_cross_customer_draft_write_and_replay_denied(self):
  self.assertEqual(self.item(draft=OTHER,token=MAC),0)
  self.assertEqual(self.item(draft=DRAFT,token=C2_MAC),0)
  self.assertEqual(self.item(draft=OTHER,token=C2_MAC),1)
  self.assertIsNone(self.read(draft=OTHER,token=MAC))
  self.assertIsNone(self.read(draft=DRAFT,token=C2_MAC))
  self.assertEqual(self.read(draft=OTHER,token=C2_MAC)["itemId"],item_id(1))
 def test_05_revoked_and_expired_session_fail_closed(self):
  self.db.execute("UPDATE customer_portal_native_sessions_v1 SET revoked_at_ms=? WHERE token_fingerprint_hex=?",(NOW,MAC))
  self.assertEqual(self.item(),0)
  self.assertIsNone(self.read())
  self.db.execute("UPDATE customer_portal_native_sessions_v1 SET revoked_at_ms=NULL,expires_at_ms=? WHERE token_fingerprint_hex=?",(NOW-1,MAC))
  self.assertEqual(self.item(),0)
 def test_06_password_rotation_and_off_control_block_new_items(self):
  self.db.execute("UPDATE customer_portal_native_accounts_v1 SET session_version=2 WHERE customer_id='C1'")
  self.assertEqual(self.item(),0)
  self.db.execute("UPDATE customer_portal_native_accounts_v1 SET session_version=1 WHERE customer_id='C1'")
  for mode in ("OFF","CANARY","SHADOW"):
   self.db.execute("UPDATE customer_portal_native_control_v1 SET mode=?",(mode,))
   self.assertEqual(self.item(),0)
  self.assertEqual(self.total(),0)
 def test_07_submitted_or_cancelled_draft_cannot_append(self):
  for state in ("SUBMITTED","CANCELLED"):
   self.db.execute("UPDATE customer_portal_native_drafts_v1 SET state=? WHERE draft_id=?",(state,DRAFT))
   self.assertEqual(self.item(),0)
   self.assertIsNone(self.read())
 def test_08_ordinal_increments_to_fifty_and_budget_limits_fifty_one(self):
  for n in range(1,51):
   self.assertEqual(self.item(n),1,n)
  self.assertEqual(self.total(),50)
  self.assertEqual(self.item(51),0)
  self.assertEqual(self.item(99,key=request_key(1)),0)
  self.assertEqual(self.read()["ordinal"],1)
  self.assertEqual(self.db.execute("SELECT MAX(ordinal) FROM customer_portal_native_draft_items_v1").fetchone()[0],50)
 def test_09_db_rejects_forged_non_print_heat_and_invalid_qty(self):
  self.assertEqual(self.item(dep="ليزر",heat=True),0)
  self.assertEqual(self.item(qty=0),0)
  self.assertEqual(self.item(dep="ليزر",heat=False,fly=False),1)
  r=self.db.execute("SELECT heat_press,fly_print FROM customer_portal_native_draft_items_v1").fetchone()
  self.assertEqual(tuple(r),(0,0))
 def test_10_active_customer_matching_and_unique_code(self):
  self.db.execute("UPDATE t12_customers SET legacy_chat_code='WRONG' WHERE customer_id='C1'")
  self.assertEqual(self.item(),0)
  self.db.execute("UPDATE t12_customers SET legacy_chat_code='PC-C1' WHERE customer_id='C1'")
  self.db.execute("UPDATE t12_customers SET legacy_chat_code='PC-C1' WHERE customer_id='C2'")
  self.assertEqual(self.item(),0)
 def test_11_must_change_true_denies(self):
  self.db.execute("UPDATE customer_portal_native_accounts_v1 SET must_change=1 WHERE customer_id='C1'")
  self.assertEqual(self.item(),0)
 def test_12_idempotency_scope_does_not_allow_another_draft(self):
  self.assertEqual(self.item(),1)
  self.assertEqual(self.item(3,draft=OTHER,token=C2_MAC,key=request_key(1)),0)
  self.assertIsNone(self.read(draft=OTHER,token=C2_MAC,key=request_key(1)))
  self.assertEqual(self.total(),1)
if __name__=="__main__":
 unittest.main()
