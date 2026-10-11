#!/usr/bin/env python3
"""ACC188: forbid legacy historic A2.10 CI background pushes on finance candidate."""
from pathlib import Path
w=Path(".github/workflows/easystore-a210-supplier-canary-ci.yml").read_text(encoding="utf-8")
assert "  contents: read" in w
assert "persist-credentials: false" in w
assert "ref: candidate/easystore-accounting-a2-20261005" not in w
assert "actions/upload-artifact@v4" in w
assert "artifacts/a210-supplier-qualification-NO_GO.txt" in w
assert "if: always()" in w
assert "steps.test.outcome != 'success'" in w
assert "node tests/easystore_a210_supplier_canary.test.mjs" in w
for bad in ("contents: write", "git push", "git commit", "git add ",
            "git config user", "wrangler deploy", "d1 execute", "workflow_dispatch:"):
    assert bad not in w,bad
assert "PRODUCTION_MUTATION=NO" in w
print("ACC188_A210_CI_AUTOMATIC_SOURCE_BRANCH_PUSH_REMOVED=PASS")
print("ACC188_A210_QUALIFICATION_PRESERVED_AS_RUN_ARTIFACT=PASS")
print("ACC188_A210_NO_PRODUCTION_DEPLOY=YES")
