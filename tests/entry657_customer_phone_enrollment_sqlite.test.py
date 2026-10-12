"""Entry657 — disposable SQLite only; no customer data, D1 or SMS provider."""
import pathlib
import sqlite3
import unittest

M = pathlib.Path(__file__).resolve().parents[1] / "cloudflare-d1/migrations"


class PhoneOtpSchema(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys=ON")
        for f in ("0008_t12_customer_master.sql",
                  "0032_customer_portal_identity_foundation_v1.sql",
                  "0034_customer_portal_phone_otp_enrollment_v1.sql"):
            self.db.executescript((M / f).read_text(encoding="utf-8"))

    def tearDown(self):
        self.db.close()

    def bad(self, query, args=()):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(query, args)
        self.db.rollback()

    def fake_customer(self, i=1):
        cid = f"FAKE-CUSTOMER-{i}"
        code = f"FAKE-CODE-{i}"
        self.db.execute(
            "INSERT INTO t12_customers(customer_id,customer_name,customer_name_key,source)"
            " VALUES (?,?,?,'cloud-native')", (cid, "FAKE", f"fake{i}"))
        self.db.execute(
            "INSERT INTO customer_portal_native_accounts_v1(customer_id,portal_code)"
            " VALUES (?,?)", (cid, code))
        self.db.commit()
        return cid

    @staticmethod
    def insert_grant_sql():
        return ("INSERT INTO customer_portal_phone_grants_v1"
                "(customer_id,phone_fingerprint_hex,state,evidence_ref,reviewed_by,"
                "reviewed_at_ms,expires_at_ms) VALUES (?,?,?,?,?,?,?)")

    def grant(self, customer_id, fingerprint="a"*64, state="APPROVED"):
        self.db.execute(self.insert_grant_sql(), (
            customer_id, fingerprint, state,
            "FAKE-OWNER-REVIEW", "FAKE-STAFF", 1000000, 2000000))
        self.db.commit()

    def test_default_off_no_accounts_or_sends(self):
        self.assertEqual(self.db.execute("SELECT mode FROM customer_portal_native_control_v1"
                                         ).fetchone()[0], "OFF")
        for table in ("customer_portal_native_accounts_v1",
                      "customer_portal_phone_grants_v1",
                      "customer_portal_phone_challenges_v1",
                      "customer_portal_phone_rate_v1"):
            self.assertEqual(self.db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0], 0)

    def test_unreviewed_grant_cannot_be_approved(self):
        cid = self.fake_customer()
        self.bad(self.insert_grant_sql(), (cid, "a"*64, "APPROVED", "", "", 0, 0))
        self.bad(self.insert_grant_sql(), (cid, "a"*64, "APPROVED",
                                          "FAKE-REF", "FAKE-REVIEWER", 100, 2600000000))
        self.bad(self.insert_grant_sql(), ("NOT-A-CUSTOMER", "b"*64, "PENDING", "", "", 0, 0))
        self.grant(cid)
        self.assertEqual(self.db.execute("SELECT state FROM customer_portal_phone_grants_v1"
                                         ).fetchone()[0], "APPROVED")

    def test_shared_fingerprint_approval_is_unique(self):
        c1 = self.fake_customer(1)
        c2 = self.fake_customer(2)
        self.grant(c1, "a"*64, "APPROVED")
        self.bad(self.insert_grant_sql(), (c2,"a"*64,"APPROVED",
                                          "FAKE-OTHER","FAKE-STAFF",100,200))
        self.grant(c2, "b"*64, "APPROVED")

    def test_otp_is_fingerprint_and_short_lived(self):
        cid = self.fake_customer()
        self.grant(cid)
        sql = ("INSERT INTO customer_portal_phone_challenges_v1"
               "(challenge_id,customer_id,phone_fingerprint_hex,otp_mac_hex,"
               "issued_at_ms,expires_at_ms,status,delivered_at_ms,attempts,consumed_at_ms)"
               " VALUES (?,?,?,?,?,?,?,?,?,?)")
        good = ("challenge_FAKE_000000000001",cid,"a"*64,"b"*64,
                1000,301000,"PREPARED",0,0,0)
        self.bad(sql, ("challenge_FAKE_000000000001",cid,"a"*64,
                       "123456",1000,2000,"PREPARED",0,0,0))
        self.bad(sql, good[:5]+(301001,)+good[6:])  # TTL > 5min
        self.bad(sql, good[:8]+(6,)+good[9:])  # > 5 tries
        self.bad(sql, good[:6]+("VERIFIED",1001,1,0))  # consumed missing
        self.bad(sql, good[:6]+("DELIVERED",0,0,0))  # missing delivery
        self.db.execute(sql,good)
        self.db.commit()
        self.bad("UPDATE customer_portal_phone_challenges_v1 SET status='VERIFIED'")
        self.db.execute("UPDATE customer_portal_phone_challenges_v1 "
                        "SET status='DELIVERED',delivered_at_ms=1100")
        self.db.execute("UPDATE customer_portal_phone_challenges_v1 "
                        "SET status='VERIFIED',consumed_at_ms=1200")
        self.db.commit()
        self.assertEqual(self.db.execute(
            "SELECT status FROM customer_portal_phone_challenges_v1").fetchone()[0], "VERIFIED")

    def test_sms_counters_bound(self):
        ins = ("INSERT INTO customer_portal_phone_rate_v1"
               "(phone_fingerprint_hex,window_started_at_ms,sent_in_window,last_sent_at_ms)"
               " VALUES (?,?,?,?)")
        self.bad(ins, ("a"*64,100,4,100))
        self.bad(ins, ("raw-number",100,1,100))
        self.db.execute(ins, ("a"*64,100,3,160))
        self.db.commit()
        self.bad("UPDATE customer_portal_phone_rate_v1 SET sent_in_window=10")

    def test_migration_additive_no_live_data(self):
        body = (M/"0034_customer_portal_phone_otp_enrollment_v1.sql").read_text(encoding="utf-8")
        sql = "\n".join(l for l in body.splitlines() if not l.lstrip().startswith("--")).upper()
        for banned in ("DROP TABLE", "DELETE FROM", "UPDATE ", "CREATE TRIGGER",
                       "INSERT INTO CUSTOMER_PORTAL_PHONE_GRANTS",
                       "INSERT INTO CUSTOMER_PORTAL_PHONE_CHALLENGES",
                       "INSERT INTO CUSTOMER_PORTAL_PHONE_RATE"):
            self.assertNotIn(banned, sql)


if __name__ == "__main__":
    unittest.main(verbosity=2)
