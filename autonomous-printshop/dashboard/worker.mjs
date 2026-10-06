import { qualifyOperatorTaskCanaryV1 } from '../core/operator-task-canary-qualification-v1.mjs';
const SHADOW_URL='https://autonomous-printshop-shadow.trendmall-contact.workers.dev';
const READINESS_COLLECTOR_URL='https://autonomous-printshop-readiness-collector.trendmall-contact.workers.dev';
const DASHBOARD_VERSION='AUTONOMOUS_PRINTSHOP_DASHBOARD_V1_20261006_STATE_PROXY';

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
<title>مركز المطبعة الذاتية</title>
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
      <h1>مركز المطبعة الذاتية</h1>
      <div class="sub">لوحة مراقبة تشغيلية — Shadow فقط، بدون تعيين موظفين أو تغيير أوردرات</div>
    </div>
    <button class="refresh" id="refresh">تحديث</button>
  </div>
  <div class="error" id="error"></div>

  <div class="card">
    <div class="badges" id="modes"></div>
    <div id="signal"></div>
  </div>

  <div class="grid section" id="kpis"></div>

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

    const ops=d.operations?.counts||{};
    const emp=d.employees?.operatorCounts||{};
    const ready=d.readiness||{};
    const controls=d.controls||{};
    const learn=d.shadowLearning||{};
    const sig=d.attentionSignals||{};
    const schedule=d.source?.schedule||{};
    const evidence=d.evidenceAcquisition||{};
    const canary=d.operatorTaskCanary||{};

    q('#modes').innerHTML=[
      badge('Autonomy',controls.autonomy?.mode||'—',controls.autonomy?.mode==='SHADOW'?'warn':'off'),
      badge('Readiness',controls.readiness||'—',controls.readiness==='SHADOW'?'warn':'off'),
      badge('Operator Task',controls.operatorTask||'—',controls.operatorTask==='OFF'?'off':'ok'),
      badge('المواعيد',String(schedule.scheduleRows||0)+'/'+String(schedule.nativeOrders||0),schedule.missingSchedule===0?'ok':'warn')
    ].join('');

    let message='المراقبة شغالة بدون تنفيذ حي.';
    let cls='ok';
    if(n(sig.readinessBlocked)>0){
      message='فيه '+n(sig.readinessBlocked)+' بند منتظر أدلة جاهزية قبل ما AI يسمح بتوجيهه.';
      cls='warn';
    }
    if(n(sig.employeeReviewRequired)>0){
      message+=' وفيه '+n(sig.employeeReviewRequired)+' حالة موظف تحتاج مراجعة تشغيلية.';
      cls='warn';
    }
    q('#signal').innerHTML='<div class="signal '+cls+'">'+esc(message)+'</div>';

    q('#kpis').innerHTML=[
      kpi('منتظر تنفيذ',n(ops.ordinary),'الترتيب الأساسي قبل بوابة الجاهزية'),
      kpi('جاهز صارم',n(ready.strictEligible),'Design + Material + Machine'),
      kpi('تحت التنفيذ',n(ops.inProgress),'حالة فعلية من TrendOS'),
      kpi('متاح الآن',n(emp.available),n(emp.total)+' موظف معروف')
    ].join('');

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
      ' • Raw IDs/PII: غير معروضة';
  }catch(e){
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
        const controlResponse=await fetchControlTower(env);
        const controlText=await controlResponse.text();
        let control={};
        try{ control=JSON.parse(controlText||'{}'); }catch{}
        if(!controlResponse.ok||control.success!==true){
          return new Response(controlText,{
            status:controlResponse.status,
            headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}
          });
        }

        let evidenceAcquisition={success:false,unavailable:true};
        try{
          const evidenceResponse=await fetchEvidenceStatus(env);
          const evidenceText=await evidenceResponse.text();
          const parsed=JSON.parse(evidenceText||'{}');
          if(evidenceResponse.ok&&parsed&&parsed.success===true) evidenceAcquisition=parsed;
        }catch{}

        const operatorTaskCanary=operatorTaskCanaryState(control);
        return json({...control,evidenceAcquisition,operatorTaskCanary});
      }catch(err){
        return json({success:false,code:'CONTROL_TOWER_UPSTREAM_ERROR',message:String(err&&err.message||err)},502);
      }
    }

    if(path==='/'||path==='/dashboard'){
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
        mode:'READ_ONLY_CONTROL_TOWER_UI',
        upstream:SHADOW_URL+'/control-tower',
        readinessUpstream:READINESS_COLLECTOR_URL+'/evidence-status',
        dashboardVersion:DASHBOARD_VERSION,
        transport:'CLOUDFLARE_SERVICE_BINDING',
        businessWrites:false,
        employeeAssignment:false
      });
    }

    return json({success:false,code:'NOT_FOUND'},404);
  }
};
