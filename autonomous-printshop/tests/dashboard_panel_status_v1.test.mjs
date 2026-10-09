import assert from 'node:assert/strict';
import vm from 'node:vm';
import worker from '../dashboard/worker.mjs';
const live={success:true,mode:'CONTROL_TOWER_SHADOW',generatedAt:new Date().toISOString(),source:{authority:'trendos-main-d1',rowCount:10},
 operations:{counts:{ordinary:7,inProgress:2},deadlineRisk:{overdueOrders:1,atRisk24hOrders:0}},
 employees:{operatorCounts:{available:1,total:2},departments:{},blockers:{success:true,summary:{counts:{open:0}},control:{mode:'SHADOW'}}},
 readiness:{coverage:{},strictEligible:0},controls:{autonomy:{mode:'SHADOW'},readiness:'SHADOW',operatorTask:'OFF'},shadowLearning:{},
 communications:{pending:{success:false}},finance:{warnings:{success:true,summary:{control:{mode:'READONLY',readModeSafe:true},source:{absenceQualified:false},dayClose:{ready:false}}}},
 writesAccepted:false,d1Mutation:false,employeeAssignment:false,piiExposed:false,employeeIdentityExposed:false,rawOrderIdsExposed:false,rawLineIdsExposed:false};
const env={SHADOW:{fetch:async()=>new Response(JSON.stringify(live))},READINESS_COLLECTOR:{fetch:async()=>new Response('{}',{status:503})}};
const response=await worker.fetch(new Request('https://dashboard.internal/state'),env);assert.equal(response.status,200);
const state=await response.json();assert.equal(state.panelStatus.panels.operations.state,'FRESH');
assert.equal(state.panelStatus.panels.communications.state,'UNAVAILABLE');assert.equal(state.panelStatus.panels.evidence.state,'UNAVAILABLE');
const html=await(await worker.fetch(new Request('https://dashboard.internal/'),env)).text();
const nodes=new Map();
const document={querySelector(selector){
 if(!nodes.has(selector))nodes.set(selector,{innerHTML:'',textContent:'',style:{},classList:{add(){},remove(){}},addEventListener(){}});
 return nodes.get(selector);
}};
const context=vm.createContext({document,fetch:async()=>new Response(JSON.stringify(state)),setInterval(){},Date,Number,String,Object,Array,Set,Math});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
await vm.runInContext('load()',context);
assert.match(nodes.get('#panelStatus').innerHTML,/التواصل: غير متاح/);
assert.match(nodes.get('#panelStatus').innerHTML,/اكتمال التاريخ المالي غير مثبت/);
assert.match(nodes.get('#kpis').innerHTML,/منتظر تنفيذ[\s\S]*?value">7/);
assert.match(nodes.get('#kpis').innerHTML,/رسائل تنتظر رد[\s\S]*?value">—/);
assert.match(nodes.get('#evidenceSources').innerHTML,/غير متاحة/);
assert.match(nodes.get('#canaryGate').innerHTML,/لا يوجد إثبات حديث مكتمل/);
assert.equal(nodes.get('#error').style.display,'none');
console.log('DASHBOARD_PARTIAL_FAILURE_UI_NO_FAKE_ZERO=PASS');
