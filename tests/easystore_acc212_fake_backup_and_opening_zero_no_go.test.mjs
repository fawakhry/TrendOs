import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
import {verifyFakeEncryptedRestore} from '../scripts/acc212_fake_encrypted_backup_restore.mjs';

await test('01 synthetic SQLite encrypted separate-path backup/restore roundtrip',()=>{
 const e=verifyFakeEncryptedRestore();
 assert.equal(e.source,'GENERATED_FAKE_SQLITE_ONLY');
 assert.equal(e.encryption,'AES_256_GCM_AUTHENTICATED');
 assert.equal(e.recordCount,2);
 assert.equal(e.restoredSyntheticTotalCents,3500);
 assert.equal(e.restoredFileMatchesSha256,true);
});
await test('02 encrypted snapshot refuses wrong key and tampered bytes',()=>{
 const e=verifyFakeEncryptedRestore();
 assert.equal(e.wrongKeyDenied,true);
 assert.equal(e.tamperDenied,true);
 assert.equal(e.encryptionKeyWrittenToDisk,false);
});
await test('03 local directory separation is not proof of an actual remote backup',()=>{
 const e=verifyFakeEncryptedRestore();
 assert.equal(e.secondaryPathIsOnlySimulated,true);
 assert.equal(e.ubuntuIndependentMachineRestoreVerified,false);
 assert.equal(e.actualBusinessBackupVerified,false);
 assert.equal(e.productionDeploymentApproved,false);
 assert.equal(e.financeRelease,'NO_GO');
});
await test('04 no programmatic ability to pass production/customer paths to fake fixture',()=>{
 assert.equal(verifyFakeEncryptedRestore.length,0);
 const script=fs.readFileSync('scripts/acc212_fake_encrypted_backup_restore.mjs','utf8');
 assert.ok(!script.includes('process.argv[2]'));
 assert.ok(script.includes("mkdtempSync(path.join(os.tmpdir(),'acc212-FAKE-only-'))"));
 assert.ok(script.includes('rmSync(root,{recursive:true,force:true})'));
});
await test('05 actual native Worker requires 2-pinned-key signed zero before finance writes',()=>{
 const worker=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');
 assert.match(worker,/async function acc212VerifyOpeningZeroEvidenceV1\(/);
 assert.match(worker,/ACCOUNTING_FINANCE_OPENING_PREPARER_PUBLIC_JWK_V1/);
 assert.match(worker,/ACCOUNTING_FINANCE_OPENING_REVIEWER_PUBLIC_JWK_V1/);
 assert.match(worker,/ACCOUNTING_FINANCE_OPENING_ZERO_ATTESTATION_V1/);
 assert.match(worker,/crypto\.subtle\.verify\('Ed25519'/);
 assert.match(worker,/if\(!openingProof\.ok\)return json/);
});
console.log('ACC212_BACKUP_TEST=TEMPORARY_FAKE_ONLY');
console.log('ACC212_REAL_OPENING_PROOF=NOT_AVAILABLE');
console.log('ACC212_FINANCE_RELEASE=NO_GO');
