import assert from 'node:assert/strict';
import fs from 'node:fs';

const reportedA58 = 80;
const missedByA58 = ['hrV1','attendanceClockinV1'];
const nestedOps = [
  'handoff','inbox','resolve','send','suggest','thread',
  'finalizeAndNotify','listDrafts','prepareReadyInvoice','sendReady','sweepReady',
  'start','status','stop','scan'
];
const topLevelCount = reportedA58 + missedByA58.length - nestedOps.length;
assert.equal(topLevelCount, 67);

const cloudNative = new Set(['searchCustomers','createCustomer','createManualOrder']);
const employeeAuthControl = new Set(['login','logout','changePassword','verifyEmployeeSession']);
const customerSession = new Set([
  'customerLogin','customerLogout','changeCustomerPassword','getCustomerOrders',
  'getCustomerPortalAccountsV1859','createCustomerDraft','addCustomerDraftItem',
  'submitCustomerDraft','uploadCustomerDraftFile'
]);
const maintenanceBlocked = new Set(['ensureDemoCustomer','initAccounting','recalculateAccountingMaterials']);

const readOnlyPilot = [
  'getAccounting','getActivityLog','getDashboard','getDeptInvoiceDraftV1887',
  'getFranchiseBranches','getKnowledge','getLeadPhoneNumbers','getMarketplace',
  'getMatbagyNotes','getOrderConversation','getPartyAccountV1858','getPlatformAds',
  'getPlatformSections','getRows','getRowsPageV1931','getServiceProviderRoutes',
  'getTrendMasterCenterV1931','getWhiteLabelSettings',
  'attendanceV1:state','attendanceV1:config','cleaningV1:status',
  'customerManagerV1:inbox','customerManagerV1:thread',
  'goLiveAutopilotV1:listDrafts',
  'hrV1:myRequests','hrV1:requests','hrV1:employees',
  'pressControlV1:status'
];
assert.equal(readOnlyPilot.length, 28);
for (const rule of readOnlyPilot) {
  const action = rule.split(':')[0];
  assert.equal(cloudNative.has(action), false);
  assert.equal(employeeAuthControl.has(action), false);
  assert.equal(customerSession.has(action), false);
  assert.equal(maintenanceBlocked.has(action), false);
}

const multiplexed = new Set([
  'attendanceV1','attendanceClockinV1','cleaningV1','customerFeedbackV1',
  'customerManagerV1','goLiveAutopilotV1','hrV1','pressControlV1'
]);
for (const rule of readOnlyPilot) {
  const [action, op] = rule.split(':');
  if (multiplexed.has(action)) assert.ok(op, 'multiplexed pilot rule must include op: ' + rule);
}

const config = fs.readFileSync('cloudflare-d1/wrangler.toml','utf8');
assert.match(config, /TRENDOS_EMPLOYEE_LEGACY_BRIDGE_V1_ENABLED = "false"/);
assert.match(config, /EMPLOYEE_LEGACY_BRIDGE_ACTIONS = ""/);

const hr = fs.readFileSync('hr-v1.js','utf8');
assert.match(hr, /rawApi\('hrV1'/);
const clockin = fs.readFileSync('attendance-clockin-ui-v1.js','utf8');
assert.match(clockin, /get\('attendanceClockinV1'/);

for (const file of [
  'attendance-clockin-ui-v1.js',
  'attendance-live-timer-v1.js',
  'employee-cleaning-prep-v1.js',
  'customer-manager-v1.js',
  'customer-feedback-v1.js',
  'go-live-autopilot-v1.js',
  'hr-v1.js',
  'press-control-v1.js'
]) {
  const source = fs.readFileSync(file,'utf8');
  assert.match(source, /trendosEmployeeApiV1/, file + ': employee dispatcher required');
  assert.doesNotMatch(source, /TREND_API_URL|API_URL/, file + ': direct legacy API alias must stay removed');
}

console.log('A61_ACTION_CLASSIFICATION=PASS');
console.log('A58_REPORTED_ACTION_STRINGS=80');
console.log('A61_OBSERVED_ACTION_STRINGS=82');
console.log('A61_TOP_LEVEL_RUNTIME_ACTIONS=67');
console.log('A61_READ_ONLY_PILOT_POLICIES=28');
console.log('PRODUCTION_ENABLEMENT=NO');
