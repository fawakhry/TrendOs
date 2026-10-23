// BOOK29: non-mutating Native departmental-material field classification tests.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeDeptLineFieldsV29,handleEmployeeAccountingNativeRequest } from '../cloudflare-d1/src/employee-accounting-native-v1.mjs';

const source=fs.readFileSync(new URL('../cloudflare-d1/src/employee-accounting-native-v1.mjs',import.meta.url),'utf8');
const config=fs.readFileSync(new URL('../config.js',import.meta.url),'utf8');

test('BOOK29 materialQty alias retains physical consumption quantity (no missing material)',()=>{
  assert.equal(normalizeDeptLineFieldsV29({materialQty:'3.2500',laborCost:'0'}).materialConsumption,3.25);
  assert.equal(normalizeDeptLineFieldsV29({materialConsumption:'2.25'}).materialConsumption,2.25);
  assert.equal(normalizeDeptLineFieldsV29({consumption:'0.75'}).materialConsumption,0.75);
  assert.equal(normalizeDeptLineFieldsV29({materialQty:'3.25',materialConsumption:'3.250'}).materialConsumption,3.25);
  assert.equal(normalizeDeptLineFieldsV29({}).materialConsumption,0);
});
test('BOOK29 conflicting material units/quantities fail closed, never discard quantity',()=>{
  for(const b of [
    {materialQty:'2',materialConsumption:'3'},
    {materialQty:'5',consumption:'4'},
    {materialQty:'-1'},
    {materialQty:'not-a-number'},
    {materialConsumption:'Infinity'},
    {materialQty:'3,5'},
    {operatingCost:'not-number'},
  ]){
    assert.throws(()=>normalizeDeptLineFieldsV29(b),err=>
      !!err&&['accounting-material-quantity-conflict','accounting-field-invalid'].includes(err.code),
      JSON.stringify(b));
  }
});
test('BOOK29 laborCost is NOT silently mapped to operatingCost (or payroll/rent)',()=>{
  for(const b of [
    {materialQty:'2',laborCost:'70'},
    {materialConsumption:'2',laborCost:'30',operatingCost:'0'},
    {materialQty:'2',laborCost:'20',operatingCost:'50'},
  ]){
    assert.throws(()=>normalizeDeptLineFieldsV29(b),err=>err&&err.code==='accounting-labor-classification-required');
  }
  const neutral=normalizeDeptLineFieldsV29({materialQty:'1.2',laborCost:'0',operatingCost:'15'});
  assert.equal(neutral.materialConsumption,1.2);
  assert.equal(neutral.operatingCost,15);
});
test('BOOK29 normalization runs BEFORE any Native dept line D1 mutation',()=>{
  const a=source.indexOf('async function saveDeptLine(env,auth,b){');
  const b=source.indexOf('async function draft(env,auth,b){',a);
  assert.ok(a>=0&&b>a);
  const code=source.slice(a,b);
  const valid=code.indexOf('normalizeDeptLineFieldsV29(b)');
  const writes=code.indexOf('env.DB.prepare(');
  assert.ok(valid>0&&writes>valid);
  assert.match(code,/const materialConsumption=normalizedFields\.materialConsumption/);
  assert.match(code,/const operating=normalizedFields\.operatingCost/);
});
test('BOOK29 READONLY mode still blocks financial mutation before any business SQL',async()=>{
  let sql=0,writes=0;
  const env={DB:{
    prepare(q){
      if(q.includes('FROM employee_accounting_control_v1'))return {async first(){return {mode:'READONLY',nextInvoiceNumber:1,policyEpoch:0};}};
      sql++;throw Error('READONLY_MUST_NOT_TOUCH_ACCOUNTING_TABLES');
    },
    async batch(){writes++;throw Error('NO_FAKE_WRITES');}
  }};
  const res=await handleEmployeeAccountingNativeRequest(new Request('https://example.invalid/v1/employee/accounting',{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
      action:'saveAccountingDeptLine',username:'synthetic',orderId:'FAKE-ORDER-01',
      itemName:'FAKE ITEM',materialQty:'2',laborCost:'100'
    })
  }),env);
  assert.equal(res.status,503);
  assert.equal((await res.json()).code,'employee-accounting-readonly');
  assert.equal(sql,0);
  assert.equal(writes,0);
  assert.match(config,/MATBAGY_EMPLOYEE_ACCOUNTING_CUTOVER_MODE = 'READONLY'/);
});
test('BOOK29 owner approval remains a separate unresolved policy/role finding',()=>{
  // Observed source still relies on username aliases to derive role. Do not
  // claim the Owner approval matrix is complete or change roles implicitly.
  assert.match(source,/function accountingMode\(user\)/);
  assert.match(source,/role==='admin'/);
});
