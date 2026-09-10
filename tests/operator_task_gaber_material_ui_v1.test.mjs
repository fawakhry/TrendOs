import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const js=fs.readFileSync(path.join(root,'operator-task-workflow-v2.js'),'utf8');
const gs=fs.readFileSync(path.join(root,'operator-task-workflow-v2.gs'),'utf8');

function pos(src,s){const p=src.indexOf(s);assert.ok(p>=0,`missing ${s}`);return p;}

test('Gaber frontend mounts material UI only behind material-control flag and active Task',()=>{
  assert.match(js,/d\.role==='GABER'&&d\.materialControlEnabled===true&&d\.task/);
  assert.match(js,/TrendOSGaberMaterialUiV1/);
  assert.match(js,/gaberMaterialBootstrap/);
  assert.match(js,/trendGaberMaterialV1Mount/);
});

test('Gaber completion serializes material close payload before completeTask call',()=>{
  const assignment=pos(js,'extra.materialClosePayload=JSON.stringify(mod.getPayload(last.task))');
  const complete=pos(js,"act('completeTask',extra)");
  assert.ok(assignment<complete);
});

test('manager status exposes material control and mounts manager material panel',()=>{
  assert.match(gs,/role==='GABER'\|\|role==='MANAGER'/);
  assert.match(js,/trendGaberMaterialManagerV1Mount/);
  assert.match(js,/mountManager/);
});

test('Operator Task route uses idempotent manager waste decision before generic Gaber route',()=>{
  const exact=pos(gs,"if(op==='gaberMaterialWasteDecision')");
  const idem=pos(gs,'gaberMaterialWasteDecisionIdempotentV1_');
  const generic=pos(gs,"if(op.indexOf('gaberMaterial')===0)");
  assert.ok(exact<=idem&&idem<generic);
  assert.match(gs,/gaberMaterialUiRouteV1_/);
});

test('material close gate remains before source status mutation',()=>{
  const complete=pos(gs,'function otCompleteTaskV2_');
  const gate=gs.indexOf('otGaberMaterialCloseGateV2_',complete);
  const write=gs.indexOf('otSourceStatusWriteV2_',complete);
  assert.ok(gate>complete&&write>gate);
});

test('Wael lane remains separate from Gaber material controls',()=>{
  assert.match(js,/if\(d\.role==='WAEL'\)/);
  assert.match(js,/flyPrint/);
  assert.match(js,/pressCandidateCount/);
  const waelBlock=js.slice(js.indexOf("if(d.role==='WAEL')"),js.indexOf('r.innerHTML=html'));
  assert.doesNotMatch(waelBlock,/TrendOSGaberMaterialUiV1/);
});