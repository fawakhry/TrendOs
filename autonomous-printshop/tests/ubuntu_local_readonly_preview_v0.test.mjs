import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 LOCAL_PROCESS_PREVIEW_POLICY_V0 as policy,
 reviewReadOnlyLocalProcessMetricsV0 as check,
} from '../local-ubuntu/read-only-process-preview-v0.mjs';
import {reviewSignedUbuntuMockEvidenceV1 as verifyMock} from '../core/ubuntu-signed-mock-evidence-v1.mjs';

const good=(patch={})=>({
 platform:'linux',
 uptimeSeconds:2*3600,
 totalMemoryBytes:10_000_000_000,
 freeMemoryBytes:4_000_000_000,
 ...patch,
});
function denied(x){
 assert.equal(x.financeRelease,'NO_GO');
 assert.equal(x.printshopRelease,'NO_GO');
 assert.equal(x.connectedToChatGPT,false);
 assert.equal(x.printerReadyVerified,false);
 assert.equal(x.printServerProductionReady,false);
 assert.equal(x.realProductionApproval,false);
 assert.equal(x.hostIdentityVerified,false);
 assert.equal(x.ubuntuDistributionVerified,false);
 assert.equal(x.servicesVerified,false);
 assert.equal(x.canExecuteCommands,false);
 assert.equal(x.canRunServiceActions,false);
 assert.equal(x.canPrint,false);
 assert.equal(x.canChangeAccountingOrStock,false);
 assert.equal(x.canChangePermissions,false);
 assert.equal(x.ownerGates,'G1_G2_G3_G4_G5_OPEN');
 assert.equal(Object.isFrozen(x),true);
 assert.equal(x.serviceStates.length,6);
 assert.equal(x.serviceStates.every(s=>s.state==='NOT_PROBED'),true);
}
test('policy has no host identity, logs, queues, shell, network or private data',()=>{
 assert.equal(policy.automaticCollection,false);
 for(const flag of [
  'collectsHostname','collectsUserName','collectsIP','collectsMacAddress',
  'collectsLogs','collectsPaths','collectsCustomerData','collectsPrinterQueues',
  'collectsOpenPorts','canRunShell','canUseSSH','canUseNetwork',
  'canReadFilesystem','canWriteFilesystem','canStartOrStopServices',
  'canQueryCUPS','canSubmitPrintJobs','canDeployOrMerge',
 ])assert.equal(policy[flag],false,flag);
 assert.equal(policy.readonlySampler,'MANUAL_OPT_IN_ONLY');
});
test('valid Linux metrics only yield unsigned local preview with NO_GO',()=>{
 const out=check(good());
 assert.equal(out.status,'LOCAL_LINUX_UNSIGNED_PREVIEW_NOT_PRODUCTION_PROOF');
 assert.equal(out.memoryPressure,'NORMAL');
 assert.equal(out.uptimeBand,'ONE_TO_24_HOURS');
 denied(out);
});
test('valid Linux numbers never prove Ubuntu distribution',()=>{
 const out=check(good());
 assert.equal(out.ubuntuDistributionVerified,false);
 assert.equal(out.hostIdentityVerified,false);
 denied(out);
});
for(const [name,n,expected] of [
 ['fast reboot',0,'UNDER_1_HOUR'],
 ['almost hour',3599.9,'UNDER_1_HOUR'],
 ['hour',3600,'ONE_TO_24_HOURS'],
 ['almost day',86399,'ONE_TO_24_HOURS'],
 ['day',86400,'OVER_24_HOURS'],
 ['weeks',1209600,'OVER_24_HOURS'],
]){
 test('bucketed uptime '+name,()=>{
  const out=check(good({uptimeSeconds:n}));
  assert.equal(out.uptimeBand,expected);denied(out);
 });
}
for(const [name,free,expected] of [
 ['all free',10_000_000_000,'NORMAL'],
 ['69 percent used',3_100_000_000,'NORMAL'],
 ['70 percent used',3_000_000_000,'ELEVATED'],
 ['89 percent used',1_100_000_000,'ELEVATED'],
 ['90 percent used',1_000_000_000,'HIGH'],
 ['none free',0,'HIGH'],
]){
 test('bucketed memory pressure '+name,()=>{
  const out=check(good({freeMemoryBytes:free}));
  assert.equal(out.memoryPressure,expected);denied(out);
 });
}
for(const [name,data] of [
 ['null',null],['empty',{}],['array',[]],
 ['string','ubuntu'],['integer',42],
 ['prototype payload',Object.create({platform:'linux'})],
 ['unknown hostname',{...good(),hostname:'private-machine'}],
 ['unknown print spool',{...good(),queue:'LP0'}],
 ['unknown customer id',{...good(),customer:'private-order'}],
 ['unknown URL',{...good(),url:'https://example.invalid'}],
 ['unknown admin request',{...good(),ownerApproved:true}],
 ['secret',{...good(),token:'FAKE'}],
]){
 test('reject invalid or sensitive record '+name,()=>{
  const out=check(data);
  assert.equal(out.status,'STOP_UNEXPECTED_OR_ACCESSOR_METRICS');
  denied(out);
 });
}
test('accessor values never execute while input is being validated',()=>{
 let calls=0;
 const d=good();
 Object.defineProperty(d,'freeMemoryBytes',{enumerable:true,get(){calls++;throw Error('secret')}});
 const out=check(d);
 assert.equal(calls,0);
 assert.equal(out.status,'STOP_UNEXPECTED_OR_ACCESSOR_METRICS');
 denied(out);
});
test('symbol-key hidden data is rejected',()=>{
 const d=good();
 d[Symbol('credential')]='private';
 const out=check(d);
 assert.equal(out.status,'STOP_UNEXPECTED_OR_ACCESSOR_METRICS');denied(out);
});
for(const [name,overrides,code] of [
 ['darwin',{platform:'darwin'},'STOP_NOT_LINUX_PROCESS'],
 ['windows',{platform:'win32'},'STOP_NOT_LINUX_PROCESS'],
 ['missing platform',{platform:undefined},'STOP_NOT_LINUX_PROCESS'],
 ['negative uptime',{uptimeSeconds:-1},'STOP_INVALID_UPTIME_METRIC'],
 ['NaN uptime',{uptimeSeconds:NaN},'STOP_INVALID_UPTIME_METRIC'],
 ['infinite uptime',{uptimeSeconds:Infinity},'STOP_INVALID_UPTIME_METRIC'],
 ['string uptime',{uptimeSeconds:'3600'},'STOP_INVALID_UPTIME_METRIC'],
 ['unreasonable uptime',{uptimeSeconds:3651*86400},'STOP_INVALID_UPTIME_METRIC'],
 ['zero memory',{totalMemoryBytes:0},'STOP_INVALID_MEMORY_METRIC'],
 ['negative free memory',{freeMemoryBytes:-1},'STOP_INVALID_MEMORY_METRIC'],
 ['free greater than total',{freeMemoryBytes:11_000_000_000},'STOP_INVALID_MEMORY_METRIC'],
 ['unsafe memory integer',{totalMemoryBytes:Number.MAX_SAFE_INTEGER+1},'STOP_INVALID_MEMORY_METRIC'],
 ['fractional free',{freeMemoryBytes:1.5},'STOP_INVALID_MEMORY_METRIC'],
 ['missing free',{freeMemoryBytes:undefined},'STOP_INVALID_MEMORY_METRIC'],
]){
 test('bad local reading '+name+' must fail closed',()=>{
  const out=check(good(overrides));assert.equal(out.status,code);denied(out);
 });
}
test('only coarse values are returned, no raw process identifiers or metrics',()=>{
 const out=check(good());
 const raw=JSON.stringify(out);
 for(const privateKey of ['hostname','username','hostIp','serial','customer','pid',
  'uptimeSeconds','totalMemoryBytes','freeMemoryBytes','diskPath','usbDevice',
  'requestUrl','localPrinterQueue','logs'])assert.equal(raw.includes('"'+privateKey+'"'),false);
 denied(out);
});
test('local preview cannot be used as a trusted Ed25519 fake signature envelope',async()=>{
 const out=check(good());
 const verified=await verifyMock(out,null);
 assert.equal(verified.status,'STOP_UNTRUSTED_OR_NONMOCK_DIAGNOSTIC_ENVELOPE');
 assert.equal(verified.releaseDecision,'NO_GO');
});
test('CLI is default inert, no package manager, subprocess, shells or filesystem API',()=>{
 const src=readFileSync(new URL('../local-ubuntu/manual-readonly-preview-v0.mjs',import.meta.url),'utf8');
 assert.match(src,/--preview-local/);
 assert.match(src,/--help/);
 assert.match(src,/node:os/);
 for(const bad of [
  /from ['"]node:(?:child_process|fs|net|http|https|tls|dgram|worker_threads)['"]/,
  /\b(?:exec|spawn|execFile|fetch|listen|connect|writeFileSync|systemctl|lpstat|lpadmin|lpr)\s*\(/,
 ])assert.equal(bad.test(src),false);
 assert.match(src,/args.length===1&&args\[0\]==='--preview-local'/);
 assert.match(src,/LOCAL_PREVIEW_V0_NO_ACTION/);
});
console.log('LOCAL_UBUNTU_PREVIEW=MANUAL_OPT_IN_ONLY_NO_NETWORK_OR_PRINT');
console.log('LOCAL_UBUNTU_HARDWARE_AND_DISTRO_IDENTITY=UNVERIFIED');
console.log('LOCAL_UBUNTU_LINUX_SERVICE_STATES=NOT_PROBED');
console.log('CHATGPT_UBUNTU_EXECUTION_BRIDGE=NOT_CONNECTED');
console.log('FINANCE_RELEASE=NO_GO');
