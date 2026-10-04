/* Autonomous Printshop - Operational Reality V1
 * Pure deterministic shadow foundation.
 * No runtime reads/writes and no production wiring.
 *
 * Product lineage:
 * - TrendOS getRows / Employee Manager Strips: observe real work.
 * - Operator Task V2: system-controlled ordinary dispatch.
 * - AI_Orders_View: AI-friendly projection, without keeping a Sheet as authority.
 */

export const REALITY_LANES = Object.freeze({
  ORDINARY: 'ORDINARY',
  FLY_PRINT: 'FLY_PRINT',
  CLOSED: 'CLOSED',
  EXCEPTION: 'EXCEPTION'
});

export const REALITY_REASONS = Object.freeze({
  ELIGIBLE: 'ELIGIBLE',
  CLOSED: 'CLOSED',
  FLY_PRINT_OUTSIDE_TASKS: 'FLY_PRINT_OUTSIDE_TASKS',
  ORDER_ID_REQUIRED: 'ORDER_ID_REQUIRED',
  LINE_ID_REQUIRED: 'LINE_ID_REQUIRED',
  DUE_DATE_REQUIRED: 'DUE_DATE_REQUIRED',
  DUE_DATE_INVALID: 'DUE_DATE_INVALID',
  DESIGN_NOT_READY: 'DESIGN_NOT_READY',
  MATERIAL_NOT_READY: 'MATERIAL_NOT_READY',
  MACHINE_NOT_READY: 'MACHINE_NOT_READY',
  CUSTOMER_BLOCKED: 'CUSTOMER_BLOCKED',
  READINESS_UNKNOWN: 'READINESS_UNKNOWN',
  DEPARTMENT_MISMATCH: 'DEPARTMENT_MISMATCH',
  OPERATOR_UNAVAILABLE: 'OPERATOR_UNAVAILABLE',
  ACTIVE_TASK_EXISTS: 'ACTIVE_TASK_EXISTS',
  NO_ELIGIBLE_TASK: 'NO_ELIGIBLE_TASK'
});

const CLOSED = new Set([
  'تم التسليم',
  'جاهز للاستلام',
  'ملغي',
  'ملغى',
  'مكرر',
  'مدمج',
  'مغلق',
  'ملغي/مغلق'
].map(norm));

function text(v){ return String(v == null ? '' : v).trim(); }
function norm(v){
  return text(v).toLowerCase()
    .replace(/[إأآا]/g,'ا')
    .replace(/[ى]/g,'ي')
    .replace(/[ة]/g,'ه')
    .replace(/\s+/g,' ')
    .trim();
}
function asciiDigits(v){
  return text(v)
    .replace(/[٠-٩]/g,ch=>String(ch.charCodeAt(0)-1632))
    .replace(/[۰-۹]/g,ch=>String(ch.charCodeAt(0)-1776));
}
function maybeBool(v){
  if (v === true || v === false) return v;
  const k=norm(v);
  if (!k) return null;
  if (['نعم','yes','true','1','ready','جاهز'].includes(k)) return true;
  if (['لا','no','false','0','not ready','غير جاهز'].includes(k)) return false;
  return null;
}
function first(row,names){
  for(const n of names){
    if(Object.prototype.hasOwnProperty.call(row,n) && text(row[n])) return row[n];
  }
  return '';
}
function parseDue(v){
  if (v instanceof Date && Number.isFinite(v.getTime())) return {valid:true,ts:v.getTime(),iso:v.toISOString()};
  const s=asciiDigits(v);
  if(!s) return {valid:false,missing:true,ts:null,iso:''};
  let m=s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})(?:[ T](\d{1,2})(?::(\d{1,2}))?)?$/);
  if(m){
    const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),Number(m[4]||23),Number(m[5]||59),59);
    if(d.getFullYear()===Number(m[1])&&d.getMonth()===Number(m[2])-1&&d.getDate()===Number(m[3])) return {valid:true,ts:d.getTime(),iso:d.toISOString()};
  }
  m=s.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})(?:[ T](\d{1,2})(?::(\d{1,2}))?)?$/);
  if(m){
    const d=new Date(Number(m[3]),Number(m[2])-1,Number(m[1]),Number(m[4]||23),Number(m[5]||59),59);
    if(d.getFullYear()===Number(m[3])&&d.getMonth()===Number(m[2])-1&&d.getDate()===Number(m[1])) return {valid:true,ts:d.getTime(),iso:d.toISOString()};
  }
  const n=Date.parse(s);
  if(Number.isFinite(n)) return {valid:true,ts:n,iso:new Date(n).toISOString()};
  return {valid:false,missing:false,ts:null,iso:''};
}
function isUrgent(row){
  const p=norm(first(row,['priority','الأولوية','Priority']));
  return p.includes('عاجل') || p==='vip';
}
function isFlyPrint(row){
  const v=first(row,['flyPrint','quickPrint','fastPrint','طباعة على الطاير','طباعة ع الطاير','Fly Print']);
  const b=maybeBool(v);
  return b===true || norm(v).includes('الطاير');
}
function orderKey(v){
  const s=asciiDigits(v);
  if(/^\d+$/.test(s)) return {numeric:true,n:Number(s),s};
  return {numeric:false,n:0,s:norm(s)};
}
function compareOrder(a,b){
  const ak=orderKey(a),bk=orderKey(b);
  if(ak.numeric&&bk.numeric&&ak.n!==bk.n) return ak.n-bk.n;
  if(ak.numeric!==bk.numeric) return ak.numeric?-1:1;
  return ak.s.localeCompare(bk.s,'ar');
}
function readinessValue(row,key){
  const aliases={
    design:['designReady','preflightReady','design_ready','preflight_ready'],
    material:['materialReady','material_ready','materialsReady'],
    machine:['machineReady','machine_ready'],
    customer:['customerBlocked','customer_blocked','waitingCustomer']
  };
  return maybeBool(first(row,aliases[key]||[]));
}

