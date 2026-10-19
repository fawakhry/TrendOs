/** SERVER-80: absolutely no Cloudflare, Ubuntu, network or OS process execution. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateIsolatedStageSource} from '../autonomous-printshop/print-server/tools/server80_isolated_stage_deploy_guard.mjs';

const stage='cloudflare-d1/wrangler.server68-isolated-stage.toml';
const workflow='.github/workflows/server80-isolated-stage-owner-gated-bootstrap.yml';
const decisions='autonomous-printshop/print-server/SERVER69_RELEASE_DECISIONS.json';
const strict=readFileSync(stage,'utf8');
const yml=readFileSync(workflow,'utf8');
function mutated(key,change){
  return p=>p===key?change:readFileSync(p,'utf8');
}

test('owner bootstrap source guard is offline, reports no live authorization or deployed target',()=>{
  const r=validateIsolatedStageSource();
  assert.equal(r.stage,'trendos-server68-isolated-stage');
  assert.equal(r.sourceContractQualified,true);
  assert.equal(r.customerD1Bound,false);
  assert.equal(r.workersDevConfigured,false);
  assert.equal(r.publicRoutesConfigured,false);
  assert.equal(r.permissionToDeploy,false);
  assert.equal(r.actualStageDeployed,false);
  assert.equal(r.productionGo,false);
  assert.equal(r.sixRealReleaseGatesStillPending,true);
});
test('requires BOTH workers.dev and preview URLs disabled and single expected name',()=>{
  for(const change of [
    strict.replace('workers_dev = false','workers_dev = true'),
    strict.replace('preview_urls = false','preview_urls = true'),
    strict.replace('name = "trendos-server68-isolated-stage"','name = "trendos-d1-api"'),
    strict.replace('name = "trendos-server68-isolated-stage"','name = "trendos-d1-staging"'),
    strict.replace('main = "production-shadow/index.js"','main = "index.js"'),
    strict+'\nworkers_dev = true\n',
    strict+'\npreview_urls = true\n',
  ])assert.throws(()=>validateIsolatedStageSource(mutated(stage,change)),/SERVER80_/);
});
test('rejects accidental production and external bindings and any external public route',()=>{
  for(const change of [
    '\naccount_id = "a".repeat(32)\n',
    '\nroute = "trendmall.example.com/*"\n',
    '\n[[routes]]\npattern="example.com/*"\n',
    '\n[[d1_databases]]\nbinding="DB"\n',
    '\ndatabase_id="5c4b92bf-e043-4f6e-bd6d-d514a92cd825"\n',
    '\n[[r2_buckets]]\nbinding="R2"\n',
    '\n[[kv_namespaces]]\nbinding="KV"\n',
    '\n[[services]]\nbinding="PROD"\n',
  ])assert.throws(()=>validateIsolatedStageSource(mutated(stage,strict+change)),/SERVER80_/);
});
test('all sensitive features remain exactly OFF, no duplicate env override',()=>{
  for(const change of [
    strict.replace('TRENDOSSHOP_SERVICE_READ_ENABLED = "false"','TRENDOSSHOP_SERVICE_READ_ENABLED = "true"'),
    strict.replace('MIRROR_SERVICE_READ_ENABLED = "false"','MIRROR_SERVICE_READ_ENABLED = "true"'),
    strict+'\nTRENDOSSHOP_SERVICE_READ_ENABLED = "true"\n',
    strict+'\nTRENDOS_CLOUD_WRITE_V1_ENABLED = "true"\n',
  ])assert.throws(()=>validateIsolatedStageSource(mutated(stage,change)),/SERVER80_/);
});
test('rejects a changed durable object class or missing source reader router',()=>{
  assert.throws(()=>validateIsolatedStageSource(mutated(stage,strict.replace('MirrorServiceNonceGuardV1','WrongNonce'))),/SERVER80_/);
  const router='cloudflare-d1/src/index_v2.js';
  const code=readFileSync(router,'utf8');
  assert.throws(()=>validateIsolatedStageSource(mutated(router,code.replace('handleTrendosShopServiceOrdersRequest(request, env)','return Response.error()'))),/SERVER80_/);
});
test('six decisions remain pending; spoofed approval is always a source gate failure',()=>{
  const queue=JSON.parse(readFileSync(decisions,'utf8'));
  queue.decisions.find(d=>d.id==='D01').status='approved';
  assert.throws(()=>validateIsolatedStageSource(mutated(decisions,JSON.stringify(queue))),/SERVER80_/);
});
test('manual owner dispatch only; no push/PR/cron and no production deploy config',()=>{
  assert.match(yml,/^  workflow_dispatch:/m);
  assert.doesNotMatch(yml,/^  (?:push|schedule|pull_request|workflow_run|repository_dispatch):/m);
  assert.match(yml,/github\.actor == 'fawakhry'/);
  assert.match(yml,/GITHUB_REF.*refs\/heads\/main/);
  assert.match(yml,/SERVER80_AUTHORIZE_NEW_PRIVATE_STAGE_ONLY/);
  assert.match(yml,/wrangler\.server68-isolated-stage\.toml/);
  assert.doesNotMatch(yml,/--config cloudflare-d1\/wrangler\.toml/);
  assert.doesNotMatch(yml,/curl.*\/(?:orders|customers|v1\/mirror)/i);
  assert.ok(!yml.includes('on:\n  push:'));
});
test('removing exact manual approval or enabling push fails source guard',()=>{
  for(const change of [
    yml.replace("SERVER80_AUTHORIZE_NEW_PRIVATE_STAGE_ONLY","UNSAFE_ACK"),
    yml.replace("  workflow_dispatch:","  push:\n  workflow_dispatch:"),
    yml.replace("    if: github.event_name == 'workflow_dispatch'","    if: github.event_name == 'push'"),
    yml.replace("wrangler.server68-isolated-stage.toml","wrangler.toml"),
  ])assert.throws(()=>validateIsolatedStageSource(mutated(workflow,change)),/SERVER80_/);
});
test('bootstrap does not silently authorize a physical read, data migration or real client',()=>{
  const report=validateIsolatedStageSource();
  assert.equal(report.privateRemoteAccessVerified,false);
  assert.equal(report.permissionToDeploy,false);
  assert.equal(report.productionGo,false);
});
