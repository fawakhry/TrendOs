#!/usr/bin/env python3
"""ACC199: all tests are offline mock changes/checked-in source inspection."""
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/easystore_acc199_pr_diff_safety_gate_no_go.py"
spec = importlib.util.spec_from_file_location("acc199_guard", SCRIPT)
assert spec and spec.loader
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)

SAFE = [
    ("A", "scripts/easystore_acc199_pr_diff_safety_gate_no_go.py"),
    ("A", "tests/easystore_acc199_pr_diff_safety_gate_no_go.test.py"),
    ("A", ".github/workflows/easystore-acc199-pr-diff-safety-gate-no-go.yml"),
    ("A", "docs/trendos/staging/ACC199_SOURCE_ONLY_PR_CHAIN_REVIEW_NO_GO_20261012.md"),
]
WORKFLOW = """name: ACC199 read-only
on:
  pull_request:
permissions:
  contents: read
jobs:
  source-only:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          persist-credentials: false
      - run: python3 tests/easystore_acc199_pr_diff_safety_gate_no_go.test.py
"""


class SourceOnlyPaths(unittest.TestCase):
    def test_expected_read_only_pr_changes_accepted(self):
        self.assertEqual([], guard.classify_changed_paths(SAFE))

    def test_actual_known_safe_prior_stage_filenames_remain_in_scope(self):
        seen = [
            ("A", "docs/trendos/staging/ACC186_ACCOUNTING_SAFE_EXECUTION_LEDGER_20261012.json"),
            ("A", "scripts/easystore_acc195_source_config_pin_no_go.py"),
            ("M", "tests/easystore_acc198_shared_ledger_refund_stop_sqlite.test.mjs"),
            ("A", ".github/workflows/easystore-acc191-198-browser-integrated-no-go.yml"),
        ]
        self.assertEqual([], guard.classify_changed_paths(seen))

    def test_non_source_changes_denied(self):
        for path in (
            "cloudflare-d1/src/employee-accounting-native-v1.mjs",
            "cloudflare-d1/wrangler.toml",
            "cloudflare-d1/migrations/0040.sql",
            "easystore/config.js",
            "src/customer-wallet.js",
            "package.json",
            "TrendOS_MASTER_BOOK.md",
            "EASYSTORE_ACCOUNTING_MASTER_BOOK.md",
            ".github/workflows/easystore-a2-accounting-readonly-api-deploy.yml",
            ".github/workflows/production-deploy.yml",
            ".github/workflows/easystore-acc199-deploy.yml",
        ):
            self.assertTrue(guard.classify_changed_paths([("M", path)]),
                            f"unprotected path: {path}")

    def test_no_source_diff_cannot_be_passed(self):
        self.assertIn("NO_CHANGED_FILES_NOT_QUALIFIED", guard.classify_changed_paths([]))

    def test_rename_delete_type_change_are_denied(self):
        for status in ("D", "R100", "C099", "T", "U"):
            self.assertTrue(any("DESTRUCTIVE" in e for e in
                                guard.classify_changed_paths([
                                    (status, SAFE[0][1])])),
                            f"unexpected status {status}")

    def test_path_traversal_absolute_windows_backslash_and_duplicates(self):
        malicious = [
            ("A", "../scripts/easystore_acc199_fake.py"),
            ("A", "scripts/../../cloudflare-d1/wrangler.toml"),
            ("A", "/scripts/easystore_acc199_fake.py"),
            ("A", "scripts\\easystore_acc199_fake.py"),
            ("A", ""),
        ]
        self.assertTrue(all(guard.classify_changed_paths([x]) for x in malicious))
        dup = [("A", SAFE[0][1]), ("M", SAFE[0][1])]
        self.assertTrue(any("DUPLICATE_CHANGE" in x for x in
                            guard.classify_changed_paths(dup)))

    def test_near_miss_allowed_filename_denied(self):
        for name in (
            "tests/easystore_acc199_overhead.sh",
            "scripts/easystore_acc199_hidden.jsx",
            ".github/workflows/easystore-acc199-debug-deploy.yml",
            ".github/workflows/easystore-acc199-source-only.yml",
            "docs/trendos/staging/OTHER_ACC199_REPORT.md",
        ):
            self.assertTrue(guard.classify_changed_paths([("A", name)]))


