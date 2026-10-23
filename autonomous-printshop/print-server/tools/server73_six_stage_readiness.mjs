/**
 * SERVER-73 — SOURCE-ONLY release readiness auditor for D01..D06.
 * Runs without network, shell, Cloudflare SDK, credentials, filesystem writes,
 * live host access or side effects. A report is NEVER a deployment approval.
 */
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const ROOT='autonomous-printshop/print-server/';
const READ=(name)=>readFileSync(name,'utf8');
function requireProof(value,code){
  if(!value)throw new Error('SERVER73_UNVERIFIED_SOURCE_'+code);
}
const decisionIds=['D01','D02','D03','D04','D05','D06'];
const textHas=(source,text)=>source.includes(text);

export function auditSixStageReadiness(read=READ){
  const queue=JSON.parse(read(ROOT+'SERVER69_RELEASE_DECISIONS.json'));
  const inventory=JSON.parse(read(ROOT+'SERVER70_LEGACY_READ_CONSUMER_INVENTORY.json'));
  const policy=JSON.parse(read(ROOT+'SERVICE_ORDER_READER_POLICY_V1.json'));
  const stage=read('cloudflare-d1/wrangler.server68-isolated-stage.toml');
  const r5=read('.github/workflows/trendos-r5-periodic-controlled.yml');
  const helper=read('cloudflare-d1/r5-server68-signed-metadata-preflight.mjs');
  const signer=read('cloudflare-d1/D1_Mirror_Service_Read_V1.gs');
  const client=read(ROOT+'src/trendosshop_read_once.py');
  const cli=read(ROOT+'src/trendosshop_canary_once_cli.py');
  requireProof(queue.schema==='trendos.server69.review-decision-queue.v1','QUEUE_SCHEMA');
  requireProof(JSON.stringify(queue.decisions.map(x=>x.id))===JSON.stringify(decisionIds),'SIX_DECISIONS');
  requireProof(queue.decisions.every(d=>d.status!=='approved'&&d.defaultSafe&&d.requiredBefore),'NO_SILENT_APPROVAL');
  requireProof(stage.includes('name = "trendos-server68-isolated-stage"') &&
    stage.includes('workers_dev = false') &&
    !/\[\[d1_databases\]\]|database_id\s*=|account_id\s*=|routes?\s*=/.test(stage),
    'STAGE_ISOLATION');
  for(const flag of ['MIRROR_SERVICE_READ_ENABLED','MIRROR_METADATA_READ_ENABLED',
    'MIRROR_PARITY_READ_ENABLED','TRENDOSSHOP_SERVICE_READ_ENABLED',
    'TRENDOS_CLOUD_WRITE_V1_ENABLED','TRENDOS_R5_PERIODIC_ENABLED']){
    requireProof(stage.includes(flag+' = "false"'),'STAGE_DEFAULT_OFF_'+flag);
  }
  requireProof(stage.includes('MIRROR_SERVICE_READ_REPLAY_DO') &&
    stage.includes('MirrorServiceNonceGuardV1'),'LOCAL_REPLAY_CANDIDATE');
  requireProof(policy.policyStatus==='PROPOSED_NOT_DEPLOYED' &&
    policy.principal?.provisioned===false &&
    policy.readClient?.enabled===false &&
    policy.authorization?.forbiddenOperations?.includes('devices.execute'),
    'UNPROVISIONED_MACHINE_ROLE');
  requireProof(textHas(helper,'/v1/service/mirror/sheets') &&
    textHas(helper,'expectedHostname') &&
    textHas(signer,'D1_MIRROR_SERVICE_READ_V1_EXPECTED_HOSTNAME'),
    'SOURCE_SIGNED_CANDIDATES');
  requireProof(textHas(r5,'ref: b7e85647ac205b93f22e9f9ea1da58b21d54e4c0') &&
    textHas(r5,'test "$catalog_code" = 200') &&
    textHas(r5,'/v1/mirror/sheets'),
    'R5_LEGACY_UNMIGRATED');
  requireProof(inventory.classification==='SOURCE-ONLY_NONEXHAUSTIVE' &&
    inventory.consumers?.length===5 &&
    inventory.consumers.every(c=>c.liveCutoverVerified===false) &&
    Object.values(inventory.releaseGates||{}).every(v=>v===false),
    'LIVE_CONSUMERS_UNVERIFIED');
  requireProof(textHas(client,'enabled: bool = False') &&
    textHas(client,'owner_authorized: bool = False') &&
    textHas(cli,'TRENDOSSHOP_SERVER69_CANARY_ENABLED') &&
    textHas(cli,'TRENDOSSHOP_SERVER69_OWNER_APPROVED') &&
    textHas(cli,'--owner-authorized'),
    'UBUNTU_DEFAULT_DENY');
  requireProof(queue.decisions.find(x=>x.id==='D06')?.defaultSafe==='NO_CUSTOMER_DATA_NO_DEVICES',
    'LIVE_ORDER_AND_DEVICES_DENIED');

  const rows=[
    {id:'D01',phase:'isolated-cloudflare-stage',sourcePrepared:true,
      missing:['owner-approved isolated remote Worker/D1/Access scope','private remote test evidence']},
    {id:'D02',phase:'service-identity-and-replay',sourcePrepared:true,
      missing:['stage-only external secret provisioning and rotation','remote DO migration and signed HTTP evidence']},
    {id:'D03',phase:'r5-apps-script-consumer-cutover',sourcePrepared:true,
      missing:['live external caller/Apps Script trigger inventory','signed R5 rollout and independently approved rollback']},
    {id:'D04',phase:'production-security-release',sourcePrepared:false,
      missing:['per-Worker deployed artifact provenance and backup','named production window and reversible security rollout']},
    {id:'D05',phase:'physical-ubuntu-read-once',sourcePrepared:true,
      missing:['approved device operator and outbound network check','short-lived credential and real read-only acceptance']},
    {id:'D06',phase:'single-real-order-read-only',sourcePrepared:true,
      missing:['explicit selected order and observation window','human-verified per-department parity with equipment off']}
  ].map((p)=>Object.freeze({...p,decisionState:queue.decisions.find(d=>d.id===p.id).status,
    result:'NO_GO',liveVerified:false}));
  return Object.freeze({
    schema:'trendos.server73.six-stage-source-readiness.v1',
    evidenceLevel:'REPOSITORY_SOURCE_ONLY',
    authority:'NOT_A_PRODUCTION_OR_LIVE_APPROVAL',
    release:'NO_GO', remoteCalls:0, liveOrdersRead:0, deviceExecutions:0,
    decisionsRequired:6, steps:rows
  });
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const arg=process.argv[2]||'--report';
  if(!['--report','--gate'].includes(arg)||process.argv.length>3){
    process.stderr.write('SERVER73_USAGE_REPORT_OR_GATE_ONLY\n');
    process.exitCode=64;
  }else{
    try{
      const report=auditSixStageReadiness();
      process.stdout.write(JSON.stringify(report,null,2)+'\n');
      if(arg==='--gate')process.exitCode=2; // NO_GO is never exit 0.
    }catch{
      process.stderr.write('SERVER73_SOURCE_EVIDENCE_MISMATCH\n');
      process.exitCode=3; // Do not hide an unexpected branch/source drift.
    }
  }
}
