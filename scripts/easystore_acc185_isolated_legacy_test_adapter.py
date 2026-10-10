#!/usr/bin/env python3
"""ACC-185: precise *throwaway runner only* repair of stale EasyStore test markers.

Never writes app.js, index.html, Code.gs, config.js or to the EasyStore repo.
Only changes two outdated ASSERTIONS in temporary checked-out test copies;
GitHub upstream source remains pinned and unmodified.
"""
import argparse
import subprocess
from pathlib import Path

EASYSTORE_SHA = "373d06381594e3ab32a55009fcc74907b1c37c9c"
OLD = "assert.match(index, /entry619-d1-readonly-sso2-20261004/);"
NEW = "assert.match(index, /a213-custody-close-canary-20261007-cloud-safety-20261008-closed1/);"
MARKER = "a213-custody-close-canary-20261007-cloud-safety-20261008-closed1"
FILES = (
    "tests/accounting_day_close_v1920.test.js",
    "tests/accounting_automation_v1921.test.js",
)


class AdapterStop(ValueError):
    pass


def require(value, tag):
    if not value:
        raise AdapterStop("ACC185_ADAPTER_STOP_" + tag)


def adapt_test(index, test):
    require(isinstance(index, str) and isinstance(test, str), "INPUT_NOT_TEXT")
    require("ES47 V1922 Unified Safe Build" in index, "INDEX_VERSION_DRIFT")
    require(MARKER in index, "REAL_INDEX_TAG_DRIFT")
    require("entry619-d1-readonly-sso2-20261004" not in index, "OLD_TAG_STILL_LIVE")
    require(test.count(OLD) == 1, "EXPECTED_ONE_EXACT_STALE_ASSERTION")
    require(NEW not in test, "ALREADY_ADAPTED_OR_MIXED_MARKERS")
    result = test.replace(OLD, NEW, 1)
    require(result.count(NEW) == 1, "NEW_ASSERTION_NOT_SINGLE")
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("root", type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    rev = subprocess.check_output(["git", "-C", str(root), "rev-parse", "HEAD"],
                                  text=True).strip()
    require(rev == EASYSTORE_SHA, "UPSTREAM_SHA_MOVED")
    status = subprocess.check_output(["git", "-C", str(root), "status", "--porcelain"],
                                     text=True).strip()
    require(not status, "UPSTREAM_CHECKOUT_DIRTY")
    index = (root / "index.html").read_text(encoding="utf-8")
    updated = {}
    for filename in FILES:
        f = root / filename
        updated[filename] = adapt_test(index, f.read_text(encoding="utf-8"))
    for filename, content in updated.items():
        (root / filename).write_text(content, encoding="utf-8")
    changed = subprocess.check_output(
        ["git", "-C", str(root), "diff", "--name-only"], text=True
    ).strip().splitlines()
    require(sorted(changed) == sorted(FILES), "TOUCHED_NON_TEST_FILE")
    print("ACC185_REAL_V1922_CACHE_MARKER_VERIFIED=PASS")
    print("ACC185_TWO_HISTORIC_ASSERTIONS_EXACTLY_ADAPTED_IN_THROWAWAY_RUNNER=PASS")
    print("ACC185_PINNED_EASYSTORE_SOURCE_APP_WORKER_UNCHANGED=PASS")


if __name__ == "__main__":
    try:
        main()
    except (OSError, subprocess.CalledProcessError, AdapterStop) as exc:
        raise SystemExit(str(exc)) from exc
