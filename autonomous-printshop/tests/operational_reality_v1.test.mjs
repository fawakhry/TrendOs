import assert from 'node:assert/strict';
import {buildOperationalRealityV1,recommendNextTaskV1,REALITY_REASONS} from '../core/operational-reality-v1.mjs';

const rows=[
  {orderId:'20',lineId:'20-1',department:'طباعة',priority:'عادي',status:'طلب جديد',expectedDelivery:'2026-10-05'},
  {orderId:'30',lineId:'30-1',department:'طباعة',priority:'عاجل',status:'طلب جديد',expectedDelivery:'2026-10-07'},
  {orderId:'10',lineId:'10-1',department:'طباعة',priority:'عاجل',status:'طلب جديد',expectedDelivery:'2026-10-06'},
  {orderId:'40',lineId:'40-1',department:'طباعة',priority:'عادي',status:'تم التسليم',expectedDelivery:'2026-10-01'},
  {orderId:'50',lineId:'50-1',department:'طباعة',priority:'عاجل',status:'طلب جديد',expectedDelivery:'',flyPrint:'نعم'},
  {orderId:'60',lineId:'60-1',department:'طباعة',priority:'عادي',status:'طلب جديد',expectedDelivery:''},
  {orderId:'70',lineId:'70-1',department:'طباعة',priority:'عادي',status:'طلب جديد',expectedDelivery:'2026-10-05',materialReady:false}
];

let reality=buildOperationalRealityV1(rows,{department:'طباعة'});
assert.deepEqual(reality.ordinary.map(x=>x.orderId),['10','30','20']);
assert.equal(reality.closed.length,1);
assert.equal(reality.flyPrint.length,1);
assert.equal(reality.exceptions.length,2);
assert.equal(reality.exceptions.find(x=>x.orderId==='60').reason,REALITY_REASONS.DUE_DATE_REQUIRED);
assert.equal(reality.exceptions.find(x=>x.orderId==='70').reason,REALITY_REASONS.MATERIAL_NOT_READY);

let rec=recommendNextTaskV1(rows,{department:'طباعة'});
assert.equal(rec.recommended.orderId,'10');
assert.equal(rec.evidence.urgent,true);

rec=recommendNextTaskV1(rows,{department:'طباعة',activeTask:{taskId:'T1'}});
assert.equal(rec.recommended,null);
assert.equal(rec.reason,REALITY_REASONS.ACTIVE_TASK_EXISTS);

rec=recommendNextTaskV1(rows,{department:'طباعة',operatorAvailable:false});
assert.equal(rec.recommended,null);
assert.equal(rec.reason,REALITY_REASONS.OPERATOR_UNAVAILABLE);

reality=buildOperationalRealityV1([
  {orderId:'1',lineId:'1-1',department:'ليزر',priority:'عادي',status:'طلب جديد',expectedDelivery:'05/10/2026'},
  {orderId:'2',lineId:'2-1',department:'ليزر',priority:'عادي',status:'طلب جديد',expectedDelivery:'2026-10-05',designReady:true,materialReady:true,machineReady:true}
],{department:'ليزر',requiredReadiness:['design','material','machine']});
assert.equal(reality.ordinary.length,1);
assert.equal(reality.ordinary[0].orderId,'2');
assert.equal(reality.exceptions[0].reason,REALITY_REASONS.READINESS_UNKNOWN);

reality=buildOperationalRealityV1([
  {orderId:'9',lineId:'9-2',department:'طباعة',priority:'عاجل',status:'طلب جديد',expectedDelivery:'2026-10-05'},
  {orderId:'9',lineId:'9-1',department:'طباعة',priority:'عاجل',status:'طلب جديد',expectedDelivery:'2026-10-05'}
],{department:'طباعة'});
assert.deepEqual(reality.ordinary.map(x=>x.lineId),['9-1','9-2']);


reality=buildOperationalRealityV1([
  {orderId:'80',lineId:'80-1',department:'طباعة',priority:'عاجل',status:'بدأ التنفيذ',expectedDelivery:'2026-10-05'},
  {orderId:'81',lineId:'81-1',department:'طباعة',priority:'عاجل',status:'متوقف',expectedDelivery:'2026-10-05'},
  {orderId:'82',lineId:'82-1',department:'طباعة',priority:'عادي',status:'طلب جديد',expectedDelivery:'2026-10-06'}
],{department:'طباعة'});
assert.equal(reality.ordinary.length,1);
assert.equal(reality.ordinary[0].orderId,'82');
assert.equal(reality.inProgress.length,1);
assert.equal(reality.inProgress[0].orderId,'80');
assert.equal(reality.inProgress[0].reason,REALITY_REASONS.STATUS_NOT_DISPATCHABLE);
assert.equal(reality.exceptions.find(x=>x.orderId==='81').reason,REALITY_REASONS.STATUS_BLOCKED);

console.log('AUTONOMOUS_PRINTSHOP_OPERATIONAL_REALITY_V1=PASS');
console.log('DISPATCH_ORDER=URGENT_DUE_ORDER_LINE');
console.log('FLY_PRINT=OUTSIDE_ORDINARY_TASKS');
console.log('MISSING_DUE_DATE=FAIL_CLOSED_EXCEPTION');
