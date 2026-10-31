// ACC277: Original EasyStore finance D1 nonzero-opening intake preflight.
// PURE CONTRACT ONLY. No transport, SQL, session bypass, receipts or posting.
// Historical amounts must never be inferred from empty isolated Stage tables.
const MAX_ROWS=500;
const MAX_CENTS=Number.MAX_SAFE_INTEGER;
const validRef=s=>typeof s==='string'&&/^[A-Za-z0-9_.:-]{4,180}$/.test(s);
const invalid=(code,detail)=>({ok:false,code,detail,posted:false,postingAllowed:false,productionApproved:false});
const isCents=v=>Number.isSafeInteger(v)&&v>=0&&v<=MAX_CENTS;
const isoDate=v=>{
  if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
  const date=new Date(v+'T00:00:00.000Z');
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===v;
};
function sumCents(list){
  let result=0;
  for(const n of list){
    if(!isCents(n)||!Number.isSafeInteger(result+n))return null;
    result+=n;
  }
  return result;
}
export function preflightEasyStoreOpeningACC277(input){
  const b=input&&typeof input==='object'&&!Array.isArray(input)?input:null;
  if(!b||b.currency!=='EGP'||!isoDate(b.cutoverDate))
    return invalid('CUTOVER_DATE_OR_CURRENCY_INVALID');
  const suppliers=b.suppliers,installments=b.installments;
  if(!Array.isArray(suppliers)||!Array.isArray(installments)||
    suppliers.length>MAX_ROWS||installments.length>MAX_ROWS)
    return invalid('SOURCE_ARRAYS_REQUIRED_OR_TOO_LARGE');
  if(!suppliers.length&&!installments.length)return invalid('NO_LIABILITIES_PRESENT');
  const supplierMap=new Map(),contractSet=new Set(),included=new Map();
  for(const row of suppliers){
    if(!row||!validRef(row.supplierId)||!row.supplierId.startsWith('SUP-')||
      !isCents(row.balanceCents)||!validRef(row.evidenceRef))
      return invalid('SUPPLIER_OPENING_INCOMPLETE');
    if(supplierMap.has(row.supplierId))return invalid('DUPLICATE_SUPPLIER_ID');
    supplierMap.set(row.supplierId,row.balanceCents);
  }
  const standalone=[];
  for(const row of installments){
    if(!row||!validRef(row.contractId)||!validRef(row.creditorRef)||
      !validRef(row.evidenceRef)||!isCents(row.contractTotalCents)||
      !isCents(row.paidToCutoverCents)||!isCents(row.remainingCents)||
      !isCents(row.installmentCents)||!isoDate(row.nextDueDate)||
      !['weekly','monthly','quarterly','yearly'].includes(row.frequency)||
      !['INCLUDED_IN_SUPPLIER_OPENING','SEPARATE_CREDITOR'].includes(row.liabilityTreatment))
      return invalid('INSTALLMENT_SCHEDULE_INCOMPLETE');
    if(!row.contractTotalCents||!row.remainingCents||!row.installmentCents||
      row.installmentCents>row.remainingCents||
      row.contractTotalCents-row.paidToCutoverCents!==row.remainingCents)
      return invalid('INSTALLMENT_ARITHMETIC_MISMATCH');
    if(contractSet.has(row.contractId))return invalid('DUPLICATE_INSTALLMENT_CONTRACT');
    contractSet.add(row.contractId);
    if(row.liabilityTreatment==='INCLUDED_IN_SUPPLIER_OPENING'){
      if(!validRef(row.supplierId)||!supplierMap.has(row.supplierId)||
        row.creditorRef!==row.supplierId)return invalid('INSTALLMENT_SUPPLIER_LINK_UNPROVEN');
      const v=sumCents([included.get(row.supplierId)||0,row.remainingCents]);
      if(v===null)return invalid('LIABILITY_TOTAL_OVERFLOW');
      included.set(row.supplierId,v);
    }else{
      if(row.supplierId!==undefined&&row.supplierId!==null&&row.supplierId!=='')
        return invalid('SEPARATE_CREDITOR_MUST_NOT_DUPLICATE_SUPPLIER');
      if(supplierMap.has(row.creditorRef))return invalid('CREDITOR_ALSO_REGISTERED_AS_SUPPLIER');
      standalone.push(row.remainingCents);
    }
  }
  for(const [supplierId,covered] of included){
    if(covered>supplierMap.get(supplierId))
      return invalid('INSTALLMENTS_EXCEED_SUPPLIER_OPENING');
  }
  const supplierTotalCents=sumCents([...supplierMap.values()]);
  const separateInstallmentTotalCents=sumCents(standalone);
  const totalLiabilityCents=sumCents([supplierTotalCents,separateInstallmentTotalCents]);
  if([supplierTotalCents,separateInstallmentTotalCents,totalLiabilityCents].some(v=>v===null))
    return invalid('LIABILITY_TOTAL_OVERFLOW');
  // No data persistence occurs here. Signed true-opening, verified roles,
  // second-host restore, private Stage round-trip and release remain mandatory.
  return {
    ok:true,code:'OPENING_PREVIEW_ONLY_NOT_POSTED',cutoverDate:b.cutoverDate,
    currency:'EGP',supplierCount:suppliers.length,installmentCount:installments.length,
    supplierTotalCents,separateInstallmentTotalCents,totalLiabilityCents,
    includedInSupplierCents:sumCents([...included.values()]),
    duplicatePostingPrevented:true,posted:false,postingAllowed:false,
    productionApproved:false,signedOpeningVerified:false,
    persistence:'NONE_SOURCE_ONLY'
  };
}
