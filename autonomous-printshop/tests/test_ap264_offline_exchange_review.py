"""AP-264 synthetic-only exchange test fixtures, hosted CI, no real host."""
from __future__ import annotations

import inspect
import json
import unittest

import offline_exchange_review as exchange
import policy
import trust_boundary

HEAD = "a238ce5a830bc5a7968dc020cd8168c85fa8c446"
BRANCH = "feature/ap155-imac-ssh-service-absent-owner-install-20261012"
NOW = 1700000000
RID = "OWNER_TEST_123456789"


def snapshot(**updates):
    payload = {
        "schema": "trendos.ap260.owner-local-snapshot.v1",
        "execution": "OWNER_LOCAL_READ_ONLY",
        "remote_executor": "NOT_ESTABLISHED",
        "python_version": "3.12.3",
        "git_head": HEAD,
        "git_branch": BRANCH,
        "tracked_changes": "NO",
        "untracked_files": "NOT_SCANNED",
        "production": "NOT_ACCESSED",
    }
    payload.update(updates)
    return payload


def request(**updates):
    value = {
        "schema": exchange.REQUEST_SCHEMA,
        "target": exchange.TARGET,
        "mode": exchange.MODE,
        "branch": BRANCH,
        "issued_at": NOW - 10,
        "expires_at": NOW + 50,
        "catalog_digest": trust_boundary.catalog_digest(),
        "plan": {
            "schema": policy.POLICY_SCHEMA,
            "operation": "git_status",
            "commit": HEAD,
            "request_id": RID,
            "args": {},
        },
    }
    value.update(updates)
    return value


def response(**updates):
    value = {
        "schema": exchange.RESPONSE_SCHEMA,
        "target": exchange.TARGET,
        "mode": exchange.MODE,
        "request_id": RID,
        "operation": "git_status",
        "commit": HEAD,
        "snapshot": snapshot(),
    }
    value.update(updates)
    return value


def check(req=None, res=None, **kwargs):
    return exchange.review_offline_exchange(
        json.dumps(request() if req is None else req, sort_keys=True),
        json.dumps(response() if res is None else res, sort_keys=True),
        expected_head=kwargs.get("expected_head", HEAD),
        expected_branch=kwargs.get("expected_branch", BRANCH),
        sample_now=kwargs.get("sample_now", NOW),
        stop_requested=kwargs.get("stop_requested", False),
    )


