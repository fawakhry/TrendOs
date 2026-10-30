import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
globalThis.crypto ??= webcrypto;
import {
  inspectNativeCustomerDraftFullInventoryInternalV0 as inspect,
  T12_DRAFT_INVENTORY_FILES_SQL_V0 as FILES_SQL,
  T12_DRAFT_INVENTORY_QUARANTINE_SQL_V0 as QUAR_SQL,
} from '../cloudflare-d1/customer-stage/t12-draft-lossless-inventory-ro-internal-v0.mjs';

const NOW=1793393000000, SECRET='synthetic-only-32-byte-customer-native-session-T12-2026';
const TOKEN='a'.repeat(64),DRAFT='CDR-'+'b'.repeat(32),C1='LOCAL-C1';
const itemId=n=>'CDI-'+n.toString(16).padStart(32,'0');
const fileId=n=>'CDF-'+n.toString(16).padStart(32,'0');
const item=(n=1,props={})=>({
  itemId:itemId(n),ordinal:n,department:'طباعة',
  itemName:'Product '+n,qty:2,notes:'test only',
  heatPress:0,flyPrint:0,...props
});
const file=(n=1,id=itemId(1),props={})=>({
  fileId:fileId(n),draftId:DRAFT,itemId:id,
  sha256Hex:'c'.repeat(64),byteSize:100,
  contentType:'image/png',objectKey:'customer-drafts/'+fileId(n),
  state:'READY',updatedAtMs:NOW,...props
});
const quarantine=(f,props={})=>({
  fileId:f.fileId,draftId:f.draftId,itemId:f.itemId,
  sha256Hex:f.sha256Hex,byteSize:f.byteSize,
  contentType:f.contentType,disposition:'QUARANTINED',
  scanCompleted:0,printReleaseAuthorized:0,...props
});
function mock(options={}){
  const fixture={
    owner:{draftId:DRAFT,draftState:'DRAFT',
      customerId:C1,createdAtMs:NOW,
      customerName:'SYNTHETIC_PRIVATE_CUSTOMER',
      customerPhone:'PRIVATE_PHONE',
      customerSource:'cloud-native'},
    items:[item()],
    files:[],quarantine:[],ledger:[],
    revoked:false,changeAfterFirstBatch:false,
    ...structuredClone(options)
  };
  const calls={batches:0,sessionReads:0,readFiles:0,writes:0};
  const db={prepare(sql){
    const mode=sql===FILES_SQL?'files':sql===QUAR_SQL?'quarantine':
      sql.includes('FROM customer_portal_native_draft_items_v1 i')?'items':
      sql.includes('JOIN t12_prod_request_ledger l')?'ledger':
      sql.includes('FROM customer_portal_native_drafts_v1 d')?'owner':'unknown';
    assert.notEqual(mode,'unknown','Only existing owner/items/ledger or new files/quarantine SQL permitted');
    return {bind(...params){
      if(mode==='files'||mode==='quarantine'){
        assert.equal(params[0],DRAFT);
        assert.equal(params[1],C1);
      }
      return {
        async first(){
          assert.equal(mode,'owner');
          calls.sessionReads++;
          return fixture.revoked?null:structuredClone(fixture.owner);
        },
        async all(){throw Error('Only D1 read batch allowed');},
        async run(){calls.writes++;throw Error('WRITES_NOT_ALLOWED');},
        __source:mode,__params:params
      };
    }};
  },async batch(statements){
    calls.batches++;
    assert.equal(statements.length,5);
    assert.deepEqual(statements.map(s=>s.__source),[
      'owner','items','ledger','files','quarantine']);
    if(fixture.revoked||fixture.changeAfterFirstBatch&&calls.batches>1){
      return statements.map(s=>({
        success:true,
        results:s.__source==='owner'
          ? (fixture.revoked?[]:[{...fixture.owner,draftState:'SUBMITTED'}])
          : structuredClone(fixture[s.__source])
      }));
    }
    return statements.map(s=>({
      success:true,results:s.__source==='owner'
        ?[structuredClone(fixture.owner)]
        :structuredClone(fixture[s.__source])
    }));
  }};
  return {fixture,calls,db};
}
const run=(x,props={})=>inspect({
  db:x.db,token:TOKEN,secret:SECRET,draftId:DRAFT,
  nowMs:NOW,clock:()=>NOW+1000,isolatedSourceOnly:true,...props
});
function safe(r){
  assert.equal(r.readOnly,true);
  assert.equal(r.sourceOnly,true);
  for(const flag of ['snapshotSealed','t12SingleWriterInvoked',
    'officialOrderCreated','productionWriteAuthorized',
    'malwareScanComplete','eligibleForT12FileHandoff',
    'printReleaseAuthorized'])assert.equal(r[flag],false,flag);
  for(const needle of ['SYNTHETIC_PRIVATE_CUSTOMER','PRIVATE_PHONE',
    C1,DRAFT,itemId(1),fileId(1),TOKEN,SECRET,'customer-drafts/'])
    assert.equal(JSON.stringify(r).includes(needle),false,'private leak');
}
test('default OFF even with working D1; never writes or leaks',async()=>{
  const x=mock();
  const r=await run(x,{isolatedSourceOnly:false});
  assert.equal(r.code,'T12_DRAFT_INVENTORY_INTERNAL_OFF');
  assert.equal(x.calls.sessionReads,0);safe(r);
});
test('one item, zero files: complete observation, NOT T12 submit permission',async()=>{
  const x=mock();
  const r=await run(x);
  assert.equal(r.success,true);
  assert.equal(r.itemCount,1);assert.equal(r.quarantinedFileCount,0);
  assert.equal(r.oneItemWithoutFilePreflightCandidate,true);
  assert.equal(r.needsOfficialT12SingleWriterDelegation,true);
  assert.equal(r.needsAttachmentMalwareAttestation,false);
  assert.equal(x.calls.batches,2);
  assert.equal(x.calls.writes,0);safe(r);
});
test('two independent items with 3 READY QUARANTINED files observed without losing lines',async()=>{
  const files=[file(1,itemId(1)),file(2,itemId(2)),file(3,itemId(2))];
  const x=mock({items:[item(1),item(2)],files,quarantine:files.map(f=>quarantine(f))});
  const r=await run(x);
  assert.equal(r.success,true);
  assert.equal(r.itemCount,2);assert.equal(r.quarantinedFileCount,3);
  assert.equal(r.allFilesQuarantined,true);
  assert.equal(r.oneItemWithoutFilePreflightCandidate,false);
  assert.equal(r.needsAttachmentMalwareAttestation,true);safe(r);
});
test('all fifty distinct items supported in inventory without issuing T12 order',async()=>{
  const x=mock({items:Array.from({length:50},(_,i)=>item(i+1))});
  const r=await run(x);
  assert.equal(r.success,true);assert.equal(r.itemCount,50);
  assert.equal(r.oneItemWithoutFilePreflightCandidate,false);safe(r);
});
test('51 lines, ordinal gaps and duplicates fail closed',async()=>{
  const variants=[
    [Array.from({length:51},(_,i)=>item(i+1)),'T12_DRAFT_INVENTORY_MORE_THAN_50_ITEMS'],
    [[item(1),item(3)],'T12_DRAFT_INVENTORY_ITEM_INVALID_OR_DUPLICATED'],
    [[item(1),item(1,{ordinal:2})],'T12_DRAFT_INVENTORY_ITEM_INVALID_OR_DUPLICATED'],
    [[item(1,{qty:0})],'T12_DRAFT_INVENTORY_ITEM_INVALID_OR_DUPLICATED'],
    [[item(1,{department:'ليزر',heatPress:1})],'T12_DRAFT_INVENTORY_ITEM_INVALID_OR_DUPLICATED']
  ];
  for(const [items,code] of variants){
    const r=await run(mock({items}));
    assert.equal(r.code,code);safe(r);
  }
});
test('file is never inferred safe from READY alone; quarantine ledger mandatory',async()=>{
  const f=file();
  const variants=[
    [{files:[f],quarantine:[]},'T12_DRAFT_INVENTORY_QUARANTINE_MISMATCH'],
    [{files:[f],quarantine:[quarantine(f,{disposition:'CLEAN'})]},'T12_DRAFT_INVENTORY_QUARANTINE_MISMATCH'],
    [{files:[f],quarantine:[quarantine(f,{scanCompleted:1})]},'T12_DRAFT_INVENTORY_QUARANTINE_MISMATCH'],
    [{files:[f],quarantine:[quarantine(f,{printReleaseAuthorized:1})]},'T12_DRAFT_INVENTORY_QUARANTINE_MISMATCH'],
    [{files:[file(1,itemId(1),{state:'PENDING'})],quarantine:[quarantine(f)]},'T12_DRAFT_INVENTORY_FILE_INVALID_OR_UNREADY'],
    [{files:[file(1,itemId(1),{objectKey:'public/read'})],quarantine:[quarantine(f)]},'T12_DRAFT_INVENTORY_FILE_INVALID_OR_UNREADY'],
    [{files:[file(1,itemId(2))],quarantine:[quarantine(file(1,itemId(2)))]},'T12_DRAFT_INVENTORY_FILE_INVALID_OR_UNREADY'],
    [{files:[file(1,itemId(1),{sha256Hex:'e'.repeat(64)})],quarantine:[quarantine(f)]},'T12_DRAFT_INVENTORY_QUARANTINE_MISMATCH']
  ];
  for(const [data,code] of variants){
    const r=await run(mock(data));
    assert.equal(r.code,code);safe(r);
  }
});
test('enforce five-files-per-item and 250 total file cap',async()=>{
  const six=Array.from({length:6},(_,i)=>file(i+1));
  let r=await run(mock({files:six,quarantine:six.map(f=>quarantine(f))}));
  assert.equal(r.code,'T12_DRAFT_INVENTORY_ITEM_FILE_LIMIT');safe(r);
  const items=Array.from({length:50},(_,i)=>item(i+1));
  const files=Array.from({length:251},(_,i)=>file(i+1,itemId((i%50)+1)));
  r=await run(mock({items,files,quarantine:files.map(f=>quarantine(f))}));
  assert.equal(r.code,'T12_DRAFT_INVENTORY_TOO_MANY_FILES');safe(r);
});
test('existing T12 request ledger must reconcile, never resubmit',async()=>{
  const r=await run(mock({ledger:[{status:'PREPARED'}]}));
  assert.equal(r.code,'T12_DRAFT_INVENTORY_EXISTING_T12_REQUEST_RECONCILE');safe(r);
});
test('cross-owner draft and revoked session denied before item/file batch',async()=>{
  for(const data of [{owner:{draftId:DRAFT,draftState:'DRAFT',customerId:'OTHER'}},{revoked:true}]){
    const x=mock(data);const r=await run(x);
    assert.equal(r.code,'T12_DRAFT_INVENTORY_OWNER_SESSION_DENIED');
    assert.equal(x.calls.batches,0);safe(r);
  }
});
test('changed draft state between first and second D1 batch never yields success',async()=>{
  const x=mock({changeAfterFirstBatch:true});
  const r=await run(x);
  assert.equal(r.code,'T12_DRAFT_INVENTORY_CHANGED_DURING_READ');
  assert.equal(x.calls.batches,2);safe(r);
});
test('missing transaction batches, bad clock and malformed session fail closed',async()=>{
  const x=mock();x.db.batch=async()=>[{success:true,results:[]}];
  let r=await run(x);
  assert.equal(r.code,'T12_DRAFT_INVENTORY_READ_UNVERIFIED');safe(r);
  r=await run(mock(),{clock:()=>NOW+61000});
  assert.equal(r.code,'T12_DRAFT_INVENTORY_CLOCK_DRIFT');safe(r);
  r=await run(mock(),{token:'wrong'});
  assert.equal(r.code,'T12_DRAFT_INVENTORY_INPUT_OR_BINDINGS_DENIED');safe(r);
});
