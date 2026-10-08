import {readFileSync} from 'node:fs';
import {readCustomerLanePartition,isOpenDepartmentStatus} from '../cloudflare-d1/src/t12-customer-lane-policy.mjs';
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
console.log(JSON.stringify({postdeployOpenLinesChecked:fresh.length,postdeployOpenLinesWithAnotherOpenOrder:conflicts,includesLegacyOverlay:true}));
