import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const edge=fs.readFileSync(new URL('../trendos-edge-orders-read-v1.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const start=edge.indexOf('  function createFailureMessage(body)');
const end=edge.indexOf('  async function t12CreateManualOrder(params)',start);
const message=vm.runInNewContext(`(function(){function text(v){return String(v==null?'':v).trim();}${edge.slice(start,end)}return createFailureMessage;})()`);
const body={success:false,reason:'customer-department-open-order-exists',message:'Generic server text',existingOrderId:'7001',blockedDepartments:[{department:'ليزر',orderId:'7001'}]};
assert.match(message(body),/ليزر رقم 7001/);
assert.match(message(body),/جاهزًا للاستلام/);
const nodes=new Map(['tableSearch','statusFilter','priorityFilter','heatPressFilter'].map(id=>[id,{value:'__ACTIVE__'}]));
let loaded=0,scrolled=0;
nodes.set('ordersTable',{scrollIntoView(){scrolled++;}});
const state={currentPage:4};
const revealStart=app.indexOf('  async function revealBlockedOpenOrder(');
const revealEnd=app.indexOf('  function wireCustomerMode()',revealStart);
assert.ok(revealStart>0&&revealEnd>revealStart);
const reveal=vm.runInNewContext(`(function(){${app.slice(revealStart,revealEnd)}return revealBlockedOpenOrder;})()`,{
 text:v=>String(v||'').trim(),$:id=>nodes.get(id),state,
 loadRows:async force=>{assert.equal(force,true);assert.equal(state.currentPage,1);assert.equal(nodes.get('tableSearch').value,'7001');assert.equal(nodes.get('statusFilter').value,'');loaded++;}
});
await reveal({orderId:'7001',departments:['ليزر']},'ليزر');
assert.equal(loaded,1);assert.equal(scrolled,1);
assert.equal(nodes.get('priorityFilter').value,'');assert.equal(nodes.get('heatPressFilter').value,'');
await reveal({orderId:'7002',departments:['طباعة']},'ليزر');assert.equal(loaded,1,'Do not navigate a different department');
assert.ok(app.includes('res.reason === "customer-department-open-order-exists"'));
assert.ok(edge.includes("reason === 'customer-department-open-order-exists')) body.message"));
console.log('T12 blocked ready order: meaningful reference + active filter cleared + server rows refreshed PASS');
