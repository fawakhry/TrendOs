const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const root=process.argv[2]||process.cwd();
const foundation=fs.readFileSync(root+'/trendos-integrity-v1.gs','utf8');
const remediation=fs.readFileSync(root+'/trendos-core-p0-remediation-v1.gs','utf8');
const writer=fs.readFileSync(root+'/trendos-core-p0-registry-writer-v1.gs','utf8');

class FakeRange{
  constructor(sheet,row,col,numRows,numCols){this.sheet=sheet;this.row=row;this.col=col;this.numRows=numRows;this.numCols=numCols;}
  getValues(){const out=[];for(let r=0;r<this.numRows;r++){const row=[];for(let c=0;c<this.numCols;c++)row.push((this.sheet.rows[this.row-1+r]||[])[this.col-1+c]??'');out.push(row);}return out;}
  setValues(values){for(let r=0;r<this.numRows;r++){const target=this.sheet.rows[this.row-1+r]||(this.sheet.rows[this.row-1+r]=[]);for(let c=0;c<this.numCols;c++)target[this.col-1+c]=values[r][c];}return this;}
}
class FakeSheet{
  constructor(name){this.name=name;this.rows=[];}
  getLastRow(){let n=this.rows.length;while(n&&!(this.rows[n-1]||[]).some(v=>v!==''&&v!=null))n--;return n;}
  getLastColumn(){return this.rows.reduce((n,row)=>Math.max(n,(row||[]).length),0);}
  getRange(row,col,numRows,numCols){return new FakeRange(this,row,col,numRows,numCols);}
}
class FakeSpreadsheet{
  constructor(){this.sheets={};}
  getSheetByName(name){return this.sheets[name]||null;}
  insertSheet(name){if(this.sheets[name])throw new Error('duplicate sheet');return(this.sheets[name]=new FakeSheet(name));}
}

const propertyValues={};let featureState={master:true,families:{HEALTH:true,ORDER_LINE:false,ATTENDANCE_CLEANING:false,PRESS:false,INVOICE:false,WHATSAPP:false,OPS:false,AUTOMATION:false}};
let spreadsheet=new FakeSpreadsheet(),snapshotCalls=0,snapshotProvider=null,lockCalls=0;
const previewLogs=[];
const ctx={
  console:{log(...args){previewLogs.push(args.join(' '));},warn:console.warn,error:console.error},Date,JSON,Object,Array,String,Number,Math,RegExp,isFinite,isNaN,Set,
  Utilities:{
    DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},
    computeDigest(a,v){return Array.from(crypto.createHash('sha256').update(String(v)).digest()).map(x=>x>127?x-256:x);},
    formatDate(){return'2026-09-01';},getUuid(){return'UUID';}
  },
  PropertiesService:{
    getScriptProperties(){return{
      getProperty(k){return propertyValues[k]??null;},
      setProperty(k,v){propertyValues[k]=String(v);},
      deleteProperty(k){delete propertyValues[k];}
    };}
  },
  Session:{getEffectiveUser(){return{getEmail(){return'owner@example.test';}};}},
  SpreadsheetApp:{flush(){}},
  LockService:{
    getScriptLock(){return{waitLock(){},releaseLock(){}};},
    getUserLock(){return{waitLock(){},releaseLock(){}};},
    getDocumentLock(){return{waitLock(){},releaseLock(){}};}
  }
};
vm.createContext(ctx);vm.runInContext(foundation,ctx);vm.runInContext(remediation,ctx);
ctx.trendosWithLock_=(scope,fn)=>{lockCalls++;return fn();};
ctx.trendosSpreadsheetV1_=()=>spreadsheet;
ctx.trendosIntegrityFeatureStateV1_=()=>featureState;
ctx.trendosHealthValV1_=(row,aliases)=>{for(const k of aliases)if(row[k]!==undefined&&row[k]!==null&&String(row[k]).trim()!=='')return row[k];return'';};
ctx.trendosHealthDateV1_=v=>String(v||'').slice(0,10);
ctx.trendosHealthLineIdV1_=row=>String(row.lineId||row['Line ID']||row['رقم البند']||'').trim();
ctx.trendosHealthPressFlagV1_=row=>!!row.press;
ctx.trendosHealthInvoiceDraftDtoV1_=row=>row;
ctx.trendosIntegrityGroupEvidenceV1_=(metric,key,rows)=>({__hash:rows[0]&&rows[0].__testEvidenceHash||'',metric,key});
ctx.trendosIntegrityInvoiceDraftEvidenceV1_=rows=>({__hash:rows[0]&&rows[0].__testEvidenceHash||''});
const realHash=ctx.trendosIntegrityEvidenceHashV1_;ctx.trendosIntegrityEvidenceHashV1_=e=>e&&e.__hash||realHash(e);
vm.runInContext(writer,ctx);
Object.assign(ctx,vm.runInContext(`({
  TRENDOS_INTEGRITY_RESOLUTION_SHEET_V1,
  TRENDOS_INTEGRITY_RESOLUTION_HEADERS_V1,
  TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1,
  TRENDOS_CORE_P0_REGISTRY_ROLLBACK_APPROVAL_PROP_V1
})`,ctx));

