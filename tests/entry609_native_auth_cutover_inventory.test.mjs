import assert from 'node:assert/strict';
import fs from 'node:fs';

function extractSet(source, name) {
  const re = new RegExp('(?:const|var)\\s+' + name + '\\s*=\\s*new Set\\(\\[([\\s\\S]*?)\\]\\)');
  const m = source.match(re);
  assert.ok(m, 'missing set '+name);
  return [...m[1].matchAll(/['"]([^'"]+)['"]/g)].map(x => x[1]);
}

const legacySource = fs.readFileSync('cloudflare-d1/src/legacy-browser-transport-v1.mjs','utf8');
const dispatcher = fs.readFileSync('employee-api-dispatcher-v1.js','utf8');
const config = fs.readFileSync('config.js','utf8');
const wrangler = fs.readFileSync('cloudflare-d1/wrangler.toml','utf8');
const edge = fs.readFileSync('trendos-edge-orders-read-v1.js','utf8');

const legacyTransport = new Set(extractSet(legacySource,'LEGACY_BROWSER_ACTIONS'));
const customer = new Set(extractSet(dispatcher,'CUSTOMER_SESSION_ACTIONS'));
const cloud = new Set(extractSet(dispatcher,'CLOUD_EDGE_ACTIONS'));
const opScoped = new Set(extractSet(dispatcher,'OP_SCOPED_ACTIONS'));
const auth = new Set(['login','logout','verifyEmployeeSession','changePassword']);
const maintenance = new Set(['ensureDemoCustomer','initAccounting','recalculateAccountingMaterials']);

const activeLegacy = [
  'approveAccountingDeptInvoice','archiveDeliveredDepartmentV1926','assignCustomerBranch',
  'attendanceClockinV1','attendanceV1','bulkUpdateDepartmentStatusV1926','cleaningV1',
  'customerFeedbackV1','customerManagerV1','deletePlatformAd','getAccounting','getActivityLog',
  'getDashboard','getDeptInvoiceDraftV1887','getFranchiseBranches','getKnowledge',
  'getLeadPhoneNumbers','getMarketplace','getMatbagyNotes','getOrderConversation',
  'getPartyAccountV1858','getPlatformAds','getPlatformSections','getRows',
  'getServiceProviderRoutes','getTrendMasterCenterV1931','getWhiteLabelSettings',
  'goLiveAutopilotV1','hrV1','pressControlV1','saveAccountingDeptLine',
  'saveAccountingFinalInvoice','saveAccountingMaterial','saveAccountingTemplate',
  'saveFranchiseBranch','saveKnowledge','saveMarketplaceProduct','saveMarketplaceVendor',
  'saveMatbagyNote','savePartyLedgerTransaction','savePlatformSection',
  'saveServiceProviderRoute','saveWhiteLabelSettings','sendOrderConversationMessage',
  'uploadOrderConversationFile','uploadPlatformAd'
];
assert.equal(activeLegacy.length,46);
for (const action of activeLegacy) {
  assert.ok(legacyTransport.has(action), 'active bridge action missing from legacy transport: '+action);
  assert.ok(!customer.has(action), 'customer action misclassified: '+action);
  assert.ok(!cloud.has(action), 'cloud action misclassified: '+action);
  assert.ok(!auth.has(action), 'auth action misclassified: '+action);
  assert.ok(!maintenance.has(action), 'maintenance action misclassified: '+action);
}

const transportCandidates = [...legacyTransport].filter(a =>
  !customer.has(a) && !cloud.has(a) && !auth.has(a) && !maintenance.has(a)
).sort();
assert.equal(transportCandidates.length,51);
const dormant = transportCandidates.filter(a => !activeLegacy.includes(a));
assert.deepEqual(dormant,[
  'getTrendMasterPanelV1931','operatorTaskV2','prepareReadyInvoice','updateRowV1931','workQueueV1'
]);

