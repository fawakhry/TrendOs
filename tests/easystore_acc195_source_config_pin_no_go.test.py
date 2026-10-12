#!/usr/bin/env python3
"""ACC195 negative fixtures: reject source drift and unauthorized release."""
import json
import pathlib
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
PIN_REL = "docs/trendos/staging/ACC195_G5_PINNED_WORKER_CONFIG_SOURCE_BASELINE_NO_GO_20261012.json"
SCRIPT_REL = "scripts/easystore_acc195_source_config_pin_no_go.py"


class Acc195FailClosed(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = pathlib.Path(self.temp.name)
        pin = json.loads((ROOT / PIN_REL).read_text())
        paths = list(pin["source_git_blobs"]) + [PIN_REL, SCRIPT_REL]
        for path in paths:
            dest = self.root / path
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / path, dest)

    def run_guard(self, success):
        p = subprocess.run([sys.executable, str(self.root / SCRIPT_REL)], capture_output=True, text=True)
        self.assertEqual(p.returncode == 0, success, p.stdout + p.stderr)
        self.assertIn("ACC195_", p.stdout + p.stderr)

    def test_unchanged_source_is_no_go(self):
        self.run_guard(True)

    def test_worker_source_drift_denied(self):
        path = self.root / "cloudflare-d1/production-shadow/index.js"
        path.write_bytes(path.read_bytes() + b"\n// drift\n")
        self.run_guard(False)

    def test_worker_entrypoint_drift_denied(self):
        path = self.root / "cloudflare-d1/src/index_v2.js"
        path.write_bytes(path.read_bytes() + b"\n// source drift\n")
        self.run_guard(False)

    def test_auth_config_drift_denied(self):
        path = self.root / "cloudflare-d1/wrangler.toml"
        path.write_text(path.read_text().replace('TRENDOS_EMPLOYEE_AUTH_V1_ENABLED = "false"', 'TRENDOS_EMPLOYEE_AUTH_V1_ENABLED = "true"'))
        self.run_guard(False)

    def test_d1_binding_drift_denied(self):
        path = self.root / "cloudflare-d1/wrangler.toml"
        path.write_text(path.read_text().replace('binding = "DB"', 'binding = "UNSAFE"'))
        self.run_guard(False)

    def test_deploy_workflow_drift_denied(self):
        path = self.root / ".github/workflows/easystore-a2-accounting-readonly-api-deploy.yml"
        path.write_bytes(path.read_bytes() + b"\n# drift\n")
        self.run_guard(False)

    def test_release_approval_forgery_denied(self):
        path = self.root / PIN_REL
        data = json.loads(path.read_text())
        data["production_release_authorized"] = True
        path.write_text(json.dumps(data))
        self.run_guard(False)

    def test_pin_hash_forgery_denied(self):
        path = self.root / PIN_REL
        data = json.loads(path.read_text())
        key = "cloudflare-d1/wrangler.toml"
        data["source_git_blobs"][key] = "0" * 40
        path.write_text(json.dumps(data))
        self.run_guard(False)


if __name__ == "__main__":
    unittest.main()
