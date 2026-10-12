import test from 'node:test';
import assert from 'node:assert/strict';
import {
  UBUNTU_DIAGNOSTIC_CONTRACT_V0 as POLICY,
  reviewUbuntuOfflineDiagnosticFixture as review,
} from '../core/ubuntu-offline-diagnostic-envelope-v0.mjs';

const NAMES=['TRENDOS_UI','TRENDOS_API','PRINT_SERVER','CUPS','PRINTER_DEVICE','LOCAL_DIAGNOSTIC_AGENT'];
const make=(p={})=>({
 schema:'PRINTSHOP_UBUNTU_OFFLINE_DIAGNOSTIC_V0',
 source:'SYNTHETIC_TEST_FIXTURE',
 mode:'OFFLINE_NO_HOST',
 reportId:'FAKE-REPORT-0001',
 observedAt:'2026-10-12T10:11:12.000Z',
 deviceReady:true,
 services:NAMES.map((module,i)=>({
  module,state:'MOCK_RUNNING',sourceEvidenceRef:'FAKE-EVIDENCE-'+(i+100),
 })),
 ...p,
});
const assertNever=x=>{
 assert.equal(x.syntheticOnly,true);
 assert.equal(x.realUbuntuConnected,false);
 assert.equal(x.realPrinterConnected,false);
 assert.equal(x.printServerProvedProductionReady,false);
 assert.equal(x.executeUbuntuAllowed,false);
 assert.equal(x.sendPrintJobAllowed,false);
 assert.equal(x.grantStaffPrivilegeAllowed,false);
 assert.equal(x.writeAccountingOrStockAllowed,false);
 assert.equal(x.remotelyDeployAllowed,false);
 assert.equal(x.ownerApprovalSupplied,false);
 assert.equal(x.releaseDecision,'NO_GO');
 assert.equal(x.ownerGates,'G1_G2_G3_G4_G5_OPEN');
};
test('policy has no Ubuntu host bridge or printing/financial execution capability',()=>{
 assert.equal(POLICY.currentExecutionBridge,'NOT_CONNECTED');
 assert.equal(POLICY.canExecuteOSCommands,false);
 assert.equal(POLICY.canSendPrintJobs,false);
 assert.equal(POLICY.printServerTestEquatesToProduction,false);
 assert.equal(POLICY.readsRealLogs,false);
 assert.equal(POLICY.canChangeGitHubOrCloudflare,false);
});
test('green synthetic fixture is only a review, never real print server proof',()=>{
 const x=review(make());
 assert.equal(x.status,'SYNTHETIC_DIAGNOSTICS_GREEN_REVIEW_ONLY');
 assert.equal(x.hypotheticalAllComponentsReportedRunning,true);
 assert.deepEqual(x.hypotheticalIssues,[]);
 assert.deepEqual([...x.reviewedModules],NAMES);
 assert.equal(x.realMachineAndPrintServerAcceptance,'NOT_TESTED');
 assertNever(x);
});
test('synthetic print server stopped blocks hypothetical green',()=>{
 const m=make();
 m.services[2].state='MOCK_STOPPED';
 const x=review(m);
 assert.equal(x.status,'SYNTHETIC_DIAGNOSTICS_NEED_REVIEW');
 assert.deepEqual(x.hypotheticalIssues,['PRINT_SERVER']);
 assertNever(x);
});
test('unknown Ubuntu machine status cannot be treated as success',()=>{
 const m=make();
 m.services[5].state='MOCK_UNKNOWN';
 const x=review(m);
 assert.deepEqual(x.hypotheticalIssues,['LOCAL_DIAGNOSTIC_AGENT']);
 assertNever(x);
});
test('simulated local printer readiness false forces review despite all running modules',()=>{
 const x=review(make({deviceReady:false}));
 assert.deepEqual(x.hypotheticalIssues,['PRINTER_DEVICE_READY_FALSE']);
 assertNever(x);
});
test('two fictional failures and physical readiness fail are all visible',()=>{
 const m=make({deviceReady:false});
 m.services[0].state='MOCK_STOPPED';
 m.services[3].state='MOCK_UNKNOWN';
 const x=review(m);
 assert.deepEqual(x.hypotheticalIssues,['TRENDOS_UI','CUPS','PRINTER_DEVICE_READY_FALSE']);
 assertNever(x);
});
for(const [name,data] of [
 ['none',null],['array',[]],['string','RUN'],['number',4],
 ['alternate prototype',Object.create({schema:'PRINTSHOP_UBUNTU_OFFLINE_DIAGNOSTIC_V0'})],
]){
 test('reject non-standard fixture object '+name,()=>{
  const x=review(data);
  assert.equal(x.status,'STOP_UNEXPECTED_OR_SENSITIVE_INPUT_FIELD');
  assertNever(x);
 });
}
for(const [key,value] of [
 ['command','sudo systemctl restart cups'],
 ['shell','bash'],
 ['exec','rm -rf /'],
 ['sshHost','10.1.1.1'],
 ['hostname','real-ubuntu'],
 ['ip','127.0.0.1'],
 ['url','https://example.invalid'],
 ['accessToken','sk-not-real'],
 ['secret','FAKE-SECRET'],
 ['env',{CLOUDFLARE_API_TOKEN:'not-real'}],
 ['logs','private customer orders'],
 ['stdout','token output'],
 ['path','/home/user/jobs'],
 ['printerJob','FAKE-ORDER-1'],
 ['printPayload','fake data'],
 ['customerId','FAKE-CUSTOMER-ID'],
 ['sensitiveCredentials',{}],
 ['writeEnabled',true],
 ['release',true],
 ['ownerApproved',true],
]){
 test('never accept top-level authority/secret/command '+key,()=>{
  const x=review(make({[key]:value}));
  assert.equal(x.status,'STOP_UNEXPECTED_OR_SENSITIVE_INPUT_FIELD');
  assertNever(x);
 });
}
for(const [name,changes] of [
 ['missing schema',{schema:undefined}],
 ['real mode',{mode:'LIVE'}],
 ['real machine source',{source:'UBUNTU_LIVE'}],
 ['untrusted username',{reportId:'root@local'}],
 ['invalid report evidence',{reportId:'FAKE!'}],
 ['unverified date',{observedAt:'yesterday'}],
 ['date with timezone offset',{observedAt:'2026-10-12T10:11:12+03:00'}],
 ['unknown readiness',{deviceReady:null}],
 ['number readiness',{deviceReady:1}],
]){
 test('reject non-synthetic envelope '+name,()=>{
  const x=review(make(changes));
  assert.equal(x.status,'STOP_NO_VERIFIED_SYNTHETIC_ENVELOPE');
  assertNever(x);
 });
}
for(const [name,svc] of [
 ['empty',[]],
 ['incomplete',make().services.slice(0,5)],
 ['extra',make().services.concat({module:'UNEXPECTED',state:'MOCK_RUNNING',sourceEvidenceRef:'FAKE-XYZ1'})],
]){
 test('module coverage stopped for '+name,()=>{
  const x=review(make({services:svc}));
  assert.equal(x.status,'STOP_INCOMPLETE_MOCK_MODULE_COVERAGE');
  assertNever(x);
 });
}
for(const [name,mutate,expected] of [
 ['duplicate same module',svc=>svc[4].module='CUPS','STOP_BAD_DUPLICATE_OR_UNPROVEN_MOCK_MODULE'],
 ['unexpected module',svc=>svc[2].module='UBUNTU_REAL','STOP_BAD_DUPLICATE_OR_UNPROVEN_MOCK_MODULE'],
 ['real running label',svc=>svc[0].state='RUNNING','STOP_BAD_DUPLICATE_OR_UNPROVEN_MOCK_MODULE'],
 ['malformed fake evidence',svc=>svc[3].sourceEvidenceRef='TOKEN','STOP_BAD_DUPLICATE_OR_UNPROVEN_MOCK_MODULE'],
 ['evidence reused',svc=>svc[2].sourceEvidenceRef=svc[1].sourceEvidenceRef,'STOP_REUSED_MOCK_EVIDENCE_REFERENCE'],
 ['path under service',svc=>svc[0].path='/dev/usb/lp0','STOP_BAD_DUPLICATE_OR_UNPROVEN_MOCK_MODULE'],
 ['service shell',svc=>svc[0].command='lpadmin','STOP_BAD_DUPLICATE_OR_UNPROVEN_MOCK_MODULE'],
 ['service credentials',svc=>svc[0].token='fake','STOP_BAD_DUPLICATE_OR_UNPROVEN_MOCK_MODULE'],
]){
 test('reject unsafe or duplicated module '+name,()=>{
  const m=make();
  mutate(m.services);
  const x=review(m);
  assert.equal(x.status,expected);
  assertNever(x);
 });
}
test('fake PR payload cannot assert financial release via output object',()=>{
 const x=review(make());
 assert.equal(x.releaseDecision,'NO_GO');
 assert.equal(Object.isFrozen(x),true);
 assert.equal(Object.isFrozen(x.hypotheticalIssues),true);
 assert.equal(Object.isFrozen(x.reviewedModules),true);
});
console.log('PRINTSHOP_UBUNTU_DIAGNOSTIC_V0=OFFLINE_SYNTHETIC_ONLY');
console.log('PRINTSHOP_UBUNTU_AND_CHATGPT_EXECUTION_BRIDGE=NOT_CONNECTED');
console.log('PRINT_SERVER_SIMULATED_GREEN_IS_NOT_PRODUCTION_READY=PASS');
console.log('PRINTSHOP_REAL_PRINTER_ACCOUNTING_INVENTORY_OPERATIONS=ZERO');
console.log('FINANCE_RELEASE=NO_GO');
