import assert from 'node:assert/strict';
import fs from 'node:fs';
import { isEmployeeContentNativePath } from '../cloudflare-d1/src/employee-content-native-v1.mjs';

const sql=fs.readFileSync('cloudflare-d1/migrations/0013_employee_content_zero_google_v1.sql','utf8');
const mod=fs.readFileSync('cloudflare-d1/src/employee-content-native-v1.mjs','utf8');
const index=fs.readFileSync('cloudflare-d1/src/index_v2.js','utf8');

assert.match(sql,/ENTRY614_EMPLOYEE_CONTENT_V1/);
assert.match(sql,/mode TEXT NOT NULL DEFAULT 'OFF'/);
assert.match(sql,/employee_content_records_v1/);
assert.match(sql,/employee_content_files_v1/);
assert.match(sql,/employee_content_events_v1/);
assert.match(sql,/platform_sections/);
assert.match(sql,/franchise_branches/);
assert.match(sql,/service_provider_routes/);

const actions=[
  'getPlatformSections','savePlatformSection','getFranchiseBranches','saveFranchiseBranch',
  'assignCustomerBranch','getServiceProviderRoutes','saveServiceProviderRoute','getMarketplace',
  'saveMarketplaceVendor','saveMarketplaceProduct','getWhiteLabelSettings','saveWhiteLabelSettings',
  'getLeadPhoneNumbers','getPlatformAds','deletePlatformAd','uploadPlatformAd',
  'getKnowledge','saveKnowledge','getMatbagyNotes','saveMatbagyNote'
];
for(const action of actions) assert.ok(mod.includes("'"+action+"'"), 'missing action '+action);

assert.match(mod,/authority:'d1-employee-content-v1'/);
assert.match(mod,/googleBusinessCalls:0/);
assert.match(mod,/appsScriptBusinessAuthority:false/);
assert.match(mod,/verifyEmployeeSessionCloudFirst/);
assert.match(mod,/env\.FILES/);
assert.match(mod,/r2-files-not-configured/);
assert.doesNotMatch(mod,/APPS_SCRIPT_API_URL/);
assert.doesNotMatch(mod,/script\.google\.com/);
assert.doesNotMatch(mod,/SpreadsheetApp|DriveApp|PropertiesService/);
assert.doesNotMatch(mod,/drive\.google\.com/);

assert.match(index,/isEmployeeContentNativePath/);
assert.match(index,/handleEmployeeContentNativeRequest/);
assert.equal(isEmployeeContentNativePath('/v1/employee/content'),true);
assert.equal(isEmployeeContentNativePath('/v1/employee/content/health'),true);
assert.equal(isEmployeeContentNativePath('/v1/employee/content/file/FILE-1'),true);
assert.equal(isEmployeeContentNativePath('/v1/employee/legacy-action'),false);

console.log('ENTRY614_EMPLOYEE_CONTENT_NATIVE_SOURCE=PASS');
console.log('ENTRY614_CONTENT_ACTION_COUNT='+actions.length);
console.log('ENTRY614_CONTENT_BUSINESS_GOOGLE_CALLS=0');
console.log('ENTRY614_CONTENT_FILE_TARGET=R2');
console.log('ENTRY614_CONTENT_CONTROL_DEFAULT=OFF');
console.log('ENTRY614_PRODUCTION_MUTATION=NO');
