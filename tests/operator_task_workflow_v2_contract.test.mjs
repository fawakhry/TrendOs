import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const backend=fs.readFileSync(path.join(root,'operator-task-workflow-v2.gs'),'utf8');
const frontend=fs.readFileSync(path.join(root,'operator-task-workflow-v2.js'),'utf8');
const router=fs.readFileSync(path.join(root,'v1932-router.gs'),'utf8');

function pure(){
  const ctx={console,Date,JSON,Math,Number,String,Object,Array,isFinite,isNaN,PropertiesService:{getScriptProperties(){return {getProperty(){return ''}}}},Utilities:{formatDate(d){return new Date(d).toISOString()}}};
  vm.createContext(ctx);
  vm.runInContext(backend+`\nglobalThis.__ot={otUrgentRankV2_,otDueMsV2_,otCompareOrderV2_,otSortCandidatesV2_,otIsFlyV2_,otIsPressV2_,otNormalCandidateBaseV2_,otFinalStatusV2_};`,ctx);
  return ctx.__ot;
}

test('v1932 exposes Operator Task V2 as an isolated action',()=>{
  assert.match(router,/action === 'operatorTaskV2'/);
  assert.match(router,/typeof operatorTaskV2_ === 'function'/);
  assert.match(router,/Operator Task V2 backend غير منشور/);
});

test('candidate is inert behind dedicated backend and frontend flags',()=>{
  assert.match(backend,/TRENDOS_OPERATOR_TASK_V2_ENABLED/);
  assert.match(backend,/function otRequireEnabledV2_/);
  assert.match(frontend,/if\(window\.MATBAGY_OPERATOR_TASK_V2!==true\)return/);
  assert.doesNotMatch(backend,/\.setProperty\s*\(/);
});

test('dispatch is urgent first, then delivery date, then order number',()=>{
  const p=pure();
  const rows=[
    {lineId:'400-01',orderId:'400',priority:'عادي',expectedAt:'2026-09-10'},
    {lineId:'220-01',orderId:'220',priority:'عاجل',expectedAt:'2026-09-11'},
    {lineId:'120-01',orderId:'120',priority:'عاجل',expectedAt:'2026-09-11'},
    {lineId:'110-01',orderId:'110',priority:'عاجل',expectedAt:'2026-09-09'}
  ];
  assert.deepEqual(Array.from(p.otSortCandidatesV2_(rows),x=>x.lineId),['110-01','120-01','220-01','400-01']);
});

test('VIP alone is not silently promoted above owner-defined urgent priority',()=>{
  const p=pure();
  assert.equal(p.otUrgentRankV2_('عاجل'),0);
  assert.equal(p.otUrgentRankV2_('URGENT'),0);
  assert.equal(p.otUrgentRankV2_('VIP'),1);
});

test('missing or invalid delivery dates fail closed from automatic dispatch',()=>{
  const p=pure();
  assert.equal(p.otDueMsV2_(''),null);
  assert.equal(p.otDueMsV2_('not-a-date'),null);
  assert.equal(Number.isFinite(p.otDueMsV2_('2026-09-10')),true);
  assert.match(backend,/MISSING_OR_INVALID_DELIVERY_DUE_DATE/);
  assert.match(backend,/if\(due===null\)\{exceptions\.push/);
});

test('Wael normal task lane excludes Fly Print but does not hide Press lines from task dispatch',()=>{
  const p=pure();
  const ordinary={department:'طباعة',status:'طلب جديد',flyPrint:'لا',heatPress:'لا'};
  const fly={department:'طباعة',status:'طلب جديد',flyPrint:'نعم',heatPress:'لا'};
  const press={department:'طباعة',status:'طلب جديد',flyPrint:'لا',heatPress:'نعم'};
  assert.equal(p.otNormalCandidateBaseV2_(ordinary,'WAEL'),true);
  assert.equal(p.otNormalCandidateBaseV2_(fly,'WAEL'),false);
  assert.equal(p.otNormalCandidateBaseV2_(press,'WAEL'),true);
});

test('Gaber receives Laser tasks and no Fly/Press API capabilities',()=>{
  const p=pure();
  assert.equal(p.otNormalCandidateBaseV2_({department:'ليزر',status:'طلب جديد'},'GABER'),true);
  assert.match(backend,/if\(role==='WAEL'\)\{result\.flyPrint=otFlyLaneV2_\(\);result\.pressCandidateCount=/);
  assert.match(backend,/if\(auth\.operatorTaskRole!=='WAEL'\)return \{success:false,message:'فلتر المكبس متاح لوائل فقط\.'/);
  assert.match(frontend,/if\(d\.role==='WAEL'\)\{/);
});

test('claim is one locked operation that starts timer and source execution immediately',()=>{
  assert.match(backend,/function otClaimNextV2_\(auth\)[\s\S]*return otWithLockV2_\(function\(\)\{/);
  assert.match(backend,/otAppendStartingTaskV2_\(source,auth,now\)/);
  assert.match(backend,/otSourceStatusWriteV2_\(task,auth,'بدء التنفيذ'/);
  assert.match(backend,/setValue\('RUNNING'\)/);
  assert.doesNotMatch(backend,/if\(op==='startTask'\)/);
  assert.doesNotMatch(frontend,/data-ot="start"/);
});

test('claim is idempotent for an already-active operator and prevents concurrent duplicate line assignment',()=>{
  assert.match(backend,/const employee=otUserNameV2_\(auth\),active=otActiveIndexV2_\(\)\.byEmployee/);
  assert.match(backend,/if\(active\)return \{success:true,alreadyActive:true/);
  assert.match(backend,/active\.byLine\[r\.lineId\]/);
  assert.match(backend,/LockService\.getScriptLock\(\)/);
});

test('completion only accepts ready/delivered and returns authoritative actual duration',()=>{
  assert.match(backend,/\['جاهز للاستلام','تم التسليم'\]\.indexOf\(finalStatus\)/);
  assert.match(backend,/actualWorkSec:workSec/);
  assert.match(backend,/new Date\(row\.values\[7\]\)\.getTime\(\)/);
  assert.match(frontend,/الوقت الفعلي/);
});

test('Fly Print is permanently visible read-only and completely outside task mutations',()=>{
  assert.match(frontend,/ظاهر دائمًا — خارج نظام التاسكات/);
  assert.match(frontend,/flyHtml\(d\.flyPrint\)/);
  assert.doesNotMatch(frontend,/data-ot="fly"/);
  assert.doesNotMatch(backend,/claimFly/);
  assert.doesNotMatch(backend,/FLY_PRINT/);
});

test('Press is a scoped read-only filter with exact Line IDs, not a task selector',()=>{
  assert.match(frontend,/فلتر المكبس/);
  assert.match(frontend,/بند '\+esc\(x\.lineId\)/);
  assert.match(backend,/if\(op==='pressCandidates'\)/);
  assert.doesNotMatch(backend,/pressStart/);
  assert.doesNotMatch(backend,/pressStop/);
  assert.doesNotMatch(frontend,/data-ot="pressStart"/);
});

test('ordinary legacy backlog is masked only after backend confirms feature enabled',()=>{
  assert.match(frontend,/if\(!d\|\|!d\.success\|\|d\.enabled!==true\)/);
  assert.match(frontend,/hide\(document\.getElementById\('currentOrderBar'\)\)/);
  assert.match(frontend,/hide\(table\.closest\('\.table-wrap'\)\)/);
});
