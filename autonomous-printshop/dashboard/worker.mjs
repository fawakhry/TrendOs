import { qualifyOperatorTaskCanaryV1 } from '../core/operator-task-canary-qualification-v1.mjs';
import { buildOwnerExceptionModelV1, OWNER_EXCEPTION_MODEL_VERSION } from '../core/owner-exception-model-v1.mjs';
import { createControlTowerLastGoodGateV1, CONTROL_TOWER_LAST_GOOD_VERSION } from '../core/control-tower-last-good-v1.mjs';
const SHADOW_URL='https://autonomous-printshop-shadow.trendmall-contact.workers.dev';
const READINESS_COLLECTOR_URL='https://autonomous-printshop-readiness-collector.trendmall-contact.workers.dev';
const DASHBOARD_VERSION='AUTONOMOUS_PRINTSHOP_OWNER_EXCEPTION_CONSOLE_V1_6_20261008';
const lastGoodGate=createControlTowerLastGoodGateV1();
function degradedControlTowerResponse(){
  const fallback=lastGoodGate.degraded();
  return json(fallback,fallback.success?200:503);
}

function json(body,status=200){
  return new Response(JSON.stringify(body),{
    status,
    headers:{
      'content-type':'application/json; charset=utf-8',
      'cache-control':'no-store'
    }
  });
}

async function fetchControlTower(env){
  if(!env || !env.SHADOW || typeof env.SHADOW.fetch!=='function'){
    throw new Error('SHADOW_SERVICE_BINDING_REQUIRED');
  }
  return env.SHADOW.fetch(new Request('https://shadow.internal/control-tower',{
    method:'GET',
    headers:{'accept':'application/json','cache-control':'no-cache'}
  }));
}

function operatorTaskCanaryState(control={}){
  const emp=control.employees&&control.employees.operatorCounts||{};
  const readiness=control.readiness||{};
  const controls=control.controls||{};
  const signals=control.attentionSignals||{};
  return qualifyOperatorTaskCanaryV1({
    autonomyMode:controls.autonomy&&controls.autonomy.mode,
    readinessMode:controls.readiness,
    operatorTaskMode:controls.operatorTask,
    strictEligible:Number(readiness.strictEligible||0),
    recommendationExists:readiness.recommendationExists===true,
    activeOperatorTasks:Number(signals.activeOperatorTasks||0),
    availableOperators:Number(emp.available||0),
    reviewRequired:Number(emp.reviewRequired||0),
    canaryOperatorId:'',
    canaryOperatorAvailable:false
  });
}

async function fetchEvidenceStatus(env){
  if(!env || !env.READINESS_COLLECTOR || typeof env.READINESS_COLLECTOR.fetch!=='function'){
    throw new Error('READINESS_COLLECTOR_SERVICE_BINDING_REQUIRED');
  }
  return env.READINESS_COLLECTOR.fetch(new Request('https://readiness.internal/evidence-status',{
    method:'GET',
    headers:{'accept':'application/json','cache-control':'no-cache'}
  }));
}

