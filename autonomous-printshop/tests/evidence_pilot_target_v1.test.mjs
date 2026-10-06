import assert from 'node:assert/strict';
import { selectEvidencePilotTargetV1 } from '../core/evidence-pilot-target-v1.mjs';

const rows=[
  {
    orderId:'O2',lineId:'L2',department:'طباعة',priority:'عادي',
    status:'طلب جديد',expectedDeliveryAt:'2026-10-10',
    designReady:null,materialReady:null,machineReady:null
  },
  {
    orderId:'O1',lineId:'L1',department:'ليزر',priority:'عاجل',
    status:'طلب جديد',expectedDeliveryAt:'2026-10-09',
    designReady:true,materialReady:null,machineReady:false
  }
];

let x=selectEvidencePilotTargetV1(rows,{requiredKinds:['design','material','machine']});
assert.equal(x.exists,true);
assert.equal(x.sourceIndex,1);
assert.equal(x.department,'ليزر');
assert.equal(x.urgent,true);
assert.deepEqual(x.missingKinds,['MATERIAL','MACHINE']);
assert.equal(x.assignmentAllowed,false);
assert.equal(x.taskClaimAllowed,false);
assert.equal(Object.hasOwn(x,'orderId'),false);
assert.equal(Object.hasOwn(x,'lineId'),false);

x=selectEvidencePilotTargetV1([{
  orderId:'O1',lineId:'L1',department:'ليزر',priority:'عادي',
  status:'طلب جديد',expectedDeliveryAt:'2026-10-09',
  designReady:true,materialReady:true,machineReady:true
}]);
assert.equal(x.exists,false);

console.log('EVIDENCE_PILOT_TARGET_V1=PASS');
console.log('RAW_ORDER_ID_EXPOSED=NO');
console.log('RAW_LINE_ID_EXPOSED=NO');
console.log('EMPLOYEE_ASSIGNMENT=NO');
console.log('TASK_CLAIM=NO');
