"""SERVER-69C: dormant CLI tests with an injected fake reader; zero HTTP."""
import io
import json
import unittest
from src.trendosshop_canary_once_cli import (
    run_canary_once, main, CanaryDisabled
)
from src.trendosshop_read_once import TrendosShopReadError

TOKEN = "FAKE_INTERNAL_CANARY_BEARER_0123456789ABCDEFGHIJK"
ENABLED = {
    "TRENDOSSHOP_SERVER69_CANARY_ENABLED": "true",
    "TRENDOSSHOP_SERVER69_OWNER_APPROVED": "true",
    "TRENDOSSHOP_READER_BEARER": TOKEN,
}
FLAGS = ["--canary-read", "--owner-authorized"]


def synthetic_reader(secret, *, enabled, owner_authorized):
    assert secret == TOKEN
    assert enabled is True and owner_authorized is True
    return {
        "ok": True,
        "mode": "READ_ONLY_ONESHOT",
        "byScreenCounts": {"print": 2, "laser": 1},
        "distinctOrdersInFetchedPages": 2,
        "hasMorePagesUnverified": True,
        "filesWritten": False,
        "businessWrites": False,
        "deviceExecution": False,
        "rows": [{"customerPhone": "PRIVATE_SHOULD_NEVER_APPEAR"}],
    }


class TestServer69CanaryCLI(unittest.TestCase):
    def test_default_off_no_invocation_even_with_secret(self):
        calls = []
        def fake(*args, **kwargs):
            calls.append(args)
            return {}
        for flags, env in [
            ([], ENABLED),
            (["--canary-read"], ENABLED),
            (["--owner-authorized"], ENABLED),
            (FLAGS, {}),
            (FLAGS, {**ENABLED, "TRENDOSSHOP_SERVER69_CANARY_ENABLED": "false"}),
            (FLAGS, {**ENABLED, "TRENDOSSHOP_SERVER69_OWNER_APPROVED": "false"}),
        ]:
            with self.assertRaisesRegex(CanaryDisabled, "SERVER69_CANARY_DISABLED"):
                run_canary_once(flags, environ=env, reader=fake)
        self.assertEqual(calls, [])

    def test_explicit_gate_emits_counts_only_and_never_prints_token(self):
        stdout, stderr = io.StringIO(), io.StringIO()
        code = main(FLAGS, environ=ENABLED, reader=synthetic_reader,
                    out=stdout, err=stderr)
        self.assertEqual(code, 0)
        obj = json.loads(stdout.getvalue())
        self.assertEqual(obj["byScreenCounts"], {"print": 2, "laser": 1})
        self.assertEqual(obj["distinctOrdersInFetchedPages"], 2)
        self.assertEqual(obj["mode"], "READ_ONLY_ONESHOT")
        self.assertFalse(obj["deviceExecution"])
        self.assertNotIn("rows", obj)
        self.assertNotIn("PRIVATE", stdout.getvalue())
        self.assertNotIn(TOKEN, stdout.getvalue())
        self.assertEqual(stderr.getvalue(), "")

    def test_disabled_cli_has_fixed_error_no_data(self):
        stdout, stderr = io.StringIO(), io.StringIO()
        self.assertEqual(main([], environ=ENABLED, reader=synthetic_reader,
                              out=stdout, err=stderr), 2)
        self.assertEqual(stdout.getvalue(), "")
        self.assertEqual(stderr.getvalue().strip(), "SERVER69_CANARY_DISABLED")

    def test_bad_underlying_token_does_not_leak(self):
        def denied(secret, **kwargs):
            raise TrendosShopReadError("SERVER34_INVALID_SERVICE_CREDENTIAL")
        stdout, stderr = io.StringIO(), io.StringIO()
        code = main(FLAGS, environ={**ENABLED, "TRENDOSSHOP_READER_BEARER": ""},
                    reader=denied, out=stdout, err=stderr)
        self.assertEqual(code, 3)
        self.assertEqual(stderr.getvalue().strip(), "SERVER34_INVALID_SERVICE_CREDENTIAL")
        self.assertEqual(stdout.getvalue(), "")

    def test_untrusted_oversize_counts_and_device_true_rejected(self):
        for patch in [
            {"byScreenCounts": {"print": 21, "laser": 1}},
            {"byScreenCounts": {"service": 1, "laser": 1}},
            {"byScreenCounts": {"print": True, "laser": 1}},
            {"distinctOrdersInFetchedPages": 100},
            {"deviceExecution": True},
            {"businessWrites": True},
        ]:
            def fake(secret, **kwargs):
                return {**synthetic_reader(secret, **kwargs), **patch}
            with self.assertRaisesRegex(TrendosShopReadError, "SERVER69_UNTRUSTED_READER_RESULT"):
                run_canary_once(FLAGS, environ=ENABLED, reader=fake)

    def test_unexpected_errors_do_not_echo_raw_secrets_or_pii(self):
        def malicious(secret, **kwargs):
            raise ValueError("PII_01001234567 " + TOKEN)
        stdout, stderr = io.StringIO(), io.StringIO()
        self.assertEqual(main(FLAGS, environ=ENABLED, reader=malicious,
                              out=stdout, err=stderr), 3)
        self.assertEqual(stdout.getvalue(), "")
        self.assertEqual(stderr.getvalue().strip(), "SERVER69_CANARY_FAILED")


if __name__ == "__main__":
    unittest.main()
