#!/usr/bin/env python3
"""ACC194 synthetic-only encrypted SQL bundle + isolated sqlite restore audit.

The only permitted data source is a new temporary SQLite populated using
the real checked-in accounting migrations and synthetic ACC180 fixtures.
OpenSSL AES-256-CBC/PBKDF2 with a separate HMAC-SHA256 verifies test-bundle
confidentiality and integrity; this does NOT define the real backup policy.
All encryption credentials and SQL/disk files are disposable and never emitted.
"""
import argparse
import hashlib
import hmac
import importlib.util
import json
import os
from pathlib import Path
import shutil
import sqlite3
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "acc180", ROOT / "scripts" / "easystore_acc180_finance_backup_isolated_restore.py"
)
acc180 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(acc180)


class EncryptedRestoreBlocked(Exception):
    pass


def require(condition, marker):
    if not condition:
        raise EncryptedRestoreBlocked(marker)


def openssl_crypt(inp, out, pass_file, decrypt=False):
    openssl = shutil.which("openssl")
    require(bool(openssl), "OPENSSL_NOT_AVAILABLE")
    cmd = [
        openssl, "enc", "-aes-256-cbc", "-pbkdf2", "-iter", "200000",
        "-pass", "file:" + str(pass_file), "-in", str(inp), "-out", str(out)
    ]
    if decrypt:
        cmd.insert(2, "-d")
    else:
        cmd.insert(2, "-salt")
    result = subprocess.run(cmd, capture_output=True, timeout=25, check=False)
    if result.returncode:
        raise EncryptedRestoreBlocked("OPENSSL_DECRYPT_OR_ENCRYPT_REJECTED")


def seal_fixture(directory, plain_bytes, password, mac_key):
    root = Path(directory)
    pass_file, source_file = root / "secret.txt", root / "synthetic.sql"
    cipher_file = root / "synthetic-aes-cbc.bundle"
    pass_file.write_bytes(password)
    source_file.write_bytes(plain_bytes)
    os.chmod(pass_file, 0o600)
    openssl_crypt(source_file, cipher_file, pass_file)
    encrypted = cipher_file.read_bytes()
    require(encrypted.startswith(b"Salted__"), "ENCRYPTED_BUNDLE_HEADER_MISSING")
    require(plain_bytes not in encrypted, "PLAINTEXT_BACKUP_EXPOSED")
    return encrypted, {
        "sha256": hashlib.sha256(encrypted).hexdigest(),
        "hmac_sha256": hmac.new(mac_key, encrypted, hashlib.sha256).hexdigest(),
    }


def restore_sealed_fixture(directory, encrypted, manifest, password, mac_key, expected):
    root = Path(directory)
    require(hashlib.sha256(encrypted).hexdigest() == manifest["sha256"],
            "BUNDLE_SHA256_MISMATCH")
    require(hmac.compare_digest(hmac.new(mac_key, encrypted, hashlib.sha256).hexdigest(),
                                manifest["hmac_sha256"]), "BUNDLE_HMAC_MISMATCH")
    pass_file, cipher_file = root / "restore-key.txt", root / "received.bundle"
    plain_file = root / "decrypted.sql"
    pass_file.write_bytes(password)
    os.chmod(pass_file, 0o600)
    cipher_file.write_bytes(encrypted)
    openssl_crypt(cipher_file, plain_file, pass_file, decrypt=True)
    output = root / "independent-restored.db"
    try:
        return acc180.restore_sql_dump(
            plain_file.read_bytes(),
            hashlib.sha256(plain_file.read_bytes()).hexdigest(),
            expected, output,
        )
    except acc180.RestoreBlocked as e:
        raise EncryptedRestoreBlocked("RESTORED_SOURCE_OR_FINANCE_GUARD_MISMATCH:" + str(e)) from e


