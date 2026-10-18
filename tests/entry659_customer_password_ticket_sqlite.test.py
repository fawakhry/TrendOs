"""Entry659 ticket/password binding is tested in disposable SQLite only."""
import pathlib
import re
import sqlite3
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
SRC=ROOT/"cloudflare-d1/src/customer-portal-password-enrollment-ticket-v0.mjs"
M=ROOT/"cloudflare-d1/migrations"
def sql(name):
    m=re.search(r"export const "+name+r"\s*=\s*`([\s\S]*?)`;",SRC.read_text(encoding="utf-8"))
    if not m: raise AssertionError("missing sql "+name)
    return m.group(1).strip()
ISSUE=sql("OTP_ISSUE_TICKET_CAS_SQL_V0")
ACTIVATE=sql("OTP_ACTIVATE_NEW_PASSWORD_CAS_SQL_V0")
CID="FAKE-CUSTOMER"; CODE="FAKE-CODE"; FP="a"*64
CH="FAKE_CHALLENGE_ABCDEFGHIJKLMNOPQRSTUVWXYZ"
TICKET="f"*64
NOW=1800000000000

class OtpTicket(unittest.TestCase):
    def setUp(self):
        self.d=sqlite3.connect(":memory:")
        self.d.execute("PRAGMA foreign_keys=ON")
        for f in ("0008_t12_customer_master.sql",
                  "0032_customer_portal_identity_foundation_v1.sql",
                  "0034_customer_portal_phone_otp_enrollment_v1.sql",
                  "0035_customer_portal_otp_enrollment_ticket_v1.sql"):
            self.d.executescript((M/f).read_text(encoding="utf-8"))
        self.d.execute("INSERT INTO t12_customers(customer_id,customer_name,customer_name_key,legacy_chat_code,source,active) VALUES(?,?,?,?,?,?)",(CID,"FAKE","fake",CODE,"cloud-native","نعم"))
        self.d.execute("INSERT INTO customer_portal_native_accounts_v1(customer_id,portal_code) VALUES(?,?)",(CID,CODE))
        self.d.execute("INSERT INTO customer_portal_phone_grants_v1(customer_id,phone_fingerprint_hex,state,evidence_ref,reviewed_by,reviewed_at_ms,expires_at_ms) VALUES(?,?,?,?,?,?,?)",(CID,FP,"APPROVED","FAKE-PROOF","FAKE-OWNER",NOW-1000000,NOW+3600000))
        self.d.execute("INSERT INTO customer_portal_phone_challenges_v1(challenge_id,customer_id,phone_fingerprint_hex,otp_mac_hex,status,issued_at_ms,expires_at_ms,delivered_at_ms,attempts,consumed_at_ms) VALUES (?,?,?,?,?,?,?,?,?,?)",(CH,CID,FP,"b"*64,"VERIFIED",NOW-30000,NOW+270000,NOW-29900,1,NOW-100))
        self.d.commit()
    def tearDown(self):self.d.close()
    def run_sql(self,sql,args):
        n=self.d.execute(sql,args).rowcount
        self.d.commit()
        return n
    def canary(self):
        self.d.execute("UPDATE customer_portal_native_control_v1 SET mode='CANARY'")
        self.d.commit()
    def ticket(self,token=TICKET,challenge=CH,customer=CID,code=CODE,
               issued=NOW,expires=NOW+600000):
        # Issue-time SQL: issued>0, expires>issued, then TTL=(expires-issued).
        # Binder order is intentional: reversing these makes any long TTL pass.
        args=(token,challenge,issued,expires,customer,code,
              issued,expires,expires,issued,issued,
              challenge,issued,issued,issued)
        return self.run_sql(ISSUE,args)
    def activate(self,token=TICKET,customer=CID,code=CODE,
                 now=NOW+1000,salt="1"*32,password_hash="2"*64):
        return self.run_sql(ACTIVATE,(salt,password_hash,token,now,now,customer,code,now))
    def account(self):
        return self.d.execute(
            "SELECT state,verified_enrollment_ref,enrollment_ticket_mac_hex,"
            "session_version,password_scheme FROM customer_portal_native_accounts_v1"
            " WHERE customer_id=?",(CID,)).fetchone()

    def test_control_off_rejects_ticket(self):
        self.assertEqual(self.ticket(),0)
        self.assertEqual(self.activate(),0)
        self.assertEqual(self.account()[:3],("PENDING","",""))

    def test_verified_otp_alone_cannot_set_password(self):
        self.canary()
        self.assertEqual(self.activate(),0)
        self.assertEqual(self.account()[0],"PENDING")
        self.assertEqual(self.d.execute("SELECT status FROM customer_portal_phone_challenges_v1").fetchone()[0],"VERIFIED")

    def test_single_ticket_issue_and_single_password_activation(self):
        self.canary()
        self.assertEqual(self.ticket(),1)
        self.assertEqual(self.ticket(token="e"*64),0)
        self.assertEqual(self.activate(token="e"*64),0)
        self.assertEqual(self.activate(customer="OTHER"),0)
        self.assertEqual(self.activate(code="OTHER"),0)
        self.assertEqual(self.activate(),1)
        row=self.account()
        self.assertEqual(row,("ACTIVE","ENTRY659-OTP:"+CH,"",2,"pbkdf2-sha256-v1"))
        self.assertEqual(self.activate(),0)
        self.assertEqual(self.ticket(),0)
        self.assertEqual(self.d.execute(
          "SELECT password_salt_hex,password_hash_hex,enrollment_ticket_challenge_id "
          "FROM customer_portal_native_accounts_v1 WHERE customer_id=?", (CID,)
        ).fetchone(),("1"*32,"2"*64,""))

    def test_not_verified_challenge_or_expired_proof_denied(self):
        self.canary()
        self.d.execute("UPDATE customer_portal_phone_challenges_v1 SET status='DELIVERED',consumed_at_ms=0")
        self.d.commit()
        self.assertEqual(self.ticket(),0)
        self.d.execute("UPDATE customer_portal_phone_challenges_v1 SET status='VERIFIED',consumed_at_ms=?",(NOW-100,))
        self.d.commit()
        self.assertEqual(self.ticket(issued=NOW+121000,expires=NOW+721000),0)

    def test_ticket_issue_ttl_must_be_positive_and_at_most_10_minutes(self):
        self.canary()
        # Boundary-value tests catch the original reversed subtraction.
        for ttl in (600001, 900000, 3600000, 86400000):
            self.assertEqual(self.ticket(expires=NOW+ttl),0,ttl)
            self.assertEqual(self.account()[2],"",ttl)
        for ttl in (0, -1):
            self.assertEqual(self.ticket(expires=NOW+ttl),0,ttl)
        self.assertEqual(self.ticket(expires=NOW+600000),1)
        self.assertEqual(self.activate(now=NOW+600000),0,
                         "token must be expired exactly at its deadline")

    def test_ticket_wrong_id_or_expired_grant_denied(self):
        self.canary()
        self.assertEqual(self.ticket(customer="OTHER"),0)
        self.assertEqual(self.ticket(code="OTHER"),0)
        self.d.execute("UPDATE customer_portal_phone_grants_v1 SET state='REVOKED'")
        self.d.commit()
        self.assertEqual(self.ticket(),0)

    def test_ticket_expires_and_grant_revocation_blocks_activation(self):
        self.canary();self.assertEqual(self.ticket(),1)
        self.assertEqual(self.activate(now=NOW+600000),0)
        self.d.execute("UPDATE customer_portal_phone_grants_v1 SET state='REVOKED'")
        self.d.commit()
        self.assertEqual(self.activate(now=NOW+1000),0)

    def test_invalid_pbkdf2_verifier_cannot_activate(self):
        self.canary();self.assertEqual(self.ticket(),1)
        with self.assertRaises(sqlite3.IntegrityError):
            self.activate(salt="0",password_hash="2"*64)
        self.d.rollback()
        self.assertEqual(self.account()[0],"PENDING")
        self.assertEqual(self.activate(),1)

    def test_migration_additive_and_not_connected_to_worker(self):
        migration=(M/"0035_customer_portal_otp_enrollment_ticket_v1.sql").read_text(encoding="utf-8")
        body="\n".join(x for x in migration.splitlines() if not x.lstrip().startswith("--")).upper()
        for disallowed in ("DROP TABLE","DELETE FROM","UPDATE ","INSERT INTO","CREATE TRIGGER"):
            self.assertNotIn(disallowed,body)
        self.assertNotIn("customer-portal-password-enrollment-ticket-v0",
                         (ROOT/"cloudflare-d1/src/index_v2.js").read_text(encoding="utf-8"))
        for q in (ISSUE,ACTIVATE):
            self.assertNotIn(";",q)
            self.assertNotIn("script.google.com",q)

if __name__=="__main__":
    unittest.main(verbosity=2)
