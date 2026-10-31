"""Private-file status D1 query tests against actual disposable sqlite migrations.
No Worker, Google, R2, customer photo, real credentials, or production data.
"""
import ast
import importlib.util
import pathlib
import re
import sqlite3
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "filefixture", ROOT / "tests/entry666_customer_native_r2_file_sqlite.test.py"
)
filefixture = importlib.util.module_from_spec(spec)
spec.loader.exec_module(filefixture)
SOURCE = (ROOT / "cloudflare-d1/customer-stage/private-file-status-ro-v0.mjs").read_text()
MATCH = re.search(
    r"export const CUSTOMER_PRIVATE_FILE_STATUS_SQL_V0=\[(.*?)\]\.join\('\\n'\);",
    SOURCE, re.S
)
if not MATCH:
    raise RuntimeError("Missing SQL declaration; cannot validate source")
SQL = "\n".join(ast.literal_eval(line.strip().rstrip(","))
                for line in MATCH.group(1).splitlines() if line.strip())
MIGRATION = (ROOT / "cloudflare-d1/migrations/"
             "0040_customer_portal_native_file_quarantine_v1.sql").read_text()
FILE1 = "CDF-" + format(1, "032x")
FILE2 = "CDF-" + format(2, "032x")


class CustomerPrivateFileStatusSqlite(unittest.TestCase):
    def setUp(self):
        self.fx = filefixture.PrivateNativeFileSqlite(
            methodName="test_01_owned_reservation_is_pending_then_ready_only_on_finalize"
        )
        self.fx.setUp()
        self.addCleanup(self.fx.tearDown)
        self.db = self.fx.db
        self.db.executescript(MIGRATION)

    def read(self, file_id=FILE1, draft=filefixture.DRAFT,
             item=filefixture.ITEM, owner="C1"):
        return self.db.execute(SQL, (file_id, draft, item, owner, owner)).fetchone()

    def test_owned_pending_file_metadata_requires_quarantine(self):
        self.assertEqual(self.fx.reserve(), 1)
        row = self.read()
        self.assertIsNotNone(row)
        self.assertEqual(row["fileId"], FILE1)
        self.assertEqual(row["fileState"], "PENDING")
        self.assertEqual(row["quarantineDisposition"], "QUARANTINED")
        self.assertEqual(row["scanCompleted"], 0)
        self.assertEqual(row["printReleaseAuthorized"], 0)
        self.assertEqual(self.fx.finalize(), 1)
        self.assertEqual(self.read()["fileState"], "READY")
        self.assertEqual(self.read()["scanCompleted"], 0)

    def test_distinct_customers_and_item_ids_never_cross_match(self):
        self.assertEqual(self.fx.reserve(), 1)
        self.assertEqual(self.fx.reserve(
            2, draft=filefixture.OTHER_DRAFT, item=filefixture.OTHER_ITEM,
            token=filefixture.OTHER_MAC, key="cc"*16), 1)
        self.assertIsNone(self.read(owner="C2"))
        self.assertIsNone(self.read(file_id=FILE2))
        self.assertIsNone(self.read(item=filefixture.OTHER_ITEM))
        self.assertIsNone(self.read(draft=filefixture.OTHER_DRAFT))
        self.assertIsNotNone(self.read(
            file_id=FILE2, draft=filefixture.OTHER_DRAFT,
            item=filefixture.OTHER_ITEM, owner="C2"))
        self.assertIsNone(self.read(
            file_id=FILE2, draft=filefixture.OTHER_DRAFT,
            item=filefixture.OTHER_ITEM, owner="C1"))

    def test_submitted_or_cancelled_draft_has_no_readable_status(self):
        self.assertEqual(self.fx.reserve(), 1)
        for state in ("SUBMITTED", "CANCELLED"):
            self.db.execute(
                "UPDATE customer_portal_native_drafts_v1 SET state=? WHERE draft_id=?",
                (state, filefixture.DRAFT))
            self.assertIsNone(self.read())
        self.db.execute(
            "UPDATE customer_portal_native_drafts_v1 SET state='DRAFT' WHERE draft_id=?",
            (filefixture.DRAFT,))
        self.assertIsNotNone(self.read())

    def test_quarantine_is_immutable_and_status_source_cannot_authorize_release(self):
        self.assertEqual(self.fx.reserve(), 1)
        for statement in (
            "UPDATE customer_portal_native_file_quarantine_v1 SET scan_completed=1",
            "UPDATE customer_portal_native_file_quarantine_v1 SET print_release_authorized=1",
            "DELETE FROM customer_portal_native_file_quarantine_v1"
        ):
            with self.assertRaises(sqlite3.DatabaseError):
                self.db.execute(statement)
        row = self.read()
        self.assertEqual(row["quarantineDisposition"], "QUARANTINED")
        self.assertEqual(row["scanCompleted"], 0)
        self.assertEqual(row["printReleaseAuthorized"], 0)
        self.assertNotIn("r2_object_key", SQL.lower())
        self.assertNotIn("customer_name", SQL.lower())
        self.assertEqual(
            self.db.execute("SELECT COUNT(*) FROM t12_prod_orders").fetchone()[0], 0)

    def test_missing_quarantine_schema_fails_closed(self):
        # A rolled-back disposable migration must not fall back to public files.
        self.db.execute("DROP TRIGGER IF EXISTS trg_customer_native_quarantine_no_delete_v1")
        self.db.execute("DROP TABLE customer_portal_native_file_quarantine_v1")
        with self.assertRaises(sqlite3.DatabaseError):
            self.read()


if __name__ == "__main__":
    unittest.main(verbosity=2)
