"""SERVER-69C: explicit, disabled-by-default read-once Ubuntu canary CLI.

Does not run when imported. Does NOT integrate with run.py or scheduled polling.
No D1 writes, local files, customers, device controls or token arguments.
For a real canary the owner must separately authorize and provision the token.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Callable, Mapping, Sequence, TextIO

from .trendosshop_read_once import read_trendosshop_once, TrendosShopReadError


class CanaryDisabled(RuntimeError):
    pass


def _safe_summary(reply: dict) -> dict:
    """Only emit numerical aggregates, never rows/IDs or arbitrary remote data."""
    if not isinstance(reply, dict) or reply.get("ok") is not True:
        raise TrendosShopReadError("SERVER69_UNTRUSTED_READER_RESULT")
    counts = reply.get("byScreenCounts")
    if not isinstance(counts, dict) or set(counts) != {"print", "laser"}:
        raise TrendosShopReadError("SERVER69_UNTRUSTED_READER_RESULT")
    for value in counts.values():
        if type(value) is not int or not 0 <= value <= 20:
            raise TrendosShopReadError("SERVER69_UNTRUSTED_READER_RESULT")
    distinct = reply.get("distinctOrdersInFetchedPages")
    if type(distinct) is not int or not 0 <= distinct <= 40:
        raise TrendosShopReadError("SERVER69_UNTRUSTED_READER_RESULT")
    if (reply.get("mode") != "READ_ONLY_ONESHOT"
        or reply.get("deviceExecution") is not False
        or reply.get("filesWritten") is not False
        or reply.get("businessWrites") is not False):
        raise TrendosShopReadError("SERVER69_UNTRUSTED_READER_RESULT")
    return {
        "ok": True,
        "mode": "READ_ONLY_ONESHOT",
        "byScreenCounts": {"print": counts["print"], "laser": counts["laser"]},
        "distinctOrdersInFetchedPages": distinct,
        "hasMorePagesUnverified": True,
        "deviceExecution": False,
        "filesWritten": False,
        "businessWrites": False,
    }


def run_canary_once(
    argv: Sequence[str] | None = None, *,
    environ: Mapping[str, str] | None = None,
    reader: Callable = read_trendosshop_once,
) -> dict:
    parser = argparse.ArgumentParser(
        description="One approved TrendOS machine-reader CANARY only. Default OFF."
    )
    parser.add_argument("--canary-read", action="store_true")
    parser.add_argument("--owner-authorized", action="store_true")
    args = parser.parse_args(argv)
    env = os.environ if environ is None else environ
    if (args.canary_read is not True or args.owner_authorized is not True
        or env.get("TRENDOSSHOP_SERVER69_CANARY_ENABLED") != "true"
        or env.get("TRENDOSSHOP_SERVER69_OWNER_APPROVED") != "true"):
        raise CanaryDisabled("SERVER69_CANARY_DISABLED")
    # No CLI token flags, debug output, file reads/writes, or subprocess calls.
    token = env.get("TRENDOSSHOP_READER_BEARER", "")
    result = reader(token, enabled=True, owner_authorized=True)
    return _safe_summary(result)


def main(argv: Sequence[str] | None = None, *,
         environ: Mapping[str, str] | None = None,
         reader: Callable = read_trendosshop_once,
         out: TextIO = sys.stdout, err: TextIO = sys.stderr) -> int:
    try:
        summary = run_canary_once(argv, environ=environ, reader=reader)
    except CanaryDisabled:
        print("SERVER69_CANARY_DISABLED", file=err)
        return 2
    except TrendosShopReadError as exc:
        # This code list comes from our client, not a remote body; never show a
        # raw HTTP error, token, hostname, customer record or traceback.
        code = str(exc)
        if not (code.startswith("SERVER34_") or code == "SERVER69_UNTRUSTED_READER_RESULT"):
            code = "SERVER69_CANARY_FAILED"
        print(code, file=err)
        return 3
    except Exception:
        print("SERVER69_CANARY_FAILED", file=err)
        return 3
    print(json.dumps(summary, sort_keys=True, separators=(",", ":")), file=out)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