function makeSnapshot(){
  const snap={attendance:[],cleaning:[],drafts:[],lines:[],pressSessionLineIds:[]},groups={};
  for(const spec of ctx.trendosCoreP0RegistrySpecsV1_())(groups[spec.metricId+'\u001f'+spec.entityKey]||(groups[spec.metricId+'\u001f'+spec.entityKey]=[])).push(spec);
  for(const key of Object.keys(groups)){
    const planned=groups[key],s=planned[0];
    if(s.metricId==='DUPLICATE_ATTENDANCE_SESSIONS'){
      const ids=[s.canonicalId,...planned.map(x=>x.supersededId)];
      ids.forEach((id,i)=>snap.attendance.push({__rowNumber:i+2,__testEvidenceHash:s.evidenceHash,employee:s.entityKey.split('|')[0],date:s.entityKey.split('|')[1],sessionId:id,'معرف الجلسة':id,__display:{employee:s.entityKey.split('|')[0],date:s.entityKey.split('|')[1],sessionId:id}}));
    }else if(s.metricId==='DUPLICATE_CLEANING_RECORDS'){
      for(let i=0;i<s.sourceCount;i++)snap.cleaning.push({__rowNumber:i+2,__testEvidenceHash:s.evidenceHash,employee:s.entityKey.split('|')[0],date:s.entityKey.split('|')[1],__display:{employee:s.entityKey.split('|')[0],date:s.entityKey.split('|')[1]}});
    }else if(s.metricId==='DUPLICATE_INVOICE_DRAFTS'){
      snap.drafts.push({__rowNumber:s.canonicalSourceRow,__testEvidenceHash:s.evidenceHash,draftId:s.canonicalId,orderId:s.entityKey,subtotal:0,status:'يحتاج تسعير/اعتماد',blocker:'لا توجد بنود معتمدة بسعر بيع.',invoiceNo:'',messageStatus:'',metaId:''});
      planned.forEach(spec=>snap.drafts.push({__rowNumber:spec.supersededSourceRow,__testEvidenceHash:s.evidenceHash,draftId:spec.supersededId,orderId:s.entityKey,subtotal:0,status:'يحتاج تسعير/اعتماد',blocker:'لا توجد بنود معتمدة بسعر بيع.',invoiceNo:'',messageStatus:'',metaId:''}));
    }else{
      snap.lines.push({__rowNumber:2,__testEvidenceHash:s.evidenceHash,lineId:s.entityKey,status:'تم التسليم',press:true,__display:{lineId:s.entityKey,status:'تم التسليم'}});
    }
  }
  return snap;
}
let snapshot=makeSnapshot();snapshotProvider=()=>snapshot;ctx.trendosHealthSnapshotV1_=()=>{snapshotCalls++;return snapshotProvider();};

