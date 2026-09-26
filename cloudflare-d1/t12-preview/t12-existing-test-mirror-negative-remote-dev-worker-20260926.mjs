/**
 * TEST ONLY / REMOTE BINDING DEV ONLY.
 * This module is intended for "wrangler dev" with a remote=true D1 TEST binding.
 * It is not a deployed Worker route and exposes no positive scenario.
 */
import {
  TEST_ONLY_D1_NAME,
  TEST_ONLY_MIRROR_UUID,
  prepareTestOnlyMirrorCasStatements
} from './t12-existing-test-mirror-packed-cas-qualification-isolated-20260924.mjs';

const ROUTE='/__t12/local/mirror-negative';
const CONFIRM='RUN_NEGATIVE_ROLLBACK_ON_EXISTING_TEST_ONLY';
const NOTE='TrendOS orders live sync V2 quota-aware';
const HEADER='["synthetic_header"]';
const FORMULAS='[""]';
const tabs=Object.freeze([
  Object.freeze({name:'الأوردرات',sheetId:'SYNTHETIC_TEST_MIRROR_9001',
    old:'["SYNTHETIC TEST MIRROR OLD ORDER"]'}),
  Object.freeze({name:'بنود الأوردرات',sheetId:'SYNTHETIC_TEST_MIRROR_9002',
    old:'["SYNTHETIC TEST MIRROR OLD LINE"]'})
]);

function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{
    'content-type':'application/json; charset=utf-8',
    'cache-control':'no-store'
  }});
}
function exactCatalogWhere(){
  return `c.sheet_name=? AND c.sheet_id=? AND c.headers_json=?
    AND c.source_last_row=2 AND c.source_last_col=1 AND c.row_count=2
    AND c.status='ready' AND c.note=?`;
}
function exactRowWhere(){
  return `r.sheet_name=? AND r.row_number=? AND r.values_json=?
    AND r.display_json=? AND r.formulas_json=?`;
}
async function readBaseline(db){
  const sql=`SELECT
    (SELECT COUNT(*) FROM sheet_catalog) AS catalog_rows,
    (SELECT COUNT(*) FROM sheet_rows) AS mirror_rows,
    (SELECT COUNT(*) FROM sheet_migration_runs) AS migration_rows,
    (SELECT COUNT(*) FROM t12_synth_control
      WHERE singleton=1 AND fixture_marker='T12_SYNTHETIC_ONLY') AS control_matches,
    (SELECT COUNT(*) FROM sheet_catalog c WHERE
      (${exactCatalogWhere()}) OR (${exactCatalogWhere()})
    ) AS exact_catalog_rows,
    (SELECT COUNT(*) FROM sheet_rows r WHERE
      (${exactRowWhere()}) OR (${exactRowWhere()}) OR
      (${exactRowWhere()}) OR (${exactRowWhere()})
    ) AS exact_mirror_rows`;
  const args=[
    tabs[0].name,tabs[0].sheetId,HEADER,NOTE,
    tabs[1].name,tabs[1].sheetId,HEADER,NOTE,
    tabs[0].name,1,HEADER,HEADER,FORMULAS,
    tabs[0].name,2,tabs[0].old,tabs[0].old,FORMULAS,
    tabs[1].name,1,HEADER,HEADER,FORMULAS,
    tabs[1].name,2,tabs[1].old,tabs[1].old,FORMULAS
  ];
  const r=await db.prepare(sql).bind(...args).first();
  const out={
    catalogRows:Number(r?.catalog_rows||0),
    mirrorRows:Number(r?.mirror_rows||0),
    migrationRows:Number(r?.migration_rows||0),
    controlMatches:Number(r?.control_matches||0),
    exactCatalogRows:Number(r?.exact_catalog_rows||0),
    exactMirrorRows:Number(r?.exact_mirror_rows||0)
  };
  out.exact=out.catalogRows===2&&out.mirrorRows===4&&out.migrationRows===0&&
    out.controlMatches===1&&out.exactCatalogRows===2&&out.exactMirrorRows===4;
  return out;
}
function basePayload(baseline){
  return {
    syntheticOnly:true,
    productionAuthorized:false,
    positiveAuthorized:false,
    testDatabaseName:TEST_ONLY_D1_NAME,
    expectedTestDatabaseUuid:TEST_ONLY_MIRROR_UUID,
    identityVerifiedByWorker:false,
    baseline
  };
}
export async function handleNegativeRemoteDev(request,env={}){
  const url=new URL(request.url);
  if(url.pathname!==ROUTE)return json({success:false,code:'not-found'},404);
  const db=env.T12_SYNTHETIC_DB;
  if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')
    return json({success:false,code:'test-d1-binding-missing'},503);
  let before;
  try{before=await readBaseline(db);}
  catch{return json({success:false,code:'baseline-read-failed'},503);}
  if(request.method==='GET')return json({success:true,...basePayload(before)},200);
  if(request.method!=='POST')return json({success:false,code:'post-only'},405);
  if(!before.exact)
    return json({success:false,code:'baseline-mismatch-no-write',...basePayload(before)},409);
  let body;
  try{body=await request.json();}catch{return json({success:false,code:'invalid-json'},400);}
  if(!body||Object.keys(body).sort().join(',')!=='confirmation,scenario'||
     body.scenario!=='negative-conflict'||body.confirmation!==CONFIRM)
    return json({success:false,code:'negative-confirmation-required'},400);
  const plan=prepareTestOnlyMirrorCasStatements(db,'negative-conflict');
  if(plan.statementCount!==5)return json({success:false,code:'plan-contract-mismatch'},503);
  try{
    await db.batch(plan.statements);
    let after=null;try{after=await readBaseline(db);}catch{}
    return json({success:false,code:'negative-batch-unexpectedly-resolved-no-retry',
      ...basePayload(after)},500);
  }catch(error){
    let after;
    try{after=await readBaseline(db);}
    catch{return json({success:false,code:'postflight-read-failed-no-retry'},503);}
    const expectedConstraint=/NOT NULL|SQLITE_CONSTRAINT|constraint/i.test(
      String(error?.message||error||''));
    if(expectedConstraint&&after.exact){
      return json({
        success:true,
        scenario:'negative-conflict',
        negativeRollbackVerified:true,
        expectedConstraintObserved:true,
        blindRetryAllowed:false,
        ...basePayload(after)
      },200);
    }
    return json({
      success:false,
      code:'negative-outcome-unqualified-no-retry',
      expectedConstraintObserved:expectedConstraint,
      ...basePayload(after)
    },503);
  }
}
export default {fetch:handleNegativeRemoteDev};
