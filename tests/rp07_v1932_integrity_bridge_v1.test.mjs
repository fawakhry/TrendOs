import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync(new URL('../v1932-router.gs',import.meta.url),'utf8');

function load(extra={}){
  const calls=[];
  const context=Object.assign({
    console,Object,String,
    ContentService:{createTextOutput(x){return x;}},
    output_(x){return x;},
    trendosRp07LegacyAttendanceV1_(e){calls.push(['containment-attendance',e.parameter.op]);return{success:true,from:'containment'};},
    attendanceV1_(e){calls.push(['legacy-attendance',e.parameter.op]);return{success:true,from:'legacy-attendance'};},
    pressControlV1_(e){calls.push(['legacy-press',e.parameter.op]);return{success:true,from:'legacy-press'};},
    goLiveAutopilotV1_(e){calls.push(['legacy-invoice',e.parameter.op]);return{success:true,from:'legacy-invoice'};},
    customerFeedbackWebhookV1_(){calls.push(['legacy-feedback']);},
    customerManagerWebhookV1_(){calls.push(['legacy-whatsapp']);return{success:true,from:'legacy-whatsapp'};}
  },extra);
  vm.createContext(context);vm.runInContext(source,context,{filename:'v1932-router.gs'});
  return{context,calls};
}

{
  const {context,calls}=load({
    trendosIntegrityTryRouteV1_(action,e){calls.push(['integrity-route',action,e.parameter.op]);return{handled:true,family:'ATTENDANCE_CLEANING',result:{success:true,from:'integrity-attendance'}};}
  });
  const out=context.trendosV1932TryRoute_({parameter:{action:'attendanceV1',op:'start'}},null);
  assert.equal(out.from,'integrity-attendance');
  assert.deepEqual(calls,[['integrity-route','attendanceV1','start']],'Integrity must preempt both containment and legacy when family is enabled/handled');
}

{
  const {context,calls}=load({trendosIntegrityTryRouteV1_(action){calls.push(['integrity-route',action]);return null;}});
  const out=context.trendosV1932TryRoute_({parameter:{action:'attendanceV1',op:'start'}},null);
  assert.equal(out.from,'containment');
  assert.deepEqual(calls,[['integrity-route','attendanceV1'],['containment-attendance','start']],'family-off/null must fall back to RP-07 legacy containment');
}

{
  const {context,calls}=load({trendosIntegrityTryRouteV1_(action,e){calls.push(['integrity-route',action,e.parameter.op]);return{handled:true,family:'PRESS',result:{success:true,from:'integrity-press'}};}});
  const out=context.trendosV1932TryRoute_({parameter:{action:'pressControlV1',op:'stop'}},null);
  assert.equal(out.from,'integrity-press');
  assert.deepEqual(calls,[['integrity-route','pressControlV1','stop']]);
}

{
  const {context,calls}=load({trendosIntegrityTryRouteV1_(action,e){calls.push(['integrity-route',action,e.parameter.op]);return{handled:true,family:'INVOICE',result:{success:true,from:'integrity-invoice'}};}});
  const out=context.trendosV1932TryRoute_({parameter:{}},{action:'goLiveAutopilotV1',op:'prepareReadyInvoice',orderId:'4001'});
  assert.equal(out.from,'integrity-invoice');
  assert.deepEqual(calls,[['integrity-route','goLiveAutopilotV1','prepareReadyInvoice']]);
}

{
  const {context,calls}=load({trendosIntegrityTryWebhookV1_(payload){calls.push(['integrity-webhook',payload.object]);return{handled:true,family:'WHATSAPP',result:{success:true,from:'integrity-whatsapp'}};}});
  const out=context.trendosV1932TryRoute_({parameter:{}},{object:'whatsapp_business_account'});
  assert.equal(out.from,'integrity-whatsapp');
  assert.deepEqual(calls,[['integrity-webhook','whatsapp_business_account']],'handled Integrity webhook must prevent legacy duplicate side effects');
}

{
  const {context,calls}=load({trendosIntegrityTryWebhookV1_(){calls.push(['integrity-webhook']);return null;}});
  const out=context.trendosV1932TryRoute_({parameter:{}},{object:'whatsapp_business_account'});
  assert.equal(out.from,'legacy-whatsapp');
  assert.deepEqual(calls,[['integrity-webhook'],['legacy-feedback'],['legacy-whatsapp']],'family-off webhook must preserve legacy fallback');
}

{
  const {context,calls}=load({trendosIntegrityTryRouteV1_(action){calls.push(['integrity-route',action]);return null;}});
  const out=context.trendosV1932TryRoute_({parameter:{action:'notOwnedByV1932'}},null);
  assert.equal(out,null,'unknown action must continue to older/top-level routing');
  assert.deepEqual(calls,[['integrity-route','notOwnedByV1932']]);
}

assert.match(source,/trendosIntegrityTryRouteV1_/);
assert.match(source,/trendosIntegrityTryWebhookV1_/);
assert.ok(!source.includes('setProperty('));
console.log('RP-07 V1932 guarded Integrity cutover bridge: PASS');
