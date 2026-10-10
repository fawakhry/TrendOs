import {readFileSync} from 'node:fs';
import {readCustomerLanePartition,isOpenDepartmentStatus} from '../cloudflare-d1/src/t12-customer-lane-policy.mjs';
import {mapMirrorRows} from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import {applyLegacyRuntimeOverlay} from '../cloudflare-d1/src/t12-legacy-line-runtime.mjs';
const input=JSON.parse(readFileSync(0,'utf8'));
const fresh=input.native.filter(r=>Number(r.orderId)>=4818&&isOpenDepartmentStatus(r.status));
let conflicts=0;
for(const line of fresh){
 const db={prepare(sql){return {bind(){return this;},async first(){return input.catalog;},async all(){
  if(sql.includes('FROM t12_prod_orders'))return {results:input.native.filter(r=>r.orderId!==line.orderId)};
  if(sql.includes('FROM sheet_rows'))return {results:input.rows};
  if(sql.includes('FROM t12_legacy_line_runtime'))return {results:input.runtime};
  throw Error('UNEXPECTED_READ');
 }}}};
 const part=await readCustomerLanePartition(db,line,[line.department]);
 if(part.blockedDepartments.length)conflicts++;
}
const mirror=applyLegacyRuntimeOverlay(mapMirrorRows(JSON.parse(input.catalog.headersJson),input.rows.map(r=>({rowNumber:r.rowNumber,values:JSON.parse(r.valuesJson),display:JSON.parse(r.displayJson)})),'service'),input.runtime);
const selected=new Map();
const key=r=>String(r.orderId||'')+'\u0000'+String(r.lineId||'');
for(const r of [...input.native,...mirror])if(r.lineId&&!selected.has(key(r)))selected.set(key(r),r);
const staleOpenByDepartment={};let suppressedOpenRows=0;
for(const r of mirror){const chosen=selected.get(key(r));if(chosen&&isOpenDepartmentStatus(r.status)&&!isOpenDepartmentStatus(chosen.status)){
 suppressedOpenRows++;staleOpenByDepartment[r.department]=(staleOpenByDepartment[r.department]||0)+1;
}}
console.log(JSON.stringify({postdeployOpenLinesChecked:fresh.length,postdeployOpenLinesWithAnotherOpenOrder:conflicts,includesLegacyOverlay:true,legacyAdmissionDiscrepancy:{suppressedOpenRows,staleOpenByDepartment}}));
