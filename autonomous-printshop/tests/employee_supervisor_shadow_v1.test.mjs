import assert from 'node:assert/strict';
import {
  deriveOperatorAvailabilityV1,
  buildEmployeeSupervisorShadowV1
} from '../core/employee-supervisor-shadow-v1.mjs';

assert.deepEqual(
  deriveOperatorAvailabilityV1({started:false}),
  {available:false,state:'NOT_STARTED',evidence:'ATTENDANCE_NOT_STARTED'}
);
assert.equal(deriveOperatorAvailabilityV1({started:true,lastPulse:'start'}).available,true);
assert.equal(deriveOperatorAvailabilityV1({started:true,lastPulse:'pause'}).state,'PAUSED');
assert.equal(deriveOperatorAvailabilityV1({started:true,lastPulse:'missed_check'}).state,'REVIEW_REQUIRED');
assert.equal(deriveOperatorAvailabilityV1({started:true,endedAtMs:1}).state,'ENDED');

const rows=[
  {orderId:'10',lineId:'10-1',department:'طباعة',assignedTo:'وائل',priority:'عاجل',status:'طلب جديد',expectedDelivery:'2026-10-06'},
  {orderId:'20',lineId:'20-1',department:'طباعة',assignedTo:'وائل',priority:'عادي',status:'طلب جديد',expectedDelivery:'2026-10-05'},
  {orderId:'30',lineId:'30-1',department:'ليزر',assignedTo:'جابر',priority:'عادي',status:'طلب جديد',expectedDelivery:'2026-10-04'},
  {orderId:'40',lineId:'40-1',department:'ليزر',assignedTo:'',priority:'عادي',status:'طلب جديد',expectedDelivery:'2026-10-03'}
];
const employees=[
  {operatorId:'wael',username:'wael',displayName:'وائل',department:'طباعة'},
  {operatorId:'gaber',username:'gaber',displayName:'جابر',department:'ليزر'}
];
const out=buildEmployeeSupervisorShadowV1({
  rows,
  employees,
  attendanceByOperator:{
    wael:{started:true,lastPulse:'heartbeat'},
    gaber:{started:true,lastPulse:'pause'}
  },
  activeTasks:[]
});
assert.equal(out.mode,'LEGACY_ASSIGNMENT_BASELINE_ONLY');
assert.equal(out.operators.length,2);
const wael=out.operators.find(x=>x.operatorId==='wael');
const gaber=out.operators.find(x=>x.operatorId==='gaber');
assert.equal(wael.availability.available,true);
assert.equal(wael.recommendation.recommended.orderId,'10');
assert.equal(gaber.availability.available,false);
assert.equal(gaber.recommendation.recommended,null);
assert.equal(out.assignmentCoverage.assignedRows,3);
assert.equal(out.assignmentCoverage.unassignedOrUnmatchedRows,1);
assert.equal(out.unassignedReality.ordinary.length,1);

const active=buildEmployeeSupervisorShadowV1({
  rows,
  employees:[employees[0]],
  attendanceByOperator:{wael:{started:true,lastPulse:'heartbeat'}},
  activeTasks:[{taskId:'T1',operatorId:'wael'}]
});
assert.equal(active.operators[0].recommendation.recommended,null);
assert.equal(active.operators[0].recommendation.reason,'ACTIVE_TASK_EXISTS');


const derivedDepartment=buildEmployeeSupervisorShadowV1({
  rows:[
    {orderId:'50',lineId:'50-1',department:'ليزر',assignedTo:'هند',priority:'عادي',status:'طلب جديد',expectedDelivery:'2026-10-06'}
  ],
  employees:[{operatorId:'hind',username:'hind',displayName:'هند',department:''}],
  attendanceByOperator:{hind:{started:true,lastPulse:'heartbeat'}},
  activeTasks:[]
});
assert.equal(derivedDepartment.operators[0].department,'ليزر');
assert.equal(derivedDepartment.operators[0].departmentSource,'ACTIVE_ASSIGNED_WORK');
assert.deepEqual(derivedDepartment.operators[0].assignedDepartments,['ليزر']);
assert.equal(derivedDepartment.operators[0].recommendation.recommended.orderId,'50');

const multiDepartment=buildEmployeeSupervisorShadowV1({
  rows:[
    {orderId:'60',lineId:'60-1',department:'طباعة',assignedTo:'سامي',priority:'عادي',status:'طلب جديد',expectedDelivery:'2026-10-06'},
    {orderId:'61',lineId:'61-1',department:'ليزر',assignedTo:'سامي',priority:'عادي',status:'طلب جديد',expectedDelivery:'2026-10-07'}
  ],
  employees:[{operatorId:'samy',username:'samy',displayName:'سامي',department:''}],
  attendanceByOperator:{samy:{started:true,lastPulse:'heartbeat'}},
  activeTasks:[]
});
assert.equal(multiDepartment.operators[0].department,'MULTI');
assert.equal(multiDepartment.operators[0].departmentSource,'ACTIVE_ASSIGNED_WORK_MULTI');
assert.deepEqual(
  new Set(multiDepartment.operators[0].assignedDepartments),
  new Set(['طباعة','ليزر'])
);
assert.equal(multiDepartment.operators[0].reality.counts.ordinary,2);


const closedHistoryDoesNotDefineCurrentDepartment=buildEmployeeSupervisorShadowV1({
  rows:[
    {orderId:'70',lineId:'70-1',department:'طباعة',assignedTo:'منى',priority:'عادي',status:'تم التسليم',expectedDelivery:'2026-10-01'},
    {orderId:'71',lineId:'71-1',department:'ليزر',assignedTo:'منى',priority:'عادي',status:'طلب جديد',expectedDelivery:'2026-10-06'}
  ],
  employees:[{operatorId:'mona',username:'mona',displayName:'منى',department:''}],
  attendanceByOperator:{mona:{started:true,lastPulse:'heartbeat'}},
  activeTasks:[]
});
assert.equal(closedHistoryDoesNotDefineCurrentDepartment.operators[0].department,'ليزر');
assert.equal(closedHistoryDoesNotDefineCurrentDepartment.operators[0].departmentSource,'ACTIVE_ASSIGNED_WORK');
assert.deepEqual(closedHistoryDoesNotDefineCurrentDepartment.operators[0].activeAssignedDepartments,['ليزر']);

console.log('AUTONOMOUS_PRINTSHOP_EMPLOYEE_SUPERVISOR_SHADOW_V1=PASS');
console.log('ROUTING=LEGACY_ASSIGNMENT_BASELINE_ONLY');
console.log('ATTENDANCE=AVAILABILITY_EVIDENCE_ONLY');
console.log('MISSED_CHECK=REVIEW_REQUIRED_NOT_DISCIPLINE');
console.log('LIVE_ASSIGNMENT=NO');
