import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const backend=fs.readFileSync(path.join(root,'work-queue-backend-v1.gs'),'utf8');
const frontend=fs.readFileSync(path.join(root,'work-queue-v1.js'),'utf8');
const router=fs.readFileSync(path.join(root,'v1932-router.gs'),'utf8');

function pure(){
  const ctx={
    console,
    Date,
    JSON,
    Math,
    Number,
    String,
    Object,
    Array,
    isFinite,
    isNaN,
    PropertiesService:{getScriptProperties(){return {getProperty(){return ''}}}},
    Utilities:{formatDate(d){return new Date(d).toISOString()},getUuid(){return 'uuid'}}
  };
  vm.createContext(ctx);
  vm.runInContext(backend+`
  globalThis.__wq={
    wqRoleV1_,wqIsNormalCandidateV1_,wqSortCandidatesV1_,wqStableLineIdV1_,
    wqWorkSecondsV1_,wqIsFlyV1_,wqIsPressV1_,wqFinalStatusV1_,wqPressReadyStatusV1_
  };`,ctx);
  return ctx.__wq;
}

test('router exposes Work Queue as an isolated V1932 action',()=>{
  assert.match(router,/action === 'workQueueV1'/);
  assert.match(router,/typeof workQueueV1_ === 'function'/);
});

test('feature is fail-closed behind a Script Property',()=>{
  assert.match(backend,/TRENDOS_WORK_QUEUE_V1_ENABLED/);
  assert.match(backend,/function wqRequireEnabledV1_/);
  assert.match(backend,/Work Queue V1 غير مفعّل تشغيليًا/);
  assert.match(frontend,/if\(window\.MATBAGY_WORK_QUEUE_V1!==true\)return/);
});

test('Gaber and Wael have separate normal queues and Wael normal queue excludes fly/press',()=>{
  const w=pure();
  const gaber={department:'ليزر',status:'طلب جديد',flyPrint:'لا',heatPress:'لا'};
  const wael={department:'طباعة',status:'طلب جديد',flyPrint:'لا',heatPress:'لا'};
  const fly={department:'طباعة',status:'طلب جديد',flyPrint:'نعم',heatPress:'لا'};
  const press={department:'طباعة',status:'طلب جديد',flyPrint:'لا',heatPress:'نعم'};
  assert.equal(w.wqIsNormalCandidateV1_(gaber,'GABER'),true);
  assert.equal(w.wqIsNormalCandidateV1_(wael,'WAEL'),true);
  assert.equal(w.wqIsNormalCandidateV1_(fly,'WAEL'),false);
  assert.equal(w.wqIsNormalCandidateV1_(press,'WAEL'),false);
});

test('normal queue is priority then expected delivery then source row',()=>{
  const w=pure();
  const rows=[
    {lineId:'2',priority:'عادي',expectedAt:'2026-09-10',rowNumber:10},
    {lineId:'3',priority:'عاجل',expectedAt:'2026-09-12',rowNumber:12},
    {lineId:'1',priority:'عاجل',expectedAt:'2026-09-11',rowNumber:11}
  ];
  assert.deepEqual(Array.from(w.wqSortCandidatesV1_(rows),x=>x.lineId),['1','3','2']);
});

test('date-coerced Line IDs are repaired only when identity is provable',()=>{
  const w=pure();
  assert.equal(w.wqStableLineIdV1_(new Date(3876,0,1),'3876'),'3876-01');
  assert.equal(w.wqStableLineIdV1_(721721,'3876'),'3876-01');
  assert.equal(w.wqStableLineIdV1_(721721,'4000'),'721721');
});

test('timer subtracts paused time',()=>{
  const w=pure();
  const start=new Date('2026-09-09T10:00:00Z');
  const end=new Date('2026-09-09T10:10:00Z');
  assert.equal(w.wqWorkSecondsV1_(start,end,120,''),480);
});

test('one active task and atomic claim are explicit backend contracts',()=>{
  assert.match(backend,/wqWithLockV1_\(function\(\)\{/);
  assert.match(backend,/wqActiveTaskForEmployeeV1_/);
  assert.match(backend,/alreadyActive:true/);
  assert.match(backend,/out\.byLine\[o\.lineId\]/);
});

test('source status writes stay on authoritative updateLine_ path',()=>{
  assert.match(backend,/typeof updateLine_!=='function'/);
  assert.match(backend,/return updateLine_\(e\)/);
  assert.match(backend,/'بدأ التنفيذ'/);
  assert.match(backend,/'جاهز للاستلام','تم التسليم'/);
});

test('Wael gets visible fly-print exception and temporary press batch picker',()=>{
  assert.match(frontend,/طباعة ع الطاير/);
  assert.match(frontend,/تشغيل دفعة مكبس/);
  assert.match(frontend,/pressListOpen=false/);
  assert.match(frontend,/data-wq-press-line/);
  assert.match(backend,/auth\.workQueueRole!=='WAEL'/);
  assert.match(backend,/wqFlyCandidatesV1_/);
  assert.match(backend,/wqPressCandidatesV1_/);
});

test('press time is batch-level and selected line identities are persisted',()=>{
  assert.match(backend,/Line IDs JSON/);
  assert.match(backend,/JSON\.stringify\(ids\)/);
  assert.match(backend,/Duration Sec/);
  assert.match(backend,/Order Count/);
  assert.match(backend,/Line Count/);
  assert.doesNotMatch(backend,/durationSec\s*\*\s*selected\.length/);
});

test('employee UI masks the legacy queue only after backend says enabled',()=>{
  assert.match(frontend,/if\(!d\|\|!d\.success\|\|d\.enabled!==true\)/);
  assert.match(frontend,/hide\(document\.getElementById\('currentOrderBar'\)\)/);
  assert.match(frontend,/hide\(table\.closest\('\.table-wrap'\)\)/);
  assert.match(frontend,/if\(role==='WAEL'\)hide\(document\.getElementById\('trendPressControlV1'\)\)/);
});
