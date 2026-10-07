export const OWNER_EXCEPTION_MODEL_VERSION='OWNER_EXCEPTION_MODEL_V1_20261007';

function n(v){ const x=Number(v||0); return Number.isFinite(x)?x:0; }
function text(v){ return String(v==null?'':v).trim(); }
function upper(v){ return text(v).toUpperCase(); }

const AI_STATES=Object.freeze({
  MONITOR_ONLY:'MONITOR_ONLY',
  WAITING_EXTERNAL_EVIDENCE:'WAITING_EXTERNAL_EVIDENCE',
  PREPARE_HUMAN_REVIEW:'PREPARE_HUMAN_REVIEW',
  OWNER_DECISION_REQUIRED:'OWNER_DECISION_REQUIRED',
  CONTROL_REVIEW_REQUIRED:'CONTROL_REVIEW_REQUIRED'
});

function exception(input){
  return Object.freeze({
    id:text(input.id),
    domain:text(input.domain),
    severity:text(input.severity||'MEDIUM'),
    titleAr:text(input.titleAr),
    reasonAr:text(input.reasonAr),
    responsibleActor:text(input.responsibleActor),
    responsibleActorAr:text(input.responsibleActorAr),
    aiState:text(input.aiState||AI_STATES.MONITOR_ONLY),
    aiCanResolveNow:input.aiCanResolveNow===true,
    ownerActionRequired:input.ownerActionRequired===true,
    protectedDecision:input.protectedDecision===true,
    count:n(input.count),
    signalCode:text(input.signalCode),
    nextActionAr:text(input.nextActionAr)
  });
}

function blockerException(kind, blocker){
  const k=upper(kind);
  const code=text(blocker);
  if(!code) return null;
  if(k==='MATERIAL' && code==='ACCOUNTING_CLOUD_CANARY_ACTIVE_MATERIAL_FROZEN'){
    return exception({
      id:'ACCOUNTING_CANARY_MATERIAL_FREEZE', domain:'FINANCE_SIGNAL', severity:'HIGH',
      titleAr:'الحسابات في CANARY — الخامات مجمّدة تلقائيًا',
      reasonAr:'سياسة المطبعة الذاتية أوقفت استهلاك أدلة الخامات أثناء نافذة Accounting CANARY حتى لا تتحول حالة مالية انتقالية إلى حقيقة تشغيلية.',
      responsibleActor:'ACCOUNTING_CUTOVER_GUARD', responsibleActorAr:'حارس ترحيل الحسابات',
      aiState:AI_STATES.MONITOR_ONLY, aiCanResolveNow:false, ownerActionRequired:false, protectedDecision:true,
      signalCode:code,
      nextActionAr:'راقب إغلاق CANARY وعودة Accounting إلى READONLY/الحالة المؤهلة؛ لا تنشئ Material READY يدويًا.'
    });
  }
  const defs={
    DESIGN:{domain:'DESIGN',titleAr:'دليل التصميم غير مكتمل',actor:'DESIGN_AGENT',actorAr:'Design Agent',next:'استكمل ملفًا حقيقيًا مرتبطًا بنفس البند مع SHA-256 + Binding + موافقة منظمة + Preflight مؤهل.'},
    MATERIAL:{domain:'MATERIAL',titleAr:'دليل الخامة غير مكتمل',actor:'MATERIAL_AGENT',actorAr:'Material Agent',next:'استكمل مصدر خامات تشغيلي authoritative وربط الخامة والاستهلاك بالبند؛ لا تستخدم صفوف CANARY كرصيد حقيقي.'},
    MACHINE:{domain:'MACHINE',titleAr:'دليل الماكينة غير مكتمل',actor:'MACHINE_AGENT',actorAr:'Machine Agent',next:'سجل ماكينة حقيقية بهوية مثبتة ثم فحص مباشر وربط فعلي بالبند.'}
  };
  const d=defs[k]; if(!d) return null;
  return exception({
    id:k+'_EVIDENCE_BLOCKER',domain:d.domain,severity:'HIGH',titleAr:d.titleAr,
    reasonAr:'المصدر الحالي لا يثبت READY لهذا النوع؛ النظام متوقف Fail-Closed بدل التخمين.',
    responsibleActor:d.actor,responsibleActorAr:d.actorAr,
    aiState:AI_STATES.WAITING_EXTERNAL_EVIDENCE,aiCanResolveNow:false,ownerActionRequired:false,
    signalCode:code,nextActionAr:d.next
  });
}

