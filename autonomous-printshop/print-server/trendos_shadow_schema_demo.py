"""AP-296 entirely fake one-shot TrendOS getRows schema preview.

This command is intentionally NOT capable of live auth or network access.
It accepts no CLI flags, account, password, URL, token, or customer files.
"""
from __future__ import annotations

import json
import sys

from src.trendos_shadow_qualifier import qualify_screen_once


class FakeEmployeeClient:
    connected = True

    def __init__(self):
        self.calls = []

    def get_rows(self, screen):
        self.calls.append(screen)
        return {
            "success": True,
            "rows": [
                {
                    "orderId": "FAKE-296-ORDER-1",
                    "lineId": "FAKE-296-LINE-1",
                    "status": "طلب جديد",
                    "customer": "FAKE CUSTOMER DATA MUST NOT BE ECHOED",
                },
                {
                    "orderId": "FAKE-296-ORDER-1",
                    "lineId": "FAKE-296-LINE-2",
                    "status": "تحت المراجعة",
                    "customer": "FAKE CUSTOMER DATA MUST NOT BE ECHOED",
                },
            ],
        }


def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    if args:
        raise SystemExit("AP296_NO_LIVE_MODE_OR_PARAMETERS")
    client = FakeEmployeeClient()
    result = qualify_screen_once(client, "print", allowed_screens=("print",))
    assert client.calls == ["print"]
    assert result["rowCount"] == 2
    assert result["distinctOrderIdsPresent"] == 1
    assert not result["platformBusinessWrites"]
    assert not result["localFolderWrites"]
    print("AP296_FAKE_SHADOW_SCHEMA=" + json.dumps(result, ensure_ascii=False, sort_keys=True))
    print("AP296_FAKE_SHADOW_PASS=YES; REAL_PLATFORM=OFF; "
          "CREDENTIALS=NONE; FILES=NONE; PRINTING=OFF")


if __name__ == "__main__":
    main()
