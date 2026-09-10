import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);
const gm=require(path.resolve(here,'..','gaber-material-control-v1.js'));

test('explicit zero reusable offcut is valid and is not treated as missing quantity',()=>{
  const decision=gm.buildDecision({
    taskId:'T-ZERO-OFFCUT',orderId:'3910',lineId:'3910-01',operator:'جابر',department:'ليزر',
    purchaseDeclaration:'NO_PURCHASE',lineRevenue:1000,directOperatingCost:0,otherDirectCost:0,
    materials:[{
      materialId:'MAT-1',materialName:'محفظة',unit:'قطعة',
      issuedQty:10,consumedQty:9,returnedQty:1,offcutQty:0,wasteQty:0,unitCost:100
    }],
    wastes:[],purchases:[]
  });
  assert.equal(decision.canClose,true);
  assert.equal(decision.materials[0].offcutQty,0);
  assert.equal(decision.materials[0].varianceQty,0);
  assert.equal(decision.blockers.some(b=>b.code==='NEGATIVE_QUANTITY_INVALID'),false);
});

test('zero offcut also remains valid when supplied through reusableOffcutQty alias',()=>{
  const normalized=gm._pure.normalizeMaterial({
    materialId:'MAT-1',issuedQty:1,consumedQty:1,returnedQty:0,reusableOffcutQty:0,wasteQty:0,unitCost:100
  });
  assert.equal(normalized.offcutQty,0);
});