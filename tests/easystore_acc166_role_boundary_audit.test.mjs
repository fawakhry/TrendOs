import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('cloudflare-d1/src/employee-accounting-native-v1.mjs','utf8');
const legacyAuth=fs.readFileSync('cloudflare-d1/src/employee-auth-native-v1.mjs','utf8');
const piece=(a,b)=>{
  const start=source.indexOf(a),end=source.indexOf(b,start+a.length);
  assert.ok(start>=0&&end>start,'cannot inspect authoritative accounting source');
  return source.slice(start,end);
};
const modeBody=piece('function accountingMode(user){','function departmentForMode(mode){');
const permissionsBody=piece('function permissions(auth){','async function event(');
const authBody=piece('async function authenticate(request,body,env){','function permissions(auth){');
const context={
  text:value=>String(value??'').trim(),
  key:value=>String(value??'').trim().toLowerCase()
};
vm.runInNewContext(modeBody+permissionsBody+
  '\nthis.accountingMode=accountingMode; this.permissions=permissions;',context);
const mode=context.accountingMode;
const cases=[
  {user:{username:'synthetic-admin',role:'admin',department:'neutral'},mode:'full'},
  {user:{username:'synthetic-print',role:'print',department:'neutral'},mode:'print'},
  {user:{username:'synthetic-laser',role:'laser',department:'neutral'},mode:'laser'},
  {user:{username:'synthetic-service',role:'service',department:'neutral'},mode:'none'}
];
for(const test of cases)assert.equal(mode(test.user),test.mode,'authenticated role baseline changed');
const full=context.permissions({mode:'full',department:''});
const print=context.permissions({mode:'print',department:'طباعة'});
const restricted=context.permissions({mode:'none',department:''});
assert.equal(full.canManageCustody,true);
assert.equal(print.canManageCustody,false);
assert.equal(print.canCloseDepartmentDay,false);
assert.equal(restricted.canEnterDeptLine,false);
// Deterministic code review of TRUST BOUNDARIES, no real session or financial request.
// Flag risks rather than quietly declaring an unsafe employee permission matrix approved.
assert.ok(authBody.includes('verifyEmployeeSessionCloudFirst'),'server session verification missing');
assert.ok(legacyAuth.includes('export async function verifyNativeEmployeeSession'),'native session verifier missing');
const bodyRoleFallback=/\bu\.role\s*\|\|\s*b\.role\b/.test(authBody);
const bodyDepartmentFallback=/\bu\.department\s*\|\|\s*b\.department\b/.test(authBody);
const nameOrDepartmentPromotes=/\[user\.username,user\.role,user\.department\]/.test(modeBody);
const unsafeFullByName=/\|\|\/ضياء\|diaa\//.test(modeBody);
const roleGateApproved=!bodyRoleFallback&&!bodyDepartmentFallback&&!nameOrDepartmentPromotes&&!unsafeFullByName;
const report={
  phase:'ACC-166',
  assessment:'STATIC_SOURCE_AND_ISOLATED_SYNTHETIC_ROLE_FUNCTIONS',
  roleBaseline:'PASS',
  trustedSessionVerifierPresent:true,
  clientRoleFallbackDetected:bodyRoleFallback,
  clientDepartmentFallbackDetected:bodyDepartmentFallback,
  heuristicPrivilegePromotionDetected:nameOrDepartmentPromotes||unsafeFullByName,
  employeeIdentityAndRoleGrantsVerified:false,
  employeePermissionSignoff:'MISSING',
  roleReleaseDecision:'NO_GO',
  financeRequestsSent:0,
  d1Writes:0
};
assert.equal(report.roleReleaseDecision,'NO_GO');
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/acc166-role-boundary.json',JSON.stringify(report,null,2)+'\n');
console.log('ACC166_TRUSTED_ROLE_BASELINE=PASS');
console.log('ACC166_ROLE_BOUNDARY_AUDIT='+ (roleGateApproved?'NO_SOURCE_RISKS_DETECTED':'REVIEW_REQUIRED'));
console.log('ACC166_ROLE_RELEASE=NO_GO');
console.log('ACC166_FINANCE_REQUESTS=ZERO');
