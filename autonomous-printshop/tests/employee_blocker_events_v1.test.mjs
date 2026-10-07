import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  EMPLOYEE_BLOCKER_REASON_CODES,
  mapLegacyAndonReasonV1,
  blockerWriteAllowedV1,
  buildEmployeeBlockerEventV1,
  projectEmployeeBlockersV1,
  buildEmployeeBlockerSummaryV1
} from '../core/employee-blocker-events-v1.mjs';

assert.equal(Object.keys(EMPLOYEE_BLOCKER_REASON_CODES).length,6);
assert.equal(mapLegacyAndonReasonV1('عطل ماكينة'),'MACHINE_BREAKDOWN');
assert.equal(mapLegacyAndonReasonV1('خامة ناقصة'),'MATERIAL_MISSING');
assert.equal(mapLegacyAndonReasonV1('انتظار العميل'),'WAITING_CUSTOMER');
assert.equal(mapLegacyAndonReasonV1('محتاج سعر أو قرار'),'PRICE_OR_OWNER_DECISION');
assert.equal(mapLegacyAndonReasonV1('مشكلة جودة'),'QUALITY_ISSUE');
assert.equal(mapLegacyAndonReasonV1('محتاج مساعدة'),'HELP_NEEDED');
assert.equal(mapLegacyAndonReasonV1('تم حل المشكلة'),'');
assert.equal(blockerWriteAllowedV1('OFF'),false);
assert.equal(blockerWriteAllowedV1('SHADOW'),true);

const valid=buildEmployeeBlockerEventV1({
  eventId:'EV-1',blockerId:'BLK-SECRET-1',eventType:'REPORTED',
  reasonCode:'MACHINE_BREAKDOWN',operatorId:'EMPLOYEE-SECRET',
  department:'ليزر',orderId:'ORDER-SECRET',lineId:'LINE-SECRET',
  detailText:'تفصيل داخلي',sourceKind:'EMPLOYEE',actorId:'EMPLOYEE-SECRET',
  idempotencyKey:'IDEM-1',occurredAtMs:1000
});
assert.equal(valid.ok,true);
assert.equal(valid.policy.responsibleActor,'MACHINE_AGENT');
assert.equal(valid.policy.severity,'CRITICAL');

assert.equal(buildEmployeeBlockerEventV1({...valid.event,eventType:'WRONG'}).code,'EVENT_TYPE_INVALID');
assert.equal(buildEmployeeBlockerEventV1({...valid.event,reasonCode:'OTHER'}).code,'REASON_CODE_INVALID');
assert.equal(buildEmployeeBlockerEventV1({...valid.event,detailText:'x'.repeat(501)}).code,'DETAIL_TOO_LONG');

const events=[
  valid.event,
  {
    eventId:'EV-2',blockerId:'BLK-SECRET-1',eventType:'ACKNOWLEDGED',
    reasonCode:'MACHINE_BREAKDOWN',operatorId:'EMPLOYEE-SECRET',
    department:'ليزر',orderId:'ORDER-SECRET',lineId:'LINE-SECRET',
    detailText:'',sourceKind:'SUPERVISOR',actorId:'SUPERVISOR-SECRET',
    idempotencyKey:'IDEM-2',occurredAtMs:2000
  },
  {
    eventId:'EV-3',blockerId:'BLK-SECRET-2',eventType:'REPORTED',
    reasonCode:'PRICE_OR_OWNER_DECISION',operatorId:'EMPLOYEE-SECRET-2',
    department:'طباعة',orderId:'ORDER-SECRET-2',lineId:'LINE-SECRET-2',
    detailText:'قرار سعر',sourceKind:'EMPLOYEE',actorId:'EMPLOYEE-SECRET-2',
    idempotencyKey:'IDEM-3',occurredAtMs:2500
  },
  {
    eventId:'EV-4',blockerId:'BLK-SECRET-3',eventType:'REPORTED',
    reasonCode:'MATERIAL_MISSING',operatorId:'EMPLOYEE-SECRET-3',
    department:'طباعة',orderId:'ORDER-SECRET-3',lineId:'LINE-SECRET-3',
    detailText:'خامة',sourceKind:'EMPLOYEE',actorId:'EMPLOYEE-SECRET-3',
    idempotencyKey:'IDEM-4',occurredAtMs:3000
  },
  {
    eventId:'EV-5',blockerId:'BLK-SECRET-3',eventType:'RESOLVED',
    reasonCode:'MATERIAL_MISSING',operatorId:'EMPLOYEE-SECRET-3',
    department:'طباعة',orderId:'ORDER-SECRET-3',lineId:'LINE-SECRET-3',
    detailText:'',sourceKind:'SUPERVISOR',actorId:'SUPERVISOR-SECRET',
    idempotencyKey:'IDEM-5',occurredAtMs:4000
  }
];

