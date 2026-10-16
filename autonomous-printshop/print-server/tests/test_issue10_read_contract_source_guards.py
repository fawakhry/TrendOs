"""Issue #10: source-contract regression guards; offline, no requests or credentials."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[3]
DISPATCHER = ROOT / "employee-api-dispatcher-v1.js"
SHADOW = ROOT / "autonomous-printshop/print-server/src/trendos_shadow_qualifier.py"

class ReadContractSourceGuards(unittest.TestCase):
    def test_employee_core_page_adapter_is_explicitly_not_server_paged(self):
        code = DISPATCHER.read_text(encoding="utf-8")
        self.assertRegex(code, r"p\.action\s*=\s*requestedAction\s*===\s*'getRowsPageV1931'\s*\?\s*'getRows'")
        self.assertRegex(code, r"if\s*\(requestedAction\s*===\s*'getRowsPageV1931'\s*&&\s*out\s*&&\s*out\.success\s*===\s*true\)")
        self.assertIn("out.serverPaged = false", code)

    def test_shadow_refuses_page_markers(self):
        code = SHADOW.read_text(encoding="utf-8")
        self.assertIn('AP296_PAGINATED_CONTRACT_NOT_SUPPORTED', code)
        self.assertIn('SHADOW_READ_ACTION = "getRows"', code)

if __name__ == "__main__":
    unittest.main()
