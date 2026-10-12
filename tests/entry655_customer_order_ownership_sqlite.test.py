"""Synthetic SQLite only. No actual customer, order, Google or Production DB."""
import pathlib
import sqlite3
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
M = ROOT / "cloudflare-d1/migrations"


class OrderLink(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.execute("PRAGMA foreign_keys=ON")
        for file in ["0008_t12_customer_master.sql", "0005_t12_production_create_canary.sql",
                     "0032_customer_portal_identity_foundation_v1.sql",
                     "0033_customer_portal_native_order_ownership_v1.sql"]:
            self.db.executescript((M / file).read_text(encoding="utf-8"))

    def tearDown(self):
        self.db.close()

    def rejected(self, sql, vals=()):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(sql, vals)
        self.db.rollback()

    def fixtures(self):
        self.db.execute("INSERT INTO t12_customers"
                        "(customer_id,customer_name,customer_name_key,source,legacy_chat_code)"
                        " VALUES('FAKE-CUSTOMER','TEST','test','cloud-native','FAKE-CODE')")
        self.db.execute("INSERT INTO customer_portal_native_accounts_v1"
                        "(customer_id,portal_code)"
                        " VALUES('FAKE-CUSTOMER','FAKE-CODE')")
        self.db.execute("INSERT INTO t12_prod_request_ledger"
                        "(request_key,actor,policy_epoch,canonical_json,order_id,status)"
                        " VALUES('FAKE-REQ','FAKE-ACTOR','TEST','{}','FAKE-ORDER','COMMITTED')")
        self.db.execute("INSERT INTO t12_prod_orders"
                        "(order_id,request_key,customer_mode,customer_name,department,priority,status,actor,external_customer_id)"
                        " VALUES('FAKE-ORDER','FAKE-REQ','EXTERNAL','TEST','print','normal','طلب جديد','FAKE-ACTOR','FAKE-CUSTOMER')")
        self.db.commit()

    def test_no_implicit_ownership_even_when_external_id_matches(self):
        self.fixtures()
        self.assertEqual(self.db.execute(
            "SELECT COUNT(*) FROM customer_portal_native_order_ownership_v1"
        ).fetchone()[0], 0)

    def test_foreign_keys_and_no_name_match(self):
        self.fixtures()
        insert = ("INSERT INTO customer_portal_native_order_ownership_v1"
                  "(order_id,customer_id,source,proof_ref) VALUES(?,?,?,?)")
        self.rejected(insert, ("FAKE-NONEXISTENT", "FAKE-CUSTOMER", "t12-cloud-native", "FAKE-P1"))
        self.rejected(insert, ("FAKE-ORDER", "FAKE-UNKNOWN", "t12-cloud-native", "FAKE-P1"))
        self.rejected(insert, ("FAKE-ORDER", "FAKE-CUSTOMER", "google-sheets", "FAKE-P1"))
        self.db.execute(insert, ("FAKE-ORDER", "FAKE-CUSTOMER", "t12-cloud-native", "FAKE-P1"))
        self.db.commit()
        self.assertEqual(self.db.execute(
            "SELECT status,proof_method FROM customer_portal_native_order_ownership_v1"
        ).fetchone(), ("PENDING", "UNVERIFIED"))

    def test_verified_requires_explicit_proof_and_auditor(self):
        self.fixtures()
        self.db.execute(
            "INSERT INTO customer_portal_native_order_ownership_v1"
            "(order_id,customer_id,source,proof_ref)"
            " VALUES('FAKE-ORDER','FAKE-CUSTOMER','t12-cloud-native','FAKE-P1')"
        )
        self.db.commit()
        self.rejected("UPDATE customer_portal_native_order_ownership_v1 SET status='VERIFIED'")
        self.rejected("UPDATE customer_portal_native_order_ownership_v1 "
                      "SET status='VERIFIED',proof_method='OWNER_REVIEWED_EXACT_ID'")
        self.db.execute("UPDATE customer_portal_native_order_ownership_v1 "
                        "SET status='VERIFIED',proof_method='OWNER_REVIEWED_EXACT_ID',"
                        "verified_by='FAKE-OWNER',verified_at='FAKE-TIME'")
        self.assertEqual(self.db.execute(
            "SELECT status FROM customer_portal_native_order_ownership_v1"
        ).fetchone()[0], "VERIFIED")
        self.rejected("UPDATE customer_portal_native_order_ownership_v1 SET status='UNSAFE'")

    def test_no_mutations_or_imports_in_source_migration(self):
        sql = (M / "0033_customer_portal_native_order_ownership_v1.sql").read_text(encoding="utf-8")
        body = "\n".join(s for s in sql.splitlines() if not s.lstrip().startswith("--")).upper()
        for forbidden in ["DROP TABLE", "DELETE FROM", "INSERT INTO CUSTOMER_PORTAL_NATIVE_ORDER_OWNERSHIP",
                          "UPDATE T12_PROD", "TRIGGER", "APPS_SCRIPT_API_URL"]:
            self.assertNotIn(forbidden, body)


if __name__ == "__main__":
    unittest.main(verbosity=2)