const projection=projectEmployeeBlockersV1(events);
assert.equal(projection.counts.totalBlockers,3);
assert.equal(projection.counts.open,2);
assert.equal(projection.counts.acknowledged,1);
assert.equal(projection.counts.resolved,1);
assert.equal(projection.counts.ownerActionRequired,1);
assert.equal(projection.open[0].reasonCode,'MACHINE_BREAKDOWN');
assert.equal(projection.open.find(x=>x.reasonCode==='PRICE_OR_OWNER_DECISION').protectedDecision,true);

const summary=buildEmployeeBlockerSummaryV1(events);
assert.equal(summary.mode,'READ_ONLY_AGGREGATE');
assert.equal(summary.counts.open,2);
assert.equal(summary.counts.critical,1);
assert.equal(summary.counts.high,1);
assert.equal(summary.counts.ownerActionRequired,1);
assert.ok(summary.byDepartment.some(x=>x.key==='ليزر'&&x.count===1));
assert.ok(summary.byDepartment.some(x=>x.key==='طباعة'&&x.count===1));
assert.ok(summary.byResponsibleActor.some(x=>x.key==='MACHINE_AGENT'&&x.count===1));
assert.ok(summary.byResponsibleActor.some(x=>x.key==='OWNER_EXCEPTION_CONSOLE'&&x.count===1));
assert.equal(summary.rawBlockerIdsExposed,false);
assert.equal(summary.rawOrderIdsExposed,false);
assert.equal(summary.rawLineIdsExposed,false);
assert.equal(summary.employeeIdentityExposed,false);
assert.equal(summary.detailTextExposed,false);

const serialized=JSON.stringify(summary);
for(const secret of ['BLK-SECRET','ORDER-SECRET','LINE-SECRET','EMPLOYEE-SECRET','SUPERVISOR-SECRET','تفصيل داخلي','قرار سعر']){
  assert.equal(serialized.includes(secret),false,secret);
}

const sql=fs.readFileSync('autonomous-printshop/migrations/0030_employee_supervisor_blocker_events_v1.sql','utf8');
assert.match(sql,/mode TEXT NOT NULL DEFAULT 'OFF'/);
assert.match(sql,/autonomous_employee_blocker_events/);
assert.match(sql,/AUTONOMOUS_EMPLOYEE_BLOCKER_EVENTS_APPEND_ONLY/);
assert.match(sql,/PRICE_OR_OWNER_DECISION/);
assert.doesNotMatch(sql,/\bDROP\s+TABLE\b/i);
assert.doesNotMatch(sql,/\bALTER\s+TABLE\b/i);
assert.doesNotMatch(sql,/\bDELETE\s+FROM\b/i);
assert.doesNotMatch(sql,/\bREPLACE\s+INTO\b/i);

console.log('EMPLOYEE_BLOCKER_EVENTS_V1=PASS');
console.log('STRUCTURED_ANDON_TAXONOMY=PASS');
console.log('CONTROL_DEFAULT_OFF=PASS');
console.log('APPEND_ONLY_LEDGER=PASS');
console.log('OWNER_SUMMARY_PII=NO');
console.log('EMPLOYEE_ASSIGNMENT=NO');
