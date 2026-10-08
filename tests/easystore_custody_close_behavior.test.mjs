import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');
const start=source.indexOf('async function closePurchaseCustodyV1(');
const end=source.indexOf('\n\nasync function reverseApprovedPurchaseV1',start);
const auditStart=source.indexOf('function auditEventStatementV1(');
const auditEnd=source.indexOf('\nasync function auditEventV1',auditStart);
assert.ok(start>=0 && end>start && auditStart>=0 && auditEnd>auditStart);
for(const balance of [0,5,-5,0.000001]) {
  let prepared=0;const batches=[];
  const db={prepare(sql){return {sql,bind(...args){this.args=args;return this;},first:async()=>null};},async batch(statements){batches.push(statements);}};
  const context={text:v=>String(v??'').trim(),key:v=>String(v??'').toLowerCase(),num:v=>Number(v)||0,
    accountingDepartmentV1:v=>v,workDateKeyV1:v=>v,control:async()=>({mode:'CANARY'}),
    commandErrorV1:(code,message)=>Object.assign(new Error(message),{code}),
    custodySummariesV1:async()=>[{employee:'A2-CANARY-CUSTODY-TEST',department:'عام',balance}],
    beginCommandV1:async()=>{prepared++;return {requestKey:'A213-CCLOSE-TEST',replay:false};},
    uid:p=>p+'-TEST',sourceSystemV1:()=> 'EasyStore'};
  vm.createContext(context);
  vm.runInContext(source.slice(auditStart,auditEnd)+'\n'+source.slice(start,end)+'\nglobalThis.closeTest=closePurchaseCustodyV1;',context);
  const call=()=>context.closeTest({DB:db},{mode:'full',user:{username:'ضياء'}},
    {employee:'A2-CANARY-CUSTODY-TEST',department:'عام',workDate:'2099-12-31',requestId:'A213-CCLOSE-TEST'});
  if(balance!==0) {
    await assert.rejects(call,e=>e.code==='employee-accounting-canary-custody-balance-blocked');
    assert.equal(prepared,0,'nonzero balance must not prepare a request');
    assert.equal(batches.length,0,'nonzero balance must not write anything');
  } else {
    const result=await call();
    assert.equal(result.settlementType,'NONE');assert.equal(result.settlementAmount,0);
    assert.equal(result.balanceBefore,0);assert.equal(result.balanceAfter,0);
    assert.equal(prepared,1);assert.equal(batches.length,1);
    const sql=batches[0].map(s=>s.sql).join('\n');
    assert.equal(batches[0].length,3,'close, event and committed response belong in one D1 batch');
    assert.match(sql,/INSERT INTO employee_accounting_custody_closes_v1/);
    assert.match(sql,/INSERT INTO employee_accounting_events_v1/);
    assert.match(sql,/UPDATE employee_accounting_request_ledger_v1 SET status='COMMITTED'/);
    assert.doesNotMatch(sql,/INSERT INTO employee_accounting_(custody_events|cashbox|stock_moves|party_ledger)_v1/);
  }
}
console.log('CUSTODY_CLOSE_BEHAVIOR=PASS: nonzero balances rejected before request preparation; zero close, event and commit share one batch');
