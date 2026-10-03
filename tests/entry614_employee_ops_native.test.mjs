import assert from 'node:assert/strict';
import fs from 'node:fs';
import { isEmployeeOpsNativePath } from '../cloudflare-d1/src/employee-ops-native-v1.mjs';

const sql=fs.readFileSync('cloudflare-d1/migrations/0012_employee_ops_zero_google_v1.sql','utf8');
const mod=fs.readFileSync('cloudflare-d1/src/employee-ops-native-v1.mjs','utf8');
const index=fs.readFileSync('cloudflare-d1/src/index_v2.js','utf8');

assert.match(sql,/ENTRY614_EMPLOYEE_OPS_V1/);
assert.match(sql,/mode TEXT NOT NULL DEFAULT 'OFF'/);
assert.match(sql,/employee_attendance_days_v1/);
assert.match(sql,/employee_attendance_pulses_v1/);
assert.match(sql,/employee_hr_employees_v1/);
assert.match(sql,/employee_hr_requests_v1/);
assert.match(sql,/employee_cleaning_daily_v1/);
assert.match(sql,/employee_press_sessions_v1/);
assert.match(sql,/UNIQUE\(date_key,username_key\)/);
assert.match(sql,/idx_employee_press_single_open/);

for(const action of ['attendanceV1','attendanceClockinV1','hrV1','cleaningV1','pressControlV1']){
  assert.match(mod,new RegExp("action==='"+action+"'"));
}
assert.match(mod,/authority:'d1-employee-ops-v1'/);
assert.match(mod,/googleBusinessCalls:0/);
assert.match(mod,/appsScriptBusinessAuthority:false/);
assert.match(mod,/verifyEmployeeSessionCloudFirst/);
assert.doesNotMatch(mod,/APPS_SCRIPT_API_URL/);
assert.doesNotMatch(mod,/script\.google\.com/);
assert.doesNotMatch(mod,/SpreadsheetApp|DriveApp|PropertiesService/);
assert.match(index,/isEmployeeOpsNativePath/);
assert.match(index,/handleEmployeeOpsNativeRequest/);

assert.equal(isEmployeeOpsNativePath('/v1/employee/ops'),true);
assert.equal(isEmployeeOpsNativePath('/v1/employee/ops/health'),true);
assert.equal(isEmployeeOpsNativePath('/v1/employee/legacy-action'),false);

console.log('ENTRY614_EMPLOYEE_OPS_NATIVE_SOURCE=PASS');
console.log('ENTRY614_OPS_DOMAINS=attendance,hr,cleaning,press');
console.log('ENTRY614_OPS_BUSINESS_GOOGLE_CALLS=0');
console.log('ENTRY614_OPS_CONTROL_DEFAULT=OFF');
console.log('ENTRY614_PRODUCTION_MUTATION=NO');
