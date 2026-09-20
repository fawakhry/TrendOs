import assert from 'node:assert/strict';
import fs from 'node:fs';

// Repository-baseline ONLY. A matching marker here is not proof of deployed
// Version 155 or other original-bound .gs files. Never read production data.
const source=fs.readFileSync(new URL('../Code.gs',import.meta.url),'utf8');
const routes=[
  {actions:['createOrder','createMatbagyOrder','clientCreateOrder'],
   handler:'mbCreateOrder_',anchor:'mbCreateOrder_'},
  {actions:['createCustomerPortalOrder'],
   handler:'createCustomerPortalOrder_',anchor:'createCustomerPortalOrder_'},
  {actions:['submitCustomerDraft'],
   handler:'submitCustomerDraft_',anchor:'submitCustomerDraft_'},
  {actions:['createManualOrder'],
   handler:'createManualOrder_',anchor:'createManualOrder_'}
];
function escape(x){return x.replace(/[.*+?^$\{\}()|[\]\\]/g,'\\$&');}
const sourceLines=source.split('\n');
const makeOrderCallSites=sourceLines.map((line,i)=>
  /\bmakeOrderId_\s*\(/.test(line)&&!/^\s*function makeOrderId_\s*\(/.test(line)
    ?i+1:null).filter(Boolean);
assert.equal(makeOrderCallSites.length,4,
  'new or removed repo baseline numeric order allocator must be reviewed');
const containing=sourceLines.map((line,i)=>
  /^function\s+[A-Za-z_$][\w$]*\s*\(/.test(line)
    ?{line:i+1,name:line.match(/^function\s+([A-Za-z_$][\w$]*)\s*\(/)[1]}:null
  ).filter(Boolean);
const owners=makeOrderCallSites.map(line=>
  containing.filter(x=>x.line<=line).at(-1).name);
assert.deepEqual(new Set(owners),new Set(routes.map(r=>r.handler)));
assert.equal(new Set(makeOrderCallSites).size,4);
for(const route of routes){
  assert.equal(source.split('function '+route.handler+'(').length-1,1,
    'create writer owner duplicated/absent in repo: '+route.handler);
  assert.ok(owners.includes(route.handler));
  for(const action of route.actions){
    assert.match(source,new RegExp('action\\s*===\\s*["\\x27]'+escape(action)+'["\\x27]'));
  }
}
const count=routes.reduce((n,r)=>n+r.actions.length,0);
assert.equal(count,6);
assert.match(source,/function\s+makeOrderId_\s*\(/);
assert.match(source,/TRENDOS_NEXT_SIMPLE_ORDER_NO/);
console.log('T12 repository-only four Google order writers and six create actions inventory PASS; all must be fenced before Cloud ID authority, live Version 155 unverified');
