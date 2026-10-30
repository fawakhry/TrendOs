"""Actual canonical EasyStore SQLite schema capability + identity collision tests.

All inserted money, people and session values synthetic. No live customer,
account, billing record, cloud credential or production migration.
"""
import importlib.util
import json
import pathlib
import sqlite3
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
TOOL=ROOT/"tools/zero_google_easystore_statement_source_audit_v0.py"
spec=importlib.util.spec_from_file_location("easystore_source_audit", TOOL)
audit=importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


def original_db():
    db=sqlite3.connect(":memory:")
    db.row_factory=sqlite3.Row
    for filename in audit.MIGRATIONS:
        db.executescript(filename.read_text(encoding="utf-8"))
    return db


class EasyStoreStatementNoGo(unittest.TestCase):
    def test_actual_migrations_balance_pk_exists_but_full_statement_identity_missing(self):
        report=audit.inspect_existing_source()
        self.assertTrue(report["existingBalanceExactIdSourceReady"])
        self.assertFalse(report["statementSchemaExactIdentityReady"])
        self.assertTrue(report["sourceSchemaChecks"]["existingEasyStoreBalancesByExactTypedPartyId"])
        self.assertTrue(report["sourceSchemaChecks"]["existingNativeSessionBalanceSqlUsesExactCustomerPartyJoin"])
        self.assertFalse(report["sourceSchemaChecks"]["statementLedgerHasExactPartyId"])
        self.assertFalse(report["sourceSchemaChecks"]["finalInvoicesHaveExactCustomerOrPartyId"])
        self.assertFalse(report["fullCustomerStatementAuthorized"])
        self.assertFalse(report["financialReadOrWriteOccurred"])
        self.assertFalse(report["financeWriteAuthorized"])
        self.assertFalse(report["missingBalanceTreatedAsZero"])
        self.assertFalse(report["liveCustomerGoogleAccountsActionRetired"])
        self.assertEqual(report["productionCustomerGoogleActionsRetiredLastProven"],0)
        self.assertEqual(report["customerGoogleActionsTotal"],9)

    def test_duplicate_names_and_codes_cannot_prove_ledger_owner_in_real_sqlite(self):
        with original_db() as db:
            for party_type,party_id,display_name,amount in (
                ("customer","CID-A","SAME DEMO NAME",100.25),
                ("customer","CID-B","SAME DEMO NAME",550.75),
                ("supplier","SUP-A","SAME DEMO NAME",900.00)
            ):
                db.execute(
                    "INSERT INTO employee_accounting_party_balances_v1"
                    "(party_type,party_id,party_name,balance,version,updated_at_ms)"
                    " VALUES(?,?,?,?,1,1793393000000)",
                    (party_type,party_id,display_name,amount)
                )
            for tx,amount in (("SYN-TX-A",25.5),("SYN-TX-B",99.25)):
                db.execute(
                    "INSERT INTO employee_accounting_party_ledger_v1"
                    "(transaction_id,request_key,party_type,party_name,party_code,"
                    "operation,amount,effect,created_by,created_at_ms)"
                    " VALUES(?,?,'customer','SAME DEMO NAME','SHARED-CODE',"
                    "'SYNTHETIC_ONLY',?,1,'TESTER',1793393000000)",
                    (tx,tx,amount)
                )
            rows=db.execute(
                "SELECT party_id,balance FROM employee_accounting_party_balances_v1"
                " WHERE party_type='customer' AND party_name='SAME DEMO NAME'"
                " ORDER BY party_id"
            ).fetchall()
            self.assertEqual([(r["party_id"],r["balance"]) for r in rows],
                             [("CID-A",100.25),("CID-B",550.75)])
            ambiguous=db.execute(
                "SELECT transaction_id,party_name,party_code"
                " FROM employee_accounting_party_ledger_v1"
                " WHERE party_type='customer' AND party_name='SAME DEMO NAME'"
                " ORDER BY transaction_id"
            ).fetchall()
            self.assertEqual(len(ambiguous),2)
            self.assertTrue(all(x["party_code"]=="SHARED-CODE" for x in ambiguous))
            self.assertNotIn("party_id",ambiguous[0].keys())
            report=audit.evaluate_source_schema(db,audit.NATIVE_BALANCE_SOURCE.read_text())
            self.assertFalse(report["statementSchemaExactIdentityReady"])
            self.assertFalse(report["fullCustomerStatementAuthorized"])

    def test_even_hypothetical_schema_columns_cannot_automatically_certify_live_finance(self):
        with original_db() as db:
            db.execute("ALTER TABLE employee_accounting_party_ledger_v1 ADD COLUMN party_id TEXT")
            db.execute("ALTER TABLE employee_accounting_final_invoices_v1 ADD COLUMN customer_id TEXT")
            report=audit.evaluate_source_schema(db,audit.NATIVE_BALANCE_SOURCE.read_text())
            self.assertTrue(report["statementSchemaExactIdentityReady"])
            self.assertFalse(report["nativeCustomerToEasyStorePartyLiveMappingAttested"])
            self.assertFalse(report["easyStoreAuthoritativeOwnerSignatureVerified"])
            self.assertFalse(report["independentInvoiceAndReceiptParityVerified"])
            self.assertFalse(report["fullCustomerStatementAuthorized"])
            self.assertFalse(report["productionGo"])

    def test_removing_strict_native_customer_party_join_fails_closed(self):
        with original_db() as db:
            bad=audit.NATIVE_BALANCE_SOURCE.read_text().replace(
                "b.party_type='customer' AND b.party_id=a.customer_id",
                "b.party_name=a.portal_code")
            r=audit.evaluate_source_schema(db,bad)
            self.assertFalse(r["existingBalanceExactIdSourceReady"])
            self.assertFalse(r["sourceSchemaChecks"]["existingNativeSessionBalanceSqlUsesExactCustomerPartyJoin"])
            self.assertFalse(r["fullCustomerStatementAuthorized"])

    def test_missing_authoritative_tables_never_infer_empty_or_zero_finances(self):
        with sqlite3.connect(":memory:") as db:
            r=audit.evaluate_source_schema(db,"")
            self.assertFalse(r["existingBalanceExactIdSourceReady"])
            self.assertFalse(r["statementSchemaExactIdentityReady"])
            self.assertFalse(r["fullCustomerStatementAuthorized"])
            self.assertFalse(r["missingBalanceTreatedAsZero"])

    def test_redacted_report_has_no_party_names_balance_values_or_customer_data(self):
        r=audit.inspect_existing_source()
        data=json.dumps(r,ensure_ascii=False)
        self.assertNotIn("SAME DEMO NAME",data)
        self.assertNotIn("CID-A",data)
        self.assertNotIn("100.25",data)
        self.assertNotIn("550.75",data)
        self.assertNotIn("FAKE CUSTOMER",data)
        self.assertNotIn("party_name",r["sourceSchemaMissingCapabilities"])
        self.assertFalse(r["financialBalanceAmountReturned"])
        self.assertFalse(r["customerFinanceHttpRouteEnabled"])


if __name__ == "__main__":
    unittest.main()
