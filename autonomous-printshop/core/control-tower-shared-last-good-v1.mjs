import {createControlTowerLastGoodGateV1,CONTROL_TOWER_LAST_GOOD_MAX_AGE_MS} from './control-tower-last-good-v1.mjs';
export const CONTROL_TOWER_SHARED_LAST_GOOD_VERSION='CONTROL_TOWER_SHARED_LAST_GOOD_V1_20261008';
const KEY='control-tower:diagnostic:v1';
const FIELDS=['schema','asOf','observedAt','expiresAt','rowCount','waiting','inProgress','overdueOrders','atRisk24hOrders'];
const COUNTS=['rowCount','waiting','inProgress','overdueOrders','atRisk24hOrders'];
function unavailable(code){return {success:false,status:'UNAVAILABLE_FAIL_CLOSED',code,
 financialReadinessCurrent:false,ownerDecisionsCurrent:false,operatorTaskActivationAllowed:false,
 financialExecutionAllowed:false,accountingWrite:false,d1Mutation:false};}
function source(record){return {
 success:true,mode:'CONTROL_TOWER_SHADOW',generatedAt:record.asOf,
 source:{authority:'trendos-main-d1',rowCount:record.rowCount},
 operations:{counts:{ordinary:record.waiting,inProgress:record.inProgress},deadlineRisk:{overdueOrders:record.overdueOrders,atRisk24hOrders:record.atRisk24hOrders}},
 piiExposed:false,employeeIdentityExposed:false,rawOrderIdsExposed:false,rawLineIdsExposed:false,
 writesAccepted:false,d1Mutation:false,employeeAssignment:false};}
function valid(record){
 if(!record||typeof record!=='object'||Array.isArray(record)||Object.keys(record).length!==FIELDS.length||!FIELDS.every(k=>Object.hasOwn(record,k)))return false;
 const produced=Date.parse(record.asOf);
 return record.schema===CONTROL_TOWER_SHARED_LAST_GOOD_VERSION&&Number.isFinite(produced)&&
  Number.isFinite(record.observedAt)&&record.observedAt>=produced&&
  record.expiresAt===produced+CONTROL_TOWER_LAST_GOOD_MAX_AGE_MS&&record.observedAt<=record.expiresAt&&
  COUNTS.every(k=>Number.isSafeInteger(record[k])&&record[k]>=0);
}

// SOURCE_ONLY: no runtime imports, binding, migration or activation.
// The caller must inject a dedicated KV-like namespace after storage qualification.
export function createSharedControlTowerLastGoodV1(store){
 return Object.freeze({
  async observe(snapshot,at=Date.now()){
   const gate=createControlTowerLastGoodGateV1();
   if(!gate.observe(snapshot,at).success)return unavailable('LIVE_SOURCE_NOT_QUALIFIED');
   const diagnostic=gate.degraded(at);
   const record={schema:CONTROL_TOWER_SHARED_LAST_GOOD_VERSION,asOf:diagnostic.asOf,
    observedAt:at,expiresAt:Date.parse(diagnostic.asOf)+CONTROL_TOWER_LAST_GOOD_MAX_AGE_MS,
    ...diagnostic.operationalDiagnostic};
   if(!valid(record))return unavailable('DIAGNOSTIC_RECORD_INVALID');
   // KV requires expiration at least 60 seconds away. Skip late snapshots;
   // never extend their lifetime just to meet storage's minimum TTL.
   const expiration=Math.floor(record.expiresAt/1000);
   if(expiration-Math.ceil(at/1000)<60)return unavailable('SOURCE_TOO_OLD_FOR_SHARED_STORAGE');
   if(!store||typeof store.put!=='function')return unavailable('SHARED_STORAGE_UNAVAILABLE');
   try{await store.put(KEY,JSON.stringify(record),{expiration});}
   catch{return unavailable('SHARED_STORAGE_WRITE_FAILED');}
   return {success:true,status:'SHARED_DIAGNOSTIC_OBSERVED',expiresAt:record.expiresAt,
    businessWrite:false,d1Mutation:false};
  },
  async degraded(at=Date.now()){
   if(!store||typeof store.get!=='function')return unavailable('SHARED_STORAGE_UNAVAILABLE');
   let record;
   try{const value=await store.get(KEY);record=typeof value==='string'?JSON.parse(value):value;}
   catch{return unavailable('SHARED_STORAGE_READ_FAILED');}
   if(!valid(record))return unavailable('SHARED_DIAGNOSTIC_RECORD_INVALID');
   const gate=createControlTowerLastGoodGateV1();
   if(!gate.observe(source(record),record.observedAt).success)return unavailable('SHARED_DIAGNOSTIC_RECORD_INVALID');
   const result=gate.degraded(at);
   return result.success?{...result,cacheScope:'KV_SHARED_BEST_EFFORT',sharedCacheVersion:CONTROL_TOWER_SHARED_LAST_GOOD_VERSION}:result;
  }
 });
}
