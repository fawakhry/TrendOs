// ACC212 / G5: ONLY a throwaway synthetic Ubuntu-compatible restore rehearsal.
// Never accepts a path to production, a D1 database, business credentials,
// actual receipts, persistent encryption key or real customer records.
import {DatabaseSync} from 'node:sqlite';
import {createCipheriv,createDecipheriv,randomBytes,createHash} from 'node:crypto';
import {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync,existsSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const sha=b=>createHash('sha256').update(b).digest('hex');
const ENC='aes-256-gcm';
const rootPath=()=>mkdtempSync(path.join(os.tmpdir(),'acc212-FAKE-only-'));

export function verifyFakeEncryptedRestore(){
 const root=rootPath();
 try{
   const source=path.join(root,'FAKE_SOURCE.sqlite');
   const separate=path.join(root,'separate-ENCRYPTED-copy');
   const isolated=path.join(root,'isolated-RESTORE-target');
   mkdirSync(separate);mkdirSync(isolated);
   // The source has ONLY generated fake account data, never a user file.
   const db=new DatabaseSync(source);
   try{
     db.exec("CREATE TABLE fake_cash_entries (id TEXT PRIMARY KEY,customer TEXT,amount_cents INTEGER NOT NULL CHECK(amount_cents>=0))");
     db.prepare("INSERT INTO fake_cash_entries(id,customer,amount_cents) VALUES(?,?,?)").run(
       'ACC212-FAKE-RECEIPT-1','TEST_CUSTOMER_NOT_REAL',1000);
     db.prepare("INSERT INTO fake_cash_entries(id,customer,amount_cents) VALUES(?,?,?)").run(
       'ACC212-FAKE-RECEIPT-2','TEST_CUSTOMER_NOT_REAL',2500);
   }finally{db.close()}
   const plain=readFileSync(source),fingerprint=sha(plain);
   assert.ok(plain.byteLength>100);
   const key=randomBytes(32),iv=randomBytes(12);
   const cipher=createCipheriv(ENC,key,iv);
   const encrypted=Buffer.concat([cipher.update(plain),cipher.final()]);
   const tag=cipher.getAuthTag();
   const record=Buffer.concat([iv,tag,encrypted]);
   const encryptedPath=path.join(separate,'fake-source.aesgcm');
   writeFileSync(encryptedPath,record,{mode:0o600});
   assert.ok(existsSync(encryptedPath));
   assert.ok(!readFileSync(encryptedPath).includes('TEST_CUSTOMER_NOT_REAL'));
   const unwrap=(bytes,k)=>{
     if(bytes.length<29)throw Error('TRUNCATED_BACKUP');
     const d=createDecipheriv(ENC,k,bytes.subarray(0,12));
     d.setAuthTag(bytes.subarray(12,28));
     return Buffer.concat([d.update(bytes.subarray(28)),d.final()]);
   };
   const actual=readFileSync(encryptedPath);
   const recovered=unwrap(actual,key);
   assert.equal(sha(recovered),fingerprint);
   const restoredFile=path.join(isolated,'RESTORED_FAKE_ONLY.sqlite');
   writeFileSync(restoredFile,recovered,{mode:0o600});
   const restored=new DatabaseSync(restoredFile,{readOnly:true});
   try{
     const a=restored.prepare('SELECT SUM(amount_cents) AS cents,COUNT(*) AS n FROM fake_cash_entries').get();
     assert.equal(a.cents,3500);assert.equal(a.n,2);
   }finally{restored.close()}
   let wrongKeyDenied=false,tamperDenied=false;
   try{unwrap(actual,randomBytes(32))}catch{wrongKeyDenied=true}
   const tampered=Buffer.from(actual);
   tampered[tampered.length-1]^=0x01;
   try{unwrap(tampered,key)}catch{tamperDenied=true}
   assert.ok(wrongKeyDenied&&tamperDenied);
   return Object.freeze({
     source:'GENERATED_FAKE_SQLITE_ONLY',
     encryption:'AES_256_GCM_AUTHENTICATED',
     secondaryPathIsOnlySimulated:true,
     ubuntuIndependentMachineRestoreVerified:false,
     recordCount:2,restoredSyntheticTotalCents:3500,
     restoredFileMatchesSha256:true,
     wrongKeyDenied,tamperDenied,
     encryptionKeyWrittenToDisk:false,
     actualBusinessBackupVerified:false,
     productionDeploymentApproved:false,
     financeRelease:'NO_GO'
   });
 }finally{
   rmSync(root,{recursive:true,force:true});
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const res=verifyFakeEncryptedRestore();
 console.log('ACC212_FAKE_BACKUP_ENCRYPTION_AND_ISOLATED_PATH_RESTORE=PASS');
 console.log('ACC212_WRONG_KEY_AND_TAMPER_DETECTED=PASS');
 console.log('ACC212_REAL_UBUNTU_INDEPENDENT_RESTORE=NOT_DONE');
 console.log('ACC212_REAL_PRODUCTION_DATA_ACCESS=NONE');
 console.log('ACC212_FINANCE_RELEASE='+res.financeRelease);
}
