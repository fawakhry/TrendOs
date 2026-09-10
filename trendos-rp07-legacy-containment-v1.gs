/**
 * TrendOS RP-07 Legacy Containment V1 — GitHub-only candidate.
 *
 * Purpose:
 * - serialize the still-routed legacy Attendance / Clock-in / Cleaning mutations;
 * - preserve the public legacy action names and response shapes;
 * - stop new employee/day duplicate creation without touching historical rows;
 * - keep deployment/activation as a separate owner-approved runtime boundary.
 *
 * This file does not change feature flags, Registry data, business data, or routes by itself.
 */
const TRENDOS_RP07_LEGACY_CONTAINMENT_VERSION_V1='TRENDOS_RP07_LEGACY_CONTAINMENT_V1_20260910';
const TRENDOS_RP07_TZ_V1='Africa/Cairo';

function trendosRp07TextV1_(v){return String(v==null?'':v).trim();}

function trendosRp07WithScriptLockV1_(fn){
  if(typeof fn!=='function')throw new Error('RP-07 containment requires a function.');
  if(typeof LockService==='undefined'||!LockService.getScriptLock)throw new Error('ScriptLock is unavailable; mutation blocked.');
  const lock=LockService.getScriptLock();
  lock.waitLock(30000);
  try{return fn();}finally{lock.releaseLock();}
}

function trendosRp07EventV1_(e,patch){
  const p=Object.assign({},e&&e.parameter||{},patch||{});
  return{parameter:p};
}

function trendosRp07BusinessDateV1_(v){
  const raw=trendosRp07TextV1_(v);
  if(!raw)return Utilities.formatDate(new Date(),TRENDOS_RP07_TZ_V1,'yyyy-MM-dd');
  const ascii=raw
    .replace(/[٠-٩]/g,function(ch){return String(ch.charCodeAt(0)-1632);})
    .replace(/[۰-۹]/g,function(ch){return String(ch.charCodeAt(0)-1776);})
    .replace(/\//g,'-');
  const m=ascii.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if(!m)return'';
  const y=Number(m[1]),mo=Number(m[2]),d=Number(m[3]);
  if(y<2000||y>2100||mo<1||mo>12||d<1||d>31)return'';
  const dt=new Date(Date.UTC(y,mo-1,d,12,0,0));
  if(dt.getUTCFullYear()!==y||dt.getUTCMonth()!==mo-1||dt.getUTCDate()!==d)return'';
  return String(y).padStart(4,'0')+'-'+String(mo).padStart(2,'0')+'-'+String(d).padStart(2,'0');
}

function trendosRp07LegacyAttendanceV1_(e){
  if(typeof attendanceV1_!=='function')return{success:false,message:'Attendance backend غير منشور.'};
  const op=trendosRp07TextV1_(e&&e.parameter&&e.parameter.op||'state');
  if(op==='state'||op==='config')return attendanceV1_(e);
  return trendosRp07WithScriptLockV1_(function(){return attendanceV1_(e);});
}

function trendosRp07LegacyAttendanceClockinV1_(e){
  if(typeof attendanceClockinV1_!=='function')return{success:false,message:'Clock-in backend غير منشور.'};
  return trendosRp07WithScriptLockV1_(function(){return attendanceClockinV1_(e);});
}

function trendosRp07LegacyCleaningV1_(e){
  if(typeof cleaningV1_!=='function')return{success:false,message:'Cleaning backend غير منشور.'};
  const p=e&&e.parameter||{};
  const op=trendosRp07TextV1_(p.op||'');
  if(op!=='complete')return cleaningV1_(e);
  let payload={};
  try{payload=JSON.parse(trendosRp07TextV1_(p.payload)||'{}');}
  catch(err){return{success:false,message:'بيانات غير صحيحة.',rp07Containment:true};}
  const dateKey=trendosRp07BusinessDateV1_(payload.date);
  if(!dateKey)return{success:false,message:'تاريخ النظافة غير صالح؛ تم إيقاف الكتابة.',integrityError:true,rp07Containment:true};
  payload.date=dateKey;
  const wrapped=trendosRp07EventV1_(e,{payload:JSON.stringify(payload)});
  return trendosRp07WithScriptLockV1_(function(){return cleaningV1_(wrapped);});
}
