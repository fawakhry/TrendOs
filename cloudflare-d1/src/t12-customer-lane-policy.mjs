/*
 * T12 candidate customer + department lane admission.
 * A pending order in one lane NEVER blocks another lane.
 * READ-ONLY: no mutation, no external Google/Apps Script requests.
 */
import { mapMirrorRows } from './edge-orders-read-v1.mjs';
import { applyLegacyRuntimeOverlay, readLegacyRuntimeRows } from './t12-legacy-line-runtime.mjs';

export const T12_CUSTOMER_LANE_POLICY_VERSION='T12_CUSTOMER_LANE_POLICY_20261008_CANDIDATE';
const LEGACY_SHEET='بنود الأوردرات';
const CLOSED=new Set(['تم التسليم','ملغى','ملغي','مكرر']);
function text(v){return String(v==null?'':v).trim();}
function normalizeName(v){return text(v).toLowerCase().replace(/[إأآا]/g,'ا').replace(/ى/g,'ي').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[ةه]/g,'ه').replace(/\s+/g,' ').trim();}
function digits(v){return text(v).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/\D/g,'');}
function phone(v){let d=digits(v);if(d.startsWith('0020'))d=d.slice(2);if(d.startsWith('20')&&d.length===12)d='0'+d.slice(2);if(/^1[0125]\d{8}$/.test(d))d='0'+d;return d;}
export function sameCustomerIdentity(requested,row){
  const mode=text(requested&&requested.mode);
  const otherMode=text(row&&row.mode).toLowerCase();
  const external=otherMode==='external'||otherMode.includes('خارجي')||otherMode.includes('عابر');
  if(mode==='external'!==external)return false;
  const leftPhone=phone(requested&&requested.customerPhone),rightPhone=phone(row&&row.customerPhone);
  if(mode==='external'){
    const a=digits(requested&&requested.externalCustomerId),b=digits(row&&row.externalCustomerId);
    if(a&&b)return a===b;
    return leftPhone.length>=10&&rightPhone.length>=10&&leftPhone===rightPhone;
  }
  if(leftPhone&&rightPhone)return leftPhone===rightPhone;
  // Only fall back to a full exact customer name if one phone is unavailable.
  // Never override two different known phones just because names coincide.
  const a=normalizeName(requested&&requested.customerName),b=normalizeName(row&&row.customerName);
  return !!a&&a===b;
}
export function customerLaneIdentityMaterial(identity){
  const mode=text(identity&&identity.mode)==='external'?'external':'registered';
  const key=mode==='external'?digits(identity&&identity.externalCustomerId):phone(identity&&identity.customerPhone);
  if((mode==='external'&&key.length<3)||(mode==='registered'&&key.length<10))
    throw Error('customer-lane-strong-identity-required');
  return mode+':'+key;
}
export function isOpenDepartmentStatus(status){return !CLOSED.has(text(status));}
export function partitionCustomerLanes(identity,wanted,rows){
  const departments=[...new Set(wanted.map(text).filter(Boolean))];
  const blockers=new Map();
  for(const x of rows){
    if(!departments.includes(text(x.department))||!sameCustomerIdentity(identity,x))continue;
    if(!isOpenDepartmentStatus(x.status))continue;
    const lane=text(x.department);
    if(!blockers.has(lane))blockers.set(lane,{department:lane,orderId:text(x.orderId),lineId:text(x.lineId)});
  }
  const blocked=departments.filter(d=>blockers.has(d)).map(d=>blockers.get(d));
  return {allowedDepartments:departments.filter(d=>!blockers.has(d)),blockedDepartments:blocked};
}
export async function readCustomerLanePartition(db,identity,wanted){
  if(!db||typeof db.prepare!=='function')throw Error('customer-lane-db-required');
  const native=await db.prepare(`
    SELECT o.order_id AS orderId,o.customer_mode AS mode,o.customer_name AS customerName,
           o.customer_phone AS customerPhone,o.external_customer_id AS externalCustomerId,
           l.line_id AS lineId,l.department AS department,COALESCE(rt.status,l.status) AS status
      FROM t12_prod_orders o
      JOIN t12_prod_lines l ON l.order_id=o.order_id
      LEFT JOIN t12_prod_line_runtime rt ON rt.line_id=l.line_id
     ORDER BY CAST(o.order_id AS INTEGER),l.ordinal
  `).all();
  if(!native||!Array.isArray(native.results))throw Error('customer-lane-native-read-invalid');
  // Historical order lines must also be considered; the overlay contains the
  // latest Cloud-native runtime status for legacy lines.
  const catalog=await db.prepare(`
    SELECT headers_json AS headersJson,status FROM sheet_catalog WHERE sheet_name=? LIMIT 1
  `).bind(LEGACY_SHEET).first();
  if(!catalog||text(catalog.status)!=='ready')throw Error('customer-lane-legacy-catalog-not-ready');
  const raw=await db.prepare(`
    SELECT row_number AS rowNumber,values_json AS valuesJson,display_json AS displayJson
      FROM sheet_rows WHERE sheet_name=? ORDER BY row_number
  `).bind(LEGACY_SHEET).all();
  if(!raw||!Array.isArray(raw.results))throw Error('customer-lane-legacy-read-invalid');
  const mirrorRows=raw.results.map(r=>({
    rowNumber:Number(r.rowNumber),
    values:JSON.parse(r.valuesJson),display:JSON.parse(r.displayJson)
  }));
  // The legacy mapper expects (headers, rows, screen). Keep its arguments exact.
  const historical=mapMirrorRows(JSON.parse(catalog.headersJson),mirrorRows,'service');
  const latest=await readLegacyRuntimeRows({DB:db});
  const combined=(native.results||[]).concat(applyLegacyRuntimeOverlay(historical,latest).map(row=>({
    mode:row.customerMode|| (row.externalCustomerId?'external':'registered'),
    customerName:row.customer,customerPhone:row.customerPhone,
    externalCustomerId:row.externalCustomerId,
    orderId:row.orderId,lineId:row.lineId,department:row.department,status:row.status
  })));
  return partitionCustomerLanes(identity,wanted,combined);
}
