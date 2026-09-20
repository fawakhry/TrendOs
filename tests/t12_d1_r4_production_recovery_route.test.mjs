import assert from 'node:assert/strict';
import { handleR4ProductionRecoveryRequest, R4_PRODUCTION_RECOVERY_PATH } from
  '../cloudflare-d1/src/r4-guarded-recovery-production.mjs';

const secret='r4-test-secret-abcdefghijklmnopqrstuvwxyz';
const request=(body={},headers={})=>new Request('https://example.test'+R4_PRODUCTION_RECOVERY_PATH,{
  method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(body)});
const env=(extra={})=>({TRENDOS_R4_RECOVERY_ENABLED:'true',
  TRENDOS_R4_RECOVERY_TARGET:'trendos-main/5c4b92bf-e043-4f6e-bd6d-d514a92cd825',
  MIGRATION_SECRET:secret,DB:{batch:async()=>[]},...extra});
const status=async(expected,req,e)=>{
  const res=await handleR4ProductionRecoveryRequest(req,e);
  assert.equal(res.status,expected); return res.json();
};
assert.equal((await status(423,request(),env({TRENDOS_R4_RECOVERY_ENABLED:'false'}))).automaticRetryAllowed,false);
assert.equal((await status(423,request(),env({TRENDOS_R4_RECOVERY_TARGET:'wrong'}))).triggerRestartAuthorized,false);
assert.equal((await status(401,request(),env())).reason,'unauthorized');
assert.equal((await status(400,request({}, {'x-migration-secret':secret}),env())).reason,'invalid-recovery-contract');
assert.equal((await status(409,request({operation:'r4-orders-recovery-apply',proposal:{}},
  {'x-migration-secret':secret}),env())).reason,'preflight-rejected');
console.log('R4 production recovery route PASS: exact target, default gate, auth and fail-closed proposal checks.');
