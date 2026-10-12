#!/usr/bin/env python3
"""ACC187 source audit: generic customer debt adjustments are NOT store credit.

Never executes runtime, finance POST, Cloudflare or D1; reads checked-in Worker
source only. Alerts when source moves in a way requiring full accounting review.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "cloudflare-d1/src/employee-accounting-native-v1.mjs"


class SourceAudit(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        src = SOURCE.read_text(encoding="utf-8")
        start = src.find("async function partyLedger(env,auth,b){")
        end = src.find("async function saveSupplierV1(", start)
        assert start >= 0 and end > start, "cannot safely isolate known party ledger"
        cls.worker = src
        cls.party = src[start:end]

    def test_customer_adjustment_is_generic_ledger_operation(self):
        self.assertRegex(self.party, r"new Set\(\['payment_received','opening_debt','invoice','adjustment_increase','adjustment_decrease','manual'\]\)")
        self.assertIn("if(auth.mode!=='full'&&!['payment_received','payment_paid'].includes(op))", self.party)
        self.assertIn("'party-ledger:'+type+':'+op", self.party)

    def test_adjustment_decrease_is_negative_existing_debt_effect_only(self):
        self.assertRegex(
            self.worker,
            r"function effect\(op\)\{return \['payment_received','payment_paid','adjustment_decrease'\].*?-1:1;\}",
        )
        self.assertIn("if(delta<0&&amount>before+0.000001)", self.party)
        self.assertIn("balance=balance+?", self.party)

    def test_cashbox_not_generated_by_generic_adjustment(self):
        self.assertIn("if(op==='payment_received'||op==='payment_paid'){", self.party)
        self.assertIn("const movementType=op==='payment_received'?'CUSTOMER_RECEIPT':'SUPPLIER_PAYMENT';", self.party)
        self.assertIn("cashboxPosted:op==='payment_received'||op==='payment_paid'", self.party)
        self.assertNotIn("if(op==='adjustment_decrease')", self.party)

    def test_existing_dispatch_is_not_owner_approved_refund_store_credit(self):
        self.assertIn("action==='saveCustomerAccountMovementV1915'", self.worker)
        self.assertIn("action==='savePartyLedgerTransaction'", self.worker)
        for forbidden in (
            "action==='refundEasyStoreSaleV2'",
            "action==='issueEasyStoreCustomerCreditV2'",
            "action==='creditEasyStoreCustomerAccountV2'",
            "action==='applyEasyStoreRefundAsStoreCreditV2'",
        ):
            self.assertNotIn(forbidden, self.worker)
        self.assertIn("employee-accounting-action-unknown", self.worker)


if __name__ == "__main__":
    unittest.main()
    print("ACC187_EXISTING_CUSTOMER_DEBT_ADJUSTMENT_IS_NOT_STORE_CREDIT=SOURCE_CONFIRMED")
    print("ACC187_GENERIC_DEBT_ADJUSTMENT_NEEDS_DISTINCT_MANAGER_REFUND_FLOW=NOT_IMPLEMENTED")
    print("ACC187_REAL_STORE_CREDIT_LIABILITY_AND_CASH_REFUND=NOT_IMPLEMENTED")
    print("FINANCE_RELEASE=NO_GO")
