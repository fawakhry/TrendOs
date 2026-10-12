"""AP-263 hosted synthetic, no host execution or customer fixtures."""
import inspect
import json
import unittest

import offline_snapshot_handoff as handoff


EXPECTED_HEAD = "a238ce5a830bc5a7968dc020cd8168c85fa8c446"
EXPECTED_BRANCH = "feature/ap155-imac-ssh-service-absent-owner-install-20261012"


def snapshot(**updates):
    data = {
        "schema": "trendos.ap260.owner-local-snapshot.v1",
        "execution": "OWNER_LOCAL_READ_ONLY",
        "remote_executor": "NOT_ESTABLISHED",
        "python_version": "3.12.3",
        "git_head": EXPECTED_HEAD,
        "git_branch": EXPECTED_BRANCH,
        "tracked_changes": "NO",
        "untracked_files": "NOT_SCANNED",
        "production": "NOT_ACCESSED",
    }
    data.update(updates)
    return json.dumps(data, sort_keys=True, separators=(",", ":"))


def review(raw, *, head=EXPECTED_HEAD, branch=EXPECTED_BRANCH):
    return handoff.review_owner_copied_snapshot(
        raw, expected_head=head, expected_branch=branch,
    )


class AP263OfflineSnapshotHandoffTests(unittest.TestCase):
    def test_ap262_shape_owner_copy_is_review_only(self):
        result = review(snapshot())
        self.assertEqual(result["decision"], "REVIEW_ONLY")
        self.assertEqual(result["reason"], "REPORTED_TRACKED_CLEAN_UNVERIFIED")
        self.assertEqual(result["python_version"], "3.12.3")
        self.assertEqual(result["tracked_changes"], "NO")
        self.assertEqual(len(result["snapshot_sha256"]), 64)
        self.assertIs(result["host_attested"], False)
        self.assertIs(result["execution_authorized"], False)
        self.assertIs(result["remote_channel_established"], False)
        self.assertIs(result["untracked_files_scanned"], False)

    def test_dirty_tracked_tree_requires_owner_attention_not_execution(self):
        result = review(snapshot(tracked_changes="YES"))
        self.assertEqual(result["decision"], "OWNER_ATTENTION")
        self.assertIs(result["execution_authorized"], False)

    def test_deterministic_fingerprint_ignores_key_order_and_spacing(self):
        a = json.loads(snapshot())
        first = review(json.dumps(a))
        second = review(json.dumps(a, sort_keys=True, separators=(",", ":")))
        self.assertEqual(first["snapshot_sha256"], second["snapshot_sha256"])

    def test_duplicate_keys_are_rejected_even_when_identical(self):
        source = snapshot()
        duplicate = source[:-1] + ',"production":"NOT_ACCESSED"}'
        self.assertEqual(review(duplicate)["decision"], "DENY")

    def test_unknown_field_refused(self):
        self.assertEqual(review(snapshot(command="sudo ls"))["decision"], "DENY")

    def test_missing_field_refused(self):
        data = json.loads(snapshot())
        data.pop("untracked_files")
        self.assertEqual(review(json.dumps(data))["decision"], "DENY")

    def test_no_customer_paths_tokens_or_large_strings_echoed(self):
        secret = "CUSTOMER_NAME_PRIVATE_DO_NOT_PRINT"
        result = review(snapshot(secret=secret))
        self.assertEqual(result["decision"], "DENY")
        self.assertNotIn(secret, str(result))
        self.assertNotIn(EXPECTED_HEAD, str(result))

    def test_invalid_expected_pins_fail_closed(self):
        for head, branch in [
            (None, EXPECTED_BRANCH),
            (EXPECTED_HEAD.upper(), EXPECTED_BRANCH),
            ("a" * 39, EXPECTED_BRANCH),
            (EXPECTED_HEAD, None),
            (EXPECTED_HEAD, "../../customer"),
            (EXPECTED_HEAD, "bad branch"),
        ]:
            with self.subTest(head=head, branch=branch):
                self.assertEqual(
                    review(snapshot(), head=head, branch=branch)["decision"], "DENY",
                )

    def test_pin_mismatch_is_rejected(self):
        for modified in [
            snapshot(git_head="b" * 40),
            snapshot(git_branch="feature/other-reviewed-branch"),
        ]:
            with self.subTest(modified=modified):
                self.assertEqual(review(modified)["decision"], "DENY")

    def test_offline_flags_cannot_be_promoted_to_runtime(self):
        for changes in [
            {"remote_executor": "ENABLED"},
            {"execution": "REMOTE"},
            {"production": "ACCESSED"},
            {"untracked_files": "SCANNED"},
            {"schema": "trendos.ap999.untrusted.v1"},
        ]:
            with self.subTest(changes=changes):
                self.assertEqual(review(snapshot(**changes))["decision"], "DENY")

    def test_invalid_metadata_is_rejected(self):
        for changes in [
            {"python_version": "3.12.3; curl"},
            {"git_head": "no sha"},
            {"git_branch": "feature/space inside"},
            {"tracked_changes": "UNKNOWN"},
        ]:
            with self.subTest(changes=changes):
                self.assertEqual(review(snapshot(**changes))["decision"], "DENY")

    def test_non_string_fields_rejected(self):
        for changes in [
            {"tracked_changes": False},
            {"python_version": 3123},
            {"remote_executor": None},
        ]:
            with self.subTest(changes=changes):
                self.assertEqual(review(snapshot(**changes))["decision"], "DENY")

    def test_malformed_or_nonobject_inputs_rejected(self):
        for raw in [
            None, True, {}, b"{}", "", "[]", "null", "NaN", "[1,2]",
            "{", "{}", "true", "0",
        ]:
            with self.subTest(raw=raw):
                self.assertEqual(review(raw)["decision"], "DENY")

    def test_multiline_and_nonascii_refused(self):
        for raw in [snapshot() + "\n", "\n" + snapshot(), snapshot() + "\r",
                    snapshot().replace("3.12.3", "٣.١٢.٣")]:
            with self.subTest(raw=raw):
                self.assertEqual(review(raw)["decision"], "DENY")

    def test_oversized_inputs_refused(self):
        self.assertEqual(review("x" * 1025)["decision"], "DENY")

    def test_unauthenticated_copy_never_attests_or_authorizes(self):
        for raw in [snapshot(), snapshot(tracked_changes="YES"), snapshot(git_head="b"*40)]:
            with self.subTest(raw=raw):
                result = review(raw)
                self.assertFalse(result["host_attested"])
                self.assertFalse(result["execution_authorized"])
                self.assertFalse(result["remote_channel_established"])

    def test_handoff_is_pure_no_launch_or_transport(self):
        code = inspect.getsource(handoff)
        for snippet in ["import subprocess", "import socket", "import requests",
                        "from urllib", "os.system", "Popen(", "eval(", "exec("]:
            with self.subTest(snippet=snippet):
                self.assertNotIn(snippet, code)
        self.assertFalse(handoff.TRANSPORT_ENABLED)
        self.assertFalse(handoff.HOST_EXECUTION_ENABLED)
        self.assertFalse(handoff.DEVICE_ATTESTATION_IMPLEMENTED)
        self.assertFalse(handoff.OWNER_AUTHENTICATION_IMPLEMENTED)
        self.assertFalse(handoff.REPLAY_STORE_IMPLEMENTED)


if __name__ == "__main__":
    unittest.main()
