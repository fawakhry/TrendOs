"""Entry660: actual disposable SQLite auth and exact native order ownership.
No Google, no Cloudflare, no real customers, no production migrations applied.
"""
import hashlib
import hmac
import json
import pathlib
import re
import sqlite3
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = (ROOT / "cloudflare-d1/src/customer-portal-native-orders-v0.mjs").read_text()
NOW = 1_800_000_000_000
SECRET = "FAKE-only-32-char-native-session-hmac-secret-not-real"
TOKEN = "ab" * 32


def sql(name):
    match = re.search(r"export const " + name + r"=`(.*?)`;", SOURCE, re.S)
    if not match:
        raise AssertionError("Missing native SQL contract " + name)
    return match.group(1)


def fingerprint(token=TOKEN):
    payload = json.dumps(
        ["trendos-customer-native-session-v1", token],
        ensure_ascii=False, separators=(",", ":")
    ).encode()
    return hmac.new(SECRET.encode(), payload, hashlib.sha256).hexdigest()


def seeded():
    db = sqlite3.connect(":memory:")
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    paths = [
        "0005_t12_production_create_canary.sql",
        "0006_t12_operational_runtime.sql",
        "0008_t12_customer_master.sql",
        "0032_customer_portal_identity_foundation_v1.sql",
        "0033_customer_portal_native_order_ownership_v1.sql",
    ]
    for p in paths:
        db.executescript((ROOT / "cloudflare-d1/migrations" / p).read_text())
    db.execute("UPDATE customer_portal_native_control_v1 SET mode='GENERAL' WHERE singleton=1")
    for ident in ("C1", "C2"):
        db.execute("""
            INSERT INTO t12_customers
            (customer_id,customer_name,customer_name_key,source,legacy_chat_code)
            VALUES (?,?,?,?,?)
        """, (ident, "FAKE CUSTOMER", ident, "cloud-native", "PC-" + ident))
        db.execute("""
            INSERT INTO customer_portal_native_accounts_v1
            (customer_id,portal_code,state,password_scheme,password_salt_hex,
             password_hash_hex,password_iterations,verified_enrollment_ref)
            VALUES (?,?,'ACTIVE','pbkdf2-sha256-v1',?,?,100000,?)
        """, (ident, "PC-" + ident, "a"*32, "b"*64, "FAKE_OWNER_REVIEW"))
    db.execute("""
        INSERT INTO customer_portal_native_sessions_v1
        (token_fingerprint_hex,customer_id,session_version,issued_at_ms,
         expires_at_ms,source)
        VALUES (?,'C1',1,?,?,'d1-customer-native')
    """, (fingerprint(), NOW - 60_000, NOW + 30_000))

    def order(oid, customer, owner="C1", state="VERIFIED", external=None):
        req = "REQ-" + oid
        db.execute("""
            INSERT INTO t12_prod_request_ledger
            (request_key,actor,policy_epoch,canonical_json,order_id,status)
            VALUES (?,'FAKE_OPERATOR','FAKE_EPOCH','{}',?,'COMMITTED')
        """, (req, oid))
        db.execute("""
            INSERT INTO t12_prod_orders
            (order_id,request_key,customer_mode,customer_name,customer_phone,
             external_customer_id,department,priority,status,source,actor)
            VALUES (?,?,?,'FAKE CUSTOMER','FAKEPHONE',?,
                    'الطباعة','عادي','طلب جديد','fake-source','FAKE_OPERATOR')
        """, (oid, req, customer, external if external is not None else customer))
        db.execute("""
            INSERT INTO t12_prod_lines
            (line_id,order_id,request_key,ordinal,department,item_name,qty,
             priority,status,heat_press,fly_print)
            VALUES (?,?,?,1,'الطباعة','FAKE PRODUCT',2,'عادي','طلب جديد',0,0)
        """, ("LINE-" + oid, oid, req))
        db.execute("""
            INSERT INTO customer_portal_native_order_ownership_v1
            (order_id,customer_id,source,status,proof_ref,proof_method,verified_by,
             verified_at)
            VALUES (?,?,'t12-cloud-native',?,?,?,'FAKE_OWNER','2026-10-20')
        """, (oid, owner, state, "PROOF-" + oid,
              "OWNER_REVIEWED_EXACT_ID" if state == "VERIFIED" else "UNVERIFIED"))

    order("O1", "C1")
    order("O2", "C2", owner="C2")
    order("O3", "C1", state="PENDING")
    order("O4", "C2", external="C2", owner="C1")  # forged reviewer ownership
    order("O5", "C1", external="")                 # independently reviewed link
    db.execute("""
        INSERT INTO t12_prod_line_runtime
        (line_id,order_id,status,updated_by)
        VALUES ('LINE-O1','O1','تحت التنفيذ','FAKE_OPERATOR')
    """)
    db.commit()
    return db


