"""SERVER-34 one-shot client tests: all traffic intercepted by in-memory FakeOpener."""
import io
import json
import unittest
from src.trendosshop_read_once import read_trendosshop_once, TrendosShopReadError

SECRET = "FAKE_READER_abcdefghijklmnopqrstuvwxyz0123456789"


def make_row(screen, line_id):
    return {
        "orderId": "FAKE_ORD_SHARED", "lineId": line_id,
        "screen": screen, "serviceCode": screen,
        "status": "بدأ التنفيذ", "quantity": 2,
    }


def make_body(screen):
    return {
        "success": True, "mode": "read-only", "screen": screen,
        "source": "qualified-mirror-plus-t12-snapshot",
        "rows": [make_row(screen, screen + "_line")],
        "pagination": {"page": 1, "pageSize": 20, "hasMore": False},
    }


class FakeResponse:
    def __init__(self, body, status=200, mime="application/json"):
        self.status = status
        self.headers = {"Content-Type": mime}
        self._buf = io.BytesIO(body)

    def read(self, n=-1):
        return self._buf.read(n)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self._buf.close()


class FakeOpener:
    def __init__(self, mutate=None):
        self.requests = []
        self.mutate = mutate

    def open(self, req, timeout):
        self.requests.append((req, timeout))
        screen = "print" if "screen=print" in req.full_url else "laser"
        obj = make_body(screen)
        if self.mutate:
            obj = self.mutate(screen, obj)
        if isinstance(obj, FakeResponse):
            return obj
        return FakeResponse(json.dumps(obj, ensure_ascii=False).encode("utf-8"))


class ReadOnceTests(unittest.TestCase):
    def test_default_disabled_without_any_transport(self):
        op = FakeOpener()
        with self.assertRaisesRegex(TrendosShopReadError, "SERVER34_LIVE_READ_DISABLED"):
            read_trendosshop_once(SECRET, opener=op)
        with self.assertRaisesRegex(TrendosShopReadError, "SERVER34_LIVE_READ_DISABLED"):
            read_trendosshop_once(SECRET, enabled=True, opener=op)
        self.assertEqual(op.requests, [])

    def test_success_counts_not_ids_with_two_exact_https_reads(self):
        op = FakeOpener()
        result = read_trendosshop_once(SECRET, enabled=True, owner_authorized=True, opener=op)
        self.assertEqual(result["byScreenCounts"], {"print": 1, "laser": 1})
        self.assertEqual(result["distinctOrdersInFetchedPages"], 1)
        self.assertNotIn("FAKE_ORD_SHARED", repr(result))
        self.assertEqual(len(op.requests), 2)
        for request, timeout in op.requests:
            self.assertEqual(request.get_method(), "GET")
            self.assertEqual(timeout, 5)
            self.assertEqual(request.full_url.split("?")[0], "https://trendos-d1-api.trendmall-contact.workers.dev/v1/printshop/service/orders/page")
            self.assertIn(request.full_url.split("?")[1], [
                "screen=print&page=1&pageSize=20", "screen=laser&page=1&pageSize=20"
            ])
            self.assertEqual(request.get_header("Authorization"), "Bearer " + SECRET)

    def test_invalid_credential_is_never_sent(self):
        op = FakeOpener()
        with self.assertRaisesRegex(TrendosShopReadError, "SERVER34_INVALID_SERVICE_CREDENTIAL"):
            read_trendosshop_once("fake", enabled=True, owner_authorized=True, opener=op)
        self.assertEqual(op.requests, [])

    def test_extra_pii_field_rejected_without_partial_result(self):
        op = FakeOpener(lambda screen, body: {
            **body,
            "rows": [{**body["rows"][0], "customerPhone": "PRIVATE_FAKE_010"}]
        } if screen == "laser" else body)
        with self.assertRaisesRegex(TrendosShopReadError, "SERVER34_PII_OR_FIELD_DENIED"):
            read_trendosshop_once(SECRET, enabled=True, owner_authorized=True, opener=op)
        self.assertEqual(len(op.requests), 2)

    def test_cross_screen_mismatch_rejected(self):
        op = FakeOpener(lambda screen, body: {**body, "screen": "service"} if screen == "laser" else body)
        with self.assertRaisesRegex(TrendosShopReadError, "SERVER34_SCOPE_MISMATCH"):
            read_trendosshop_once(SECRET, enabled=True, owner_authorized=True, opener=op)

    def test_http_redirect_refused(self):
        op = FakeOpener(lambda screen, body: FakeResponse(b"", status=302))
        with self.assertRaisesRegex(TrendosShopReadError, "SERVER34_HTTP_DENIED"):
            read_trendosshop_once(SECRET, enabled=True, owner_authorized=True, opener=op)

    def test_large_response_rejected(self):
        op = FakeOpener(lambda screen, body: FakeResponse(b"x" * 131073))
        with self.assertRaisesRegex(TrendosShopReadError, "SERVER34_RESPONSE_TOO_LARGE"):
            read_trendosshop_once(SECRET, enabled=True, owner_authorized=True, opener=op)

    def test_wrong_mime_rejected(self):
        op = FakeOpener(lambda screen, body: FakeResponse(b"{}", mime="text/html"))
        with self.assertRaisesRegex(TrendosShopReadError, "SERVER34_CONTENT_TYPE_DENIED"):
            read_trendosshop_once(SECRET, enabled=True, owner_authorized=True, opener=op)

    def test_missing_or_malformed_line_denied(self):
        op = FakeOpener(lambda screen, body: {**body, "rows": [{"orderId": "x"}]})
        with self.assertRaisesRegex(TrendosShopReadError, "SERVER34_PII_OR_FIELD_DENIED"):
            read_trendosshop_once(SECRET, enabled=True, owner_authorized=True, opener=op)


if __name__ == "__main__":
    unittest.main()
