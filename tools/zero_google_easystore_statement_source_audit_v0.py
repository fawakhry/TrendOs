#!/usr/bin/env python3
"""TrendOS / EasyStore native customer statement authority audit — SOURCE ONLY.

Examines the ORIGINAL existing EasyStore/TrendOS SQLite migrations 0015/0024
in a fresh IN-MEMORY database. Does not contact Cloudflare, Apps Script,
EasyStore, Google or a real customer. It NEVER calculates or publishes
balances, statements, invoices, payments or a fabricated zero amount.

Passing schema probes are NOT owner attestation, financial certification or
proof of deployed data parity. No prod mutation/merge/deploy.
"""
from __future__ import annotations

import json
import pathlib
import sqlite3
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
MIGRATIONS = (
    ROOT / "cloudflare-d1/migrations/0015_employee_accounting_zero_google_v1.sql",
    ROOT / "cloudflare-d1/migrations/0024_employee_accounting_party_balances_v1.sql",
)
NATIVE_BALANCE_SOURCE = (
    ROOT / "cloudflare-d1/src/customer-portal-easystore-finance-id-read-v0.mjs"
)

TABLE_BALANCES = "employee_accounting_party_balances_v1"
TABLE_LEDGER = "employee_accounting_party_ledger_v1"
TABLE_INVOICES = "employee_accounting_final_invoices_v1"


def read_schema(connection: sqlite3.Connection, table: str) -> dict:
    # Only hardcoded identifiers from this source, no user-controlled SQL.
    info = connection.execute(f'PRAGMA table_info("{table}")').fetchall()
    columns = {row[1] for row in info}
    key = tuple(row[1] for row in sorted(info, key=lambda r: r[5]) if row[5] > 0)
    return {"exists": bool(info), "columns": columns, "primaryKey": key}


def evaluate_source_schema(connection: sqlite3.Connection,
                           native_balance_source: str) -> dict:
    """Return redacted schema ability (not any financial row or balance)."""
    b = read_schema(connection, TABLE_BALANCES)
    l = read_schema(connection, TABLE_LEDGER)
    i = read_schema(connection, TABLE_INVOICES)

    checks = {
        "existingEasyStoreBalancesByExactTypedPartyId": (
            b["exists"] and
            b["primaryKey"] == ("party_type", "party_id") and
            {"party_type", "party_id", "balance", "version", "updated_at_ms"}
            <= b["columns"]
        ),
        "existingNativeSessionBalanceSqlUsesExactCustomerPartyJoin": (
            "b.party_type='customer' AND b.party_id=a.customer_id"
            in native_balance_source and
            "s.token_fingerprint_hex=?" in native_balance_source
        ),
        "statementLedgerHasExactPartyId": (
            l["exists"] and "party_id" in l["columns"]
        ),
        "statementLedgerHasUniqueTypedPartyReference": (
            l["exists"] and {"party_id", "party_type"} <= l["columns"]
        ),
        "finalInvoicesHaveExactCustomerOrPartyId": (
            i["exists"] and
            ("customer_id" in i["columns"] or
             {"party_type", "party_id"} <= i["columns"])
        ),
    }
    missing = [key for key, value in checks.items() if not value]
    # An exact balance (even if it exists) is NOT full invoice/receipt parity.
    # Source schemas do not contain independent signed owner attestations.
    return {
        "version": "ZERO_GOOGLE_EASYSTORE_STATEMENT_SOURCE_AUDIT_OFF_V0",
        "auditMode": "REAL_EXISTING_SQLITE_SCHEMAS_READ_ONLY_NO_CUSTOMERS",
        "existingBalanceExactIdSourceReady": bool(
            checks["existingEasyStoreBalancesByExactTypedPartyId"] and
            checks["existingNativeSessionBalanceSqlUsesExactCustomerPartyJoin"]
        ),
        "statementSchemaExactIdentityReady": bool(
            checks["statementLedgerHasExactPartyId"] and
            checks["statementLedgerHasUniqueTypedPartyReference"] and
            checks["finalInvoicesHaveExactCustomerOrPartyId"]
        ),
        "sourceSchemaChecks": checks,
        "sourceSchemaMissingCapabilities": missing,
        "sourceIdentityIsFinancialAuthority": False,
        "easyStoreAuthoritativeOwnerSignatureVerified": False,
        "nativeCustomerToEasyStorePartyLiveMappingAttested": False,
        "independentInvoiceAndReceiptParityVerified": False,
        "productionFinanceSnapshotFreshnessVerified": False,
        "fullCustomerStatementAuthorized": False,
        "customerFinanceHttpRouteEnabled": False,
        "financialReadOrWriteOccurred": False,
        "financialBalanceAmountReturned": False,
        "missingBalanceTreatedAsZero": False,
        "liveCustomerGoogleAccountsActionRetired": False,
        "productionCustomerGoogleActionsRetiredLastProven": 0,
        "customerGoogleActionsTotal": 9,
        "t12OrderCreated": False,
        "financeWriteAuthorized": False,
        "productionGo": False,
        "status": "BLOCKED_EASYSTORE_EXACT_ID_STATEMENT_AND_OWNER_PARITY",
        "nextAuthority": (
            "EasyStore owner: certify real customer_id to party_id mapping, "
            "stable per-party invoice/receipt ownership, financial freshness "
            "and signed authority before any native customer statements."
        ),
    }


def inspect_existing_source() -> dict:
    with sqlite3.connect(":memory:") as conn:
        conn.execute("PRAGMA foreign_keys=ON")
        for source in MIGRATIONS:
            conn.executescript(source.read_text(encoding="utf-8"))
        return evaluate_source_schema(
            conn, NATIVE_BALANCE_SOURCE.read_text(encoding="utf-8")
        )


if __name__ == "__main__":
    report = inspect_existing_source()
    print(json.dumps(report, ensure_ascii=False, indent=2, sort_keys=True))
    # The audit itself passes if it correctly describes missing ability. It
    # NEVER treats a source report as permission to release customer finance.
    if (
        not report["existingBalanceExactIdSourceReady"]
        or report["fullCustomerStatementAuthorized"]
        or report["productionGo"]
        or report["financialReadOrWriteOccurred"]
    ):
        sys.exit(1)
