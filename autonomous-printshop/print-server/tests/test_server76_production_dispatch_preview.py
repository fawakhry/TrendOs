"""SERVER-76: hosted in-memory-only print + laser handoff tests; fake identities."""
import copy
import unittest

from src.production_dispatch_preview import (
    DispatchPreviewError, build_employee_dispatch_preview,
)


def sample():
    def packet(screen, rows):
        return {
            "success": True, "screen": screen, "mode": "read-only",
            "source": "qualified-mirror-plus-t12-snapshot",
            "pagination": {"page": 1, "pageSize": 20, "hasMore": False},
            "rows": rows,
        }
    def line(lid, screen, status="بدأ التنفيذ"):
        return {
            "orderId": "FAKE-SAME-ORDER", "lineId": lid,
            "screen": screen, "serviceCode": screen,
            "status": status, "quantity": 2,
        }
    return {
        "print": packet("print", [line("PRINT-LINE", "print")]),
        "laser": packet("laser", [line("LASER-LINE", "laser")]),
    }


def asset(line="PRINT-LINE"):
    return {
        "orderId": "FAKE-SAME-ORDER", "lineId": line,
        "fileId": "FAKE-FILE-1",
        "storageProvider": "R2", "mimeType": "application/pdf",
        "contentSha256": "a" * 64,
        "activeLineMatch": True, "archived": False,
    }


class Server76PreviewTest(unittest.TestCase):
    def test_cross_department_one_order_two_lines(self):
        result = build_employee_dispatch_preview(sample(), [asset()])
        self.assertEqual(result["orderCount"], 1)
        self.assertEqual(result["lineCount"], 2)
        self.assertEqual(result["byScreen"], {"print": 1, "laser": 1})
        self.assertEqual([row["lineId"] for row in result["tasks"]], ["PRINT-LINE", "LASER-LINE"])
        self.assertEqual(result["tasks"][0]["linkedFileCandidates"], 1)
        self.assertIn("REVIEW_DESIGN", result["tasks"][0]["nextOperatorAction"])
        self.assertEqual(result["tasks"][1]["linkedFileCandidates"], 0)
        self.assertIn("REQUEST_QUALIFIED", result["tasks"][1]["nextOperatorAction"])
        self.assertFalse(any(row["readyForMachine"] for row in result["tasks"]))
        for key in ("networkRequests", "assetBytesDownloaded", "folderWrites",
                    "printerCommands", "laserCommands", "customerDirectoryRead",
                    "platformBusinessWrites", "productionAuthorized"):
            self.assertIs(result[key], False)

    def test_no_customer_pii_r2_keys_or_hash_in_projected_task(self):
        result = build_employee_dispatch_preview(sample(), [asset()])
        serialized = repr(result)
        for secret in ("customerName", "customerPhone", "r2Key", "FAKE-FILE-1", "a" * 64):
            self.assertNotIn(secret, serialized)
        self.assertEqual(set(result["tasks"][0]), {
            "orderId", "lineId", "screen", "quantity", "status",
            "linkedFileCandidates", "nextOperatorAction", "assetApprovalVerified",
            "fileHashRecheckedOnHost", "readyForMachine",
        })

    def test_both_sections_mandatory_no_partial_success(self):
        for invalid in (None, {}, {"print": sample()["print"]},
                        {**sample(), "service": sample()["print"]}):
            with self.assertRaises(DispatchPreviewError):
                build_employee_dispatch_preview(invalid)

    def test_forged_screen_and_legacy_source_rejected(self):
        for field, value in (("screen", "laser"), ("mode", "write"),
                             ("source", "untrusted-legacy"), ("success", False)):
            response = sample()
            response["print"][field] = value
            with self.assertRaises(DispatchPreviewError):
                build_employee_dispatch_preview(response)

    def test_truncated_or_unqualified_pages_rejected(self):
        for field, value in (("page", 2), ("pageSize", 100), ("hasMore", True),
                             ("hasMore", "false")):
            response = sample()
            response["print"]["pagination"][field] = value
            with self.assertRaises(DispatchPreviewError):
                build_employee_dispatch_preview(response)

    def test_customer_fields_rejected_before_result(self):
        for field in ("customerName", "customerPhone", "notes", "accountingAmount"):
            response = sample()
            response["print"]["rows"][0][field] = "PRIVATE"
            with self.assertRaisesRegex(DispatchPreviewError, "FIELD_SCOPE_DENIED"):
                build_employee_dispatch_preview(response)

    def test_cross_screen_duplicate_line_rejected(self):
        response = sample()
        response["laser"]["rows"][0]["lineId"] = "PRINT-LINE"
        with self.assertRaisesRegex(DispatchPreviewError, "DUPLICATE_LINE"):
            build_employee_dispatch_preview(response)

    def test_cross_order_or_orphan_artifact_rejected(self):
        for bad in ({"orderId": "ANOTHER-ORDER"}, {"lineId": "ORPHAN"},
                    {"fileId": "../escape"}):
            a = asset()
            a.update(bad)
            with self.assertRaises(DispatchPreviewError):
                build_employee_dispatch_preview(sample(), [a])

    def test_artifact_cannot_forge_source_or_design_approval(self):
        for changes in ({"contentSha256": "z" * 64},
                        {"mimeType": "application/x-msdownload"},
                        {"storageProvider": "local"},
                        {"activeLineMatch": False},
                        {"archived": True},
                        {"customerName": "PRIVATE"}):
            a = asset()
            a.update(changes)
            with self.assertRaises(DispatchPreviewError):
                build_employee_dispatch_preview(sample(), [a])

    def test_duplicate_asset_id_rejected(self):
        a = asset()
        b = {**a, "lineId": "LASER-LINE"}
        with self.assertRaisesRegex(DispatchPreviewError, "DUPLICATE_ARTIFACT"):
            build_employee_dispatch_preview(sample(), [a, b])

    def test_closed_line_never_marked_ready_even_with_file(self):
        response = sample()
        response["print"]["rows"][0]["status"] = "تم التسليم"
        out = build_employee_dispatch_preview(response, [asset()])
        self.assertEqual(out["tasks"][0]["nextOperatorAction"], "DO_NOT_DISPATCH_CLOSED_LINE")
        self.assertFalse(out["tasks"][0]["readyForMachine"])

    def test_nan_and_boolean_quantities_fail_closed(self):
        for quantity in (float("nan"), float("inf"), True, 0, -1, 1000001):
            response = sample()
            response["print"]["rows"][0]["quantity"] = quantity
            with self.assertRaises(DispatchPreviewError):
                build_employee_dispatch_preview(response)

    def test_empty_results_are_not_invented_orders(self):
        response = sample()
        for screen in ("print", "laser"):
            response[screen]["rows"] = []
        out = build_employee_dispatch_preview(response)
        self.assertEqual(out["orderCount"], 0)
        self.assertEqual(out["tasks"], [])
        self.assertFalse(out["productionAuthorized"])

    def test_fail_closed_asset_list_shape(self):
        for bad in ({}, None, "file", [asset()] * 81):
            with self.assertRaises(DispatchPreviewError):
                build_employee_dispatch_preview(sample(), bad)

    def test_preview_never_modifies_input(self):
        responses = sample()
        a = asset()
        prior = copy.deepcopy((responses, a))
        build_employee_dispatch_preview(responses, [a])
        self.assertEqual((responses, a), prior)


if __name__ == "__main__":
    unittest.main()
