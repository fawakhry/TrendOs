// ACC187 purely disposable local SQLite inventory/waste bookkeeping rehearsal.
// No real stock, finished products, Cloudflare D1 or actual finance permissions.
import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {inspectReturnedItemDisposition as inspect} from
 '../scripts/easystore_acc187_returned_product_inspection_waste_no_go.mjs';

function fixture(){
 const db=new DatabaseSync(':memory:');
 db.exec("PRAGMA foreign_keys=ON;"+
  "CREATE TABLE fake_inventory(item_id TEXT PRIMARY KEY,saleable_units INTEGER NOT NULL CHECK(saleable_units>=0));"+
  "CREATE TABLE fake_return(case_id TEXT PRIMARY KEY,item_id TEXT NOT NULL REFERENCES fake_inventory(item_id),"+
   "units INTEGER NOT NULL CHECK(units>0),state TEXT NOT NULL CHECK(state IN "+
   "('QUARANTINED','INSPECTED_SALEABLE','WASTE')),inspection_id TEXT);"+
  "CREATE TABLE fake_waste(case_id TEXT PRIMARY KEY REFERENCES fake_return(case_id),"+
   "item_id TEXT NOT NULL,units INTEGER NOT NULL CHECK(units>0),reason_ref TEXT NOT NULL);"+
  "CREATE TABLE fake_restock(case_id TEXT PRIMARY KEY REFERENCES fake_return(case_id),"+
   "item_id TEXT NOT NULL,units INTEGER NOT NULL CHECK(units>0));");
 db.prepare('INSERT INTO fake_inventory VALUES(?,?)').run('FAKE-PRINTED-ITEM-100',10);
 const r=(caseId='FAKE-RETURN-100')=>({
   invoiceId:'FAKE-INVOICE-100',returnRequestId:caseId,
   itemId:'FAKE-PRINTED-ITEM-100',returnedUnits:2,
 });
 const receipt=req=>({
   source:'SYNTHETIC_VERIFIED_PHYSICAL_RETURN',verified:true,
   receiptId:'FAKE-RECEIPT-'+req.returnRequestId,
   invoiceId:req.invoiceId,returnRequestId:req.returnRequestId,
   itemId:req.itemId,returnedUnits:req.returnedUnits,
 });
 const qa=(req,kind)=>({
   source:'SYNTHETIC_INDEPENDENT_RETURN_QUALITY_INSPECTION',
   verified:true,inspectionId:'FAKE-INSPECT-'+req.returnRequestId,
   invoiceId:req.invoiceId,returnRequestId:req.returnRequestId,
   itemId:req.itemId,receiptId:receipt(req).receiptId,
   inspectedUnits:req.returnedUnits,condition:kind,
   saleabilityEvidenceRef:'FAKE-RESALE-PROOF-100',
   damageEvidenceRef:'FAKE-DAMAGE-EVIDENCE-100',
   damageReasonRef:'FAKE-DAMAGE-REASON-100',
 });
 const counts=()=>({
   saleable:Number(db.prepare('SELECT saleable_units FROM fake_inventory').get().saleable_units),
   quarantined:Number(db.prepare("SELECT COALESCE(SUM(units),0) AS n FROM fake_return WHERE state='QUARANTINED'").get().n),
   restocked:Number(db.prepare('SELECT COALESCE(SUM(units),0) AS n FROM fake_restock').get().n),
   waste:Number(db.prepare('SELECT COALESCE(SUM(units),0) AS n FROM fake_waste').get().n),
 });
 const acceptPhysical=req=>{
   // The synthetic input is a fake returned item, not a purchase/credit/refund.
   const evidence=receipt(req);
   const p=inspect(req,evidence);
   if(p.status!=='STOP_PENDING_INDEPENDENT_INSPECTION') return p.status;
   db.prepare('INSERT INTO fake_return VALUES(?,?,?,?,?)')
     .run(req.returnRequestId,req.itemId,req.returnedUnits,'QUARANTINED',null);
   return 'FAKE_QUARANTINE_ONLY';
 };
 const completeQa=(req,condition,override=null)=>{
   const p=inspect(req,receipt(req),override||qa(req,condition));
   if(!['SYNTHETIC_INSPECTED_SALEABLE_RESTOCK_REVIEW_ONLY',
        'SYNTHETIC_DAMAGED_ITEM_WASTE_RECORD_REQUIRED'].includes(p.status))
     return p.status;
   db.exec('BEGIN IMMEDIATE');
   try{
     // Only eligible FAKE returns currently in QUARANTINE can be classified.
     const change=db.prepare("UPDATE fake_return SET state=?,inspection_id=? WHERE "+
       "case_id=? AND item_id=? AND units=? AND state='QUARANTINED'")
       .run(p.proposed_classification==='WASTE_ONLY'?'WASTE':'INSPECTED_SALEABLE',
        (override||qa(req,condition)).inspectionId,req.returnRequestId,req.itemId,req.returnedUnits);
     if(change.changes!==1){
       db.exec('ROLLBACK');
       return 'FAKE_RETURN_NOT_FOUND_OR_ALREADY_CLASSIFIED';
     }
     if(p.proposed_classification==='WASTE_ONLY'){
       db.prepare('INSERT INTO fake_waste VALUES(?,?,?,?)')
         .run(req.returnRequestId,req.itemId,req.returnedUnits,
              (override||qa(req,condition)).damageReasonRef);
       // No fake-inventory saleable stock increment.
     }else{
       db.prepare('UPDATE fake_inventory SET saleable_units=saleable_units+? WHERE item_id=?')
         .run(req.returnedUnits,req.itemId);
       db.prepare('INSERT INTO fake_restock VALUES(?,?,?)')
         .run(req.returnRequestId,req.itemId,req.returnedUnits);
     }
     db.exec('COMMIT');
     return p.proposed_classification==='WASTE_ONLY'?
       'FAKE_DAMAGED_WASTE_ONLY':'FAKE_INSPECTED_RESTOCK_ONLY';
   }catch(err){db.exec('ROLLBACK');throw err;}
 };
 return {db,r,receipt,qa,counts,acceptPhysical,completeQa};
}
function withFake(f){
 const a=fixture();
 try{f(a);}finally{a.db.close();}
}
test('physically received mock return goes only to quarantine, saleable unchanged',()=>withFake(a=>{
 const r=a.r();
 assert.equal(a.acceptPhysical(r),'FAKE_QUARANTINE_ONLY');
 assert.deepEqual(a.counts(),{saleable:10,quarantined:2,restocked:0,waste:0});
}));
test('missing inspection cannot leave quarantine or increase saleable stock',()=>withFake(a=>{
 const r=a.r();a.acceptPhysical(r);
 const before=a.counts();
 assert.equal(a.completeQa(r,null,{condition:'FIT_FOR_RESALE',verified:false}),
  'STOP_INSPECTION_UNVERIFIED_OR_CASE_MISMATCH');
 assert.deepEqual(a.counts(),before);
}));
test('independently inspected fit-for-resale fake goods only then increase fake stock',()=>withFake(a=>{
 const r=a.r();a.acceptPhysical(r);
 assert.deepEqual(a.counts(),{saleable:10,quarantined:2,restocked:0,waste:0});
 assert.equal(a.completeQa(r,'FIT_FOR_RESALE'),'FAKE_INSPECTED_RESTOCK_ONLY');
 assert.deepEqual(a.counts(),{saleable:12,quarantined:0,restocked:2,waste:0});
}));
test('verified damaged returned goods are recorded as fake waste, not saleable',()=>withFake(a=>{
 const r=a.r();a.acceptPhysical(r);
 assert.equal(a.completeQa(r,'DAMAGED'),'FAKE_DAMAGED_WASTE_ONLY');
 assert.deepEqual(a.counts(),{saleable:10,quarantined:0,restocked:0,waste:2});
}));
test('same fake return cannot be restocked twice even with repeated inspection',()=>withFake(a=>{
 const r=a.r();a.acceptPhysical(r);a.completeQa(r,'FIT_FOR_RESALE');
 assert.equal(a.completeQa(r,'FIT_FOR_RESALE'),'FAKE_RETURN_NOT_FOUND_OR_ALREADY_CLASSIFIED');
 assert.deepEqual(a.counts(),{saleable:12,quarantined:0,restocked:2,waste:0});
}));
test('once classified waste, fake return cannot later become resale inventory',()=>withFake(a=>{
 const r=a.r();a.acceptPhysical(r);a.completeQa(r,'DAMAGED');
 assert.equal(a.completeQa(r,'FIT_FOR_RESALE'),'FAKE_RETURN_NOT_FOUND_OR_ALREADY_CLASSIFIED');
 assert.deepEqual(a.counts(),{saleable:10,quarantined:0,restocked:0,waste:2});
}));
test('same case ID duplicate physical return is rejected by fake unique constraint',()=>withFake(a=>{
 const r=a.r();a.acceptPhysical(r);
 assert.throws(()=>a.acceptPhysical(r),/UNIQUE constraint failed/);
 assert.deepEqual(a.counts(),{saleable:10,quarantined:2,restocked:0,waste:0});
}));
test('fake inspection on a different return request cannot classify this return',()=>withFake(a=>{
 const r=a.r();a.acceptPhysical(r);
 const proof=a.qa(r,'FIT_FOR_RESALE');
 proof.returnRequestId='FAKE-OTHER-CASE';
 assert.equal(a.completeQa(r,'FIT_FOR_RESALE',proof),'STOP_INSPECTION_UNVERIFIED_OR_CASE_MISMATCH');
 assert.deepEqual(a.counts(),{saleable:10,quarantined:2,restocked:0,waste:0});
}));
test('real Worker accounting tables NEVER exist in the test-only warehouse',()=>withFake(a=>{
 const names=a.db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all().map(z=>z.name);
 assert.deepEqual(names,['fake_inventory','fake_restock','fake_return','fake_waste']);
}));
console.log('ACC187_FAKE_QUARANTINE_BEFORE_INSPECTION_STOCK_UNCHANGED=PASS');
console.log('ACC187_FAKE_VERIFIED_RESALE_ONLY_AND_DAMAGED_WASTE_ONLY=PASS');
console.log('ACC187_FAKE_DUPLICATE_RESTOCK_AND_WASTE_TO_RESALE_DENIED=PASS');
console.log('ACC187_REAL_MATERIALS_FINISHED_GOODS_LEDGER=NOT_IMPLEMENTED');
console.log('ACC187_REAL_INVENTORY_AND_FINANCE_OPERATIONS=ZERO');
console.log('FINANCE_RELEASE=NO_GO');
