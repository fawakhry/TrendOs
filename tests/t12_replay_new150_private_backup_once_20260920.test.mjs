import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const filename='cloudflare-d1/t12-preview/t12-replay-new150-private-backup-once-20260920.gs';
const src=fs.readFileSync(filename,'utf8');
assert.match(src,/function trendosReplayNew150PrivateBackupOnce20260920\(/);
for (const forbidden of [
  /\.setProperty\s*\(/, /\.deleteProperty\s*\(/, /\.deleteTrigger\s*\(/,
  /\.setValues?\s*\(/, /\.appendRow\s*\(/, /\.setTrashed\s*\(/,
  /d1FullPost_\s*\(/,
]) assert.doesNotMatch(src,forbidden,'backup candidate may not mutate business data/properties/triggers');

const day=24*60*60*1000;
function fixture(mode='ok') {
  const now=Date.now(), keys=[], values=new Map();
  function add(j,age,pad='') {
    const at=now-age*day-j*1000;
    const key='TRENDOS_CREATE_ORDER_V1908_co_'+at+'_test_'+j;
    const savedAt=new Date(at).toISOString();
    const orderId=j<150?'ORD-'+(j%112):'ORD-EXTRA-'+j;
    const val=JSON.stringify({success:true,orderId,savedAt,pad});
    keys.push(key); values.set(key,val); return key;
  }
  for(let j=0;j<447;j++)add(j,j<150?9:8);
  for(let j=447;j<541;j++)add(j,0.02);
  function bytes(){return keys.slice(0,150).reduce((n,k)=>n+Buffer.byteLength(k,'utf8')+Buffer.byteLength(values.get(k),'utf8'),0)}
  const diff=98763-bytes();
  assert.ok(diff>0,'synthetic fixtures expected under 98,763 bytes before padding');
  const last=keys[149],parsed=JSON.parse(values.get(last));
  parsed.pad='x'.repeat(diff);
  values.set(last,JSON.stringify(parsed));
  assert.equal(bytes(),98763);

  const log=[],created=[],rootFiles=[],reads=new Map();
  if(mode==='alreadyExists')rootFiles.push({getName:()=> 'TRENDOS_R5_NEW150_PRIVATE_REPLAY_BACKUP_20260920_old.json'});
  const DriveApp={
    Access:{PRIVATE:'PRIVATE',ANYONE:'ANYONE'},
    getRootFolder(){return {getFiles(){let p=0;return {hasNext(){return p<rootFiles.length},next(){return rootFiles[p++]}}}}},
    createFile(name,data,mime){
      created.push({name,data,mime});
      return {
        getSharingAccess(){return mode==='publicFile'?'ANYONE':'PRIVATE'},
        getEditors(){return []},getViewers(){return []},
        getBlob(){return {getDataAsString(){return mode==='badReadback'?data+'wrong':data}}}
      };
    }
  };
  const props={
    getKeys(){return [...keys]},
    getProperty(k){
      const n=(reads.get(k)||0)+1;reads.set(k,n);
      if(mode==='propertyDrift' && k===last && n>=2)return values.get(k)+'changed';
      return values.get(k)??null;
    },
    setProperty(){throw Error('property write forbidden')},
    deleteProperty(){throw Error('property delete forbidden')}
  };
  let lockReleased=0,locked=false;
  const scope={
    trendosReplayNew150CohortSheetPreflightReadOnly20260920(){
      if(mode==='failedPreflight')return {sheetPresencePass:false};
      return {sheetPresencePass:true,deletionAuthorized:false,proposedCohortCount:150,
        uniqueBusinessOrderCount:112,verifiedOrderAndLinesIdCount:112,proposedCohortBytesApprox:98763};
    },
    LockService:{getScriptLock(){return {
      tryLock(){if(mode==='busy')return false;locked=true;return true},
      releaseLock(){if(locked)lockReleased++}
    }}},
    PropertiesService:{getScriptProperties(){return props}},
    DriveApp,MimeType:{PLAIN_TEXT:'text/plain'},
    Utilities:{newBlob(s){return {getBytes(){return [...Buffer.from(s,'utf8')]}}},
      formatDate(){return '20260920_132000'},getUuid(){return 'fixture-uuid'}},
    Logger:{log(v){log.push(v)}}
  };
  const ctx=vm.createContext(scope);
  vm.runInContext(src,ctx,{filename});
  return {run(){return ctx.trendosReplayNew150PrivateBackupOnce20260920()},
    created,log,getLockReleased(){return lockReleased}};
}
{
  const s=fixture(),r=s.run();
  assert.equal(s.created.length,1);
  assert.equal(r.backupCreated,true);
  assert.equal(r.backupAccessPrivate,true);
  assert.equal(r.exactReadbackVerified,true);
  assert.equal(r.backedUpRecordCount,150);
  assert.equal(r.uniqueBusinessOrderCount,112);
  assert.equal(r.selectedBytesApprox,98763);
  assert.equal(r.replayPropertiesDeleted,0);
  assert.equal(r.deletionAuthorized,false);
  assert.equal(r.automaticRetryAllowed,false);
  assert.equal(s.getLockReleased(),1);
  const raw=JSON.parse(s.created[0].data);
  assert.equal(raw.records.length,150);
  assert.equal(raw.deletionAuthorized,false);
  assert.equal(raw.format,'TRENDOS_R5_NEW150_PRIVATE_REPLAY_BACKUP_V1');
  const exposed=JSON.stringify(s.log);
  assert.doesNotMatch(exposed, /ORD-|_test_|fixture-uuid|TRENDOS_R5_NEW150_PRIVATE_REPLAY_BACKUP_20260920_/);
}
for(const [mode,expectedCount,re] of [
  ['failedPreflight',0,/NEW150_BACKUP_ABORT_PREFLIGHT_NOT_EXACT_CHECKPOINT/],
  ['busy',0,/NEW150_BACKUP_ABORT_LOCK_BUSY_NO_RETRY/],
  ['alreadyExists',0,/NEW150_BACKUP_ABORT_EXISTS_NO_RETRY/],
  ['propertyDrift',0,/NEW150_BACKUP_ABORT_PROPERTY_DRIFT_NO_RETRY/],
  ['publicFile',1,/NEW150_BACKUP_ABORT_UNEXPECTED_SHARING_DO_NOT_RETRY/],
  ['badReadback',1,/NEW150_BACKUP_ABORT_READBACK_MISMATCH_DO_NOT_RETRY/],
]){
  const s=fixture(mode);
  assert.throws(s.run,re);
  assert.equal(s.created.length,expectedCount,'unexpected persistent backup-file creation for '+mode);
}
console.log('NEW150 private backup isolated tests PASS: exact checkpoint, private readback, no replay/property deletion, existing-file and drift fail-closed');