assert.strictEqual(ctx.trendosCoreP0RegistrySpecsV1_().length,34);
let preview=ctx.trendosCoreP0RegistryPreviewV1();
assert.strictEqual(preview.success,true);assert.strictEqual(preview.readOnly,true);assert.strictEqual(preview.actualPlanCount,34);
let loggedPreview=JSON.parse(previewLogs[previewLogs.length-1]);assert.strictEqual(loggedPreview.success,true);assert.strictEqual(loggedPreview.actualPlanCount,34);assert.strictEqual(loggedPreview.checks.length,34);
assert.strictEqual(spreadsheet.getSheetByName(ctx.TRENDOS_INTEGRITY_RESOLUTION_SHEET_V1),null,'preview must not create a sheet');

// Regression: historical status مكرر must remain in source history but be excluded from active Press live-plan validation.
const historicalDuplicateSnapshot=makeSnapshot();
const press3536=historicalDuplicateSnapshot.lines.find(x=>x.lineId==='3536-01');
historicalDuplicateSnapshot.lines.unshift({__rowNumber:71,__testEvidenceHash:'historical-only-row',lineId:'3536-01',status:'مكرر',press:false,__display:{lineId:'3536-01',status:'مكرر'}});
press3536.__rowNumber=108;
const selected3536=ctx.trendosCoreP0RegistrySourceRowsV1_('PRESS_COMPLETED_WITHOUT_SESSION','3536-01',historicalDuplicateSnapshot);
assert.strictEqual(historicalDuplicateSnapshot.lines.filter(x=>x.lineId==='3536-01').length,2,'fixture must preserve both historical and canonical rows');
assert.strictEqual(selected3536.length,1,'active Press selection must exclude the historical مكرر row');
assert.strictEqual(selected3536[0].status,'تم التسليم');
snapshotProvider=()=>historicalDuplicateSnapshot;
preview=ctx.trendosCoreP0RegistryPreviewV1();
assert.strictEqual(preview.success,true,'historical مكرر row must not invalidate the exact Press registry plan');
snapshotProvider=()=>snapshot;

const wrongInvoiceRowSnapshot=makeSnapshot();wrongInvoiceRowSnapshot.drafts.find(x=>x.draftId==='DR-19c18636').__rowNumber=20;
snapshotProvider=()=>wrongInvoiceRowSnapshot;assert.throws(()=>ctx.trendosCoreP0RegistryPreviewV1(),/CORE-P0 registry preview failed/);loggedPreview=JSON.parse(previewLogs[previewLogs.length-1]);assert.strictEqual(loggedPreview.success,false);assert.ok(loggedPreview.errors.some(x=>/source-row identity/.test(x)));
snapshotProvider=()=>snapshot;

const planHash=ctx.trendosCoreP0RegistryPlanHashV1_();propertyValues[ctx.TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1]=planHash;
let result=ctx.trendosCoreP0RegistryWriteV1();
assert.strictEqual(result.success,true);assert.strictEqual(result.appended,34);assert.strictEqual(result.totalRegistryRows,34);assert.strictEqual(result.sourceSheetsMutated,false);
assert.strictEqual(propertyValues[ctx.TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1],undefined,'approval must be consumed');assert.strictEqual(lockCalls,1);
const registry=spreadsheet.getSheetByName(ctx.TRENDOS_INTEGRITY_RESOLUTION_SHEET_V1);assert.strictEqual(registry.getLastRow(),35);
assert.deepStrictEqual(Array.from(registry.rows[0]),Array.from(ctx.TRENDOS_INTEGRITY_RESOLUTION_HEADERS_V1));

propertyValues[ctx.TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1]=planHash;result=ctx.trendosCoreP0RegistryWriteV1();
assert.strictEqual(result.appended,0,'an exact retry must be idempotent');assert.strictEqual(result.alreadyPresent,34);assert.strictEqual(registry.getLastRow(),35);

featureState={master:true,families:{HEALTH:true,ORDER_LINE:true,ATTENDANCE_CLEANING:false,PRESS:false,INVOICE:false,WHATSAPP:false,OPS:false,AUTOMATION:false}};
propertyValues[ctx.TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1]=planHash;
assert.throws(()=>ctx.trendosCoreP0RegistryWriteV1(),/business families OFF/);assert.strictEqual(propertyValues[ctx.TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1],planHash,'flag failure must not consume approval');
featureState={master:true,families:{HEALTH:true,ORDER_LINE:false,ATTENDANCE_CLEANING:false,PRESS:false,INVOICE:false,WHATSAPP:false,OPS:false,AUTOMATION:false}};

