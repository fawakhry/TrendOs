"""Entry654 — offline in-memory SQLite ONLY; no real D1, Google or customer data."""
import pathlib
import sqlite3
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
MASTER = ROOT / "cloudflare-d1/migrations/0008_t12_customer_master.sql"
FOUNDATION = ROOT / "cloudflare-d1/migrations/0032_customer_portal_identity_foundation_v1.sql"


class IdentityFoundation(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.executescript(MASTER.read_text(encoding="utf-8"))
        self.db.executescript(FOUNDATION.read_text(encoding="utf-8"))

    def tearDown(self):
        self.db.close()

    def must_reject(self, query, values=()):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(query, values)
        self.db.rollback()

    def customer(self, customer_id="FAKE-CUSTOMER-001"):
        self.db.execute(
            "INSERT INTO t12_customers(customer_id,customer_name,customer_name_key,source,legacy_chat_code)"
            " VALUES (?,?,?,?,?)",
            (customer_id, "FAKE TEST", "fake test", "cloud-native", "FAKE-CODE-001"),
        )
        self.db.commit()

    def test_default_off_and_no_inferred_authority(self):
        row = self.db.execute(
            "SELECT marker,mode,policy_epoch FROM customer_portal_native_control_v1"
        ).fetchone()
        self.assertEqual(row, ("ENTRY654_CUSTOMER_PORTAL_NATIVE_V1", "OFF", 1))
        for table in ["customer_portal_native_accounts_v1", "customer_portal_native_sessions_v1"]:
            self.assertEqual(self.db.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0], 0)
        self.customer()
        self.assertEqual(self.db.execute(
            "SELECT COUNT(*) FROM customer_portal_native_accounts_v1"
        ).fetchone()[0], 0, "customer master may NOT implicitly become authenticated portal user")

    def test_invalid_control_rejected(self):
        self.must_reject("UPDATE customer_portal_native_control_v1 SET mode='LIVE'")
        self.must_reject("UPDATE customer_portal_native_control_v1 SET policy_epoch=0")
        self.must_reject("INSERT INTO customer_portal_native_control_v1 "
                         "(singleton,marker,mode,policy_epoch) VALUES(2,'ENTRY654_CUSTOMER_PORTAL_NATIVE_V1','OFF',1)")

    def test_unknown_customer_cannot_get_account(self):
        self.must_reject(
            "INSERT INTO customer_portal_native_accounts_v1(customer_id,portal_code)"
            " VALUES('FAKE-UNKNOWN','FAKE-CODE')"
        )

    def test_pending_does_not_mean_activated(self):
        self.customer()
        self.db.execute("INSERT INTO customer_portal_native_accounts_v1 "
                        "(customer_id,portal_code) VALUES('FAKE-CUSTOMER-001','FAKE-CODE-001')")
        row = self.db.execute("SELECT state,password_scheme,password_hash_hex,"
                              "password_salt_hex,verified_enrollment_ref "
                              "FROM customer_portal_native_accounts_v1").fetchone()
        self.assertEqual(row, ("PENDING", "UNSET", "", "", ""))
        self.db.commit()
        self.must_reject("UPDATE customer_portal_native_accounts_v1 SET state='ACTIVE'")
        self.must_reject("UPDATE customer_portal_native_accounts_v1 SET state='ACTIVE',"
                         "password_scheme='pbkdf2-sha256-v1',"
                         "password_salt_hex=?,password_hash_hex=?,password_iterations=100000",
                         ("a"*32, "b"*64))
        self.must_reject("UPDATE customer_portal_native_accounts_v1 SET state='ACTIVE',"
                         "password_scheme='pbkdf2-sha256-v1',"
                         "password_salt_hex=?,password_hash_hex=?,password_iterations=100000,"
                         "verified_enrollment_ref='FAKE-OWNER-APPROVAL'",
                         ("G"*32, "b"*64))
        self.db.execute("UPDATE customer_portal_native_accounts_v1 SET state='ACTIVE',"
                        "password_scheme='pbkdf2-sha256-v1',"
                        "password_salt_hex=?,password_hash_hex=?,password_iterations=100000,"
                        "verified_enrollment_ref='FAKE-OWNER-APPROVAL'",
                        ("a"*32, "b"*64))
        self.assertEqual(self.db.execute("SELECT state FROM customer_portal_native_accounts_v1"
                                        ).fetchone()[0], "ACTIVE")

    def test_portal_code_unique_no_name_phone_fallback(self):
        self.customer()
        self.customer("FAKE-CUSTOMER-002")
        self.db.execute("INSERT INTO customer_portal_native_accounts_v1 "
                        "(customer_id,portal_code) VALUES('FAKE-CUSTOMER-001','FAKE-CODE-001')")
        self.db.commit()
        self.must_reject("INSERT INTO customer_portal_native_accounts_v1 "
                         "(customer_id,portal_code) VALUES('FAKE-CUSTOMER-002','FAKE-CODE-001')")

    def test_sessions_are_fingerprints_not_tokens(self):
        self.customer()
        self.db.execute("INSERT INTO customer_portal_native_accounts_v1 "
                        "(customer_id,portal_code) VALUES('FAKE-CUSTOMER-001','FAKE-CODE-001')")
        good = ("INSERT INTO customer_portal_native_sessions_v1 "
                "(token_fingerprint_hex,customer_id,session_version,issued_at_ms,"
                "expires_at_ms,source) VALUES (?,?,?,?,?,?)")
        self.db.commit()
        self.must_reject(good, ("FAKE-RAW-TOKEN", "FAKE-CUSTOMER-001", 1, 100, 200, "d1-customer-native"))
        self.must_reject(good, ("f"*64, "FAKE-CUSTOMER-001", 1, 100, 100, "d1-customer-native"))
        self.must_reject(good, ("f"*64, "FAKE-CUSTOMER-001", 1, 100, 200, "apps-script"))
        self.db.execute(good, ("f"*64, "FAKE-CUSTOMER-001", 1, 100, 200, "d1-customer-native"))
        self.db.commit()
        self.must_reject(good, ("f"*64, "FAKE-CUSTOMER-001", 1, 150, 250, "d1-customer-native"))

    def test_static_migration_is_additive_and_no_import(self):
        sql = FOUNDATION.read_text(encoding="utf-8")
        body = "\n".join(line for line in sql.splitlines() if not line.lstrip().startswith("--"))
        self.assertNotIn("DROP TABLE", body.upper())
        self.assertNotIn("DELETE FROM", body.upper())
        self.assertNotIn("UPDATE ", body.upper())
        self.assertNotIn("INSERT INTO CUSTOMER_PORTAL_NATIVE_ACCOUNTS", body.upper())
        self.assertNotIn("INSERT INTO CUSTOMER_PORTAL_NATIVE_SESSIONS", body.upper())
        self.assertNotIn("TRIGGER", body.upper())
        self.assertNotIn("GOOGLE", body.upper())
        self.assertNotIn("PLAIN_PASSWORD", body.upper())


if __name__ == "__main__":
    unittest.main(verbosity=2)
