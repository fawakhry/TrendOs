import assert from 'node:assert/strict';
import {
  qualifyEasyStoreAccountingPayloadV1,
  easyStoreMaterialBlockerEvidenceCandidatesV1
} from '../core/easystore-material-readonly-connector-v1.mjs';

const payload={
  success:true,
  version:'ENTRY614_D1_ACCOUNTING_V1',
  materials:[
    {id:'m1',materialName:'MDF',department:'ليزر',stockQty:2,minStock:1,active:'نعم',version:4},
    {id:'m2',materialName:'ورق',department:'طباعة',stockQty:100,minStock:20,active:'نعم',version:2}
  ],
  deptLines:[
    {lineId:'10-1',department:'ليزر',materialName:'MDF',materialConsumption:3},
    {lineId:'20-1',department:'طباعة',materialName:'ورق',materialConsumption:5}
  ]
};

assert.deepEqual(qualifyEasyStoreAccountingPayloadV1(payload,{authenticated:false}),{
  qualified:false,reason:'AUTHENTICATED_READ_NOT_PROVEN'
});
let out=easyStoreMaterialBlockerEvidenceCandidatesV1(payload,{authenticated:false,nowMs:1800000000000});
assert.equal(out.candidates.length,0);

out=easyStoreMaterialBlockerEvidenceCandidatesV1(payload,{authenticated:true,nowMs:1800000000000});
assert.equal(out.qualification.qualified,true);
assert.equal(out.candidates.length,1);
assert.equal(out.candidates[0].lineId,'10-1');
assert.equal(out.candidates[0].state,'BLOCKED');
assert.equal(out.candidates[0].sourceKind,'EASYSTORE_READONLY');
assert.equal(out.candidates[0].evidence.accountingAuthority,'EasyStore');
assert.equal(out.candidates.some(x=>x.state==='READY'),false);

const bad=easyStoreMaterialBlockerEvidenceCandidatesV1({success:true,version:'v1'},{authenticated:true});
assert.equal(bad.qualification.qualified,false);
assert.equal(bad.candidates.length,0);

console.log('EASYSTORE_MATERIAL_READONLY_CONNECTOR_V1=PASS');
console.log('AUTHENTICATED_PAYLOAD_REQUIRED=YES');
console.log('MATERIAL_READY_SYNTHESIS=NO');
console.log('INSUFFICIENT_STOCK_BLOCKER_ONLY=YES');
console.log('FINANCIAL_WRITE_AUTHORITY=NO');
