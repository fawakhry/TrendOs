// READ-ONLY, OFFLINE source-compatibility preflight for the existing TrendOS
// Employee Core D1 getRows / getRowsPageV1931 response contract.
// It cannot authenticate, fetch, create orders, change a line or clear debt.
// Do not turn a syntactically valid snapshot into permission to deploy.
export const CORE_READ_VERSION_V1='ENTRY650_D1_EMPLOYEE_CORE_PAGE_ALIAS_V1';
export const CORE_READ_SOURCE_V1='employee-core-d1';
export const CORE_STATUSES_V1=Object.freeze([
  'طلب جديد','بدأ التنفيذ','تحت التنفيذ','جاهز للاستلام',
  'تم التسليم','متوقف','مكرر','ملغى'
]);
const statuses=new Set(CORE_STATUSES_V1);
const kinds=new Set(['core-import','t12-prod']);
const DEFAULT_BLOCKERS=Object.freeze([
  'NO_AUTHENTICATED_CORE_SESSION',
  'NO_LIVE_D1_PARITY',
  'NO_CANONICAL_CUSTOMER_BINDING',
  'NO_FINANCE_DELIVERY_CLEARANCE',
  'NO_CROSS_SYSTEM_SINGLE_WRITER',
  'NO_APPROVED_DEPLOYMENT'
]);
const safeBase=()=>({
  success:false,mode:'SYNTHETIC_CORE_CONTRACT_ONLY',
  sourceContract:CORE_READ_SOURCE_V1,
  sourceVersion:CORE_READ_VERSION_V1,
  liveBackendConnected:false,readOnly:true,writeEnabled:false,
  deliveryRelease:'NO_GO',financeRelease:'NO_GO',zeroGoogleComplete:false,
  productionVerified:false,sourcePaging:'UNPAGED_NOT_VERIFIED',
  blockers:[...DEFAULT_BLOCKERS]
});
const fail=code=>({...safeBase(),code,compatible:false,orderCount:0,lineCount:0});

// This accepts a local, already fabricated Core-shaped response only.
// Output is AGGREGATED metadata with no customer/phone/note/order/line IDs.
// There is NO fallback to Google and no transport layer.
export function inspectCoreD1ReadContractV1(result){
  if(!result || typeof result!=='object' || Array.isArray(result) ||
     result.success!==true ||
     result.dataSource!==CORE_READ_SOURCE_V1 ||
     result.version!==CORE_READ_VERSION_V1 ||
     result.serverPaged!==false || !Array.isArray(result.rows))
    return fail('CORE_RESPONSE_CONTRACT_MISMATCH');
  // A missing/oversized response is not evidence of complete source coverage.
  if(result.rows.length<1 || result.rows.length>500)
    return fail('CORE_ROWS_UNVERIFIED');
  const lines=new Set(),orders=new Set();
  const byStatus=Object.fromEntries(CORE_STATUSES_V1.map(s=>[s,0]));
  const byDepartment={'التصميم':0,'الطباعة':0,'الليزر':0,'other':0};
  let holdCount=0;
  for(const row of result.rows){
    if(!row || typeof row!=='object' || Array.isArray(row) ||
       typeof row.lineId!=='string' || !row.lineId.trim() ||
       typeof row.orderId!=='string' || !row.orderId.trim() ||
       typeof row.department!=='string' || !row.department.trim() ||
       !statuses.has(row.status) || !kinds.has(row.sourceKind) ||
       row.cloudNative!==true || row.writeAuthority!=='cloudflare-d1' ||
       typeof row.deliveryDebtRestricted!=='boolean')
      return fail('CORE_ROW_PROVENANCE_OR_STATE_UNVERIFIED');
    const lid=row.lineId.trim();
    if(lines.has(lid))return fail('CORE_DUPLICATE_LINE_ID');
    lines.add(lid);orders.add(row.orderId.trim());
    byStatus[row.status]++;
    const d=row.department.includes('ليزر')?'الليزر':
      row.department.includes('طباعة')?'الطباعة':
      row.department.includes('تصميم')?'التصميم':'other';
    byDepartment[d]++;
    if(row.deliveryDebtRestricted)holdCount++;
  }
  return {
    ...safeBase(),success:true,compatible:true,
    orderCount:orders.size,lineCount:lines.size,
    byStatus,byDepartment,syntheticDebtRestrictedLines:holdCount,
    // A local order in V1 is NOT equivalent to a native Core line.
    pilotStatusAliasesUnsupported:['جاري التنفيذ','جاهز للتسليم'],
    nativeReadyStatus:'جاهز للاستلام',
    statusFlowCompatible:false,orderToLineWriteMapping:'NOT_IMPLEMENTED',
    // Even a well-formed source-like fixture does NOT clear delivery/finance.
    deliveryRelease:'NO_GO',financeRelease:'NO_GO'
  };
}

export function syntheticCoreD1ReadFixtureV1(){
  return {
    success:true,dataSource:CORE_READ_SOURCE_V1,
    version:CORE_READ_VERSION_V1,serverPaged:false,
    rows:[
      {lineId:'DEMO-CORE-L001',orderId:'DEMO-CORE-O001',department:'التصميم',
        status:'طلب جديد',sourceKind:'core-import',cloudNative:true,
        writeAuthority:'cloudflare-d1',deliveryDebtRestricted:false},
      {lineId:'DEMO-CORE-L002',orderId:'DEMO-CORE-O001',department:'الطباعة',
        status:'تحت التنفيذ',sourceKind:'core-import',cloudNative:true,
        writeAuthority:'cloudflare-d1',deliveryDebtRestricted:false},
      {lineId:'DEMO-CORE-L003',orderId:'DEMO-CORE-O002',department:'الليزر',
        status:'جاهز للاستلام',sourceKind:'t12-prod',cloudNative:true,
        writeAuthority:'cloudflare-d1',deliveryDebtRestricted:true}
    ]
  };
}
