/* Autonomous Printshop - Employee Supervisor Shadow V1
 * Pure deterministic baseline. No D1/network access.
 *
 * Uses:
 * - legacy assignment as comparison baseline only;
 * - attendance as availability evidence only;
 * - Operator Task active ownership as a hard no-new-task gate;
 * - Operational Reality for eligibility/priority.
 *
 * It does NOT judge employee performance and does NOT reassign work.
 */
import {
  buildOperationalRealityV1,
  recommendNextTaskV1
} from './operational-reality-v1.mjs';

export const EMPLOYEE_SUPERVISOR_SHADOW_VERSION='EMPLOYEE_SUPERVISOR_SHADOW_V1_20261005_ACTIVE_DEPT';

function text(v){return String(v==null?'':v).trim();}
function norm(v){
  return text(v).toLowerCase()
    .replace(/[إأآا]/g,'ا')
    .replace(/[ى]/g,'ي')
    .replace(/[ةه]/g,'ه')
    .replace(/\s+/g,' ')
    .trim();
}
function operatorKey(v){return norm(v);}

const UNAVAILABLE_PULSES=new Set([
  'pause','rest_start','prayer_break_start','end_day'
]);
const REVIEW_PULSES=new Set(['missed_check']);

export function deriveOperatorAvailabilityV1(attendance={}){
  if(!attendance || attendance.started!==true){
    return {available:false,state:'NOT_STARTED',evidence:'ATTENDANCE_NOT_STARTED'};
  }
  if(attendance.endedAtMs!=null || norm(attendance.dayStatus)==='ended'){
    return {available:false,state:'ENDED',evidence:'ATTENDANCE_DAY_ENDED'};
  }
  const pulse=text(attendance.lastPulse).toLowerCase();
  if(REVIEW_PULSES.has(pulse)){
    return {available:false,state:'REVIEW_REQUIRED',evidence:'ATTENDANCE_MISSED_CHECK'};
  }
  if(UNAVAILABLE_PULSES.has(pulse)){
    return {available:false,state:'PAUSED',evidence:'ATTENDANCE_'+pulse.toUpperCase()};
  }
  return {available:true,state:'AVAILABLE',evidence:pulse?'ATTENDANCE_'+pulse.toUpperCase():'ATTENDANCE_STARTED'};
}

function employeeAliases(employee={}){
  return new Set([
    operatorKey(employee.operatorId),
    operatorKey(employee.username),
    operatorKey(employee.displayName),
    operatorKey(employee.name)
  ].filter(Boolean));
}

function activeTaskFor(employee,activeTasks=[]){
  const aliases=employeeAliases(employee);
  return (activeTasks||[]).find(task=>aliases.has(operatorKey(task&&task.operatorId)))||null;
}

export function buildEmployeeSupervisorShadowV1(input={}){
  const rows=Array.isArray(input.rows)?input.rows:[];
  const employees=Array.isArray(input.employees)?input.employees:[];
  const activeTasks=Array.isArray(input.activeTasks)?input.activeTasks:[];
  const attendanceByOperator=input.attendanceByOperator||{};

  const mappedKeys=new Set();
  const operators=[];

  for(const employee of employees){
    const aliases=employeeAliases(employee);
    if(!aliases.size) continue;
    const primaryKey=operatorKey(employee.operatorId||employee.username||employee.displayName||employee.name);
    const attendance=attendanceByOperator[primaryKey]||attendanceByOperator[operatorKey(employee.username)]||attendanceByOperator[operatorKey(employee.displayName)]||null;
    const availability=deriveOperatorAvailabilityV1(attendance||{});
    const assignedRows=rows.filter(row=>{
      const k=operatorKey(row&&row.assignedTo);
      if(k&&aliases.has(k)){
        mappedKeys.add(k);
        return true;
      }
      return false;
    });
    const activeTask=activeTaskFor(employee,activeTasks);
    const baselineReality=buildOperationalRealityV1(assignedRows,{});
    const activeRows=[
      ...baselineReality.ordinary,
      ...baselineReality.inProgress,
      ...baselineReality.exceptions,
      ...baselineReality.flyPrint
    ];
    const activeAssignedDepartments=[...new Set(
      activeRows.map(row=>text(row&&row.department)).filter(Boolean)
    )];
    const assignedDepartments=[...new Set(
      assignedRows.map(row=>text(row&&row.department)).filter(Boolean)
    )];
    const configuredDepartment=text(employee.department);
    const inferredDepartments=activeAssignedDepartments.length
      ? activeAssignedDepartments
      : assignedDepartments;
    const effectiveDepartment=configuredDepartment ||
      (inferredDepartments.length===1?inferredDepartments[0]:'');
    const displayDepartment=effectiveDepartment ||
      (inferredDepartments.length>1?'MULTI':'');
    const departmentSource=configuredDepartment
      ? 'PROFILE'
      : activeAssignedDepartments.length===1
        ? 'ACTIVE_ASSIGNED_WORK'
        : activeAssignedDepartments.length>1
          ? 'ACTIVE_ASSIGNED_WORK_MULTI'
          : assignedDepartments.length===1
            ? 'HISTORICAL_ASSIGNED_WORK'
            : assignedDepartments.length>1
              ? 'HISTORICAL_ASSIGNED_WORK_MULTI'
              : 'UNKNOWN';
    const recommendation=recommendNextTaskV1(assignedRows,{
      department:effectiveDepartment,
      operatorAvailable:availability.available,
      activeTask
    });
    const reality=effectiveDepartment
      ? buildOperationalRealityV1(assignedRows,{department:effectiveDepartment})
      : baselineReality;

    operators.push({
      operatorId:text(employee.operatorId||employee.username||employee.displayName||employee.name),
      username:text(employee.username),
      displayName:text(employee.displayName||employee.name),
      department:displayDepartment,
      departmentSource,
      activeAssignedDepartments,
      assignedDepartments,
      availability,
      activeTask,
      assignedRowCount:assignedRows.length,
      reality,
      recommendation
    });
  }

  const unassignedRows=rows.filter(row=>{
    const k=operatorKey(row&&row.assignedTo);
    return !k || !mappedKeys.has(k);
  });
  const unassignedReality=buildOperationalRealityV1(unassignedRows,{});

  const totalAssigned=operators.reduce((sum,x)=>sum+x.assignedRowCount,0);
  return {
    version:EMPLOYEE_SUPERVISOR_SHADOW_VERSION,
    mode:'LEGACY_ASSIGNMENT_BASELINE_ONLY',
    operators,
    assignmentCoverage:{
      totalRows:rows.length,
      assignedRows:totalAssigned,
      unassignedOrUnmatchedRows:unassignedRows.length,
      coverage:rows.length?totalAssigned/rows.length:1
    },
    unassignedReality
  };
}
