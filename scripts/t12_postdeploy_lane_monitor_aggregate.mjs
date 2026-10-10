import {readFileSync} from 'node:fs';
import {readCustomerLanePartition,isOpenDepartmentStatus} from '../cloudflare-d1/src/t12-customer-lane-policy.mjs';
import {mapMirrorRows} from '../cloudflare-d1/src/edge-orders-read-v1.mjs';
import {applyLegacyRuntimeOverlay} from '../cloudflare-d1/src/t12-legacy-line-runtime.mjs';
import {createHash} from 'node:crypto';
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
const staleOpenByDepartment={};let suppressedOpenRows=0,selectedNativeClosed=0;
for(const r of mirror){const chosen=selected.get(key(r));if(chosen&&isOpenDepartmentStatus(r.status)&&!isOpenDepartmentStatus(chosen.status)){
 suppressedOpenRows++;if(input.native.includes(chosen))selectedNativeClosed++;staleOpenByDepartment[r.department]=(staleOpenByDepartment[r.department]||0)+1;
}}
let targetedCustomer=null;
if(process.env.DIAGNOSTIC_SALT&&process.env.DIAGNOSTIC_NAME_DIGEST&&process.env.DIAGNOSTIC_PHONE_DIGEST){
 const normalizeName=v=>String(v||'').trim().toLowerCase().replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[ةه]/g,'ه').replace(/\s+/g,' ').trim();
 const normalizePhone=v=>{let d=String(v||'').replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/\D/g,'');if(d.startsWith('0020'))d=d.slice(2);if(d.startsWith('20')&&d.length===12)d='0'+d.slice(2);if(/^1[0125]\d{8}$/.test(d))d='0'+d;return d;};
 const digest=v=>createHash('sha256').update(process.env.DIAGNOSTIC_SALT+'\u0000'+v).digest('hex');
 const matching=r=>{const mode=String(r.mode||r.customerMode||'').toLowerCase();if(mode==='external'||mode.includes('خارجي')||mode.includes('عابر')||r.externalCustomerId)return false;const p=normalizePhone(r.customerPhone);return p?digest(p)===process.env.DIAGNOSTIC_PHONE_DIGEST:digest(normalizeName(r.customerName||r.customer))===process.env.DIAGNOSTIC_NAME_DIGEST;};
 const raw=[...input.native,...mirror].filter(matching).filter(r=>r.department==='ليزر');
 const effective=[...selected.values()].filter(matching).filter(r=>r.department==='ليزر');
 const counts=rows=>rows.reduce((out,r)=>{out[r.status]=(out[r.status]||0)+1;return out;},{});
 targetedCustomer={rawLaserRows:raw.length,rawOpenLaserRows:raw.filter(r=>isOpenDepartmentStatus(r.status)).length,effectiveLaserRows:effective.length,effectiveOpenLaserRows:effective.filter(r=>isOpenDepartmentStatus(r.status)).length,rawStatuses:counts(raw),effectiveStatuses:counts(effective),openReferences:effective.filter(r=>isOpenDepartmentStatus(r.status)).map(r=>({orderId:String(r.orderId),lineId:String(r.lineId),status:r.status,department:r.department}))};
}
console.log(JSON.stringify({postdeployOpenLinesChecked:fresh.length,postdeployOpenLinesWithAnotherOpenOrder:conflicts,includesLegacyOverlay:true,legacyAdmissionDiscrepancy:{suppressedOpenRows,selectedNativeClosed,staleOpenByDepartment},targetedCustomer}));