export function normalizeOperationalLineV1(row={}, index=0){
  const orderId=text(first(row,['orderId','order_id','رقم الأوردر','Order ID']));
  const lineId=text(first(row,['lineId','line_id','رقم البند','Line ID']));
  const status=text(first(row,['status','الحالة','Status'])) || 'طلب جديد';
  const dueRaw=first(row,['expectedDeliveryAt','expectedDelivery','expected_delivery','expectedDeliveryText','deliveryDate','تاريخ التسليم المتوقع','ميعاد التسليم']);
  const due=parseDue(dueRaw);
  return {
    sourceIndex:index,
    orderId,
    lineId,
    department:text(first(row,['department','القسم','Department'])),
    itemName:text(first(row,['itemName','item_name','اسم البند','اسم البند / نوع الشغل'])),
    customer:text(first(row,['customer','customerName','customer_name','اسم العميل','اسم الشات / المكتب'])),
    assignedTo:text(first(row,['assignedTo','assigned_to','مسؤول القسم','Assigned To'])),
    status,
    priority:text(first(row,['priority','الأولوية','Priority'])) || 'عادي',
    urgent:isUrgent(row),
    flyPrint:isFlyPrint(row),
    heatPress:maybeBool(first(row,['heatPress','press','مكبس','مكبس حراري'])),
    dueRaw:text(dueRaw),
    dueValid:due.valid,
    dueMissing:!!due.missing,
    dueTs:due.ts,
    dueIso:due.iso,
    designReady:readinessValue(row,'design'),
    materialReady:readinessValue(row,'material'),
    machineReady:readinessValue(row,'machine'),
    customerBlocked:readinessValue(row,'customer')===true,
    raw:row
  };
}

