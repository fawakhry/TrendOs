#!/usr/bin/env python3
"""ACC195 offline, fail-closed source/config pin verification. No network or deploy."""
import hashlib
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
PIN = ROOT / "docs/trendos/staging/ACC195_G5_PINNED_WORKER_CONFIG_SOURCE_BASELINE_NO_GO_20261012.json"


def verify(root=ROOT, pin=PIN):
    data = json.loads(pin.read_text(encoding="utf-8"))
    assert data["release_decision"] == "NO_GO"
    assert data["production_release_authorized"] is False
    assert data["old_deploy_workflow_approved"] is False
    assert data["production_mutations"] == 0
    assert data["real_d1_backup_restored"] is False
    assert data["employee_grants_approved"] is False
    assert data["cutover_date_local"] is None
    assert re.fullmatch(r"[0-9a-f]{40}", data["baseline_source_commit"])
    assert re.fullmatch(r"\d+\.\d+\.\d+", data["wrangler_cli_version"])
    assert len(data["source_git_blobs"]) >= 5
    for name, expected in data["source_git_blobs"].items():
        assert not pathlib.PurePosixPath(name).is_absolute()
        assert ".." not in pathlib.PurePosixPath(name).parts
        assert re.fullmatch(r"[0-9a-f]{40}", expected)
        body = (root / name).read_bytes()
        actual = hashlib.sha1(b"blob " + str(len(body)).encode() + b"\0" + body).hexdigest()
        assert actual == expected, f"source drift: {name}"
    wrangler = (root / "cloudflare-d1/wrangler.toml").read_text()
    assert re.search(r'^main\s*=\s*"production-shadow/index.js"\s*$', wrangler, re.M)
    assert re.search(r'^binding\s*=\s*"DB"\s*$', wrangler, re.M)
    assert re.search(r'^database_name\s*=\s*"trendos-main"\s*$', wrangler, re.M)
    assert re.search(r'^TRENDOS_EMPLOYEE_AUTH_V1_ENABLED\s*=\s*"false"\s*$', wrangler, re.M)
    workflow = (root / ".github/workflows/easystore-a2-accounting-readonly-api-deploy.yml").read_text()
    assert "workflow_dispatch:" in workflow
    assert "git merge --no-edit FETCH_HEAD" in workflow, "historical floating merge assumption changed"
    assert f"WRANGLER_VERSION: {data['wrangler_cli_version']}" in workflow
    print("ACC195_OFFLINE_SOURCE_CONFIG_AUTH_D1_PIN=PASS")
    print("ACC195_OLD_FLOATING_DEPLOY_WORKFLOW=BLOCKED_NOT_INVOKED")
    print("ACC195_RELEASE_DECISION=NO_GO")


if __name__ == "__main__":
    try:
        verify()
    except (AssertionError, OSError, ValueError, KeyError) as exc:
        print(f"ACC195_OFFLINE_SOURCE_CONFIG_AUTH_D1_PIN=FAIL: {exc}", file=sys.stderr)
        sys.exit(1)
