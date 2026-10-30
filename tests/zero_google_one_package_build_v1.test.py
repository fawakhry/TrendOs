"""Reproducible single Zero Google source ZIP, never a production deploy."""
import hashlib
import importlib.util
import json
import pathlib
import tempfile
import unittest
import zipfile

ROOT=pathlib.Path(__file__).resolve().parents[1]
BUILDER=ROOT/"tools/build_zero_google_one_package_v1.py"
spec=importlib.util.spec_from_file_location("zero_google_bundle_builder",BUILDER)
builder=importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class OnePackageOfflineBundle(unittest.TestCase):
    def test_only_allowlisted_regular_files_and_no_secrets(self):
        files=list(builder.allowlisted_files())
        self.assertGreater(len(files),50)
        self.assertEqual(len(files),len({f for f,_ in files}))
        for name,path in files:
            self.assertFalse(path.is_symlink())
            self.assertFalse(name.startswith("/"))
            self.assertFalse(name.startswith("."))
            self.assertNotIn("..",name)
            self.assertNotIn(".env",name)
            self.assertNotIn("credentials",name.lower())
            self.assertTrue(path.is_relative_to(ROOT))
        report=builder.checked_source_audit()
        self.assertTrue(report["sourceChecksPassed"])
        self.assertFalse(report["productionDeploymentApproved"])
        self.assertFalse(report["printReleaseAllowed"])

    def test_build_twice_byte_identical_and_internal_sha_index_complete(self):
        with tempfile.TemporaryDirectory(prefix="zg-source-package-disposable-") as tmp:
            first=pathlib.Path(tmp)/"bundle-one.zip"
            second=pathlib.Path(tmp)/"bundle-two.zip"
            builder.build(first)
            builder.build(second)
            a=first.read_bytes()
            self.assertEqual(hashlib.sha256(a).digest(),hashlib.sha256(second.read_bytes()).digest())
            with zipfile.ZipFile(first) as z:
                files=json.loads((ROOT/builder.MANIFEST_PATH).read_text())
                expected=set(files["sourceFiles"]+files["packageFiles"])
                actual=set(z.namelist())
                self.assertEqual(actual,expected|{"ZERO_GOOGLE_PACKAGE_INDEX.json"})
                index=json.loads(z.read("ZERO_GOOGLE_PACKAGE_INDEX.json"))
                self.assertEqual(set(index["files"]),expected)
                self.assertEqual(index["productionCustomerGoogleActionsRetiredLastProven"],0)
                self.assertEqual(index["contentType"],"SOURCE_ONLY_NO_DEPLOY_NO_LIVE_CUTOVER")
                self.assertFalse(index["financeWriteAuthorized"])
                self.assertFalse(index["writerCutoverAuthorized"])
                self.assertFalse(index["printReleaseAuthorized"])
                for file in expected:
                    raw=z.read(file)
                    self.assertEqual(index["files"][file]["sha256"],hashlib.sha256(raw).hexdigest())
                    self.assertEqual(index["files"][file]["bytes"],len(raw))


if __name__=="__main__":
    unittest.main()