def run_safe_audit():
    with tempfile.TemporaryDirectory(prefix="acc194-synthetic-only-") as name:
        root = Path(name)
        conn = sqlite3.connect(root / "synthetic-original.db")
        conn.execute("PRAGMA foreign_keys=ON")
        try:
            acc180.apply_actual_finance_migrations(conn)
            acc180.seed_synthetic_finance(conn)
            original = acc180.snapshot(conn)
            require(original["accounting_mode"] == "READONLY" and original["canary_denied"],
                    "ORIGINAL_FIXTURE_NOT_SAFE")
            dump = acc180.export_dump(conn)
            password, mac_key = os.urandom(48).hex().encode(), os.urandom(32)
            encrypted, manifest = seal_fixture(root, dump, password, mac_key)
            restored = restore_sealed_fixture(root, encrypted, manifest, password, mac_key, original)
            require(restored == original, "SOURCE_VS_INDEPENDENT_RESTORE_MISMATCH")

            # SQLite's own backup mechanism is an independent second restore.
            independent = sqlite3.connect(root / "independent-native-copy.db")
            try:
                conn.backup(independent)
                require(acc180.snapshot(independent) == original,
                        "NATIVE_BACKUP_OR_LEDGER_CHANGED")
            finally:
                independent.close()

            failed = []

            def must_deny(marker, data, proof=manifest, secret=password, mac=mac_key, baseline=original):
                with tempfile.TemporaryDirectory(prefix="acc194-adversarial-") as folder:
                    try:
                        restore_sealed_fixture(folder, data, proof, secret, mac, baseline)
                    except EncryptedRestoreBlocked as e:
                        require(marker in str(e), "INCORRECT_FAIL_CLOSED_REASON:" + str(e))
                        failed.append(marker)
                    else:
                        raise EncryptedRestoreBlocked("TAMPERED_BACKUP_ACCEPTED:" + marker)

            must_deny("BUNDLE_SHA256_MISMATCH", encrypted + b"0")
            changed = bytearray(encrypted)
            changed[-8] ^= 0x45
            changed = bytes(changed)
            remade_digest = dict(manifest)
            remade_digest["sha256"] = hashlib.sha256(changed).hexdigest()
            must_deny("BUNDLE_HMAC_MISMATCH", changed, remade_digest)
            must_deny("BUNDLE_HMAC_MISMATCH", encrypted, mac=os.urandom(32))
            must_deny("BUNDLE_HMAC_MISMATCH", encrypted,
                      proof={**manifest, "hmac_sha256": "0" * 64})
            must_deny("OPENSSL_DECRYPT_OR_ENCRYPT_REJECTED", encrypted, secret=os.urandom(48).hex().encode())
            false_snapshot = json.loads(json.dumps(original))
            false_snapshot["tables"]["employee_accounting_materials_v1"]["count"] = 0
            must_deny("RESTORED_SOURCE_OR_FINANCE_GUARD_MISMATCH", encrypted, baseline=false_snapshot)

            # Attacker with complete new cipher and MAC still cannot fabricate
            # matching separately retained source snapshot / safe READONLY state.
            marker = b"'ENTRY614_ACCOUNTING_V1','READONLY'"
            require(marker in dump, "EXPECTED_READONLY_DUMP_MARKER_MISSING")
            modified = dump.replace(marker, b"'ENTRY614_ACCOUNTING_V1','GENERAL'", 1)
            with tempfile.TemporaryDirectory(prefix="acc194-malicious-") as folder:
                recipher, reproved = seal_fixture(folder, modified, password, mac_key)
                must_deny("ACCOUNTING_MODE_NOT_READONLY", recipher, proof=reproved)

            report = {
                "schema": "ACC194_SYNTHETIC_ENCRYPTED_FINANCE_BACKUP_RESTORE_V1",
                "source": "LOCALLY_CREATED_SQLITE_FAKE_FINANCIAL_ROWS_ONLY",
                "original_migrations": len(acc180.MIGRATIONS),
                "original_schema_sha256": original["schema_sha256"],
                "table_count": len(original["tables"]),
                "encrypted_bundle_sha256": manifest["sha256"],
                "encrypted_bundle_bytes": len(encrypted),
                "synthetic_encryption": "OpenSSL AES-256-CBC PBKDF2 + independent HMAC-SHA256",
                "encrypted_bundle_restored_schema_and_all_rows_equal": True,
                "sqlite_native_backup_schema_and_all_rows_equal": True,
                "sqlite_integrity_and_foreign_key_check": "PASS",
                "tampered_or_wrong_key_restore_denials": len(failed),
                "temporary_artifacts_destroyed_after_test": True,
                "real_cloudflare_d1_export_or_backup": False,
                "real_production_database_ever_accessed": False,
                "real_backup_encryption_or_retention_policy_approved": False,
                "real_production_backup_restore_or_worker_rollback": False,
                "finance_release_decision": "NO_GO",
                "owner_G5": "OPEN",
                "production_mutations": 0,
            }
            return report
        finally:
            conn.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    report = run_safe_audit()
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("ACC194_ACTUAL_FINANCE_MIGRATION_SQLITE_FAKE_ONLY=PASS")
    print("ACC194_SYNTHETIC_ENCRYPTION_AND_INDEPENDENT_RESTORE=PASS")
    print("ACC194_SCHEMA_LEDGER_AND_NATIVE_COPY_EQUAL=PASS")
    print("ACC194_ADVERSARIAL_FAIL_CLOSED_VARIANTS=" + str(report["tampered_or_wrong_key_restore_denials"]))
    print("ACC194_NO_PRODUCTION_D1_WORKER_OR_EMPLOYEE_ACCESS=YES")
    print("ACC194_PRODUCTION_BACKUP_RESTORE_AND_G5=NOT_PERFORMED")
    print("ACC194_RELEASE_DECISION=NO_GO")


if __name__ == "__main__":
    main()
