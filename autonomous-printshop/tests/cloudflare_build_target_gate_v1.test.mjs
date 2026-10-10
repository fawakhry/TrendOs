import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {dirname,join,normalize} from 'node:path';

// AP-100: one-time source preflight for screenshot-confirmed Cloudflare Builds
// configuration, NOT a Cloudflare setup call, upload or release.
const root=process.cwd();
const observed={
  worker:'trendos',
  branch:'feature/ap099-d1-readonly-inventory-20261010',
  rootDirectory:'/',
  deployCommand:'npx wrangler versions upload',
  buildCommand:''
};
const configPaths=[
  'cloudflare-d1/wrangler.toml',
  'cloudflare-d1/wrangler.frontend.toml',
  'autonomous-printshop/production-shadow/wrangler.toml'
];
const stringProp=(text,key)=>{
  const re=new RegExp('^\\s*'+key+'\\s*=\\s*"([^"]+)"\\s*$','m');
  return re.exec(text)?.[1]||'';
};
const configs=configPaths.map(path=>{
  const toml=readFileSync(join(root,path),'utf8');
  const name=stringProp(toml,'name');
  const main=stringProp(toml,'main');
  assert.ok(name&&main,'KNOWN_WRANGLER_CONFIG_INCOMPLETE:'+path);
  assert.ok(existsSync(join(root,dirname(path),main)),'ENTRYPOINT_FILE_MISSING:'+path);
  return {path,name,main};
});
assert.ok(!existsSync(join(root,'wrangler.toml')));
assert.ok(!existsSync(join(root,'wrangler.jsonc')));
assert.ok(!existsSync(join(root,'wrangler.json')));
assert.ok(!existsSync(join(root,'package.json')),'NOT_A_ROOT_WRANGLER_PROJECT');
assert.equal(observed.rootDirectory,'/');
assert.equal(observed.deployCommand,'npx wrangler versions upload');
assert.equal(observed.buildCommand,'');
assert.ok(!observed.deployCommand.includes(' --config '));
assert.ok(!observed.deployCommand.includes(' --cwd '));
assert.ok(!observed.deployCommand.match(/versions upload\s+\S+\.(?:js|ts|mjs)/));
const names=Object.fromEntries(configs.map(c=>[c.path,c.name]));
assert.equal(names['cloudflare-d1/wrangler.toml'],'trendos-d1-api');
assert.equal(names['cloudflare-d1/wrangler.frontend.toml'],'trendos-ui');
assert.equal(names['autonomous-printshop/production-shadow/wrangler.toml'],'autonomous-printshop-shadow');
assert.equal(configs.some(c=>c.name===observed.worker),false,'TARGET_NAME_MISMATCH');

function qualifyConfigForWorker(worker,path){
  const c=configs.find(c=>c.path===path);
  if(!c)return 'UNKNOWN_CONFIG_TARGET';
  if(c.name!==worker)return 'WORKER_NAME_MISMATCH_BLOCKED';
  if(!existsSync(join(root,dirname(c.path),c.main)))return 'ENTRYPOINT_MISSING_BLOCKED';
  return 'TARGET_CONSISTENT_FOR_REVIEW_ONLY';
}
assert.equal(qualifyConfigForWorker('trendos','cloudflare-d1/wrangler.toml'),
 'WORKER_NAME_MISMATCH_BLOCKED');
assert.equal(qualifyConfigForWorker('autonomous-printshop-shadow',
 'autonomous-printshop/production-shadow/wrangler.toml'),
 'TARGET_CONSISTENT_FOR_REVIEW_ONLY');
assert.equal(qualifyConfigForWorker('trendos-tasks-v3-t1-preview-20260914',
 'autonomous-printshop/production-shadow/wrangler.toml'),
 'WORKER_NAME_MISMATCH_BLOCKED');

console.log('AP100_CLOUDFLARE_SCREENSHOT_ROOT_COMMAND=REPRODUCED');
console.log('AP100_MISSING_ROOT_WRANGLER_ENTRYPOINT=CONFIRMED');
console.log('AP100_TARGET_TRENDOS_HAS_NO_VERIFIED_MATCHING_CONFIG=BLOCKED_SAFE');
console.log('AP100_DO_NOT_REPOINT_TRENDOS_TO_TRENDOS_D1_API=PASS');
console.log('AP100_CLOUDFLARE_BUILD_BRANCH_ISOLATION=NOT_APPLIED');
console.log('AP100_PRODUCTION_UPLOAD=0; WORKER_DEPLOY=0; D1_WRITES=0');
