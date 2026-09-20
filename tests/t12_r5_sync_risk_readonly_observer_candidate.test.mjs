import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const path='cloudflare-d1/t12-preview/t12-r5-sync-risk-readonly-observer-candidate.gs';
const src=fs.readFileSync(path,'utf8');
assert.match(src,/function trendosR5SyncRiskReadOnlyObserverCandidate20260920\(/);
for(const bad of [/\.setProperty\s*\(/,/\.deleteProperty\s*\(/,
  /\.newTrigger\s*\(/,/\.deleteTrigger\s*\(/,
  /d1FullPost_\s*\(/,/\.setValues?\s*\(/,/\.appendRow\s*\(/,
  /MailApp\./,/GmailApp\./])assert.doesNotMatch(src,bad,'observer must not mutate production');

function run({triggers=['trendosR5PeriodicOrdersTick20260920'],source=[643,699],
  remote=[641,697],statuses=['ready','ready'],sheetIds=[11,12],\n  remoteIds=[11,12],sourceCols=[16,18],remoteCols=[16,18],\n  catalogLastRows=[641,697],notes=['TrendOS orders live sync V2 quota-aware',\n    'TrendOS orders live sync V2 quota-aware']}={}){
  const logs=[];
  const names=['الأوردرات','بنود الأوردرات'];
  const wb={
    getId:()=> '1PtsjF4oHfk__R8XheYjqlo3Rt1269rot6Q0hCU9_6bI',
    getSheetByName(name){
      const i=names.indexOf(name);
      return i<0?null:{getLastRow:()=>source[i],\n        getSheetId:()=>sheetIds[i],getLastColumn:()=>sourceCols[i]};
    }
  };
  const api={
    ScriptApp:{
      getProjectTriggers(){return triggers.map(fn=>({getHandlerFunction:()=>fn}));},
      deleteTrigger(){throw Error('FORBIDDEN')},newTrigger(){throw Error('FORBIDDEN')}
    },
    d1FullSpreadsheet_:()=>wb,
    d1FullGet_(url){
      assert.equal(url,'/v1/mirror/sheets');
      return {success:true,sheets:names.map((name,i)=>({
        sheetName:name,rowCount:remote[i],sourceLastRow:catalogLastRows[i],\n        sourceLastCol:remoteCols[i],sheetId:remoteIds[i],note:notes[i],\n        status:statuses[i]
      }))};
    },
    Logger:{log:x=>logs.push(x)}
  };
  vm.createContext(api);vm.runInContext(src,api,{filename:path});
  const result=api.trendosR5SyncRiskReadOnlyObserverCandidate20260920();
  assert.equal(result.mutationPerformed,false);
  assert.equal(result.workerPostPerformed,false);
  assert.equal(result.latestTickExecutionStatusVerified,false);
  assert.equal(result.fullRowParityVerified,false);
  assert.equal(result.quotaBytesMeasured,false);\n  assert.equal(result.existingRowContentOrMax64CandidateCountVerified,false);
  assert.doesNotMatch(logs.join(''),/customer|phone|secret/i);
  return result;
}
{
  const r=run();
  assert.equal(r.earlyWarning,false,'2-row lag may clear at next scheduled tick');
  assert.equal(r.r5TriggerCount,1);
  assert.deepEqual([...r.tabCounts.map(x=>x.deltaRows)],[2,2]);
}
{
  const r=run({source:[646,705],remote:[640,699]});
  assert.equal(r.earlyWarning,true);
  assert.equal(r.tabCounts[0].growthBeyondR5Five,true);
  assert.equal(r.tabCounts[1].growthBeyondR5Five,true);
  assert.ok(r.riskCodes.includes('R5_GROWTH_OVER_FIVE_0'));
  assert.ok(r.riskCodes.includes('R5_GROWTH_OVER_FIVE_1'));
}
{
  const r=run({triggers:[]});
  assert.equal(r.earlyWarning,true);
  assert.ok(r.riskCodes.includes('R5_TRIGGER_COUNT_NOT_ONE'));
}
{
  const r=run({triggers:['trendosR5PeriodicOrdersTick20260920',
    'd1OrdersLiveSyncTickV2']});
  assert.ok(r.riskCodes.includes('LEGACY_SYNC_TRIGGER_ACTIVE'));
}
{
  const r=run({statuses:['ready','error']});
  assert.ok(r.riskCodes.includes('R5_D1_TAB_NOT_READY_1'));
}
{
  const r=run({source:[639,695],remote:[641,697]});
  assert.ok(r.riskCodes.includes('R5_D1_ROWS_EXCEED_SOURCE_0'));
}
{
  const r=run({remoteIds:[99,12]});
  assert.ok(r.riskCodes.includes('R5_SOURCE_SHEET_ID_MISMATCH_0'));
}
{
  const r=run({sourceCols:[17,18]});
  assert.ok(r.riskCodes.includes('R5_SOURCE_COLUMN_DRIFT_0'));
}
{
  const r=run({catalogLastRows:[640,697]});
  assert.ok(r.riskCodes.includes('R5_D1_CATALOG_SHAPE_0'));
}
{
  const r=run({notes:['unexpected','TrendOS orders live sync V2 quota-aware']});
  assert.ok(r.riskCodes.includes('R5_D1_EXPECTED_NOTE_MISMATCH_0'));
}
console.log('R5 observer isolated PASS: trigger missing, growth >5, source/D1 identity, columns, note and catalog drift, legacy conflict warning, zero writes, no false parity claim');
