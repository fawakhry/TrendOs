import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const backend=fs.readFileSync(path.join(root,'operator-task-workflow-v2.gs'),'utf8');

function gateContext({enabled=false,gateImpl}={}){
  const ctx={
    console,Date,JSON,Math,Number,String,Object,Array,isFinite,isNaN,
    PropertiesService:{getScriptProperties(){return {getProperty(name){
      if(name==='TRENDOS_GABER_MATERIAL_CONTROL_V1_ENABLED')return enabled?'true':'false';
      return '';
    }}}},
    Utilities:{formatDate(d){return new Date(d).toISOString()}},
  };
  if(gateImpl)ctx.gaberMaterialTaskCloseGateV1_=gateImpl;
  vm.createContext(ctx);
  vm.runInContext(backend+`\nglobalThis.__gmGate={otGaberMaterialControlEnabledV2_,otIsGaberLaserTaskV2_,otGaberMaterialCloseGateV2_};`,ctx);
  return ctx.__gmGate;
}

const gaberTask={taskId:'OT2-1',orderId:'3910',lineId:'3910-02',employee:'جابر',department:'ليزر'};
const managerAuth={operatorTaskRole:'MANAGER',user:{username:'ضياء'}};

test('Gaber material enforcement is behind its own independent feature flag and never sets it',()=>{
  assert.match(backend,/TRENDOS_GABER_MATERIAL_CONTROL_V1_ENABLED_PROP='TRENDOS_GABER_MATERIAL_CONTROL_V1_ENABLED'/);
  assert.match(backend,/function otGaberMaterialControlEnabledV2_/);
  assert.doesNotMatch(backend,/\.setProperty\s*\(/);
});

test('flag OFF preserves existing Task V2 completion behavior',()=>{
  const g=gateContext({enabled:false});
  assert.equal(g.otGaberMaterialControlEnabledV2_(),false);
  const r=g.otGaberMaterialCloseGateV2_({},gaberTask,managerAuth);
  assert.equal(r.ok,true);
  assert.equal(r.enabled,false);
  assert.equal(r.skipped,true);
});

test('flag ON fails closed if material gate backend is not installed',()=>{
  const g=gateContext({enabled:true});
  const r=g.otGaberMaterialCloseGateV2_({},gaberTask,managerAuth);
  assert.equal(r.ok,false);
  assert.equal(r.enabled,true);
  assert.equal(r.code,'GABER_MATERIAL_GATE_BACKEND_MISSING');
});

test('manager completing Gaber Laser Task cannot bypass material close gate',()=>{
  const g=gateContext({enabled:true,gateImpl(){return {success:true,canClose:false,blockers:[{code:'MATERIAL_BALANCE_NOT_ZERO'}],message:'فرق خامة'};}});
  const r=g.otGaberMaterialCloseGateV2_({},gaberTask,managerAuth);
  assert.equal(r.ok,false);
  assert.equal(r.code,'GABER_MATERIAL_CLOSE_BLOCKED');
  assert.deepEqual(Array.from(r.blockers,x=>x.code),['MATERIAL_BALANCE_NOT_ZERO']);
});

test('passing material close returns immutable audit references to Task completion',()=>{
  const g=gateContext({enabled:true,gateImpl(p,task,auth){
    assert.equal(task.taskId,'OT2-1');
    assert.equal(auth.operatorTaskRole,'MANAGER');
    return {success:true,canClose:true,decisionFingerprint:'GM1-abc',materialCloseId:'GMC-1'};
  }});
  const r=g.otGaberMaterialCloseGateV2_({finalStatus:'جاهز للاستلام'},gaberTask,managerAuth);
  assert.equal(r.ok,true);
  assert.equal(r.enabled,true);
  assert.equal(r.decisionFingerprint,'GM1-abc');
  assert.equal(r.materialCloseId,'GMC-1');
});

test('non-Laser/Wael Task is not accidentally gated by Gaber material control',()=>{
  const g=gateContext({enabled:true});
  const r=g.otGaberMaterialCloseGateV2_({}, {taskId:'T',employee:'وائل',department:'طباعة'}, {operatorTaskRole:'WAEL'});
  assert.equal(r.ok,true);
  assert.equal(r.skipped,true);
});

test('Task completion executes material gate before source Order/Line status mutation',()=>{
  const start=backend.indexOf('function otCompleteTaskV2_');
  const end=backend.indexOf('function otTaskViewV2_',start);
  assert.ok(start>=0&&end>start);
  const body=backend.slice(start,end);
  const gateAt=body.indexOf('otGaberMaterialCloseGateV2_(p,task,auth)');
  const statusAt=body.indexOf('otSourceStatusWriteV2_(task,auth,finalStatus');
  assert.ok(gateAt>=0,'material close gate missing from completion');
  assert.ok(statusAt>gateAt,'source status write must happen only after material gate passes');
  assert.match(body,/materialCloseBlocked:true/);
});

test('successful Task completion exposes material close fingerprint/id when gate is enabled',()=>{
  const start=backend.indexOf('function otCompleteTaskV2_');
  const end=backend.indexOf('function otTaskViewV2_',start);
  const body=backend.slice(start,end);
  assert.match(body,/materialClose:materialGate\.enabled\?\{decisionFingerprint:materialGate\.decisionFingerprint\|\|'',materialCloseId:materialGate\.materialCloseId\|\|''\}:null/);
});
