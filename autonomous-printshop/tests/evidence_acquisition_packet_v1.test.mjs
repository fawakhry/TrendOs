import assert from 'node:assert/strict';
import { buildEvidenceAcquisitionPacketV1 } from '../core/evidence-acquisition-packet-v1.mjs';

let x=buildEvidenceAcquisitionPacketV1({
  exists:true,
  department:'ليزر',
  priority:'عاجل',
  dueIso:'2026-10-07T23:59:59.000Z',
  urgent:true,
  missingKinds:['DESIGN','MATERIAL','MACHINE'],
  machineClassHint:'LASER'
});

assert.equal(x.exists,true);
assert.equal(x.externalEvidenceRequired,true);
assert.equal(x.machineClassHint,'LASER');
assert.deepEqual(Object.keys(x.requirements),['DESIGN','MATERIAL','MACHINE']);
assert.ok(x.requirements.DESIGN.includes('CONTENT_SHA256'));
assert.ok(x.requirements.DESIGN.includes('STRUCTURED_APPROVAL'));
assert.ok(x.requirements.MATERIAL.includes('ACTIVE_NON_CANARY_MATERIAL'));
assert.ok(x.requirements.MATERIAL.includes('POSITIVE_MATERIAL_CONSUMPTION'));
assert.ok(x.requirements.MACHINE.includes('SERIAL_OR_ASSET_TAG'));
assert.ok(x.requirements.MACHINE.includes('DIRECT_OPERATOR_CHECK_OR_SELF_TEST'));
assert.equal(x.assignmentAllowed,false);
assert.equal(x.taskClaimAllowed,false);
assert.equal(x.readyWriteAllowed,false);
assert.equal(x.operatorTaskActivationAllowed,false);
assert.equal(x.rawOrderIdsExposed,false);
assert.equal(x.rawLineIdsExposed,false);
assert.equal(x.customerPiiExposed,false);
assert.equal(Object.hasOwn(x,'orderId'),false);
assert.equal(Object.hasOwn(x,'lineId'),false);

x=buildEvidenceAcquisitionPacketV1({exists:false});
assert.equal(x.exists,false);
assert.equal(x.externalEvidenceRequired,false);
assert.deepEqual(x.requirements,{});
assert.equal(x.machineClassHint,'UNKNOWN');

console.log('EVIDENCE_ACQUISITION_PACKET_V1=PASS');
console.log('EXTERNAL_EVIDENCE_REQUIREMENTS=EXPLICIT');
console.log('READY_WRITE=NO');
console.log('OPERATOR_TASK_ACTIVATION=NO');
console.log('RAW_IDS_EXPOSED=NO');
