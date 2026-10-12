"""Entry658 tests: SQLite in :memory: only; no real D1, Google, customer or SMS."""
import pathlib
import re
import sqlite3
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
SRC=ROOT/"cloudflare-d1/src/customer-portal-phone-otp-atomic-sql-v0.mjs"
M=ROOT/"cloudflare-d1/migrations"
def sql(name):
    m=re.search(r"export const "+name+r" = `([\s\S]*?)`;",SRC.read_text(encoding="utf-8"))
    if not m: raise AssertionError("Missing SQL: "+name)
    return m.group(1).strip()
RES=sql("OTP_RESERVE_PREPARED_SQL_V0")
SENT=sql("OTP_MARK_DELIVERED_CAS_SQL_V0")
YES=sql("OTP_VERIFY_CORRECT_CAS_SQL_V0")
NO=sql("OTP_VERIFY_WRONG_CAS_SQL_V0")
VOID=sql("OTP_VOID_UNSENT_CAS_SQL_V0")
ID="FAKE-CUST-001"; FP="a"*64; MAC="b"*64; BAD="c"*64; T=1800000000000
CH="FAKE_CHALLENGE_00000000000001"

class TestAtomicOtp(unittest.TestCase):
    def setUp(self):
        self.d=sqlite3.connect(":memory:")
        self.d.execute("PRAGMA foreign_keys=ON")
        for f in ("0008_t12_customer_master.sql","0032_customer_portal_identity_foundation_v1.sql","0034_customer_portal_phone_otp_enrollment_v1.sql"):
            self.d.executescript((M/f).read_text(encoding="utf-8"))
        self.d.execute("INSERT INTO t12_customers(customer_id,customer_name,customer_name_key,legacy_chat_code,source,active) VALUES(?,?,?,?,?,?)",(ID,"FAKE","fake","FAKE-CODE","cloud-native","نعم"))
        self.d.execute("INSERT INTO customer_portal_native_accounts_v1(customer_id,portal_code) VALUES(?,?)",(ID,"FAKE-CODE"))
        self.d.execute("INSERT INTO customer_portal_phone_grants_v1(customer_id,phone_fingerprint_hex,state,evidence_ref,reviewed_by,reviewed_at_ms,expires_at_ms) VALUES(?,?,?,?,?,?,?)",(ID,FP,"APPROVED","FAKE-OWNER-PROOF","FAKE-REVIEWER",T-3600000,T+7200000))
        self.d.commit()
    def tearDown(self): self.d.close()
    def write(self,stmt,args):
        result=self.d.execute(stmt,args).rowcount
        self.d.commit()
        return result
    def canary(self): self.d.execute("UPDATE customer_portal_native_control_v1 SET mode='CANARY'");self.d.commit()
    def reserve(self,challenge=CH,now=T,customer=ID,fp=FP):
        return self.write(RES,(challenge,MAC,now,now+300000,customer,fp,now,now,now,now,now))
    def delivered(self,challenge=CH,now=T+100):
        return self.write(SENT,(now,challenge,ID,FP,now,now,now))
    def yes(self,challenge=CH,now=T+200,mac=MAC,cust=ID):
        return self.write(YES,(now,challenge,cust,FP,mac,now,now,now))
    def no(self,challenge=CH,now=T+200,mac=BAD):
        return self.write(NO,(challenge,ID,FP,mac,now,now,now))
    def state(self,challenge=CH):
        return self.d.execute("SELECT status,attempts,consumed_at_ms FROM customer_portal_phone_challenges_v1 WHERE challenge_id=?",(challenge,)).fetchone()
    def test_off_denies_issue(self):
        self.assertEqual(self.reserve(),0); self.assertIsNone(self.state())
        self.canary()
        self.d.execute("UPDATE customer_portal_phone_grants_v1 SET state='PENDING'");self.d.commit()
        self.assertEqual(self.reserve(),0)
    def test_identity_and_grant_mismatch_denied(self):
        self.canary()
        self.assertEqual(self.reserve(customer="FAKE-OTHER"),0)
        self.assertEqual(self.reserve(fp="f"*64),0)
        self.d.execute("UPDATE t12_customers SET active='لا'");self.d.commit()
        self.assertEqual(self.reserve(),0)
        self.d.execute("UPDATE t12_customers SET active='نعم'")
        self.d.execute("UPDATE customer_portal_native_accounts_v1 SET portal_code='OTHER'")
        self.d.commit();self.assertEqual(self.reserve(),0)
    def test_no_receive_without_delivery_and_exact_once(self):
        self.canary()
        self.assertEqual(self.reserve(),1)
        self.assertEqual(self.state(),("PREPARED",0,0))
        self.assertEqual(self.yes(),0);self.assertEqual(self.no(),0)
        self.assertEqual(self.delivered(),1);self.assertEqual(self.delivered(),0)
        self.assertEqual(self.yes(mac=BAD),0)
        self.assertEqual(self.no(mac=MAC),0)
        self.assertEqual(self.yes(),1)
        self.assertEqual(self.state(),("VERIFIED",1,T+200))
        self.assertEqual(self.yes(),0);self.assertEqual(self.no(),0)
        self.assertEqual(self.yes(cust="FAKE-OTHER"),0)
    def test_five_failed_attempts_void_and_lock(self):
        self.canary();self.assertEqual(self.reserve(),1);self.assertEqual(self.delivered(),1)
        for i in range(1,6):
            self.assertEqual(self.no(now=T+100+i),1)
            self.assertEqual(self.state()[:2],("VOID" if i==5 else "DELIVERED",i))
        self.assertEqual(self.no(),0);self.assertEqual(self.yes(),0)
    def test_expiry_and_grant_revocation(self):
        self.canary();self.assertEqual(self.reserve(),1)
        self.assertEqual(self.delivered(now=T+300000),0)
        self.assertEqual(self.delivered(),1)
        self.assertEqual(self.yes(now=T+300000),0)
        self.d.execute("UPDATE customer_portal_phone_grants_v1 SET state='REVOKED'");self.d.commit()
        self.assertEqual(self.yes(),0)
    def test_active_cooldown_and_hourly_limit(self):
        self.canary();self.assertEqual(self.reserve(),1)
        self.assertEqual(self.reserve("FAKE_CHALLENGE_00000000000002",T+1000),0)
        self.assertEqual(self.write(VOID,(CH,ID,FP)),1)
        self.assertEqual(self.reserve("FAKE_CHALLENGE_00000000000002",T+30000),0)
        self.assertEqual(self.reserve("FAKE_CHALLENGE_00000000000002",T+60001),1)
        self.assertEqual(self.write(VOID,("FAKE_CHALLENGE_00000000000002",ID,FP)),1)
        self.assertEqual(self.reserve("FAKE_CHALLENGE_00000000000003",T+120002),1)
        self.assertEqual(self.write(VOID,("FAKE_CHALLENGE_00000000000003",ID,FP)),1)
        self.assertEqual(self.reserve("FAKE_CHALLENGE_00000000000004",T+180003),0)
        self.assertEqual(self.write(VOID,("FAKE_CHALLENGE_00000000000003",ID,FP)),0)
    def test_no_prod_wiring_or_network(self):
        worker=(ROOT/"cloudflare-d1/src/index_v2.js").read_text(encoding="utf-8")
        self.assertNotIn("customer-portal-phone-otp-atomic-sql-v0",worker)
        code=SRC.read_text(encoding="utf-8")
        self.assertNotIn("fetch(",code)
        for q in (RES,SENT,YES,NO,VOID):
            self.assertNotIn(";",q)
            self.assertNotIn("script.google.com",q)

if __name__=="__main__":
    unittest.main(verbosity=2)
