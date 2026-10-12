#!/usr/bin/env python3
"""ACC187 separation audit: the legacy departmental material-waste handler is
NOT an authorized returned finished-goods waste / manager-approved recovery path.

Strictly reads checked-in source, never accesses Cloudflare, D1 or any business.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "cloudflare-d1/src/employee-accounting-native-v1.mjs"


class WasteRecoveryLegacyBoundary(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        data = SOURCE.read_text(encoding="utf-8")
        start = data.find("async function saveAccountingWasteV1(")
        end = data.find("\nasync function ", start + 40)
        assert start >= 0 and end > start, "missing exact known accounting waste handler"
        cls.method = data[start:end]
        cls.source = data

    def test_legacy_handler_is_department_material_waste_not_returns(self):
        self.assertIn("['full','print','laser'].includes(auth.mode)", self.method)
        self.assertIn("const orderId=text(b.orderId)", self.method)
        self.assertIn("employee_accounting_materials_v1", self.method)
        self.assertIn("employee_accounting_stock_moves_v1", self.method)
        self.assertNotIn("SYNTHETIC_VERIFIED_FINISHED_GOODS_MANUFACTURING_COST", self.method)
        self.assertNotIn("inspectReturnedWasteManufacturingCost", self.method)

    def test_legacy_handler_conflates_recovered_amount_with_original_waste_record(self):
        self.assertIn("recovered=num(b.paid||b.damageCovered)", self.method)
        self.assertIn("amount,recovered_amount", self.method)
        self.assertIn("recovered_amount AS recovered FROM employee_accounting_waste_v1", self.method)
        # Existing cap on the recovered field is not owner-approved for a
        # separately justified recovery that might exceed gross waste cost.
        self.assertIn("recovered>amount", self.method)

    def test_no_separately_approved_recovery_manager_verifier_in_legacy_handler(self):
        self.assertNotIn("APPROVED_RECOVERY", self.method)
        self.assertNotIn("recoveryEvidenceId", self.method)
        self.assertNotIn("costEvidenceId", self.method)
        self.assertNotIn("independentManagerRecoveryApproval", self.method)

    def test_legacy_handler_must_not_be_claimed_as_posted_finished_goods_return(self):
        self.assertNotIn("physicalReceiptId", self.method)
        self.assertNotIn("returnRequestId", self.method)
        self.assertNotIn("costEvidenceId", self.method)
        self.assertIn("await env.DB.batch(statements)", self.method)
        # The batch IS a real D1 write path when enabled. Source-only CI must
        # NEVER invoke it on real data or infer its suitability for returns.

    def test_no_legacy_direct_dispatch_for_new_separate_recovery(self):
        for new_action in (
            "recordAcc187ReturnedFinishedGoodsWasteV1",
            "recordAcc187ApprovedSupplierRecoveryV1",
            "recordAcc187ApprovedResponsiblePartyRecoveryV1",
        ):
            self.assertNotIn("action==='"+new_action+"'", self.source)


if __name__ == "__main__":
    unittest.main()
    print("ACC187_EXISTING_WASTE_FIELD_RECOVERED_AMOUNT_IS_NOT_SEPARATE_APPROVED_RECOVERY=SOURCE_CONFIRMED")
    print("ACC187_LEGACY_WORKER_FINISHED_GOODS_COST_AND_RECOVERY=NOT_QUALIFIED")
    print("ACC187_DO_NOT_POST_RETURN_WASTE_THROUGH_LEGACY_HANDLER=NO_GO")
    print("FINANCE_RELEASE=NO_GO")
