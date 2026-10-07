import { buildOperationalRealityV1 } from './operational-reality-v1.mjs';

export const DEADLINE_RISK_PROJECTION_VERSION='DEADLINE_RISK_PROJECTION_V1_20261007';

function text(v){ return String(v==null?'':v).trim(); }
function num(v,f=0){ const n=Number(v); return Number.isFinite(n)?n:f; }
function hours(ms){ return Math.round((ms/3600000)*10)/10; }

function distinctOrderCount(rows=[]){
  const ids=new Set();
  for(const row of rows){
    const id=text(row&&row.orderId);
    if(id) ids.add(id);
  }
  return ids.size;
}

function laneCounts(rows=[]){
  const out={waiting:0,inProgress:0,blocked:0,flyPrint:0};
  for(const row of rows){
    if(row.__riskLane==='WAITING') out.waiting+=1;
    else if(row.__riskLane==='IN_PROGRESS') out.inProgress+=1;
    else if(row.__riskLane==='BLOCKED') out.blocked+=1;
    else if(row.__riskLane==='FLY_PRINT') out.flyPrint+=1;
  }
  return out;
}

function departmentProjection(rows=[]){
  const map=new Map();
  for(const row of rows){
    const department=text(row&&row.department)||'UNSPECIFIED';
    let d=map.get(department);
    if(!d){
      d={
        department,
        overdueLines:0,overdueOrders:new Set(),
        atRisk24hLines:0,atRisk24hOrders:new Set(),
        watch48hLines:0,watch48hOrders:new Set(),
        urgentRiskLines:0
      };
      map.set(department,d);
    }
    if(row.__riskBucket==='OVERDUE'){
      d.overdueLines+=1; if(row.orderId)d.overdueOrders.add(row.orderId);
    }else if(row.__riskBucket==='AT_RISK_24H'){
      d.atRisk24hLines+=1; if(row.orderId)d.atRisk24hOrders.add(row.orderId);
    }else if(row.__riskBucket==='WATCH_48H'){
      d.watch48hLines+=1; if(row.orderId)d.watch48hOrders.add(row.orderId);
    }
    if(row.urgent && row.__riskBucket!=='LATER') d.urgentRiskLines+=1;
  }
  return [...map.values()].map(d=>({
    department:d.department,
    overdueLines:d.overdueLines,
    overdueOrders:d.overdueOrders.size,
    atRisk24hLines:d.atRisk24hLines,
    atRisk24hOrders:d.atRisk24hOrders.size,
    watch48hLines:d.watch48hLines,
    watch48hOrders:d.watch48hOrders.size,
    urgentRiskLines:d.urgentRiskLines
  })).filter(d=>d.overdueLines||d.atRisk24hLines||d.watch48hLines)
    .sort((a,b)=>b.overdueLines-a.overdueLines||b.atRisk24hLines-a.atRisk24hLines||a.department.localeCompare(b.department,'ar'));
}

export function buildDeadlineRiskProjectionV1(rows=[],options={}){
  const nowMs=num(options.nowMs,Date.now());
  const atRiskHours=Math.max(1,num(options.atRiskHours,24));
  const watchHours=Math.max(atRiskHours,num(options.watchHours,48));
  const atRiskCutoff=nowMs+atRiskHours*3600000;
  const watchCutoff=nowMs+watchHours*3600000;

  const reality=buildOperationalRealityV1(Array.isArray(rows)?rows:[],{});
  const active=[
    ...reality.ordinary.map(x=>({...x,__riskLane:'WAITING'})),
    ...reality.inProgress.map(x=>({...x,__riskLane:'IN_PROGRESS'})),
    ...reality.exceptions.map(x=>({...x,__riskLane:'BLOCKED'})),
    ...reality.flyPrint.map(x=>({...x,__riskLane:'FLY_PRINT'}))
  ];

  const missingDue=active.filter(x=>x.dueMissing===true);
  const invalidDue=active.filter(x=>!x.dueMissing&&x.dueValid!==true);
  const valid=active.filter(x=>x.dueValid===true&&Number.isFinite(Number(x.dueTs)));

  const tagged=valid.map(x=>{
    const dueTs=Number(x.dueTs);
    let bucket='LATER';
    if(dueTs<nowMs) bucket='OVERDUE';
    else if(dueTs<=atRiskCutoff) bucket='AT_RISK_24H';
    else if(dueTs<=watchCutoff) bucket='WATCH_48H';
    return {...x,__riskBucket:bucket};
  });

  const overdue=tagged.filter(x=>x.__riskBucket==='OVERDUE');
  const atRisk24h=tagged.filter(x=>x.__riskBucket==='AT_RISK_24H');
  const watch48h=tagged.filter(x=>x.__riskBucket==='WATCH_48H');
  const later=tagged.filter(x=>x.__riskBucket==='LATER');
  const immediate=[...overdue,...atRisk24h];

  const oldestOverdueMs=overdue.length
    ? Math.max(...overdue.map(x=>nowMs-Number(x.dueTs)))
    : 0;
  const future=[...atRisk24h,...watch48h,...later];
  const nearestFutureMs=future.length
    ? Math.min(...future.map(x=>Math.max(0,Number(x.dueTs)-nowMs)))
    : null;

  return {
    version:DEADLINE_RISK_PROJECTION_VERSION,
    mode:'READ_ONLY_AGGREGATE',
    horizonHours:{atRisk:atRiskHours,watch:watchHours},
    activeLines:active.length,
    activeOrders:distinctOrderCount(active),
    overdueLines:overdue.length,
    overdueOrders:distinctOrderCount(overdue),
    atRisk24hLines:atRisk24h.length,
    atRisk24hOrders:distinctOrderCount(atRisk24h),
    watch48hLines:watch48h.length,
    watch48hOrders:distinctOrderCount(watch48h),
    urgentImmediateRiskLines:immediate.filter(x=>x.urgent).length,
    missingDueLines:missingDue.length,
    invalidDueLines:invalidDue.length,
    oldestOverdueHours:overdue.length?hours(oldestOverdueMs):0,
    nearestFutureDueHours:nearestFutureMs==null?null:hours(nearestFutureMs),
    laneBreakdown:{
      overdue:laneCounts(overdue),
      atRisk24h:laneCounts(atRisk24h),
      watch48h:laneCounts(watch48h)
    },
    departments:departmentProjection(tagged),
    hasImmediateRisk:overdue.length>0||atRisk24h.length>0,
    rawOrderIdsExposed:false,
    rawLineIdsExposed:false,
    customerPiiExposed:false
  };
}
