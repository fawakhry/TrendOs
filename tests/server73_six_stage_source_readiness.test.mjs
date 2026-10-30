/** SERVER-73: six offline gates, no live systems, no secret or customer access. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {auditSixStageReadiness} from '../autonomous-printshop/print-server/tools/server73_six_stage_readiness.mjs';

const ROOT='autonomous-printshop/print-server/';
const source=(path)=>readFileSync(path,'utf8');
const mutate=(target,from,to)=>(path)=>{
  const raw=source(path);
  if(path!==target)return raw;
  assert.ok(raw.includes(from),'fixture drift: '+target);
  return raw.replace(from,to);
};

test('every one of six stages gets a distinct evidence-backed NO_GO, not a false approval',()=>{
  const x=auditSixStageReadiness();
  assert.equal(x.schema,'trendos.server73.six-stage-source-readiness.v1');
  assert.equal(x.release,'NO_GO');
  assert.deepEqual(x.steps.map(p=>p.id),['D01','D02','D03','D04','D05','D06']);
  assert.equal(x.decisionsRequired,6);
  assert.equal(new Set(x.steps.map(p=>p.phase)).size,6);
  assert.ok(x.steps.every(p=>p.result==='NO_GO' && p.liveVerified===false &&
    p.missing.length>=2 && p.decisionState!=='approved'));
  assert.equal(x.steps.find(x=>x.id==='D04').sourcePrepared,false);
  assert.ok(x.steps.filter(p=>p.sourcePrepared).length===5);
  assert.equal(x.remoteCalls,0);
  assert.equal(x.liveOrdersRead,0);
  assert.equal(x.deviceExecutions,0);
});

test('all six approval gates remain independently unresolved',()=>{
  const queue=JSON.parse(source(ROOT+'SERVER69_RELEASE_DECISIONS.json'));
  const report=auditSixStageReadiness();
  assert.deepEqual(report.steps.map(p=>p.decisionState),queue.decisions.map(p=>p.status));
  assert.ok(queue.decisions.every(p=>p.requiredBefore && p.defaultSafe));
});

test('attempt to change owner decision to approved cannot silently qualify release',()=>{
  const path=ROOT+'SERVER69_RELEASE_DECISIONS.json';
  assert.throws(()=>auditSixStageReadiness(mutate(
    path,'"status": "owner_approval_pending"','"status": "approved"')),
    /SERVER73_UNVERIFIED_SOURCE_NO_SILENT_APPROVAL/);
});

test('renaming stage to a production Worker is blocked immediately',()=>{
  const path='cloudflare-d1/wrangler.server68-isolated-stage.toml';
  assert.throws(()=>auditSixStageReadiness(mutate(
    path,'name = "trendos-server68-isolated-stage"','name = "trendos-d1-api"')),
    /SERVER73_UNVERIFIED_SOURCE_STAGE_ISOLATION/);
});

test('unexpected staging D1 binding and exposed workers.dev are rejected',()=>{
  const path='cloudflare-d1/wrangler.server68-isolated-stage.toml';
  for(const [before,after] of [
    ['workers_dev = false','workers_dev = true'],
    ['workers_dev = false','workers_dev = false\n[[d1_databases]]\ndatabase_id = "fake"'],
    ['workers_dev = false','workers_dev = false\naccount_id = "fake"']
  ]){
    assert.throws(()=>auditSixStageReadiness(mutate(path,before,after)),
      /SERVER73_UNVERIFIED_SOURCE_STAGE_ISOLATION/);
  }
});

test('any enabled staging mutation/read switch rejects release auditor',()=>{
  const path='cloudflare-d1/wrangler.server68-isolated-stage.toml';
  for(const flag of ['TRENDOS_CLOUD_WRITE_V1_ENABLED','TRENDOSSHOP_SERVICE_READ_ENABLED',
    'MIRROR_METADATA_READ_ENABLED']){
    assert.throws(()=>auditSixStageReadiness(mutate(
      path,flag+' = "false"',flag+' = "true"')),
    new RegExp('SERVER73_UNVERIFIED_SOURCE_STAGE_DEFAULT_OFF_'+flag));
  }
});

test('remote service principal cannot be considered provisioned by a JSON edit',()=>{
  const path=ROOT+'SERVICE_ORDER_READER_POLICY_V1.json';
  assert.throws(()=>auditSixStageReadiness(mutate(
    path,'"provisioned": false','"provisioned": true')),
    /SERVER73_UNVERIFIED_SOURCE_UNPROVISIONED_MACHINE_ROLE/);
});

test('fake live cutover proof fails; only read-only inventory evidence accepted',()=>{
  const path=ROOT+'SERVER70_LEGACY_READ_CONSUMER_INVENTORY.json';
  assert.throws(()=>auditSixStageReadiness(mutate(
    path,'"liveCutoverVerified": false','"liveCutoverVerified": true')),
    /SERVER73_UNVERIFIED_SOURCE_LIVE_CONSUMERS_UNVERIFIED/);
});

test('historically pinned R5 incompatible legacy preflight cannot be accidentally ignored',()=>{
  const path='.github/workflows/trendos-r5-periodic-controlled.yml';
  assert.throws(()=>auditSixStageReadiness(mutate(
    path,'test "$catalog_code" = 200','test "$catalog_code" = 403')),
    /SERVER73_UNVERIFIED_SOURCE_R5_LEGACY_UNMIGRATED/);
});

test('report CLI is safe and --gate exits NO_GO rather than claiming success',()=>{
  const file=ROOT+'tools/server73_six_stage_readiness.mjs';
  const report=spawnSync(process.execPath,[file,'--report'],{
    cwd:process.cwd(),encoding:'utf8',timeout:5000
  });
  assert.equal(report.status,0,report.stderr);
  const result=JSON.parse(report.stdout);
  assert.equal(result.release,'NO_GO');
  assert.equal(result.steps.length,6);
  assert.ok(!report.stdout.includes('FAKE_READER_'));
  assert.ok(!report.stdout.includes('Bearer '));
  assert.ok(!report.stdout.includes('customerPhone'));
  const gate=spawnSync(process.execPath,[file,'--gate'],{
    cwd:process.cwd(),encoding:'utf8',timeout:5000
  });
  assert.equal(gate.status,2,'a blocked production gate cannot exit zero');
  assert.equal(JSON.parse(gate.stdout).release,'NO_GO');
  const usage=spawnSync(process.execPath,[file,'--deploy'],{
    cwd:process.cwd(),encoding:'utf8',timeout:5000
  });
  assert.equal(usage.status,64);
});