const page=`<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>مركز إدارة المطبعة الذاتية</title>
<style>
:root{
  font-family:Tahoma,Arial,sans-serif;
  color-scheme:light;
  --bg:#f4f7fb;
  --card:#fff;
  --ink:#101828;
  --muted:#667085;
  --line:#e4e7ec;
  --ok:#067647;
  --warn:#b54708;
  --danger:#b42318;
  --blue:#175cd3;
  --shadow:0 8px 24px rgba(16,24,40,.07);
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink)}
main{max-width:1180px;margin:auto;padding:18px}
.top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px}
h1{font-size:28px;margin:0 0 5px}
.sub{color:var(--muted);font-size:14px}
.refresh{border:0;border-radius:14px;background:#1570ef;color:#fff;padding:12px 17px;font-size:16px;font-weight:700;cursor:pointer}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px;box-shadow:var(--shadow)}
.kpi .label{color:var(--muted);font-size:13px}
.kpi .value{font-size:32px;font-weight:800;margin-top:8px}
.kpi .hint{font-size:12px;color:var(--muted);margin-top:4px}
.section{margin-top:14px}
.section h2{font-size:18px;margin:0 0 12px}
.badges{display:flex;flex-wrap:wrap;gap:8px}
.badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:7px 10px;font-size:12px;font-weight:700;background:#eef4ff;color:#1849a9;border:1px solid #d1e0ff}
.badge.ok{background:#ecfdf3;color:#067647;border-color:#abefc6}
.badge.warn{background:#fffaeb;color:#b54708;border-color:#fedf89}
.badge.off{background:#f2f4f7;color:#475467;border-color:#d0d5dd}
.signal{border-radius:14px;padding:13px 14px;margin-top:8px;font-weight:700}
.signal.ok{background:#ecfdf3;color:#067647}
.signal.warn{background:#fffaeb;color:#b54708}
.signal.danger{background:#fef3f2;color:#b42318}
.exception-title{font-weight:800;margin-bottom:5px}.exception-meta{font-size:12px;opacity:.82;margin-top:5px}.exception-next{font-size:12px;margin-top:7px}.owner-needed{font-weight:800}
.readiness{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.rbox{border:1px solid var(--line);border-radius:14px;padding:12px}
.rtitle{font-weight:800;margin-bottom:8px}
.rnums{display:flex;gap:10px;flex-wrap:wrap;font-size:13px}
.rnums b{font-size:18px}
.table-wrap{overflow:auto}
table{width:100%;border-collapse:collapse;font-size:13px}
th,td{padding:10px;border-bottom:1px solid var(--line);text-align:right;white-space:nowrap}
th{color:var(--muted);font-weight:700}
.footer{margin:16px 0 4px;color:var(--muted);font-size:12px}
.degraded .card,.degraded .section,.degraded #kpis,.degraded #modes,.degraded #signal,.degraded #financeStatus,.degraded #footer{display:none}
.loading{opacity:.55;pointer-events:none}
.error{display:none;background:#fef3f2;color:#b42318;border:1px solid #fecdca;padding:12px;border-radius:14px;margin-bottom:12px}
@media(max-width:900px){.grid{grid-template-columns:repeat(2,1fr)}.readiness{grid-template-columns:1fr}.top{align-items:center}h1{font-size:22px}}
@media(max-width:520px){main{padding:10px}.grid{grid-template-columns:1fr 1fr}.card{padding:13px}.kpi .value{font-size:27px}.refresh{padding:10px 12px}}
</style>
</head>
<body>
<main id="app">
  <div class="top">
    <div>
      <h1>مركز إدارة المطبعة الذاتية</h1>
      <div class="sub">Control Tower + Owner Exception Console — عرض فقط، بدون تعيين موظفين أو تغيير أوردرات</div>
    </div>
    <button class="refresh" id="refresh">تحديث</button>
  </div>
  <div class="error" id="error"></div>
  <div id="staleStatus" role="status" aria-live="polite"></div>

  <div class="card">
    <div class="badges" id="modes"></div>
    <div id="signal"></div>
    <div id="financeStatus"></div>
  </div>

  <div class="grid section" id="kpis"></div>

  <div class="card section">
    <h2>مخاطر المواعيد حسب القسم</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>القسم</th><th>متأخر</th><th>خطر 24 ساعة</th><th>مراقبة 48 ساعة</th><th>عاجل</th></tr></thead>
        <tbody id="deadlineDepartments"></tbody>
      </table>
    </div>
  </div>

  <div class="card section">
    <h2>قرارات تحتاج تدخلك والاستثناءات التشغيلية</h2>
    <div id="ownerExceptions"></div>
  </div>

  <div class="card section">
    <h2>جاهزية الشغل</h2>
    <div class="readiness" id="readiness"></div>
  </div>

  <div class="card section">
    <h2>مصادر أدلة الجاهزية</h2>
    <div class="readiness" id="evidenceSources"></div>
  </div>

  <div class="card section">
    <h2>بوابة Operator Task CANARY</h2>
    <div id="canaryGate"></div>
  </div>

  <div class="card section">
    <h2>الخطوات المطلوبة الآن</h2>
    <div id="nextActions"></div>
  </div>

  <div class="card section">
    <h2>الموظفين والأقسام</h2>
    <div class="table-wrap">
      <table>
        <thead><tr><th>القسم</th><th>الموظفين</th><th>متاح</th><th>منتظر تنفيذ</th><th>تحت التنفيذ</th><th>استثناءات</th></tr></thead>
        <tbody id="departments"></tbody>
      </table>
    </div>
  </div>

  <div class="grid section" id="learning"></div>

  <div class="footer" id="footer">—</div>
</main>
<script>
const q=s=>document.querySelector(s);
const n=v=>Number(v||0);
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function badge(label,value,kind=''){
  return '<span class="badge '+kind+'">'+esc(label)+': '+esc(value)+'</span>';
}
function kpi(label,value,hint=''){
  return '<div class="card kpi"><div class="label">'+esc(label)+'</div><div class="value">'+esc(value)+'</div><div class="hint">'+esc(hint)+'</div></div>';
}
function readinessBox(label,x={}){
  return '<div class="rbox"><div class="rtitle">'+esc(label)+'</div><div class="rnums">'
    +'<span>جاهز <b>'+n(x.ready)+'</b></span>'
    +'<span>موقوف <b>'+n(x.blocked)+'</b></span>'
    +'<span>غير معروف <b>'+n(x.unknown)+'</b></span>'
    +'</div></div>';
}
function aiStateLabel(v){
  const map={
    MONITOR_ONLY:'يراقب فقط',
    WAITING_EXTERNAL_EVIDENCE:'ينتظر دليلًا حقيقيًا',
    PREPARE_HUMAN_REVIEW:'يجهز السياق للمراجعة',
    OWNER_DECISION_REQUIRED:'ينتظر قرار المالك',
    CONTROL_REVIEW_REQUIRED:'يحتاج مراجعة Control Plane'
  };
  return map[String(v||'')]||String(v||'—');
}
function ownerDecisionItems(d={}){
  const modeled=d.ownerExceptionModel&&Array.isArray(d.ownerExceptionModel.exceptions)?d.ownerExceptionModel.exceptions:[];
  if(modeled.length) return modeled.map(x=>{
    const sev=String(x.severity||'').toUpperCase();
    return {
      kind:sev==='CRITICAL'?'danger':sev==='HIGH'?'warn':'ok',
      title:x.titleAr||x.id||'استثناء',
      text:x.reasonAr||'',
      meta:'المسؤول: '+(x.responsibleActorAr||x.responsibleActor||'—')+' • AI: '+aiStateLabel(x.aiState)+' • قرارك: '+(x.ownerActionRequired?'مطلوب':'غير مطلوب'),
      next:x.nextActionAr||'',
      ownerActionRequired:x.ownerActionRequired===true
    };
  });
  const sig=d.attentionSignals||{};
  const controls=d.controls||{};
  const ready=d.readiness||{};
  const learn=d.shadowLearning||{};
  const items=[];
  if(n(sig.employeeReviewRequired)>0) items.push({kind:'danger',text:n(sig.employeeReviewRequired)+' حالة موظف تحتاج مراجعة تشغيلية.'});
  if(n(sig.readinessBlocked)>0) items.push({kind:'warn',text:n(sig.readinessBlocked)+' بند غير مؤهل للتوجيه بسبب نقص أدلة الجاهزية.'});
  if(sig.noStrictRecommendation===true && n(ready.baselineCandidates)>0) items.push({kind:'warn',text:'يوجد شغل منتظر لكن لا يوجد بند مؤهل بالكامل للتوجيه الآلي.'});
  if(n(sig.activeOperatorTasks)>0) items.push({kind:'warn',text:n(sig.activeOperatorTasks)+' مهمة Operator Task نشطة؛ لا يتم فتح CANARY جديد قبل إغلاقها.'});
  if(String(controls.autonomy&&controls.autonomy.mode||'OFF')!=='SHADOW') items.push({kind:'danger',text:'وضع Autonomy ليس SHADOW؛ راجع Control Plane قبل أي تجربة.'});
  if(String(controls.readiness||'OFF')!=='SHADOW') items.push({kind:'danger',text:'بوابة Readiness ليست SHADOW.'});
  if(n(learn.ownerOnly)>0) items.push({kind:'warn',text:n(learn.ownerOnly)+' قرار مصنف Owner Only في سجل التعلم.'});
  if(!items.length) items.push({kind:'ok',text:'لا توجد استثناءات تشغيلية تتطلب تدخل المالك الآن.'});
  return items;
}

function actionForBlocker(code){
  const map={
    REAL_LINKED_APPROVED_PREFLIGHTED_ARTIFACT_MISSING:'Design: اربط ملف تصميم حقيقي ببند حي مع SHA-256، ثم موافقة منظمة وPreflight PASS.',
    AUTHORITATIVE_MATERIAL_LINE_LINKAGE_MISSING:'Material: استكمل بيانات الخامات التشغيلية في الحسابات السحابية واربط الخامة والاستهلاك ببند حي.',
    ACCOUNTING_CLOUD_DATA_MIGRATION_PENDING:'Material: استكمال نقل مصدر الخامات/المخزون للحسابات السحابية قبل السماح بـREADY.',
    REGISTERED_MACHINE_DIRECT_OBSERVATION_AND_MAPPING_REQUIRED:'Machine: سجل هوية ماكينة حقيقية من Nameplate/Asset Tag، ثم فحص مباشر وربطها بالبند.',
    NO_STRICT_ELIGIBLE_LINE:'التشغيل: لازم نفس البند يحقق Design + Material + Machine READY.',
    NO_STRICT_RECOMMENDATION:'التشغيل: لا يوجد بند مؤهل للتوجيه حتى تكتمل أدلة الجاهزية.',
    NO_AVAILABLE_OPERATOR:'الموظفين: يلزم موظف بدأ يومه وحالته AVAILABLE وقت تجربة CANARY.',
    EMPLOYEE_REVIEW_REQUIRED:'الموظفين: عالج أي حالة REVIEW_REQUIRED قبل تجربة CANARY.',
    ACTIVE_OPERATOR_TASKS_PRESENT:'Operator Task: لا تبدأ CANARY وفيه مهمة Operator Task نشطة.',
    CANARY_OPERATOR_SELECTION_REQUIRED:'CANARY: بعد اكتمال باقي الشروط، اختر موظف CANARY صراحة قبل أي تفعيل.',
    CANARY_OPERATOR_NOT_AVAILABLE:'CANARY: الموظف المختار لازم يكون AVAILABLE وقت التفعيل.'
  };
  return map[String(code||'')]||('راجع العائق: '+String(code||'UNKNOWN'));
}

function evidenceBox(label,x={}){
  const ok=x.acquisitionReady===true;
  const parts=Object.entries(x)
    .filter(([k,v])=>typeof v==='number'&&k!=='acquisitionReady')
    .map(([k,v])=>'<span>'+esc(k)+' <b>'+n(v)+'</b></span>')
    .join('');
  const stage=x.cloudStage?'<div class="hint">Cloud stage: '+esc(x.cloudStage)+(x.materialFrozen?' • Material frozen':'')+'</div>':'';
  return '<div class="rbox"><div class="rtitle">'+esc(label)+' — '+(ok?'المصدر جاهز':'المصدر ناقص')+'</div>'
    +'<div class="rnums">'+parts+'</div>'
    +stage
    +(ok?'':'<div class="hint">'+esc(x.blocker||'UNKNOWN')+'</div>')
    +'</div>';
}
async function load(){
  const app=q('#app'); const err=q('#error');
  app.classList.add('loading'); err.style.display='none';
  try{
    const r=await fetch('/state',{cache:'no-store'});
    const d=await r.json();
    if(!r.ok||d.success!==true) throw new Error(d.code||'تعذر تحميل الحالة');
    if(d.status==='LAST_GOOD_STALE_DIAGNOSTIC_ONLY'){
      app.classList.add('degraded');
      const diag=d.operationalDiagnostic||{};
      q('#staleStatus').innerHTML='<div class="signal warn"><div class="exception-title">بيانات قديمة — للمتابعة فقط / STALE</div>'+esc(d.displayWarningAr||'تعذر الوصول إلى Control Tower؛ لا تستخدم البيانات القديمة لاتخاذ قرار.')+'</div>'
        +'<div class="signal warn">وقت آخر قراءة: '+esc(d.asOf||'غير معروف')+' • عمر البيانات: '+n(Math.ceil(n(d.ageMs)/1000))+' ثانية • ملخص تشغيلي سابق فقط: منتظر '+n(diag.waiting)+'، تحت التنفيذ '+n(diag.inProgress)+'، متأخر '+n(diag.overdueOrders)+'.</div>'
        +'<div class="signal danger">مؤشرات Finance والديون والقرارات المحمية والجاهزية غير متاحة في وضع STALE، ولا يُسمح بأي تنفيذ أو اعتماد منها.</div>';
      return;
    }
    app.classList.remove('degraded');
    q('#staleStatus').innerHTML='';

    const ops=d.operations?.counts||{};
    const deadline=d.operations?.deadlineRisk||{};
    const emp=d.employees?.operatorCounts||{};
    const ready=d.readiness||{};
    const controls=d.controls||{};
    const learn=d.shadowLearning||{};
    const sig=d.attentionSignals||{};
    const schedule=d.source?.schedule||{};
    const evidence=d.evidenceAcquisition||{};
    const canary=d.operatorTaskCanary||{};
    const blockerState=d.employees?.blockers||{};
    const blockerCounts=blockerState.summary?.counts||{};
    const commsState=d.communications?.pending||{};
    const commsSummary=commsState.summary||{};
    const commsCounts=commsSummary.counts||{};
    const financeSummary=d.finance?.warnings?.summary||{};
    const financeSource=financeSummary.source||{};
    const financeControl=financeSummary.control||{};
    const financeDayClose=financeSummary.dayClose||{};

    q('#modes').innerHTML=[
      badge('Autonomy',controls.autonomy?.mode||'—',controls.autonomy?.mode==='SHADOW'?'warn':'off'),
      badge('Readiness',controls.readiness||'—',controls.readiness==='SHADOW'?'warn':'off'),
      badge('Operator Task',controls.operatorTask||'—',controls.operatorTask==='OFF'?'off':'ok'),
      badge('Andon',blockerState.control?.mode||'—',blockerState.control?.mode==='SHADOW'?'warn':'off'),
      badge('Comms',commsSummary.control?.mode||'—',commsSummary.control?.mode==='READONLY'?'off':'warn'),
      badge('Finance',financeControl.mode||'غير مؤهل',financeControl.readModeSafe===true?'off':'warn'),
      badge('المواعيد',String(schedule.scheduleRows||0)+'/'+String(schedule.nativeOrders||0),schedule.missingSchedule===0?'ok':'warn')
    ].join('');

    let message='المراقبة شغالة بدون تنفيذ حي.';
    let cls='ok';
    if(n(deadline.overdueOrders)>0){
      message='فيه '+n(deadline.overdueOrders)+' أوردر متأخر و'+n(deadline.atRisk24hOrders)+' معرض للتأخير خلال 24 ساعة.';
      cls='danger';
    }else if(n(deadline.atRisk24hOrders)>0){
      message='فيه '+n(deadline.atRisk24hOrders)+' أوردر داخل نافذة خطر 24 ساعة.';
      cls='warn';
    }
    if(n(sig.readinessBlocked)>0){
      message+=' '+n(sig.readinessBlocked)+' بند منتظر أدلة جاهزية.';
      if(cls==='ok') cls='warn';
    }
    if(n(sig.employeeReviewRequired)>0){
      message+=' '+n(sig.employeeReviewRequired)+' حالة موظف تحتاج مراجعة تشغيلية.';
      if(cls==='ok') cls='warn';
    }
    if(n(blockerCounts.open)>0){
      message+=' '+n(blockerCounts.open)+' بلاغ Andon مفتوح.';
      cls=n(blockerCounts.critical)>0?'danger':'warn';
    }
    if(n(sig.commsPendingSignals)>0){
      message+=' '+n(sig.commsPendingSignals)+' حالة تواصل تحتاج متابعة.';
      if(cls==='ok') cls='warn';
    }
    q('#signal').innerHTML='<div class="signal '+cls+'">'+esc(message)+'</div>';
    const financeComplete=financeSource.absenceQualified===true&&financeControl.readModeSafe===true;
    q('#financeStatus').innerHTML=financeComplete
      ? '<div class="signal ok">حالة مصدر Finance مؤهلة للقراءة؛ التنفيذ المالي يظل في Accounting فقط.</div>'
      : '<div class="signal warn"><div class="exception-title">تحذير الحسابات: SOURCE INCOMPLETE</div>بيانات الحسابات السحابية غير مكتملة أو غير مؤهلة. صفر المديونيات أو صفر الموانع لا يعني سلامة الحسابات، وإقفال اليوم غير مؤهل. الحالة: '+esc(financeDayClose.state||'UNKNOWN_SOURCE_COMPLETENESS')+' • Accounting: '+esc(financeControl.mode||'UNKNOWN')+'. لا توجد أي صلاحية تعديل مالية هنا.</div>';

    q('#kpis').innerHTML=[
      kpi('منتظر تنفيذ',n(ops.ordinary),'الترتيب الأساسي قبل بوابة الجاهزية'),
      kpi('أوردرات متأخرة',n(deadline.overdueOrders),'أقدم تأخير '+n(deadline.oldestOverdueHours)+' ساعة'),
      kpi('خطر خلال 24 ساعة',n(deadline.atRisk24hOrders),'مراقبة 48 ساعة: '+n(deadline.watch48hOrders)),
      kpi('جاهز صارم',n(ready.strictEligible),'Design + Material + Machine'),
      kpi('تحت التنفيذ',n(ops.inProgress),'حالة فعلية من TrendOS'),
      kpi('متاح الآن',n(emp.available),n(emp.total)+' موظف معروف'),
      kpi('عوائق الموظفين',n(blockerCounts.open),'حرج '+n(blockerCounts.critical)+' • قرار مالك '+n(blockerCounts.ownerActionRequired)),
      kpi('رسائل تنتظر رد',n(sig.commsWaitingReply),'تصعيد إداري '+n(sig.commsManagerEscalations)+(n(sig.commsFeedbackDormantBacklog)>0?' • Feedback مؤجل '+n(sig.commsFeedbackDormantBacklog)+' غير تشغيلي':''))
    ].join('');

    const riskDepartments=Array.isArray(deadline.departments)?deadline.departments:[];
    q('#deadlineDepartments').innerHTML=riskDepartments.length
      ? riskDepartments.map(x=>'<tr><td>'+esc(x.department||'UNSPECIFIED')+'</td><td>'+n(x.overdueOrders)+'</td><td>'+n(x.atRisk24hOrders)+'</td><td>'+n(x.watch48hOrders)+'</td><td>'+n(x.urgentRiskLines)+'</td></tr>').join('')
      : '<tr><td colspan="5">لا توجد مخاطر مواعيد حالية</td></tr>';

    const ownerModelSummary=d.ownerExceptionModel?.summary||{};
    const ownerItems=ownerDecisionItems(d);
    const ownerRequired=n(ownerModelSummary.ownerActionRequired);
    const ownerHeadline=ownerRequired>0
      ? '<div class="signal danger owner-needed">عندك '+ownerRequired+' قرار محمي يحتاج موافقتك.</div>'
      : '<div class="signal ok">لا يوجد قرار محمي منتظر منك الآن؛ باقي الاستثناءات موضحة مع المسؤول عنها.</div>';
    q('#ownerExceptions').innerHTML=ownerHeadline+ownerItems
      .map(x=>'<div class="signal '+esc(x.kind)+'"><div class="exception-title">'+esc(x.title||'استثناء')+'</div><div>'+esc(x.text||'')+'</div><div class="exception-meta">'+esc(x.meta||'')+'</div>'+(x.next?'<div class="exception-next">التالي: '+esc(x.next)+'</div>':'')+'</div>').join('');

    const cov=ready.coverage||{};
    q('#readiness').innerHTML=[
      readinessBox('التصميم',cov.DESIGN),
      readinessBox('الخامة',cov.MATERIAL),
      readinessBox('الماكينة',cov.MACHINE)
    ].join('');

    q('#evidenceSources').innerHTML=[
      evidenceBox('Design',evidence.design||{}),
      evidenceBox('Material',evidence.material||{}),
      evidenceBox('Machine',evidence.machine||{})
    ].join('');

    const systemOk=canary.systemPrerequisitesQualified===true;
    const blockers=Array.isArray(canary.blockers)?canary.blockers:[];
    const gateText=systemOk
      ? 'شروط النظام مكتملة — يتبقى اختيار موظف CANARY صراحة قبل أي تفعيل.'
      : 'غير مؤهل للتفعيل: '+(blockers.length?blockers.join(' • '):'UNKNOWN');
    q('#canaryGate').innerHTML='<div class="signal '+(systemOk?'ok':'warn')+'">'+esc(gateText)+'</div>';

    const evidenceBlockers=[
      evidence.design&&evidence.design.blocker,
      evidence.material&&evidence.material.blocker,
      evidence.machine&&evidence.machine.blocker
    ].filter(Boolean);
    const canaryBlockers=Array.isArray(canary.activationBlockers)?canary.activationBlockers:[];
    const allBlockers=[...new Set([...evidenceBlockers,...canaryBlockers])];
    q('#nextActions').innerHTML=allBlockers.length
      ? allBlockers.map(x=>'<div class="signal warn">'+esc(actionForBlocker(x))+'</div>').join('')
      : '<div class="signal ok">لا توجد عوائق حالية قبل بوابة CANARY.</div>';

    const deps=d.employees?.departments||{};
    q('#departments').innerHTML=Object.entries(deps).map(([name,x])=>
      '<tr><td>'+esc(name)+'</td><td>'+n(x.operators)+'</td><td>'+n(x.availableOperators)+'</td><td>'+n(x.ordinary)+'</td><td>'+n(x.inProgress)+'</td><td>'+n(x.exceptions)+'</td></tr>'
    ).join('')||'<tr><td colspan="6">لا توجد بيانات أقسام</td></tr>';

    q('#learning').innerHTML=[
      kpi('قرارات Shadow',n(learn.autonomyEvents),'سجل تعلم فقط'),
      kpi('AI Auto مقترح',n(learn.recommendedAiAuto),'لم تُنفذ حيًا'),
      kpi('Blocked',n(learn.blocked),'قرارات تم منعها بالسياسة'),
      kpi('Owner Only',n(learn.ownerOnly),'قرارات محمية للمالك')
    ].join('');

    q('#footer').textContent='آخر تحديث: '+(d.generatedAt?new Date(d.generatedAt).toLocaleString('ar-EG'):'—')+
      ' • المصدر: '+(d.source?.authority||'—')+
      ' • Owner Console: Read-only'+
      ' • Raw IDs/PII: غير معروضة';
  }catch(e){
    app.classList.add('degraded');
    q('#staleStatus').innerHTML='<div class="signal danger">مصدر Control Tower غير متاح ولا توجد قراءة حديثة مؤهلة. لا يوجد إثبات حالي للحسابات أو الجاهزية أو قرارات المالك.</div>';
    err.textContent='تعذر تحميل لوحة المطبعة: '+(e&&e.message||e);
    err.style.display='block';
  }finally{
    app.classList.remove('loading');
  }
}
q('#refresh').addEventListener('click',load);
load();
setInterval(load,60000);
</script>
</body></html>`;

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    const path=url.pathname.replace(/\/+$/,'')||'/';
    if(request.method!=='GET') return json({success:false,code:'METHOD_NOT_ALLOWED'},405);

    if(path==='/state'||path==='/api/state'){
      try{
        let controlResponse;
        try{ controlResponse=await fetchControlTower(env); }
        catch{ return degradedControlTowerResponse(); }
        let control={};
        try{ control=JSON.parse(await controlResponse.text()); }
        catch{ return degradedControlTowerResponse(); }
        if(!controlResponse.ok||control.success!==true) return degradedControlTowerResponse();
        // Only fresh, read-only, PII-free sources may refresh the local diagnostic.
        // Degraded values never flow through Owner Exception Model or Finance.
        if(lastGoodGate.observe(control).success!==true) return degradedControlTowerResponse();

        let evidenceAcquisition={success:false,unavailable:true};
        try{
          const evidenceResponse=await fetchEvidenceStatus(env);
          const evidenceText=await evidenceResponse.text();
          const parsed=JSON.parse(evidenceText||'{}');
          if(evidenceResponse.ok&&parsed&&parsed.success===true) evidenceAcquisition=parsed;
        }catch{}

        const operatorTaskCanary=operatorTaskCanaryState(control);
        const ownerExceptionModel=buildOwnerExceptionModelV1({...control,evidenceAcquisition,operatorTaskCanary});
        return json({...control,evidenceAcquisition,operatorTaskCanary,ownerExceptionModel});
      }catch(err){
        return degradedControlTowerResponse();
      }
    }

    if(path==='/'||path==='/dashboard'||path==='/owner'||path==='/manager-center'){
      return new Response(page,{
        status:200,
        headers:{
          'content-type':'text/html; charset=utf-8',
          'cache-control':'no-store',
          'x-frame-options':'DENY',
          'x-content-type-options':'nosniff',
          'referrer-policy':'no-referrer'
        }
      });
    }

    if(path==='/health'){
      return json({
        success:true,
        service:'autonomous-printshop-dashboard',
        mode:'READ_ONLY_OWNER_EXCEPTION_CONSOLE',
        upstream:SHADOW_URL+'/control-tower',
        readinessUpstream:READINESS_COLLECTOR_URL+'/evidence-status',
        dashboardVersion:DASHBOARD_VERSION,
        transport:'CLOUDFLARE_SERVICE_BINDING',
        ownerExceptionConsole:true,
        trendosManagerCenterReplacementCandidate:true,
        ownerExceptionModelVersion:OWNER_EXCEPTION_MODEL_VERSION,
        lastGoodVersion:CONTROL_TOWER_LAST_GOOD_VERSION,
        lastGoodCacheScope:'WORKER_ISOLATE_BEST_EFFORT',
        businessWrites:false,
        employeeAssignment:false
      });
    }

    return json({success:false,code:'NOT_FOUND'},404);
  }
};
