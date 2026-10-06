import assert from 'node:assert/strict';
import fs from 'node:fs';
import { isEmployeeCommsNativePath } from '../cloudflare-d1/src/employee-comms-native-v1.mjs';

const sql=fs.readFileSync('cloudflare-d1/migrations/0014_employee_comms_zero_google_v1.sql','utf8');
const hashSql=fs.readFileSync('cloudflare-d1/migrations/0031_employee_order_conversation_file_hash_v1.sql','utf8');
const mod=fs.readFileSync('cloudflare-d1/src/employee-comms-native-v1.mjs','utf8');
const index=fs.readFileSync('cloudflare-d1/src/index_v2.js','utf8');

assert.match(sql,/ENTRY614_EMPLOYEE_COMMS_V1/);
assert.match(sql,/mode TEXT NOT NULL DEFAULT 'OFF'/);
assert.match(sql,/employee_feedback_requests_v1/);
assert.match(sql,/employee_go_live_drafts_v1/);
assert.match(sql,/employee_order_conversation_files_v1/);
assert.match(sql,/employee_comms_events_v1/);
assert.match(hashSql,/ALTER TABLE employee_order_conversation_files_v1/);
assert.match(hashSql,/ADD COLUMN content_sha256/);
assert.match(hashSql,/length\(content_sha256\)=64/);
assert.doesNotMatch(hashSql,/DROP TABLE|DELETE FROM|UPDATE\s+employee_order_conversation_files_v1/i);

const actions=[
  'customerManagerV1','customerFeedbackV1','goLiveAutopilotV1',
  'getOrderConversation','sendOrderConversationMessage','uploadOrderConversationFile'
];
for(const action of actions) assert.ok(mod.includes("'"+action+"'"), 'missing comms action '+action);

for(const op of ['inbox','thread','suggest','send','handoff','resolve','scan','sweepReady','listDrafts','prepareReadyInvoice','sendReady','finalizeAndNotify']){
  assert.ok(mod.includes("'"+op+"'"), 'missing comms op '+op);
}
assert.match(mod,/authority:'d1-employee-comms-v1'/);
assert.match(mod,/googleBusinessCalls:0/);
assert.match(mod,/appsScriptBusinessAuthority:false/);
assert.match(mod,/verifyEmployeeSessionCloudFirst/);
assert.match(mod,/api\.openai\.com/);
assert.match(mod,/graph\.facebook\.com/);
assert.match(mod,/env\.FILES/);
assert.match(mod,/crypto\.subtle\.digest\('SHA-256'/);
assert.match(mod,/customMetadata:\{sha256:contentSha256\}/);
assert.match(mod,/content_sha256/);
assert.match(mod,/contentSha256/);
assert.match(mod,/accounting-d1-authority-not-ready/);
assert.doesNotMatch(mod,/INSERT INTO autonomous_design_approval_events/);
assert.doesNotMatch(mod,/INSERT INTO autonomous_design_preflight_runs/);
assert.doesNotMatch(mod,/INSERT INTO autonomous_readiness_evidence/);
assert.doesNotMatch(mod,/SpreadsheetApp|DriveApp|PropertiesService|script\.google\.com|drive\.google\.com|APPS_SCRIPT_API_URL/);
assert.match(index,/isEmployeeCommsNativePath/);
assert.match(index,/handleEmployeeCommsNativeRequest/);

assert.equal(isEmployeeCommsNativePath('/v1/employee/comms'),true);
assert.equal(isEmployeeCommsNativePath('/v1/employee/comms/health'),true);
assert.equal(isEmployeeCommsNativePath('/v1/employee/comms/webhook'),true);
assert.equal(isEmployeeCommsNativePath('/v1/employee/comms/file/F1'),true);
assert.equal(isEmployeeCommsNativePath('/v1/employee/legacy-action'),false);

console.log('ENTRY614_EMPLOYEE_COMMS_NATIVE_SOURCE=PASS');
console.log('ENTRY614_COMMS_TOP_LEVEL_ACTIONS=6');
console.log('ENTRY614_COMMS_GOOGLE_BUSINESS_CALLS=0');
console.log('ENTRY614_COMMS_EXTERNALS=CLOUDFLARE_R2,META_WHATSAPP,OPENAI');
console.log('ENTRY614_GOLIVE_FINALIZE_FAIL_CLOSED_UNTIL_ACCOUNTING_D1=YES');
console.log('ENTRY614_COMMS_CONTROL_DEFAULT=OFF');
console.log('ENTRY614_PRODUCTION_MUTATION=NO');

console.log('ENTRY614_COMMS_FILE_SHA256=QUALIFIED');
console.log('UPLOAD_EQUALS_APPROVAL=NO');
console.log('UPLOAD_EQUALS_PREFLIGHT=NO');
console.log('UPLOAD_EQUALS_READY=NO');
