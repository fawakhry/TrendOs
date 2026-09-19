import assert from 'node:assert/strict';
import fs from 'node:fs';
import { handleR4RecoveryPreviewRequest, R4_RECOVERY_PREVIEW_PATH } from
  '../cloudflare-d1/t12-preview/t12-d1-guarded-recovery-preview-handler-v1.mjs';

const handlerSource=fs.readFileSync(new URL(
  '../cloudflare-d1/t12-preview/t12-d1-guarded-recovery-preview-handler-v1.mjs',
  import.meta.url),'utf8');
for(const livePath of ['../cloudflare-d1/src/index_v2.js',
  '../cloudflare-d1/production-shadow/index.js']){
  const live=fs.readFileSync(new URL(livePath,import.meta.url),'utf8');
  assert.equal(live.includes('t12-d1-guarded-recovery-preview-handler-v1'),false);
}
assert.equal(handlerSource.includes('R4_TEST_DATABASE_ONLY'),true);
assert.equal(handlerSource.includes('R4_PREVIEW_ENABLED'),true);
assert.equal(handlerSource.includes('commit-unknown-reconcile-with-get'),true);
assert.equal(R4_RECOVERY_PREVIEW_PATH,'/v1/t12-preview/d1-recovery/apply');

const names=['الأوردرات','بنود الأوردرات'];
const row=(n,v)=>({rowNumber:n,values:[v],display:[v],formulas:['']});
const snapshot=()=>({
  sourceTabs:names.map((sheetName,i)=>({
    sheetName,sheetId:i+11,headers:['h'],sourceLastRow:3,sourceLastCol:1,
    rows:[row(1,'h'),row(2,'synthetic-new'),row(3,'synthetic-tail')]
  })),
  mirrorTabs:names.map((sheetName,i)=>({
    sheetName,catalog:{sheetName,sheetId:i+11,headers:['h'],
      sourceLastRow:2,sourceLastCol:1,rowCount:2,status:'ready',
      note:'TrendOS orders live sync V2 quota-aware'},
    rows:[row(1,'h'),row(2,'synthetic-old')]
  })),
  sourceStable:true,mirrorStable:true,workbookVerified:true
});
const secret='r4-synthetic-preview-secret-32chars';
let batches=0;
const db={prepare(sql){return{bind(...args){return{sql,args}}}},
  async batch(statements){batches++;assert.equal(statements.length,8);return[{success:true}]}};
const env=(extra={})=>({
  R4_PREVIEW_ENABLED:'true',R4_TEST_DATABASE_ONLY:'true',
  R4_PREVIEW_SECRET:secret,DB:db,...extra
});
function req({method='POST', auth=true, body={operation:'preview-test-apply',snapshot:snapshot()},headers={}}={}){
  return new Request('https://example.invalid'+R4_RECOVERY_PREVIEW_PATH,{
    method,headers:{...(auth?{'x-r4-preview-secret':secret}:{}),
      ...headers,'content-type':'application/json'},
    ...(method==='POST'?{body:typeof body==='string'?body:JSON.stringify(body)}:{})
  });
}
async function expect(status, request, environment) {
  const before=batches;
  const response=await handleR4RecoveryPreviewRequest(request,environment);
  assert.equal(response.status,status);
  const data=await response.json();
  assert.equal(data.productionWriteAuthorized,false);
  assert.equal(data.triggerRestartAuthorized,false);
  assert.equal(JSON.stringify(data).includes('synthetic-new'),false);
  return {data,writes:batches-before};
}
assert.equal((await expect(423,req(),env({R4_PREVIEW_ENABLED:'false'}))).writes,0);
assert.equal((await expect(423,req(),env({R4_TEST_DATABASE_ONLY:'false'}))).writes,0);
assert.equal((await expect(405,req({method:'GET'}),env())).writes,0);
assert.equal((await expect(401,req({auth:false}),env())).writes,0);
assert.equal((await expect(413,req({headers:{'content-length':'300000'}}),env())).writes,0);
assert.equal((await expect(400,req({body:'{bad'}),env())).writes,0);
assert.equal((await expect(400,req({body:{operation:'wrong',snapshot:snapshot()}}),env())).writes,0);
const drift=snapshot();drift.sourceStable=false;
assert.equal((await expect(409,req({body:{operation:'preview-test-apply',snapshot:drift}}),env())).writes,0);
const allowed=await expect(200,req(),env());
assert.equal(allowed.writes,1);
assert.equal(allowed.data.summary.totalCandidateUpserts,4);
const ambiguousDb={...db,async batch(){batches++;throw new Error('test-after-commit-lost-response')}};
const ambiguous=await expect(503,req(),env({DB:ambiguousDb}));
assert.equal(ambiguous.writes,1);
assert.equal(ambiguous.data.reason,'commit-unknown-reconcile-with-get');
console.log('R4 unrouted preview handler PASS: default-off, auth, bounded body, fail-closed, synthetic test DB only, ambiguous response.');
