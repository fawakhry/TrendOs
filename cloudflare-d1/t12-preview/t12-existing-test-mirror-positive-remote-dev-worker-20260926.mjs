/**
 * TEST ONLY / REMOTE BINDING DEV ONLY.
 * Positive tiny two-tab mirror CAS qualification. No production route/deploy.
 */
import {
  TEST_ONLY_D1_NAME,
  TEST_ONLY_MIRROR_UUID,
  prepareTestOnlyMirrorCasStatements
} from './t12-existing-test-mirror-packed-cas-qualification-isolated-20260924.mjs';

const ROUTE='/__t12/local/mirror-positive';
const CONFIRM='RUN_POSITIVE_ON_EXISTING_TEST_ONLY';
const NOTE='TrendOS orders live sync V2 quota-aware';
const HEADER='["synthetic_header"]';
const FORMULAS='[""]';
const tabs=Object.freeze([
  Object.freeze({name:'الأوردرات',sheetId:'SYNTHETIC_TEST_MIRROR_9001',
    old:'["SYNTHETIC TEST MIRROR OLD ORDER"]',
    next:'["SYNTHETIC TEST MIRROR NEW ORDER"]'}),
  Object.freeze({name:'بنود الأوردرات',sheetId:'SYNTHETIC_TEST_MIRROR_9002',
    old:'["SYNTHETIC TEST MIRROR OLD LINE"]',
    next:'["SYNTHETIC TEST MIRROR NEW LINE"]'})
]);
function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{
    'content-type':'application/json; charset=utf-8','cache-control':'no-store'
  }});
}
function catalogWhere(){
  return `c.sheet_name=? AND c.sheet_id=? AND c.headers_json=?
    AND c.source_last_row=2 AND c.source_last_col=1 AND c.row_count=2
    AND c.status='ready' AND c.note=?`;
}
function rowWhere(){
  return `r.sheet_name=? AND r.row_number=? AND r.values_json=?
    AND r.display_json=? AND r.formulas_json=?`;
}
async function readState(db){
  const sql=`SELECT
    (SELECT COUNT(*) FROM sheet_catalog) AS catalog_rows,
    (SELECT COUNT(*) FROM sheet_rows) AS mirror_rows,
    (SELECT COUNT(*) FROM sheet_migration_runs) AS migration_rows,
    (SELECT COUNT(*) FROM t12_synth_control
      WHERE singleton=1 AND fixture_marker='T12_SYNTHETIC_ONLY') AS control_matches,
    (SELECT COUNT(*) FROM sheet_catalog c WHERE
      (${catalogWhere()}) OR (${catalogWhere()})
    ) AS exact_catalog_rows,
    (SELECT COUNT(*) FROM sheet_rows r WHERE
      (${rowWhere()}) OR (${rowWhere()})
    ) AS exact_header_rows,
    (SELECT COUNT(*) FROM sheet_rows r WHERE
      (${rowWhere()}) OR (${rowWhere()})
    ) AS exact_old_rows,
    (SELECT COUNT(*) FROM sheet_rows r WHERE
      (${rowWhere()}) OR (${rowWhere()})
    ) AS exact_new_rows`;
  const args=[
    tabs[0].name,tabs[0].sheetId,HEADER,NOTE,
    tabs[1].name,tabs[1].sheetId,HEADER,NOTE,
    tabs[0].name,1,HEADER,HEADER,FORMULAS,
    tabs[1].name,1,HEADER,HEADER,FORMULAS,
    tabs[0].name,2,tabs[0].old,tabs[0].old,FORMULAS,
    tabs[1].name,2,tabs[1].old,tabs[1].old,FORMULAS,
    tabs[0].name,2,tabs[0].next,tabs[0].next,FORMULAS,
    tabs[1].name,2,tabs[1].next,tabs[1].next,FORMULAS
  ];
  const r=await db.prepare(sql).bind(...args).first();
  const out={
    catalogRows:Number(r?.catalog_rows||0),
    mirrorRows:Number(r?.mirror_rows||0),
    migrationRows:Number(r?.migration_rows||0),
    controlMatches:Number(r?.control_matches||0),
    exactCatalogRows:Number(r?.exact_catalog_rows||0),
    exactHeaderRows:Number(r?.exact_header_rows||0),
    exactOldRows:Number(r?.exact_old_rows||0),
    exactNewRows:Number(r?.exact_new_rows||0)
  };
  out.baseExact=out.catalogRows===2&&out.mirrorRows===4&&out.migrationRows===0&&
    out.controlMatches===1&&out.exactCatalogRows===2&&out.exactHeaderRows===2;
  out.state=out.baseExact&&out.exactOldRows===2&&out.exactNewRows===0?'OLD':
    out.baseExact&&out.exactOldRows===0&&out.exactNewRows===2?'NEW':'MISMATCH';
  return out;
}
function base(state){
  return {syntheticOnly:true,productionAuthorized:false,
    testDatabaseName:TEST_ONLY_D1_NAME,
    expectedTestDatabaseUuid:TEST_ONLY_MIRROR_UUID,state};
}
export async function handlePositiveRemoteDev(request,env={}){
  if(new URL(request.url).pathname!==ROUTE)
    return json({success:false,code:'not-found'},404);
  const db=env.T12_SYNTHETIC_DB;
  if(!db||typeof db.prepare!=='function'||typeof db.batch!=='function')
    return json({success:false,code:'test-d1-binding-missing'},503);
  let before;
  try{before=await readState(db);}
  catch{return json({success:false,code:'state-read-failed'},503);}
  if(request.method==='GET')return json({success:true,...base(before)},200);
  if(request.method!=='POST')return json({success:false,code:'post-only'},405);
  if(before.state!=='OLD')
    return json({success:false,code:'positive-requires-exact-old-no-write',...base(before)},409);
  let body;
  try{body=await request.json();}catch{return json({success:false,code:'invalid-json'},400);}
  if(!body||Object.keys(body).sort().join(',')!=='confirmation,scenario'||
     body.scenario!=='positive'||body.confirmation!==CONFIRM)
    return json({success:false,code:'positive-confirmation-required'},400);
  const plan=prepareTestOnlyMirrorCasStatements(db,'positive');
  if(plan.statementCount!==4||plan.scenario!=='positive')
    return json({success:false,code:'positive-plan-contract-mismatch'},503);
  try{
    await db.batch(plan.statements);
    const after=await readState(db);
    if(after.state!=='NEW')
      return json({success:false,code:'positive-postflight-not-new-no-retry',...base(after)},503);
    return json({success:true,scenario:'positive',positiveCommitVerified:true,
      batchResponseObserved:true,blindRetryAllowed:false,...base(after)},200);
  }catch(error){
    let after;
    try{after=await readState(db);}
    catch{return json({success:false,code:'positive-outcome-unknown-read-failed-no-retry'},503);}
    if(after.state==='NEW'){
      return json({success:true,scenario:'positive',positiveCommitVerified:true,
        batchResponseObserved:false,reconciledAfterBatchError:true,
        blindRetryAllowed:false,...base(after)},200);
    }
    return json({success:false,code:'positive-batch-error-no-retry',
      blindRetryAllowed:false,...base(after)},503);
  }
}
export default {fetch:handlePositiveRemoteDev};
