import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';

const script=fs.readFileSync(new URL('../cloudflare-d1/t12-preview/t12-d1-mirror-baseline-lineage-readonly-20260919.gs',import.meta.url),'utf8');
const sha=x=>crypto.createHash('sha256').update(String(x),'utf8').digest('hex');
const names=['الأوردرات','بنود الأوردرات'];
const data=names.map((sheetName,index)=>{
  const sheetId=index+11;
  const rows=[1,2].map(i=>({rowNumber:i,values:[sheetName,i],display:[sheetName,String(i)],formulas:['','']}));
  const snapshot={sheetName,sheetId,sourceLastRow:2,sourceLastCol:2,headers:['name','id'],rows};
  const hash=sha(JSON.stringify(snapshot));
  return {snapshot,hash,cat:{sheetName,sheetId,sourceLastRow:2,sourceLastCol:2,rowCount:2,status:'ready',note:'TrendOS orders live sync V2 quota-aware',syncedAt:'t'}};
});
const fingerprint=sha(JSON.stringify(data.map(({snapshot,hash})=>({sheetName:snapshot.sheetName,sourceLastRow:2,sourceLastCol:2,hash}))));
function run({changeUnindexed=false,badFingerprint=false,duplicateIndex=false}={}){
  const sheets=data.map(({snapshot,hash},i)=>({
    sheetName:snapshot.sheetName,sourceLastRow:2,sourceLastCol:2,rowCount:2,hash,
    rowHashes:i===1?[[1,sha(JSON.stringify(snapshot.rows[0]))]]:snapshot.rows.map(x=>[x.rowNumber,sha(JSON.stringify(x))])
  }));
  if(duplicateIndex)sheets[1].rowHashes.push(sheets[1].rowHashes[0]);
  const baseline={version:2,savedAt:'t',fingerprint:badFingerprint?'f'.repeat(64):fingerprint,sheets};
  const logs=[],paths=[];
  const env={
    PropertiesService:{getScriptProperties(){return {}}},
    d1OrdersLiveSyncV2LoadBaseline_(){return baseline;},
    d1OrdersLiveSyncV2DigestHex_:sha,
    d1FullGet_(path){
      paths.push(path);
      if(path==='/v1/mirror/sheets')return {success:true,sheets:data.map(x=>x.cat)};
      const name=decodeURIComponent(path.match(/name=([^&]+)/)[1]);
      const item=data.find(x=>x.snapshot.sheetName===name);
      const rows=item.snapshot.rows.map(row=>({...row,values:[...row.values],display:[...row.display],formulas:[...row.formulas]}));
      if(changeUnindexed && name==='بنود الأوردرات')rows[1].values[1]=999;
      return {success:true,sheet:{...item.cat,headers:item.snapshot.headers,offset:0,limit:200,rows}};
    },
    Logger:{log(v){logs.push(JSON.parse(v));}}
  };
  vm.runInNewContext(script,env);
  let result,err;
  try{result=env.trendosD1MirrorBaselineLineageReadOnly20260919()}catch(e){err=String(e.message)}
  return {result,err,logs,paths};
}
const ok=run();
assert.equal(ok.err,undefined);
assert.equal(ok.result.allMirrorRowsMatchLocalBaseline,true);
assert.equal(ok.result.tabs[1].baselineRows,2);
assert.equal(ok.result.tabs[1].indexedBaselineRows,1);
assert.equal(ok.result.tabs[1].baselineRowsWithoutStoredHash,1);
assert.equal(ok.result.tabs[1].rowsWithoutStoredHashInRemote,1);
assert.equal(ok.result.tabs[1].sparseIndexCoveredByFullSnapshotHash,true);
assert.equal(ok.result.deltaExecutionAuthorizedByThisAudit,false);
assert.equal(ok.result.triggerRestartAuthorizedByThisAudit,false);
assert.equal(ok.logs.length,1);
assert.equal(JSON.stringify(ok.logs[0]).includes('بنود الأوردرات'),false);
assert.equal(ok.paths.length,4);
const changed=run({changeUnindexed:true});
assert.equal(changed.result.allMirrorRowsMatchLocalBaseline,false);
assert.equal(changed.result.tabs[1].mismatchedRowHashes,0);
assert.equal(changed.result.tabs[1].fullSheetSnapshotHashMatch,false);
assert.equal(changed.result.tabs[1].sparseIndexCoveredByFullSnapshotHash,false);
const badCombined=run({badFingerprint:true});
assert.equal(badCombined.result.tabs.every(x=>x.fullSheetSnapshotHashMatch),true);
assert.equal(badCombined.result.allMirrorRowsMatchLocalBaseline,false);
const dup=run({duplicateIndex:true});
assert.equal(dup.err,'R4_G1_ABORT_BASELINE_HASHES_INVALID');
console.log('TrendOS R4 G1 sparse-index lineage PASS: exact full snapshot required; uncovered-row drift, combined hash mismatch and duplicate index fail closed.');
