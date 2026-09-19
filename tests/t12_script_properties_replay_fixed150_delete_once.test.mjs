import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-script-properties-replay-fixed150-delete-once.gs', import.meta.url),'utf8');
assert.match(source, /function trendosReplayFixed150DeleteOnce20260919\(/);
for(const q of [/originals\.length === 150/,/uniqueOrderCount !== 119/,/source\.getProperty\(rec\.key\) !== rec\.value/,/source\.deleteProperty\(rec\.key\)/,/attemptedDeletes === 150 && postMissing === 150/,/authoritativeOrderParityPass = true/,/backup\.records\.length !== 150/,/backup\.format !== 'TRENDOS_R2_REPLAY_PRIVATE_BACKUP_V1'/])assert.match(source,q);
for(const forbidden of [
  /\.setProperty\s*\(/,/\.setProperties\s*\(/,/\.deleteAllProperties\s*\(/,
  /\.createFile\s*\(/,/\.setTrashed\s*\(/,/\.setValues\s*\(/,
  /Logger\.log\s*\(\s*(?:rec|backup|file|ids|originals|source)\s*\)/,
  /Logger\.log\s*\(\s*JSON\.stringify\(\s*(?:rec|backup|file|ids|originals)/
])assert.equal(forbidden.test(source),false,'Only exact backed-up replay records may be deleted: '+forbidden);
assert.equal((source.match(/source\.deleteProperty\(rec\.key\)/g)||[]).length,1);
assert.equal((source.match(/Logger\.log\s*\(/g)||[]).length,1);
const now=Date.now(), old=now-10*24*60*60*1000;
const fixture=(opts={})=>{
  const records = Array.from({length:150},(_,i)=>{
    const key='TRENDOS_CREATE_ORDER_V1908_co_'+String(old)+'_'+String(i);
    return {key,value:JSON.stringify({success:true,orderId:String(i%119+1),savedAt:new Date(old).toISOString()})};
  });
  const backup={format:'TRENDOS_R2_REPLAY_PRIVATE_BACKUP_V1',records};
  const properties=new Map(records.map(x=>[x.key,x.value]));
  properties.set('D1_ORDERS_LIVE_SYNC_V2_BASELINE_0','MUST_PRESERVE');
  properties.set('AUTH_PASSWORD_PEPPER','MUST_PRESERVE');
  properties.set('TRENDOS_NEXT_SIMPLE_ORDER_NO','MUST_PRESERVE');
  if(opts.mismatch) properties.set(records[12].key,'different');
  let deleted=[],logs=[], released=0;
  const file={
    getName:()=> 'TRENDOS_R2_PRIVATE_REPLAY_BACKUP_20260919_test.json',
    getSharingAccess:()=> 'PRIVATE',
    getEditors:()=> [],getViewers:()=> [],
    getBlob:()=>({getDataAsString:()=>JSON.stringify(backup)})
  };
  const items=[file];
  const sheet=(name)=>{
    if(opts.missingSummary&&name==='الأوردرات')return null;
    if(name.indexOf('أرشيف')===0)return null;
    const ids=Array.from({length:119},(_,i)=>[String(i+1)]);
    return {getLastColumn:()=>1,getLastRow:()=>ids.length+1,
      getRange:(row,col,n)=>({getDisplayValues:()=>row===1?[['رقم الأوردر']]:ids})};
  };
  const sandbox={
    LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{released++}})},
    PropertiesService:{getScriptProperties:()=>({
      getProperty:k=>properties.has(k)?properties.get(k):null,
      deleteProperty:k=>{
        if(opts.failAt && deleted.length===opts.failAt)throw Error('deliberate test delete error');
        deleted.push(k);properties.delete(k);
      }
    })},
    DriveApp:{Access:{PRIVATE:'PRIVATE'},getRootFolder:()=>({getFiles:()=>{
      let i=0;return {hasNext:()=>i<items.length,next:()=>items[i++]};
    }})},
    ss_:()=>({getName:()=> 'TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY',getSheetByName:sheet}),
    Logger:{log:txt=>logs.push(txt)},
  };
  vm.runInNewContext(source,sandbox);
  const run=()=>JSON.parse(JSON.stringify(sandbox.trendosReplayFixed150DeleteOnce20260919()));
  return {run,properties,records,deleted,logs,released:()=>released};
};
{
  const f=fixture(), res=f.run();
  assert.equal(res.success,true);
  assert.equal(res.backedUpRecordCount,150);
  assert.equal(res.uniqueOrderCount,119);
  assert.equal(res.confirmedMissingAfterRun,150);
  assert.equal(f.deleted.length,150);
  assert.equal(new Set(f.deleted).size,150);
  assert(f.deleted.every(k=>k.startsWith('TRENDOS_CREATE_ORDER_V1908_co_')));
  for(const k of ['D1_ORDERS_LIVE_SYNC_V2_BASELINE_0','AUTH_PASSWORD_PEPPER','TRENDOS_NEXT_SIMPLE_ORDER_NO'])assert.equal(f.properties.get(k),'MUST_PRESERVE');
  assert.equal(f.released(),1);
  assert(!f.logs[0].includes(f.records[0].key));
}
{
  const f=fixture({mismatch:true}),res=f.run();
  assert.equal(res.success,false);assert.equal(f.deleted.length,0);
  assert.equal(res.errorCode,'R2_DELETE_ABORT_CURRENT_REPLAY_MISSING_OR_CHANGED');
}
{
  const f=fixture({missingSummary:true}),res=f.run();
  assert.equal(res.success,false);assert.equal(f.deleted.length,0);
  assert.equal(res.errorCode,'R2_DELETE_ABORT_REQUIRED_SHEET_MISSING');
}
{
  const f=fixture({failAt:9}),res=f.run();
  assert.equal(res.success,false);assert.equal(f.deleted.length,9);
  assert.equal(res.errorCode,'R2_DELETE_PARTIAL_OR_UNCERTAIN_CHECK_AUDIT_NO_RETRY');
  const again=f.run();
  assert.equal(again.success,false);assert.equal(f.deleted.length,9);
  assert.equal(again.errorCode,'R2_DELETE_ABORT_CURRENT_REPLAY_MISSING_OR_CHANGED');
}
console.log('TrendOS R2 fixed150 delete mocked tests PASS: exact 150 and 119 orders; foreign keys preserved; mismatch/sheet/partial fail closed.');
