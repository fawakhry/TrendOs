"""SERVER-77: existing HTTPS service-reader transport -> human review preview.

FakeOpener only, no actual network, customer records, files, or devices.
"""
import unittest

from src.trendosshop_read_once import (
    TrendosShopReadError, read_trendosshop_dispatch_preview_once,
)
from src.production_dispatch_preview import DispatchPreviewError
from test_server34_trendosshop_read_once import FakeOpener, SECRET


def preview(opener, **flags):
    return read_trendosshop_dispatch_preview_once(
        SECRET, opener=opener, **flags
    )


class Server77ReadToQueueTests(unittest.TestCase):
    def test_disabled_without_any_http(self):
        for flags in ({}, {"enabled": True}, {"owner_authorized": True}):
            opener = FakeOpener()
            with self.assertRaisesRegex(TrendosShopReadError, "LIVE_READ_DISABLED"):
                preview(opener, **flags)
            self.assertEqual(opener.requests, [])

    def test_bad_service_token_rejected_before_http(self):
        opener = FakeOpener()
        with self.assertRaisesRegex(TrendosShopReadError, "INVALID_SERVICE_CREDENTIAL"):
            read_trendosshop_dispatch_preview_once(
                "employee-token", enabled=True, owner_authorized=True, opener=opener
            )
        self.assertEqual(opener.requests, [])

    def test_existing_exact_https_reader_makes_two_gets_and_projects_queue(self):
        opener = FakeOpener()
        result = preview(opener, enabled=True, owner_authorized=True)
        self.assertEqual(result["schema"], "trendos.server76.employee-dispatch-preview.v1")
        self.assertEqual(result["mode"], "IN_MEMORY_REVIEW_ONLY")
        self.assertEqual(result["orderCount"], 1)
        self.assertEqual(result["lineCount"], 2)
        self.assertEqual(result["byScreen"], {"print": 1, "laser": 1})
        self.assertEqual([x["screen"] for x in result["tasks"]], ["print", "laser"])
        self.assertFalse(any(x["readyForMachine"] for x in result["tasks"]))
        self.assertTrue(result["requiresAuthorizedFileRetrieval"])
        for key in ("assetBytesDownloaded", "folderWrites", "networkRequests",
                    "printerCommands", "laserCommands", "platformBusinessWrites",
                    "productionAuthorized", "customerDirectoryRead"):
            self.assertIs(result[key], False)
        self.assertEqual(len(opener.requests), 2)
        for request, timeout in opener.requests:
            self.assertEqual(request.get_method(), "GET")
            self.assertEqual(timeout, 5)
            self.assertTrue(request.full_url.startswith(
                "https://trendos-d1-api.trendmall-contact.workers.dev/v1/printshop/service/orders/page?"
            ))
            self.assertEqual(request.get_header("Authorization"), "Bearer " + SECRET)

    def test_exact_real_page_end_not_inferred_if_has_more(self):
        opener = FakeOpener(lambda screen, packet: {
            **packet,
            "pagination": {**packet["pagination"], "hasMore": True},
        } if screen == "laser" else packet)
        with self.assertRaisesRegex(DispatchPreviewError, "INCOMPLETE_SNAPSHOT"):
            preview(opener, enabled=True, owner_authorized=True)
        self.assertEqual(len(opener.requests), 2)

    def test_missing_and_stringified_has_more_fail_closed(self):
        for bad in (None, "false", 0):
            opener = FakeOpener(lambda screen, packet: {
                **packet,
                "pagination": {**packet["pagination"], "hasMore": bad},
            })
            with self.assertRaisesRegex(DispatchPreviewError, "INCOMPLETE_SNAPSHOT"):
                preview(opener, enabled=True, owner_authorized=True)

    def test_extra_customer_fields_on_second_screen_fail_without_output(self):
        opener = FakeOpener(lambda screen, packet: {
            **packet,
            "rows": [{**packet["rows"][0], "customerPhone": "FAKE_PRIVATE_NUMBER"}]
        } if screen == "laser" else packet)
        with self.assertRaisesRegex(TrendosShopReadError, "PII_OR_FIELD_DENIED"):
            preview(opener, enabled=True, owner_authorized=True)
        self.assertEqual(len(opener.requests), 2)

    def test_cross_department_duplicate_line_id_denied(self):
        opener = FakeOpener(lambda screen, packet: {
            **packet,
            "rows": [{**packet["rows"][0], "lineId": "print_line"}],
        })
        with self.assertRaisesRegex(DispatchPreviewError, "DUPLICATE_LINE"):
            preview(opener, enabled=True, owner_authorized=True)

    def test_source_spoof_rejected_by_existing_reader(self):
        opener = FakeOpener(lambda screen, packet: {
            **packet,
            "source": "unauthenticated-legacy",
        })
        with self.assertRaisesRegex(TrendosShopReadError, "UNTRUSTED_SOURCE"):
            preview(opener, enabled=True, owner_authorized=True)

    def test_no_partial_response_on_laser_http_error(self):
        from test_server34_trendosshop_read_once import FakeResponse
        opener = FakeOpener(lambda screen, packet:
                            FakeResponse(b"", status=403) if screen == "laser" else packet)
        with self.assertRaisesRegex(TrendosShopReadError, "HTTP_DENIED"):
            preview(opener, enabled=True, owner_authorized=True)

    def test_bad_identifier_never_reaches_queue(self):
        opener = FakeOpener(lambda screen, packet: {
            **packet, "rows": [
                {**packet["rows"][0], "lineId": "../escape"}
            ]
        } if screen == "print" else packet)
        # SERVER-34 restricts field length; SERVER-76 rejects traversal-like
        # identifiers before a preview can ever be returned.
        # Existing SERVER-76 line IDs permit "/" for compatibility, so this
        # test must use an actually rejected shape, not assume stronger rules.
        with self.assertRaises(DispatchPreviewError):
            preview(opener, enabled=True, owner_authorized=True)


if __name__ == "__main__":
    unittest.main()