class NativeCustomerSqlite(unittest.TestCase):
    def setUp(self):
        self.db = seeded()

    def tearDown(self):
        self.db.close()

    def session(self, now=NOW, token=TOKEN):
        return self.db.execute(
            sql("CUSTOMER_NATIVE_SESSION_LOOKUP_SQL_V0"),
            (fingerprint(token), now, now)
        ).fetchone()

    def rows(self, customer="C1", limit=41, offset=0):
        return self.db.execute(
            sql("CUSTOMER_NATIVE_ORDER_LINES_SQL_V0"), (customer, limit, offset)
        ).fetchall()

    def test_01_native_session_and_owner_verified_exact(self):
        self.assertEqual(self.session()["customerId"], "C1")
        lines = self.rows()
        self.assertEqual({x["orderId"] for x in lines}, {"O1", "O5"})
        self.assertEqual(len(lines), 2)
        self.assertEqual(
            {x["orderId"]: x["status"] for x in lines}["O1"], "تحت التنفيذ")
        self.assertNotIn("customerPhone", lines[0].keys())
        self.assertNotIn("notes", lines[0].keys())
        self.assertNotIn("debtAmount", lines[0].keys())

    def test_02_revoked_token(self):
        self.db.execute("UPDATE customer_portal_native_sessions_v1 SET revoked_at_ms=?",
                        (NOW,))
        self.assertIsNone(self.session())

    def test_03_expired_token_and_future_issued(self):
        self.assertIsNone(self.session(NOW + 31_000))
        self.assertIsNone(self.session(NOW - 90_000))

    def test_04_password_rotation_invalidates_old_session(self):
        self.db.execute("""
            UPDATE customer_portal_native_accounts_v1 SET session_version=2
            WHERE customer_id='C1'
        """)
        self.assertIsNone(self.session())

    def test_05_control_mode_off_and_canary_stay_off(self):
        for mode in ("OFF", "SHADOW", "CANARY"):
            self.db.execute("UPDATE customer_portal_native_control_v1 SET mode=?",
                            (mode,))
            self.assertIsNone(self.session(), mode)

    def test_06_wrong_account_code_and_inactive_customer_denied(self):
        self.db.execute("""
            UPDATE t12_customers SET legacy_chat_code='DIFFERENT' WHERE customer_id='C1'
        """)
        self.assertIsNone(self.session())
        self.db.execute("""
            UPDATE t12_customers SET legacy_chat_code='PC-C1',active='لا'
            WHERE customer_id='C1'
        """)
        self.assertIsNone(self.session())

    def test_07_cross_customer_order_not_visible(self):
        self.assertEqual({x["orderId"] for x in self.rows()}, {"O1", "O5"})
        self.assertEqual({x["orderId"] for x in self.rows("C2")}, {"O2"})
        # Proof of name/phone similarity never included in SQL as ownership.
        self.assertNotIn("customer_name", sql("CUSTOMER_NATIVE_ORDER_LINES_SQL_V0"))
        self.assertNotIn("customer_phone", sql("CUSTOMER_NATIVE_ORDER_LINES_SQL_V0"))

    def test_08_ownership_revocation_is_applied_per_read(self):
        self.db.execute("""
            UPDATE customer_portal_native_order_ownership_v1 SET status='REVOKED'
            WHERE order_id='O1'
        """)
        self.assertEqual({x["orderId"] for x in self.rows()}, {"O5"})

    def test_09_external_id_conflict_rejected(self):
        self.assertNotIn("O4", {x["orderId"] for x in self.rows()})
        self.db.execute("""
            UPDATE t12_prod_orders SET external_customer_id='C1'
            WHERE order_id='O4'
        """)
        self.assertIn("O4", {x["orderId"] for x in self.rows()})

    def test_10_limit_offset_and_order_remain_scoped(self):
        first = self.rows(limit=1, offset=0)
        second = self.rows(limit=1, offset=1)
        self.assertEqual(len(first), 1)
        self.assertEqual(len(second), 1)
        self.assertNotEqual(first[0]["lineId"], second[0]["lineId"])
        self.assertEqual(self.rows(limit=10, offset=999), [])


if __name__ == "__main__":
    unittest.main()
