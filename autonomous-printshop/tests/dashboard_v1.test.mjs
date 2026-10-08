import assert from 'node:assert/strict';
import fs from 'node:fs';

const worker=fs.readFileSync('autonomous-printshop/dashboard/worker.mjs','utf8');
const config=fs.readFileSync('autonomous-printshop/dashboard/wrangler.toml','utf8');

assert.match(config,/^name = "autonomous-printshop-dashboard"$/m);
assert.match(config,/^binding = "SHADOW"$/m);
assert.match(config,/^service = "autonomous-printshop-shadow"$/m);
assert.match(config,/^binding = "READINESS_COLLECTOR"$/m);
assert.match(config,/^service = "autonomous-printshop-readiness-collector"$/m);
assert.doesNotMatch(config,/\[\[d1_databases\]\]/);
assert.match(worker,/مركز إدارة المطبعة الذاتية/);
assert.match(worker,/Owner Exception Console/);
assert.match(worker,/owner-exception-model-v1/);
assert.match(worker,/buildOwnerExceptionModelV1/);
assert.match(worker,/ownerExceptionModel/);
assert.match(worker,/ownerExceptionModelVersion/);
assert.match(worker,/deadlineRisk/);
assert.match(worker,/deadlineDepartments/);
assert.match(worker,/أوردرات متأخرة/);
assert.match(worker,/خطر خلال 24 ساعة/);
assert.match(worker,/مخاطر المواعيد حسب القسم/);
assert.match(worker,/المسؤول:/);
assert.match(worker,/AI:/);
assert.match(worker,/قرارك:/);
assert.match(worker,/لا يوجد قرار محمي منتظر منك الآن/);
assert.match(worker,/قرارات تحتاج تدخلك/);
assert.match(worker,/ownerDecisionItems/);
assert.match(worker,/employeeReviewRequired/);
assert.ok(worker.includes("blockerCounts"));
assert.ok(worker.includes("blockerState"));
assert.ok(worker.includes("kpi('عوائق الموظفين'"));
assert.ok(worker.includes("بلاغ Andon مفتوح"));
assert.ok(worker.includes("badge('Andon'"));
assert.ok(worker.includes("badge('Comms'"));
assert.ok(worker.includes("kpi('رسائل تنتظر رد'"));
assert.match(worker,/commsPendingSignals/);
assert.match(worker,/commsWaitingReply/);
assert.match(worker,/commsManagerEscalations/);
assert.match(worker,/commsFeedbackDormantBacklog/);
assert.match(worker,/Feedback مؤجل/);
assert.ok(worker.includes("AUTONOMOUS_PRINTSHOP_OWNER_EXCEPTION_CONSOLE_V1_5_20261008"));
assert.match(worker,/readinessBlocked/);
assert.match(worker,/Owner Only/);
assert.match(worker,/trendosManagerCenterReplacementCandidate:true/);
assert.match(worker,/ownerExceptionConsole:true/);
assert.ok(worker.includes("path==='/owner'"));
assert.ok(worker.includes("path==='/manager-center'"));
assert.match(worker,/\/control-tower/);
assert.match(worker,/SHADOW_SERVICE_BINDING_REQUIRED/);
assert.match(worker,/READINESS_COLLECTOR_SERVICE_BINDING_REQUIRED/);
assert.match(worker,/\/evidence-status/);
assert.match(worker,/evidenceAcquisition/);
assert.match(worker,/Cloud stage/);
assert.match(worker,/materialFrozen/);
assert.match(worker,/مصادر أدلة الجاهزية/);
assert.match(worker,/بوابة Operator Task CANARY/);
assert.match(worker,/الخطوات المطلوبة الآن/);
assert.match(worker,/actionForBlocker/);
assert.match(worker,/REAL_LINKED_APPROVED_PREFLIGHTED_ARTIFACT_MISSING/);
assert.match(worker,/AUTHORITATIVE_MATERIAL_LINE_LINKAGE_MISSING/);
assert.match(worker,/REGISTERED_MACHINE_DIRECT_OBSERVATION_AND_MAPPING_REQUIRED/);
assert.match(worker,/CANARY_OPERATOR_SELECTION_REQUIRED/);
assert.match(worker,/qualifyOperatorTaskCanaryV1/);
assert.match(worker,/operatorTaskCanaryState/);
assert.match(worker,/systemPrerequisitesQualified/);
assert.match(worker,/operatorTaskCanary/);
assert.match(worker,/CLOUDFLARE_SERVICE_BINDING/);
assert.match(worker,/path==='\/state'/);
assert.match(worker,/READ_ONLY_OWNER_EXCEPTION_CONSOLE/);
assert.match(worker,/businessWrites:false/);
assert.match(worker,/employeeAssignment:false/);
assert.match(worker,/METHOD_NOT_ALLOWED/);
assert.match(worker,/Raw IDs\/PII/);

for(const forbidden of [
  /INSERT\s/i,
  /UPDATE\s/i,
  /DELETE\s/i,
  /PATCH\s/i,
  /POST['"]/i,
  /PUT['"]/i
]){
  assert.doesNotMatch(worker,forbidden);
}

console.log('AUTONOMOUS_PRINTSHOP_OWNER_EXCEPTION_CONSOLE_V1=PASS');
console.log('DATA_SOURCE=CONTROL_TOWER_SHADOW_SERVICE_BINDING');
console.log('TRENDOS_MANAGER_CENTER_ROLE=MIGRATED_TO_AUTONOMOUS_OWNER_CONSOLE');
console.log('BUSINESS_WRITE=NO');
console.log('EMPLOYEE_ASSIGNMENT=NO');

assert.match(worker,/financeStatus/);
assert.match(worker,/badge\('Finance'/);
assert.match(worker,/SOURCE INCOMPLETE/);
assert.match(worker,/UNKNOWN_SOURCE_COMPLETENESS/);
assert.match(worker,/financeSource\.absenceQualified/);
console.log('FINANCE_OWNER_DASHBOARD_UI=PASS');