const activeOps = {
  attendanceV1: ['state','start','pause','resume','restStart','prayerStart','confirm','missedCheck','end'],
  attendanceClockinV1: ['clockin'],
  cleaningV1: ['complete'],
  customerFeedbackV1: ['scan'],
  customerManagerV1: ['inbox','thread','suggest','send','handoff','resolve'],
  goLiveAutopilotV1: ['sweepReady','listDrafts','finalizeAndNotify','sendReady','prepareReadyInvoice'],
  hrV1: ['myRequests','requests','submitRequest'],
  pressControlV1: ['status','start','stop']
};
for (const action of Object.keys(activeOps)) assert.ok(opScoped.has(action), action+' must be op-scoped');
const activeOpPolicies = Object.entries(activeOps).flatMap(([a,ops]) => ops.map(op => a+':'+op));
assert.equal(activeOpPolicies.length,29);

const nonOpActive = activeLegacy.filter(a => !opScoped.has(a));
assert.equal(nonOpActive.length,38);
const hybridFallbackPolicies = ['updateLine','markCustomerNotified'];
assert.match(edge,/employeeLegacyFallback[\s\S]*updateLine|action === 'updateLine'/);
assert.match(edge,/markCustomerNotified/);

const fullActiveParityPolicies = [...new Set([
  ...nonOpActive,
  ...activeOpPolicies,
  ...hybridFallbackPolicies
])];
assert.equal(fullActiveParityPolicies.length,69);

const readOnlyPilot = [
  'getAccounting','getActivityLog','getDashboard','getDeptInvoiceDraftV1887',
  'getFranchiseBranches','getKnowledge','getLeadPhoneNumbers','getMarketplace',
  'getMatbagyNotes','getOrderConversation','getPartyAccountV1858','getPlatformAds',
  'getPlatformSections','getRows','getServiceProviderRoutes','getTrendMasterCenterV1931',
  'getWhiteLabelSettings','attendanceV1:state','attendanceV1:config','cleaningV1:status',
  'customerManagerV1:inbox','customerManagerV1:thread','goLiveAutopilotV1:listDrafts',
  'hrV1:myRequests','hrV1:requests','hrV1:employees','pressControlV1:status'
];
assert.equal(readOnlyPilot.length,27);
assert.ok(!readOnlyPilot.includes('getRowsPageV1931'), 'Cloud edge read must not be a bridge policy');

const code = fs.readFileSync('Code.gs','utf8');
assert.match(code,/function cleaningV1_\([\s\S]*?op===\"status\"/, 'cleaningV1:status must remain a supported read-only bridge probe');
assert.match(code,/function attendanceV1_\([\s\S]*?op===\"state\"\|\|op===\"config\"/, 'attendanceV1:config must remain supported');
assert.match(code,/function hrV1_\([\s\S]*?op===\"employees\"/, 'hrV1:employees must remain supported');

assert.match(config,/MATBAGY_EMPLOYEE_NATIVE_AUTH_V1 = false/);
assert.match(config,/MATBAGY_EMPLOYEE_LEGACY_BRIDGE_V1 = false/);
assert.match(config,/MATBAGY_EMPLOYEE_LEGACY_BRIDGE_POLICIES = \[\]/);
assert.match(wrangler,/TRENDOS_EMPLOYEE_AUTH_V1_ENABLED = "false"/);
assert.match(wrangler,/TRENDOS_EMPLOYEE_AUTH_LEGACY_SESSION_ENROLL_V1_ENABLED = "false"/);
assert.match(wrangler,/TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED = "false"/);
assert.match(wrangler,/EMPLOYEE_LEGACY_BRIDGE_ACTIONS = ""/);
assert.doesNotMatch(wrangler,/EMPLOYEE_LEGACY_BRIDGE_SECRET_V1\s*=/);

console.log('ENTRY609_NATIVE_AUTH_CUTOVER_INVENTORY=PASS');
console.log('ENTRY609_ACTIVE_EMPLOYEE_LEGACY_TOP_LEVEL=46');
console.log('ENTRY609_TRANSPORT_EMPLOYEE_CANDIDATES=51');
console.log('ENTRY609_DORMANT_TRANSPORT_ONLY=5');
console.log('ENTRY609_ACTIVE_OP_POLICIES=29');
console.log('ENTRY609_FULL_ACTIVE_PARITY_POLICY_COUNT=69');
console.log('ENTRY609_READONLY_PILOT_POLICY_COUNT=27');
console.log('ENTRY609_CLEANING_STATUS_SUPPORTED=YES');
console.log('ENTRY609_AUTH_FLAGS_STILL_OFF=YES');
console.log('ENTRY609_PRODUCTION_MUTATION=NO');
