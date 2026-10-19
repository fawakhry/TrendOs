/** SERVER-80 static prerequisite for a separately authorized isolated-stage bootstrap.
 * Imported module and --validate are offline-only: no network/Cloudflare access.
 * This never grants release approvals or creates Cloudflare resources.
 */
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const STAGE='cloudflare-d1/wrangler.server68-isolated-stage.toml';
const ROUTER='cloudflare-d1/src/index_v2.js';
const ENTRY='cloudflare-d1/production-shadow/index.js';
const DECISIONS='autonomous-printshop/print-server/SERVER69_RELEASE_DECISIONS.json';
const ACTION='.github/workflows/server80-isolated-stage-owner-gated-bootstrap.yml';
const REQUIRED_FLAGS=[
  'MIRROR_SERVICE_READ_ENABLED','MIRROR_METADATA_READ_ENABLED',
  'MIRROR_PARITY_READ_ENABLED','TRENDOSSHOP_SERVICE_READ_ENABLED',
  'TRENDOS_CLOUD_WRITE_V1_ENABLED','TRENDOS_R5_PERIODIC_ENABLED',
  'TRENDOS_T12_PROD_CREATE_CANARY_ENABLED',
  'AUTONOMOUS_PRINTSHOP_SHADOW_V1_ENABLED',
  'TRENDOS_CLOUD_AUTH_SHADOW_V1_ENABLED','TRENDOS_EMPLOYEE_AUTH_V1_ENABLED'
];
export class StageGuardError extends Error {
  constructor(code){super(code);this.name='StageGuardError';}
}
const ok=(condition,code)=>{if(!condition)throw new StageGuardError('SERVER80_'+code);};
export function validateIsolatedStageSource(read=path=>readFileSync(path,'utf8'),{checkWorkflow=true}={}){
  const conf=read(STAGE), router=read(ROUTER), entry=read(ENTRY);
  const decisions=JSON.parse(read(DECISIONS));
  ok(/^name = "trendos-server68-isolated-stage"$/m.test(conf),'WRONG_WORKER');
  ok(/^main = "production-shadow\/index\.js"$/m.test(conf),'WRONG_ENTRYPOINT');
  ok(/^workers_dev = false$/m.test(conf),'PUBLIC_WORKERS_DEV');
  ok(!/\b(?:account_id|route|routes|zone_id|zone_name|database_id)\s*=|\[\[(?:routes|d1_databases|r2_buckets|kv_namespaces|queues\.producers|services|unsafe\.bindings)\]\]/i.test(conf),'EXTERNAL_PROD_BINDING_OR_ROUTE');
  ok(!/(?:trendos-main|5c4b92bf-e043-4f6e-bd6d-d514a92cd825)/i.test(conf),'PRODUCTION_D1_REFERENCE');
  for(const name of REQUIRED_FLAGS){
    const exact=new RegExp('^'+name+' = "false"$','gm');
    const matches=[...conf.matchAll(exact)];
    ok(matches.length===1,'FLAG_NOT_EXACTLY_OFF_'+name);
  }
  ok(/^\[\[durable_objects\.bindings\]\]$/m.test(conf)
    && /^name = "MIRROR_SERVICE_READ_REPLAY_DO"$/m.test(conf)
    && /^class_name = "MirrorServiceNonceGuardV1"$/m.test(conf)
    && /^new_sqlite_classes = \["MirrorServiceNonceGuardV1"\]$/m.test(conf),
    'ISOLATED_DO_BINDING_NOT_QUALIFIED');
  ok(entry.includes("export { MirrorServiceNonceGuardV1 }"),'DO_EXPORT_MISSING');
  ok(router.includes('isTrendosShopServiceOrdersPath(path)')
    && router.includes('handleTrendosShopServiceOrdersRequest(request, env)')
    && router.includes('isMirrorServiceReadPath(path)')
    && router.includes('handleMirrorServiceRead(request, env)'),
    'SERVICE_READER_ROUTER_MISSING');
  ok(decisions.schema==='trendos.server69.review-decision-queue.v1'
    && decisions.decisions.length===6
    && decisions.decisions.map(d=>d.id).join(',')==='D01,D02,D03,D04,D05,D06'
    && decisions.decisions.every(d=>d.defaultSafe && d.status!=='approved'),
    'SIX_LIVE_GATES_NOT_PRESERVED');
  if(checkWorkflow){
    const w=read(ACTION);
    ok(/workflow_dispatch:/.test(w),'NOT_MANUAL_ONLY');
    ok(!/^  (?:push|schedule|pull_request|repository_dispatch|workflow_run):/m.test(w),'UNATTENDED_TRIGGER_FORBIDDEN');
    ok(w.includes('SERVER80_AUTHORIZE_NEW_PRIVATE_STAGE_ONLY')
      && w.includes('if: github.event_name == \'workflow_dispatch\'')
      && w.includes('git rev-parse HEAD')
      && w.includes('wrangler.server68-isolated-stage.toml')
      && !w.includes('wrangler.toml\n'),
      'WORKFLOW_DEPLOY_APPROVAL_NOT_QUALIFIED');
  }
  return {
    schema:'trendos.server80.isolated-stage-preflight.v1',
    stage:'trendos-server68-isolated-stage',
    sourceContractQualified:true,
    publicRoutesConfigured:false,
    workersDevConfigured:false,
    customerD1Bound:false,
    allSensitiveFeaturesDefaultOff:true,
    sixRealReleaseGatesStillPending:true,
    privateRemoteAccessVerified:false,
    actualStageDeployed:false,
    permissionToDeploy:false,
    productionGo:false
  };
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  if(process.argv.length!==3||process.argv[2]!=='--validate'){
    process.stderr.write('SERVER80_VALIDATE_ONLY; NO_DEPLOY_FUNCTION\n');
    process.exitCode=64;
  }else{
    try{process.stdout.write(JSON.stringify(validateIsolatedStageSource())+'\n');}
    catch{process.stderr.write('SERVER80_STAGE_SOURCE_GUARD_FAILED\n');process.exitCode=2;}
  }
}
