import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {verifyApprovedProtectedReleaseV1} from '../core/owner-console-protected-release-gate-v1.mjs';

const enabled = {
  AP_OWNER_CONSOLE_ACCESS_VERIFY_MODE:'PROTECTED',
  AP_OWNER_CONSOLE_RELEASE_APPROVED:'YES',
  CF_ACCESS_CLIENT_ID:'synthetic-ci-client',
  CF_ACCESS_CLIENT_SECRET:'synthetic-ci-secret'
};
const approve={success:true,status:'PROTECTED_READ_VERIFIED',checked:9};
let calls=0;
let last=null;
const verifier=async options=>{calls++;last=options;return approve;};
for(const [env,expected] of [
  [{},'PROTECTED_VERIFY_DISABLED'],
  [{...enabled,AP_OWNER_CONSOLE_ACCESS_VERIFY_MODE:'PUBLIC'},'PROTECTED_VERIFY_DISABLED'],
  [{...enabled,AP_OWNER_CONSOLE_RELEASE_APPROVED:'NO'},'OWNER_APPROVAL_NOT_CONFIRMED'],
  [{...enabled,CF_ACCESS_CLIENT_SECRET:''},'SERVICE_AUTH_NOT_CONFIGURED'],
  [{...enabled,CF_ACCESS_CLIENT_SECRET:'bad\r\nheader'},'SERVICE_AUTH_NOT_CONFIGURED'],
  [{...enabled,CF_ACCESS_CLIENT_ID:' abc'},'SERVICE_AUTH_NOT_CONFIGURED']
]){
  const result=await verifyApprovedProtectedReleaseV1({env,verifier});
  assert.equal(result.code,expected);
  assert.equal(result.status,'BLOCKED_SAFE');
}
assert.equal(calls,0,'No network-capable verifier before prerequisites');
const success=await verifyApprovedProtectedReleaseV1({env:enabled,verifier});
assert.equal(success.success,true);
assert.equal(success.checked,9);
assert.equal(calls,1);
assert.deepEqual(last,{clientId:enabled.CF_ACCESS_CLIENT_ID,clientSecret:enabled.CF_ACCESS_CLIENT_SECRET});
assert.doesNotMatch(JSON.stringify(success),/synthetic-ci-client|synthetic-ci-secret/);
for(const bad of [
  {success:true,status:'PROTECTED_READ_VERIFIED',checked:8},
  {success:true,status:'UNPROTECTED_READ',checked:9},
  {success:false,status:'BLOCKED_SAFE',code:'SHOULD_NOT_LOG_A_PRIVATE_VALUE',checked:4},
  null
]){
  const result=await verifyApprovedProtectedReleaseV1({env:enabled,verifier:async()=>bad});
  assert.equal(result.code,'PROTECTED_VERIFICATION_FAILED');
  assert.doesNotMatch(JSON.stringify(result),/SHOULD_NOT_LOG_A_PRIVATE_VALUE|synthetic-ci-secret/);
}
const error=await verifyApprovedProtectedReleaseV1({env:enabled,verifier:async()=>{throw Error('private response body/secret');}});
assert.equal(error.code,'VERIFIER_ERROR');
assert.doesNotMatch(JSON.stringify(error),/private|secret/);
const cli=resolve(dirname(fileURLToPath(import.meta.url)),'../scripts/owner-console-protected-release-check-v1.mjs');
const run=spawnSync(process.execPath,[cli],{env:{PATH:process.env.PATH},encoding:'utf8',timeout:5000});
assert.equal(run.status,1);
assert.match(run.stdout,/PROTECTED_VERIFY_DISABLED/);
assert.doesNotMatch(run.stdout+run.stderr,/synthetic-ci-client|synthetic-ci-secret/);
console.log('AP093_PROTECTED_RELEASE_DEFAULT_OFF_NO_NETWORK=PASS');
console.log('AP093_PROTECTED_RELEASE_FAIL_CLOSED_PRIVATE_OUTPUT=PASS');
console.log('AP093_PRODUCTION_HTTP_REQUESTS=0; REAL_CREDENTIALS=0');