delete propertyValues[ctx.TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1];snapshot=makeSnapshot();snapshot.attendance[0].__testEvidenceHash='stale';
assert.throws(()=>ctx.trendosCoreP0RegistryPreviewV1(),/CORE-P0 registry preview failed/);loggedPreview=JSON.parse(previewLogs[previewLogs.length-1]);assert.strictEqual(loggedPreview.success,false);assert.ok(loggedPreview.errors.some(x=>/hash mismatch/.test(x)));
propertyValues[ctx.TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1]=planHash;
assert.throws(()=>ctx.trendosCoreP0RegistryWriteV1(),/live preflight failed/);assert.strictEqual(registry.getLastRow(),35,'stale evidence must not append');assert.strictEqual(propertyValues[ctx.TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1],undefined,'failed live preflight consumes the one-use approval');

snapshot=makeSnapshot();propertyValues[ctx.TRENDOS_CORE_P0_REGISTRY_ROLLBACK_APPROVAL_PROP_V1]=planHash;
result=ctx.trendosCoreP0RegistryRollbackV1();assert.strictEqual(result.success,true);assert.strictEqual(result.appended,34);assert.strictEqual(registry.getLastRow(),69);
const attendanceSpec=ctx.trendosCoreP0RegistrySpecsV1_()[0],attendanceRows=snapshot.attendance.filter(r=>r.employee+'|'+r.date===attendanceSpec.entityKey),attendanceEvidence=ctx.trendosCoreP0RegistryEvidenceV1_(attendanceSpec.metricId,attendanceSpec.entityKey,attendanceRows);
let resolution=ctx.trendosIntegrityResolutionV1_(attendanceSpec.metricId,attendanceSpec.entityKey,attendanceEvidence);
assert.strictEqual(resolution.resolved,false);assert.strictEqual(resolution.deactivated,true,'append-only rollback must deactivate the older active mapping');
propertyValues[ctx.TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1]=planHash;
assert.throws(()=>ctx.trendosCoreP0RegistryWriteV1(),/explicitly inactive/,'writer must not silently reactivate an approved rollback');

spreadsheet=new FakeSpreadsheet();snapshot=makeSnapshot();snapshotCalls=0;
const drifted=makeSnapshot();drifted.lines[0].__testEvidenceHash='post-write-drift';snapshotProvider=()=>snapshotCalls===1?snapshot:drifted;
propertyValues[ctx.TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1]=planHash;
assert.throws(()=>ctx.trendosCoreP0RegistryWriteV1(),/appended mappings were deactivated/);
const driftRegistry=spreadsheet.getSheetByName(ctx.TRENDOS_INTEGRITY_RESOLUTION_SHEET_V1);assert.strictEqual(driftRegistry.getLastRow(),69,'post-write drift must append 34 inactive rollback revisions');
resolution=ctx.trendosIntegrityResolutionV1_(attendanceSpec.metricId,attendanceSpec.entityKey,attendanceEvidence);
assert.strictEqual(resolution.resolved,false);assert.strictEqual(resolution.deactivated,true);

spreadsheet=new FakeSpreadsheet();const bad=spreadsheet.insertSheet(ctx.TRENDOS_INTEGRITY_RESOLUTION_SHEET_V1);bad.getRange(1,1,1,10).setValues([['Wrong',...new Array(9).fill('')]]);snapshot=makeSnapshot();snapshotProvider=()=>snapshot;propertyValues[ctx.TRENDOS_CORE_P0_REGISTRY_WRITE_APPROVAL_PROP_V1]=planHash;
assert.throws(()=>ctx.trendosCoreP0RegistryWriteV1(),/exact 10-header schema/);assert.strictEqual(bad.getLastRow(),1);

assert.ok(!/sk-[A-Za-z0-9_-]{20,}/.test(writer));assert.ok(!/EAA[A-Za-z0-9]{30,}/.test(writer));
console.log('TrendOS CORE-P0 registry writer V1 tests: OK');