export function classifyOperationalLineV1(line, options={}){
  const dept=norm(options.department);
  if(!line.orderId) return {lane:REALITY_LANES.EXCEPTION,reason:REALITY_REASONS.ORDER_ID_REQUIRED};
  if(!line.lineId) return {lane:REALITY_LANES.EXCEPTION,reason:REALITY_REASONS.LINE_ID_REQUIRED};
  if(CLOSED.has(norm(line.status))) return {lane:REALITY_LANES.CLOSED,reason:REALITY_REASONS.CLOSED};
  if(line.flyPrint) return {lane:REALITY_LANES.FLY_PRINT,reason:REALITY_REASONS.FLY_PRINT_OUTSIDE_TASKS};
  if(dept && norm(line.department)!==dept) return {lane:REALITY_LANES.EXCEPTION,reason:REALITY_REASONS.DEPARTMENT_MISMATCH,filtered:true};
  if(line.dueMissing) return {lane:REALITY_LANES.EXCEPTION,reason:REALITY_REASONS.DUE_DATE_REQUIRED};
  if(!line.dueValid) return {lane:REALITY_LANES.EXCEPTION,reason:REALITY_REASONS.DUE_DATE_INVALID};
  if(line.customerBlocked) return {lane:REALITY_LANES.EXCEPTION,reason:REALITY_REASONS.CUSTOMER_BLOCKED};
  if(line.designReady===false) return {lane:REALITY_LANES.EXCEPTION,reason:REALITY_REASONS.DESIGN_NOT_READY};
  if(line.materialReady===false) return {lane:REALITY_LANES.EXCEPTION,reason:REALITY_REASONS.MATERIAL_NOT_READY};
  if(line.machineReady===false) return {lane:REALITY_LANES.EXCEPTION,reason:REALITY_REASONS.MACHINE_NOT_READY};

  const required=new Set(options.requiredReadiness||[]);
  for(const key of ['design','material','machine']){
    const prop=key+'Ready';
    if(required.has(key) && line[prop] == null){
      return {lane:REALITY_LANES.EXCEPTION,reason:REALITY_REASONS.READINESS_UNKNOWN,readiness:key};
    }
  }
  return {lane:REALITY_LANES.ORDINARY,reason:REALITY_REASONS.ELIGIBLE};
}

export function buildOperationalRealityV1(rows=[], options={}){
  const ordinary=[],exceptions=[],closed=[],flyPrint=[];
  (Array.isArray(rows)?rows:[]).forEach((row,index)=>{
    const line=normalizeOperationalLineV1(row,index);
    const cls=classifyOperationalLineV1(line,options);
    const out={...line,...cls};
    if(cls.filtered) return;
    if(cls.lane===REALITY_LANES.ORDINARY) ordinary.push(out);
    else if(cls.lane===REALITY_LANES.EXCEPTION) exceptions.push(out);
    else if(cls.lane===REALITY_LANES.CLOSED) closed.push(out);
    else if(cls.lane===REALITY_LANES.FLY_PRINT) flyPrint.push(out);
  });
  ordinary.sort((a,b)=>{
    if(a.urgent!==b.urgent) return a.urgent?-1:1;
    if(a.dueTs!==b.dueTs) return a.dueTs-b.dueTs;
    const oc=compareOrder(a.orderId,b.orderId);
    if(oc) return oc;
    return compareOrder(a.lineId,b.lineId);
  });
  return {
    ordinary,
    exceptions,
    closed,
    flyPrint,
    counts:{
      ordinary:ordinary.length,
      exceptions:exceptions.length,
      closed:closed.length,
      flyPrint:flyPrint.length
    }
  };
}

export function recommendNextTaskV1(rows=[], options={}){
  if(options.operatorAvailable===false){
    return {recommended:null,reason:REALITY_REASONS.OPERATOR_UNAVAILABLE,reality:buildOperationalRealityV1(rows,options)};
  }
  if(options.activeTask){
    return {recommended:null,reason:REALITY_REASONS.ACTIVE_TASK_EXISTS,activeTask:options.activeTask,reality:buildOperationalRealityV1(rows,options)};
  }
  const reality=buildOperationalRealityV1(rows,options);
  const recommended=reality.ordinary[0]||null;
  if(!recommended) return {recommended:null,reason:REALITY_REASONS.NO_ELIGIBLE_TASK,reality};
  return {
    recommended,
    reason:REALITY_REASONS.ELIGIBLE,
    evidence:{
      urgent:recommended.urgent,
      dueIso:recommended.dueIso,
      orderId:recommended.orderId,
      lineId:recommended.lineId,
      department:recommended.department,
      readiness:{
        design:recommended.designReady,
        material:recommended.materialReady,
        machine:recommended.machineReady
      }
    },
    reality
  };
}