class Workflows(unittest.TestCase):
    def test_ordinary_source_only_actions_workflow_passes(self):
        self.assertEqual([],
                         guard.inspect_workflow_content(SAFE[2][1], WORKFLOW))

    def test_workflow_without_readonly_permissions_fails_closed(self):
        self.assertIn("READONLY_PERMISSIONS_NOT_DECLARED:"+SAFE[2][1],
                      guard.inspect_workflow_content(SAFE[2][1],
                                                     WORKFLOW.replace("contents: read", "contents: write")))

    def test_deploy_command_or_rollback_even_with_readonly_title_fails(self):
        for command in (
            "npx wrangler deploy --config x",
            "npx wrangler rollback version",
            "npx wrangler d1 execute DB --remote --command 'SELECT 1'",
            "npm run deploy",
            "git merge --no-edit FETCH_HEAD",
            "git push origin candidate",
            "uses: cloudflare/wrangler-action@v3",
        ):
            failures=guard.inspect_workflow_content(
                SAFE[2][1], WORKFLOW+"\n      - run: "+command+"\n")
            self.assertGreater(len(failures),0,command)

    def test_secret_remote_write_chain_fetch_are_rejected(self):
        for command in (
            "CLOUDFLARE_API_TOKEN: " + "$" + "{{ secrets.CLOUDFLARE_API_TOKEN }}",
            "curl https://example.invalid/health",
            "wget https://example.invalid/config.js",
            "workflow_run:",
        ):
            errors=guard.inspect_workflow_content(
                SAFE[2][1],WORKFLOW+"\n"+command+"\n")
            self.assertTrue(errors,command)

    def test_privilege_escalation_and_non_pr_triggers_rejected(self):
        for fragment in (
            "  pull_request_target:",
            "  repository_dispatch:",
            "  workflow_dispatch:",
            "  schedule:",
            "  workflow_run:",
            "      contents: write",
            "      id-token: write",
            "    environment: production",
        ):
            errors = guard.inspect_workflow_content(
                SAFE[2][1], WORKFLOW + "\n" + fragment + "\n")
            self.assertTrue(errors, fragment)

    def test_no_persisted_checkout_credentials_cannot_pass_new_workflow(self):
        failures = guard.inspect_workflow_content(
            SAFE[2][1], WORKFLOW.replace("persist-credentials: false",
                                         "persist-credentials: true"))
        self.assertTrue(any("CHECKOUT_CREDENTIAL_PERSISTENCE_NOT_DISABLED" in e
                            for e in failures))

    def test_only_explicit_pull_request_event_is_qualified(self):
        failures = guard.inspect_workflow_content(
            SAFE[2][1], WORKFLOW.replace("  pull_request:", "  push:"))
        self.assertTrue(any("ONLY_EXPLICIT_PULL_REQUEST_TRIGGER_ALLOWED" in e
                            for e in failures))

    def test_all_pr_files_must_trigger_the_security_workflow(self):
        for filter_key in ("paths", "paths-ignore", "branches", "branches-ignore"):
            modified = WORKFLOW.replace(
                "  pull_request:", "  pull_request:\n    " + filter_key + ":\n      - scripts/**")
            errors = guard.inspect_workflow_content(SAFE[2][1], modified)
            self.assertTrue(
                any("PR_SCOPE_FILTER_MAY_SKIP_DANGEROUS_DIFF" in e for e in errors),
                filter_key,
            )

    def test_current_security_workflow_has_no_pr_file_filters(self):
        source = ROOT / ".github/workflows/easystore-acc199-pr-diff-safety-gate-no-go.yml"
        contents = source.read_text(encoding="utf-8")
        self.assertEqual([], guard.inspect_workflow_content(
            str(source.relative_to(ROOT)), contents))

    def test_actual_security_workflow_checks_diff_before_adversarial_tests(self):
        source = ROOT / ".github/workflows/easystore-acc199-pr-diff-safety-gate-no-go.yml"
        contents = source.read_text(encoding="utf-8")
        self.assertLess(contents.index("Compare EXACT PR HEAD"),
                        contents.index("Adversarial local source"))
        self.assertIn("persist-credentials: false", contents)
        self.assertIn("fetch-depth: 0", contents)
        self.assertNotIn("    paths:", contents)

    def test_historic_manual_deploy_workflow_is_detected_as_dangerous(self):
        # This deliberately reads, NEVER runs or edits the old deploy workflow.
        legacy=ROOT / ".github/workflows/easystore-a2-accounting-readonly-api-deploy.yml"
        content=legacy.read_text(encoding="utf-8")
        violations=guard.inspect_workflow_content(str(legacy.relative_to(ROOT)),content)
        self.assertTrue(any("GITHUB_SECRET_REFERENCE" in v for v in violations))
        self.assertTrue(any("WRANGLER_REMOTE_OR_DEPLOY_COMMAND" in v for v in violations))
        self.assertTrue(any("GIT_MUTATION_COMMAND" in v for v in violations))

    def test_a_non_workflow_document_is_not_scanned_as_executable_workflow(self):
        s="This audit quotes secrets. and wrangler deploy as forbidden facts."
        self.assertEqual([],guard.inspect_workflow_content("docs/trendos/staging/ACC199_SOURCE_REVIEW.md",s))


class PinnedLocalGraph(unittest.TestCase):
    def test_absent_short_or_non_sha_is_fail_closed_before_git(self):
        for bad in ("not-a-sha", "", "a"*39, "A"*40, "g"*40):
            _, errors=guard.inspect_checked_out_pr(bad,"b"*40)
            self.assertEqual(errors,["INVALID_PINNED_SHA"])
            _, errors=guard.inspect_checked_out_pr("b"*40,bad)
            self.assertEqual(errors,["INVALID_PINNED_SHA"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
    print("ACC199_PR_SOURCE_DIFF_NEGATIVE_MUTATIONS=PASS")
    print("ACC199_HAZARDOUS_LEGACY_DEPLOY_DETECTED_NOT_EXECUTED=PASS")
    print("ACC199_REAL_MERGE_AUTHORIZATION=NOT_GRANTED")
    print("FINANCE_RELEASE=NO_GO")