export function buildOwnerExceptionModelV1(state={}){
  const readiness=state.readiness||{};
  const signals=state.attentionSignals||{};
  const controls=state.controls||{};
  const learning=state.shadowLearning||{};
  const evidence=state.evidenceAcquisition||{};
  const canary=state.operatorTaskCanary||{};
  const exceptions=[];
  const push=x=>{ if(x && !exceptions.some(y=>y.id===x.id)) exceptions.push(x); };

  const autonomyMode=upper(controls.autonomy&&controls.autonomy.mode||'OFF');
  const readinessMode=upper(controls.readiness||'OFF');
  const operatorTaskMode=upper(controls.operatorTask||'OFF');

  if(autonomyMode!=='SHADOW') push(exception({
    id:'AUTONOMY_MODE_REVIEW',domain:'CONTROL_PLANE',severity:'CRITICAL',titleAr:'وضع Autonomy خارج SHADOW',
    reasonAr:'مركز الإدارة لا يفترض تنفيذًا حيًا قبل بوابة مستقلة ومثبتة.',responsibleActor:'CONTROL_PLANE',responsibleActorAr:'Control Plane',
    aiState:AI_STATES.CONTROL_REVIEW_REQUIRED,ownerActionRequired:true,protectedDecision:true,signalCode:autonomyMode,
    nextActionAr:'راجع سبب تغيير وضع Autonomy وأثبت بوابة التفعيل/الرجوع قبل أي استمرار.'
  }));
  if(readinessMode!=='SHADOW') push(exception({
    id:'READINESS_MODE_REVIEW',domain:'CONTROL_PLANE',severity:'CRITICAL',titleAr:'وضع Readiness خارج SHADOW',
    reasonAr:'بوابة الجاهزية خرجت عن وضع المراقبة المتوقع للمهمة الحالية.',responsibleActor:'CONTROL_PLANE',responsibleActorAr:'Control Plane',
    aiState:AI_STATES.CONTROL_REVIEW_REQUIRED,ownerActionRequired:true,protectedDecision:true,signalCode:readinessMode,
    nextActionAr:'راجع بوابة Readiness قبل السماح بأي Operator Task.'
  }));
  if(operatorTaskMode!=='OFF') push(exception({
    id:'OPERATOR_TASK_AUTHORITY_ACTIVE',domain:'OPERATOR_TASK',severity:'CRITICAL',titleAr:'Operator Task لم يعد OFF',
    reasonAr:'أي انتقال من OFF هو قرار محمي ويجب أن يكون له إثبات CANARY صريح.',responsibleActor:'OWNER',responsibleActorAr:'المالك',
    aiState:AI_STATES.OWNER_DECISION_REQUIRED,ownerActionRequired:true,protectedDecision:true,signalCode:operatorTaskMode,
    nextActionAr:'تحقق من قرار CANARY/GENERAL والـpostflight قبل اعتبار التغيير مشروعًا.'
  }));

  const review=n(signals.employeeReviewRequired);
  if(review>0) push(exception({
    id:'EMPLOYEE_REVIEW_REQUIRED',domain:'EMPLOYEE',severity:'HIGH',titleAr:'حالة موظف تحتاج مراجعة تشغيلية',
    reasonAr:review+' حالة Availability مصنفة REVIEW_REQUIRED؛ لا تُحوّل تلقائيًا إلى حكم أداء.',responsibleActor:'EMPLOYEE_SUPERVISOR',responsibleActorAr:'Employee Supervisor',
    aiState:AI_STATES.PREPARE_HUMAN_REVIEW,aiCanResolveNow:false,ownerActionRequired:false,count:review,signalCode:'EMPLOYEE_REVIEW_REQUIRED',
    nextActionAr:'اعرض سبب التعطل والسياق للمشرف البشري، بدون عقوبة أو استنتاج إهمال.'
  }));

  const blocked=n(signals.readinessBlocked||readiness.strictBlocked);
  if(blocked>0) push(exception({
    id:'READINESS_BLOCKED',domain:'PRODUCTION',severity:'HIGH',titleAr:'شغل متوقف على أدلة الجاهزية',
    reasonAr:blocked+' بند غير مؤهل للتوجيه لأن Design/Material/Machine لم تكتمل على نفس البند.',responsibleActor:'READINESS_ENGINE',responsibleActorAr:'Readiness Engine',
    aiState:AI_STATES.WAITING_EXTERNAL_EVIDENCE,aiCanResolveNow:false,ownerActionRequired:false,count:blocked,signalCode:'READINESS_BLOCKED',
    nextActionAr:'حل أدلة الجاهزية حسب المصدر المسؤول؛ لا تتجاوز Fail-Closed.'
  }));

  push(blockerException('DESIGN',evidence.design&&evidence.design.acquisitionReady!==true?evidence.design.blocker:''));
  push(blockerException('MATERIAL',evidence.material&&evidence.material.acquisitionReady!==true?evidence.material.blocker:''));
  push(blockerException('MACHINE',evidence.machine&&evidence.machine.acquisitionReady!==true?evidence.machine.blocker:''));

  const activeTasks=n(signals.activeOperatorTasks);
  if(activeTasks>0 && operatorTaskMode==='OFF') push(exception({
    id:'OPERATOR_TASK_OFF_WITH_ACTIVE_ROWS',domain:'OPERATOR_TASK',severity:'CRITICAL',titleAr:'تعارض: مهام نشطة بينما السلطة OFF',
    reasonAr:'وجدت '+activeTasks+' مهمة نشطة رغم أن Operator Task control=OFF.',responsibleActor:'CONTROL_PLANE',responsibleActorAr:'Control Plane',
    aiState:AI_STATES.CONTROL_REVIEW_REQUIRED,ownerActionRequired:true,protectedDecision:true,count:activeTasks,signalCode:'ACTIVE_TASK_WHILE_OFF',
    nextActionAr:'أوقف أي انتقال جديد وراجع مصدر المهام والـcontrol audit قبل الاستمرار.'
  }));

  const ownerOnly=n(learning.ownerOnly);
  if(ownerOnly>0) push(exception({
    id:'OWNER_ONLY_DECISIONS',domain:'AI_POLICY',severity:'HIGH',titleAr:'قرارات محمية تنتظر المالك',
    reasonAr:ownerOnly+' قرار في سجل Shadow مصنف Owner Only.',responsibleActor:'OWNER',responsibleActorAr:'المالك',
    aiState:AI_STATES.OWNER_DECISION_REQUIRED,ownerActionRequired:true,protectedDecision:true,count:ownerOnly,signalCode:'OWNER_ONLY',
    nextActionAr:'راجع القرار والسياق والدليل؛ لا يسمح للـAI بتنفيذه تلقائيًا.'
  }));

  const systemCanaryReady=canary.systemPrerequisitesQualified===true;
  const activationBlockers=Array.isArray(canary.activationBlockers)?canary.activationBlockers.map(text):[];
  if(systemCanaryReady && activationBlockers.length===1 && activationBlockers[0]==='CANARY_OPERATOR_SELECTION_REQUIRED'){
    push(exception({
      id:'CANARY_OPERATOR_SELECTION_REQUIRED',domain:'OPERATOR_TASK',severity:'HIGH',titleAr:'بوابة CANARY جاهزة وتحتاج اختيارًا صريحًا',
      reasonAr:'كل شروط النظام مؤهلة، لكن اختيار موظف CANARY قرار محمي لم يتم.',responsibleActor:'OWNER',responsibleActorAr:'المالك',
      aiState:AI_STATES.OWNER_DECISION_REQUIRED,ownerActionRequired:true,protectedDecision:true,signalCode:'CANARY_OPERATOR_SELECTION_REQUIRED',
      nextActionAr:'اختر موظف CANARY متاحًا صراحة فقط بعد مراجعة الـpostflight المتوقع.'
    }));
  }

  const severityRank={CRITICAL:0,HIGH:1,MEDIUM:2,INFO:3};
  exceptions.sort((a,b)=>(severityRank[a.severity]??9)-(severityRank[b.severity]??9)||Number(b.ownerActionRequired)-Number(a.ownerActionRequired)||a.id.localeCompare(b.id));

  const ownerActionRequired=exceptions.filter(x=>x.ownerActionRequired).length;
  const waitingExternalEvidence=exceptions.filter(x=>x.aiState===AI_STATES.WAITING_EXTERNAL_EVIDENCE).length;
  const protectedDecisions=exceptions.filter(x=>x.protectedDecision).length;
  return {
    version:OWNER_EXCEPTION_MODEL_VERSION,
    mode:'READ_ONLY_EXCEPTION_PROJECTION',
    generatedFrom:'CONTROL_TOWER+READINESS_EVIDENCE+CANARY_GATE',
    exceptions,
    summary:{
      total:exceptions.length,
      ownerActionRequired,
      waitingExternalEvidence,
      protectedDecisions,
      aiObservedDecisions:n(learning.autonomyEvents),
      aiAutoRecommendations:n(learning.recommendedAiAuto),
      aiBlockedByPolicy:n(learning.blocked),
      aiOwnerOnly:n(learning.ownerOnly),
      aiExecutionState:(autonomyMode==='SHADOW'&&operatorTaskMode==='OFF')?'SHADOW_NO_LIVE_EXECUTION':'CONTROL_REVIEW_REQUIRED'
    },
    authorityBoundaries:{
      trendosSourceOfTruth:true,
      accountingWrite:false,
      easyStoreMutation:false,
      contentMutation:false,
      operatorTaskWrite:false,
      employeeAssignment:false
    }
  };
}

export { AI_STATES };
