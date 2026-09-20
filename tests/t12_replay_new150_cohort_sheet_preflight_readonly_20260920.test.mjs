import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const path = 'cloudflare-d1/t12-preview/t12-replay-new150-cohort-sheet-preflight-readonly-20260920.gs';
const src = fs.readFileSync(path, 'utf8');
assert.match(src, /function trendosReplayNew150CohortSheetPreflightReadOnly20260920\(/);
for (const banned of [
  /\.setProperty\s*\(/, /\.deleteProperty\s*\(/,
  /\.setValues?\s*\(/, /\.appendRow\s*\(/,
  /\.createFile\s*\(/, /\.setTrashed\s*\(/,
  /\.newTrigger\s*\(/, /\.deleteTrigger\s*\(/,
  /d1FullPost_\s*\(/,
]) assert.doesNotMatch(src, banned, 'read-only preflight must have no mutation path');

const day = 24*3600*1000;
function make(variant='ok') {
  const now=Date.now(), props=new Map(), ids=[];
  for (let j=0;j<150;j++) {
    const ms=now-9*day-j*1000;
    const key='TRENDOS_CREATE_ORDER_V1908_co_'+ms+'_test_'+j;
    const id='ORD-'+j;
    ids.push(id);
    props.set(key,JSON.stringify({success:true,orderId:id,savedAt:new Date(ms).toISOString()}));
  }
  for(let j=0;j<10;j++){
    const ms=now-3600000-j*1000;
    const key='TRENDOS_CREATE_ORDER_V1908_co_'+ms+'_recent_'+j;
    props.set(key,JSON.stringify({success:true,orderId:'NEW-'+j,savedAt:new Date(ms).toISOString()}));
  }
  let removed=false, unlocks=0, logs=[], propertyReads=Object.create(null);
  const sheet=(name,rows)=>({
    getLastColumn(){return 1},
    getLastRow(){return rows.length+1},
    getRange(r,c,num,columns){
      assert.equal(c,1);assert.equal(columns,1);
      if(r===1){assert.equal(num,1);return {getDisplayValues:()=>[['رقم الأوردر']]}}
      assert.equal(r,2);assert.equal(num,rows.length);
      return {getDisplayValues:()=>rows.map(id=>[id])};
    }
  });
  const lines=variant==='missingLine'?ids.slice(1):ids;
  const ss={
    getId:()=>variant==='wrongWorkbook'?'WRONG':'1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI',
    getName:()=> 'TrendOS_Operations_CLEAN_START_CUSTOMERS_ONLY',
    getSheetByName(name){
      if(name==='الأوردرات')return sheet(name,ids);
      if(name==='بنود الأوردرات')return variant==='missingRequired'?null:sheet(name,lines);
      return null;
    }
  };
  const api={
    LockService:{getScriptLock(){return {
      tryLock(){return variant!=='busy'}, releaseLock(){unlocks++}
    }}},
    PropertiesService:{getScriptProperties(){return {
      getKeys:()=>[...props.keys()],
      getProperty(key){
        propertyReads[key]=(propertyReads[key]||0)+1;
        if(variant==='drift' && key.includes('_test_149') && propertyReads[key]>1)
          return props.get(key)+'changed';
        return props.get(key)??null;
      },
      setProperty(){throw Error('mutation forbidden')},
      deleteProperty(){throw Error('mutation forbidden')}
    }}},
    Utilities:{newBlob(s){return {getBytes(){return [...Buffer.from(s,'utf8')]}}}},
    ss_:()=>ss,
    Logger:{log(x){logs.push(x)}}
  };
  const ctx=vm.createContext(api);
  vm.runInContext(src,ctx,{filename:path});
  return {run:()=>ctx.trendosReplayNew150CohortSheetPreflightReadOnly20260920(),
    getLogs:()=>logs,getUnlocks:()=>unlocks};
}
{
  const p=make('ok'),r=p.run();
  assert.equal(r.mutationPerformed,false);
  assert.equal(r.backupCreated,false);
  assert.equal(r.deletionPerformed,false);
  assert.equal(r.totalEligible,150);
  assert.equal(r.proposedCohortCount,150);
  assert.equal(r.uniqueBusinessOrderCount,150);
  assert.equal(r.verifiedOrderAndLinesIdCount,150);
  assert.equal(r.missingSummaryCount,0);
  assert.equal(r.missingLinesCount,0);
  assert.equal(r.exactCohortCurrentValuesStable,true);
  assert.equal(r.sheetPresencePass,true);
  assert.equal(r.oldRequestReplayStillUnsafeAfterDeletion,true);
  assert.equal(r.deletionAuthorized,false);
  assert.equal(r.skipped.notOldEnough,10);
  assert.ok(r.proposedCohortBytesApprox>0);
  assert.equal(p.getUnlocks(),1);
  const log=p.getLogs().join('');
  assert.doesNotMatch(log,/ORD-|_test_|savedAt|customerPhone/);
}
{
  const r=make('missingLine').run();
  assert.equal(r.missingLinesCount,1);
  assert.equal(r.sheetPresencePass,false);
  assert.equal(r.deletionAuthorized,false);
}
{
  const r=make('drift').run();
  assert.equal(r.exactCohortCurrentValuesStable,false);
  assert.equal(r.sheetPresencePass,false);
}
{
  const r=make('missingRequired').run();
  assert.equal(r.requiredSourceMissingCount,1);
  assert.equal(r.sheetPresencePass,false);
}
{
  const p=make('wrongWorkbook');
  assert.throws(p.run,/REPLAY_PREFLIGHT_WRONG_WORKBOOK/);
  assert.equal(p.getUnlocks(),1);
}
{
  const p=make('busy');
  assert.throws(p.run,/REPLAY_PREFLIGHT_LOCK_BUSY_NO_RETRY/);
  assert.equal(p.getUnlocks(),0);
}
console.log('New150 isolated read-only replay cohort preflight PASS: no writes, 150 source order/lines, missing/drift/identity/lock fail-closed, no IDs logged');
