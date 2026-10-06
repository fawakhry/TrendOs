export const OPERATOR_TASK_CANARY_QUALIFICATION_VERSION='OPERATOR_TASK_CANARY_QUALIFICATION_V1';

function text(v){return String(v==null?'':v).trim();}
function upper(v){return text(v).toUpperCase();}
function n(v){const x=Number(v);return Number.isFinite(x)?x:0;}

export function qualifyOperatorTaskCanaryV1(input={}){
  const autonomyMode=upper(input.autonomyMode);
  const readinessMode=upper(input.readinessMode);
  const operatorTaskMode=upper(input.operatorTaskMode);
  const strictEligible=Math.max(0,Math.trunc(n(input.strictEligible)));
  const recommendationExists=input.recommendationExists===true;
  const activeOperatorTasks=Math.max(0,Math.trunc(n(input.activeOperatorTasks)));
  const availableOperators=Math.max(0,Math.trunc(n(input.availableOperators)));
  const reviewRequired=Math.max(0,Math.trunc(n(input.reviewRequired)));
  const canaryOperatorId=text(input.canaryOperatorId);
  const canaryOperatorAvailable=input.canaryOperatorAvailable===true;

  const blockers=[];
  if(autonomyMode!=='SHADOW') blockers.push('AUTONOMY_NOT_SHADOW');
  if(readinessMode!=='SHADOW') blockers.push('READINESS_NOT_SHADOW');
  if(operatorTaskMode!=='OFF') blockers.push('OPERATOR_TASK_NOT_OFF');
  if(activeOperatorTasks!==0) blockers.push('ACTIVE_OPERATOR_TASKS_PRESENT');
  if(strictEligible<=0) blockers.push('NO_STRICT_ELIGIBLE_LINE');
  if(!recommendationExists) blockers.push('NO_STRICT_RECOMMENDATION');
  if(availableOperators<=0) blockers.push('NO_AVAILABLE_OPERATOR');
  if(reviewRequired>0) blockers.push('EMPLOYEE_REVIEW_REQUIRED');

  const systemPrerequisitesQualified=blockers.length===0;
  const activationBlockers=[...blockers];
  if(!canaryOperatorId) activationBlockers.push('CANARY_OPERATOR_SELECTION_REQUIRED');
  else if(!canaryOperatorAvailable) activationBlockers.push('CANARY_OPERATOR_NOT_AVAILABLE');

  return {
    version:OPERATOR_TASK_CANARY_QUALIFICATION_VERSION,
    systemPrerequisitesQualified,
    activationQualified:activationBlockers.length===0,
    activationPerformed:false,
    blockers,
    activationBlockers,
    strictEligible,
    recommendationExists,
    availableOperators,
    activeOperatorTasks,
    reviewRequired,
    operatorSelectionRequired:!canaryOperatorId,
    controls:{
      autonomyMode,
      readinessMode,
      operatorTaskMode
    }
  };
}