class AP264OfflineExchangeReviewTests(unittest.TestCase):
    def assert_off(self, result):
        self.assertIs(result["host_attested"], False)
        self.assertIs(result["owner_authenticated"], False)
        self.assertIs(result["execution_authorized"], False)
        self.assertIs(result["remote_channel_established"], False)
        self.assertIs(result["durable_replay_protection"], False)
        self.assertIs(result["real_stop_installed"], False)

    def test_matching_snapshot_is_never_an_execution_grant(self):
        actual = check()
        self.assertEqual(actual["decision"], "MATCHED_REVIEW_ONLY")
        self.assertEqual(actual["reported_tracked_changes"], "NO")
        self.assertEqual(len(actual["request_sha256"]), 64)
        self.assertEqual(len(actual["response_sha256"]), 64)
        self.assertIs(actual["untracked_files_scanned"], False)
        self.assert_off(actual)

    def test_dirty_tracked_metadata_requires_attention(self):
        result = check(res=response(snapshot=snapshot(tracked_changes="YES")))
        self.assertEqual(result["decision"], "OWNER_ATTENTION")
        self.assertEqual(result["reported_tracked_changes"], "YES")
        self.assert_off(result)

    def test_all_three_existing_ap233_operations_are_review_only(self):
        for operation in sorted(policy.APPROVED_OPERATIONS):
            req = request()
            req["plan"]["operation"] = operation
            res = response(operation=operation)
            with self.subTest(operation=operation):
                actual = check(req=req, res=res)
                self.assertEqual(actual["decision"], "MATCHED_REVIEW_ONLY")
                self.assert_off(actual)

    def test_unlisted_operation_denied(self):
        for operation in ("shell", "print", "git_reset", "apt_install"):
            req = request()
            req["plan"]["operation"] = operation
            res = response(operation=operation)
            with self.subTest(operation=operation):
                self.assertEqual(check(req=req, res=res)["decision"], "DENY")

    def test_arbitrary_paths_or_args_denied(self):
        req = request()
        req["plan"]["args"] = {"path": "/home/trend-main/customers"}
        self.assertEqual(check(req=req)["decision"], "DENY")

    def test_request_and_response_correlate_by_id(self):
        self.assertEqual(check(res=response(request_id="OTHER_RANDOM_12345"))["decision"], "DENY")
        self.assertEqual(check(res=response(operation="python_version"))["decision"], "DENY")
        self.assertEqual(check(res=response(commit="b" * 40))["decision"], "DENY")

    def test_invalid_request_id_denied(self):
        for ident in ("x", "../customer_data", "!" * 16, True, "a" * 65):
            req = request()
            req["plan"]["request_id"] = ident
            with self.subTest(ident=ident):
                self.assertEqual(check(req=req)["decision"], "DENY")

    def test_wrong_plan_pin_denied(self):
        req = request()
        req["plan"]["commit"] = "b" * 40
        self.assertEqual(check(req=req)["decision"], "DENY")

    def test_expected_pins_required_and_independent(self):
        for head, branch in [
            (None, BRANCH), ("Z" * 40, BRANCH), (HEAD, None),
            (HEAD, "bad branch"), ("b" * 40, BRANCH), (HEAD, "feature/not-this"),
        ]:
            with self.subTest(head=head, branch=branch):
                self.assertEqual(check(expected_head=head, expected_branch=branch)["decision"], "DENY")

    def test_target_mode_and_schema_mismatch_denied(self):
        for req in [
            request(schema="bad"),
            request(target="PrintshopProd"),
            request(mode="ONLINE_AUTO_EXEC"),
            request(branch="feature/other"),
        ]:
            with self.subTest(req=req):
                self.assertEqual(check(req=req)["decision"], "DENY")
        for res in [
            response(schema="bad"),
            response(target="PrintshopProd"),
            response(mode="REMOTE_SSH"),
        ]:
            with self.subTest(res=res):
                self.assertEqual(check(res=res)["decision"], "DENY")

    def test_mismatched_catalog_digest_denied(self):
        self.assertEqual(check(req=request(catalog_digest="0" * 64))["decision"], "DENY")

    def test_time_window_and_expiry_do_not_grant_clock_attestation(self):
        for req in [
            request(issued_at=NOW + 1),
            request(expires_at=NOW),
            request(issued_at=NOW - 400, expires_at=NOW + 1),
            request(issued_at=NOW + 1, expires_at=NOW + 1),
            request(expires_at=True),
            request(issued_at=False),
        ]:
            with self.subTest(req=req):
                self.assertEqual(check(req=req)["decision"], "DENY")
        self.assertEqual(check(sample_now=NOW + 100)["decision"], "DENY")
        self.assertEqual(check(sample_now=True)["decision"], "DENY")
        self.assertEqual(check(sample_now=None)["decision"], "DENY")

    def test_simulated_stop_is_blocked_not_real_host_stop(self):
        got = check(stop_requested=True)
        self.assertEqual(got["decision"], "BLOCKED")
        self.assertEqual(got["reason"], "SIMULATED_STOP_NO_HOST_EFFECT")
        self.assert_off(got)
        self.assertEqual(check(stop_requested="TRUE")["decision"], "DENY")

    def test_missing_and_extra_envelope_fields_denied(self):
        req = request()
        req.pop("plan")
        self.assertEqual(check(req=req)["decision"], "DENY")
        self.assertEqual(check(req=request(command="rm -rf /"))["decision"], "DENY")
        res = response()
        res.pop("snapshot")
        self.assertEqual(check(res=res)["decision"], "DENY")
        self.assertEqual(check(res=response(url="http://localhost"))["decision"], "DENY")

    def test_plan_fields_exact_and_types(self):
        req = request()
        req["plan"]["new_permission"] = True
        self.assertEqual(check(req=req)["decision"], "DENY")
        req = request()
        req["plan"].pop("args")
        self.assertEqual(check(req=req)["decision"], "DENY")
        req = request()
        req["plan"]["args"] = []
        self.assertEqual(check(req=req)["decision"], "DENY")
        req = request()
        req["plan"]["schema"] = "unsupported"
        self.assertEqual(check(req=req)["decision"], "DENY")

    def test_snapshots_with_wrong_head_or_suspicious_fields_denied(self):
        for metadata in [
            snapshot(git_head="b" * 40),
            snapshot(git_branch="feature/unexpected"),
            snapshot(production="ACCESSED"),
            snapshot(remote_executor="ACTIVE"),
            snapshot(secret="PRIVATE"),
            snapshot(untracked_files="SCANNED"),
            snapshot(tracked_changes="UNKNOWN"),
        ]:
            with self.subTest(metadata=metadata):
                self.assertEqual(check(res=response(snapshot=metadata))["decision"], "DENY")

    def test_snapshot_must_be_object_not_raw_command(self):
        self.assertEqual(check(res=response(snapshot="print now"))["decision"], "DENY")

    def test_duplicate_nested_plan_keys_denied(self):
        raw_request = json.dumps(request(), separators=(",", ":"))
        raw_request = raw_request.replace('"args":{}', '"args":{},"args":{}')
        result = exchange.review_offline_exchange(
            raw_request, json.dumps(response()), expected_head=HEAD,
            expected_branch=BRANCH, sample_now=NOW,
        )
        self.assertEqual(result["decision"], "DENY")

    def test_duplicate_snapshot_keys_denied(self):
        raw_response = json.dumps(response(), separators=(",", ":"))
        raw_response = raw_response.replace(
            '"production":"NOT_ACCESSED"', '"production":"NOT_ACCESSED","production":"NOT_ACCESSED"',
        )
        result = exchange.review_offline_exchange(
            json.dumps(request()), raw_response, expected_head=HEAD,
            expected_branch=BRANCH, sample_now=NOW,
        )
        self.assertEqual(result["decision"], "DENY")

    def test_rejects_non_json_wrong_types_and_size(self):
        for raw in (None, 1, {}, "{", "[]", "null", "NaN", "x" * 5000,
                    json.dumps(request()) + "\n", "غير مسموح"):
            with self.subTest(raw=str(raw)[:30]):
                a = exchange.review_offline_exchange(
                    raw, json.dumps(response()), expected_head=HEAD,
                    expected_branch=BRANCH, sample_now=NOW,
                )
                b = exchange.review_offline_exchange(
                    json.dumps(request()), raw, expected_head=HEAD,
                    expected_branch=BRANCH, sample_now=NOW,
                )
                self.assertEqual(a["decision"], "DENY")
                self.assertEqual(b["decision"], "DENY")

    def test_no_echo_of_request_ids_or_secrets_in_denials(self):
        secret = "SECRET_NOT_FOR_AUDIT"
        result = check(res=response(token=secret))
        self.assertEqual(result["decision"], "DENY")
        self.assertNotIn(secret, str(result))
        self.assertNotIn(RID, str(result))
        self.assert_off(result)

    def test_canonical_content_fingerprints_stable(self):
        r1, s1 = request(), response()
        r2 = json.dumps(r1, sort_keys=False, separators=(", ", ": "))
        s2 = json.dumps(s1, sort_keys=False, separators=(", ", ": "))
        result = exchange.review_offline_exchange(
            r2, s2, expected_head=HEAD, expected_branch=BRANCH, sample_now=NOW,
        )
        first = check()
        self.assertEqual(first["request_sha256"], result["request_sha256"])
        self.assertEqual(first["response_sha256"], result["response_sha256"])

    def test_non_effectful_pure_offline_module(self):
        source = inspect.getsource(exchange)
        for forbidden in (
            "import os", "import socket", "import subprocess", "import sqlite3",
            "open(", "Popen(", "eval(", "exec(", "urllib", "requests",
        ):
            with self.subTest(forbidden=forbidden):
                self.assertNotIn(forbidden, source)
        for flag in (
            "TRANSPORT_ENABLED", "HOST_EXECUTION_ENABLED",
            "OWNER_AUTH_IMPLEMENTED", "DEVICE_ATTESTATION_IMPLEMENTED",
            "TRUSTED_CLOCK_IMPLEMENTED", "DURABLE_REPLAY_AUDIT_IMPLEMENTED",
            "REAL_STOP_IMPLEMENTED",
        ):
            self.assertIs(getattr(exchange, flag), False)


if __name__ == "__main__":
    unittest.main()
